import numpy as np

from cacaoid.engine.contamination import LotChecker, sample_size, wilson
from cacaoid.engine.parentage import Parentage
from cacaoid.engine.simulate import child, load_world, noisy


def test_sample_size_and_ci():
    assert sample_size(0.05) == 59 and sample_size(0.10) == 29 and sample_size(0.05, power=0.5) > 59
    lo, hi = wilson(0, 20)
    assert lo == 0 and 0.15 < hi < 0.18


def test_contamination_estimate_within_3_points(client):  # client fixture seeds the test database
    refs, panel, freqs = load_world()
    lc = LotChecker(Parentage(refs, panel), refs, freqs)
    rng = np.random.default_rng(4)
    donors = [d for d in refs if d not in ("TSH1188", "SCA6")]
    for true_c in (0.05, 0.10, 0.20, 0.30):
        est = []
        for _ in range(20):
            kids = [noisy(child(refs["TSH1188"], refs[donors[rng.integers(len(donors))]] if rng.random() < true_c else refs["SCA6"],
                                panel, rng, freqs), panel, rng, freqs) for _ in range(200)]
            r = lc.check(kids, "TSH1188", "SCA6", alpha_floor=0.0)  # simulated data: simulated alpha is right
            est.append(r["estimate"])
        print(f"true {true_c:.0%} -> mean estimate {np.mean(est):.1%} (sd {np.std(est):.1%}), power {r['power']}")
        assert abs(np.mean(est) - true_c) <= 0.03


def test_lot_decisions_are_cautious(client):
    refs, panel, freqs = load_world()
    lc = LotChecker(Parentage(refs, panel), refs, freqs)
    rng = np.random.default_rng(9)
    legit = lambda n: [noisy(child(refs["TSH1188"], refs["SCA6"], panel, rng, freqs), panel, rng, freqs) for _ in range(n)]
    donors = [d for d in refs if d not in ("TSH1188", "SCA6")]
    bad = lambda n: [noisy(child(refs["TSH1188"], refs[donors[rng.integers(len(donors))]], panel, rng, freqs), panel, rng, freqs) for _ in range(n)]
    assert lc.check(legit(60), "TSH1188", "SCA6")["decision"] == "LOLOS"
    assert lc.check(legit(48) + bad(12), "TSH1188", "SCA6")["decision"] == "TAHAN"      # 20% of 60
    assert lc.check(legit(16) + bad(4), "TSH1188", "SCA6")["decision"] == "TAMBAH SAMPEL"  # 20 seedlings: too few to judge
