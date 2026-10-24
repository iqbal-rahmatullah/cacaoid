# F4 feasibility: Paspor Bibit (EUDR-ready)

**Bottom line: feasible today with open data and no API key.** We read two open forest maps over HTTP for any GPS point or polygon. A plot check takes about 1.5–5 s the first time and about 5 ms on a repeat. The GeoJSON export follows the EU Information System spec. The weak point is false positives on old shaded cocoa (section 5). This is a screening tool, not a legal verdict.

- Code: `backend/src/cacaoid/engine/eudr.py` (`check_plot`, `to_eudr_geojson`). Tests: `backend/tests/test_eudr.py` (18 tests: 12 run offline, 6 need the network and are skipped when offline).
- New dependency: **rasterio 1.5.2**, added with `uv add rasterio`. Both rasters are LZW-compressed GeoTIFFs, and the Python standard library has no LZW decoder. Nothing is downloaded or kept on disk.
- Whisp (FAO) **needs an API key** (section 6), so `check_plot_whisp()` was not built.

## 1. EUDR requirements, verified Oct 2026

The "how verified" column means:
- **(me):** I opened the page myself with curl or WebFetch.
- **(agent):** a research sub-agent read the EUR-Lex text in a headless browser, because EUR-Lex blocks curl and WebFetch with a bot challenge. I did not re-open these pages myself.

| Fact | Exact wording / value | Source | How verified |
|---|---|---|---|
| Application date, large & medium operators | **30 Dec 2026**: "Articles 3 to 13, Articles 16 to 24 and Articles 26, 31 and 32 shall apply from 30 December 2026" (new Art. 38(2)) | Reg. (EU) **2025/2650** of 19 Dec 2025, OJ L 23.12.2025, in force 26.12.2025. https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202502650 | agent |
| Application date, micro & small | **30 Jun 2027** for micro/small undertakings "established as such by 31 December 2024" (Art. 38(3)). Those trading EUTR-annex timber products stay at 30 Dec 2026. | Same regulation. Also EC Access2Markets news of 28 Jan 2026: "large operators … from 30 December 2026 … 30 June 2027 in the case of natural persons and micro and small enterprises". https://trade.ec.europa.eu/access-to-markets/en/news/delay-until-december-2026-and-other-developments-implementation-eudr-regulation | me (EC news), agent (OJ) |
| Has anything changed since? | No change to the dates or the core rules. The simplification review COM(2026) 191 (4 May 2026) says "the Commission does not consider it appropriate to propose further amendments". Delegated Reg. (EU) 2026/2102 (OJ 17 Sep 2026) only edits the Annex I product codes; for cocoa, 1802 now excludes waste. Proposal COM(2026) 661 only removes French Guiana from scope. | https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:52026DC0191 · consolidated text 18.09.2026: https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02023R1115-20260918 | agent |
| Cut-off date | "produced on land that has not been subject to deforestation after 31 December, 2020" (Art. 2(13)) | consolidated text above | agent |
| Geolocation | "…using at least six decimal digits; for plots of land of **more than four hectares** used for the production of the relevant commodities other than cattle, this shall be provided using polygons…" (Art. 2(28)). A plot of exactly 4 ha may therefore be a point. | consolidated text above | agent |
| Agroforestry is not forest | "'agricultural plantation' means land with tree stands in agricultural production systems, such as … agroforestry systems where crops are grown under tree cover … agricultural plantations are excluded from the definition of 'forest'" (Art. 2(6)). Guidance C/2026/3896, Annex 4(d): land used predominantly under agroforestry "cannot be considered as 'forest'". | consolidated text; https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:C_202603896 | agent |
| JRC map status | GEE catalogue: "non-mandatory, non-exclusive and not legally binding". Guidance C/2026/3896 §5 says the Observatory "carries no legal value". | https://developers.google.com/earth-engine/datasets/catalog/JRC_GFC2020_V4 (me) · guidance (agent) | me + agent |
| Indonesia's risk class | **Standard.** It is not on the low-risk or high-risk list: "A standard level shall be maintained for all countries not listed in the Annex" (Impl. Reg. (EU) 2025/1093, Art. 1(2)). The new simplified declaration for micro/small *primary* operators applies only in low-risk countries, so Indonesian supply needs full due diligence. | https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32025R1093 | agent |
| **GeoJSON format** (EUDR IS) | Spec "EUDR GeoJSON File Description", updated 17 Aug 2026:<br>• WGS84 (EPSG:4326), order "longitude, latitude"<br>• examples use a `FeatureCollection` of `Feature`s<br>• accepted geometries: Point, MultiPoint, Polygon, MultiPolygon, GeometryCollection; "LineString" and "MultiLineString" "will not be accepted/processed"<br>• optional properties, case-sensitive: `ProducerName`, `ProducerCountry` (ISO2, required per feature in Type II files), `ProductionPlace`, `Area` (ha, for points)<br>• "Any other properties that are syntactically valid but not included in the optional properties list above, will be ignored"<br>• "The information system will truncate coordinate points to 6 decimal places"<br>• a point without `Area` defaults to "4" ha; `"Area": "3"` written as a string becomes 0<br>• no holes and no crossing lines<br>• 25 MB per DDS | https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/help/eudr-documentation/operator/geojson-description.html | me |
| Point area limits (IS validation) | "If the commodity is not cattle and the user provided a value higher than 4ha then the system will raise an error … the area must also be higher or equal to 0.0001ha." | https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/help/eudr-documentation/operator/validation-rules.html | me |

**Sources I could not open:**
- https://forest-observatory.ec.europa.eu/forest/gfc2020 returned an empty page or "An error has occurred".
- green-business-ec.europa.eu no longer resolves. The information-system page has moved to https://green-forum.ec.europa.eu/nature-and-biodiversity/deforestation-regulation-implementation/information-system-deforestation-regulation_en (agent).
- The GeoJSON spec's PDF version (Operator API Reference v1.2) was not opened. The HTML version above was.

## 2. What `eudr.py` does

**`check_plot(geometry)`** takes a GeoJSON Point, Polygon or MultiPolygon in [lon, lat]. It never raises.
- **Point:** it reads the single pixel under the point in each map.
- **Polygon:** it reads a window around the polygon and masks it with `all_touched` to get every pixel the polygon touches. This replaces the "grid of points" idea; it is exact and costs the same.
- **Returns:**
  - `forest_2020` and `forest_2020_frac` from JRC (value 1 = forest; a plot counts as forest at ≥ 10% forest)
  - `loss_after_2020` from Hansen lossyear ≥ 21, i.e. 2021–2025
  - `verdict`, with `reasons` in plain Indonesian
  - `caveats`, `sources` (citation + licence), and timing

| Verdict | Rule |
|---|---|
| TINGGI | Forest in 2020 **and** tree-cover loss after 2020 |
| PERLU CEK | Forest in 2020 with no loss: either an old agroforest mapped as forest, or new clearing that is not visible yet. Or: not forest, but loss after 2020 (replanting, shade trees felled). |
| RENDAH | Not forest in 2020, no loss after 2020 |
| TIDAK BISA DICEK | Invalid geometry (wrong type, lat/lon swapped, span > ~11 km), or the network or server is down. The reason is given. |

**`to_eudr_geojson(plots)`** returns a FeatureCollection to spec:
- The four official properties use their exact case. `ProducerCountry` defaults to "ID".
- Coordinates are rounded to 6 dp.
- Duplicate points created by that rounding are dropped, and open rings are closed.
- It raises `ValueError("plot <id>: …")` on anything the IS would reject:
  - a point plot over 4 ha
  - `Area` given as text
  - holes
  - figure-8 crossings
  - zero-area rings
  - LineString geometries
  - a country code that is not ISO2
- CacaoID fields (plot_id, clone, clone_verified, sample_id, batch_id, verdict) go in a single `CacaoID` property. The spec says it "will be ignored", so the same file serves both the EU upload and our own registry. No sidecar file is needed; dropping that one key gives a minimal file.

**Caching:** both remote files are opened once per process (`lru_cache`), and GDAL's block cache keeps the bytes it has read. Repeat or nearby checks cost about 5 ms.

## 3. Datasets that work from here

| Dataset | URL used | Format | Works? |
|---|---|---|---|
| JRC GFC2020 **V4** (2026, doi:10.2905/JRC.3KATEH8, CC BY 4.0) | `…/FOREST/GFC2020/LATEST/single-cog/JRC_GFC2020_V4_COG.tif` | One global COG, 38 GB, 1024² tiles, 10 m, overviews | Yes, via range reads. The 10° tiles in `LATEST/tiles/` (N0_E110, N0_E120, N10_E120 for Sulawesi) are stripped LZW and slower to open. |
| Hansen GFC v1.13 lossyear (2001–2025, CC BY 4.0) | `…/GFC-2025-v1.13/Hansen_GFC-2025-v1.13_lossyear_{00N_120E,00N_110E,10N_120E}.tif` | 10° tiles, 30 m, one-row LZW strips (33–80 MB each) | Yes, via range reads |
| FAO Whisp API | https://whisp.openforis.org/api | REST + Earth Engine | Needs a key (section 6) |

**Measured latency** (fresh process, slow link of ~200–400 KB/s):

| Case | Time |
|---|---|
| First check (opens both remote files) | 4.8 s |
| New location, file already open | 1.4–2.3 s |
| Repeat or nearby point | 0.005 s |
| 5 ha polygon, warm | 0.26 s |
| 484 ha polygon, warm | 0.48 s |
| Network down (DNS failure) | `TIDAK BISA DICEK` in 0.3 s |
| `test_eudr.py` (all 18 tests) | ~15 s |

## 4. Results on real Sulawesi coordinates

| Plot | lat, lon | JRC 2020 | Hansen loss > 2020 | Verdict |
|---|---|---|---|---|
| Luwu Utara (cocoa district) | -2.57, 120.33 | not forest | none | **RENDAH** |
| Lore Lindu National Park | -1.45, 120.15 | forest | none | **PERLU CEK** |
| Makassar city | -5.14, 119.42 | not forest | none | **RENDAH** |
| Morowali (found by scanning the Hansen tile for post-2020 loss) | -2.867125, 122.155625 | forest | 2023 | **TINGGI** |
| Luwu Timur (same scan) | -2.448625, 121.083625 | not forest | 2023 | **PERLU CEK** |
| ~5 ha square around the Luwu Utara point | polygon | 0% forest | none | **RENDAH** |
| 2.2 km square (484 ha) in Lore Lindu | polygon | 100% forest | 2021, on 0.1% of the area | **TINGGI** |

All the network tests assert these values. The 484 ha case shows how strict the plot-wide rule is: a few 30 m loss pixels inside 2020 forest make the whole plot TINGGI.

The Luwu Utara point is a coordinate in a cocoa district, not a surveyed cocoa plot. We have **no ground-truth cocoa plots**, so the false-positive rate is unmeasured.

## 5. False-positive risk for cocoa agroforestry

- **By law, agroforestry is not forest** (Art. 2(6)). The JRC map is designed the same way: its definition excludes "agroforestry systems" and "all plantations of relevant commodities other than wood".
  - In practice, a 10 m optical/radar classifier cannot always tell old cocoa under *Gliricidia* or coconut shade, or a cocoa–durian–forest-tree mix, from secondary forest.
  - Such plots come out as **PERLU CEK**, never RENDAH.
  - That is the right failure direction for an export check, but it costs officer time. Expect it to be common in the old Sulawesi cocoa belts on hill slopes.
- **Hansen loss is any stand-replacing loss of trees over 5 m**, so cocoa replanting (side-grafting, shade-tree thinning) counts as "loss".
  - On non-forest plots this gives PERLU CEK.
  - On plots JRC wrongly maps as forest it gives a **false TINGGI**.
- **Mitigations already in place:**
  - every verdict carries its reasons and caveats
  - PERLU CEK asks for evidence (photos, tree age, older imagery)
  - the polygon check reports what share of the plot is forest or lost
- **Not in place:**
  - pixel-on-pixel overlap of loss with forest (marked `ponytail:` in the code)
  - calibrating the 10% forest threshold

## 6. FAO Whisp

- API v2.3.1 (openforis-whisp 3.0.0a22).
- `POST /api/submit/geojson` without a key returns **HTTP 401** `{"code":"auth_missing_api_key"}`.
- The OpenAPI page says: "All `/submit/*` and `/status/*` endpoints require an `x-api-key` header. Register for free … at /register".
- Limits:
  - 500 geometries per synchronous call, 10,000 asynchronous
  - 60 s synchronous timeout
  - up to 100,000 ha per plot
- You can also pass your own Earth Engine token or project.
- **Worth adding once a free key is registered.** It combines many datasets (JRC, TMF, GFW, national layers) and gives a second opinion on PERLU CEK plots. It has not been built yet.

## 7. What production needs

1. **Ground truth:** 50–100 surveyed cocoa polygons per district, mixing old agroforest and newly opened plots. Use them to measure the PERLU CEK and TINGGI rates and to tune `FOREST_FRAC`.
2. **Legality** (Art. 3(b)) is not covered. Add Indonesian forest-estate (*kawasan hutan*) and protected-area layers. Planting inside Lore Lindu National Park would fail on legality even before deforestation.
3. **More evidence layers:** JRC Tropical Moist Forest (degradation) and Whisp, plus imagery snippets for PERLU CEK plots.
4. **Local mirror for field and offline use:**
   - Sulawesi needs JRC tiles N0_E110, N0_E120 and N10_E120 (659 MB) and Hansen 00N_110E, 00N_120E and 10N_120E (149 MB).
   - That is ~0.8 GB, less if cropped. Point `JRC_URL` and `HANSEN_URL` at local paths; no code change is needed.
5. **Edge cases:**
   - polygons crossing a 10° Hansen tile line (rare in Sulawesi: only the equator and 120°E)
   - per-dataset locks if the API is used concurrently
6. **Submission:** submitting the DDS to the EUDR IS (TRACES API) needs operator registration and is the exporter's job. We hand them a validated GeoJSON.

## 8. Link to genomics: a genotype-anchored plot registry

Each exported feature carries `CacaoID: {plot_id, sample_id, batch_id, clone, clone_verified, verdict}`. This joins three records:
- the DNA fingerprint verified at the nursery (the existing engine's identity, off-type and rootstock verdicts)
- the plot it was planted on
- that plot's deforestation screen

The result is a "Paspor Bibit":
- A DNA-verified seedling goes only to a plot that screens RENDAH, or PERLU CEK with evidence.
- The cooperative's EUDR file and its clone records share one plot ID.
- The EU system ignores the genomics fields, so they never block the upload.
- Later, an audit of an off-type tree, or a pod sample from a plot, points straight back to the seedling batch and the plot's deforestation status.
