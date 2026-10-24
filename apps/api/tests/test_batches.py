import csv

from cacaoid.engine.simulate import load_world, write


def test_batch_flow_matches_answer_key(client, tmp_path):
    field, lab, key = write(tmp_path, *load_world())
    r = client.post("/api/batches", data={"name": "Uji alur"}, files={"field": field.open("rb")})
    assert r.status_code == 201
    bid = r.json()["id"]

    qc = client.post(f"/api/batches/{bid}/lab", files={"lab": lab.open("rb")}).json()
    assert qc["snps_not_in_panel"] == ["TcLAB_x01", "TcLAB_x02"] and not qc["unknown_ids"] and not qc["missing_ids"]
    assert set(qc["retest"]) >= {"KTRL-NTC"}

    out = client.post(f"/api/batches/{bid}/analyze").json()
    assert all(c["ok"] for c in out["qc"]["control_results"]), out["qc"]["control_results"]
    got = {x["sample_id"]: x for x in client.get(f"/api/batches/{bid}").json()["samples"]}
    owned = {"COCOK", "OFF-TYPE", "BELUM ADA REFERENSI", "UJI ULANG", "BATANG BAWAH", "TIDAK DIKENAL"}
    for k in csv.DictReader(key.open()):
        if k["vonis_harapan"] in owned and k["kategori"] != "kontrol":
            x = got[k["sample_id"]]
            assert (x["verdict"], x["found_as"] or "") == (k["vonis_harapan"], k["ditemukan_sebagai"]), k
        if k["kebenaran"].startswith("semaian ") and "×" in k["kebenaran"]:  # seedling of two garden clones
            r = client.get(f"/api/batches/{bid}/samples/{k['sample_id']}").json()["result"]
            assert set(r["parentage"]["parents"]) == set(k["kebenaran"][8:].split(" × ")), (k, r["steps"])

    lot = out["qc"]["lots"][0]
    assert lot["lot"] == "LOT-H-07" and lot["n"] == 60 and lot["excluded"] > 0 and lot["decision"] == "TAHAN"
    kont = {k["sample_id"] for k in csv.DictReader(key.open()) if k["vonis_harapan"] == "KONTAMINAN"}
    flagged = {i for i, x in got.items() if x["verdict"] == "KONTAMINAN"}
    assert flagged <= kont and len(flagged) >= len(kont) - 2  # a few outside-pollen seedlings can't be excluded

    d = client.get(f"/api/batches/{bid}/samples/SIM-001").json()
    assert d["result"]["steps"] and len(d["result"]["compare"]) == 48


def test_bad_uploads_rejected(client, tmp_path):
    dup = tmp_path / "dup.csv"
    dup.write_text("sample_id,klaim\nA,ICS60\nA,SCA6\n")
    assert client.post("/api/batches", data={"name": "x"}, files={"field": dup.open("rb")}).status_code == 400
    ok = tmp_path / "ok.csv"
    ok.write_text("sample_id,klaim\nA,ICS60\n")
    bid = client.post("/api/batches", data={"name": "x"}, files={"field": ok.open("rb")}).json()["id"]
    for body in (b"\xff\xfe\x00garbage", b"Sample,FOO1,FOO2\nA,A:G,A:A\n", b"Sample,X\n"):
        r = client.post(f"/api/batches/{bid}/lab", files={"lab": ("lab.csv", body)})
        assert r.status_code == 400, (body, r.json())


def test_field_page_flow(client):
    bid = client.post("/api/batches", data={"name": "Lapangan"}).json()["id"]
    body = {"sample_id": "LUW-0001", "claim": "ICS60", "kind": "bibit sambung", "lat": -2.57, "lon": 120.33}
    assert client.post(f"/api/batches/{bid}/samples", json=body).status_code == 201
    assert client.post(f"/api/batches/{bid}/samples", json=body).status_code == 409
    assert client.post(f"/api/batches/{bid}/samples", json={**body, "sample_id": "a b;"}).status_code == 422
    r = client.post(f"/api/batches/{bid}/samples", json={**body, "sample_id": "LUW-0002", "lat": None, "lon": None})
    assert r.json()["gps"] is False
    rows = client.get(f"/api/batches/{bid}/manifest.csv").text.strip().splitlines()
    assert rows[0] == "plate,well,sample_id" and rows[1] == "1,A1,LUW-0001" and rows[-1].endswith("KTRL-NTC")
    assert "ICS60" not in rows[1]  # lab sheet stays blind to the claim


def test_results_csv_has_verdict_and_snp_evidence(client, demo_batch):
    detail = client.get(f"/api/batches/{demo_batch}").json()
    field = {x["sample_id"]: x for x in detail["samples"] if not x["is_control"]}
    r = client.get(f"/api/batches/{demo_batch}/results.csv")
    assert r.status_code == 200 and "attachment" in r.headers["content-disposition"]
    rows = list(csv.DictReader(r.text.splitlines()))
    panel = client.get("/api/panel").json()["snps"]
    assert list(rows[0])[-len(panel):] == panel  # one column per panel SNP = the evidence behind the verdict
    assert {x["sample_id"] for x in rows} == set(field)  # field samples only, no plate controls
    for x in rows:
        assert x["vonis"] == (field[x["sample_id"]]["verdict"] or "")
    one = client.get(f"/api/batches/{demo_batch}/samples/SIM-001").json()["result"]["compare"]
    row = next(x for x in rows if x["sample_id"] == "SIM-001")
    assert all(row[c["snp"]] == (c["sample"] or "") for c in one)


def test_tree_position_is_kept(client):
    bid = client.post("/api/batches", data={"name": "Posisi"}).json()["id"]
    body = {"sample_id": "POS-1", "claim": "ICS60", "position": "Blok B, baris 4, no. 12"}
    assert client.post(f"/api/batches/{bid}/samples", json=body).status_code == 201
    x = client.get(f"/api/batches/{bid}").json()["samples"][0]
    assert x["position"] == "Blok B, baris 4, no. 12"
    f = b"sample_id,klaim,posisi\nPOS-2,ICS60,Blok A 1\n"
    bid = client.post("/api/batches", data={"name": "Posisi CSV"}, files={"field": ("f.csv", f)}).json()["id"]
    assert client.get(f"/api/batches/{bid}").json()["samples"][0]["position"] == "Blok A 1"


def test_old_database_gets_new_columns(tmp_path):
    from sqlalchemy import create_engine, inspect, text
    from cacaoid.db import add_missing_columns
    eng = create_engine(f"sqlite:///{tmp_path / 'old.db'}")
    with eng.begin() as c:  # a database created before the position column existed
        c.execute(text("CREATE TABLE sample (id INTEGER PRIMARY KEY, sample_id VARCHAR NOT NULL)"))
        c.execute(text("INSERT INTO sample (sample_id) VALUES ('OLD-1')"))
    add_missing_columns(eng)
    add_missing_columns(eng)  # idempotent: runs on every start
    assert "position" in {c["name"] for c in inspect(eng).get_columns("sample")}
    with eng.begin() as c:
        assert c.execute(text("SELECT position FROM sample")).scalar() == ""
