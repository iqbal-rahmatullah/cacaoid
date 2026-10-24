# Riset perbaikan pitch CacaoID

> Path `/private/tmp/...` di dokumen ini adalah file kerja di laptop penulis dan tidak tersedia untuk tim.

24 Okt 2026. Isinya empat perbaikan: (1) slide harga, (2) slide roadmap, (3) satu cerita demo, (4) inkonsistensi angka dan lencana DATA SIMULASI.

Legenda: ✅ terverifikasi ke sumber primer · 🟡 sumber sekunder atau sebagian · ❓ belum ditemukan.

## Yang harus diketahui dulu

1. **Biaya di Overview §7 terlalu rendah 2–5 kali.** Ada tiga penyebab:
   - harga lab panel 48 SNP dihitung pakai tarif panel 10 SNP;
   - kurs ±Rp16.500, padahal JISDOR 23/10/2026 Rp18.069;
   - angka per bibit hanya berlaku untuk lot 120 ribu bibit.

   Angka yang benar: **±Rp266 rb per sampel all-in, Rp130–780 per bibit.** Klaim "sebanding dengan belanja pengawasan Rp52/batang" tidak bisa dipakai lagi.
2. **Kementan sudah punya tarif resmi genotipe SNP: Rp400.000/sampel** (PMK 85/2023, lampiran I.HH.2) ✅. Artinya uji DNA sudah punya pos tarif PNBP. Ini argumen yang kuat untuk pitch.
3. **Lomba Riset Mahasiswa BPDP tutup 30 Okt 2026, 6 hari lagi.**
   - Syarat: 3–5 mahasiswa S1/D aktif, 1 dosen pembimbing, lembar pengesahan perguruan tinggi.
   - Dana riset ≤Rp20 jt. Hadiah juara Rp50/35/25 jt.
   - Riset harus "baru, belum dibiayai sumber lain".
   - Perlu dicek: apakah tim memenuhi syarat?
4. **Contoh klon di deck tidak konsisten.** Ada tiga versi: deck utama "MCC 02 → Sulawesi 2", aplikasi "MCC 01 → Sulawesi 2", F06 "MCC 01 → Sulawesi 1". MCC 02 belum punya referensi, jadi di aplikasi selalu divonis BELUM ADA REFERENSI. Usulan: pakai **MCC 01 → Sulawesi 1** di semua tempat.
5. **Skor risiko penyedia bukan model AI.** Isinya aturan transparan plus penghalusan Bayes (`engine/risk.py`). Tulisan "Belajar dari riwayat audit" di UI 6 bisa dipersoalkan juri.

---

## 1. Slide harga dan biaya per sampel

### 1.1 Fakta dasar

| Klaim | Nilai | Status | Sumber |
|---|---|---|---|
| KASP Intertek | US$2,6/sampel untuk 10 SNP (US$0,26/SNP), mulai 1.536 sampel, belum termasuk ongkir | ✅ | https://pmc.ncbi.nlm.nih.gov/articles/PMC10313903/ |
| Tarif Kementan genotipe SNP | **Rp400.000/sampel**; isolasi DNA Rp100.000; SSR Rp300.000/sampel | ✅ | PMK 85/2023, Lampiran I.HH.2 hlm. 72: https://bpmsph.ditjenpkh.pertanian.go.id/storage/master/file/AzxxNVDi_PMK_85_TH_2023_tarif_pnbp.pdf |
| PP 35/2016 | Sudah dicabut oleh PP 28/2023 | ✅ | https://ppid.pertanian.go.id/doc/39/PP%20Nomor%2028%20Tahun%202023%20Tentang%20Jenis%20dan%20Tarif%20atas%20Jenis%20PNBP%20yang%20Berlaku%20pada%20Kementan.pdf |
| Pemeriksaan bibit kakao | Seedling/SE Rp10/batang; **okulasi/sambung Rp15/batang**; entres Rp25; kebun induk Rp500/pohon | ✅ | PMK 85/2023 hlm. 90, 93–94; daftar tarif BBPPTP Medan |
| Harga bibit | Asal biji Rp11.500–12.000; okulasi Rp15.000–17.000 (Himpunan Produsen Benih, Agu 2024) | 🟡 | https://trubus.id/asosiasi-produsen-benih-perkebunan-usulkan-revisi-harga-benih-kakao-dan-kelapa/ |
| Standar biaya kawasan kakao | **Rp20 jt/ha** (SBKK). Realisasi Rp15,1 jt/ha; pagu/target Rp13,0 jt/ha | ✅ | LAKIN Ditjenbun 2025: https://ditjenbun.pertanian.go.id/template/uploads/2026/03/LAKIN-DITJENBUN-2025.pdf |
| Belanja pengawasan benih | Pagu Rp52/batang, realisasi **Rp46/batang** (semua komoditas) | ✅ hitungan | LAKIN Ditjenbun 2025 |
| Batas pengadaan langsung | Barang/jasa lainnya ≤Rp200 jt; **jasa konsultansi ≤Rp100 jt**; di atas Rp50 jt wajib lewat sistem elektronik | ✅ | Perpres 46/2025: https://peraturan.bpk.go.id/Details/318647 |
| CRC/UWI Trinidad | US$50 (<100 sampel), US$16–27 untuk volume besar. **DNA dan profil disimpan CRC dan boleh dipakai untuk riset CRC.** | ✅ | https://sta.uwi.edu/cru/sites/default/files/cru/Genotyping.pdf |
| UU 11/2019 Pasal 77 | Spesimen lokal (fisik maupun digital) dilarang dikirim ke luar negeri bila ujinya bisa dilakukan di Indonesia | ✅ | https://peraturan.go.id/files/uu11-2019bt.pdf |
| Kurs | JISDOR 23/10/2026: Rp18.069/US$ | ✅ | https://www.bi.go.id/id/statistik/informasi-kurs/jisdor/default.aspx |
| Harga lab Indonesia (PT Orion Biosains, BRIN, IPB, ICCRI, distributor LGC) | Tidak dipublikasikan | ❓ | Minta penawaran tertulis: 48 SNP × 2.000 sampel |

### 1.2 Hitung ulang

Biaya per sampel: C = sampling + ekstraksi DNA + lab 48 SNP + software. Satu lot perlu 59 sampel, karena 0,95^59 ≤ 0,05: lot dengan ≥5% bibit salah ketahuan dengan keyakinan 95%.

| Komponen | S1: tarif komersial (Intertek) | S2: tarif Kementan (PMK 85/2023) |
|---|---|---|
| Sampling + kirim | Rp15 rb ❓ asumsi | Rp15 rb ❓ |
| Ekstraksi DNA | termasuk ❓ | Rp100 rb ✅ |
| Lab 48 SNP | 48 × US$0,26 × 18.069 = **Rp226 rb** | **Rp400 rb** ✅ |
| Software CacaoID | Rp25 rb | Rp25 rb |
| **Per sampel** | **Rp266 rb** | **Rp540 rb** |
| Per lot, 59 sampel | Rp15,7 jt | Rp31,9 jt |
| Per lot, berbasis risiko (29–54 sampel, lihat catatan) | Rp7,7–14,4 jt | Rp15,7–29,2 jt |
| Per bibit, lot 120 rb / 60 rb / 20 rb | Rp131 / 261 / 785 | Rp266 / 531 / 1.593 |
| % dari SBKK Rp20 jt/ha | 0,7–3,9% | 1,3–8,0% |
| % dari nilai bibit dalam lot (Rp11,5–17 rb/bibit) | ±1–7% | ±2–14% |
| **Bagian CacaoID saja** (59 × Rp25 rb = Rp1,5 jt/lot) | **Rp12–74 per bibit** | sama |

Catatan sampling berbasis risiko (`engine/risk.py`). Keyakinan tetap 95%; yang berubah adalah ambang off-type terkecil yang harus tertangkap:
- penyedia bersih (skor 0) menangkap ≥10%, cukup 29 sampel;
- penyedia terburuk menangkap ≥2%, perlu 149 sampel;
- data demo: Luwu Utara 38 sampel, Kolaka 54 sampel.

Jadi kalimat "31 sampel = 95% yakin" hanya benar untuk ambang ±9%, tidak untuk 5%.

### 1.3 Kerangka slide "Berapa biayanya?" (6 baris)

| # | Angka besar | Keterangan kecil |
|---|---|---|
| 1 | **Rp266 rb / sampel** | Lab 48 SNP Rp226 rb · sampling Rp15 rb · CacaoID Rp25 rb. Batas atas: tarif Kementan Rp540 rb (PMK 85/2023). |
| 2 | **59 daun = Rp16 jt / lot** | 95% yakin menangkap lot dengan ≥5% bibit salah. Penyedia dengan riwayat bersih cukup 29 daun (Rp8 jt). |
| 3 | **Rp130–780 / bibit** | Lot 120 ribu sampai 20 ribu bibit. Bagian CacaoID sendiri hanya Rp12–74. |
| 4 | **1–7% nilai bibit** | ≤4% standar biaya kawasan kakao Rp20 jt/ha (SBKK 2025). |
| 5 | **Rp266 rb / pohon induk** | Diuji sekali per 3–5 tahun, dan semua entres dari pohon itu ikut terjamin. |
| 6 | **Rp150–200 jt / tahun** | Lisensi provinsi, masih di bawah batas pengadaan langsung Rp200 jt (Perpres 46/2025). Atau Rp25 rb/sampel. |

Catatan kaki slide: *"Estimasi dari tarif publik (Intertek; PMK 85/2023), kurs JISDOR 23 Okt 2026. Harga lab mitra Indonesia sedang dinegosiasikan; pilot mengukur angka sebenarnya. Pembanding: CRC/UWI US$16–50/sampel, dengan sampel dikirim ke luar negeri."*

Kalimat pitch (menggantikan 12.1 baris Bisnis): **"Mengaudit satu lot cukup 59 daun, sekitar 16 juta rupiah, atau 1–7% dari nilai bibitnya. Bagian kami 25 ribu per sampel. Sisanya biaya lab, yang tarifnya sudah ditetapkan Kementan sendiri."**

Jawaban untuk "Kenapa pemerintah mau bayar kalau tarif periksa bibit Rp15?":
1. Bagian software CacaoID Rp12–74/bibit, setara belanja pengawasan sekarang (Rp46/batang).
2. Biaya terbesar adalah lab, dan tarif genotipe SNP sudah ada di PMK 85/2023, jadi negara sudah menetapkan harga uji DNA.
3. Totalnya ≤4% biaya per hektare, dan sampling berbasis risiko memotong jumlah sampel sampai separuh untuk penyedia yang bersih.

### 1.4 Koreksi Overview

| Bagian | Sekarang | Ganti jadi |
|---|---|---|
| §0, §7.2, §12.1, §12.2 | Rp43–143/bibit, "sebanding Rp52" | Rp130–780/bibit total; bagian CacaoID Rp12–74/bibit |
| §7.2 | Lab 38–60 SNP US$3–15 | 48 SNP ≈ US$12,5 (Intertek) atau Rp400 rb (PMK 85/2023) |
| §7.2 | All-in Rp85–285 rb (basis Rp150 rb) | Rp266–540 rb (basis Rp266 rb) |
| §7.2 | Per lot ±Rp5–17 jt | Rp15,7 jt (59 sampel); Rp7,7–14,4 jt (berbasis risiko) |
| §7.2 | 0,3–1,1% dari Rp13–15 jt/ha | 0,7–3,9% dari SBKK Rp20 jt/ha |
| §7.2 | Per pohon induk Rp85–285 rb | Rp266–540 rb |
| §7.2 | "±31 bibit/lot" | 29 sampel untuk penyedia bersih (ambang 10%, keyakinan 95%) |
| §7.2 prinsip harga, §2.2 | PNBP Rp10; "tidak ada pos uji DNA" | Sambung/okulasi Rp15. Tarif SNP Rp400 rb sudah ada di PMK 85/2023; yang belum ada hanya pos DNA di daftar tarif BBPPTP. |
| §7.3 B2G-3 | Rp50–100/bibit all-in | Di bawah biaya. Ganti dengan harga per lot ±Rp16 jt (lab diteruskan apa adanya + fee). |
| §7.3 per sampel | Bundel lab Rp120–250 rb | ≥Rp300 rb, atau lab diteruskan apa adanya + Rp25 rb |
| §7.3 catatan ❓ | Ambang ≤Rp200 jt | ✅ untuk barang/jasa lainnya; bila dikategorikan jasa konsultansi, batasnya ≤Rp100 jt |
| §7.4 SAM | Rp5–22 M | Rp2,1–12,8 M (fee Rp25 rb × 86–514 rb sampel, volume 2026) |
| §7.5 Q2 | Genotyping ±US$2–5 rb untuk 300 pohon + 30 lot | Itu 2.070 sampel ≈ Rp550 jt all-in. Pecah pilot jadi fase A/B (bagian 2). |
| §10 | "Harga sebanding Rp43–143/bibit" | Ikuti jawaban tanya jawab di 1.3 |

---

## 2. Roadmap 12 bulan

### 2.1 Temuan penting

- **Lomba Riset BPDP** ✅. Tutup 30 Okt 2026. Topik kakao no. 1 adalah "pemuliaan, penataan varietas … distribusi benih", ditambah topik no. 10 "TIK dan AI industri kakao". Proposal sebaiknya dibingkai sebagai **registri referensi klon + validasi lapang**, bukan prototipe hackathon. Panduan: https://www.its.ac.id/drpm/wp-content/uploads/sites/71/2026/07/Panduan-Teknis-Proposal-Lomba-Riset-BPDP-Tahun-2026-2027.pdf
- **BPDP Grant Riset**:
  - pengusul hanya Lembaga Litbang, dan ketuanya dosen (mahasiswa tidak bisa);
  - plafon tidak tertulis;
  - siklus 2027 diperkirakan tutup Mar–Jun 2027 🟡, dan dana kemungkinan baru cair setelah Okt 2027;
  - jangan diandalkan untuk pilot tahun ini.
- **Sumber yang waktunya paling pas: Kemdiktisaintek Hilirisasi Riset Prioritas, Pengujian Model & Prototipe TA 2027.**
  - Pola TA 2026: proposal dibuka 27 Nov–26 Des 2025, pengumuman 9 Apr 2026.
  - Rata-rata ±Rp130 jt per judul (354 judul, total Rp46 M).
  - Ketuanya dosen. 🟡 jadwal 2027.
- **Skema hilirisasi besar belum bisa:**
  - Ajakan Industri (≤Rp2 M) dan Dorongan Teknologi (≤Rp1,2 M) mensyaratkan TKT ≥6 dan mitra industri berbadan hukum;
  - BPDP Program Hilirisasi mensyaratkan TKT ≥7;
  - CacaoID sekarang di TKT ±3–4, jadi targetnya siklus TA 2028.
- **BRIN RIIM Kompetisi** ≤Rp250 jt/tahun. "Uji validasi/mutu" dikecualikan, jadi harus dibingkai sebagai riset panel + AI. Batch 2026 sudah lewat; pola 2027 🟡.
- **Lisensi B2G di Q4 2027 tidak realistis**, karena anggaran 2027 sudah terkunci. Ganti targetnya menjadi "masuk usulan anggaran 2028" plus 1 kontrak/LoI perusahaan.
- **Revisi Kepmentan 25/2017**: Kementan "tengah merevisi" (Kontan, 10 Sep 2026), arahnya deregulasi, dan tanggalnya ❓. Tanpa data pilot, metode DNA tidak akan jadi kewajiban. Langkahnya:
  - Q1: kirim masukan tertulis (verifikasi marka sebagai opsi untuk pohon induk dan kebun sumber benih baru);
  - Q4: bawa data pilot ke juknis atau revisi berikutnya.
- **Musim salur puncak Sep–Nov** ✅. Audit pohon induk bisa kapan saja, tetapi audit lot harus jatuh Jul–Okt 2027.

### 2.2 Kerangka slide "12 bulan: dari referensi ke pembeli pertama"

Biaya dihitung dengan tarif S1 (Rp266 rb/sampel) dari bagian 1.

| Kuartal | Milestone (output terukur) | Mitra | Dana | Kill |
|---|---|---|---|---|
| **Q1** Nov–Jan | ≥1 LoI pemilik klon · 15 wawancara (PBT, penangkar, Disbun) · penawaran dari ≥2 lab · masukan revisi Kepmentan | ICCRI/PT RPN, BRIN, Lab DNA Medan (PT Orion) | Lomba BPDP (30 Okt) · proposal Kemdiktisaintek TA 2027 | Tanpa LoI referensi sampai 31 Jan → pindah ke modul pemulia |
| **Q2** Feb–Apr | **6–8 klon referensi terverifikasi** (3–5 ramet per klon = ±40 sampel, ±Rp11 jt) · panel tervalidasi di lab dalam negeri · app PBT beta | ICCRI, Lab Medan/IPB | Dana riset Lomba ≤Rp20 jt · kirim RIIM, P2MW, Grant BPDP 2027 | Panel in-country >US$15/sampel |
| **Q3** Mei–Jul | **Pilot fase A: angka off-type Indonesia pertama.** 100 pohon induk + 5 lot × 59 = 395 sampel (±Rp105 jt), hasil ≤3 minggu | UPTD Sulbar/Sulsel, BBPPTP Surabaya | Kemdiktisaintek TA 2027 (±Rp130 jt, bila lolos) | Off-type <2% **dan** kontaminasi lot <5% |
| **Q4** Agu–Okt | **Fase B = pilot berbayar:** 5–10 lot sebelum puncak salur (±Rp80–160 jt) · 1 surat usulan anggaran 2028 · 1 preprint | 1 perusahaan (Mars/Cargill/grinder), Direktorat Perbenihan | Kontrak perusahaan Rp100–150 jt | Direktorat, 2 provinsi, dan 2 perusahaan semuanya menolak |

Kalimat ask (menggantikan baris terakhir 12.1): **"Dalam 12 bulan kami akan menghasilkan angka salah klon Indonesia yang pertama, dari 100 pohon induk dan 5 lot. Kami butuh dua hal: akses referensi klon dari ICCRI dan BRIN, dan satu lab mitra di Indonesia."**

### 2.3 Mitra yang dihubungi bulan 0–3

| Mitra | Diminta | Untung mereka |
|---|---|---|
| LPPM + dosen pembimbing kampus tim | Ketua/pembimbing; lembar pengesahan Lomba **minggu ini** | Luaran riset untuk IKU kampus |
| Puslitkoka/ICCRI (PT RPN) | 3–5 ramet per klon; LoI registri bersama dengan hak data jelas | QC kebun sendiri. LAKIN BBPPTP Surabaya 2023 mencatat potensi kebun Puslitkoka turun 29,84% karena campuran varietas. |
| BRIN (pemulia kakao) | Referensi klon baru; periset sebagai ketua RIIM | Publikasi; jalur RIIM Start-Up |
| Mars (CRS Pangkep, CDC Tarengge) | Referensi MCC 01/02 | Validasi pihak ketiga untuk kebun multiklonal mereka |
| Lab DNA BBPPTP Medan (PT Orion Biosains, kerja sama 10 tahun sejak 6 Mei 2026) | Penawaran harga panel KASP kakao; uji coba 40 sampel | Komoditas baru untuk menutup kontribusi tetap ≥Rp1,35 M/tahun |
| BBPPTP Surabaya (pembina UPTD Sulawesi) | Sampling bersama PBT | Alat bantu PBT; KPI benih bermutu 80% |
| Disbun Sulbar (UPTD BPSPMBP) | Lokasi pilot di Pasangkayu (penangkar ±600 rb bibit MCC 02/Sulawesi 2) | Bukti mutu untuk laporan KPI provinsi |

Sumber lengkap ada di laporan agen roadmap. PDF panduan disimpan di `/private/tmp/claude-501/-Users-iqbalrahmatullah-Desktop-hackathon-soulsea/f99a68e4-6d15-4ebe-8333-5634417779f2/scratchpad/roadmap/dl/`.

### 2.4 Koreksi Overview §7.5 dan §9

- §7.5: total tahun 1 basis Rp0,35 M → **Rp100–150 jt** (1 kontrak pilot berbayar). Pendapatan lisensi B2G pindah ke 2028.
- §7.5 Q1: tambahkan Kemdiktisaintek TA 2027. Grant Riset BPDP pindah ke Q2 (tenggat ±Mar–Jun 2027), dengan dosen sebagai ketua.
- §9: ganti dengan tabel 2.2. Pilot "300 pohon induk + 30 lot" diubah menjadi fase A (100 + 5 lot) dan fase B (5–10 lot berbayar).

---

## 3. Satu cerita demo

### 3.1 Tokoh: satu pohon, SIM-065 di kebun entres Luwu Utara (simulasi)

Alasan memilih cerita ini:
- **Diklaim MCC 01, ternyata Sulawesi 1.** Kedua klon punya referensi genom publik, jadi aplikasi benar-benar bisa memvonisnya (MCC 02 tidak bisa).
- Pada panel 48 SNP, MCC 01 dan Sulawesi 1 berbeda di **23 dari 42 titik** yang terbaca keduanya. Angka ini kebetulan sama persis dengan tulisan "Beda 23 titik" di mockup UI 4/F04.
- **Kartu profil sifat F06 memakai uji lapang Luwu Utara sendiri** (Susilo dkk. 2015, uji yang sama):
  - potensi hasil 3.672 → 2.772 kg/ha (−25%, tapi tidak signifikan secara statistik; sebut saja begitu);
  - bobot biji 1,61 → 1,10 g.
- Cerita berakhir di MCC 02 (BELUM ADA REFERENSI) di kebun Parigi. Itu jadi jembatan alami ke *ask*: referensi klon dari ICCRI.

Syarat: aplikasi harus mengeluarkan vonis ini. Saat ini `simulate.py` baris 105 membuat `("MCC 01", "Sulawesi 2", "OFF-TYPE")`; ubah menjadi `"Sulawesi 1"` (satu baris).

**Sudah dikerjakan (24 Okt 2026) di monorepo `cacaoid/apps/api`.** Sampel simulasi SIM-065 berbeda di **24** dari 42 titik dari MCC 01. Angka 23 di atas adalah jarak antar-referensi; yang diucapkan di demo harus 24, sesuai layar.

### 3.2 Naskah pitch 6 menit, satu benang

| Waktu | Layar | Kalimat kunci |
|---|---|---|
| 0:00–0:40 Hook | Foto pohon + label "MCC 01" | "Ini satu pohon induk di kebun entres Luwu Utara. Labelnya MCC 01. Tahun depan, entres dari pohon ini disambung ke bibit-bibit peremajaan, dan setiap bibit mewarisi identitas pohon ini. Pertanyaannya: apakah pohon ini benar MCC 01?" |
| 0:40–1:30 Masalah | Slide masalah | "Pedomannya meminta kemurnian klon 100%, tapi alat ukurnya hanya mata. Pengawas pemerintah sendiri menemukan campuran varietas di kebun sumber benih. Di negara lain, 12–37% klon ternyata salah label. Pemerintah sedang meremajakan 174 ribu hektare." |
| 1:30–1:50 Demo: sampel | App PBT (F02) | "Pengawas memetik satu cakram daun, lengkap dengan GPS. Hari ini 135 sampel dari empat kebun entres sampai di lab." |
| 1:50–2:10 Demo: QC | Unggah (F03) | "File lab masuk. Sistem menahan 2 sampel yang DNA-nya rusak, mengecek kontrol plate, dan membuang 2 SNP di luar panel. Tidak ada vonis dari data yang buruk." |
| 2:10–2:50 Demo: vonis | Detail SIM-065 (F04) | "Pohon kita: bukan MCC 01. Sidik jarinya beda di 24 titik, jauh di atas batas error lab, dan cocok dengan Sulawesi 1." |
| 2:50–3:20 Demo: dampak | Profil sifat (F06) | "Apa artinya bagi petani? Di uji lapang Luwu Utara sendiri, Sulawesi 1 mencatat potensi hasil seperempat lebih rendah dan biji lebih kecil. Angka ini dari uji lapang, bukan tebakan AI." |
| 3:20–3:40 Demo: tindakan | Pemurnian + dasbor (F05/UI 5) | "Pohon ditandai untuk pemurnian. Di kebun ini 3 dari 23 sampel bermasalah, sehingga lot berikutnya otomatis diambil 38 sampel." |
| 3:40–3:55 Demo: kejujuran | MCC 02 di Parigi | "Dan ini klon MCC 02: sistem menulis BELUM ADA REFERENSI. Kami tidak mengarang vonis tanpa referensi." |
| 3:55–4:30 Bukti | Slide bukti | Uji buta 4.653 pohon Kolombia; recall 100%/presisi 99,8% pada simulasi; AI komponen hasil r 0,51–0,66 |
| 4:30–5:15 Bisnis | **Slide harga (1.3)** | "Mengaudit kebun ini: Rp266 ribu per pohon induk, sekali per 3–5 tahun. Satu lot: 59 daun, ±Rp16 juta, 1–7% nilai bibitnya. Bagian kami Rp25 ribu per sampel." |
| 5:15–6:00 Roadmap & ask | **Slide roadmap (2.2)** | "Dalam 12 bulan, kebun seperti ini jadi pilot nyata: 100 pohon induk dan 5 lot, untuk angka salah klon Indonesia yang pertama. Kami butuh referensi klon dari ICCRI dan BRIN, dan satu lab mitra." |

**Dikeluarkan dari demo utama** (disimpan untuk tanya jawab): lot hibrida LOT-H-07, uji refleks, asal-usul, penasihat campuran, dan ranking semaian. Kalau ditanya, buka langsung di aplikasi.

### 3.3 Angka yang benar-benar tampil di aplikasi (batch demo, seed 42)

Angka ini dijalankan ulang lewat API hari ini. Naskah dan mockup harus mengikuti tabel ini.

| Hal | Nilai di app |
|---|---|
| Batch | 135 sampel lapangan + 2 kontrol plate; rata-rata call rate 93,5% |
| QC | UJI ULANG: SIM-008, SIM-034 (+ kontrol negatif kosong, sesuai harapan); 2 SNP di luar panel diabaikan |
| Vonis | COCOK 59 · SESUAI SILANGAN 48 · KONTAMINAN 12 · OFF-TYPE 6 · BELUM ADA REFERENSI 4 · UJI ULANG 2 · TIDAK DIKENAL 2 · BATANG BAWAH 2 |
| KE Luwu Utara | 23 sampel: 20 COCOK, 2 OFF-TYPE (SIM-064 Sulawesi 1 → M06; SIM-065 MCC 01 → Sulawesi 2, **akan jadi Sulawesi 1**), 1 BATANG BAWAH |
| Skor risiko | Kolaka 57 Tinggi → 54 sampel · Parigi 52 Tinggi → 51 · Polman 36 Sedang → 41 · **Luwu Utara 30 Sedang → 38** |
| Dasbor | 129 terverifikasi · 82,9% lolos · 22 bermasalah · 1 lot ditahan · 4 belum ada referensi |
| Lot hibrida LOT-H-07 | 60 bibit · 12 dikeluarkan · estimasi 16% (rentang 7–29%) · TAHAN. Tetua di app: "Hibrida DEMO-1" = TSH1188 × SCA6 |

---

## 4. Inkonsistensi dan lencana DATA SIMULASI

### 4.1 Daftar perbaikan (ID node Pencil di `cacaoid.pen`)

**A. Contoh klon: MCC 02 / Sulawesi 2 → MCC 01 / Sulawesi 1**

| Node | Sekarang | Ganti jadi |
|---|---|---|
| L2aV80 (01) | COCOK · MCC 02 | COCOK · MCC 01 |
| g3CK4w (01) | Kartu "COCOK · MCC 02 · 47 dari 47 titik" | … MCC 01 … |
| VwYWR (12) | #0017 … MCC 02 … #0018 … bukan MCC 02 (ternyata Sulawesi 2) | MCC 01 … (ternyata Sulawesi 1) |
| Z0RbI (13) | Ternyata cocok dengan Sulawesi 2, bukan MCC 02 | … Sulawesi 1, bukan MCC 01 |
| CLmvK (UI 4), cmURM (F04) | Pohon ini bukan MCC 02 … Sulawesi 2 | Pohon ini bukan MCC 01. Sidik jarinya cocok dengan Sulawesi 1. |
| lee7Q (UI 4), YbnYm (F04) | … klaim MCC 02 … Sulawesi 2 | … klaim MCC 01 … Sulawesi 1 |
| VmmOX (UI 4), dTxNG (F04) | Beda 23 titik … bukan MCC 02 | Beda 23 titik … bukan MCC 01 (angka 23 sudah benar) |
| Tabel sampel UI 3 (kartu Wcmed) dan F05 (kartu denXc) | Klaim "MCC 02" di hampir semua baris; -0018 ditemukan Sulawesi 2 | Klaim MCC 01; -0018 ditemukan **Sulawesi 1**; baris -0024 (ditemukan MCC 01) diklaim Sulawesi 2 |

**B. Lot hibrida (UI 3 + F05)**

| Node | Sekarang | Ganti jadi |
|---|---|---|
| fxfyU / HYR4Q | Lot L-07 · ICCRI 06H | Lot LOT-H-07 · hibrida simulasi |
| VxSkC / lNOMF | Hibrida TSH 858 × Sulawesi 1 · 24 bibit disampel | Tetua TSH1188 × SCA6 · 60 bibit diuji |
| jdtyk / T4aoC | 18% | 16% |
| EC7uG / yCGl0 | ± 3% | rentang 7–29% |
| IV0Tl / Z74W0e | Anak TSH 858 × Sulawesi 1 (batang bawah) | Anak TSH1188 × SCA6 (batang bawah resmi) |
| E0fw9s, lZIx4, uexRq / NmOFZ, JP7zl, U8g9SO; W6SYFd / vIZFx | Semua 92 · Perlu tindakan 21 · Lolos 71; "11 dari 92" | Semua 135 · Perlu tindakan 28 · Lolos 107; "11 dari 135" |
| zCXl6…n6oLCM / I1WB3t…aObR6 | Kebun produksi Y 3/12 · Kebun entres Z 1/15 · Baebunta 0/20 | KE Kolaka 15/75 · KE Parigi 3/17 · KE Luwu Utara 3/23 (dari dasbor app) |

TSH 858 dan ICCRI 06H belum punya genotipe publik, jadi aplikasi tidak bisa mendemokannya. Mockup harus memakai nama yang sama dengan app.

**C. Skor risiko (UI 6, kartu TadEh)**

| Node | Sekarang | Ganti jadi |
|---|---|---|
| IQwir, c2LB5c, zJZt7 | CV Contoh Benih · 78 · Risiko tinggi | KE Luwu Utara · 30 · Risiko sedang |
| Faktor (nfvTu…q65RoJ) | +32 riwayat off-type, +21 kebun produksi baru, +15 belum pernah diaudit, +10 volume lot besar | **+30: off-type historis 3/23 sampel (12% setelah dihaluskan)**. Faktor lain yang bisa muncul di engine: riwayat <20 sampel +15, lot pernah ditahan +10/lot, >20% sampel tanpa GPS +5 |
| B82Dg | Audit berikutnya: 12 sampel per lot (standar 4) | Lot berikutnya: 38 sampel (rancangan tetap: 59) |
| Bkga9 | Penyedia risiko rendah: cukup 2 sampel per lot | Penyedia dengan riwayat bersih: cukup 29 sampel |
| mFcsE | Belajar dari riwayat audit | Dihitung dari riwayat audit · aturan transparan (bukan model AI) |

**D. Jumlah SNP genome-wide**

| Node | Sekarang | Ganti jadi |
|---|---|---|
| m8Owm (15), t9jEM (16), XRI6K (18) | ±600 SNP | 589 SNP |

**E. Overview §11.2 (skenario demo)**: ganti seluruhnya dengan naskah 3.2. Angka "300 pohon MCC 02 → 41 OFF-TYPE + 6 BATANG BAWAH" dan "200 sampel → 18% ± 3%" tidak pernah muncul di aplikasi.

### 4.2 Lencana DATA SIMULASI

Aturannya: setiap tampilan yang memuat **angka dari batch simulasi** wajib berlencana. Tampilan yang angkanya **data publik nyata** diberi lencana lain, "DATA PUBLIK", supaya juri bisa membedakan keduanya.

| Tampilan | Status sekarang | Tindakan |
|---|---|---|
| Deck 01, 11, 12, 13, 15; UI 1–6; F01, F03, F04, F05 | Sudah ada | – |
| **F02** (sampel lapangan) | Lencana dihapus | Tambahkan kembali |
| **F06** (profil sifat) | Tidak ada | "VONIS SIMULASI · nilai sifat dari uji lapang nyata" |
| **F08** (uji refleks), **F09** (komponen hasil semaian), **F11** (asal-usul) | Tidak ada | Tambahkan, karena sampel dan semaiannya simulasi |
| F10 (penasihat campuran) | Tidak ada | Cek: bila memuat kebun contoh, tambahkan DATA SIMULASI; aturan kompatibilitasnya diberi DATA PUBLIK (Lanaud 2017, Farid 2021) |
| F07 (busuk buah) | Tidak ada | Beri **DATA PUBLIK · Jacquotte 2026**, bukan simulasi |
| App: semua halaman | `SimBadge` di kanan atas setiap halaman (`Layout.tsx`) ✅; laporan PDF punya catatan kaki ✅ | Cukup |
| App: Registri klon, kartu "Ranking semaian busuk buah" (`Ai.tsx`) | Ikut berlencana DATA SIMULASI padahal isinya data publik nyata | Tambahkan chip "DATA PUBLIK" di kartu tersebut |

---

## 5. Urutan kerja yang diusulkan

1. **Hari ini:** putuskan apakah ikut Lomba BPDP (tenggat 30 Okt). Cek kelayakan tim dan minta lembar pengesahan dari LPPM.
2. Ubah `simulate.py` (MCC 01 → Sulawesi 1), jalankan ulang tes, lalu baca ulang angka keyakinan SIM-065 untuk mockup.
3. Terapkan perbaikan 4.1 dan lencana 4.2 di Pencil.
4. Buat slide harga (1.3) dan slide roadmap (2.2) di Pencil.
5. Perbarui Overview §0, §2.2, §7, §9, §10, §11.2, §12.
6. Kirim permintaan penawaran harga ke PT Orion Biosains dan distributor LGC (PT Sciencewerke/Ecosains): 48 SNP × 2.000 sampel. Hasilnya menggantikan semua angka ❓ di bagian 1.

---

## 6. Status regulasi benih kakao (dicek ulang 24 Okt 2026)

| Aturan | Isi yang relevan | DNA? | Status |
|---|---|---|---|
| Kepmentan 25/Kpts/KB.020/5/2017 | Pedoman benih kakao. Kebun sumber dinilai dengan "mengamati kebenaran varietas setiap blok"; sertifikasi bibit secara visual. | Tidak ada | ✅ masih jadi dasar |
| Kepmentan 67/Kpts/KB.020/7/2018 (9 Jul 2018) | Hanya mengubah langkah sambung pucuk, Tabel 8 (umur kebun entres), dan Tabel 12 (standar mutu bibit polibeg). Pasal I angka 4: ketentuan lain 25/2017 "dinyatakan masih tetap berlaku". | Tidak ada | ✅ dibaca langsung |
| Kepmentan 49/2025 (kakao), disosialisasikan 28 Agu 2025 | Membuka inventarisasi kebun produksi sebagai sumber benih dan entres (Dekaindo). Teks lengkap tidak ditemukan online. | Tidak disebut di berita mana pun | 🟡 isi ❓ |
| Revisi lanjutan Kepmentan 25/2017 | Direktur Perbenihan Perkebunan, Sep 2026: "tengah direvisi" untuk mempercepat penyediaan benih | Tidak disebut | 🟡 belum terbit |
| RSNI3/SNI 9272:2024 benih kakao (biji) | Mendefinisikan benih murni dari "fenotipe maupun genotipe", tetapi metode uji 6.1 berbunyi: "Mutu genetis benih dibuktikan dengan adanya dokumen penetapan kebun sumber benih" | Tidak ada metode uji | ✅ draf dibaca |
| Permentan 31/2025 (24 Nov 2025, peremajaan kakao) | Pasal 75: benih siap salur "harus bersertifikat" | Tidak ada | ✅ |
| PMK 85/2023 (tarif PNBP Kementan) | Pemeriksaan bibit kakao seedling/SE Rp10/batang, **okulasi/sambung Rp15/batang**, entres Rp25, kebun induk Rp500/pohon. Tarif genotipe SNP Rp400 rb ada di bagian "Pengujian Laboratorium Terpadu" (layanan lab riset), bukan bagian sertifikasi benih. | Hanya sebagai layanan lab | ✅ dibaca langsung |
| **Pembanding: Kepmentan 4/2025 benih kelapa sawit (8 Jan 2025)** | Kebun induk wajib punya "Identitas Genetik Tetua … Rekam Jejak Genetika (Finger Printing) atau Silsilah". Untuk uji kemurnian: "sepanjang uji kemurnian genetik dan/atau metode deteksi genetik lainnya belum diterapkan", pengawas memakai dokumen. | **Ya, sudah diantisipasi** | ✅ dibaca langsung |
| Pembanding: Kepmentan 27/2021 kopi, 57/2022 kelapa | Kopi masih "memeriksa dan mengamati kebenaran varietas setiap blok", sama seperti kakao | Tidak ada | ✅ |

Praktik lapangan 2025–2026 juga masih visual:
- Pemurnian kebun sumber benih di NTT (Ditjenbun, 24 Jul 2025): tim BRIN + PBT "mengamati serta mengidentifikasi setiap tanaman kakao".
- Monitoring pengadaan benih 2026 di Kolaka Utara (25 Feb 2026): pemeriksaan dokumen dan progres fisik.

**Kalimat aman untuk pitch:**

"Pedoman benih kakao (Kepmentan 25/2017, diubah 2018 dan 2025, kini direvisi lagi) belum memuat uji DNA. Kebun sumber dinilai dengan mengamati kebenaran varietas setiap blok, dan SNI benih kakao 2024 menyatakan mutu genetik dibuktikan dengan dokumen. Sementara itu, pedoman benih sawit 2025 sudah meminta sidik jari genetik tetua. Revisi kakao yang sedang berjalan adalah pintu masuknya."

Yang perlu diganti:
- "Rp10 per bibit" → "Rp10–15 per bibit (sambung pucuk Rp15)".
- "1% bibit per lot" → tulis sebagai "menurut lampiran 25/2017". Isi 49/2025 belum bisa dicek.

---

## 7. Uji DNA bibit kakao di luar negeri (dicek 24 Okt 2026)

Kesimpulan: **belum ada negara yang menjalankan uji DNA bibit kakao secara rutin dan wajib.** Yang ada:

| Bentuk | Contoh | Catatan |
|---|---|---|
| Layanan lab komersial | CRC/UWI Trinidad, sejak 2016; klien dari ±20 negara | US$51/sampel; pendapatan hanya US$30 rb (2020) dan US$38 rb (2021). Layanannya ada, tapi pemakainya sedikit. |
| Aturan yang menyebut identitas genetik | Kolombia, ICA Res. 3434/2005 dan 0780006/2020 (registrasi vivero/jardín clonal) | "Identificación genética" disebut, tetapi kewajiban uji molekuler tidak ditemukan ❓ |
| Audit riset di program nasional | Ghana (CRIG 2012, 2015, 2024), Pantai Gading, Kamerun, Nigeria, Sierra Leone/Togo, Kolombia (4.653 pohon), Nikaragua (2023), Malaysia (SSR 2016, 2019) | Selalu menemukan masalah. Ghana 2024: hanya 65,2% dari 752 bibit biklonal yang disalurkan ke petani bisa dipastikan tetuanya. |
| Internal perusahaan | Mars (off-typing uji progeni) | Tidak dijual ke program pemerintah. Praktik QC DNA Nestlé tidak ditemukan ❓ |
| Pembanding: sawit Malaysia | MPOB SureSawit SHELL (layanan komersial Orion BioSains Sdn Bhd); TRUE-TO-TYPE v2, 108 SNP, akurasi tetua >99,4%, untuk seed garden, nursery, dan kultur jaringan | Sistem paling lengkap, tapi untuk sawit. Nama operator mirip PT Orion Biosains (operator Lab DNA Medan); hubungannya belum dicek 🟡 |

Efisiensi:
- **Secara teknis efisien.** 13 SNP sudah cukup membedakan 65 aksesi (De Wever 2019); biaya lab US$3–15/sampel dalam volume besar.
- **Analisis biaya-manfaat formal belum pernah dipublikasikan di negara mana pun.** Bukti nilainya tidak langsung:
  - Kamerun: hanya 25% bibit dari kebun benih yang benar F1;
  - Ghana 2024: 65,2% bibit tetuanya terkonfirmasi;
  - DuVal 2017: 4,7% off-type mengubah 48% keputusan seleksi.
- **Hambatan nyata adalah biaya per sampel bila setiap pohon diuji.** Di Nikaragua, sampel dibatasi ke 49 pohon "due to the high cost of the analysis". Efisiensi datang dari desain sampling: uji pohon induk sekali, lalu sampel statistik per lot.

Untuk tanya jawab ("kenapa belum ada yang mengadopsi?"): di negara lain uji DNA berhenti di riset atau jasa lab per sampel. Yang tidak ada di sana: registri referensi, desain sampling yang murah, integrasi ke alur sertifikasi, dan pembayar. Indonesia sekarang punya program bibit APBN besar dengan KPI mutu, lab DNA perkebunan yang sudah dibangun, dan pedoman benih yang sedang direvisi.

Sumber:
- UWI Today Sep 2022: https://sta.uwi.edu/UWIToday/archive/september_2022/article4.asp
- Bediako dkk. 2024, Plant Genetic Resources: https://www.cambridge.org/core/journals/plant-genetic-resources/article/abs/genetic-diversity-and-parentage-of-cacao-theobroma-cacao-l-populations-from-ghana-using-single-nucleotide-polymorphism-snp-markers/2DF6D8C93D180FCADBC53F7CC8F560F2
- Padi dkk. 2015: https://link.springer.com/article/10.1007/s11295-015-0875-9
- De Wever dkk. 2019: https://pmc.ncbi.nlm.nih.gov/articles/PMC6606624/
- Bordeaux dkk. 2023, Nikaragua: https://www.redalyc.org/journal/437/43774930004/
- ICA Res. 0780006/2020: https://www.ica.gov.co/getattachment/56d15d28-b186-498e-bc07-7a6fcf65fb2c/2020R78006.aspx
- MPOB TRUE-TO-TYPE v2: https://jopr.mpob.gov.my/true-to-type-version-2-high-resolution-genotyping-platform-for-parental-identification-in-oil-palm/
- DuVal dkk. 2017: https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2017.02059/full
