def test_search_finds_samples_clones_and_gardens(client, demo_batch):
    hits = client.get("/api/search", params={"q": "sim-065"}).json()["samples"]  # case-insensitive
    assert hits and {x["sample_id"] for x in hits} == {"SIM-065"}  # demo_batch guarantees at least one
    ids = [x["batch_id"] for x in hits]
    assert ids == sorted(ids, reverse=True) and ids[0] >= demo_batch  # newest batch first
    assert "Sulawesi 1" in [c["name"] for c in client.get("/api/search", params={"q": "sulawesi"}).json()["clones"]]
    gardens = client.get("/api/search", params={"q": "kolaka"}).json()["providers"]
    assert gardens and gardens[0]["name"] == "KE Simulasi Kolaka"
    assert client.get("/api/search", params={"q": " "}).json() == {"samples": [], "clones": [], "providers": []}
    assert len(client.get("/api/search", params={"q": "sim"}).json()["samples"]) <= 8
