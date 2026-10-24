"""The demo lab file for a batch made on the phone: random, but every problem is one that happens in the field."""
import csv
from collections import Counter

GARDEN = "KE Simulasi Kolaka"   # registered garden: ICS60 ICS95 TSH1188 SCA6 SCA12 CCN51
CLAIMS = ["ICS60", "ICS95", "TSH1188", "SCA6", "SCA12", "CCN51"]


def add(client, bid, sid, claim, kind, lot=""):
    body = {"sample_id": sid, "claim": claim, "kind": kind, "provider": GARDEN, "lot": lot}
    assert client.post(f"/api/batches/{bid}/samples", json=body).status_code == 201


def test_simulated_lab_goes_wrong_the_way_the_field_does(client, demo_batch):
    bid = client.post("/api/batches", data={"name": "Simulasi acak"}).json()["id"]
    for i in range(36):
        add(client, bid, f"PI-{i:03d}", CLAIMS[i % 6], "pohon induk entres")
    for i in range(24):
        add(client, bid, f"BS-{i:03d}", CLAIMS[i % 6], "bibit sambung")
    for i in range(30):
        add(client, bid, f"BH-{i:03d}", "Hibrida DEMO-1", "bibit hibrida", lot=f"LOT-{i % 2}")

    lab = client.get("/api/simulasi/lab.csv", params={"batch_id": bid}).text
    assert lab == client.get("/api/simulasi/lab.csv", params={"batch_id": bid}).text  # same batch, same file
    client.post(f"/api/batches/{bid}/lab", files={"lab": ("lab.csv", lab.encode())})
    client.post(f"/api/batches/{bid}/analyze")
    rows = {x["sample_id"]: x for x in client.get(f"/api/batches/{bid}").json()["samples"] if not x["is_control"]}
    by = lambda prefix: Counter(x["verdict"] for i, x in rows.items() if i.startswith(prefix))  # noqa: E731

    assert all(x["verdict"] for x in rows.values())
    labelled_right = by("PI")["COCOK"] + by("BS")["COCOK"]
    assert labelled_right > 30  # most of the 60 trees and grafts are what the label says (about 78%)
    problems = sum(n for v, n in (by("PI") + by("BS")).items() if v != "COCOK")
    assert problems >= 3  # but not all: some trees go wrong
    # each kind can only go wrong in its own ways
    # (a mother tree is grafted too, and a seedling of a cross close to the rootstock cross, e.g. TSH1188 x SCA12 next to
    # TSH1188 x SCA6, reads as rootstock on 48 SNPs)
    assert set(by("PI")) <= {"COCOK", "OFF-TYPE", "TIDAK DIKENAL", "UJI ULANG", "BATANG BAWAH"}
    assert set(by("BS")) <= {"COCOK", "OFF-TYPE", "BATANG BAWAH", "UJI ULANG", "TIDAK DIKENAL"}
    assert set(by("BH")) <= {"SESUAI SILANGAN", "KONTAMINAN", "UJI ULANG"}
    # a mix-up is with another clone of the same garden (or one the 48-SNP panel cannot tell apart from it, e.g. SCA11
    # and SCA12 have identical panel fingerprints), not some random accession
    panel = lambda name: {p["snp"]: p["call"] for p in client.get(f"/api/clones/{name}").json()["panel"]}  # noqa: E731
    garden = [panel(c) for c in CLAIMS]
    for x in (x for x in rows.values() if x["verdict"] == "OFF-TYPE"):
        found = panel(x["found_as"])
        assert any(sum(1 for k in g if g[k] and found[k] and g[k] != found[k]) <= 2 for g in garden), x

    # adding a sample does not change what the earlier ones read as
    add(client, bid, "PI-999", "ICS60", "pohon induk entres")
    again = client.get("/api/simulasi/lab.csv", params={"batch_id": bid}).text
    keep = lambda text: {r[0]: r[1:-2] for r in csv.reader(text.splitlines()) if not r[0].startswith("KTRL")}  # noqa: E731
    assert all(keep(again)[k] == v for k, v in keep(lab).items())


def test_clean_option_reads_every_sample_as_labelled(client):
    bid = client.post("/api/batches", data={"name": "Simulasi bersih"}).json()["id"]
    for i in range(12):
        add(client, bid, f"CL-{i:03d}", CLAIMS[i % 6], "pohon induk entres")
    lab = client.get("/api/simulasi/lab.csv", params={"batch_id": bid, "masalah": False}).content
    client.post(f"/api/batches/{bid}/lab", files={"lab": ("lab.csv", lab)})
    assert client.post(f"/api/batches/{bid}/analyze").json()["counts"] == {"COCOK": 12}
