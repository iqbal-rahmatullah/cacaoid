# CacaoID API

FastAPI + engine Python untuk verifikasi genetik kakao: QC data lab, vonis identitas, parentage,
kontaminasi lot, dampak sifat, registri, skor risiko, audit, paspor bibit, dan model AI untuk pemulia.
Semua data demo adalah **DATA SIMULASI**.

## Menjalankan

Dari root monorepo cukup `pnpm dev` (web + api). Untuk API saja:

```bash
cd apps/api
uv run python -m cacaoid.engine.simulate     # tulis data/simulasi/*.csv (deterministik)
uv run python -m cacaoid.seed                # buat "Batch demo Sulawesi" bila database kosong
uv run uvicorn cacaoid.main:app --reload --port 8001
uv run pytest -q                             # 74 test, ±2 menit
```

- Dokumentasi interaktif: http://localhost:8001/docs
- Registri klon dan penyedia diisi otomatis saat API pertama kali start (`db.init_db`).
- Database: `cacaoid.db` (SQLite, tidak di-commit). Path lain bisa diatur lewat env `CACAOID_DB`.
- Reset: hentikan server, hapus `cacaoid.db`, lalu jalankan `pnpm seed` dari root.
- Peran dibaca dari header `X-Role` dan dicatat di jejak audit. Belum ada login; untuk sekarang hanya satu peran, Pengawas benih.

## Endpoint

| Kelompok | Endpoint | Fungsi |
|---|---|---|
| Batch | `POST /api/batches` | Buat batch kosong atau dari file lapangan CSV |
| | `POST /api/batches/{id}/samples` | Tambah satu sampel dari ponsel |
| | `GET /api/batches/{id}/manifest.csv` | Lembar plate untuk lab (posisi sumur + ID, tanpa klaim klon) |
| | `POST /api/batches/{id}/lab` | Unggah file genotipe lab (CSV `,`/`;`/tab atau `.xlsx`) + QC |
| | `POST /api/batches/{id}/analyze` | Jalankan vonis untuk seluruh batch |
| | `GET /api/batches`, `GET /api/batches/{id}` | Ringkasan batch, sampel, QC, lot |
| | `GET /api/batches/{id}/samples/{sid}` | Detail vonis, perbandingan 48 SNP, langkah vonis |
| | `POST /api/batches/{id}/samples/{sid}/action` | Tindak lanjut: `uji ulang` atau `pemurnian` |
| | `GET /api/batches/{id}/gardens` | Per kebun: klon yang ditemukan DNA vs klon terdaftar, dan apakah bisa saling menyerbuki |
| | `GET /api/audit?batch_id=` | Jejak audit berantai hash + status rantai |
| | `GET /api/simulasi/{name}` | Unduh file contoh DATA SIMULASI |
| Registri | `GET /api/panel` | 48 SNP panel identitas |
| | `GET/POST /api/clones`, `GET /api/clones/{name}` | Registri klon (sinonim ditolak kecuali dikonfirmasi) |
| | `GET/POST /api/providers`, `PUT /api/providers/{id}/clones` | Penyedia dan kebun entres beserta klonnya |
| Dampak | `GET /api/traits/clone/{name}` | Fakta uji lapang per klon (bersumber) |
| | `GET /api/traits/compare?paid=&received=` | Sifat klon yang dibayar vs yang diterima |
| | `GET /api/traits/rules` | Aturan dampak batang bawah dan VSD hibrida |
| Dasbor | `GET /api/dashboard` | Agregat vonis per provinsi, penyedia, dan jenis sampel |
| | `GET /api/ai/risk` | Skor risiko penyedia + anjuran jumlah daun (aturan + Bayes, bukan AI) |
| Paspor | `GET /api/batches/{id}/samples/{sid}/passport` | Paspor bibit: identitas + skrining EUDR |
| | `GET /api/batches/{id}/eudr.geojson`, `POST /api/eudr/check` | Ekspor dan cek titik tanam terhadap peta hutan 2020 |
| AI | `GET /api/ai/traits`, `POST /api/ai/cross` | Prediksi komponen hasil; semaian simulasi dari silangan |
| | `POST /api/ai/seedlings`, `GET /api/ai/seedlings/example.csv` | Ranking busuk buah semaian dalam satu silangan |
| | `GET /api/ai/ancestry`, `GET /api/ai/ancestry/sample` | Asal-usul genetik (kelompok Motamayor) |
| | `GET/POST /api/ai/reflex` | Uji refleks untuk pohon TIDAK DIKENAL |
| | `POST /api/ai/mix`, `GET /api/ai/mix/options` | Penasihat campuran klon (kompatibilitas penyerbukan) |
| | `GET /api/ai/where` | Kesesuaian lokasi dari kemiripan iklim dengan lokasi uji klon |

## Struktur

```
src/cacaoid/
  config.py      SEMUA ambang keputusan (error lab, call rate, LOD, batas kontaminasi lot)
  main.py        aplikasi FastAPI; seed.py mengisi batch demo
  db.py models.py audit.py
  api/           router per kelompok endpoint di atas
  engine/
    io.py qc.py            parser file genotipe + QC batch (geser sumur, untai terbalik, kontrol)
    registry.py            sidik jari konsensus per klon dari pohon replikat
    identity.py            vonis identitas (likelihood + toleransi error lab)
    parentage.py           batang bawah & asal biji, hanya terhadap hipotesis tertentu
    contamination.py       kontaminasi lot hibrida + jumlah sampel
    impact.py              dampak vonis dari fakta uji lapang bersumber
    risk.py                skor risiko penyedia (aturan terbuka)
    eudr.py                skrining deforestasi untuk paspor bibit
    compat.py agroclimate.py  campuran klon dan kesesuaian lokasi
    ai_traits.py ai_ancestry.py ai_blackpod.py  model AI (artefak di artifacts/*.pkl)
    simulate.py            generator DATA SIMULASI (cerita demo SIM-065 ada di sini)
tests/           test unit, alur batch, benchmark data nyata, skenario sulit
scripts/         validate_*.py: validasi model AI pada data publik → data/validation/*.json
data/            data publik + simulasi; lisensi di data/ATTRIBUTION.md
artifacts/       model AI terlatih
tasks/           GAPS.md, VALIDASI_MODEL.md, plan.md, feasibility/: dokumen kerja engine
```

## Aturan

- Ambang hanya diubah di `config.py`, dan setiap perubahan disertai test.
- Kekurangan yang ditemukan dicatat di `tasks/GAPS.md`, dan tambalannya diberi test regresi.
- Klaim model AI tidak boleh melebihi `tasks/VALIDASI_MODEL.md`.
  - Busuk buah hanya untuk ranking dalam satu silangan.
  - Komponen hasil butuh genotipe genome-wide (±589 SNP), tidak bisa dari panel 48 SNP.
- Model dilatih ulang dengan `uv run python -m cacaoid.engine.ai_traits` / `ai_blackpod`, lalu divalidasi ulang dengan `scripts/validate_*.py`.
