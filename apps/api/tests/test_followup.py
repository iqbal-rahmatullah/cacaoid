
def rows(client, bid):
    return [x for x in client.get(f"/api/batches/{bid}").json()["samples"] if not x["is_control"]]


def test_retest_makes_a_linked_sample_and_closes_the_case(client, demo_batch):
    low = next(x for x in rows(client, demo_batch) if x["verdict"] == "UJI ULANG" and not x["action"])
    sid = low["sample_id"]
    assert client.post(f"/api/batches/{demo_batch}/samples/{sid}/action", json={"action": "uji ulang"}).status_code == 200
    task = next(t for t in client.get("/api/tasks").json() if sid in t["sample_ids"])
    assert (task["source"], task["batch_id"], task["provider"], task["done"]) == ("uji ulang", demo_batch, low["provider"], 0)

    new = client.post("/api/batches", data={"name": "Uji ulang"}).json()["id"]
    rid = f"{sid}-U1"
    body = {"sample_id": rid, "claim": low["claim"], "kind": low["kind"], "provider": low["provider"],
            "retest_of": sid, "retest_of_batch": demo_batch}
    assert client.post(f"/api/batches/{new}/samples", json=body).status_code == 201
    bad = {**body, "sample_id": "ULANG-X", "retest_of": "TIDAK-ADA"}
    assert client.post(f"/api/batches/{new}/samples", json=bad).status_code == 404
    assert next(t for t in client.get("/api/tasks").json() if t["id"] == task["id"])["done"] == 1

    lab = client.get("/api/simulasi/lab.csv", params={"batch_id": new})  # DATA SIMULASI lab file for this new batch
    assert lab.status_code == 200 and rid in lab.text
    client.post(f"/api/batches/{new}/lab", files={"lab": ("lab.csv", lab.content)})
    client.post(f"/api/batches/{new}/analyze")
    assert client.get(f"/api/batches/{new}/samples/{rid}").json()["verdict"] == "COCOK"
    orig = client.get(f"/api/batches/{demo_batch}/samples/{sid}").json()
    assert orig["closed_at"] and rid in orig["outcome"]
    assert orig["retests"] == [{"batch_id": new, "sample_id": rid, "verdict": "COCOK"}]
    d = client.get("/api/dashboard").json()
    assert 0 < d["follow_up_done"] <= d["follow_up"]


def test_pemurnian_needs_a_marked_tree_a_date_and_a_photo(client, demo_batch):
    off = next(x for x in rows(client, demo_batch) if x["verdict"] == "OFF-TYPE" and not x["action"])
    url = f"/api/batches/{demo_batch}/samples/{off['sample_id']}"
    photo = ("pohon.jpg", b"\xff\xd8\xff fake jpeg bytes", "image/jpeg")
    from cacaoid.api.tasks import today
    form = {"date": today().isoformat(), "note": "Pohon diganti entres terverifikasi"}
    assert client.post(url + "/close", data=form, files={"photo": photo}).status_code == 409  # not marked yet
    client.post(url + "/action", json={"action": "pemurnian"})
    assert client.post(url + "/close", data=form).status_code == 422  # photo is required
    assert client.post(url + "/close", data={**form, "date": "2999-01-01"}, files={"photo": photo}).status_code == 422
    assert client.post(url + "/close", data=form, files={"photo": ("x.txt", b"hi", "text/plain")}).status_code == 422
    assert client.post(url + "/close", data=form, files={"photo": photo}).status_code == 200
    x = client.get(url).json()
    assert x["closed_at"] and x["evidence"]["note"] == form["note"] and len(x["evidence"]["sha256"]) == 64
    assert client.get(f"/api/evidence/{x['evidence']['photo']}").content == photo[1]
    assert client.get("/api/evidence/bukan-bukti.jpg").status_code == 404
    assert client.post(url + "/close", data=form, files={"photo": photo}).status_code == 409  # already closed
    ev = client.get("/api/audit", params={"batch_id": demo_batch}).json()["events"]
    assert any(e["action"] == "kasus.ditutup" and e["sample_id"] == off["sample_id"] for e in ev)


def test_simulated_files_are_refused_with_real_data(client, demo_batch, monkeypatch):
    from cacaoid import config
    monkeypatch.setattr(config, "SIMULATED", False)
    assert client.get("/api/simulasi/lab.csv", params={"batch_id": demo_batch}).status_code == 404
    assert client.get("/api/ai/reflex/example.csv", params={"batch_id": demo_batch}).status_code == 404
