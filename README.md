<!-- HERO:START -->
<p align="center">
  <a href="https://juw12.github.io/jeda/"><img src="docs/media/banner.jpg" alt="Jeda: A quiet space for every faith in Indonesia." width="100%"></a>
</p>

<p align="center">
  <b>A quiet space for every faith in Indonesia.</b><br>
  A virtual place of stillness and a living library of teachings, rituals and holy days. No account needed.
</p>

<p align="center">
  <a href="https://juw12.github.io/jeda/"><b>Try it live</b></a> ·
  <a href="#see-it-in-action">See it in action</a> ·
  <a href="#highlights">Highlights</a> ·
  <a href="https://github.com/juw12">More by juw12</a>
</p>

<p align="center">
  <a href="https://github.com/juw12/jeda"><img src="https://img.shields.io/github/last-commit/juw12/jeda?label=updated&color=a16207" alt="Last updated"></a>
  <a href="https://juw12.github.io/jeda/"><img src="https://img.shields.io/badge/demo-live-2ea44f" alt="Live demo"></a>
  <img src="https://img.shields.io/badge/Web_%28PWA%29-24292f" alt="Web (PWA)">
  <img src="https://img.shields.io/badge/Offline-24292f" alt="Offline">
</p>

<a id="highlights"></a>
<table>
  <tr>
    <td width="33%" valign="top">
      <b>Your own quiet space</b><br>
      Light incense or a candle in your space and visit others' spaces respectfully.
    </td>
    <td width="33%" valign="top">
      <b>A living library</b><br>
      Teachings and rituals per stream and dialect, reviewed in the open by verified clergy.
    </td>
    <td width="33%" valign="top">
      <b>Holy days and memorials</b><br>
      Imlek, Hijri and Pawukon calendars plus family memorial dates.
    </td>
  </tr>
</table>

## See it in action

<p align="center">
  <a href="https://juw12.github.io/jeda/"><img src="docs/media/demo.png" alt="Jeda screenshot" width="820"></a><br>
  <sub>Open the interactive demo at <a href="https://juw12.github.io/jeda/">juw12.github.io/jeda/</a></sub>
</p>
<!-- HERO:END -->

## About

Ruang hening virtual dan pustaka untuk setiap iman di Indonesia: Islam, Kristen Protestan, Katolik, Hindu, Buddha, dan Khonghucu & tradisi Tionghoa (flagship), plus Ruang Alam tanpa agama.

Terinspirasi oleh "Sansa" (산사), kuil virtual dari Korea. Dibuat oleh [juw12](https://github.com/juw12).

## Fitur

| Fitur | Isi |
|---|---|
| **Mulai** | Pertanyaan awal satu kartu per layar: suasana hati, jalan iman, aliran, dialek keluarga, nama tamu & warna jubah, sendiri atau bersama |
| **Ruang 3D** | 7 tempat 3D yang bisa dijelajahi (WebGL, three.js): jalan dengan ketuk/WASD atau chip "Pergi ke", lalu lakukan kegiatan di tempatnya — tancapkan hio, gantung lampion, bakar kim cua, nyalakan lilin/dupa, letakkan teratai, haturkan canang (warna Nawa Sanga), berwudu, bunyikan lonceng/genta, duduk berzikir 33×3, rosario, meditasi, napas. Jatuh kembali ke gambar 2D bila WebGL tidak ada |
| **Salam khas tiap iman** | Bukan emoji: avatar memperagakan sikapnya dan mengucapkan salamnya — soja + Wei De Dong Tian / Xian You Yi De / Shanzai, cakupang tangan + Om Swastyastu, anjali + Namo Buddhaya / Sadhu, Assalamu'alaikum + tangan di dada, Syalom / Haleluya, Berkah Dalem / tanda salib. Tamu memakai salam netral (Salam hormat, Terima kasih, Salam damai) |
| **Hadir bersama** | Opsional: lihat dan sapa pengunjung lain di ruang yang sama secara langsung (peer-to-peer WebRTC, sinyal lewat relay Nostr publik, tanpa server Jeda, tanpa akun). Gerak, kegiatan, dan salam tersinkron. Tamu dari iman lain hanya mengamati ritual ibadah |
| **Ruang Live** | Untuk siaran TikTok/IG/YouTube: ketuk **Siarkan** di ruang → dapat kode 7 huruf (mis. K7QX2MA), tautan, dan QR. Penonton membuka tautan atau `juw12.github.io/jeda` → **Gabung** → ketik kode, isi satu kartu, langsung masuk 3D. Pemandu terverifikasi (kode diturunkan dari SHA-256 rahasia di perangkat pemandu), bisa memulai **Hening 1 menit** serentak, **Ajak ke sini**, **Mode siaran** (kode + QR besar di layar), dan **Akhiri**. Penonton dibagi ke 6 kelompok koneksi agar kuat untuk banyak orang; pemandu terlihat oleh semua |
| **3D di hampir semua perangkat** | Kualitas otomatis (HP lama: tanpa bayangan, resolusi 1×), turun sendiri bila FPS < 28, jatuh ke WebGL1 bila perlu, pulih dari GPU context lost. Pengaturan → Kualitas 3D |
| **Ruang (alat)** | 7 ruang (Klenteng, Vihara, Pura, Masjid, Gereja, Gereja & Gua Maria, Ruang Alam) dengan ritual interaktif: hio, ciam si + poe, kim cua, meja abu leluhur, namaskara 108, mala, canang sari, Tri Sandhya, tasbih, jadwal sholat, rosario (peristiwa sesuai hari), Angelus, lilin doa, meditasi, napas, ambience sintetis |
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
js/views/onboarding.js                kartu pertanyaan awal (#/mulai)
js/world/engine.js                    mesin dunia 3D (kamera, avatar, efek, partikel)
js/world/places.js                    model low-poly 7 tempat + titik kegiatan
js/world/presence.js                  hadir bersama (Trystero/Nostr, peer-to-peer, multi-room shard)
js/world/greetings.js                 salam & sikap tubuh per iman
js/world/live.js                      kode Ruang Live, verifikasi pemandu, shard, QR
js/views/live.js                      #/live/<kode> dan #/gabung
vendor/                               three.js r160 & Trystero (MIT), disimpan lokal agar jalan offline
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

## License

Released under the [MIT License](LICENSE) © 2026 Juwen Lie. Contributions are welcome under the same license; see the [contributing guide](https://github.com/juw12/.github/blob/main/CONTRIBUTING.md) and [Code of Conduct](https://github.com/juw12/.github/blob/main/CODE_OF_CONDUCT.md).
