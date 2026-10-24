# Verifikasi Bisnis #1: Volume, Pelaku, dan Nilai Ekspor Hiu/Pari Indonesia

Disusun 22 Okt 2026 untuk tim GenoHack 2026 (Bandung). Semua angka berasal dari sumber terbuka. Data mentah dan skrip ada di folder `scratchpad/verif/data`, `scratchpad/verif/pdf`, dan `scratchpad/verif/scripts`.

Legenda: ✅ terverifikasi (angka dibaca langsung dari sumber primer/API) · 🟡 sebagian (sumber sekunder, hasil baca grafik, atau perlu interpretasi) · ❓ tidak ditemukan

---

## Ringkasan

| Pertanyaan | Jawaban terbaik | Status |
|---|---|---|
| Nilai ekspor hiu/pari menurut data Indonesia | **US$15,2–17,1 juta/tahun** (2024–2025), 3.900–4.840 t. Turun dari US$23,1 juta (2020). Sirip ~52–59% dari nilai. | ✅ [S1] |
| Nilai menurut data negara pengimpor (mirror) | Hong Kong saja mencatat impor sirip dari Indonesia senilai **US$14,4–25,5 juta/tahun**, atau **2,0–2,9× nilai** yang dilaporkan Indonesia ke HK | ✅ [S1] |
| Jumlah SAJI-LN ekspor (nasional, Appendiks CITES, **semua jenis ikan**) | **746 dokumen (2025)**. Tw I 2026: 155. Ditambah 623 SAJI-LN ekspor non-Appendiks. Porsi hiu/pari **tidak dipublikasikan**. | ✅ angka / 🟡 interpretasi tahunan [S7][S8] |
| Jumlah pengiriman ekspor hiu/pari | **Tidak ada angka resmi.** Proksi: **~300–1.200 kiriman/tahun** (basis ~700) | 🟡 proksi |
| Jumlah eksportir / pemegang SIPJI-LN hiu/pari | **Tidak ada angka nasional resmi.** Angka parsial: 512 perusahaan pemakai SAJI hiu-pari 2021–2024 (DN+LN); 13–30 SIPJI-LN hiu martil per tahun; 13 eksportir di Jatim (Mar 2023) | 🟡 [S20][S21][S19] |
| Kuota ekspor 2026 | Hiu 21 spesies: sirip **892,8 t**, daging 9.536,8 t. Pari 7 spesies: sirip 138,7 t, daging 1.225,0 t | ✅ [S4] |
| Ukuran pasar "DNA-to-compliance" (ekspor saja) | **Rendah Rp0,23 M · Basis Rp2,8 M · Tinggi Rp21,6 M per tahun** (US$14 rb / 170 rb / 1,3 jt) | 🟡 sebagian besar input diasumsikan |

**Implikasi untuk pitch.** Pasar ekspor kecil: nilai perdagangan resmi sekitar Rp250–280 miliar/tahun, dan hanya puluhan eksportir. Skenario basis (Rp2,8 miliar) setara ~1% dari nilai ekspor, jadi masih masuk akal. Skenario tinggi (~8%) terlalu agresif kalau eksportir yang membayar. Volume dokumen yang jauh lebih besar ada di **verifikasi domestik** (SAJI-DN dan rekomendasi *look-alike*), yang diproses oleh UPT KKP (lihat §2.3 dan §5.4).

---

## 1. Volume dan nilai ekspor per tahun, per produk ✅

### 1.1 Kode HS yang dipakai (HS 2022 / H6) ✅ [S2]

| Kelompok | Kode HS | Uraian Comtrade |
|---|---|---|
| **Sirip** | 030292, 030392, 030571 | sirip hiu segar; sirip hiu beku; "edible offal, shark fins" (kering/asin/asap) |
| **Daging hiu** | 030281, 030381, 030447, 030456, 030496, 030488* | dogfish & hiu lain segar/beku; fillet segar; daging segar/beku. *030488 = fillet beku hiu **dan** pari (gabungan) |
| **Pari** | 030282, 030382, 030448, 030457, 030497 | rays & skates (Rajidae) segar/beku, fillet, daging |

Koreksi atas brief: **030247 = ikan todak/swordfish (segar), bukan hiu**. Kode 030347 tidak ada di daftar referensi Comtrade. Indonesia tidak melaporkan 030281 sama sekali. Produk kulit, tulang/kartilago, insang, dan minyak hati hiu **tidak punya kode HS khusus**, sehingga tidak tertangkap di sini (kemungkinan *under-count*).

### 1.2 Ekspor menurut data Indonesia (reporter 360, partner Dunia) ✅ [S1]

| Tahun | Sirip (t / US$ jt / US$/kg) | Daging hiu (t / US$ jt) | Pari (t / US$ jt) | **Total (t / US$ jt)** |
|---|---|---|---|---|
| 2020 | 536,5 / 10,49 / 19,6 | 7.422,3 / 9,26 | 1.848,0 / 3,39 | **9.806,9 / 23,14** |
| 2021 | 716,6 / 13,69 / 19,1 | 4.852,6 / 6,13 | 1.444,8 / 2,52 | **7.013,9 / 22,34** |
| 2022 | 470,0 / 12,79 / 27,2 | 3.821,8 / 5,21 | 939,1 / 2,18 | **5.230,9 / 20,18** |
| 2023 | 545,5 / 11,80 / 21,6 | 2.349,5 / 3,53 | 1.122,6 / 2,44 | **4.017,6 / 17,77** |
| 2024 | 363,9 / 8,92 / 24,5 | 2.313,3 / 3,05 | 1.225,7 / 3,22 | **3.903,0 / 15,19** |
| 2025 | 355,7 / 8,95 / 25,2 | 3.256,3 / 5,00 | 1.225,5 / 3,15 | **4.837,4 / 17,10** |

Query API persis (satu tahun per panggilan, karena *preview* hanya menerima 1 periode), diakses 22 Okt 2026:
`https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=360&period={2020..2025}&partnerCode=0&cmdCode=030281,030282,030292,030381,030382,030392,030447,030448,030456,030457,030488,030496,030497,030571&flowCode=X`

Contoh baris mentah (2025): `030571 netWgt=245583 kg primaryValue=7461656` dan `030381 netWgt=2501292 primaryValue=3815286`.

### 1.3 Tujuan utama (data Indonesia, partner breakdown) ✅ [S1]

Query: sama seperti di atas **tanpa** `partnerCode`.

| Produk | 2023 | 2024 | 2025 |
|---|---|---|---|
| Sirip | Hong Kong 81%, Jepang 7%, Singapura 7%, Thailand 3% | HK 74%, Jepang 11%, Singapura 6%, Thailand 5% | HK 75%, Jepang 8%, Tiongkok 7%, Singapura 5% |
| Daging hiu | "Other Asia, nes" (= Taiwan) 41%, Thailand 35%, Australia 19% | Taiwan 47%, Tiongkok 20%, Thailand 18%, Australia 12% | Thailand 38%, Taiwan 29%, Tiongkok 21%, Australia 11% |
| Pari | Korea Selatan 48%, Vietnam 20%, Malaysia 14%, Singapura 14% | Korea 49%, Vietnam 22%, Singapura 16% | Korea 41%, Singapura 17%, Malaysia 16%, Thailand 13% |

### 1.4 Selisih data Indonesia vs data negara pengimpor (mirror) ✅ [S1]

Query mirror: `https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=344,156,702,458,392,764,410,36,704&period={2021..2025}&partnerCode=360&cmdCode=(sama)&flowCode=M`

| Sirip: Hong Kong | 2021 | 2022 | 2023 | 2024 | 2025 |
|---|---|---|---|---|---|
| Impor HK dari ID (laporan HK) | 382,8 t / **US$25,51 jt** | 372,6 t / **22,52** | 290,9 t / **19,30** | 318,4 t / **18,94** | 276,2 t / **14,38** |
| Ekspor ID ke HK (laporan ID) | 414,7 t / 11,37 | 353,8 t / 11,55 | 339,2 t / 9,51 | 234,3 t / 6,62 | 239,0 t / 6,70 |
| Rasio nilai HK/ID | 2,2× | 1,9× | 2,0× | **2,9×** | 2,1× |

Temuan:
- **Volume sirip ke HK kurang lebih cocok (±25%), tetapi nilainya 2–3×.** CIF vs FOB tidak cukup menjelaskan selisih sebesar ini. Kemungkinan penyebab: valuasi rendah di deklarasi ekspor dan perbedaan grade/klasifikasi. Ini sejalan dengan Prasetyo et al. (2021), yang menemukan selisih ekspor–impor 2012–2018 senilai "over $43.6 M and $20.9 M for fins and meat" [S22].
- **Pari:** Indonesia mencatat ekspor pari ke Korea US$0,8–1,6 juta/tahun, tetapi Korea **tidak** mencatat impor pari dari Indonesia di kode-kode ini (perlu dicek di tarif nasional Korea). Sebaliknya, Malaysia mencatat 2021 impor US$2,04 juta, sementara laporan Indonesia hanya US$0,81 juta.
- **Daging hiu:** Thailand dan Australia relatif konsisten. Taiwan tidak melapor ke Comtrade, sehingga tidak bisa di-mirror.
- 🟡 Klaim KKP via Mongabay: "nilai ekspor yang cukup signifikan yaitu mencapai Rp1,4 triliun berdasarkan hasil kajian tahun 2018" [S18]. Ini **~4–5× lebih besar** dari Comtrade (~US$23 juta ≈ Rp0,3–0,4 triliun). Dokumen kajian aslinya tidak ditemukan.

### 1.5 Perdagangan spesies CITES (CITES Trade Database) ✅ angka / 🟡 kelengkapan [S3]

Query (comparative tabulation, eksportir ID=16 Indonesia, takson Elasmobranchii id=33, 2015–2025):
`https://trade.cites.org/en/cites_trade/exports/download?filters[time_range_start]=2015&filters[time_range_end]=2025&filters[exporters_ids][]=16&filters[importers_ids][]=all_imp&filters[sources_ids][]=all_sou&filters[purposes_ids][]=all_pur&filters[terms_ids][]=all_ter&filters[taxon_concepts_ids][]=33&filters[selection_taxon]=taxonomic_cascade&filters[report_type]=comptab&filters[csv_separator]=comma` (422 baris)

- **Laporan dari sisi eksportir (Indonesia) hanya ada sampai 2021.** Untuk 2022–2025 hanya tersedia data yang dilaporkan importir. Database ini juga **tidak** menyediakan data per pengiriman atau per izin, hanya agregat.
- Impor 2024 yang dilaporkan importir untuk produk elasmobranchii CITES asal Indonesia: **705,8 t**, terdiri dari *fin (dried)* 209,8 t, *fins* 35,3 t, *fin (wet)* 7,7 t, *meat* 334,4 t, *bones* 52,2 t, *skin pieces* 36,4 t, *skins* 14,9 t, *bodies* 15,0 t. Mencakup **34 takson** dan 8 importir (AE, CN, HK, JP, KR, SG, TH, VN). Bandingkan 2023: 88,8 t dan 21 takson.
- Lonjakan 2024 terjadi karena seluruh famili Carcharhinidae masuk Appendiks II (CoP19). Di Indonesia, ketentuan ini berlaku penuh **25 Mei 2024** setelah masa reservasi 6 bulan [S16]. Catatan: LKj BPSPL Denpasar menulis "sejak tanggal 25 April 2024" [S9]. Dampaknya, *mayoritas* sirip yang diekspor kini adalah spesies CITES. Contoh 2024: *C. limbatus* 42,1 t, *C. falciformis* 32,5 t, dan *P. glauca* 30,2 t sirip kering ke HK, serta *C. sorrah* 138,6 t daging ke CN.

---

## 2. Jumlah pengiriman / SAJI-LN dan jumlah eksportir

### 2.1 Mekanisme (siapa menerbitkan apa) ✅ [S6][S7][S12]

- **SAJI-LN** adalah izin angkut ekspor untuk spesies dilindungi/Appendiks CITES. Diterbitkan **pusat (Dit. KSG, Ditjen PK)**, sedangkan verifikasi lapangan (BAP) dilakukan UPT. SAJI-LN dicap CITES di UPT. Biaya: "Rp 840.000,- /dokumen untuk tujuan komersil", pungutan perdagangan "8% x harga patokan", dan pungutan pengambilan "6% x harga patokan" bila asal-usulnya kuota alam. Untuk *look-alike*: "1% x harga patokan" [S6].
- **SAJI-DN** (angkut domestik) dan **Surat Rekomendasi DN/LN** (untuk spesies *look-alike* yang bukan CITES) diterbitkan **UPT** (BPSPL/LPSPL) [S7]: "Proses penerbitan surat rekomendasi dalam negeri dan luar negeri dilakukan oleh UPT."
- Setiap SAJI dan rekomendasi didahului identifikasi spesies oleh petugas. Inilah titik masuk produk DNA.

### 2.2 SAJI-LN nasional (semua jenis ikan) ✅ angka / 🟡 interpretasi

| Periode | SAJI-LN Ekspor (Appendiks CITES) | SAJI-LN Ekspor non-Appendiks | Impor | Re-ekspor | Arwana | Sumber |
|---|---|---|---|---|---|---|
| 2025 ("selama Triwulan IV") | **746** | 623 | 45 | 22 | 1.557 | [S7] |
| Tw I 2026 | **155** | 169 | 11 | 4 | 271 (total 610) | [S8] |

- Kutipan [S7]: "Jumlah Dokumen Angkut SAJI LN yang terbit selama Triwulan IV adalah sebanyak 1. SAJI LN Ekspor sebanyak 746 dokumen; … 4. SAJI LN Ekspor (Non-Appendiks CITES) sebanyak 623 dokumen; 5. SAJI LN Arwana sebanyak 1557 dokumen."
- 🟡 **Interpretasi:** angka di laporan Tw IV kami baca sebagai **kumulatif setahun 2025**, karena Tw I 2026 = 155, dan 155 × 4 ≈ 620, mendekati 746. Kalau ternyata angka itu hanya Tw IV, total setahun akan ~3.000, yang tidak konsisten dengan Tw I 2026. **Perlu konfirmasi ke Dit. KSG.**
- **Porsi hiu/pari tidak dipublikasikan ❓.** Komoditas Appendiks II laut lain yang diekspor Indonesia antara lain teripang, napoleon, dan kuda laut. Karang baru dialihkan ke KKP pada 2026 [S8].
- PNBP layanan SAJI-LN: **Rp11,56 miliar (2025)** dan **Rp12,08 miliar (2024)**; PNBP SIPJI Rp2,05 miliar (2025) [S7]. Ini mencakup semua jenis.

### 2.3 Data per UPT (hiu/pari) ✅ kecuali yang ditandai

| UPT (wilayah) | Tahun | Angka | Kutipan / catatan | Sumber |
|---|---|---|---|---|
| BPSPL Denpasar (Jatim, Bali, NTB, NTT) | 2021 | **852 SAJI, 501 untuk ekspor** | "sebanyak 852 Surat Keterangan Jenis Ikan (SAJI) sepanjang tahun 2021 … 351 SAJI diperuntukkan bagi pelaku usaha domestik dan 501 tujuan ekspor" | 🟡 [S18] |
| BPSPL Denpasar | 2024 | SAJI-DN **397** (Jatim 250, Bali 57, NTB 27, NTT 63); rekomendasi hiu-pari **226** (Jatim 135, Bali 42, NTB 33, NTT 16) | 🟡 hasil digitasi Grafik 8 & 9 (label angka bulanan dijumlahkan). Grafik 8 berjudul "Penerbitan SAJI DN Keseluruhan", jadi bisa mencakup jenis lain | [S9] |
| BPSPL Denpasar | 2025 | SAJI-DN hiu-pari **340** (Jatim 188, Bali 64, NTB 62, NTT 26) | 🟡 digitasi Gambar 7 "Dokumen SAJI DN Hiu dan Pari Terbit Tahun 2025" | [S10] |
| BPSPL Denpasar | 2025 | Semua jenis: SAJI DN **441**, Rekomendasi DN **317**, Rekomendasi LN **2.160** | Tabel 15 "Dokumen Angkut Terbit Tahun 2025" (termasuk karang hias, teripang, dll.) | ✅ [S10] |
| BPSPL Denpasar | 2025 | Volume LN produk hiu Appendiks CITES: Bali **142.315,60 kg** + Jatim **164.793,55 kg**; pari Appendiks LN Jatim **77.665,26 kg** | Label grafik Gambar 8 | ✅ [S10] |
| BPSPL Pontianak (Kalimantan) | 2024 | **213** rekomendasi hiu-pari (200 DN, jadi ~13 LN), **158** SAJI-DN hiu-pari Appendiks | "Selama Tahun 2024 terdapat total 213 Surat Rekomendasi hiu pari … Selama Tahun 2024 terdapat 158 SAJI DN untuk jenis hiu dan pari appendiks CITES" | ✅ [S11] |
| BPSPL Makassar | 2025 | **156** SAJI hiu-pari (**SAJI DN 122, SAJI LN 34**) | "yang terbanyak dari jenis Hiu Pari sebanyak 156 dokumen SAJI (SAJI DN 122, SAJI LN 34)". Juga 85 SR LN *look-alike* (semua jenis) | ✅ [S12] |
| BPSPL Padang (Sumatra) | 2025 | **319** SAJI-DN + **514** rekomendasi (hiu, pari, arwana, teripang tercampur) | "penerbitan 319 Surat Angkut Jenis Ikan (SAJI) Dalam Negeri (DN) dan 514 Rekomendasi" | ✅ [S13] |
| LPSPL Serang (Banten/DKI/Jabar) | Jan–Sep 2025 | **1.707** dokumen disetujui (semua jenis, di luar BA SAJI-LN); hiu & pari dilalulintaskan **3.810.555,08 kg** | "terdapat 1.707 Dokumen yang disetujui (diluar data BA Saji LN) … Jenis Ikan Hiu dan Pari jumlah yang dilalulintaskan 3.810.555,08 Kg" | ✅ [S14] |
| Nasional (Mongabay) | 2021–2024 | **26.090** dokumen SAJI hiu-pari untuk **512 perusahaan** | "penerbitan 26.090 dokumen surat angkut jenis ikan (SAJI) untuk hiu dan pari … sepanjang 2021-2024 untuk 512 perusahaan" (sirip 40%, daging 25%, kulit 15%) | 🟡 [S20] |

LPSPL Sorong: laporan tahunan tidak ditemukan ❓.

### 2.4 Jumlah eksportir / pemegang SIPJI 🟡

| Angka | Cakupan | Kutipan | Sumber |
|---|---|---|---|
| **512 perusahaan** | Semua penerima SAJI hiu-pari 2021–2024 (DN+LN, termasuk pedagang domestik) | lihat di atas | 🟡 [S20] |
| SIPJI-LN hiu martil: **23 (2021), 13 (2022), ~30 (2023), 13 perusahaan per Mei 2024** | Hanya *Sphyrna* | "Pada 2023, pemerintah Indonesia memberikan izin ekspor sirip, daging, dan tulang Hiu Martil sekitar 30 SIPJI LN." Sumber data tidak disebut artikel | 🟡 [S21] |
| **35 pemegang SIPJI, 13 eksportir** | Jawa Timur, per Maret 2023 | "per Maret 2023, hanya ada 35 pemegang SIPJI di wilayah itu, 13 adalah eksportir" | 🟡 [S19] |
| **201 SIPJI** terbit 2025; **31** di Tw I 2026 | Nasional, semua jenis dan semua tipe (DN, LN, pengembangbiakan) | "Jumlah Perizinan SIPJI yang terbit selama Triwulan IV adalah sebanyak 201 SIPJI" | ✅ [S7][S8] |
| 23 pelaku usaha mengajukan verifikasi SIPJI; hanya 4% untuk hiu/pari/napoleon/sidat | Kalimantan 2024 | "dilakukan verifikasi SIPJI sebanyak 42 kali dari 23 pelaku usaha" | ✅ [S11] |
| Asosiasi eksportir hiu-pari | KKP mengimbau pembentukan asosiasi **paling lambat 11 Des 2026** | "kami mengimbau kepada seluruh pelaku usaha/eksportir komoditas hiu, pari dan teripang untuk dapat segera membentuk asosiasi" | ✅ [S17] |

**Kesimpulan §2 (proksi, eksplisit):**
- **Eksportir aktif hiu/pari ≈ 20–50 perusahaan** 🟡. Rentang ini dari SIPJI-LN hiu martil 13–30/tahun, 13 eksportir di Jatim saja, dan jumlah UPT pintu ekspor (Jatim, Bali, DKI/Banten, Makassar, Kalimantan, Sumatra). Total pelaku yang memakai dokumen hiu-pari (termasuk domestik) ≈ 500 [S20].
- **Kiriman ekspor hiu/pari per tahun ≈ 300–1.200 (basis ~700)** 🟡. Ada dua cara menghitung:
  - (a) Berbasis dokumen: `N = 746 × s + R_LN`, dengan s = porsi hiu/pari di SAJI-LN Appendiks (asumsi 0,4–0,9) dan R_LN = rekomendasi LN *look-alike* hiu-pari nasional (asumsi 0–400; data parsial: Pontianak ~13, Makassar ≤85 untuk semua jenis).
  - (b) Berbasis volume Comtrade 2025: `N = 355,7 t sirip / ukuran kiriman sirip + 4.481,8 t daging & pari / ukuran kontainer`. Dengan (2 t; 25 t) diperoleh 357, dengan (1 t; 15 t) 654, dengan (0,5 t; 10 t) 1.159. Ukuran kiriman diasumsikan. Pembanding: satu SAJI-LN CV Cahaya Bahari memuat 2.281 + 323 + 70 + 30 = ~2,7 t sirip dari 4 spesies [S21].

---

## 3. Kuota ekspor 2026 (surat B.45/DJPK.3/PRL.430/I/2026, 13 Jan 2026) ✅ [S4]

Satuan kg untuk sirip, daging, kulit, dan tulang; ekor untuk hidup. Dibaca langsung dari lampiran PDF.

| No | Spesies | Sirip | Daging | Kulit | Tulang | Hidup |
|---|---|---|---|---|---|---|
| 12 | *Carcharhinus albimarginatus* | 7.150,00 | 75.790,00 | 11.440,00 | 28.600,00 | |
| 13 | *C. amblyrhynchos* | 9.812,50 | 104.012,50 | 15.700,00 | 39.250,00 | |
| 14 | *C. brevipinna* | 68.750,00 | 728.750,00 | 110.000,00 | 275.000,00 | |
| 15 | *C. falciformis* | 160.000,00 | 1.696.000,00 | 256.000,00 | 640.000,00 | |
| 16 | *C. leucas* | 36.495,00 | 386.847,00 | 58.392,00 | 145.980,00 | |
| 17 | *C. limbatus* | 118.400,00 | 1.255.040,00 | 189.440,00 | 473.600,00 | |
| 18 | *C. melanopterus* | 2.904,00 | 30.782,40 | 4.646,40 | 11.616,00 | 1.365 |
| 19 | *C. obscurus* | 8.550,00 | 90.630,00 | 13.680,00 | 34.200,00 | |
| 20 | *C. plumbeus* | 1.600,00 | 16.960,00 | 2.560,00 | 6.400,00 | |
| 21 | *C. sealei* | 17.174,30 | 182.047,58 | 27.478,88 | 68.697,20 | |
| 22 | *C. sorrah* | 80.250,00 | 850.650,00 | 128.400,00 | 321.000,00 | |
| 23 | *C. tjutjot* | 40.871,00 | 433.232,60 | 65.393,60 | 163.484,00 | |
| 24 | *Loxodon macrorhinus* | 206,55 | 2.189,43 | 330,48 | 826,20 | |
| 25 | *Prionace glauca* | **310.250,00** | **3.288.650,00** | 496.400,00 | 1.241.000,00 | |
| 26 | *Rhizoprionodon acutus* | 12.900,00 | 136.740,00 | 20.640,00 | 51.600,00 | |
| 27 | *R. oligolinx* | 1.752,75 | 18.579,15 | 2.804,40 | 7.011,00 | |
| 28 | *R. taylori* | 3.690,00 | 39.114,00 | 5.904,00 | 14.760,00 | |
| 29 | *Sphyrna lewini* | 8.400,00 | 148.400,00 | 22.400,00 | 56.000,00 | |
| 30 | *S. mokarran* | 1.764,00 | 31.164,00 | 4.704,00 | 11.760,00 | |
| 31 | *S. zygaena* | 168,00 | 2.968,00 | 448,00 | 1.120,00 | |
| 32 | *Triaenodon obesus* | 1.721,50 | 18.247,90 | 2.754,40 | 6.886,00 | 240 |
| 33 | *Glaucostegus thouin* | 577,50 | 5.101,25 | 770,00 | 1.925,00 | |
| 34 | *G. typus* | 57.990,00 | 512.245,00 | 77.320,00 | 193.300,00 | 95 |
| 35 | *Rhina ancylostoma* | 11.700,00 | 103.350,00 | 15.600,00 | 39.000,00 | 160 |
| 36 | *Rhynchobatus australiae* | 44.808,60 | 395.809,30 | 59.744,80 | 149.362,00 | 30 |
| 37 | *R. laevis* | 2.484,00 | 21.942,00 | 3.312,00 | 8.280,00 | |
| 38 | *R. palpebratus* | 1.932,00 | 17.066,00 | 2.576,00 | 6.440,00 | |
| 39 | *R. springeri* | 19.182,00 | 169.441,00 | 25.576,00 | 63.940,00 | |
| | **Total hiu (21 spp.)** | **892.809,60** | **9.536.794,56** | **1.439.516,16** | **3.598.790,40** | 1.605 ekor |
| | **Total pari (7 spp.)** | **138.674,10** | **1.224.954,55** | **184.898,80** | **462.247,00** | 285 ekor |

Total dihitung dengan `scripts/quota.py`, yang memuat assert jumlah spesies 21/7.

Catatan penting:
- Spesies yang **tidak** diberi kuota antara lain *Alopias*, *Isurus*, *C. longimanus*, manta/mobula, dan hiu paus. Artinya ekspornya tidak mungkin secara legal, dan ini *red flag* yang bisa dideteksi lewat DNA.
- **Kuota pari kemungkinan tidak terpakai penuh.** Laporan Dit. KSG Tw I 2026 memuat kegiatan "Percepatan Realisasi Kuota Ekspor Jenis Pari Appendiks II CITES yang Diputuskan Zero-Quota Pasca COP20 CITES pada tanggal 13 – 14 Februari 2026" ✅ [S8]. Sumber sekunder menyebut CoP20 (Nov–Des 2025) menetapkan kuota nol untuk *wedgefish* dan *giant guitarfish* liar, serta memasukkan hiu koboi, manta/mobula, dan hiu paus ke Appendiks I 🟡 [S24].
- Kuota jauh di atas realisasi: kuota sirip hiu 892,8 t, sedangkan ekspor sirip **semua** spesies 2025 hanya 355,7 t [S1].

### 3.1 Nilai indikatif kuota 2026 🟡 (perhitungan, input terverifikasi)

| Basis harga | Nilai | Rumus |
|---|---|---|
| Harga patokan ekspor (Kepmen KP 89/2024) | **Rp263,6 miliar** (sirip Rp99,1 M + derivat Rp164,5 M) | sirip hiu besar 731.339,5 kg × Rp100.000 + sirip hiu kecil-sedang 161.470,1 kg × Rp75.000 + sirip pari 138.674,1 kg × Rp100.000 + (daging+kulit+tulang hiu & pari 16.447.201 kg) × Rp10.000 |
| Harga pasar (unit value Comtrade 2025) | **US$31,7–49,1 juta ≈ Rp523–809 miliar** (sirip + daging saja; kulit dan tulang tidak dinilai) | sirip × US$13,53/kg (beku, 030392) s.d. US$30,38/kg (kering, 030571) + daging hiu × US$1,53 (030381) + daging pari × US$2,55 (030382). Kurs **asumsi** Rp16.500/US$ (JISDOR 2025 berkisar Rp16.236–16.752 [S25]) |

Pembanding: nilai ekspor riil 2025 hanya US$17,1 juta. Kuota adalah plafon, bukan realisasi.

---

## 4. Harga referensi per kg

### 4.1 Harga Patokan Ikan (HPI) ✅ [S5]

**Koreksi atas brief:** Kepmen KP 85/2021, 13/2022, dan 40/2024 **sudah dicabut** oleh **Kepmen KP No. 89 Tahun 2024** (ditetapkan 17 Des 2024): "Nomor 85 Tahun 2021 … Nomor 13 Tahun 2022 … Nomor 40 Tahun 2024 … dicabut dan dinyatakan tidak berlaku."

| Kelompok | Produk | Pungutan SDA | Dalam negeri | **Luar negeri** |
|---|---|---|---|---|
| Hiu besar (*C. falciformis, limbatus, brevipinna, leucas, P. glauca, Sphyrna* spp., *Isurus*, dll.) | hidup | Rp500.000/ekor | Rp500.000 | **Rp1.000.000/ekor** |
| | sirip | Rp50.000/kg | Rp50.000 | **Rp100.000/kg** |
| | derivat/olahan (daging, kulit, tulang) | Rp10.000/kg | Rp10.000 | **Rp10.000/kg** |
| Hiu kecil-sedang (*C. sorrah, tjutjot, sealei, melanopterus, Rhizoprionodon, Triaenodon, Loxodon*) | sirip | Rp50.000/kg | Rp50.000 | **Rp75.000/kg** |
| | derivat | Rp10.000/kg | Rp10.000 | Rp10.000/kg |
| Pari besar (*Glaucostegus, Rhynchobatus, Rhina, Mobula*) | sirip | Rp50.000/kg | Rp50.000 | **Rp100.000/kg** |
| | derivat | Rp10.000/kg | Rp10.000 | Rp10.000/kg |
| Hiu/pari lainnya (*look-alike*) | sirip | Rp50.000 | Rp50.000 | Rp75.000/kg |

🟡 Tabel di PDF memakai sel gabungan per kelompok. Pemetaan harga ke tiap spesies adalah interpretasi kami. HPI dipakai untuk menghitung PNBP, **bukan harga pasar**.

**Contoh biaya kepatuhan per kiriman** (dari [S5] dan [S6]), untuk 1 SAJI-LN berisi 1 t sirip hiu besar dari kuota alam: dokumen Rp840.000 + pungutan perdagangan 8% × 1.000 kg × Rp100.000 = Rp8.000.000 + pungutan pengambilan 6% × … ≈ Rp6.000.000 (bila dihitung per kg) ≈ **Rp14,8 juta**. 🟡 Satuan pungutan pengambilan per individu atau per kg perlu dikonfirmasi.

### 4.2 Harga pasar

| Produk | Harga | Sumber | Status |
|---|---|---|---|
| Sirip kering (FOB ekspor, 030571) | **US$29,9/kg (2024), US$30,4/kg (2025)** | Comtrade [S1] | ✅ |
| Sirip beku (030392) | US$14,8 (2024), US$13,5/kg (2025) | Comtrade [S1] | ✅ |
| Sirip, nilai impor HK dari ID | ~US$52/kg (2025: 14,38 jt / 276,2 t) | Comtrade mirror [S1] | ✅ |
| Hiu beku utuh (030381) | US$1,37 (2024), US$1,53/kg (2025) | [S1] | ✅ |
| Daging hiu beku (030496) | ~US$1,00/kg | [S1] | ✅ |
| Pari beku (030382) | US$2,66 (2024), US$2,55/kg (2025) | [S1] | ✅ |
| Sirip, harga pengepul lokal | "antara Rp400.000-Rp12 juta per kilogram, tergantung ukuran"; 15 cm Rp500–700 rb/kg; 40 cm Rp2–2,4 jt/kg | Mongabay 2023 [S19] | 🟡 |
| Daging hiu lokal | "daging hiu hanya dijual Rp14.000 per kilogram" | [S19] | 🟡 |
| Daging pari lokal (PPN Brondong) | "Rp15 ribu sekilonya" | [S18] | 🟡 |

---

## 5. Ukuran pasar *bottom-up* "DNA-to-compliance reports"

### 5.1 Rumus
`Pendapatan/tahun = N_kiriman_ekspor × n_sampel_per_kiriman × harga_per_sampel`

### 5.2 Skenario (dihitung oleh `scripts/sizing.py`)

| Input | Rendah | Basis | Tinggi | Status input |
|---|---|---|---|---|
| N kiriman ekspor hiu/pari/tahun | 300 | 700 | 1.200 | 🟡 proksi (§2.4): batas 746 SAJI-LN Appendiks 2025 ✅ × porsi hiu-pari (asumsi), dicek silang dengan volume Comtrade 2025 ✅ ÷ ukuran kiriman (asumsi) |
| Sampel per kiriman | 3 | 10 | 30 | ❓ **asumsi**. Rujukan: 1 SAJI-LN contoh berisi 4 spesies [S21], sehingga minimal 1 sampel per baris spesies |
| Harga per sampel | Rp250.000 | Rp400.000 | Rp600.000 | ❓ **asumsi**. Tidak ditemukan tarif publik barcoding/Sanger di Indonesia. Pembanding terverifikasi: biaya dokumen SAJI-LN Rp840.000 [S6] |
| **Pendapatan** | **Rp0,23 miliar (≈US$14 rb)** | **Rp2,80 miliar (≈US$170 rb)** | **Rp21,6 miliar (≈US$1,31 jt)** | hasil hitung |
| % dari nilai ekspor 2025 (US$17,1 jt ≈ Rp282 M) | 0,1% | 1,0% | 7,7% | uji kewajaran |

### 5.3 Mana yang terverifikasi dan mana yang diasumsikan
- ✅ **Terverifikasi:** nilai dan volume ekspor (Comtrade), 746 SAJI-LN ekspor Appendiks 2025 (semua jenis), kuota 2026, HPI, tarif SAJI-LN, dan angka per UPT.
- 🟡 **Proksi:** porsi hiu/pari dalam SAJI-LN, jumlah kiriman, dan jumlah eksportir (20–50).
- ❓ **Asumsi murni:** jumlah sampel per kiriman, harga per sampel, dan kesediaan membayar eksportir. Asumsi-asumsi ini **harus divalidasi lewat wawancara** dengan 3–5 eksportir dan Dit. KSG/UPT.

### 5.4 Ekspansi (bukan pelanggan pertama, tapi lebih besar)
- **Verifikasi domestik dan *look-alike*:** sekitar 26.090 dokumen SAJI hiu-pari dalam 2021–2024, atau ±7.000/tahun 🟡 [S20]. Hanya LPSPL Serang saja sudah memproses 1.707 dokumen (semua jenis) dalam 9 bulan 2025 dan 3.810 t hiu-pari ✅ [S14]. Contoh: 7.000 dokumen × 3 sampel × Rp250.000 = **Rp5,25 miliar/tahun** (asumsi).
- **Pembeli institusional:** UPT KKP (BPSPL/LPSPL) dan Dit. KSG memang mengidentifikasi spesies di setiap dokumen. Ada pula kegiatan "Bimbingan Teknis Identifikasi Hiu dan Pari" (Tw I 2026) ✅ [S8] dan tenggat pembentukan asosiasi eksportir 11 Des 2026 ✅ [S17], yang bisa menjadi kanal distribusi.
- **Prior art / pesaing:** Prasetyo et al. 2023 (*iScience* 26(7)), dengan rekan penulis dari KKP, mengembangkan *closed-tube barcoding* + *deep learning* yang membedakan 25 dari 28 spesies (20 di antaranya CITES) 🟡 [S23]. Diferensiasi tim harus jelas, misalnya laporan kepatuhan otomatis (kuota, HPI, status CITES/PermenKP) di atas hasil sekuens.

---

## 6. Yang tidak ditemukan ❓
- Jumlah SAJI-LN **khusus hiu/pari** per tahun (nasional). Hanya total semua jenis yang tersedia.
- Jumlah nasional pemegang SIPJI-LN hiu/pari. Fitur "Cek SIPJI" di saji.kkp.go.id memerlukan nomor izin dan tidak menyediakan daftar.
- Data CITES per izin/per pengiriman, serta data eksportir Indonesia 2022–2025 di CITES Trade Database.
- Laporan tahunan LPSPL Sorong, dan laporan tahunan BPSPL Pontianak/LPSPL Serang 2025 (URL 404).
- Tarif pasar layanan DNA barcoding per sampel di Indonesia.
- Dokumen asli "kajian KKP 2018" (Rp1,4 triliun).

---

## Daftar sumber

| ID | Judul | Penerbit | Tanggal | URL |
|---|---|---|---|---|
| S1 | UN Comtrade Public API (preview), data HS H5/H6 | UN Statistics Division | diakses 22 Okt 2026 | https://comtradeapi.un.org/public/v1/preview/C/A/HS (query lengkap di §1.2–1.4) |
| S2 | Comtrade HS reference list | UNSD | diakses 22 Okt 2026 | https://comtradeapi.un.org/files/v1/app/reference/HS.json |
| S3 | CITES Trade Database, comparative tabulation | CITES Secretariat / UNEP-WCMC | diakses 22 Okt 2026 | https://trade.cites.org (query di §1.5) |
| S4 | Surat B.45/DJPK.3/PRL.430/I/2026 "Penetapan Kuota Ekspor Nasional Jenis Ikan Dilindungi dan/atau Appendiks CITES Tahun 2026" | KKP, Ditjen Pengelolaan Kelautan (Dir. KSG) | 13 Jan 2026 | https://saji.kkp.go.id/published/SK%20Direktur%20KSG%20-%20Penetapan%20Kuota%20Ekspor%20Nasional%20Tahun%202026.pdf |
| S5 | Kepmen KP No. 89 Tahun 2024 tentang Harga Patokan Pemanfaatan Jenis Ikan Dilindungi dan/atau Dibatasi Pemanfaatannya | KKP | 17 Des 2024 | https://saji.kkp.go.id/published/Kepmen_89_Tahun_2024_Harga_Patokan_Ikan.pdf |
| S6 | Standar Pelayanan Penerbitan SAJI-LN (No. B.533/DJPK.3/PRL.430/IV/2025) | KKP, Ditjen PK | 2 Apr 2026 (tertulis demikian) | https://saji.kkp.go.id/published/Standar_Layanan_SAJI_LN_02042026_Sign.pdf |
| S7 | Laporan Kinerja Triwulan IV Tahun 2025, Direktorat Konservasi Spesies dan Genetik | KKP | Jan 2026 | https://kkp.go.id/download-pdf-akuntabilitas-kinerja/akuntabilitas-kinerja-pelaporan-kinerja-laporan-kinerja-instansi-pemerintah-tahun-2025-direktorta-konservasi-spesies-dan-genetik.pdf |
| S8 | Laporan Kinerja Triwulan I Tahun 2026, Direktorat Konservasi Spesies dan Genetik | KKP | 2026 | https://kkp.go.id/download-pdf-akuntabilitas-kinerja/akuntabilitas-kinerja-pelaporan-kinerja-laporan-kinerja-direktorat-spesies-dan-genetik-triwulan-i-tahun-2026.pdf |
| S9 | Laporan Kinerja BPSPL Denpasar Tahun 2024 | KKP, BPSPL Denpasar | 2025 | https://kkp.go.id/download-pdf-akuntabilitas-kinerja/akuntabilitas-kinerja-pelaporan-kinerja-laporan-kineja-bpspl-denpasar-tahun-2024.pdf |
| S10 | Laporan Kinerja BPSPL Denpasar Tahun 2025 (Reviu) | KKP, BPSPL Denpasar | 2026 | https://kkp.go.id/storage/AkuntabilitasKinerja/4804/document-akuntabilitas-kinerja-6a33524aba521LKJ%20Tahun%202025%20BPSPL%20Denpasar_Reviu2.pdf |
| S11 | Laporan Kinerja BPSPL Pontianak Tahun 2024 | KKP, BPSPL Pontianak | 2025 | https://www.kkp.go.id/download-pdf-akuntabilitas-kinerja/akuntabilitas-kinerja-pelaporan-kinerja-laporan-kineja-bpspl-pontianak-tahun-2024.pdf |
| S12 | Laporan Kinerja BPSPL Makassar Tahun 2025 | KKP, BPSPL Makassar | 2026 | https://kkp.go.id/download-pdf-akuntabilitas-kinerja/akuntabilitas-kinerja-pelaporan-kinerja-laporan-kinerja-bpspl-makassar-tahun-2025.pdf |
| S13 | Laporan Kinerja BPSPL Padang Tahun 2025 | KKP, BPSPL Padang | 2026 | https://kkp.go.id/download-pdf-akuntabilitas-kinerja/akuntabilitas-kinerja-pelaporan-kinerja-laporan-kinerja-bpspl-padang-tahun-2025.pdf |
| S14 | Laporan Kinerja LPSPL Serang Triwulan III 2025 | KKP, LPSPL Serang | Okt 2025 | https://kkp.go.id/download-pdf-akuntabilitas-kinerja/akuntabilitas-kinerja-pelaporan-kinerja-laporan-kinerja-lpspl-serang-triwulan-iii-tahun-2025.pdf |
| S15 | Surat B.1722/DJPKRL.5/PRL.430/VII/2024 "Penetapan Kuota Ekspor Nasional … Hiu Family Carcharhinidae Tahun 2024" | KKP, Ditjen PKRL | 4 Jul 2024 | https://saji.kkp.go.id/published/signed__Penetapan_Kuota_Ekspor_Nasional_Jenis_Ikan_Ikan_Hiu_Family_Carcharhinidae_Tahun_2024_2024070506.pdf |
| S16 | Surat B.2436/DJPKRL.5/PRL.430/XI/2023 "Pemberlakuan Ketentuan … Uplisting Appendiks II pada COP19 CITES" | KKP, Ditjen PKRL | 13 Nov 2023 | https://saji.kkp.go.id/published/Pemberlakuan_Ketentuan_Pemanfaatan_Jenis_Ikan_yang_Uplisting_Appendiks_II_pada_COP19_CITES.pdf |
| S17 | Surat B.1781/DJPK.3/PRL.430/VIII/2026 "Imbauan Pembentukan Asosiasi Eksportir Hiu dan Pari …" | KKP, Ditjen PK | 31 Agu 2026 | https://saji.kkp.go.id/published/signed__Imbauan_Pembentukan_Asosiasi_Eksportir_Hiu_dan_Pari_dan_Asosiasi_Eksportir_Teripang_20260831133210.pdf |
| S18 | "Perburuan Hiu-Pari yang Tak Pernah Mati" (A. Asnawi) | Mongabay Indonesia | 5 Sep 2022 | https://mongabay.co.id/2022/09/05/perburuan-hiu-pari-yang-tak-pernah-mati/ |
| S19 | "Mengungkap Perdagangan Hiu Diduga Ilegal Lewat Pelabuhan di Pulau Jawa [1]" (A. Asnawi) | Mongabay Indonesia | 11 Jul 2023 | https://mongabay.co.id/2023/07/11/mengungkap-perdagangan-hiu-diduga-ilegal-lewat-pelabuhan-di-pulau-jawa-1/ |
| S20 | "Konservasi Hiu dan Pari: Melawan Penangkapan Ikan Berlebihan dan Menjaga Habitat" (M Ambari) | Mongabay Indonesia | 21 Jun 2024 | https://www.mongabay.co.id/2024/06/21/konservasi-hiu-dan-pari-melawan-penangkapan-ikan-berlebihan-dan-menjaga-habitat/ |
| S21 | "CITES Berburu Data Perdagangan Hiu Indonesia" (Abdus Somad) | Jaring.id | 17 Agu 2024 | https://jaring.id/cites-berburu-data-perdagangan-hiu-indonesia/ |
| S22 | Prasetyo et al., "Shark and ray trade in and out of Indonesia…", *Marine Policy* 133, doi:10.1016/j.marpol.2021.104714 | Elsevier / LJMU repo | 2021 | https://researchonline.ljmu.ac.uk/id/eprint/18797/ |
| S23 | Prasetyo et al., "Universal closed-tube barcoding for monitoring the shark and ray trade in megadiverse conservation hotspots", *iScience* 26(7) | Cell Press | 2023 | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10300358/ |
| S24 | "Imperiled Shark and Ray Species Win Unprecedented Protection at the CITES CoP20" (sekunder) | Born Free USA | 1 Des 2025 | https://www.bornfreeusa.org/2025/12/01/imperiled-shark-and-ray-species-win-unprecedented-protection-at-the-cites-cop20/ |
| S25 | "Rupiah Jisdor melemah 0,43% ke Rp 16.752 pada Kamis (25/9/2025)" (titik kurs untuk asumsi FX) | Kontan | 25 Sep 2025 | https://investasi.kontan.co.id/news/rupiah-jisdor-melemah-043-ke-rp-16752-pada-kamis-2592025 |
