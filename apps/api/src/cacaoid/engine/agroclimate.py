"""Klon mana untuk lokasi mana: find the clone-trial sites whose climate is most like a planting location, then show
what was measured there. An analog lookup, not a model: Indonesian trial data are too sparse to fit one.
Climate: NASA POWER 2001–2025 climatology (no key; ~0.5° grid, so a coarse picture)."""
import csv
import json
import math
import re
import ssl
import urllib.request

from cacaoid import config

DIR = config.DATA / "agroclimate"
CACHE = DIR / "power_cache.json"
URL = ("https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M,PRECTOTCORR,RH2M"
       "&community=AG&longitude={lon:.2f}&latitude={lat:.2f}&format=JSON")
DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
# typical spread between Sulawesi cocoa sites, so one unit of distance means "one usual difference"
try:  # python.org builds on macOS ship without CA certificates
    import certifi
    CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    CTX = ssl.create_default_context()
SCALE = {"rain_mm": 600.0, "dry_months": 1.5, "temp_c": 1.0, "rh_pct": 4.0, "elev_m": 250.0}


def sites() -> list[dict]:
    with open(DIR / "trial_sites.csv", newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def climate(lat: float, lon: float) -> dict:
    """Annual rain, dry months (<100 mm), mean temperature, humidity, grid elevation. Cached on disk."""
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    key = f"{lat:.2f},{lon:.2f}"
    if key not in cache:
        with urllib.request.urlopen(URL.format(lat=lat, lon=lon), timeout=30, context=CTX) as r:
            d = json.load(r)
        p = d["properties"]["parameter"]
        monthly = [p["PRECTOTCORR"][m] * n for m, n in zip(MONTHS, DAYS)]
        cache[key] = {"rain_mm": round(sum(monthly)), "dry_months": sum(x < 100 for x in monthly),
                      "temp_c": p["T2M"]["ANN"], "rh_pct": p["RH2M"]["ANN"],
                      "elev_m": round(d["geometry"]["coordinates"][2]), "monthly_rain_mm": [round(x) for x in monthly]}
        CACHE.write_text(json.dumps(cache, indent=1))
    return cache[key]


def distance(a: dict, b: dict) -> float:
    return math.sqrt(sum(((a[k] - b[k]) / s) ** 2 for k, s in SCALE.items()))


def analogs(lat: float, lon: float, top: int = 3) -> dict:
    here = climate(lat, lon)
    ranked = []
    for s in sites():
        c = climate(float(s["lat"]), float(s["lon"]))
        ranked.append({**s, "climate": c, "distance": round(distance(here, c), 2)})
    ranked.sort(key=lambda r: r["distance"])
    for r in ranked:
        r["similarity"] = "sangat mirip" if r["distance"] < 1 else "mirip" if r["distance"] < 2 else "berbeda"
        r["evidence"] = evidence(r)
    return {"location": {"lat": lat, "lon": lon, "climate": here}, "sites": ranked[:top],
            "caveat": "Iklim dari NASA POWER (grid ±55 km, rata-rata 2001–2025). Titik lokasi uji adalah perkiraan pusat "
                      "kabupaten, bukan titik kebun. Hasil uji klon adalah kondisi uji, bukan janji hasil di kebun petani."}


KEY_TRAITS = ("yield_kg_per_ha", "yield_kg_per_1000_trees", "pods_per_tree", "vsd_incidence_pct", "vsd_score",
              "black_pod_pct", "cpb_damage_pct")


def site_of(text: str, all_sites: list[dict]) -> str | None:
    """Trial-site string from the facts table -> site_id. Sources name the specific place first ("Bone Bone, North
    Luwu", "Lambandia, Kolaka"), so the alias found earliest wins (longest on ties). Strings listing several sites
    ("Pinrang; North Kolaka; Polman") are left out; notes in brackets are ignored."""
    t = re.sub(r"\(.*?\)", "", (text or "").lower()).strip()
    if not t or ";" in t:
        return None
    hits = [(t.find(a), -len(a), s["site_id"]) for s in all_sites for a in s["aliases"].split(";") if a and a in t]
    return min(hits)[2] if hits else None


def evidence(site: dict) -> list[dict]:
    """Facts measured at this trial site, from the curated clone-trait table (data/traits/clone_traits.csv)."""
    path = config.DATA / "traits" / "clone_traits.csv"
    if not path.exists():
        return []
    all_sites = sites()
    with open(path, newline="", encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f)
                if r["trait"] in KEY_TRAITS and site_of(r["site"], all_sites) == site["site_id"]]
    rows.sort(key=lambda r: (KEY_TRAITS.index(r["trait"]), r["canonical_clone"]))
    from cacaoid.engine.impact import TRAITS
    return [{"clone": r["canonical_clone"] or r["clone_as_written"], "trait": r["trait"], "label": TRAITS[r["trait"]][0],
             "value": r["value"],
             "unit": r["unit"], "year": r["year"], "source_id": r["source_id"], "where": r["location_in_source"]}
            for r in rows]
