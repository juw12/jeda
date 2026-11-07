// In-world guides: the library, calendar, ceremony guides, glossary, family tools... opened from objects
// inside the 3D space (guide board, bookshelf, mailbox, the guide you can talk to) in a sheet over the
// world, so you never leave the space. Links between guides stay inside the sheet.

import { esc } from '../ui.js';
import { pustaka, entry, searchView, scripture, kamus } from './pustaka.js';
import { tanya } from './tanya.js';
import { planner, places, calendarView, archive } from './tools.js';
import { journal, greetingCard, memorialView } from './extras.js';

export const GUIDES = {
  pustaka: { title: 'Pustaka', icon: '❒', note: 'Ajaran, kitab, ibadah, hari raya, siklus hidup', view: pustaka },
  entri: { title: 'Pustaka', icon: '❒', view: entry, hidden: true },
  cari: { title: 'Cari di Pustaka', icon: '⌕', view: searchView, hidden: true },
  kitab: { title: 'Kitab suci', icon: '❒', view: scripture, hidden: true },
  tanya: { title: 'Tanya Jeda', icon: '?', note: 'Jawaban dari Pustaka, dengan sumber', view: tanya },
  kalender: { title: 'Kalender hari suci', icon: '◷', note: 'Imlek, Hijriah, Pawukon, liturgi', view: calendarView },
  upacara: { title: 'Panduan upacara', icon: '☑', note: 'Daftar persiapan yang bisa dicentang', view: planner },
  kamus: { title: 'Kamus istilah', icon: 'Aa', note: 'Arti istilah dari setiap agama', view: kamus },
  ibadah: { title: 'Rumah ibadah nyata', icon: '⌂', note: 'Tempat ibadah nyata & donasi langsung', view: places },
  arsip: { title: 'Arsip keluarga', icon: '🎙', note: 'Catatan & rekaman suara tetua', view: archive },
  peringatan: { title: 'Peringatan arwah', icon: '🕯', note: 'Hari ke-7/49/100, tahlilan, ki-jit, haul', view: memorialView },
  syukur: { title: 'Jurnal syukur', icon: '✎', note: 'Catatan syukur pribadi', view: journal },
  kartu: { title: 'Kartu ucapan', icon: '✉', note: 'Kartu hari raya untuk teman beda iman', view: greetingCard },
  kunjungi: { title: 'Ruang iman lain', icon: '⛩', note: 'Kunjungi & kenali dalam mode amati', link: '#/kunjungi' },
};

// Where each guide lives in the world (shown in "Lainnya" and the guide menu).
export const GUIDE_PLACES = {
  pustaka: 'Papan panduan di tempat ibadah',
  tanya: 'Ketuk pemandu di tempat ibadah',
  kalender: 'Papan panduan di tempat ibadah',
  upacara: 'Papan panduan di tempat ibadah',
  kamus: 'Papan panduan di tempat ibadah',
  ibadah: 'Papan panduan di tempat ibadah',
  arsip: 'Rak keluarga di rumah',
  peringatan: 'Rak keluarga di rumah',
  syukur: 'Rak keluarga di rumah',
  kartu: 'Kotak surat di rumah',
};

function parse(hash) {
  const clean = hash.replace(/^#\/?/, '');
  const [pathPart, queryPart] = clean.split('?');
  const segments = pathPart.split('/').filter(Boolean).map(decodeURIComponent);
  return { name: segments[0] || 'pustaka', params: segments.slice(1), query: new URLSearchParams(queryPart || '') };
}

export function isGuideRoute(hash) {
  const { name } = parse(hash);
  return Boolean(GUIDES[name] && GUIDES[name].view);
}

// host: element inside the stage. Returns { open(hashOrName), close(), destroy() }.
export function createGuideSheet(host, { content, navigate, onClose = () => {} }) {
  const sheet = document.createElement('div');
  sheet.className = 'guide-sheet';
  sheet.hidden = true;
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-label', 'Panduan');
  sheet.innerHTML = `
    <div class="guide-head">
      <button class="guide-back" type="button" data-guide-back aria-label="Kembali">‹</button>
      <strong data-guide-title>Panduan</strong>
      <button class="guide-close" type="button" data-guide-close aria-label="Tutup">✕</button>
    </div>
    <div class="guide-body" data-guide-body></div>`;
  host.appendChild(sheet);
  const body = sheet.querySelector('[data-guide-body]');
  const title = sheet.querySelector('[data-guide-title]');
  const history = [];
  let cleanup = null;

  function render(hash) {
    if (typeof cleanup === 'function') {
      try {
        cleanup();
      } catch (error) {
        console.error(error);
      }
    }
    cleanup = null;
    const { name, params, query } = parse(hash);
    const guide = GUIDES[name];
    body.innerHTML = '';
    body.scrollTop = 0;
    if (!guide || !guide.view) {
      menu(Object.keys(GUIDES));
      return;
    }
    title.textContent = `${guide.icon} ${guide.title}`;
    const ctx = {
      content,
      navigate: (target) => (isGuideRoute(target) ? go(target) : navigate(target)),
      rerender: () => render(hash),
    };
    try {
      Promise.resolve(guide.view(body, params, query, ctx)).then((result) => {
        cleanup = result;
      }).catch((error) => {
        console.error(error);
        body.innerHTML = `<p class="muted">Gagal membuka panduan ini.</p>`;
      });
    } catch (error) {
      console.error(error);
      body.innerHTML = `<p class="muted">Gagal membuka panduan ini.</p>`;
    }
  }

  function menu(names, heading = 'Panduan') {
    title.textContent = heading;
    body.innerHTML = `<ul class="menu-list guide-menu">${names.filter((n) => GUIDES[n] && !GUIDES[n].hidden).map((n) => `
      <li><a href="${GUIDES[n].link || `#/${n}`}"><strong>${GUIDES[n].icon} ${esc(GUIDES[n].title)}</strong><span class="small muted">${esc(GUIDES[n].note || '')}</span></a></li>`).join('')}</ul>`;
  }

  function go(hash) {
    history.push(hash);
    render(hash);
  }

  // Keep in-guide links inside the sheet; anything else leaves the space as usual.
  body.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#/"]');
    if (!link) {
      return;
    }
    const href = link.getAttribute('href');
    if (isGuideRoute(href)) {
      event.preventDefault();
      go(href);
    }
  });
  sheet.querySelector('[data-guide-back]').addEventListener('click', () => {
    if (history.length > 1) {
      history.pop();
      render(history[history.length - 1]);
    } else {
      close();
    }
  });
  sheet.querySelector('[data-guide-close]').addEventListener('click', () => close());

  function close() {
    sheet.hidden = true;
    document.body.classList.remove('guide-open');
    if (typeof cleanup === 'function') {
      try {
        cleanup();
      } catch (error) {
        console.error(error);
      }
    }
    cleanup = null;
    history.length = 0;
    onClose();
  }

  return {
    // open('pustaka'), open('#/entri/xyz'), or open(['pustaka','kalender'], 'Papan panduan') for a menu.
    open(target, heading) {
      sheet.hidden = false;
      document.body.classList.add('guide-open');
      history.length = 0;
      if (Array.isArray(target)) {
        if (target.length === 1) {
          go(`#/${target[0]}`);
          return;
        }
        history.push('menu');
        menu(target, heading);
        return;
      }
      go(target.startsWith('#') ? target : `#/${target}`);
    },
    isOpen: () => !sheet.hidden,
    close,
    destroy() {
      if (!sheet.hidden) {
        close();
      }
      sheet.remove();
    },
  };
}
