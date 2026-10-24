"""Penasihat campuran klon: can the clones planned for one block pollinate each other?
Most cacao clones cannot set pods with their own pollen, so a block needs compatible partners. Three kinds of
evidence are reported side by side, never blended into one invented score:
  1. published crosses and selfing of Indonesian clones (Farid et al. 2021; Malik 2016);
  2. self-compatibility predicted from SSR genotypes at the CH1/CH4 loci (Lanaud et al. 2017, Table S7), only for
     clones that have such a profile;
  3. genetic similarity from registry fingerprints: close relatives tend to share incompatibility alleles (Farid 2021
     explains why THR × MCC-02 × AFQ/MHP-01 failed this way). A risk flag, not a verdict."""
import csv
import math
from functools import lru_cache
from itertools import combinations

from cacaoid import config
from cacaoid.engine.identity import key

DIR = config.DATA / "compat"
BASE_SC = 262 / 662  # share of self-compatible trees in Lanaud's 662-tree population (Table S6 counts)
ALIASES = {"SCAVINA6": "SCA6", "SCAVINA12": "SCA12", "SULAWESI1": "PBC123", "SULAWESI01": "PBC123",
           "SULAWESI2": "BR25", "SULAWESI02": "BR25", "MCC2": "MCC02", "MATINA1G6": "MATINA16"}


def k(name: str) -> str:
    n = key(name)
    return ALIASES.get(n, n)


def rows(name: str) -> list[dict]:
    with open(DIR / name, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


@lru_cache
def data() -> dict:
    sources = {r["source_id"]: r for r in rows("sources.csv")}
    rules = {}
    for r in rows("lanaud2017_s7_allele_dose.csv"):
        rules[(r["marker"], r["allele"])] = (r["region"], [float(r[f"p_sc_{d}"]) if r[f"p_sc_{d}"] else None for d in range(3)])
    return {"sources": sources, "rules": rules,
            "profiles": {k(r["clone"]): r for r in rows("lanaud2017_s3_profiles.csv")},
            "crosses": rows("indonesia_crosses.csv"), "facts": rows("indonesia_compat_facts.csv")}


def logit(p: float) -> float:
    p = min(max(p, 0.01), 0.99)
    return math.log(p / (1 - p))


def predict_sc(profile: dict) -> dict:
    """P(self-compatible) from Lanaud S7 allele-dose rules. CH1 and CH4 are separate loci: per locus the single most
    informative allele is used (markers inside one locus are linked, so adding them would double count)."""
    best: dict[str, tuple] = {}
    for marker, call in profile.items():
        if not call or "/" not in call:
            continue
        a, b = call.split("/")
        for allele in {a, b}:
            rule = data()["rules"].get((marker, allele))
            if not rule:
                continue
            region, p = rule
            dose = (a == allele) + (b == allele)
            if p[dose] is None:
                continue
            shift = logit(p[dose]) - logit(BASE_SC)
            if region not in best or abs(shift) > abs(best[region][0]):
                best[region] = (shift, marker, allele, dose, p[dose])
    if not best:
        return {"p_sc": None, "class": "tidak diketahui", "evidence": []}
    p = 1 / (1 + math.exp(-(logit(BASE_SC) + sum(v[0] for v in best.values()))))
    cls = "kemungkinan menyerbuk sendiri (SC)" if p >= 0.7 else "kemungkinan tidak menyerbuk sendiri (SI)" \
        if p <= 0.3 else "tidak pasti"
    return {"p_sc": round(p, 2), "class": cls,
            "evidence": [{"locus": reg, "marker": m, "allele": al, "copies": d, "p_sc": round(ps, 2)}
                         for reg, (_, m, al, d, ps) in sorted(best.items())]}


def similarity(a: dict, b: dict) -> tuple[float | None, int]:
    """Identity-by-state over SNPs both fingerprints have: 1 = identical, lower = less related."""
    shared = [s for s in a if a.get(s) and b.get(s)]
    if not shared:
        return None, 0
    ibs = sum(len(set(a[s]) & set(b[s])) / 2 if a[s][0] != a[s][1] or b[s][0] != b[s][1]
              else float(a[s] == b[s]) for s in shared)
    return ibs / len(shared), len(shared)


def advise(clones: list[str], fingerprints: dict[str, dict], background: list[float] | None = None) -> dict:
    """fingerprints: registry name -> SNP profile (for the similarity check); background: similarities of random
    registry pairs, used to say how unusual a pair's similarity is."""
    d = data()
    names = list(dict.fromkeys(c.strip() for c in clones if c.strip()))
    fp = {k(n): p for n, p in fingerprints.items()}
    per_clone, warnings = [], []
    for n in names:
        facts = [f | {"source": d["sources"][f["source_id"]]["citation"]} for f in d["facts"] if k(f["clone"]) == k(n)]
        prof = d["profiles"].get(k(n))
        pred = predict_sc({m: v for m, v in prof.items() if m.startswith("mS")}) if prof else None
        per_clone.append({"clone": n, "facts": facts, "prediction": pred, "has_fingerprint": k(n) in fp})
    pairs = []
    for a, b in combinations(names, 2):
        lit = [c for c in d["crosses"] if {k(c["female"]), k(c["male"])} == {k(a), k(b)}]
        sim, n_snp = similarity(fp[k(a)], fp[k(b)]) if k(a) in fp and k(b) in fp else (None, 0)
        pct = round(100 * sum(x < sim for x in background) / len(background)) if sim is not None and background else None
        pair = {"a": a, "b": b, "crosses": [{"female": c["female"], "male": c["male"], "successes": int(c["successes"]),
                                             "attempts": int(c["attempts"])} for c in lit],
                "similarity": round(sim, 3) if sim is not None else None, "similarity_percentile": pct, "snps": n_snp}
        if lit and all(int(c["successes"]) == 0 for c in lit):
            pair["flag"] = "gagal saling menyerbuki"
            warnings.append(f"{a} × {b}: tidak satu pun persilangan berhasil (0 dari {sum(int(c['attempts']) for c in lit)}, "
                            f"Farid dkk. 2021). Jangan mengandalkan pasangan ini sebagai penyerbuk.")
        elif sim is not None and (sim >= 0.98 or (pct is not None and pct >= 95)):
            pair["flag"] = "sangat mirip secara genetik"
            warnings.append(f"{a} dan {b} {'praktis identik' if sim >= 0.98 else 'sangat mirip secara genetik'} "
                            f"(kemiripan {sim:.2f}, di atas {pct}% pasangan registri): risiko gagal saling menyerbuki lebih tinggi.")
        pairs.append(pair)
    for c in per_clone:
        n = c["clone"]
        selfing_fails = any(f["fact"] == "self_pollination" and f["value"] == "gagal" for f in c["facts"]) or \
            (c["prediction"] and c["prediction"]["p_sc"] is not None and c["prediction"]["p_sc"] <= 0.3)
        mates = [p for p in pairs if n in (p["a"], p["b"]) and p.get("flag") != "gagal saling menyerbuki"]
        if selfing_fails and not mates:
            best = sorted((cr for cr in d["crosses"] if k(cr["female"]) == k(n) or k(cr["male"]) == k(n)),
                          key=lambda cr: -int(cr["successes"]))
            partner = next((cr["male"] if k(cr["female"]) == k(n) else cr["female"] for cr in best), None)
            warnings.append(f"{n} tidak bisa menyerbuk sendiri dan tidak punya pasangan penyerbuk yang cocok di blok ini."
                            + (f" Dari uji persilangan, pasangan terbaiknya {partner}." if partner else ""))
    return {"clones": per_clone, "pairs": pairs, "warnings": warnings,
            "sources": list(d["sources"].values()),
            "caveat": "Bukti persilangan berasal dari uji lapang terbatas; prediksi DNA hanya untuk klon yang punya "
                      "profil penanda di lokus kompatibilitas; kemiripan genetik adalah indikator risiko, bukan vonis."}
