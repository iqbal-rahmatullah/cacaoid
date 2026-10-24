"""Global search (⌘K in the web app): samples by ID, clones by name, gardens by name or regency."""
from fastapi import APIRouter, Depends
from sqlmodel import Session, or_, select

from cacaoid.db import get_session
from cacaoid.models import Clone, Provider, Sample

router = APIRouter(prefix="/api")
LIMIT = 8


@router.get("/search")
def search(q: str = "", s: Session = Depends(get_session)):
    term = q.strip()
    if not term:
        return {"samples": [], "clones": [], "providers": []}
    has = lambda col: col.icontains(term, autoescape=True)  # noqa: E731
    samples = s.exec(select(Sample).where(Sample.is_control == False, has(Sample.sample_id))  # noqa: E712
                     .order_by(Sample.batch_id.desc(), Sample.sample_id).limit(LIMIT)).all()
    clones = s.exec(select(Clone).where(has(Clone.name)).order_by(Clone.name).limit(LIMIT)).all()
    gardens = s.exec(select(Provider).where(or_(has(Provider.name), has(Provider.regency)))
                     .order_by(Provider.name).limit(LIMIT)).all()
    return {"samples": [{"batch_id": x.batch_id, "sample_id": x.sample_id, "claim": x.claim, "kind": x.kind,
                         "verdict": x.verdict} for x in samples],
            "clones": [{"name": c.name, "status": c.status} for c in clones],
            "providers": [{"id": p.id, "name": p.name, "regency": p.regency, "province": p.province} for p in gardens]}
