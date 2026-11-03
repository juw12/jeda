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
| **Privasi** | Tanpa akun, tanpa iklan, tanpa pelacak. Pilihan agama hanya di perangkat (UU PDP) |

## Menjalankan di komputer (tanpa instal apa pun)

```
powershell -ExecutionPolicy Bypass -File E:\jeda\serve.ps1
```
Browser akan terbuka di http://localhost:8080.

## Menerbitkan gratis (GitHub Pages)

1. Buat repo baru `jeda` di akun GitHub `juw12`.
2. Unggah seluruh isi folder ini (atau `git push`).
3. Repo → Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
4. Situs aktif di `https://juw12.github.io/jeda/`.

Tidak perlu build. Setiap push otomatis memvalidasi konten (`.github/workflows/validate.yml`).

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
worker/tanya-worker.js                Cloudflare Worker opsional untuk mode AI
scripts/validate.mjs                  validasi konten
```

## Mengaktifkan mode AI (opsional, bisa gratis)

1. Buat akun Cloudflare (gratis) → Workers → Create → tempel `worker/tanya-worker.js`.
2. Isi variabel: `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `ALLOWED_ORIGIN`. Penyedia dengan kuota gratis antara lain Google Gemini dan Groq (keduanya menyediakan endpoint kompatibel OpenAI).
3. Isi `tanyaEndpoint` di `js/config.js` dengan URL worker.

Tanpa langkah ini, Tanya Jeda tetap berjalan dalam mode gratis (mengutip Pustaka).

Lihat juga `CONTENT_GUIDE.md` dan `LAUNCH_CHECKLIST.md`.
