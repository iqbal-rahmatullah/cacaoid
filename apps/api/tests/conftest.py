import os
import tempfile

os.environ["CACAOID_DB"] = os.path.join(tempfile.mkdtemp(), "test.db")  # before cacaoid.db is imported
os.environ["CACAOID_UPLOADS"] = tempfile.mkdtemp()  # evidence photos from tests never land in apps/api/uploads

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from cacaoid.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:  # runs lifespan -> init_db seeds the registry once
        yield c


@pytest.fixture(scope="session")
def demo_batch(client, tmp_path_factory):
    """One analysed simulated batch shared by tests that only read results."""
    from cacaoid.engine.simulate import load_world, write
    field, lab, _ = write(tmp_path_factory.mktemp("demo"), *load_world())
    bid = client.post("/api/batches", data={"name": "Demo bersama"}, files={"field": field.open("rb")}).json()["id"]
    client.post(f"/api/batches/{bid}/lab", files={"lab": lab.open("rb")})
    client.post(f"/api/batches/{bid}/analyze")
    return bid
