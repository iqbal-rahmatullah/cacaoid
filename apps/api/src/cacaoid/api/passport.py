"""Paspor Bibit: DNA-verified clone identity + planting-plot location + EUDR deforestation screen."""
import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from cacaoid.db import get_session
from cacaoid.engine import eudr
from cacaoid.models import Batch, Sample

router = APIRouter(prefix="/api")
VERIFIED = {"COCOK", "SESUAI SILANGAN"}


def point(x: Sample) -> dict:
    return {"type": "Point", "coordinates": [x.lon, x.lat]}


@router.get("/batches/{batch_id}/samples/{sample_id}/passport")
def passport(batch_id: int, sample_id: str, s: Session = Depends(get_session)):
    x = s.exec(select(Sample).where(Sample.batch_id == batch_id, Sample.sample_id == sample_id)).first()
    if not x:
        raise HTTPException(404, "Sampel tidak ditemukan")
    identity = {"verdict": x.verdict, "claim": x.claim, "verified": x.verdict in VERIFIED,
                "found_as": x.found_as}
    if x.lat is None or x.lon is None:
        return {"identity": identity, "plot": None, "eudr": None,
                "message": "Sampel tanpa GPS: lokasi tanam tidak bisa dicek. Ambil ulang titik GPS saat penyaluran."}
    return {"identity": identity, "plot": point(x), "eudr": eudr.check_plot(point(x))}


@router.get("/batches/{batch_id}/eudr.geojson")
def batch_geojson(batch_id: int, s: Session = Depends(get_session)):
    """Plots of DNA-verified seedlings with GPS, in the EU Information System GeoJSON format."""
    if not s.get(Batch, batch_id):
        raise HTTPException(404, "Batch tidak ditemukan")
    xs = [x for x in s.exec(select(Sample).where(Sample.batch_id == batch_id)).all()
          if not x.is_control and x.verdict in VERIFIED and x.lat is not None]
    if not xs:
        raise HTTPException(404, "Belum ada bibit terverifikasi DNA yang punya GPS di batch ini")
    fc = eudr.to_eudr_geojson([{"geometry": point(x), "producer_name": x.provider or "—",
                                "production_place": ", ".join(p for p in (x.regency, x.province) if p) or "—",
                                "plot_id": x.sample_id, "sample_id": x.sample_id, "batch_id": batch_id,
                                "clone": x.claim, "clone_verified": True, "verdict": x.verdict} for x in xs])
    return Response(json.dumps(fc, ensure_ascii=False), media_type="application/geo+json",
                    headers={"Content-Disposition": f'attachment; filename="eudr_batch{batch_id}.geojson"'})


class Plot(BaseModel):
    lat: float = Field(ge=-11, le=6)
    lon: float = Field(ge=94, le=142)


@router.post("/eudr/check")
def check_point(p: Plot):
    return eudr.check_plot({"type": "Point", "coordinates": [p.lon, p.lat]})
