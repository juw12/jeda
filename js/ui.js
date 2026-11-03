// Shared UI helpers.

import { lang } from './i18n.js';

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function toast(message, ms = 2600) {
  const element = document.getElementById('toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove('show'), ms);
}

const dateFormatters = {
  id: new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }),
  en: new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }),
};

const shortDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

export function formatDate(date) {
  return dateFormatters[lang()].format(date);
}

export function formatShortDate(date) {
  return shortDateFormatter.format(date);
}

export function daysUntil(date) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((startOfTarget - startOfToday) / 86400000);
}

export function relativeDays(date) {
  const days = daysUntil(date);
  if (days === 0) {
    return 'hari ini';
  }
  if (days === 1) {
    return 'besok';
  }
  if (days > 1) {
    return `${days} hari lagi`;
  }
  return `${Math.abs(days)} hari lalu`;
}

export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function draftBanner(entry) {
  if (entry.status === 'approved') {
    return `<p class="badge badge-ok">Telah ditinjau${entry.reviewed_by ? ` oleh ${esc(entry.reviewed_by)}` : ''}</p>`;
  }
  return `<div class="draft-banner" role="note">
      <strong>Draf, belum ditinjau.</strong>
      Disusun awal dengan bantuan AI sebagai kerangka, belum diperiksa pemuka agama atau reviewer.
      Jangan jadikan rujukan utama; tanyakan kepada pemuka agama Anda.
    </div>`;
}

export function timeOfDay(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 4 && hour < 7) {
    return 'dawn';
  }
  if (hour >= 7 && hour < 16) {
    return 'day';
  }
  if (hour >= 16 && hour < 19) {
    return 'dusk';
  }
  return 'night';
}

export function onTap(root, selector, handler) {
  root.addEventListener('click', (event) => {
    const target = event.target.closest(selector);
    if (target && root.contains(target)) {
      handler(target, event);
    }
  });
}

// In-page confirmation sheet. Native confirm() is silently blocked in many in-app browsers
// (TikTok, Instagram, Facebook), which made buttons look dead. Resolves true/false.
export function askConfirm({ title, body = '', ok = 'Ya', cancel = 'Batal', danger = false }) {
  return new Promise((resolve) => {
    const layer = document.createElement('div');
    layer.className = 'ask-layer';
    layer.innerHTML = `
      <div class="ask-card" role="alertdialog" aria-modal="true" aria-labelledby="ask-title">
        <h2 class="h3" id="ask-title">${esc(title)}</h2>
        ${body ? `<p class="small">${esc(body)}</p>` : ''}
        <div class="ask-actions">
          <button type="button" class="btn-ghost" data-ask="no">${esc(cancel)}</button>
          <button type="button" class="btn ${danger ? 'danger' : ''}" data-ask="yes">${esc(ok)}</button>
        </div>
      </div>`;
    const close = (answer) => {
      layer.remove();
      resolve(answer);
    };
    layer.addEventListener('click', (event) => {
      if (event.target === layer) {
        close(false);
      }
    });
    layer.querySelector('[data-ask="no"]').addEventListener('click', () => close(false));
    layer.querySelector('[data-ask="yes"]').addEventListener('click', () => close(true));
    document.body.appendChild(layer);
    layer.querySelector('[data-ask="yes"]').focus();
  });
}
