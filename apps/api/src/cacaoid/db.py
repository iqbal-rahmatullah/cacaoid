from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine, select

from cacaoid import config
from cacaoid.engine.io import parse_hapmap
from cacaoid.engine.identity import usable
from cacaoid.engine.registry import build_registry, select_panel
from cacaoid.models import Clone, Panel, Provider

engine = create_engine(f"sqlite:///{config.DB_PATH}", connect_args={"check_same_thread": False})

PANEL_NAME = "CacaoID-KAKAO-48 v1"
# Indonesian released clones: genotypes must come from their owners, never invented here
PENDING = [
    ("MCC 01", "klon", None, None), ("MCC 02", "klon", None, None),
    ("Sulawesi 1", "klon", None, None), ("Sulawesi 2", "klon", None, None),
    ("ICCRI 06H", "hibrida", "TSH 858", "Sulawesi 1"), ("ICCRI 08H", "hibrida", "Sulawesi 1", "KEE 2"),
]
# Demo cross with public parents: official hybrid seed and rootstock source in the simulation
DEMO_HYBRID = ("Hibrida DEMO-1", "TSH1188", "SCA6")


# Public whole-genome references (data/wgs_refs, built by scripts/wgs): which registry entry each feeds.
# Two independent sources of one clone are merged into a consensus and the entry counts as verified by both.
WGS_REFS = {
    "Sulawesi 1": ["PBC 123 (Sulawesi 1)"],
    "Sulawesi 2": ["BR 25 (Sulawesi 2)"],
    "MCC 01": ["MCC 01 (M01)"],
    "M06": ["M06"],
    "Clone 26 (Mars Sulawesi)": ["Clone 26 (Sulawesi)"],
}


def wgs_profiles() -> dict[str, list[tuple[str, str, dict]]]:
    """genotypes.tsv -> {name: [(project, run, {snp: call})]} (one tuple per independent source)."""
    import csv
    path = config.DATA / "wgs_refs" / "genotypes.tsv"
    out: dict = {}
    if not path.exists():
        return out
    with open(path, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f, delimiter="\t"):
            src = out.setdefault(r["name"], {}).setdefault((r["source_project"], r["run_or_assembly"]), {})
            if r["call"] and r["call"] not in ("NA", "None", "--"):
                src[r["snp"]] = "".join(sorted(r["call"]))
    return {n: [(p, run, prof) for (p, run), prof in v.items()] for n, v in out.items()}


def add_wgs_refs(s: Session) -> None:
    profiles = wgs_profiles()
    for entry, names in WGS_REFS.items():
        sources = [src for n in names for src in profiles.get(n, [])]
        if not sources:
            continue
        snps = set().union(*(p for _, _, p in sources))
        # consensus: keep a call only where every source that called the SNP agrees
        prof = {x: calls.pop() for x in snps if len(calls := {p[x] for _, _, p in sources if x in p}) == 1}
        agree = ""
        if len(sources) > 1:
            both = [x for x in snps if all(x in p for _, _, p in sources)]
            same = sum(len({p[x] for _, _, p in sources}) == 1 for x in both)
            agree = f"; {len(sources)} sumber independen sepakat {same}/{len(both)} SNP ({100 * same / max(len(both), 1):.1f}%)"
        src = "Genom publik: " + " + ".join(f"{p.split('(')[-1].rstrip(')')} {run}" for p, run, _ in sources) + agree
        c = s.exec(select(Clone).where(Clone.name == entry)).first() or Clone(name=entry)
        c.profile, c.n_trees, c.status, c.source = prof, len(sources), "referensi", src
        s.add(c)


# create_all never alters an existing table; columns added after a database was made are added here.
# ponytail: hand-listed ALTERs, switch to Alembic once the schema changes more often.
NEW_COLUMNS = {"sample": {"position": "VARCHAR NOT NULL DEFAULT ''"}}


def add_missing_columns(eng=engine) -> None:
    insp = inspect(eng)
    with eng.begin() as c:
        for table, cols in NEW_COLUMNS.items():
            have = {x["name"] for x in insp.get_columns(table)}
            for name, ddl in cols.items():
                if name not in have:
                    c.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))


def get_session():
    with Session(engine) as s:
        yield s


def init_db(eng=engine) -> None:
    SQLModel.metadata.create_all(eng)
    add_missing_columns(eng)
    with Session(eng) as s:
        if s.exec(select(Clone)).first():
            return
        geno = parse_hapmap(config.DATA / "bekele2022" / "genotypes_hapmap.txt")
        reg = build_registry(geno)
        for name, kind, p1, p2 in PENDING:
            s.add(Clone(name=name, kind=kind, status="menunggu referensi", source="Pemilik klon (belum diterima)",
                        parent1=p1, parent2=p2))
        panel = select_panel([c.profile for c in reg if c.status == "referensi"], geno.snps)
        for c in reg:
            if c.status == "referensi" and not usable(c.profile, panel):
                c.status = "tidak lengkap"
        s.add(Panel(name=PANEL_NAME, snps=panel))
        ok = {c.name for c in reg if c.status == "referensi"}
        name, p1, p2 = DEMO_HYBRID
        s.add(Clone(name=name, kind="hibrida", parent1=p1, parent2=p2, source="Silangan demo (DATA SIMULASI)",
                    status="referensi" if {p1, p2} <= ok else "menunggu referensi"))
        for c in reg:
            s.add(Clone(name=c.name, group=c.group, status=c.status, source=c.source, n_trees=c.n_trees, profile=c.profile))
        from cacaoid.engine.simulate import CLAIMS, PROVIDERS  # simulated providers for the demo
        extra = {"Luwu Utara": ["Sulawesi 1", "MCC 01", "Sulawesi 2"], "Parigi Moutong": ["MCC 02"]}
        for name, prov, regency, *_ in PROVIDERS:
            s.add(Provider(name=name, province=prov, regency=regency, clones=list(CLAIMS) + extra.get(regency, []),
                           source="DATA SIMULASI"))
        add_wgs_refs(s)
        s.commit()
