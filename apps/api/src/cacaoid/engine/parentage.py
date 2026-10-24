"""Parentage on the identity panel, only against specific hypotheses: a registered rootstock cross, or pairs of
clones planted in the same garden. Open search over the whole registry (~190k pairs) is not reliable on 48 SNPs
(GAPS G-10), so it is deliberately not offered."""
import numpy as np

from cacaoid import config
from cacaoid.engine.identity import max_allowed

# OK[p, q, c]: can parents with A-allele dosage p and q produce a child with dosage c?
OK = np.zeros((3, 3, 3), bool)
for p, ga in ((0, {0}), (1, {0, 1}), (2, {1})):
    for q, gb in ((0, {0}), (1, {0, 1}), (2, {1})):
        for x in ga:
            for y in gb:
                OK[p, q, x + y] = True


# T[p, q, c]: Mendelian probability of child dosage c from parent dosages p, q
T = np.zeros((3, 3, 3))
for p in range(3):
    for q in range(3):
        a, b = p / 2, q / 2
        T[p, q] = [(1 - a) * (1 - b), a * (1 - b) + (1 - a) * b, a * b]


class Parentage:
    def __init__(self, refs: dict[str, dict[str, str]], panel: list[str]):
        self.panel = panel
        al = [sorted({a for p in refs.values() if p.get(s) for a in p[s]}) for s in panel]
        self.alleles = [a if len(a) == 2 else None for a in al]  # tri-allelic SNPs are skipped
        self.D = {n: self.dosage(p) for n, p in refs.items()}
        M = np.array(list(self.D.values()))
        # genotype frequencies per SNP: the "unrelated tree" hypothesis
        self.F = np.array([[max(((M[:, j] == c).sum()) / max((M[:, j] >= 0).sum(), 1), 0.01) for c in range(3)]
                           for j in range(len(panel))])

    def dosage(self, calls: dict[str, str | None]) -> np.ndarray:
        out = np.full(len(self.panel), -1, np.int8)
        for j, s in enumerate(self.panel):
            g, a = calls.get(s), self.alleles[j]
            if g and a and set(g) <= set(a):
                out[j] = g.count(a[0])
        return out

    def test_pair(self, calls: dict, p1: str, p2: str) -> dict:
        """Mendelian exclusions of a child against one parent pair, judged with the identity error model."""
        c, a, b = self.dosage(calls), self.D[p1], self.D[p2]
        m = (a >= 0) & (b >= 0) & (c >= 0)
        excl, n = int((~OK[a[m], b[m], c[m]]).sum()), int(m.sum())
        allowed = max_allowed(n)
        # LOD: log10 likelihood of "child of this pair" vs "unrelated tree", with lab error e
        e, f = config.GENO_ERROR, self.F[m, c[m]]
        lod = float(np.log10(((1 - e) * T[a[m], b[m], c[m]] + e * f) / f).sum())
        return {"parents": [p1, p2], "exclusions": excl, "compared": n, "allowed": allowed, "lod": round(lod, 1),
                "ok": excl <= allowed and lod >= config.PARENT_LOD}

    def search(self, calls: dict, garden: list[str]) -> dict | None:
        """Best parent pair among garden clones; only returned when it passes and no other pair ties it."""
        g = [x for x in dict.fromkeys(garden) if x in self.D]
        tests = sorted((self.test_pair(calls, a, b) for i, a in enumerate(g) for b in g[i + 1:]),
                       key=lambda t: -t["lod"])
        if not tests or not tests[0]["ok"]:
            return None
        if len(tests) > 1 and tests[1]["ok"] and tests[1]["lod"] > tests[0]["lod"] - 1:
            return {**tests[0], "ambiguous_with": tests[1]["parents"]}
        return tests[0]


def explain_unknown(r: dict, calls: dict, par: Parentage, rootstocks: list[tuple[str, str, str]],
                    garden: list[str], registered: bool = True) -> dict:
    """Second look at a TIDAK DIKENAL sample: rootstock of a registered cross, or a seedling of garden clones.
    `registered`: the garden list comes from the provider registry, not guessed from claims in the batch."""
    where = "klon yang terdaftar di kebun ini" if registered else \
        "klon yang diklaim penyedia ini di batch (komposisi kebun belum terdaftar)"
    for name, p1, p2 in rootstocks:
        if p1 in par.D and p2 in par.D:
            t = par.test_pair(calls, p1, p2)
            if t["ok"]:
                r["steps"].append({"title": "Uji batang bawah", "ok": False, "detail":
                                   f"Sampel cocok sebagai anak {p1} × {p2} ({name}): {t['exclusions']} eksklusi "
                                   f"dari {t['compared']} SNP, batas {t['allowed']}. Daun kemungkinan diambil dari "
                                   f"batang bawah, atau batang atas mati dan tunas batang bawah yang tumbuh."})
                return {**r, "verdict": "BATANG BAWAH", "found_as": name, "parentage": t}
    if rootstocks:
        r["steps"].append({"title": "Uji batang bawah", "ok": None,
                           "detail": "Bukan anak silangan batang bawah terdaftar."})
    t = par.search(calls, garden)
    if t:
        a, b = t["parents"]
        amb = f" (bisa juga {' × '.join(t['ambiguous_with'])})" if "ambiguous_with" in t else ""
        r["steps"].append({"title": "Cari asal biji di klon kebun ini", "ok": None,
                           "detail": f"Diuji terhadap {where}. Kemungkinan semaian {a} × {b}{amb}: "
                                     f"{t['exclusions']} eksklusi dari {t['compared']} SNP, LOD {t['lod']}."})
        r["notes"].append(f"Kemungkinan asal biji: semaian {a} × {b}{amb}. Pohon ditanam dari biji, bukan dari entres.")
        r["parentage"] = t
    elif garden:
        r["steps"].append({"title": "Cari asal biji di klon kebun ini", "ok": None,
                           "detail": f"Tidak cocok sebagai anak dua dari {where} ({', '.join(dict.fromkeys(garden))})."})
    return r
