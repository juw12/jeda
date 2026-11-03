// Shared UI helpers.

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

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

const shortDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

export function formatDate(date) {
  return dateFormatter.format(date);
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
