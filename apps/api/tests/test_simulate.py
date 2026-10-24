import csv
from collections import Counter

import numpy as np

from cacaoid.engine.identity import Matcher
from cacaoid.engine.io import parse_kasp_csv
from cacaoid.engine.simulate import load_world, write


class Ref:
    def __init__(self, name, profile):
        self.name, self.profile, self.status = name, profile, "referensi"


def test_simulated_batch(tmp_path, client):  # client fixture seeds the test database
    world = load_world()
    a = [p.read_text() for p in write(tmp_path / "a", *world)]
    b = [p.read_text() for p in write(tmp_path / "b", *world)]
    assert a == b, "fixed seed must give identical files"

    field = list(csv.DictReader(open(tmp_path / "a" / "SIMULASI_lapangan.csv")))
    key = {r["sample_id"]: r for r in csv.DictReader(open(tmp_path / "a" / "SIMULASI_kunci.csv"))}
    lab = parse_kasp_csv(a[1])
    assert len(lab.samples) <= 2 * 96 and set(r["sample_id"] for r in field) < set(lab.samples)
    kinds = Counter(r["vonis_harapan"] for r in key.values())
    for v in ("COCOK", "OFF-TYPE", "TIDAK DIKENAL", "BATANG BAWAH", "BELUM ADA REFERENSI", "UJI ULANG", "KONTAMINAN"):
        assert kinds[v] > 0, v
    assert any(r["lat"] == "" for r in field)  # GPS-missing scenario present

    # verdicts the identity engine already owns must agree with the answer key
    refs, panel, _ = world
    m = Matcher([Ref(n, p) for n, p in refs.items()], panel)
    claims = {r["sample_id"]: r["klaim"] for r in field} | {"KTRL-POS-ICS60": "ICS60", "KTRL-NTC": "ICS60"}
    owned = {"COCOK", "OFF-TYPE", "BELUM ADA REFERENSI", "UJI ULANG"}
    bad = []
    for i, sid in enumerate(lab.samples):
        k = key[sid]
        if k["vonis_harapan"] not in owned or k["kategori"] == "bibit hibrida" or k["kategori"] == "bibit sambung" and k["vonis_harapan"] != "COCOK":
            continue
        r = m.identify(sid, dict(zip(lab.snps, lab.calls[i])), claims[sid])
        if (r["verdict"], r["found_as"] or "") != (k["vonis_harapan"], k["ditemukan_sebagai"]):
            bad.append((sid, k["kebenaran"], k["vonis_harapan"], r["verdict"], r["found_as"]))
    assert not bad, bad
