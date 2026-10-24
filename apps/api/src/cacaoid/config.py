import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # apps/api/
DATA = ROOT / "data"
DB_PATH = Path(os.environ.get("CACAOID_DB", ROOT / "cacaoid.db"))

# Decision thresholds (tune here, not in code)
MIN_CALL_RATE = 0.85        # below this a sample is UJI ULANG (0.90 sent ~9% to retest at 5% missing, see GAPS G-03)
GENO_ERROR = 0.02           # assumed per-SNP lab error rate
MATCH_ALPHA = 0.001         # mismatches still "same clone" while P(>=k | lab error) >= this
LOD_MARGIN = 2.0            # log10 likelihood lead another clone needs to overrule the claim
PARENT_LOD = 3.0            # log10 odds a parent pair needs over "unrelated tree"
MIN_COMPARED = 30           # minimum SNPs compared before any verdict
LOT_CONTAM_MAX = 0.05       # lot passes if estimated pollen contamination <= this
# Real F1 data (tasks/feasibility/F5) showed false exclusions of true offspring at 2.4–7.6%, above what our simulator
# produces; never assume less than this (by panel size) when correcting a lot estimate
LOT_ALPHA_FLOOR_SMALL = 0.05  # panels < 96 SNPs
LOT_ALPHA_FLOOR_LARGE = 0.03  # panels >= 96 SNPs
