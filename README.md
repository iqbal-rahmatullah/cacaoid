# CacaoID

Verifikasi genetik bibit dan pohon induk kakao. Daun diambil di kebun, diuji panel 48 SNP di lab
terakreditasi mana pun, lalu sidik jarinya dicocokkan dengan registri klon untuk memberi vonis
(COCOK, OFF-TYPE, BATANG BAWAH, dan lain-lain), ditambah modul AI untuk pemulia.

Prototipe untuk GenoHack 2026. Semua data demo adalah **DATA SIMULASI**. Data publik yang dipakai
tercantum di `apps/api/data/ATTRIBUTION.md`.

## Status

| Bagian | Kondisi |
|---|---|
| `apps/api` | Berjalan: engine vonis, QC lab, parentage, kontaminasi lot, AI, audit, 74 test |
| `apps/web` | Mockup v2 **statis** (11 layar). Disambungkan ke API modul demi modul, lihat `ROADMAP.md` |

## Prasyarat

- Node.js 20+ dan pnpm 9
- Python 3.12 dan [uv](https://docs.astral.sh/uv/)

## Menjalankan

```bash
pnpm install   # dependensi web
pnpm seed      # sekali: buat data simulasi + batch demo (dependensi Python dipasang otomatis oleh uv)
pnpm dev       # web http://localhost:5174, api http://localhost:8001
pnpm test      # test api (±2 menit)
pnpm build     # typecheck + build web
```

Reset data demo: hentikan `pnpm dev`, hapus `apps/api/cacaoid.db`, lalu `pnpm seed`.

## Struktur

```
apps/api        FastAPI + engine Python (vonis, QC, AI). Dokumen kerja engine: apps/api/tasks/
apps/web        React 19 + Vite + Tailwind 4 (mockup v2)
docs/           pengetahuan produk dan keputusan (lihat di bawah)
ROADMAP.md      urutan pengembangan fitur, Major/Minor per fase
```

## Baca dulu sebelum mengerjakan fitur

| Dokumen | Isi |
|---|---|
| `docs/KEPUTUSAN.md` | Keputusan produk, bisnis, dan teknis: posisi pendamping, satu peran, peran AI, isu terbuka, angka demo |
| `ROADMAP.md` | Apa yang dikerjakan berikutnya dan endpoint yang dipakai |
| `apps/web/CLAUDE.md` | Aturan UI: token desain, warna vonis, aturan isi agar tahan ditanya juri |
| `CLAUDE.md` | Aturan monorepo dan API (dipakai juga oleh Claude Code) |
| `apps/api/tasks/GAPS.md` | Kekurangan sistem yang sudah ditemukan, cara reproduksi, dan tambalannya |
| `apps/api/tasks/VALIDASI_MODEL.md` | Seberapa jauh tiap model AI boleh diklaim |
| `docs/produk/Riset-Perbaikan-Pitch-CacaoID.md` | Harga per sampel, roadmap 12 bulan, cerita demo, regulasi benih kakao, praktik di luar negeri |
| `docs/produk/Overview-Produk-CacaoID.md` | Gambaran produk lengkap (beberapa bagian usang, lihat peringatan di atasnya) |
| `docs/produk/Slide-Fitur-CacaoID.md` | Penjelasan tiap fitur sesuai deck |
| `docs/produk/Riset-Dataset-Terbuka-Kakao.md` | Dataset publik yang bisa dipakai |
| `docs/produk/riset-validasi-bisnis/` | Riset volume, kasus, dan harga |
| `docs/produk/Kit-Wawancara-CacaoID.md` | Panduan wawancara validasi pengguna |
| `docs/design/CacaoID-mockup-v2.pdf` | Mockup v2. File sumber Pencil: `cacaoid.pen` (di luar repo) |

## Aturan kerja tim

- Ambil butir dari `ROADMAP.md`. Kerjakan Fondasi Fase 1 dulu.
- Angka di UI berasal dari API (atau `apps/web/src/data/demo.ts` selama masih statis). Jangan mengetik angka sendiri.
- Ambang keputusan hanya diubah di `apps/api/src/cacaoid/config.py`, dan setiap perubahan disertai test.
- Kekurangan baru dicatat di `apps/api/tasks/GAPS.md`. Keputusan baru dicatat di `docs/KEPUTUSAN.md`.
- `pnpm test` harus lolos sebelum menggabungkan perubahan API.
