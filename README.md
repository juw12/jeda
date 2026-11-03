# Jeda

Ruang hening virtual dan pustaka untuk setiap iman di Indonesia: Islam, Kristen Protestan, Katolik, Hindu, Buddha, dan Khonghucu & tradisi Tionghoa (flagship), plus Ruang Alam tanpa agama.

Terinspirasi oleh "Sansa" (산사), kuil virtual dari Korea. Dibuat oleh [juw12](https://github.com/juw12).

## Fitur

| Fitur | Isi |
|---|---|
| **Ruang** | 7 ruang (Klenteng, Vihara, Pura, Masjid, Gereja, Gereja & Gua Maria, Ruang Alam) dengan ritual interaktif: hio, ciam si + poe, kim cua, meja abu leluhur, namaskara 108, mala, canang sari, Tri Sandhya, tasbih, jadwal sholat, rosario (peristiwa sesuai hari), Angelus, lilin doa, meditasi, napas, ambience sintetis |
| **Kunjungi & Kenali** | Ruang iman lain dalam mode amati: ritual ditampilkan sebagai demonstrasi + etiket tamu |
| **Pustaka** | 8 bagian per agama (ajaran, kitab, ibadah harian, hari raya, siklus hidup, aturan, perbedaan aliran, sejarah), sumber, status tinjauan, variasi per aliran/dialek, laporan koreksi |
| **Tanya Jeda** | Jawaban hanya dari Pustaka dengan sitasi; mode gratis (pencarian di perangkat) atau mode AI opsional (Cloudflare Worker) |
| **Panduan Upacara** | Daftar persiapan yang bisa dicentang dan dicetak (Ceng Beng, Imlek, duka, Sangjit, Idulfitri, aqiqah, Waisak, Galungan, baptis, Natal) |
| **Kalender** | Imlek/Kongzili, Hijriah, Pawukon Bali, liturgi, titik matahari (Ceng Beng, Tang Ce) + tanggal resmi SKB 3 Menteri 2027 |
| **Rumah Ibadah** | Daftar tempat ibadah nyata; info donasi hanya untuk yang terverifikasi, langsung ke rumah ibadah |
| **Arsip Keluarga** | Catatan & rekaman suara tetua, tersimpan di perangkat, bisa diekspor |
| **Peringatan Arwah** | Hari ke-7/49/100 (adat Tionghoa), tahlilan 3/7/40/100/1000 & haul, misa arwah, ki-jit menurut tanggal Imlek/Hijriah/Masehi; simpan ke kalender HP |
| **Jurnal Syukur** | Catatan syukur pribadi tanpa target, hitungan, atau poin |
| **Kartu Ucapan** | Kartu hari raya (gambar) untuk teman berbeda iman, dibagikan lewat WhatsApp dll. |
| **Kamus Istilah** | ±100 istilah lintas agama dan dialek Tionghoa, terhubung ke Pustaka |
| **Ambil Jeda** | Jeda napas 1 menit dari mana saja |
| **Privasi** | Tanpa akun, tanpa iklan, tanpa pelacak. Pilihan agama hanya di perangkat (UU PDP) |

## Menjalankan di komputer (tanpa instal apa pun)

```
powershell -ExecutionPolicy Bypass -File E:\jeda\serve.ps1
```
Browser akan terbuka di http://localhost:8080.

## Menerbitkan gratis (GitHub Pages)

Satu perintah (GitHub CLI sudah login sebagai `juw12`):

```
powershell -ExecutionPolicy Bypass -File E:\jeda\publish.ps1
```

Skrip membuat repo publik `juw12/jeda`, mengunggah semua commit, dan mengaktifkan Pages. Situs aktif di `https://juw12.github.io/jeda/`. Untuk pembaruan berikutnya cukup `git push` (atau jalankan skrip lagi).

Manual: buat repo `jeda` → unggah isi folder → Settings → Pages → *Deploy from a branch*, `main`, `/ (root)`.

Tidak perlu build. Setiap push otomatis memvalidasi konten, tautan antar-data, dan daftar offline (`.github/workflows/validate.yml`).

**Sebelum promosi luas, baca `LAUNCH_CHECKLIST.md`** — semua isi Pustaka masih draf yang menunggu tinjauan pemuka agama.

## Struktur

```
index.html, css/style.css, js/        aplikasi (ES modules, tanpa build)
js/config.js                          nama aplikasi, tautan dukungan, mode draf, endpoint AI
content/faiths.json                   agama, aliran, dialek, konfigurasi ritual tiap ruang
content/entries/<agama>.json          entri Pustaka
content/ceremonies.json               Panduan Upacara
content/calendar.json                 tanggal resmi (override perhitungan)
content/places.json                   rumah ibadah
content/scriptures.json               info kitab suci + status lisensi
content/ciamsi.json                   syair ciam si (diisi dari klenteng yang mengizinkan)
content/glossary.json                 Kamus Istilah
js/memorial.js                        perhitungan Peringatan Arwah
js/card.js                            pembuat Kartu Ucapan
publish.ps1                           terbitkan ke GitHub Pages
worker/tanya-worker.js                Cloudflare Worker opsional untuk mode AI
scripts/validate.mjs                  validasi konten
```

## Mengaktifkan mode AI (opsional, bisa gratis)

1. Buat akun Cloudflare (gratis) → Workers → Create → tempel `worker/tanya-worker.js`.
2. Isi variabel: `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `ALLOWED_ORIGIN`. Penyedia dengan kuota gratis antara lain Google Gemini dan Groq (keduanya menyediakan endpoint kompatibel OpenAI).
3. Isi `tanyaEndpoint` di `js/config.js` dengan URL worker.

Tanpa langkah ini, Tanya Jeda tetap berjalan dalam mode gratis (mengutip Pustaka).

Lihat juga `CONTENT_GUIDE.md`, `LAUNCH_CHECKLIST.md`, dan `docs/TINJAUAN_IZIN.md` (alur reviewer, tinjauan, dan izin konten yang dijalankan bot GitHub).

## Catatan offline
Semua file `content/*.json` di-precache oleh `sw.js`. Jika menambah file konten baru, tambahkan juga ke daftar `SHELL` di `sw.js` dan naikkan `VERSION`.
