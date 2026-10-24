from cacaoid.engine import impact


def test_aliases_follow_official_names():
    assert impact.canonical("PBC123") == "Sulawesi 1" and impact.canonical("BR25") == "Sulawesi 2"
    assert impact.canonical("M01") == "MCC 01"  # ACIAR HORT/2010/011 p.72: M01 is now MCC 01


def test_same_trial_difference_only(client):
    c = client.get("/api/traits/compare", params={"paid": "Sulawesi 1", "received": "M06"}).json()
    y = [s for s in c["same_trial"] if s["trait"] == "yield_kg_per_1000_trees"]
    assert {s["site"] for s in y} == {"Pinrang", "North Kolaka"} and all(s["pct"] < 0 for s in y)
    assert "31–39% lebih rendah" in c["headlines"][0]
    # pods/score differences are shown as values, never as a % (small counts make % misleading)
    assert all(s["pct"] is None for s in c["same_trial"] if not s["trait"].startswith("yield"))


def test_location_dependent_result_is_said_so():
    h = impact.compare("Sulawesi 1", "MCC 01")["headlines"][0]
    assert "bergantung lokasi" in h and "tidak signifikan" in h


def test_rules_and_unknown_clone(client):
    r = client.get("/api/traits/rules").json()
    assert r["rootstock"] and all(0 <= h["high_damage_pct"] <= 100 for h in r["hybrid_vsd"])
    assert impact.compare("Sulawesi 1", "TIDAK-ADA")["missing"] == ["TIDAK-ADA"]
