"""Genome-to-fingerprint: genotype TcSNP markers from public genome assemblies or WGS reads, no aligner needed.

Markers = the CIRAD EST-SNP GoldenGate set (Allegre et al. 2012, DNA Res 19:23, Table S1: 60 bp + [X/Y] + 60 bp)
that Bekele et al. 2022 genotyped. For every SNP and allele we take every 31-mer that has the SNP at index 3..27
(both strands) and count exact matches. A read (or assembly locus) counts once per SNP, however many of its
k-mers hit, because hits are de-duplicated on the genomic position of the SNP base.

Output letters follow the Bekele HapMap: SNPs coded 'A/C' there are Illumina A/B calls (A=allele A, C=allele B);
SNPs coded '*' are TOP-strand nucleotides. Strand is resolved with Illumina's TOP/BOT rules (technote_topbot).

  scan  IN OUT.npz [--assembly]   IN = FASTA/FASTQ, plain or .gz, or '-' for stdin
  call  OUT.npz [--mask mask.json] [--subsample 0.25]   -> TSV snp, call, depth_ref, depth_alt
"""
import argparse
import gzip
import json
import math
import sys
from collections import Counter
from functools import cache
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
FLANKS = ROOT / "data/wgs_refs/tcsnp_flanks_allegre2012.tsv"
HAPMAP = ROOT / "data/bekele2022/genotypes_hapmap.txt"
K = 31
OFFSETS = np.arange(3, 28)  # index of the SNP base inside the k-mer
NOFF = len(OFFSETS)
COMP = str.maketrans("ACGT", "TGCA")
LUT = np.full(256, 4, np.uint8)
for _i, _c in enumerate(b"ACGT"):
    LUT[_c] = LUT[_c + 32] = _i

# Genotype rules (reads). Documented in README; chosen on the two independent PBC 123 samples.
HOM_MAX = 0.10     # homozygous: minor-allele fraction <= 10% ...
HOM_ALPHA = 0.01   # ... and a het would show this few minor reads with p < 1% (Binomial(d, 0.5)); so depth >= 7
HET_MIN = 0.20     # heterozygous: minor-allele fraction >= 20% ...
HET_READS = 2      # ... and at least 2 minor-allele reads; anything else -> no call
MAX_DEPTH_X = 3    # depth > 3x the sample's median marker depth -> multi-copy region, no call


def rc(s: str) -> str:
    return s.translate(COMP)[::-1]


def top_strand(left: str, a1: str, a2: str, right: str):
    """True if the given strand is Illumina TOP, False if BOT, None if undecidable."""
    if {a1, a2} not in ({"A", "T"}, {"C", "G"}):
        return "A" in (a1, a2)  # unambiguous SNP: TOP carries A ([A/C], [A/G])
    for lb, rb in zip(reversed(left), right):  # sequence walking for [A/T] and [C/G]
        if lb not in "ACGT" or rb not in "ACGT":
            return None
        if (lb in "AT") != (rb in "AT"):
            return lb in "AT"  # A/T base on the 5' side -> TOP
    return None


@cache
def markers() -> list:
    """[(snp, left, a1, a2, right, {given-strand base: HapMap letter})] for SNPs that Bekele genotyped."""
    coding, seen = {}, {}
    for line in list(open(HAPMAP))[1:]:
        f = line.rstrip("\n").split("\t")
        coding[f[0]] = f[1]
        seen[f[0]] = set("".join(g for g in f[11:] if g != "NN"))
    out = []
    for line in list(open(FLANKS))[1:]:
        snp, _pat, _st, _lg, _cm, seq = line.rstrip("\n").split("\t")
        code = coding.get(snp)
        if code not in ("A/C", "*"):
            continue
        left, rest = seq.upper().split("[")
        alleles, right = rest.split("]")
        a1, a2 = alleles.split("/")
        top = top_strand(left, a1, a2, right)
        if top is None:
            continue
        tb = {b: b if top else b.translate(COMP) for b in (a1, a2)}  # TOP-strand base of each allele
        # Illumina allele A = alphabetically first TOP base ([A/C],[A/G],[A/T]); for [C/G] the Bekele A/B calls
        # carry G as allele A (empirical: 149/150 checks against homozygous calls in 3 assemblies, see README)
        allele_a = "G" if set(tb.values()) == {"C", "G"} else min(tb.values())
        letters = {b: t if code == "*" else ("A" if t == allele_a else "C") for b, t in tb.items()}
        if not seen[snp] <= set(letters.values()):
            continue  # HapMap letters contradict the published SNP (e.g. TcSNP906 A/G typed as A/C)
        out.append((snp, left, a1, a2, right, letters))
    return out


def encode(s: str) -> int:
    v = 0
    for ch in s:
        v = v * 4 + "ACGT".index(ch)
    return v


@cache
def canonical() -> list[int]:
    """Index of the first marker with the same alleles and the same 30 bp each side, i.e. the same k-mers
    (duplicate assays: TcSNP10 = TcSNP1401, TcSNP1028 = TcSNP1204)."""
    first: dict = {}
    return [first.setdefault((m[1][-(K - 1):], m[2], m[3], m[4][:K - 1]), i) for i, m in enumerate(markers())]


@cache
def kmer_table():
    """Sorted k-mer values and their ids; id = ((snp_idx*2 + allele)*NOFF + offset_idx)*2 + strand."""
    owner: dict[int, int] = {}
    for i, (_snp, left, a1, a2, right, _) in enumerate(markers()):
        if canonical()[i] != i:
            continue  # duplicate assay: counted through its first copy
        for a, base in enumerate((a1, a2)):
            for oi, j in enumerate(OFFSETS):
                s = left[len(left) - j:] + base + right[:K - 1 - j]
                if len(s) != K or set(s) - set("ACGT"):
                    continue
                for st, km in enumerate((s, rc(s))):
                    v, kid = encode(km), ((i * 2 + a) * NOFF + oi) * 2 + st
                    if v in owner and owner[v] >= 0 and owner[v] // (2 * NOFF) != kid // (2 * NOFF):
                        owner[v] = -1  # same k-mer for two SNP alleles -> useless
                    owner.setdefault(v, kid)
    items = sorted((v, k) for v, k in owner.items() if k >= 0)
    vals = np.array([v for v, _ in items], np.uint64)
    ids = np.array([k for _, k in items], np.int32)
    pre = np.zeros(1 << 24, bool)
    pre[(vals >> np.uint64(2 * K - 24)).astype(np.int64)] = True
    return vals, ids, pre


def scan_codes(codes: np.ndarray):
    """(k-mer start positions, k-mer ids) of table k-mers in a uint8 code array (4 = N)."""
    vals, ids, pre = kmer_table()
    n = len(codes) - K + 1
    if n <= 0:
        return np.empty(0, np.int64), np.empty(0, np.int32)
    c = np.append(codes & 3, np.uint8(0)).astype(np.uint64)  # +1 pad base: the last 16-mer needs it, >>2 drops it
    m = len(c)
    v8 = c[: m - 7] << np.uint64(14)  # 31-mer by doubling: 8-mer -> 16-mer -> 31-mer
    for i in range(1, 8):
        v8[: m - 7] |= c[i : m - 7 + i] << np.uint64(14 - 2 * i)
    v16 = (v8[: m - 15] << np.uint64(16)) | v8[8 : m - 7]
    v = (v16[:n] << np.uint64(30)) | (v16[16 : 16 + n] >> np.uint64(2))
    cand = np.nonzero(pre[(v >> np.uint64(2 * K - 24)).astype(np.int64)])[0]  # cheap prefix filter
    idx = np.searchsorted(vals, v[cand])
    idx[idx == len(vals)] = 0
    ok = vals[idx] == v[cand]
    cand, idx = cand[ok], idx[ok]
    nbad = np.concatenate(([0], np.cumsum(codes == 4)))
    clean = nbad[cand + K] == nbad[cand]  # no N inside the window
    return cand[clean], ids[idx[clean]]


def records(path):
    """Yield (name, sequence bytes) from FASTA (multi-line ok) or FASTQ, plain or gzip, file or '-'."""
    f = sys.stdin.buffer if path == "-" else open(path, "rb") if isinstance(path, (str, Path)) else path
    if f.peek(2)[:2] == b"\x1f\x8b":
        f = gzip.open(f)
    first = f.peek(1)[:1]
    if first == b"@":
        for i, line in enumerate(f):
            if i % 4 == 1:
                yield None, line.rstrip()
        return
    name, buf = None, []
    for line in f:
        if line[:1] == b">":
            if name is not None:
                yield name, b"".join(buf)
            name, buf = line[1:].split()[0].decode(), []
        else:
            buf.append(line.rstrip())
    if name is not None:
        yield name, b"".join(buf)


def scan(path, out: str, assembly: bool = False, chunk: int = 1 << 25) -> dict:
    """Stream sequences, store every k-mer hit as (global position, k-mer id, read index)."""
    P, I, R, names, starts = [], [], [], [], []
    batch, lens, base, blen, nreads, nbases = [], [], 0, 0, 0, 0

    def flush():
        nonlocal batch, lens, base, blen
        if not batch:
            return
        buf = b"N".join(batch)
        p, i = scan_codes(LUT[np.frombuffer(buf, np.uint8)])
        rstart = np.cumsum([0] + [n + 1 for n in lens[:-1]])
        P.append(p + base)
        I.append(i)
        R.append(nreads - len(batch) + np.searchsorted(rstart, p, "right") - 1)
        base += len(buf) + 1
        batch, lens, blen = [], [], 0

    for name, seq in records(path):
        if assembly:
            names.append(name)
            starts.append(base + blen)
        batch.append(seq)
        lens.append(len(seq))
        blen += len(seq) + 1
        nreads += 1
        nbases += len(seq)
        if blen >= chunk:
            flush()
    flush()
    meta = {"n_seqs": nreads, "n_bases": nbases, "names": names, "starts": [int(s) for s in starts]}
    np.savez_compressed(out, pos=np.concatenate(P) if P else np.empty(0, np.int64),
                        kid=np.concatenate(I) if I else np.empty(0, np.int32),
                        rid=np.concatenate(R) if R else np.empty(0, np.int64), meta=json.dumps(meta))
    return meta


def loci(npz: str, mask: dict | None = None, subsample: float = 1.0):
    """Distinct (SNP-base position, snp_idx*2+allele, offset_key) after masking; one row per locus+k-mer."""
    d = np.load(npz)
    pos, kid, rid = d["pos"], d["kid"].astype(np.int64), d["rid"]
    keep = np.ones(len(kid), bool)
    if subsample < 1:  # deterministic pseudo-random read subset, for coverage experiments
        keep &= (rid * 2654435761 % 1000003) < subsample * 1000003
    if mask:
        keep &= ~np.isin(kid >> 1, np.array(mask.get("kmers", []), np.int64))
        bad = [i for i, m in enumerate(markers()) if m[0] in set(mask.get("snps", []))]
        keep &= ~np.isin(kid // (2 * NOFF) // 2, np.array(bad, np.int64))
    pos, kid = pos[keep], kid[keep]
    j = OFFSETS[(kid >> 1) % NOFF]
    snppos = pos + np.where(kid & 1, K - 1 - j, j)
    return snppos, kid // (2 * NOFF), kid >> 1, json.loads(str(d["meta"]))


def allele_counts(npz, mask: dict | None = None, subsample: float = 1.0) -> np.ndarray:
    """(n_snp, 2) array: number of distinct reads / genome loci carrying allele a1 / a2 (npz: path or list of parts)."""
    nsa = 2 * len(markers())
    total = np.zeros(nsa, np.int64)
    for f in [npz] if isinstance(npz, (str, Path)) else npz:
        snppos, sa, _, _ = loci(f, mask, subsample)
        total += np.bincount(np.unique(snppos * nsa + sa) % nsa, minlength=nsa)
    return total.reshape(-1, 2)[canonical()]


def genotype(n1: int, n2: int, l1: str, l2: str) -> str | None:
    d, m = n1 + n2, min(n1, n2)
    if d and m / d <= HOM_MAX and sum(math.comb(d, i) for i in range(m + 1)) / 2**d < HOM_ALPHA:
        return (l1 if n1 > n2 else l2) * 2
    if m >= HET_READS and m / d >= HET_MIN:
        return "".join(sorted(l1 + l2))
    return None


def call_reads(npz, mask: dict | None = None, subsample: float = 1.0) -> list[dict]:
    """One row per marker: snp, call (None = no call), depth_ref/depth_alt (= Illumina allele A / B)."""
    cnt = allele_counts(npz, mask, subsample)
    dep = cnt.sum(1)
    cap = MAX_DEPTH_X * np.median(dep[dep > 0]) if (dep > 0).any() else 0
    rows = []
    for (snp, _l, a1, a2, _r, let), (n1, n2) in zip(markers(), cnt):
        if let[a1] > let[a2]:  # report depths in letter order: depth_ref = first letter of the pair
            n1, n2, a1, a2 = n2, n1, a2, a1
        call = genotype(int(n1), int(n2), let[a1], let[a2]) if n1 + n2 <= cap else None  # multi-copy locus
        rows.append({"snp": snp, "call": call, "depth_ref": int(n1), "depth_alt": int(n2)})
    return rows


def assembly_alleles(npz, mask: dict | None = None) -> dict:
    """snp -> sorted set of HapMap letters present in a (haploid or collapsed) assembly."""
    cnt = allele_counts(npz, mask)
    out = {}
    for (snp, _l, a1, a2, _r, let), (n1, n2) in zip(markers(), cnt):
        present = {let[b] for b, n in ((a1, n1), (a2, n2)) if n}
        if present:
            out[snp] = "".join(sorted(present))
    return out


def kmer_mask(assembly_npzs: list[str], min_assemblies: int = 2) -> dict:
    """k-mers placed at >1 locus in >= min_assemblies assemblies (repeats/paralogs; one assembly alone may just carry
    a duplicated haplotig), then SNPs whose same allele still maps to >1 locus."""
    votes: Counter = Counter()
    for f in assembly_npzs:
        snppos, _sa, key, _ = loci(f)
        u = np.unique(np.stack([key, snppos]), axis=1)
        k, c = np.unique(u[0], return_counts=True)
        votes.update(k[c > 1].tolist())
    bad_k = {key for key, n in votes.items() if n >= min_assemblies}
    # mask the offset for both alleles, or reads would only ever see the unmasked allele
    bad_k = {(key // NOFF // 2 * 2 + a) * NOFF + key % NOFF for key in bad_k for a in (0, 1)}
    mask = {"kmers": sorted(bad_k), "snps": []}
    votes = Counter()
    for f in assembly_npzs:
        snppos, sa, _key, _ = loci(f, mask)
        u = np.unique(np.stack([sa, snppos]), axis=1)
        k, c = np.unique(u[0], return_counts=True)
        votes.update(set((k[c > 1] // 2).tolist()))
    mask["snps"] = sorted(markers()[i][0] for i, n in votes.items() if n >= min_assemblies)
    return mask


def demo():
    """Self-check: strand rules reproduce every nucleotide-coded Bekele SNP's letters, and k-mers round-trip."""
    obs = {}
    for line in list(open(HAPMAP))[1:]:
        f = line.rstrip("\n").split("\t")
        if f[1] == "*":
            obs[f[0]] = set("".join(g for g in f[11:] if g != "NN"))
    mk = {m[0]: m for m in markers()}
    for snp, letters in obs.items():
        if snp in mk:
            assert letters <= set(mk[snp][5].values()), (snp, letters, mk[snp][5])
    assert top_strand("CCG", "A", "T", "TTA") is False and top_strand("AGG", "C", "G", "GGC") is True
    vals, ids, _ = kmer_table()
    left = mk["TcSNP23"][1]
    km = left[-10:] + mk["TcSNP23"][2] + mk["TcSNP23"][4][:20]
    codes = LUT[np.frombuffer(("NNNN" + km + "NN").encode(), np.uint8)]
    p, i = scan_codes(codes)
    assert len(p) == 1 and p[0] == 4 and OFFSETS[(i[0] >> 1) % NOFF] == 10, (p, i)
    assert genotype(10, 0, "A", "C") == "AA" and genotype(5, 5, "C", "A") == "AC" and genotype(3, 1, "A", "C") is None
    assert genotype(6, 0, "A", "C") is None and genotype(1, 9, "A", "C") is None and genotype(1, 10, "A", "C") == "CC"
    print(f"ok: {len(markers())} markers, {len(vals)} k-mers, {len(obs)} nucleotide-coded SNPs checked")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("scan")
    s.add_argument("inp")
    s.add_argument("out")
    s.add_argument("--assembly", action="store_true")
    c = sub.add_parser("call")
    c.add_argument("npz")
    c.add_argument("--mask")
    c.add_argument("--subsample", type=float, default=1.0)
    sub.add_parser("demo")
    a = ap.parse_args()
    if a.cmd == "scan":
        print(json.dumps({k: v for k, v in scan(a.inp, a.out, a.assembly).items() if k in ("n_seqs", "n_bases")}))
    elif a.cmd == "call":
        m = json.load(open(a.mask)) if a.mask else None
        print("snp\tcall\tdepth_ref\tdepth_alt")
        for r in call_reads(a.npz, m, a.subsample):
            print(f"{r['snp']}\t{r['call'] or ''}\t{r['depth_ref']}\t{r['depth_alt']}")
    else:
        demo()
