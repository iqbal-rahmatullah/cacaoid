from sqlmodel import Session, select

from cacaoid import audit
from cacaoid.db import engine
from cacaoid.models import AuditEvent


def test_actions_are_chained_and_tampering_is_detected(client):
    h = {"X-Role": "Pengawas benih"}
    bid = client.post("/api/batches", data={"name": "Audit"}, headers=h).json()["id"]
    client.post(f"/api/batches/{bid}/samples", json={"sample_id": "A-1", "claim": "ICS60"}, headers=h)
    r = client.post(f"/api/batches/{bid}/samples/A-1/action", json={"action": "pemurnian", "note": "tebang"}, headers=h)
    assert r.json()["action"] == "pemurnian"
    assert client.post(f"/api/batches/{bid}/samples/A-1/action", json={"action": "hapus"}).status_code == 422
    t = client.get(f"/api/audit?batch_id={bid}").json()
    assert t["chain"]["ok"] and [e["action"] for e in t["events"]] == ["batch.dibuat", "sampel.dicatat", "tindakan.pemurnian"]
    assert t["events"][-1]["actor"] == "Pengawas benih"

    with Session(engine) as s:  # someone edits history directly in the database
        e = s.exec(select(AuditEvent).where(AuditEvent.batch_id == bid, AuditEvent.action == "sampel.dicatat")).one()
        e.payload = {**e.payload, "claim": "SCA6"}
        s.add(e)
        s.commit()
        v = audit.verify(s)
        assert not v["ok"] and v["broken_at"] == e.id
        e.payload = {**e.payload, "claim": "ICS60"}  # restore so other tests see a clean chain
        s.add(e)
        s.commit()
        assert audit.verify(s)["ok"]
