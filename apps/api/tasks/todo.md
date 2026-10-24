# CacaoID MVP: daftar tugas

Rencana lengkap ada di `tasks/plan.md`. Centang tugas setelah kriteria terima (✅) terpenuhi.

## Fase 0: Fondasi
- [x] **T0** Selamatkan aset & kerangka proyek. ✅ `uv run pytest` smoke lolos, `pnpm dev` menampilkan shell, data ada di repo.

## Fase 1: Jalur inti verifikasi
- [x] **T1** Parser genotipe (HapMap, CSV KASP, Tabel 4 Kolombia) + QC. ✅ Test 3 format lolos, call rate rendah = UJI ULANG.
- [x] **T2** Registri klon dari Bekele + entri "menunggu referensi" + halaman Registri. ✅ ±566 genotipe unik, replikat tak konsisten ditandai.
- [x] **T3** Engine identitas & vonis + penjelasan JSON. ✅ Simulasi 15% off-type: recall ≥99%, presisi ≥98%.
- [x] **T4** Generator data simulasi (lapangan, lab, kunci jawaban). ✅ Satu perintah menghasilkan 3 file dengan seed tetap.
- [x] **T5** UI Unggah → Hasil batch → Detail sampel. ✅ Vonis di UI cocok dengan kunci jawaban.
- [x] 🔶 **Checkpoint A**: demo inti jalan, benchmark Kolombia ≥95% plot paper ditemukan ulang. Review bersama.

## Fase 2: Verifikasi lanjutan & lapangan
- [x] **T6** Parentage: BATANG BAWAH & asal biji. ✅ Anak ICS60 × SCA6 terdeteksi, pohon acak tidak.
- [x] **T7** Kontaminasi lot + kalkulator sampling. ✅ Meleset ±3 poin pada panel 48 SNP.
- [x] **T8** Halaman lapangan web responsif + manifest CSV. ✅ Sampel tersimpan di 390px.
- [x] **T9** Jejak audit (rantai hash) + berita acara cetak. ✅ Event diubah = verifikasi gagal.
- [x] 🔶 **Checkpoint B**: alur pengawas lengkap.

## Fase 3: AI & dasbor
- [x] **T10** AI prediksi komponen hasil. ✅ Prediksi tampil, model dimuat dari file.
- [x] **T11** AI asal-usul (kelompok Motamayor) + parentage. ✅ Tidak ada "Trinitario" sebagai kelompok.
- [x] **T12** Skor risiko penyedia (beta, aturan dasar). ✅ Riwayat buruk = skor & sampel lebih tinggi.
- [x] **T13** Dasbor program. ✅ Angka = agregasi DB.
- [x] 🔶 **Checkpoint C**: semua menu berfungsi.

## Fase 4: Berburu & menambal kekurangan
- [x] **T14** Uji skenario sulit → `tasks/GAPS.md`.
- [x] **T15** Tambal kekurangan prioritas + test regresi.
- [x] 🔶 **Checkpoint akhir**: naskah demo 2 menit tanpa error.
