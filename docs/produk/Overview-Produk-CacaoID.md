# CacaoID: Overview Produk Lengkap

> **Peringatan (24 Okt 2026):**
> - Bagian §0, §2.2, §7, §9, §10, §11.2, dan §12 belum disesuaikan.
> - Angka biaya di §7 (Rp43–143/bibit) **salah**. Pakai `Riset-Perbaikan-Pitch-CacaoID.md` §1 (Rp266 rb/sampel, Rp130–780/bibit) dan §2 (roadmap).
> - Keputusan yang lebih baru ada di `../KEPUTUSAN.md`.
> - Path `/private/tmp/...` di §14 adalah file kerja di laptop penulis dan tidak tersedia untuk tim.

Platform verifikasi genetik bibit kakao untuk program peremajaan Indonesia.

Disusun 22 Oktober 2026 untuk GenoHack 2026, Track 2 (Food Security & Biodiversity Genomics).
Dasar riset: 3 agen riset yang membaca langsung regulasi, LAKIN kementerian, dan paper, ditambah 3 uji komputasi kami sendiri pada data publik.

| Label | Arti |
|---|---|
| ✅ | Terverifikasi dari sumber primer (teks regulasi, laporan kinerja kementerian, paper) |
| 🟡 | Hanya dari berita, klaim asosiasi, atau abstrak. Pakai kalimat aman. |
| ❓ | Belum bisa diverifikasi |

Penulisan angka: **M = miliar rupiah, T = triliun rupiah**, jt = juta, rb = ribu.

---

## 0. Ringkasan satu halaman

**Masalah.**
- Pemerintah sedang membagikan ratusan juta bibit kakao untuk meremajakan kebun. Target 2026 sekitar 174 ribu ha dengan 1.000 bibit/ha (🟡).
- Kebenaran klon bibit itu hanya diperiksa **dengan mata**:
  - Pedoman benih kakao (Kepmentan 25/2017) tidak menyebut DNA sama sekali.
  - Paling banyak 1% bibit per lot yang diamati.
  - Tarif pemeriksaannya Rp10 per bibit.
  - Direktorat pusat hanya punya 29 pengawas benih (✅).
- Klon yang salah baru ketahuan saat berbuah, 2–3 tahun setelah bibit dibayar, lalu merugikan petani selama 20+ tahun umur pohon.

**Buktinya nyata.**
- Pengawas benih menolak 6 dari 13 kebun sumber benih kakao yang diawasi BBPPTP Surabaya pada 2019 (46%; alasan tidak dirinci, ✅).
- Pengawas benih pemerintah sendiri menemukan "campuran varietas lain" di kebun sumber benih lembaga riset kakao nasional (BBPPTP Surabaya 2023, ✅).
- Setiap kali bahan Indonesia dicek dengan DNA, selalu ada ketidaksesuaian: 6 kesalahan identitas di dalam klon dan 4 nama ganda pada 210 pohon seleksi Sulawesi (USDA–ICCRI), 3 dari 50 nama klon membawa dua genotipe (Dinarti 2015), dan 6–16% planlet SE menyimpang (disertasi IPB 2015).
- Direktorat Perbenihan menulis "mutu benih masih rendah" dan "lemahnya pengawasan peredaran benih" (LAKIN 2025, ✅).
- Di luar negeri, salah klon kakao terdokumentasi di **24 studi**. Contohnya Malaysia 37,3%, Vietnam 24%, Kolombia 12,4%. Di Kamerun, hanya 25% bibit dari kebun benih yang sesuai persilangan rencana.

**Solusi.** CacaoID adalah software. Lab mitra di Indonesia menghasilkan data genotipe dari cakram daun memakai panel 38–60 SNP KASP. CacaoID lalu:
1. memberi vonis per pohon induk atau lot dengan **lima kemungkinan: COCOK / OFF-TYPE / BATANG BAWAH / TIDAK DIKENAL / BELUM ADA REFERENSI**, ditambah **UJI ULANG** sebagai status QC bila data lab tidak cukup;
2. mengukur kontaminasi serbuk sari di kebun benih hibrida;
3. menyimpan registri dan jejak audit untuk sertifikasi dan pengadaan;
4. menyediakan dasbor KPI resmi "% benih kakao bermutu yang beredar";
5. menyediakan **layanan terpisah untuk pemulia**: prediksi komponen hasil untuk seleksi semaian, dengan genotyping genome-wide (bukan panel verifikasi).

**Ketergantungan hari pertama:** klon utama Indonesia (MCC 01/02, Sulawesi 1/2, ICCRI 06H/08H) belum punya sidik jari referensi. Langkah pertama pilot adalah membangun registri referensi bersama ICCRI dan pemilik klon (bagian 9).

Lab DNA benih perkebunan milik pemerintah sudah ada: Medan, ±Rp95 M (2023), dioperasikan PT Orion Biosains sejak Mei 2026. Tetapi fokus awalnya sawit. Untuk kakao belum ada panel, registri klon, dan sistem keputusan. CacaoID mengisi lapisan itu, dan lab tersebut adalah calon mitra pertama.

**Bukti yang sudah kami jalankan** (data publik, CC BY):
- Panel 38 SNP mendeteksi bibit salah klon dengan recall 100% dan presisi 99,8% pada error genotipe 2%.
- Kontaminasi serbuk sari diperkirakan dengan meleset ±2–3 poin.
- Prediksi genomik komponen hasil mencapai r = 0,42–0,66.

**Bisnis.**
- Biaya QC all-in sekitar **Rp43–143 per bibit**, sebanding dengan belanja pengawasan benih pemerintah sekarang (Rp52/batang, ✅). Itu hanya 0,3–1,1% dari biaya program per hektare.
- Pembayarnya:
  - Direktorat Perbenihan Perkebunan dan BBPPTP (B2G);
  - perusahaan kakao dengan program petani (B2B);
  - pemulia;
  - hibah riset BPDP, yang topik resminya: "pemuliaan, penataan varietas… distribusi benih".
- Pasar kakao Indonesia sekitar Rp5–22 M/tahun, global sekitar US$1,4–4,7 jt/tahun. Skala bisnis datang dari ekspansi ke tanaman klonal lain (kelapa, kopi, tebu, rumput laut) dengan engine yang sama.

---

## 1. Konteks industri kakao Indonesia

| Fakta | Sumber | Label |
|---|---|---|
| Produksi 2025 (angka sementara) 616.103 t dari 1.359.567 ha. Produktivitas **714 kg/ha**. | LAKIN Ditjenbun 2025, Tabel 63 | ✅ |
| **291.927 ha kebun berstatus rusak** (TR). Luas areal turun 149.388 ha sejak 2020. | LAKIN Ditjenbun 2025 | ✅ |
| Impor produk kakao 242.010 t / US$2,04 miliar (Jan–Nov 2025) | LAKIN Ditjenbun 2025 (data BPS) | ✅ |
| Harga petani 2025 Rp77.595/kg (non-fermentasi) | LAKIN Ditjenbun 2025 | ✅ |
| Indonesia pengolah kakao ke-4 dunia (grinding 422 rb t), tetapi pabrik hanya jalan sekitar 51% kapasitas karena kekurangan biji | Kemenperin via GNFI (Mar 2026); Antara (Sep 2026) | 🟡 |
| Indonesia turun dari produsen kakao ke-3 dunia ke-7 | Antara, 11 Sep 2026 (Kementan) | 🟡 |

| Rata-rata produktivitas dunia **±0,48 t/ha**, Asia Tenggara ±0,45 t/ha, Indonesia ±0,46 t/ha (2022 dan 2024, data FAO yang sama) | FAOSTAT via Our World in Data, CSV "cocoa-bean-yields" (diunduh 23 Okt 2026) | ✅ |

**Penting:** angka Ditjenbun (714 kg/ha) dihitung per hektare tanaman menghasilkan, sedangkan FAO per hektare panen. Keduanya tidak bisa dibandingkan langsung. Menurut data FAO yang sama, **Indonesia setara rata-rata dunia, bukan "separuh standar dunia"**. Jadi pembanding yang benar adalah potensi klon unggul, bukan rata-rata dunia.

**Kalimat aman:** "Klon yang tepat bisa menggandakan hasil petani: di Pinrang, rata-rata petani 550 kg/ha, sedangkan plot klon unggul ±1.200 kg/ha (ACIAR). Hampir 292 ribu ha kebun rusak, dan pabrik pengolahan kekurangan biji sehingga kita mengimpor sekitar 240 ribu ton produk kakao per tahun."
Jangan campur angka produksi BPS/Ditjenbun (±616 rb t) dengan estimasi ICCO (±200 rb t).

---

## 2. Masalah: kebenaran klon bibit tidak bisa diverifikasi

### 2.1 Bagaimana bibit kakao program mengalir

```
Kebun induk / kebun entres (ditetapkan Dirjenbun, dinilai tim secara visual)
   │  entres (batang atas: MCC 02, Sulawesi 2) + benih batang bawah (hibrida F1 ICCRI 06H / 08H)
   ▼
Penangkar / produsen benih (49 perusahaan kakao ber-pakta integritas)
   │  sambung pucuk di polibeg; dibeli pemerintah per fase lewat e-katalog
   ▼
Sertifikasi BBPPTP / UPTD: pemeriksaan visual, ≤1% bibit diamati, Rp10/bibit
   ▼
Penyaluran ke kelompok tani (puncak Sep–Nov) → ditanam → berbuah 2–3 tahun kemudian
```

| Fakta | Sumber | Label |
|---|---|---|
| Benih program didominasi batang atas MCC 02 atau Sulawesi 2 di atas batang bawah hibrida F1 ICCRI 08H (533.616 batang) dan 06H (304.517) | LAKIN BBPPTP Surabaya 2023, Tabel 17–19 | ✅ |
| ICCRI 06H = TSH 858 × Sulawesi 1; ICCRI 08H = Sulawesi 1 × KEE 2. Sulawesi 1 = PBC 123, Sulawesi 2 = BR 25. | Kepmentan 25/2017 Tabel 1; Dinarti dkk. 2015 | ✅ |
| Indonesia punya sekitar 22 klon/varietas resmi, ditambah 6 klon lama yang diizinkan. Mars–BRIN melepas 2 varietas baru pada Mei 2025. | Kepmentan 25/2017; Ditjenbun 17 Mei 2025 | ✅ |
| Benih dibeli pemerintah per fase (semaian, pasca-semai) lewat **mini-kompetisi e-katalog** | LAKIN Dit. Perbenihan 2025 | ✅ |
| Penyaluran benih perkebunan memuncak **September–November** | Ditjenbun, 4 Jul 2026 | ✅ |

**Implikasi:** registri referensi awal **kecil**. Sekitar 6–8 genotipe inti (MCC 02, Sulawesi 1/2, TSH 858, KEE 2, Sca 6, ICCRI 03/04/09) sudah menutup sebagian besar benih program. Karena hampir semua bibit berupa sambungan di atas batang bawah hibrida, kita perlu dua modul: **identitas klon** dan **parentage/kontaminasi serbuk sari**.

**Tetapi referensinya belum ada.** Genotipe referensi klon-klon inti ini harus didapat dari ICCRI dan pemilik klon. Data publik tidak bisa menggantikannya:
- Hampir semua referensi publik berasal dari **satu pohon per aksesi** (623 dari 627 di data Bekele 2022).
- Bank plasma nutfah sendiri sering salah label: studi Kolombia menemukan 172 plot heterogen.

Karena itu referensi CacaoID diambil dari **3–5 ramet per klon** di kebun entres resmi. Statusnya baru **"terverifikasi"** bila semua ramet sepakat.

### 2.2 Cara identitas diperiksa hari ini

| Fakta | Sumber | Label |
|---|---|---|
| Kata "DNA", "molekul", dan "marka" muncul **0 kali** di lampiran Kepmentan 25/2017 (79 dari 80 halaman dibaca) | Kepmentan 25/2017 (salinan) | ✅ |
| Penilaian kebun sumber benih: "memeriksa dan mengamati kebenaran varietas setiap blok", maksimal 2 hari | Kepmentan 25/2017 Lampiran hlm 60 | ✅ |
| Entres disertifikasi "**Mutu Genetik: Kemurnian 100%**" hanya dari ciri fisik potongan cabang | Kepmentan 25/2017 Lampiran hlm 73–74 | ✅ |
| Sertifikasi bibit polibeg: paling banyak **1% bibit per lot** yang diamati, secara visual | Kepmentan 25/2017 Lampiran hlm 70 (hitungan kami) | ✅ |
| Label resmi **wajib memuat "data kemurnian genetik"**, tetapi tidak ada metode untuk mengukurnya | Permentan 50/2015 Pasal 22 | ✅ |
| Tarif PNBP: pemeriksaan bibit kakao **Rp10/batang**, entres **Rp25/batang**. **Tidak ada pos uji DNA.** | Tarif PNBP BBPPTP Medan (PP 28/2023) | ✅ |
| **Lab DNA sudah ada, tapi tidak dipakai untuk sertifikasi kakao.** Lab uji DNA benih perkebunan BBPPTP Medan (2023, ±Rp95 M) melayani antara lain uji kebenaran/kemurnian varietas dan pembuktian benih palsu. Sejak Mei 2026 dioperasikan PT Orion Biosains lewat KSPO 10 tahun. BBPPTP Surabaya juga punya lab genetika untuk pelepasan varietas. Fokus awal: sawit (gen SHELL). | LAKIN BBPPTP Medan 2023; pengumuman pemenang KSPO 6 Mei 2026 | ✅ |
| Direktorat Perbenihan hanya punya **29 pengawas benih (PBT)** dan mengakui keterbatasan PBT menghambat sertifikasi | LAKIN Dit. Perbenihan 2025 | ✅ |
| Peneliti ICCRI menulis sidik jari DNA "has not been widely carried out on a commercial scale" karena mahal. ICCRI masih memakai RAPD dan rbcL, yang praktis tidak bisa membedakan klon. | Pancaningtyas & Susilo 2022, Coffee Cocoa Res J 38(1) | ✅ |
| Kebijakan 2025–2026 justru mempercepat dan melonggarkan sumber entres: penetapan kebun sumber benih sekitar 1 bulan, "pohon induk terpilih", kebun produksi dijadikan sumber entres (Sep 2026). Potensi benih naik dari ±36 juta ke ±200 juta. | Ditjenbun 7 Jan 2026; Kontan 10 Sep 2026 & 10 Jan 2026 | ✅/🟡 |
| Kepmentan 25/2017 sendiri menyebut pembeda kebun entres dari kebun produksi adalah "**kemurnian klon**", dan klon ditanam per blok agar tidak salah ambil entres | Kepmentan 25/2017 Lampiran hlm 47 | ✅ |

**Kalimat inti untuk pitch:** "Regulasi mensyaratkan kemurnian klon 100% dan data kemurnian genetik di label. Tetapi satu-satunya alat ukurnya adalah mata 29 pengawas, untuk ratusan juta bibit."

### 2.3 Bukti masalah di Indonesia

| Bukti | Sumber | Label |
|---|---|---|
| **Potensi benih kakao kebun Puslitkoka turun 29,84% "akibat adanya campuran varietas lain".** Kebun entres PTPN XII dan Dinas Bali dinyatakan tidak layak. | LAKIN BBPPTP Surabaya 2023 hlm 52–53 | ✅ |
| Direktorat Perbenihan: "mutu benih masih rendah", "kualitas benih yang belum seragam", "lemahnya pengawasan peredaran benih", "belum optimalnya sistem pendataan" | LAKIN Dit. Perbenihan 2025 | ✅ |
| Menteri Pertanian: tantangan perkebunan rakyat mencakup "penggunaan benih yang tidak terjamin mutunya" | Ditjenbun, 17 Jun 2026 | ✅ |
| Analisis SNP USDA–ICCRI atas 58 seleksi petani Sulawesi (210 pohon): "**six intra-clone errors and four synonymous sets**" | Abstrak USDA-ARS (Dinarti, Susilo, Zhang dkk.) | 🟡 abstrak |
| Ketidakseragaman genetik ditemukan bahkan pada **tanaman induk sumber eksplan** klon unggul (Sulawesi 1/2, ICCRI 03/04, Sca 6) | Aziza 2015, tesis S2 UGM | 🟡 tesis |
| Gernas Kakao (2009–2012, sekitar 70 juta bibit SE): di Sikka, 13% lahan peremajaan dan 35% lahan sambung samping tercatat mati. Askindo meminta pengadaan bibit SE dihentikan (2011). | KPPOD–Ford 2013 (data Distanbun); Antara 2011 | ✅/🟡 |
| ACIAR: petani Sulawesi menyambung dengan klon "from a diversity of sources", sehingga keandalan entres menjadi masalah | ACIAR SMAR/2005/074 (2014) | ✅ |
| **Pengawas menolak 6 dari 13 kebun sumber benih kakao (46%)** pada 2019. Pada 2023, 2 dari 3 sumber entres kakao yang diawasi tidak layak. | LAKIN BBPPTP Surabaya 2019 hlm 33–34; LAKIN 2023 | ✅ (alasan penolakan 2019 tidak dirinci) |
| **3 dari 50 nama klon membawa dua genotipe berbeda** (KW617, M 07, RB). "RB" di koleksi Mars berbeda dengan "RB" di Puslitkoka. | Dinarti dkk. 2015, Breeding Science 65:438, Tabel 1 | ✅ isi tabel |
| Bibit SE: **6–16% planlet menyimpang** dari induknya pada marka SSR. Tanaman SE Gernas di Soppeng dan Mamuju berbeda pola SSR dari klon referensinya. | Ajijah 2015 (disertasi IPB); J. Littri 21(2) | ✅ abstrak (penyebut tidak terlihat) |
| Di kebun milik UGM (PT Pagilaran), keragaman di antara pohon berlabel klon yang sama lebih besar daripada keragaman antarklon | Skripsi UGM 2017 | 🟡 |
| KPI "100% benih kakao bermutu" (2025) hanya menghitung sertifikat dan label. BBPPTP Medan mencatat sertifikat benih palsu yang beredar. | LAKIN BBPPTP Surabaya & Medan 2025 | ✅ |
| Analogi kopi Mamasa: bibit bersertifikat BBPPTP yang dibayar sebagai bibit SE diduga separuhnya stek, dan penyedianya divonis Tipikor | PN Mamuju 10/Pid.Sus-TPK/2021; Liputan6 2019 | ✅ vonis / 🟡 klaim stek |
| **Tingkat off-type kebun entres atau lot bibit program** | Belum pernah diukur | ❓ (tujuan pilot) |

**Catatan jujur:** belum ada audit atau laporan yang menyebut bibit Gernas *salah klon*. Masalah yang terdokumentasi adalah kematian, adaptasi, dan penanganan bibit. Jangan klaim "Gernas gagal karena salah klon". Kalimat aman: "Kebenaran klon bibit program tidak pernah diuji, karena alatnya memang tidak ada."

### 2.4 Bukti dari negara lain (pilihan dari 24 studi)

| Studi | Materi | % off-type / salah label | Label |
|---|---|---|---|
| Johnsiul & Awang 2016 | Koleksi plasma nutfah kakao **Malaysia** | **37,3%** salah identifikasi | 🟡 abstrak |
| De Wever dkk. 2019, Sci Rep | Koleksi **Vietnam** (CEFORTT) | **24%** | ✅ |
| Efombagn dkk. 2009, Heredity | Bibit petani dari kebun benih biklonal, **Kamerun** | **Hanya 25%** sesuai F1 rencana; 25,5% hasil selfing | ✅ |
| Eyango dkk. 2025, PLoS ONE | Uji varietas, Kamerun | **18,55%** | ✅ |
| Osorio-Guarín dkk. 2025, Front Plant Sci | Bank gen **Kolombia**, 4.653 pohon | **12,4%** | ✅ |
| Pokou dkk., ICCO | 14 kebun benih **Pantai Gading**, 1.288 pohon | **5 dari 16** klon tetua punya lebih dari satu genotipe | ✅ |
| Padi dkk. 2015 | 6 kebun benih **Ghana**, 2.551 pohon | "pervasive" (0–100% per plot) | ✅ abstrak |
| Bhattacharjee dkk. 2024 | Kebun benih dan kebun petani Sierra Leone / Togo | 33,3% / 45,5% | ✅ abstrak / 🟡 angka |
| Romero Navarro dkk. 2017 | Uji klon CATIE | 6,88% | ✅ |
| **DuVal dkk. 2017 (Mars)** | Uji progeni Brasil | 4,7% off-type **mengubah 48% hasil seleksi** dan menggeser heritabilitas hasil 41% | ✅ |

**Mekanisme yang berulang di semua negara:** label salah sebelum tanam, **batang bawah mengambil alih batang atas**, kontaminasi serbuk sari dan selfing, serta bibit menggantikan klon. Semuanya juga mungkin terjadi di alur benih Indonesia.

### 2.5 Kenapa masalah ini tidak terlihat

Klon kakao hampir tidak bisa dibedakan dari daunnya. Perbedaannya baru tampak saat berbuah, **2–3 tahun setelah bibit dibayar dan kontrak pengadaan ditutup**. Karena itu keluhan "salah klon" tidak muncul di berita, padahal kerugiannya berulang setiap panen.

### 2.6 Dampak: seberapa besar beda klon yang benar

| Fakta | Sumber | Label |
|---|---|---|
| Rata-rata petani Pinrang 550 kg/ha vs plot klon sekitar 1.200 kg/ha | ACIAR SMAR/2005/074 | ✅ |
| Antarklon unggul pun berbeda: MCC 01 ±3.682 vs Sulawesi 01 ±2.772 kg/ha (Luwu Utara) | Hasibuan dkk. 2015, Pelita Perkebunan 31(3) | ✅ |
| Riset Mars Pangkep: kebun multiklonal (minimal 3 klon) menaikkan hasil sampai 50%. Artinya komposisi klon yang benar juga penting. | Mongabay, Mei 2025 | 🟡 |

**ROI ilustratif per hektare.** Penalti hasil adalah asumsi yang harus divalidasi.

| Komponen | Nilai |
|---|---|
| Asumsi off-type | 10% ❓ |
| Penalti hasil pohon off-type | 40% ❓ |
| Target hasil | 1.000 kg/ha |
| Kerugian | 40 kg/ha/tahun × Rp50–78 rb/kg = **Rp2,0–3,1 jt/ha/tahun**, berulang lebih dari 20 tahun |
| Biaya QC CacaoID | **≤Rp0,15 jt/ha, sekali** |

---

## 3. Kenapa sekarang

| Pendorong | Fakta | Label |
|---|---|---|
| Anggaran benih melonjak | Pagu Direktorat Perbenihan Perkebunan 2025 naik dari Rp22,9 M menjadi **Rp1,03 T** (ABT Rp992,7 M untuk benih kakao, kopi, kelapa) | ✅ |
| Volume besar | Renstra: **291 juta batang** benih perkebunan siap salur 2026, dan **6.638 ha kebun benih sebar baru** dibangun 2026 | ✅ |
| Program hilirisasi | Rp9,95 T untuk 7 komoditas perkebunan 2025–2027, termasuk sekitar 285 juta batang benih | ✅ |
| Target peremajaan kakao 2026 | 102.488 ha peremajaan + 71.722 ha perluasan, 1.000 bibit/ha | 🟡 |
| **KPI baru pemerintah** | "Persentase benih bermutu terhadap total benih kakao yang beredar", target **80% per tahun** (2025–2029). CacaoID bisa menjadi alat ukurnya. | ✅ |
| **Permintaan eksplisit** | Jun 2026: Direktorat Perbenihan meminta PBT memastikan "**kemurnian genetik benih**" dengan "**pemanfaatan teknologi**" untuk "akurasi, efektivitas, dan transparansi" | ✅ |
| Preseden DNA | Direktorat yang sama mewacanakan uji DNA benih sawit PSR pada 2022 | 🟡 |
| Akuntabilitas pengadaan | Kementan menggandeng Kejaksaan Agung mengawal program hilirisasi, dan PPK menandatangani pakta integritas | ✅ |
| Regulasi dana BPDP | Permentan 31/2025: dana kakao BPDP boleh dipakai untuk riset "kebun induk kakao yang baru, pemuliaan, perbenihan". Benih bantuan **wajib bersertifikat**, dan usulan wajib menyertakan poligon kebun. | ✅ |
| Aturan sedang bergerak | Kepmentan 25/2017 sudah diubah 2018 dan Juni 2025 (Kepmentan 49/2025). Menurut Kementan sedang direvisi lagi (Sep 2026). Ini titik masuk untuk menambahkan metode verifikasi berbasis marka. | ✅/🟡 |

**Narasi "kenapa sekarang" dalam satu kalimat:** pemerintah membelanjakan triliunan untuk bibit, melonggarkan sumber entres demi kecepatan, menetapkan KPI mutu benih 80%, dan secara terbuka meminta teknologi untuk kemurnian genetik. Semua itu dengan pengawas yang sangat terbatas.

**Yang tidak boleh dijadikan argumen:**
- **Kekurangan bibit.** KPI ketersediaan bibit kakao sudah 117,9% (✅). Argumennya mutu, bukan jumlah.
- **EUDR.** Aturan itu hanya mewajibkan geolokasi, bukan data genetik.

---

## 4. Produk CacaoID

### 4.1 Pengguna

| Pengguna | Kebutuhan | Apa yang dilihat di CacaoID |
|---|---|---|
| **Direktorat Perbenihan Perkebunan** (pemilik anggaran dan KPI) | Mengukur KPI "% benih bermutu", akuntabilitas pengadaan | Dasbor nasional: % lot terverifikasi, peta off-type per kebun sumber dan per penyedia |
| **PBT di BBPPTP / UPTD** (pengguna operasional) | Menilai kebun sumber benih dan sertifikasi lot dengan tenaga terbatas | Aplikasi ambil sampel (QR per pohon/lot), daftar tugas, vonis siap dilampirkan di sertifikat |
| **Penangkar / produsen benih** | Melindungi pembayaran termin dari sengketa, membedakan diri | Sertifikat "Terverifikasi DNA" per kebun entres dan per lot |
| **Perusahaan kakao** (program kemitraan petani) | Memastikan bibit yang dibagikan benar, klaim produktivitas | Dasbor multi-nursery, atribut "bahan tanam terverifikasi" per poligon kebun |
| **Pemulia** (Puslitkoka/RPN, BRIN, Mars) | Membersihkan data uji dari off-type, memilih tetua | Modul QC uji lapang, parentage, prediksi genomik |
| **Petani** (penerima manfaat) | Bibit yang benar | Scan QR pada label: asal kebun induk dan status verifikasi |

### 4.2 Alur kerja end-to-end

| Langkah | Siapa | Apa yang terjadi | Waktu |
|---|---|---|---|
| 1. Registrasi | PBT / penangkar | Penyedia mendaftarkan kebunnya beserta **daftar klon yang ditanam** di sana (dipakai untuk uji asal biji). Pohon induk dan lot bibit diberi QR, dengan koordinat dan klon yang diklaim. | Saat penetapan kebun sumber benih atau saat fase semaian |
| 2. Sampling | PBT, **bersamaan dengan pemeriksaan visual yang memang sudah wajib** | 6–8 cakram daun per pohon, dikeringkan dalam silika. Tidak perlu rantai dingin. CacaoID menghitung berapa sampel yang perlu diambil per lot (modul desain sampling). | Beberapa menit per pohon |
| 3. Genotyping | Lab mitra **di Indonesia** | Ekstraksi DNA + panel KASP 38–60 SNP di mesin qPCR biasa. Lab mengunggah file hasil (CSV KASP, VCF, atau HapMap). | ±2–4 minggu |
| 4. Analisis | CacaoID | QC data → vonis identitas → cek batang bawah → parentage/kontaminasi → skor risiko lot | Menit |
| 5. Keputusan | PBT / Direktorat | Laporan per pohon/lot: COCOK / OFF-TYPE / BATANG BAWAH / TIDAK DIKENAL / BELUM ADA REFERENSI (atau UJI ULANG bila data lab kurang), beserta tingkat keyakinan. BELUM ADA REFERENSI berarti klon yang diklaim belum punya sidik jari referensi; sistem tetap melaporkan "cocok dengan X" bila pohon itu cocok dengan klon terdaftar lain. Pohon off-type ditandai untuk ditebang, sesuai prosedur pemurnian yang sudah ada di Kepmentan. | – |
| 6. Sertifikat dan jejak audit | Sistem | PDF lampiran sertifikasi, QR di label, catatan audit tak terubah untuk PPK dan pengawas | – |
| 7. Pemantauan | Direktorat / perusahaan | Dasbor KPI dan peta, tren per penyedia dan per kebun sumber | Terus-menerus |

**Penjadwalan:** penyaluran memuncak Sep–Nov, jadi audit lot dilakukan Agustus–Oktober saat fase pasca-semai. Audit pohon induk dilakukan sekali saat penetapan, lalu diulang saat evaluasi tahunan kebun sumber benih yang memang sudah diwajibkan.

### 4.3 Modul inti

| # | Modul | Apa yang dikerjakan | Kenapa ini deep-tech, bukan lookup |
|---|---|---|---|
| 1 | **Engine identitas probabilistik** | Rasio likelihood "klon sama vs beda", dengan model error genotipe dan data hilang. Keluarannya *probability of identity*, status TIDAK DIKENAL untuk genotipe di luar registri, dan BELUM ADA REFERENSI bila klon yang diklaim belum punya sidik jari (tetap disebut "cocok dengan X" bila cocok dengan klon terdaftar lain). | Data lab selalu mengandung error dan data bolong; pencocokan sederhana akan salah. Ambang keputusan dikalibrasi terhadap laju error lab. |
| 2 | **Deteksi batang bawah mengambil alih** | Menguji apakah pohon adalah anak dari **silangan batang bawah resmi yang terdaftar** (mis. TSH 858 × Sulawesi 1 atau Sulawesi 1 × KEE 2), bukan batang atas yang diklaim | Penyebab salah label yang terdokumentasi di Ghana dan Nigeria. Butuh inferensi parentage terhadap hipotesis spesifik, bukan sekadar pencocokan. |
| 3 | **Parentage dan kontaminasi serbuk sari** | (a) Kebun benih biklonal penghasil hibrida: estimasi % bibit hasil polen liar atau selfing per lot dan per kebun, dikoreksi untuk error genotipe dan daya eksklusi panel. (b) **Asal biji:** menguji apakah pohon yang tidak dikenal adalah anak dari klon-klon yang **tercatat di kebun itu** (butuh daftar klon kebun dari pendaftaran penyedia). | Estimator statistik tingkat populasi (sudah kami uji, bagian 5). Pencarian tetua bebas di seluruh registri sengaja **tidak** ditawarkan: dengan panel 48 SNP hasilnya tidak andal. Bisa ditambah prediksi risiko selfing dari marka self-incompatibility (Lanaud 2017). |
| 4 | **Desain panel SNP untuk klon Indonesia** | Memilih panel terkecil yang membedakan semua klon rilis Indonesia beserta tetuanya, memakai SNP publik CC BY (DuVal 2017, Osorio-Guarín 2025, De Wever 2019) agar kompatibel dengan ICGD/USDA | Optimasi kombinatorial dengan syarat redundansi (setiap pasang klon dipisahkan ≥3 SNP agar tahan error) |
| 5 | **Desain sampling berbasis risiko** | Menghitung berapa sampel per lot agar off-type ≥x% terdeteksi dengan keyakinan 95%. Untuk memastikan kontaminasi lot hibrida ≤5% perlu **minimal 59 bibit** per lot; 20 bibit hanya memberi rentang yang lebar. Skor risiko penyedia menyesuaikan jumlah sampel **secara kontinu**: penyedia bersih dengan riwayat panjang ±31 bibit, penyedia berisiko tinggi 50 lebih. | Statistik acceptance sampling. Menekan biaya karena tidak perlu menguji setiap bibit. |
| 6 | **Registri dan jejak audit** | Rantai bukti pohon induk → entres → lot bibit → penerima. Catatan tak terubah, siap diperiksa PPK, Itjen, dan Kejagung. | Model data yang menautkan genotipe, lokasi, dokumen sertifikasi, dan kontrak pengadaan |
| 7 | **Dasbor KPI** | "% benih kakao bermutu yang beredar" per BBPPTP/provinsi, peta off-type, kinerja per penyedia | Langsung menjawab KPI resmi Renstra |
| 8 | **Prediksi komponen hasil (layanan terpisah untuk pemulia)** | GBLUP/ML untuk komponen hasil (jumlah biji, ukuran biji, pod index), dengan validasi silang berblok kekerabatan. **Bukan prediksi hasil panen.** Butuh genotyping **genome-wide (±589 SNP)**, bukan panel verifikasi 48 SNP, jadi dijual sebagai layanan seleksi semaian dari silangan dengan harga per sampel genome-wide. Di dalam verifikasi, vonis OFF-TYPE bisa menampilkan perbandingan komponen hasil klon yang dibayar vs klon yang diterima, diambil dari sidik jari lengkap klon di registri (sedang dibangun). | Sudah kami uji (bagian 5). Ketahanan VSD masuk roadmap, karena saat ini baru ada QTL, belum ada model GS publik. |
| 9 | **Integrasi** | API ke data poligon Permentan 31/2025 (STD-B), sistem traceability buyer (mis. Koltiva), dan aplikasi traceability benih PT RPN | Opsional, bukan pendorong utama |

### 4.4 Apa yang benar-benar baru

| Yang sudah ada | Yang belum ada (celah CacaoID) |
|---|---|
| Panel SNP minimal untuk kakao: **CacaoCipher**, 32 SNP (USDA, Ahn dkk. 2026). Panel 96 SNP Mars/LGC. | Panel yang dioptimalkan untuk **klon rilis dan tetua Indonesia** dan dijalankan di lab Indonesia |
| Layanan sidik jari per sampel di Trinidad (CRC/UWI, US$16–50/sampel) | Alur **operasional sertifikasi benih**: vonis 5 status + UJI ULANG, batang bawah, parentage lot, registri, jejak audit, dasbor KPI |
| Database referensi ICGD untuk bank gen | Registri klon **nasional** Indonesia, dengan data yang **tetap di Indonesia** (UU 11/2019) |
| Alat riset (Cervus, COLONY, PLINK, rrBLUP) | Dibungkus untuk operator non-ahli (PBT), dengan ambang keputusan terkalibrasi |
| Audit kebun benih sekali jalan yang didanai riset (Ghana, Pantai Gading) | Layanan **rutin** yang menempel pada proses sertifikasi dan pengadaan yang sudah ada |

**Posisi jujur:** uji panel 38 SNP kami adalah **replikasi** temuan CacaoCipher pada data yang sama. Kebaruan CacaoID ada pada lapisan keputusan, alur sertifikasi, dan registri Indonesia, bukan pada panel minimal.

**Dirancang dari uji skenario nyata.** Saat membangun MVP, kami sengaja menjalankan kesalahan yang biasa terjadi di lab dan lapangan. Hasilnya menjadi fitur:
- **deteksi sampel tergeser satu sumur di plate lab**, yang tanpa deteksi ini menghasilkan banyak OFF-TYPE palsu walaupun kontrol lolos;
- **koreksi otomatis untai DNA terbalik** dari lab;
- **kontrol plate positif dan negatif wajib**;
- file lab berupa **CSV bertitik koma** (Excel berlokal Indonesia) atau **.xlsx** tetap terbaca;
- **mode tanpa sinyal** di halaman lapangan: sampel tersimpan di perangkat dan terkirim saat online;
- **jejak audit berantai**: setiap perubahan riwayat langsung ketahuan.

### 4.5 Arsitektur software (ringkas)

```
Aplikasi PBT (mobile/web, offline)  ──►  API CacaoID  ◄──  Portal lab mitra (unggah CSV KASP / VCF / HapMap)
                                            │
            ┌───────────────────────────────┼────────────────────────────────┐
            ▼                               ▼                                ▼
  Pipeline QC genotipe            Engine keputusan                   Registri & audit
  (call rate, error lab,          (identitas LR, batang bawah,       (Postgres + log tak terubah,
   kontrol positif)                parentage, sampling, GS)            dokumen sertifikat, QR)
                                            │
                                            ▼
                         Dasbor KPI & peta (Direktorat, BBPPTP, perusahaan)
```

**Prinsip:**
- **Tidak terikat lab** (input standar dari lab mana pun).
- **Data di-host di Indonesia**, karena UU 11/2019 Pasal 77 menyebut pengalihan spesimen termasuk bentuk digital.
- Data petani diperlakukan sebagai data pribadi (UU PDP 27/2022).
- Setiap vonis disertai tingkat keyakinan, sehingga bisa dijelaskan ke pengawas.

---

## 5. Bukti yang sudah kami jalankan (data publik)

**Data:** Bekele dkk. 2022, PLoS ONE 17:e0260907, **CC BY 4.0**. Isinya 644 sampel bank gen kakao Trinidad, termasuk tetua yang dipakai di Indonesia (ICS60, SCA6, TSH1188, DR1, IMC67, NA33), serta fenotipe 346 aksesi.
**Skrip** ada di `scratchpad/kakao_scripts/` (path lengkap di bagian 14).

### 5.1 Uji 1: deteksi bibit salah klon

| Pertanyaan | Hasil |
|---|---|
| SNP yang bisa dipakai setelah QC (call rate >90%, MAF >5%) | 589 SNP × 644 sampel |
| Genotipe unik | 566 |
| SNP minimum untuk membedakan semua genotipe | 20 |
| Simulasi kebun entres: 1.000 pohon diklaim satu klon, 15% sebenarnya klon lain, error genotipe 2%, data hilang 5%, 300 ulangan | 20 SNP: recall 99,9%, presisi 98,4% · **38 SNP: recall 100%, presisi 99,8%** · 60 SNP: 100% / 100% |
| Kandidat salah label di koleksi publik itu sendiri | 4 aksesi bernama sama dengan genotipe sangat berbeda: ICS39, ICS81, SJ2/20, AMAZ6. Ini masih kandidat dan perlu dicek ke paper. |

Hasil ini sejalan dengan CacaoCipher (32 SNP, identifikasi >95% pada error 5%). Biaya panel sebesar ini sekitar US$6–15/sampel (KASP).

### 5.2 Uji 2: estimasi kontaminasi serbuk sari di kebun benih hibrida

Simulasi lot bibit hibrida ICS60 × SCA6 (keduanya tetua yang dipakai di Indonesia), 200 bibit per lot, error genotipe 2%, 100 ulangan per skenario.

| Kontaminasi sebenarnya | 5% | 10% | 20% | 30% |
|---|---|---|---|---|
| Estimasi (panel 48 SNP) | 5,0% ± 1,7 | 10,1% ± 2,2 | 20,2% ± 2,8 | 30,3% ± 3,2 |

**Pelajaran teknis:** versi pertama estimator kami bias ke atas, karena error genotipe membuat bibit sah terlihat "terkontaminasi". Setelah dikoreksi untuk laju eksklusi palsu dan daya eksklusi panel, hasilnya tidak bias. Inilah contoh kenapa engine keputusan bukan sekadar lookup.

### 5.3 Uji 3: prediksi genomik komponen hasil

345 aksesi dengan genotipe dan fenotipe. Kernel ridge (setara GBLUP). Korelasi prediksi vs observasi.

| Sifat | CV acak 5-fold | CV berblok kekerabatan (lebih ketat) | Pembanding Bekele 2022 |
|---|---|---|---|
| Jumlah biji per buah (FR_BEN) | 0,66 | 0,60 | 0,61 |
| Lebar biji (FR_BW) | 0,64 | 0,57 | 0,54 |
| Panjang biji (FR_BL) | 0,61 | 0,58 | 0,62 |
| Lebar buah (FR_POW) | 0,59 | 0,58 | – |
| Pod index | 0,50 | 0,42 | – |
| Panjang buah (FR_POL) | 0,38 | 0,30 | – |

Hasilnya konsisten dengan literatur: hasil r ≈ 0,48 di CATIE (Romero Navarro 2017), dan sekitar 0,6 untuk sifat biji (Bekele 2022).

### 5.3b Uji 4: uji buta pada data nyata 4.653 pohon (bank gen Kolombia)

**Data:** Osorio-Guarín dkk. 2025, *Front Plant Sci*, CC BY. Lampiran Tabel 4 berisi genotipe 4.653 pohon × 77 SNP KASP. Lampiran Tabel 5 berisi 172 plot yang dinyatakan peneliti salah label (577 pohon, dasar angka 12,4%).
**Skrip:** `scratchpad/kakao_scripts/colombia_bench.py` dan `colombia_refine.py`.

| Hasil (tanpa melihat label paper) | Angka |
|---|---|
| Plot salah label versi paper yang ditemukan ulang | **169 dari 171 (99%)** |
| Plot tambahan yang ditandai engine | 99 (toleransi 2 SNP) / 62 (toleransi 5 SNP). Separuhnya beda ≤5 SNP (status "uji ulang"). Sisanya beda jauh, tapi tata letak plot tidak tersedia. |
| Pohon off-type yang identitasnya dikenali sebagai aksesi lain | 129 pohon, mis. "EET62" = EET262, "SC11" = ICA11, "FEC3" = PA16A |

**Batasan:** label paper juga hasil pencocokan genotipe (bukan kebenaran mutlak), presisi terhadap paper tidak bisa dinilai penuh tanpa data plot, dan ini bank gen Kolombia, bukan rantai benih Indonesia. Engine MVP (toleransi replikat bawaan 5%) menemukan ulang 170 dari 171 plot dan menandai 84 plot lain yang belum bisa dipastikan tanpa kurator.

**Kalimat yang boleh dipakai:** "menemukan ulang 99% plot salah label versi paper". **Jangan** klaim presisi atau jumlah plot tambahan sebagai temuan.

### 5.3c Uji 5: perbandingan 7 model AI prediksi genomik

345 aksesi (Bekele 2022, CC BY), 589 SNP. Validasi silang berblok kekerabatan 3×5, sehingga kerabat dekat tidak pernah terpisah antara data latih dan data uji. Skrip: `scratchpad/kakao_scripts/gs2.py`.

| Model | Jumlah biji | Lebar biji | Panjang biji | Lebar buah | Pod index | Rata-rata |
|---|---|---|---|---|---|---|
| SVR (RBF) | **0,64** | 0,54 | 0,59 | 0,55 | 0,46 | 0,56 |
| Random forest | 0,59 | 0,58 | 0,58 | 0,54 | **0,49** | **0,56** |
| RR-BLUP (setara GBLUP) | 0,58 | **0,60** | 0,58 | **0,56** | 0,43 | 0,55 |
| Gradient boosting | 0,56 | 0,56 | 0,55 | 0,52 | 0,45 | 0,53 |
| Lasso | 0,51 | 0,54 | 0,53 | 0,51 | 0,36 | 0,49 |
| Neural net (MLP) | 0,48 | 0,49 | 0,48 | 0,43 | 0,34 | 0,44 |

**Temuan:**
- Model nonlinier (SVR, random forest) sedikit unggul.
- Neural net justru terendah, karena data hanya 345 aksesi.
- Kepentingan per SNP kecil dan merata, jadi sifat ini poligenik: tidak ada satu SNP penentu.
- Catatan: GBLUP di run ini salah setel regularisasi, sehingga yang dilaporkan adalah RR-BLUP, padanannya yang disetel benar.

### 5.3d Uji 6: penelusur asal-usul (AI kelompok genetik)

**Versi MVP (sudah memakai kelompok Motamayor 2008, tanpa kelas "Trinitario").** Trinitario adalah populasi budidaya (Criollo × Amelonado/Forastero), **bukan kelompok genetik**.

Pohon referensi dari Bekele 2022. Label kelompok diambil dari awalan nama aksesi; pohon Criollo dan Amelonado dicek dulu dengan genom publik:
- **Ada:** Nanay 126, Marañón 54, Iquitos 47, Guiana 16, Criollo 10, Contamana 8, Amelonado 3.
- **Belum ada:** Curaray, Purús, Nacional.
- Pengecekan genom menemukan pohon "MATINA1" di bank gen Trinidad sebenarnya bukan Amelonado (cocok hanya 48% dengan genom Matina 1-6). Pohon itu tidak dipakai sebagai referensi.

Model: komposisi genetik dengan EM terawasi.

| Pohon | Terbaca sebagai | Arti |
|---|---|---|
| SCA6 | Contamana 100% | Benar (klon kelompok murni) |
| TSH1188 | Campuran Iquitos 47%, Nanay 16%, Marañón 13%, Amelonado 11%, Contamana 7%, Criollo 5% | Sesuai: hibrida |
| CATONGO (Amelonado) | Amelonado 100% | Benar |
| ICS1 (Trinitario) | Amelonado 66% + Criollo 34% | Benar: Trinitario = Criollo × Amelonado |
| ICS60 (Trinitario) | Criollo 52% + Amelonado 47% | Benar |

Penempatan pohon kelompok murni ke kelompoknya ±82% benar (internal, jangan di slide; diukur sebelum Criollo/Amelonado ditambahkan). Angkanya hampir sama dengan hanya 48 SNP panel, jadi sampel lapangan pun bisa diperkirakan kasar.

**Batasan:**
- Curaray, Purús, dan Nacional belum terwakili, jadi pohon berlatar belakang itu terbaca sebagai campuran kelompok lain. Referensi Criollo dan Amelonado hanya 10 dan 3 pohon.
- Label kelompok masih dari nama aksesi (Criollo/Amelonado sudah dicek dengan genom publik), belum dari analisis STRUCTURE penuh. Contohnya, IMC67 berlabel Iquitos tetapi terbaca 89% Nanay.
- Versi riset sebelumnya memakai kelas "Trinitario" (angka ±84%). Itu keliru secara metode dan **tidak boleh dikutip**.
- Klaim "asal biji vs sambungan" ditangani uji parentage (bagian 4.3 modul 2–3), bukan komposisi.

### 5.4 Batasan yang harus disebut

- Uji 1 dan 2 adalah simulasi dunia tertutup: off-type dan polen liar berasal dari klon yang ada di referensi.
- **Referensi publik hampir semuanya satu pohon per aksesi** (623 dari 627). Bila pohon referensi itu salah label di bank plasma nutfah, semua vonis untuk klon itu ikut salah. Karena itu registri CacaoID memakai 3–5 ramet per klon (bagian 2.1).
- **Parentage di panel 48 SNP hanya andal untuk hipotesis spesifik:** silangan batang bawah terdaftar, atau pasangan klon yang tercatat di kebun itu. Pencarian tetua bebas di seluruh registri (±620 klon) tidak andal.
- **Prediksi komponen hasil butuh genotyping genome-wide (±589 SNP).** Sampel verifikasi dengan 48 SNP tidak bisa diprediksi, dan sistem menolaknya dengan pesan jelas.
- **Lot benih hibrida perlu minimal 59 bibit** untuk memastikan kontaminasi ≤5% (keyakinan 95%).
- **Klon rilis Indonesia belum ada sebagai data genotipe siap pakai.** WGS mentah Sulawesi 1/2 dan seleksi Mars M01–M07 ada di SRA (PRJNA486011), tetapi perlu genotyping ulang. MCC 02 dan hibrida ICCRI tetap harus didapat dari Puslitkoka/RPN, BRIN, dan Mars.
- Prediksi genomik diuji pada koleksi bank gen, bukan populasi pemuliaan Indonesia. Panel identitas kecil (±90 SNP) cukup untuk GS pada klon berkerabat. Populasi F1 multi-tetua butuh sekitar 1.000 marka dan sekitar 450 individu latih (Jacquotte dkk. 2026).

---

## 6. Pesaing dan posisi

| Pemain | Apa yang dilakukan | Kemiripan | Celah / posisi kita |
|---|---|---|---|
| **CRC/UWI Trinidad**, Cocoa DNA Fingerprinting Service | Sidik jari SNP untuk bank gen, kebun benih, nursery. US$16–50/sampel. Pendapatan layanan ±US$38 rb (2021). | 55% | Tidak punya referensi klon Indonesia, registri, audit lot, maupun dasbor program. Sampel harus dikirim ke luar negeri (bertentangan dengan UU 11/2019 Pasal 77). CRC berhak memakai data klien. |
| **Lab uji DNA benih perkebunan Kementan, Medan** (dioperasikan PT Orion Biosains, KSPO 10 tahun sejak Mei 2026) | Uji DNA benih: gen SHELL sawit, kebenaran/kemurnian varietas, pembuktian benih palsu | 40% | Fokus awal sawit. Belum ada panel dan registri klon kakao, alur sertifikasi kakao, maupun dasbor. **Calon mitra lab utama:** punya alat dan izin, dan perlu pendapatan dari komoditas baru untuk menutup kontribusi KSPO ≥Rp1,35 M/tahun. Sekaligus **pesaing potensial** bila mereka membangun lapisan software sendiri. |
| **Mars** (MCRS Pangkep; panel 96 SNP via LGC) | Off-typing internal untuk uji progeni sendiri | 50% | Tidak dijual ke pemerintah/penangkar. **Calon mitra referensi dan pelanggan awal.** |
| **USDA-ARS** (CacaoCipher 32 SNP) | Riset panel dan GS | 45% | Riset, bukan layanan operasional. **Sumber kredibilitas dan kolaborator.** |
| **ICGD** (Univ. Reading) | Database referensi genotipe untuk bank gen | 40% | Bukan alur sertifikasi benih. **Mitra referensi.** |
| Breedbase / BMS (open-source) | Manajemen pemuliaan generik | 30% | Tidak punya alur QC benih klonal |
| Nestlé / CIRAD | GS ketahanan penyakit in-house | 30% | Internal, Amerika Latin |
| LGC, Intertek, DArT; distributor LGC Jakarta (PT Ecosains Hayati, PT Sciencewerke) | Lab genotyping / reagen | 20% | Hanya data mentah. **Mitra pemasok data.** |
| ICCRI/Puslitkoka (status quo riset) | RAPD, rbcL, SSR; tanpa layanan SNP komersial | – | **Mitra:** pemilik klon rilis, punya lab molekuler |
| BBPPTP (status quo sertifikasi) | Pemeriksaan visual Rp10–25/batang | – | **Pengguna:** CacaoID melengkapi, bukan menggantikan |
| Koltiva, PT RPN (traceability) | Geolokasi, traceability benih tanpa genetik | 10–15% | **Kanal integrasi** |

**Ringkasan posisi:** tidak ada pemain yang menggabungkan referensi klon Indonesia, lab dalam negeri, alur sertifikasi, dan registri audit. Pesaing terdekat (CRC/UWI) justru terhalang aturan Indonesia dan pasarnya kecil. Itu tanda bahwa nilai ada di **kontrak program**, bukan jual jasa per sampel.

---

## 7. Model bisnis

### 7.1 Pembayar (urut dari yang paling realistis)

| # | Pembayar | Yang dibeli | Sumber dana | Bukti |
|---|---|---|---|---|
| 1 | **Direktorat Perbenihan Perkebunan** | Registri klon nasional + dasbor KPI + audit pohon induk kebun sumber benih baru | RO "Penyidikan dan Pengujian Produk" (Rp4,9 M/tahun ✅); anggaran produksi benih hilirisasi | KPI 80% benih bermutu ✅; permintaan teknologi kemurnian genetik ✅ |
| 2 | **BBPPTP / Disbun provinsi** (mis. Sulsel, target 20 rb ha 2026 🟡) | Lisensi wilayah | Anggaran sertifikasi / program provinsi | Kekurangan PBT ✅ |
| 3 | **Perusahaan kakao** (Mars, Cargill, ofi, Barry Callebaut, Nestlé, grinder lokal) | Verifikasi bibit program kemitraan petani | Anggaran sustainability/kemitraan (contoh: premi Cargill ±Rp35 M di satu provinsi 🟡) | Permentan 31/2025 membuka jalur peremajaan lewat kemitraan ✅ |
| 4 | **Pemulia** (Puslitkoka/RPN, BRIN, Mars, universitas) | QC uji lapang, parentage, GS | Hibah riset | – |
| 5 | **Penangkar** | Sertifikat "Terverifikasi DNA" | Margin bibit | ❓ belum diuji |
| – | **BPDP** | **Hibah riset**, bukan lisensi | Topik kakao resmi: "Pemuliaan, penataan varietas dan teknologi perbanyakan, penyimpanan, dan distribusi benih" ✅ | Pungutan kakao BPDP masih kecil, jadi jangan pitch "BPDP membayar lisensi" |

### 7.2 Unit economics (format juri Track 2)

| Metrik | Nilai | Dasar |
|---|---|---|
| Biaya lab panel KASP 38–60 SNP | US$3–15/sampel | Intertek US$2,6/10 SNP ✅; CGIAR US$1–5 🟡; harga lab Indonesia ❓ |
| Biaya all-in per sampel (sampling + lab + software) | **Rp85–285 rb** (basis ±Rp150 rb) | Asumsi berlabel |
| Per bibit (audit lot 1 sampel per 2.000 bibit) | **Rp43–143/bibit** | Sebanding dengan belanja pengawasan sekarang Rp52/batang ✅. Setara 59 sampel untuk lot ±120 rb bibit; lot yang lebih kecil membuat biaya per bibit naik. |
| Per lot benih hibrida | Minimal **59 bibit diuji** agar kontaminasi ≤5% terpastikan (keyakinan 95%). Biaya ≈ 59 × biaya per sampel = **±Rp5–17 jt/lot** all-in (komponen lab: 59 × harga KASP per sampel). | Statistik sampling. Dengan 20 bibit, rentang estimasi sangat lebar (contoh simulasi 8–42%). |
| Penyesuaian risiko | Skor risiko penyedia mengatur jumlah sampel secara kontinu: penyedia bersih dengan riwayat panjang ±31 bibit/lot, penyedia berisiko tinggi 50 lebih | Menekan biaya untuk penyedia yang terbukti baik |
| Layanan pemulia (prediksi komponen hasil) | Per sampel **genome-wide (±589 SNP)**, lebih mahal dari panel KASP (harga ❓) | Bukan bagian dari verifikasi bibit rutin |
| Per hektare (1.000 bibit/ha) | Rp43–143 rb/ha = **0,3–1,1% biaya program** (Rp13–15 jt/ha, realisasi APBN 2025 ✅) | – |
| Per pohon induk | Rp85–285 rb sekali per 3–5 tahun. Satu pohon induk memasok entres untuk banyak bibit, jadi per bibit hampir nol. | – |
| Sampling | Cakram daun + silika, tanpa rantai dingin, menempel pada pemeriksaan PBT yang sudah wajib | Alur terbukti pada 4.653 pohon di Kolombia ✅ |
| Frekuensi | Pohon induk sekali + evaluasi tahunan; lot per fase pengadaan | Sesuai siklus pembibitan, bukan siklus panen |

**Prinsip harga:** jangan menjual per batang di atas tarif PNBP (Rp10). Jual per pohon induk, per lot, dan per lisensi program, dengan biaya total sebanding biaya pengawasan yang sudah dibelanjakan negara.

### 7.3 Tier harga yang diusulkan

| Tier | Pembeli | Harga | Isi |
|---|---|---|---|
| B2G-1 Lisensi provinsi/BBPPTP | Disbun, BBPPTP | **Rp150–200 jt/tahun**, termasuk hingga 3.000 sampel (software) | Registri wilayah, vonis, dasbor KPI, lampiran sertifikat |
| B2G-2 Registri nasional | Direktorat Perbenihan | **Rp0,75–1,5 M/tahun** | Registri klon rilis, optimasi panel nasional, API untuk semua UPT/UPTD |
| B2G-3 QC per bibit tersalur | Program APBN/kemitraan | **Rp50–100/bibit**, all-in termasuk lab mitra | Audit lot + pohon induk |
| B2B Enterprise | Perusahaan kakao | **Rp150–600 jt/tahun** | Multi-nursery, API traceability |
| B2B Penangkar | Produsen benih | Rp5–15 jt/tahun + per sampel | Sertifikat "Terverifikasi DNA" |
| Per sampel | Lab, pemulia, donor | Rp15–30 rb (software saja) / Rp120–250 rb (bundel lab) | – |
| Proyek R&D / GS | BPDP, BRIN, Mars, donor | Rp0,3–1 M per proyek | Model GS, desain panel, seleksi semaian dari silangan (per sampel genome-wide) |

Lisensi provinsi sengaja dibuat ≤Rp200 jt agar bisa lewat pengadaan langsung. Ambang ini perlu dicek ke aturan pengadaan yang berlaku (❓).

### 7.4 Ukuran pasar

| Lapisan | Nilai/tahun (pendapatan software) | Catatan |
|---|---|---|
| **SAM kakao Indonesia** | **Rp5–22 M** (US$0,3–1,35 jt) | Rendah = volume 2027, tinggi = volume 2026 |
| SOM tahun 1 / 2 / 3 | Rp0,35 M / Rp1,5–3 M / Rp3–6 M | Pilot → 3 provinsi → registri nasional |
| SAM kakao global | US$1,4–4,7 jt | Program nasional (Ghana: mandat 60 juta bibit gratis/tahun ✅), perusahaan global, bank gen |
| **Ekspansi tanaman klonal Indonesia** (engine sama) | belum dihitung | Kelapa (komoditas BPDP, target ±150 rb ha 2026 🟡); kopi (APBN 17,9 rb ha 2025 ✅); tebu (Rp1,45 T 2025 ✅); karet; rumput laut (KKP mengakui bibit tidak murni ✅) |

**Kesimpulan jujur:** kakao saja adalah ceruk. Kakao dipilih sebagai **beachhead** karena programnya sedang dibelanjakan, masalahnya terdokumentasi, dan datanya tersedia. Skala bisnis datang dari tanaman klonal lain dan proyek rehabilitasi kakao Afrika Barat (modul parentage kebun benih hibrida).

### 7.5 Proyeksi 12 bulan (Nov 2026–Okt 2027)

| Kuartal | Aktivitas | Pendapatan (basis) |
|---|---|---|
| Q1 | Ikut **Lomba Riset Mahasiswa BPDP (batas 30 Okt 2026)**; MoU referensi klon dengan Puslitkoka/RPN dan BRIN | Rp0 (hadiah lomba jika menang) |
| Q2 | Pilot 1 kabupaten Sulsel: ±300 pohon induk + 30 lot. Genotyping ±US$2–5 rb. Ukur tingkat off-type pertama di Indonesia. Wawancara WTP. | Rp0–50 jt |
| Q3 | Kontrak pilot berbayar dengan 1 perusahaan; kirim BPDP Grant Riset 2027 | Rp100–150 jt |
| Q4 | 1 lisensi provinsi/BBPPTP + 2–5 rb sampel | Rp200–325 jt |
| **Total** | | **Basis ±Rp0,35 M**; optimis Rp1,0–1,5 M |

Volume bibit program turun sekitar 65% pada 2027 (Renstra 291 juta → 81,6 juta batang ✅). Karena itu fokus tahun pertama ada pada **registri pohon induk dan audit 6.638 ha kebun benih baru**, yang tetap relevan meski volume bibit turun.

---

## 8. Regulasi dan kepatuhan

| Aturan | Isi yang relevan | Implikasi |
|---|---|---|
| UU 22/2019 (Sistem Budi Daya Pertanian Berkelanjutan) Pasal 30, 115 | Benih unggul wajib memenuhi standar mutu dan bersertifikat. Mengedarkan benih tidak sesuai diancam pidana 6 tahun / Rp3 M. | Verifikasi identitas melindungi penyedia dan PPK |
| Permentan 50/2015 Pasal 22 | Label wajib memuat "data kemurnian genetik" | CacaoID = **metode ukur untuk syarat yang sudah ada**, tidak perlu aturan baru |
| Kepmentan 25/2017 + 67/2018 + 49/2025 | Pedoman benih kakao; visual; sedang direvisi | Usulkan "verifikasi identitas berbasis marka" sebagai opsi metode di lampiran revisi |
| Permentan 31/2025 | Benih bantuan wajib bersertifikat; poligon kebun; dana BPDP untuk riset perbenihan | Integrasi poligon; jalur hibah |
| **UU 11/2019 (Sisnas Iptek) Pasal 77 & 94** | Dilarang mengalihkan spesimen lokal ke luar negeri, fisik maupun digital, bila uji bisa dilakukan di Indonesia. Tanpa MTA: pidana 2 tahun / Rp2 M. | **Genotyping di lab Indonesia; data di-host di Indonesia.** Ini juga pembeda dari CRC/UWI. |
| UU 11/2013 (ratifikasi Protokol Nagoya) | Akses sumber daya genetik | Referensi klon via perjanjian dengan pemiliknya (Puslitkoka/RPN, BRIN, Mars) |
| UU PDP 27/2022 | Data pribadi petani dan penangkar | Enkripsi, kontrol akses, persetujuan |
| Lisensi data | Bekele 2022, DuVal 2017, Osorio-Guarín 2025, De Wever 2019: CC BY. Tobias 2024: CC BY-NC-ND (tidak untuk turunan komersial). | Prototipe hanya memakai data CC BY |

---

## 9. Roadmap 12 bulan

| Bulan | Teknologi | Kemitraan & pasar | Bukti yang dihasilkan |
|---|---|---|---|
| 0–1 (Nov) | Panel dari irisan SNP publik (Bekele, DuVal, Osorio-Guarín); MVP engine + registri | Proposal Lomba Riset BPDP (30 Okt); pendekatan Puslitkoka/RPN, BRIN, Mars | Panel kandidat tervalidasi in-silico |
| 1–3 | **Langkah pilot 1: bangun registri referensi bersama ICCRI.** Genotyping 3–5 ramet per klon (MCC 01/02, Sulawesi 1/2, tetua ICCRI 06H/08H) dari kebun entres resmi; status "terverifikasi" hanya bila semua ramet sepakat. Validasi panel KASP di lab Indonesia (ICCRI/BRIN/IPB atau lab ber-qPCR). | MoU referensi klon rilis dengan ICCRI dan pemilik klon | Profil referensi klon Indonesia pertama yang terverifikasi |
| 3–6 | Aplikasi PBT + portal lab; modul parentage untuk kebun benih ICCRI 06H/08H; pendaftaran penyedia beserta daftar klon kebunnya | Pilot 1 kabupaten Sulsel bersama Disbun/BBPPTP: ±300 pohon induk + 30 lot (≥59 bibit per lot hibrida) | **Tingkat off-type Indonesia pertama** + bukti waktu proses |
| 6–9 | Dasbor KPI; integrasi poligon STD-B | Kontrak pilot 1 perusahaan; BPDP Grant Riset 2027 | Bukti WTP pertama |
| 9–12 | Modul GS untuk pemulia; persiapan modul kedua (kelapa atau rumput laut) | Lisensi 1 provinsi/BBPPTP; usulan masuk revisi Kepmentan | Kontrak B2G pertama |

---

## 10. Risiko dan kill criteria

| Risiko | Mitigasi / kill criterion |
|---|---|
| Tingkat off-type di Indonesia ternyata rendah | Off-type rendah pun bernilai bagi pemulia (4,7% mengubah 48% seleksi, DuVal 2017). Kill untuk pasar B2G hanya jika pilot 300 pohon induk menemukan **<2%** off-type **dan** kontaminasi lot hibrida <5%. |
| Pemilik klon (Puslitkoka/RPN, Mars) tidak mau berbagi referensi | **Ketergantungan hari pertama:** tanpa referensi MCC 01/02, Sulawesi 1/2, dan tetua ICCRI 06H/08H, klaim klon-klon itu hanya bisa divonis BELUM ADA REFERENSI. Mulai dari tetua publik; tawarkan registri bersama dengan hak data jelas. Kill jika tidak ada mitra referensi dalam 3 bulan. |
| Referensi sendiri salah (referensi publik umumnya 1 pohon; bank plasma nutfah salah label, mis. 172 plot heterogen di Kolombia) | Referensi dari 3–5 ramet per klon di kebun entres resmi; status "terverifikasi" hanya bila sepakat; klon dengan replikat tidak konsisten ditandai di registri |
| Klaim AI melebihi data (asal-usul tanpa referensi Criollo/Amelonado; prediksi komponen hasil butuh genome-wide) | Peringatan tampil di setiap hasil asal-usul; prediksi ditolak bila hanya ada 48 SNP; prediksi komponen hasil dijual sebagai layanan pemulia terpisah |
| Pemerintah memprioritaskan kecepatan dan kuantitas (realisasi 54%, deregulasi) | Sampling menempel pada pemeriksaan PBT yang sudah ada; hasil 2–4 minggu, sebelum puncak penyaluran Sep–Nov |
| Belum ada pos anggaran DNA; WTP pemerintah Rp10–136/bibit | Harga dibuat sebanding (Rp43–143/bibit); masuk lewat RO pengujian dan KPI mutu; hibah riset dulu. Kill jika Direktorat, 2 provinsi, dan 2 perusahaan menolak setelah pilot. |
| Volume program turun 2027 | Fokus registri pohon induk dan kebun benih baru; ekspansi komoditas |
| Lab Indonesia belum menawarkan panel SNP kakao | Lab DNA benih Medan (PT Orion Biosains) sudah ada dan butuh komoditas baru. Alternatif: reagen KASP via distributor LGC Jakarta di lab ber-qPCR (ICCRI, BRIN, IPB). Kill jika biaya panel in-country >US$15/sampel. |
| CacaoCipher / USDA membuat layanan serupa | Mereka riset, bukan operator; jadikan kolaborator. Pembeda kita: registri Indonesia, lab dalam negeri, alur sertifikasi. |
| Kepmentan hasil revisi tidak memuat metode DNA | Tetap bisa dipakai sukarela oleh penyedia dan perusahaan; masuk revisi berikutnya dengan data pilot |
| Statistik produksi resmi vs ICCO berbeda jauh | Selalu sebut sumber setiap angka |

---

## 11. Rencana selama hackathon (23–25 Okt)

### 11.1 Yang dibangun

| Orang | Fokus |
|---|---|
| Engineer 1 | Engine (Python/FastAPI): QC genotipe, identitas LR + status TIDAK DIKENAL, batang bawah, estimator kontaminasi, desain sampling |
| Engineer 2 | Web app: unggah file lab → vonis per pohon/lot → sertifikat PDF + QR; registri; dasbor KPI dengan peta |
| Engineer 3 | Data dan model: registri dari Bekele 2022, panel optimal (irisan dengan DuVal/Osorio-Guarín), modul GS, skenario demo |
| Anggota biologi | Daftar klon rilis Indonesia dan silsilahnya, penjelasan genetika untuk pitch, cek kandidat salah label ICS39/ICS81/SJ2-20/AMAZ6 di paper Bekele |
| Anggota farmasi | Wawancara validasi (penangkar, Disbun/BBPPTP, ICCRI), unit economics, slide bisnis |

### 11.2 Skenario demo (±2 menit)

Angka di bawah adalah contoh keluaran simulasi untuk demo, bukan data lapangan. Saat pitch, katakan bahwa ini simulasi.

1. **Kebun entres Luwu Utara (simulasi):** 300 pohon diklaim "MCC 02". Unggah file lab → 41 pohon OFF-TYPE dan 6 BATANG BAWAH ditandai di peta. Tunjukkan rekomendasi pemurnian.
2. **Lot bibit hibrida ICCRI 06H:** unggah 200 sampel → estimasi kontaminasi serbuk sari 18% ± 3%, sehingga lot ditahan.
3. **Dasbor Direktorat:** KPI "% benih bermutu" per BBPPTP, dan penyedia dengan off-type tertinggi.
4. **Tab pemulia:** prediksi komponen hasil (jumlah biji) untuk ranking semaian silangan, dengan label "bukan prediksi hasil panen". Jangan tampilkan angka akurasi model.

Catatan: selama referensi klon Indonesia belum ada, MVP mendemokan klon publik (ICS60, SCA6, TSH1188, dll.). Klaim "MCC 02" di demo divonis BELUM ADA REFERENSI, dan itu justru poin pitch.

### 11.3 Asumsi yang diuji selama hackathon (kriteria juri no. 3)

- **Teknis (sudah lulus, diulang live):** panel ≤48 SNP, recall/presisi ≥95%; estimator kontaminasi tidak bias.
- **Pasar:** telepon minimal 3 penangkar atau kelompok tani kakao, 1 PBT atau Disbun, dan 1 peneliti ICCRI. Tanyakan:
  - pernah menerima atau menemukan klon tidak sesuai?
  - siapa yang menanggung kerugiannya?
  - apakah sudah ada uji DNA?
  - mau membayar berapa per lot atau per pohon induk?
- **Aturan orisinalitas:** pisahkan dengan jelas pekerjaan sebelum hackathon (riset dan 3 uji di dokumen ini) dari yang dibangun selama hackathon.

---

## 12. Struktur pitch 6 menit + persiapan tanya jawab

### 12.1 Alur pitch

| Waktu | Isi | Kalimat kunci |
|---|---|---|
| 0:00–0:45 | Hook | "Di Pinrang, rata-rata petani kakao memanen 550 kg/ha, sedangkan plot klon unggul ±1.200 kg/ha (ACIAR). Klon yang tepat menggandakan hasil. Pemerintah sedang meremajakan sekitar 174 ribu hektare dengan seribu bibit per hektare. Pertanyaannya: apakah bibit itu benar klon unggul yang dibayar?" |
| 0:45–1:45 | Masalah | "Pedomannya mensyaratkan kemurnian klon 100%, tapi alat ukurnya hanya mata, dengan maksimal 1% bibit diamati dan Rp10 per bibit. Pengawas pemerintah sendiri menemukan campuran varietas di kebun sumber benih nasional. Di negara lain, 12–37% klon ternyata salah label." |
| 1:45–3:15 | Demo | Skenario 11.2 |
| 3:15–4:00 | Bukti | Tiga uji di bagian 5, dengan posisi jujur: "replikasi CacaoCipher, kebaruan kami di lapisan keputusan" |
| 4:00–5:00 | Bisnis | "Rp43–143 per bibit, sebanding dengan belanja pengawasan sekarang, atau kurang dari 1% biaya per hektare. Pembeli: Direktorat Perbenihan (KPI 80% benih bermutu), provinsi, perusahaan kakao. Kakao beachhead, lalu kelapa, kopi, tebu." |
| 5:00–6:00 | Roadmap & ask | "Pilot 300 pohon induk di Sulsel untuk mengukur tingkat salah klon Indonesia yang pertama. Kami butuh akses referensi klon dari Puslitkoka, BRIN, dan Mars." |

### 12.2 Pertanyaan juri yang mungkin muncul

| Pertanyaan | Jawaban singkat |
|---|---|
| "Ini sudah ada, kan? CacaoCipher / UWI?" | Panel minimalnya ada, dan uji kami mereplikasinya. Yang belum ada: alur sertifikasi Indonesia, referensi klon Indonesia, batang bawah dan parentage lot, registri audit, serta lab dalam negeri (UU 11/2019). UWI juga hanya menjual jasa per sampel tanpa alur program. |
| "Berapa tingkat salah klon di Indonesia?" | Belum pernah diukur di rantai benih program, dan itu celahnya. Tapi setiap kali ada yang mengecek, selalu ditemukan ketidaksesuaian: (1) audit SNP USDA–ICCRI di 210 pohon seleksi Sulawesi menemukan 6 kesalahan identitas di dalam klon dan 4 nama ganda, kira-kira sampai 1 dari 10 seleksi, padahal itu koleksi riset paling terawat; (2) 3 dari 50 nama klon membawa dua genotipe (Dinarti 2015); (3) 6–16% planlet SE menyimpang (IPB 2015); (4) pengawas menolak 6 dari 13 kebun sumber benih (2019) dan menemukan campuran varietas (2023). Di negara tetangga: Malaysia 37%, Vietnam 24%. Pilot 300 pohon induk kami akan jadi angka Indonesia yang pertama. |
| "Bukankah sudah ada lab DNA benih di Medan?" | Betul, dan itu kabar baik: infrastruktur lab sudah ada (±Rp95 M, dioperasikan PT Orion Biosains), tapi fokusnya sawit. Yang belum ada untuk kakao: panel klon Indonesia, registri referensi, vonis batang bawah dan kontaminasi lot, alur sertifikasi, dan dasbor KPI mutu. CacaoID adalah lapisan itu, dan lab Medan calon mitra pertama kami. |
| "Kenapa pemerintah mau bayar kalau tarifnya Rp10/bibit?" | Biaya kami per bibit sebanding dengan belanja pengawasan negara sekarang (Rp52/batang), kurang dari 1% biaya per hektare. Ada KPI 80% benih bermutu, permintaan teknologi kemurnian genetik, dan pengawalan Kejagung. Kami menjual per pohon induk dan per lot, bukan per batang. |
| "Siapa yang ambil sampel? Butuh lab sendiri?" | PBT, bersamaan dengan pemeriksaan yang sudah wajib, memakai cakram daun silika. Genotyping di lab mitra Indonesia, karena KASP jalan di mesin qPCR biasa. Kami murni software. |
| "Bagaimana jika klon Indonesia tidak ada di referensi?" | Memang belum ada, dan itu langkah pertama pilot: membangun registri referensi bersama ICCRI dari 3–5 ramet per klon. Referensi awal kecil: 6–8 genotipe menutup sebagian besar benih program. Sampai saat itu, klaim klon tanpa referensi divonis BELUM ADA REFERENSI, bukan dikarang. Sistem tetap memberi tahu bila pohon itu ternyata cocok dengan klon terdaftar lain. |
| "Referensinya sendiri bisa salah, kan?" | Bisa, dan kami merancang untuk itu. Referensi publik umumnya satu pohon, dan bank plasma nutfah sering salah label (Kolombia: 172 plot heterogen). Referensi CacaoID baru "terverifikasi" bila 3–5 ramet dari kebun entres resmi sepakat. |
| "Apakah AI bisa memprediksi hasil dari sampel verifikasi?" | Tidak langsung. Prediksi komponen hasil butuh genotyping genome-wide (±589 SNP), sedangkan verifikasi memakai 48 SNP. Itu layanan terpisah untuk pemulia. Tetapi setelah identitas pohon diketahui, kami bisa menampilkan komponen hasil klon yang dibayar vs klon yang diterima, dari sidik jari lengkap klon itu di registri. |
| "Bisa menelusuri asal-usul pohon yang tidak dikenal?" | Ya, dengan dua cara yang jujur. (1) Uji apakah pohon itu anak dari klon-klon yang tercatat di kebun tersebut, atau anak dari silangan batang bawah resmi. (2) Perkiraan komposisi kelompok genetik Motamayor. Kelompok Criollo dan Amelonado belum punya referensi publik, jadi itu masuk rencana kerja bersama ICCRI. |
| "Kalau lab salah pipet atau sampel tertukar?" | Kontrol plate positif dan negatif wajib. Sistem juga mendeteksi pola sampel tergeser satu sumur, lalu menahan batch sebelum ada pohon yang ditebang. Untai DNA yang terbalik dikoreksi otomatis. |
| "Akurasinya di lapangan?" | Simulasi dengan error lab 2% dan data hilang 5%: recall 100%, presisi 99,8%. Uji lapang di pilot. Literatur: identifikasi >95% pada error 5% (CacaoCipher). |
| "Hasil lab 2–4 minggu, apa tidak memperlambat penyaluran?" | Sampel diambil di fase semaian/pasca-semai, beberapa bulan sebelum puncak penyaluran Sep–Nov. Pohon induk cukup diuji sekali. |
| "Pasarnya kecil?" | Benar untuk kakao saja (Rp5–22 M di Indonesia). Engine sama dipakai untuk kelapa, kopi, tebu, rumput laut, dan kebun benih hibrida Afrika Barat. |
| "Bisa untuk ketahanan VSD?" | Belum. Saat ini baru ada QTL, belum ada model GS publik. Modul GS kami saat ini untuk komponen hasil (r ≈ 0,6). VSD di roadmap bersama pemulia. |
| "Kenapa tidak uji setiap bibit?" | Tidak ekonomis dan tidak perlu. Uji pohon induk sumber entres + sampel lot dengan desain sampling statistik sudah cukup. |

---

## 13. Koreksi dari dokumen riset sebelumnya

| Klaim lama | Koreksi |
|---|---|
| "Uang peremajaan Rp5 T" | Realisasi APBN 2025 sekitar Rp13–15 jt/ha, jadi program 2026 sekitar **Rp2,3–2,6 T** (estimasi) |
| "Sep 2026 Kementan merevisi Kepmentan 25/2017" | Sudah diubah 2018 (67/2018) dan Juni 2025 (49/2025). Revisi Sep 2026 hanya dari berita. |
| "Dewi dkk. 2023, Pelita Perkebunan" | Ternyata skripsi S1 UNEJ. Jangan dikutip sebagai jurnal. |
| "Osorio-Guarín 2020 = bukti GS" | Itu studi GWAS, bukan GS |
| "GS untuk ketahanan VSD/PBK" | Belum ada data publik. VSD baru ada QTL, PBK belum ada apa-apa. |
| "Kill jika off-type <5%" | Terlalu kasar. Off-type 4,7% sudah mengubah 48% seleksi (DuVal 2017). |
| "Bibit kurang" sebagai argumen | KPI ketersediaan 117,9%. Argumennya mutu. |
| EUDR sebagai pendorong | EUDR tidak butuh data genetik. Hanya integrasi opsional. |
| "Panel minimal adalah inovasi kami" | Sudah ada di CacaoCipher (2026). Inovasi kami di lapisan keputusan. |
| "714 kg/ha, separuh standar dunia (±1,5 t/ha)" | **Salah.** Rata-rata dunia menurut FAO ±0,48 t/ha, dan Indonesia ±0,46 t/ha (data FAO yang sama), jadi setara rata-rata dunia. Angka 1,5 t/ha adalah "acuan" versi berita, bukan rata-rata dunia. Pembanding yang benar: petani 550 vs plot klon ±1.200 kg/ha (ACIAR). |
| "AI tahu klon mana yang paling produktif" | **Melebihi bukti.** Model hanya memprediksi komponen hasil (jumlah dan ukuran biji, ukuran buah), bukan hasil panen. Nama modul diganti menjadi "Prediksi komponen hasil". |
| "Data flywheel: setiap sampel verifikasi menambah data latih AI" | **Keliru untuk prediksi komponen hasil**, karena sampel verifikasi hanya punya genotipe tanpa data panen. Flywheel berlaku untuk skor risiko penyedia dan registri. Prediksi komponen hasil baru bertambah datanya bila sampel dilengkapi data panen dari pilot. |
| "Asal-usul: Nanay 70% · Trinitario 30% → kemungkinan asal biji" | **Salah secara genetika.** Trinitario bukan kelompok genetik, melainkan populasi budidaya hasil persilangan Criollo × Amelonado. Pakai 10 kelompok Motamayor (2008). Komposisi juga tidak bisa membedakan pohon asal biji dari sambungan; yang bisa adalah **uji parentage**. Contoh "Nanay 50% · Amelonado 28% · Criollo 22%" ternyata **belum bisa dihasilkan**, karena data publik tidak punya referensi Criollo dan Amelonado (lihat koreksi berikutnya). Contoh parentage "anak Sulawesi 1 × ICS 60, sehingga kemungkinan asal biji" hanya sah bila kedua klon tercatat di kebun itu. |
| Contoh asal-usul "Nanay 50% · Amelonado 28% · Criollo 22%" | **Belum bisa dihasilkan.** Referensi publik hanya ada untuk Nanay, Marañón, Iquitos, Guiana, dan Contamana, sehingga Trinitario dan banyak klon Indonesia terbaca sebagai campuran kelompok lain. Contoh yang jujur: SCA6 = Contamana 100%; TSH1188 = campuran Iquitos/Nanay/Marañón/Contamana. Referensi Criollo dan Amelonado (koleksi ICCRI/ICGT) adalah rencana kerja. |
| "Empat vonis: COCOK / OFF-TYPE / TIDAK DIKENAL / BATANG BAWAH" | **Lima vonis + UJI ULANG.** Ditambah BELUM ADA REFERENSI untuk klon yang diklaim tetapi belum punya sidik jari; kasus ini pasti muncul untuk klon Indonesia di hari pertama. |
| "Penelusur asal-usul mencari tetua di registri" | **Tidak andal** di panel 48 SNP: pencarian bebas di ±620 klon memberi tetua palsu. Diganti menjadi "menguji apakah pohon adalah anak dari klon-klon yang tercatat di kebun itu" (butuh daftar klon kebun dari pendaftaran penyedia) dan uji terhadap silangan batang bawah resmi yang terdaftar. |
| "Prediksi komponen hasil untuk setiap sampel verifikasi" | **Tidak bisa:** butuh genotyping genome-wide (±589 SNP), bukan panel 48 SNP. Dijual sebagai layanan terpisah untuk pemulia. Di verifikasi hanya ditampilkan perbandingan klon yang dibayar vs yang diterima, dari referensi registri. |
| Benchmark Kolombia "presisi" atau "plot tambahan" | Cukup katakan "menemukan ulang 99% plot salah label versi paper". Plot tambahan belum bisa dipastikan tanpa kurator. |
| Model asal-usul (uji 6) memakai kelas "Trinitario" | **Kelemahan metode.** Versi berikutnya harus memakai referensi kelompok genetik baku, termasuk Criollo dan Amelonado. Angka 84% di bagian 5.3d tidak boleh dikutip sebagai akurasi kelompok genetik. |
| ID dan angka contoh (SLS-LUT-0017, Luwu Utara, 78/100, dll.) tanpa label | Sekarang ada label **"DATA SIMULASI"** yang terlihat di slide 1, 11, 12, 13, 15 dan di keenam layar mockup, sesuai panduan demo. |
| Skor "0,92" di visual AI | Tidak dijelaskan. Di slide diganti dengan prediksi jumlah biji ("44 biji"). Di mockup diberi definisi: skor 0–1 = gabungan prediksi jumlah dan ukuran biji, relatif terhadap kandidat terbaik. |
| "Indonesia belum punya uji DNA benih perkebunan" | **Salah.** Lab uji DNA benih Medan (2023, ±Rp95 M) sudah ada dan dioperasikan PT Orion Biosains sejak Mei 2026. BBPPTP Surabaya juga punya lab genetika untuk pelepasan varietas. Yang benar: sertifikasi kakao tidak memakai DNA. |
| "Klon rilis Indonesia sama sekali tidak ada di data publik" | Sebagian keliru. WGS mentah Sulawesi 1 (PBC123), Sulawesi 2 (BR25), dan seleksi Mars M01–M07 ada di SRA (PRJNA486011), masing-masing satu sampel per nama. Bisa dipakai menyusun referensi awal setelah genotyping ulang. MCC 02 dan hibrida ICCRI tetap harus didapat dari pemiliknya. |

---

## 14. Sumber utama dan file kerja

**Laporan riset lengkap** (dengan semua URL):
- `/private/tmp/claude-501/-Users-iqbalrahmatullah-Desktop-hackathon-soulsea/a13d39c9-0ffd-4eeb-8a68-68c79a35e915/scratchpad/verif3/K1-sistem-benih.md` (regulasi, sistem benih, bukti Indonesia)
- `/private/tmp/claude-501/-Users-iqbalrahmatullah-Desktop-hackathon-soulsea/a13d39c9-0ffd-4eeb-8a68-68c79a35e915/scratchpad/verif3/K2-teknologi-pesaing.md` (24 studi salah label, panel SNP, GS, pesaing, harga lab, UU 11/2019)
- `/private/tmp/claude-501/-Users-iqbalrahmatullah-Desktop-hackathon-soulsea/a13d39c9-0ffd-4eeb-8a68-68c79a35e915/scratchpad/verif3/K3-pasar-pembayar.md` (anggaran, BPDP, pasar, harga, proyeksi)
- `/private/tmp/claude-501/-Users-iqbalrahmatullah-Desktop-hackathon-soulsea/a13d39c9-0ffd-4eeb-8a68-68c79a35e915/scratchpad/verif2/E-wildcard.md` (penyaringan awal kakao)

**Validasi Indonesia (riset lanjutan, 22–23 Okt):**
- `/private/tmp/claude-501/-Users-iqbalrahmatullah-Desktop-hackathon-soulsea/a13d39c9-0ffd-4eeb-8a68-68c79a35e915/scratchpad/verif4/R1-data-molekuler.md` (semua data molekuler bahan Indonesia)
- `/private/tmp/claude-501/-Users-iqbalrahmatullah-Desktop-hackathon-soulsea/a13d39c9-0ffd-4eeb-8a68-68c79a35e915/scratchpad/verif4/R2-bukti-administratif.md` (LAKIN BBPPTP 2019–2025, lab DNA Medan, kasus Tipikor)
- `/Users/iqbalrahmatullah/Desktop/hackathon/soulsea/Kit-Wawancara-CacaoID.md` (kontak institusi, naskah wawancara, draf pesan)

**Skrip uji:**
- `/private/tmp/claude-501/-Users-iqbalrahmatullah-Desktop-hackathon-soulsea/a13d39c9-0ffd-4eeb-8a68-68c79a35e915/scratchpad/kakao_scripts/panel2.py` (identitas dan panel)
- `/private/tmp/claude-501/-Users-iqbalrahmatullah-Desktop-hackathon-soulsea/a13d39c9-0ffd-4eeb-8a68-68c79a35e915/scratchpad/kakao_scripts/pollen.py` (kontaminasi serbuk sari)
- `/private/tmp/claude-501/-Users-iqbalrahmatullah-Desktop-hackathon-soulsea/a13d39c9-0ffd-4eeb-8a68-68c79a35e915/scratchpad/kakao_scripts/gs.py` (prediksi genomik)

**Dokumen pemerintah kunci:**
- LAKIN Direktorat Perbenihan Perkebunan 2025: https://ditjenbun.pertanian.go.id/template/uploads/2026/04/LAKIN-BENIH-2025_FINAL.pdf
- LAKIN Ditjenbun 2025: https://ditjenbun.pertanian.go.id/template/uploads/2026/03/LAKIN-DITJENBUN-2025.pdf
- LAKIN BBPPTP Surabaya 2023: https://ditjenbun.pertanian.go.id/template/uploads/2024/04/LAKIN-TA-2023-BALAI-SURABAYA.pdf
- Tarif PNBP BBPPTP Medan: https://balaimedan.ditjenbun.pertanian.go.id/template/uploads/2025/07/DAFTAR-TARIF-PNBP-BBPPTP-MEDAN-2024-BARU-Pengujian.pdf
- Permentan 31/2025: https://peraturan.go.id/files/permentan-no-31-tahun-2025.pdf
- Kepmentan 25/2017 (salinan): https://www.scribd.com/document/517680242/Kepmentan-No-25-Tahun-2017-Tentang-SOP-Benih-Kakao
- UU 11/2019: https://peraturan.go.id/files/uu11-2019bt.pdf
- Panduan Lomba Riset Mahasiswa BPDP 2026–2027: https://www.its.ac.id/drpm/wp-content/uploads/sites/71/2026/07/Panduan-Teknis-Proposal-Lomba-Riset-BPDP-Tahun-2026-2027.pdf
- Pelatihan PBT & kemurnian genetik (Jun 2026): https://ditjenbun.pertanian.go.id/perkuat-hilirisasi-kementan-tingkatkan-kapabilitas-pengawas-benih-demi-penyediaan-benih-bersertifikat-bagi-pekebun/

**Literatur kunci:**
- Bekele dkk. 2022: https://doi.org/10.1371/journal.pone.0260907
- DuVal dkk. 2017: https://pmc.ncbi.nlm.nih.gov/articles/PMC5717384/
- Osorio-Guarín dkk. 2025: https://pmc.ncbi.nlm.nih.gov/articles/PMC12271136/
- De Wever dkk. 2019: https://pmc.ncbi.nlm.nih.gov/articles/PMC6606624/
- Efombagn dkk. 2009: https://doi.org/10.1038/hdy.2009.30
- Ahn dkk. 2026 (CacaoCipher): https://doi.org/10.1093/hr/uhag106
- Romero Navarro dkk. 2017: https://pmc.ncbi.nlm.nih.gov/articles/PMC5694496/
- Dinarti dkk. 2015: https://doi.org/10.1270/jsbbs.65.438
- Pancaningtyas & Susilo 2022: https://doi.org/10.22302/iccri.jur.pelitaperkebunan.v38i1.490
- ACIAR SMAR/2005/074: https://www.aciar.gov.au/sites/default/files/2022-09/SMAR-2005-074-final-report.pdf
- Pokou dkk. (ICCO): https://www.icco.org/wp-content/uploads/T1.100.-ASSESSMENT-OF-GENETIC-QUALITY-OF-CACAO-SEED-GARDENS-OUTPUT-USING-SINGLE-NUCLEOTIDE-POLYMORPHISM-SNPS-MARKERS.pdf
- CRC/UWI price list: https://sta.uwi.edu/cru/sites/default/files/cru/Genotyping.pdf
