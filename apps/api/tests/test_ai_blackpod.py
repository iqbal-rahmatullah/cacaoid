import numpy as np

from cacaoid import config
from cacaoid.engine import ai_blackpod, ai_traits
from cacaoid.engine.io import parse_hapmap
from cacaoid.engine.simulate import load_world, write


def test_blackpod_score_orders_trees_and_shrinks_when_markers_missing():
    X, y, _pop, markers = ai_blackpod.load()
    score = lambda i: ai_blackpod.predict(dict(zip(markers, X[i].astype(int).tolist())))  # noqa: E731
    lo, hi = score(int(np.argmin(y))), score(int(np.argmax(y)))  # fewest vs most rotten pods among training trees
    assert lo["value"] < hi["value"] and lo["coverage"] == 1.0
    empty = ai_blackpod.predict({})  # nothing genotyped: every marker imputed -> the population mean, not an extreme
    assert empty["coverage"] == 0 and abs(empty["value"] - y.mean()) < 0.5


def test_lab_matrix_parser_accepts_excel_variants():
    m = ai_blackpod.read_matrix("marker;S1;S2\nchr1:9786:SG;0;NA\nchr1:10800:SG;2;1\n")
    assert m == {"S1": {"chr1:9786:SG": 0, "chr1:10800:SG": 2}, "S2": {"chr1:10800:SG": 1}}


def test_seedling_ranking_of_one_cross(client, tmp_path):
    ex = client.get("/api/ai/seedlings/example.csv")
    assert ex.status_code == 200 and ex.text.startswith("marker,PA-51xICS-95-01")
    f = tmp_path / "semaian.csv"
    f.write_text(ex.text)
    r = client.post("/api/ai/seedlings", files={"lab": f.open("rb")}).json()
    sc = [x["score"] for x in r["seedlings"]]
    assert len(sc) == 39 and sc == sorted(sc) and r["keep"] == 10 and not r["skipped"]
    assert [x["keep"] for x in r["seedlings"]] == [True] * 10 + [False] * 29
    assert "antar-klon" in r["note"]  # the UI must say what the score cannot be used for
    few = tmp_path / "few.csv"
    few.write_text("marker,A,B\nchr1:9786:SG,0,1\n")
    assert client.post("/api/ai/seedlings", files={"lab": few.open("rb")}).status_code == 422


def test_reflex_queue_upload_and_audit(client, tmp_path):
    field, lab, _key = write(tmp_path, *load_world())
    bid = client.post("/api/batches", data={"name": "Uji refleks"}, files={"field": field.open("rb")}).json()["id"]
    client.post(f"/api/batches/{bid}/lab", files={"lab": lab.open("rb")})
    client.post(f"/api/batches/{bid}/analyze")
    q = client.get("/api/ai/reflex", params={"batch_id": bid}).json()
    ids = [x["sample_id"] for x in q["samples"]]
    assert len(ids) >= 2 and all(x["refleks"] is None for x in q["samples"])

    g = parse_hapmap(config.DATA / "bekele2022" / "genotypes_hapmap.txt")  # a genome-wide profile from the genebank
    snps = ai_traits.model()["snps"]
    col = {s: j for j, s in enumerate(g.snps)}
    full = [g.calls[0][col[s]] or "" for s in snps]
    panel_only = [c if j < 48 else "" for j, c in enumerate(full)]  # what a 48-SNP verification sample would give
    f = tmp_path / "genome_wide.csv"
    f.write_text("\n".join(["sample_id," + ",".join(snps), f"{ids[0]}," + ",".join(full),
                            f"{ids[1]}," + ",".join(panel_only), "BUKAN-SAMPEL," + ",".join(full)]))
    r = client.post("/api/ai/reflex", params={"batch_id": bid}, files={"lab": f.open("rb")}, headers={"X-Role": "Lab mitra"})
    assert r.status_code == 200 and r.json() == {"updated": ids[:2], "unknown_ids": ["BUKAN-SAMPEL"]}
    got = {x["sample_id"]: x["refleks"] for x in client.get("/api/ai/reflex", params={"batch_id": bid}).json()["samples"]}
    assert got[ids[0]]["traits"]["FR_BEN"]["value"] > 0 and got[ids[0]]["ancestry"]["composition"]
    assert got[ids[1]]["traits"] is None and "genome-wide" in got[ids[1]]["message"]
    detail = client.get(f"/api/batches/{bid}/samples/{ids[0]}").json()["result"]
    assert detail["refleks"]["file"] == "genome_wide.csv"
    ev = client.get("/api/audit", params={"batch_id": bid}).json()["events"]
    assert any(e["action"] == "refleks.diunggah" and e["actor"] == "Lab mitra" for e in ev)


def test_reflex_example_gives_genome_wide_rows_for_unknown_trees(client, demo_batch):
    import csv
    q = client.get("/api/ai/reflex", params={"batch_id": demo_batch}).json()
    f = client.get("/api/ai/reflex/example.csv", params={"batch_id": demo_batch})
    rows = list(csv.reader(f.text.splitlines()))
    assert [r[0] for r in rows[1:]] == [x["sample_id"] for x in q["samples"]] and len(rows[0]) - 1 == q["snps"]
    r = client.post("/api/ai/reflex", params={"batch_id": demo_batch}, files={"lab": ("genome.csv", f.content)})
    assert sorted(r.json()["updated"]) == sorted(x["sample_id"] for x in q["samples"])
    got = client.get("/api/ai/reflex", params={"batch_id": demo_batch}).json()["samples"]
    assert all(x["refleks"]["traits"] and x["refleks"]["ancestry"] for x in got)
