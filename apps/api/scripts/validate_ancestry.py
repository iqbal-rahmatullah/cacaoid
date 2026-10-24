"""Re-validation of the shipped ancestry model (engine/ai_ancestry.py: supervised admixture over Motamayor groups).

1. Leave-one-out on the registry's group-labelled reference trees: is the dominant group right, and how often is
   the model confident (>= 0.8) yet wrong?
2. Simulated F1 hybrids between two groups: does the composition come out near 50/50?
3. The same two tests on the 48-SNP verification panel (what a field sample has).

    cd apps/api && uv run python scripts/validate_ancestry.py      # writes data/validation/ancestry.json
"""
import json
from collections import Counter

import numpy as np
from sqlmodel import Session, create_engine, select

from cacaoid import config
from cacaoid.engine import ai_traits
from cacaoid.engine.ai_ancestry import Ancestry
from cacaoid.models import Clone, Panel

OUT = config.DATA / "validation" / "ancestry.json"


def loo(refs, snps, alleles):
    lab = [r for r in refs if r.group and r.profile]
    right = sure = sure_wrong = 0
    conf = Counter()
    for i, r in enumerate(lab):
        a = Ancestry([x for j, x in enumerate(lab) if j != i] + [x for x in refs if not x.group], snps, alleles)
        res = a.admix({s: r.profile[s] for s in snps if s in r.profile})
        top = next(iter(res["composition"]))
        right += top == r.group
        sure += res["dominant"] is not None
        sure_wrong += res["dominant"] is not None and res["dominant"] != r.group
        conf[(r.group, top)] += 1
    n = len(lab)
    return {"n": n, "benar": round(right / n, 3), "yakin": round(sure / n, 3), "yakin_tapi_salah": round(sure_wrong / n, 3),
            "salah_tersering": [f"{g} -> {t}: {c}" for (g, t), c in conf.most_common() if g != t][:5]}


def hybrids(refs, snps, alleles, n=200, seed=0):
    rng = np.random.default_rng(seed)
    lab = [r for r in refs if r.group and r.profile]
    a = Ancestry(refs, snps, alleles)
    err, dom = [], 0
    for _ in range(n):
        p, q = rng.choice(len(lab), 2, replace=False)
        if lab[p].group == lab[q].group:
            continue
        kid = {s: rng.choice(list(lab[p].profile[s])) + rng.choice(list(lab[q].profile[s]))
               for s in snps if s in lab[p].profile and s in lab[q].profile}
        c = a.admix(kid)["composition"]
        err.append(abs(c.get(lab[p].group, 0) - 0.5) + abs(c.get(lab[q].group, 0) - 0.5))
        dom += a.admix(kid)["dominant"] is not None
    return {"n": len(err), "galat_rata2": round(float(np.mean(err)), 3), "keliru_dianggap_murni": round(dom / len(err), 3)}


def main():
    eng = create_engine(f"sqlite:///{config.DB_PATH}")
    with Session(eng) as s:
        refs = s.exec(select(Clone).where(Clone.status == "referensi")).all()
        panel = s.exec(select(Panel)).first().snps
    m = ai_traits.model()
    full = (m["snps"], m["alleles"])
    pan = [(sn, al) for sn, al in zip(*full) if sn in set(panel)]
    res = {}
    for tag, (snps, alleles) in {"genome_wide_589": full, f"panel_{len(pan)}": tuple(map(list, zip(*pan)))}.items():
        res[tag] = {"loo": loo(refs, snps, alleles), "hibrida_F1": hybrids(refs, snps, alleles)}
        print(tag, res[tag])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(res, indent=2, ensure_ascii=False))
    print("->", OUT)


if __name__ == "__main__":
    main()
