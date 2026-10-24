"""Batch flow: field manifest -> lab results (+QC preview) -> analysis -> results per sample."""
import csv
import hashlib
import io
import math
import re
from collections import Counter
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse, PlainTextResponse
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from cacaoid import audit, config
from cacaoid.api.registry import panel_snps
from cacaoid.db import get_session
from cacaoid.engine.contamination import LotChecker
from cacaoid.engine.identity import Matcher, key
from cacaoid.engine.parentage import Parentage, explain_unknown
from cacaoid.engine.io import parse_kasp_rows, read_table
from cacaoid.engine.qc import fix_strand, run_qc
from cacaoid.engine.registry import genotype_freqs
from cacaoid.models import AuditEvent, Batch, Clone, Provider, Sample

router = APIRouter(prefix="/api")
FIELD_COLS = {"sample_id": "sample_id", "klaim": "claim", "jenis_sampel": "kind", "lot": "lot", "penyedia": "provider",
              "provinsi": "province", "kabupaten": "regency", "tanggal": "date", "petugas": "officer",
              "posisi": "position"}
# Plate controls follow a naming rule: KTRL-POS-<clone> must match <clone>; KTRL-NTC* must stay empty.
POS, NTC = "KTRL-POS-", "KTRL-NTC"
SIM_FILES = {"SIMULASI_lapangan.csv", "SIMULASI_lab.csv", "SIMULASI_kunci.csv"}


def table(raw: bytes) -> list[list[str]]:
    try:
        return read_table(raw)
    except (UnicodeDecodeError, ValueError, KeyError, OSError):
        raise HTTPException(400, "File harus CSV (UTF-8, pemisah koma/titik koma) atau Excel .xlsx.")


def actor(x_role: str = Header("tidak diketahui")) -> str:
    return x_role


def dupes(ids: list[str]) -> list[str]:
    return sorted(i for i, n in Counter(ids).items() if n > 1)


def to_float(v) -> float | None:
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def get_batch(s: Session, batch_id: int) -> Batch:
    b = s.get(Batch, batch_id)
    if not b:
        raise HTTPException(404, "Batch tidak ditemukan")
    return b


def samples_of(s: Session, batch_id: int) -> list[Sample]:
    return list(s.exec(select(Sample).where(Sample.batch_id == batch_id).order_by(Sample.id)).all())


def csv_file(rows: list[list], filename: str) -> PlainTextResponse:
    out = io.StringIO()
    csv.writer(out).writerows(rows)
    return PlainTextResponse(out.getvalue(), media_type="text/csv",
                             headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.post("/batches", status_code=201)
async def create_batch(name: str = Form(...), field: UploadFile | None = File(None), s: Session = Depends(get_session),
                       who: str = Depends(actor)):
    if field is None:  # empty batch, filled from the field page
        b = Batch(name=name.strip() or "Batch tanpa nama")
        s.add(b)
        s.flush()
        audit.log(s, who, "batch.dibuat", b.id, name=b.name, samples=0)
        s.commit()
        return {"id": b.id, "samples": 0}
    head, *body = table(await field.read()) or [[]]
    rows = [dict(zip([h.strip() for h in head], r)) for r in body if any(c.strip() for c in r)]
    if not rows or not {"sample_id", "klaim"} <= set(rows[0]):
        raise HTTPException(400, "Data lapangan wajib punya kolom sample_id dan klaim.")
    ids = [r["sample_id"].strip() for r in rows]
    if d := dupes(ids):
        raise HTTPException(400, f"ID sampel duplikat di data lapangan: {', '.join(d[:10])}")
    if "" in ids:
        raise HTTPException(400, "Ada baris tanpa sample_id.")
    b = Batch(name=name.strip() or "Batch tanpa nama")
    s.add(b)
    s.flush()
    for r in rows:
        s.add(Sample(batch_id=b.id, lat=to_float(r.get("lat")), lon=to_float(r.get("lon")),
                     **{attr: (r.get(col) or "").strip() for col, attr in FIELD_COLS.items()}))
    audit.log(s, who, "batch.dibuat", b.id, name=b.name, samples=len(rows), field_file=field.filename)
    s.commit()
    return {"id": b.id, "samples": len(rows)}


class FieldSample(BaseModel):
    sample_id: str = Field(min_length=1, max_length=40, pattern=r"^[A-Za-z0-9._/-]+$")
    claim: str = Field(min_length=1)
    kind: str = "pohon induk entres"
    lot: str = ""
    provider: str = ""
    province: str = ""
    regency: str = ""
    officer: str = ""
    position: str = Field("", max_length=80)
    lat: float | None = Field(None, ge=-90, le=90)
    lon: float | None = Field(None, ge=-180, le=180)
    checklist: list[str] = []


@router.post("/batches/{batch_id}/samples", status_code=201)
def add_sample(batch_id: int, body: FieldSample, s: Session = Depends(get_session), who: str = Depends(actor)):
    get_batch(s, batch_id)
    if s.exec(select(Sample).where(Sample.batch_id == batch_id, Sample.sample_id == body.sample_id)).first():
        raise HTTPException(409, f"ID {body.sample_id} sudah dipakai di batch ini. Ganti label kantong sampel.")
    x = Sample(batch_id=batch_id, date=datetime.now(timezone.utc).date().isoformat(),
               **body.model_dump())
    s.add(x)
    audit.log(s, who, "sampel.dicatat", batch_id, x.sample_id, **body.model_dump(exclude={"sample_id"}))
    s.commit()
    known = any(key(c.name) == key(x.claim) for c in s.exec(select(Clone)).all())
    return {"sample_id": x.sample_id, "gps": x.lat is not None, "claim_known": known}


@router.get("/batches/{batch_id}/manifest.csv", response_class=PlainTextResponse)
def manifest(batch_id: int, s: Session = Depends(get_session)):
    """Blind plate sheet for the lab: positions and IDs only, no claimed clone (keeps the lab unbiased)."""
    get_batch(s, batch_id)
    ids = [x.sample_id for x in samples_of(s, batch_id) if not x.is_control]
    wells = [f"{r}{c}" for c in range(1, 13) for r in "ABCDEFGH"]  # column-wise, as plates are pipetted
    rows = [["plate", "well", "sample_id"]]
    for p in range(0, max(len(ids), 1), 94):  # 94 samples + 2 control wells per 96-well plate
        chunk = ids[p:p + 94] + [f"{POS}ICS60", NTC]
        rows += [[p // 94 + 1, well, sid] for well, sid in zip(wells, chunk)]
    return csv_file(rows, f"manifest_batch{batch_id}.csv")


@router.get("/batches/{batch_id}/results.csv", response_class=PlainTextResponse)
def results_csv(batch_id: int, s: Session = Depends(get_session)):
    """Every verdict with its evidence: the numbers behind it and the sample's genotype at each panel SNP."""
    get_batch(s, batch_id)
    panel = panel_snps(s)
    nums = ("mismatches", "compared", "allowed", "lod")
    rows = [["sample_id", "jenis", "klaim", "vonis", "terbaca_sebagai", "dna_terbaca", "beda", "dibandingkan",
             "batas_beda", "lod", "tindak_lanjut", "penyedia", "lot", "posisi", *panel]]
    for x in samples_of(s, batch_id):
        if not x.is_control:
            rows.append([x.sample_id, x.kind, x.claim, x.verdict or "", x.found_as or "",
                         "" if x.call_rate is None else x.call_rate, *("" if x.result.get(k) is None else x.result[k]
                                                                         for k in nums),
                         x.action or "", x.provider, x.lot, x.position, *(x.calls.get(snp) or "" for snp in panel)])
    return csv_file(rows, f"hasil_batch{batch_id}.csv")


@router.post("/batches/{batch_id}/lab")
async def upload_lab(batch_id: int, lab: UploadFile = File(...), s: Session = Depends(get_session),
                     who: str = Depends(actor)):
    b = get_batch(s, batch_id)
    raw = await lab.read()
    try:
        geno = parse_kasp_rows(table(raw))
    except ValueError as e:
        raise HTTPException(400, str(e))
    if d := dupes(geno.samples):
        raise HTTPException(400, f"ID sampel duplikat di file lab: {', '.join(d[:10])}")
    panel = panel_snps(s)
    if not set(panel) & set(geno.snps):
        raise HTTPException(400, "Tidak ada satu pun SNP panel di file ini. Periksa format atau panel yang dipakai lab.")
    # judge on the panel SNPs the lab actually ran; too few cannot back any verdict (GAPS G-01/G-25)
    used = [x for x in panel if x in set(geno.snps)]
    need = math.ceil(config.MIN_COMPARED + (1 - config.MIN_CALL_RATE) * len(panel))
    if len(used) < need:
        raise HTTPException(400, f"Lab hanya mengirim {len(used)} dari {len(panel)} SNP panel; minimal {need} agar "
                                 f"vonis andal. Minta lab mengulang dengan panel lengkap.")
    warnings = []
    smp = {x.sample_id: x for x in samples_of(s, batch_id)}
    # labs re-type IDs (SIM-001 -> sim-1): match on case and zero padding when that is unambiguous (G-23)
    norm = lambda i: re.sub(r"\d+", lambda m: str(int(m.group())), i.strip().upper())
    by_norm: dict[str, list[str]] = {}
    for sid in smp:
        by_norm.setdefault(norm(sid), []).append(sid)
    mapped = []
    for k, sid in enumerate(geno.samples):
        if sid not in smp and len(by_norm.get(norm(sid), [])) == 1:
            geno.samples[k] = by_norm[norm(sid)][0]
            mapped.append(f"{sid} → {geno.samples[k]}")
    if mapped:
        warnings.append(f"{len(mapped)} ID lab dicocokkan dengan data lapangan setelah menyamakan huruf besar/kecil "
                        f"dan angka nol ({', '.join(mapped[:3])}). Periksa bila ragu.")
    if d := dupes(geno.samples):
        raise HTTPException(400, f"ID sampel duplikat di file lab setelah dicocokkan: {', '.join(d[:10])}")
    # opposite-strand calls (G-21)
    known = {x: {a for c in s.exec(select(Clone)).all() if c.profile.get(x) for a in c.profile[x]} for x in used}
    flipped, palindromic = fix_strand(geno, known)
    if flipped:
        warnings.append(f"Lab melaporkan {len(flipped)} SNP pada untai DNA berlawanan ({', '.join(list(flipped)[:4])}); "
                        f"{sum(flipped.values())} genotipe dikoreksi otomatis (A↔T, C↔G). "
                        + (f"{len(palindromic)} SNP palindromik (A/T, C/G) tidak bisa dicek dengan cara ini; "
                           f"andalkan kontrol positif." if palindromic else ""))
    controls = [i for i in geno.samples if i.startswith(("KTRL-", "KTRL_"))]
    qc = run_qc(geno, used, expected_ids=list(smp) + controls)
    col = {snp: j for j, snp in enumerate(geno.snps)}
    for i, sid in enumerate(geno.samples):
        if sid not in smp and sid not in controls:
            continue
        x = smp.get(sid) or Sample(batch_id=batch_id, sample_id=sid, is_control=True, kind="kontrol",
                                   claim=sid[len(POS):] if sid.startswith(POS) else "")
        x.calls = {snp: geno.calls[i][col[snp]] for snp in used}
        x.call_rate = round(qc.call_rate[sid], 3)
        x.lab_row = i
        x.verdict = x.found_as = x.action = None
        x.result = {}
        s.add(x)
    missing = [x for x in panel if x not in used]
    if missing:
        warnings.append(f"Lab tidak mengirim {len(missing)} SNP panel ({', '.join(missing[:5])}). Vonis memakai "
                        f"{len(used)} SNP yang ada.")
    if qc.unknown_ids:
        warnings.append(f"{len(qc.unknown_ids)} ID di file lab tidak ada di data lapangan dan tidak dianalisis: "
                        f"{', '.join(qc.unknown_ids[:5])}.")
    if qc.missing_ids:
        warnings.append(f"{len(qc.missing_ids)} sampel lapangan belum ada di file lab: {', '.join(qc.missing_ids[:5])}.")
    if not controls:
        warnings.append("Plate tanpa sampel kontrol: kesalahan lab tidak bisa dideteksi.")
    b.lab_file, b.analyzed_at = lab.filename, None
    b.qc = {"n_samples": len(geno.samples), "mean_call_rate": round(qc.mean_call_rate, 3),
            "min_call_rate": config.MIN_CALL_RATE, "retest": qc.retest, "unknown_ids": qc.unknown_ids,
            "missing_ids": qc.missing_ids, "snps_not_in_panel": qc.snps_not_in_panel,
            "panel_snps_missing": missing, "panel_used": used, "strand_fixed": flipped, "id_mapped": mapped,
            "controls": controls, "warnings": warnings}
    s.add(b)
    audit.log(s, who, "lab.diunggah", batch_id, file=lab.filename, sha256=hashlib.sha256(raw).hexdigest(),
              samples=len(geno.samples), mean_call_rate=b.qc["mean_call_rate"])
    s.commit()
    return b.qc


@router.post("/batches/{batch_id}/analyze")
def analyze(batch_id: int, s: Session = Depends(get_session), who: str = Depends(actor)):
    b = get_batch(s, batch_id)
    clones = s.exec(select(Clone)).all()
    m = Matcher(clones, b.qc.get("panel_used") or panel_snps(s))
    par = Parentage({r.name: r.profile for r in m.refs}, m.panel)
    rootstocks = [(c.name, c.parent1, c.parent2) for c in clones if c.kind == "hibrida" and c.parent1 in par.D
                  and c.parent2 in par.D]
    rows = samples_of(s, batch_id)
    # garden composition from the provider registry; unregistered providers fall back to what they claimed here
    registered = {key(p.name): p.clones for p in s.exec(select(Provider)).all()}
    guessed: dict[str, list[str]] = {}
    for x in rows:
        if not x.is_control and x.kind != "bibit hibrida":
            guessed.setdefault(x.provider, []).append(x.claim)
    ctrl = []
    for x in rows:
        if x.call_rate is None or x.kind == "bibit hibrida":  # no lab result yet / judged per lot in check_lots
            continue
        if x.sample_id.startswith(NTC):
            clean = x.call_rate == 0
            x.verdict = "BERSIH" if clean else "TERKONTAMINASI"
            ctrl.append({"id": x.sample_id, "ok": clean, "message": "Kontrol negatif tanpa DNA" if clean else
                         f"Kontrol negatif punya {x.call_rate:.0%} SNP terbaca: kemungkinan kontaminasi di plate"})
        else:
            r = m.identify(x.sample_id, x.calls, x.claim)
            if r["verdict"] == "TIDAK DIKENAL":
                own = registered.get(key(x.provider))
                r = explain_unknown(r, x.calls, par, rootstocks, own if own is not None else guessed.get(x.provider, []),
                                    registered=own is not None)
            x.result, x.verdict, x.found_as = r, r["verdict"], r["found_as"]
            if x.is_control:
                ok = r["verdict"] == "COCOK"
                ctrl.append({"id": x.sample_id, "ok": ok, "message": f"Kontrol positif {x.claim}: {r['verdict']}"
                             + ("" if ok else " (hasil plate ini meragukan; kemungkinan sampel tertukar)")})
        s.add(x)
    b.qc = {**b.qc, "control_results": ctrl, "lots": check_lots(rows, clones, m, par), "plate_shift": plate_shift(rows, m)}
    b.analyzed_at = datetime.now(timezone.utc)
    s.add(b)
    out = summary(s, b)
    audit.log(s, who, "analisis.dijalankan", batch_id, counts=out["counts"], config={
        k: getattr(config, k) for k in ("MIN_CALL_RATE", "GENO_ERROR", "MATCH_ALPHA", "LOD_MARGIN", "PARENT_LOD")},
        lots={l["lot"]: l["decision"] for l in b.qc["lots"]})
    s.commit()
    return out


def plate_shift(rows: list[Sample], m: Matcher) -> dict | None:
    """A sample that slid one well carries its neighbour's genotype, so it matches the clone the neighbour claims.
    A run of >= 3 such samples in plate order is a pipetting error, not a nursery problem (GAPS G-20).
    Isolated hits are left alone: in a garden a mixed-up tree often is the clone of the next row."""
    order = sorted((x for x in rows if x.lab_row is not None and not x.is_control), key=lambda x: x.lab_row)
    bad = [x.verdict not in (None, "COCOK", "SESUAI SILANGAN", "UJI ULANG") for x in order]
    best: list[Sample] = []
    for d in (1, -1):
        hit = [bad[i] and 0 <= i + d < len(order) and key(x.claim) != key(order[i + d].claim)
               and m.identify(x.sample_id, x.calls, order[i + d].claim)["verdict"] == "COCOK"
               for i, x in enumerate(order)]
        runs, cur = [], []
        for i, h in enumerate(hit):
            cur = cur + [i] if h else []
            if len(cur) >= 3:
                runs.append(list(cur))
        hits = sorted({i for r in runs for i in r})
        if len(hits) > len(best):
            best, direction = [order[i] for i in hits], d
    if not best:
        return None
    for x in best:
        x.result = {**x.result, "notes": x.result.get("notes", []) + [
            "Kemungkinan tergeser satu sumur di plate: genotipe ini cocok dengan klaim sampel di sebelahnya."]}
    first, last = best[0].sample_id, best[-1].sample_id
    return {"direction": direction, "samples": [x.sample_id for x in best],
            "message": f"{len(best)} sampel ({first} … {last}) cocok dengan klon yang diklaim sampel di sebelahnya "
                       f"dalam urutan plate. Kemungkinan besar sampel tergeser satu sumur di lab. Jangan tindak "
                       f"lanjuti vonis batch ini sebelum lab memeriksa plate."}


def check_lots(rows: list[Sample], clones: list[Clone], m: Matcher, par: Parentage) -> list[dict]:
    """Hybrid seedlings are judged per lot against the registered cross they claim."""
    hybrids = {key(c.name): c for c in clones if c.kind == "hibrida"}
    lc = LotChecker(par, {r.name: r.profile for r in m.refs}, genotype_freqs([r.profile for r in m.refs], m.panel))
    lots: dict[tuple[str, str], list[Sample]] = {}
    for x in rows:
        if x.kind == "bibit hibrida" and x.call_rate is not None:
            lots.setdefault((x.lot, x.claim), []).append(x)
    out = []
    for (lot, claim), kids in lots.items():
        h = hybrids.get(key(claim))
        if not h or h.parent1 not in par.D or h.parent2 not in par.D:
            for x in kids:
                x.verdict, x.found_as, x.result = "BELUM ADA REFERENSI", None, {}
            out.append({"lot": lot, "claim": claim, "n": len(kids), "decision": "BELUM BISA DINILAI",
                        "message": f"Tetua {claim} belum punya sidik jari referensi."})
            continue
        good = [x for x in kids if x.call_rate >= config.MIN_CALL_RATE]
        for x in kids:
            if x not in good:
                x.verdict, x.result = "UJI ULANG", {}
        r = lc.check([x.calls for x in good], h.parent1, h.parent2)
        for x, t in zip(good, r.pop("tests")):
            x.verdict = "SESUAI SILANGAN" if t["ok"] else "KONTAMINAN"
            x.found_as = None
            x.result = {"verdict": x.verdict, "call_rate": x.call_rate, "parentage": t, "lot": lot, "notes": [],
                        "candidates": [], "compare": [], "mismatches": None, "compared": None, "allowed": None,
                        "lod": None, "chance_log10": None, "found_as": None,
                        "steps": [{"title": "Kualitas data lab", "ok": True, "detail": f"{x.call_rate:.0%} SNP panel terbaca."},
                                  {"title": f"Uji anak {h.parent1} × {h.parent2}", "ok": t["ok"], "detail":
                                   f"{t['exclusions']} eksklusi dari {t['compared']} SNP (batas {t['allowed']}), "
                                   f"LOD {t['lod']} (minimal {config.PARENT_LOD})."
                                   + ("" if t["ok"] else " Ayahnya bukan tetua jantan resmi: serbuk sari dari luar.")},
                                  {"title": "Nilai lot", "ok": None, "detail": f"Bibit ini dihitung dalam estimasi kontaminasi lot {lot}."}]}
        out.append({"lot": lot, "claim": claim, **r})
    return out


def summary(s: Session, b: Batch) -> dict:
    rows = samples_of(s, b.id)
    field = [x for x in rows if not x.is_control]
    return {"id": b.id, "name": b.name, "created_at": b.created_at, "analyzed_at": b.analyzed_at,
            "lab_file": b.lab_file, "n_samples": len(field),
            "n_with_lab": sum(x.call_rate is not None for x in field),
            "counts": dict(Counter(x.verdict for x in field if x.verdict)), "qc": b.qc}


@router.get("/batches")
def list_batches(s: Session = Depends(get_session)):
    return [summary(s, b) for b in s.exec(select(Batch).order_by(Batch.id.desc())).all()]


@router.get("/batches/{batch_id}")
def batch_detail(batch_id: int, s: Session = Depends(get_session)):
    b = get_batch(s, batch_id)
    rows = [x.model_dump(exclude={"calls", "result"}) | {"lod": x.result.get("lod")} for x in samples_of(s, batch_id)]
    return summary(s, b) | {"samples": rows}


@router.get("/batches/{batch_id}/samples/{sample_id}")
def sample_detail(batch_id: int, sample_id: str, s: Session = Depends(get_session)):
    x = s.exec(select(Sample).where(Sample.batch_id == batch_id, Sample.sample_id == sample_id)).first()
    if not x:
        raise HTTPException(404, "Sampel tidak ditemukan")
    return x.model_dump(exclude={"calls"}) | {"batch_name": get_batch(s, batch_id).name}


class Action(BaseModel):
    action: str = Field(pattern="^(uji ulang|pemurnian)$")
    note: str = ""


@router.post("/batches/{batch_id}/samples/{sample_id}/action")
def sample_action(batch_id: int, sample_id: str, body: Action, s: Session = Depends(get_session),
                  who: str = Depends(actor)):
    """Officer follow-up: re-genotype the sample, or mark the tree for removal/replacement (pemurnian)."""
    x = s.exec(select(Sample).where(Sample.batch_id == batch_id, Sample.sample_id == sample_id)).first()
    if not x:
        raise HTTPException(404, "Sampel tidak ditemukan")
    x.action = body.action
    s.add(x)
    audit.log(s, who, f"tindakan.{body.action}", batch_id, sample_id, verdict=x.verdict, note=body.note)
    s.commit()
    return {"sample_id": sample_id, "action": x.action}


@router.get("/audit")
def audit_trail(batch_id: int | None = None, s: Session = Depends(get_session)):
    q = select(AuditEvent).order_by(AuditEvent.id)
    if batch_id is not None:
        q = q.where(AuditEvent.batch_id == batch_id)
    return {"chain": audit.verify(s), "events": s.exec(q).all()}


@router.get("/simulasi/{name}")
def sim_file(name: str):
    """Example files for the demo upload (generate with `python -m cacaoid.engine.simulate`)."""
    p = config.DATA / "simulasi" / name
    if name not in SIM_FILES or not p.exists():
        raise HTTPException(404, "File simulasi belum dibuat")
    return FileResponse(p, media_type="text/csv", filename=name)


@router.get("/batches/{batch_id}/gardens")
def gardens(batch_id: int, s: Session = Depends(get_session)):
    """Per provider: which clones the DNA actually found among its mother trees, against its registered garden list,
    and whether those clones can pollinate each other."""
    from cacaoid.api.ai import mix_advice
    get_batch(s, batch_id)
    registered = {key(p.name): p for p in s.exec(select(Provider)).all()}
    by: dict[str, list[Sample]] = {}
    for x in samples_of(s, batch_id):
        if not x.is_control and x.kind == "pohon induk entres" and x.verdict:
            by.setdefault(x.provider, []).append(x)
    out = []
    for prov, xs in sorted(by.items()):
        found: dict[str, int] = {}
        for x in xs:
            name = x.claim if x.verdict == "COCOK" else x.found_as if x.verdict in ("OFF-TYPE", "BELUM ADA REFERENSI") \
                and x.found_as else None if x.verdict == "UJI ULANG" else "tidak dikenal" if x.verdict == "TIDAK DIKENAL" \
                else x.claim + " (belum ada referensi)" if x.verdict == "BELUM ADA REFERENSI" else None
            if name:
                found[name] = found.get(name, 0) + 1
        reg = registered.get(key(prov))
        planned = reg.clones if reg else []
        known = [n for n in found if n != "tidak dikenal" and "(belum" not in n]
        out.append({"provider": prov, "registered_clones": planned, "found": found,
                    "not_planned": [n for n in known if key(n) not in {key(c) for c in planned}] if reg else [],
                    "advice": mix_advice(s, known) if known else None})
    return out
