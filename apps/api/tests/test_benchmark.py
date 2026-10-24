"""Blind benchmark on Osorio-Guarín et al. 2025 (CC BY): 4,653 Colombian genebank trees x 77 KASP SNPs.
The registry builder must rediscover the paper's heterogeneous (mislabelled) plots, Supplementary Table 5."""
import openpyxl

from cacaoid.config import DATA
from cacaoid.engine.io import Genotypes, parse_colombia_table4
from cacaoid.engine.registry import build_registry


def accession(name: str) -> str:
    return name.rsplit("_", 1)[0] if "_" in name else name.rsplit("-", 1)[0]


def test_colombia_heterogeneous_plots():
    geno, banks = parse_colombia_table4(DATA / "osorio2025" / "table4_genotypes.xlsx")
    plot = {s: f"{accession(s)}@{b}" for s, b in zip(geno.samples, banks)}  # one plot = accession in one genebank
    renamed = Genotypes([f"{plot[s]}_{i}" for i, s in enumerate(geno.samples)], geno.snps, geno.calls)
    flagged = {c.name.split(" (varian")[0] for c in build_registry(renamed) if c.status == "tidak konsisten"}

    rows = openpyxl.load_workbook(DATA / "osorio2025" / "table5_heterogeneous_plots.xlsx", read_only=True).worksheets[0]
    paper = {plot[str(r[1]).strip()] for r in list(rows.iter_rows(values_only=True))[2:] if r[1] and str(r[1]).strip() in plot}
    found = flagged & paper
    print(f"paper plots {len(paper)}, flagged {len(flagged)}, rediscovered {len(found)}")
    assert len(found) / len(paper) >= 0.95
