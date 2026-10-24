"""Vonis yang menyebut dampak: what a verdict means in the field, from cited trial facts (data/traits/).
Rules (see tasks/feasibility/F2_impact_data.md):
  - a % difference is computed only for two clones measured in the same source, table, site and year;
  - everything else is shown side by side with its source, never averaged across trials or VSD scales;
  - facts flagged CONFLICT / SUSPECTED ERROR / INCONSISTENT are shown with that flag."""
import csv
import re
from functools import lru_cache

from cacaoid import config
from cacaoid.engine.identity import key

DIR = config.DATA / "traits"
# trait -> (label, higher_is_better or None when not orderable)
TRAITS = {
    "yield_kg_per_ha": ("Hasil (kg/ha/tahun)", True),
    "yield_kg_per_1000_trees": ("Hasil (kg per 1.000 pohon)", True),
    "pods_per_tree": ("Buah per pohon", True),
    "vsd_incidence_pct": ("Pohon terserang VSD (%)", False),
    "vsd_score": ("Skor VSD", False),
    "vsd_class": ("Kelas ketahanan VSD", None),
    "black_pod_pct": ("Busuk buah (%)", False),
    "black_pod_class": ("Kelas ketahanan busuk buah", None),
    "cpb_damage_pct": ("Kerusakan PBK (%)", False),
    "cpb_score": ("Skor PBK", False),
    "cpb_class": ("Kelas ketahanan PBK", None),
    "bean_weight_g": ("Bobot biji kering (g)", True),
    "bean_count_per_100g": ("Jumlah biji per 100 g", False),
    "fat_pct": ("Kadar lemak (%)", True),
    "shell_pct": ("Kadar kulit biji (%)", False),
}
FLAGS = ("CONFLICT", "SUSPECTED ERROR", "INCONSISTENT")


@lru_cache
def facts() -> list[dict]:
    with open(DIR / "clone_traits.csv", newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    with open(DIR / "sources.csv", newline="", encoding="utf-8") as f:
        src = {r["source_id"]: r for r in csv.DictReader(f)}
    for r in rows:
        r["citation"] = short_citation(r["source_id"], src.get(r["source_id"], {}).get("citation", ""))
        r["flag"] = next((fl for fl in FLAGS if fl in r["notes"]), None)
    return rows


def short_citation(source_id: str, citation: str) -> str:
    if source_id.startswith("ACIAR_"):
        return "ACIAR " + source_id[6:].replace("_", "/", 1).replace("_", "/")
    m = re.match(r"([^\s,]+).*?\((\d{4})\)", citation)
    return f"{m.group(1)} dkk. {m.group(2)}" if m else source_id


@lru_cache
def alias_index() -> dict[str, str]:
    idx = {}
    for r in facts():
        for n in [r["canonical_clone"], *r["aliases"].split(";")]:
            if n.strip():
                idx.setdefault(key(n), r["canonical_clone"])
    return idx


def canonical(name: str) -> str | None:
    """Registry / field name -> canonical clone in the facts table (Sulawesi 1 = PBC123, MCC 01 = M01 …)."""
    base = key(name)
    return alias_index().get(base)


def num(v: str) -> float | None:
    try:
        return float(v)
    except ValueError:
        return None


def card(name: str) -> dict:
    c = canonical(name)
    rows = [r for r in facts() if c and r["canonical_clone"] == c and r["trait"] in TRAITS]
    out = {}
    for r in rows:
        out.setdefault(r["trait"], []).append(fact_view(r))
    return {"clone": name, "canonical": c, "traits": [{"trait": t, "label": TRAITS[t][0], "facts": out[t]}
                                                       for t in TRAITS if t in out]}


def fact_view(r: dict) -> dict:
    return {"value": r["value"], "unit": r["unit"], "site": r["site"], "year": r["year"], "se": r["se"],
            "n_trees": r["n_trees"], "source": r["citation"], "where": r["location_in_source"], "flag": r["flag"],
            "note": r["notes"][:240]}


def compare(paid: str, received: str) -> dict:
    """Paid-for clone vs the clone actually found: same-trial differences first, then side-by-side facts."""
    a, b = canonical(paid), canonical(received)
    if not a or not b:
        return {"paid": paid, "received": received, "same_trial": [], "side_by_side": [], "headlines": [],
                "missing": [n for n, c in ((paid, a), (received, b)) if not c]}
    rows = [r for r in facts() if r["canonical_clone"] in (a, b) and r["trait"] in TRAITS]
    groups: dict[tuple, dict] = {}
    for r in rows:
        g = (r["trait"], r["source_id"], r["location_in_source"], r["site"], r["year"])
        groups.setdefault(g, {})[r["canonical_clone"]] = r
    same, seen = [], set()
    for (trait, *_), g in groups.items():
        if a in g and b in g and num(g[a]["value"]) is not None and num(g[b]["value"]) is not None:
            va, vb = num(g[a]["value"]), num(g[b]["value"])
            label, up = TRAITS[trait]
            is_yield = trait.startswith("yield")  # % only for yield: small counts/scores make % misleading
            pct = round(100 * (vb - va) / va) if is_yield and va else None
            worse = None if not is_yield or vb == va else (vb < va) == up
            same.append({"trait": trait, "label": label, "paid": va, "received": vb, "unit": g[a]["unit"],
                         "pct": pct, "worse": worse, "site": g[a]["site"].split("(")[0].strip(), "year": g[a]["year"],
                         "note": g[a]["notes"] + " " + g[b]["notes"],
                         "source": g[a]["citation"], "where": g[a]["location_in_source"],
                         "flag": g[a]["flag"] or g[b]["flag"]})
            seen.add(trait)
    side = []
    for t in TRAITS:
        if t in seen:
            continue
        fa = [fact_view(r) for r in rows if r["trait"] == t and r["canonical_clone"] == a]
        fb = [fact_view(r) for r in rows if r["trait"] == t and r["canonical_clone"] == b]
        if fa and fb:
            side.append({"trait": t, "label": TRAITS[t][0], "paid": fa, "received": fb})
    same.sort(key=lambda x: list(TRAITS).index(x["trait"]))
    headlines = []
    ylds = [x for x in same if x["pct"] is not None]
    if ylds:
        srcs = ", ".join(dict.fromkeys(x["source"] for x in ylds))
        ns = any("NOT significant" in x["note"] or " ns" in x["note"] for x in ylds)
        tail = " Beda antar-klon di salah satu uji tidak signifikan secara statistik." if ns else ""
        if all(x["pct"] < 0 for x in ylds) or all(x["pct"] > 0 for x in ylds):
            pcts = sorted(abs(x["pct"]) for x in ylds)
            rng = f"{pcts[0]}%" if pcts[0] == pcts[-1] else f"{pcts[0]}–{pcts[-1]}%"
            where = ", ".join(f"{x['site']} {x['year']}" for x in ylds)
            headlines.append(f"Pada uji yang sama ({srcs}; {where}), {received} menghasilkan {rng} "
                             f"{'lebih rendah' if ylds[0]['pct'] < 0 else 'lebih tinggi'} dari {paid}.{tail}")
        else:
            parts = ", ".join(f"{'+' if x['pct'] > 0 else '−'}{abs(x['pct'])}% di {x['site']}" for x in ylds)
            headlines.append(f"Hasil {received} dibanding {paid} bergantung lokasi ({srcs}): {parts}. Klon terbaik "
                             f"berbeda per agroklimat.{tail}")
    for t, word in (("vsd_incidence_pct", "pohon terserang VSD"), ("black_pod_pct", "buah busuk")):
        x = next((x for x in same if x["trait"] == t), None)
        if x:
            headlines.append(f"Di uji yang sama ({x['source']}, {x['site']}): {word} {x['paid']:g}% pada {paid} vs "
                             f"{x['received']:g}% pada {received}.")
    return {"paid": paid, "received": received, "paid_canonical": a, "received_canonical": b,
            "same_trial": same, "side_by_side": side, "headlines": headlines, "missing": []}


def rootstock_rule() -> list[dict]:
    return [fact_view(r) | {"text": r["value"]} for r in facts() if r["trait"] == "vsd_rule"]


def hybrid_vsd(cross: str | None = None) -> list[dict]:
    """VSD damage-class spread in hybrid progenies (how variable seedlings from a cross are)."""
    out = []
    for r in facts():
        if r["trait"] != "vsd_score_distribution":
            continue
        classes = {}
        for part in r["value"].split(";"):
            if ":" in part and "(" in part:
                c, rest = part.split(":", 1)
                classes[int(c.strip())] = float(rest.split("(")[1].rstrip("%) "))
        out.append({"cross": r["canonical_clone"], "high_damage_pct": round(sum(v for c, v in classes.items() if c >= 4), 1),
                    "classes": classes, "source": r["citation"], "where": r["location_in_source"]})
    if cross:
        ck = key(cross)
        out = [o for o in out if ck in key(o["cross"])] or out
    return out
