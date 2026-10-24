from collections import Counter

from sqlmodel import Session, select

from cacaoid.db import engine
from cacaoid.engine.risk import score
from cacaoid.engine.simulate import load_world, write
from cacaoid.models import Sample


def test_risk_rules():
    good, bad, new = score(200, 4, 0, 0), score(200, 60, 1, 0), score(3, 0, 0, 0)
    assert good["tier"] == "Rendah" and bad["tier"] == "Tinggi" and new["tier"] != "Rendah"  # no history != clean
    assert bad["recommended_n"] > good["recommended_n"] and bad["factors"]
    # one batch in: 20% vs 6% off-type must already lead to different tiers and sampling plans
    kolaka, luwu = score(35, 7, 1, 0), score(18, 1, 0, 0)
    assert kolaka["tier"] == "Tinggi" and luwu["tier"] == "Sedang" and kolaka["recommended_n"] > luwu["recommended_n"]


def test_dashboard_matches_database(client, tmp_path):
    field, lab, _ = write(tmp_path, *load_world())
    bid = client.post("/api/batches", data={"name": "Dasbor"}, files={"field": field.open("rb")}).json()["id"]
    client.post(f"/api/batches/{bid}/lab", files={"lab": lab.open("rb")})
    client.post(f"/api/batches/{bid}/analyze")
    d = client.get("/api/dashboard").json()
    with Session(engine) as s:
        xs = [x for x in s.exec(select(Sample)).all() if not x.is_control]
    v = Counter(x.verdict for x in xs)
    assert d["samples"] == len(xs) and d["retest"] == v["UJI ULANG"] and d["no_reference"] == v["BELUM ADA REFERENSI"]
    assert d["ok"] == v["COCOK"] + v["SESUAI SILANGAN"]
    assert d["bad"] == v["OFF-TYPE"] + v["TIDAK DIKENAL"] + v["BATANG BAWAH"] + v["KONTAMINAN"]
    assert d["lots_held"] >= 1

    risk = {r["provider"]: r for r in client.get("/api/ai/risk").json()}
    # the simulation gives Kolaka a 30% off-type rate and Luwu Utara 4%
    assert risk["KE Simulasi Kolaka"]["score"] > risk["KE Simulasi Luwu Utara"]["score"]
    assert risk["KE Simulasi Kolaka"]["recommended_n"] > risk["KE Simulasi Luwu Utara"]["recommended_n"]


def test_dashboard_sample_journey(client, demo_batch):
    from cacaoid import config
    from cacaoid.engine.risk import BAD
    d = client.get("/api/dashboard").json()
    with Session(engine) as s:
        xs = [x for x in s.exec(select(Sample)).all() if not x.is_control]
    need = [x for x in xs if x.verdict in BAD | {"UJI ULANG", "BELUM ADA REFERENSI"}]
    assert d["lab_received"] == sum(x.call_rate is not None for x in xs)
    assert d["qc_passed"] == sum(x.call_rate is not None and x.call_rate >= config.MIN_CALL_RATE for x in xs)
    assert 0 < d["qc_passed"] < d["lab_received"]
    assert d["follow_up"] == len(need) and d["follow_up_done"] == sum(x.closed_at is not None for x in need)
    assert d["follow_up_running"] == sum(x.action is not None and x.closed_at is None for x in need)
