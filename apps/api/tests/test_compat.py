from cacaoid.engine import compat


def profile(name):
    p = compat.data()["profiles"][compat.k(name)]
    return {m: v for m, v in p.items() if m.startswith("mS")}


def test_self_compatibility_prediction_matches_known_groups():
    assert compat.predict_sc(profile("CATONGO"))["p_sc"] >= 0.9      # Amelonado: self-compatible
    assert compat.predict_sc(profile("Scavina 6"))["p_sc"] <= 0.1    # Scavina: self-incompatible
    assert compat.predict_sc({})["class"] == "tidak diketahui"


def test_incompatible_block_is_flagged_and_fixed_by_a_partner():
    bad = compat.advise(["MCC 02", "THR", "AFQ/MHP-01"], {})
    assert any("0 dari 300" in w for w in bad["warnings"])
    assert any(w.startswith("MCC 02 tidak bisa menyerbuk sendiri") for w in bad["warnings"])
    assert compat.advise(["MCC 02", "BB-01", "Sulawesi 1"], {})["warnings"] == []


def test_identical_fingerprints_are_flagged(client):
    a = {"s1": "AG", "s2": "CC", "s3": "AT"}
    assert compat.similarity(a, dict(a)) == (1.0, 3)
    r = client.post("/api/ai/mix", json={"clones": ["ICS60", "SCA6", "Sulawesi 1"]}).json()
    pair = next(p for p in r["pairs"] if {p["a"], p["b"]} == {"ICS60", "SCA6"})
    assert pair["similarity"] is not None and 0 < pair["similarity"] < 1 and pair["similarity_percentile"] is not None
