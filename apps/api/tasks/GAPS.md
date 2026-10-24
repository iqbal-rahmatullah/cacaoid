# Kekurangan sistem yang ditemukan saat membangun MVP

Setiap temuan punya ID, tingkat keparahan, cara mereproduksi, dan status. Temuan yang mengubah klaim di deck atau overview diberi tanda **[pitch]**.

| ID | Temuan | Keparahan | Status |
|---|---|---|---|
| G-01 | Jika file lab tidak memuat satu atau lebih SNP panel, call rate semua sampel turun dan banyak yang masuk UJI ULANG tanpa pesan yang jelas di tingkat batch | Tinggi | **Ditambal** (lihat G-25) |
| G-02 | Referensi dengan sidik jari bolong (SNP panel sedikit) membuat sampel asli klon itu divonis TIDAK DIKENAL | Tinggi | **Ditambal** (T3) |
| G-03 | Ambang call rate 90% membuat ±9% sampel harus uji ulang bila 5% data lab hilang | Sedang | **Ditambal** (T3) |
| G-04 | 623 dari 627 referensi publik berasal dari **1 pohon saja**. Jika pohon referensi itu sendiri salah label, semua vonis untuk klon itu ikut salah. **[pitch]** | Tinggi | Terbuka |
| G-05 | Klon utama Indonesia (MCC 01/02, Sulawesi 1/2, ICCRI 06H/08H) belum punya referensi. Empat vonis di deck tidak punya jawaban untuk kasus ini. **[pitch]** | Tinggi | **Ditambal di engine** (vonis baru). Ketergantungan bisnis tetap ada. |
| G-06 | Nama klon ditulis berbeda di lapangan ("ICS 60", "ics-60", "ICS60") | Sedang | **Ditambal** (T3) |
| G-07 | Registri publik berisi sinonim (nama berbeda, genotipe identik di panel) | Rendah | Ditangani sebagian |
| G-09 | Benchmark Kolombia: 170/171 plot heterogen versi paper ditemukan ulang, tetapi sistem juga menandai 84 plot lain (beda > 5% SNP) yang tidak ada di Tabel 5 paper | Sedang | Terbuka (perlu cek kurator) |
| G-10 | Pencarian tetua terbuka di seluruh registri tidak andal pada panel 48 SNP (1 dari 8 benar; semaian luar diberi tetua palsu). **[pitch]** | Tinggi | **Ditambal** dengan membatasi hipotesis (T6) |
| G-11 | Lot benih hibrida dengan 20 bibit memberi rentang kontaminasi 8–42%. Keputusan LOLOS/TAHAN belum pasti; perlu ≥59 bibit untuk batas 5%. **[pitch]** | Sedang | Ditangani di UI (peringatan + kalkulator) |
| G-12 | Halaman lapangan butuh koneksi internet saat menyimpan; kebun kakao sering tanpa sinyal | Tinggi | **Ditambal** (antrean di perangkat + sinkron otomatis) |
| G-13 | Klaim klon diketik bebas di lapangan (hanya saran dari registri); salah ketik baru ketahuan setelah hasil lab | Sedang | **Ditambal** (konfirmasi bila klaim tak ada di registri) |
| G-14 | AI prediksi komponen hasil butuh genotyping genome-wide (±589 SNP). Sampel verifikasi (panel 48 SNP) tidak bisa diprediksi. **[pitch]** | Tinggi | Ditangani: sistem menolak dengan pesan jelas |
| G-15 | Asal-usul: data publik tidak punya referensi Criollo/Amelonado, jadi Trinitario dan klon Indonesia terbaca sebagai campuran kelompok lain (CATONGO → Marañón 53% + Nanay 44%). **[pitch]** | Tinggi | **Sebagian ditutup (23 Okt):** Criollo dan Amelonado kini punya pohon referensi yang dicek dengan genom publik; Curaray, Purús, Nacional belum |
| G-16 | Registri menerima klon baru yang sidik jarinya identik dengan klon yang sudah ada (sinonim/salah ambil pohon) tanpa peringatan | Sedang | **Ditambal** (409 kecuali dikonfirmasi pemilik) |
| G-17 | Vonis OFF-TYPE menyebut satu klon padahal ada klon lain yang tak terbedakan di panel (ICS48 selalu "ditemukan sebagai ICS45") | Sedang | **Ditambal** (catatan "tidak dapat dibedakan dari …") |
| G-18 | Skor risiko: setelah batch pertama semua penyedia jatuh di tingkat yang sama dan mendapat rekomendasi sampel yang sama (59), walau off-type 20% vs 6% | Sedang | **Ditambal** (rencana sampling kontinu) |
| G-19 | Bug: tabel silangan AI menukar nilai tetua (nama diurutkan seperti database, prediksi seperti input) | Sedang | **Ditambal** + test regresi |
| G-20 | **Sampel tergeser satu sumur di plate lab**: 33 OFF-TYPE palsu dari 40 sampel, kontrol tetap lolos, tanpa peringatan | **Kritis** | **Ditambal** (deteksi pola geser: 20/20 tertangkap, 0/20 alarm palsu) |
| G-21 | Lab melaporkan untai DNA berlawanan (strand flip) di 6 SNP: 55 sampel jadi TIDAK DIKENAL tanpa diagnosis (kontrol positif yang menangkapnya) | Tinggi | **Ditambal** (koreksi otomatis + peringatan; SNP palindromik ditandai) |
| G-22 | CSV bertitik koma (Excel berlokal Indonesia) ditolak dengan pesan menyesatkan "tidak ada SNP panel" | Tinggi | **Ditambal** |
| G-23 | Lab menulis ulang ID (`SIM-001` → `sim-01`): 0 sampel dianalisis | Sedang | **Ditambal** (pencocokan ID ternormalisasi + peringatan) |
| G-24 | File lab .xlsx ditolak | Sedang | **Ditambal** |
| G-25 | Lab hanya mengirim 30/48 SNP: semua 90 sampel UJI ULANG, tanpa pesan di tingkat batch (bentuk nyata G-01) | Tinggi | **Ditambal** (vonis memakai SNP yang dikirim; < 38 SNP ditolak dengan pesan) |
| G-26 | **Simulasi terlalu optimistis untuk parentage di panel 48 SNP acak.** Pada 495 pohon F1 nyata: silangan benar 90,6% (simulasi 94–96%); kerabat tetua yang tidak ada salah ditunjuk 12% | Tinggi | Ditangani sebagian: lihat F5; perlu panel parentage khusus tetua kebun benih |
| G-27 | Lot benih bersih ikut ditahan 24% di data nyata (laju salah eksklusi nyata 2,4–7,6%, simulasi 0–1,9%) | Tinggi | **Ditambal**: batas bawah alpha (5%/3%) + vonis TAMBAH SAMPEL |
| G-28 | Sumber resmi saling bertentangan soal ketahanan klon (mis. MCC 01: VSD "tahan" di leaflet ICCRI, "rentan" di 3 uji lapang) **[pitch]** | Sedang | Ditangani: semua sumber ditampilkan dengan tanda ⚠, tidak dipilih salah satu |
| G-29 | Cek deforestasi: kebun kakao agroforestri lama bisa terbaca "hutan 2020" sehingga divonis PERLU CEK | Sedang | Terbuka: butuh poligon kebun + bukti lapangan; Whisp FAO butuh kunci API gratis |
| G-30 | Belum ada profil SSR kompatibilitas penyerbukan untuk klon Indonesia; iklim NASA POWER ±55 km terlalu kasar untuk beda kecamatan | Rendah | Terbuka: tambah 11 penanda SSR ke panel lab; pakai WorldClim/CHIRPS v3 untuk produksi |
| G-08 | Ekor statistik error lab: ±1 dari 4.000 sampel asli tetap divonis TIDAK DIKENAL (contoh: 6 beda dari 46 SNP, batas 5) | Sedang | **Ditambal** (catatan "uji ulang sebelum pohon diganti") |

## Detail

### G-01 · SNP panel hilang dari file lab
- **Reproduksi:** unggah CSV lab yang tidak memuat kolom satu SNP panel. `run_qc` menghitung call rate terhadap panel penuh.
- **Usulan:** QC tingkat batch menampilkan pesan "Lab tidak mengirim SNP X, Y". Jika yang hilang lebih dari N SNP, batch ditolak dengan pesan ke lab, bukan dikirim ke uji ulang per sampel.

### G-02 · Referensi tidak lengkap
- **Reproduksi:** klaim LCTEEN-280. Referensinya hanya punya ±29 dari 48 SNP panel. Dengan 5% data hilang, kurang dari 30 SNP bisa dibandingkan, sehingga vonisnya TIDAK DIKENAL.
- **Dampak:** dari simulasi 4.000 sampel asli, 18 terkena alarm palsu karena hal ini. Presisi turun ke ±96%.
- **Tambalan:**
  - Referensi wajib punya minimal `MIN_COMPARED + (1 − MIN_CALL_RATE) × ukuran panel` SNP panel.
  - Yang kurang dari itu diberi status registri **"tidak lengkap"** dan klaim terhadapnya divonis **BELUM ADA REFERENSI**.
- **Hasil:** presisi naik ke 99,3–99,6%, recall tetap 100%.
- **Test:** `test_verdict_paths`, `test_offtype_simulation`.

### G-03 · Terlalu banyak uji ulang
- **Hasil simulasi** (data hilang 5%, error 2%, 4.000 sampel):

| Ambang call rate | Uji ulang | Presisi |
|---|---|---|
| 90% | 9,3% | 99,3% |
| 85% | 0,2% | 99,4% |

- **Tambalan:** `MIN_CALL_RATE = 0.85`. Uji ulang berarti biaya lab tambahan.
- **Konsekuensi:** referensi dengan kurang dari 38 SNP panel menjadi "tidak lengkap".

### G-04 · Referensi satu pohon **[pitch]**
- Data Bekele 2022 hampir semuanya satu pohon per aksesi. Studi Kolombia (Osorio-Guarín 2025) menemukan 172 plot bank plasma nutfah yang heterogen. Jadi asumsi "referensi pasti benar" tidak aman.
- **Usulan:**
  - Status referensi dipecah menjadi **"terverifikasi"** (minimal 2 sumber independen yang cocok, mis. kebun entres ICCRI + bank plasma nutfah) dan **"satu sumber"**.
  - Vonis terhadap referensi satu sumber diberi catatan.
  - Registri menampilkan jumlah pohon.
- **Untuk pitch:** langkah pertama pilot adalah **genotyping referensi dari beberapa ramet per klon** di kebun entres resmi, bukan langsung memverifikasi bibit.

### G-05 · Klon diklaim belum punya referensi **[pitch]**
- **Tambalan engine:**
  - Vonis baru **BELUM ADA REFERENSI**.
  - Sistem tetap mencari kecocokan di registri dan menampilkan "cocok dengan X", karena bila klaimnya MCC 02 tetapi sampel cocok dengan ICS 60, itu indikasi kuat off-type.
- **Untuk pitch:**
  - Day-1 bergantung pada pemilik klon (ICCRI, pemulia MCC) untuk mengirim genotipe referensi.
  - Deck perlu menyebut **lima kemungkinan hasil**: COCOK, OFF-TYPE, BATANG BAWAH, TIDAK DIKENAL, BELUM ADA REFERENSI, ditambah UJI ULANG sebagai status QC.

### G-06 · Variasi penulisan nama klon
- **Tambalan:** kunci klaim dinormalisasi (spasi, tanda hubung, titik, huruf besar/kecil, dan akhiran "(varian x)"). Test: `test_helpers`.

### G-07 · Sinonim di registri
- Klon dengan genotipe identik di panel dinilai hanya pada SNP yang dimiliki kedua referensi. Vonisnya COCOK dengan catatan "Panel tidak dapat membedakan klon ini dari …".
- Belum ada fitur menggabungkan sinonim di registri.

### G-08 · Ekor error lab
- Dengan error 2% dan ambang α = 0,001, sekitar 0,03–0,1% sampel asli melewati batas mismatch.
- **Usulan T15:** jika TIDAK DIKENAL tetapi jumlah beda hanya sedikit di atas batas, tampilkan saran "uji ulang sebelum pohon dimusnahkan".

### G-09 · Plot tambahan di benchmark Kolombia
- **Reproduksi:** `tests/test_benchmark.py`, data Osorio-Guarín 2025 Tabel 4 dan 5.
- **Hasil per toleransi replikat:**

| Toleransi | Plot paper ditemukan ulang | Plot tambahan |
|---|---|---|
| 2/77 | 171/171 | 137 |
| 5% (bawaan) | 170/171 | 84 |
| 12/77 | 166/171 | 51 |

- Plot tambahan yang bertahan di toleransi tinggi berbeda lebih dari 10% SNP, jadi tidak bisa dijelaskan oleh error lab. Kemungkinan memang heterogen tetapi tidak dilaporkan paper (kriteria paper berbeda). Belum bisa dipastikan.
- **Untuk pitch:** sebut "menemukan ulang 99% plot salah label versi paper". **Jangan** klaim presisi.

### G-10 · Parentage di panel 48 SNP **[pitch]**
- **Reproduksi:** cari pasangan tetua terbaik di antara ±620 klon registri untuk anak simulasi.
  - Hanya 1 dari 8 anak yang mendapat pasangan benar.
  - Semaian yang tetuanya tidak terdaftar tetap mendapat pasangan dengan 0–1 eksklusi.
  - Panel yang lebih besar juga belum cukup: 96 SNP → 50% benar, 192 → 62%, 384 → 72%.
- **Tambalan:** parentage hanya dipakai untuk hipotesis yang spesifik.
  1. **Batang bawah:** uji terhadap silangan batang bawah resmi di registri. Dari 3.000 simulasi, anak asli terdeteksi 100% (ambang ≤ 5 eksklusi), saudara tiri yang lolos 0%, klon acak yang lolos 0%.
  2. **Asal biji:** pasangan dicari hanya di antara klon yang ditanam di kebun itu. Syaratnya eksklusi ≤ batas error **dan** LOD ≥ 3 terhadap hipotesis "pohon tak berkerabat" (`PARENT_LOD`).
     - Pasangan benar ditemukan 94–96%, semaian luar keliru diberi tetua 0%.
     - Pasangan yang hampir sama kuatnya dilaporkan sebagai "bisa juga …".
  - Sebelum LOD dipakai (hanya ambang eksklusi), 24% semaian luar keliru diberi tetua.
- **Komposisi kebun:** sekarang diambil dari registri penyedia (Registri → Penyedia & kebun). Penyedia yang belum terdaftar tetap ditebak dari klaimnya di batch, dan langkah penjelasan menyebut sumbernya. Test: `test_provider_garden_drives_seed_origin`.
- **Untuk pitch:** ganti "penelusur asal-usul menemukan tetua dari registri" menjadi "**menguji apakah pohon adalah anak dari klon-klon di kebun itu**". Contoh di deck ("anak Sulawesi 1 × ICS 60") tetap valid **bila kedua klon tercatat di kebun tersebut**.

### G-11 · Ukuran sampel lot **[pitch]**
- **Akurasi estimator:**
  - Dengan 200 bibit, estimasi meleset ≤ 0,6 poin pada kontaminasi 5/10/20/30% (simpangan baku 2–3 poin).
  - Daya deteksi 99% walaupun donor serbuk sari berasal dari klon registri (termasuk kerabat tetua).
  - Lihat `test_contamination.py`.
- **Masalahnya di ukuran sampel:** dengan 20 bibit, rentang 95% sangat lebar (contoh simulasi: 20%, rentang 8–42%).
- **Kalkulator** (minimal satu bibit kontaminan tertangkap, keyakinan 95%):

| Kontaminasi yang ingin dideteksi | Bibit yang perlu diuji |
|---|---|
| ≥ 5% | 59 |
| ≥ 10% | 29 |

- **Untuk pitch:** biaya per lot = minimal 59 sampel × harga per sampel KASP. Ini memengaruhi model harga per lot.

### G-12 · Lapangan tanpa sinyal
- **Reproduksi:** buka halaman Ambil sampel, putuskan jaringan, lalu simpan sampel. Permintaan gagal dan data hanya ada di formulir.
- **Usulan (murni software):** antrean lokal di perangkat (IndexedDB/localStorage) dan sinkron otomatis saat online. Jadikan PWA supaya halaman tetap terbuka tanpa sinyal.

### G-13 · Klaim klon salah ketik
- **Reproduksi:** ketik "ICS 6O" (huruf O). Sampel tersimpan, lalu setelah lab divonis BELUM ADA REFERENSI ("tidak ada di registri").
- **Usulan:** saat simpan, peringatkan bila klaim tidak ada di registri dan minta konfirmasi.
- **Catatan:** variasi spasi dan tanda hubung sudah ditangani (G-06).

### G-14 · Prediksi komponen hasil butuh panel lain **[pitch]**
- Model dilatih pada 589 SNP genome-wide (Bekele 2022, 346 aksesi). Bila hanya 48 SNP panel yang ada, lebih dari 90% fitur diimputasi dan semua pohon terlihat rata-rata.
- **Tambalan:** API menolak bila cakupan kurang dari 80% SNP model, dan menjelaskan alasannya.
- **Untuk pitch:**
  - Prediksi komponen hasil adalah layanan **terpisah** untuk pemulia, dengan genotyping genome-wide yang lebih mahal per sampel.
  - Prediksi ini bukan bagian dari verifikasi bibit rutin.
  - Demo yang jujur: seleksi semaian dari silangan terencana (`/api/ai/cross`).
- Metrik CV disimpan internal di `backend/artifacts/traits_metrics.json`. Tidak ditampilkan di UI maupun slide.

### G-15 · Kelompok genetik yang belum terwakili **[pitch]**
- **Kelompok yang ada:** Nanay 130, Marañón 54, Iquitos 51, Guiana 16, Contamana 8 pohon referensi.
- **Kelompok yang belum ada:** Criollo, Amelonado, Curaray, Purús, Nacional.
- **Akibat:**

| Pohon | Terbaca sebagai | Seharusnya |
|---|---|---|
| CATONGO | Marañón 53% + Nanay 44% | Amelonado |
| ICS60 | Nanay 45% + Contamana 39% | Trinitario (Criollo × Forastero) |

- Label kelompok referensi masih ditentukan dari awalan nama aksesi. IMC67, yang berlabel Iquitos, terbaca 89% Nanay. Ini perkiraan kasar, belum dari analisis STRUCTURE.
- **Pembaruan 23 Okt (F1/F3):** pohon Bekele yang bernama Criollo/Amelonado dicek dengan genom publik, lalu diberi label kelompok (`registry.GROUP_BY_NAME`):
  - **Criollo (10 pohon):** B97-61 dan BELIZE97*. Semua homozigot, 95–97% identik dengan genom Criollo Cornejo; genom referensi B97-61/B2 cocok 97% dengan pohon B97-61.
  - **Amelonado (3 pohon):** CATONGO, SIC864, Mat1-6. Homozigot, 92–100% identik dengan genom SIC 806; genom Matina 1-6 cocok 96,5% dengan Mat1-6.
  - **MATINA1 di Bekele tidak dipakai:** heterozigot 0,39, cocok hanya 48% dengan genom Matina 1-6, dan terbaca Iquitos 52%. Kemungkinan salah label di bank gen.
  - **Genom "CRIOLLO 21" (Nestlé) tidak dipakai:** lebih mirip Amelonado (0,83) daripada Criollo (0,63); nama lokal, bukan kelompok.
  - Hasil sekarang: CATONGO → Amelonado 100%; ICS1 → Amelonado 66% + Criollo 34%; ICS60 → Criollo 52% + Amelonado 47%. Trinitario terbaca benar sebagai campuran Criollo × Amelonado (ada test-nya).
  - Angka ±82% penempatan kelompok murni di bawah diukur dengan 5 kelompok lama, belum diukur ulang.
- **Untuk pitch:** contoh komposisi dengan Criollo dan Amelonado kini **bisa dihasilkan** dari data publik. Curaray, Purús, dan Nacional masih rencana.
- **Kabar baik:** penempatan ke kelompok murni ±82% benar dan tetap ±82% dengan hanya 48 SNP panel, jadi sampel lapangan pun bisa diperkirakan kasar.

### G-16 · Sinonim di registri
- **Reproduksi:** POST `/api/clones` dengan sidik jari ICS60 dan nama baru.
- **Dampak:** sebelum ditambal, sampel ICS60 di batch lain berikutnya "ditemukan sebagai" klon tiruan itu.
- **Tambalan:** tolak bila sama dengan referensi yang ada (≤ 2 SNP berbeda), kecuali `allow_synonym`.
- **Catatan:** kerabat sangat dekat tetap boleh sebagai entri terpisah, misalnya ICS60 vs ICS45/ICS48 (5 dari 47 SNP panel berbeda, ±5% genome-wide). Uji identitas tetap memisahkan mereka: bibit ICS45 yang diklaim ICS60 divonis OFF-TYPE 99%.

### G-18 · Skor risiko tidak membedakan setelah batch pertama
- **Reproduksi:** satu batch simulasi. Kolaka (7/35 bermasalah) dan Luwu Utara (1/18) sama-sama "Sedang" dan sama-sama 59 bibit.
- **Penyebab:**
  - Hanya ada 3 tingkat, masing-masing dengan satu angka sampel.
  - Bobot off-type terlalu kecil.
  - Test lama lolos hanya karena database test berisi banyak batch.
- **Tambalan:**
  - Bobot off-type dinaikkan (×250, maks. 70).
  - Laju yang harus tertangkap kini kontinu, 10% → 2% mengikuti skor.
  - **Hasil:** Kolaka → Tinggi, 52 bibit. Luwu Utara → Sedang, 39 bibit. Penyedia bersih dengan riwayat panjang → Rendah, 31 bibit.
  - Ada test untuk kasus satu batch.

## T14 · Skenario sulit (`tests/test_scenarios.py`)
Satu test per skenario. Semua **gagal** sebelum T15. Reproduksi: `uv run pytest tests/test_scenarios.py`.

| Skenario | Perilaku sebelum ditambal |
|---|---|
| Geser satu sumur (G-20) | 40 sampel bergeser genotipe. Hasilnya 33 OFF-TYPE palsu, kontrol positif tetap COCOK karena sumurnya tidak ikut bergeser. Petugas akan menebang pohon yang benar. |
| Strand flip (G-21) | 6 SNP dilaporkan A↔T, C↔G. Hasilnya 55 TIDAK DIKENAL. Kontrol positif ikut gagal (bagus), tetapi sistem tidak menyebut penyebabnya. |
| Titik koma (G-22) | Seluruh baris terbaca satu kolom, lalu muncul pesan "Tidak ada satu pun SNP panel". |
| ID ditulis ulang (G-23) | 90 ID tidak cocok. Peringatannya jelas, tetapi tidak ada yang dianalisis. |
| .xlsx (G-24) | "File bukan teks CSV". |
| Panel sebagian (G-25) | 30/48 SNP dikirim. Call rate dihitung terhadap 48, jadi semua UJI ULANG. Dengan 45/48 juga berisiko. |

Skenario dari rencana yang **sudah tertangani** saat membangun:

| Skenario | Penanganan |
|---|---|
| Panel lain sama sekali | Ditolak dengan pesan jelas |
| Kontrol tidak ada | Muncul peringatan |
| ID duplikat | Ditolak, baik di data lapangan, file lab, maupun halaman lapangan |
| Klon belum di registri | G-05 |
| Sinonim | G-16 |
| Kerabat dekat | G-17 |
| Batang bawah vs tidak dikenal | G-10 |
| Lot terlalu kecil | G-11 |
| GPS kosong | Ikon peringatan di hasil dan laporan |
| File rusak | 400 dengan pesan |

## T15 · Tambalan (semua dengan test regresi; `uv run pytest` → 35 lolos)

| Temuan | Tambalan | Test |
|---|---|---|
| G-20 Geser sumur | Setelah analisis, sampel bermasalah diuji terhadap klaim tetangganya di urutan plate. Rangkaian ≥ 3 yang COCOK dengan klaim tetangga memunculkan spanduk merah di Hasil dan berita acara: "jangan tindak lanjuti". Hasil di 20 batch simulasi: geser 20 sumur tertangkap 20/20, batch bersih tidak memicu alarm (0/20). Hit yang terisolasi sengaja diabaikan, karena di kebun pohon salah tanam memang sering berupa klon baris sebelah. | `test_plate_shift_is_flagged` |
| G-21 Strand flip | Genotipe dengan alel yang tidak dimiliki SNP itu, tetapi komplemennya cocok, dibalik otomatis dan dilaporkan. SNP palindromik (A/T, C/G) tidak bisa dicek dengan cara ini. Untuk itu diandalkan kontrol positif (yang memang menangkapnya); usulan jangka panjang: buang SNP palindromik dari panel v2. | `test_strand_flip_is_corrected` |
| G-22/G-24 Format file | Pemisah dideteksi dari baris judul (`,` `;` tab), dan `.xlsx` dibaca dari sheet pertama. | `test_semicolon_csv_from_excel`, `test_xlsx_lab_file` |
| G-23 ID ditulis ulang | ID lab dicocokkan setelah menyamakan huruf besar/kecil dan nol di depan angka, hanya bila hasilnya unik. Peringatan menampilkan contoh pemetaan. | `test_lab_rewrote_sample_ids` |
| G-25/G-01 Panel sebagian | Vonis memakai SNP panel yang benar-benar dikirim lab. Bila kurang dari `MIN_COMPARED + (1 − MIN_CALL_RATE) × 48` = 38 SNP, batch ditolak dengan pesan "Lab hanya mengirim 30 dari 48 SNP panel…". | `test_lab_sent_partial_panel` |
| G-08 Ekor error lab | TIDAK DIKENAL yang hanya ≤ 2 beda di atas batas diberi catatan "uji ulang sebelum pohon diganti". | `test_just_past_lab_error_limit_suggests_rerun` |
| G-12 Tanpa sinyal | Sampel yang gagal terkirim karena jaringan disimpan di perangkat dan dikirim otomatis saat online. Sampel yang ditolak server (mis. ID ganda) ditampilkan. Diuji di browser dengan emulasi offline. Ditemukan juga bahwa react-query **menahan mutasi saat offline hanya di memori** (hilang bila halaman dimuat ulang), sehingga diset `networkMode: 'always'`. | manual (browser) |
| G-13 Salah ketik klaim | Bila klaim tidak ada di registri, tombol simpan meminta ketukan kedua. | manual (browser) |

## Yang masih terbuka (perlu keputusan tim, bukan kode)
- **G-04** Referensi satu pohon: perlu kesepakatan dengan ICCRI/pemilik klon tentang referensi multi-ramet.
- **G-05** Referensi klon Indonesia: ketergantungan bisnis utama di hari pertama.
- **G-09** Plot tambahan di benchmark Kolombia: perlu dicek kurator.
- **G-14 / G-15** Klaim AI di deck perlu disesuaikan (lihat masing-masing).
- **Autentikasi:** peran masih dipilih sendiri, dan jejak audit mencatat peran yang diklaim. Perlu login sungguhan sebelum dipakai di luar uji coba.

## Fitur lanjutan dari data terbuka (23 Okt 2026)
Laporan kelayakan per fitur ada di `tasks/feasibility/`:
- F1/F3 sidik jari dari genom publik;
- F2 vonis berdampak;
- F4 Paspor Bibit EUDR;
- F5 validasi pada data nyata;
- F6/F7 campuran klon dan lokasi.

Temuan G-26–G-30 berasal dari pembangunan fitur-fitur itu.
