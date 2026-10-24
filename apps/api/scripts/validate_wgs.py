"""Validation of the WGS -> Jacquotte-marker path (scripts/wgs/jacqfp.py) and of black pod prediction for real clones.

1. Concordance: 5 of the 6 parents of the Jacquotte families have public WGS (Nestle PRJEB75153). Their dosages called
   from reads must agree with the dosages inferred from their 495 offspring. This also settles whether Jacquotte's
   0/1/2 counts the ALT or the REF allele.
2. New parent, real genotype: for each parent in exactly two families, train without those families and predict the
   parent's value from its WGS genotype; compare the ranking with the parent's observed progeny means (GCA).
3. Indonesian clones (genotyped the same way): predicted index vs black pod data from Indonesian trials (data/traits).
   n = 4, conflicting sources: a direction check only.

    cd apps/api && uv run python scripts/validate_wgs.py      # needs data/jacquotte2026/wgs_calls.npz
"""
import json
import sys
from pathlib import Path

import numpy as np
from scipy.stats import spearmanr

sys.path.insert(0, str(Path(__file__).parent))
from validate_blackpod import MODELS, load, parents  # noqa: E402
from validate_crosses import parent_genotypes  # noqa: E402

from cacaoid import config  # noqa: E402

CALLS = config.DATA / "jacquotte2026" / "wgs_calls.npz"
OUT = config.DATA / "validation" / "wgs.json"
# Indonesian trials (data/traits/clone_traits.csv): Rubiyo et al. 2020 attached-pod inoculation, Kolaka (% intensity)
RUBIYO = {"Sulawesi 1": 50, "Sulawesi 2": 60, "MCC 01": 100, "M04": 70}


def main():
    X, y, pop, snps = load()
    names, Pg, sure = parent_genotypes(X, pop)
    uniq = set(json.loads((CALLS.parent / "unique_in_criollo_v2.json").read_text())["markers"])
    cols = np.array([i for i, s in enumerate(snps) if s in uniq])  # the markers WGS reads can be called at
    X, Pg, sure = X[:, cols], Pg[cols], sure[cols]
    w = np.load(CALLS)
    wg = {str(n): d[cols] for n, d in zip(w["names"], w["dosage"])}
    res = {"konkordansi_tetua": {}}
    for p in names:
        if p not in wg:
            continue
        d, inf = wg[p], Pg[:, names.index(p)]
        ok = (d >= 0) & sure
        res["konkordansi_tetua"][p] = {"terpanggil": round(float((d >= 0).mean()), 3), "dibandingkan": int(ok.sum()),
                                       "cocok_jika_ALT": round(float((d[ok] == inf[ok]).mean()), 3),
                                       "cocok_jika_REF": round(float((2 - d[ok] == inf[ok]).mean()), 3)}
        print(p, res["konkordansi_tetua"][p])
    flip = np.mean([v["cocok_jika_REF"] > v["cocok_jika_ALT"] for v in res["konkordansi_tetua"].values()]) > 0.5
    res["kode_dosis"] = "REF" if flip else "ALT"
    code = lambda d: np.where(d >= 0, 2 - d if flip else d, -1)  # noqa: E731

    fams = sorted(set(pop))
    rows = []
    for p in names:
        mine = [f for f in fams if p in parents(f)]
        if p not in wg or len(mine) != 2:
            continue
        tr = ~np.isin(pop, mine)
        xm, mu, sd = X[tr].mean(0), y[tr].mean(), y[tr].std()
        m = MODELS["RR-BLUP"]().fit(X[tr] - xm, (y[tr] - mu) / sd)
        g = code(wg[p]).astype(float)
        g = np.where(g >= 0, g, xm)  # uncalled -> training mean
        rows.append({"tetua": p, "prediksi_dari_WGS": round(float(m.predict((g - xm)[None])[0] * sd + mu), 2),
                     "rata2_keturunan_teramati": round(float(y[np.isin(pop, mine)].mean()), 2)})
        print(rows[-1])
    res["tetua_baru_dari_WGS"] = rows
    if len(rows) > 2:
        res["tetua_baru_spearman"] = round(float(spearmanr([r["prediksi_dari_WGS"] for r in rows],
                                                           [r["rata2_keturunan_teramati"] for r in rows])[0]), 3)

    xm, mu, sd = X.mean(0), y.mean(), y.std()
    full = MODELS["RR-BLUP"]().fit(X - xm, (y - mu) / sd)
    indo = []
    for c, obs in RUBIYO.items():
        if c in wg:
            g = code(wg[c]).astype(float)
            indo.append({"klon": c, "terpanggil": round(float((g >= 0).mean()), 3),
                         "prediksi_BPR": round(float(full.predict((np.where(g >= 0, g, xm) - xm)[None])[0] * sd + mu), 2),
                         "rubiyo2020_intensitas_pct": obs})
            print(indo[-1])
    res["klon_indonesia"] = indo
    if len(indo) > 2:
        res["klon_indonesia_spearman"] = round(float(spearmanr([r["prediksi_BPR"] for r in indo],
                                                               [r["rubiyo2020_intensitas_pct"] for r in indo])[0]), 3)
    print({k: v for k, v in res.items() if "spearman" in k or k == "kode_dosis"})
    OUT.write_text(json.dumps(res, indent=2, ensure_ascii=False))
    print("->", OUT)


if __name__ == "__main__":
    main()
