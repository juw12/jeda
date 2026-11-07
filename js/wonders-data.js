// "7 Keajaiban Iman Nusantara": one landmark per tradition you can travel to in 3D (see world/wonders.js).
// Facts are kept to well-documented ones (UNESCO, official site descriptions); etiquette is what
// visitors are asked to follow on site. Report corrections through the Koreksi issue form.

export const WONDERS = [
  {
    id: 'borobudur',
    name: 'Candi Borobudur',
    faith: 'buddha',
    icon: '🛕',
    color: '#8d877a',
    region: 'Magelang, Jawa Tengah',
    built: 'Abad ke-8–9, masa Wangsa Syailendra',
    blurb: 'Monumen Buddha terbesar di dunia: sebuah gunung batu yang dibaca sambil berjalan, dari relief kehidupan sehari-hari sampai stupa induk yang hening di puncak.',
    facts: [
      'Situs Warisan Dunia UNESCO sejak 1991.',
      'Tersusun dari 6 teras bujur sangkar dan 3 teras melingkar, dimahkotai satu stupa induk.',
      'Ada 72 stupa berlubang di teras melingkar, sekitar 2.672 panel relief, dan 504 arca Buddha.',
      'Setiap Waisak, umat Buddha berprosesi dari Candi Mendut ke Borobudur lalu ber-pradaksina (mengelilingi searah jarum jam).',
    ],
    etiquette: [
      'Jangan memanjat atau duduk di stupa dan arca.',
      'Kelilingi candi searah jarum jam (pradaksina).',
      'Naik ke struktur candi kini memakai kuota dan sandal khusus (upanat) untuk melindungi batu.',
    ],
    entry: 'bud-hariraya-waisak',
  },
  {
    id: 'prambanan',
    name: 'Candi Prambanan',
    faith: 'hindu',
    icon: '🛕',
    color: '#9a8f80',
    region: 'Sleman, DI Yogyakarta',
    built: 'Sekitar 850 M, masa Mataram Kuno',
    blurb: 'Kompleks candi Hindu terbesar di Indonesia, dengan tiga candi utama untuk Trimurti yang menjulang ramping seperti lidah api.',
    facts: [
      'Situs Warisan Dunia UNESCO sejak 1991.',
      'Candi utama dipersembahkan kepada Trimurti: Siwa di tengah (sekitar 47 m), diapit Brahma dan Wisnu.',
      'Relief kisah Ramayana terpahat di pagar langkan candi Siwa dan Brahma.',
      'Umat Hindu menggelar upacara besar di sini, misalnya Tawur Agung Kesanga menjelang Nyepi.',
    ],
    etiquette: [
      'Berpakaian sopan; saat upacara biasanya diminta memakai kain dan selendang.',
      'Jangan menyentuh, menduduki, atau memanjat arca dan relief.',
      'Saat ada persembahyangan, beri ruang dan jangan memotret dari jarak dekat.',
    ],
    entry: 'hin-sejarah-prambanan',
  },
  {
    id: 'istiqlal',
    name: 'Masjid Istiqlal',
    faith: 'islam',
    icon: '🕌',
    color: '#d9dde0',
    region: 'Jakarta Pusat',
    built: 'Dibangun 1961–1978, diresmikan 22 Februari 1978',
    blurb: 'Masjid terbesar di Asia Tenggara. Namanya berarti “kemerdekaan”, dan ia berdiri berhadapan dengan Gereja Katedral sebagai simbol kerukunan.',
    facts: [
      'Dirancang oleh Friedrich Silaban, arsitek beragama Kristen Protestan, pemenang sayembara desain.',
      'Kubah utama berdiameter 45 m (melambangkan tahun 1945); menaranya setinggi 66,66 m.',
      'Terhubung dengan Gereja Katedral Jakarta lewat Terowongan Silaturahmi (dibangun 2020–2021).',
      'Mampu menampung sekitar 200 ribu jemaah.',
    ],
    etiquette: [
      'Berpakaian sopan dan menutup aurat; pengunjung perempuan dapat meminjam kerudung.',
      'Lepas alas kaki di area yang ditentukan.',
      'Tamu non-Muslim dipersilakan berkeliling bersama pemandu; jangan melintas di depan orang yang sedang salat.',
    ],
    entry: 'isl-aturan-adab-masjid',
    link: { to: 'katedral', label: 'Terowongan Silaturahmi → Katedral' },
  },
  {
    id: 'katedral',
    name: 'Gereja Katedral Jakarta',
    faith: 'katolik',
    icon: '⛪',
    color: '#e8e4dc',
    region: 'Jakarta Pusat',
    built: 'Diberkati tahun 1901, gaya neo-Gotik',
    blurb: 'Nama resminya Gereja Santa Maria Pelindung Diangkat ke Surga: menara-menara runcing neo-Gotik tepat di seberang Masjid Istiqlal.',
    facts: [
      'Dirancang Antonius Dijkmans dan diselesaikan oleh Marius J. Hulswit; diberkati pada 1901.',
      'Dua menara depan setinggi sekitar 60 m bernama Menara Benteng Daud dan Menara Gading; menara tengah bernama Angelus Dei.',
      'Di balkon atas terdapat Museum Katedral yang menyimpan benda-benda sejarah Gereja di Indonesia.',
      'Saat Natal dan Idulfitri, halaman Katedral dan Istiqlal saling dipakai untuk parkir jemaat.',
    ],
    etiquette: [
      'Saat Misa berlangsung, masuk dengan tenang dan jangan memakai lampu kilat.',
      'Berpakaian sopan, tidak terlalu terbuka.',
      'Komuni hanya untuk umat Katolik; tamu dipersilakan duduk dan mengikuti dengan hormat.',
    ],
    entry: 'kat-aturan-adab-gereja',
    link: { to: 'istiqlal', label: 'Terowongan Silaturahmi → Istiqlal' },
  },
  {
    id: 'blenduk',
    name: 'Gereja Blenduk',
    faith: 'protestan',
    icon: '⛪',
    color: '#b8743e',
    region: 'Kota Lama, Semarang, Jawa Tengah',
    built: 'Dibangun 1753, dirombak 1894',
    blurb: 'Gereja Protestan tertua di Jawa Tengah yang masih dipakai beribadah, kini GPIB Immanuel Semarang, terkenal dengan kubahnya yang “mblenduk”.',
    facts: [
      'Nama “Blenduk” berasal dari kata Jawa mblenduk: menggembung, karena kubah besarnya.',
      'Berdenah segi delapan dengan dua menara di bagian depan.',
      'Bentuknya sekarang adalah hasil perombakan tahun 1894 oleh H.P.A. de Wilde dan W. Westmaas.',
      'Menjadi ikon kawasan Kota Lama Semarang dan masih dipakai untuk ibadah Minggu.',
    ],
    etiquette: [
      'Jika hanya ingin melihat-lihat, datanglah di luar jam ibadah.',
      'Berpakaian rapi dan jaga ketenangan di dalam ruang ibadah.',
      'Persembahan (kolekte) bersifat sukarela.',
    ],
    entry: 'pro-ibadah-minggu',
  },
  {
    id: 'sampookong',
    name: 'Klenteng Sam Poo Kong',
    faith: 'khonghucu',
    icon: '🏮',
    color: '#b8322b',
    region: 'Simongan, Semarang, Jawa Tengah',
    built: 'Bermula dari gua persinggahan Laksamana Cheng Ho, awal abad ke-15',
    blurb: 'Klenteng merah megah yang mengenang Laksamana Cheng Ho. Didatangi umat Tridharma, juga peziarah Muslim: satu tempat, banyak cara menghormati.',
    facts: [
      'Mengenang Laksamana Cheng Ho (Zheng He), penjelajah Muslim dari Tiongkok yang singgah di Semarang pada awal abad ke-15.',
      'Dihormati umat Tridharma (Khonghucu, Tao, Buddha) dan dikunjungi peziarah Muslim.',
      'Bangunan merah beratap susun khas Tionghoa, dengan patung perunggu Cheng Ho yang besar di halaman.',
      'Setiap tahun ada kirab budaya untuk memperingati kedatangan Cheng Ho.',
    ],
    etiquette: [
      'Pegang hio dengan dua tangan dan tancapkan dengan tenang; ikuti arahan pengurus.',
      'Ruang sembahyang utama diutamakan bagi yang bersembahyang; pengunjung melihat dari area yang disediakan.',
      'Jangan memotret orang yang sedang bersembahyang tanpa izin.',
    ],
    entry: 'khc-sejarah-klenteng-tua',
  },
  {
    id: 'waerebo',
    name: 'Kampung Adat Wae Rebo',
    faith: 'alam',
    icon: '⛰',
    color: '#6b5a3c',
    region: 'Manggarai, Flores, Nusa Tenggara Timur',
    built: 'Kampung leluhur Manggarai dengan rumah kerucut Mbaru Niang',
    blurb: 'Desa di balik kabut pegunungan Flores, tempat tujuh rumah kerucut berdiri melingkar dan hidup berjalan selaras dengan hutan, kopi, dan leluhur.',
    facts: [
      'Terletak di ketinggian sekitar 1.100–1.200 m, dikelilingi hutan dan pegunungan.',
      'Tujuh rumah kerucut Mbaru Niang, masing-masing berlantai lima, beratap ijuk.',
      'Meraih UNESCO Asia-Pacific Award for Cultural Heritage Conservation (Award of Excellence) tahun 2012.',
      'Warga menanam kopi dan menenun kain songke khas Manggarai.',
    ],
    etiquette: [
      'Tamu disambut dulu dengan upacara Waelu’u di rumah utama (Mbaru Gendang) sebelum berkeliling.',
      'Minta izin sebelum memotret warga.',
      'Bawa pulang sampahmu; jaga hutan dan mata air.',
    ],
    entry: null,
  },
];

export const TRIP_COST = 15;

export function wonderById(id) {
  return WONDERS.find((wonder) => wonder.id === id) || null;
}
