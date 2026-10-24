# F6 Penasihat campuran klon & F7 Klon untuk lokasi ini: kelayakan

*23 Okt 2026. Keduanya sudah dibangun dan tampil di alur verifikasi: F6 di Hasil batch (kartu "Kebun entres menurut DNA") dan Registri → Penyedia; F7 di Detail sampel (kartu kesesuaian lokasi, bila ada GPS).*

## F6 · Penasihat campuran klon (penyerbukan)

**Masalah nyata:** sebagian besar klon kakao tidak bisa berbuah dari serbuk sarinya sendiri. Blok tanam yang isinya klon-klon yang saling tidak kompatibel akan berbunga tetapi jarang berbuah.

**Data (semua terverifikasi dari sumber):**

| Data | Isi | Lisensi |
|---|---|---|
| Lanaud dkk. 2017, J Exp Bot (Tabel S3, S7) | Profil 11 penanda SSR di lokus kompatibilitas CH1/CH4 untuk 72 klon dunia; 43 aturan dosis alel → peluang menyerbuk sendiri | CC BY |
| Farid dkk. 2021, SABRAO 53(1) | Diallel 6 klon Indonesia (MCC-01, Sulawesi-1, THR, MCC-02, AFQ/MHP-01, BB-01): **penyerbukan sendiri gagal di semua klon**; THR × MCC-02 × AFQ **0 persilangan berhasil** di antara mereka (diduga karena kekerabatan dekat) | open access |
| Malik 2016, skripsi UGM | MCC 02 cross-incompatible; Sulawesi 1/2, ICS 60, RCC 70/72, TSH 858 specific cross-compatible | abstrak publik |

**Yang dibangun:**
- `engine/compat.py`;
- `data/compat/*.csv`;
- `POST /api/ai/mix`, `GET /api/ai/mix/options`;
- UI tab;
- test `test_compat.py`.

**Cara kerja:** tiga jenis bukti ditampilkan berdampingan, tidak dilebur jadi satu skor buatan.
1. **Bukti uji persilangan** klon Indonesia, berupa jumlah berhasil/dicoba per arah persilangan.
2. **Prediksi DNA** peluang menyerbuk sendiri dari genotipe SSR. Per lokus (CH1, CH4) dipakai satu alel paling informatif supaya penanda yang terpaut tidak dihitung ganda; titik awalnya proporsi SC 0,40 di populasi Lanaud.
3. **Kemiripan genetik** dari sidik jari registri (IBS), dibandingkan dengan 1.500 pasangan acak registri. Pasangan identik atau ≥ persentil 95 diberi bendera risiko.

**Hasil pemeriksaan:**
- Prediksi DNA sesuai pengetahuan umum pemuliaan: Amelonado (Catongo, Matina), ICS1, dan CCN51 → bisa menyerbuk sendiri (0,79–0,99); Scavina dan kelompok Amazon Hulu → tidak bisa (0,00–0,23).
- Blok "MCC 02 + THR + AFQ/MHP-01" → 3 peringatan pasangan gagal + saran penyerbuk dari data uji. Blok "MCC 02 + BB-01 + Sulawesi 1" → tanpa peringatan.

**Batas kelayakan:**
- Belum ada profil SSR kompatibilitas untuk klon Indonesia. Prediksi DNA baru berlaku untuk klon dunia.
  - Jalan keluarnya murah: tambahkan 11 penanda SSR Lanaud ke uji lab. SSR adalah teknik standar di lab Indonesia (ICCRI, IPB).
  - Alternatif: membaca ulang lokus CH1/CH4 dari data genom F1 (sulit untuk SSR dengan read pendek; perlu dicoba).
- Bukti uji persilangan hanya 6–7 klon dan satu-dua lokasi, dengan tingkat keberhasilan rendah (maks. 11/150). Hasil itu relatif, bukan angka tanam.
- Kemiripan genetik → risiko inkompatibilitas adalah **indikator** yang masuk akal (alel S lebih mungkin sama pada kerabat; Farid 2021 menjelaskan kegagalan THR × MCC-02 × AFQ dengan cara ini), tetapi belum divalidasi.

**Kaitan genomik:** satu panel lab bisa sekaligus memverifikasi identitas klon (SNP) dan memeriksa kompatibilitas (SSR CH1/CH4). Registri sidik jari langsung memberi kemiripan antar-klon.

## F7 · Klon untuk lokasi ini (analog agroklimat)

**Yang dibangun:**
- `engine/agroclimate.py`;
- `data/agroclimate/trial_sites.csv` (10 lokasi uji);
- `power_cache.json`;
- `GET /api/ai/where?lat=&lon=`;
- UI tab;
- `test_agroclimate.py`.

**Cara kerja:**
1. Iklim lokasi kebun diambil dari NASA POWER (2001–2025; tanpa kunci; ±0,7 detik): hujan tahunan, bulan kering (<100 mm), suhu, kelembapan, elevasi grid.
2. Jarak terstandar dihitung ke 10 lokasi uji klon di Sulawesi dan Jember.
3. Ditampilkan 3 lokasi termirip beserta **fakta yang terukur di sana**, dari tabel F2 (526 fakta). Contoh: hasil per klon di Pinrang/Kolaka Utara, serangan VSD di Polman, busuk buah dan PBK di Kolaka.

**Hasil pemeriksaan:**

| Lokasi kebun | Hasil |
|---|---|
| Jeneponto (selatan kering) | Soppeng "sangat mirip", Polman "mirip" |
| Kebun 1.200 m di Luwu Utara | Semua lokasi "berbeda". Sistem tidak memaksakan analog yang keliru |

**Batas kelayakan:**
- **Resolusi NASA POWER ±0,5° (±55 km).** Luwu Utara dan Bone-Bone jatuh di sel yang sama, sehingga iklimnya identik. Untuk produksi, pakai WorldClim 1 km atau CHIRPS v3 (raster besar; unduhan dari sini lambat ±200–800 KB/s, jadi praproses di server).
- Koordinat lokasi uji masih perkiraan pusat kabupaten/kecamatan. Butuh koordinat kebun uji yang sebenarnya dari ACIAR/ICCRI.
- Data uji klon sedikit dan tidak seimbang. Ini **pencarian analog + bukti**, bukan model prediksi. Model G×E sejati butuh data pilot (hasil per klon per kebun dengan GPS, yang memang dikumpulkan CacaoID).
- Temuan penting dari data F2: **klon terbaik berbeda per lokasi.** Contohnya MCC 01 vs Sulawesi 1: +32% di Luwu Utara (tidak signifikan), −25% di Pinrang, +36% di Kolaka Utara. Ini membenarkan perlunya fitur ini.
