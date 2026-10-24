"""Paspor Bibit (EUDR): is a planting plot deforestation-free against the EUDR cut-off (31 Dec 2020)?

Reads two open rasters straight from their HTTP servers (range reads, no download):
- JRC Global Forest Cover 2020 V4 (10 m, value 1 = forest), the EU's own reference map for the cut-off year.
- Hansen/UMD Global Forest Change v1.13 lossyear (30 m, value n = tree-cover loss in 2000+n, 1..25).
Then exports plots as the GeoJSON the EUDR Information System accepts.
"""
import atexit
import math
import os
import threading
import time
from functools import lru_cache
from itertools import pairwise

# GDAL reads these at open time; set before rasterio opens anything over HTTP.
os.environ.setdefault("GDAL_DISABLE_READDIR_ON_OPEN", "EMPTY_DIR")  # don't list the server directory
os.environ.setdefault("GDAL_HTTP_TIMEOUT", "20")
os.environ.setdefault("GDAL_HTTP_MAX_RETRY", "2")

import rasterio  # noqa: E402
from rasterio.features import geometry_mask  # noqa: E402
from rasterio.windows import Window  # noqa: E402

CUTOFF = "2020-12-31"
JRC_URL = "https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/FOREST/GFC2020/LATEST/single-cog/JRC_GFC2020_V4_COG.tif"
HANSEN_URL = ("https://storage.googleapis.com/earthenginepartners-hansen/GFC-2025-v1.13/"
              "Hansen_GFC-2025-v1.13_lossyear_{tile}.tif")
FOREST_FRAC = 0.10  # >=10% of the plot mapped as forest counts as "forest in 2020"; below that is mostly 10 m edge noise
SOURCES = [
    "JRC Global Forest Cover 2020 V4, European Commission Joint Research Centre (2026), CC BY 4.0, "
    "doi:10.2905/JRC.3KATEH8, https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/FOREST/GFC2020/",
    "Hansen/UMD/Google/USGS/NASA Global Forest Change 2000-2025 v1.13 (Hansen et al. 2013, Science 342:850), "
    "CC BY 4.0, https://storage.googleapis.com/earthenginepartners-hansen/GFC-2025-v1.13/download.html",
]
CAVEATS = [
    "Peta JRC 2020 tidak mengikat secara hukum dan tidak wajib dipakai untuk EUDR; ini alat bantu skrining, bukan putusan.",
    "Kebun kakao agroforestri (kakao di bawah pohon pelindung) bisa terpetakan sebagai hutan: vonis PERLU CEK "
    "di kebun lama belum tentu deforestasi, perlu bukti lapangan (foto, umur pohon, citra lama).",
    "Hansen mencatat hilangnya tutupan pohon (termasuk peremajaan kebun/tebang pohon pelindung), bukan khusus "
    "deforestasi; piksel 30 m bisa meleset di plot kecil.",
    "Koordinat GPS ponsel bisa meleset 5-15 m; plot kecil di tepi hutan sebaiknya dicek dengan poligon.",
]
_LOCK = threading.Lock()  # ponytail: one lock for all reads (rasterio handles aren't thread-safe); per-URL locks if it bottlenecks


@lru_cache(maxsize=16)
def _open(url: str):
    # kept open for the process: GDAL's block cache then makes repeat checks in the same area ~instant
    return rasterio.open(url)


atexit.register(_open.cache_clear)  # close the HTTP datasets while GDAL is still alive (else noisy errors at exit)


def _pairs(c) -> list:
    return [c] if isinstance(c[0], (int, float)) else [p for x in c for p in _pairs(x)]


def _validate(geometry: dict) -> list:
    if not isinstance(geometry, dict) or geometry.get("type") not in ("Point", "Polygon", "MultiPolygon"):
        raise ValueError("geometri harus GeoJSON Point, Polygon, atau MultiPolygon")
    try:
        pts = _pairs(geometry["coordinates"])
    except (KeyError, IndexError, TypeError):
        raise ValueError("koordinat geometri kosong atau rusak") from None
    for p in pts:
        if len(p) < 2 or not (-180 <= p[0] <= 180 and -90 <= p[1] <= 90):
            raise ValueError(f"koordinat {p} di luar jangkauan (urutan GeoJSON adalah [bujur, lintang])")
    return pts


def _hansen_tile(lon: float, lat: float) -> str:
    top, left = math.ceil(lat / 10) * 10, math.floor(lon / 10) * 10  # tiles are 10x10 deg, named by top-left corner
    return f"{abs(top):02d}{'N' if top >= 0 else 'S'}_{abs(left):03d}{'E' if left >= 0 else 'W'}"


def _read(url: str, geometry: dict, pts: list):
    """Pixel values covering the plot: the one pixel under a point, or every pixel a polygon touches."""
    ds = _open(url)
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    r0, c0 = ds.index(min(xs), max(ys))
    r1, c1 = ds.index(max(xs), min(ys))
    win = Window(c0, r0, c1 - c0 + 1, r1 - r0 + 1)
    a = ds.read(1, window=win)
    if geometry["type"] != "Point":
        a = a[geometry_mask([geometry], a.shape, ds.window_transform(win), invert=True, all_touched=True)]
    return a.ravel()


def check_plot(geometry: dict) -> dict:
    """Screen one plot (GeoJSON geometry, WGS84 [lon, lat]) against the EUDR cut-off. Never raises."""
    t0 = time.time()
    base = {"cutoff": CUTOFF, "sources": SOURCES, "caveats": CAVEATS}
    try:
        pts = _validate(geometry)
        if max(p[0] for p in pts) - min(p[0] for p in pts) > 0.1 or max(p[1] for p in pts) - min(p[1] for p in pts) > 0.1:
            raise ValueError("bentang plot lebih dari ~11 km, terlalu besar untuk dicek sekaligus; pecah per kebun")
    except ValueError as e:
        return {**base, "verdict": "TIDAK BISA DICEK", "reasons": [str(e)]}
    # ponytail: Hansen tile picked from the first vertex; a polygon straddling a 10-degree line reads only that tile
    tile = _hansen_tile(*pts[0][:2])
    try:
        with _LOCK:
            jrc = _read(JRC_URL, geometry, pts)
            loss = _read(HANSEN_URL.format(tile=tile), geometry, pts)
    except Exception as e:  # network down, server error, timeout: report it, don't crash the caller
        return {**base, "verdict": "TIDAK BISA DICEK",
                "reasons": [f"Data peta tidak bisa diakses ({type(e).__name__}: {str(e)[:160]}). Coba lagi saat online."]}

    forest_frac = float((jrc == 1).mean()) if jrc.size else 0.0
    forest = forest_frac >= FOREST_FRAC
    after = loss[loss >= 21]  # 21 = 2021, the first full year after the cut-off
    years = sorted({2000 + int(v) for v in after})
    before = sorted({2000 + int(v) for v in loss[(loss > 0) & (loss < 21)]})
    reasons = [f"Peta JRC 2020: titik ini {'HUTAN' if forest else 'bukan hutan'} pada akhir 2020."
               if geometry["type"] == "Point" else f"Peta JRC 2020: {forest_frac:.0%} luas plot tercatat hutan pada akhir 2020."]
    share = "" if geometry["type"] == "Point" else f" ({after.size / loss.size:.1%} luas plot)"
    reasons.append(f"Hansen: tutupan pohon hilang setelah cut-off pada tahun {', '.join(map(str, years))}{share}."
                   if years else "Hansen: tidak ada kehilangan tutupan pohon setelah 31 Des 2020.")
    if before:
        reasons.append(f"Ada kehilangan tutupan pohon sebelum cut-off ({before[0]}-{before[-1]}); itu tidak dihitung EUDR.")
    # ponytail: for polygons "forest" and "loss" are plot-wide, not checked pixel-on-pixel; co-register 30 m loss onto
    # the 10 m forest grid if polygons with a forest edge get false TINGGI
    if forest and years:
        verdict = "TINGGI"
        reasons.append("Hutan pada 2020 lalu tutupan pohon hilang setelahnya: pola deforestasi. Jangan salurkan bibit "
                       "ke plot ini sebelum ada verifikasi lapangan.")
    elif forest:
        verdict = "PERLU CEK"
        reasons.append("Hutan pada 2020 tanpa kehilangan tutupan tercatat. Jika ini kebun kakao agroforestri lama, "
                       "lampirkan bukti; jika lahan baru dibuka, menanam di sini dihitung deforestasi.")
    elif years:
        verdict = "PERLU CEK"
        reasons.append("Bukan hutan pada 2020 tetapi ada pohon yang hilang setelahnya (bisa peremajaan kebun atau "
                       "tebang pohon pelindung). Cek citra satelit/foto lapangan.")
    else:
        verdict = "RENDAH"
        reasons.append("Bukan hutan pada 2020 dan tidak ada kehilangan tutupan pohon sesudahnya.")

    return {**base, "verdict": verdict, "forest_2020": forest, "forest_2020_frac": round(forest_frac, 3),
            "loss_after_2020": years, "loss_after_2020_frac": round(float(after.size / loss.size), 3) if loss.size else 0.0,
            "pixels": {"jrc_10m": int(jrc.size), "hansen_30m": int(loss.size)}, "hansen_tile": tile,
            "reasons": reasons, "seconds": round(time.time() - t0, 2)}


# ---------- export for the EUDR Information System ----------
# Spec: "EUDR GeoJSON File Description", updated 17 Aug 2026,
# https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/help/eudr-documentation/operator/geojson-description.html
# + validation rules (same site, validation-rules.html). WGS84 [lon, lat]; the IS truncates to 6 decimals;
# no holes / crossing lines / LineStrings; point Area in ha, number, 0.0001..4 for non-cattle; extra properties ignored.
OFFICIAL = {"producer_name": "ProducerName", "producer_country": "ProducerCountry",
            "production_place": "ProductionPlace", "area_ha": "Area"}


def _ring(ring: list, where: str) -> list:
    out = []
    for p in ring:
        q = [round(float(p[0]), 6), round(float(p[1]), 6)]
        if not out or q != out[-1]:  # the IS rejects duplicate points created by its own 6-decimal cut
            out.append(q)
    if out[0] != out[-1]:
        out.append(out[0])  # field-walked polygons often miss the closing point
    if len(out) < 4:
        raise ValueError(f"{where}: poligon butuh minimal 3 titik berbeda")
    segs = list(pairwise(out))

    def side(a, b, c):
        return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    # ponytail: O(n^2) proper-crossing check, fine for field plots (<1000 vertices); touching/collinear overlaps not caught
    for i, (a, b) in enumerate(segs):
        for c, d in segs[i + 2:len(segs) - (i == 0)]:
            if side(a, b, c) * side(a, b, d) < 0 and side(c, d, a) * side(c, d, b) < 0:
                raise ValueError(f"{where}: garis batas poligon saling memotong (bentuk angka 8), ukur ulang batas kebun")
    if abs(sum(a[0] * b[1] - b[0] * a[1] for a, b in segs)) < 1e-12:  # shoelace: zero area = a line, rejected by the IS
        raise ValueError(f"{where}: titik-titik poligon segaris (luas nol)")
    return out


def _eudr_geometry(g: dict, area, where: str) -> dict:
    try:
        _validate(g)
    except ValueError as e:
        raise ValueError(f"{where}: {e}") from None
    if g["type"] == "Point":
        if area is not None and not 0.0001 <= area <= 4:
            raise ValueError(f"{where}: titik hanya boleh untuk plot <= 4 ha (Pasal 2(28) EUDR); plot {area} ha wajib poligon")
        return {"type": "Point", "coordinates": [round(float(g["coordinates"][0]), 6), round(float(g["coordinates"][1]), 6)]}
    polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
    if any(len(p) != 1 for p in polys):
        raise ValueError(f"{where}: poligon berlubang tidak diterima sistem EUDR; pecah jadi dua poligon")
    rings = [[_ring(p[0], where)] for p in polys]
    return {"type": "Polygon", "coordinates": rings[0]} if g["type"] == "Polygon" else {"type": "MultiPolygon", "coordinates": rings}


def to_eudr_geojson(plots: list[dict]) -> dict:
    """Plots -> FeatureCollection for the EUDR Information System (works as Type I and Type II).

    Each plot: {"geometry": GeoJSON, "producer_name", "production_place", "area_ha", "producer_country" (default "ID"),
    plus any CacaoID fields (plot_id, clone, clone_verified, sample_id, batch_id, verdict, ...)}.
    The four official properties use the spec's exact case; our fields ride under "CacaoID", which the IS ignores
    ("Any other properties that are syntactically valid but not included ... will be ignored").
    Raises ValueError naming the plot if anything would be rejected by the IS.
    """
    features = []
    for i, p in enumerate(plots):
        where = f"plot {p.get('plot_id', i + 1)}"
        area = p.get("area_ha")
        if area is not None and (isinstance(area, bool) or not isinstance(area, (int, float))):
            raise ValueError(f"{where}: luas harus angka hektar, bukan teks (teks dibaca sistem EUDR sebagai 0)")
        country = p.get("producer_country") or "ID"
        if not (len(country) == 2 and country.isalpha() and country.isupper()):
            raise ValueError(f"{where}: ProducerCountry harus kode ISO2 huruf besar, mis. 'ID'")
        props = {OFFICIAL[k]: v for k, v in {**p, "producer_country": country}.items() if k in OFFICIAL and v is not None}
        extra = {k: v for k, v in p.items() if k not in OFFICIAL and k != "geometry"}
        if extra:
            props["CacaoID"] = extra
        features.append({"type": "Feature", "properties": props, "geometry": _eudr_geometry(p.get("geometry"), area, where)})
    return {"type": "FeatureCollection", "features": features}
