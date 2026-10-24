from cacaoid.config import DATA
from cacaoid.engine.io import parse_hapmap
from cacaoid.engine.registry import build_registry


def test_build_registry_flags_inconsistent_replicates():
    reg = {c.name: c for c in build_registry(parse_hapmap(DATA / "bekele2022" / "genotypes_hapmap.txt"))}
    for name in ("ICS39", "ICS81", "SJ2/20", "AMAZ6"):
        assert reg[name].status == "tidak konsisten", name
        assert f"{name} (varian b)" in reg
    assert reg["ICS60"].status == "referensi" and reg["SCA6"].group == "Contamana"
    assert 550 <= sum(c.status == "referensi" for c in reg.values()) <= 650


def test_registry_api(client):
    clones = {c["name"]: c for c in client.get("/api/clones").json()}
    assert clones["MCC 02"]["status"] == "menunggu referensi" and not clones["MCC 02"]["has_profile"]
    assert clones["ICCRI 06H"]["parent1"] == "TSH 858"
    assert 0 < sum(c["status"] == "tidak lengkap" for c in clones.values()) < 40
    panel = client.get("/api/panel").json()["snps"]
    assert len(panel) == 48
    detail = client.get("/api/clones/ICS60").json()
    assert len(detail["panel"]) == 48 and sum(p["call"] is not None for p in detail["panel"]) > 40
    r = client.post("/api/clones", json={"name": "Klon Uji", "profile": {panel[0]: "A:G"}})
    assert r.status_code == 201 and r.json()["status"] == "referensi"
    assert client.post("/api/clones", json={"name": "Klon Uji"}).status_code == 409


def test_provider_garden_drives_seed_origin(client):
    import numpy as np
    from cacaoid.engine.simulate import child, load_world, noisy
    refs, panel, freqs = load_world()
    r = client.post("/api/providers", json={"name": "KE Uji Kebun", "province": "Sulawesi Barat", "clones": ["ICS 60", "nope"]})
    assert r.status_code == 400 and "nope" in r.json()["detail"]
    pid = client.post("/api/providers", json={"name": "KE Uji Kebun", "clones": ["ics-60", "UF667"]}).json()["id"]
    assert client.put(f"/api/providers/{pid}/clones", json=["ICS60", "UF667", "PA107"]).json()["clones"] == ["ICS60", "UF667", "PA107"]
    # a seedling of two garden clones that nobody claimed in this batch: only the registered garden can explain it
    kid = noisy(child(refs["ICS60"], refs["UF667"], panel, np.random.default_rng(3), freqs), panel, np.random.default_rng(4), freqs, miss=0)
    lab = "Sample," + ",".join(panel) + "\nK-1," + ",".join(f"{kid[s][0]}:{kid[s][1]}" if kid[s] else "?" for s in panel) + "\n"
    bid = client.post("/api/batches", data={"name": "kebun"}, files={"field": ("f.csv", b"sample_id,klaim,penyedia\nK-1,SCA6,KE Uji Kebun\n")}).json()["id"]
    client.post(f"/api/batches/{bid}/lab", files={"lab": ("l.csv", lab.encode())})
    client.post(f"/api/batches/{bid}/analyze")
    res = client.get(f"/api/batches/{bid}/samples/K-1").json()["result"]
    assert res["verdict"] == "TIDAK DIKENAL" and set(res["parentage"]["parents"]) == {"ICS60", "UF667"}
    assert any("terdaftar di kebun" in st["detail"] for st in res["steps"])


def test_public_genome_references(client):
    from cacaoid.db import wgs_profiles
    if not wgs_profiles():
        return  # genome-derived references not built on this machine
    clones = {c["name"]: c for c in client.get("/api/clones").json()}
    s1 = clones["Sulawesi 1"]
    assert s1["status"] == "referensi" and s1["n_trees"] == 2 and "sepakat" in s1["source"]  # two independent sources
    assert clones["MCC 01"]["has_profile"] and clones["MCC 02"]["status"] == "menunggu referensi"
