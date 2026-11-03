// Extra personal tools: private gratitude journal (Jurnal Syukur) and greeting cards (Kartu Ucapan).

import { prefs, load, save } from '../store.js';
import { esc, toast, formatDate, formatShortDate, relativeDays, uid } from '../ui.js';
import { holyDays } from '../calendar.js';
import { GREETINGS, drawGreetingCard, shareOrDownload, faithForHoliday, decorForHoliday } from '../card.js';

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
