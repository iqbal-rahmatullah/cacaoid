"""Program dashboard and provider risk, aggregated from verified samples."""
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from cacaoid.db import get_session
from cacaoid.engine.risk import BAD, score
from cacaoid.models import Batch, Sample

router = APIRouter(prefix="/api")


def field_samples(s: Session) -> list[Sample]:
    return [x for x in s.exec(select(Sample)).all() if not x.is_control]


def held_lots(s: Session) -> set[tuple[int, str]]:
    return {(b.id, l["lot"]) for b in s.exec(select(Batch)).all() for l in b.qc.get("lots", []) if l["decision"] == "TAHAN"}


@router.get("/ai/risk")
def provider_risk(s: Session = Depends(get_session)):
    held = held_lots(s)
    by = defaultdict(list)
    for x in field_samples(s):
        if x.provider:
            by[x.provider].append(x)
    out = []
    for prov, xs in by.items():
        done = [x for x in xs if x.verdict and x.verdict not in ("UJI ULANG", "BELUM ADA REFERENSI")]
        lots = {(x.batch_id, x.lot) for x in xs if x.kind == "bibit hibrida"} & held
        r = score(len(done), sum(x.verdict in BAD for x in done), len(lots), sum(x.lat is None for x in xs))
        out.append({"provider": prov, "province": xs[0].province, "regency": xs[0].regency, "n": len(done),
                    "bad": sum(x.verdict in BAD for x in done), **r})
    return sorted(out, key=lambda r: -r["score"])


@router.get("/dashboard")
def dashboard(s: Session = Depends(get_session)):
    xs = field_samples(s)
    done = [x for x in xs if x.verdict and x.verdict not in ("UJI ULANG", "BELUM ADA REFERENSI")]
    ok = [x for x in done if x.verdict in ("COCOK", "SESUAI SILANGAN")]

    def rates(keyf):
        g = defaultdict(lambda: [0, 0])
        for x in done:
            g[keyf(x)][0] += x.verdict in BAD
            g[keyf(x)][1] += 1
        return sorted(({"name": k or "—", "bad": b, "n": n, "rate": round(b / n, 3)} for k, (b, n) in g.items()),
                      key=lambda r: -r["rate"])

    verdicts = defaultdict(int)
    for x in xs:
        verdicts[x.verdict or ("menunggu lab" if x.call_rate is None else "belum dianalisis")] += 1
    return {
        "samples": len(xs), "verified": len(done), "ok": len(ok),
        "verified_ok_rate": round(len(ok) / len(done), 3) if done else None,
        "bad": len(done) - len(ok), "awaiting_lab": sum(x.call_rate is None for x in xs),
        "retest": sum(x.verdict == "UJI ULANG" for x in xs),
        "no_reference": sum(x.verdict == "BELUM ADA REFERENSI" for x in xs),
        "lots_held": len(held_lots(s)), "purification": sum(x.action == "pemurnian" for x in xs),
        "batches": len(s.exec(select(Batch)).all()), "verdicts": dict(verdicts),
        "by_province": rates(lambda x: x.province), "by_provider": rates(lambda x: x.provider),
        "by_kind": rates(lambda x: x.kind),
    }
