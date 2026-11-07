// Small talk with the people in the world (offline, no AI needed): greetings, how are you, names,
// where they're from, family, weather, food tips, the place, festivals, thanks and goodbyes.
// Questions about faith are answered from the Pustaka (same search as Tanya Jeda) with a link to the entry.

import { CULTURE } from './cuisine.js';

function normalize(text) {
  return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}\s?]/gu, ' ');
}

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const INTENTS = [
  ['bye', /\b(dadah|sampai jumpa|pamit|bye|duluan|permisi dulu|sampai nanti)\b/],
  ['thanks', /\b(terima ?kasih|makasih|trims|thanks|thx|kamsia|xie ?xie|matur nuwun|suksma|mauliate|tengkyu)\b/],
  ['greet', /^\s*(halo|hallo|hai|hi|hey|pagi|siang|sore|malam|selamat (pagi|siang|sore|malam)|permisi|assalam\w*|salam|om swastyastu|namo buddhaya|syalom|shalom|horas|ni ?hao|kulonuwun|punten|sugeng)\b/],
  ['howareyou', /(apa kabar|gimana kabar|kabarnya|how are you|sehat\b|baik ?baik)/],
  ['name', /(siapa nama|namanya siapa|nama (kamu|anda|bapak|ibu|mu|kakak|om|tante)|kamu siapa|who are you|kenalan)/],
  ['origin', /((asal|dari) mana|asalnya|tinggal di ?mana|kampung(nya)?|orang mana)/],
  ['family', /(keluarga|anak|istri|suami|cucu|orang ?tua|menikah|nikah)/],
  ['work', /(kerja|pekerjaan|jualan|sudah lama|berapa lama|buka (jam|dari)|sibuk)/],
  ['hobby', /(hobi|suka (apa|ngapain)|kegiatan|waktu luang|senang (apa|ngapain))/],
  ['weather', /(panas|hujan|cuaca|gerah|dingin|cerah|adem|mendung)/],
  ['recommend', /(enak|rekomen|paling (laris|enak)|menu|makan apa|spesial|andalan|pesan apa|best)/],
  ['how', /(cara (masak|bikin|buat)|resep|masaknya|bikinnya|gimana (masak|bikin)|rahasia)/],
  ['halal', /(halal|babi|vegetarian|sayur saja|daging|pantang|ciak ?cai|vegan|alergi)/],
  ['price', /(harga|berapa|murah|mahal|bayar)/],
  ['compliment', /(mantap|lezat|sedap|enak banget|keren|bagus|cantik|ganteng|hebat|top)/],
  ['place', /(tempat ini|di sini|ini tempat apa|vihara|klenteng|masjid|gereja|pura|kedai|pujasera|kopitiam|warung|lapo|angkringan|rumah ini)/],
  ['festival', /(imlek|lebaran|idul|natal|paskah|waisak|galungan|nyepi|cap go|ramadan|puasa|hari raya)/],
  ['joke', /(lucu|bercanda|cerita|ngobrol|bosan|gabut)/],
  ['sad', /(sedih|capek|lelah|stres|galau|kesepian|sendiri|susah)/],
];

const QUESTION = /(\?|^(apa|apakah|bagaimana|gimana|kenapa|mengapa|kapan|di ?mana|siapa|berapa|bolehkah|boleh|bisakah|arti|makna|cara|maksud)\b)/;

function addressFor(persona) {
  return persona.name.split(' ')[0];
}

// Who a Pustaka entry belongs to, for cross-faith answers ("Itu dari tradisi umat Buddha ...").
const PEOPLE = {
  islam: 'umat Islam',
  protestan: 'umat Kristen Protestan',
  katolik: 'umat Katolik',
  hindu: 'umat Hindu',
  buddha: 'umat Buddha',
  khonghucu: 'umat Khonghucu dan tradisi Tionghoa',
};

export function chatOpening(persona, ctx) {
  const c = CULTURE[ctx.culture] || CULTURE.jawa;
  if (persona.guide) {
    return `${ctx.greeting || 'Selamat datang'}! Saya ${persona.name}, ${persona.job}. Mau tanya soal ${ctx.placeName}, tata cara, atau hari raya? Silakan.`;
  }
  if (persona.lines && persona.lines.hello) {
    return persona.lines.hello;
  }
  return pick([
    `Eh, halo! Saya ${persona.name}. Sini, duduk-duduk.`,
    `Halo, ${c.you.split('/')[0]}! Baru pertama ke sini?`,
    `Wah, ada teman baru. Saya ${persona.name}, dari ${persona.from}.`,
  ]);
}

export function chatSuggestions(persona, ctx) {
  const base = ['Apa kabar?', 'Asalnya dari mana?'];
  if (persona.lines) {
    return ['Apa yang paling enak?', 'Gimana cara masaknya?', ...base, 'Terima kasih!'];
  }
  if (persona.guide) {
    return ['Apa arti tempat ini?', `Bagaimana cara ${ctx.ritualHint || 'berdoa'} di sini?`, 'Hari raya terdekat?', 'Terima kasih!'];
  }
  return [...base, 'Hobinya apa?', 'Ceritakan keluarga', 'Sampai jumpa!'];
}

// Returns { text, entry?: {id, title}, guide?: routeName }
export function chatReply(persona, input, ctx) {
  const text = normalize(input);
  const c = CULTURE[ctx.culture] || CULTURE.jawa;
  const you = ctx.userName || 'kamu';
  const intent = (INTENTS.find(([, pattern]) => pattern.test(text)) || [null])[0];

  // Faith/ritual questions: answer from the Pustaka, with a link to read more.
  const looksLikeQuestion = QUESTION.test(text) || text.split(' ').length > 4;
  const smallTalk = ['greet', 'howareyou', 'name', 'origin', 'family', 'work', 'hobby', 'weather', 'thanks', 'bye', 'price', 'compliment', 'joke', 'sad'];
  // Food questions are answered as food talk ("what's tasty?" must not turn into a scripture lookup).
  // Diet rules (halal, vegetarian) go to the Pustaka only when asking a guide, not a cook.
  const foodTalk = ['recommend', 'how', ...(persona.guide ? [] : ['halal'])];
  if (looksLikeQuestion && !smallTalk.includes(intent) && !foodTalk.includes(intent) && ctx.search) {
    const hit = ctx.search(input);
    if (hit) {
      const people = hit.foreign ? PEOPLE[hit.foreign] || 'tradisi lain' : null;
      let lead;
      if (persona.guide) {
        lead = people ? `Itu bagian dari tradisi ${people}. Menurut Pustaka Jeda` : 'Menurut Pustaka Jeda';
      } else {
        lead = people ? `Itu dari tradisi ${people}, bukan tradisi saya sendiri. Tapi setahu saya` : 'Setahu saya';
      }
      const tail = persona.guide ? '' : ' Lebih pasti tanya pemandu atau pemuka agama, ya.';
      return { text: `${lead}: ${hit.summary}${tail}`, entry: { id: hit.id, title: hit.title } };
    }
  }

  switch (intent) {
    case 'greet':
      return { text: pick([`${ctx.greeting || 'Halo'}! Senang ketemu, ${you}.`, `Halo juga, ${you}! ${c.food ? `Ayo, ${c.food}.` : ''}`, `Halo! Hari ini ${ctx.timeWord} yang ${pick(['tenang', 'cerah', 'enak'])}, ya.`]) };
    case 'howareyou':
      return { text: pick([`Puji syukur, baik. Kamu sendiri gimana, ${you}?`, 'Baik, cuma agak capek. Tapi senang ada yang ngajak ngobrol.', `${c.yes}, sehat. Kamu?`]) };
    case 'name':
      return { text: `Saya ${persona.name}. ${persona.job ? `Sehari-hari ${persona.job}.` : ''} Kalau kamu ${you}, kan?` };
    case 'origin':
      return { text: `Saya dari ${persona.from}. ${pick(['Kangen kampung kadang-kadang.', 'Tapi sudah lama tinggal di sini.', 'Kamu pernah ke sana?'])}` };
    case 'family':
      return { text: persona.family ? `Keluarga saya? ${persona.family[0].toUpperCase()}${persona.family.slice(1)}. ${pick(['Mereka sehat semua, syukurlah.', 'Ramai kalau kumpul hari raya.', 'Kamu sendiri?'])}` : 'Keluarga baik-baik saja, terima kasih sudah tanya.' };
    case 'work':
      return { text: persona.lines ? `Sudah lama jualan di sini. Buka dari pagi sampai habis. ${pick(['Capek, tapi senang lihat orang makan lahap.', 'Pelanggan sudah seperti keluarga.'])}` : `Saya ${persona.job || 'bekerja'}. ${pick(['Lumayan sibuk minggu ini.', 'Hari ini libur, makanya santai di sini.'])}` };
    case 'hobby':
      return { text: persona.hobby ? `Saya suka ${persona.hobby}. ${pick(['Bikin hati tenang.', 'Kamu suka apa?', 'Dari kecil sudah begitu.'])}` : 'Hobi saya ngobrol begini, hahaha.' };
    case 'weather':
      return { text: pick([`${c.wow}, ${ctx.timeWord} ini lumayan ${pick(['gerah', 'adem', 'enak'])}. Pas buat minum yang hangat.`, 'Semoga tidak hujan deras, ya.', 'Cuaca begini enaknya makan yang berkuah.']) };
    case 'recommend':
      if (persona.lines && ctx.menu && ctx.menu.length) {
        return { text: `Coba ${ctx.menu[0]}${ctx.menu[1] ? ` atau ${ctx.menu[1]}` : ''}. Itu andalan kami! Ketuk kios kami untuk pesan.` };
      }
      return { text: ctx.kedaiTip ? `Kalau saya, ${ctx.kedaiTip}. Enak sekali.` : 'Semua enak, tergantung selera kamu.' };
    case 'how':
      if (persona.lines && persona.lines.cook) {
        return { text: `${pick(persona.lines.cook)} ${ctx.methodAbout || ''}`.trim() };
      }
      return { text: ctx.methodAbout ? `Setahu saya begini: ${ctx.methodAbout}` : 'Wah, saya cuma tukang makan, bukan tukang masak, hahaha.' };
    case 'halal':
      return { text: ctx.foodNote || 'Kalau ada pantangan makanan, tanyakan langsung ke penjualnya, ya. Mereka biasanya terbuka.' };
    case 'price':
      return { text: 'Di Jeda semuanya gratis kok, harga cuma buat suasana. Makan saja yang kamu mau.' };
    case 'compliment':
      return { text: pick([`${c.thanks}! Kamu baik sekali.`, 'Hahaha, bisa saja. Terima kasih.', 'Senang dengarnya!']) };
    case 'place':
      return { text: ctx.placeAbout ? `${ctx.placeAbout}` : `Ini ${ctx.placeName}. Silakan lihat-lihat dengan tenang.` };
    case 'festival':
      return { text: ctx.nextHoliday ? `Hari raya terdekat: ${ctx.nextHoliday}. ${pick(['Sudah siap-siap?', 'Biasanya ramai sekali.', 'Saya sudah tidak sabar.'])}` : 'Hari raya selalu jadi waktu kumpul keluarga.' };
    case 'joke':
      return { text: pick(['Kenapa sate selalu berdua dengan lontong? Karena sate tidak mau ditusuk sendirian. Hahaha.', 'Dulu saya kira kopi joss itu nama artis.', 'Cerita? Kemarin ada kucing ikut antre di sini, sabar sekali.']) };
    case 'sad':
      return { text: `Semoga hatimu ringan lagi, ${you}. Duduk sebentar, minum yang hangat. Kalau perlu, ada tombol "Ambil jeda" di atas.` };
    case 'thanks':
      return { text: pick([`Sama-sama, ${you}!`, `${c.thanks} juga!`, 'Sama-sama. Mampir lagi, ya.']) };
    case 'bye':
      return { text: `${c.bye}, ${you}!`, end: true };
    default:
      if (looksLikeQuestion && persona.guide) {
        return { text: 'Maaf, saya belum menemukan jawabannya di Pustaka. Coba kata lain, atau buka Papan Panduan.', guide: 'pustaka' };
      }
      return { text: pick([`Oh begitu? Cerita lagi, ${you}.`, `${c.yes}, saya paham.`, 'Hmm, menarik juga.', `Hahaha, ${c.wow.toLowerCase()}.`, 'Wah, saya baru tahu.']) };
  }
}
