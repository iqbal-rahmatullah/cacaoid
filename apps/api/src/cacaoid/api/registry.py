from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from cacaoid.db import PANEL_NAME, get_session
from cacaoid.engine.io import norm_call
from cacaoid.engine.identity import key
from cacaoid.models import Clone, Panel, Provider

router = APIRouter(prefix="/api")


def panel_snps(s: Session) -> list[str]:
    return s.exec(select(Panel).where(Panel.name == PANEL_NAME)).one().snps


@router.get("/panel")
def get_panel(s: Session = Depends(get_session)):
    return {"name": PANEL_NAME, "snps": panel_snps(s)}


@router.get("/clones")
def list_clones(q: str = "", s: Session = Depends(get_session)):
    rows = s.exec(select(Clone).where(Clone.name.contains(q)).order_by(Clone.status.desc(), Clone.name)).all()
    return [{**c.model_dump(exclude={"profile"}), "has_profile": bool(c.profile)} for c in rows]


@router.get("/clones/{name}")
def get_clone(name: str, s: Session = Depends(get_session)):
    c = s.exec(select(Clone).where(Clone.name == name)).first()
    if not c:
        raise HTTPException(404, "Klon tidak ditemukan")
    snps = panel_snps(s)
    return {**c.model_dump(exclude={"profile"}), "panel": [{"snp": x, "call": c.profile.get(x)} for x in snps]}


class CloneIn(BaseModel):
    name: str
    kind: str = "klon"
    group: str | None = None
    parent1: str | None = None
    parent2: str | None = None
    profile: dict[str, str] = {}
    allow_synonym: bool = False   # owner confirms a genetically identical entry is intended


def synonyms(s: Session, prof: dict[str, str]) -> list[str]:
    """Existing references with the same panel genotype (<= 2 differences: what two lab reads of one clone show).
    Close relatives differ more (e.g. ICS60 vs ICS45: 5 of 47) and stay legitimate separate entries."""
    out = []
    for c in s.exec(select(Clone)).all():
        both = [x for x in panel_snps(s) if prof.get(x) and c.profile.get(x)]
        if len(both) >= 20 and sum(prof[x] != c.profile[x] for x in both) <= 2:
            out.append(c.name)
    return out


@router.post("/clones", status_code=201)
def add_clone(body: CloneIn, s: Session = Depends(get_session)):
    if s.exec(select(Clone).where(Clone.name == body.name)).first():
        raise HTTPException(409, "Nama klon sudah ada di registri")
    prof = {k: v for k, v in ((k, norm_call(v)) for k, v in body.profile.items()) if v}
    if prof and not body.allow_synonym and (same := synonyms(s, prof)):
        raise HTTPException(409, f"Sidik jari ini sama dengan {', '.join(same[:3])} di registri (kemungkinan sinonim "
                                 f"atau salah ambil pohon). Periksa dulu; tambahkan hanya bila pemilik klon memastikannya.")
    c = Clone(**body.model_dump(exclude={"profile", "allow_synonym"}), profile=prof, n_trees=1 if prof else 0,
              status="referensi" if prof else "menunggu referensi", source="Ditambahkan pengguna")
    s.add(c)
    s.commit()
    return {"name": c.name, "status": c.status}


class ProviderIn(BaseModel):
    name: str
    kind: str = "kebun entres"
    province: str = ""
    regency: str = ""
    clones: list[str] = []


def canonical(s: Session, names: list[str]) -> list[str]:
    """Garden clones must be registry entries (spelling variants allowed), so parentage can use them."""
    reg = {key(c.name): c.name for c in s.exec(select(Clone)).all()}
    if unknown := [n for n in names if key(n) not in reg]:
        raise HTTPException(400, f"Tidak ada di registri: {', '.join(unknown)}. Daftarkan klonnya dulu.")
    return list(dict.fromkeys(reg[key(n)] for n in names))


@router.get("/providers")
def list_providers(s: Session = Depends(get_session)):
    return s.exec(select(Provider).order_by(Provider.name)).all()


@router.post("/providers", status_code=201)
def add_provider(body: ProviderIn, s: Session = Depends(get_session)):
    if s.exec(select(Provider).where(Provider.name == body.name.strip())).first():
        raise HTTPException(409, "Penyedia sudah terdaftar")
    p = Provider(**body.model_dump(exclude={"clones", "name"}), name=body.name.strip(), clones=canonical(s, body.clones),
                 source="Didaftarkan pengguna")
    s.add(p)
    s.commit()
    s.refresh(p)
    return p


@router.put("/providers/{provider_id}/clones")
def set_garden(provider_id: int, clones: list[str], s: Session = Depends(get_session)):
    p = s.get(Provider, provider_id)
    if not p:
        raise HTTPException(404, "Penyedia tidak ditemukan")
    p.clones = canonical(s, clones)
    s.add(p)
    s.commit()
    s.refresh(p)
    return p
