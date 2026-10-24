# Validasi Model AI CacaoID

24 Okt 2026. Semua angka di bawah dihasilkan ulang oleh skrip di `backend/scripts/validate_*.py`. Output mentahnya ada di `data/validation/*.json`.

**Aturan tim tetap berlaku:** angka akurasi adalah catatan internal, tidak ditampilkan di UI. Kalau mau dipakai di slide, putuskan bersama dulu, dan selalu sertakan skenario validasinya.

## 1. Ringkasan

| Model | Penggunaan yang **tervalidasi** | Yang **tidak** tervalidasi | Status di aplikasi |
|---|---|---|---|
| Komponen hasil (Bekele 2022) | Memprediksi biji/buah, ukuran biji, dan pod index sebuah klon atau pohon dari genotipe genome-wide | Hasil panen per hektare; sampel panel 48 SNP | ✅ Siap pakai (kartu AI di detail sampel, seleksi semaian simulasi, uji refleks) |
| Asal-usul (Motamayor) | Perkiraan komposisi kelompok genetik | Vonis pasti; kelompok Curaray, Purús, Nacional | ✅ Siap pakai **sebagai perkiraan** |
| Busuk buah (Jacquotte 2026), **baru** | **Meranking semaian dalam satu silangan**, juga bila satu tetuanya belum dikenal model | Membandingkan klon atau pohon yang tidak sekerabat; menebak rata-rata silangan dari tetuanya | ✅ Siap pakai **hanya untuk ranking dalam silangan** |
| Pasangan tetua (busuk buah), **baru** | – | Gagal validasi: urutan tetua baru terbalik | ❌ Tidak dipasang. Masuk roadmap, butuh data latih multi-tetua |
| Profil sifat di setiap vonis | Uji lapang (526 fakta) + prediksi komponen hasil | Indeks busuk buah per klon | ✅ Siap pakai (tanpa busuk buah) |
| Uji refleks | Pohon TIDAK DIKENAL → genotyping genome-wide → komponen hasil + asal-usul | Indeks busuk buah pohon tunggal | ✅ Siap pakai |

## 2. Komponen hasil (model lama, divalidasi ulang)

Data: 346 aksesi bank gen Trinidad × 589 SNP (Bekele dkk. 2022, CC BY). Validasi berblok kekerabatan: kerabat dekat tidak pernah terpisah antara data latih dan uji. Skrip: `validate_traits.py`.

| Sifat | Bersarang (pemilihan model di dalam fold) | RR-BLUP | SVR | Baseline 5 kerabat terdekat | Cakupan interval "80%" |
|---|---|---|---|---|---|
| Jumlah biji per buah | 0,66 | 0,60 | 0,66 | 0,54 | 82% |
| Panjang biji | 0,59 | 0,58 | 0,60 | 0,53 | 83% |
| Lebar biji | 0,59 | 0,60 | 0,57 | 0,48 | 83% |
| Pod index | 0,51 | 0,44 | 0,52 | 0,34 | 86% |

- Pemilihan model di dalam fold tidak menurunkan akurasi, jadi tidak ada bias pemilihan.
- Model selalu mengalahkan baseline "kerabat terdekat" (+0,05 sampai +0,17). Artinya model belajar lebih dari sekadar kekerabatan.
- Interval ±1,28 × RMSE yang ditampilkan di aplikasi memang mencakup ±80% data, jadi intervalnya jujur.
- **Cek independen pada klon Indonesia.** Genotipe diambil dari genom publik; tidak satu pun klon ini ada di data latih. Pembandingnya berat biji dari uji lapang Indonesia (`data/traits`).

| Klon | Prediksi panjang × lebar biji | Berat biji lapang (median) |
|---|---|---|
| M04 | 2,70 | 1,71 g |
| MCC 01 | 2,48 | 1,60 g |
| Sulawesi 2 | 2,32 | 0,90 g (dua sumber bertentangan: 0,52 dan 1,27) |
| Sulawesi 1 | 2,21 | 1,10 g |

Spearman 0,8 (n = 4). Satu-satunya yang tertukar adalah Sulawesi 1 dan Sulawesi 2, dan data Sulawesi 2 sendiri bertentangan. n terlalu kecil untuk membuktikan akurasi, tetapi arahnya benar.

## 3. Asal-usul (model lama, divalidasi ulang)

Skrip: `validate_ancestry.py`. Leave-one-out pada 264 pohon referensi berlabel kelompok.

| | 589 SNP | Panel 48 SNP |
|---|---|---|
| Kelompok dominan benar | 78% | 78% |
| Model yakin (≥0,8) | 84% | 76% |
| **Yakin tapi salah** | **8%** | **6%** |
| Hibrida F1 simulasi: galat komposisi (jumlah selisih dari 50/50) | 0,28 | 0,39 |
| Hibrida F1 keliru dianggap murni | 5% | 5% |

Kesalahan terbanyak ada pada pohon Nanay, yang terbaca sebagai Contamana, Amelonado, atau Marañón. **Kesimpulan:** layak sebagai perkiraan, dan UI sudah menyebutnya perkiraan beserta peringatannya. Jangan dipakai sebagai vonis.

## 4. Busuk buah (model baru)

**Data:** Jacquotte dkk. 2026, *Plant Genome* (CATIE/Nestlé/CIRAD), Dryad doi:10.5061/dryad.0rxwdbsg4, CC0. 470 pohon F1 dengan BLUE busuk buah, dari 8 silangan dan 6 tetua, di CATIE (Kosta Rika).

**Temuan dasar:** 88% variasi busuk buah ada **di dalam famili**. Jadi nilai praktis model ada pada kemampuannya meranking semaian dalam satu silangan.

**Model:** RR-BLUP (ridge; penalti dipilih dengan LOO efisien), memakai 17.275 marka yang unik di Criollo V2 supaya bisa dibaca juga dari data sekuensing publik. Artefak: `backend/artifacts/blackpod.pkl`. Skrip: `validate_blackpod.py`, `validate_selection.py`, `validate_newparent.py`, `validate_crosses.py`.

| Skenario | RR-BLUP | SVR | Gradient boosting | Pembanding |
|---|---|---|---|---|
| A. CV acak 5-fold (cara paper) | 0,48 | 0,48 | 0,45 | rata-rata famili 0,30 |
| B. Famili baru: ranking dalam famili | 0,38 | 0,39 | 0,32 | tanpa model: 0 |
| B. Famili baru: rata-rata famili | 0,30 | 0,36 | 0,34 | GCA klasik **0,42** |
| C. Setengah famili ikut dilatih | 0,39 | 0,38 | – | – |
| D. Kepadatan marka (ranking dalam famili) | 48 SNP: 0,17 · 500: 0,32 · 1.000: 0,35 · 2.000: 0,37 · 5.000: 0,37 · 24 rb: 0,38 | | | |

**Manfaat praktis** (17.275 marka yang dipakai aplikasi; famili baru; simpan 25% semaian teratas):

| | Nilai |
|---|---|
| Akurasi dalam famili, rata-rata 8 famili | r = 0,40 (7 dari 8 famili ≥0,33; EET-399 × CATIE-R6 hanya 0,13) |
| Busuk buah semaian terpilih vs rata-rata famili | turun 3,0 poin (**−14%**) |
| Semaian terpilih yang memang termasuk separuh lebih tahan | **71%** (pilih acak: 50%) |

**Bila satu tetua belum dikenal model** (seluruh famili tetua itu dikeluarkan dari data latih): akurasi ranking dalam famili tetap 0,41, sama dengan saat kedua tetua dikenal (0,40). Ini bukti terkuat bahwa ranking semaian bisa dipakai untuk silangan dengan tetua baru, termasuk klon Indonesia.

**Yang gagal: menebak mutu tetua atau klon** (`validate_crosses.py`, leave-one-parent-out):

| Tetua baru | Prediksi | Rata-rata keturunan teramati |
|---|---|---|
| PA-51 | 23,1 | **19,2** (paling tahan) |
| CHUAO-120 | 25,3 | 22,9 |
| EET-399 | 23,5 | 23,1 |
| EET-95 | 22,7 | 25,2 (paling rentan) |

Urutan tetua Spearman −0,4, dan urutan famili 0,12. Model tidak mengenali PA-51 sebagai sumber ketahanan. Penyebabnya, 6 tetua terlalu sempit untuk mempelajari perbedaan antar-klon. **Konsekuensinya:**
- prediksi busuk buah per klon (profil sifat, uji refleks) **dicabut** dari aplikasi;
- fitur pasangan tetua **tidak dipasang**.

## 5. Yang berubah di aplikasi

| Bagian | Perubahan |
|---|---|
| `engine/ai_blackpod.py` (baru) | Model, pembaca matriks marka × semaian, skor + cakupan. Tidak ada kelas absolut, supaya keluaran yang tidak tervalidasi tidak bisa terpakai. |
| `POST /api/ai/seedlings` + `GET /api/ai/seedlings/example.csv` | Ranking semaian satu silangan; 25% teratas ditandai "simpan". Contoh: 39 semaian nyata PA-51 × ICS-95 (CC0; famili ini ikut data latih, jadi hasil contoh optimistis). |
| `GET/POST /api/ai/reflex` | Antrean pohon TIDAK DIKENAL dan unggah genotipe genome-wide (format file lab biasa) → komponen hasil + asal-usul; tercatat di jejak audit (`refleks.diunggah`). |
| Analitik AI | Kartu "Ranking semaian busuk buah dalam satu silangan" (unggah atau contoh data nyata). |
| Hasil batch | Kartu "Uji refleks" (daftar, unggah, hasil). |
| Detail sampel | Kartu "Uji refleks" untuk vonis TIDAK DIKENAL. |
| Tes | `tests/test_ai_blackpod.py` (4 tes baru). Seluruh suite **74 lolos** (`uv run pytest -q`, 24 Okt). Frontend lolos `tsc` dan eslint (tanpa error baru). |

## 6. Genotyping dari data sekuensing publik (marka Jacquotte)

`scripts/wgs/jacqfp.py`: posisi marka Jacquotte ada di **Criollo genome V2** (GCF_000208745.1). Panjang setiap kromosom cocok dengan posisi marka terakhir hingga <0,1%. Dari 24.218 marka, 17.275 (71%) unik di genom itu; sisanya punya salinan paralog dan dibuang.

**Konkordansi** (`validate_wgs.py`): data sekuensing publik Nestlé (PRJEB75153) untuk 2 tetua Jacquotte dibandingkan dengan genotipe tetua yang diturunkan dari 495 keturunannya.

| Tetua (run) | Marka unik terbaca | Cocok bila kode = ALT | Cocok bila kode = REF |
|---|---|---|---|
| ICS-95 (ERR13166419, 14×) | 89% | **92%** | 31% |
| PA-51 (ERR13166479, 13×) | 73% | 54% | 21% |

Pembanding: klon yang tidak berkerabat cocok 38–51% satu sama lain.

- **Pipeline berfungsi** (ICS-95 cocok 92%), dan kode dosis Jacquotte = jumlah alel ALT terhadap Criollo V2.
- **"PA 51" di data Nestlé tidak identik dengan tetua PA-51 di silangan CATIE.** Kecocokannya 54%, nyaris setara klon tak berkerabat, padahal kedalaman bacaannya sama dengan ICS-95. Data ini tidak bisa menentukan koleksi mana yang salah label. Ini contoh nyata masalah yang ditangani CacaoID: label klon di koleksi resmi pun bisa keliru.

**Yang dihentikan:** genotyping 5 klon Indonesia (Sulawesi 1/2, MCC 01, M04, M06) dan 3 tetua lain. Alasannya, prediksi busuk buah per klon sudah terbukti tidak valid (bagian 4), jadi hasilnya tidak akan mengubah keputusan. Antrean bisa dilanjutkan dengan `scripts/wgs/pipeline.py` + `jacqfp.py` bila kelak ada model antar-klon.

## 7. Cara mengulang

```bash
cd backend
uv run python scripts/validate_traits.py      # komponen hasil
uv run python scripts/validate_ancestry.py    # asal-usul
uv run python scripts/validate_blackpod.py    # busuk buah: A-D (±1,5 jam, gradient boosting lambat)
uv run python scripts/validate_selection.py   # manfaat seleksi 25%
uv run python scripts/validate_newparent.py   # tetua baru: ranking dalam famili
uv run python scripts/validate_crosses.py     # tetua baru: rata-rata famili (gagal)
uv run python -m cacaoid.engine.ai_blackpod   # latih artefak
uv run pytest -q
```

## 8. Batas dan langkah berikutnya

1. **Data latih busuk buah hanya dari Kosta Rika** (*Phytophthora* spp., 6 tetua). Ranking dalam famili terbukti tahan terhadap tetua baru, tetapi belum diuji pada semaian Indonesia dan *P. palmivora* lokal. **Langkah:** kemitraan data dengan ICCRI atau Mars (silangan berfenotipe di Sulawesi).
2. **Membandingkan klon butuh populasi latih dengan banyak tetua.** Ini syarat agar fitur pasangan tetua dan indeks per klon bisa dibangun.
3. **Panel ±2.000 marka sudah cukup** untuk ranking (0,37 vs 0,38). Jadi panel mid-density (DArTag) bisa melayani identitas sekaligus ranking.
4. **VSD:** belum ada data publik genotipe + fenotipe. Butuh kemitraan dengan Univ. Sydney/Unhas (Singh 2021: 130 keturunan Sulawesi).
