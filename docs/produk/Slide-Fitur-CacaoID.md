# Draf Slide: Fitur CacaoID

Draf untuk direview, 23 Okt 2026. Satu bagian `##` = satu slide.

**Label status:**

| Label | Arti |
|---|---|
| 🟢 **Sudah ada** | Sudah jalan di MVP dan diuji pada data publik. **Belum** divalidasi pada data lapangan Indonesia (lihat "Status validasi model" di bawah). |
| 🆕 **Dikembangkan** | Fitur baru, dibangun selama hackathon |
| 🗺️ **Roadmap** | Rencana 12 bulan |
| 🤖 **AI** | Fitur yang memakai model terlatih dari data. Selalu disertai keterangan dataset. |

Slide 3–6 sengaja **tanpa** badge AI. Vonis identitas, QC lab, dan parentage memakai statistik yang bisa diaudit, sesuai slide 16 deck utama ("Sengaja tanpa AI").

**Aturan yang dipakai di draf ini:**
- Angka internal (akurasi parentage dan pipeline genom) **tidak** ditaruh di slide, sesuai aturan tim.
- Model busuk buah sudah divalidasi (24 Okt), dan slide F01, F06, F07, F08, serta F10 di Pencil sudah disesuaikan.
- Mockup kartu memakai `[nilai]`, bukan angka karangan.

**Status validasi model** (24 Okt 2026). Tiga tingkat: (1) jalan di MVP, (2) teruji pada data publik, (3) tervalidasi pada data Indonesia dan siap operasional. **Belum ada model yang mencapai tingkat 3**; itu tujuan pilot bulan 3–6.

| Model | Jenis | Tingkat | Bukti | Yang kurang sebelum dipakai operasional |
|---|---|---|---|---|
| Vonis identitas | Statistik | 2 | Simulasi 38 SNP: recall 100%, presisi 99,8%. Data nyata Kolombia: 99% plot salah label ditemukan ulang | Referensi resmi klon Indonesia dari ICCRI (G-05); referensi 3–5 ramet (G-04); validasi panel di lab Indonesia |
| Batang bawah, asal biji, lot hibrida | Statistik | 2 | Data nyata 495 F1: simulasi ternyata terlalu optimistis, sudah ditambal (G-26, G-27) | Panel parentage khusus tetua kebun benih |
| Prediksi komponen hasil 🤖 | AI | 2 ✅ divalidasi ulang | CV bersarang r 0,51–0,66; mengalahkan baseline kerabat; interval 80% jujur (82–86%); arah benar pada 4 klon Indonesia independen (Spearman 0,8) | Populasi pemuliaan Indonesia; butuh genome-wide (G-14) |
| Asal-usul 🤖 | AI | 2 (perkiraan) ✅ divalidasi ulang | Kelompok benar 78%; "yakin tapi salah" 6–8% (terutama Nanay) | Curaray, Purús, Nacional belum ada referensi (G-15) |
| Busuk buah: **ranking semaian dalam silangan** 🤖 | AI | **2 ✅ baru** | Famili baru r 0,40; simpan 25% teratas → busuk buah −14%, 71% terpilih benar lebih tahan; tetap 0,41 bila satu tetua baru | Semaian & *P. palmivora* Indonesia (data mitra) |
| Busuk buah per klon / pasangan tetua 🤖 | AI | **❌ gagal validasi** | Urutan 4 tetua baru terbalik (Spearman −0,4) | Populasi latih dengan banyak tetua. **Dicabut dari aplikasi**; masuk roadmap |
| Profil sifat 🤖 | Uji lapang + AI komponen hasil | 2 | Tanpa busuk buah (lihat baris di atas) | – |
| Uji refleks 🤖 | Komponen hasil + asal-usul dari genome-wide | 2 | Memakai dua model yang tervalidasi untuk pohon tunggal | Lab genome-wide dalam negeri |
| Skor risiko penyedia | Aturan (beta) | 1 | – | Bukan AI; butuh riwayat audit dari pilot |

Detail lengkap: `cacaoid-app/tasks/VALIDASI_MODEL.md`.

**Padanan dengan slide di Pencil (`cacaoid.pen`, frame berawalan "F"):**

| Pencil | Markdown | Fitur | Jenis |
|---|---|---|---|
| F01 | Slide 1 | Judul | Sampul |
| F02 | Slide 3 | Ambil sampel di lapangan | Inti |
| F03 | Slide 4 | QC data lab | Inti |
| F04 | Slide 5 | Vonis identitas | Inti |
| F05 | Slide 6 | Batang bawah, asal biji, lot hibrida | Inti |
| F06 | Slide 7 | Profil sifat di setiap vonis 🤖 | Pembeda baru |
| F07 | Slide 8 | AI ranking semaian busuk buah 🤖 | Pembeda baru |
| F08 | Slide 9 | Uji refleks 🤖 | Pembeda baru |
| F09 | Slide 9a | Prediksi komponen hasil 🤖 | Pembeda (sudah ada) |
| F10 | Slide 9b | Penasihat campuran klon | Inti pendukung (bukan AI) |
| F11 | Slide 10 (bagian asal-usul) | Asal-usul kelompok genetik 🤖 | Pembeda (sudah ada) |
| – | Slide 10 (registri), 11, 12 | Registri, keputusan & bukti, dasbor | **Inti, belum dibuat di Pencil** |
| F12 | Slide 16 | Harga dan biaya per sampel | Bisnis |
| F13 | Slide 17 | Roadmap 12 bulan: milestone, mitra, dana | Bisnis |
| F14 | Slide 18 | Satu cerita demo + alur pitch 6 menit | Pitch |

**Untuk pitch 6 menit**, ikuti satu cerita di slide 18 (F14): F02 → F03 → F04 → F06 → F05, lalu F12 (harga) dan F13 (roadmap). Slide lain jadi cadangan atau lampiran tanya jawab. Slide 2 (diagram alur) sudah dihapus atas permintaan.

---

## Slide 1 · Judul

**CacaoID**
Verifikasi genetik bibit kakao: identitas klon dan profil sifatnya dalam satu hasil uji.

*Visual:* logo + foto bibit kakao berlabel QR.

---

## Slide 3 · Ambil sampel di lapangan 🟢 Sudah ada

- QR per pohon induk atau lot, dengan GPS dan klon yang diklaim.
- **Bekerja tanpa sinyal:** sampel tersimpan di perangkat dan terkirim otomatis saat online.
- **Kalkulator jumlah sampel:** minimal 59 bibit per lot hibrida untuk memastikan kontaminasi ≤5% (keyakinan 95%).
- Menempel pada pemeriksaan visual PBT yang memang sudah wajib, tanpa kunjungan tambahan.

*Visual:* tangkapan layar halaman Lapangan di ponsel.

---

## Slide 4 · QC data lab otomatis 🟢 Sudah ada

Kesalahan lab yang biasa terjadi ditangkap sebelum menjadi vonis yang salah:
- sampel **tergeser satu sumur** di plate (tanpa deteksi ini, banyak OFF-TYPE palsu muncul walaupun kontrol lolos);
- **untai DNA terbalik** dikoreksi otomatis;
- kontrol plate positif dan negatif wajib;
- file CSV bertitik koma (Excel Indonesia), .xlsx, dan ID sampel yang ditulis ulang lab tetap terbaca;
- lab mengirim panel tidak lengkap → pesan jelas, bukan vonis salah.

*Catatan pembicara:* "Fitur-fitur ini lahir dari uji skenario kesalahan nyata saat kami membangun MVP."

---

## Slide 5 · Vonis identitas klon 🟢 Sudah ada

- **Lima vonis + status QC:** COCOK · OFF-TYPE · BATANG BAWAH · TIDAK DIKENAL · BELUM ADA REFERENSI, ditambah UJI ULANG.
- Rasio likelihood dengan model error lab, jadi setiap vonis punya tingkat keyakinan dan penjelasan "bagaimana vonis diambil".
- **Bukti:**
  - Panel 38 SNP mendeteksi bibit salah klon dengan recall 100% dan presisi 99,8% pada error genotipe 2% (simulasi, data Bekele 2022, CC BY).
  - Pada data nyata 4.653 pohon bank gen Kolombia, engine menemukan ulang 99% plot salah label versi paper.

*Visual:* kartu detail sampel OFF-TYPE + perbandingan sidik jari.

---

## Slide 6 · Batang bawah, asal biji, dan lot hibrida 🟢 Sudah ada

- **Batang bawah mengambil alih:** diuji terhadap silangan batang bawah resmi yang terdaftar.
- **Asal biji:** apakah pohon tak dikenal adalah anak dari klon yang tercatat di kebun itu.
- **Lot benih hibrida:** estimasi % kontaminasi serbuk sari. Vonisnya LOT DITAHAN atau TAMBAH SAMPEL.
- Divalidasi pada **495 pohon F1 nyata dengan tetua diketahui** (CATIE/Nestlé 2026, CC0), bukan hanya simulasi.

*Catatan pembicara:* "Data nyata membuat kami menambah vonis TAMBAH SAMPEL, supaya lot yang bersih tidak ikut ditahan."

---

## Slide 7 · ⭐ Profil sifat di setiap vonis 🆕 Dikembangkan · 🤖 AI

**Dataset:**
- *Uji lapang:* 526 fakta sifat klon dari 7 sumber (ACIAR SMAR/2005/074 & HORT/2010/011, leaflet klon ICCRI, Susilo dkk. 2015, Rubiyo dkk. 2020, CFC/ICCO/IPGRI 2006, Asman dkk. 2021).
- *Prediksi AI:* hanya komponen hasil, Bekele dkk. 2022 (346 aksesi bergenotipe + berfenotipe; CC BY 4.0). Busuk buah **per klon** tidak diprediksi karena gagal validasi (lampiran: uji pasangan tetua).

**Identitas dulu, lalu ambil profil lengkap klon itu dari registri.** Panel 48 SNP cukup untuk mengenali klon, dan registri menyimpan data sifat klon tersebut.

| Vonis | Dari mana profil sifatnya |
|---|---|
| COCOK / OFF-TYPE | Data uji lapang klon yang terdeteksi + prediksi AI komponen hasil dari genotipe registri |
| BATANG BAWAH | Profil batang bawah: "ketahanan VSD klon unggul hilang, karena VSD ditentukan batang atas" |
| TIDAK DIKENAL | Uji refleks (slide 9) |

Setiap nilai diberi label sumber (**Uji lapang** atau **Prediksi AI**) dan tingkat keyakinan. Sumber yang bertentangan ditandai ⚠ dan tidak dipilih salah satu.

*Mockup kartu (data nyata):* diklaim **MCC 01**, terdeteksi **Sulawesi 1**.

| Sifat | MCC 01 | Sulawesi 1 | Sumber |
|---|---|---|---|
| Hasil (potensi) | 3.672 kg/ha | 2.772 kg/ha (−25%) | Uji lapang, Susilo dkk. 2015 (uji sama; selisih tidak signifikan) |
| Busuk buah | 1,15% buah | 2,58% buah | Uji lapang, Susilo dkk. 2015 |
| Bobot biji | 1,61 g | 1,10 g | Uji lapang, Susilo dkk. 2015 |
| Ukuran biji | 2,32 × 1,07 cm | 2,19 × 1,01 cm | Prediksi AI (komponen hasil) |

---

## Slide 8 · ⭐ AI meranking semaian menurut busuk buah 🆕 Dikembangkan · 🤖 AI

**Dataset:** Jacquotte dkk. 2026, *Plant Genome* (CATIE/Nestlé/CIRAD), Dryad doi:10.5061/dryad.0rxwdbsg4, lisensi **CC0**. Isinya 470 pohon F1 berfenotipe dari 8 silangan, dengan fenotipe busuk buah multi-tahun di Kosta Rika. Model memakai 17.275 marka yang unik di Criollo V2.

- **Masalah:** ketahanan klon baru diketahui setelah evaluasi lapang bertahun-tahun (CATIE: 8 tahun). *P. palmivora* menghilangkan 20–30% buah secara global. Ditjenbun menyebut busuk buah sebagai "penghambat serius".
- **Kegunaan yang tervalidasi:** meranking semaian **dalam satu silangan**, lalu menyimpan 25% teratas untuk uji lapang.
- **Model:** RR-BLUP (setara GBLUP). Setara SVR, lebih baik dari gradient boosting.
- **Validasi:** silangan yang tidak ikut dilatih (leave-one-family-out).
  - Ranking dalam silangan: **r = 0,40**. Tetap 0,41 bila salah satu tetuanya baru bagi model.
  - Simpan 25% teratas: busuk buah **−14%**, dan **71%** semaian terpilih memang lebih tahan (acak: 50%).
- **Batas:**
  - Tidak bisa membandingkan klon atau tetua (gagal validasi; lampiran uji pasangan tetua).
  - Belum diuji pada semaian Indonesia dan *P. palmivora* lokal.
  - Panel 48 SNP tidak cukup (r 0,17); ±2.000 marka sudah cukup.

*Catatan pembicara:* "Kami tidak mengklaim deep learning. Kami menguji model pada silangan yang tidak pernah dilihatnya, dan hanya memakai model untuk hal yang lolos uji itu."

---

## Slide 9 · ⭐ Uji refleks untuk pohon tak dikenal 🆕 Dikembangkan · 🤖 AI

**Dataset:** model komponen hasil (Bekele dkk. 2022, CC BY) dan asal-usul (pohon referensi registri publik, kelompok Motamayor 2008). Keduanya tervalidasi untuk pohon tunggal. Busuk buah tidak dipakai di sini karena belum bisa membandingkan pohon yang tidak sekerabat.

- **Masalah:** mulai 2026, kebun produksi dijadikan sumber entres. Banyak di antaranya seleksi lokal yang belum punya sidik jari referensi (🟡 berita Kontan, Sep 2026).
- Panel 48 SNP cukup untuk identitas, tetapi tidak cukup untuk prediksi sifat.
- Pohon TIDAK DIKENAL **otomatis diantrekan untuk genotyping genome-wide (±589 SNP)**, lalu AI memberi komponen hasil dan asal-usul. Unggahan hasil tercatat di jejak audit.
- Pohon itu bisa didaftarkan ke registri, sehingga data latih model terus bertambah (*data flywheel*).

*Visual:* alur 5 langkah: TIDAK DIKENAL → antrean → genome-wide → komponen hasil & asal-usul → registri.

---

## Slide 9a · Prediksi komponen hasil untuk pemulia 🟢 Sudah ada · 🤖 AI

**Dataset:** Bekele dkk. 2022, *PLoS ONE* 17:e0260907 (bank gen kakao Trinidad), CC BY 4.0. Isinya 346 aksesi bergenotipe + berfenotipe × 589 SNP, dengan sifat jumlah biji, ukuran biji, dan pod index.

- Meranking semaian dari silangan sebelum ditanam di lapang. Yang diprediksi adalah **komponen hasil, bukan hasil panen per hektare**.
- Model per sifat dipilih antara RR-BLUP dan SVR, dengan validasi berblok kekerabatan.
- Butuh genotyping genome-wide, jadi dijual sebagai layanan untuk pemulia, bukan untuk sampel verifikasi 48 SNP.
- Rekomendasi, bukan vonis. Angka akurasi tidak ditampilkan di slide (aturan tim).

*Visual:* kartu "Prediksi komponen hasil" dari halaman Analitik AI.

---

## Slide 9b · Penasihat campuran klon (penyerbukan) 🟢 Sudah ada

**Bukan AI**: bukti literatur dan statistik, ditampilkan berdampingan dan tidak dilebur jadi satu skor.

**Sumber data:**
- Farid dkk. 2021 (diallel 6 klon Indonesia) dan Malik 2016: uji persilangan dan penyerbukan sendiri.
- Lanaud dkk. 2017 (CC BY): penanda SSR lokus kompatibilitas CH1/CH4 untuk 72 klon dunia.

- **Masalah:** sebagian besar klon kakao tidak berbuah dari serbuk sarinya sendiri. Blok berisi klon yang tidak saling cocok akan berbunga, tetapi jarang berbuah.
- **Tiga bukti:** uji persilangan, prediksi DNA lokus CH1/CH4, dan kemiripan genetik dari registri.
- **Contoh nyata (keluaran aplikasi):**
  - Blok MCC 02 + THR + AFQ/MHP-01: 3 pasangan gagal, masing-masing **0 dari 300 persilangan berhasil**. Saran penyerbuk: MCC 02 → MCC 01, THR → BB-01, AFQ/MHP-01 → Sulawesi 1.
  - Blok MCC 02 + BB-01 + Sulawesi 1: tanpa peringatan (7–10 dari 300 berhasil).
- **Batas:** profil SSR CH1/CH4 klon Indonesia belum ada, dan data persilangan baru 6–7 klon.
- **Di aplikasi:** Hasil batch (kartu "Kebun entres menurut DNA") dan Registri → Penyedia.

*Slide lama "Pasangan tetua: belum layak" disimpan di kanvas sebagai ARSIP untuk tanya jawab, dan tidak masuk PDF.*

---

## Slide 10 · Registri dari genom publik + asal-usul 🟢 Sudah ada · 🤖 AI (asal-usul)

*Di Pencil, bagian asal-usul dibuat sebagai slide terpisah (F11). Bagian registri (inti, bukan AI) belum dibuat.*

**Dataset:**
- Pohon referensi kelompok genetik (Nanay, Marañón, Iquitos, Guiana, Contamana) dari Bekele dkk. 2022 (CC BY 4.0), dengan label kelompok Motamayor dkk. 2008.
- Pohon Criollo dan Amelonado, serta sidik jari klon Sulawesi, dikonfirmasi dari genom publik: Cornejo dkk. 2018 (PRJNA486011), Todd dkk. 2025 (PRJEB75153), Argout dkk. 2023 (PRJNA880462), Tobias dkk. 2024 (PRJNA1083235).
- Model: komposisi genetik dengan EM terawasi (supervised admixture).

- Sidik jari **Sulawesi 1, Sulawesi 2, dan seleksi lokal Sulawesi M01–M07** dibangun dari genom publik. Lencana "terverifikasi" diberikan bila ≥2 sumber sepakat.
- Klon rilis lain (MCC 01/02, hibrida ICCRI) divonis **BELUM ADA REFERENSI** sampai ada kerja sama dengan ICCRI. Ini justru poin pitch.
- **Asal-usul:** komposisi kelompok genetik kakao (keanekaragaman hayati), dengan peringatan bila kelompok referensi belum lengkap.

---

## Slide 11 · Keputusan dan bukti 🟢 Sudah ada

- **Berita acara siap cetak** + **jejak audit berantai (hash):** setiap perubahan riwayat langsung ketahuan.
- **Paspor bibit:** identitas DNA + titik/poligon kebun + cek tutupan hutan 2020, diekspor sebagai GeoJSON format EUDR. Ini skrining, bukan vonis hukum.
- **Pendukung:** penasihat campuran klon untuk penyerbukan, dan kesesuaian klon dengan lokasi.

---

## Slide 12 · Dasbor program 🟢 Sudah ada

- KPI **"% benih sesuai klaim"** per provinsi, per BBPPTP, dan per penyedia.
- **Skor risiko penyedia (beta):** jumlah sampel menyesuaikan riwayat penyedia.
- Pengguna: Direktorat Perbenihan, BBPPTP, dan perusahaan kakao.

---

## Slide 13 · Status fitur

| Fitur | Status |
|---|---|
| Ambil sampel offline + kalkulator sampel | 🟢 Sudah ada |
| QC data lab otomatis | 🟢 Sudah ada |
| Vonis identitas 5 status + UJI ULANG | 🟢 Sudah ada |
| Batang bawah, asal biji, kontaminasi lot | 🟢 Sudah ada |
| Registri dari genom publik + asal-usul 🤖 | 🟢 Sudah ada |
| Prediksi komponen hasil untuk pemulia 🤖 (Bekele 2022, CC BY; RR-BLUP/SVR dipilih per sifat dengan validasi berblok kekerabatan) | 🟢 Sudah ada |
| Berita acara, jejak audit, paspor EUDR | 🟢 Sudah ada |
| Dasbor program + risiko penyedia | 🟢 Sudah ada |
| **Profil sifat di setiap vonis** 🤖 | 🆕 Dikembangkan |
| **AI ranking semaian busuk buah** 🤖 | 🆕 Dikembangkan |
| **Uji refleks pohon tak dikenal** 🤖 | 🆕 Dikembangkan |
| Rekomendasi pasangan tetua 🤖 | 🗺️ Roadmap (gagal validasi) |
| Model ketahanan VSD | 🗺️ Roadmap (butuh mitra data) |
| Panel mid-density identitas + prediksi | 🗺️ Roadmap |
| Komoditas kedua (kelapa, kopi, rumput laut) | 🗺️ Roadmap |

---

## Slide 14 · Roadmap fitur 12 bulan 🗺️

| Bulan | Fitur | Butuh |
|---|---|---|
| 0–3 | Registri referensi klon rilis (3–5 ramet per klon); validasi panel di lab Indonesia | MoU dengan ICCRI dan pemilik klon |
| 3–6 | Pilot fase A: 100 pohon induk + 5 lot × 59 bibit (lihat slide 17); kalibrasi model busuk buah dengan data uji Indonesia | Disbun/BBPPTP; data uji ICCRI/Mars |
| 6–9 | **Model VSD** dari data mitra; integrasi poligon kebun | Mitra data VSD (Univ. Sydney/Unhas/Mars/ICCRI) |
| 9–12 | Panel mid-density untuk identitas + prediksi; persiapan komoditas kedua | Lab genotyping dalam negeri |

---

## Slide 15 · Batas yang kami akui

- Klon rilis Indonesia belum punya referensi resmi; ini bergantung pada kerja sama ICCRI.
- Model busuk buah dilatih pada data Kosta Rika.
- **VSD belum punya data publik**, jadi saat ini hanya ditampilkan dari uji lapang, belum dari model.
- Prediksi sifat butuh genotyping genome-wide. Sampel 48 SNP tidak diprediksi, dan sistem menolaknya dengan pesan jelas.
- Paspor EUDR: kebun agroforestri lama bisa terbaca "hutan 2020", jadi perlu bukti lapangan.

*Catatan pembicara:* "Kami lebih suka juri mendengar batas ini dari kami daripada menemukannya sendiri."

---

## Slide 16 · Harga dan biaya per sampel (F12)

Estimasi dari tarif publik (Intertek US$0,26/SNP; PMK 85/2023), kurs JISDOR 23 Okt 2026 Rp18.069/US$. Detail dan sumber: `Riset-Perbaikan-Pitch-CacaoID.md` bagian 1.

| Angka | Keterangan |
|---|---|
| **Rp266 rb / sampel** | Lab 48 SNP Rp226 rb · sampling Rp15 rb · CacaoID Rp25 rb. Batas atas dengan tarif Kementan: Rp540 rb. |
| **Rp16 jt / lot** | 59 daun: 95% yakin menangkap lot dengan ≥5% bibit salah. Penyedia dengan riwayat bersih cukup 29 daun (Rp8 jt). |
| **Rp130–780 / bibit** | Lot 120 ribu sampai 20 ribu bibit. Bagian CacaoID hanya Rp12–74. |
| **1–7% nilai bibit** | ≤4% standar biaya kawasan kakao Rp20 jt/ha (SBKK 2025). |
| **Rp266 rb / pohon induk** | Sekali per 3–5 tahun. |
| **Rp25 rb / sampel atau Rp150–200 jt / tahun** | Lisensi provinsi di bawah batas pengadaan langsung Rp200 jt (Perpres 46/2025). |

*Catatan pembicara:* "Biaya terbesar ada di lab, dan tarifnya sudah ditetapkan Kementan sendiri: genotipe SNP Rp400 ribu per sampel. Bagian kami Rp25 ribu."

---

## Slide 17 · Roadmap 12 bulan (F13)

| Kuartal | Milestone | Mitra | Dana | Kill |
|---|---|---|---|---|
| Q1 Nov–Jan | ≥1 LoI pemilik klon · 15 wawancara · penawaran ≥2 lab | ICCRI/PT RPN, BRIN, Lab DNA Medan | Lomba Riset BPDP (tutup **30 Okt 2026**) · Kemdiktisaintek TA 2027 | Tanpa LoI s/d 31 Jan → modul pemulia |
| Q2 Feb–Apr | 6–8 klon inti terverifikasi (±40 sampel) · panel di lab Indonesia · app PBT beta | ICCRI, Lab Medan/IPB | Dana riset Lomba ≤Rp20 jt · kirim RIIM, Grant BPDP 2027 | Panel >US$15/sampel |
| Q3 Mei–Jul | Pilot fase A: 100 pohon induk + 5 lot = 395 sampel (±Rp105 jt) | UPTD Sulbar/Sulsel, BBPPTP Surabaya | Kemdiktisaintek TA 2027 (±Rp130 jt) | Off-type <2% dan lot <5% |
| Q4 Agu–Okt | Fase B: 5–10 lot berbayar · usulan anggaran 2028 · preprint | 1 perusahaan kakao, Direktorat Perbenihan | Kontrak Rp100–150 jt | Semua pembeli menolak |

Ask: akses referensi klon (ICCRI, BRIN, Mars) dan satu lab mitra di Indonesia.

---

## Slide 18 · Satu cerita demo (F14)

Satu pohon diikuti dari daun sampai keputusan: **SLS-LUT-0018, kebun entres Baebunta, Luwu Utara, label MCC 01, ternyata Sulawesi 1.** Di aplikasi demo pohon ini = SIM-065; API baru di monorepo `cacaoid` sudah menampilkannya sebagai Sulawesi 1 (24 dari 42 SNP beda).

1. Ambil daun (F02) → 2. QC data lab (F03) → 3. Vonis: beda 24 titik, cocok Sulawesi 1 (F04) → 4. Dampak: uji lapang Luwu Utara (F06) → 5. Tindakan: pemurnian + sampling berbasis risiko (F05) → 6. Klon tanpa referensi: BELUM ADA REFERENSI (F04).

Alur pitch 6 menit: Hook 0:40 · Masalah 0:50 · Demo 2:25 · Bukti 0:35 · Bisnis (F12) 0:45 · Roadmap & ask (F13) 0:45. Fitur lain disimpan untuk tanya jawab.

---

## Sumber angka di slide

- Bukti panel 38 SNP, benchmark Kolombia, minimal 59 bibit: `Overview-Produk-CacaoID.md` bagian 0, 4.3, dan 5.
- Data busuk buah (Jacquotte dkk. 2026, CC0): https://doi.org/10.5061/dryad.0rxwdbsg4
- CATIE 8 tahun (Romero Navarro 2017): https://pmc.ncbi.nlm.nih.gov/articles/PMC5694496/
- *P. palmivora* 20–30% (Guest 2007): https://www.apsnet.org/publications/phytopathology/2007/December/Pages/97_12_1650.aspx
- Ditjenbun "penghambat serius" (LAKIN 2025): https://ditjenbun.pertanian.go.id/template/uploads/2026/03/LAKIN-DITJENBUN-2025.pdf
- VSD ditentukan batang atas (Asman dkk. 2021): https://doi.org/10.1016/j.aoas.2021.02.005
- Kebun produksi jadi sumber entres (Kontan, 10 Sep 2026): https://industri.kontan.co.id/news/kementan-targetkan-peremajaan-247260-ha-kebun-kakao-hingga-2027
- Harga, roadmap, dan cerita demo (slide 16–18): `Riset-Perbaikan-Pitch-CacaoID.md`
