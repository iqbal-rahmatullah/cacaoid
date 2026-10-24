"""Genotype the Jacquotte et al. 2026 genomic-prediction markers from public WGS reads, reusing kmerfp's scanner.

The Dryad release gives marker positions (chrN:pos) and 0/1/2 dosages but no alleles. The positions are on the
Criollo genome V2 (GCF_000208745.1): every chromosome's last marker sits within 0.1% of its length, and chr3/chr9
markers run past the Matina v1.1 scaffolds. Reference base = Criollo V2. For each SNP we count reads carrying each of
the 4 bases (31-mers with the SNP at index 3..27, both strands, a read counted once per SNP), take the non-reference
base with the most reads across all scanned samples as ALT, and call dosage = ALT copies with kmerfp's read rules.
Whether Jacquotte's 0/1/2 counts ALT or REF is checked against the release's parents that have public WGS.

  python jacqfp.py flanks GENOME.fna.gz            -> data/jacquotte2026/flanks.tsv (the 24,218 pruned markers)
  python jacqfp.py scan GENOME.fna.gz HITS.npz && python jacqfp.py mask HITS.npz
                                                    -> data/jacquotte2026/unique_in_criollo_v2.json (17,275 kept)
  python jacqfp.py scan IN OUT.npz                  IN = FASTA/FASTQ (.gz ok) or '-'; same hit format as kmerfp
  python jacqfp.py call OUT.npz [...]               -> data/jacquotte2026/wgs_calls.npz (one row per sample)
"""
import json
import sys
from functools import cache
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
import kmerfp  # noqa: E402
from kmerfp import K, NOFF, OFFSETS, encode, genotype, rc, records  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
NPZ = ROOT / "data/benchmark/jacquotte2026_pruned.npz"
DIR = ROOT / "data/jacquotte2026"
FLANKS = DIR / "flanks.tsv"
CALLS = DIR / "wgs_calls.npz"
UNIQUE = DIR / "unique_in_criollo_v2.json"
CHROM = {f"NC_0308{50 + i}.1": f"chr{i + 1}" for i in range(10)}  # Criollo V2 RefSeq -> Jacquotte chromosome names
BASES = "ACGT"


def flanks(genome: str):
    want: dict[str, list] = {}
    for m in np.load(NPZ)["snps"]:
        c, p, _ = str(m).split(":")
        want.setdefault(c, []).append((int(p), str(m)))
    rows = []
    for name, seq in records(genome):
        c = CHROM.get(name)
        if not c:
            continue
        s = seq.decode().upper()
        for p, m in want.get(c, []):
            rows.append((m, s[p - K: p - 1], s[p - 1], s[p: p + K - 1]))  # 1-based position
    DIR.mkdir(parents=True, exist_ok=True)
    order = {str(m): i for i, m in enumerate(np.load(NPZ)["snps"])}
    rows.sort(key=lambda r: order[r[0]])
    FLANKS.write_text("marker\tleft\tref\tright\n" + "".join("\t".join(r) + "\n" for r in rows))
    print(f"{len(rows)} flanks ->", FLANKS)


@cache
def markers() -> list[tuple[str, str, str, str]]:
    return [tuple(line.rstrip("\n").split("\t")) for line in list(open(FLANKS))[1:]]


@cache
def unique() -> set[str]:
    """Markers whose reference allele occurs once and no other allele occurs in Criollo V2 (paralogs would let reads
    from another copy pose as the ALT allele). Empty set = not built yet (first scan of the assembly builds it)."""
    return set(json.loads(UNIQUE.read_text())["markers"]) if UNIQUE.exists() else set()


@cache
def table():
    """Like kmerfp.kmer_table, with 4 alleles per SNP: id = ((snp*4 + base)*NOFF + offset)*2 + strand."""
    owner: dict[int, int] = {}
    keep = unique()
    for i, (m, left, ref, right) in enumerate(markers()):
        if ref not in BASES or (keep and m not in keep):
            continue
        for b, base in enumerate(BASES):
            for oi, j in enumerate(OFFSETS):
                s = left[len(left) - j:] + base + right[:K - 1 - j]
                if len(s) != K or set(s) - set(BASES):
                    continue
                for st, km in enumerate((s, rc(s))):
                    v, kid = encode(km), ((i * 4 + b) * NOFF + oi) * 2 + st
                    if v in owner and owner[v] >= 0 and owner[v] // (2 * NOFF) // 4 != i:
                        owner[v] = -1  # shared by two SNPs -> useless
                    owner.setdefault(v, kid)
    items = sorted((v, k) for v, k in owner.items() if k >= 0)
    vals = np.array([v for v, _ in items], np.uint64)
    ids = np.array([k for _, k in items], np.int32)
    pre = np.zeros(1 << 24, bool)
    pre[(vals >> np.uint64(2 * K - 24)).astype(np.int64)] = True
    return vals, ids, pre


kmerfp.kmer_table = table  # kmerfp.scan_codes looks the table up at call time


def counts(npz) -> np.ndarray:
    """(n_markers, 4): distinct reads carrying A/C/G/T at each SNP (npz: path or list of parts)."""
    n = 4 * len(markers())
    total = np.zeros(n, np.int64)
    for f in [npz] if isinstance(npz, (str, Path)) else npz:
        d = np.load(f)
        pos, kid = d["pos"], d["kid"].astype(np.int64)
        j = OFFSETS[(kid >> 1) % NOFF]
        snppos = pos + np.where(kid & 1, K - 1 - j, j)
        sb = kid // (2 * NOFF)
        total += np.bincount(np.unique(snppos * n + sb) % n, minlength=n)
    return total.reshape(-1, 4)


def call(samples: dict[str, list[str]]):
    """samples: name -> hit files. ALT = most-read non-reference base over all samples; dosage = ALT copies or -1."""
    C = {s: counts(f) for s, f in samples.items()}
    ref = np.array([BASES.find(m[2]) for m in markers()])
    tot = sum(C.values()).copy()
    tot[np.arange(len(ref)), np.clip(ref, 0, 3)] = -1
    alt = tot.argmax(1)
    names, D, depth = list(C), [], []
    for s in names:
        c = C[s]
        nr, na = c[np.arange(len(ref)), np.clip(ref, 0, 3)], c[np.arange(len(ref)), alt]
        dep = nr + na
        cap = kmerfp.MAX_DEPTH_X * np.median(dep[dep > 0]) if (dep > 0).any() else 0
        g = np.full(len(ref), -1, np.int8)
        for i in range(len(ref)):
            if ref[i] < 0 or dep[i] > cap:
                continue
            gt = genotype(int(nr[i]), int(na[i]), "R", "S")  # R = reference, S = ALT
            if gt:
                g[i] = gt.count("S")
        D.append(g)
        depth.append(int(np.median(dep[dep > 0])) if (dep > 0).any() else 0)
    np.savez_compressed(CALLS, names=names, dosage=np.array(D), ref=np.array([m[2] for m in markers()]),
                        alt=np.array([BASES[a] for a in alt]), markers=np.array([m[0] for m in markers()]),
                        median_depth=np.array(depth))
    for s, g, dp in zip(names, D, depth):
        print(f"{s:28s} called {np.mean(g >= 0):.1%}  median depth {dp}")
    print("->", CALLS)


def mask(assembly_hits: str):
    """Write UNIQUE from a scan of Criollo V2 itself (run before the table is restricted, i.e. with no UNIQUE file)."""
    c = counts(assembly_hits)
    ref = np.array([BASES.find(m[2]) for m in markers()])
    ok = (c[np.arange(len(ref)), np.clip(ref, 0, 3)] == 1) & (c.sum(1) == 1) & (ref >= 0)
    UNIQUE.write_text(json.dumps({"source": "Criollo V2 (GCF_000208745.1) scanned with jacqfp: reference allele once, "
                                            "no other allele anywhere in the assembly",
                                  "markers": [m[0] for m, u in zip(markers(), ok) if u]}))
    print(f"{int(ok.sum())} of {len(ok)} markers unique ->", UNIQUE)


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "flanks":
        flanks(sys.argv[2])
    elif cmd == "mask":  # after: scan GENOME.fna.gz HITS.npz (assembly scan, no UNIQUE file yet)
        mask(sys.argv[2])
    elif cmd == "scan":
        print(kmerfp.scan(sys.argv[2], sys.argv[3]))
    elif cmd == "call":  # args: name=file1,file2 ...
        call({a.split("=")[0]: a.split("=")[1].split(",") for a in sys.argv[2:]})
