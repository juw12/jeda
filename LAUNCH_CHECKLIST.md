# Checklist sebelum peluncuran publik

Hening saat ini **mode pratinjau**: semua entri Pustaka berstatus *draf* (disusun dengan bantuan AI) dan ditampilkan dengan tanda.

## Wajib
- [ ] Reviewer per agama/aliran terdaftar dan meninjau entri inti (minimal: ajaran pokok, ibadah harian, hari raya, siklus hidup).
- [ ] Entri yang sudah ditinjau diubah ke `"status": "approved"` dengan `reviewed_by` dan `reviewed_at`.
- [ ] Set `showDrafts: false` di `js/config.js` (hanya entri approved yang tampil).
- [ ] Syair ciam si: hanya diisi dari klenteng yang memberi izin tertulis.
- [ ] Teks kitab suci di dalam aplikasi hanya bila domain publik atau sudah berizin (LAI, Kemenag, KWI, MATAKIN, PHDI, dll.).
- [ ] Kebijakan privasi & syarat penggunaan (Bahasa Indonesia) di halaman Tentang.
- [ ] Pendaftaran PSE lingkup privat di Komdigi bila layanan menjangkau publik Indonesia.
- [ ] Tinjauan hukum ringan terkait pasal-pasal agama dalam KUHP (UU No. 1/2023) dan UU PDP.
- [ ] Rumah ibadah: info donasi hanya setelah verifikasi langsung dengan pengurus (validator menolak donasi tanpa `verified: true`).
- [ ] Tautan dukungan developer dibuat dan `active: true` di `js/config.js`.

## Disarankan
- [ ] Domain sendiri (mis. hening.id / hening.app; cek ketersediaan).
- [ ] Uji di Android kelas bawah dan iPhone; mode teks besar; pembaca layar.
- [ ] Uji tanggal kalender terhadap pengumuman resmi tahun berjalan.
- [ ] Tes Tanya Hening dengan daftar pertanyaan sulit per agama bersama reviewer.
