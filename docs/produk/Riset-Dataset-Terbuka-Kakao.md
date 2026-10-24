# Riset Dataset Terbuka Kakao untuk Memperdalam CacaoID

*23 Okt 2026. Disusun dari tiga penelusuran paralel: genetik, sifat/uji klon, serta lapangan/geospasial. Sumber kunci dicek ulang langsung.*

**Label:** ✅ halaman/file dibuka dan dikonfirmasi · 🟡 sebagian · ❓ belum terkonfirmasi.

---

## 0. Ringkasan

1. **Kelemahan terbesar CacaoID (belum ada sidik jari referensi klon Indonesia) bisa ditambal sebagian dengan data genom publik.**
   - Data genom mentah (WGS) terbuka tersedia untuk **PBC 123 = Sulawesi 1** dari **dua sumber independen** (Mars dan Nestlé), **BR 25 = Sulawesi 2**, dan seleksi lokal Sulawesi **M01, M02, M04–M07**.
   - Juga tersedia genom pohon Sulawesi milik Mars ("clone 26") beserta kedua tetuanya.
   - Dari data mentah itu, genotipe di 48 SNP panel kita bisa dibaca. ✅
2. **Data pohon referensi untuk semua 10 kelompok genetik juga ada** (Criollo, Amelonado, Nacional, Curaray, Purús, dll.). Ini menambal kelemahan asal-usul (G-15). ✅
3. **Data sifat klon Indonesia ada, tetapi hanya dalam tabel PDF**: skor VSD, hasil, mutu biji, dan penggerek buah (PBK) dari laporan ACIAR dan Pelita Perkebunan. Cukup untuk membuat vonis yang menyebut **dampak** (rupiah dan risiko VSD), bukan sekadar "salah klon". ✅
4. **EUDR** (aturan bebas deforestasi Uni Eropa) berlaku **30 Des 2026**. ±20% ekspor produk kakao Indonesia ke Uni Eropa. Data cek deforestasi terbuka sudah ada (JRC GFC2020, Whisp FAO). Ini membuka produk "**Paspor Bibit**" untuk eksportir. ✅/🟡
5. **Bukti pitch baru:** dalam proyek internasional CFC/ICCO/IPGRI, uji DNA menemukan **salah label pada 17 dari 35 klon (33 dari 101 pohon)** yang dipakai sebagai sumber entres uji klon internasional. ✅ *(dicek langsung ke PDF laporannya)*
6. **Yang tetap tidak ada secara publik:**
   - genotipe MCC 01/02, ICCRI 03/04/06H/08H, KEE 2, TSH 858;
   - foto penyakit kakao dari Indonesia;
   - data sebaran hama/penyakit Indonesia yang memadai.

---

## 1. Dataset genetik dan genom

| # | Dataset | Isi yang relevan | Lisensi | Akses | Status |
|---|---|---|---|---|---|
| G1 | **Cornejo dkk. 2018 – WGS 200 aksesi** (Mars/Stanford), [PRJNA486011](https://www.ebi.ac.uk/ena/browser/view/PRJNA486011) | **PBC123** (SRR7774164), **BR25** (SRR7774302), **M01, M02, M04, M05, M06, M07**, mvP30, mvT85, K82, KA2 (PNG), ICS 1/6/39/40/43/60/61/95, TSH1188/516, CCN51/10, Catongo, SIC806, SIAL 70/84/169, Matina, Criollo. ±4–19 Gbp per sampel. VCF di EVA hanya berisi situs, tanpa genotipe per sampel | Arsip publik INSDC; paper CC BY | FASTQ, tanpa login | ✅ |
| G2 | **Todd dkk. 2025 – WGS koleksi inti Nestlé**, [PRJEB75153](https://www.ebi.ac.uk/ena/browser/view/PRJEB75153) | **PBC_123** (ERR13166480, sumber kedua), **DR_1**, PNG_10/87/197/340, SCA 6/9/10/12, TSH 516/565/774, ICS, CCN_51, Criollo 21/22, Matina 1-6, GHANA_RED. ±6–7 Gbp per sampel | INSDC; paper CC BY-NC-ND | FASTQ, tanpa login | ✅ |
| G3 | **Pangenom CIRAD** (Argout dkk. 2023), [PRJNA880462](https://www.ebi.ac.uk/ena/browser/view/PRJNA880462) | 188 run WGS: Criollo B97-61/B2, Matina, Catongo, EET (Nacional), LCTEEN (Curaray/Purús/Nanay), pohon liar Ekuador | INSDC; preprint CC BY | FASTQ | ✅ (file pan-gen tidak ditemukan) |
| G4 | **Genom "clone 26" Sulawesi + tetuanya** (Tobias dkk. 2024, Univ. Sydney/Mars), [PRJNA1083235](https://www.ncbi.nlm.nih.gov/bioproject/PRJNA1083235) · [paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC11628906) | Genom terfase (GCA_041222385.1 / GCA_041222375.1); reads tetua "S1" (induk tahan VSD) dan RUQ 1347. QTL VSD di kromosom 3/8/9 disebut, tetapi data markanya tidak publik. *"S1" belum pasti = Sulawesi 1* | INSDC; paper CC BY-NC-ND | FASTA/FASTQ | ✅ |
| G5 | **Genom referensi NCBI (18)**, [taxon 3641](https://www.ncbi.nlm.nih.gov/datasets/genome/?taxon=3641) | Criollo v2 (GCF_000208745.1), Matina 1-6, **CCN51 (2025)**, ICS1, SCA6, IMC67, POUND7 | INSDC | FASTA/GFF | ✅ |
| G6 | **Harmonisasi marka USDA** (Ahn dkk. 2026), [Zenodo 22755806](https://doi.org/10.5281/zenodo.22755806) | ID marka TcSNP + posisi di Criollo v2. Kunci untuk mencari letak 48 SNP panel di genom | CC BY 4.0 | XLSX 137 MB | 🟡 (metadata) |
| G7 | **Motamayor 2008 Tabel S3**, [PLOS ONE](https://doi.org/10.1371/journal.pone.0003311) | 952 klon dengan label kelompok genetik + koefisien keanggotaan | CC0 | XLS | ✅ |
| G8 | **Lanaud dkk. 2017 – lokus self-incompatibility**, [PMC5853246](https://pmc.ncbi.nlm.nih.gov/articles/PMC5853246) | Primer SSR di lokus CH1/CH4, profil ±77 klon, peluang self-compatible per genotipe. Belum ada klon Indonesia | CC BY | PDF | ✅ |
| G9 | **GWAS busuk buah CATIE/Nestlé** (Plant Genome 2026), [Dryad](https://doi.org/10.5061/dryad.0rxwdbsg4) | **495 pohon F1 dari 8 silangan dengan tetua diketahui** × 103.479 SNP + fenotipe busuk buah multi-tahun | **CC0** | CSV 104 MB | 🟡 (daftar file) |
| G10 | Peru 390 pohon × 186 SNP ([PLOS ONE 2026](https://doi.org/10.1371/journal.pone.0351690)); Puerto Rico 173 aksesi hasil/penyakit ([BMC Plant Biol 2025](https://doi.org/10.1186/s12870-025-07128-y)) | Uji ketahanan model asal-usul; tambahan kecil data hasil | CC BY | XLSX | ✅ |
| G11 | CacaoCipher 32-SNP (USDA, [Hortic Res 2026](https://doi.org/10.1093/hr/uhag106)) | Panel barcode 32 SNP | ❓ | – | 🟡 |
| G12 | Dinarti dkk. 2015, [Breeding Science](https://www.jstage.jst.go.jp/article/jsbbs/65/5/65_438/_article/-char/en) | 53 seleksi petani Sulawesi × 15 SSR. Data mentah belum terlihat | Akses bebas | – | 🟡 |

**Tidak ditemukan:**
- genotipe publik MCC 01/02, ICCRI 03/04/06H/08H, KEE 2, TSH 858;
- matriks genotipe per sampel untuk G1/G2/G3 (harus dipanggil sendiri dari reads);
- marka QTL penggerek buah;
- GWAS kadmium.

ICGD dan cacaogenomedb.org tidak bisa diunduh massal.

---

## 2. Dataset sifat, uji klon, dan agro-iklim

| # | Dataset | Isi yang relevan untuk Indonesia | Lisensi | Status |
|---|---|---|---|---|
| T1 | **CFC/ICCO/IPGRI Final Report 2006** (Eskes & Efron), [CGSpace](https://cgspace.cgiar.org/items/0de5c6b4-d1b8-4658-be6b-cf764c90f3f3) | **17/35 klon salah label (33/101 pohon)**. Indeks VSD Malaysia untuk 100 klon termasuk PBC123, BR25. Kadar lemak 110 aksesi. Indonesia tidak ikut uji | Non-komersial dengan atribusi | ✅ |
| T2 | CFC Tech. Paper 59 (2011), [ICCO](https://www.icco.org/wp-content/uploads/2019/07/CFC-Technical-paper-59_FINAL_300511-1.pdf) | Uji VSD Malaysia dengan PBC 123/BR 25 sebagai pembanding | Sama | ✅ |
| T3 | **ACIAR SMAR/2005/074**, [PDF](https://www.aciar.gov.au/sites/default/files/2022-09/SMAR-2005-074-final-report.pdf) | **T3** hasil 7 klon Pinrang (sudah di slide 3). **T4** mutu biji per klon × lokasi. **T5** PBK termasuk BR25, ICCRI 04. **T7** skor VSD 23 genotipe (Sulawesi 1 = "Resistant"). **T8–9** VSD pada keturunan silangan (KEE2×PBC123, BR25×ARDACIAR10) | © ACIAR: pakai fakta + sitasi, jangan salin tabel | ✅ |
| T4 | **ACIAR HORT/2010/011**, [PDF](https://aciar.gov.au/sites/default/files/project-page-docs/final_report_hort-2010-011.pdf) | Buah per pohon 12 klon × 3 lokasi Sulawesi; VSD × ketinggian (M04, M06, BR25) | © ACIAR | ✅ |
| T5 | **Soesilo dkk. 2015, Pelita Perkebunan 31(3)**, [CCRJ](https://www.ccrjournal.com/index.php/ccrj/article/view/172) | Luwu Utara, 35 kebun: **MCC01 3.682, MCC02 3.132, Sulawesi 1 2.772 kg/ha**; skor PBK/VSD/busuk buah; MCC hanya disarankan untuk agroklimat serupa | CC BY-SA 4.0 | ✅ |
| T6 | Rubiyo dkk. 2020 (Kolaka, 12 klon), [Biodiversitas](https://smujo.id/biodiv/article/view/6665) · Asman dkk. 2021 (**ketahanan VSD ditentukan batang atas, bukan batang bawah**), [doi](https://doi.org/10.1016/j.aoas.2021.02.005) · Anita-Sari dkk. 2023 (citarasa MCC 02, Sulawesi 1/2), [Agronomy](https://www.mdpi.com/2073-4395/13/10/2658) | Data klon Indonesia | Akses terbuka | ✅ (abstrak) |
| T7 | ICGD Reading, [icgd.reading.ac.uk](https://www.icgd.reading.ac.uk/) | 31.500 nama klon, morfologi, penyakit, sidik jari. Terhalang reCAPTCHA; tidak ada unduhan massal | Tidak dinyatakan | 🟡 |
| T8 | **GAEZ v5** (FAO/IIASA), [katalog](https://data.apps.fao.org/catalog/dataset/gaez-v5-master-config) | Kesesuaian lahan kakao + proyeksi iklim 2021–2100; hasil yang bisa dicapai | Kesesuaian CC BY-NC-SA; yield gap CC BY | ✅ |
| T9 | WorldClim 2.1 · CHIRPS (pakai v3; v2 berhenti Des 2026) · SoilGrids 2.0 · NASA POWER (API tanpa kunci) · SPAM 2020 | Iklim, hujan, tanah, luas/produksi grid | Domain publik / CC BY | ✅ |
| T10 | **BPS & Ditjenbun** | Sulteng Dalam Angka 2025: luas & produksi kakao **per kabupaten**. Statistik Unggulan 2020–2022: per provinsi × TBM/TM/TTM (tanaman tua/rusak = kebutuhan peremajaan) | Tidak dinyatakan | ✅ |

**Catatan angka produktivitas:**
- FAOSTAT 2024: **456 kg/ha** (produksi dibagi **seluruh** luas tanam).
- Deck memakai **714 kg/ha** (Ditjenbun, per luas **tanaman menghasilkan**).

Keduanya benar, tetapi jangan dicampur.

---

## 3. Dataset lapangan, geospasial, regulasi, citra

| # | Dataset | Isi | Lisensi | Status |
|---|---|---|---|---|
| L1 | **EUDR** | Berlaku **30 Des 2026** (operator besar/menengah) dan **30 Jun 2027** (mikro/kecil). Wajib titik GPS ≥6 desimal (poligon bila >4 ha). Tanggal batas 31 Des 2020; format GeoJSON. Indonesia berstatus "standard risk" | – | 🟡 (sebagian dari sumber sekunder) |
| L2 | **UN Comtrade 2024** | Ekspor HS18 Indonesia USD 2.646 juta, Uni Eropa **±20%** (sebagian besar produk olahan) | Ketentuan PBB | ✅ |
| L3 | **JRC Global Forest Cover 2020 V4**, [JRC](https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/FOREST/GFC2020/) | Peta hutan/non-hutan 10 m tahun 2020 (acuan EUDR, tidak mengikat) | CC BY 4.0 | ✅ |
| L4 | **Hansen Global Forest Change v1.13**, [UMD](https://storage.googleapis.com/earthenginepartners-hansen/GFC-2025-v1.13/download.html) | Kehilangan tutupan pohon tahunan 2001–2025, 30 m | CC BY 4.0 | ✅ |
| L5 | **Whisp** (FAO), [whisp.openforis.org](https://whisp.openforis.org) | Masukan GeoJSON kebun, keluaran risiko EUDR. Belum ada lapisan khusus Indonesia | MIT | ✅ |
| L6 | Peta probabilitas kakao 2026a (Google/Forest Data Partnership, GEE) | 10 m, mencakup Sulawesi; belum peer-review dan belum divalidasi untuk Sulawesi | CC BY 4.0 | ✅ (perlu akun GEE) |
| L7 | Trase Indonesia cocoa, [trase.earth](https://trase.earth/open-data/datasets/supply-chains-indonesia-cocoa) | Eksportir dan tujuan, **hanya 2020** | CC BY 4.0 | ✅ |
| L8 | GBIF Indonesia | PBK 9 catatan, VSD 27, *P. palmivora* 142 (1 berkoordinat). **Terlalu sedikit** untuk peta risiko | Per catatan | ✅ |
| L9 | Citra penyakit buah | Kaggle "Cacao Diseases" (Davao, Filipina, ±4.300 foto: busuk buah, PBK, sehat, CC BY-SA). Set lain dari Peru, Kolombia, Pantai Gading (CC BY). **Tidak ada dari Indonesia**, dan tidak ada foto daun VSD | Beragam | ✅ |

---

## 4. Usulan fitur yang lebih dalam (urutan prioritas untuk menang)

Kriteria urutan:
- **kedalaman genomik** (track hackathon);
- **dampak ketahanan pangan**;
- menambal kelemahan yang sudah kita akui (GAPS);
- **kelayakan** dibangun.

### F1 · Registri Referensi dari Genom Publik ("Genome-to-Fingerprint") ⭐ fitur utama baru
- **Apa:** pipeline dari data genom mentah ke sidik jari 48 SNP:
  1. posisi SNP panel diambil dari G6;
  2. potongan DNA di sekitar tiap SNP diambil dari genom Criollo v2 (G5);
  3. alel dihitung langsung dari reads (penghitungan k-mer);
  4. hasilnya genotipe.
- **Referensi baru:**
  - Sulawesi 1 (PBC123, **dua sumber independen**);
  - Sulawesi 2 (BR25);
  - seleksi lokal Sulawesi M01–M07;
  - trio Mars Sulawesi (S1, RUQ 1347, clone 26);
  - DR 1 dan klon PNG.
- **Lencana asal-usul data:**
  - "terverifikasi" bila ≥2 sumber sepakat (menambal G-04);
  - "satu sumber" bila hanya satu.
- **Validasi silang:** klon yang ada di data array Bekele dan di data genom (ICS60, TSH1188, SCA6, CCN51, ICS95) dibandingkan untuk mengukur akurasi pipeline (angka internal, tidak masuk slide).
- **Nilai demo:** "Sidik jari Sulawesi 1 dibangun dari dua lab genom berbeda, dan keduanya sepakat."
- **Risiko:**
  - nama sampel belum tentu sama dengan klon rilis;
  - orientasi alel;
  - cakupan 6–9× membuat heterozigot kadang meleset (pakai beberapa k-mer per alel).
  - MCC 01/02 dan hibrida ICCRI **tetap** butuh ICCRI/Mars, tetapi permintaan ke mitra kini lebih kecil.

### F2 · Vonis yang menyebut dampak (risiko VSD + rupiah)
- **Apa:** setiap vonis diterjemahkan ke konsekuensi:
  - **OFF-TYPE:** selisih hasil (T3, T5) dan kelas ketahanan VSD/PBK (T1, T3-T7) antara klon dibayar dan klon diterima;
  - **BATANG BAWAH:** karena ketahanan VSD ditentukan batang atas (T6, Asman 2021), pohon kehilangan ketahanan klon unggulnya;
  - **kontaminasi lot hibrida:** perkiraan porsi bibit rentan VSD (T3 T8–9);
  - **per kabupaten:** off-type % × luas peremajaan × selisih hasil × harga biji = rupiah yang dipertaruhkan (T10).
- **Nilai:** juri ketahanan pangan langsung melihat "kenapa ini penting", dan Ditjenbun punya angka untuk anggaran.
- **Risiko:**
  - bukti VSD saling bertentangan (Sulawesi 1 "tahan" di ACIAR, "rentan" di makalah lain), jadi tampilkan rentang dan sumber;
  - hasil uji klon adalah kondisi terbaik.

### F3 · Asal-usul v2: 10 kelompok genetik lengkap (keanekaragaman hayati)
- **Apa:** pohon referensi nyata untuk Criollo, Amelonado, Nacional, Curaray, Purús (G1, G3), diberi label dari Motamayor S3 (G7, keanggotaan ≥0,8). Pipeline-nya sama dengan F1.
- **Nilai:** menambal G-15. Contoh di deck ("Nanay · Amelonado · Criollo") jadi **benar-benar bisa dihasilkan**. Sangat cocok dengan tema *Biodiversity Genomics*.
- **Risiko:** untuk sampel lapangan dengan 48 SNP, hasilnya tetap kasar. Klon registri yang punya genom lengkap jauh lebih tepat.

### F4 · Paspor Bibit (siap EUDR)
- **Apa:** identitas klon terverifikasi DNA + QR penyaluran + titik/poligon kebun, lalu dicek ke GFC2020/Hansen/Whisp (L3–L5). Hasilnya sertifikat ditambah **GeoJSON siap EUDR**.
- **Nilai:**
  - jalur pendapatan dari **eksportir/pengolah** (bukan hanya pemerintah), menjelang 30 Des 2026;
  - Ditjenbun bisa menunjukkan bibit program tidak ditanam di lahan bekas hutan.
- **Kaitan genomik:** setiap kebun membawa identitas genotipe, membentuk registri genotipe × lingkungan yang tidak dimiliki pesaing.
- **Risiko:**
  - kebun agroforestri kakao bisa terbaca "hutan 2020";
  - bibit sendiri tidak masuk lingkup EUDR (kaitannya lewat kebun tempat panen nanti).

### F5 · Validasi pada data nyata (kredibilitas, bukan menu baru)
- **Apa:**
  - uji engine parentage dan kontaminasi pada **495 pohon F1 nyata dengan tetua diketahui** (G9, CC0), bukan hanya simulasi;
  - trio Sulawesi clone 26 sebagai cek Indonesia;
  - benchmark Kolombia sudah ada.
- **Nilai:** menjawab pertanyaan juri "ini cuma simulasi?". Sesuai aturan tim, **tidak** menampilkan angka akurasi di slide; cukup "divalidasi pada data nyata".

### F6 · Penasihat campuran klon (kompatibilitas penyerbukan)
- **Apa:** memprediksi klon self-incompatible dari lokus CH1/CH4 (G8), lalu menyarankan campuran klon yang saling menyerbuki untuk blok tanam.
- **Risiko:** marka aslinya SSR, sehingga tidak mudah dibaca dari reads pendek dan perlu validasi lab. **Demo saja** untuk klon dengan profil yang diketahui.

### F7 · "Klon mana untuk lokasi mana" (analog agroklimat)
- **Apa:** mencocokkan iklim/tanah lokasi (T8, T9) ke lokasi uji klon (T3–T5). T5 sendiri menyarankan MCC hanya untuk agroklimat serupa Luwu Utara.
- **Risiko:** data uji sangat sedikit, jadi tampilkan sebagai "bukti yang tersedia", bukan model.

### Tidak diprioritaskan
- **Triase foto penyakit:**
  - tidak ada data Indonesia;
  - bibit di pembibitan belum berbuah;
  - kaitan genomiknya lemah.

---

## 5. Rangkaian yang disarankan

1. **F1 dulu.** Pipeline-nya menjadi fondasi F3 dan F5, dan langsung menambal G-04/G-05 sebagian.
2. **F2.** Kurasi ±30 baris fakta klon × sifat dengan sitasi. Paling cepat terlihat dampaknya oleh juri.
3. **F3.** Memakai ulang pipeline F1.
4. **F4.** Demo dengan kebun contoh di Sulawesi + GFC2020.
5. **F5.** Jalankan engine pada data G9.
6. **F6 dan F7** sebagai demo pendukung.

**Narasi baru:**
> "CacaoID tidak menunggu data: sidik jari Sulawesi 1, Sulawesi 2, dan seleksi lokal Sulawesi kami bangun dari genom publik yang diverifikasi silang, lengkap dengan pohon referensi dari 10 kelompok genetik. Setiap vonis menyebut dampaknya: berapa rupiah dan seberapa rentan VSD. Setiap bibit pulang dengan paspor yang siap untuk pasar Eropa."

---

## 6. Hal yang perlu dicek sebelum dipakai di pitch

| Klaim | Status | Langkah |
|---|---|---|
| Sulawesi 1 = PBC 123 | ✅ (laporan ACIAR menyebutnya beberapa kali) | – |
| Sulawesi 2 = BR 25 | ✅ (Kepmentan 25/2017 Tabel 1, sudah tercatat di Overview) | – |
| Sampel bernama "PBC123"/"BR25" di arsip genom benar klon tersebut | ❓ | Bandingkan kedua sumber PBC123; cek kemiripannya dengan data ACIAR/ICCRI bila ada |
| M01–M07 di data Mars = seleksi M01/M04/M05/M06 di laporan ACIAR | ❓ (kemungkinan besar, karena Mars mitra proyek ACIAR) | Tanyakan ke Mars/ICCRI |
| "S1" di Tobias 2024 = Sulawesi 1 | ❓ | Jangan diklaim |
| Tanggal EUDR dan syarat titik GPS | 🟡 | Baca teks resmi EUR-Lex sebelum masuk slide |
| Tabel ACIAR | © ACIAR | Pakai sebagai fakta + sitasi; jangan menyalin tabel utuh ke produk |

---

## Lampiran: lokasi file unduhan sementara

Di scratchpad sesi ini:
- `cfc/`, `aciar/`, `ditjenbun/`, `bps/`: teks laporan;
- `dl4/mot_s3.xls`, `dl4/lanaud.txt`;
- `dl6/` (Peru, Puerto Rico);
- `runs_*.tsv`, `s_*.tsv` (daftar sampel proyek genom).

Folder scratchpad bersifat sementara. Pindahkan ke `cacaoid-app/data/` bila dipakai.
