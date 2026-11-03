// Memorial day calculator (Peringatan Arwah): customary day-series after a death and
// yearly anniversaries in the Chinese lunar, Hijri, or Gregorian calendar.
// Customs vary by family, region and organisation; every series is labelled as "kebiasaan umum".

import { chineseDate, hijriDate, HIJRI_MONTHS } from './calendar.js';

// Day N counts the day of death as day 1 (common Javanese and Chinese practice),
// so "hari ke-7" = date of death + 6 days.
export const TRADITIONS = {
  tionghoa: {
    label: 'Adat Tionghoa (Khonghucu / Tri Dharma)',
    days: [7, 14, 21, 28, 35, 42, 49, 100],
    calendar: 'imlek',
    note: 'Sembahyang tiap 7 hari sampai hari ke-49, lalu 100 hari; peringatan tahunan (ki-jit) menurut tanggal Imlek. Masa berkabung sering diakhiri pada tahun ketiga. Jadwal persis berbeda tiap keluarga dan kelompok dialek.',
    entry: 'khc-siklus-kematian',
  },
  'islam-tahlilan': {
    label: 'Islam — tradisi tahlilan (Jawa / NU)',
    days: [3, 7, 40, 100, 1000],
    calendar: 'hijriah',
    note: 'Tahlilan hari ke-3, 7, 40, 100, dan 1000 serta haul tahunan adalah tradisi di sebagian masyarakat (terutama NU dan adat Jawa). Sebagian organisasi, misalnya Muhammadiyah, tidak menganjurkannya sebagai ritual. Ikuti keyakinan keluarga.',
    entry: 'isl-siklus-tahlilan-haul',
  },
  islam: {
    label: 'Islam — tanpa rangkaian hari',
    days: [],
    calendar: 'hijriah',
    note: 'Mendoakan almarhum dapat dilakukan kapan saja. Tanggal tahunan hanya pengingat pribadi.',
    entry: 'isl-siklus-jenazah',
  },
  katolik: {
    label: 'Katolik',
    days: [3, 7, 40, 100, 1000],
    calendar: 'masehi',
    note: 'Misa arwah atau doa arwah sering diadakan pada hari ke-3, 7, 40, 100 (dan di sebagian keluarga Jawa hari ke-1000), serta setiap tahun. Juga Peringatan Arwah Semua Orang Beriman setiap 2 November.',
    entry: 'kat-siklus-misa-arwah',
  },
  protestan: {
    label: 'Kristen Protestan',
    days: [],
    calendar: 'masehi',
    note: 'Umumnya kebaktian penghiburan pada hari-hari pertama; peringatan tahunan bersifat pribadi/keluarga dan berbeda tiap gereja.',
    entry: 'pro-siklus-kematian',
  },
  buddha: {
    label: 'Buddha',
    days: [7, 49, 100],
    calendar: 'masehi',
    note: 'Pelimpahan jasa (pattidana) sering dilakukan pada hari ke-7, 49, dan 100 serta setiap tahun; keluarga Tionghoa Buddhis kerap memakai tanggal Imlek.',
    entry: 'bud-ibadah-pattidana',
  },
  hindu: {
    label: 'Hindu',
    days: [],
    calendar: 'masehi',
    note: 'Waktu upacara ngaben, nyekah/memukur ditentukan menurut dewasa ayu oleh sulinggih/pemangku, bukan hitungan hari tetap. Tanggal tahunan di sini hanya pengingat pribadi.',
    entry: 'hin-siklus-ngaben',
  },
};

export const CALENDARS = {
  imlek: 'Tanggal Imlek',
  hijriah: 'Tanggal Hijriah',
  masehi: 'Tanggal Masehi',
};

export function defaultTradition(faithId) {
  const map = {
    khonghucu: 'tionghoa',
    islam: 'islam-tahlilan',
    katolik: 'katolik',
    protestan: 'protestan',
    buddha: 'buddha',
    hindu: 'hindu',
  };
  return map[faithId] || 'tionghoa';
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function parseYmd(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

export function daySeries(deathDate, traditionId) {
  const tradition = TRADITIONS[traditionId];
  if (!tradition) {
    return [];
  }
  return tradition.days.map((day) => ({
    label: `Hari ke-${day}`,
    date: addDays(deathDate, day - 1),
  }));
}

// Find the next Gregorian date (on/after `from`) matching a lunar or Hijri month/day.
// If the month is short (no day 30 that year), use the last day of that month.
function nextMatching(getParts, month, day, from, ignoreLeap) {
  let candidateShort = null;
  for (let offset = 0; offset < 400; offset++) {
    const date = addDays(from, offset);
    const parts = getParts(date);
    if (ignoreLeap && parts.leap) {
      continue;
    }
    if (parts.month === month && parts.day === day) {
      return { date, adjusted: false };
    }
    if (parts.month === month && day === 30 && parts.day === 29) {
      candidateShort = date;
    }
    if (candidateShort && parts.month !== month) {
      return { date: candidateShort, adjusted: true };
    }
  }
  return candidateShort ? { date: candidateShort, adjusted: true } : null;
}

export function describeDeathDate(deathDate) {
  const lunar = chineseDate(deathDate);
  const hijri = hijriDate(deathDate);
  return {
    lunar,
    hijri,
    lunarLabel: `${lunar.day} bulan ${lunar.leap ? 'kabisat ' : ''}${lunar.month} Imlek`,
    hijriLabel: `${hijri.day} ${HIJRI_MONTHS[hijri.month - 1] || ''} ${hijri.year} H`,
  };
}

// Official Imlek dates (from content/calendar.json overrides) can differ by a day from the
// browser's Chinese calendar (e.g. 2027: official 6 Feb, ICU 7 Feb). Returns the day shift to
// apply to dates in lunar month 1 of the Gregorian year `year`.
export function lunarMonthOneShift(year, overrides = []) {
  const official = overrides.find((o) => o.id === 'imlek' && String(o.date).startsWith(`${year}-`));
  if (!official) {
    return 0;
  }
  const officialDate = parseYmd(official.date);
  for (let date = new Date(year, 0, 15); date <= new Date(year, 1, 25); date = addDays(date, 1)) {
    const parts = chineseDate(date);
    if (parts.month === 1 && parts.day === 1 && !parts.leap) {
      return Math.round((officialDate - date) / 86400000);
    }
  }
  return 0;
}

// Next yearly anniversary on/after `from` (default today), in the chosen calendar.
export function nextAnniversary(deathDate, calendarId, from = new Date(), overrides = []) {
  const today = startOfDay(from);
  if (calendarId === 'masehi') {
    let year = today.getFullYear();
    let date = new Date(year, deathDate.getMonth(), deathDate.getDate());
    if (date.getMonth() !== deathDate.getMonth()) {
      date = new Date(year, deathDate.getMonth() + 1, 0); // 29 Feb in non-leap years -> 28 Feb
    }
    if (date < today) {
      year += 1;
      date = new Date(year, deathDate.getMonth(), deathDate.getDate());
      if (date.getMonth() !== deathDate.getMonth()) {
        date = new Date(year, deathDate.getMonth() + 1, 0);
      }
    }
    return { date, adjusted: false, estimated: false };
  }
  const { lunar, hijri } = describeDeathDate(deathDate);
  // A death in a leap lunar month is commemorated in the regular month of the same number.
  const found = calendarId === 'imlek'
    ? nextMatching(chineseDate, lunar.month, lunar.day, today, true)
    : nextMatching(hijriDate, hijri.month, hijri.day, today, false);
  if (!found) {
    return null;
  }
  if (calendarId === 'imlek' && lunar.month === 1) {
    const shift = lunarMonthOneShift(found.date.getFullYear(), overrides);
    if (shift) {
      found.date = addDays(found.date, shift);
      if (found.date < today) {
        return nextAnniversary(deathDate, calendarId, addDays(today, 20), overrides);
      }
    }
  }
  // Both lunar and Hijri dates are computed, so they are labelled as estimates (±1 day).
  return { ...found, estimated: true };
}

// All upcoming dates for one memorial (series dates still ahead + next anniversary).
export function memorialSchedule(memorial, from = new Date(), overrides = []) {
  const deathDate = parseYmd(memorial.date);
  if (!deathDate) {
    return [];
  }
  const today = startOfDay(from);
  const items = daySeries(deathDate, memorial.tradition)
    .filter((item) => item.date >= today)
    .map((item) => ({ ...item, kind: 'series' }));
  const searchFrom = today > deathDate ? today : addDays(deathDate, 1);
  const anniversary = nextAnniversary(deathDate, memorial.calendar, searchFrom, overrides);
  if (anniversary) {
    const years = anniversaryYears(deathDate, anniversary.date, memorial.calendar);
    items.push({
      label: `Peringatan tahunan${years ? ` ke-${years}` : ''} (${CALENDARS[memorial.calendar]})`,
      date: anniversary.date,
      kind: 'anniversary',
      estimated: anniversary.estimated,
      adjusted: anniversary.adjusted,
    });
  }
  return items.sort((a, b) => a.date - b.date);
}

function anniversaryYears(deathDate, anniversaryDate, calendarId) {
  if (calendarId === 'imlek') {
    return chineseDate(anniversaryDate).year - chineseDate(deathDate).year;
  }
  if (calendarId === 'hijriah') {
    return hijriDate(anniversaryDate).year - hijriDate(deathDate).year;
  }
  return anniversaryDate.getFullYear() - deathDate.getFullYear();
}

// The next `count` yearly anniversaries (for calendar export).
export function upcomingAnniversaries(memorial, count = 3, from = new Date(), overrides = []) {
  const deathDate = parseYmd(memorial.date);
  if (!deathDate) {
    return [];
  }
  const results = [];
  let cursor = startOfDay(from) > deathDate ? startOfDay(from) : addDays(deathDate, 1);
  while (results.length < count) {
    const found = nextAnniversary(deathDate, memorial.calendar, cursor, overrides);
    if (!found) {
      break;
    }
    results.push(found);
    cursor = addDays(found.date, 1);
  }
  return results;
}
