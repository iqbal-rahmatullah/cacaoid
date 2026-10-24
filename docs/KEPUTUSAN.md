# Catatan keputusan CacaoID

Keputusan produk, bisnis, dan teknis yang **tidak terlihat dari kode**. Tambahkan entri baru di atas,
dengan tanggal dan alasan. Jangan menghapus entri lama; tandai "diganti oleh …" bila berubah.

## Konteks lomba

- **GenoHack 2026**, ITB Bandung, 23–25 Okt 2026, Track 2 *Food Security & Biodiversity Genomics*.
- Tim: 3 software engineer, 1 farmasi, 1 biologi. Target minimal juara track.
- Batasan yang ditetapkan tim:
  - murni software: tanpa hardware, kit, sensor, atau pekerjaan lab basah;
  - boleh memakai data dari lab atau penyedia sekuensing pihak ketiga;
  - prototipe harus bisa didemokan dengan data publik berlisensi jelas;
  - inti solusi semula ditargetkan **model ML terlatih**. Lihat isu terbuka di bawah.

---

## 24 Okt 2026

### Posisi bisnis: pendamping verifikasi, lab = pemasok

- **Saran mentor:** jangan tampilkan "kami butuh mitra lab" secara gamblang.
- **Bingkainya:** CacaoID adalah *pendamping verifikasi*. Lab terakreditasi mana pun bisa dipakai, karena genotyping SNP sudah layanan umum (Kementan bahkan sudah punya tarif SNP Rp400 rb, PMK 85/2023). CacaoID memegang alur sampling, QC data lab, vonis, registri sidik jari, dan laporan.
- **Wewenang sertifikasi tetap di pengawas benih (UPTD BPSBP).** Analogi untuk juri: pendamping halal (P3H).
- **Jangan menyembunyikan lab.** Bila juri bertanya "lab-nya siapa?", jawab: "lab terakreditasi mana pun yang menjalankan panel SNP; estimasi Rp226 rb/sampel; aplikasi menerima file hasil lab, jadi lab bisa diganti."
- **Pembeli, urut dari yang paling cepat:**
  1. perusahaan dengan program kemitraan/keberlanjutan kakao (audit kebun entres dan lot bibit);
  2. kebun entres/penangkar besar (label "terverifikasi DNA");
  3. pemerintah (lisensi registri, realistis di anggaran 2028);
  4. pemulia (modul AI).
- **Cara menagih:** jual paket hasil, bukan tes lab. Contoh: "Audit kebun entres" per pohon induk, dan "Verifikasi lot bibit" 59 daun (±Rp15,7 jt). Biaya lab masuk ke paket.
- **Margin:** ±85% isi paket adalah biaya lab (Rp226 rb dari Rp266 rb), jadi margin tipis kalau hanya menjual uji. Margin sehat datang dari lisensi registri dan modul pemulia.
- **Pendampingan dijalankan petugas yang sudah ada** (pengawas, penyuluh) lewat aplikasi, bukan tim CacaoID turun ke kebun. Kalau tidak, CacaoID jadi jasa konsultan yang tidak bisa membesar.
- Rincian harga, roadmap 12 bulan, dan regulasi: `produk/Riset-Perbaikan-Pitch-CacaoID.md`.

### Pengguna: satu peran dulu

- MVP hanya punya peran **Pengawas benih**, dengan semua menu terbuka. Tidak ada pemilih peran dan tidak ada login.
- Peran lain di masa depan:
  - Ditjenbun ("Direktorat"): pembeli dan pembaca dasbor;
  - pemulia: pengguna modul AI;
  - operator lab.
- Multi-peran masuk Fase 4 di `../ROADMAP.md` dan butuh login (Fase 3).
- Dasbor **tidak** dibingkai "program peremajaan" pemerintah. Judulnya "Dasbor verifikasi", dengan kartu "Perjalanan sampel".

### Peran AI dalam alur verifikasi

- **Vonis identitas adalah statistik, bukan ML:** likelihood + toleransi error lab, ambangnya di `apps/api/src/cacaoid/config.py`.
- **Skor risiko penyedia** adalah aturan terbuka + penghalusan Bayes, bukan AI.
- **Prediksi sifat tidak dipakai untuk klon yang dipesan.** Sifatnya sudah diketahui dari fakta uji lapang di registri. Kartu "Prediksi AI" di Registri sudah dihapus.
- **Prediksi hanya untuk:** semaian (modul pemulia) dan pohon TIDAK DIKENAL (uji refleks, asal-usul).
- **Batas klaim model:** `apps/api/tasks/VALIDASI_MODEL.md`.
  - Busuk buah hanya untuk ranking dalam satu silangan: −14% bila simpan 25% teratas, r 0,40. Tidak untuk membandingkan klon; fitur tersebut dicabut.
  - Komponen hasil: r 0,51–0,66 antar-klon, Spearman 0,8 pada 4 klon Indonesia.
  - Asal-usul: 78% benar, 6–8% yakin tapi salah.

### Isu terbuka: "inti harus ML" vs kenyataan

Target awal tim adalah inti produk berupa model ML terlatih. Kenyataannya, inti verifikasi (vonis identitas) adalah statistik, dan modul AI menjadi lini produk kedua untuk pemulia. **Belum diputuskan:**
- **(a) Terima.** Verifikasi menjadi inti dan sengaja tidak memakai ML karena harus bisa dipertanggungjawabkan. AI dijual ke pemulia.
- **(b) Cari tugas ML** yang benar-benar dibutuhkan di alur verifikasi. Ini perlu riset ulang dan berisiko terlihat dibuat-buat.

### Kode: monorepo baru

- Kode aktif ada di monorepo ini.
- `apps/api` disalin dari `cacaoid-app/backend`, beserta data, model, dan 74 test.
- `apps/web` adalah mockup v2 statis yang akan disambungkan modul demi modul (`../ROADMAP.md`).
- Aplikasi lama (`cacaoid-app`, port 8000/5173) diarsipkan di luar repo dan tidak dipakai lagi.
- **Port:** web 5174, api 8001. Port 8000/5173 tetap dipakai aplikasi lama.

### Cerita demo dan angka

- **Satu cerita:** SIM-065, pohon induk di KE Luwu Utara, label MCC 01, DNA Sulawesi 1.
- Di aplikasi: **24** dari 42 SNP beda (wajar ≤ 5). Angka 23 di riset lama adalah jarak antara dua sidik jari referensi; yang diucapkan di demo adalah 24, sesuai layar.
- **Dampak:** −25% potensi hasil (fakta uji lapang Susilo dkk. 2015, Luwu Utara). Bukan prediksi.
- **Sumber angka demo:** `apps/api` setelah `pnpm seed` (deterministik). Angka kunci:
  - 82,9% (107/129) sampel sesuai klaim;
  - LOT-H-07: 12/60 bibit kontaminan, 16% (7,3–28,5%), TAHAN;
  - skor risiko Kolaka 57 → 54 daun.
- Database aplikasi lama sempat menampilkan 12,4%. Itu hasil simulasi usang; jangan dikutip.

### Desain

- **Mockup v2 (gaya cokelat–mint):** file Pencil `soulsea/cacaoid.pen`, frame "v2 · …". PDF salinannya ada di `design/CacaoID-mockup-v2.pdf`.
- Token warna dan font di `apps/web/src/index.css`, aturannya di `apps/web/CLAUDE.md`.
- **Usulan desain yang belum ada di backend:**
  - kolom "Posisi pohon di kebun";
  - "Kirim tugas ke ponsel pengawas";
  - "Kirim rencana sampling".
- "Tandai pohon" sudah ada di backend sebagai tindakan `pemurnian`.

---

## Pekerjaan pitch yang belum dikerjakan

Butir ini pernah diusulkan tetapi belum disetujui atau dikerjakan:
- Perbarui `produk/Overview-Produk-CacaoID.md` §0, §2.2, §7, §9, §10, §11.2, §12. Angka biaya §7 salah.
- Slide 17 (analisis kompetitor): baris CacaoID masih hijau semua, belum ada kritik yang jujur.
- Slide 18 (data): ±600 → 1.262/589 SNP, M01–M07, tambahkan Jacquotte dan sumber sifat, ±300 → 100 pohon + 5 lot.
- Teks "QR pohon" di deck (slide 10, 14, UI 0, F02). QR per pohon belum dipakai di lapangan. Gantinya: kode kantong sampel + posisi pohon.
- Judul kartu "Semaian tahan busuk buah" yang lebih awam.
- Pertanyaan untuk mentor MBA ke `produk/Kit-Wawancara-CacaoID.md` (dibuat umum, tidak khusus kakao).
