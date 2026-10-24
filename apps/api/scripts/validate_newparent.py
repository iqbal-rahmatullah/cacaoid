"""Can the deployed black pod model rank seedlings of a cross that involves a parent it has never seen?
For each parent used in exactly two families, both families are left out of training; within-family r of the
held-out seedlings is compared with the ordinary leave-one-family-out case (both parents seen in other families).
Indonesian clones are unrelated to the six Costa Rican parents, so this is the closer proxy for use in Indonesia.

    cd apps/api && uv run python scripts/validate_newparent.py      # writes data/validation/newparent.json
"""
import json

import numpy as np
from sklearn.linear_model import RidgeCV

from cacaoid import config
from cacaoid.engine.ai_blackpod import ALPHAS, load

OUT = config.DATA / "validation" / "newparent.json"


def within(X, y, pop, train_mask, fam):
    te = pop == fam
    xm, mu, sd = X[train_mask].mean(0), y[train_mask].mean(), y[train_mask].std()
    p = RidgeCV(alphas=ALPHAS).fit(X[train_mask] - xm, (y[train_mask] - mu) / sd).predict(X[te] - xm)
    return float(np.corrcoef(p, y[te])[0, 1])


def main():
    X, y, pop, _ = load()
    fams = sorted(set(pop))
    par = {f: [p.strip() for p in f.split(" x ")] for f in fams}
    rows = []
    for p in sorted({q for f in fams for q in par[f]}):
        mine = [f for f in fams if p in par[f]]
        if len(mine) != 2:
            continue
        for f in mine:
            rows.append({"tetua_baru": p, "famili": f,
                         "r_tetua_dikenal": round(within(X, y, pop, pop != f, f), 3),
                         "r_satu_tetua_baru": round(within(X, y, pop, ~np.isin(pop, mine), f), 3)})
            print(rows[-1])
    s = {k: round(float(np.mean([r[k] for r in rows])), 3) for k in ("r_tetua_dikenal", "r_satu_tetua_baru")}
    print(s)
    OUT.write_text(json.dumps({"ringkasan": s, "famili": rows}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
