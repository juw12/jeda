# Checklist sebelum peluncuran publik

Jeda saat ini **mode pratinjau**: semua entri Pustaka berstatus *draf* (disusun dengan bantuan AI) dan ditampilkan dengan tanda.

Alur otomatis tinjauan & izin: lihat `docs/TINJAUAN_IZIN.md`. Templat surat: `docs/SURAT_IZIN.md`.

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

- [ ] Entri dialek Tionghoa (Hokkien, Hakka, Teochew, Kanton/Hainan, Peranakan/Cina Benteng) ditinjau tetua komunitas masing-masing.
- [ ] Rangkaian hari Peringatan Arwah (`js/memorial.js`) dicek oleh reviewer tiap agama; cara hitung "hari wafat = hari ke-1" dikonfirmasi.
- [ ] Tanggal perkiraan Siwaratri, Magha Puja, Asadha 2027 di `content/calendar.json` dikonfirmasi PHDI dan majelis Buddha (ubah `estimated` menjadi `false` bila resmi).
- [ ] Tambahkan tanggal resmi tahun berikutnya (SKB 3 Menteri 2028) ke `content/calendar.json` begitu diumumkan.

## Disarankan
- [ ] Domain sendiri (mis. jeda.app / jeda.my.id; cek ketersediaan).
- [ ] Uji di Android kelas bawah dan iPhone; mode teks besar; pembaca layar.
- [ ] Uji tanggal kalender terhadap pengumuman resmi tahun berjalan.
- [ ] Tes Tanya Jeda dengan daftar pertanyaan sulit per agama bersama reviewer.
