"""Validation: predict the black pod mean of a NEW cross from its parents' genotypes (feature 'pasangan tetua').

Leave-one-parent-out on Jacquotte et al. 2026 (CC0): for each parent used in exactly two families (CHUAO-120, EET-95,
PA-51, EET-399) both its families are removed from training, so the model has never seen a phenotyped offspring of
that parent. Each removed family's mean is predicted as the model's value of the mid-parent genotype (the expected
offspring dosage; exact for the linear model). Classical baseline: grand mean + GCA of the other, known parent.

Parent genotypes are ML-inferred from offspring genotypes of all families (genotypes only, no phenotypes: in use the
parent clone is genotyped directly), with benchmark_real_parentage.infer_parents.

    cd apps/api && uv run python scripts/validate_crosses.py      # writes data/validation/crosses.json
"""
import json
import sys
from pathlib import Path

import numpy as np
from scipy.stats import spearmanr

sys.path.insert(0, str(Path(__file__).parent))
from benchmark_real_parentage import MIN_GAP, infer_parents  # noqa: E402
from validate_blackpod import MODELS, gca_baseline, load, parents  # noqa: E402

from cacaoid import config  # noqa: E402

OUT = config.DATA / "validation" / "crosses.json"


def parent_genotypes(G, pop):
    fams = sorted(set(pop))
    names = sorted({p for f in fams for p in parents(f)})
    crosses = [tuple(names.index(p) for p in parents(f)) for f in fams]
    cross_of = np.array([fams.index(f) for f in pop])
    Pg, gap = infer_parents(G.astype(np.int8), cross_of, crosses, len(names))
    return names, Pg, gap > MIN_GAP


def main():
    X, y, pop, _ = load()
    names, Pg, sure = parent_genotypes(X, pop)
    print(f"parent genotypes confident at {sure.mean():.1%} of {len(sure)} SNPs")
    fams = sorted(set(pop))
    obs = {f: float(y[pop == f].mean()) for f in fams}
    rows = []
    for p in names:
        mine = [f for f in fams if p in parents(f)]
        if len(mine) != 2:
            continue  # CATIE-R6 / ICS-95 are in 4 families each: removing them leaves too little
        tr = ~np.isin(pop, mine)
        xm = X[tr].mean(0)
        mu, sd = y[tr].mean(), y[tr].std()
        fitted = {m: make().fit(X[tr] - xm, (y[tr] - mu) / sd) for m, make in MODELS.items() if m != "GBoost"}
        for f in mine:
            a, b = (names.index(q) for q in parents(f))
            mid = np.where(sure, (Pg[:, a] + Pg[:, b]) / 2, xm)  # unsure SNPs -> training mean
            row = {"tetua_baru": p, "famili": f, "teramati": round(obs[f], 2),
                   "GCA_tetua_lain": round(gca_baseline(y, pop, [g for g in fams if g not in mine], f), 2)}
            for m, mod in fitted.items():
                row[m] = round(float(mod.predict((mid - xm)[None])[0] * sd + mu), 2)
            rows.append(row)
            print(row)
    res = {"famili": rows, "ringkasan": {}}
    o = np.array([r["teramati"] for r in rows])
    for k in ["GCA_tetua_lain", "RR-BLUP", "SVR"]:
        v = np.array([r[k] for r in rows])
        res["ringkasan"][k] = {"spearman_famili": round(float(spearmanr(v, o)[0]), 3),
                               "MAE": round(float(np.abs(v - o).mean()), 2)}
    # parent level: can the model tell which new parent passes on resistance, with none of its progeny phenotyped?
    par_obs, par_pred = {}, {}
    for r in rows:
        par_obs.setdefault(r["tetua_baru"], []).append(r["teramati"])
        par_pred.setdefault(r["tetua_baru"], []).append(r["RR-BLUP"])
    lv = {p: (round(np.mean(par_pred[p]), 2), round(np.mean(par_obs[p]), 2)) for p in par_obs}
    res["tetua"] = {p: {"prediksi": a, "teramati": b} for p, (a, b) in lv.items()}
    res["ringkasan"]["urutan_tetua_spearman"] = round(float(spearmanr([a for a, _ in lv.values()],
                                                                      [b for _, b in lv.values()])[0]), 3)
    print(json.dumps(res["ringkasan"], indent=1), json.dumps(res["tetua"], indent=1))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(res, indent=2, ensure_ascii=False))
    print("->", OUT)


if __name__ == "__main__":
    main()
