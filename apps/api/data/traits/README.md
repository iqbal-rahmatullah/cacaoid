# Clone trait facts (F2: verdicts that state impact)

This folder holds facts about the yield, disease/pest resistance and bean quality of cocoa clones planted in Indonesia. Each fact cites its source. F2 uses them to explain what an OFF-TYPE verdict means for the farmer, for example "paid for Sulawesi 1, received M06: yield 31–39% lower in the same 2011 trial".

| File | Content |
|---|---|
| `clone_traits.csv` | 526 rows, one fact per row |
| `sources.csv` | 7 sources: citation, URL, licence |

## Columns (`clone_traits.csv`)

| Column | Meaning |
|---|---|
| `clone_as_written` | The name exactly as the source prints it (`M.01`, `PB123`, `KW 162 (male parent…)`) |
| `canonical_clone` | Our join key (`Sulawesi 1`, `MCC 01`, `M06`…). Hybrid progenies get descriptive keys (`KEE2 x PBC123 (hybrid family)`). `ALL` = a general rule |
| `aliases` | `;`-separated synonyms for the canonical clone |
| `trait` | See vocabulary below |
| `value` | Number (decimal point), range `lo-hi`, or a class text copied from the source |
| `unit`, `scale_note` | What the number means and the scale direction |
| `site`, `province`, `year`, `n_trees`, `se` | Left empty when the source doesn't give them. They are never filled in by inference |
| `source_id` | Key into `sources.csv` |
| `location_in_source` | Table/figure and printed page |
| `notes` | Trial design, caveats, and the flags `CONFLICT`, `SUSPECTED ERROR` and `INCONSISTENT` |

## Trait vocabulary

| Trait | Notes |
|---|---|
| `yield_kg_per_ha` | Susilo 2015: yield potential from pod counts at an assumed 1,100 trees/ha. ICCRI leaflet: released potential |
| `yield_kg_per_1000_trees` | SMAR Table 3: measured dry beans in 2011, with SEM |
| `pods_per_tree` | HORT Table 7.3.2: pods in a 3-month peak harvest on young trees |
| `vsd_score` | **Scales differ by source**: 1–6, 0–6, 0–40 cumulative, or not stated. Read `scale_note` before comparing |
| `vsd_class` | The source's words (`Resistant`, `Tahan`, `VSDs`…) |
| `vsd_incidence_pct` | % of trees with VSD |
| `vsd_in_vitro_r_index` | Malaysian callus test. Relative to that batch's NA33 check only |
| `vsd_score_distribution` | Hybrid progeny: trees per damage class 1–6, with `n_trees` |
| `vsd_rule` | General finding, not tied to one clone (rootstock vs scion) |
| `cpb_score` | Severity on a 0–3 scale |
| `cpb_damage_pct` | Means different things per source: % unextractable beans (SMAR), % yield loss (Susilo), % sticky beans (Rubiyo) |
| `cpb_class` | The source's class |
| `black_pod_pct` | Field % pods infected (Susilo) or % intensity after inoculation (Rubiyo) |
| `black_pod_class` | The source's class |
| `bean_count_per_100g`, `bean_weight_g`, `fat_pct`, `shell_pct` | Bean quality |

`vsd_incidence_pct`, `vsd_in_vitro_r_index`, `vsd_score_distribution`, `vsd_rule`, `cpb_damage_pct`, `cpb_class` and `black_pod_class` are additions to the brief's list. Without them, different measurements would have had to share one trait name.

## Synonyms used (stated in the sources, not inferred)

- **Sulawesi 1 = PBC123 = KW 162.** Source: SMAR/2005/074 pp.12, 40, 48.
- **Sulawesi 2 = BR25.** Source: SMAR p.12; HORT p.57.
- **Sulawesi 3 = ARDACIAR 10 = Aryadi 2 = KW 570.** Source: SMAR pp.12, 37.
- **MCC 01 = M01 and MCC 02 = clone "45".** Source: HORT pp.32, 73; Susilo 2015 p.153.
- **ICCRI 04 = KW 48.** Source: SMAR p.38.

Inferred links are only mentioned in `notes`, and their canonical keys are kept separate:

- `NR` may be Nasir Rauf.
- `Husbitori` may be Hasbi Tori.
- `M 11` / `M 16` / `KB 2` in HORT Appendix 8 look like typos. They were not recorded.

## How it was built

- **Transcription:** values were typed in by hand from `pdftotext -layout` extractions. The build script is in the session scratchpad: `f2_build/build_traits.py`.
- **Check:** `check_values.py` confirms that every numeric value and SE appears verbatim in its source text. There were 0 misses. The only exceptions are the ICCRI leaflet yields, which were converted from Indonesian notation (`2.060` ton/ha → 2060 kg/ha, `3,67` → 3670). Each converted row records the printed form in `notes`.
- **Not mined:**
  - **Asman 2021:** we could only read the abstract (full text returned HTTP 403).
  - **CFC Annex 1:** has no fat % for any Indonesia-relevant clone.
  - **Farid et al. 2021 (SABRAO):** a crossing-compatibility study, not agronomy.

## Usage rules

See `tasks/feasibility/F2_impact_data.md`. In short:

- Compare two clones only within the same `source_id` + `location_in_source` + `site`.
- Otherwise show each source's value side by side, with ranges and citations.
- Never mix VSD scales.
