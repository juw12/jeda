# Alur tinjauan & izin (untuk pengelola)

Semua berjalan terbuka di GitHub `juw12/jeda`, tanpa server. Bot: `.github/workflows/issue-bot.yml` + `scripts/issue-bot.mjs`.

## Reviewer
1. Calon reviewer mengisi formulir **Daftar sebagai reviewer** (dari menu Tentang / Tinjau di aplikasi).
2. Anda memverifikasi perannya (misalnya menghubungi lembaganya).
3. Beri label **`reviewer:terverifikasi`** pada issue itu → bot menambahkan ke `content/reviewers.json`, membalas, dan menutup issue.

## Tinjauan
1. Reviewer membuka **Tinjau Pustaka**, memilih namanya, menandai *Setujui* / *Perlu perbaikan* + catatan, lalu **Kirim ke GitHub**.
2. Bila issue dikirim dari akun GitHub reviewer yang terdaftar → bot langsung menerapkan: status `approved`, `reviewed_by`, `reviewed_at`, catatan disimpan, commit otomatis, situs ter-update.
3. Bila reviewer tidak punya akun GitHub: minta berkas ekspor, buka issue `[Tinjauan] ...` sendiri (atau beri label **`tinjauan:terapkan`**) → bot menerapkan atas konfirmasi Anda.
4. Aturan bot: reviewer harus terdaftar untuk agama entri itu, dan versi entri harus sama dengan versi yang ditinjau.

## Izin konten
1. Kirim permohonan dengan templat `docs/SURAT_IZIN.md`; ubah status di `content/permissions.json` menjadi `"diminta"`.
2. Pemegang hak mengisi formulir **Beri izin konten** (atau Anda mengisinya dengan melampirkan surat balasan).
3. Setelah memastikan keasliannya, beri label **`izin:diterima`** → bot mencatat `diizinkan` + bukti (tautan issue).
4. Tambahkan berkas teks (`dataFile` di `content/scriptures.json`); pembaca di dalam aplikasi otomatis aktif hanya untuk konten berstatus `diizinkan` atau `domain-publik`.

## Kapan menyembunyikan draf
Setelah entri inti tiap agama berstatus `approved`, ubah `showDrafts: false` di `js/config.js`.
