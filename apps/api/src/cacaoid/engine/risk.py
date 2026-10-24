"""Skor risiko penyedia (beta): transparent rules, no trained model yet (too little history for one).
Every point added comes with the reason, and the score sets how hard the next lot is sampled."""
from cacaoid.engine.contamination import sample_size

BAD = {"OFF-TYPE", "TIDAK DIKENAL", "BATANG BAWAH", "KONTAMINAN"}
PRIOR_BAD, PRIOR_N = 1, 10   # a new provider starts at an assumed 10% off-type rate, not at 0%
TIERS = [(25, "Rendah"), (50, "Sedang"), (101, "Tinggi")]


def score(n: int, bad: int, lots_held: int, gps_missing: int) -> dict:
    p = (bad + PRIOR_BAD) / (n + PRIOR_N)
    factors = [(f"Off-type historis {bad}/{n} sampel (perkiraan {p:.0%} setelah dihaluskan)", min(70, round(p * 250)))]
    if n < 20:
        factors.append((f"Riwayat masih sedikit ({n} sampel terverifikasi)", 15))
    if lots_held:
        factors.append((f"{lots_held} lot benih pernah ditahan", min(20, 10 * lots_held)))
    if n and gps_missing / n > 0.2:
        factors.append((f"{gps_missing} sampel tanpa GPS: lokasi pohon tidak bisa dicek", 5))
    total = min(100, sum(pts for _, pts in factors))
    tier = next(t for limit, t in TIERS if total < limit)
    # smallest off-type share the next lot must catch: 10% for a spotless record down to 2% for the worst,
    # continuous so two providers with different records never get the same sampling plan by accident
    catch = round(0.10 - 0.08 * total / 100, 3)
    return {"score": total, "tier": tier, "p_hat": round(p, 3), "factors": [{"label": l, "points": v} for l, v in factors],
            "catch_rate": catch, "recommended_n": sample_size(catch)}
