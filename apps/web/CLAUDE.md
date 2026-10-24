# CacaoID Web: mockup statis (v2)

Frontend baru CacaoID untuk GenoHack 2026 (ITB, Track 2 Food Security & Biodiversity Genomics).
Bagian dari monorepo (lihat `../../CLAUDE.md`). Saat ini **statis**: semua data hardcoded di
`src/data/demo.ts`. Tiap modul nanti disambungkan ke `../api` (FastAPI, port 8001; proxy `/api` sudah
diatur di `vite.config.ts`).

## Produk dalam satu paragraf

CacaoID memverifikasi identitas genetik bibit dan pohon induk kakao. Daun diambil di kebun, diuji
panel 48 SNP di **lab terakreditasi mana pun**, lalu CacaoID mencocokkan sidik jarinya dengan registri
klon dan memberi vonis. Posisi bisnis: **pendamping verifikasi**. Lab hanyalah pemasok uji. CacaoID
memegang alur sampling, QC data lab, vonis, registri, dan laporan.

Jangan bingkai produk sebagai program pemerintah (mis. "program peremajaan"), dan jangan tulis
"kami butuh mitra lab". Tulis "lab mana pun bisa dipakai".

## Pengguna

Untuk sekarang **satu peran: Pengawas benih** (UPTD BPSBP). Semua menu terbuka untuknya, tanpa
pemilih peran dan tanpa login. Pembedaan peran (Ditjenbun, pemulia) masuk roadmap; jangan dibangun
sebelum diminta.

## Menjalankan

```bash
pnpm dev     # dari root monorepo: web :5174 + api :8001. Dari apps/web: web saja
pnpm build   # tsc --noEmit + vite build
```

Server aplikasi lama jangan dimatikan: backend `:8000` dan frontend `:5173`.

## Stack & struktur

React 19 + Vite 6 + TypeScript + Tailwind CSS 4 + react-router 7 + lucide-react + react-top-loading-bar.
Stack sengaja sama dengan `cacaoid-app/frontend` agar logika modul mudah dipindahkan.

```
src/
  main.tsx              router + loading bar (Root memicu bar di setiap pergantian route)
  index.css             token desain (@theme) + animasi page-in / scan-line
  data/demo.ts          SATU-SATUNYA sumber angka demo
  components/ui.tsx     VERDICT, TONE, Card, Dark, TopBar, VerdictPill, Meter, Fingerprint, ...
  components/AppLayout  sidebar web (desktop) + nav horizontal (< lg)
  components/PhoneLayout  tampilan ponsel /m/* (bingkai ponsel di layar ≥ md)
  pages/                Dasbor, Unggah, Hasil, Sampel (/hasil/:id), Registri, Penyedia, Ai, Laporan
  pages/m/              Beranda, Ambil, Vonis (aplikasi lapangan = web app yang sama di ponsel)
```

- Satu halaman = satu file di `pages/`. Komponen dipakai ulang baru dipindah ke `ui.tsx` bila
  dipakai ≥ 2 halaman.
- Loading bar: `LoadingBarContainer` di `main.tsx`; `Root` memanggil `start()`/`complete()` saat
  `pathname` berubah. Saat modul mulai fetch API, selesaikan bar ketika data tiba
  (mis. `useIsFetching() === 0`), bukan dengan timer.
- Transisi halaman: wrapper `key={pathname}` + kelas `.page-in`. Hormati `prefers-reduced-motion`.

## Desain (sumber: `soulsea/cacaoid.pen`, frame "v2 · …"; ekspor di `soulsea/cacaoid-mockup-export/v2/`)

- Palet "cokelat–mint": `choc` #1C110C (sidebar & kartu hero), `cream` #F6F0E8 (latar), `mint`
  #3DDC97 (aksen; teks di latar terang pakai `mint-deep`), `pod` #FF8A3D (peringatan/oranye buah),
  **`bean` #7B4DFF khusus fitur AI**. Token lengkap di `src/index.css`.
- Font: Bricolage Grotesque (`font-display`, judul & angka besar), Plus Jakarta Sans (isi),
  JetBrains Mono (`font-mono`, ID sampel/lot/file).
- Warna vonis dari `VERDICT` di `ui.tsx`; jangan menulis warna vonis sendiri di halaman.
  COCOK hijau, SESUAI SILANGAN mint, KONTAMINAN/TAHAN oranye, OFF-TYPE merah, BATANG BAWAH kuning,
  TIDAK DIKENAL ungu (memicu uji AI), BELUM ADA REFERENSI biru, UJI ULANG taupe.
- Kartu putih radius 22, border `line`, tanpa bayangan berat. Kartu hero gelap (`Dark`) dengan
  glow radial; satu kartu dominan per layar.
- Setiap layar menampilkan lencana **DATA SIMULASI** (sidebar web, `SimBadge` di ponsel).
- Bahasa UI Indonesia. Angka format Indonesia: koma desimal, titik ribuan (`84,5%`, `3.672`).

## Aturan isi (agar tahan tanya juri)

- Angka di `demo.ts` berasal dari `apps/api` setelah `pnpm seed` (24 Okt 2026). Ubah di sana saja,
  jangan mengetik angka langsung di halaman, kecuali teks naratif yang memang khusus satu halaman.
- Cerita demo: **SIM-065**, pohon induk di KE Luwu Utara, label **MCC 01**, DNA **Sulawesi 1**,
  24 dari 42 SNP beda (wajar ≤ 5), dampak −25% hasil (fakta uji lapang Susilo dkk. 2015).
  Aplikasi lama `cacaoid-app` masih menulis Sulawesi 2; yang benar adalah `apps/api`.
- Angka kunci: 135 sampel, 107/129 sesuai klaim (82,9%), 22 bermasalah, 28 perlu tindak lanjut.
  LOT-H-07: 12/60 bibit kontaminan, 16% (7,3–28,5%), TAHAN. Skor risiko Kolaka 57 → 54 daun.
- Vonis identitas = statistik (likelihood + toleransi error lab), **bukan ML**.
- Skor risiko penyedia = aturan terbuka + penghalusan Bayes, **bukan AI**.
- Klon terdaftar memakai **fakta uji lapang**, bukan prediksi model. Prediksi komponen hasil hanya
  untuk semaian/pohon yang belum punya data lapang.
- Model busuk buah hanya untuk **ranking dalam satu silangan** (−14% bila simpan 25% teratas,
  r 0,40); tidak untuk membandingkan klon.
- Komponen hasil: r 0,51–0,66 antar-klon, bukan hasil panen per hektare.
  Asal-usul: 78% benar, 6–8% yakin tapi salah.
- Asal biji (tetua) = uji Mendel, bukan AI. Tulis sumber di setiap angka AI.
- Jangan klaim format lab tertentu (Intertek, LGC, dll.) atau mitra yang belum ada.

## Belum ada di aplikasi lama (usulan desain di mockup)

Kolom "Posisi pohon di kebun" (Ambil sampel), "Kirim tugas ke ponsel pengawas" (Hasil),
"Kirim rencana sampling" (Penyedia). Sebut sebagai usulan bila ditanya.
Tombol "Tandai pohon" sudah ada di backend sebagai tindakan `pemurnian` (`POST …/action`).

## Roadmap

Urutan pengerjaan dan pembagian Major/Minor ada di `../../ROADMAP.md`. Saat menyambungkan modul ke API,
ikuti Fase 1 (fondasi dulu), lalu centang/perbarui butirnya di sana.
