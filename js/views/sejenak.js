// "Sejenak": seven small rituals that need no onboarding, no faith choice and no 3D world.
// A shared link lands here and the first ritual is one tap away.
// Typed words stay on the page: they are never stored and nothing is requested while typing or releasing.
// The only thing saved is a count of the visitor's own pauses, on this device (jeda:v1:sejenak).

import { prefs, load, save } from '../store.js';
import { esc, toast } from '../ui.js';
import { lang } from '../i18n.js';
import * as audio from '../audio.js';
import { openPause } from '../pause.js';

const TABS = ['nyala', 'harapan', 'lepas', 'petik', 'ketuk', 'gerak', 'hangat'];
const STATS_KEY = 'sejenak';
const BEADS = 12;

// Lives as long as the page: the flame stays lit and the tap count continues while the visitor looks around.
// The ambience choice also lives only as long as the page, so a returning visitor is never met by sudden sound.
const session = { lit: false, taps: 0, counted: new Set(), ambience: 'off', lastReflection: -1 };
const AMBIENCES = ['off', 'rain', 'river', 'gamelan', 'chimes', 'night'];
// Well-known bead counts: 33 for a tasbih round, 10 for a rosary decade, 108 for a japa mala.
const CYCLE_BY_KIND = { tasbih: 33, rosario: 10, japa: 108, manik: 12 };
const STEP_SECONDS = 20;

const STRINGS = {
  id: {
    title: { nyala: 'Sejenak', harapan: 'Titip harapan', lepas: 'Lepas beban', petik: 'Petik renungan', ketuk: 'Ketuk pelan', gerak: 'Gerak pelan', hangat: 'Yang hangat' },
    tab: { nyala: 'Nyala', harapan: 'Harapan', lepas: 'Lepas', petik: 'Petik', ketuk: 'Ketuk', gerak: 'Gerak', hangat: 'Hangat' },
    light: { lilin: 'Nyalakan lilin', dupa: 'Nyalakan dupa', pelita: 'Nyalakan pelita' },
    lit: { lilin: 'Lilinmu menyala', dupa: 'Dupamu menyala', pelita: 'Pelitamu menyala' },
    statsToday: (n) => `${n} jeda hari ini`,
    statsDays: (n) => (n <= 1 ? 'hari pertamamu di sini' : `mampir ${n} hari`),
    statsWhere: 'Di perangkat ini',
    more: 'Kalau ingin lebih lama',
    wishPlaceholder: 'Tulis harapanmu, boleh kosong',
    wishLabel: 'Harapanmu',
    wishSend: 'Lepaskan lentera',
    wishDone: 'Lenteramu naik. Semoga sampai.',
    wishHint: 'Tidak disimpan. Lentera hanya membawanya pergi.',
    worryPlaceholder: 'Tulis yang memberatkan hatimu',
    worryLabel: 'Yang memberatkan',
    worrySend: 'Lepaskan',
    worryDone: 'Sudah dilepas. Kata-katamu tidak disimpan di mana pun.',
    worryHint: 'Tidak disimpan, tidak dikirim. Hilang saat dilepas.',
    tapLabel: { muyu: 'Ketuk muyu', tasbih: 'Geser satu butir tasbih', rosario: 'Geser satu butir rosario', japa: 'Geser satu butir japa mala', manik: 'Geser satu butir' },
    tapUnit: { muyu: 'ketukan', tasbih: 'butir', rosario: 'butir', japa: 'butir', manik: 'butir' },
    tapHint: 'Satu ketukan, satu napas.',
    cycle: (done, size, round) => `${done} dari ${size} · putaran ${round}`,
    cycleDone: 'Satu putaran selesai.',
    petikShake: 'Kocok tabung',
    petikAgain: 'Petik lagi',
    petikNumber: (n) => `Batang ${n}`,
    petikNote: 'Bukan ramalan. Satu renungan kecil untuk hari ini.',
    petikAskLead: 'Ingin bertanya lebih dalam?',
    petikAsk: 'Tanya Jeda',
    gerakIntro: 'Enam gerakan pelan, sekitar dua menit. Bisa sambil duduk.',
    gerakSafety: 'Pelan saja. Berhenti kalau terasa sakit.',
    gerakStart: 'Mulai',
    gerakPause: 'Jeda',
    gerakResume: 'Lanjut',
    gerakNext: 'Berikutnya',
    gerakAgain: 'Ulangi',
    gerakStep: (index, total) => `Gerakan ${index} dari ${total}`,
    gerakDone: 'Selesai. Badanmu ikut beristirahat.',
    gerakSeconds: (n) => `${n} detik`,
    ambience: 'Suasana',
    ambienceName: { off: 'Hening', rain: 'Hujan', river: 'Sungai', gamelan: 'Gamelan pelan', chimes: 'Lonceng angin', night: 'Malam' },
    ambienceNow: (name) => `Suasana: ${name}`,
    returnCue: (days) => (days <= 1 ? 'Selamat datang lagi. Kemarin kamu juga mampir.' : `Selamat datang lagi. Terakhir mampir ${days} hari lalu.`),
    remind: 'Ingatkan aku besok',
    remindSub: 'Berkas kalender untuk jam yang sama. Tanpa akun, tanpa notifikasi dari kami.',
    remindDone: 'Berkas kalender diunduh. Buka untuk menyimpannya.',
    remindTitle: 'Jeda sejenak',
    live: 'Punya kode Ruang Live?',
    liveSub: 'Masuk ke ruang yang sedang disiarkan.',
    drinkAsk: 'Seberapa lelah hari ini?',
    drinkLevel: ['Sedikit', 'Lumayan', 'Sangat'],
    drinkAgain: 'Ketuk lagi untuk pilihan lain.',
    sound: 'Suara',
    soundOn: 'Suara menyala',
    soundOff: 'Suara dimatikan',
    share: 'Bagikan',
    shareText: 'Ambil jeda sejenak: nyalakan lilin, titip harapan, lepas beban, petik renungan, gerak pelan. Tanpa daftar.',
    copied: 'Tautan disalin. Bagikan ke siapa pun yang butuh jeda.',
    moreTitle: 'Kalau ingin lebih lama',
    breathe: 'Napas satu menit',
    breatheSub: 'Tarik, tahan, lepas. Dipandu pelan.',
    ask: 'Tanya Jeda',
    askSub: 'Jawaban dari Pustaka Jeda, selalu dengan sumber.',
    full: 'Jeda selengkapnya',
    fullSub: (n) => `${n} jalan iman, ruang ibadah 3D, pustaka. Unduhan lebih besar.`,
    home: 'Beranda Jeda',
    homeSub: 'Kembali ke ruangmu dan pustaka.',
    privacy: 'Tanpa daftar, tanpa iklan. Yang kamu tulis di sini tidak disimpan dan tidak dikirim.',
    langSwitch: 'English',
    docTitle: 'Sejenak · Jeda',
  },
  en: {
    title: { nyala: 'A moment', harapan: 'Leave a wish', lepas: 'Let it go', petik: 'Draw a reflection', ketuk: 'Tap gently', gerak: 'Move gently', hangat: 'Something warm' },
    tab: { nyala: 'Light', harapan: 'Wish', lepas: 'Release', petik: 'Draw', ketuk: 'Tap', gerak: 'Move', hangat: 'Warm' },
    light: { lilin: 'Light the candle', dupa: 'Light the incense', pelita: 'Light the lamp' },
    lit: { lilin: 'Your candle is lit', dupa: 'Your incense is lit', pelita: 'Your lamp is lit' },
    statsToday: (n) => `${n} ${n === 1 ? 'pause' : 'pauses'} today`,
    statsDays: (n) => (n <= 1 ? 'your first day here' : `${n} days you stopped by`),
    statsWhere: 'On this device',
    more: 'If you want to stay longer',
    wishPlaceholder: 'Write your wish, or leave it empty',
    wishLabel: 'Your wish',
    wishSend: 'Release the lantern',
    wishDone: 'Your lantern is rising. May it arrive.',
    wishHint: 'Not saved. The lantern simply carries it away.',
    worryPlaceholder: 'Write what weighs on you',
    worryLabel: 'What weighs on you',
    worrySend: 'Let it go',
    worryDone: 'Released. Your words are not kept anywhere.',
    worryHint: 'Not saved, not sent. Gone when you release it.',
    tapLabel: { muyu: 'Tap the wooden fish', tasbih: 'Move one tasbih bead', rosario: 'Move one rosary bead', japa: 'Move one japa mala bead', manik: 'Move one bead' },
    tapUnit: { muyu: 'taps', tasbih: 'beads', rosario: 'beads', japa: 'beads', manik: 'beads' },
    tapHint: 'One tap, one breath.',
    cycle: (done, size, round) => `${done} of ${size} · round ${round}`,
    cycleDone: 'One round complete.',
    petikShake: 'Shake the cup',
    petikAgain: 'Draw again',
    petikNumber: (n) => `Stick ${n}`,
    petikNote: 'Not a prediction. One small reflection for today.',
    petikAskLead: 'Want to ask something deeper?',
    petikAsk: 'Ask Jeda',
    gerakIntro: 'Six gentle movements, about two minutes. You can stay seated.',
    gerakSafety: 'Go slowly. Stop if anything hurts.',
    gerakStart: 'Start',
    gerakPause: 'Pause',
    gerakResume: 'Resume',
    gerakNext: 'Next',
    gerakAgain: 'Again',
    gerakStep: (index, total) => `Movement ${index} of ${total}`,
    gerakDone: 'Done. Your body got a rest too.',
    gerakSeconds: (n) => `${n} seconds`,
    ambience: 'Ambience',
    ambienceName: { off: 'Silence', rain: 'Rain', river: 'River', gamelan: 'Soft gamelan', chimes: 'Wind chimes', night: 'Night' },
    ambienceNow: (name) => `Ambience: ${name}`,
    returnCue: (days) => (days <= 1 ? 'Welcome back. You stopped by yesterday too.' : `Welcome back. Your last visit was ${days} days ago.`),
    remind: 'Remind me tomorrow',
    remindSub: 'A calendar file for the same time. No account, no notifications from us.',
    remindDone: 'Calendar file downloaded. Open it to save the reminder.',
    remindTitle: 'A short pause with Jeda',
    live: 'Have a Live Room code?',
    liveSub: 'Join a room that is being broadcast.',
    drinkAsk: 'How tired are you today?',
    drinkLevel: ['A little', 'Quite', 'Very'],
    drinkAgain: 'Tap again for another pick.',
    sound: 'Sound',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    share: 'Share',
    shareText: 'Take a short pause: light a candle, leave a wish, let a worry go, draw a reflection, move gently. No sign-up.',
    copied: 'Link copied. Share it with anyone who needs a pause.',
    moreTitle: 'If you want to stay longer',
    breathe: 'One-minute breath',
    breatheSub: 'In, hold, out. Gently guided.',
    ask: 'Ask Jeda',
    askSub: 'Answers from the Jeda library, always with sources.',
    full: 'The full Jeda',
    fullSub: (n) => `${n} faith paths, 3D prayer spaces, a library. A larger download.`,
    home: 'Jeda home',
    homeSub: 'Back to your space and the library.',
    privacy: 'No sign-up, no ads. What you write here is not saved and not sent.',
    langSwitch: 'Bahasa Indonesia',
    docTitle: 'A moment · Jeda',
  },
};

// One quiet sentence per day: a small, honest reason to come back tomorrow.
const DAILY = {
  id: [
    'Tidak semua hal harus selesai hari ini.',
    'Pelan juga tetap sampai.',
    'Napasmu sudah cukup untuk saat ini.',
    'Kamu boleh berhenti sebentar.',
    'Hari ini cukup satu langkah kecil.',
    'Diam sebentar bukan berarti tertinggal.',
    'Yang berat tidak harus dibawa sendirian.',
    'Istirahat juga bagian dari perjalanan.',
    'Kamu sudah bertahan sampai detik ini.',
    'Tidak apa-apa belum tahu jawabannya.',
    'Biarkan yang lewat, lewat.',
    'Cukup hadir di sini, sekarang.',
    'Hatimu boleh lelah. Ia juga boleh pulih.',
    'Besok masih ada pagi.',
  ],
  en: [
    'Not everything has to be finished today.',
    'Slow still arrives.',
    'Your breath is enough for now.',
    'You are allowed to stop for a while.',
    'One small step is enough today.',
    'Pausing does not mean falling behind.',
    'What is heavy need not be carried alone.',
    'Rest is part of the journey.',
    'You have made it to this very second.',
    'It is fine not to know the answer yet.',
    'Let what passes, pass.',
    'It is enough to be here, now.',
    'Your heart may be tired. It may also mend.',
    'There is still a morning tomorrow.',
  ],
};

const DRINKS = {
  id: [
    [
      ['Teh melati hangat', 'Ringan dan wangi. Minum pelan, tidak usah buru-buru.'],
      ['Air hangat jeruk nipis', 'Segar tanpa repot. Segelas dulu, sisanya nanti.'],
    ],
    [
      ['Wedang jahe', 'Hangat sampai ke dada. Kamu sudah bekerja cukup hari ini.'],
      ['Cokelat hangat', 'Manis sedikit tidak apa-apa. Duduk dulu.'],
      ['Teh tarik', 'Berbusa dan hangat. Istirahat lima menit itu sah.'],
    ],
    [
      ['Wedang uwuh', 'Rempah hangat untuk hari yang panjang. Besok dipikir besok.'],
      ['Bajigur', 'Santan, gula aren, hangat. Malam ini cukup rebahan.'],
      ['Sekoteng', 'Jahe, kacang, hangat. Kamu sudah bertahan sejauh ini.'],
    ],
  ],
  en: [
    [
      ['Warm jasmine tea', 'Light and fragrant. Sip slowly, there is no rush.'],
      ['Warm water with lime', 'Fresh and simple. One glass first, the rest can wait.'],
    ],
    [
      ['Wedang jahe (ginger drink)', 'Warm down to the chest. You have done enough today.'],
      ['Hot chocolate', 'A little sweetness is fine. Sit down first.'],
      ['Teh tarik (pulled milk tea)', 'Frothy and warm. A five-minute break is allowed.'],
    ],
    [
      ['Wedang uwuh (spiced herbal drink)', 'Warm spices for a long day. Tomorrow can wait until tomorrow.'],
      ['Bajigur (coconut milk and palm sugar)', 'Warm and sweet. Tonight, lying down is enough.'],
      ['Sekoteng (ginger with peanuts)', 'Ginger, peanuts, warmth. You have held on this far.'],
    ],
  ],
};

// Reflections for "Petik": written for Jeda, not quoted from any scripture, and never a prediction.
const REFLECTIONS = {
  id: [
    ['Air yang tenang memantulkan langit.', 'Apa yang perlu kamu diamkan dulu hari ini?'],
    ['Benih tidak tumbuh karena ditarik.', 'Apa yang sedang kamu paksa untuk cepat?'],
    ['Pintu yang tertutup juga menunjukkan arah.', 'Penolakan apa yang ternyata melindungimu?'],
    ['Langkah kecil yang diulang menjadi jalan.', 'Satu langkah kecil apa yang bisa kamu ulang besok?'],
    ['Hujan tidak meminta izin, tapi selalu reda.', 'Perasaan apa yang cukup kamu biarkan lewat?'],
    ['Tangan yang terbuka bisa menerima.', 'Apa yang ingin kamu lepaskan dari genggaman?'],
    ['Bambu melentur, lalu tegak lagi.', 'Di mana kamu boleh sedikit melentur?'],
    ['Lampu kecil cukup untuk satu langkah.', 'Langkah berikutnya apa yang sudah terlihat?'],
    ['Sungai tidak melawan batu; ia mengalir di sampingnya.', 'Hambatan apa yang bisa kamu kitari, bukan kamu tabrak?'],
    ['Sumur yang dalam butuh waktu untuk penuh.', 'Apa yang sedang mengisi ulang dirimu?'],
    ['Kata yang lembut membuka lebih banyak pintu.', 'Kepada siapa kamu ingin berkata lebih lembut?'],
    ['Bulan tidak selalu penuh, tapi tetap bulan.', 'Bagian dirimu mana yang perlu kamu terima apa adanya?'],
    ['Rumah yang hangat dibangun dari hal-hal kecil.', 'Kebiasaan kecil apa yang membuatmu merasa pulang?'],
    ['Yang sudah lewat menjadi tanah tempat berpijak.', 'Pelajaran apa dari kemarin yang ingin kamu bawa?'],
    ['Burung pulang ke sarang saat senja.', 'Ke mana hatimu ingin pulang malam ini?'],
    ['Diam juga sebuah jawaban.', 'Pertanyaan apa yang tidak perlu kamu jawab hari ini?'],
    ['Akar bekerja di tempat yang tidak terlihat.', 'Usaha diam-diam apa yang patut kamu hargai?'],
    ['Angin tidak terlihat, tapi daun tahu.', 'Siapa yang diam-diam menguatkanmu?'],
    ['Gelas yang penuh tidak bisa diisi lagi.', 'Apa yang bisa kamu kosongkan sedikit?'],
    ['Matahari terbit tanpa tergesa.', 'Bagaimana rasanya memulai besok dengan pelan?'],
    ['Jembatan dibangun dari dua sisi.', 'Hubungan mana yang ingin kamu sambung kembali?'],
    ['Lilin tidak berkurang saat menyalakan lilin lain.', 'Kebaikan kecil apa yang bisa kamu bagi hari ini?'],
    ['Ombak datang dan pergi; pantai tetap di sana.', 'Apa yang tetap teguh di dalam dirimu?'],
    ['Syukur membuat yang cukup terasa cukup.', 'Tiga hal kecil apa yang kamu syukuri hari ini?'],
  ],
  en: [
    ['Still water reflects the sky.', 'What do you need to let settle today?'],
    ['A seed does not grow faster for being pulled.', 'What are you trying to rush?'],
    ['A closed door also points a way.', 'Which "no" turned out to protect you?'],
    ['Small steps, repeated, become a path.', 'What small step could you repeat tomorrow?'],
    ['Rain does not ask permission, but it always passes.', 'Which feeling can you simply let pass?'],
    ['An open hand can receive.', 'What would you like to stop gripping?'],
    ['Bamboo bends, then stands again.', 'Where could you bend a little?'],
    ['A small lamp is enough for one step.', 'Which next step can you already see?'],
    ['A river does not fight the stone; it flows beside it.', 'Which obstacle could you go around instead of through?'],
    ['A deep well takes time to fill.', 'What is filling you up again?'],
    ['Gentle words open more doors.', 'Who would you like to speak to more gently?'],
    ['The moon is not always full, and it is still the moon.', 'Which part of you needs accepting as it is?'],
    ['A warm home is built from small things.', 'Which small habit makes you feel at home?'],
    ['What has passed becomes ground to stand on.', 'What lesson from yesterday do you want to keep?'],
    ['Birds fly home at dusk.', 'Where does your heart want to go home tonight?'],
    ['Silence is also an answer.', 'Which question do you not need to answer today?'],
    ['Roots work where no one sees.', 'Which quiet effort deserves your respect?'],
    ['Wind is unseen, but the leaves know.', 'Who quietly strengthens you?'],
    ['A full glass cannot be filled.', 'What could you empty a little?'],
    ['The sun rises without hurry.', 'How would it feel to start tomorrow slowly?'],
    ['A bridge is built from both sides.', 'Which connection would you like to mend?'],
    ['A candle loses nothing by lighting another.', 'What small kindness could you share today?'],
    ['Waves come and go; the shore stays.', 'What stays steady inside you?'],
    ['Gratitude makes enough feel like enough.', 'Which three small things are you grateful for today?'],
  ],
};

// "Gerak": six gentle movements, the length of a short break. Not a lesson in any tradition, no health claims.
const MOVES = {
  id: [
    ['Raih langit', 'Jalin jari, dorong telapak ke atas. Tarik napas, tahan sebentar, turunkan pelan.'],
    ['Putar bahu', 'Putar kedua bahu ke belakang, pelan, lima kali.'],
    ['Lepas leher', 'Miringkan kepala ke kanan selama tiga napas, lalu ke kiri.'],
    ['Condong ke samping', 'Satu tangan ke atas, condongkan badan ke sisi lain. Lalu ganti sisi.'],
    ['Putar badan', 'Tangan di dada, putar badan ke kanan dan ke kiri, pelan.'],
    ['Tenang', 'Tangan di perut. Tarik napas empat hitungan, hembuskan enam.'],
  ],
  en: [
    ['Reach for the sky', 'Interlace your fingers, push your palms up. Breathe in, hold briefly, lower slowly.'],
    ['Roll the shoulders', 'Roll both shoulders backwards, slowly, five times.'],
    ['Ease the neck', 'Tilt your head to the right for three breaths, then to the left.'],
    ['Lean to the side', 'Raise one arm and lean gently the other way. Then switch sides.'],
    ['Gentle twist', 'Hands on your chest, turn slowly to the right and to the left.'],
    ['Settle', 'Hands on your belly. Breathe in for four counts, out for six.'],
  ],
};

const FLAME_BY_FAITH = { khonghucu: 'dupa', buddha: 'dupa', hindu: 'dupa', islam: 'pelita' };
const TAP_BY_FAITH = { khonghucu: 'muyu', buddha: 'muyu', islam: 'tasbih', katolik: 'rosario', hindu: 'japa' };

const ICONS = {
  nyala: '<path d="M12 3c3 4 5 6.5 5 10a5 5 0 0 1-10 0c0-3.5 2-6 5-10z"/>',
  harapan: '<path d="M8 7h8l1.5 9h-11z"/><path d="M10 16v2.5h4V16"/><path d="M12 3.5V7"/>',
  lepas: '<path d="M3 9h10a3 3 0 1 0-3-3"/><path d="M3 14h15a3 3 0 1 1-3 3"/><path d="M3 19h6"/>',
  ketuk: '<circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="12" r="8"/>',
  hangat: '<path d="M5 10h12v4a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M9 3.5v3"/><path d="M13 3.5v3"/>',
  petik: '<path d="M7 11h10l-1.4 9.5h-7.2z"/><path d="M10 11V3.5"/><path d="M12.6 11V5.5"/><path d="M15 11l1.6-6"/>',
  gerak: '<circle cx="12" cy="4.5" r="2"/><path d="M12 7.5v6.5"/><path d="M12 14l-3.5 6"/><path d="M12 14l3.5 6"/><path d="M5.5 4.5L12 9.5l6.5-5"/>',
  ambienceOn: '<path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>',
  ambienceOff: '<path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/><path d="M3.5 3.5l17 17"/>',
  soundOn: '<path d="M4 10v4h3l5 4V6l-5 4z"/><path d="M16 9a4 4 0 0 1 0 6"/>',
  soundOff: '<path d="M4 10v4h3l5 4V6l-5 4z"/><path d="M16 9.5l5 5"/><path d="M21 9.5l-5 5"/>',
  share: '<path d="M12 15V4"/><path d="M8 8l4-4 4 4"/><path d="M5 13v6h14v-6"/>',
};

function icon(name) {
  return `<svg class="sj-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
}

const FLAME = `
  <path class="sj-flame-ghost" d="M100 22C118 52 126 70 126 86a26 26 0 0 1-52 0c0-16 8-34 26-64z"/>
  <g class="sj-flame">
    <path class="sj-flame-outer" d="M100 22C118 52 126 70 126 86a26 26 0 0 1-52 0c0-16 8-34 26-64z"/>
    <path class="sj-flame-core" d="M100 60c9 16 13 24 13 32a13 13 0 0 1-26 0c0-8 4-16 13-32z"/>
  </g>`;

function flameArt(kind) {
  if (kind === 'dupa') {
    return `<svg class="sj-art" viewBox="0 0 200 250" aria-hidden="true">
      <g class="sj-smoke">
        <path d="M100 62c-12-12 12-22 0-38"/>
        <path d="M79 68c-10-10 8-20-2-34"/>
        <path d="M121 68c10-10-8-20 2-34"/>
      </g>
      <path class="sj-stick" d="M100 172V74"/>
      <path class="sj-stick" d="M90 172L80 80"/>
      <path class="sj-stick" d="M110 172l10-92"/>
      <g class="sj-ember"><circle cx="100" cy="74" r="4.5"/><circle cx="80" cy="80" r="4.5"/><circle cx="120" cy="80" r="4.5"/></g>
      <path class="sj-wax" d="M48 170h104c0 34-22 52-52 52s-52-18-52-52z"/>
      <ellipse class="sj-wax-top" cx="100" cy="170" rx="52" ry="9"/>
      <rect class="sj-dish" x="74" y="220" width="52" height="12" rx="6"/>
    </svg>`;
  }
  if (kind === 'pelita') {
    return `<svg class="sj-art" viewBox="0 0 200 250" aria-hidden="true">
      <g transform="translate(0 62)">${FLAME}</g>
      <path class="sj-wick" d="M100 186v-14"/>
      <path class="sj-wax" d="M40 184h120c0 26-26 42-60 42s-60-16-60-42z"/>
      <ellipse class="sj-wax-top" cx="100" cy="184" rx="60" ry="9"/>
      <rect class="sj-dish" x="72" y="224" width="56" height="12" rx="6"/>
    </svg>`;
  }
  return `<svg class="sj-art" viewBox="0 0 200 250" aria-hidden="true">
    ${FLAME}
    <ellipse class="sj-dish" cx="100" cy="226" rx="70" ry="13"/>
    <path class="sj-wick" d="M100 122v-12"/>
    <rect class="sj-wax" x="68" y="118" width="64" height="106" rx="12"/>
    <path class="sj-wax-line" d="M70 134c20 9 40 9 60 0"/>
  </svg>`;
}

function lanternArt() {
  return `<svg class="sj-art sj-lantern" viewBox="0 0 160 200" aria-hidden="true">
    <path class="sj-wax" d="M46 48c22-14 46-14 68 0l8 92c-28 16-56 16-84 0z"/>
    <ellipse class="sj-flame-outer" cx="80" cy="112" rx="20" ry="30"/>
    <ellipse class="sj-flame-core" cx="80" cy="120" rx="9" ry="15"/>
    <path class="sj-wax-line" d="M46 48c22 10 46 10 68 0"/>
    <path class="sj-wax-line" d="M40 138c28 12 52 12 80 0"/>
    <rect class="sj-dish" x="64" y="154" width="32" height="9" rx="4.5"/>
  </svg>`;
}

function cupArt() {
  return `<svg class="sj-art sj-cup" viewBox="0 0 180 190" aria-hidden="true">
    <g class="sj-steam">
      <path d="M66 62c-9-10 9-18 0-30"/>
      <path d="M88 58c-9-10 9-18 0-30"/>
      <path d="M110 62c-9-10 9-18 0-30"/>
    </g>
    <ellipse class="sj-dish" cx="88" cy="166" rx="62" ry="10"/>
    <path class="sj-cup-handle" d="M130 96h8a16 16 0 0 1 0 32h-12"/>
    <path class="sj-wax" d="M42 84h92v40a38 38 0 0 1-38 38H80a38 38 0 0 1-38-38z"/>
    <ellipse class="sj-tea" cx="88" cy="84" rx="46" ry="8"/>
  </svg>`;
}

function tapArt(kind) {
  if (kind === 'muyu') {
    return `<svg class="sj-art sj-instrument" viewBox="0 0 140 120" aria-hidden="true">
      <ellipse class="sj-wax" cx="62" cy="70" rx="46" ry="36"/>
      <path class="sj-wax-line" d="M30 76c20 12 44 12 64 0"/>
      <circle class="sj-dot" cx="44" cy="56" r="3.5"/>
      <path class="sj-stick" d="M100 44l26-26"/>
      <circle class="sj-mallet" cx="98" cy="46" r="9"/>
    </svg>`;
  }
  const beads = Array.from({ length: BEADS }, (_, index) => {
    const angle = (index / BEADS) * Math.PI * 2 - Math.PI / 2;
    const x = (70 + Math.cos(angle) * 40).toFixed(1);
    const y = (56 + Math.sin(angle) * 40).toFixed(1);
    return `<circle class="sj-bead" data-bead="${index}" cx="${x}" cy="${y}" r="6.5"/>`;
  }).join('');
  return `<svg class="sj-art sj-instrument" viewBox="0 0 140 120" aria-hidden="true">
    <circle class="sj-string" cx="70" cy="56" r="40"/>
    ${beads}
    <path class="sj-stick" d="M70 102v14"/>
  </svg>`;
}

function sticksArt() {
  return `<svg class="sj-art sj-sticks" viewBox="0 0 160 200" aria-hidden="true">
    <g class="sj-sticks-set">
      <path class="sj-stick" d="M62 96L52 24"/>
      <path class="sj-stick" d="M74 96L70 14"/>
      <path class="sj-stick sj-stick-drawn" d="M86 96L90 10"/>
      <path class="sj-stick" d="M98 96L108 22"/>
      <path class="sj-stick" d="M80 96V30"/>
    </g>
    <path class="sj-wax" d="M38 92h84l-9 86a8 8 0 0 1-8 7H55a8 8 0 0 1-8-7z"/>
    <ellipse class="sj-wax-top" cx="80" cy="92" rx="42" ry="8"/>
    <path class="sj-wax-line" d="M44 120c24 8 48 8 72 0"/>
  </svg>`;
}

// Simple line figures, one per movement. Same proportions so the figure seems to move between steps.
const FIGURE_ARMS = [
  '<path d="M60 50L40 38L44 8"/><path d="M60 50L80 38L76 8"/>',
  '<path d="M60 54L44 92"/><path d="M60 54L76 92"/><path class="sj-fig-hint" d="M40 46a10 10 0 0 1 10-12"/><path class="sj-fig-hint" d="M80 46a10 10 0 0 0-10-12"/>',
  '<path d="M60 54L44 92"/><path d="M60 54L76 92"/>',
  '<path d="M64 54L48 16"/><path d="M64 54L82 88"/>',
  '<path d="M60 56l14 8"/><path d="M60 56l-14 8"/><path class="sj-fig-hint" d="M38 82a24 8 0 0 0 44 0"/>',
  '<path d="M60 54L48 76L60 80"/><path d="M60 54L72 76L60 80"/>',
];
const FIGURE_HEAD = ['60 30', '60 30', '67 32', '70 31', '60 30', '60 30'];
const FIGURE_BODY = ['M60 42V98', 'M60 42V98', 'M60 42V98', 'M60 98Q58 72 66 44', 'M60 42V98', 'M60 42V98'];

function figureArt(index) {
  const [x, y] = FIGURE_HEAD[index].split(' ');
  return `<svg class="sj-art sj-figure" viewBox="0 0 120 160" aria-hidden="true">
    <ellipse class="sj-dish" cx="60" cy="150" rx="40" ry="6"/>
    <g class="sj-fig">
      <circle class="sj-fig-head" cx="${x}" cy="${y}" r="11"/>
      <path d="${FIGURE_BODY[index]}"/>
      ${FIGURE_ARMS[index]}
      <path d="M60 98L48 146"/>
      <path d="M60 98L72 146"/>
    </g>
  </svg>`;
}

function todayKey() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function dayOfYear() {
  const now = new Date();
  return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
}

function readStats() {
  const raw = load(STATS_KEY, {}) || {};
  const stats = {
    days: Array.isArray(raw.days) ? raw.days : [],
    day: typeof raw.day === 'string' ? raw.day : '',
    today: Number(raw.today) || 0,
    total: Number(raw.total) || 0,
  };
  if (stats.day !== todayKey()) {
    stats.day = todayKey();
    stats.today = 0;
  }
  return stats;
}

// Counts and dates only. Never the words the visitor typed.
function recordPause() {
  const stats = readStats();
  if (!stats.days.includes(stats.day)) {
    stats.days = [...stats.days, stats.day].slice(-400);
  }
  stats.today += 1;
  stats.total += 1;
  save(STATS_KEY, stats);
  return stats;
}

function pickOther(list, previous) {
  const options = list.filter((item) => item !== previous);
  return options[Math.floor(Math.random() * options.length)] || list[0];
}

export function sejenak(main, params, query, ctx) {
  const userPrefs = prefs.get();
  const language = lang();
  const text = STRINGS[language];
  const faith = userPrefs.faith ? (ctx.content.faiths || []).find((item) => item.id === userPrefs.faith) : null;
  const flameKind = (faith && FLAME_BY_FAITH[faith.id]) || 'lilin';
  const tapKind = faith ? TAP_BY_FAITH[faith.id] || 'manik' : 'manik';
  const reducedMotion = userPrefs.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timers = new Set();
  const previousTitle = document.title;
  let active = TABS.includes(params[0]) ? params[0] : 'nyala';
  let lastDrink = null;
  let wishDone = false;
  let worryDone = false;
  let worryBusy = false;
  let drawn = null;
  let shaking = false;
  let stopAmbience = null;
  const move = { index: 0, left: STEP_SECONDS, running: false, started: false, done: false, timer: null };
  const cycleSize = CYCLE_BY_KIND[tapKind] || 0;
  // A gentle return cue, from this device's own dates only: shown before today's first pause.
  const returnDays = (() => {
    const stats = readStats();
    if (stats.today > 0 || session.lit) {
      return 0;
    }
    const earlier = stats.days.filter((day) => day < stats.day).sort();
    if (!earlier.length) {
      return 0;
    }
    const last = new Date(`${earlier[earlier.length - 1]}T00:00:00`);
    const today = new Date(`${stats.day}T00:00:00`);
    return Math.max(1, Math.round((today - last) / 86400000));
  })();

  const later = (callback, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      callback();
    }, ms);
    timers.add(id);
  };

  document.body.classList.add('sejenak-mode');
  document.title = text.docTitle;

  const onward = faith
    ? `<a class="sj-row" href="#/"><span><strong>${esc(text.home)}</strong><small>${esc(text.homeSub)}</small></span><span aria-hidden="true">→</span></a>`
    : `<a class="sj-row" href="#/mulai"><span><strong>${esc(text.full)}</strong><small>${esc(text.fullSub((ctx.content.faiths || []).length))}</small></span><span aria-hidden="true">→</span></a>`;

  main.innerHTML = `
    <section class="sj" data-sj data-tab="${active}"${session.lit ? ' data-lit="true"' : ''}${faith ? ` style="--accent:${esc(faith.color)}"` : ''}>
      <div class="sj-glow" aria-hidden="true"></div>
      <div class="sj-first">
        <header class="sj-head">
          <a class="sj-brand" href="#/"><span class="brand-mark" aria-hidden="true">‖</span>Jeda</a>
          <span class="sj-tools">
            <button class="sj-tool" type="button" data-sj-ambience></button>
            <button class="sj-tool" type="button" data-sj-sound></button>
            <button class="sj-tool" type="button" data-sj-share aria-label="${esc(text.share)}">${icon('share')}</button>
          </span>
        </header>
        <div class="sj-stage" data-sj-stage></div>
        <nav class="sj-dock" aria-label="${esc(text.title.nyala)}">
          ${TABS.map((id) => `<button class="sj-tab" type="button" data-sj-tab="${id}" aria-label="${esc(text.title[id])}" title="${esc(text.title[id])}">${icon(id)}<span class="sj-tab-label">${esc(text.tab[id])}</span></button>`).join('')}
        </nav>
      </div>
      <section class="sj-more" data-sj-more>
        <h2 class="sj-more-title">${esc(text.moreTitle)}</h2>
        <button class="sj-row" type="button" data-sj-breathe><span><strong>${esc(text.breathe)}</strong><small>${esc(text.breatheSub)}</small></span><span aria-hidden="true">→</span></button>
        <a class="sj-row" href="#/tanya"><span><strong>${esc(text.ask)}</strong><small>${esc(text.askSub)}</small></span><span aria-hidden="true">→</span></a>
        ${onward}
        <button class="sj-row" type="button" data-sj-remind><span><strong>${esc(text.remind)}</strong><small>${esc(text.remindSub)}</small></span><span aria-hidden="true">→</span></button>
        <a class="sj-row" href="#/gabung"><span><strong>${esc(text.live)}</strong><small>${esc(text.liveSub)}</small></span><span aria-hidden="true">→</span></a>
        <p class="sj-privacy">${esc(text.privacy)}</p>
        <button class="sj-lang" type="button" data-sj-lang>${esc(text.langSwitch)}</button>
      </section>
    </section>`;

  const root = main.querySelector('[data-sj]');
  const stage = root.querySelector('[data-sj-stage]');

  function statsLine() {
    const stats = readStats();
    if (!stats.total) {
      return '';
    }
    return `${text.statsWhere}: ${text.statsToday(stats.today)} · ${text.statsDays(stats.days.length)}`;
  }

  function afterHtml() {
    const daily = DAILY[language][dayOfYear() % DAILY[language].length];
    return `
      <p class="sj-daily">${esc(daily)}</p>
      <p class="sj-stats" data-sj-stats>${esc(statsLine())}</p>
      <button class="sj-link" type="button" data-sj-scroll>${esc(text.more)} <span aria-hidden="true">↓</span></button>`;
  }

  function returnHtml() {
    return returnDays ? `<p class="sj-return">${esc(text.returnCue(returnDays))}</p>` : '';
  }

  function cycleLine() {
    const done = session.taps % cycleSize;
    const round = Math.floor(session.taps / cycleSize) + 1;
    return text.cycle(done, cycleSize, round);
  }

  function reflectionHtml(index) {
    const [line, question] = REFLECTIONS[language][index];
    return `<p class="sj-card-no">${esc(text.petikNumber(index + 1))}</p>
      <p class="sj-card-line">${esc(line)}</p>
      <p class="sj-card-ask">${esc(question)}</p>`;
  }

  function moveHtml() {
    const steps = MOVES[language];
    if (move.done) {
      return `${figureArt(steps.length - 1)}
        <p class="sj-move-name">${esc(text.gerakDone)}</p>
        <div class="sj-move-controls"><button class="sj-pill" type="button" data-sj-move-start>${esc(text.gerakAgain)}</button></div>`;
    }
    const [name, how] = steps[move.index];
    const share = Math.round(((STEP_SECONDS - move.left) / STEP_SECONDS) * 100);
    const main = move.running ? text.gerakPause : move.started ? text.gerakResume : text.gerakStart;
    const status = move.started
      ? `${text.gerakStep(move.index + 1, steps.length)} · <span data-sj-left>${esc(text.gerakSeconds(move.left))}</span>`
      : esc(text.gerakIntro);
    return `${figureArt(move.index)}
      <p class="sj-move-step">${status}</p>
      <p class="sj-move-name">${esc(name)}</p>
      <p class="sj-move-how">${esc(how)}</p>
      <span class="sj-progress" aria-hidden="true"><span data-sj-bar style="width:${share}%"></span></span>
      <div class="sj-move-controls">
        <button class="sj-pill" type="button" data-sj-move-start>${esc(main)}</button>
        <button class="sj-level" type="button" data-sj-move-next>${esc(text.gerakNext)}</button>
      </div>
      <p class="sj-line sj-safety">${esc(text.gerakSafety)}</p>`;
  }

  function panelHtml() {
    const title = `<h1 class="sj-title">${esc(text.title[active])}</h1>`;
    if (active === 'harapan') {
      return `${title}
        <div class="sj-object" data-sj-lantern>${lanternArt()}</div>
        <input class="sj-input" type="text" maxlength="140" autocomplete="off" data-sj-wish-input aria-label="${esc(text.wishLabel)}" placeholder="${esc(text.wishPlaceholder)}">
        <button class="sj-pill" type="button" data-sj-wish-send>${esc(text.wishSend)}</button>
        <p class="sj-line" data-sj-line aria-live="polite">${esc(wishDone ? text.wishDone : text.wishHint)}</p>`;
    }
    if (active === 'lepas') {
      return `${title}
        <textarea class="sj-input sj-area" rows="4" maxlength="600" autocomplete="off" data-sj-worry-input aria-label="${esc(text.worryLabel)}" placeholder="${esc(text.worryPlaceholder)}"></textarea>
        <button class="sj-pill" type="button" data-sj-worry-release>${esc(text.worrySend)}</button>
        <p class="sj-line" data-sj-line aria-live="polite">${esc(worryDone ? text.worryDone : text.worryHint)}</p>`;
    }
    if (active === 'petik') {
      return `${title}
        <button class="sj-focal sj-focal-small" type="button" data-sj-draw>
          <span class="sj-object" data-sj-sticks>${sticksArt()}</span>
          <span class="sj-pill" data-sj-draw-label>${esc(drawn === null ? text.petikShake : text.petikAgain)}</span>
        </button>
        <div class="sj-card" data-sj-card aria-live="polite">${drawn === null ? '' : reflectionHtml(drawn)}</div>
        <p class="sj-line">${esc(text.petikNote)}</p>
        <p class="sj-line">${esc(text.petikAskLead)} <a class="sj-link sj-inline" href="#/tanya">${esc(text.petikAsk)} <span aria-hidden="true">→</span></a></p>`;
    }
    if (active === 'gerak') {
      return `${title}<div class="sj-move" data-sj-move>${moveHtml()}</div>`;
    }
    if (active === 'ketuk') {
      return `${title}
        <button class="sj-knock" type="button" data-sj-tap aria-label="${esc(text.tapLabel[tapKind])}">${tapArt(tapKind)}</button>
        <p class="sj-tally"><span class="sj-count" data-sj-count>${session.taps}</span><span class="sj-unit">${esc(text.tapUnit[tapKind])}</span></p>
        <p class="sj-line" data-sj-cycle>${esc(cycleSize ? cycleLine() : text.tapHint)}</p>`;
    }
    if (active === 'hangat') {
      return `${title}
        <div class="sj-object">${cupArt()}</div>
        <p class="sj-ask" id="sj-drink-ask">${esc(text.drinkAsk)}</p>
        <div class="sj-levels" role="group" aria-labelledby="sj-drink-ask">
          ${text.drinkLevel.map((label, index) => `<button class="sj-level" type="button" data-sj-drink="${index + 1}">${esc(label)}</button>`).join('')}
        </div>
        <p class="sj-result" data-sj-drink-result aria-live="polite">${lastDrink ? `<strong>${esc(lastDrink[0])}</strong><span>${esc(lastDrink[1])}</span>` : ''}</p>`;
    }
    return `${title}
      <button class="sj-focal" type="button" data-sj-light>
        ${flameArt(flameKind)}
        <span class="sj-pill" data-sj-light-label>${esc(session.lit ? text.lit[flameKind] : text.light[flameKind])}</span>
      </button>
      <div class="sj-after" data-sj-after aria-live="polite">${session.lit ? afterHtml() : returnHtml()}</div>`;
  }

  function renderPanel() {
    root.dataset.tab = active;
    stage.innerHTML = `<div class="sj-panel">${panelHtml()}</div>`;
    root.querySelectorAll('[data-sj-tab]').forEach((tab) => {
      if (tab.dataset.sjTab === active) {
        tab.setAttribute('aria-current', 'true');
      } else {
        tab.removeAttribute('aria-current');
      }
    });
    if (active === 'ketuk') {
      paintBeads();
    }
    if (active === 'gerak') {
      renderMove();
    }
  }

  function renderAmbience() {
    const button = root.querySelector('[data-sj-ambience]');
    const on = session.ambience !== 'off';
    button.innerHTML = icon(on ? 'ambienceOn' : 'ambienceOff');
    button.setAttribute('aria-label', `${text.ambience}: ${text.ambienceName[session.ambience]}`);
    button.setAttribute('title', `${text.ambience}: ${text.ambienceName[session.ambience]}`);
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  // Background sound is opt-in: it starts only from a tap here and stops when the visitor leaves this route.
  function applyAmbience() {
    if (stopAmbience) {
      stopAmbience();
      stopAmbience = null;
    }
    const kind = session.ambience;
    root.dataset.amb = kind;
    document.documentElement.dataset.jedaAmbience = kind;
    if (kind !== 'off' && prefs.get().sound) {
      audio.unlockAudio();
      stopAmbience = audio.ambience(kind);
    }
    renderAmbience();
  }

  function cycleAmbience() {
    const next = AMBIENCES[(AMBIENCES.indexOf(session.ambience) + 1) % AMBIENCES.length];
    session.ambience = next;
    if (next !== 'off' && !prefs.get().sound) {
      prefs.set({ sound: true });
      renderSound();
    }
    applyAmbience();
    toast(text.ambienceNow(text.ambienceName[next]), 1600);
  }

  function renderSound() {
    const on = prefs.get().sound;
    const button = root.querySelector('[data-sj-sound]');
    button.innerHTML = icon(on ? 'soundOn' : 'soundOff');
    button.setAttribute('aria-label', text.sound);
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function paintBeads() {
    stage.querySelectorAll('[data-bead]').forEach((bead) => {
      bead.classList.toggle('on', session.taps > 0 && Number(bead.dataset.bead) === (session.taps - 1) % BEADS);
    });
  }

  // A pause counts once per ritual per page visit, so the number means "rituals", not "button presses".
  function count(kind) {
    if (session.counted.has(kind)) {
      return;
    }
    session.counted.add(kind);
    recordPause();
  }

  function light() {
    audio.unlockAudio();
    if (session.lit) {
      // Tapping a lit flame just makes it flicker.
      const art = stage.querySelector('.sj-art');
      art.classList.remove('sj-flicker');
      void art.getBoundingClientRect();
      art.classList.add('sj-flicker');
      audio.chime();
      return;
    }
    session.lit = true;
    count('nyala');
    root.dataset.lit = 'true';
    stage.querySelector('[data-sj-light-label]').textContent = text.lit[flameKind];
    stage.querySelector('[data-sj-after]').innerHTML = afterHtml();
    audio.bell();
    if (navigator.vibrate) {
      navigator.vibrate(12);
    }
  }

  function sendWish() {
    audio.unlockAudio();
    const input = stage.querySelector('[data-sj-wish-input]');
    // The wish is dropped here on purpose: it is not kept in memory, storage or the page.
    input.value = '';
    wishDone = true;
    root.dataset.wish = 'released';
    count('harapan');
    stage.querySelector('[data-sj-line]').textContent = text.wishDone;
    const lantern = stage.querySelector('[data-sj-lantern]');
    lantern.classList.remove('sj-rise');
    void lantern.getBoundingClientRect();
    lantern.classList.add('sj-rise');
    // The title steps back while the lantern passes through it.
    root.dataset.rising = 'true';
    audio.chime();
    later(() => {
      lantern.classList.remove('sj-rise');
      delete root.dataset.rising;
    }, reducedMotion ? 50 : 3200);
  }

  function releaseWorry() {
    if (worryBusy) {
      return;
    }
    audio.unlockAudio();
    const input = stage.querySelector('[data-sj-worry-input]');
    worryBusy = true;
    input.readOnly = true;
    input.classList.add('sj-dissolve');
    later(() => {
      // Cleared, never copied anywhere.
      input.value = '';
      input.readOnly = false;
      input.classList.remove('sj-dissolve');
      worryBusy = false;
      worryDone = true;
      root.dataset.worry = 'released';
      count('lepas');
      const line = stage.querySelector('[data-sj-line]');
      if (line) {
        line.textContent = text.worryDone;
      }
      audio.bell();
    }, reducedMotion ? 150 : 1400);
  }

  function tap() {
    audio.unlockAudio();
    session.taps += 1;
    count('ketuk');
    stage.querySelector('[data-sj-count]').textContent = String(session.taps);
    if (cycleSize) {
      const line = stage.querySelector('[data-sj-cycle]');
      line.textContent = cycleLine();
      if (session.taps % cycleSize === 0) {
        // A round is complete: a softer bell instead of the bead click, and the line glows once.
        line.textContent = `${text.cycleDone} ${cycleLine()}`;
        line.classList.remove('sj-glow-once');
        void line.getBoundingClientRect();
        line.classList.add('sj-glow-once');
        audio.bell();
      }
    }
    const button = stage.querySelector('[data-sj-tap]');
    button.classList.remove('sj-hit');
    void button.getBoundingClientRect();
    button.classList.add('sj-hit');
    paintBeads();
    if (tapKind === 'muyu') {
      audio.woodblock();
    } else {
      audio.bead();
    }
    if (navigator.vibrate) {
      navigator.vibrate(8);
    }
  }

  function pickDrink(level) {
    audio.unlockAudio();
    lastDrink = pickOther(DRINKS[language][level - 1], lastDrink);
    count('hangat');
    const result = stage.querySelector('[data-sj-drink-result]');
    result.innerHTML = `<strong>${esc(lastDrink[0])}</strong><span>${esc(lastDrink[1])}</span><small>${esc(text.drinkAgain)}</small>`;
    stage.querySelectorAll('[data-sj-drink]').forEach((button) => {
      button.setAttribute('aria-pressed', Number(button.dataset.sjDrink) === level ? 'true' : 'false');
    });
    root.dataset.drink = 'picked';
    audio.chime();
  }

  function drawReflection() {
    if (shaking) {
      return;
    }
    audio.unlockAudio();
    shaking = true;
    const sticks = stage.querySelector('[data-sj-sticks]');
    sticks.classList.add('sj-shake');
    audio.bead();
    later(() => audio.bead(), 180);
    later(() => audio.bead(), 380);
    later(() => {
      shaking = false;
      const current = stage.querySelector('[data-sj-sticks]');
      if (!current) {
        return;
      }
      current.classList.remove('sj-shake');
      const list = REFLECTIONS[language];
      let index = Math.floor(Math.random() * list.length);
      if (index === session.lastReflection) {
        index = (index + 1) % list.length;
      }
      session.lastReflection = index;
      drawn = index;
      count('petik');
      root.dataset.petik = 'drawn';
      stage.querySelector('[data-sj-card]').innerHTML = reflectionHtml(index);
      stage.querySelector('[data-sj-draw-label]').textContent = text.petikAgain;
      audio.chime();
    }, reducedMotion ? 120 : 1100);
  }

  function renderMove() {
    const box = stage.querySelector('[data-sj-move]');
    if (box) {
      box.innerHTML = moveHtml();
    }
    root.dataset.gerak = move.done ? 'done' : move.running ? 'running' : move.started ? 'paused' : 'idle';
  }

  function stopMoveTimer() {
    if (move.timer) {
      clearInterval(move.timer);
      move.timer = null;
    }
  }

  function finishMove() {
    stopMoveTimer();
    move.running = false;
    move.done = true;
    count('gerak');
    audio.bell();
    renderMove();
  }

  function advanceMove() {
    if (move.index >= MOVES[language].length - 1) {
      finishMove();
      return;
    }
    move.index += 1;
    move.left = STEP_SECONDS;
    audio.chime();
    renderMove();
  }

  function tickMove() {
    move.left -= 1;
    if (move.left <= 0) {
      advanceMove();
      return;
    }
    const left = stage.querySelector('[data-sj-left]');
    const bar = stage.querySelector('[data-sj-bar]');
    if (left) {
      left.textContent = text.gerakSeconds(move.left);
    }
    if (bar) {
      bar.style.width = `${Math.round(((STEP_SECONDS - move.left) / STEP_SECONDS) * 100)}%`;
    }
  }

  function toggleMove() {
    audio.unlockAudio();
    if (move.done) {
      move.index = 0;
      move.left = STEP_SECONDS;
      move.done = false;
      move.started = false;
    }
    if (move.running) {
      move.running = false;
      stopMoveTimer();
    } else {
      if (!move.started) {
        audio.chime();
      }
      move.started = true;
      move.running = true;
      stopMoveTimer();
      move.timer = setInterval(tickMove, 1000);
    }
    renderMove();
  }

  function nextMove() {
    audio.unlockAudio();
    move.started = true;
    advanceMove();
  }

  // A calendar file built on the device: no account, no server, no push permission.
  function remindTomorrow() {
    const pad = (value) => String(value).padStart(2, '0');
    const stamp = (date) =>
      `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`;
    const now = new Date();
    const start = new Date(now.getTime() + 86400000);
    const url = `${location.origin}${location.pathname}#/sejenak`;
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Jeda//Sejenak//ID',
      'BEGIN:VEVENT',
      `UID:${now.getTime()}-${Math.random().toString(36).slice(2)}@jeda`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(start)}`,
      'DURATION:PT5M',
      `SUMMARY:${text.remindTitle}`,
      `DESCRIPTION:${url}`,
      `URL:${url}`,
      'BEGIN:VALARM',
      'TRIGGER:PT0M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${text.remindTitle}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
    link.download = 'jeda-besok.ics';
    document.body.appendChild(link);
    link.click();
    link.remove();
    later(() => URL.revokeObjectURL(link.href), 4000);
    root.dataset.remind = 'saved';
    toast(text.remindDone, 3200);
  }

  // On Petik with a card showing, share the card itself (the reflection, never the visitor's own words).
  function shareMessage() {
    const card = stage.querySelector('[data-sj-card]');
    if (active === 'petik' && session.lastReflection >= 0 && card && card.textContent.trim()) {
      const [line, question] = REFLECTIONS[language][session.lastReflection];
      return `${line}\n${question}`;
    }
    return text.shareText;
  }

  async function share() {
    const url = `${location.origin}${location.pathname}#/sejenak`;
    const message = shareMessage();
    const payload = { title: text.docTitle, text: message, url };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch (error) {
        if (error && error.name === 'AbortError') {
          return;
        }
      }
    }
    try {
      await navigator.clipboard.writeText(message === text.shareText ? url : `${message}\n${url}`);
      toast(text.copied);
    } catch {
      toast(url, 6000);
    }
  }

  root.addEventListener('click', (event) => {
    const target = event.target.closest('button, a');
    if (!target || !root.contains(target)) {
      return;
    }
    if (target.dataset.sjTab) {
      if (target.dataset.sjTab !== active && !worryBusy && !shaking) {
        if (move.running) {
          move.running = false;
          stopMoveTimer();
        }
        active = target.dataset.sjTab;
        renderPanel();
      }
    } else if ('sjLight' in target.dataset) {
      light();
    } else if ('sjWishSend' in target.dataset) {
      sendWish();
    } else if ('sjWorryRelease' in target.dataset) {
      releaseWorry();
    } else if ('sjTap' in target.dataset) {
      tap();
    } else if (target.dataset.sjDrink) {
      pickDrink(Number(target.dataset.sjDrink));
    } else if ('sjDraw' in target.dataset) {
      drawReflection();
    } else if ('sjMoveStart' in target.dataset) {
      toggleMove();
    } else if ('sjMoveNext' in target.dataset) {
      nextMove();
    } else if ('sjAmbience' in target.dataset) {
      cycleAmbience();
    } else if ('sjRemind' in target.dataset) {
      remindTomorrow();
    } else if ('sjSound' in target.dataset) {
      const on = !prefs.get().sound;
      prefs.set({ sound: on });
      renderSound();
      if (!on && session.ambience !== 'off') {
        session.ambience = 'off';
        applyAmbience();
      }
      toast(on ? text.soundOn : text.soundOff, 1600);
      if (on) {
        audio.unlockAudio();
        audio.chime();
      }
    } else if ('sjShare' in target.dataset) {
      share();
    } else if ('sjScroll' in target.dataset) {
      root.querySelector('[data-sj-more]').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    } else if ('sjBreathe' in target.dataset) {
      openPause();
    } else if ('sjLang' in target.dataset) {
      prefs.set({ lang: language === 'en' ? 'id' : 'en' });
      ctx.rerender();
    }
  });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.matches('[data-sj-wish-input]')) {
      event.preventDefault();
      sendWish();
    }
  });

  renderSound();
  applyAmbience();
  renderPanel();

  return () => {
    timers.forEach((id) => clearTimeout(id));
    timers.clear();
    stopMoveTimer();
    if (stopAmbience) {
      stopAmbience();
      stopAmbience = null;
    }
    delete document.documentElement.dataset.jedaAmbience;
    document.body.classList.remove('sejenak-mode');
    document.title = previousTitle;
  };
}
