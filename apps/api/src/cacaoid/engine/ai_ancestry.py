"""AI asal-usul: genetic composition over Motamayor et al. 2008 groups by supervised admixture (EM).
Ported from legacy-scripts/ancestry.py. Reference groups are only those with unambiguous accessions in the
public registry (Nanay, Marañón, Iquitos, Guiana, Contamana) plus Criollo and Amelonado trees confirmed against
public genomes (registry.GROUP_BY_NAME). "Trinitario" is a hybrid type (Criollo x Amelonado), never a group;
Curaray, Purús and Nacional have no reference trees yet, so trees from those backgrounds read as a mix."""
import numpy as np

MISSING_GROUPS = ["Curaray", "Purús", "Nacional"]


class Ancestry:
    def __init__(self, refs: list, snps: list[str], alleles: list[str]):
        """refs: registry rows with .group and .profile; only grouped rows train the group frequencies."""
        self.snps, self.alleles = snps, alleles
        labelled = [r for r in refs if r.group and r.profile]
        self.groups = sorted({r.group for r in labelled})
        D = np.array([self.dosage(r.profile) for r in labelled])
        lab = np.array([r.group for r in labelled])
        # allele frequency per group with a +1 prior, so a SNP unseen in a small group is not impossible
        self.P = np.array([(np.nansum(D[lab == g], 0) + 1) / (2 * np.isfinite(D[lab == g]).sum(0) + 2)
                           for g in self.groups])
        self.n_ref = {g: int((lab == g).sum()) for g in self.groups}

    def dosage(self, profile: dict) -> np.ndarray:
        return np.array([profile[s].count(a) if profile.get(s) else np.nan for s, a in zip(self.snps, self.alleles)])

    def admix(self, profile: dict, iters: int = 100) -> dict:
        g = self.dosage(profile)
        ok = np.isfinite(g)
        g, P = g[ok], self.P[:, ok]
        q = np.full(len(self.groups), 1 / len(self.groups))
        for _ in range(iters):
            a1, a0 = q[:, None] * P, q[:, None] * (1 - P)
            q = ((a1 / a1.sum(0)) * g + (a0 / a0.sum(0)) * (2 - g)).sum(1) / (2 * len(g))
        comp = {grp: round(float(v), 3) for grp, v in sorted(zip(self.groups, q), key=lambda t: -t[1])}
        top = next(iter(comp))
        return {"coverage": round(float(ok.mean()), 3), "composition": comp,
                "dominant": top if comp[top] >= 0.8 else None}
