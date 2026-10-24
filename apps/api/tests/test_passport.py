import json

import pytest

from cacaoid.engine import eudr
from cacaoid.engine.simulate import load_world, write


@pytest.fixture
def batch(client, tmp_path):
    field, lab, _ = write(tmp_path, *load_world())
    bid = client.post("/api/batches", data={"name": "paspor"}, files={"field": field.open("rb")}).json()["id"]
    client.post(f"/api/batches/{bid}/lab", files={"lab": lab.open("rb")})
    client.post(f"/api/batches/{bid}/analyze")
    return bid


def test_geojson_only_verified_plots_with_gps(client, batch):
    r = client.get(f"/api/batches/{batch}/eudr.geojson")
    fc = json.loads(r.text)
    assert fc["type"] == "FeatureCollection" and fc["features"]
    for f in fc["features"]:
        assert f["properties"]["CacaoID"]["clone_verified"] is True and f["properties"]["ProducerCountry"] == "ID"
        assert all(len(str(c).split(".")[-1]) <= 6 for c in f["geometry"]["coordinates"])


def test_passport_without_gps_says_so(client, batch):
    s = next(x for x in client.get(f"/api/batches/{batch}").json()["samples"] if x["lat"] is None and not x["is_control"])
    r = client.get(f"/api/batches/{batch}/samples/{s['sample_id']}/passport").json()
    assert r["eudr"] is None and "tanpa GPS" in r["message"]


def test_passport_runs_or_degrades(client, batch, monkeypatch):
    monkeypatch.setattr(eudr, "check_plot", lambda g: {"verdict": "RENDAH", "reasons": ["stub"]})
    s = next(x for x in client.get(f"/api/batches/{batch}").json()["samples"] if x["verdict"] == "COCOK" and x["lat"])
    r = client.get(f"/api/batches/{batch}/samples/{s['sample_id']}/passport").json()
    assert r["identity"]["verified"] and r["eudr"]["verdict"] == "RENDAH" and r["plot"]["type"] == "Point"
