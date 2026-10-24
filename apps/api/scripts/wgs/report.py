"""Scan hits -> data/wgs_refs/{genotypes.tsv, provenance.json, kmer_mask.json} + feasibility numbers (stdout JSON).

  cd apps/api && WORK=<dir with hits/ and runs.jsonl> uv run python scripts/wgs/report.py
"""
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import kmerfp as k  # noqa: E402

WORK = Path(os.environ.get("WORK", "wgs_work"))
OUT = k.ROOT / "data/wgs_refs"
GENOME = 430e6  # T. cacao genome size used for coverage estimates (Argout et al. 2011)
CORNEJO, NESTLE = "PRJNA486011 (Cornejo et al. 2018)", "PRJEB75153 (Nestle cacao diversity WGS)"
NAME_NOTE = "sample name as submitted; not verified to be the officially released clone"
INDO = "Cornejo 2018 Suppl. Table 1 source: 'Indonesia (gDNA USDA)'"
V2 = ("scanned with an earlier k-mer table that lacked the k-mers shared by 18 duplicate-assay pairs (e.g. "
      "TcSNP1028/1204): those SNPs are mostly uncalled here (no allele bias: both alleles lost the same k-mers); re-scan to fill them")

# kind: reads | pair (two phased haplotype assemblies) | collapsed (one pseudo-haploid assembly: het sites read as hom)
SAMPLES = [
    dict(name="PBC 123 (Sulawesi 1)", alias="PBC123", project=CORNEJO, ids=["SRR7774164"], kind="reads",
         notes=[INDO, "biosample SAMN09934526 geo_loc Indonesia", NAME_NOTE]),
    dict(name="PBC 123 (Sulawesi 1)", alias="PBC_123", project=NESTLE, ids=["ERR13166480"], kind="reads",
         notes=[NAME_NOTE]),
    dict(name="MCC 01 (M01)", alias="M01", project=CORNEJO, ids=["SRR7774264"], kind="reads",
         notes=["M01 = MCC 01 per ACIAR HORT/2010/011 p.72 (name match in Mars collection, not DNA-confirmed)", INDO, V2]),
    dict(name="BR 25 (Sulawesi 2)", alias="BR25", project=CORNEJO, ids=["SRR7774302"], kind="reads", notes=[INDO, NAME_NOTE, V2]),
    dict(name="M04", alias="M04", project=CORNEJO, ids=["SRR7774262"], kind="reads",
         notes=["Mars Sulawesi farmer selection label; " + NAME_NOTE, INDO]),
    dict(name="M06", alias="M06", project=CORNEJO, ids=["SRR7774260"], kind="reads",
         notes=["Mars Sulawesi farmer selection label; " + NAME_NOTE, INDO]),
    dict(name="Catongo", alias="Catongo", project=CORNEJO, ids=["SRR7774215"], kind="reads", bekele=["CATONGO_1"],
         group="Amelonado"),
    dict(name="SIC 806", alias="SIC806", project=CORNEJO, ids=["SRR7774318"], kind="reads", group="Amelonado"),
    dict(name="SIAL 70", alias="SIAL70", project=CORNEJO, ids=["SRR7774316"], kind="reads", group="Amelonado"),
    dict(name="Criollo (Cornejo 'criollo')", alias="criollo", project=CORNEJO, ids=["SRR7774278"], kind="reads",
         group="Criollo", notes=["generic sample name 'criollo'; exact accession unknown"]),
    dict(name="CRIOLLO 21", alias="CRIOLLO_21_CRI", project=NESTLE, ids=["ERR13166357"], kind="reads",
         notes=["admixed, not a pure Criollo-group reference: 15% heterozygous calls (Belize Criollo / B97-61 ~0%) and "
                "only 52-54% identical to Belize Criollo trees, 75% to CATONGO_1"]),
    dict(name="CUR3 G35 A1", alias="CUR3_G35_A1", project=CORNEJO, ids=["SRR7774159"], kind="reads", group="Curaray",
         notes=["Curaray-river collection by sample name; group not re-verified",
                "PARTIAL: median marker depth only 4 at an estimated 9.6x (232/834 SNPs called); needs more data"]),
    dict(name="ICS 60", alias="ICS_60", project=NESTLE, ids=["ERR13166415"], kind="reads", bekele=["ICS60"]),
    dict(name="TSH 1188", alias="TSH1188", project=CORNEJO, ids=["SRR7774249"], kind="reads", bekele=["TSH1188"]),
    dict(name="ICS 1", alias="ICS_1", project=NESTLE, ids=["ERR13166408"], kind="reads", bekele=["ICS1_1", "ICS1_2"],
         truth="ICS1 hap1+hap2"),
    dict(name="SCA 6", alias="SCA6**", project=CORNEJO, ids=["SRR7774196"], kind="reads", bekele=["SCA6"],
         notes=["Cornejo 2018 Suppl. Table 1 footnote: '**' marks an off-type; 'admixture analysis showed this is a "
                "hybrid', not representative of SCA6 (blind check of our identity test)"]),
    dict(name="CCN 51", alias="CCN_51", project=NESTLE, ids=["ERR13166351"], kind="reads", bekele=["CCN51_1"],
         truth="CCN51 hap1+hap2"),
    dict(name="Criollo B97-61/B2", alias="B97-61/B2", project="PRJEB14326 (Criollo genome v2, Argout et al. 2017)",
         ids=["GCF_000208745.1"], kind="collapsed", bekele=["B97-61_B-2-C10-2"], group="Criollo"),
    dict(name="Matina 1-6", alias="Matina 1-6", project="PRJNA51633 (Motamayor et al. 2013)", ids=["GCF_000403535.1"],
         kind="collapsed", bekele=["Mat1-6", "MATINA1_7"], group="Amelonado"),
    dict(name="CCN 51", alias="CCN51 hap1+hap2", project="PRJNA1364078", ids=["GCA_053813895.1", "GCA_053813885.1"],
         kind="pair", bekele=["CCN51_1"]),
    dict(name="ICS 1", alias="ICS1 hap1+hap2", project="PRJNA1136499", ids=["GCA_050656495.1", "GCA_050656505.1"],
         kind="pair", bekele=["ICS1_1", "ICS1_2"]),
    dict(name="IMC 67", alias="USDA_IMC_67", project="PRJNA982528 (USDA)", ids=["GCA_036851125.1"], kind="collapsed",
         bekele=["IMC67"], group="Iquitos"),
    dict(name="Pound 7", alias="USDA_POUND_7", project="PRJNA982528 (USDA)", ids=["GCA_036851155.1"],
         kind="collapsed", bekele=["Pound7_A"], group="Nanay"),
    dict(name="SCA 6", alias="USDA_SCA_6", project="PRJNA982528 (USDA)", ids=["GCA_036851095.1"], kind="collapsed",
         bekele=["SCA6"], group="Contamana"),
    dict(name="SCA 6", alias="Sca6 (Penn State)", project="PRJNA558793 (Penn State)", ids=["GCA_035896635.1"],
         kind="collapsed", bekele=["SCA6"], group="Contamana"),
    dict(name="Clone 26 (Sulawesi)", alias="clone26 maternal+paternal", project="PRJNA1083235 (Tobias et al. 2024)",
         ids=["GCA_041222385.1", "GCA_041222375.1"], kind="pair",
         notes=["Indonesian 'Clone 26' as named in the assembly; mapping to a released clone name unverified"]),
]


def bekele() -> dict:
    rows = [line.rstrip("\n").split("\t") for line in open(k.HAPMAP)]
    return {n: {r[0]: r[i] for r in rows[1:] if r[i] not in ("", "NN")} for i, n in enumerate(rows[0]) if i >= 11}


def letters(m) -> tuple:
    return tuple(sorted(m[5].values()))


def calls(s: dict, mask: dict, subsample: float = 1.0) -> dict:
    """snp -> (call or None, depth for first letter, depth for second letter)."""
    hits = [WORK / "hits" / f"{i}.npz" for i in s["ids"]]
    if s["kind"] == "reads":
        return {r["snp"]: (r["call"], r["depth_ref"], r["depth_alt"]) for r in k.call_reads(hits, mask, subsample)}
    haps = [k.assembly_alleles(h, mask) for h in hits]
    out = {}
    for m in k.markers():
        l1, l2 = letters(m)
        got = [h.get(m[0], "") for h in haps]
        seq = "".join(got)
        if not seq:
            continue
        if s["kind"] == "pair":
            call = "".join(sorted(seq)) if all(len(g) == 1 for g in got) else None
        else:
            call = seq * 2 if len(seq) == 1 else seq
        out[m[0]] = (call, seq.count(l1), seq.count(l2))
    return out


def concordance(a: dict, b: dict, hom_only: bool = False) -> dict:
    shared = [s for s, v in a.items() if v[0] and s in b and (not hom_only or b[s][0] == b[s][1])]
    agree = sum(a[s][0] == b[s] for s in shared)
    return {"n": len(shared), "agree": agree, "pct": round(100 * agree / len(shared), 1) if shared else None}


def top_matches(c: dict, bk: dict, n: int = 3) -> list:
    scores = []
    for name, g in bk.items():
        r = concordance(c, g)
        if r["n"] >= 100:
            scores.append((r["pct"], r["n"], name))
    return [{"bekele": nm, "pct": p, "n": nn} for p, nn, nm in sorted(scores, reverse=True)[:n]]


def main():
    runs = {}
    for line in open(WORK / "runs.jsonl"):
        r = json.loads(line)
        runs[r["id"]] = r
    have = [s for s in SAMPLES if all((WORK / "hits" / f"{i}.npz").exists() for i in s["ids"])]
    asm_hits = [WORK / "hits" / f"{i}.npz" for s in have if s["kind"] != "reads" for i in s["ids"]]
    mask = k.kmer_mask(asm_hits)
    json.dump({"note": "k-mer ids index kmerfp.kmer_table(); SNPs listed are excluded entirely",
               "from_assemblies": [p.stem for p in asm_hits], **mask}, open(OUT / "kmer_mask.json", "w"))
    bk = bekele()
    sys.path.insert(0, str(k.ROOT / "src"))
    from cacaoid.engine import ai_traits
    from cacaoid.engine.simulate import load_world
    panel, model = load_world()[1], ai_traits.model()["snps"]
    prov, results, tsv = {}, {}, ["name\tsource_project\trun_or_assembly\tsnp\tcall\tdepth_ref\tdepth_alt"]

    def calls_of(key):
        return {snp: v[0] for snp, v in results[key].items() if v[0]}

    for s in have:
        c = calls(s, mask)
        key = f"{s['alias']} [{'+'.join(s['ids'])}]"
        results[key] = c
        called = {snp for snp, v in c.items() if v[0]}
        p = {"name": s["name"], "alias_in_source": s["alias"], "source_project": s["project"], "kind": s["kind"],
             "ids": s["ids"], "genetic_group_hint": s.get("group"), "notes": list(s.get("notes", [])),
             "n_snps_called": len(called), "n_panel48_called": len(called & set(panel)),
             "n_model589_called": len(called & set(model)), "top_bekele_matches": top_matches(c, bk)}
        nb = sum(runs[i]["n_bases"] for i in s["ids"] if i in runs)
        if s["kind"] == "reads":
            p["bases"] = nb
            p["est_coverage_x"] = round(nb / GENOME, 1)
            dep = [v[1] + v[2] for v in c.values()]
            p["median_marker_depth"] = sorted(dep)[len(dep) // 2]
        else:
            p["assembly_bases"] = nb
            if s["kind"] == "collapsed":
                p["notes"].append("collapsed pseudo-haploid assembly: heterozygous sites appear homozygous; "
                                  "use only the hom-site concordance, not as a diploid reference")
        p["download"] = [runs[i].get("download") for i in s["ids"] if i in runs]
        p["concordance_bekele"] = {b: {"all_sites": concordance(c, bk[b]), "bekele_hom_sites": concordance(c, bk[b], True)}
                                   for b in s.get("bekele", [])}
        best = p["top_bekele_matches"][0] if p["top_bekele_matches"] else None
        claimed = [v["all_sites"]["pct"] or 0 for v in p["concordance_bekele"].values()]
        if s["kind"] != "collapsed" and claimed and max(claimed) < 90:
            p["notes"].append(f"IDENTITY MISMATCH: {max(claimed)}% concordant with Bekele {'/'.join(s['bekele'])}; best "
                              f"match {best['bekele']} ({best['pct']}%). Either this sample or the Bekele tree is "
                              "mislabelled - not used as a reference")
        # collapsed assemblies are validation-only; mislabelled samples must not enter the registry
        p["in_genotypes_tsv"] = s["kind"] != "collapsed" and not any(n.startswith("IDENTITY MISMATCH") for n in p["notes"])
        if p["in_genotypes_tsv"]:
            for snp in sorted(called, key=lambda x: int(x[5:])):
                v = c[snp]
                tsv.append(f"{s['name']}\t{s['project']}\t{'+'.join(s['ids'])}\t{snp}\t{v[0]}\t{v[1]}\t{v[2]}")
        prov[key] = p
    for s in have:  # read calls vs a phased (diploid) assembly of the same clone: best available truth
        t = next((kk for kk in results if s.get("truth") and kk.startswith(s["truth"] + " ")), None)
        if t:
            key = f"{s['alias']} [{'+'.join(s['ids'])}]"
            prov[key]["concordance_phased_assembly"] = {t: concordance(results[key], calls_of(t))}
    # cross-source check of the two independent PBC 123 samples
    a, b = (next((k_ for k_ in results if k_.startswith(x)), None) for x in ("PBC123 ", "PBC_123 "))
    if a and b:
        prov["_pbc123_cross_source"] = {"samples": [a, b], **concordance(results[a], {s: v[0] for s, v in results[b].items() if v[0]}),
                                        "discordant": sorted(s for s, v in results[a].items() if v[0] and results[b].get(s, (None,))[0]
                                                             and results[b][s][0] != v[0])}
    # coverage degradation: subsample reads; compare with the same sample at full coverage (optimistic: shared
    # reads) and with an independent truth (the other PBC 123 sample, or Bekele for overlapping clones)
    other = {"PBC123 ": "PBC_123 ", "PBC_123 ": "PBC123 "}
    cov = {}
    for s in have:
        if s["kind"] != "reads":
            continue
        key = f"{s['alias']} [{'+'.join(s['ids'])}]"
        x = prov[key]["est_coverage_x"]
        indep = next((kk for kk in results for a, b in other.items() if key.startswith(a) and kk.startswith(b)), None)
        rows = []
        for f in (0.1, 0.2, 0.35, 0.5, 0.75, 1.0):
            c = calls(s, mask, f) if f < 1 else results[key]
            r = {"fraction": f, "est_coverage_x": round(f * x, 1), "n_called": sum(1 for v in c.values() if v[0]),
                 "n_panel48_called": sum(1 for snp, v in c.items() if v[0] and snp in set(panel)),
                 "n_model589_called": sum(1 for snp, v in c.items() if v[0] and snp in set(model)),
                 "vs_full": concordance(c, calls_of(key))}
            if indep:
                r[f"vs_{indep}"] = concordance(c, calls_of(indep))
            for bname in s.get("bekele", []):
                r[f"vs_bekele_{bname}"] = concordance(c, bk[bname])
            rows.append(r)
        cov[s["alias"]] = rows
    prov["_method"] = {
        "markers": f"{len(k.markers())} TcSNPs (Allegre et al. 2012 Table S1 flanks; Bekele 2022 HapMap coding)",
        "kmers": f"k={k.K}, SNP at index {k.OFFSETS[0]}..{k.OFFSETS[-1]}, both strands; "
                 f"{len(mask['kmers'])} k-mers and {len(mask['snps'])} SNPs masked as multi-locus in assemblies",
        "thresholds": {"hom_if_minor_frac_le": k.HOM_MAX, "hom_if_binomial_het_p_lt": k.HOM_ALPHA,
                       "het_if_minor_frac_ge": k.HET_MIN, "het_min_minor_reads": k.HET_READS},
        "depth_ref_alt": "reads (or haplotypes) carrying the first / second letter of the SNP's HapMap allele pair "
                         "(Illumina allele A / B or TOP base), NOT the Criollo reference base",
        "genome_size_for_coverage": GENOME}
    (OUT / "genotypes.tsv").write_text("\n".join(tsv) + "\n")
    json.dump(prov, open(OUT / "provenance.json", "w"), indent=1)
    json.dump(cov, open(WORK / "coverage_curve.json", "w"), indent=1)
    print(json.dumps({"coverage_curve": cov, "pbc123": prov.get("_pbc123_cross_source")}, indent=1)[:20000])


if __name__ == "__main__":
    main()
