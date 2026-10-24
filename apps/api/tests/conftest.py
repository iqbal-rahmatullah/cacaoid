import os
import tempfile

os.environ["CACAOID_DB"] = os.path.join(tempfile.mkdtemp(), "test.db")  # before cacaoid.db is imported

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from cacaoid.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:  # runs lifespan -> init_db seeds the registry once
        yield c
