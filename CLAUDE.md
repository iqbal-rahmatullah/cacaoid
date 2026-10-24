# CacaoID monorepo

Verifikasi genetik bibit dan pohon induk kakao (GenoHack 2026, Track 2). Posisi produk: **pendamping
verifikasi**. Lab terakreditasi mana pun bisa dipakai; CacaoID memegang alur sampling, QC data lab,
vonis, registri, dan laporan.

```
apps/web    React 19 + Vite + Tailwind 4: mockup v2, tersambung ke API (kecuali Analitik AI). Aturan UI: apps/web/CLAUDE.md
apps/api    FastAPI + engine Python 3.12 (uv). Disalin dari ../cacaoid-app/backend pada 24 Okt 2026
docs/       KEPUTUSAN.md (keputusan produk/bisnis/teknis), produk/ (overview, harga, regulasi, riset), design/
ROADMAP.md  urutan pengembangan fitur, dibagi Major/Minor per fase
```

Sebelum mengubah perilaku produk, baca `docs/KEPUTUSAN.md`. Catat keputusan baru di sana, dengan
tanggal dan alasannya.

## Perintah (dari root)

```bash
pnpm install          # dependensi web; dependensi api dipasang uv saat pertama kali `uv run`
pnpm dev              # web http://localhost:5174 + api http://localhost:8001 (web meneruskan /api ke 8001)
pnpm test             # vitest web + pytest api (93 test api + 77 test web, ±2 menit)
pnpm seed             # tulis ulang data/simulasi lalu buat "Batch demo Sulawesi" bila database kosong
pnpm build            # typecheck + build web
```

Reset data demo: hentikan `pnpm dev`, hapus `apps/api/cacaoid.db`, lalu `pnpm seed`.

Aplikasi lama `../cacaoid-app` (api :8000, web :5173) tetap berjalan sebagai arsip. Jangan matikan
servernya, dan jangan mengubahnya dari sini.

## Aturan API

- Ambang keputusan hanya di `apps/api/src/cacaoid/config.py`. Perubahan ambang wajib disertai test.
- Kekurangan yang ditemukan dicatat di `apps/api/tasks/GAPS.md`. Setiap tambalan disertai test regresi.
- Batas klaim model AI ada di `apps/api/tasks/VALIDASI_MODEL.md`. UI dan pitch tidak boleh melebihinya.
- Data publik dan lisensinya ada di `apps/api/data/ATTRIBUTION.md`. Jangan menambah data tanpa lisensi yang jelas.
- Data demo adalah DATA SIMULASI dan deterministik (seed tetap). Cerita demo: SIM-065, label MCC 01,
  DNA Sulawesi 1 (24 dari 42 SNP beda).
- Peran masih dipilih sendiri lewat header `X-Role` (tanpa login). Untuk sekarang satu peran: Pengawas benih.

## Git

Commit hanya bila diminta; tim me-review perubahan dulu sebelum commit.
