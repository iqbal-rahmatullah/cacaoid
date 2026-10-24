# Rencana MVP CacaoID (vibe coding untuk menemukan & menambal kekurangan sistem)

## Context
Tim sudah punya konsep, deck, dan mockup 6 layar CacaoID. Tujuan langkah ini: membangun **MVP yang benar-benar jalan** untuk seluruh fitur inti, supaya kekurangan sistem ketahuan dari pemakaian nyata (bukan dari slide), lalu ditambal.

Keputusan yang sudah diambil:
- **Stack:** FastAPI + SQLite (Python) untuk backend, React (Vite + Tailwind) untuk frontend.
- **Halaman lapangan:** web responsif.
- **Target:** jalan lokal dengan data simulasi. Login cukup pilih peran, tanpa autentikasi nyata.

Kondisi awal:
- Belum ada kode aplikasi.
- Yang bisa dipakai ulang adalah skrip analisis Python dan data publik. Keduanya ada di folder sementara `/private/tmp/.../scratchpad/` yang **bisa terhapus**, jadi harus diselamatkan dulu (T0).
- Toolchain tersedia: Python 3.12, uv, Node 24, pnpm.

## Lokasi & struktur
Proyek baru di `/Users/iqbalrahmatullah/Desktop/hackathon/soulsea/cacaoid-app/`:
```
cacaoid-app/
  backend/   (uv, FastAPI, SQLModel/SQLite, pytest)
    cacaoid/engine/  io.py qc.py registry.py identity.py parentage.py contamination.py sampling.py
                     ai_traits.py ai_ancestry.py risk.py simulate.py
    cacaoid/api/     routers per fitur;  cacaoid/models.py;  config.py (ambang batas)
    tests/
  frontend/  (Vite React TS, Tailwind, React Router, TanStack Query)
  data/      bekele2022/ (HapMap + fenotipe), osorio2025/ (Tabel 4 & 5), ATTRIBUTION.md (CC BY)
  tasks/     plan.md, todo.md, GAPS.md
```

## Kode yang dipakai ulang (dipindah ke engine, jangan ditulis ulang dari nol)
Semua di `scratchpad/kakao_scripts/`:
| File | Fungsi yang diambil | Masuk ke modul |
|---|---|---|
| `panel2.py` | parse HapMap → dosis, konsensus klon, greedy panel, aturan off-type toleran error | `io.py`, `registry.py`, `identity.py` |
| `pollen.py` | estimator kontaminasi terkoreksi (α & daya eksklusi) | `contamination.py` |
| `gs2.py` | parse fenotipe, CV berblok kekerabatan, RR-BLUP/RF/SVR | `ai_traits.py` |
| `ancestry.py` | `admix()` EM supervised, `freqs()` | `ai_ancestry.py` (label diganti kelompok Motamayor) |
| `colombia_bench.py` | parser Tabel 4/5, `clusters()` | test regresi `tests/test_benchmark.py` |

Data yang dipakai: `verif2/e_dl/bekele/s010.bin` (HapMap), `kakao_data/pheno.xlsx`, `colombia_dl/supp/Table4.xlsx`, `Table5.xlsx`. Semuanya berlisensi CC BY dan disalin dengan atribusi.

## Prinsip
- **Irisan vertikal:** setiap tugas berjalan dari data, ke engine, ke API, ke UI, sampai bisa dicoba.
- **Ponytail:** SQLite, tanpa Celery/Docker/auth. Analisis berjalan sinkron (96 sampel hanya butuh hitungan detik). PDF dibuat lewat halaman cetak browser.
- **Data simulasi selalu berlabel "DATA SIMULASI"** di UI.
- Klon Indonesia (MCC 02, Sulawesi 1/2) **tidak dikarang genotipenya**. Registri punya status "menunggu referensi", dan demo memakai klon publik (ICS 60, SCA 6, TSH 1188, dll.).
- Setiap logika engine punya minimal satu test berbasis `assert`. Ambang batas disimpan di `config.py`.

## Tugas (dependency: T0 → T1 → T2/T3/T4 → T5 → … )

### Fase 0: Fondasi
**T0 · Selamatkan aset & kerangka proyek**
- Salin data dan skrip ke `cacaoid-app/`, lengkap dengan `data/ATTRIBUTION.md`.
- Inisialisasi backend (uv, FastAPI, `/health`) dan frontend (Vite, sidebar 7 menu, pemilih peran, tema navy/biru).
- ✅ `uv run pytest` lolos (smoke), `pnpm dev` menampilkan shell aplikasi, dan file data ada di repo.

### Fase 1: Jalur inti verifikasi (input sampai vonis)
**T1 · Parser genotipe + QC**
- Format yang didukung: HapMap, CSV KASP (sampel × SNP, "A:G" atau "A G"), dan Tabel 4 Kolombia.
- Normalisasi dilakukan per alel.
- QC mencakup call rate per sampel, sampel kontrol, ID tak dikenal, dan SNP di luar panel.
- ✅ Test pada tiga format lolos. Sampel dengan call rate di bawah ambang ditandai UJI ULANG.

**T2 · Registri klon**
- Seed dari Bekele: konsensus replikat per klon dan frekuensi alel.
- Klon Indonesia dibuat sebagai entri "menunggu referensi".
- API list/detail/tambah. Halaman Registri menampilkan daftar, profil sidik jari, dan status.
- ✅ Jumlah genotipe unik ±566. Klon dengan replikat yang tidak konsisten ditandai (mis. ICS39, ICS81).

**T3 · Engine identitas & vonis**
- Mismatch dengan model error, rasio keyakinan, dan peluang kebetulan sama.
- Alur keputusan: UJI ULANG → COCOK → OFF-TYPE (sebut klonnya) → TIDAK DIKENAL. BATANG BAWAH menyusul di T6.
- Penjelasan langkah demi langkah dikembalikan sebagai JSON untuk kartu "Bagaimana vonis diambil".
- ✅ Simulasi dengan 15% off-type, error 2%, dan data hilang 5%: recall ≥99% dan presisi ≥98% (mengacu uji panel2). Kerabat dekat tidak salah COCOK.

**T4 · Generator data simulasi**
- Menghasilkan satu batch berisi: CSV data lapangan, CSV hasil lab, dan file kunci jawaban.
- Isinya mencakup off-type, error lab, data hilang, kontrol, batang bawah, dan satu lot hibrida dengan kontaminasi.
- ✅ Satu perintah (`uv run python -m cacaoid.engine.simulate`) menghasilkan 3 file dengan seed tetap.

**T5 · UI alur inti: Unggah → Hasil batch → Detail sampel** (sesuai mockup UI 2–4)
- **Unggah:** pilih batch, unggah file, tampilkan pratinjau QC, lalu jalankan analisis.
- **Hasil batch:** kartu jumlah per vonis, tabel dengan filter, dan kolom "ditemukan sebagai".
- **Detail sampel:** banner vonis, perbandingan sidik jari, bukti, dan kartu "Bagaimana vonis diambil".
- ✅ End-to-end: file simulasi T4 diunggah, vonis di UI cocok dengan kunci jawaban.

**🔶 Checkpoint A:** demo alur inti jalan dari awal sampai akhir. `tests/test_benchmark.py` pada data Kolombia menemukan ulang ≥95% plot salah label versi paper. Review bersama sebelum lanjut.

### Fase 2: Verifikasi lanjutan & alur lapangan
**T6 · Parentage: BATANG BAWAH & asal biji**
- Uji eksklusi Mendel terhadap tetua hibrida yang terdaftar memberi vonis BATANG BAWAH.
- Untuk vonis TIDAK DIKENAL, sistem mencari pasangan tetua di registri. Kalau cocok, ditandai "kemungkinan asal biji".
- ✅ Test: anak simulasi ICS60 × SCA6 terdeteksi sebagai anak pasangan itu, dan pohon acak tidak.

**T7 · Kontaminasi lot + kalkulator sampling**
- Estimator kontaminasi (pollen.py) dengan keputusan LOLOS/TAHAN (ambang 5%).
- Kalkulator berapa sampel per lot supaya off-type ≥x% terdeteksi dengan keyakinan 95%.
- Ditampilkan sebagai kartu lot di halaman Hasil batch.
- ✅ Kontaminasi 5/10/20/30% terestimasi dengan meleset ±3 poin pada panel 48 SNP.

**T8 · Halaman lapangan (web responsif)** (mockup UI 1)
- Isi ID secara manual atau scan QR lewat kamera browser, pilih klaim klon dari registri, GPS dari `navigator.geolocation`, dan checklist prosedur.
- Sampel disimpan ke batch, lalu manifest CSV untuk lab bisa diunduh.
- ✅ Di layar ponsel (devtools 390px), sampel tersimpan dan muncul di batch.

**T9 · Jejak audit + laporan**
- Event audit append-only dengan rantai hash.
- Aksi: uji ulang, tandai pemurnian.
- Halaman cetak berita acara/sertifikat (PDF lewat print browser).
- ✅ Mengubah satu event membuat verifikasi rantai gagal (ada test-nya). Berita acara tercetak lengkap dengan label simulasi.

**🔶 Checkpoint B:** alur pengawas lengkap, dari lapangan sampai berita acara.

### Fase 3: Modul AI & dasbor
**T10 · AI prediksi komponen hasil**
- Latih model pada fenotipe Bekele, lalu pilih model lewat CV berblok kekerabatan. Metrik disimpan internal dan tidak ditampilkan di UI.
- Prediksi jumlah dan ukuran biji ± ketidakpastian untuk kandidat pohon.
- Label UI: "bukan prediksi hasil panen".
- ✅ Prediksi muncul di halaman Analitik AI. Model dimuat dari file, tanpa latih ulang setiap request.

**T11 · AI asal-usul (kelompok Motamayor) + parentage**
- Admixture EM dengan kelompok yang tersedia (Nanay, Marañón, Iquitos, Guiana, Contamana).
- Peringatan "Criollo/Amelonado belum terwakili" ditampilkan.
- Digabung dengan hasil parentage dari T6.
- ✅ Hibrida TSH terbaca sebagai campuran. Tidak ada label "Trinitario" sebagai kelompok genetik.

**T12 · Skor risiko penyedia (beta)**
- Dimulai dengan aturan dasar (cold start): riwayat off-type, jenis kebun, dan audit pertama, beserta faktor penjelasnya.
- Menghasilkan rekomendasi jumlah sampel per lot.
- ✅ Penyedia dengan riwayat off-type tinggi mendapat skor dan rekomendasi sampel lebih tinggi (ada test-nya).

**T13 · Dasbor program** (mockup UI 5)
- KPI % benih terverifikasi.
- Tingkat off-type per provinsi, kebun, dan penyedia, serta jumlah lot ditahan.
- ✅ Angka di dasbor sama dengan agregasi dari database (ada test-nya).

**🔶 Checkpoint C:** semua menu di mockup berfungsi.

### Fase 4: Berburu & menambal kekurangan (tujuan utama)
**T14 · Uji skenario sulit → `tasks/GAPS.md`**
Jalankan dan catat (dengan tingkat keparahan) skenario-skenario berikut:
- sampel tertukar di plate lab (geser satu sumur);
- strand flip A/T vs T/A;
- lab memakai panel yang berbeda;
- kontrol tidak ada;
- ID duplikat;
- klon yang diklaim belum ada di registri (MCC 02);
- sinonim atau duplikat di registri;
- kerabat dekat di ambang batas;
- ambiguitas batang bawah vs tidak dikenal;
- lot dengan sampel terlalu sedikit;
- GPS kosong;
- file rusak atau format salah.

✅ Ada daftar kekurangan beserta reproduksinya.

**T15 · Tambal kekurangan prioritas**
- Perbaiki temuan dengan keparahan tinggi dan sedang, masing-masing dengan test regresi.
- Perbarui deck atau overview kalau perilaku sistem berubah.

✅ Semua test lolos, dan skenario T14 yang ditambal kini memberi hasil yang benar atau pesan yang jelas.

**🔶 Checkpoint akhir:** jalankan naskah demo 2 menit tanpa error, lalu review GAPS.md bersama tim.

## Verifikasi end-to-end
1. `cd backend && uv run pytest`: semua test lolos, termasuk benchmark Kolombia dan test simulasi.
2. `uv run python -m cacaoid.engine.simulate`, lalu `uv run uvicorn cacaoid.main:app` dan `cd frontend && pnpm dev`.
3. Alur demo di browser: halaman lapangan (390px) → unggah CSV lab → hasil batch (cocokkan dengan kunci jawaban) → detail OFF-TYPE → berita acara → Analitik AI → Dasbor.
4. Periksa label "DATA SIMULASI" di setiap halaman.

## Setelah rencana disetujui
Salin rencana ini ke `cacaoid-app/tasks/plan.md` dan daftar tugas ke `cacaoid-app/tasks/todo.md`, lalu mulai dari T0.
