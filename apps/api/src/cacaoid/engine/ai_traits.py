"""AI prediksi komponen hasil: genomic prediction of yield-component traits from genome-wide SNPs.
Trained on Bekele 2022 (CC BY, 346 genotyped + phenotyped accessions). Model per trait is chosen by
kinship-cluster cross-validation (relatives never split across folds); CV metrics stay internal.
This predicts components (bean count, bean size, pod index), not harvest yield.

    uv run python -m cacaoid.engine.ai_traits      -> artifacts/traits.pkl
"""
import json
import pickle

import numpy as np
import openpyxl
from sklearn.linear_model import Ridge
from sklearn.svm import SVR

from cacaoid import config
from cacaoid.engine.io import parse_hapmap

ARTIFACT = config.ROOT / "artifacts" / "traits.pkl"
TRAITS = {  # column -> (label, unit, higher_is_better)
    "FR_BEN": ("Jumlah biji per buah", "biji", True),
    "FR_BL": ("Panjang biji", "cm", True),
    "FR_BW": ("Lebar biji", "cm", True),
    "PodIndex": ("Pod index (buah per kg biji kering)", "buah", False),
}
MODELS = {
    "RR-BLUP": lambda: Ridge(alpha=300.0),
    "SVR": lambda: SVR(C=3.0, gamma="scale"),
}


def encode(profiles: list[dict], snps: list[str], alleles: list[str], means: np.ndarray) -> np.ndarray:
    """Allele dosage of `alleles[j]`; missing calls take the training mean."""
    X = np.array([[p[s].count(a) if p.get(s) and a in "ACGT" else np.nan for s, a in zip(snps, alleles)]
                  for p in profiles], float)
    return np.where(np.isfinite(X), X, means)


def kinship_folds(X: np.ndarray, k: int = 5, seed: int = 5) -> np.ndarray:
    """Cluster each accession with its 12 closest relatives, then deal clusters into k folds."""
    rng = np.random.default_rng(seed)
    Xc = X - X.mean(0)
    K = Xc @ Xc.T / X.shape[1]
    D = 1 - K / np.sqrt(np.outer(np.diag(K), np.diag(K)))
    order = np.argsort(D, 1)
    cl = -np.ones(len(X), int)
    c = 0
    for i in rng.permutation(len(X)):
        if cl[i] < 0:
            nb = [j for j in order[i][:12] if cl[j] < 0]
            cl[nb] = c
            c += 1
    return rng.permutation(c)[cl] % k


def load_training():
    geno = parse_hapmap(config.DATA / "bekele2022" / "genotypes_hapmap.txt")
    cols = list(zip(*geno.calls))
    snps, alleles = [], []
    for s, col in zip(geno.snps, cols):
        called = [g for g in col if g]
        al = sorted({a for g in called for a in g})
        if len(called) < 0.9 * len(col) or len(al) != 2:
            continue
        f = sum(g.count(al[0]) for g in called) / (2 * len(called))
        if min(f, 1 - f) > 0.05:
            snps.append(s)
            alleles.append(al[0])
    idx = {s: i for i, s in enumerate(geno.samples)}
    rows = list(openpyxl.load_workbook(config.DATA / "bekele2022" / "phenotypes.xlsx", read_only=True)
                .worksheets[0].iter_rows(values_only=True))
    hdr = rows[0]
    profiles, Y, names = [], [], []
    for r in rows[1:]:
        name = str(r[0]).strip() if r[0] else ""
        i = idx.get(name, idx.get(name + "_1"))
        vals = [r[hdr.index(t)] for t in TRAITS]
        if i is None or not all(isinstance(v, (int, float)) for v in vals):
            continue
        profiles.append(dict(zip(geno.snps, geno.calls[i])))
        Y.append(vals)
        names.append(name)
    nanX = np.array([[p[s].count(a) if p.get(s) else np.nan for s, a in zip(snps, alleles)] for p in profiles], float)
    means = np.nanmean(nanX, 0)
    return encode(profiles, snps, alleles, means), np.array(Y, float), snps, alleles, means, names


def cross_validate(X: np.ndarray, y: np.ndarray, make, folds: np.ndarray) -> tuple[float, float]:
    """(Pearson r, RMSE) of out-of-fold predictions."""
    pred = np.zeros(len(y))
    for k in np.unique(folds):
        te = folds == k
        mu, sd = y[~te].mean(), y[~te].std()
        m = make().fit(X[~te], (y[~te] - mu) / sd)
        pred[te] = m.predict(X[te]) * sd + mu
    return float(np.corrcoef(pred, y)[0, 1]), float(np.sqrt(((pred - y) ** 2).mean()))


def train() -> dict:
    X, Y, snps, alleles, means, names = load_training()
    folds = kinship_folds(X)
    out = {"snps": snps, "alleles": alleles, "means": means, "n_train": len(X), "traits": {}}
    for t, col in enumerate(TRAITS):
        y = Y[:, t]
        scores = {name: cross_validate(X, y, make, folds) for name, make in MODELS.items()}
        best = max(scores, key=lambda k: scores[k][0])
        mu, sd = y.mean(), y.std()
        out["traits"][col] = {"model": MODELS[best]().fit(X, (y - mu) / sd), "name": best, "mu": mu, "sd": sd,
                              "cv": {k: {"r": round(r, 3), "rmse": round(e, 3)} for k, (r, e) in scores.items()},
                              "rmse": scores[best][1], "range": [float(y.min()), float(y.max())]}
    ARTIFACT.parent.mkdir(parents=True, exist_ok=True)
    ARTIFACT.write_bytes(pickle.dumps(out))
    # internal record only: never shown in the UI or on slides
    (ARTIFACT.parent / "traits_metrics.json").write_text(json.dumps(
        {"n_train": len(X), "n_snps": len(snps), "cv": {c: v["cv"] for c, v in out["traits"].items()},
         "chosen": {c: v["name"] for c, v in out["traits"].items()}}, indent=2))
    return out


_cache: dict = {}


def model() -> dict:
    """Trained model from disk (trains once if the artifact is missing)."""
    if "m" not in _cache:
        _cache["m"] = pickle.loads(ARTIFACT.read_bytes()) if ARTIFACT.exists() else train()
    return _cache["m"]


def predict(profiles: list[dict]) -> list[dict]:
    """Per profile: trait -> value, 80% interval from CV error, and how many model SNPs were genotyped."""
    m = model()
    X = encode(profiles, m["snps"], m["alleles"], m["means"])
    cover = [sum(bool(p.get(s)) for s in m["snps"]) / len(m["snps"]) for p in profiles]
    out = [{"coverage": round(c, 3), "traits": {}} for c in cover]
    for col, t in m["traits"].items():
        label, unit, up = TRAITS[col]
        vals = t["model"].predict(X) * t["sd"] + t["mu"]
        for o, v in zip(out, vals):
            o["traits"][col] = {"label": label, "unit": unit, "higher_is_better": up, "value": round(float(v), 2),
                                "pm80": round(1.28 * t["rmse"], 2)}
    return out


if __name__ == "__main__":
    m = train()
    print(f"trained on {m['n_train']} accessions, {len(m['snps'])} SNPs ->", ARTIFACT)
    for c, t in m["traits"].items():
        print(f"  {TRAITS[c][0]}: {t['name']}  (internal CV {t['cv']})")
