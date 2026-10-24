"""One field-to-certificate story through the API, the way the officer and the office use it."""
import csv
from datetime import datetime, timezone

GARDEN = "KE Simulasi Kolaka"


def test_plan_to_public_certificate(client, demo_batch):
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    plan = client.post("/api/plans", json={"month": month}).json()
    task = next(t for t in plan["tasks"] if t["provider"] == GARDEN)
    before = task["done"]

    # phone: a new batch for today's round, three mother trees of the planned garden
    bid = client.post("/api/batches", data={"name": "Lapangan E2E"}).json()["id"]
    for i, claim in enumerate(["ICS60", "TSH1188", "SCA6"], 1):
        body = {"sample_id": f"E2E-{i:03d}", "claim": claim, "provider": GARDEN, "officer": "Pengawas 2",
                "lat": -3.1 - i / 100, "lon": 121.05, "position": f"Blok A, baris {i}, no. 1"}
        assert client.post(f"/api/batches/{bid}/samples", json=body).status_code == 201
    plan = client.get(f"/api/plans/{month}").json()
    assert next(t for t in plan["tasks"] if t["id"] == task["id"])["done"] == before + 3

    # office: blind manifest to the lab, lab results back, verdicts
    manifest = client.get(f"/api/batches/{bid}/manifest.csv").text
    assert "1,A1,E2E-001" in manifest and "TSH1188" not in manifest  # the lab never sees the claimed clone
    lab = client.get("/api/simulasi/lab.csv", params={"batch_id": bid, "masalah": False}).content  # a clean round
    assert client.post(f"/api/batches/{bid}/lab", files={"lab": ("lab.csv", lab)}).status_code == 200
    out = client.post(f"/api/batches/{bid}/analyze").json()
    assert out["counts"] == {"COCOK": 3} and all(c["ok"] for c in out["qc"]["control_results"])

    # what the office then reads and exports
    assert any(x["sample_id"] == "E2E-002" for x in client.get("/api/search", params={"q": "e2e-002"}).json()["samples"])
    rows = list(csv.DictReader(client.get(f"/api/batches/{bid}/results.csv").text.splitlines()))
    assert [r["vonis"] for r in rows] == ["COCOK"] * 3 and rows[0]["posisi"] == "Blok A, baris 1, no. 1"
    assert client.get(f"/api/batches/{bid}/eudr.geojson").status_code == 200
    audit = client.get("/api/audit", params={"batch_id": bid}).json()
    assert audit["chain"]["ok"] and [e["action"] for e in audit["events"]][:2] == ["batch.dibuat", "sampel.dicatat"]

    # printed passport -> QR -> public check
    code = client.post("/api/seals", json={"kind": "paspor", "batch_id": bid, "sample_id": "E2E-001"}).json()["code"]
    pub = client.get(f"/api/public/seals/{code}").json()
    assert pub["unchanged"] and pub["chain_ok"] and pub["data"]["verdict"] == "COCOK" and pub["data"]["provider"] == GARDEN
