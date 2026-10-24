"""Field-trial facts behind verdicts: what a clone mix-up means for yield and disease."""
from fastapi import APIRouter

from cacaoid.engine import impact

router = APIRouter(prefix="/api/traits")


@router.get("/clone/{name}")
def clone_card(name: str):
    return impact.card(name)


@router.get("/compare")
def compare(paid: str, received: str):
    return impact.compare(paid, received)


@router.get("/rules")
def rules(cross: str | None = None):
    return {"rootstock": impact.rootstock_rule(), "hybrid_vsd": impact.hybrid_vsd(cross)}
