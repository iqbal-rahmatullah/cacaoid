"""AI ketahanan busuk buah (black pod rot, Phytophthora): genomic prediction from genome-wide SNP dosages.

Trained on Jacquotte et al. 2026 (Plant Genome; Dryad doi:10.5061/dryad.0rxwdbsg4, CC0): 470 F1 trees from 8 crosses
with BPR BLUEs (CATIE, Costa Rica), on the 17,275 markers that are unique in Criollo V2, so that the same markers can
be called from public WGS reads (scripts/wgs/jacqfp.py). Validation: scripts/validate_*.py -> data/validation/*.json
(internal numbers, never shown in the UI or on slides).

Validated use: RANKING THE SEEDLINGS OF ONE CROSS, also when one parent is new to the model (newparent.json). Not
validated: comparing clones or unrelated trees, or predicting a cross's mean from its parents (crosses.json), so the API
only returns a within-cross ranking. Scores are BPR-like (lower = fewer rotten pods); absolute % rotten pods depends on
site, year and Phytophthora species.

    uv run python -m cacaoid.engine.ai_blackpod      -> artifacts/blackpod.pkl
"""
import csv
import json
import pickle

import numpy as np
from sklearn.linear_model import RidgeCV

from cacaoid import config

B = config.DATA / "benchmark"
J = config.DATA / "jacquotte2026"
ARTIFACT = config.ROOT / "artifacts" / "blackpod.pkl"
ALPHAS = np.logspace(2, 6, 13)  # ridge penalty, chosen by efficient leave-one-out


def load():
    d = np.load(B / "jacquotte2026_pruned.npz")
    ph = {r["id"]: r for r in csv.DictReader(open(B / "jacquotte2026_phenotypes.csv"))}
    y = np.array([float(ph[i]["BPR"]) if ph[i]["BPR"] != "NA" else np.nan for i in d["ids"]])
    keep = set(json.loads((J / "unique_in_criollo_v2.json").read_text())["markers"])
    cols = np.array([i for i, s in enumerate(d["snps"]) if str(s) in keep])
    ok = np.isfinite(y)
    return d["G"][ok][:, cols].astype(np.float32), y[ok], np.array(d["pop"])[ok], [str(d["snps"][i]) for i in cols]


def train() -> dict:
    X, y, pop, markers = load()
    means = X.mean(0)
    mu, sd = y.mean(), y.std()
    model = RidgeCV(alphas=ALPHAS).fit(X - means, (y - mu) / sd)
    out = {"markers": markers, "means": means, "model": model, "mu": mu, "sd": sd, "n_train": len(y)}
    ARTIFACT.parent.mkdir(parents=True, exist_ok=True)
    ARTIFACT.write_bytes(pickle.dumps(out))
    return out


_cache: dict = {}


def model() -> dict:
    if "m" not in _cache:
        _cache["m"] = pickle.loads(ARTIFACT.read_bytes()) if ARTIFACT.exists() else train()
    return _cache["m"]


def read_matrix(text: str) -> dict[str, dict[str, int]]:
    """Lab file in the Jacquotte release layout: first column marker id (chrN:pos:SG), one column per sample,
    cells 0/1/2 (ALT copies) or NA/-/empty. Comma, semicolon or tab separated. Returns sample -> marker -> dosage."""
    lines = [ln for ln in text.splitlines() if ln.strip()]
    sep = max(",;\t", key=lines[0].count)
    head = [h.strip() for h in lines[0].split(sep)][1:]
    out: dict[str, dict[str, int]] = {h: {} for h in head}
    for ln in lines[1:]:
        f = [c.strip() for c in ln.split(sep)]
        for h, v in zip(head, f[1:]):
            if v in ("0", "1", "2"):
                out[h][f[0]] = int(v)
    return out


def predict(dosages: dict[str, float]) -> dict:
    """BPR-like score (lower = fewer rotten pods) for ranking seedlings of one cross, and the share of model markers
    genotyped. dosages: marker id ('chr1:9786:SG') -> ALT copies 0/1/2 (Jacquotte coding); missing markers imputed."""
    m = model()
    x = np.array([dosages.get(k, -1) for k in m["markers"]], np.float32)
    called = x >= 0
    x = np.where(called, x, m["means"])
    v = float(m["model"].predict((x - m["means"])[None])[0] * m["sd"] + m["mu"])
    return {"value": round(v, 2), "coverage": round(float(called.mean()), 3)}


if __name__ == "__main__":
    m = train()
    print(f"trained on {m['n_train']} trees, {len(m['markers'])} markers -> {ARTIFACT}")
