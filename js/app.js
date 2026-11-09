// Jeda app entry: hash router, chrome (top bar + tab bar), theme.

import { CONFIG } from './config.js';
import { prefs } from './store.js';
import { esc } from './ui.js';
import { t, lang } from './i18n.js';
import { openPause } from './pause.js';
import { loadContent, faithById } from './content.js';
import * as core from './views/core.js';
import { space } from './views/space.js';
import { pustaka, entry, searchView, scripture, kamus } from './views/pustaka.js';
import { tanya } from './views/tanya.js';
import { planner, places, calendarView, archive } from './views/tools.js';
import { review } from './views/review.js';
import { journal, greetingCard, memorialView } from './views/extras.js';
import { onboarding } from './views/onboarding.js';
import { liveView, joinView } from './views/live.js';
import { sekolah, karmaView, wisata } from './views/journey.js';
import { balance, onKarma } from './karma.js';

const ROUTES = {
  '': core.home,
  pilih: (main, params, query, ctx) => onboarding(main, params, new URLSearchParams('dari=pengaturan'), ctx),
  mulai: onboarding,
  live: liveView,
  gabung: joinView,
  ruang: space,
  kunjungi: core.visitList,
  pustaka,
  entri: entry,
  cari: searchView,
  kitab: scripture,
  tanya,
  upacara: planner,
  ibadah: places,
  kalender: calendarView,
  arsip: archive,
  dukung: core.support,
  tentang: core.about,
  pengaturan: core.settings,
  lainnya: core.more,
  tinjau: review,
  kamus,
  syukur: journal,
  kartu: greetingCard,
  peringatan: memorialView,
  sekolah,
  karma: karmaView,
  wisata,
};

let content = null;
let cleanup = null;

function applyTheme() {
  const p = prefs.get();
  const root = document.documentElement;
  root.dataset.theme = p.theme;
  root.lang = lang();
  root.classList.toggle('large-text', p.largeText);
  root.classList.toggle('reduce-motion', p.reducedMotion);
}

function renderChrome(routeName) {
  const p = prefs.get();
  const faith = p.faith ? faithById(content, p.faith) : null;
  document.getElementById('topbar').innerHTML = `
    <a class="brand" href="#/"><span class="brand-mark" aria-hidden="true">‖</span>${esc(CONFIG.appName)}</a>
    <span class="top-actions">
      <a class="karma-chip top-karma" href="#/karma" aria-label="Bank Kebaikan, saldo ${balance()}"><span aria-hidden="true">✦</span><span data-top-balance>${balance()}</span></a>
      <button class="pause-button" type="button" data-pause aria-label="${t('pause.button')}"><span class="pause-glyph" aria-hidden="true">‖</span><span class="pause-label">${t('pause.button')}</span></button>
      <a class="top-link" href="#/cari" aria-label="Cari">⌕</a>
    </span>`;
  document.querySelector('[data-pause]').addEventListener('click', openPause);
  const spaceHref = faith ? `#/ruang/${faith.id}` : '#/kunjungi';
  // Pustaka, Tanya and the other guides now live inside the 3D spaces (guide board, the guide you can
  // talk to, the family shelf at home), so the tab bar only needs Home, the 3D space and More.
  const tabs = [
    ['', '#/', t('tab.home'), '◎'],
    ['ruang', spaceHref, t('tab.space'), '⛩'],
    ['sekolah', '#/sekolah', 'Sekolah', '🎓'],
    ['wisata', '#/wisata', 'Wisata', '🧭'],
    ['lainnya', '#/lainnya', t('tab.more'), '≡'],
  ];
  const groups = {
    ruang: ['ruang', 'kunjungi'],
    sekolah: ['sekolah'],
    wisata: ['wisata'],
    lainnya: ['lainnya', 'karma', 'pustaka', 'entri', 'cari', 'kitab', 'kamus', 'tanya', 'upacara', 'ibadah', 'kalender', 'arsip', 'dukung', 'tentang', 'pengaturan', 'tinjau', 'syukur', 'kartu', 'peringatan'],
  };
  const isActive = (id) => id === routeName || (groups[id] || []).includes(routeName);
  const showTabs = Boolean(p.faith) || routeName !== '';
  document.getElementById('tabbar').innerHTML = showTabs && routeName !== 'pilih' ? tabs.map(([id, href, label, icon]) => `
    <a href="${href}" class="${isActive(id) ? 'active' : ''}" ${isActive(id) ? 'aria-current="page"' : ''}>
      <span class="tab-icon" aria-hidden="true">${icon}</span><span>${label}</span>
    </a>`).join('') : '';
  document.body.classList.toggle('no-tabs', !(showTabs && routeName !== 'pilih'));
}

function navigate(hash) {
  if (location.hash === hash) {
    router();
  } else {
    location.hash = hash;
  }
}

async function router() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [pathPart, queryPart] = hash.split('?');
  const segments = pathPart.split('/').filter(Boolean).map(decodeURIComponent);
  const name = segments[0] || '';
  const query = new URLSearchParams(queryPart || '');
  const view = ROUTES[name] || core.home;

  if (typeof cleanup === 'function') {
    try {
      cleanup();
    } catch (error) {
      console.error(error);
    }
  }
  cleanup = null;
  applyTheme();
  renderChrome(name);
  const main = document.getElementById('main');
  main.innerHTML = '';
  try {
    cleanup = await view(main, segments.slice(1), query, {
      content,
      navigate,
      rerender: router,
    });
  } catch (error) {
    console.error(error);
    main.innerHTML = `<section class="stack"><p>Terjadi kesalahan saat membuka halaman ini.</p><pre class="small">${esc(error.message)}</pre><a href="#/">Kembali ke beranda</a></section>`;
    document.documentElement.dataset.error = error.message;
  }
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

async function start() {
  applyTheme();
  try {
    content = await loadContent();
  } catch (error) {
    document.getElementById('main').innerHTML = `<section class="stack"><p>Gagal memuat konten. Periksa koneksi lalu muat ulang.</p><pre class="small">${esc(error.message)}</pre></section>`;
    document.documentElement.dataset.error = error.message;
    return;
  }
  window.addEventListener('hashchange', router);
  await router();
  document.documentElement.dataset.ready = 'true';
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    const hadController = Boolean(navigator.serviceWorker.controller);
  let reloadedForUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // A new version was installed: reload once so new features (e.g. Ruang Live) are available immediately.
    if (hadController && !reloadedForUpdate) {
      reloadedForUpdate = true;
      location.reload();
    }
  });
  navigator.serviceWorker.register('sw.js').then((registration) => registration.update()).catch((error) => console.warn('SW', error));
  }
}

onKarma(({ balance: value }) => {
  const el = document.querySelector('[data-top-balance]');
  if (el) {
    el.textContent = String(value);
  }
});

window.addEventListener('error', (event) => {
  document.documentElement.dataset.error = event.message;
});
window.addEventListener('unhandledrejection', (event) => {
  document.documentElement.dataset.error = String(event.reason);
});

start();
