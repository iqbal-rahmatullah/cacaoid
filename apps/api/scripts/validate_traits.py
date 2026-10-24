"""Re-validation of the shipped yield-component model (engine/ai_traits.py, Bekele 2022, 346 accessions x 589 SNPs).

1. Nested kinship-block CV: the shipped trainer picks RR-BLUP vs SVR on the same folds it reports (optimistic);
   here the choice is made inside each outer training fold.
2. Does genomics beat plain relatedness? Baseline = mean of the 5 most related training accessions (kinship kNN).
3. Is the shown "80% interval" (+-1.28 x CV RMSE) honest? Share of held-out accessions inside it.
4. Independent check on Indonesian clones that are NOT in the training data: genotypes called from public WGS
   (data/wgs_refs, same TcSNP markers) vs bean weight measured in Indonesian field trials (data/traits). n is tiny:
   it can show a wrong direction, not prove accuracy.

    cd apps/api && uv run python scripts/validate_traits.py      # writes data/validation/traits.json
"""
import csv
import json
from collections import defaultdict
from statistics import median

import numpy as np
from scipy.stats import spearmanr

from cacaoid import config
from cacaoid.engine import ai_traits as T

OUT = config.DATA / "validation" / "traits.json"
WGS = {"PBC 123 (Sulawesi 1)": "Sulawesi 1", "BR 25 (Sulawesi 2)": "Sulawesi 2", "MCC 01 (M01)": "MCC 01",
       "M04": "M04", "M06": "M06"}


def fit_pred(make, X, y, tr, te):
    mu, sd = y[tr].mean(), y[tr].std()
    return make().fit(X[tr], (y[tr] - mu) / sd).predict(X[te]) * sd + mu


def knn(X, y, tr, te, k=5):
    Xc = X - X[tr].mean(0)
    S = Xc[te] @ Xc[tr].T
    return np.array([y[tr][np.argsort(-s)[:k]].mean() for s in S])


def nested(X, y, seeds=(5, 6, 7)):
    res = defaultdict(list)
    for seed in seeds:
        outer = T.kinship_folds(X, 5, seed)
        pred = defaultdict(lambda: np.zeros(len(y)))
        inside = np.zeros(len(y), bool)
        for k in np.unique(outer):
            te, tr = outer == k, outer != k
            Xi, yi = X[tr], y[tr]
            inner = T.kinship_folds(Xi, 4, seed + 100)
            sc = {m: T.cross_validate(Xi, yi, make, inner) for m, make in T.MODELS.items()}
            best = max(sc, key=lambda m: sc[m][0])
            for m, make in T.MODELS.items():
                pred[m][te] = fit_pred(make, X, y, tr, te)
            pred["nested"][te] = pred[best][te]
            inside[te] = np.abs(pred[best][te] - y[te]) <= 1.28 * sc[best][1]
            pred["kNN kekerabatan"][te] = knn(X, y, tr, te)
        for m, p in pred.items():
            res[m].append(float(np.corrcoef(p, y)[0, 1]))
        res["cakupan_interval_80"].append(float(inside.mean()))
    return {m: round(float(np.mean(v)), 3) for m, v in res.items()}


def wgs_profiles():
    by = defaultdict(lambda: defaultdict(dict))
    for r in csv.DictReader(open(config.DATA / "wgs_refs" / "genotypes.tsv"), delimiter="\t"):
        if r["name"] in WGS and r["call"]:
            by[r["name"]][r["run_or_assembly"]][r["snp"]] = r["call"]
    return {WGS[n]: max(runs.values(), key=len) for n, runs in by.items()}  # the run with the most calls


def field_bean_weight():
    w = defaultdict(list)
    for r in csv.DictReader(open(config.DATA / "traits" / "clone_traits.csv")):
        if r["trait"] == "bean_weight_g" and r["canonical_clone"] in WGS.values():
            w[r["canonical_clone"]].append(float(r["value"]))
    return {c: (round(median(v), 2), len(v)) for c, v in w.items()}


def main():
    X, Y, *_ = T.load_training()
    res = {"cv_bersarang": {}}
    for t, col in enumerate(T.TRAITS):
        res["cv_bersarang"][col] = nested(X, Y[:, t])
        print(col, res["cv_bersarang"][col])
    prof = wgs_profiles()
    pred = dict(zip(prof, T.predict(list(prof.values()))))
    obs = field_bean_weight()
    rows = []
    for c, p in pred.items():
        tr = p["traits"]
        rows.append({"klon": c, "cakupan_snp": p["coverage"], "berat_biji_lapang_g": obs.get(c, (None, 0))[0],
                     "n_fakta": obs.get(c, (None, 0))[1], "pred_panjang_biji": tr["FR_BL"]["value"],
                     "pred_lebar_biji": tr["FR_BW"]["value"], "pred_biji_per_buah": tr["FR_BEN"]["value"],
                     "pred_pod_index": tr["PodIndex"]["value"]})
        print(rows[-1])
    both = [r for r in rows if r["berat_biji_lapang_g"] is not None]
    size = [r["pred_panjang_biji"] * r["pred_lebar_biji"] for r in both]
    res["klon_indonesia"] = rows
    res["cek_arah_ukuran_biji"] = {"n": len(both), "spearman": round(float(spearmanr(size, [r["berat_biji_lapang_g"]
                                                                                            for r in both])[0]), 3)}
    print(res["cek_arah_ukuran_biji"])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(res, indent=2, ensure_ascii=False))
    print("->", OUT)


if __name__ == "__main__":
    main()
