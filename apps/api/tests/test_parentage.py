import numpy as np
import pytest

from cacaoid.engine.parentage import Parentage, explain_unknown
from cacaoid.engine.simulate import CLAIMS, child, load_world, noisy, stranger


@pytest.fixture(scope="module")
def world(client):  # client fixture seeds the test database
    refs, panel, freqs = load_world()
    return refs, panel, freqs, Parentage(refs, panel)


def unknown():
    return {"verdict": "TIDAK DIKENAL", "found_as": None, "steps": [], "notes": []}


def test_rootstock_detected_and_random_tree_not(world):
    refs, panel, freqs, par = world
    rng = np.random.default_rng(1)
    roots = [("Hibrida DEMO-1", "TSH1188", "SCA6")]
    names = sorted(refs)
    for _ in range(50):
        kid = noisy(child(refs["TSH1188"], refs["SCA6"], panel, rng, freqs), panel, rng, freqs)
        assert explain_unknown(unknown(), kid, par, roots, [])["verdict"] == "BATANG BAWAH"
        other = noisy(refs[names[rng.integers(len(names))]], panel, rng, freqs)
        half = noisy(child(refs["TSH1188"], stranger(panel, rng, freqs), panel, rng, freqs), panel, rng, freqs)
        assert explain_unknown(unknown(), other, par, roots, [])["verdict"] == "TIDAK DIKENAL"
        assert explain_unknown(unknown(), half, par, roots, [])["verdict"] == "TIDAK DIKENAL"


def test_seed_origin_within_garden(world):
    refs, panel, freqs, par = world
    rng = np.random.default_rng(2)
    right = false_assign = 0
    for _ in range(200):
        a, b = rng.choice(CLAIMS, 2, replace=False)
        r = explain_unknown(unknown(), noisy(child(refs[a], refs[b], panel, rng, freqs), panel, rng, freqs), par, [], CLAIMS)
        right += set(r.get("parentage", {}).get("parents", [])) == {a, b}
        out = noisy(child(stranger(panel, rng, freqs), stranger(panel, rng, freqs), panel, rng, freqs), panel, rng, freqs)
        false_assign += "parentage" in explain_unknown(unknown(), out, par, [], CLAIMS)
    print(f"garden pair right {right / 200:.2f}, outsider assigned {false_assign / 200:.3f}")
    assert right / 200 >= 0.85 and false_assign / 200 <= 0.03
