# F2 feasibility: data for verdicts that state impact

**Bottom line: feasible for the clones that matter most, but every number needs its trial context.**

- **What we built:** `data/traits/clone_traits.csv` holds 526 facts from 7 sources, covering 90 canonical names (clones, hybrid families, rules).
- **Well covered:** Sulawesi 1 (PBC123), MCC 01 (M01), MCC 02 (45) and Sulawesi 2 (BR25) have facts for yield, VSD, CPB, black pod and bean quality.
- **Comparable within a trial:** M04, M05 and M06 can be compared with Sulawesi 1 and MCC 01 in the SMAR 2011 trial (yield, CPB) and the HORT trials (VSD, pods).
- **Thin or missing:** KEE 2, ICS 60, CCN 51, RCC 70/71/72, TSH 858 and TSH 1188 have little or nothing.
- **Main risk: conflicts between sources.** The sharpest one is MCC 01's VSD rating: three independent field sources say susceptible, while the official leaflet and the release paper say resistant.

## 1. Rows by source

| source_id | Rows | What it gives |
|---|---|---|
| ACIAR_SMAR_2005_074 | 218 | Yield in 2011 with SEM (Tab 3), beans (Tab 4), CPB 0–3 with SE (Tab 5), CPB % for 25 clones (Tab 6), VSD 1–6 for 23 genotypes (Tab 7), hybrid VSD (Tabs 8–9) |
| ACIAR_HORT_2010_011 | 113 | VSD incidence for 12 clones at Anreapi (Tab 7.2.1), VSD × altitude (7.2.4, 7.2.5), pods/tree for 12 clones × 3 sites (7.3.2), young-tree VSD (App. 8) |
| RUBIYO_2020_BIODIV | 96 | Kolaka, 12 clones: beans, fat, shell, CPB % sticky beans, black pod inoculation |
| ICCRI_KLON_UNGGUL_LINDAK | 59 | Official potential yield, beans, fat and resistance classes for 9 released clones |
| SUSILO_2015_PP31_3 | 26 | North Luwu: MCC 01 / MCC 02 / Sulawesi 01 yield potential, VSD 0–6, CPB loss, PPR, beans |
| CFC_ICCO_IPGRI_2006_MCB | 9 | Malaysia: VSD in vitro index and field score for PBC123, BR25 and KKM22 |
| ASMAN_2021_AOAS | 5 | Rootstock vs scion VSD rule (abstract only) |

## 2. Coverage matrix

The table counts facts per clone and trait group. Source codes: S = SMAR, H = HORT, Su = Susilo 2015, I = ICCRI leaflet, C = CFC, A = Asman 2021, R = Rubiyo 2020.

The PBC123 facts sit under Sulawesi 1 and the BR25 facts under Sulawesi 2. M01 is MCC 01, and clone 45 is MCC 02.

| Clone | Yield | Pods/tree | VSD | CPB | Black pod | Bean/fat/shell |
|---|---|---|---|---|---|---|
| MCC 01 (M01) | 4 (I,S,Su) | 3 (H) | 9 (A,H,I,S,Su) | 6 (I,R,S,Su) | 4 (I,R,Su) | 22 (I,R,S,Su) |
| MCC 02 (45) | 2 (I,Su) | 3 (H) | 8 (H,I,Su) | 3 (I,Su) | 2 (I,Su) | 6 (I,Su) |
| Sulawesi 1 (PBC123) | 4 (I,S,Su) | 2 (H) | 18 (A,C,H,I,S,Su) | 6 (R,S,Su) | 4 (I,R,Su) | 18 (I,R,S,Su) |
| Sulawesi 2 (BR25) | 1 (I) | — | 11 (C,H,I) | 5 (R,S) | 3 (I,R) | 7 (I,R) |
| Sulawesi 3 (ARDACIAR10) | 1 (I) | — | 4 (I,S) | 3 (I,S) | 1 (I) | 3 (I) |
| ICCRI 03 | 1 (I) | — | 1 (I) | 5 (I,R,S) | 3 (I,R) | 7 (I,R) |
| ICCRI 04 | 1 (I) | — | 1 (I) | 6 (I,R,S) | 3 (I,R) | 7 (I,R) |
| ICCRI 07 | 1 (I) | — | 3 (I,S) | 1 (I) | — | 3 (I) |
| M04 | 1 (S) | — | 3 (H,S) | 3 (R,S) | 2 (R) | 8 (R,S) |
| M05 | 1 (S) | — | 4 (A,H,S) | — | 1 (H) | 8 (S) |
| M06 | 2 (S) | 3 (H) | 5 (H) | 1 (S) | 1 (H) | — |
| KKM 22 | — | — | 3 (C) | 4 (R,S) | 2 (R) | 4 (R) |
| TSH 858 | — | 2 (H) | 6 (H,S) | — | — | — |
| KEE 2 | — | — | 2 (S, progeny means only) | — | — | — |
| RCC 70 | 1 (I) | — | 1 (I) | 1 (I) | 1 (I) | 2 (I) |
| RCC 71 | — | — | — | — | — | — |
| RCC 72 | — | — | — | 1 (S, text) | — | — |
| ICS 60 | — | — | 2 (S) | — | — | — |
| TSH 1188 | — | — | — | — | — | — |
| CCN 51 | — | — | 2 (S) | — | — | — |

Hybrid families also have VSD rows: TSH858 × PBC123 (7 individual selections, scores 1.67–5.25), KEE2 × PBC123, KEE2 × TSH858, BR25 × ARDACIAR10, ARDACIAR10 × KKM22 and others.

## 3. What is comparable

A head-to-head % difference is only valid inside one of the blocks below: same source, same table, same site.

| Block | Clones in our list | Traits | Notes |
|---|---|---|---|
| SMAR Tab 3, Pinrang 2011 | Sul 1, MCC 01, M04, M06 | yield/1000 trees ± SEM | SEM ≈ 15–20% of mean; no significance test given |
| SMAR Tab 3, N. Kolaka 2011 | Sul 1, MCC 01, M05, M06 | same | Ranks differ from Pinrang |
| SMAR Tab 4, per site | Sul 1, MCC 01, M04, M05 | bean count/weight, fat, shell | Polman shell % is inflated at every clone |
| SMAR Tab 5, Pinrang | Sul 1, M04, M06, ICCRI 04 | CPB 0–3 ± SE | Pinrang scores are diluted by heavy pod load |
| SMAR Tab 6, Central Sulawesi | Sul 1, Sul 2, Sul 3, ICCRI 03/04, KKM 22 | % unextractable beans, class | 25 clones |
| SMAR Tab 7, Kaliwining | Sul 1, Sul 3, ICCRI 07, ICS 60, CCN 51, hybrids | VSD 1–6 + Duncan letters | The best VSD head-to-head we have |
| HORT Tab 7.2.1, Anreapi | Sul 1, Sul 2, MCC 01, M05 | VSD incidence + significance letters | Sul 1 37.1a vs MCC 01 74.8bcd vs Sul 2 76.5cd |
| HORT Tab 7.3.2 / App. 8 | Sul 1, MCC 01, MCC 02, M06, TSH 858 | pods; young-tree VSD | Trees 1–2.5 yr old, unreplicated; the source says ranks are not consistent between sites |
| Susilo 2015, North Luwu | MCC 01, MCC 02, Sul 1 | yield potential, VSD, CPB, PPR, beans | Yield differences **not significant** |
| Rubiyo 2020, Kolaka | Sul 1, Sul 2, MCC 01, M04, ICCRI 03/04, KKM 22 | beans, fat, CPB, black pod | No yield/ha, no VSD |

**Not comparable across blocks.** These pairs should never be turned into a % difference:

- ICCRI leaflet potentials (release dossiers from different dates).
- Measured kg/1000 trees (SMAR) vs pod-count yield potential (Susilo).
- Any two VSD scales: 1–6, 0–6, 0–40, or unstated.
- Malaysian data vs Indonesian data.

## 4. Known conflicts (flagged in `notes`)

1. **MCC 01 VSD.**
   - Susceptible: SMAR tags M01 "VSDs"; HORT Tab 7.2.1 gives 74.8% incidence (vs Sul 1 37.1%); Asman 2021 says the MCC-01 scion has higher VSD.
   - Resistant: ICCRI leaflet "tahan"; Susilo 2015 score 1.12 ("resistant", but the abstract says "moderate").
2. **MCC 01 black pod.** Rubiyo: 100% intensity, "Susceptible". ICCRI leaflet: "tahan". Susilo: 1.15% field PPR.
3. **MCC 01 / MCC 02 bean weight.** Susilo Table 5 gives 1.61 / 1.75 g. The same paper's conclusion and the ICCRI leaflet give 1.75 / 1.60–1.61 g, i.e. swapped. Susilo yield is 3,682 in the abstract vs 3,672.1 in Table 3.
4. **Sulawesi 2 (BR25) VSD.**
   - Malaysia (CFC): field score 0.00; in vitro index above the check.
   - Sulawesi: more VSD than PBC123 (HORT 76.5% vs 37.1%; SMAR Fig 13).
   - ICCRI leaflet: "Moderat".
5. **Sulawesi 3 and ICCRI 07 VSD.** SMAR Table 7 says "Resistant". The SMAR Fig 16 caption and the ICCRI leaflet say moderate.
6. **Sulawesi 1 CPB.** SMAR Tab 6: "S" (72.97% unextractable). Rubiyo: "moderate". Susilo: 9.29% loss, in the resistant band. These use different metrics.
7. **ICCRI leaflet copy errors.**
   - ICCRI 03 and Sulawesi 02 print identical bean weight/shell/fat (1.27 / 11.04 / 55.07); ICCRI 04 is near-identical.
   - RCC 70 carries ICCRI 03's SK number (530/Kpts/SR.120/9/2006).
   - The year is not printed.
8. **Rubiyo internal errors.**
   - KKM 22 fat is 32.90 in the table but 53.29 in the text.
   - Sulawesi 2 bean weight is 0.52 g, while the same paper's Table 3 gives 95.86 g per 100 beans.
   - ICCRI 03/04 and M04 have 70–75% black pod intensity but are labelled "Rather resistant"; the paper's own scale calls that "rather susceptible".
9. **TSH 858.** SMAR calls it "susceptible to VSD", yet it has the lowest young-tree VSD score at Campalagian (1.3). The Appendix 8 scale is not stated.

## 5. The brief's example, checked against the data

"Paid for Sulawesi 1, received M06":

- **Yield: supported.** Same trial (SMAR Tab 3, 2011): M06 yielded 957.5 vs 1387.5 kg/1000 trees at Pinrang (−31%) and 510.0 vs 837.5 at N. Kolaka (−39%). Show it as "−31 to −39% (ACIAR SMAR/2005/074, 2 sites, 2011)".
- **"VSD resistance lower": NOT supported for M06.**
  - No source measures M06 and Sulawesi 1 for VSD in the same mature trial.
  - Young-tree scores are equal: 2.5 vs 2.6 at Campalagian, 2.8 vs 3.0 at Wotu.
  - HORT reports M06 as "moderately resistant to VSD … on farms".
  - The verdict must say "no comparable VSD data".
- **Cases that are supported:**
  - Sulawesi 1 → MCC 01/M01: VSD incidence 37.1% vs 74.8%, significantly different (HORT Tab 7.2.1). Yield changes −25% at Pinrang but +36% at N. Kolaka, so state the range, not a direction.
  - Sulawesi 1 → Sulawesi 2: VSD incidence 37.1% vs 76.5% (HORT Tab 7.2.1).

## 6. Rootstock takeover and hybrid-lot contamination

- **Rootstock takeover (Asman 2021, abstract).** The scion genotype determines VSD resistance; the rootstock has little effect. So when a rootstock overgrows the scion, the tree loses the clone's VSD phenotype entirely and takes on that of an unselected seedling. Statement: "VSD resistance of the paid-for clone is lost; the tree now behaves like an untested seedling." No number is attached.
- **Hybrid-lot contamination.** Progeny of the same cross spread across all damage classes:
  - KEE2 × PBC123: 21.5% of 88 trees in classes 4–6.
  - BR25 × ARDACIAR10: 56.8% of 125 trees.
  - ARDACIAR10 × KKM22: 65.3% of 141 trees.
  - Selections from TSH858 × PBC123 scored anywhere from 1.67 to 5.25.

  These class sums are row arithmetic for the verdict; the CSV stores only the raw counts. Statement: "hybrid seedlings do not inherit the clone's resistance uniformly; in [cross] X% of trees fell in the high-damage classes (Kaliwining, ACIAR SMAR/2005/074 Tab 9)."

## 7. Recommended rules for verdicts

1. **% difference only within a block.** Compute a % difference only when both clones share `source_id` + `location_in_source` + `site`. List every block that has both clones, as a range with citations.
2. **No block in common.** Show each clone's facts side by side with source and year, and compute nothing. If a trait has no facts, say so ("no comparable data"); never fall back to the other clone's class.
3. **Never mix scales.** Compare `vsd_score` only when `scale_note` matches. Prefer `vsd_incidence_pct` or classes with significance letters.
4. **Conflicts.** When a clone/trait row's notes contain `CONFLICT` or `SUSPECTED ERROR`, show both sides ("sources disagree") instead of picking one. Measured field data outrank leaflet classes.
5. **Label what kind of number it is.** "Yield potential" (ICCRI leaflet, Susilo) is not "measured yield" (SMAR). Malaysian data are context only.
6. **Hybrid families and progeny means are not clones.** Use them only for hybrid-lot statements.

## 8. Gaps and next sources

- **Missing clones:** no facts at all for TSH 1188 or RCC 71. KEE 2 appears only as a hybrid parent. ICS 60 and CCN 51 have a single Kaliwining VSD score each.
- **Asman 2021 full text:** would add per-combination VSD numbers. It is behind a paywall (HTTP 403), so ask UNHAS or Mars for the PDF.
- **Indonesian candidate sources** for ICCRI 03/04 yield and the RCC series:
  - Suhendi et al. 2005, Pelita Perkebunan 21:1–11 (multi-location yield of ICCRI clones).
  - Susilo & Anita-Sari 2011, Pelita Perkebunan 27:77–87 (VSD of hybrids).
- **Data owners:** ICCRI/Puslitkoka hold per-clone release dossiers (Kepmentan SK annexes). That is the clean source, and the same dependency as G-05 in `tasks/GAPS.md`.
