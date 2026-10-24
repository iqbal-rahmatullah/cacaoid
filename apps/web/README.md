# CacaoID Web

Frontend CacaoID: 8 halaman web dan 3 halaman ponsel untuk pengawas benih, gaya "cokelat–mint" sesuai
mockup v2. Saat ini masih **statis**. Datanya dari `src/data/demo.ts`, dan disambungkan ke `apps/api`
modul demi modul mengikuti [`../../ROADMAP.md`](../../ROADMAP.md).

## Menjalankan

```bash
pnpm dev     # dari root: web http://localhost:5174 + api :8001. Dari folder ini: web saja
pnpm build   # tsc --noEmit + vite build
```

Permintaan `/api` diteruskan ke `http://localhost:8001` (`vite.config.ts`).

## Halaman

| Route | Halaman |
|---|---|
| `/` | Dasbor verifikasi: tingkat sesuai klaim, perjalanan sampel, perlu tindakan |
| `/unggah` | Unggah hasil lab: langkah, peta plate per sumur, pemeriksaan otomatis |
| `/hasil` | Hasil verifikasi batch: tabel + filter vonis, lot hibrida, kualitas data lab |
| `/hasil/SIM-065` | Detail sampel: vonis, sidik jari 48 SNP, langkah vonis, dampak bagi petani |
| `/registri` | Registri klon: status referensi, detail klon, fakta uji lapang |
| `/penyedia` | Penyedia & kebun entres: skor risiko dan rencana sampling |
| `/ai` | Analitik AI untuk pemulia |
| `/laporan` | Berita acara, paspor bibit, ekspor, jejak audit |
| `/m`, `/m/ambil`, `/m/hasil/SIM-065` | Tampilan ponsel: beranda pengawas, ambil sampel, vonis |

Halaman `/m/*` adalah web app yang sama dibuka di ponsel (tanpa instal). Di layar lebar halaman ini
ditampilkan dalam bingkai ponsel.

## Struktur

```
src/main.tsx              router + loading bar saat pindah halaman (react-top-loading-bar)
src/index.css             token desain Tailwind (@theme): warna, font, animasi
src/data/demo.ts          satu-satunya sumber angka demo (dari apps/api setelah pnpm seed)
src/components/ui.tsx     komponen bersama: Card, Dark, TopBar, VerdictPill, Meter, Fingerprint, warna VERDICT
src/components/AppLayout.tsx    sidebar web
src/components/PhoneLayout.tsx  bingkai dan tab bar ponsel
src/pages/                satu file per halaman; src/pages/m/ untuk ponsel
```

## Menambah atau menyambungkan halaman

1. Buat file di `src/pages/` dan daftarkan route-nya di `src/main.tsx`.
2. Pakai komponen dari `ui.tsx`. Warna vonis selalu dari `VERDICT`, jangan ditulis manual.
3. Saat menyambungkan ke API, hapus blok data terkait dari `demo.ts` agar tidak ada dua sumber angka.
   Setelah ada fetch, buat loading bar selesai saat data tiba, bukan dengan timer.

Aturan desain dan aturan isi lengkap ada di [`CLAUDE.md`](CLAUDE.md). Contoh: label "bukan AI" untuk
skor risiko, dan fakta uji lapang (bukan prediksi) untuk klon terdaftar.
