// Sacred space view: scene, rituals, upcoming holy days. Home mode or visit (observe) mode.

import { prefs, guestName } from '../store.js';
import { esc, formatShortDate, relativeDays, timeOfDay } from '../ui.js';
import { faithById, entryById } from '../content.js';
import { sceneSvg, FESTIVE } from '../scenes.js';
import { holyDays, matchesFaith, festiveHoliday } from '../calendar.js';
import { mountRitual, isDevotional } from './rituals.js';

export function space(main, [faithId], query, { content, navigate }) {
  const faith = faithById(content, faithId);
  if (!faith) {
    navigate('#/kunjungi');
    return undefined;
  }
  const userFaith = prefs.get().faith;
  const mode = !userFaith || userFaith === faith.id || faith.id === 'alam' ? 'home' : 'visit';
  document.body.dataset.faith = faith.id;

  const today = new Date();
  const festive = faith.id === 'alam' ? null : festiveHoliday(faith.id, content.calendarOverrides, FESTIVE);
  const festiveInfo = festive ? FESTIVE[festive.id] : null;
  const special = (faith.specialDays || []).find((day) => day.date === today.toISOString().slice(0, 10));
  const upcoming = faith.id === 'alam'
    ? []
    : holyDays(today, 180, content.calendarOverrides).filter((h) => matchesFaith(h, faith.id)).slice(0, 3);

  main.innerHTML = `
    <section class="space-hero" style="--accent:${faith.color}">
      ${sceneSvg(faith.scene, timeOfDay(), faith.spaceName, festiveInfo ? festiveInfo.decor : null)}
      <svg class="guest-figure" viewBox="0 0 40 40" aria-hidden="true">
        <ellipse cx="20" cy="37" rx="14" ry="2.5" fill="#000" opacity="0.35"/>
        <circle cx="20" cy="12" r="5" fill="#f1ebe3"/>
        <path d="M9 36 Q10 22 20 19 Q30 22 31 36 Z" fill="#f1ebe3"/>
      </svg>
      <div class="space-hero-text">
        <p class="small">${mode === 'visit' ? 'Mode Kunjungi & Kenali' : 'Ruangmu'}</p>
        <h1>${esc(faith.spaceName)}</h1>
        <p>${esc(faith.greeting)}</p>
        <p class="small guest-name">Kamu hadir sebagai <strong>${esc(guestName())}</strong></p>
      </div>
    </section>
    <section class="stack">
      ${special ? `<div class="notice">${esc(special.text)}</div>` : ''}
      ${festiveInfo ? `<div class="festive-banner">${esc(festiveInfo.text)} · ${esc(festive.name)}, ${formatShortDate(festive.date)}</div>` : ''}
      ${mode === 'visit' ? `
        <div class="card visit-tips">
          <h2 class="h3">Sebagai tamu yang hormat</h2>
          <ul>${(faith.visitTips || []).map((tip) => `<li>${esc(tip)}</li>`).join('')}</ul>
          <p class="small muted">Ritual di bawah ditampilkan sebagai demonstrasi untuk dipelajari.</p>
        </div>` : ''}
      ${faith.virtualNote ? `<p class="small muted note">${esc(faith.virtualNote)}</p>` : ''}

      <div class="ritual-grid">
        ${faith.rituals.map((ritual, index) => {
    const entry = ritual.entry ? entryById(content, ritual.entry) : null;
    return `
          <article class="card ritual" data-index="${index}" tabindex="-1">
            <header>
              <h2 class="h3">${esc(ritual.title)}</h2>
              ${ritual.desc ? `<p class="small muted">${esc(ritual.desc)}</p>` : ''}
            </header>
            <div class="ritual-body"></div>
            ${entry || ritual.about ? `
              <details class="about">
                <summary>Makna & tata cara</summary>
                ${ritual.about ? `<p>${esc(ritual.about)}</p>` : ''}
                ${entry ? `<p><a href="#/entri/${encodeURIComponent(entry.id)}">Baca di Pustaka: ${esc(entry.title)}</a>${entry.status !== 'approved' ? ' <span class="badge">draf</span>' : ''}</p>` : ''}
              </details>` : ''}
            ${mode === 'visit' && isDevotional(ritual) ? '' : ''}
          </article>`;
  }).join('')}
      </div>

      ${upcoming.length ? `
        <div class="card">
          <h2 class="h3">Hari suci mendatang</h2>
          <ul class="holy-list">
            ${upcoming.map((h) => `<li><span>${esc(h.name)}</span><span class="small muted">${formatShortDate(h.date)} · ${relativeDays(h.date)}${h.estimated ? ' · perkiraan' : ''}</span></li>`).join('')}
          </ul>
        </div>` : ''}

      <div class="row">
        ${faith.pustaka ? `<a class="btn-ghost" href="#/pustaka/${faith.id}">Pustaka ${esc(faith.short || faith.name)}</a>` : ''}
        <a class="btn-ghost" href="#/kunjungi">Ruang lainnya</a>
        <a class="btn-ghost" href="#/ibadah?iman=${faith.id}">Rumah ibadah nyata</a>
      </div>
    </section>`;

  const cleanups = [];
  main.querySelectorAll('.ritual').forEach((card) => {
    const ritual = faith.rituals[Number(card.dataset.index)];
    try {
      cleanups.push(mountRitual(card, ritual, { mode, faith, content }));
    } catch (error) {
      console.error(error);
      card.querySelector('.ritual-body').innerHTML = '<p class="muted">Gagal memuat ritual ini.</p>';
    }
  });
  return () => {
    cleanups.forEach((fn) => fn && fn());
    delete document.body.dataset.faith;
  };
}
