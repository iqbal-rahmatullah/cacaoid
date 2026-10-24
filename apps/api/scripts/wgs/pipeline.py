"""Fetch public genomes one at a time, k-mer scan them, delete the raw file. Hits land in WORK/hits/<id>.npz.

  python pipeline.py assembly GCA_036851095.1 [...]   NCBI FTP FASTA (~110 MB each)
  python pipeline.py sra SRR7774164 [...]             SRA object from AWS S3 (~7-9 MB/s with 8 ranges) + fastq-dump

(ENA FASTQ gave only ~1.3 MB/s with 8 ranges here, so there is no ENA route; any FASTQ/FASTA stream can still be
scanned directly: `gzip -dc x.fastq.gz | python kmerfp.py scan - WORK/hits/<id>.npz`.)

WORK defaults to ./wgs_work; set SRATOOLKIT to the sratoolkit bin/ dir for `sra`; CONNS = connections per download.
"""
import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from fetch import CTX, fetch  # noqa: E402
from kmerfp import scan  # noqa: E402

WORK = Path(os.environ.get("WORK", "wgs_work"))
SRATOOLKIT = Path(os.environ.get("SRATOOLKIT", ""))
CONNS = int(os.environ.get("CONNS", 8))  # keep the total across parallel queues <= 8


def log(rec: dict):
    rec["at"] = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(WORK / "runs.jsonl", "a") as f:
        f.write(json.dumps(rec) + "\n")
    print(rec, flush=True)


def get_json(url: str):
    with urllib.request.urlopen(url, timeout=60, context=CTX) as r:
        return json.load(r)


def assembly(acc: str):
    rep = get_json(f"https://api.ncbi.nlm.nih.gov/datasets/v2/genome/accession/{acc}/dataset_report")["reports"][0]
    name = rep["assembly_info"]["assembly_name"].replace(" ", "_")
    d = acc.split("_")[1].split(".")[0]
    url = (f"https://ftp.ncbi.nlm.nih.gov/genomes/all/{acc[:3]}/{d[:3]}/{d[3:6]}/{d[6:9]}/"
           f"{acc}_{name}/{acc}_{name}_genomic.fna.gz")
    tmp = WORK / "dl" / f"{acc}.fna.gz"
    dl = fetch(url, str(tmp), CONNS)
    t0 = time.time()
    meta = scan(str(tmp), str(WORK / "hits" / f"{acc}.npz"), assembly=True)
    tmp.unlink()
    log({"id": acc, "kind": "assembly", "url": url, "download": dl, "scan_s": round(time.time() - t0, 1),
         "n_seqs": meta["n_seqs"], "n_bases": meta["n_bases"],
         "isolate": rep.get("organism", {}).get("infraspecific_names"), "bioproject": rep["assembly_info"].get("bioproject_accession")})


def sra(run: str):
    tmp = WORK / "dl" / f"{run}.sra"
    if tmp.exists():  # finished download left by an interrupted run
        dl = {"bytes": tmp.stat().st_size, "reused_local_file": True}
    else:
        dl = fetch(f"https://sra-pub-run-odp.s3.amazonaws.com/sra/{run}/{run}", str(tmp), CONNS)
    t0 = time.time()
    dump = subprocess.Popen([str(SRATOOLKIT / "fastq-dump"), "--stdout", "--fasta", "0", str(tmp)],
                            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, cwd=WORK / "dl")
    meta = scan_stream(dump, run)
    tmp.unlink()
    log({"id": run, "kind": "sra", "download": dl, "scan_s": round(time.time() - t0, 1),
         "n_seqs": meta["n_seqs"], "n_bases": meta["n_bases"]})


def scan_stream(proc: subprocess.Popen, out_id: str) -> dict:
    meta = scan(proc.stdout, str(WORK / "hits" / f"{out_id}.npz"))
    if proc.wait():
        raise SystemExit(f"{proc.args[0]} exited with {proc.returncode}")
    return meta


if __name__ == "__main__":
    cmd, ids = sys.argv[1], sys.argv[2:]
    for sub in ("dl", "hits"):
        (WORK / sub).mkdir(parents=True, exist_ok=True)
    for i in ids:
        {"assembly": assembly, "sra": sra}[cmd](i)
