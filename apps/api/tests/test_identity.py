import numpy as np
import pytest

from cacaoid.config import DATA
from cacaoid.engine.identity import Matcher, key, max_allowed, usable
from cacaoid.engine.io import parse_hapmap
from cacaoid.engine.registry import build_registry, encode, genotype_freqs, mismatch, select_panel
from cacaoid.engine.simulate import noisy


@pytest.fixture(scope="module")
def world():
    geno = parse_hapmap(DATA / "bekele2022" / "genotypes_hapmap.txt")
    reg = build_registry(geno)
    good = [c for c in reg if c.status == "referensi"]
    panel = select_panel([c.profile for c in good], geno.snps)
    m = Matcher(reg, panel)
    return reg, [c for c in good if c in m.refs], panel, m, genotype_freqs([c.profile for c in good], panel)


def test_helpers():
    assert key("ICS 60") == key("ics-60") == key("ICS60 (varian b)") == "ICS60"
    assert max_allowed(48) >= 2 and max_allowed(48) < max_allowed(200)


def panel_diff(a, b, panel):
    return mismatch(*encode([[a.profile.get(s) for s in panel], [b.profile.get(s) for s in panel]]))[0]


def test_offtype_simulation(world):
    """Nursery claims clone x; 15% of trees are other clones; 2% lab error, 5% missing."""
    reg, good, panel, m, freqs = world
    rng = np.random.default_rng(1)
    tp = fp = fn = tn = retest = 0
    for _ in range(1500):
        x = good[rng.integers(len(good))]
        truth = good[rng.integers(len(good))] if rng.random() < 0.15 else x
        d = panel_diff(x, truth, panel)
        if 0 < d < 3:  # registry near-duplicates, indistinguishable by design
            continue
        v = m.identify("s", noisy(truth.profile, panel, rng, freqs), x.name)["verdict"]
        if v == "UJI ULANG":
            retest += 1
            continue
        flag, off = v in ("OFF-TYPE", "TIDAK DIKENAL"), d >= 3
        tp += flag and off; fp += flag and not off; fn += off and not flag; tn += not (flag or off)
    print(f"recall {tp/(tp+fn):.3f} precision {tp/(tp+fp):.3f} retest {retest}")
    assert tp / (tp + fn) >= 0.99 and tp / (tp + fp) >= 0.98


def test_close_relatives_not_cocok(world):
    reg, good, panel, m, freqs = world
    rng = np.random.default_rng(2)
    E = encode([[c.profile.get(s) for s in panel] for c in good])
    pairs = []
    for i in range(len(good)):
        ok = (E >= 0) & (E[i] >= 0)
        d = ((E != E[i]) & ok).sum(1)
        pairs += [(int(d[j]), i, j) for j in range(i + 1, len(good)) if d[j] >= 3]
    for d, i, j in sorted(pairs)[:30]:
        r = m.identify("s", noisy(good[j].profile, panel, rng, freqs, miss=0.0), good[i].name)
        assert r["verdict"] != "COCOK", (good[i].name, good[j].name, d, r["steps"])


def test_verdict_paths(world):
    reg, good, panel, m, freqs = world
    ics60 = next(c for c in good if c.name == "ICS60")
    r = m.identify("a", dict(ics60.profile), "ICS 60")
    assert r["verdict"] == "COCOK" and r["chance_log10"] < -10 and r["steps"][-1]["ok"]
    sca6 = next(c for c in good if c.name == "SCA6")
    r = m.identify("b", dict(sca6.profile), "ICS60")
    assert r["verdict"] == "OFF-TYPE" and r["found_as"] == "SCA6" and r["lod"] > 5 and r["claimed_ref"] == "ICS60"
    assert m.identify("c", {s: None for s in panel}, "ICS60")["verdict"] == "UJI ULANG"
    thin = next(c for c in reg if c.status == "referensi" and not usable(c.profile, panel))
    full = noisy(thin.profile, panel, np.random.default_rng(4), freqs, err=0, miss=0)  # the tree itself is complete
    assert m.identify("t", full, thin.name)["verdict"] == "BELUM ADA REFERENSI"
    r = m.identify("d", dict(ics60.profile), "MCC 02")
    assert r["verdict"] == "BELUM ADA REFERENSI" and r["found_as"] == "ICS60"
    # unrelated random genotype: matches nobody
    rand = {s: str(rng_choice) for s, rng_choice in zip(panel, np.random.default_rng(3).choice(["AA", "CC", "GG", "TT"], len(panel)))}
    assert m.identify("e", rand, "ICS60")["verdict"] == "TIDAK DIKENAL"


def test_just_past_lab_error_limit_suggests_rerun(world):
    reg, good, panel, m, freqs = world
    ics60 = next(c for c in good if c.name == "ICS60")
    sample = dict(ics60.profile)
    for s in [s for s in panel if ics60.profile.get(s)][:max_allowed(48) + 1]:  # one mismatch past the limit
        sample[s] = next(g for g in freqs[s] if g != ics60.profile[s])
    r = m.identify("near", sample, "ICS60")
    assert r["verdict"] == "TIDAK DIKENAL" and any("Uji ulang" in n for n in r["notes"]), r
