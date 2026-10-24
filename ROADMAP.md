# Roadmap pengembangan fitur CacaoID Web

Kondisi per 25 Okt 2026 (monorepo `cacaoid/`):
- **Semua butir Minor selesai** (Fase 1–4). Semua halaman web dan ponsel memakai `apps/api`, kecuali
  Analitik AI yang tetap statis karena modul AI masih Major (riset lanjut).
- Sisa pekerjaan adalah butir **Major**: modul AI, tugas pengawas, siklus tindak lanjut tertutup, QR cek
  keaslian, login, deploy, PWA, parser lab pilot, referensi klon Indonesia, dan kalibrasi.

## Cara membaca

| Jenis | Artinya |
|---|---|
| **Major** | Butuh logika atau model data baru di backend, integrasi pihak luar, keamanan, riset/validasi, atau mengubah klaim di pitch. Perlu desain singkat dan tes sebelum dikerjakan. |
| **Minor** | UI baru yang memakai endpoint yang sudah ada, kolom kecil, atau polesan. Bisa dikerjakan per modul tanpa menunggu modul lain. |

Kolom **Backend** menunjukkan endpoint `apps/api` yang sudah tersedia. **Baru** berarti belum ada.

## Ringkasan

| Fase | Tujuan | Major | Minor |
|---|---|---|---|
| 0 · Sebelum demo final ✅ | API, web, dan mockup bercerita sama | 0 | 3 |
| 1 · Sambungkan ke backend (Minor ✅) | Semua layar memakai data asli dari API | 4 | 27 |
| 2 · Fitur baru dari mockup (Minor ✅) | Menutup alur pengawas dari tugas sampai kasus selesai | 4 | 4 |
| 3 · Siap pilot lapangan (Minor ✅) | Aman dipakai orang lain di luar tim | 6 | 1 |
| 4 · Setelah pilot (Minor ✅) | Memperluas pengguna dan sains | 5 | 1 |

---

## Fase 0 · Sebelum demo final (24–25 Okt 2026) ✅

Dikerjakan di monorepo baru. `apps/api` adalah salinan backend lama; aplikasi lama tidak diubah.

| Fitur | Jenis | Status |
|---|---|---|
| SIM-065 tampil sebagai **Sulawesi 1** | Minor | ✅ `apps/api/.../simulate.py`. Hasil: OFF-TYPE, **24** dari 42 SNP beda (deck semula 23). Ditambah `pnpm seed` untuk membuat batch demo. |
| Samakan mockup Pencil: W1 "Dasbor verifikasi", satu peran Pengawas benih | Minor | ✅ Termasuk kartu "Perjalanan sampel", angka baru (82,9%, 16%, 24/42, Kolaka 57 → 54), dan 23 → 24 di slide F04/F14 + naskah demo. PDF/PNG mockup, PDF dan PPTX deck fitur diekspor ulang. |
| Angka demo diperbarui dari API | Minor | ✅ `apps/web/src/data/demo.ts`. Lot 16% (7,3–28,5%), 82,9% sesuai klaim, Kolaka 57 → 54 daun. |

## Fase 1 · Sambungkan ke backend yang sudah ada

Kerjakan **Fondasi** dulu. Setelah itu tiap modul bisa jalan paralel. Urutan modul yang disarankan:

1. Lapangan dan Unggah (inti alur)
2. Hasil dan Detail
3. Laporan
4. Dasbor dan Penyedia
5. Registri dan AI

### Fondasi
| Fitur | Jenis | Backend | Catatan |
|---|---|---|---|
| ✅ Klien API + TanStack Query | Minor | – | Kirim header `X-Role` dan tampilkan pesan `detail` dari API saat gagal. Proxy `/api` → `:8001` sudah ada. |
| ✅ Loading bar selesai saat data tiba, bukan pakai timer | Minor | – | Pakai `useIsFetching()` di `Root` (`main.tsx`). |
| ✅ Tampilan memuat, kosong, dan gagal di setiap halaman | Minor | – | `Loading`, `Empty`, `Problem` di `ui.tsx`. Gagal menjelaskan apa yang terjadi (mis. server tidak bisa dihubungi). |
| ✅ Hapus blok `demo.ts` per modul setelah tersambung | Minor | – | `demo.ts` kini hanya untuk halaman Analitik AI (Major). |

### Lapangan (ponsel)
| Fitur | Jenis | Backend | Catatan |
|---|---|---|---|
| ✅ Simpan sampel + antrean offline + kirim otomatis | Minor | `POST /batches/{id}/samples` | Antrean di perangkat, dikirim ulang saat online; set `networkMode: 'always'` agar TanStack Query tidak menahan mutasi di memori (G-12). |
| ✅ Pindai label kantong dengan kamera | Minor | – | `BarcodeDetector` sudah dipakai aplikasi lama. |
| ✅ Konfirmasi bila klon yang diklaim tidak ada di registri | Minor | `GET /clones` | G-13. |
| ✅ Daftar hasil terbaru + layar vonis di ponsel | Minor | `GET /batches/{id}`, `GET …/samples/{id}`, `GET /traits/compare`, `POST …/action` | Termasuk tombol uji ulang / tandai pohon. |

### Unggah hasil lab
| Fitur | Jenis | Backend | Catatan |
|---|---|---|---|
| ✅ Unggah file lab + jalankan verifikasi | Minor | `POST /batches/{id}/lab`, `POST …/analyze` | CSV, `;`, dan `.xlsx` sudah ditangani (G-22, G-24). |
| ✅ Unduh manifest plate untuk lab | Minor | `GET …/manifest.csv` | |
| ✅ Peta plate per sumur | Minor | `call_rate` per sampel + posisi dari manifest | Manifest sudah menyimpan `plate` dan `well`. |

### Hasil verifikasi
| Fitur | Jenis | Backend | Catatan |
|---|---|---|---|
| ✅ Tabel vonis + filter + paginasi | Minor | `GET /batches/{id}` | |
| ✅ Kartu lot hibrida + kualitas data lab | Minor | `qc.lots`, `qc.control_results` | |
| ✅ Spanduk sumur tergeser dan untai terbalik | Minor | `qc.plate_shift`, `qc.strand_fixed` | **Wajib ikut**: G-20 tergolong kritis. |
| ✅ Ekspor GeoJSON EUDR | Minor | `GET …/eudr.geojson` | |

### Detail sampel
| Fitur | Jenis | Backend | Catatan |
|---|---|---|---|
| ✅ Vonis, sidik jari 48 SNP, langkah vonis | Minor | `GET …/samples/{id}` (`result.compare`, `steps`) | |
| ✅ Dampak bagi petani (sifat dibayar vs diterima) | Minor | `GET /traits/compare` | Fakta uji lapang, bukan prediksi. |
| ✅ Tindak lanjut: uji ulang / pemurnian ("Tandai pohon") | Minor | `POST …/action` | Sudah ada di aplikasi lama. |
| Asal-usul + uji refleks untuk TIDAK DIKENAL | **Major** | `GET /ai/ancestry/sample`, `/ai/reflex` | Riset lanjut dulu; klaim tidak boleh melebihi `apps/api/tasks/VALIDASI_MODEL.md`. |

### Laporan
| Fitur | Jenis | Backend | Catatan |
|---|---|---|---|
| ✅ Berita acara + cetak / simpan PDF | Minor | `GET /batches/{id}` | Cukup `window.print()` + CSS cetak. |
| ✅ Jejak audit + status rantai hash | Minor | `GET /audit` | |
| ✅ Paspor bibit (identitas + skrining EUDR) | Minor | `GET …/passport` | |

### Dasbor, Penyedia, Registri, AI
| Fitur | Jenis | Backend | Catatan |
|---|---|---|---|
| ✅ Dasbor: ringkasan, bar vonis, tingkat per provinsi/jenis | Minor | `GET /dashboard` | |
| ✅ Dasbor: kartu "Perjalanan sampel" | Minor | `GET /dashboard` + 2 angka baru | `lab_received`, `qc_passed`, `follow_up`, `follow_up_done`. "Selesai" untuk sekarang = tindak lanjut tercatat; siklus tertutup tetap Major. |
| ✅ Penyedia: skor risiko + anjuran jumlah daun | Minor | `GET /ai/risk` | Label tetap "bukan AI". |
| ✅ Penyedia: daftarkan penyedia + klon kebunnya | Minor | `POST /providers`, `PUT …/clones` | |
| ✅ Registri: daftar, status, detail, fakta uji lapang | Minor | `GET /clones`, `/clones/{name}`, `/traits/clone/{name}` | Tanpa prediksi AI untuk klon terdaftar. |
| ✅ Registri: tambah klon (tolak sinonim) | Minor | `POST /clones` | G-16. |
| AI: ranking busuk buah dari file semaian | **Major** | `POST /ai/seedlings` | Riset lanjut dulu; klaim tidak boleh melebihi `apps/api/tasks/VALIDASI_MODEL.md`. |
| AI: semaian silangan dengan biji terbanyak | **Major** | `POST /ai/cross` | Riset lanjut dulu; klaim tidak boleh melebihi `apps/api/tasks/VALIDASI_MODEL.md`. |
| AI: penasihat campuran klon + kesesuaian lokasi | **Major** | `POST /ai/mix`, `GET /ai/where` | Riset lanjut dulu; klaim tidak boleh melebihi `apps/api/tasks/VALIDASI_MODEL.md`. Belum ada di mockup v2; desain layarnya dulu. |

## Fase 2 · Fitur baru dari mockup

Fitur ini muncul di mockup tetapi belum ada di backend.

| Fitur | Jenis | Catatan |
|---|---|---|
| **Tugas pengawas**: "Kirim tugas ke ponsel" + kartu "Tugas hari ini" di Beranda | **Major** | Model data baru: siapa, kebun mana, berapa daun, tenggat, status. Disinkronkan ke ponsel (juga saat offline). |
| **Rencana sampling bulanan** dari skor risiko, dengan progres seperti 12/38 | **Major** | Bergantung pada Tugas. Total anjuran per kebun sudah ada di `/ai/risk`. |
| **Siklus tindak lanjut tertutup** | **Major** | Uji ulang membuat sampel baru yang tertaut ke sampel lama. Pemurnian butuh bukti (tanggal, foto) lalu kasus ditutup. Angka "x/26 selesai" dihitung dari sini. |
| **QR cek keaslian** di berita acara dan paspor bibit | **Major** | Halaman verifikasi publik yang hanya baca, memakai hash audit. Perlu batas data yang boleh tampil ke publik. |
| ✅ Kolom "Posisi pohon di kebun" (blok, baris, nomor) | Minor | Kolom `Sample.position` (ditambahkan otomatis ke database lama), isian di Ambil sampel untuk pohon induk, tampil di detail web dan ponsel, ikut di CSV hasil. |
| ✅ Notifikasi hasil lab baru (lonceng + badge BARU) | Minor | Polling `GET /batches` tiap 60 detik; BARU = dianalisis setelah lonceng terakhir dibuka di perangkat ini. |
| ✅ Pencarian global ⌘K (sampel, klon, kebun) | Minor | `GET /search?q=`; maksimal 8 hasil per jenis. |
| ✅ Unduh CSV hasil (vonis + bukti per SNP) | Minor | `GET /batches/{id}/results.csv`: angka vonis + genotipe sampel di tiap SNP panel (endpoint baru, karena genotipe tidak ada di `GET /batches/{id}`). |

## Fase 3 · Siap pilot lapangan

Target pilot fase A: 100 pohon induk + 5 lot × 59 bibit. Semua butir Major di fase ini harus selesai sebelum pilot dimulai.

| Fitur | Jenis | Catatan |
|---|---|---|
| **Login akun pengawas**; jejak audit mencatat nama orang, bukan peran | **Major** | Sekarang peran dipilih sendiri (GAPS: autentikasi). |
| **Deploy**: hosting HTTPS, database terkelola + backup | **Major** | Saat ini API memakai SQLite lokal (`apps/api/cacaoid.db`). |
| **Aplikasi ponsel bisa dibuka tanpa sinyal** (PWA / service worker) | **Major** | Antrean offline sudah ada, tetapi halaman belum bisa dimuat tanpa sinyal. |
| **Parser format file lab pilot** + uji pada plate nyata | **Major** | Bergantung pada lab yang dipakai. Jangan klaim format tertentu sebelum diuji. |
| **Referensi klon Indonesia multi-ramet**: alur impor + kurasi | **Major** | G-04 dan G-05. Butuh kesepakatan dengan pemilik klon, bukan hanya kode. |
| **Kalibrasi ambang dan skor risiko** dengan data pilot | **Major** | Toleransi error lab, prior Bayes, dan jumlah daun dicek ulang pada data nyata. |
| ✅ Mode data nyata vs simulasi | Minor | Env `CACAOID_DATA=nyata` di API; `GET /health` → `simulated_data`. Lencana tetap tampil sampai API menjawab. |

## Fase 4 · Setelah pilot

| Fitur | Jenis | Catatan |
|---|---|---|
| Multi-peran: Ditjenbun (dasbor nasional), pemulia, operator lab | **Major** | Menu dan izin per peran. Butuh login dari Fase 3. |
| Panel SNP v2 | **Major** | Buang SNP palindromik (G-21), tambah panel parentage untuk kebun benih (G-26), dan penanda SSR kompatibilitas (G-30). Ini riset, bukan sekadar kode. |
| Validasi model AI pada semaian Indonesia | **Major** | Sampai ini selesai, klaim AI tetap "diuji pada data Kosta Rika/Trinidad". |
| Skrining EUDR dengan poligon kebun | **Major** | G-29: kebun agroforestri lama bisa terbaca sebagai hutan. |
| Kesesuaian lokasi dengan data iklim lebih halus | **Major** | G-30: ganti NASA POWER (±55 km) dengan WorldClim/CHIRPS. |
| ✅ Laporan untuk perusahaan mitra (rekap lot dan kebun) | Minor | Tab "Rekap mitra" di Laporan; bisa dicetak. |

## Ketergantungan utama

- Fondasi Fase 1 → semua modul Fase 1.
- Tugas pengawas → Rencana sampling bulanan.
- Tugas pengawas → kartu "Tugas hari ini" di ponsel.
- Siklus tindak lanjut tertutup → angka "x/26 selesai" di Dasbor.
- Login → Deploy → Pilot. Login juga diperlukan untuk Multi-peran.
- Referensi klon Indonesia → vonis untuk MCC 02 dan klon lain yang masih **BELUM ADA REFERENSI**.
