"""Reference registry: one consensus fingerprint per clone, built from replicate trees.
Ported from legacy-scripts/panel2.py (distance with missing data, greedy redundant panel)."""
import re
from collections import Counter, defaultdict
from dataclasses import dataclass

import numpy as np

from cacaoid.engine.io import Genotypes

CODES = {g: i for i, g in enumerate(["AA", "AC", "AG", "AT", "CC", "CG", "CT", "GG", "GT", "TT"])}
# Motamayor et al. 2008 genetic groups, assigned only from unambiguous accession prefixes
GROUP_BY_PREFIX = {"NA": "Nanay", "PA": "Marañón", "IMC": "Iquitos", "GU": "Guiana", "SCA": "Contamana"}
# Named trees checked against public genomes (data/wgs_refs): all homozygous; Belize trees 95-97% identical to
# Cornejo's Criollo genome, Catongo/SIC864/Mat1-6 92-100% to the SIC 806 genome. MATINA1 here is heterozygous
# and does not cluster with them (likely mislabelled), so it stays unassigned.
GROUP_BY_NAME = [(r"^(B97-61|BELIZE97)", "Criollo"), (r"^(CATONGO|SIC864|Mat1-6)$", "Amelonado")]


@dataclass
class CloneProfile:
    name: str
    profile: dict[str, str]
    n_trees: int
    status: str            # "referensi" | "tidak konsisten"
    group: str | None
    source: str = "Bekele 2022 · ICGT Trinidad"


def encode(calls: list[list[str | None]]) -> np.ndarray:
    return np.array([[CODES.get(c, -1) if c else -1 for c in row] for row in calls], dtype=np.int8)


def mismatch(a: np.ndarray, b: np.ndarray) -> tuple[int, int]:
    """(mismatches, compared) between two encoded rows; missing on either side is skipped."""
    ok = (a >= 0) & (b >= 0)
    return int(((a != b) & ok).sum()), int(ok.sum())


def group_of(name: str) -> str | None:
    if g := next((g for pat, g in GROUP_BY_NAME if re.match(pat, name)), None):
        return g
    m = re.match(r"[A-Za-z]+", name)
    return GROUP_BY_PREFIX.get(m.group(0).upper()) if m else None


def _consensus(rows: np.ndarray, snps: list[str]) -> dict[str, str]:
    inv = {v: k for k, v in CODES.items()}
    out = {}
    for j, s in enumerate(snps):
        vals = [int(v) for v in rows[:, j] if v >= 0]
        if vals:
            out[s] = inv[Counter(vals).most_common(1)[0][0]]
    return out


def build_registry(geno: Genotypes, same_tol: float = 0.05) -> list[CloneProfile]:
    """Group replicate trees by accession name (suffix _1, _2 ... stripped). Replicates within
    `same_tol` mismatch share one consensus; otherwise every variant is kept and flagged."""
    E = encode(geno.calls)
    by_name = defaultdict(list)
    for i, s in enumerate(geno.samples):
        by_name[re.sub(r"_\d+$", "", s)].append(i)
    out = []
    for name, idx in by_name.items():
        clusters: list[list[int]] = []
        for i in idx:
            for c in clusters:
                d, n = mismatch(E[i], E[c[0]])
                if n and d / n <= same_tol:
                    c.append(i)
                    break
            else:
                clusters.append([i])
        status = "referensi" if len(clusters) == 1 else "tidak konsisten"
        for k, c in enumerate(sorted(clusters, key=len, reverse=True)):
            label = name if k == 0 else f"{name} (varian {chr(98 + k - 1)})"
            out.append(CloneProfile(label, _consensus(E[c], geno.snps), len(c), status, group_of(name)))
    return out


def genotype_freqs(profiles: list[dict[str, str]], snps: list[str]) -> dict[str, dict[str, float]]:
    """Per-SNP genotype frequencies among registry clones (for chance-match probability)."""
    out = {}
    for s in snps:
        cnt = Counter(p[s] for p in profiles if s in p)
        tot = sum(cnt.values())
        out[s] = {g: n / tot for g, n in cnt.items()} if tot else {}
    return out


def select_panel(profiles: list[dict[str, str]], snps: list[str], size: int = 48, k: int = 3) -> list[str]:
    """Greedy panel: each pair of distinct clones separated by >= k SNPs where possible."""
    def informative(s: str) -> bool:
        vals = [p[s] for p in profiles if s in p]
        top = Counter(vals).most_common(1)[0][1] if vals else 0
        return len(vals) >= 0.9 * len(profiles) and top <= 0.95 * len(vals)
    snps = [s for s in snps if informative(s)]
    E = encode([[p.get(s) for s in snps] for p in profiles])
    pi, pj = np.triu_indices(len(E), 1)
    need = np.full(len(pi), k)
    sep = np.array([(E[pi, j] >= 0) & (E[pj, j] >= 0) & (E[pi, j] != E[pj, j]) for j in range(len(snps))])
    chosen: list[int] = []
    while len(chosen) < size:
        gain = (sep & (need > 0)).sum(1)
        gain[chosen] = -1
        j = int(gain.argmax())
        if gain[j] <= 0:
            break
        chosen.append(j)
        need -= sep[j]
    return [snps[j] for j in chosen]
