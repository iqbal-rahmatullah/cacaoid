"""Validation: genomic prediction of black pod rot (BPR) on real cacao F1 families.

Data: Jacquotte et al. (2026) Plant Genome, Dryad doi:10.5061/dryad.0rxwdbsg4 (CC0). 495 F1 trees, 8 full-sib families
(CATIE, Costa Rica), 24,218 LD-pruned SNPs, BPR BLUEs (lower = fewer rotten pods = more resistant).

Questions, from the most optimistic to the most honest:
  A. random 5-fold CV (what papers usually report; relatives on both sides),
  B. leave-one-family-out (a NEW cross): overall r, r of family means vs the classical GCA baseline, and the
     within-family r (can the model rank seedlings of a cross it has never seen? 88% of BPR variance is within families),
  C. half of the family phenotyped (upper bound for within-family ranking),
  D. marker density: does a mid-density panel (500-5,000 SNPs) keep the within-family accuracy?

    cd apps/api && uv run python scripts/validate_blackpod.py      # writes data/validation/blackpod.json
"""
import csv
import json
import time

import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.linear_model import RidgeCV
from sklearn.svm import SVR

from cacaoid import config

B = config.DATA / "benchmark"
OUT = config.DATA / "validation" / "blackpod.json"
ALPHAS = np.logspace(2, 6, 13)  # ridge penalty grid; chosen per training fold by efficient LOO (GCV)
MODELS = {
    "RR-BLUP": lambda: RidgeCV(alphas=ALPHAS),
    "SVR": lambda: SVR(C=3.0, gamma="scale"),
    "GBoost": lambda: HistGradientBoostingRegressor(max_iter=200, learning_rate=0.05, max_leaf_nodes=8,
                                                    max_features=0.1, random_state=0),
}


def load(trait: str = "BPR"):
    d = np.load(B / "jacquotte2026_pruned.npz")
    ph = {r["id"]: r for r in csv.DictReader(open(B / "jacquotte2026_phenotypes.csv"))}
    y = np.array([float(ph[i][trait]) if ph[i][trait] != "NA" else np.nan for i in d["ids"]])
    ok = np.isfinite(y)
    return d["G"][ok].astype(np.float32), y[ok], np.array(d["pop"])[ok], list(d["snps"])


def fit_predict(make, X, y, tr, te):
    mu, sd = y[tr].mean(), y[tr].std()
    xm = X[tr].mean(0)
    m = make().fit(X[tr] - xm, (y[tr] - mu) / sd)
    return m.predict(X[te] - xm) * sd + mu


def r(a, b):
    return float(np.corrcoef(a, b)[0, 1]) if len(a) > 2 and np.std(a) > 0 else float("nan")


def parents(fam: str) -> tuple[str, str]:
    a, b = fam.split(" x ")
    return a.strip(), b.strip()


def gca_baseline(y, pop, tr_fams, fam):
    """Classical progeny-test prediction for an untested cross: grand mean + GCA of each parent (training families)."""
    means = {f: y[pop == f].mean() for f in tr_fams}
    mu = np.mean(list(means.values()))
    pred = mu
    for p in parents(fam):
        fm = [m for f, m in means.items() if p in parents(f)]
        pred += (np.mean(fm) - mu) if fm else 0.0
    return pred


def scheme_random(X, y, pop, reps=5, k=5):
    out = {m: [] for m in MODELS} | {"rata-rata famili": []}
    for rep in range(reps):
        folds = np.random.default_rng(rep).integers(0, k, len(y))
        pred = {m: np.zeros(len(y)) for m in out}
        for f in range(k):
            te, tr = folds == f, folds != f
            for m, make in MODELS.items():
                pred[m][te] = fit_predict(make, X, y, tr, te)
            fm = {fam: y[tr & (pop == fam)].mean() for fam in set(pop)}
            pred["rata-rata famili"][te] = [fm[p] for p in pop[te]]
        for m in out:
            out[m].append(r(pred[m], y))
    return {m: round(float(np.mean(v)), 3) for m, v in out.items()}


def scheme_lofo(X, y, pop, models=MODELS):
    fams = sorted(set(pop))
    res = {m: {"pred": np.zeros(len(y))} for m in models}
    gca = np.zeros(len(y))
    for fam in fams:
        te, tr = pop == fam, pop != fam
        for m, make in models.items():
            res[m]["pred"][te] = fit_predict(make, X, y, tr, te)
        gca[te] = gca_baseline(y, pop, [f for f in fams if f != fam], fam)
    obs_fm = np.array([y[pop == f].mean() for f in fams])
    out = {"GCA (uji keturunan klasik)": {"r_famili": round(r(np.array([gca[pop == f][0] for f in fams]), obs_fm), 3),
                                          "r_dalam_famili": None}}
    for m, v in res.items():
        p = v["pred"]
        within = {f: round(r(p[pop == f], y[pop == f]), 3) for f in fams}
        out[m] = {"r_total": round(r(p, y), 3),
                  "r_famili": round(r(np.array([p[pop == f].mean() for f in fams]), obs_fm), 3),
                  "r_dalam_famili": round(float(np.mean(list(within.values()))), 3),
                  "per_famili": within}
    return out


def scheme_half(X, y, pop, make, reps=5):
    """Half of the target family phenotyped (plus all other families): within-family r on the other half."""
    vals = []
    for fam in sorted(set(pop)):
        idx = np.where(pop == fam)[0]
        for rep in range(reps):
            rng = np.random.default_rng(rep)
            te_idx = rng.choice(idx, len(idx) // 2, replace=False)
            te = np.zeros(len(y), bool)
            te[te_idx] = True
            vals.append(r(fit_predict(make, X, y, ~te, te), y[te]))
    return round(float(np.mean(vals)), 3)


def scheme_density(X, y, pop, sizes=(48, 500, 1000, 2000, 5000), reps=3):
    out = {}
    for n in sizes:
        rs = []
        for rep in range(reps):
            cols = np.random.default_rng(100 + rep).choice(X.shape[1], n, replace=False)
            lofo = scheme_lofo(X[:, cols], y, pop, {"RR-BLUP": MODELS["RR-BLUP"]})["RR-BLUP"]
            rs.append(lofo["r_dalam_famili"])
        out[n] = round(float(np.mean(rs)), 3)
    return out


def main():
    t0 = time.time()
    X, y, pop, snps = load()
    print(f"{len(y)} pohon, {X.shape[1]} SNP, {len(set(pop))} famili")
    res = {"data": {"n": int(len(y)), "snps": int(X.shape[1]), "famili": int(len(set(pop))),
                    "sifat": "BPR (BLUE, makin rendah makin tahan)"}}
    res["A_cv_acak"] = scheme_random(X, y, pop)
    print("A random CV", res["A_cv_acak"])
    res["B_famili_baru"] = scheme_lofo(X, y, pop)
    for m, v in res["B_famili_baru"].items():
        print("B LOFO", m, {k: v[k] for k in v if k != "per_famili"})
    res["C_setengah_famili"] = {m: scheme_half(X, y, pop, MODELS[m]) for m in ("RR-BLUP", "SVR")}
    print("C half family", res["C_setengah_famili"])
    res["D_kepadatan_marka"] = scheme_density(X, y, pop)
    print("D density (LOFO within-family r, RR-BLUP)", res["D_kepadatan_marka"])
    res["detik"] = round(time.time() - t0)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(res, indent=2, ensure_ascii=False))
    print("->", OUT)


if __name__ == "__main__":
    main()
