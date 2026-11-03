// Greetings per faith, each with its own spoken words and body gesture (no generic emoji).
// Sources: Kemenag "Mengenal Salam Khonghucu" (Wei De Dong Tian / Xian You Yi De, gesture soja:
// right hand in a fist covered by the left hand, thumbs together); Om Swastyastu with cakupang tangan;
// Namo Buddhaya with anjali; Berkah Dalem (Katolik), Syalom (Protestan), Assalamu'alaikum (Islam).
// Poses are animated on the avatar by js/world/engine.js.

export const GREETINGS = {
  khonghucu: [
    { id: 'khc-weide', label: 'Wei De Dong Tian', say: 'Wei De Dong Tian', pose: 'soja', note: 'Salam Khonghucu: "hanya kebajikan Tuhan berkenan". Sikap soja: tangan kanan mengepal, ditutup tangan kiri, kedua ibu jari bertemu.' },
    { id: 'khc-xianyou', label: 'Xian You Yi De', say: 'Xian You Yi De', pose: 'soja', note: 'Balasan salam: "sungguh, kita memiliki Kebajikan yang Esa".' },
    { id: 'khc-shanzai', label: 'Shanzai', say: 'Shanzai', pose: 'bow', note: 'Ucapan penutup doa: "sungguh baik, semoga demikian".' },
  ],
  buddha: [
    { id: 'bud-namo', label: 'Namo Buddhaya', say: 'Namo Buddhaya', pose: 'anjali', note: 'Salam umat Buddha: "terpujilah Buddha". Sikap anjali: kedua telapak tangan dirapatkan di depan dada.' },
    { id: 'bud-sadhu', label: 'Sadhu', say: 'Sadhu, sadhu, sadhu', pose: 'bow', note: 'Ungkapan "baik sekali" untuk menyetujui atau turut berbahagia atas kebajikan.' },
    { id: 'bud-sabbe', label: 'Semoga semua makhluk berbahagia', say: 'Sabbe satta bhavantu sukhitatta', pose: 'anjali', note: 'Harapan cinta kasih (metta) bagi semua makhluk.' },
  ],
  hindu: [
    { id: 'hin-swastyastu', label: 'Om Swastyastu', say: 'Om Swastyastu', pose: 'anjali', note: 'Salam umat Hindu: "semoga dalam keadaan baik atas karunia Hyang Widhi". Sikap cakupang tangan (panganjali) di depan dada.' },
    { id: 'hin-shanti', label: 'Om Shanti', say: 'Om Shanti Shanti Shanti Om', pose: 'anjali', note: 'Penutup: semoga damai di hati, di dunia, dan selamanya.' },
    { id: 'hin-suksma', label: 'Suksma', say: 'Suksma', pose: 'bow', note: '"Terima kasih" dalam bahasa Bali.' },
  ],
  islam: [
    { id: 'isl-salam', label: "Assalamu'alaikum", say: "Assalamu'alaikum", pose: 'chest', note: 'Salam umat Islam: "semoga keselamatan tercurah kepadamu".' },
    { id: 'isl-jawab', label: "Wa'alaikumussalam", say: "Wa'alaikumussalam", pose: 'chest', note: 'Jawaban salam: "dan semoga keselamatan juga untukmu".' },
    { id: 'isl-hamdalah', label: 'Alhamdulillah', say: 'Alhamdulillah', pose: 'open', note: '"Segala puji bagi Allah", ungkapan syukur.' },
    { id: 'isl-aamiin', label: 'Aamiin', say: 'Aamiin', pose: 'open', note: 'Ucapan setelah doa: "kabulkanlah".' },
  ],
  protestan: [
    { id: 'pro-syalom', label: 'Syalom', say: 'Syalom', pose: 'wave', note: 'Salam umat Kristen: "damai sejahtera".' },
    { id: 'pro-berkati', label: 'Tuhan memberkati', say: 'Tuhan memberkati', pose: 'open', note: 'Ucapan berkat bagi sesama.' },
    { id: 'pro-haleluya', label: 'Haleluya', say: 'Haleluya', pose: 'raise', note: '"Pujilah Tuhan".' },
    { id: 'pro-amin', label: 'Amin', say: 'Amin', pose: 'fold', note: 'Penutup doa: "sungguh, jadilah demikian".' },
  ],
  katolik: [
    { id: 'kat-berkah', label: 'Berkah Dalem', say: 'Berkah Dalem', pose: 'bow', note: 'Salam umat Katolik (Jawa): "Tuhan memberkati".' },
    { id: 'kat-damai', label: 'Damai Kristus', say: 'Damai Kristus', pose: 'open', note: 'Salam damai, seperti dalam Misa.' },
    { id: 'kat-salib', label: 'Tanda salib', say: 'Dalam nama Bapa, dan Putra, dan Roh Kudus', pose: 'cross', note: 'Tanda salib: dahi, dada, bahu kiri, bahu kanan.' },
    { id: 'kat-amin', label: 'Amin', say: 'Amin', pose: 'fold', note: 'Penutup doa.' },
  ],
  alam: [
    { id: 'alm-halo', label: 'Halo', say: 'Halo, damai untukmu', pose: 'wave', note: 'Sapaan ramah.' },
    { id: 'alm-terimakasih', label: 'Terima kasih', say: 'Terima kasih', pose: 'chest', note: 'Rasa terima kasih.' },
    { id: 'alm-napas', label: 'Tarik napas', say: 'Tarik napas bersama…', pose: 'raise', note: 'Ajak orang lain bernapas pelan bersama.' },
  ],
};

// Respectful, faith-neutral greetings for guests visiting another faith's space.
export const GUEST_GREETINGS = [
  { id: 'gst-hormat', label: 'Salam hormat', say: 'Salam hormat', pose: 'bow', note: 'Sebagai tamu, salam hormat yang netral.' },
  { id: 'gst-terimakasih', label: 'Terima kasih', say: 'Terima kasih sudah menerima saya', pose: 'chest', note: 'Ucapan terima kasih kepada tuan rumah.' },
  { id: 'gst-damai', label: 'Salam damai', say: 'Salam damai', pose: 'wave', note: 'Salam lintas iman.' },
];

const ALL = new Map();
Object.values(GREETINGS).flat().concat(GUEST_GREETINGS).forEach((g) => ALL.set(g.id, g));

export function greetingById(id) {
  return ALL.get(id) || null;
}

export function greetingsFor(faithId, mode) {
  return mode === 'visit' ? GUEST_GREETINGS : (GREETINGS[faithId] || GUEST_GREETINGS);
}
