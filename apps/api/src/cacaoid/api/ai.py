"""Analitik AI: yield components, black pod seedling ranking, reflex testing, ancestry, clone mix, location."""
import csv
import hashlib
import io

import numpy as np
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from cacaoid import audit, config
from cacaoid.api.batches import actor, table
from cacaoid.db import get_session
from cacaoid.engine import ai_blackpod, ai_traits, compat
from cacaoid.engine.ai_ancestry import MISSING_GROUPS, Ancestry
from cacaoid.engine.io import parse_kasp_rows
from cacaoid.engine.registry import genotype_freqs
from cacaoid.engine.simulate import child, stranger
from cacaoid.models import Clone, Sample

router = APIRouter(prefix="/api/ai")
MIN_COVERAGE = 0.8  # below this most model SNPs would be imputed and every tree looks average
MIN_BP_COVERAGE = 0.5  # black pod: share of the model's markers called
KEEP = 0.25  # seedlings kept per cross in the validated use (data/validation/selection.json)


def profiles(s: Session, names: list[str]) -> dict[str, dict]:
    rows = s.exec(select(Clone).where(Clone.name.in_(names))).all()
    found = {c.name: c.profile for c in rows if c.profile}
    if missing := [n for n in names if n not in found]:
        raise HTTPException(404, f"Tidak ada genotipe untuk: {', '.join(missing)}")
    return found


def with_refusal(name: str, p: dict) -> dict:
    if p["coverage"] < MIN_COVERAGE:
        return {"name": name, "coverage": p["coverage"], "traits": None, "message":
                f"Hanya {p['coverage']:.0%} SNP model yang tergenotipe. Prediksi butuh genotyping genome-wide "
                f"(±{len(ai_traits.model()['snps'])} SNP), bukan panel verifikasi 48 SNP."}
    return {"name": name, **p}


@router.get("/traits")
def traits(names: list[str] = Query(...), s: Session = Depends(get_session)):
    prof = profiles(s, names)
    return [with_refusal(n, p) for n, p in zip(prof, ai_traits.predict(list(prof.values())))]


class Cross(BaseModel):
    parent1: str
    parent2: str
    n: int = Field(30, ge=5, le=200)
    seed: int = 1


@router.post("/cross")
def cross(body: Cross, s: Session = Depends(get_session)):
    """Simulated seedlings of a planned cross, ranked by predicted bean count: which to keep for field trials."""
    prof = profiles(s, [body.parent1, body.parent2])
    snps = ai_traits.model()["snps"]
    freqs = genotype_freqs([c.profile for c in s.exec(select(Clone)).all() if c.profile], snps)
    rng = np.random.default_rng(body.seed)
    kids = [child(prof[body.parent1], prof[body.parent2], snps, rng, freqs) for _ in range(body.n)]
    preds = ai_traits.predict(kids + [prof[body.parent1], prof[body.parent2]])
    seedlings = [{"name": f"Semaian {i + 1:02d}", **p} for i, p in enumerate(preds[:body.n])]
    seedlings.sort(key=lambda x: -x["traits"]["FR_BEN"]["value"])
    return {"parents": [{"name": n, **p} for n, p in zip((body.parent1, body.parent2), preds[body.n:])], "seedlings": seedlings,
            "simulated": True}


_anc: dict = {}


def ancestry_model(s: Session) -> Ancestry:
    if "m" not in _anc:
        m = ai_traits.model()
        _anc["m"] = Ancestry(s.exec(select(Clone).where(Clone.status == "referensi")).all(), m["snps"], m["alleles"])
    return _anc["m"]


def caveats(a: Ancestry, called: int) -> list[str]:
    out = [f"Kelompok {', '.join(MISSING_GROUPS)} belum punya pohon referensi di registri: pohon berlatar belakang "
           f"itu terbaca sebagai campuran kelompok lain. Trinitario bukan kelompok, melainkan campuran Criollo × Amelonado.",
           "Kelompok pohon referensi ditentukan dari nama aksesi; pohon Criollo dan Amelonado dicek dengan genom publik "
           "(belum dari analisis STRUCTURE penuh)."]
    if called < 100:
        out.append(f"Hanya {called} SNP: komposisi adalah perkiraan kasar.")
    return out


@router.get("/ancestry")
def ancestry(names: list[str] = Query(...), s: Session = Depends(get_session)):
    a = ancestry_model(s)
    out = []
    for n, p in profiles(s, names).items():
        called = sum(bool(p.get(x)) for x in a.snps)
        out.append({"name": n, **a.admix(p), "warnings": caveats(a, called), "references": a.n_ref})
    return out


@router.get("/ancestry/sample")
def ancestry_sample(batch_id: int, sample_id: str, s: Session = Depends(get_session)):
    """Field sample (panel genotypes only): rough composition plus the garden parentage found during analysis."""
    x = s.exec(select(Sample).where(Sample.batch_id == batch_id, Sample.sample_id == sample_id)).first()
    if not x or not x.calls:
        raise HTTPException(404, "Sampel belum punya genotipe")
    a = ancestry_model(s)
    called = sum(bool(x.calls.get(snp)) for snp in a.snps)
    if called < 30:
        raise HTTPException(422, f"Hanya {called} SNP yang bisa dipakai; terlalu sedikit untuk asal-usul.")
    return {"name": x.sample_id, "claim": x.claim, "verdict": x.verdict, **a.admix(x.calls),
            "parentage": x.result.get("parentage"), "warnings": caveats(a, called), "references": a.n_ref}


class Mix(BaseModel):
    clones: list[str] = Field(min_length=1, max_length=12)


_mix: dict = {}


def registry_fingerprints(s: Session) -> dict[str, dict]:
    return {c.name: c.profile for c in s.exec(select(Clone).where(Clone.status == "referensi")).all() if c.profile}


def mix_advice(s: Session, clones: list[str]) -> dict:
    regs = registry_fingerprints(s)
    if "bg" not in _mix:  # similarity of random registry pairs, to say how unusual a pair is
        rng, names = np.random.default_rng(0), list(regs)
        idx = rng.choice(len(names), size=(1500, 2))
        _mix["bg"] = [x for i, j in idx if i != j and (x := compat.similarity(regs[names[i]], regs[names[j]])[0]) is not None]
    wanted = {compat.k(c) for c in clones}
    return compat.advise(clones, {n: p for n, p in regs.items() if compat.k(n) in wanted}, _mix["bg"])


@router.post("/mix")
def clone_mix(body: Mix, s: Session = Depends(get_session)):
    """Can the clones planned for one block pollinate each other? (literature + DNA prediction + relatedness)"""
    return mix_advice(s, body.clones)


@router.get("/mix/options")
def clone_mix_options(s: Session = Depends(get_session)):
    d = compat.data()
    indo = sorted({f["clone"] for f in d["facts"]} | {c["female"] for c in d["crosses"]})
    return {"indonesia": indo, "with_dna_profile": sorted(r["clone"] for r in d["profiles"].values()),
            "registry": sorted(registry_fingerprints(s))}


@router.get("/where")
def where_to_plant(lat: float = Query(..., ge=-11, le=6), lon: float = Query(..., ge=94, le=142),
                   clones: list[str] = Query(None)):
    """Trial sites with the most similar climate to this location, and what was measured there (optionally only
    for the given clones, e.g. the clone claimed and the clone found for a sample)."""
    from cacaoid.engine import agroclimate, impact
    try:
        r = agroclimate.analogs(lat, lon)
        if clones:
            keep = {impact.canonical(c) or c for c in clones}
            for site in r["sites"]:
                site["evidence"] = [e for e in site["evidence"] if e["clone"] in keep]
            r["clones"] = sorted(keep)
        return r
    except OSError as e:  # NASA POWER unreachable and location not cached
        raise HTTPException(503, f"Data iklim tidak bisa diambil saat ini ({e.__class__.__name__}). Coba lagi.")


@router.post("/seedlings")
async def seedling_ranking(lab: UploadFile = File(...)):
    """Black pod: rank the seedlings of ONE cross from their genome-wide genotypes (marker x seedling 0/1/2 matrix,
    Jacquotte marker ids). Validated only for ranking within a cross (data/validation/selection.json, newparent.json);
    not for comparing clones or unrelated trees, so no absolute class is returned."""
    mat = ai_blackpod.read_matrix((await lab.read()).decode("utf-8", "replace"))
    pred = {k: ai_blackpod.predict(d) for k, d in mat.items()}
    ok = {k: p for k, p in pred.items() if p["coverage"] >= MIN_BP_COVERAGE}
    if len(ok) < 4:
        raise HTTPException(422, "Perlu minimal 4 semaian dengan ≥50% marka model terbaca. Baris pertama: ID marka lalu "
                                 "ID semaian; isi sel 0/1/2 (salinan alel ALT terhadap Criollo V2).")
    order = sorted(ok, key=lambda k: ok[k]["value"])
    keep = max(1, round(KEEP * len(order)))
    return {"seedlings": [{"id": k, "rank": i + 1, "score": ok[k]["value"], "coverage": ok[k]["coverage"], "keep": i < keep}
                          for i, k in enumerate(order)],
            "skipped": sorted(set(pred) - set(ok)), "keep": keep,
            "note": "Urutan dalam satu silangan: makin atas, makin sedikit buah busuk yang diprediksi. Simpan semaian teratas "
                    "untuk uji lapang; ini prioritas, bukan vonis. Skor bukan persen buah busuk di kebun. Jangan bandingkan skor "
                    "antar-silangan atau antar-klon: untuk itu model belum tervalidasi."}


@router.get("/seedlings/example.csv", response_class=PlainTextResponse)
def seedling_example(family: str = "PA-51 x ICS-95"):
    """Real seedlings of one Jacquotte et al. 2026 family (CC0) in the upload format, for the demo. This family is part
    of the training data, so its ranking here is optimistic."""
    X, _y, pop, markers = ai_blackpod.load()
    ids = [f"{family.replace(' ', '')}-{i + 1:02d}" for i in range(int((pop == family).sum()))]
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["marker", *ids])
    for j, m in enumerate(markers):
        w.writerow([m, *X[pop == family, j].astype(int)])
    return out.getvalue()


@router.get("/reflex")
def reflex_queue(batch_id: int, s: Session = Depends(get_session)):
    """Uji refleks: trees the 48-SNP panel could not place (TIDAK DIKENAL) need genome-wide genotyping before any
    trait prediction; this is the list to send to the lab, with results once uploaded."""
    xs = s.exec(select(Sample).where(Sample.batch_id == batch_id, Sample.verdict == "TIDAK DIKENAL")).all()
    return {"batch_id": batch_id, "snps": len(ai_traits.model()["snps"]),
            "samples": [{"sample_id": x.sample_id, "claim": x.claim, "provider": x.provider, "kind": x.kind,
                         "refleks": x.result.get("refleks")} for x in xs if not x.is_control]}


@router.get("/reflex/example.csv", response_class=PlainTextResponse)
def reflex_example(batch_id: int, s: Session = Depends(get_session)):
    """DATA SIMULASI genome-wide file for this batch's TIDAK DIKENAL trees, in the upload format, for the demo: a
    seedling of the garden clones the panel found as its parents, or an unrelated tree when none were found."""
    if not config.SIMULATED:
        raise HTTPException(404, "File simulasi tidak tersedia untuk data nyata")
    snps = ai_traits.model()["snps"]
    refs = {c.name: c.profile for c in s.exec(select(Clone).where(Clone.status == "referensi")).all() if c.profile}
    freqs = genotype_freqs(list(refs.values()), snps)
    rng = np.random.default_rng(batch_id)
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["sample_id", *snps])
    for x in s.exec(select(Sample).where(Sample.batch_id == batch_id, Sample.verdict == "TIDAK DIKENAL")).all():
        if x.is_control:
            continue
        par = (x.result.get("parentage") or {}).get("parents") or []
        geno = (child(refs[par[0]], refs[par[1]], snps, rng, freqs) if len(par) == 2 and all(p in refs for p in par)
                else stranger(snps, rng, freqs))
        w.writerow([x.sample_id, *(geno.get(snp) or "" for snp in snps)])
    return PlainTextResponse(out.getvalue(), media_type="text/csv",
                             headers={"Content-Disposition": f'attachment; filename="SIMULASI_genome_wide_batch{batch_id}.csv"'})


@router.post("/reflex")
async def reflex_upload(batch_id: int, lab: UploadFile = File(...), s: Session = Depends(get_session),
                        who: str = Depends(actor)):
    """Genome-wide genotypes of reflex trees (lab format: sample id + one column per TcSNP) -> yield components and
    ancestry, the two models validated for single trees (data/validation/traits.json, ancestry.json)."""
    raw = await lab.read()
    try:
        geno = parse_kasp_rows(table(raw))
    except ValueError as e:
        raise HTTPException(400, str(e))
    xs = {x.sample_id.upper(): x for x in s.exec(select(Sample).where(Sample.batch_id == batch_id)).all()}
    a = ancestry_model(s)
    done, unknown = [], []
    for sid, calls in zip(geno.samples, geno.calls):
        x = xs.get(sid.strip().upper())
        if not x:
            unknown.append(sid)
            continue
        prof = {snp: c for snp, c in zip(geno.snps, calls) if c}
        p = ai_traits.predict([prof])[0]
        ok = p["coverage"] >= MIN_COVERAGE
        x.result = {**x.result, "refleks": {
            "file": lab.filename, "coverage": p["coverage"], "traits": p["traits"] if ok else None,
            "ancestry": a.admix(prof) if ok else None,
            "message": None if ok else f"Hanya {p['coverage']:.0%} SNP model terbaca; perlu genotyping genome-wide "
                                       f"(±{len(ai_traits.model()['snps'])} SNP), bukan panel 48 SNP."}}
        s.add(x)
        done.append(x.sample_id)
    if not done:
        raise HTTPException(422, "Tidak ada ID sampel di file ini yang cocok dengan sampel di batch ini.")
    audit.log(s, who, "refleks.diunggah", batch_id, file=lab.filename, sha256=hashlib.sha256(raw).hexdigest(),
              samples=done)
    s.commit()
    return {"updated": done, "unknown_ids": unknown}
