# Data attribution

All data below are used only to build and test the CacaoID prototype. Licences differ per source; check before any commercial use.

## Genotypes (registry, benchmarks)

| Folder | Source | Content | Licence |
|---|---|---|---|
| `bekele2022/genotypes_hapmap.txt` | Bekele F. et al. (2022) *PLoS ONE* 17(1): e0260907. https://doi.org/10.1371/journal.pone.0260907 (S10) | 644 trees of the International Cocoa Genebank Trinidad, SNP genotypes (HapMap). `genotypes_per_pohon.csv` + `snp_info.csv` are the same data as CSV (`scripts/hapmap_to_csv.py`) | CC BY 4.0 |
| `bekele2022/phenotypes.xlsx` | Same paper (S2) | Bean and pod traits for 346 accessions | CC BY 4.0 |
| `osorio2025/*.xlsx` | Osorio-Guarín J.A. et al. (2025) *Front. Plant Sci.* 16:1632888. https://doi.org/10.3389/fpls.2025.1632888 (Tables S1, S4, S5) | 4,653 trees × 77 KASP SNPs; 172 mislabelled plots | CC BY 4.0 |
| `benchmark/jacquotte2026_pruned.npz` | CATIE/Nestlé black-pod & frosty-pod GWAS (Plant Genome 2026), Dryad doi:10.5061/dryad.0rxwdbsg4 | 495 F1 trees from 8 crosses, SNP subset (real-data parentage benchmark; training data of the black pod model) | CC0 |
| `benchmark/jacquotte2026_phenotypes.csv`, `benchmark/jacquotte2026_marker_map.csv` | Same release (`Phenotypic.data.csv`, `Marker_map.csv`) | BLUEs of black pod rot (BPR) and other traits per tree; marker positions | CC0 |
| `jacquotte2026/flanks.tsv`, `jacquotte2026/unique_in_criollo_v2.json` | Criollo cocoa genome V2, NCBI GCF_000208745.1 (Argout et al. 2017), at the Jacquotte marker positions | 30 bp flanks and the markers unique in the assembly (for calling them from public WGS reads) | INSDC public data |
| `wgs_refs/` (if present) | Public whole-genome reads/assemblies: Cornejo et al. 2018 (PRJNA486011), Todd et al. 2025 (PRJEB75153), Argout et al. 2023 (PRJNA880462), Tobias et al. 2024 (PRJNA1083235), NCBI reference assemblies; marker sequences from Ahn et al. 2026, Zenodo 22755806 | Genotypes called by CacaoID at panel SNPs | INSDC public data; Zenodo file CC BY 4.0 |

## Clone traits, compatibility, sites

| Folder | Source | Licence / terms |
|---|---|---|
| `traits/` | ACIAR SMAR/2005/074 and HORT/2010/011 final reports; ICCRI leaflet "Klon-klon unggul kakao lindak"; Susilo, Anita-Sari & Imran 2015 (Pelita Perkebunan 31(3)); Rubiyo et al. 2020 (Biodiversitas 21(12)); CFC/ICCO/IPGRI 2006 (Malaysian VSD tests); Asman et al. 2021 (abstract). Full list in `traits/sources.csv` | ACIAR © (facts cited, tables not reproduced); Pelita Perkebunan CC BY-SA 4.0; others open access / see `traits/sources.csv` |
| `compat/` | Lanaud C. et al. 2017, J. Exp. Bot. (Tables S3, S7); Farid M. et al. 2021, SABRAO J. Breed. Genet. 53(1); Malik A. 2016, skripsi UGM | CC BY; open access; public abstract |
| `agroclimate/power_cache.json` | NASA POWER climatology API (2001–2025) | NASA open data |
| `agroclimate/trial_sites.csv` | Approximate district/sub-district centres of the trial sites named in `traits/` | CacaoID |

## Maps read at run time (not stored)

| Source | Licence |
|---|---|
| JRC Global Forest Cover 2020 V4, doi:10.2905/JRC.3KATEH8 | CC BY 4.0 |
| Hansen/UMD Global Forest Change 2000–2025 v1.13 | CC BY 4.0 |

## Not included

No public genotypes exist for MCC 02, ICCRI 03/04/06H/08H, KEE 2 or TSH 858. Those must come from their owners (ICCRI/Puslitkoka, BRIN, Mars). Sulawesi 1 (= PBC 123), Sulawesi 2 (= BR 25) and MCC 01 (= M01, per ACIAR HORT/2010/011 p.72) have public whole-genome data under those accession names. The names come from the archives and are not yet confirmed by the clone owners.
