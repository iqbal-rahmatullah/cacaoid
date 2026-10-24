"""Fill an empty database with the demo batch (DATA SIMULASI), through the same API calls the UI makes.

    uv run python -m cacaoid.engine.simulate   # (re)writes data/simulasi/*.csv
    uv run python -m cacaoid.seed              # creates "Batch demo Sulawesi" if the database has no batch yet
"""
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from cacaoid import config
from cacaoid.db import engine
from cacaoid.main import app
from cacaoid.models import Batch

SIM = config.DATA / "simulasi"
ROLE = {"X-Role": "Pengawas benih"}


def main() -> None:
    with TestClient(app, headers=ROLE) as c:  # the lifespan seeds the clone registry first
        with Session(engine) as s:
            if s.exec(select(Batch)).first():
                print("Database sudah berisi batch; tidak ada yang diubah.")
                return
        field, lab = SIM / "SIMULASI_lapangan.csv", SIM / "SIMULASI_lab.csv"
        r = c.post("/api/batches", data={"name": "Batch demo Sulawesi"}, files={"field": (field.name, field.read_bytes())})
        bid = r.raise_for_status().json()["id"]
        c.post(f"/api/batches/{bid}/lab", files={"lab": (lab.name, lab.read_bytes())}).raise_for_status()
        c.post(f"/api/batches/{bid}/analyze").raise_for_status()
        print(f"Batch demo dibuat (id {bid}).")


if __name__ == "__main__":
    main()
