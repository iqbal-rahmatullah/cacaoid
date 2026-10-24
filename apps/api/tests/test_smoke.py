
from cacaoid.config import DATA


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200 and r.json()["status"] == "ok" and r.json()["simulated_data"] is True


def test_health_reports_real_data_mode(client, monkeypatch):
    from cacaoid import config
    monkeypatch.setattr(config, "SIMULATED", False)
    assert client.get("/api/health").json()["simulated_data"] is False


def test_data_rescued():
    assert (DATA / "bekele2022" / "genotypes_hapmap.txt").exists()
    assert (DATA / "osorio2025" / "table4_genotypes.xlsx").exists()
