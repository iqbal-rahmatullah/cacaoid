"""F5: Parentage + LotChecker (engine as-is) on REAL cacao F1 progeny with known crosses.

Data: Jacquotte et al. (2026) Plant Genome, Dryad doi:10.5061/dryad.0rxwdbsg4 (CC0). 495 F1 trees from 8 full-sib
crosses of 6 parents, 24,218 LD-pruned SNPs coded 0/1/2. The parents are NOT genotyped in the release, so their
genotypes are inferred by maximum likelihood from one half of each family (train) and every test runs on the other
half (test), both ways (2 folds). Offspring get 2% miscalls + 5% missing on top of the real calls (simulate.noisy).

    cd apps/api && uv run python scripts/benchmark_real_parentage.py [dryad.zip]   # fetches + caches data on first run
"""
import csv
import io
import json
import subprocess
import sys
import tempfile
import zipfile
from collections import defaultdict
from concurrent.futures import ProcessPoolExecutor
from itertools import combinations, product

import numpy as np

from cacaoid import config
from cacaoid.engine.contamination import LotChecker, wilson
from cacaoid.engine.identity import max_allowed
from cacaoid.engine.parentage import OK, T, Parentage
from cacaoid.engine.simulate import noisy

URL = "https://datadryad.org/api/v2/versions/467382/download"  # public API, whole-version zip (132 MB), no token
OUT = config.DATA / "benchmark"
NPZ = OUT / "jacquotte2026_pruned.npz"
GENO = np.array(["AA", "AB", "BB"])
SIZES, RANDOM_REPS, LOT_N, LOT_REPS, LEVELS = (48, 96, 192), 5, 60, 10, (0.0, 0.05, 0.10, 0.20, 0.30)
MIN_GAP = np.log(1000)  # parent genotypes kept only where the best combination beats the runner-up 1000:1


def build(src=None):
    """Download the Dryad zip once (or use `src`) and cache the pruned 0/1/2 matrix + family labels as a small npz."""
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        if not src:  # curl: system CA store (python.org macOS builds ship without one)
            src = f"{tmp}/dryad.zip"
            subprocess.run(["curl", "-sSfL", "-o", src, URL], check=True)
        zf = zipfile.ZipFile(src)
        pop = {r["id"]: r["Pop"] for r in csv.DictReader(io.TextIOWrapper(zf.open("Phenotypic.data.csv")))}
        with io.TextIOWrapper(zf.open("geno_012_cacao.QC.prunned.csv")) as f:
            ids = next(f).rstrip("\n").split(",")[1:]
            snps, rows = [], []
            for line in f:
                s, *v = line.rstrip("\n").split(",")
                snps.append(s)
                rows.append(np.array(v, dtype=np.int8))  # raises on NA: the release is imputed, fail loudly if not
    np.savez_compressed(NPZ, G=np.array(rows).T, ids=ids, snps=snps, pop=[pop[i] for i in ids])


def infer_parents(G, cross_of, crosses, n_par, eps=0.02):
    """ML dosage of every parent per SNP from offspring counts of all families jointly (3^6 combinations)."""
    N = np.stack([np.stack([(G[cross_of == f] == c).sum(0) for c in range(3)], 1) for f in range(len(crosses))], 1)
    combos = np.array(list(product(range(3), repeat=n_par)))
    P = np.stack([(1 - eps) * T[combos[:, a], combos[:, b]] + eps / 3 for a, b in crosses], 1)
    LL = N.reshape(len(N), -1).astype(float) @ np.log(P).reshape(len(combos), -1).T
    top = np.argsort(-LL, 1)[:, :2]
    r = np.arange(len(LL))
    return combos[top[:, 0]], LL[r, top[:, 0]] - LL[r, top[:, 1]]


def greedy(Pg, crosses, size):
    """Panel maximising expected exclusions of every wrong parent pair for every real cross (capped coverage)."""
    pairs = list(combinations(range(Pg.shape[1]), 2))
    X = np.zeros((len(Pg), len(crosses), len(pairs)))
    for t, (a, b) in enumerate(crosses):
        Tt = T[Pg[:, a], Pg[:, b]]
        for w, (c, d) in enumerate(pairs):
            if {a, b} != {c, d}:
                X[:, t, w] = (Tt * ~OK[Pg[:, c], Pg[:, d]]).sum(1)
    cap, E, chosen = 3 * (max_allowed(size) + 1), np.zeros(X.shape[1:]), []
    for _ in range(size):
        gain = (np.minimum(E + X, cap) - np.minimum(E, cap)).sum((1, 2))
        gain[chosen] = -1
        chosen.append(int(gain.argmax()))
        E += X[chosen[-1]]
    return chosen


def run_panel(job):
    """All tests for one (fold, panel). Returns raw counters; aggregation happens in main."""
    fold, kind, size, rep, d = job
    rng = np.random.default_rng(1000 * fold + 10 * size + rep)
    names, crosses, cols = d["names"], d["crosses"], d["pool"]
    idx = d["greedy"][size] if kind == "greedy" else rng.choice(len(cols), size, replace=False)
    panel = [d["snps"][cols[j]] for j in idx]
    refs = {n: dict(zip(panel, GENO[d["Pg"][idx, i]])) for i, n in enumerate(names)}
    Gt = d["G"][:, [cols[j] for j in idx]]
    freqs = {s: {str(g): float(f) for g, f in zip(GENO, np.bincount(Gt[d["train"], j], minlength=3) / len(d["train"]))
                 if f > 0} for j, s in enumerate(panel)}
    par = Parentage(refs, panel)
    # variant: "unrelated tree" frequencies from the training F1s instead of the 6 parents (registry-size effect)
    parF = Parentage(refs, panel)
    parF.F = np.array([[max(float((Gt[d["train"], j] == 2 - c).mean()), 0.01) for c in range(3)]
                       for j in range(len(panel))])
    kid = lambda i: noisy(dict(zip(panel, GENO[Gt[i]])), panel, rng, freqs)
    c = defaultdict(int)
    real_excl = real_n = 0
    raw = []  # per test tree: [tree, cross, (exclusions, allowed, lod) x all 15 pairs] for the threshold sweep
    for i in d["test"]:
        a, b = crosses[d["cross_of"][i]]
        A, B = names[a], names[b]
        m = ~OK[d["Pg"][idx, a], d["Pg"][idx, b], Gt[i]]  # real calls vs inferred parents, before added noise
        real_excl, real_n = real_excl + int(m.sum()), real_n + len(m)
        calls = kid(i)
        raw.append([i, d["cross_of"][i]] + [v for x, y in combinations(range(len(names)), 2)
                                            for t in [par.test_pair(calls, names[x], names[y])]
                                            for v in (t["exclusions"], t["allowed"], t["lod"])])
        for tag, p in (("", par), ("F1freq_", parF)):
            s = p.search(calls, names)
            hit = s is not None and set(s["parents"]) == {A, B}
            c[tag + ("none" if s is None else "correct_unique" if hit and "ambiguous_with" not in s
                     else "correct_ambiguous" if hit else "wrong")] += 1
            c[tag + "n"] += 1
            c[tag + "true_pair_ok"] += p.test_pair(calls, A, B)["ok"]
            for x, y in crosses:  # (ii) the other 7 real crosses
                if {x, y} != {a, b}:
                    k = "share1" if {x, y} & {a, b} else "share0"
                    c[f"{tag}wrong_{k}_n"] += 1
                    c[f"{tag}wrong_{k}_ok"] += p.test_pair(calls, names[x], names[y])["ok"]
            # outsiders: both true parents missing from the garden, or only the pollen parent missing
            c[tag + "out2_n"] += 1
            c[tag + "out2_assigned"] += p.search(calls, [n for n in names if n not in (A, B)]) is not None
            for gone in (A, B):
                c[tag + "out1_n"] += 1
                c[tag + "out1_assigned"] += p.search(calls, [n for n in names if n != gone]) is not None
    lots = []
    if kind == "greedy" or rep == 0:  # (iii) synthetic hybrid lots, engine LotChecker as-is
        lc = LotChecker(par, refs, freqs)
        by_cross = defaultdict(list)
        for i in d["test"]:
            by_cross[d["cross_of"][i]].append(i)
        for f, (a, b) in enumerate(crosses):
            for mom, dad in ((a, b), (b, a)):  # outside pollen lands on the seed parent: half-sib contaminants
                cont = [i for g, xy in enumerate(crosses) if g != f and mom in xy for i in by_cross[g]]
                for lvl in LEVELS:
                    k = round(lvl * LOT_N)
                    for _ in range(LOT_REPS):
                        kids = [kid(i) for i in [*rng.choice(by_cross[f], LOT_N - k), *rng.choice(cont, k)]]
                        r = lc.check(kids, names[mom], names[dad])
                        alpha, power = lc.rates(names[mom], names[dad])
                        lots.append((lvl, r["estimate"], r["ci"][0] <= k / LOT_N <= r["ci"][1], r["decision"],
                                     alpha, power, k / LOT_N, r["excluded"]))
    return {"fold": fold, "kind": kind, "size": size, "rep": rep, "c": dict(c), "lots": lots,
            "real_excl": real_excl, "real_n": real_n, "raw": np.array(raw, float)}


def main():
    if not NPZ.exists():
        print("fetching Dryad doi:10.5061/dryad.0rxwdbsg4 via public API ...", file=sys.stderr)
        build(sys.argv[1] if len(sys.argv) > 1 else None)
    z = np.load(NPZ)
    G, snps, pop = z["G"], list(z["snps"]), list(z["pop"])
    crosses_named = sorted(set(pop))
    names = sorted({p for x in crosses_named for p in x.split(" x ")})
    crosses = [tuple(names.index(p) for p in x.split(" x ")) for x in crosses_named]
    cross_of = np.array([crosses_named.index(p) for p in pop])
    rng = np.random.default_rng(7)
    half = np.zeros(len(G), int)
    for f in range(len(crosses)):  # split each family 50/50
        i = np.where(cross_of == f)[0]
        half[rng.permutation(i)[: len(i) // 2]] = 1
    jobs, meta = [], {}
    for fold in (0, 1):
        train, test = np.where(half == fold)[0], np.where(half != fold)[0]
        Pg, gap = infer_parents(G[train], cross_of[train], crosses, len(names))
        maf = G[train].mean(0) / 2
        maf = np.minimum(maf, 1 - maf)
        poly = Pg.min(1) != Pg.max(1)
        pool = np.where((gap >= MIN_GAP) & poly & (maf >= 0.2))[0]
        meta[fold] = {"snps": len(snps), "confident": int((gap >= MIN_GAP).sum()), "confident_poly": int(
            ((gap >= MIN_GAP) & poly).sum()), "pool": len(pool), "n_train": len(train), "n_test": len(test)}
        d = {"names": names, "crosses": crosses, "pool": pool, "snps": snps, "Pg": Pg[pool], "G": G, "train": train,
             "test": test, "cross_of": cross_of, "greedy": {s: greedy(Pg[pool], crosses, s) for s in SIZES}}
        jobs += [(fold, "greedy", s, 0, d) for s in SIZES]
        jobs += [(fold, "random", s, r, d) for s in SIZES for r in range(RANDOM_REPS)]
    with ProcessPoolExecutor() as ex:
        res = list(ex.map(run_panel, jobs))
    report(res, meta, names, crosses_named)
    sweep(res, names, crosses, crosses_named, list(z["ids"]))


def pct(a, b):
    return f"{100 * a / b:.1f}%" if b else "-"


def report(res, meta, names, crosses_named):
    print("parents:", ", ".join(names))
    print("crosses:", "; ".join(crosses_named))
    print("fold meta:", json.dumps(meta))
    agg = defaultdict(lambda: defaultdict(int))
    lots = defaultdict(list)
    for r in res:
        for k, v in r["c"].items():
            agg[(r["kind"], r["size"])][k] += v
        agg[(r["kind"], r["size"])]["real_excl"] += r["real_excl"]
        agg[(r["kind"], r["size"])]["real_n"] += r["real_n"]
        lots[(r["kind"], r["size"])] += r["lots"]
    out = {}
    for tag, title in (("", "engine as-is (unrelated-tree freqs from the 6 parents)"),
                       ("F1freq_", "variant: unrelated-tree freqs from training F1s")):
        print(f"\n## Parentage, {title}")
        print("| panel | SNPs | n | correct unique | correct ambiguous | wrong pair | none | true pair passes "
              "| wrong cross passes (shares 1 parent) | wrong cross passes (shares 0) | outsider: both parents absent "
              "| outsider: 1 parent absent | real Mendelian excl./SNP (pre-noise) |")
        print("|---|---|---|---|---|---|---|---|---|---|---|---|---|")
        for kind in ("random", "greedy"):
            for s in SIZES:
                a, n = agg[(kind, s)], agg[(kind, s)][tag + "n"]
                row = [pct(a[tag + k], n) for k in ("correct_unique", "correct_ambiguous", "wrong", "none",
                                                    "true_pair_ok")]
                row += [pct(a[f"{tag}wrong_share1_ok"], a[f"{tag}wrong_share1_n"]),
                        pct(a[f"{tag}wrong_share0_ok"], a[f"{tag}wrong_share0_n"]),
                        pct(a[tag + "out2_assigned"], a[tag + "out2_n"]),
                        pct(a[tag + "out1_assigned"], a[tag + "out1_n"]), pct(a["real_excl"], a["real_n"])]
                print(f"| {kind} | {s} | {n} | " + " | ".join(row) + " |")
                out[f"{tag}{kind}_{s}"] = dict(a)
    print(f"\n## Lot contamination (LotChecker as-is, n={LOT_N} seedlings/lot, half-sib contaminants)")
    print("| panel | SNPs | true % | lots | mean estimate | RMSE | CI covers truth | TAHAN rate | mean alpha | mean power |")
    print("|---|---|---|---|---|---|---|---|---|---|")
    for kind in ("random", "greedy"):
        for s in SIZES:
            L = lots[(kind, s)]
            for lvl in LEVELS:
                x = [l for l in L if l[0] == lvl]
                est = np.array([l[1] for l in x])
                truth = x[0][6]
                print(f"| {kind} | {s} | {100 * truth:.1f} | {len(x)} | {100 * est.mean():.1f} | "
                      f"{100 * np.sqrt(((est - truth) ** 2).mean()):.1f} | {pct(sum(l[2] for l in x), len(x))} | "
                      f"{pct(sum(l[3] == 'TAHAN' for l in x), len(x))} | {np.mean([l[4] for l in x]):.3f} | "
                      f"{np.mean([l[5] for l in x]):.3f} |")
                out[f"lot_{kind}_{s}_{lvl}"] = {"mean_est": float(est.mean()), "truth": truth, "n_lots": len(x)}
    (OUT / "F5_results.json").write_text(json.dumps({"meta": meta, "results": out}, indent=1, default=int))


def emulate(T3, cand, L=config.PARENT_LOD, slack=0):
    """Parentage.search replayed on stored test_pair results (kids x 15 pairs x (excl, allowed, lod)) with other
    thresholds: index of the returned pair, or -1. Same tie order as the engine (stable sort, pair order)."""
    ok = (T3[..., 0] <= T3[..., 1] + slack) & (T3[..., 2] >= L)
    top = np.where(cand, T3[..., 2], -np.inf).argmax(1)
    r = np.arange(len(T3))
    return np.where(ok[r, top] & cand[r, top], top, -1)


def sweep(res, names, crosses, crosses_named, ids):
    pairs = list(combinations(range(len(names)), 2))
    true_of = np.array([pairs.index(tuple(sorted(x))) for x in crosses])
    has = np.array([[p in pr for pr in pairs] for p in range(len(names))])  # parent x pair
    real = np.array([pr in {tuple(sorted(x)) for x in crosses} for pr in pairs])
    by = defaultdict(list)
    for r in res:
        by[(r["kind"], r["size"])].append(r)

    def stats(raw, L, slack):
        T3, cr = raw[:, 2:].reshape(len(raw), len(pairs), 3), raw[:, 1].astype(int)
        t = true_of[cr]
        a, b = (np.array([crosses[c][k] for c in cr]) for k in (0, 1))
        full = emulate(T3, np.ones((len(raw), len(pairs)), bool), L, slack)
        out2 = emulate(T3, ~has[a] & ~has[b], L, slack)
        out1 = np.r_[emulate(T3, ~has[a], L, slack), emulate(T3, ~has[b], L, slack)]
        ok = (T3[..., 0] <= T3[..., 1] + slack) & (T3[..., 2] >= L)
        sh1 = real & (has[a] | has[b]) & ~(has[a] & has[b])
        return {"correct": (full == t).mean(), "wrong": ((full >= 0) & (full != t)).mean(), "full": full, "t": t,
                "out2": (out2 >= 0).mean(), "out1": (out1 >= 0).mean(), "sh1": ok[sh1].mean(), "T3": T3, "cr": cr}

    # runnable check: the replay must reproduce the engine's own search() at the default thresholds
    for key, rs in by.items():
        st, a = stats(np.vstack([r["raw"] for r in rs]), config.PARENT_LOD, 0), defaultdict(int)
        for r in rs:
            for k, v in r["c"].items():
                a[k] += v
        assert abs(st["correct"] - (a["correct_unique"] + a["correct_ambiguous"]) / a["n"]) < 0.01, key
        assert abs(st["out1"] - a["out1_assigned"] / a["out1_n"]) < 0.01, key

    print("\n## Threshold sweep (replayed engine search; slack = extra exclusions allowed over max_allowed)")
    print("| panel | SNPs | PARENT_LOD | slack | correct | wrong pair | outsider 1 absent | outsider 2 absent "
          "| wrong cross (shares 1) passes |")
    print("|---|---|---|---|---|---|---|---|---|")
    for kind, size in (("random", 48), ("random", 96), ("random", 192), ("greedy", 48), ("greedy", 96)):
        raw = np.vstack([r["raw"] for r in by[(kind, size)]])
        for L in (2.0, 3.0, 4.0, 5.0):
            for slack in (0, 2):
                st = stats(raw, L, slack)
                print(f"| {kind} | {size} | {L:g} | +{slack} | " + " | ".join(
                    pct(st[k] * 1000, 1000) for k in ("correct", "wrong", "out1", "out2", "sh1")) + " |")

    print("\n## Per cross, engine defaults (correct / no pair / wrong pair; most frequent wrong pair)")
    print("| cross | random 48 | greedy 48 | random 192 |\n|---|---|---|---|")
    cols = {}
    for key in (("random", 48), ("greedy", 48), ("random", 192)):
        st = stats(np.vstack([r["raw"] for r in by[key]]), config.PARENT_LOD, 0)
        cols[key] = st
    for f, nm in enumerate(crosses_named):
        cells = []
        for key, st in cols.items():
            m = st["cr"] == f
            full, t = st["full"][m], st["t"][m]
            wrong = full[(full >= 0) & (full != t)]
            top = f" (→ {' × '.join(names[i] for i in pairs[np.bincount(wrong).argmax()])})" if len(wrong) else ""
            cells.append(f"{pct((full == t).sum(), len(full))} / {pct((full < 0).sum(), len(full))} / "
                         f"{pct(len(wrong), len(full))}{top}")
        print(f"| {nm} | " + " | ".join(cells) + " |")

    print("\n## Why true offspring get no pair (engine defaults, true pair test fails)")
    for key in (("random", 48), ("greedy", 48), ("random", 192)):
        raw = np.vstack([r["raw"] for r in by[key]])
        st = stats(raw, config.PARENT_LOD, 0)
        tt = st["T3"][np.arange(len(raw)), st["t"]]
        fail = ~((tt[:, 0] <= tt[:, 1]) & (tt[:, 2] >= config.PARENT_LOD))
        ex, lo = tt[fail, 0] > tt[fail, 1], tt[fail, 2] < config.PARENT_LOD
        trees = defaultdict(lambda: [0, 0])
        for row, fl in zip(raw, fail):
            trees[int(row[0])][0] += fl
            trees[int(row[0])][1] += 1
        worst = sorted(trees.items(), key=lambda kv: -kv[1][0] / kv[1][1])[:8]
        print(f"- {key[0]} {key[1]}: fail {pct(fail.sum(), len(fail))}; of failures: too many exclusions "
              f"{pct((ex & ~lo).sum(), fail.sum())}, LOD<3 only {pct((lo & ~ex).sum(), fail.sum())}, both "
              f"{pct((ex & lo).sum(), fail.sum())}; trees failing in >=50% of their tests: "
              f"{sum(v[0] / v[1] >= 0.5 for v in trees.values())}/{len(trees)}; worst: "
              + ", ".join(f"{ids[i]} {v[0]}/{v[1]}" for i, v in worst))

    print("\n## Lot decision rules on the same lots (TAHAN rate; mean estimate in brackets)")
    print("| panel | SNPs | rule | 0% | 5% | 10% | 20% | 30% |\n|---|---|---|---|---|---|---|---|")
    for key in (("random", 48), ("random", 96), ("random", 192), ("greedy", 48)):
        lots = [l for r in by[key] for l in r["lots"]]
        for rule, floor, use_lo in (("as-is", 0, False), ("alpha floor 0.03", 0.03, False),
                                    ("alpha floor 0.05", 0.05, False), ("hold only if CI low > 5%", 0, True)):
            cells = []
            for lvl in LEVELS:
                h, e = [], []
                for l in (l for l in lots if l[0] == lvl):
                    al, pw, k = max(l[4], floor), l[5], l[7]
                    fix = lambda x: min(max((x - al) / max(pw - al, 1e-9), 0.0), 1.0)
                    est = fix(k / LOT_N)
                    h.append((fix(wilson(k, LOT_N)[0]) if use_lo else est) > config.LOT_CONTAM_MAX)
                    e.append(est)
                cells.append(f"{pct(sum(h), len(h))} ({100 * np.mean(e):.1f})")
            print(f"| {key[0]} | {key[1]} | {rule} | " + " | ".join(cells) + " |")


if __name__ == "__main__":
    main()
