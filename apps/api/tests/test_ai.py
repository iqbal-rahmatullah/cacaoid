from cacaoid.engine import ai_traits


def test_trait_prediction_from_saved_model(client):
    assert ai_traits.ARTIFACT.exists() or ai_traits.model()  # trained once, then loaded from disk
    r = client.get("/api/ai/traits", params={"names": ["ICS60", "SCA6"]}).json()
    lo, hi = ai_traits.model()["traits"]["FR_BEN"]["range"]
    for p in r:
        assert p["coverage"] > 0.9 and lo - 10 < p["traits"]["FR_BEN"]["value"] < hi + 10
        assert p["traits"]["FR_BEN"]["pm80"] > 0
    assert client.get("/api/ai/traits", params={"names": ["MCC 02"]}).status_code == 404


def test_panel_only_profile_is_refused(client):
    panel = client.get("/api/panel").json()["snps"]
    ics60 = {x["snp"]: x["call"] for x in client.get("/api/clones/ICS60").json()["panel"]}
    r = client.post("/api/clones", json={"name": "Pohon Panel Saja", "profile": {s: ics60[s] for s in panel if ics60[s]}})
    assert r.status_code == 409 and "ICS60" in r.json()["detail"]  # identical fingerprint = synonym, refused
    flipped = {s: ("AA" if ics60[s] != "AA" else "CC") if i < 12 else ics60[s] for i, s in enumerate(panel) if ics60[s]}
    assert client.post("/api/clones", json={"name": "Pohon Panel Saja", "profile": flipped}).status_code == 201
    r = client.get("/api/ai/traits", params={"names": ["Pohon Panel Saja"]}).json()[0]
    assert r["traits"] is None and "genome-wide" in r["message"]


def test_cross_ranks_simulated_seedlings(client):
    r = client.post("/api/ai/cross", json={"parent1": "TSH1188", "parent2": "SCA6", "n": 20}).json()
    vals = [x["traits"]["FR_BEN"]["value"] for x in r["seedlings"]]
    assert len(vals) == 20 and vals == sorted(vals, reverse=True) and r["simulated"]
    # parent rows must carry their own prediction (regression: names were zipped in database order)
    single = {p["name"]: p for p in client.get("/api/ai/traits", params={"names": ["TSH1188", "SCA6"]}).json()}
    for p in r["parents"]:
        assert p["traits"]["FR_BEN"]["value"] == single[p["name"]]["traits"]["FR_BEN"]["value"]


def test_ancestry_groups_and_hybrids(client):
    r = {x["name"]: x for x in client.get("/api/ai/ancestry", params={"names": ["TSH1188", "SCA6"]}).json()}
    assert r["SCA6"]["dominant"] == "Contamana"
    assert r["TSH1188"]["dominant"] is None and max(r["TSH1188"]["composition"].values()) < 0.8  # a hybrid reads as a mix
    assert "Trinitario" not in r["TSH1188"]["composition"] and "Curaray" in r["TSH1188"]["warnings"][0]


def test_trinitario_reads_as_criollo_amelonado(client):
    """Groups confirmed against public genomes: Trinitario ICS1 is Criollo x Amelonado, Catongo is pure Amelonado."""
    r = {x["name"]: x["composition"] for x in client.get("/api/ai/ancestry", params={"names": ["ICS1", "CATONGO"]}).json()}
    assert r["ICS1"]["Criollo"] >= 0.2 and r["ICS1"]["Amelonado"] >= 0.2 and r["ICS1"]["Criollo"] + r["ICS1"]["Amelonado"] >= 0.9
    assert r["CATONGO"]["Amelonado"] >= 0.95
