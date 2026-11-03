// Prayer time estimates using parameters commonly attributed to Kemenag RI:
// Subuh at sun depression 20°, Isya 18°, Ashar shadow factor 1 (Syafi'i), ihtiyat +2 minutes,
// Imsak 10 minutes before Subuh. Always defer to the official Kemenag schedule.

export const CITIES = [
  { id: 'banda-aceh', name: 'Banda Aceh', lat: 5.5483, lng: 95.3238, tz: 7 },
  { id: 'medan', name: 'Medan', lat: 3.5952, lng: 98.6722, tz: 7 },
  { id: 'pekanbaru', name: 'Pekanbaru', lat: 0.5071, lng: 101.4478, tz: 7 },
  { id: 'batam', name: 'Batam', lat: 1.0456, lng: 104.0305, tz: 7 },
  { id: 'palembang', name: 'Palembang', lat: -2.9761, lng: 104.7754, tz: 7 },
  { id: 'pangkalpinang', name: 'Pangkalpinang', lat: -2.1316, lng: 106.1169, tz: 7 },
  { id: 'jakarta', name: 'Jakarta', lat: -6.2088, lng: 106.8456, tz: 7 },
  { id: 'tangerang', name: 'Tangerang', lat: -6.1783, lng: 106.6319, tz: 7 },
  { id: 'bandung', name: 'Bandung', lat: -6.9175, lng: 107.6191, tz: 7 },
  { id: 'semarang', name: 'Semarang', lat: -6.9667, lng: 110.4167, tz: 7 },
  { id: 'yogyakarta', name: 'Yogyakarta', lat: -7.7956, lng: 110.3695, tz: 7 },
  { id: 'surabaya', name: 'Surabaya', lat: -7.2575, lng: 112.7521, tz: 7 },
  { id: 'malang', name: 'Malang', lat: -7.9666, lng: 112.6326, tz: 7 },
  { id: 'pontianak', name: 'Pontianak', lat: -0.0263, lng: 109.3425, tz: 7 },
  { id: 'singkawang', name: 'Singkawang', lat: 0.9060, lng: 108.9848, tz: 7 },
  { id: 'denpasar', name: 'Denpasar', lat: -8.6705, lng: 115.2126, tz: 8 },
  { id: 'banjarmasin', name: 'Banjarmasin', lat: -3.3186, lng: 114.5944, tz: 8 },
  { id: 'balikpapan', name: 'Balikpapan', lat: -1.2379, lng: 116.8529, tz: 8 },
  { id: 'makassar', name: 'Makassar', lat: -5.1477, lng: 119.4327, tz: 8 },
  { id: 'manado', name: 'Manado', lat: 1.4748, lng: 124.8421, tz: 8 },
  { id: 'kupang', name: 'Kupang', lat: -10.1772, lng: 123.6070, tz: 8 },
  { id: 'ambon', name: 'Ambon', lat: -3.6954, lng: 128.1814, tz: 9 },
  { id: 'jayapura', name: 'Jayapura', lat: -2.5337, lng: 140.7181, tz: 9 },
];

const rad = Math.PI / 180;
const deg = 180 / Math.PI;

function fixHour(hours) {
  return ((hours % 24) + 24) % 24;
}

function julianDate(year, month, day) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
}

function sunPosition(jd) {
  const d = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * d) * rad;
  const q = 280.459 + 0.98564736 * d;
  const l = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad;
  const e = (23.439 - 0.00000036 * d) * rad;
  const rightAscension = Math.atan2(Math.cos(e) * Math.sin(l), Math.cos(l)) * deg / 15;
  const equationOfTime = q / 15 - fixHour(rightAscension);
  const declination = Math.asin(Math.sin(e) * Math.sin(l));
  return { declination, equationOfTime: ((equationOfTime + 12) % 24 + 24) % 24 - 12 };
}

export function prayerTimes(date, { lat, lng, tz }) {
  const jd = julianDate(date.getFullYear(), date.getMonth() + 1, date.getDate()) - lng / (15 * 24);
  const latRad = lat * rad;

  const midDay = (fraction) => {
    const { equationOfTime } = sunPosition(jd + fraction);
    return fixHour(12 - equationOfTime);
  };

  const sunAngleTime = (angleDegrees, fraction, beforeNoon) => {
    const { declination } = sunPosition(jd + fraction);
    const noon = midDay(fraction);
    const cosine = (-Math.sin(angleDegrees * rad) - Math.sin(declination) * Math.sin(latRad))
      / (Math.cos(declination) * Math.cos(latRad));
    const hourAngle = Math.acos(Math.min(1, Math.max(-1, cosine))) * deg / 15;
    return noon + (beforeNoon ? -hourAngle : hourAngle);
  };

  const asrTime = (factor, fraction) => {
    const { declination } = sunPosition(jd + fraction);
    const angle = -Math.atan(1 / (factor + Math.tan(Math.abs(latRad - declination)))) * deg;
    return sunAngleTime(angle, fraction, false);
  };

  // First pass with default guesses, then the result (local solar hours).
  const fajr = sunAngleTime(20, 5 / 24, true);
  const sunrise = sunAngleTime(0.833, 6 / 24, true);
  const dhuhr = midDay(12 / 24);
  const asr = asrTime(1, 13 / 24);
  const maghrib = sunAngleTime(0.833, 18 / 24, false);
  const isha = sunAngleTime(18, 18 / 24, false);

  const toClock = (solarHours, adjustMinutes = 0) => {
    const local = solarHours + tz - lng / 15 + adjustMinutes / 60;
    const fixed = fixHour(local);
    const totalMinutes = Math.ceil(fixed * 60 - 1e-9);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, totalMinutes);
  };

  const ihtiyat = 2;
  const subuh = toClock(fajr, ihtiyat);
  return [
    { id: 'imsak', name: 'Imsak', time: new Date(subuh.getTime() - 10 * 60000) },
    { id: 'subuh', name: 'Subuh', time: subuh },
    { id: 'terbit', name: 'Terbit', time: toClock(sunrise, -ihtiyat) },
    { id: 'dzuhur', name: 'Dzuhur', time: toClock(dhuhr, ihtiyat) },
    { id: 'ashar', name: 'Ashar', time: toClock(asr, ihtiyat) },
    { id: 'maghrib', name: 'Maghrib', time: toClock(maghrib, ihtiyat) },
    { id: 'isya', name: 'Isya', time: toClock(isha, ihtiyat) },
  ];
}

export function formatClock(date) {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
}
