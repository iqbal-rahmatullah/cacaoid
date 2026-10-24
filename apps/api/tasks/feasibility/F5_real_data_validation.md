# F5 · Validation on real data: parentage and hybrid-lot contamination on real cacao F1s

Status: **done, internal numbers (not for slides).** Engine code unchanged. Script:
`backend/scripts/benchmark_real_parentage.py`. Raw output: `data/benchmark/F5_results.json`.

## TL;DR

- Real F1 progeny with known crosses were obtained and tested. The engine works on real data. However, the simulation was
  **optimistic in three places**:
  1. **Random 48-SNP panel:** 90.6% of trees get the right cross (88.8% unambiguous). The simulation said 94–96%. Almost
     all misses are true pairs failing `PARENT_LOD ≥ 3`, not exclusions.
  2. **Close relatives:** a seedling whose pollen parent is *not* in the garden still gets assigned 6–12% of the time on
     random panels (48 → 192 SNPs). The cause is a close relative of the absent parent that *is* in the garden
     (CHUAO-120 ↔ ICS-95). The simulation reported 0% because its outsiders were unrelated "strangers". With both parents
     absent the real rate is 0–0.1%, which matches the simulation.
  3. **LotChecker on clean lots:** it holds 17–24% of 0%-contaminated lots on 48-SNP panels. The simulated alpha (false
     exclusion of true offspring, 0–1.9%) is below the real rate (2.4–7.6%), so estimates run about 2–4 points high.
     Detection is fine: every lot with ≥10% half-sib contamination was held.
- **A panel chosen to separate the garden's parents (greedy, 48 SNPs)** fixes most of this: 97.4% correct, 0.2% wrong
  pair, ≤0.1% outsider false assignment. Adding **+2 exclusions of slack** raises it to 98.8%.

## 1. Data access outcome

Dataset: Jacquotte E., Holzwarth J.A., Mota A.Z., Leandro-Muñoz M.E. et al. (2026) *Plant Genome*, "Association mapping
and genome prediction … black and frosty pod rot in cacao". Dryad doi:10.5061/dryad.0rxwdbsg4. **License CC0.**

| Route | Result |
|---|---|
| `GET /api/v2/datasets/doi%3A10.5061%2Fdryad.0rxwdbsg4`, `/versions`, `/versions/467382/files` | 200: metadata + file list (8 files) |
| `GET /api/v2/files/{id}/download` (per file) | **401** `Unauthorized, must have current bearer token` (needs an API account, not created) |
| `GET /downloads/file_stream/{id}` (web link) | 200, but the body is an **Anubis proof-of-work bot wall**. Not bypassed, deliberately. This is probably the earlier "403". |
| `GET /api/v2/versions/467382/download` (public API, whole version) | 302 → signed zip assembly → **200, 132,033,326 bytes in 69 s**. ✅ Used. |

Content:
- `geno_012_cacao.QC.csv` (103,479 SNPs) and `geno_012_cacao.QC.prunned.csv` (24,218 LD-pruned SNPs). Both are SNPs ×
  495 trees, coded 0/1/2, **no missing values** (imputed). Marker IDs look like `chr1:9786:SG`.
- `Phenotypic.data.csv` gives each tree's `Pop` (cross), `Marker_map.csv`, R scripts, README.
- **Parents are NOT genotyped.** All 495 columns are F1s. Parent genotypes were inferred instead (§2).
- Cross design: complete bipartite 2 × 4. CATIE-R6 and ICS-95 are each crossed with CHUAO-120, EET-95, PA-51 and
  EET-399. Family sizes: R6×CHUAO-120 59, R6×EET-95 91, R6×PA-51 57, CHUAO-120×ICS-95 38, EET-399×R6 81,
  EET-399×ICS-95 51, EET-95×ICS-95 75, PA-51×ICS-95 43.
- Cached derived file: `data/benchmark/jacquotte2026_pruned.npz` (2.6 MB, pruned matrix + cross labels). If it is
  missing, the script re-downloads it via the public API route above (with `curl`, because python.org's macOS build has
  no CA bundle). It also accepts a local zip path.
- `data/ATTRIBUTION.md` was not edited (outside this task's scope). It says "all datasets CC BY 4.0", so add this CC0
  dataset there separately.

## 2. Setup

**Parent genotypes (not in the data) by maximum likelihood.** Each family was split 50/50. On the training half, every
SNP is scored against all 3⁶ = 729 parent-dosage combinations, using the joint offspring counts of all 8 families,
Mendelian transmission and 2% error. The best combination is kept when it beats the runner-up 1000:1. The bipartite
design makes each parent identifiable: each family fixes its parents' dosage pair, and shared parents link the families.
- Confident on 20,336 / 20,260 of 24,218 SNPs (fold 0 / 1). The two folds agree on **97.2%** of SNPs that are confident
  in both (n = 18,503). So the "reference" genotypes carry roughly 1–2% error. A registry clone genotyped directly would
  usually be cleaner.
- All tests run on the **held-out half**, both ways (2-fold), so every one of the 495 trees is tested once per panel. No
  tree is used to infer the parents it is tested against.
- **Real noise before anything is added:** held-out trees show 0.6% Mendelian exclusions per SNP against the inferred
  parents on random panels, and 1.0–1.6% on greedy panels. Checked on ~21.7k SNPs, the worst trees reach 3–5% (S580,
  S1206, S653, S128, S644, S1064). Every outlier still fits its labelled cross best (S951 ties with EET-95 × ICS-95).
  These are noisy samples, **not pedigree errors**.
- **Parent relatedness** (IBS distance on inferred genotypes): CHUAO-120 ↔ ICS-95 = **0.12**. All other pairs are
  0.26–0.38.

**Panels.** The pool per fold is SNPs that are confidently inferred, polymorphic among the 6 parents, and have training
MAF ≥ 0.2 (12,414 / 12,368 SNPs).
- (a) **random**: 5 independent draws per size.
- (b) **greedy**: capped coverage of expected exclusions for every (real cross × wrong pair) combination over all 15
  pairs of the 6 parents. The cap is 3·(max_allowed+1).
- Sizes: 48, 96 and 192 SNPs.

**Lab simulation on real offspring.** `simulate.noisy` is applied unchanged: 2% miscall and 5% missing on top of the real
calls. Parents are clean references. Genotypes are written as `AA` / `AB` / `BB`.

**Engine as-is.**
- `Parentage(refs = 6 parents, panel)`. `search(calls, garden)` is run with the 6 parents as the garden (15 pairs), and
  `test_pair` against each of the other 7 real crosses.
- Outsider tests:
  - "2 absent": garden = 6 parents minus both true parents.
  - "1 absent": garden = 6 minus one true parent. This is the realistic case: the mother is in the garden and the pollen
    parent is not.
- Lots: `LotChecker(par, refs, freqs).check(...)` is used as-is, with alpha/power from its own simulation.
  - Each lot has 60 seedlings drawn from one cross.
  - x% of seedlings come from **real crosses that share the seed parent** (half-sib "outside pollen"), for x =
    0/5/10/20/30%.
  - Both parents of each cross take a turn as the seed parent, giving 16 scenarios × 10 reps × 2 folds = 320 lots per
    cell.
  - Trees are drawn with replacement from the held-out half (19–45 per cross), with fresh lab noise for every draw.

**Variant: "F1freq".** `Parentage.F` (the "unrelated tree" genotype frequencies) is replaced, in the script only, by the
training-F1 frequencies. As-is, the engine takes F from the refs, which here are only 6 parents with a 0.01 floor. That
inflates LOD. F1 frequencies make the null "a random F1 of the same crosses", which deflates LOD. The deployment registry
(about 620 clones) sits between the two, so these rows **bracket** the effect of the frequency source.

**Threshold sweep.** All 15 `test_pair` results per tree are stored and `search` is replayed with other `PARENT_LOD` /
exclusion-slack values. The script asserts that the replay reproduces the engine's own `search()` at the defaults
(within 1%).

## 3. Results (internal)

### 3.1 Parentage: engine as-is (n = trees × panel draws)

| panel | SNPs | n | correct unique | correct ambiguous | wrong pair | no pair | true pair passes `test_pair` | wrong real cross passes, shares 1 parent | wrong cross, shares 0 | outsider, 2 parents absent | outsider, 1 parent absent | real excl./SNP before noise |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| random | 48 | 2475 | 88.8% | 1.8% | 2.2% | 7.2% | 92.4% | 1.1% | 0.0% | 0.1% | **12.1%** | 0.6% |
| random | 96 | 2475 | 98.0% | 0.4% | 0.4% | 1.2% | 98.8% | 0.4% | 0.0% | 0.0% | 9.4% | 0.6% |
| random | 192 | 2475 | 99.3% | 0.0% | 0.1% | 0.6% | 99.5% | 0.3% | 0.0% | 0.0% | 6.5% | 0.6% |
| greedy | 48 | 495 | 97.4% | 0.0% | 0.2% | 2.4% | 97.6% | 0.1% | 0.0% | 0.0% | 0.1% | 1.6% |
| greedy | 96 | 495 | 96.6% | 0.0% | 0.0% | 3.4% | 96.6% | 0.0% | 0.0% | 0.0% | 0.0% | 1.2% |
| greedy | 192 | 495 | 97.6% | 0.0% | 0.0% | 2.4% | 97.6% | 0.0% | 0.0% | 0.0% | 0.0% | 1.0% |

Variant F1freq (pessimistic null) on random panels, 48 / 96 / 192 SNPs:
- correct unique: 69.0% / 91.7% / 98.1%
- no pair: 28.2% / 7.5% / 1.6%
- outsider, 1 parent absent: 3.7% / 3.7% / 2.7%

Greedy panels give the same numbers in both variants.

### 3.2 Per cross, engine defaults (correct / no pair / wrong pair, with the most frequent wrong pair)

| cross | random 48 | greedy 48 | random 192 |
|---|---|---|---|
| CATIE-R6 × CHUAO-120 | 87.5 / 10.5 / 2.0 (→ R6 × ICS-95) | 93.2 / 6.8 / 0 | 100 / 0 / 0 |
| CATIE-R6 × EET-95 | 93.2 / 6.8 / 0 | 98.9 / 1.1 / 0 | 100 / 0 / 0 |
| CATIE-R6 × PA-51 | 95.4 / 3.5 / 1.1 | 96.5 / 3.5 / 0 | 99.6 / 0.4 / 0 |
| CHUAO-120 × ICS-95 | 98.4 / 0 / 1.6 | 94.7 / 2.6 / 2.6 (→ EET-95 × ICS-95) | 96.8 / 2.6 / 0.5 |
| EET-399 × CATIE-R6 | 96.8 / 3.0 / 0.2 | 98.8 / 1.2 / 0 | 100 / 0 / 0 |
| EET-399 × ICS-95 | 87.1 / 5.5 / 7.5 (→ CHUAO-120 × EET-399) | 98.0 / 2.0 / 0 | 98.8 / 0.8 / 0.4 |
| EET-95 × ICS-95 | 78.9 / 17.1 / 4.0 (→ CHUAO-120 × EET-95) | 97.3 / 2.7 / 0 | 98.1 / 1.6 / 0.3 |
| PA-51 × ICS-95 | 90.2 / 6.5 / 3.3 (→ CHUAO-120 × PA-51) | 100 / 0 / 0 | 100 / 0 / 0 |

### 3.3 Why true offspring get no pair

- **Random 48:** 7.5% of true pairs fail (replay; 7.6% in the engine table). Of those, **99.5% fail only on LOD < 3** and 0.5% fail on both LOD and
  exclusions. The panel is simply too uninformative.
- **Greedy 48:** 2.4% fail, **92% on too many exclusions**. The failures are 12 trees, the same noisy samples as above
  (S245, S1206, S580, S1064, …). The greedy panel prefers SNPs where parents are opposite homozygotes. Any miscall there
  is an exclusion, and the panel also collects SNPs whose inferred reference is wrong (real pre-noise exclusions 1.6% vs
  0.6% on random panels).
- **Random 192:** 0.5% fail, mostly S1206 and S580.

### 3.4 One-parent-absent false assignments (2 random draws × 2 folds)

| panel | assigned | via the CHUAO-120 ↔ ICS-95 swap |
|---|---|---|
| random 48 | 269 / 1980 | 185 (69%) |
| random 192 | 118 / 1980 | **116 (98%)** |

The typical case: an offspring of CATIE-R6 × CHUAO-120, with CHUAO-120 absent from the garden, is assigned
"CATIE-R6 × ICS-95".

### 3.5 Threshold sweep (replayed `search`; slack = extra exclusions over `max_allowed`)

| panel | PARENT_LOD | slack | correct | wrong pair | outsider, 1 absent | outsider, 2 absent | wrong cross (shares 1) passes |
|---|---|---|---|---|---|---|---|
| random 48 | 2 | +0 | 93.7% | 2.3% | 16.8% | 0.4% | 1.6% |
| random 48 | **3** | +0 | 90.7% | 2.2% | 12.2% | 0.1% | 1.1% |
| random 48 | 4 | +0 | 85.8% | 1.9% | 8.5% | 0.1% | 0.6% |
| random 48 | 5 | +0 | 78.6% | 1.5% | 5.5% | 0.0% | 0.3% |
| random 96 | 3 | +0 / +2 | 98.4 / 98.4% | 0.4 / 0.4% | 9.5 / 10.4% | 0 / 0% | 0.4 / 0.4% |
| random 192 | 3 | +0 / +2 | 99.3 / 99.4% | 0.1 / 0.2% | 6.5 / 8.1% | 0 / 0% | 0.3 / 0.3% |
| greedy 48 | 2–5 | +0 | 97.4% | 0.2% | 0.1% | 0.0% | 0.1% |
| greedy 48 | 2–5 | **+2** | **98.8%** | 0.2% | 0.3% | 0.0% | 0.1% |
| greedy 96 | 2–5 | +0 / **+2** | 96.6 / **99.0%** | 0 / 0% | 0 / 0% | 0 / 0% | 0 / 0% |

On random 48, slack +2 changes nothing because LOD is the binding constraint. On greedy panels, LOD 2–5 gives identical
results.

### 3.6 Lot contamination: LotChecker as-is (60 seedlings, half-sib contaminants, 320 lots per row)

| panel | true % | mean estimate | RMSE (pts) | CI covers truth | TAHAN | alpha (sim) | power (sim) |
|---|---|---|---|---|---|---|---|
| random 48 | 0 | 3.9 | 7.3 | 58.8% | **24.1%** | 0.019 | 0.94 |
| random 48 | 5 | 8.6 | 6.7 | 84.7% | 76.9% | | |
| random 48 | 10 / 20 / 30 | 13.7 / 24.0 / 34.3 | ~7 | 87–94% | 100% | | |
| random 96 | 0 | 1.6 | 3.8 | 74.4% | 11.9% | 0.001 | 0.97 |
| random 96 | 5 / 10 / 20 / 30 | 6.6 / 11.7 / 22.1 / 32.2 | 3.5–4.2 | 90–98% | 53.8 / 100 / 100 / 100% | | |
| random 192 | 0 | 0.5 | 1.5 | 86.6% | 1.6% | 0.000 | 0.96 |
| random 192 | 5 / 10 / 20 / 30 | 5.9 / 11.0 / 21.3 / 31.6 | 2.1–3.6 | 96–100% | 37.8 / 100 / 100 / 100% | | |
| greedy 48 | 0 | 2.6 | 4.2 | 47.2% | **16.9%** | 0.000 | 1.00 |
| greedy 48 | 5 / 10 / 20 / 30 | 7.3 / 12.2 / 21.9 / 31.7 | 3.0–3.8 | 84–100% | 49.7 / 100 / 100 / 100% | | |

Greedy 96 and 192 match greedy 48: mean estimates within 0.3 pts, TAHAN at 5% is 52.5% / 55.6%.

Real false exclusion of true offspring (1 − "true pair passes" in 3.1) is 7.6% / 2.4% / 0.5% for random 48 / greedy 48 /
random 192, against the simulated alpha of 0.019 / 0.000 / 0.000. That gap is the bias. Power is not a problem: real
half-sib contaminants are caught, and estimates at 30% are not biased low.

Alternative decision rules replayed on the same lots (TAHAN rate):

| panel | rule | 0% | 5% | 10% | 20% |
|---|---|---|---|---|---|
| random 48 | as-is | 24.1% | 76.9% | 100% | 100% |
| random 48 | alpha floor 0.05 | 12.8% | 35.0% | 99.7% | 100% |
| random 48 | hold only if corrected CI low > 5% | 8.4% | 15.3% | 60.9% | 99.7% |
| greedy 48 | as-is | 16.9% | 49.7% | 100% | 100% |
| greedy 48 | alpha floor 0.03 | 9.4% | 32.8% | 100% | 100% |
| greedy 48 | alpha floor 0.05 | 5.9% | 23.1% | 100% | 100% |
| greedy 48 | hold only if CI low > 5% | 3.1% | 15.9% | 51.9% | 100% |
| random 96 | alpha floor 0.03 | 7.8% | 18.4% | 100% | 100% |
| random 192 | as-is | 1.6% | 37.8% | 100% | 100% |
| random 192 | alpha floor 0.03 | 0.3% | 9.7% | 100% | 100% |

## 4. Comparison with the simulation-based expectations (GAPS G-10, G-11)

| claim (simulation) | real F1s | verdict |
|---|---|---|
| Garden pair found 94–96% (48-SNP identity panel, 6-clone garden) | 90.6% on random 48 (88.8% unique), 98.4% at 96, 99.3% at 192, 97.4% on greedy 48 | **Lower at 48 random SNPs**. The 96-SNP and garden-aware panels meet or beat the simulation. |
| Outsider seedling falsely assigned 0% | 0–0.1% when both parents are absent ✅. **6.5–12.1%** when only the pollen parent is absent on random panels (0–0.1% greedy) | Matches for unrelated outsiders. **The simulation never tested relatives of garden clones.** |
| Rootstock test: half-sibs pass 0% | Wrong real cross sharing one parent passes 1.1% (random 48), 0.3% (192), ≤0.1% (greedy). Sharing none: 0.0% | Close. Small leak from related parents. |
| Lot estimate within ±0.6 pts at 200 seedlings; power 99% | Bias about +1.6 to +4.3 pts on 48–96 SNPs, about +0.5–1.6 on random 192; power fine; clean lots held 17–24% at 48 SNPs | **Bias not seen in simulation**: the simulated alpha misses real false exclusions. The simulation never ran a 0% lot. |

## 5. Failure modes found

1. **Related parents.** CHUAO-120 and ICS-95 are close (IBS 0.12). On random panels the engine swaps them:
   - In 3.2, the wrong pairs are almost all CHUAO ↔ ICS swaps.
   - In 3.4, 98% of one-absent false assignments at 192 SNPs are this swap. More random SNPs shrink it only slowly
     (12 → 6.5%).
   - `search` only flags ambiguity among garden pairs, so it cannot warn that "an unregistered relative of ICS-95 fits
     too".
2. **LOD ≥ 3 is the binding limit on 48 uninformative SNPs.**
   - 99.5% of true-pair failures on random 48 are LOD-only.
   - LOD depends heavily on where `F` comes from: correct falls from 90.6% (F from 6 parents) to 70.3% (F from the F1
     population).
   - In deployment, F comes from the registry, so the real figure for a given garden is uncertain until it is measured
     with the registry's frequencies.
3. **Heavy-tailed sample error.**
   - About 3% of real trees show 2–5% Mendelian inconsistency (median tree: 0.7%) before any lab noise is added. The
     engine model assumes a uniform 2%.
   - On discriminating panels, these trees exceed `max_allowed` and get "no pair". This is safe (it is not a wrong
     pair), but it costs about 2.5 points of sensitivity.
   - The same trees inflate lot false-exclusion rates.
4. **Simulated alpha < real alpha in LotChecker.** This gives an upward bias and false TAHAN on clean lots. The effect
   is worst on 48-SNP panels. On random 192 it is small (1.6% false hold).
5. **The greedy panel collects error-prone SNPs** (pre-noise exclusions 1.6% vs 0.6%). Here that is partly an artifact
   of inferred references. With real KASP assays it still argues for validating each selected SNP on known trios before
   freezing a panel.

## 6. Recommendations (engine NOT changed; these are proposals)

1. **Parentage panel, not threshold.** For seed-origin and lot work, design the parentage SNPs to separate the clones
   actually used as seed-garden parents (greedy coverage like `greedy()` in the script). Do not reuse the 48 identity
   SNPs. Greedy 48 gives 97.4% correct, ≤0.2% wrong pair and ≤0.1% outsider false assignment. Random/identity 48 gives
   90.6% and 12.1%.
2. **Keep `PARENT_LOD = 3.0`.**
   - Lowering it to 2 gains +3.0 pts correct on random 48 but raises one-absent false assignment from 12.2% to 16.8%.
   - Raising it to 4 or 5 cuts that to 8.5% / 5.5% but loses 5–12 pts of correct calls.
   - On discriminating panels it does not matter (identical results at 2–5).
   - Re-check it once with registry-derived `F`, since the frequency source moves sensitivity by about 20 pts on random
     48.
3. **Exclusion tolerance for parentage: `max_allowed(n) + 2`.** One option is a separate `PARENT_EXCL_SLACK = 2`;
   another is a parentage error rate of about 0.04, which gives 7 vs 5 allowed at n = 46.
   - On greedy panels it lifts correct from 97.4% to 98.8% (48 SNPs) and from 96.6% to 99.0% (96 SNPs). Outsider false
     assignment stays ≤0.3%.
   - Apply it only with a discriminating panel. On random 192 it raises one-absent false assignment from 6.5% to 8.1%.
4. **Relative check.** When `search` returns a pair, also test the top pair with each parent swapped for its closest
   registry relatives (e.g. registry clones with lower panel distance than a set threshold, or the identity engine's
   "twins"). Report "X × Y, or Y's close relative Z" when they also pass. This targets failure mode 1.
5. **LotChecker alpha.**
   - Calibrate alpha empirically, not only by simulation: `alpha = max(simulated, empirical)`. The empirical rate comes
     from known-true offspring, such as ≥20 seedlings of a verified hand-pollinated cross run as positive controls.
   - Until that exists, floor alpha at **0.03 for ≥96-SNP panels** and **0.05 for 48-SNP panels**. On these lots that
     cut false TAHAN to 7.8% (random 96), 5.9% (greedy 48) and 12.8% (random 48) while keeping 99.7–100% detection at
     ≥10%.
   - Add a **three-way decision**: LOLOS if the estimate is ≤ 5%; TAHAN if the corrected Wilson lower bound is > 5%;
     otherwise "TAMBAH SAMPEL" (test more seedlings). The CI-low rule alone gives 3.1% false holds on greedy 48 but
     catches only 52% of 10% lots at n = 60. The middle band needs more seedlings, not a verdict.
   - Lot QC on a random 192-SNP panel needed no fix (1.6% false hold as-is).
6. **Make the simulator harsher** so future simulation numbers stop overshooting:
   - Outsiders that are relatives (sibs or half-sibs) of garden clones.
   - A per-sample error rate drawn from a heavy-tailed distribution (e.g. 5% of samples at 3–5% error).
   - Always include 0%-contamination lots.

## 7. Limits of this validation

- Parents were inferred from the other half of their offspring, not genotyped. Their 1–2% reference error inflates
  exclusions, which is probably pessimistic for "true pair passes", especially on greedy panels.
- One breeding population: 6 parents, a 6-clone garden, 8 crosses. Indonesian seed-garden clones are not included.
- The greedy panel was tuned to these exact 6 parents, so it is optimistic for a garden-agnostic national panel.
- Genotypes are imputed sequencing-type calls (LD-pruned set), not KASP. Lab noise was simulated on top.
- Lots were sampled with replacement from 19–45 held-out trees per cross, so the same tree can appear repeatedly in a
  lot.
- The "F1freq" variant is a bracket for the frequency source, not the deployment setting.

## Reproduce

```
cd backend && uv run python scripts/benchmark_real_parentage.py   # ~7 min on this Mac; fetches 132 MB once if the npz is missing
```

Seeds are fixed. Two runs gave identical numbers.
