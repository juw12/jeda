# Panduan konten & peninjauan

## Prinsip
1. Jeda bukan otoritas agama. Setiap pernyataan harus punya sumber.
2. Perbedaan aliran/daerah ditulis di `variations`, berdampingan, tanpa menilai.
3. Tidak ada konten keagamaan baru dari AI yang terbit tanpa peninjauan manusia dari agama tersebut.
4. Tulis "mengapa" untuk setiap langkah; banyak tradisi hilang karena alasannya tidak diwariskan.

## Bentuk entri (`content/entries/<agama>.json`)
```json
{
  "id": "khc-hariraya-cengbeng",
  "faith": "khonghucu",
  "streams": ["tridharma"],
  "section": "hari-raya",
  "title": "...",
  "summary": "satu kalimat",
  "body": ["paragraf", "paragraf"],
  "steps": [{ "text": "langkah", "why": "alasan" }],
  "items": ["perlengkapan"],
  "timing": "kapan",
  "variations": [{ "label": "Hokkien", "text": "...", "stream": "hokkien" }],
  "links": [{ "name": "...", "url": "...", "note": "..." }],
  "tags": ["kata kunci untuk pencarian"],
  "sources": [{ "title": "Buku/kitab/lembaga", "detail": "bab/ayat/halaman" }],
  "status": "draft | in_review | approved",
  "reviewed_by": "Nama, peran, lembaga",
  "reviewed_at": "YYYY-MM-DD",
  "version": 1,
  "updated": "YYYY-MM-DD"
}
```
`section` salah satu dari: `pokok-ajaran`, `kitab-suci`, `ibadah-harian`, `hari-raya`, `siklus-hidup`, `aturan-etika`, `perbedaan-aliran`, `sejarah-tokoh`.
`streams` kosong = berlaku untuk semua aliran. ID aliran dan dialek ada di `content/faiths.json`.

## Alur tinjauan
1. Koreksi masuk sebagai GitHub issue (tombol *Laporkan koreksi* di aplikasi).
2. Reviewer atau pengelola mengubah file JSON lewat pull request.
3. Validasi otomatis berjalan; reviewer menyetujui; status diubah ke `approved`.
4. Naikkan `version` dan `updated` setiap perubahan isi.

## Syair ciam si
Isi `content/ciamsi.json` → `sets.<id>.poems["1"] = { "hanzi": "...", "hokkien": "...", "id": "terjemahan" }`, beserta `source` (nama klenteng & izin).
