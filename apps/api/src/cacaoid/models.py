from datetime import datetime, timezone

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class Clone(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    kind: str = "klon"                    # klon | hibrida | kontrol
    group: str | None = None              # Motamayor genetic group if known
    status: str = "referensi"             # referensi | tidak konsisten | menunggu referensi
    source: str = ""
    n_trees: int = 0
    parent1: str | None = None            # for hybrids
    parent2: str | None = None
    profile: dict = Field(default_factory=dict, sa_column=Column(JSON))


class Panel(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    snps: list = Field(default_factory=list, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Batch(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    lab_file: str | None = None
    qc: dict = Field(default_factory=dict, sa_column=Column(JSON))       # batch-level QC from the lab upload
    analyzed_at: datetime | None = None


class Sample(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    batch_id: int = Field(foreign_key="batch.id", index=True)
    sample_id: str = Field(index=True)
    is_control: bool = False
    claim: str = ""
    kind: str = ""                         # pohon induk entres | bibit sambung | bibit hibrida | kontrol
    lot: str = ""
    provider: str = ""
    province: str = ""
    regency: str = ""
    lat: float | None = None
    lon: float | None = None
    date: str = ""
    officer: str = ""
    position: str = ""                     # where the tree stands in the garden: block, row, number
    checklist: list = Field(default_factory=list, sa_column=Column(JSON))  # sampling steps the officer confirmed
    lab_row: int | None = None             # row in the lab file = plate order (for well-shift checks)
    calls: dict = Field(default_factory=dict, sa_column=Column(JSON))    # SNP -> genotype, panel SNPs only
    call_rate: float | None = None
    verdict: str | None = None
    found_as: str | None = None
    action: str | None = None              # follow-up chosen by the officer: "uji ulang" | "pemurnian"
    retest_of_batch: int | None = None     # uji ulang: this sample re-tests an earlier one (its batch + sample id)
    retest_of: str | None = None
    closed_at: str | None = None           # follow-up case closed: by a retest result or by pemurnian with evidence
    outcome: str | None = None
    evidence: dict = Field(default_factory=dict, sa_column=Column(JSON))  # pemurnian proof: date, note, photo, sha256
    result: dict = Field(default_factory=dict, sa_column=Column(JSON))   # full explanation from the engine


class AuditEvent(SQLModel, table=True):
    """Append-only log; each row carries the hash of the previous one, so any later edit breaks the chain."""
    id: int | None = Field(default=None, primary_key=True)
    ts: str
    actor: str
    action: str
    batch_id: int | None = Field(default=None, index=True)
    sample_id: str | None = None
    payload: dict = Field(default_factory=dict, sa_column=Column(JSON))
    prev_hash: str
    hash: str


class Provider(SQLModel, table=True):
    """Registered seed/budwood provider with the clones planted in its garden (needed for seed-origin tests)."""
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    kind: str = "kebun entres"            # kebun entres | kebun benih | penangkar
    province: str = ""
    regency: str = ""
    clones: list = Field(default_factory=list, sa_column=Column(JSON))   # registry names planted in the garden
    source: str = ""


class Task(SQLModel, table=True):
    """Field assignment shown on the officers' phones: who, which garden, how many leaves, by when.
    Progress is counted from the samples themselves, so it also moves while the phone is offline."""
    id: int | None = Field(default=None, primary_key=True)
    officer: str = ""                      # empty = any officer
    provider: str
    kind: str = ""                         # sample kind to take; empty = any
    target: int
    start: str                             # ISO date: samples from this day count
    due: str                               # ISO date
    note: str = ""
    source: str = "manual"                 # manual | rencana | uji ulang
    month: str | None = None               # "2026-10" for monthly sampling-plan tasks
    batch_id: int | None = None            # uji ulang: batch of the samples to re-take
    sample_ids: list = Field(default_factory=list, sa_column=Column(JSON))
    done_at: str | None = None             # closed by hand
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Seal(SQLModel, table=True):
    """Public check code printed as a QR on a berita acara or seedling passport. `payload` is what the public page
    may show; `digest` lets it say whether the data changed after printing."""
    id: int | None = Field(default=None, primary_key=True)
    code: str = Field(index=True, unique=True)
    kind: str                              # berita-acara | paspor
    batch_id: int
    sample_id: str | None = None
    payload: dict = Field(default_factory=dict, sa_column=Column(JSON))
    digest: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
