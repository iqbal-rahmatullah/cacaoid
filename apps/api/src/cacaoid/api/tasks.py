"""Field tasks for the officers' phones and the monthly sampling plan built from provider risk."""
import calendar
import re
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from cacaoid import audit, config
from cacaoid.audit import actor
from cacaoid.db import get_session
from cacaoid.models import Sample, Task

router = APIRouter(prefix="/api")
RETEST_DAYS = 7  # a re-take of leaves is due a week after it is asked for


def today() -> date:
    return datetime.now(config.TZ).date()


def progress(t: Task, samples: list[Sample]) -> int:
    """Leaves taken for this task. Re-take tasks count linked retest samples; others count new samples of that garden
    taken between start and due (re-takes excluded, they belong to their own task)."""
    if t.sample_ids:
        return sum(any(x.retest_of == sid and x.retest_of_batch == t.batch_id for x in samples) for sid in t.sample_ids)
    return sum(1 for x in samples if not x.is_control and not x.retest_of and x.provider == t.provider
               and t.start <= x.date <= t.due and (not t.kind or x.kind == t.kind))


def view(t: Task, samples: list[Sample]) -> dict:
    done = progress(t, samples)
    status = ("selesai" if t.done_at or done >= t.target else "terlambat" if t.due < today().isoformat()
              else "berjalan" if done else "baru")
    return t.model_dump() | {"done": done, "status": status}


def field_samples(s: Session) -> list[Sample]:
    return list(s.exec(select(Sample).where(Sample.is_control == False)).all())  # noqa: E712


def ensure_retest_task(s: Session, x: Sample, who: str) -> Task:
    """Asking for a retest sends the re-take to the phone: one open task per garden and batch collects the samples."""
    t = s.exec(select(Task).where(Task.source == "uji ulang", Task.batch_id == x.batch_id, Task.provider == x.provider,
                                  Task.done_at == None)).first()  # noqa: E711
    if t and x.sample_id in t.sample_ids:
        return t
    if t:
        t.sample_ids = [*t.sample_ids, x.sample_id]
        t.target = len(t.sample_ids)
    else:
        t = Task(officer=x.officer, provider=x.provider, kind=x.kind, target=1, start=today().isoformat(),
                 due=(today() + timedelta(days=RETEST_DAYS)).isoformat(), source="uji ulang", batch_id=x.batch_id,
                 sample_ids=[x.sample_id], note="Ambil ulang daun dari pohon yang sama untuk uji ulang")
    t.note = f"Ambil ulang daun: {', '.join(t.sample_ids)}"
    s.add(t)
    s.flush()
    audit.log(s, who, "tugas.uji_ulang", x.batch_id, x.sample_id, task=t.id)
    return t


@router.get("/tasks")
def list_tasks(officer: str = "", open: bool = False, s: Session = Depends(get_session)):
    """Tasks for one officer (plus unassigned ones), soonest due first."""
    xs = field_samples(s)
    out = [view(t, xs) for t in s.exec(select(Task)).all()
           if not officer or not t.officer or t.officer.strip().lower() == officer.strip().lower()]
    if open:
        out = [t for t in out if t["status"] != "selesai"]
    return sorted(out, key=lambda t: (t["status"] == "selesai", t["due"], t["id"]))


class TaskIn(BaseModel):
    officer: str = ""
    provider: str = Field(min_length=1)
    kind: str = ""
    target: int = Field(ge=1, le=500)
    due: date
    note: str = ""


@router.post("/tasks", status_code=201)
def add_task(body: TaskIn, s: Session = Depends(get_session), who: str = Depends(actor)):
    if body.due < today():
        raise HTTPException(422, "Tenggat sudah lewat.")
    t = Task(**body.model_dump(exclude={"due"}), due=body.due.isoformat(), start=today().isoformat())
    s.add(t)
    s.flush()
    audit.log(s, who, "tugas.dibuat", provider=t.provider, target=t.target, due=t.due, officer=t.officer, task=t.id)
    s.commit()
    s.refresh(t)
    return view(t, field_samples(s))


@router.post("/tasks/{task_id}/done")
def close_task(task_id: int, s: Session = Depends(get_session), who: str = Depends(actor)):
    t = s.get(Task, task_id)
    if not t:
        raise HTTPException(404, "Tugas tidak ditemukan")
    t.done_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    s.add(t)
    audit.log(s, who, "tugas.selesai", task=t.id, provider=t.provider)
    s.commit()
    s.refresh(t)
    return view(t, field_samples(s))


class PlanIn(BaseModel):
    month: str = Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")
    officer: str = ""


def plan_view(s: Session, month: str) -> dict:
    xs = field_samples(s)
    tasks = [view(t, xs) for t in s.exec(select(Task).where(Task.source == "rencana", Task.month == month)).all()]
    tasks.sort(key=lambda t: -t["target"])
    return {"month": month, "target": sum(t["target"] for t in tasks), "done": sum(min(t["done"], t["target"]) for t in tasks),
            "tasks": tasks}


@router.post("/plans", status_code=201)
def make_plan(body: PlanIn, s: Session = Depends(get_session), who: str = Depends(actor)):
    """Monthly sampling plan: one task per garden with the number of leaves its risk score asks for."""
    from cacaoid.api.dashboard import provider_risk
    y, m = map(int, body.month.split("-"))
    first, last = date(y, m, 1), date(y, m, calendar.monthrange(y, m)[1])
    if last < today():
        raise HTTPException(422, "Bulan itu sudah lewat.")
    have = {t.provider for t in s.exec(select(Task).where(Task.source == "rencana", Task.month == body.month)).all()}
    made = []
    for r in provider_risk(s):
        if r["provider"] not in have:
            t = Task(officer=body.officer, provider=r["provider"], target=r["recommended_n"], source="rencana",
                     month=body.month, start=max(first, today()).isoformat(), due=last.isoformat(),
                     note=f"Risiko {r['tier'].lower()} (skor {r['score']})")
            s.add(t)
            made.append(r["provider"])
    if made:
        audit.log(s, who, "rencana.dibuat", month=body.month, gardens=made)
    s.commit()
    return plan_view(s, body.month)


@router.get("/plans/{month}")
def get_plan(month: str, s: Session = Depends(get_session)):
    if not re.fullmatch(r"\d{4}-\d{2}", month):
        raise HTTPException(422, "Format bulan: YYYY-MM")
    return plan_view(s, month)
