from cacaoid.engine import agroclimate as ac


def test_distance_and_analog_ranking():
    a = {"rain_mm": 2000, "dry_months": 3, "temp_c": 26.0, "rh_pct": 82, "elev_m": 100}
    assert ac.distance(a, dict(a)) == 0
    assert ac.distance(a, {**a, "rain_mm": 2600}) == 1.0  # one "usual difference" in rainfall
    r = ac.analogs(-5.40, 119.95)  # dry south (Jeneponto); served from the climate cache when offline
    assert r["sites"][0]["name"] == "Soppeng" and r["sites"][0]["similarity"] == "sangat mirip"
    assert [s["distance"] for s in r["sites"]] == sorted(s["distance"] for s in r["sites"])


def test_no_false_analog_for_highlands():
    r = ac.analogs(-2.40, 120.20)  # ~1,200 m hills: no trial site is like this
    assert all(s["similarity"] == "berbeda" for s in r["sites"])


def test_trial_site_names_map_to_one_place():
    s = ac.sites()
    assert ac.site_of("Bone Bone, North Luwu", s) == "bone_bone"
    assert ac.site_of("North Luwu (35 farmer farms; MCC 01 on 13)", s) == "luwu_utara"
    assert ac.site_of("North Kolaka", s) == "kolaka_utara" and ac.site_of("Lambandia, Kolaka", s) == "kolaka"
    assert ac.site_of("Pinrang; North Kolaka; Polman", s) is None
