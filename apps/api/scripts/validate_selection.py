"""Practical value of the deployed black pod model (17,275 Criollo-V2-unique markers, RR-BLUP) for a NEW cross:
a breeder keeps the 25% of seedlings the model ranks most resistant. Leave-one-family-out, so the cross is unseen.
Reported per family: within-family r, observed BPR of the kept seedlings vs the family mean, and the share of kept
seedlings that are truly in the more resistant half (random choice = 50%).

    cd apps/api && uv run python scripts/validate_selection.py      # writes data/validation/selection.json
"""
import json

import numpy as np
from sklearn.linear_model import RidgeCV

from cacaoid import config
from cacaoid.engine.ai_blackpod import ALPHAS, load

OUT = config.DATA / "validation" / "selection.json"


def main(keep: float = 0.25):
    X, y, pop, markers = load()
    rows = []
    for fam in sorted(set(pop)):
        te = pop == fam
        xm, mu, sd = X[~te].mean(0), y[~te].mean(), y[~te].std()
        p = RidgeCV(alphas=ALPHAS).fit(X[~te] - xm, (y[~te] - mu) / sd).predict(X[te] - xm)
        obs = y[te]
        k = max(1, int(round(keep * len(obs))))
        sel = np.argsort(p)[:k]  # lowest predicted BPR = predicted most resistant
        rows.append({"famili": fam, "n": int(len(obs)), "r_dalam_famili": round(float(np.corrcoef(p, obs)[0, 1]), 3),
                     "BPR_famili": round(float(obs.mean()), 2), "BPR_terpilih": round(float(obs[sel].mean()), 2),
                     "terpilih_di_separuh_tahan": round(float((obs[sel] < np.median(obs)).mean()), 2)})
        print(rows[-1])
    s = {"marka": len(markers), "simpan": keep,
         "r_dalam_famili_rata2": round(float(np.mean([r["r_dalam_famili"] for r in rows])), 3),
         "penurunan_BPR_rata2_poin": round(float(np.mean([r["BPR_famili"] - r["BPR_terpilih"] for r in rows])), 2),
         "penurunan_BPR_rata2_relatif": round(float(np.mean([(r["BPR_famili"] - r["BPR_terpilih"]) / r["BPR_famili"]
                                                             for r in rows])), 3),
         "terpilih_di_separuh_tahan_rata2": round(float(np.mean([r["terpilih_di_separuh_tahan"] for r in rows])), 2)}
    print(s)
    OUT.write_text(json.dumps({"ringkasan": s, "famili": rows}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
