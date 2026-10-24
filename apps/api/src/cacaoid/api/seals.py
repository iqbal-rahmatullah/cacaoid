"""QR cek keaslian: a printed berita acara or seedling passport carries a code that anyone can check on a public,
read-only page. Public data is limited on purpose (docs/KEPUTUSAN.md): no officer names, no lab files, no per-SNP
data, and a planting point only to ~1 km."""
import hashlib
import json
import secrets
from collections import Counter
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from cacaoid import audit
from cacaoid.audit import actor
from cacaoid.api.batches import find_sample, get_batch, samples_of
from cacaoid.db import get_session
from cacaoid.engine import eudr
from cacaoid.models import Batch, Sample, Seal

router = APIRouter(prefix="/api")
VERIFIED = {"COCOK", "SESUAI SILANGAN"}


def public_view(s: Session, kind: str, b: Batch, x: Sample | None) -> dict:
    base = {"batch": b.name, "analyzed": b.analyzed_at.date().isoformat() if b.analyzed_at else None}
    if kind == "berita-acara":
        field = [y for y in samples_of(s, b.id) if not y.is_control]
        controls = b.qc.get("control_results") or []
        return base | {"samples": len(field), "counts": dict(sorted(Counter(y.verdict for y in field if y.verdict).items())),
                       "lots": [{"lot": l["lot"], "claim": l["claim"], "decision": l["decision"]} for l in b.qc.get("lots", [])],
                       "controls_ok": all(c["ok"] for c in controls) if controls else None}
    return base | {"sample_id": x.sample_id, "kind": x.kind, "claim": x.claim, "verdict": x.verdict,
                   "verified": x.verdict in VERIFIED, "provider": x.provider, "regency": x.regency, "province": x.province,
                   "area": [round(x.lat, 2), round(x.lon, 2)] if x.lat is not None and x.lon is not None else None}


def digest(view: dict) -> str:
    return hashlib.sha256(json.dumps(view, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


class SealIn(BaseModel):
    kind: Literal["berita-acara", "paspor"]
    batch_id: int
    sample_id: str | None = None


def target(s: Session, kind: str, batch_id: int, sample_id: str | None) -> tuple[Batch, Sample | None]:
    b = get_batch(s, batch_id)
    x = find_sample(s, batch_id, sample_id) if sample_id else None
    if kind == "paspor" and not x:
        raise HTTPException(422 if not sample_id else 404, "Paspor bibit butuh ID sampel yang ada di batch ini.")
    if not b.analyzed_at or (x and not x.verdict):
        raise HTTPException(409, "Belum ada vonis untuk dokumen ini.")
    return b, x


@router.post("/seals", status_code=201)
def issue_seal(body: SealIn, s: Session = Depends(get_session), who: str = Depends(actor)):
    """Same document with the same data -> same code; changed data -> a new code for the new printout."""
    b, x = target(s, body.kind, body.batch_id, body.sample_id)
    view = public_view(s, body.kind, b, x)
    d = digest(view)
    same_doc = Seal.sample_id == body.sample_id if body.sample_id else Seal.sample_id.is_(None)
    old = s.exec(select(Seal).where(Seal.kind == body.kind, Seal.batch_id == b.id, same_doc, Seal.digest == d)).first()
    if old:
        return {"code": old.code, "kind": old.kind, "created_at": old.created_at}
    payload = dict(view)
    if x and x.lat is not None and x.lon is not None:  # screening result at print time; slow, so not re-run on every check
        payload["eudr"] = eudr.check_plot({"type": "Point", "coordinates": [x.lon, x.lat]})["verdict"]
    seal = Seal(code=secrets.token_urlsafe(8), kind=body.kind, batch_id=b.id, sample_id=body.sample_id, payload=payload,
                digest=d)
    s.add(seal)
    audit.log(s, who, "segel.dibuat", b.id, body.sample_id, kind=body.kind, code=seal.code, digest=d)
    s.commit()
    return {"code": seal.code, "kind": seal.kind, "created_at": seal.created_at}


@router.get("/public/seals/{code}")
def check_seal(code: str, s: Session = Depends(get_session)):
    """Public, read-only: what was printed, whether the data still matches, and whether the audit chain is intact."""
    seal = s.exec(select(Seal).where(Seal.code == code)).first()
    if not seal:
        raise HTTPException(404, "Kode tidak dikenal. Dokumen ini tidak diterbitkan oleh CacaoID.")
    b = s.get(Batch, seal.batch_id)
    x = find_sample(s, seal.batch_id, seal.sample_id) if seal.sample_id else None
    current = public_view(s, seal.kind, b, x) if b and (x or seal.kind == "berita-acara") else None
    return {"code": seal.code, "kind": seal.kind, "issued_at": seal.created_at, "data": seal.payload,
            "unchanged": current is not None and digest(current) == seal.digest, "chain_ok": audit.verify(s)["ok"]}
