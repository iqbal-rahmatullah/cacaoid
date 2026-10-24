"""Bekele 2022 HapMap -> two CSV files that open in Excel/Sheets (the API keeps reading the HapMap file).

    uv run python scripts/hapmap_to_csv.py

genotypes_per_pohon.csv  one row per tree: pohon, klon (replicate suffix _N removed), one column per SNP
snp_info.csv             one row per SNP: alleles (A/C, or "lain" where the file says "*"), chromosome, position
The file's 426 blank lines are dropped and "NN" (not read) becomes an empty cell.
"""
import csv
import re
from pathlib import Path

DIR = Path(__file__).resolve().parents[1] / "data" / "bekele2022"


def main() -> None:
    lines = (DIR / "genotypes_hapmap.txt").read_text().splitlines()  # also strips the CRLF endings
    head, *body = [line.split("\t") for line in lines]
    rows = [r for r in body if r[0].strip()]
    trees = head[11:]
    with open(DIR / "snp_info.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["snp", "alel", "kromosom", "posisi"])
        w.writerows([r[0], "lain" if r[1] == "*" else r[1], r[2], r[3]] for r in rows)
    with open(DIR / "genotypes_per_pohon.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["pohon", "klon", *(r[0] for r in rows)])
        for j, tree in enumerate(trees):
            calls = ["" if r[11 + j] == "NN" else r[11 + j] for r in rows]
            w.writerow([tree, re.sub(r"_\d+$", "", tree), *calls])
    print(f"{len(trees)} pohon × {len(rows)} SNP -> {DIR}")


if __name__ == "__main__":
    main()
