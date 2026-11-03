// Jeda app entry: hash router, chrome (top bar + tab bar), theme.

import { CONFIG } from './config.js';
import { prefs } from './store.js';
import { esc } from './ui.js';
import { t, lang } from './i18n.js';
import { openPause } from './pause.js';
import { loadContent, faithById } from './content.js';
import * as core from './views/core.js';
import { space } from './views/space.js';
import { pustaka, entry, searchView, scripture } from './views/pustaka.js';
import { tanya } from './views/tanya.js';
import { planner, places, calendarView, archive } from './views/tools.js';
import { review } from './views/review.js';

const ROUTES = {
  '': core.home,
  pilih: core.choose,
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
      <button class="pause-button" type="button" data-pause>${t('pause.button')}</button>
      <a class="top-link" href="#/cari" aria-label="Cari">⌕</a>
    </span>`;
  document.querySelector('[data-pause]').addEventListener('click', openPause);
  const spaceHref = faith ? `#/ruang/${faith.id}` : '#/kunjungi';
  const tabs = [
    ['', '#/', t('tab.home'), '◎'],
    ['ruang', spaceHref, t('tab.space'), '⛩'],
    ['pustaka', '#/pustaka', t('tab.library'), '❒'],
    ['tanya', '#/tanya', t('tab.ask'), '?'],
    ['lainnya', '#/lainnya', t('tab.more'), '≡'],
  ];
  const groups = {
    ruang: ['ruang', 'kunjungi'],
    pustaka: ['pustaka', 'entri', 'cari', 'kitab'],
    lainnya: ['lainnya', 'upacara', 'ibadah', 'kalender', 'arsip', 'dukung', 'tentang', 'pengaturan', 'tinjau'],
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
    navigator.serviceWorker.register('sw.js').catch((error) => console.warn('SW', error));
  }
}

window.addEventListener('error', (event) => {
  document.documentElement.dataset.error = event.message;
});
window.addEventListener('unhandledrejection', (event) => {
  document.documentElement.dataset.error = String(event.reason);
});

start();
