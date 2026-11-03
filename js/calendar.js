// Living calendar: Chinese lunar and Hijri (via Intl), solar terms, Easter, Balinese Pawukon.
// Computed dates are estimates; official dates in content/calendar.json override them.

const DAY = 86400000;

const chineseFormatter = new Intl.DateTimeFormat('en-u-ca-chinese', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

const islamicFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

export const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabiulawal', 'Rabiulakhir', 'Jumadilawal', 'Jumadilakhir',
  'Rajab', 'Syakban', 'Ramadan', 'Syawal', 'Zulkaidah', 'Zulhijah',
];

export const WUKU = [
  'Sinta', 'Landep', 'Ukir', 'Kulantir', 'Tolu', 'Gumbreg', 'Wariga', 'Warigadian',
  'Julungwangi', 'Sungsang', 'Dungulan', 'Kuningan', 'Langkir', 'Medangsia', 'Pujut',
  'Pahang', 'Krulut', 'Merakih', 'Tambir', 'Medangkungan', 'Matal', 'Uye', 'Menail',
  'Prangbakat', 'Bala', 'Ugu', 'Wayang', 'Klawu', 'Dukut', 'Watugunung',
];

export const PANCAWARA = ['Umanis', 'Paing', 'Pon', 'Wage', 'Kliwon'];

// Anchor: Galungan (Buda Kliwon Dungulan) on 13 Jan 2027, per SKB 3 Menteri 2027 / Bali calendar.
const GALUNGAN_ANCHOR = Date.UTC(2027, 0, 13);
const GALUNGAN_DAY_IN_CYCLE = 73; // wuku 11 (index 10) * 7 + Wednesday (3)

function utcDay(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

export function chineseDate(date) {
  const parts = Object.fromEntries(
    chineseFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  const monthMatch = /^(\d+)(.*)$/.exec(parts.month || '');
  return {
    year: Number(parts.relatedYear || parts.year),
    month: monthMatch ? Number(monthMatch[1]) : NaN,
    leap: monthMatch ? monthMatch[2] !== '' : false,
    day: Number(parts.day),
  };
}

export function hijriDate(date) {
  const parts = Object.fromEntries(
    islamicFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return {
    year: parseInt(parts.year, 10),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

export function pawukon(date) {
  const offset = Math.round((utcDay(date) - GALUNGAN_ANCHOR) / DAY);
  const dayInCycle = (((GALUNGAN_DAY_IN_CYCLE + offset) % 210) + 210) % 210;
  // Galungan is Kliwon; pancawara index 4 at cycle day 73.
  const pancaIndex = (((4 + offset) % 5) + 5) % 5;
  return {
    wuku: WUKU[Math.floor(dayInCycle / 7)],
    wukuIndex: Math.floor(dayInCycle / 7),
    dayInCycle,
    pancawara: PANCAWARA[pancaIndex],
  };
}

// Apparent solar longitude (degrees), low-precision Meeus algorithm.
function solarLongitude(timeMs) {
  const julianDay = timeMs / DAY + 2440587.5;
  const t = (julianDay - 2451545) / 36525;
  const rad = Math.PI / 180;
  const meanLongitude = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
  const meanAnomaly = (357.52911 + 35999.05029 * t - 0.0001537 * t * t) * rad;
  const center = (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(meanAnomaly)
    + (0.019993 - 0.000101 * t) * Math.sin(2 * meanAnomaly)
    + 0.000289 * Math.sin(3 * meanAnomaly);
  const omega = (125.04 - 1934.136 * t) * rad;
  const apparent = meanLongitude + center - 0.00569 - 0.00478 * Math.sin(omega);
  return ((apparent % 360) + 360) % 360;
}

// Returns the local (UTC+8) calendar date on which the sun reaches the target longitude.
function solarTermDate(year, targetDegrees, searchStartMonth) {
  const chinaOffset = 8 * 3600000;
  let previous = null;
  for (let dayIndex = 0; dayIndex < 60; dayIndex++) {
    const midnightChina = Date.UTC(year, searchStartMonth, 1 + dayIndex) - chinaOffset;
    const longitude = solarLongitude(midnightChina);
    if (previous !== null) {
      const crossed = targetDegrees === 0
        ? previous > 300 && longitude < 60
        : previous < targetDegrees && longitude >= targetDegrees;
      if (crossed) {
        return new Date(year, searchStartMonth, dayIndex);
      }
    }
    previous = longitude;
  }
  return null;
}

export function easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

const LUNAR_RULES = [
  { month: 1, day: 1, id: 'imlek', name: 'Tahun Baru Imlek (Sin Cia)', faith: 'khonghucu' },
  { month: 1, day: 9, id: 'king-thi-kong', name: 'Sembahyang Tuhan (King Thi Kong)', faith: 'khonghucu' },
  { month: 1, day: 15, id: 'cap-go-meh', name: 'Cap Go Meh', faith: 'khonghucu' },
  { month: 2, day: 19, id: 'kwan-im-1', name: 'Peringatan Kwan Im (2/19)', faith: 'khonghucu' },
  { month: 5, day: 5, id: 'peh-cun', name: 'Peh Cun (Duanwu)', faith: 'khonghucu' },
  { month: 6, day: 19, id: 'kwan-im-2', name: 'Peringatan Kwan Im (6/19)', faith: 'khonghucu' },
  { month: 7, day: 15, id: 'cioko', name: 'Cioko / Sembahyang Rebutan', faith: 'khonghucu' },
  { month: 8, day: 15, id: 'tiong-ciu', name: 'Tiong Ciu (Kue Bulan)', faith: 'khonghucu' },
  { month: 8, day: 27, id: 'lahir-kongzi', name: 'Hari Lahir Nabi Kongzi', faith: 'khonghucu' },
  { month: 9, day: 19, id: 'kwan-im-3', name: 'Peringatan Kwan Im (9/19)', faith: 'khonghucu' },
  { month: 12, day: 24, id: 'ji-si-sang-sin', name: 'Ji Si Sang Sin (Sembahyang Dapur)', faith: 'khonghucu' },
];

const HIJRI_RULES = [
  { month: 1, day: 1, id: 'tahun-baru-islam', name: 'Tahun Baru Islam (1 Muharram)', faith: 'islam' },
  { month: 1, day: 10, id: 'asyura', name: 'Hari Asyura (10 Muharram)', faith: 'islam' },
  { month: 3, day: 12, id: 'maulid', name: 'Maulid Nabi Muhammad SAW', faith: 'islam' },
  { month: 7, day: 27, id: 'isra-mikraj', name: 'Isra Mikraj', faith: 'islam' },
  { month: 9, day: 1, id: 'awal-ramadan', name: 'Awal Ramadan', faith: 'islam' },
  { month: 10, day: 1, id: 'idulfitri', name: 'Idulfitri (1 Syawal)', faith: 'islam' },
  { month: 12, day: 9, id: 'arafah', name: 'Hari Arafah', faith: 'islam' },
  { month: 12, day: 10, id: 'iduladha', name: 'Iduladha (10 Zulhijah)', faith: 'islam' },
];

function fixedAndMovable(year) {
  const easterDate = easter(year);
  const christmas = new Date(year, 11, 25);
  const firstAdvent = addDays(christmas, -((christmas.getDay() || 7) + 21));
  return [
    { date: addDays(easterDate, -46), id: 'rabu-abu', name: 'Rabu Abu (awal Prapaskah)', faith: 'katolik' },
    { date: addDays(easterDate, -7), id: 'minggu-palma', name: 'Minggu Palma', faith: 'kristen' },
    { date: addDays(easterDate, -3), id: 'kamis-putih', name: 'Kamis Putih', faith: 'kristen' },
    { date: addDays(easterDate, -2), id: 'jumat-agung', name: 'Jumat Agung (Wafat Isa Almasih)', faith: 'kristen' },
    { date: easterDate, id: 'paskah', name: 'Paskah', faith: 'kristen' },
    { date: addDays(easterDate, 39), id: 'kenaikan', name: 'Kenaikan Isa Almasih', faith: 'kristen' },
    { date: addDays(easterDate, 49), id: 'pentakosta', name: 'Pentakosta', faith: 'kristen' },
    { date: new Date(year, 7, 15), id: 'maria-diangkat', name: 'Maria Diangkat ke Surga', faith: 'katolik' },
    { date: new Date(year, 9, 31), id: 'reformasi', name: 'Hari Reformasi', faith: 'protestan' },
    { date: new Date(year, 10, 1), id: 'semua-orang-kudus', name: 'Hari Raya Semua Orang Kudus', faith: 'katolik' },
    { date: new Date(year, 10, 2), id: 'arwah', name: 'Peringatan Arwah Semua Orang Beriman', faith: 'katolik' },
    { date: firstAdvent, id: 'adven', name: 'Minggu Adven I', faith: 'kristen' },
    { date: christmas, id: 'natal', name: 'Natal', faith: 'kristen' },
    { date: solarTermDate(year, 15, 2), id: 'ceng-beng', name: 'Ceng Beng (Qingming)', faith: 'khonghucu' },
    { date: solarTermDate(year, 270, 11), id: 'tang-ce', name: 'Tang Ce (Dongzhi, onde)', faith: 'khonghucu' },
  ].filter((holiday) => holiday.date);
}

function pawukonHolidays(start, end) {
  const results = [];
  const startUtc = utcDay(start);
  const cycle = 210 * DAY;
  let galungan = GALUNGAN_ANCHOR + Math.floor((startUtc - GALUNGAN_ANCHOR) / cycle) * cycle - cycle;
  while (galungan < utcDay(end) + cycle) {
    const base = new Date(galungan);
    const local = new Date(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate());
    results.push(
      { date: local, id: 'galungan', name: 'Galungan', faith: 'hindu' },
      { date: addDays(local, 10), id: 'kuningan', name: 'Kuningan', faith: 'hindu' },
      { date: addDays(local, 136), id: 'saraswati', name: 'Hari Saraswati', faith: 'hindu' },
      { date: addDays(local, 140), id: 'pagerwesi', name: 'Pagerwesi', faith: 'hindu' },
    );
    galungan += cycle;
  }
  return results;
}

// Main entry: list of holy days from `start` for `days` days.
// overrides: [{ date: 'YYYY-MM-DD', id, name, faith, official: true }]
export function holyDays(start = new Date(), days = 400, overrides = []) {
  const from = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const until = addDays(from, days);
  const found = [];

  for (let i = 0; i <= days; i++) {
    const date = addDays(from, i);
    const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
    const lunar = chineseDate(noon);
    if (!lunar.leap) {
      LUNAR_RULES.forEach((rule) => {
        if (rule.month === lunar.month && rule.day === lunar.day) {
          found.push({ ...rule, date, estimated: true, basis: 'Kalender Imlek (perhitungan)' });
        }
      });
    }
    const hijri = hijriDate(noon);
    HIJRI_RULES.forEach((rule) => {
      if (rule.month === hijri.month && rule.day === hijri.day) {
        found.push({
          ...rule,
          date,
          estimated: true,
          basis: 'Perkiraan Umm al-Qura; tanggal resmi mengikuti sidang isbat Kemenag dan bisa berbeda antar-ormas',
        });
      }
    });
  }

  for (let year = from.getFullYear(); year <= until.getFullYear(); year++) {
    fixedAndMovable(year).forEach((holiday) => {
      found.push({ ...holiday, estimated: false, basis: 'Perhitungan kalender liturgi / astronomi' });
    });
  }
  pawukonHolidays(from, until).forEach((holiday) => {
    found.push({ ...holiday, estimated: true, basis: 'Siklus Pawukon 210 hari' });
  });

  // Official overrides replace computed entries with the same id in the same year.
  overrides.forEach((override) => {
    const [y, m, d] = override.date.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    // Imlek anchors the whole first lunar month (King Thi Kong, Cap Go Meh, ...).
    // Browser calendars can be a day off when the new moon falls near midnight Beijing time.
    if (override.id === 'imlek') {
      found.forEach((candidate) => {
        const sameLunarYear = candidate.month === 1 && candidate.faith === 'khonghucu'
          && Math.abs(candidate.date - date) < 25 * DAY;
        if (sameLunarYear && candidate.id !== 'imlek') {
          candidate.date = addDays(date, candidate.day - 1);
          candidate.estimated = false;
          candidate.basis = 'Dihitung dari tanggal resmi Imlek';
        }
      });
    }
    for (let i = found.length - 1; i >= 0; i--) {
      const candidate = found[i];
      const sameEvent = candidate.id === override.id;
      const closeInTime = Math.abs(candidate.date - date) < 20 * DAY;
      if (sameEvent && closeInTime) {
        found.splice(i, 1);
      }
    }
    found.push({ ...override, date, estimated: false, basis: override.basis || 'Tanggal resmi (SKB 3 Menteri)' });
  });

  return found
    .filter((holiday) => holiday.date >= from && holiday.date <= until)
    .sort((a, b) => a.date - b.date);
}

// Festive window: from 3 days before until 2 days after a holy day of this faith.
export function festiveHoliday(faithId, overrides = [], festiveMap = {}, today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2);
  const list = holyDays(start, 6, overrides).filter((h) => matchesFaith(h, faithId) && festiveMap[h.id]);
  return list[0] || null;
}

export function todaySummary(date = new Date()) {
  const lunar = chineseDate(date);
  const hijri = hijriDate(date);
  const bali = pawukon(date);
  return {
    lunar: `${lunar.day} bulan ${lunar.leap ? 'kabisat ' : ''}${lunar.month} Imlek ${lunar.year + 551} Kongzili`,
    hijri: `${hijri.day} ${HIJRI_MONTHS[hijri.month - 1] || ''} ${hijri.year} H (perkiraan)`,
    pawukon: `Wuku ${bali.wuku}, ${bali.pancawara}`,
    lunarParts: lunar,
  };
}

export function matchesFaith(holiday, faithId) {
  if (!faithId) {
    return true;
  }
  if (holiday.faith === faithId) {
    return true;
  }
  if (holiday.faith === 'kristen' && (faithId === 'katolik' || faithId === 'protestan')) {
    return true;
  }
  return false;
}
