from datetime import datetime, timedelta, timezone


def today():
    from cacaoid.api.tasks import today as officers_today
    return officers_today()


def test_task_progress_counts_new_samples_of_that_garden(client):
    bid = client.post("/api/batches", data={"name": "Tugas"}).json()["id"]
    due = (today() + timedelta(days=7)).isoformat()
    t = client.post("/api/tasks", json={"officer": "Pengawas 9", "provider": "KE Uji Tugas", "target": 2, "due": due})
    assert t.status_code == 201
    t = t.json()
    assert (t["status"], t["done"], t["start"]) == ("baru", 0, today().isoformat())
    for i, prov in enumerate(["KE Uji Tugas", "KE Lain", "KE Uji Tugas"]):
        client.post(f"/api/batches/{bid}/samples", json={"sample_id": f"TG-{i}", "claim": "ICS60", "provider": prov})
    mine = {x["id"]: x for x in client.get("/api/tasks", params={"officer": "pengawas 9"}).json()}
    assert (mine[t["id"]]["done"], mine[t["id"]]["status"]) == (2, "selesai")
    assert t["id"] not in [x["id"] for x in client.get("/api/tasks", params={"officer": "Pengawas lain"}).json()]
    assert client.post("/api/tasks", json={"provider": "KE Uji Tugas", "target": 1, "due": "2020-01-01"}).status_code == 422


def test_task_can_be_closed_by_hand(client):
    due = (today() + timedelta(days=3)).isoformat()
    t = client.post("/api/tasks", json={"provider": "KE Uji Tutup", "target": 5, "due": due}).json()
    assert client.post(f"/api/tasks/{t['id']}/done").json()["status"] == "selesai"
    assert client.post("/api/tasks/999999/done").status_code == 404


def test_monthly_plan_follows_risk_and_is_idempotent(client, demo_batch):
    month = (today().replace(day=1) + timedelta(days=32)).strftime("%Y-%m")  # next month: no other test plans it
    risk = {r["provider"]: r["recommended_n"] for r in client.get("/api/ai/risk").json()}
    p = client.post("/api/plans", json={"month": month})
    assert p.status_code == 201
    p = p.json()
    assert {t["provider"]: t["target"] for t in p["tasks"]} == risk and p["target"] == sum(risk.values())
    assert all(t["source"] == "rencana" and t["month"] == month and t["start"] == f"{month}-01" and t["due"].startswith(month)
               for t in p["tasks"])
    again = client.post("/api/plans", json={"month": month}).json()
    assert sorted(t["id"] for t in again["tasks"]) == sorted(t["id"] for t in p["tasks"])
    assert client.get(f"/api/plans/{month}").json()["target"] == p["target"]
    assert client.post("/api/plans", json={"month": "2020-01"}).status_code == 422


def test_today_is_the_officers_date_not_utc(monkeypatch):
    """At 01:00 WITA it is still the previous day in UTC; a sample or a pemurnian dated 'today' must not be refused."""
    from cacaoid.api import tasks

    class Clock(datetime):
        @classmethod
        def now(cls, tz=None):
            return datetime(2026, 10, 24, 17, 30, tzinfo=timezone.utc).astimezone(tz)  # 25 Oct 01:30 WITA
    monkeypatch.setattr(tasks, "datetime", Clock)
    assert tasks.today().isoformat() == "2026-10-25"
