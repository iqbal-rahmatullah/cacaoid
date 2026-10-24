"""Hybrid seed lot QC: share of seedlings sired by outside pollen, and how many seedlings to sample.
Ported from legacy-scripts/pollen.py: raw exclusion rate corrected for false exclusions (alpha, lab error)
and for contaminants the panel cannot exclude (power), both estimated by simulation."""
import math
from functools import lru_cache

import numpy as np

from cacaoid import config
from cacaoid.engine.parentage import Parentage
from cacaoid.engine.simulate import child, noisy


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return 0.0, 1.0
    p, d = k / n, 1 + z * z / n
    c, h = (p + z * z / (2 * n)) / d, z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return max(c - h, 0.0), min(c + h, 1.0)


def sample_size(rate: float, power: float = 1.0, confidence: float = 0.95) -> int:
    """Seedlings to test so at least one off-type shows up with `confidence` when the true share is `rate`."""
    return math.ceil(math.log(1 - confidence) / math.log(1 - rate * power))


class LotChecker:
    def __init__(self, par: Parentage, refs: dict, freqs: dict):
        self.par, self.refs, self.freqs = par, refs, freqs
        self.rates = lru_cache(maxsize=32)(self._rates)

    def _rates(self, p1: str, p2: str, n: int = 400) -> tuple[float, float]:
        """(alpha, power): exclusion rate of true offspring and of outside-pollen offspring, by simulation."""
        rng, panel, f = np.random.default_rng(0), self.par.panel, self.freqs
        lab = lambda g: noisy(g, panel, rng, f)
        legit = [lab(child(self.refs[p1], self.refs[p2], panel, rng, f)) for _ in range(n)]
        # outside pollen lands on the seed parent (contaminants share p1); donors are other registry clones,
        # which include relatives of p2, so power is not flattered by unrelated pollen
        donors = [d for d in self.refs if d not in (p1, p2)]
        cont = [lab(child(self.refs[p1], self.refs[donors[rng.integers(len(donors))]], panel, rng, f))
                for _ in range(n)]
        ex = lambda kids: sum(not self.par.test_pair(k, p1, p2)["ok"] for k in kids) / n
        return ex(legit), ex(cont)

    def check(self, kids: list[dict], p1: str, p2: str, alpha_floor: float | None = None) -> dict:
        """alpha_floor: lowest false-exclusion rate to assume (default from config by panel size; 0 only for tests
        on simulated data, whose noise model the simulated alpha already matches)."""
        tests = [self.par.test_pair(k, p1, p2) for k in kids]
        n, k = len(tests), sum(not t["ok"] for t in tests)
        alpha_sim, power = self.rates(p1, p2)
        if alpha_floor is None:
            alpha_floor = config.LOT_ALPHA_FLOOR_SMALL if len(self.par.panel) < 96 else config.LOT_ALPHA_FLOOR_LARGE
        alpha = max(alpha_sim, alpha_floor)
        fix = lambda r: min(max((r - alpha) / max(power - alpha, 1e-9), 0.0), 1.0)
        lo, hi = wilson(k, n)
        est = fix(k / n) if n else 0.0
        needed = sample_size(config.LOT_CONTAM_MAX, power)
        # enough seedlings: the (floor-corrected) estimate decides; too few: hold only on clear evidence
        if fix(lo) > config.LOT_CONTAM_MAX or (n >= needed and est > config.LOT_CONTAM_MAX):
            decision = "TAHAN"
        elif n >= needed:
            decision = "LOLOS"
        else:
            decision = "TAMBAH SAMPEL"
        return {"parents": [p1, p2], "n": n, "excluded": k, "estimate": round(est, 3),
                "ci": [round(fix(lo), 3), round(fix(hi), 3)], "alpha": round(alpha, 3), "power": round(power, 3),
                "decision": decision, "needed_n": needed, "tests": tests}
