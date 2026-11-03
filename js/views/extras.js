// Extra personal tools: private gratitude journal (Jurnal Syukur) and greeting cards (Kartu Ucapan).

import { prefs, load, save } from '../store.js';
import { esc, toast, formatDate, formatShortDate, relativeDays, uid } from '../ui.js';
import { holyDays } from '../calendar.js';
import { GREETINGS, drawGreetingCard, shareOrDownload, faithForHoliday, decorForHoliday } from '../card.js';
import { TRADITIONS, CALENDARS, defaultTradition, parseYmd, describeDeathDate, memorialSchedule, upcomingAnniversaries } from '../memorial.js';
import { buildIcs } from './tools.js';

// ---------- Jurnal Syukur ----------
// Local-only, no streaks, no counts, no reminders that guilt the user.
const JOURNAL_KEY = 'journal';

const PROMPTS = {
  umum: [
    'Satu hal kecil yang membuat hari ini terasa ringan…',
    'Seseorang yang ingin saya doakan atau terima kasihi hari ini…',
    'Sesuatu yang saya pelajari hari ini…',
    'Momen tenang yang saya sadari hari ini…',
    'Hal yang ingin saya lepaskan sebelum tidur…',
  ],
  islam: ['Nikmat Allah yang saya sadari hari ini…'],
  protestan: ['Berkat Tuhan yang saya syukuri hari ini…'],
  katolik: ['Rahmat yang saya terima hari ini (refleksi examen)…'],
  hindu: ['Anugerah Ida Sang Hyang Widhi yang saya rasakan hari ini…'],
  buddha: ['Kebajikan kecil yang saya lakukan atau terima hari ini…'],
  khonghucu: ['Bakti dan kebajikan yang saya jalani hari ini…'],
  alam: ['Keindahan alam yang saya perhatikan hari ini…'],
};

function journalEntries() {
  return load(JOURNAL_KEY, []);
}

function pickPrompt(faithId) {
  const list = [...(PROMPTS[faithId] || []), ...PROMPTS.umum];
  const dayIndex = Math.floor(Date.now() / 86400000);
  return list[dayIndex % list.length];
}

export function journal(main) {
  const faithId = prefs.get().faith || 'alam';
  const render = () => {
    const entries = journalEntries();
    main.innerHTML = `
      <section class="stack narrow">
        <h1 class="h2">Jurnal Syukur</h1>
        <p class="muted small">Catatan pribadi, hanya tersimpan di perangkat ini. Tidak ada hitungan hari, target, atau poin — tulis kapan saja Anda mau.</p>
        <form class="card" data-journal-form>
          <label for="journal-text" class="small muted">${esc(pickPrompt(faithId))}</label>
          <textarea id="journal-text" rows="4" maxlength="2000" required placeholder="Tulis dengan bebas…"></textarea>
          <div class="row">
            <button class="btn" type="submit">Simpan</button>
          </div>
        </form>
        ${entries.length ? `
        <ul class="journal-list">
          ${entries.map((item) => `
            <li class="card">
              <span class="small muted">${esc(formatDate(new Date(item.created)))}</span>
              <p class="journal-text">${esc(item.text)}</p>
              <div class="row"><button class="btn-ghost small danger" type="button" data-delete="${esc(item.id)}">Hapus</button></div>
            </li>`).join('')}
        </ul>` : '<p class="muted small">Belum ada catatan. Tidak apa-apa.</p>'}
        <p class="small muted">Cadangkan atau hapus semua catatan lewat <a href="#/pengaturan">Pengaturan</a>.</p>
      </section>`;
    main.querySelector('[data-journal-form]').addEventListener('submit', (event) => {
      event.preventDefault();
      const textarea = main.querySelector('#journal-text');
      const text = textarea.value.trim();
      if (!text) {
        return;
      }
      const next = [{ id: uid(), created: Date.now(), text }, ...journalEntries()];
      if (!save(JOURNAL_KEY, next)) {
        toast('Penyimpanan perangkat penuh.');
        return;
      }
      toast('Tersimpan di perangkat ini.');
      render();
    });
    main.querySelectorAll('[data-delete]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!confirm('Hapus catatan ini?')) {
          return;
        }
        save(JOURNAL_KEY, journalEntries().filter((item) => item.id !== button.dataset.delete));
        render();
      });
    });
  };
  render();
}

// ---------- Kartu Ucapan ----------
export function upcomingGreetable(content, days = 400) {
  return holyDays(new Date(), days, content.calendarOverrides).filter((h) => GREETINGS[h.id]);
}

export function greetingCard(main, [holidayId], query, { content }) {
  const options = upcomingGreetable(content);
  const seen = new Set();
  const unique = options.filter((h) => {
    if (seen.has(h.id)) {
      return false;
    }
    seen.add(h.id);
    return true;
  });
  const selected = unique.find((h) => h.id === holidayId) || unique[0];
  if (!selected) {
    main.innerHTML = '<section class="stack narrow"><h1 class="h2">Kartu Ucapan</h1><p class="muted">Tidak ada hari raya dalam waktu dekat.</p></section>';
    return;
  }
  const faith = faithForHoliday(content, selected);
  const guest = prefs.get().guestName || '';
  main.innerHTML = `
    <section class="stack narrow">
      <h1 class="h2">Kartu Ucapan</h1>
      <p class="muted small">Buat kartu ucapan untuk teman, tetangga, atau rekan yang merayakan. Gambar dibuat di perangkat Anda.</p>
      <label class="small muted" for="card-holiday">Hari raya</label>
      <select id="card-holiday">
        ${unique.map((h) => `<option value="${esc(h.id)}" ${h.id === selected.id ? 'selected' : ''}>${esc(h.name)} · ${formatShortDate(h.date)} (${relativeDays(h.date)})</option>`).join('')}
      </select>
      <label class="small muted" for="card-greeting">Ucapan</label>
      <textarea id="card-greeting" rows="2" maxlength="140">${esc(GREETINGS[selected.id])}</textarea>
      <div class="row">
        <input id="card-to" type="text" maxlength="40" placeholder="Untuk (opsional)" aria-label="Untuk">
        <input id="card-from" type="text" maxlength="40" placeholder="Dari (opsional)" aria-label="Dari" value="">
      </div>
      <canvas class="card-canvas" aria-label="Pratinjau kartu ucapan"></canvas>
      <div class="row">
        <button class="btn" type="button" data-share>Bagikan / Unduh</button>
        <a class="btn-ghost" href="#/pustaka/lintas">Etiket hari raya</a>
      </div>
      <p class="small muted">Tip: ucapan sederhana dan tulus selalu baik. Nama tamu Anda di Jeda (${esc(guest || '—')}) tidak dicantumkan otomatis.</p>
    </section>`;
  const canvas = main.querySelector('canvas');
  const fields = ['#card-greeting', '#card-to', '#card-from'].map((selector) => main.querySelector(selector));
  let drawing = Promise.resolve();
  const redraw = () => {
    drawing = drawGreetingCard(canvas, {
      holidayName: selected.name,
      greeting: fields[0].value.trim(),
      to: fields[1].value.trim(),
      from: fields[2].value.trim(),
      color: faith ? faith.color : null,
      scene: faith ? faith.scene : 'alam',
      decor: decorForHoliday(selected.id),
      dateLabel: formatDate(selected.date),
    });
    return drawing;
  };
  fields.forEach((field) => field.addEventListener('input', redraw));
  main.querySelector('#card-holiday').addEventListener('change', (event) => {
    location.hash = `#/kartu/${event.target.value}`;
  });
  main.querySelector('[data-share]').addEventListener('click', async () => {
    await drawing;
    try {
      const result = await shareOrDownload(canvas, `jeda-ucapan-${selected.id}.png`, fields[0].value.trim());
      if (result === 'downloaded') {
        toast('Gambar kartu diunduh.');
      }
    } catch {
      toast('Maaf, kartu tidak dapat dibuat di peramban ini.');
    }
  });
  redraw();
}

// ---------- Peringatan Arwah ----------
// Device-only list of loved ones who have passed, with customary memorial dates.
const MEMORIAL_KEY = 'memorials';

function memorials() {
  return load(MEMORIAL_KEY, []);
}

function todayYmd() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function memorialCard(memorial, overrides) {
  const tradition = TRADITIONS[memorial.tradition] || TRADITIONS.tionghoa;
  const deathDate = parseYmd(memorial.date);
  const info = describeDeathDate(deathDate);
  const fullSchedule = memorialSchedule(memorial, new Date(), overrides);
  const schedule = [
    ...fullSchedule.filter((item) => item.kind === 'series').slice(0, 5),
    ...fullSchedule.filter((item) => item.kind === 'anniversary'),
  ].sort((a, b) => a.date - b.date);
  return `
    <li class="card memorial" data-id="${esc(memorial.id)}">
      <strong>${esc(memorial.name)}</strong>
      <span class="small muted">Wafat ${esc(formatDate(deathDate))} · ${esc(info.lunarLabel)} · ${esc(info.hijriLabel)}</span>
      <span class="small muted">${esc(tradition.label)} · ${esc(CALENDARS[memorial.calendar])}</span>
      ${schedule.length ? `
      <ul class="holy-list">
        ${schedule.map((item) => `<li>
          <span>${esc(item.label)}</span>
          <span class="small muted">${formatShortDate(item.date)} · ${relativeDays(item.date)}${item.estimated ? ' · perkiraan ±1 hari, cocokkan dengan kalender cetak' : ''}${item.adjusted ? ' · bulan pendek, memakai hari terakhir' : ''}</span>
        </li>`).join('')}
      </ul>` : '<span class="small muted">Tidak ada tanggal mendatang.</span>'}
      <details class="small"><summary>Tentang kebiasaan ini</summary><p>${esc(tradition.note)}</p>
        <p><a href="#/entri/${esc(tradition.entry)}">Baca di Pustaka</a></p></details>
      <div class="row">
        <button class="btn-ghost small" type="button" data-ics="${esc(memorial.id)}">📅 Simpan ke kalender</button>
        <button class="btn-ghost small danger" type="button" data-remove="${esc(memorial.id)}">Hapus</button>
      </div>
    </li>`;
}

export function memorialView(main, params, query, { content }) {
  const overrides = content.calendarOverrides || [];
  const faithId = prefs.get().faith;
  const render = () => {
    const list = memorials();
    const tradition = defaultTradition(faithId);
    main.innerHTML = `
      <section class="stack narrow">
        <h1 class="h2">Peringatan Arwah</h1>
        <p class="muted small">Mengingat orang tercinta yang telah berpulang: hari ke-7, 49, 100, tahlilan, misa arwah, dan peringatan tahunan menurut tanggal Imlek, Hijriah, atau Masehi. Tersimpan hanya di perangkat ini.</p>
        <form class="card" data-memorial-form>
          <label class="small muted" for="mem-name">Nama almarhum/almarhumah</label>
          <input id="mem-name" type="text" maxlength="80" required placeholder="mis. Kong Tan Hok Liong / Ibu Siti">
          <label class="small muted" for="mem-date">Tanggal wafat (Masehi)</label>
          <input id="mem-date" type="date" required max="${todayYmd()}">
          <label class="small muted" for="mem-tradition">Kebiasaan keluarga</label>
          <select id="mem-tradition">
            ${Object.entries(TRADITIONS).map(([id, t]) => `<option value="${id}" ${id === tradition ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}
          </select>
          <label class="small muted" for="mem-calendar">Peringatan tahunan memakai</label>
          <select id="mem-calendar">
            ${Object.entries(CALENDARS).map(([id, label]) => `<option value="${id}" ${id === TRADITIONS[tradition].calendar ? 'selected' : ''}>${esc(label)}</option>`).join('')}
          </select>
          <p class="small muted">Hari wafat dihitung sebagai hari ke-1 (kebiasaan umum). Jika keluarga Anda menghitung berbeda, geser satu hari.</p>
          <div class="row"><button class="btn" type="submit">Simpan</button></div>
        </form>
        ${list.length ? `<ul class="journal-list">${list.map((memorial) => memorialCard(memorial, overrides)).join('')}</ul>` : ''}
        <p class="small muted">Tanggal Hijriah memakai perhitungan Umm al-Qura dan dapat berbeda ±1 hari dari kalender Kemenag/ormas. Tanggal Imlek mengikuti kalender lunar Tionghoa standar.</p>
      </section>`;

    const traditionSelect = main.querySelector('#mem-tradition');
    traditionSelect.addEventListener('change', () => {
      main.querySelector('#mem-calendar').value = TRADITIONS[traditionSelect.value].calendar;
    });
    main.querySelector('[data-memorial-form]').addEventListener('submit', (event) => {
      event.preventDefault();
      const name = main.querySelector('#mem-name').value.trim();
      const date = main.querySelector('#mem-date').value;
      if (!name || !parseYmd(date)) {
        toast('Isi nama dan tanggal wafat.');
        return;
      }
      const memorial = {
        id: uid(),
        name,
        date,
        tradition: traditionSelect.value,
        calendar: main.querySelector('#mem-calendar').value,
        created: Date.now(),
      };
      save(MEMORIAL_KEY, [...memorials(), memorial]);
      toast('Tersimpan di perangkat ini.');
      render();
    });
    main.querySelectorAll('[data-remove]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!confirm('Hapus peringatan ini dari perangkat?')) {
          return;
        }
        save(MEMORIAL_KEY, memorials().filter((item) => item.id !== button.dataset.remove));
        render();
      });
    });
    main.querySelectorAll('[data-ics]').forEach((button) => {
      button.addEventListener('click', () => {
        const memorial = memorials().find((item) => item.id === button.dataset.ics);
        if (!memorial) {
          return;
        }
        const series = memorialSchedule(memorial, new Date(), overrides).filter((item) => item.kind === 'series');
        const yearly = upcomingAnniversaries(memorial, 5, new Date(), overrides);
        const events = [
          ...series.map((item, index) => ({ id: `mem-${memorial.id}-s${index}`, date: item.date, name: `${item.label}: ${memorial.name}` })),
          ...yearly.map((item, index) => ({
            id: `mem-${memorial.id}-y${index}`,
            date: item.date,
            name: `Peringatan tahunan: ${memorial.name}`,
            estimated: item.estimated,
            basis: CALENDARS[memorial.calendar],
          })),
        ];
        const blob = new Blob([buildIcs(events, `Peringatan ${memorial.name}`)], { type: 'text/calendar' });
        const anchor = document.createElement('a');
        anchor.href = URL.createObjectURL(blob);
        anchor.download = 'jeda-peringatan.ics';
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(anchor.href), 2000);
        toast('Buka berkas .ics untuk menambahkan ke kalender HP.');
      });
    });
  };
  render();
}
