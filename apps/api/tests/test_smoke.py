
from cacaoid.config import DATA


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"


def test_data_rescued():
    assert (DATA / "bekele2022" / "genotypes_hapmap.txt").exists()
    assert (DATA / "osorio2025" / "table4_genotypes.xlsx").exists()
