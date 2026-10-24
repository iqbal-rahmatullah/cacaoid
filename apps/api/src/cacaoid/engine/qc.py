"""Batch quality control before any verdict."""
from dataclasses import dataclass, field

from cacaoid import config
from cacaoid.engine.io import Genotypes


@dataclass
class QCReport:
    call_rate: dict[str, float]
    retest: list[str]                      # below MIN_CALL_RATE -> UJI ULANG
    unknown_ids: list[str] = field(default_factory=list)   # in lab file, not registered in the field
    missing_ids: list[str] = field(default_factory=list)   # registered in the field, absent from lab file
    snps_not_in_panel: list[str] = field(default_factory=list)
    panel_snps_missing: list[str] = field(default_factory=list)

    @property
    def mean_call_rate(self) -> float:
        """Over everything that should hold DNA: a negative control is empty on purpose."""
        rates = [r for s, r in self.call_rate.items() if not s.upper().startswith("KTRL-NTC")]
        return round(sum(rates) / max(len(rates), 1), 6)


def run_qc(geno: Genotypes, panel_snps: list[str], expected_ids: list[str] | None = None,
           min_call_rate: float = config.MIN_CALL_RATE) -> QCReport:
    panel = set(panel_snps)
    in_panel = [j for j, s in enumerate(geno.snps) if s in panel]
    rates = {}
    for i, sid in enumerate(geno.samples):
        row = [geno.calls[i][j] for j in in_panel]
        rates[sid] = sum(c is not None for c in row) / max(len(panel), 1)
    rep = QCReport(call_rate=rates, retest=[s for s, r in rates.items() if r < min_call_rate],
                   snps_not_in_panel=[s for s in geno.snps if s not in panel],
                   panel_snps_missing=[s for s in panel_snps if s not in set(geno.snps)])
    if expected_ids is not None:
        exp, got = set(expected_ids), set(geno.samples)
        rep.unknown_ids = sorted(got - exp)
        rep.missing_ids = sorted(exp - got)
    return rep


COMPLEMENT = str.maketrans("ACGT", "TGCA")


def fix_strand(geno: Genotypes, known: dict[str, set[str]]) -> tuple[dict[str, int], list[str]]:
    """Calls reported on the opposite DNA strand carry alleles a SNP doesn't have (T/C at an A/G SNP); flip them back.
    Returns corrections per SNP, and the palindromic SNPs (A/T, C/G) where a flip is invisible."""
    fixed: dict[str, int] = {}
    for j, snp in enumerate(geno.snps):
        al = known.get(snp)
        if not al:
            continue
        for row in geno.calls:
            g = row[j]
            if g and not set(g) <= al and set(g.translate(COMPLEMENT)) <= al:
                row[j] = "".join(sorted(g.translate(COMPLEMENT)))
                fixed[snp] = fixed.get(snp, 0) + 1
    palindromic = [snp for snp, al in known.items() if al in ({"A", "T"}, {"C", "G"})]
    return fixed, palindromic
