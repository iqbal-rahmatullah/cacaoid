import socket

import pytest
from rasterio.errors import RasterioIOError

from cacaoid.engine import eudr


def _online() -> bool:
    try:
        for host in ("jeodpp.jrc.ec.europa.eu", "storage.googleapis.com"):
            socket.create_connection((host, 443), timeout=3).close()
        return True
    except OSError:
        return False


online = pytest.mark.skipif(not _online(), reason="butuh internet (JRC + Hansen dibaca langsung dari server)")


def pt(lat, lon):
    return {"type": "Point", "coordinates": [lon, lat]}


# ---------- offline ----------

def test_hansen_tile_names():
    assert eudr._hansen_tile(120.33, -2.57) == "00N_120E"
    assert eudr._hansen_tile(119.42, -5.14) == "00N_110E"
    assert eudr._hansen_tile(124.84, 1.49) == "10N_120E"   # Manado, north of the equator
    assert eudr._hansen_tile(-60.0, -12.0) == "10S_060W"


def test_bad_geometry_never_crashes():
    huge = {"type": "Polygon", "coordinates": [[[120, -3], [121, -3], [121, -2], [120, -3]]]}   # would read GBs
    for g in [pt(120.33, -2.57), {"type": "LineString", "coordinates": [[0, 0], [1, 1]]}, {"type": "Point"}, None, huge]:
        r = eudr.check_plot(g)   # first one has lat/lon swapped
        assert r["verdict"] == "TIDAK BISA DICEK" and r["reasons"]


def test_network_failure_is_reported_not_raised(monkeypatch):
    def down(url):
        raise RasterioIOError("CURL error: Could not resolve host")
    monkeypatch.setattr(eudr, "_open", down)
    r = eudr.check_plot(pt(-2.57, 120.33))
    assert r["verdict"] == "TIDAK BISA DICEK" and "tidak bisa diakses" in r["reasons"][0]


# ---------- real Sulawesi plots (network) ----------

@online
@pytest.mark.parametrize("name,lat,lon,verdict,forest,loss", [
    ("Luwu Utara, kebun/ladang", -2.57, 120.33, "RENDAH", False, []),
    ("TN Lore Lindu, hutan", -1.45, 120.15, "PERLU CEK", True, []),
    ("Makassar, kota", -5.14, 119.42, "RENDAH", False, []),
    ("Morowali, hutan dibuka 2023", -2.867125, 122.155625, "TINGGI", True, [2023]),
    ("Luwu Timur, bukan hutan tapi pohon hilang 2023", -2.448625, 121.083625, "PERLU CEK", False, [2023]),
])
def test_real_points(name, lat, lon, verdict, forest, loss):
    r = eudr.check_plot(pt(lat, lon))
    assert (r["verdict"], r["forest_2020"], r["loss_after_2020"]) == (verdict, forest, loss), (name, r["reasons"])


@online
def test_polygon_and_cache():
    d, lat, lon = 0.001, -2.57, 120.33   # ~4.9 ha square around the Luwu Utara point
    poly = {"type": "Polygon", "coordinates": [[[lon - d, lat - d], [lon + d, lat - d], [lon + d, lat + d],
                                                [lon - d, lat + d], [lon - d, lat - d]]]}
    r = eudr.check_plot(poly)
    assert r["verdict"] == "RENDAH" and r["pixels"]["jrc_10m"] > 400 and r["pixels"]["hansen_30m"] > 40
    assert eudr.check_plot(poly)["seconds"] < 0.2   # second read comes from GDAL's block cache


# ---------- EUDR Information System GeoJSON (offline) ----------

SQUARE = [[120.33, -2.57], [120.332, -2.57], [120.332, -2.568], [120.33, -2.568]]   # ring left open on purpose


def test_geojson_structure_and_precision():
    fc = eudr.to_eudr_geojson([
        {"geometry": pt(-2.570987654321, 120.330123456789), "producer_name": "Pak Rahman", "area_ha": 1.5,
         "production_place": "Kebun Rahman, Masamba", "plot_id": "LU-001", "clone": "MCC 02", "clone_verified": True,
         "sample_id": "SIM-001", "batch_id": "B-7", "verdict": "RENDAH"},
        {"geometry": {"type": "Polygon", "coordinates": [SQUARE]}, "producer_name": "Bu Sri", "area_ha": 4.9},
    ])
    assert fc["type"] == "FeatureCollection" and [f["type"] for f in fc["features"]] == ["Feature"] * 2
    p0, p1 = (f["properties"] for f in fc["features"])
    assert set(p0) == {"ProducerName", "ProducerCountry", "ProductionPlace", "Area", "CacaoID"}   # exact spec case
    assert p0["ProducerCountry"] == "ID" and p0["Area"] == 1.5 and isinstance(p0["Area"], float)
    assert p0["CacaoID"] == {"plot_id": "LU-001", "clone": "MCC 02", "clone_verified": True, "sample_id": "SIM-001",
                             "batch_id": "B-7", "verdict": "RENDAH"}
    assert "CacaoID" not in p1
    assert fc["features"][0]["geometry"] == {"type": "Point", "coordinates": [120.330123, -2.570988]}  # [lon, lat], 6 dp
    ring = fc["features"][1]["geometry"]["coordinates"][0]
    assert ring[0] == ring[-1] and len(ring) == 5   # closed for us
    for f in fc["features"]:
        for x in eudr._pairs(f["geometry"]["coordinates"]):
            assert all(round(v, 6) == v for v in x)


def test_geojson_drops_duplicates_from_rounding_and_keeps_multipolygon():
    ring = [[120.33, -2.57], [120.3300001, -2.57], [120.332, -2.57], [120.332, -2.568], [120.33, -2.57]]
    g = eudr.to_eudr_geojson([{"geometry": {"type": "Polygon", "coordinates": [ring]}}])["features"][0]["geometry"]
    assert len(g["coordinates"][0]) == 4
    mp = {"type": "MultiPolygon", "coordinates": [[SQUARE], [[[p[0] + 0.01, p[1]] for p in SQUARE]]]}
    assert eudr.to_eudr_geojson([{"geometry": mp}])["features"][0]["geometry"]["type"] == "MultiPolygon"


@pytest.mark.parametrize("plot,msg", [
    ({"geometry": pt(-2.57, 120.33), "area_ha": 6.0}, "wajib poligon"),                      # Art. 2(28): > 4 ha
    ({"geometry": pt(-2.57, 120.33), "area_ha": "3"}, "angka"),                              # IS reads "3" as 0
    ({"geometry": {"type": "Polygon", "coordinates": [SQUARE, SQUARE]}}, "berlubang"),        # holes rejected
    ({"geometry": {"type": "Polygon", "coordinates": [[[0, 0], [1, 1], [1, 0], [0, 1]]]}}, "memotong"),  # figure 8
    ({"geometry": {"type": "Polygon", "coordinates": [[[0, 0], [1, 1], [2, 2]]]}}, "segaris"),
    ({"geometry": {"type": "LineString", "coordinates": [[0, 0], [1, 1]]}}, "Point, Polygon"),
    ({"geometry": pt(-2.57, 120.33), "producer_country": "Indonesia"}, "ISO2"),
])
def test_geojson_rejects_what_the_eu_system_rejects(plot, msg):
    with pytest.raises(ValueError, match=f"^plot X-9: .*{msg}"):   # names the plot the officer must fix
        eudr.to_eudr_geojson([{**plot, "plot_id": "X-9"}])
