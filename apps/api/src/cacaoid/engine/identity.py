"""Clone identity: compare one sample against every registry fingerprint on the panel and decide.

Decision order: UJI ULANG -> BELUM ADA REFERENSI -> COCOK -> OFF-TYPE (found as X) -> TIDAK DIKENAL.
"Same clone" means the mismatch count is explainable by lab error (binomial tail >= MATCH_ALPHA);
which clone fits best is decided by likelihood, so a close relative cannot pass as the claim."""
import math
import re
from functools import lru_cache

import numpy as np

from cacaoid import config
from cacaoid.engine.registry import CODES, encode, genotype_freqs

LN10 = math.log(10)


# official names of clones that also circulate under their accession/selection code
ALIASES = {"PBC123": "SULAWESI1", "SULAWESI01": "SULAWESI1", "BR25": "SULAWESI2", "SULAWESI02": "SULAWESI2",
           "M01": "MCC01", "MCC1": "MCC01", "MCC2": "MCC02"}


def key(name: str) -> str:
    """Claim key: 'ICS 60', 'ics-60', 'ICS60 (varian b)' all -> 'ICS60'; 'PBC 123' -> 'SULAWESI1'."""
    k = re.sub(r"[\s\-_.]", "", re.sub(r"\s*\(varian \w\)$", "", name)).upper()
    return ALIASES.get(k, k)


@lru_cache
def max_allowed(n: int, e: float = config.GENO_ERROR, alpha: float = config.MATCH_ALPHA) -> int:
    """Largest mismatch count k out of n that lab error alone still explains (P(K>=k) >= alpha)."""
    tail = 1.0
    for k in range(n + 1):
        if tail < alpha:
            return k - 1
        tail -= math.comb(n, k) * e**k * (1 - e) ** (n - k)
    return n


def usable(profile: dict, panel: list[str]) -> bool:
    """Enough panel calls that any sample passing QC still overlaps on >= MIN_COMPARED SNPs."""
    need = config.MIN_COMPARED + (1 - config.MIN_CALL_RATE) * len(panel)
    return sum(profile.get(s) is not None for s in panel) >= need


class Matcher:
    """Built once per batch from registry rows (anything with .name, .status, .profile)."""

    def __init__(self, refs, panel: list[str]):
        self.panel = panel
        # references missing too many panel SNPs cannot back a verdict (registry status "tidak lengkap")
        self.refs = [r for r in refs if usable(r.profile, panel)]
        self.all_keys = {key(r.name) for r in refs}
        self.R = encode([[r.profile.get(s) for s in panel] for r in self.refs])
        fr = genotype_freqs([r.profile for r in self.refs], panel)
        floor = 0.5 / max(len(self.refs), 1)
        # log genotype frequency per SNP x code, used when a reference has no call there
        self.logf = np.log(np.array([[max(fr[s].get(g, 0), floor) for g in CODES] for s in panel]))

    def identify(self, sample_id: str, calls: dict[str, str | None], claimed: str) -> dict:
        e = config.GENO_ERROR
        x = encode([[calls.get(s) for s in self.panel]])[0]
        called = x >= 0
        cr = float(called.mean()) if len(x) else 0.0
        out = {"sample": sample_id, "claimed": claimed, "call_rate": round(cr, 3), "found_as": None,
               "mismatches": None, "compared": None, "allowed": None, "lod": None, "chance_log10": None,
               "candidates": [], "compare": [], "notes": [], "steps": []}
        step = lambda title, detail, ok: out["steps"].append({"title": title, "detail": detail, "ok": ok})

        if cr < config.MIN_CALL_RATE or called.sum() < config.MIN_COMPARED:
            step("Kualitas data lab", f"Hanya {called.sum()} dari {len(x)} SNP panel terbaca "
                 f"({cr:.0%}); minimal {config.MIN_CALL_RATE:.0%}.", False)
            return {**out, "verdict": "UJI ULANG"}
        step("Kualitas data lab", f"{called.sum()} dari {len(x)} SNP panel terbaca ({cr:.0%}).", True)

        both = (self.R >= 0) & called
        k = ((self.R != x) & both).sum(1)
        n = both.sum(1)
        refmiss = (self.R < 0) & called
        cols = np.where(called)[0]
        ll = ((self.R == x) & both).sum(1) * math.log(1 - e) + k * math.log(e / 2) \
            + (refmiss[:, cols] * self.logf[cols, x[cols]]).sum(1)
        ok = np.array([n[i] >= config.MIN_COMPARED and k[i] <= max_allowed(int(n[i])) for i in range(len(k))])
        order = np.argsort(-ll)
        best = int(order[0])
        out["candidates"] = [{"name": self.refs[i].name, "mismatches": int(k[i]), "compared": int(n[i]),
                              "consistent": bool(ok[i])} for i in order[:3]]
        # chance that an unrelated registry clone carries this exact fingerprint
        out["chance_log10"] = round(float(self.logf[cols, x[cols]].sum() / LN10), 1)

        ck = key(claimed)
        claim_idx = [i for i, r in enumerate(self.refs) if key(r.name) == ck]
        found = best if ok[best] else None

        def compare(i_claim, i_found):
            out["compare"] = [{"snp": s, "sample": calls.get(s),
                               "claimed": self.refs[i_claim].profile.get(s) if i_claim is not None else None,
                               "found": self.refs[i_found].profile.get(s) if i_found is not None else None}
                              for s in self.panel]

        if not claim_idx:
            why = "terdaftar tetapi sidik jari referensinya belum ada atau tidak lengkap" if ck in self.all_keys else "tidak ada di registri"
            step("Bandingkan dengan klon yang diklaim", f"Klon {claimed} {why}.", None)
            if found is not None:
                out.update(found_as=self.refs[found].name, mismatches=int(k[found]), compared=int(n[found]))
                step("Cari di registri", f"Sampel cocok dengan {self.refs[found].name} "
                     f"({k[found]} beda dari {n[found]} SNP).", None)
                out["notes"].append(f"Bila {claimed} memang bukan {self.refs[found].name}, sampel ini off-type.")
            compare(None, found)
            return {**out, "verdict": "BELUM ADA REFERENSI"}

        c = max(claim_idx, key=lambda i: ll[i])
        allowed = max_allowed(int(n[c]))
        out.update(mismatches=int(k[c]), compared=int(n[c]), allowed=allowed, claimed_ref=self.refs[c].name)
        step("Bandingkan dengan klon yang diklaim",
             f"{k[c]} beda dari {n[c]} SNP terhadap {self.refs[c].name}; dengan error lab "
             f"{e:.0%} wajar sampai {allowed} beda.", bool(ok[c]))
        if self.refs[c].status == "tidak konsisten":
            out["notes"].append(f"Referensi {claimed} tidak konsisten di bank plasma nutfah; konfirmasi ke pemilik klon.")

        # Claim vs every other clone, scored only on SNPs both references have, so a synonym whose
        # reference merely has more calls cannot outscore the claim. lead > 0: the other fits better.
        shared = both & (self.R[c] >= 0)
        lead = (((self.R[c] != x) & shared).sum(1) - ((self.R != x) & shared).sum(1)) * math.log10((1 - e) / (e / 2))
        others = np.array([key(r.name) != ck for r in self.refs])
        rivals = np.where(others & ok)[0]
        top = int(rivals[np.argmax(lead[rivals])]) if len(rivals) else None

        if ok[c] and (top is None or lead[top] < config.LOD_MARGIN):
            out["lod"] = round(float(-lead[others].max()), 1)
            twins = [i for i in rivals[np.argsort(-lead[rivals])][:5] if lead[i] > -config.LOD_MARGIN]
            if twins:
                out["notes"].append("Panel tidak dapat membedakan klon ini dari "
                                    + ", ".join(self.refs[i].name for i in twins) + ".")
            step("Cari di registri", f"Tidak ada klon lain yang lebih cocok (selisih skor {out['lod']} log10).", True)
            compare(c, None)
            return {**out, "verdict": "COCOK"}

        found = top
        if found is not None:
            out["found_as"] = self.refs[found].name
            out["lod"] = round(float(lead[found]), 1)
            step("Cari di registri", f"Paling cocok dengan {self.refs[found].name} "
                 f"({k[found]} beda dari {n[found]} SNP).", False)
            # clones the panel cannot separate from the one found (scored on SNPs both references have)
            sh = both & (self.R[found] >= 0)
            gap = (((self.R != x) & sh).sum(1) - ((self.R[found] != x) & sh).sum(1)) * math.log10((1 - e) / (e / 2))
            twins = [self.refs[i].name for i in rivals if i != found and gap[i] < config.LOD_MARGIN]
            if twins:
                out["candidates_equal"] = twins
                out["notes"].append(f"Pada panel ini {self.refs[found].name} tidak dapat dibedakan dari "
                                    f"{', '.join(twins[:4])}: pohon ini salah satunya.")
            compare(c, found)
            return {**out, "verdict": "OFF-TYPE"}

        step("Cari di registri", f"Tidak ada klon terdaftar yang cocok; terdekat {self.refs[best].name} "
             f"({k[best]} beda dari {n[best]} SNP).", False)
        if k[c] <= allowed + 2:  # GAPS G-08: just past the lab-error limit, so a rerun may still clear it
            out["notes"].append(f"Hanya {k[c] - allowed} beda di atas batas wajar error lab terhadap {claimed}. "
                                f"Uji ulang sampel ini sebelum pohon diganti.")
        compare(c, None)
        return {**out, "verdict": "TIDAK DIKENAL"}
