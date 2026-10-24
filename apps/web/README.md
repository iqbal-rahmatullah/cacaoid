# CacaoID Web

Frontend CacaoID: 8 halaman web, 5 halaman ponsel, dan 1 halaman publik, gaya "cokelat–mint" sesuai
mockup v2. **Semua halaman memakai API.** Aplikasi ponsel adalah PWA: bisa dipasang ke layar utama dan
tetap terbuka tanpa sinyal. Urutan pengembangan ada di [`../../ROADMAP.md`](../../ROADMAP.md).

## Menjalankan

```bash
pnpm dev     # dari root: web http://localhost:5174 + api :8001. Dari folder ini: web saja
pnpm build   # tsc --noEmit + vite build
pnpm test    # Vitest: klien API, antrean offline, aturan lapangan & tugas, helper hasil & laporan
```

Permintaan `/api` diteruskan ke `http://localhost:8001` (`vite.config.ts`).

## Halaman

| Route | Halaman |
|---|---|
| `/` | Dasbor verifikasi: tingkat sesuai klaim, perjalanan sampel, tingkat bermasalah, perlu tindakan (satu contoh per jenis) |
| `/unggah` | Unggah hasil lab: pilih batch, unggah CSV/xlsx, pemeriksaan otomatis, peta plate per sumur, manifest plate, jalankan verifikasi |
| `/hasil` | Hasil verifikasi batch: tabel + filter vonis + paginasi, spanduk plate tergeser/peringatan lab, lot hibrida, kualitas data lab, CSV hasil, GeoJSON EUDR. `?batch=<id>` memilih batch |
| `/hasil/:batchId/:sampleId` | Detail sampel: vonis, sidik jari SNP, langkah vonis, dampak bagi petani (fakta uji lapang), data lapangan, tindak lanjut (uji ulang → sampel ulang tertaut; tandai pohon → tutup kasus dengan tanggal + foto), dan untuk TIDAK DIKENAL: asal biji, latar genetik, hasil uji refleks |
| `/registri` | Registri klon: status referensi, cari, daftar berhalaman (klon valid di atas), detail + sidik jari + fakta uji lapang, tambah klon (sinonim ditolak). `?klon=<nama>` memilih klon |
| `/penyedia` | Penyedia & kebun entres: rencana sampling bulanan (progres per kebun), kirim tugas per kebun, daftar tugas lapangan, skor risiko, daftarkan penyedia, ubah klon kebun. `#kebun-<id>` menyorot satu kebun |
| `/ai` | Analitik AI untuk pemulia, tiga tab (`?tab=`): semaian & silangan (ranking busuk buah, semaian biji terbanyak), pohon tak dikenal (uji refleks), campuran klon & lokasi. Tanpa angka akurasi |
| `/laporan` | Berita acara dan rekap mitra (cetak / simpan PDF) dengan QR cek keaslian, paspor bibit + skrining EUDR + QR, ekspor, jejak audit |
| `/cek/:kode` | **Publik** (tanpa sidebar): hasil pindai QR, apakah dokumen asli dan datanya masih sama dengan saat dicetak |

Setiap halaman web punya pencarian ⌘K (sampel, klon, kebun) dan lonceng hasil lab baru di header.
| `/m` | Ponsel · Beranda: antrean offline, rencana/anjuran sampling, **Tugas hari ini**, hasil yang perlu perhatian |
| `/m/ambil` | Ponsel · Ambil sampel (`?tugas=<id>` mengisi kebun dari tugas; `?ulang=<id>&batch=<id>` membuat sampel ulang tertaut): batch, kebun, pindai label kantong (atau **Contoh QR (simulasi)** untuk demo tanpa kamera), klon dipilih dari registri lewat select yang bisa dicari (hanya klon siap verifikasi; klon kebun ini di atas), posisi pohon (blok, baris, nomor), GPS, checklist; tersimpan di perangkat bila tanpa sinyal |
| `/m/hasil`, `/m/hasil/:batchId/:sampleId` | Ponsel · Daftar hasil lab dan layar vonis + tindak lanjut (uji ulang, tandai pohon, tutup kasus dengan foto) |
| `/m/akun` | Ponsel · Akun (statis): profil petugas, status sinkron, prosedur ambil daun, arti vonis |

Halaman `/m/*` adalah web app yang sama dibuka di ponsel (tanpa instal). Di layar lebar halaman ini
ditampilkan dalam bingkai ponsel.

## Struktur

```
src/main.tsx              router + loading bar saat pindah halaman (react-top-loading-bar)
src/index.css             token desain Tailwind (@theme): warna, font, animasi
src/lib/api.ts            klien API (header X-Role, pesan error dari `detail`, unggah, unduh) + tipe respons
src/lib/queue.ts          antrean offline sampel (GAPS G-12)
src/lib/field.ts          aturan lapangan: checklist, cek klon (G-13), urutan hasil, judul vonis, posisi pohon,
                          tugas (progres + antrean, judul, tenggat, urutan), ID sampel ulang, tanggal lokal
src/lib/results.ts        format angka/tanggal Indonesia, pemeriksaan lab, peta plate, sidik jari, paginasi,
                          daftar tindak lanjut, rekap mitra, notifikasi
src/lib/use*.ts           hook: antrean + status online, batch aktif
src/lib/*.test.ts         test Vitest
src/components/ui.tsx     komponen bersama: Card, Dark, VerdictPill, Meter, Fingerprint, Loading/Problem/Empty,
                          SimBadge (ikut mode API), warna VERDICT
src/components/TopBar.tsx header web: pemilih batch, pencarian ⌘K, lonceng notifikasi, tombol aksi
src/components/FollowUp.tsx   status kasus tindak lanjut + form tutup kasus (web dan ponsel)
src/components/AiParts.tsx    bar asal-usul dan daftar komponen hasil (detail sampel dan Analitik AI)
src/components/ClonesInput.tsx  pilih beberapa klon registri (klon kebun, campuran klon)
public/sw.js, manifest.webmanifest, icon-*.png   PWA: service worker network-first + ikon
src/components/AppLayout.tsx    sidebar web
src/components/PhoneLayout.tsx  bingkai dan tab bar ponsel
src/pages/                satu file per halaman; src/pages/m/ untuk ponsel
```

## Menambah atau menyambungkan halaman

1. Buat file di `src/pages/` dan daftarkan route-nya di `src/main.tsx`.
2. Pakai komponen dari `ui.tsx` dan `TopBar.tsx`. Warna vonis selalu dari `VERDICT`, jangan ditulis manual.
3. Ambil data lewat TanStack Query (`get` dari `lib/api.ts`); loading bar otomatis selesai saat data tiba.
   Tampilkan `Loading`, `Empty`, atau `Problem` untuk keadaan memuat, kosong, dan gagal.
4. Logika yang bisa salah ditaruh di `lib/` sebagai fungsi murni dan diberi test Vitest.

Aturan desain dan aturan isi lengkap ada di [`CLAUDE.md`](CLAUDE.md). Contoh: label "bukan AI" untuk
skor risiko, dan fakta uji lapang (bukan prediksi) untuk klon terdaftar.
