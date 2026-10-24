"""Simulated field + lab data for one 96-well plate. Every output is labelled DATA SIMULASI.

    uv run python -m cacaoid.engine.simulate        -> data/simulasi/SIMULASI_{lapangan,lab,kunci}.csv
"""
import csv
from pathlib import Path

import numpy as np

from cacaoid import config

SEED = 42
CLAIMS = ["ICS60", "ICS95", "TSH1188", "SCA6", "SCA12", "CCN51"]
HYBRID = ("Hibrida DEMO-1", "TSH1188", "SCA6")   # registered cross, also the official rootstock seed
# (provider, province, regency, lat, lon, off-type rate); names are fictional
PROVIDERS = [
    ("KE Simulasi Luwu Utara", "Sulawesi Selatan", "Luwu Utara", -2.57, 120.33, 0.04),
    ("KE Simulasi Parigi", "Sulawesi Tengah", "Parigi Moutong", -0.80, 120.18, 0.12),
    ("KE Simulasi Kolaka", "Sulawesi Tenggara", "Kolaka Utara", -3.10, 121.05, 0.30),
    ("KE Simulasi Polman", "Sulawesi Barat", "Polewali Mandar", -3.42, 119.33, 0.08),
]
EXTRA_SNPS = ["TcLAB_x01", "TcLAB_x02"]  # lab ran two SNPs outside the panel


def noisy(profile: dict[str, str], panel: list[str], rng: np.random.Generator,
          freqs: dict[str, dict[str, float]], err: float = 0.02, miss: float = 0.05) -> dict[str, str | None]:
    """Lab read of a tree: each SNP goes missing with `miss`, or is miscalled with `err`."""
    out = {}
    for s in panel:
        g = profile.get(s) or draw(freqs[s], rng)
        r = rng.random()
        if r < miss:
            out[s] = None
        elif r < miss + err:
            alts = [h for h in freqs[s] if h != g]
            out[s] = str(rng.choice(alts)) if alts else g
        else:
            out[s] = g
    return out


def distinct(a: dict, b: dict, panel, k: int = 3) -> bool:
    """Separable on the panel (>= k SNPs differ where both are called); closer pairs are registry synonyms."""
    return sum(a.get(s) is not None and b.get(s) is not None and a[s] != b[s] for s in panel) >= k


def draw(f: dict[str, float], rng) -> str:
    return str(rng.choice(list(f), p=list(f.values())))


def child(p1: dict, p2: dict, panel, rng, freqs) -> dict[str, str]:
    """Mendelian offspring: one random allele from each parent per SNP."""
    return {s: "".join(sorted(rng.choice(list(p1.get(s) or draw(freqs[s], rng)))
                              + rng.choice(list(p2.get(s) or draw(freqs[s], rng))))) for s in panel}


def stranger(panel, rng, freqs) -> dict[str, str]:
    """A tree that is in no registry (genotype drawn from population frequencies)."""
    return {s: draw(freqs[s], rng) for s in panel}


# Lab reads for a batch recorded on the phone (demo): most samples are what the label says; the rest go wrong the way
# they do in the field. Per kind, the chance of each fate:
FATES = {
    "pohon induk entres": {"cocok": 0.78, "tertukar": 0.10, "semaian": 0.06, "dna_rendah": 0.06},  # mix-up within the garden,
    "bibit sambung": {"cocok": 0.78, "batang_bawah": 0.10, "tertukar": 0.06, "dna_rendah": 0.06},  # tree grown from seed,
    "bibit hibrida": {"cocok": 0.96, "dna_rendah": 0.04},  # rootstock shoot; hybrid contamination is set per lot below
}
LOT_POLLEN = ([0.0, 0.03, 0.25], [0.4, 0.4, 0.2])  # share of outside-pollen seedlings in a lot: clean, normal, bad
LOW_DNA_MISS = 0.5


def field_read(kind: str, claim: str, garden: list[str], refs: dict, hybrids: dict, rootstock: tuple | None, panel,
               freqs, rng, lot_pollen: float = 0.0, problems: bool = True) -> tuple[dict, str]:
    """One sample's lab read and what really happened to it. `claim`, `garden`, `hybrids` (name -> parents) and
    `rootstock` use the same names as `refs` (registry fingerprints)."""
    fates = FATES.get(kind, {"cocok": 1.0}) if problems else {"cocok": 1.0}
    fate = str(rng.choice(list(fates), p=list(fates.values())))
    mates = [g for g in garden if g in refs and g != claim]
    geno = refs.get(claim, {})  # no fingerprint: whatever is read, the verdict is BELUM ADA REFERENSI
    if kind == "bibit hibrida" and (pp := hybrids.get(claim)) and all(p in refs for p in pp):
        pollen = problems and rng.random() < lot_pollen
        geno = child(refs[pp[0]], stranger(panel, rng, freqs) if pollen else refs[pp[1]], panel, rng, freqs)
        fate = "serbuk luar" if pollen and fate == "cocok" else fate
    elif fate == "tertukar" and mates:
        geno = refs[str(rng.choice(mates))]
    elif fate == "semaian" and (pairs := [(a, b) for i, a in enumerate(garden) for b in garden[i + 1:]
                                         if a in refs and b in refs and {a, b} != set(rootstock or ())]):
        # two garden clones, but never the rootstock cross: that seedling is a rootstock, and is judged as one
        a, b = pairs[rng.integers(len(pairs))]
        geno = child(refs[a], refs[b], panel, rng, freqs)
    elif fate == "batang_bawah" and rootstock and all(p in refs for p in rootstock):
        geno = child(refs[rootstock[0]], refs[rootstock[1]], panel, rng, freqs)
    elif fate != "dna_rendah":
        fate = "cocok"
    return noisy(geno, panel, rng, freqs, miss=LOW_DNA_MISS if fate == "dna_rendah" else 0.03), fate


def make_batch(refs: dict[str, dict[str, str]], panel: list[str], freqs, seed: int = SEED):
    """refs: usable registry fingerprints by name. Returns (field_rows, lab_rows, key_rows)."""
    rng = np.random.default_rng(seed)
    names = sorted(refs)
    field, lab, key = [], [], []
    n = 0

    def add(prov, kind, claim, lot, truth, expect, found=None, geno=None, miss=0.05, gps=True):
        nonlocal n
        n += 1
        sid = f"SIM-{n:03d}"
        name, provn, reg, lat, lon, _ = prov
        field.append({"sample_id": sid, "tanggal": f"2026-10-{1 + n % 20:02d}", "petugas": f"Pengawas {1 + n % 3}",
                      "penyedia": name, "provinsi": provn, "kabupaten": reg, "jenis_sampel": kind, "lot": lot,
                      "klaim": claim,
                      "lat": round(lat + rng.normal(0, 0.03), 5) if gps else "",
                      "lon": round(lon + rng.normal(0, 0.03), 5) if gps else ""})
        lab.append((sid, noisy(geno, panel, rng, freqs, miss=miss)))
        key.append({"sample_id": sid, "kategori": kind, "kebenaran": truth, "vonis_harapan": expect,
                    "ditemukan_sebagai": found or ""})

    # 1) mother trees in budwood gardens (60): true type, clone off-types, seedling off-types
    for i in range(60):
        prov = PROVIDERS[i % 4]
        claim = CLAIMS[rng.integers(len(CLAIMS))]
        lot = f"KE-{prov[2][:3].upper()}-{1 + i % 4}"
        if i in (7, 33):  # degraded DNA
            add(prov, "pohon induk entres", claim, lot, claim, "UJI ULANG", geno=refs[claim], miss=0.5)
        elif rng.random() >= prov[5]:
            add(prov, "pohon induk entres", claim, lot, claim, "COCOK", geno=refs[claim])
        elif rng.random() < 0.6:
            other = rng.choice([o for o in names if distinct(refs[o], refs[claim], panel)])
            add(prov, "pohon induk entres", claim, lot, str(other), "OFF-TYPE", found=str(other), geno=refs[other])
        elif rng.random() < 0.5:  # open-pollinated seedling of two clones in the same garden
            a, b = (str(x) for x in rng.choice(CLAIMS, 2, replace=False))
            add(prov, "pohon induk entres", claim, lot, f"semaian {a} × {b}", "TIDAK DIKENAL",
                geno=child(refs[a], refs[b], panel, rng, freqs))
        else:
            add(prov, "pohon induk entres", claim, lot, "semaian tetua tak terdaftar", "TIDAK DIKENAL",
                geno=stranger(panel, rng, freqs))

    # 1b) Indonesian official clones, now with public-genome references: true-to-type trees and two real mix-ups
    indo = [("Sulawesi 1", "Sulawesi 1", "COCOK"), ("MCC 01", "MCC 01", "COCOK"), ("Sulawesi 2", "Sulawesi 2", "COCOK"),
            ("Sulawesi 1", "M06", "OFF-TYPE"), ("MCC 01", "Sulawesi 1", "OFF-TYPE")]
    for claim, truth, expect in indo:
        if claim in refs and truth in refs:
            add(PROVIDERS[0], "pohon induk entres", claim, "KE-LUW-IND", truth, expect,
                found=truth if expect == "OFF-TYPE" else None, geno=refs[truth])

    # 2) Indonesian clone with no reference yet: 3 true trees of one (simulated) genotype + 1 off-type
    mcc = stranger(panel, rng, freqs)
    for i in range(4):
        prov = PROVIDERS[1]
        if i < 3:
            add(prov, "pohon induk entres", "MCC 02", "KE-PAR-MCC", "MCC 02 (genotipe simulasi)", "BELUM ADA REFERENSI",
                geno=mcc)
        else:
            add(prov, "pohon induk entres", "MCC 02", "KE-PAR-MCC", "ICS60", "BELUM ADA REFERENSI", found="ICS60",
                geno=refs["ICS60"])

    # 3) grafted seedlings: leaf should come from the scion; 2 of 6 were taken from the rootstock
    hname, hp1, hp2 = HYBRID
    for i in range(6):
        prov = PROVIDERS[i % 2]
        claim = CLAIMS[i % len(CLAIMS)]
        if i in (1, 4):
            add(prov, "bibit sambung", claim, "BS-01", f"batang bawah {hp1} × {hp2}", "BATANG BAWAH", found=hname,
                geno=child(refs[hp1], refs[hp2], panel, rng, freqs), gps=i != 4)
        else:
            add(prov, "bibit sambung", claim, "BS-01", claim, "COCOK", geno=refs[claim], gps=i != 3)

    # 4) one hybrid seed lot (60 seedlings: what the sample-size calculator asks for at 5%), 20% outside pollen
    for i in range(60):
        prov = PROVIDERS[2]
        if rng.random() < 0.2:
            add(prov, "bibit hibrida", hname, "LOT-H-07", f"kontaminan ({hp1} × ayah luar)", "KONTAMINAN",
                geno=child(refs[hp1], stranger(panel, rng, freqs), panel, rng, freqs))
        else:
            add(prov, "bibit hibrida", hname, "LOT-H-07", f"{hp1} × {hp2}", "SESUAI SILANGAN",
                geno=child(refs[hp1], refs[hp2], panel, rng, freqs))

    # 5) plate controls (lab only, not in the field manifest)
    lab.append(("KTRL-POS-ICS60", noisy(refs["ICS60"], panel, rng, freqs, miss=0.0)))
    key.append({"sample_id": "KTRL-POS-ICS60", "kategori": "kontrol", "kebenaran": "ICS60",
                "vonis_harapan": "COCOK", "ditemukan_sebagai": ""})
    lab.append(("KTRL-NTC", {s: None for s in panel}))
    key.append({"sample_id": "KTRL-NTC", "kategori": "kontrol", "kebenaran": "tanpa DNA",
                "vonis_harapan": "UJI ULANG", "ditemukan_sebagai": ""})
    return field, lab, key


def lab_csv(lab, panel, rng) -> str:
    """KASP-style export: 'A:G' calls, '?' or 'Uncallable' for missing."""
    snps = panel + EXTRA_SNPS
    rows = [["Sample"] + snps]
    for sid, calls in lab:
        row = [sid]
        for s in panel:
            g = calls.get(s)
            row.append(f"{g[0]}:{g[1]}" if g else ("Uncallable" if rng.random() < 0.2 else "?"))
        row += [str(rng.choice(["A:A", "A:G", "G:G"])) for _ in EXTRA_SNPS]
        rows.append(row)
    return "\n".join(",".join(r) for r in rows) + "\n"


def write(out: Path, refs, panel, freqs, seed: int = SEED) -> list[Path]:
    field, lab, key = make_batch(refs, panel, freqs, seed)
    out.mkdir(parents=True, exist_ok=True)
    paths = [out / "SIMULASI_lapangan.csv", out / "SIMULASI_lab.csv", out / "SIMULASI_kunci.csv"]
    for p, rows in ((paths[0], field), (paths[2], key)):
        with open(p, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0]))
            w.writeheader()
            w.writerows(rows)
    paths[1].write_text(lab_csv(lab, panel, np.random.default_rng(seed + 1)))
    return paths


def load_world():
    """Usable registry fingerprints + panel + genotype frequencies, straight from the database."""
    from sqlmodel import Session, select

    from cacaoid.db import PANEL_NAME, engine, init_db
    from cacaoid.engine.identity import usable
    from cacaoid.engine.registry import genotype_freqs
    from cacaoid.models import Clone, Panel
    init_db()
    with Session(engine) as s:
        panel = s.exec(select(Panel).where(Panel.name == PANEL_NAME)).one().snps
        clones = s.exec(select(Clone).where(Clone.status == "referensi")).all()
    refs = {c.name: c.profile for c in clones if usable(c.profile, panel)}
    return refs, panel, genotype_freqs(list(refs.values()), panel)


if __name__ == "__main__":
    for p in write(config.DATA / "simulasi", *load_world()):
        print("DATA SIMULASI ->", p)
