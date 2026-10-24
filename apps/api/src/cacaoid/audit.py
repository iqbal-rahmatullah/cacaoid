"""Hash-chained audit trail. ponytail: actor is the self-declared role (no auth in the MVP)."""
import hashlib
import json
from datetime import datetime, timezone

from fastapi import Header
from sqlmodel import Session, select

from cacaoid.models import AuditEvent

GENESIS = "0" * 64


def actor(x_role: str = Header("tidak diketahui")) -> str:
    """Who to write in the trail: the self-declared role until login exists (ROADMAP Fase 3)."""
    return x_role


def digest(prev: str, ts: str, actor: str, action: str, batch_id, sample_id, payload: dict) -> str:
    body = json.dumps([prev, ts, actor, action, batch_id, sample_id, payload], sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(body.encode()).hexdigest()


def log(s: Session, actor: str, action: str, batch_id: int | None = None, sample_id: str | None = None,
        **payload) -> AuditEvent:
    last = s.exec(select(AuditEvent).order_by(AuditEvent.id.desc())).first()
    prev = last.hash if last else GENESIS
    ts = datetime.now(timezone.utc).isoformat(timespec="seconds")
    e = AuditEvent(ts=ts, actor=actor, action=action, batch_id=batch_id, sample_id=sample_id, payload=payload,
                   prev_hash=prev, hash=digest(prev, ts, actor, action, batch_id, sample_id, payload))
    s.add(e)
    return e


def verify(s: Session) -> dict:
    """Recompute the whole chain; report the first event whose content or link no longer matches."""
    prev, n = GENESIS, 0
    for e in s.exec(select(AuditEvent).order_by(AuditEvent.id)).all():
        if e.prev_hash != prev or e.hash != digest(prev, e.ts, e.actor, e.action, e.batch_id, e.sample_id, e.payload):
            return {"ok": False, "events": n, "broken_at": e.id}
        prev, n = e.hash, n + 1
    return {"ok": True, "events": n, "head": prev}
