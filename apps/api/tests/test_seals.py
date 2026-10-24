from sqlmodel import Session, select

from cacaoid.db import engine
from cacaoid.models import Sample


def test_seal_is_a_public_read_only_check(client, demo_batch):
    code = client.post("/api/seals", json={"kind": "berita-acara", "batch_id": demo_batch}).json()["code"]
    assert client.post("/api/seals", json={"kind": "berita-acara", "batch_id": demo_batch}).json()["code"] == code
    pub = client.get(f"/api/public/seals/{code}").json()
    assert pub["unchanged"] and pub["chain_ok"] and pub["kind"] == "berita-acara" and pub["data"]["samples"] > 0

    ok = next(x for x in client.get(f"/api/batches/{demo_batch}").json()["samples"]
              if x["verdict"] == "COCOK" and x["lat"] is not None)
    p = client.post("/api/seals", json={"kind": "paspor", "batch_id": demo_batch, "sample_id": ok["sample_id"]})
    assert p.status_code == 201
    data = client.get(f"/api/public/seals/{p.json()['code']}").json()["data"]
    assert data["verified"] and data["claim"] == ok["claim"] and data["eudr"]
    # public limits: no officer name, location only to ~1 km
    assert "officer" not in data and data["area"] == [round(ok["lat"], 2), round(ok["lon"], 2)]
    assert client.get("/api/public/seals/tidak-ada").status_code == 404
    assert client.post("/api/seals", json={"kind": "paspor", "batch_id": demo_batch}).status_code == 422

    with Session(engine) as s:  # the data behind a printed passport changes -> the public page says so
        x = s.exec(select(Sample).where(Sample.batch_id == demo_batch, Sample.sample_id == ok["sample_id"])).one()
        x.verdict = "OFF-TYPE"
        s.add(x)
        s.commit()
    assert client.get(f"/api/public/seals/{p.json()['code']}").json()["unchanged"] is False
    with Session(engine) as s:
        x = s.exec(select(Sample).where(Sample.batch_id == demo_batch, Sample.sample_id == ok["sample_id"])).one()
        x.verdict = "COCOK"
        s.add(x)
        s.commit()
