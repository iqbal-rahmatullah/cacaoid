# F1/F3 · Genome-to-fingerprint: registry genotypes for named clones from public genomes

Status: **feasible and built; internal numbers (not for slides).** Scripts: `backend/scripts/wgs/` (README there).
Outputs: `data/wgs_refs/genotypes.tsv`, `data/wgs_refs/provenance.json`, `data/wgs_refs/kmer_mask.json`,
`data/wgs_refs/tcsnp_flanks_allegre2012.tsv`. Everything below was measured on this laptop on 2026-10-23.

## TL;DR

- **It works without an aligner.** Exact allele-specific 31-mer matching on the TcSNP flanks genotypes 834 of the 836
  SNPs in the Bekele HapMap (all 48 panel SNPs, 587/589 model SNPs). Read calls agree with a **phased diploid assembly
  of the same clone on 99.7% of 731 SNPs** (Nestle CCN 51 reads vs the 2025 CCN 51 hap1+hap2 assembly). Against the
  Bekele array (internal metric only) agreement is **96.6-97.6%** for every correctly labelled genome or read set
  (TSH 1188 reads 97.6%, CCN 51 reads 97.1%, ICS 1 phased assembly 96.7%, CCN 51 phased assembly 97.3%). The array is
  the noisier side: the two phased assemblies disagree with it about as much as reads do.
- **PBC 123 (Sulawesi 1) is now a cross-verified reference.** Two independent public WGS samples (Cornejo 2018,
  Mars/USDA gDNA, HiSeq 2500; Nestle 2024, NovaSeq) agree on **99.1% of 687 shared SNP calls** (6 discordant, all
  het-vs-hom at 8-19 reads). Neither matches any of the 644 Bekele trees (best 65%), so it is genuinely new.
- **New Indonesian references (one source each, name match only):** MCC 01 (= Mars "M01" per ACIAR HORT/2010/011
  p.72), BR 25 (Sulawesi 2), M04, M06, and "Clone 26" (phased assembly, Tobias 2024). All five are distinct from each
  other and from every Bekele tree. MCC 02 has no public genome. M02/M05/M07 exist in Cornejo but were not run.
- **The identity test catches mislabels in public data**, which is itself the CacaoID pitch: Cornejo's `SCA6**`
  (flagged as an off-type by the authors in a footnote) matches UF 667 at 95.9% and SCA 6 at 17%; Nestle's `ICS_1`
  matches Bekele ICS 10 at 96.8% and ICS 1 at 28%; Nestle's `ICS_60` and the USDA `IMC 67` assembly do not match the
  Bekele trees of those names. Such samples are kept out of `genotypes.tsv` automatically.
- **Coverage limits how many SNPs get called, not how accurate they are.** Concordance stays at 97-100% down to ~5x,
  but calls drop: 750-790 of 834 at >= 20x, 700-750 at ~15x, 490-670 at ~10x, 240-480 at ~7x, 145-340 at ~5x,
  17-75 at ~3x.
- **Speed:** the SRA object on AWS S3 is the fast path (7.2-9.7 MB/s with 8 ranges; ENA FASTQ 1.3 MB/s). Then
  `fastq-dump` (1 CPU) dominates: 4.5-21 min per sample. One 15-25x sample = 2-5 GB = 18-45 min end to end here.
- **Production:** run the same scripts on a cloud VM in AWS us-east-1 next to the SRA bucket (download in seconds,
  parallel `fastq-dump`), and treat every WGS-derived reference as *provisional* until KASP genotyping of budwood
  from the official source garden confirms it.

## 1. Marker sequences: where the TcSNP flanks really are

| Source | Result |
|---|---|
| Zenodo 22755806 (Ahn et al. 2026) `Supplementary_Data_S1.xlsx`, 137.6 MB in 107 s (1.29 MB/s) | 109 sheets. Flanks are for TropGeneDB "Cocoa diversity" GBS tags (52,460), Nacional GBS and similar. Only 12 TcSNP IDs (TcSNP1854-1865, "Incompatibility" resource) and **no sequence** for them. **Not usable for our SNPs.** |
| Allegre et al. 2012, *DNA Res* 19:23 (PMC3276266), Supplementary Table S1 via the Europe PMC supplementary-files API | **1,536 EST-SNPs with 60 bp + `[X/Y]` + 60 bp.** SNP number N = TcSNP N: TcSNP23 is identical to the TcSNP23 flank in a 2024 *Plant Genet. Resour.* table, and linkage group / cM match the Bekele HapMap (TcSNP1326: LG8 38.1 vs 37.854). Bekele et al. 2022 cite Allegre/Argout as the source of their GoldenGate SNPs. **Used.** Extract: `data/wgs_refs/tcsnp_flanks_allegre2012.tsv` (journal licence CC BY-NC). |

Allele coding in the Bekele HapMap had to be reverse-engineered (now in `kmerfp.markers()`, self-checked by `demo`):

- 671 SNPs coded `A/C` are Illumina **A/B** calls (`A` = allele A, `C` = allele B); 165 coded `*` are **TOP-strand
  nucleotides**; 426 rows are empty. Strand comes from Illumina's TOP/BOT rules (sequence walking for [A/T], [C/G]).
- The textbook rule is right for every class except **[C/G] SNPs in A/B coding, where Bekele's allele A is G**. Found
  empirically: 149 of 150 homozygous checks on three assemblies were flipped; after the fix all classes agree.
- TcSNP906 is published as A/G but typed A/C in the HapMap (dropped); TcSNP154 has no decidable strand (dropped).
  20 pairs are the same assay under two IDs (e.g. TcSNP10 = TcSNP1401, TcSNP1028 = TcSNP1204); they now share k-mers.

## 2. Method (details in the scripts README)

- k = 31; for each SNP and allele every k-mer with the SNP at index 3..27, both strands (79,252 k-mers). Scanning is
  numpy-vectorised (2-bit encoding with doubling, 24-bit prefix filter, binary search): ~20 s per 400 Mb assembly.
- One count per read (or assembly locus) per SNP: hits are de-duplicated on the genomic position of the SNP base.
- Repeats/paralogs: a k-mer placed at > 1 locus in >= 2 of the 12 assemblies is masked for both alleles at that
  offset (1,240 k-mers); read depth > 3x the sample median marker depth = multi-copy, no call (catches TcSNP456/1273).
- Read genotype: homozygous if minor fraction <= 10% and Binomial(d, 0.5) gives that few minor reads with p < 0.01
  (so >= 7 reads with 0 minor, >= 10 with 1); heterozygous if >= 2 minor reads and fraction >= 20%; else no call.
  Picked on the two PBC 123 samples (cross-sample agreement 98.9% vs 98.2% for a plain depth >= 8 / 10% / 25% rule,
  with ~50 more calls).
- Assemblies: phased haplotype pairs give diploid calls; single collapsed assemblies are pseudo-haploid (heterozygous
  sites look homozygous), so they are scored on Bekele-homozygous sites only and never written to `genotypes.tsv`.

## 3. Results per genome

Concordance = identical 2-letter call on SNPs called in both (internal; the Bekele array has its own ~3% error,
see the phased assemblies). "hom sites" = only SNPs where the Bekele tree is homozygous (the fair test for collapsed
assemblies). Top match = best of the 644 Bekele trees with >= 100 shared calls. Coverage = bases / 430 Mb.

| sample | source | kind | cov x | median depth | SNPs called /834 | panel /48 | model /587 | Bekele concordance (all / hom sites) | top Bekele match |
|---|---|---|---|---|---|---|---|---|---|
| PBC123 | PRJNA486011 SRR7774164 | reads | 14.0 | 12 | 739 | 41 | 531 | - | TRD85 65.2% |
| PBC_123 | PRJEB75153 ERR13166480 | reads | 15.4 | 13 | 741 | 44 | 534 | - | TRD85 64.5% |
| M01 | PRJNA486011 SRR7774264 | reads | 26.3 | 27 | 787 | 43 | 558 | - | ICS84 59.6% |
| BR25 | PRJNA486011 SRR7774302 | reads | 21.7 | 19 | 776 | 43 | 547 | - | GS36 71.1% |
| M04 | PRJNA486011 SRR7774262 | reads | 22.2 | 18 | 749 | 41 | 532 | - | LCTEEN-62_S4 61.1% |
| M06 | PRJNA486011 SRR7774260 | reads | 19.1 | 18 | 773 | 43 | 547 | - | PA132 64.6% |
| SIC806 | PRJNA486011 SRR7774318 | reads | 18.3 | 13 | 713 | 39 | 507 | - | CATONGO_1 97.6% |
| SIAL70 | PRJNA486011 SRR7774316 | reads | 21.5 | 15 | 748 | 43 | 532 | - | LCTEEN-90_S7 94.2% |
| criollo | PRJNA486011 SRR7774278 | reads | 9.0 | 8 | 537 | 30 | 379 | - | BELIZE9761_B-1 96.9% |
| CRIOLLO_21_CRI | PRJEB75153 ERR13166357 | reads | 15.1 | 13 | 738 | 43 | 523 | - | MOQ6/103 75.9% |
| CUR3_G35_A1 | PRJNA486011 SRR7774159 | reads | 9.6 | 4 | 232 | 15 | 173 | - | LCTEEN-261/S_4 66.8% |
| ICS_60 | PRJEB75153 ERR13166415 | reads | 15.6 | 13 | 736 | 42 | 527 | ICS60: 66.4% / 89.8% (n=727) | K5 74.3% |
| TSH1188 | PRJNA486011 SRR7774249 | reads | 15.2 | 11 | 714 | 42 | 507 | TSH1188: 97.6% / 97.3% (n=699) | TSH1188 97.6% |
| ICS_1 | PRJEB75153 ERR13166408 | reads | 17.2 | 15 | 755 | 43 | 540 | ICS1_1: 28.3% / 31.0% (n=749); ICS1_2: 28.3% / 30.9% (n=745); vs phased assembly: 28.8% (n=746) | ICS10 96.8% |
| SCA6** | PRJNA486011 SRR7774196 | reads | 9.7 | 6 | 360 | 23 | 254 | SCA6: 16.6% / 6.5% (n=343) | UF667 95.9% |
| CCN_51 | PRJEB75153 ERR13166351 | reads | 16.1 | 14 | 740 | 41 | 525 | CCN51_1: 97.1% / 96.7% (n=734); vs phased assembly: 99.7% (n=731) | CCN51_1 97.1% |
| B97-61/B2 | PRJEB14326 GCF_000208745.1 | collapsed | - | - | 781 | 43 | 557 | B97-61_B-2-C10-2: 94.1% / 97.2% (n=625) | BELIZE9761_B-1 97.5% |
| Matina 1-6 | PRJNA51633 GCF_000403535.1 | collapsed | - | - | 789 | 44 | 561 | Mat1-6: 96.5% / 98.1% (n=712); MATINA1_7: 48.3% / 80.0% (n=745) | Mat1-6 96.5% |
| CCN51 hap1+hap2 | PRJNA1364078 GCA_053813895.1+GCA_053813885.1 | pair | - | - | 781 | 43 | 558 | CCN51_1: 97.3% / 96.7% (n=775) | CCN51_1 97.3% |
| ICS1 hap1+hap2 | PRJNA1136499 GCA_050656495.1+GCA_050656505.1 | pair | - | - | 786 | 44 | 561 | ICS1_1: 96.7% / 96.0% (n=781); ICS1_2: 96.7% / 96.1% (n=777) | ICS1_1 96.7% |
| USDA_IMC_67 | PRJNA982528 GCA_036851125.1 | collapsed | - | - | 786 | 44 | 559 | IMC67: 66.2% / 82.4% (n=751) | Pound10_B 76.5% |
| USDA_POUND_7 | PRJNA982528 GCA_036851155.1 | collapsed | - | - | 786 | 43 | 559 | Pound7_A: 81.5% / 97.8% (n=775) | NA773 87.4% |
| USDA_SCA_6 | PRJNA982528 GCA_036851095.1 | collapsed | - | - | 788 | 44 | 560 | SCA6: 74.6% / 98.3% (n=763) | SCA6 74.6% |
| Sca6 (Penn State) | PRJNA558793 GCA_035896635.1 | collapsed | - | - | 778 | 44 | 554 | SCA6: 75.6% / 97.7% (n=753) | SCA6 75.6% |
| clone26 maternal+paternal | PRJNA1083235 GCA_041222385.1+GCA_041222375.1 | pair | - | - | 780 | 43 | 554 | - | NA70 58.2% |

`genotypes.tsv` holds 16 entries (11,334 called genotypes): every read set and phased pair above except the three
identity mismatches (`ICS_1`, `ICS_60`, `SCA6**`); collapsed assemblies are validation-only.

### 3.1 PBC 123: the cross-source check

| | Cornejo 2018 `PBC123` (SRR7774164) | Nestle 2024 `PBC_123` (ERR13166480) |
|---|---|---|
| Material / platform | Mars-USDA gDNA "Indonesia", HiSeq 2500, 117 bp/spot | NovaSeq 6000, 2x145 bp |
| Bases / est. coverage | 6.01 Gb / 14.0x | 6.61 Gb / 15.4x |
| SNPs called (of 834) / panel 48 / model 589 | 739 / 41 / 531 | 741 / 44 / 534 |

**681 of 687 shared calls agree (99.1%).** The 6 discordant SNPs (TcSNP414, 520, 736, 1035, 1341, 1390) are all
het-vs-hom calls at 8-19 reads, i.e. binomial sampling, not identity. Unrelated clones agree 28-75% (PBC 123's best
Bekele match is 65%), so this is unambiguous: both public samples are the same genotype, and it is not any tree in the Trinidad genebank.

### 3.2 Coverage degradation (read subsampling, deterministic per read)

| sample | ~coverage | SNPs called /834 | panel /48 | agreement with independent truth |
|---|---|---|---|---|
| PBC123 (Cornejo) | 2.8x | 32 | 4 | 96.8% vs PBC_123 full (n=31) |
| | 4.9x | 179 | 13 | 99.4% (n=173) |
| | 7.0x | 432 | 28 | 98.5% (n=397) |
| | 10.5x | 667 | 38 | 98.7% (n=620) |
| | 14.0x (all) | 739 | 41 | 99.1% (n=687) |
| TSH 1188 (Cornejo) | 3.0x | 17 | 1 | 94.1% vs Bekele TSH1188 (n=17) |
| | 5.3x | 145 | 10 | 97.9% (n=144) |
| | 7.6x | 342 | 19 | 97.3% (n=334) |
| | 11.4x | 602 | 34 | 96.9% (n=589) |
| | 15.2x (all) | 714 | 42 | 97.6% (n=699) |
| CCN 51 (Nestle) | 3.2x | 75 | 3 | 97.3% vs Bekele CCN51_1 (n=74) |
| | 5.6x | 287 | 19 | 98.6% (n=284) |
| | 8.1x | 490 | 30 | 97.3% (n=486) |
| | 16.1x (all) | 740 | 41 | 97.1% vs Bekele; **99.7% vs phased assembly (n=731)** |
| MCC 01 / M01 (Cornejo) | 5.3x | 340 | 22 | (no independent truth) |
| | 9.2x | 646 | 38 | |
| | 13.2x | 748 | 40 | |
| | 26.3x (all) | 787 | 43 | |

Accuracy holds at every depth because the caller abstains rather than guesses; what degrades is the call rate.
Rule of thumb from 16 read sets: **>= 15x for ~700+ calls and 39-44/48 panel SNPs; 10x gives ~500-670; below 5x
is not useful.** Calls at > 20x plateau around 750-790 (the rest are masked, multi-copy or never in the genome as an
exact flank because the flanks come from ESTs).
Four panel SNPs are never callable from genomes (0 of 16 entries): TcSNP456 and TcSNP1273 (multi-copy, hundreds
of reads) and TcSNP737 and TcSNP1413 (paralogous in >= 2 assemblies); TcSNP1329 is missing in 5 of 16. A registry
entry from WGS therefore covers at most 44 of the 48 panel SNPs; the identity engine must accept that (it already accepts
>= 38, G-25).

## 4. Throughput and time (this laptop, 2026-10-23)

| route | measured |
|---|---|
| ENA FASTQ (`ftp.sra.ebi.ac.uk` over https) | 0.25 MB/s per connection; 1.28 MB/s with 8 parallel ranges (15 s test). A 4 GB sample = ~52 min download. **Not used**; no ENA route in the scripts (any FASTQ stream can be piped into `kmerfp.py scan -`). |
| AWS S3 SRA objects (`sra-pub-run-odp`, no auth, no egress fee) | **9.7 MB/s peak, 7.2 MB/s sustained with 8 ranges** (PBC123: 2.66 GB in 370 s). With 3 parallel queues at 3/3/2 connections: 2.0-3.6 MB/s per queue at first, 1.0-1.9 MB/s per queue in the evening. |
| NCBI FTP assemblies | 1.7 MB/s single, 0.4-1.9 MB/s per file while sharing the link; 97-112 MB per assembly, 1.3-4.5 min. |
| Zenodo | 1.29 MB/s (137.6 MB). |
| Scan, assembly | 15-47 s per ~400 Mb assembly (one CPU, ~2.3 GB RAM). |
| Scan, reads (`fastq-dump --fasta 0` piped into the scanner) | Cornejo (aligned cSRA from BAM): 466-1,255 s for 3.9-11.3 Gb. Nestle (normalized SRA): 275-377 s for 6.5-7.4 Gb. `fastq-dump` uses ~1 CPU and is the bottleneck; the Python scanner idles at ~5% CPU. |
| Disk | One SRA object at a time per queue (1.6-4.8 GB), deleted after the scan; no FASTQ ever written. Hits per sample: <= 1.6 MB. |

Total wall time for 16 read sets + 12 assemblies: ~4.3 h (17:55-22:13), three queues in parallel, including two restarts when the
k-mer table changed (the PBC 123 samples were re-scanned with the final table; M01 and BR25 were not, see notes in
`provenance.json`). Catongo (10.3 GB SRA object / 14 GB FASTQ) was skipped as impractical here.

## 5. What the registry gains

| reference | role | status |
|---|---|---|
| PBC 123 (Sulawesi 1) | Indonesian released clone | **two independent sources, 99.1% agreement** |
| MCC 01 (Mars "M01") | Indonesian released clone | one source (26x, 787 calls). M01 = MCC 01 is a name match from ACIAR HORT/2010/011 p.72, not DNA-confirmed |
| BR 25 (Sulawesi 2) | Indonesian released clone | one source (21.7x, 776 calls) |
| M04, M06 | Mars Sulawesi farmer selections | one source each (749, 773 calls) |
| Clone 26 (Tobias 2024 phased assembly) | Indonesian clone | 780 calls; name-to-release mapping unverified |
| MCC 02 ("45") | Indonesian released clone | **no public genome** (only TRD_45, unrelated) |
| M02, M05, M07 | farmer selections | available in Cornejo (3.5-11.9 GB FASTQ), not run |
| SIC 806, SIAL 70 | Amelonado group | SIC 806 = CATONGO_1 and SIC864 at 97.6%; SIAL 70 92-94% to Mat1-6 / CATONGO_1 / SIC864 |
| Cornejo `criollo` | Criollo group | = Bekele BELIZE9761_B-1 at 96.9% (9x, 537 calls) |
| CRIOLLO 21 (Nestle) | not a group reference | admixed (15% het, 52-54% vs Belize Criollo) |
| CUR3_G35_A1 | Curaray group | **partial**: median depth 4, 232 calls |
| Purus, Nacional | groups | **not done**: Cornejo 2018 has candidates but its Table S1 has no per-sample group labels (only figures) |

Side finding that is cheaper than WGS: the Bekele data already contain named **Criollo** (B97-61/B2, BELIZE97-*)
and **Amelonado** (CATONGO_1, Mat1-6, SIC864) trees; the registry only lacks the group labels. WGS confirms the
labels (Criollo genome = BELIZE trees at 97.5%; SIC 806 = CATONGO_1). Labelling them closes most of G-15 today.

Identity findings in public data (all excluded from `genotypes.tsv`):
- Cornejo `SCA6**` = UF 667 (95.9%), not SCA 6 (17%). The authors' own footnote calls it an admixed off-type, so
  this is a blind confirmation that the identity test works on WGS.
- Nestle `ICS_1` = Bekele ICS 10 (96.8%), not ICS 1 (28%; the ICS 1 phased assembly agrees with Bekele ICS 1 at
  96.7%, so the Nestle sample is the odd one).
- Nestle `ICS_60` matches Bekele ICS60 at 66% and nothing else above 74%: one of the two is off-type.
- USDA `IMC 67` assembly vs Bekele IMC67: 82% on homozygous sites where SCA 6 / Pound 7 / Matina assemblies score
  97-98%; best match 77%. Either the USDA tree or the Trinidad tree is not IMC 67.
- Bekele `MATINA1_7` is not Matina 1-6 (48%), as expected for a different clone; Bekele `Mat1-6` is (96.5%).

## 6. Blockers and limits

- **One source per Indonesian clone** except PBC 123. The sample names (`M01`, `BR25`) are submitter labels; Cornejo
  lists the gDNA as "Indonesia (gDNA USDA)" without a garden or tree ID. A wrong label upstream becomes a wrong
  reference here, exactly as `SCA6**` and `ICS_1` show. Treat these as provisional.
- Four of the 48 panel SNPs cannot be called from genomes (multi-copy / paralogous flanks from ESTs), so WGS
  references cover at most 44/48.
- Collapsed single assemblies are not diploid references (heterozygous sites read as homozygous).
- Laptop bandwidth varies 3x over a day; `fastq-dump` is single-threaded. The full Cornejo + Nestle set (~520 runs)
  is not a laptop job.
- Licences: Cornejo (SRA) and Nestle (ENA) reads are public INSDC data; Allegre 2012 flanks are CC BY-NC (journal).
  Check before redistributing the flank table commercially.

## 7. What production needs

1. **Run next to the data**: a small VM in AWS us-east-1 (the SRA ODP bucket region) pulls an SRA object in
   seconds and can run `fasterq-dump` with threads; at ~5-10 min per sample the whole Cornejo + Nestle set
   (~520 runs) is an overnight batch for a few dollars of compute. Same scripts, `CONNS` raised.
2. **Lab confirmation**: genotype budwood of each released clone from the official source garden (Puslitkoka/ICCRI,
   BRIN, Mars Cocoa Development Centre) on the 48-SNP KASP panel, and promote a WGS reference to "verified" only if
   it matches (>= 95%). WGS references until then carry `provenance: wgs-provisional`.
3. **Second public source** for each clone where possible (only PBC 123 has two today).
4. Re-scan M01 and BR25 with the final k-mer table (fills ~20 duplicate-assay SNPs; 2 x ~30 min here).
5. Ingest: `genotypes.tsv` rows map 1:1 to registry profiles (SNP ID + 2-letter sorted call). Keep
   `provenance.json` notes visible in the UI (name-match caveat, source, coverage, cross-source concordance).

