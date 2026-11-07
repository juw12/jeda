// Sacred space: a walkable 3D place with activities and (opt-in) other visitors, plus tools & guides below.
// Home mode = your own faith. Visit mode = observe and learn; devotional acts are explained, not performed.

import { prefs, guestName } from '../store.js';
import { esc, formatShortDate, relativeDays, timeOfDay, toast, askConfirm } from '../ui.js';
import { faithById, entryById } from '../content.js';
import { sceneSvg, FESTIVE } from '../scenes.js';
import { holyDays, matchesFaith, festiveHoliday } from '../calendar.js';
import { mountRitual } from './rituals.js';
import { bead, bell as bellSound } from '../audio.js';
import { greetingsFor, greetingById } from '../world/greetings.js';
import { KEDAI, HOME, METHODS, MEAL_PRAYER, dishById, priceLabel } from '../world/cuisine.js';
import { chatReply, chatOpening, chatSuggestions } from '../world/chat.js';
import { setAsmrGain } from '../audio.js';
import { search } from '../search.js';
import { getIndex } from './pustaka.js';
import { createGuideSheet } from './guide.js';

const AREAS = [
  { id: 'ibadah', icon: '⛩', label: 'Ibadah' },
  { id: 'kedai', icon: '🍜', label: 'Kedai' },
  { id: 'rumah', icon: '🏠', label: 'Rumah' },
];
const AREA_GUIDES = {
  ibadah: ['pustaka', 'tanya', 'kalender', 'upacara', 'kamus', 'ibadah', 'kunjungi'],
  kedai: ['pustaka', 'kalender', 'kamus', 'tanya'],
  rumah: ['peringatan', 'arsip', 'syukur', 'kartu', 'pustaka', 'kalender'],
};
// Food you carry (e.g. takeaway) survives moving between the sacred place, the food place and home.
const CARRY_KEY = 'jeda:v1:carry';
function loadCarry() {
  try {
    return JSON.parse(sessionStorage.getItem(CARRY_KEY) || '[]').map((item) => dishById(item.dishId)).filter(Boolean).map((dish) => ({ dish }));
  } catch {
    return [];
  }
}
function saveCarry(list) {
  try {
    sessionStorage.setItem(CARRY_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable: food is simply not carried over
  }
}
const DZIKIR = ['Subhanallah', 'Alhamdulillah', 'Allahu Akbar'];

export function avatarColor() {
  const p = prefs.get();
  return p.avatarColor || '#e8dcc8';
}

function sitPanel(spot, faith) {
  switch (spot.sitMode) {
    case 'dzikir':
      return `<p class="sit-title">Zikir</p><p class="sit-phrase" data-phrase>${DZIKIR[0]}</p>
        <button class="sit-tap" type="button" data-tap aria-label="Hitung">0</button>
        <p class="small muted">Ketuk untuk menghitung · 33 × 3</p>
        <button class="btn-ghost sit-hold" type="button" data-sit-hold>📿 Pegang tasbih (orang pertama)</button>`;
    case 'rosary':
      return `<p class="sit-title">Rosario</p><p class="sit-phrase" data-phrase>Salam Maria</p>
        <button class="sit-tap" type="button" data-tap aria-label="Hitung butir">0</button>
        <p class="small muted">Satu peristiwa = 1 Bapa Kami, 10 Salam Maria, 1 Kemuliaan</p>
        <button class="btn-ghost sit-hold" type="button" data-sit-hold>📿 Pegang rosario (orang pertama)</button>`;
    case 'meditate':
    case 'breathe':
      return `<p class="sit-title">${spot.sitMode === 'meditate' ? 'Meditasi' : 'Bernapas'}</p>
        <div class="sit-breath" data-breath></div><p class="sit-phrase" data-phrase>Tarik napas…</p>
        <p class="small muted">Ikuti lingkaran. Satu menit saja sudah cukup.</p>
        ${spot.sitMode === 'meditate' ? '<button class="btn-ghost sit-hold" type="button" data-sit-hold>📿 Pegang mala (orang pertama)</button>' : ''}`;
    case 'meal':
      return `<p class="sit-title">Duduk di meja</p><p class="sit-phrase" data-meal-hint>Pesan di kios, lalu bawa ke meja ini untuk makan.</p>`;
    case 'rest':
      return `<p class="sit-title">Bersantai</p><p class="sit-phrase">Duduk sebentar, lihat orang lalu-lalang.</p>`;
    default:
      return `<p class="sit-title">Hening</p><p class="sit-phrase">Diam sejenak di ${esc(faith.spaceName)}.</p>
        <p class="sit-timer" data-timer>00:00</p>`;
  }
}

export function space(main, [faithId, areaParam], query, { content, navigate }, extra = {}) {
  const faith = faithById(content, faithId);
  if (!faith) {
    navigate('#/kunjungi');
    return undefined;
  }
  const userPrefs = prefs.get();
  const live = extra.live || null; // { code, host, secret?, mode }
  const mode = live && live.mode ? live.mode : (!userPrefs.faith || userPrefs.faith === faith.id || faith.id === 'alam' ? 'home' : 'visit');
  const greetings = greetingsFor(faith.id, mode);
  // Three places per faith: the sacred place, the food place nearby, and a home.
  const area = !live && ['kedai', 'rumah'].includes(areaParam) ? areaParam : 'ibadah';
  const kedai = KEDAI[faith.id] || KEDAI.alam;
  const home = HOME[faith.id] || HOME.alam;
  const areaTitle = area === 'kedai' ? kedai.name : area === 'rumah' ? home.name : faith.spaceName;
  const sceneId = area === 'ibadah' ? faith.scene : `${area}-${faith.id}`;
  document.body.dataset.faith = faith.id;
  document.body.classList.add('in-space');

  const today = new Date();
  const festive = faith.id === 'alam' ? null : festiveHoliday(faith.id, content.calendarOverrides, FESTIVE);
  const festiveInfo = festive ? FESTIVE[festive.id] : null;
  const upcoming = faith.id === 'alam'
    ? []
    : holyDays(today, 180, content.calendarOverrides).filter((h) => matchesFaith(h, faith.id)).slice(0, 3);
  const name = guestName();
  const time = timeOfDay();

  main.innerHTML = `
    <section class="stage" style="--accent:${faith.color}">
      <div class="stage-world" data-world></div>
      <div class="stage-top">
        <div class="stage-title">
          <span class="eyebrow">${area === 'kedai' ? 'Kedai makan' : area === 'rumah' ? 'Rumah' : mode === 'visit' ? 'Kunjungi & kenali' : 'Ruangmu'}</span>
          <h1>${esc(areaTitle)}</h1>
          ${live ? '' : `<nav class="area-switch" aria-label="Pindah tempat">${AREAS.map((a) => `<button type="button" data-area="${a.id}" class="${a.id === area ? 'on' : ''}" ${a.id === area ? 'aria-current="page"' : ''}><span aria-hidden="true">${a.icon}</span>${a.label}</button>`).join('')}</nav>`}
        </div>
        <div class="stage-pills">
          ${live ? `
            <button class="pill live-pill" type="button" data-live-share><span class="rec"></span>LIVE · <span data-live-code>${esc(live.code)}</span></button>
            <span class="pill count-pill" data-presence-label aria-live="polite">Menghubungkan…</span>` : `
            <button class="pill" type="button" data-presence aria-pressed="false">
              <span class="dot"></span><span data-presence-label>Sendiri</span>
            </button>
            <button class="pill" type="button" data-golive>Siarkan</button>`}
          <button class="pill icon-pill" type="button" data-immersive aria-pressed="false" aria-label="Sembunyikan tombol agar ruang terlihat penuh" title="Lihat ruang penuh">⤢</button>
        </div>
      </div>
      ${festiveInfo ? `<div class="stage-banner">${esc(festiveInfo.text)}</div>` : ''}
      <button class="pill immersive-exit" type="button" data-immersive-exit aria-label="Tampilkan tombol lagi">⤡ Tombol</button>
      <div class="stage-side" role="group" aria-label="Tampilan ruang">
        <button class="side-btn" type="button" data-view-toggle aria-pressed="false" aria-label="Lihat dari mata sendiri (orang pertama)"><span aria-hidden="true">👁</span><small>1P</small></button>
        <button class="side-btn" type="button" data-time-toggle aria-label="Ganti waktu: waktu nyata"><span aria-hidden="true">🕰</span><small>Nyata</small></button>
        <button class="side-btn" type="button" data-guides aria-label="Panduan: pustaka, kalender, upacara…"><span aria-hidden="true">📚</span><small>Panduan</small></button>
        <button class="side-btn" type="button" data-hold hidden><span aria-hidden="true" data-hold-icon>📿</span><small data-hold-short></small></button>
      </div>
      <div class="hold-hud" data-hold-hud hidden aria-live="polite">
        <div class="hold-card">
          <div class="hold-head">
            <span class="eyebrow" data-hold-name></span>
            <button class="hold-voice" type="button" data-hold-voice aria-pressed="true">🔈 Lantunan</button>
          </div>
          <p class="hold-context" data-hold-context></p>
          <p class="hold-script" data-hold-script dir="rtl" lang="ar"></p>
          <p class="hold-label" data-hold-label></p>
          <p class="hold-count" data-hold-count></p>
          <p class="hold-note" data-hold-note></p>
          <a class="hold-link" data-hold-link hidden target="_blank" rel="noopener"></a>
        </div>
        <div class="hold-actions">
          <button class="btn-ghost" type="button" data-hold-close>Selesai</button>
          <button class="btn" type="button" data-hold-step>Geser butir</button>
          <button class="btn" type="button" data-hold-finish hidden>Tancapkan di hiolo</button>
        </div>
      </div>
      <div class="stage-hint" data-hint>Ketuk tanah untuk berjalan · seret untuk melihat sekeliling</div>
      <div class="stage-bottom">
        <div class="spot-chips" data-chips role="group" aria-label="Pergi ke"></div>
        <div class="action-card" data-action hidden>
          <div><span class="eyebrow" data-action-kind></span><strong data-action-label></strong></div>
          <button class="btn" type="button" data-action-go></button>
        </div>
        ${live && live.host ? `
          <div class="live-bar" role="group" aria-label="Alat pemandu">
            <button type="button" data-host="share">Bagikan</button>
            <button type="button" data-host="silence">Hening 1 menit</button>
            <button type="button" data-host="gather">Ajak ke sini</button>
            <button type="button" data-host="broadcast">Mode siaran</button>
            <button type="button" data-host="end">Akhiri</button>
          </div>` : ''}
        <button class="pill greet-toggle" type="button" data-greet-toggle aria-expanded="false">Salam ▾</button>
        <div class="greetings" role="group" aria-label="Salam" data-greetings>
          ${greetings.map((g) => `<button type="button" class="greet" data-greet="${g.id}" title="${esc(g.note)}">${esc(g.label)}</button>`).join('')}
        </div>
      </div>
      ${live ? `
        <div class="silence-overlay" data-silence hidden>
          <p class="eyebrow">Hening bersama</p>
          <p class="silence-time" data-silence-time>1:00</p>
          <p class="small">Dipimpin pemandu. Diam sejenak, di mana pun kamu berada.</p>
        </div>
        <div class="broadcast-card" data-broadcast hidden>
          <div class="broadcast-qr" data-qr></div>
          <div>
            <p class="eyebrow">Ikut masuk ruang ini</p>
            <p class="broadcast-code">${esc(live.code)}</p>
            <p class="small">Buka <strong data-short-url></strong> lalu ketuk <strong>Gabung</strong></p>
          </div>
        </div>
        <div class="live-ended" data-ended hidden>
          <div class="card">
            <h2 class="h3">Ruang Live telah selesai</h2>
            <p>Terima kasih sudah hadir dan berdoa bersama.</p>
            <a class="btn" href="#/">Ke beranda</a>
          </div>
        </div>
        <div class="share-sheet" data-share-sheet hidden>
          <div class="share-body">
            <p class="eyebrow">Ruang Live · ${esc(faith.spaceName)}</p>
            <p class="share-code">${esc(live.code)}</p>
            <div class="share-qr" data-share-qr></div>
            <input class="share-link" type="text" readonly data-share-link aria-label="Tautan Ruang Live">
            <div class="row">
              <button class="btn" type="button" data-copy="link">Salin tautan</button>
              <button class="btn-ghost" type="button" data-copy="caption">Salin teks caption</button>
              <button class="btn-ghost" type="button" data-native-share>Bagikan…</button>
            </div>
            <p class="small muted">TikTok sering tidak membuat tautan bisa diklik di komentar. Sebutkan atau tulis kodenya: penonton membuka <strong data-short-url></strong>, ketuk <strong>Gabung</strong>, lalu masukkan kode.</p>
            <button class="btn-ghost" type="button" data-close-share>Tutup</button>
          </div>
        </div>` : ''}
      <div class="sit-sheet" data-sit hidden>
        <div class="sit-body" data-sit-body></div>
        <button class="btn-ghost" type="button" data-stand>Selesai</button>
      </div>
      <div class="menu-sheet" data-menu hidden></div>
      <div class="cook-card" data-cook hidden></div>
      <div class="meal-hud" data-meal hidden></div>
      <div class="npc-chat" data-chat hidden>
        <div class="chat-head">
          <span class="chat-dot" data-chat-dot aria-hidden="true"></span>
          <div><strong data-chat-name></strong><small data-chat-role></small></div>
          <button class="chat-close" type="button" data-chat-close aria-label="Tutup obrolan">✕</button>
        </div>
        <div class="chat-log" data-chat-log aria-live="polite"></div>
        <div class="chat-chips" data-chat-chips></div>
        <form class="chat-input" data-chat-form>
          <input name="msg" maxlength="200" autocomplete="off" placeholder="Tulis pesan…" aria-label="Pesan">
          <button class="btn" type="submit">Kirim</button>
        </form>
      </div>
    </section>

    <section class="stack space-below">
      <div class="space-intro">
        <p class="lead">${esc(faith.greeting)}</p>
        <p class="small muted">Kamu hadir sebagai <strong>${esc(name)}</strong>${mode === 'visit' ? ' · tamu yang mengamati' : ''}.</p>
      </div>
      ${mode === 'visit' ? `
        <div class="card soft">
          <h2 class="h3">Sebagai tamu yang hormat</h2>
          <ul>${(faith.visitTips || []).map((tip) => `<li>${esc(tip)}</li>`).join('')}</ul>
          <p class="small muted">Di ruang iman lain, ritual ibadah ditampilkan untuk dipelajari, tidak dilakukan.</p>
        </div>` : ''}
      ${area === 'kedai' ? `
        <div class="card soft">
          <h2 class="h3">${esc(kedai.name)}</h2>
          <p>${esc(kedai.intro)}</p>
          <ul>${kedai.notes.map((note) => `<li>${esc(note)}</li>`).join('')}</ul>
          <p class="small muted">Dekati kios, pesan, lalu lihat penjualnya memasak langsung. Makan di meja (orang pertama, dengan suara ASMR) atau bungkus untuk dibawa pulang. Harga hanya suasana: semuanya gratis.</p>
        </div>
        <div class="ritual-grid">${kedai.stalls.map((stall) => `
          <article class="card">
            <h3 class="h3">${esc(stall.name)}</h3>
            <p class="small muted">${esc(stall.vendor.name)} · ${esc(METHODS[stall.method].label)}</p>
            <ul class="clean-list">${stall.dishes.map((id) => dishById(id)).filter(Boolean).map((dish) => `<li><span>${esc(dish.name)}</span><span class="muted small">${priceLabel(dish.price)}</span></li>`).join('')}</ul>
          </article>`).join('')}</div>` : ''}
      ${area === 'rumah' ? `
        <div class="card soft">
          <h2 class="h3">${esc(home.name)}</h2>
          <p>${esc(home.intro)}</p>
          ${home.altar ? `<p class="small muted">${esc(home.altar)}</p>` : ''}
          <p class="small muted">Di rumah: berdoa di altar/tempat ibadah keluarga, minta masakan di dapur, makan bungkusan dari kedai di meja makan, dan buka rak keluarga (peringatan arwah, arsip, jurnal syukur) serta kotak surat (kartu ucapan).</p>
        </div>` : ''}
      ${area === 'ibadah' ? `
      <h2 class="h3 section-title">Alat & panduan</h2>
      <div class="ritual-grid">
        ${faith.rituals.map((ritual, index) => {
    const entry = ritual.entry ? entryById(content, ritual.entry) : null;
    return `
          <article class="card ritual" data-index="${index}" data-type="${esc(ritual.type)}" tabindex="-1">
            <header>
              <h3 class="h3">${esc(ritual.title)}</h3>
              ${ritual.desc ? `<p class="small muted">${esc(ritual.desc)}</p>` : ''}
            </header>
            <div class="ritual-body"></div>
            ${entry || ritual.about ? `
              <details class="about">
                <summary>Makna & tata cara</summary>
                ${ritual.about ? `<p>${esc(ritual.about)}</p>` : ''}
                ${entry ? `<p><a href="#/entri/${encodeURIComponent(entry.id)}">Baca di Pustaka: ${esc(entry.title)}</a>${entry.status !== 'approved' ? ' <span class="badge">draf</span>' : ''}</p>` : ''}
              </details>` : ''}
          </article>`;
  }).join('')}
      </div>` : ''}
      ${upcoming.length ? `
        <div class="card soft">
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
      card.querySelector('.ritual-body').innerHTML = '<p class="muted">Gagal memuat alat ini.</p>';
    }
  });

  const stage = main.querySelector('.stage');
  const worldBox = main.querySelector('[data-world]');
  const actionCard = main.querySelector('[data-action]');
  const actionLabel = main.querySelector('[data-action-label]');
  const actionKind = main.querySelector('[data-action-kind]');
  const actionGo = main.querySelector('[data-action-go]');
  const sitSheet = main.querySelector('[data-sit]');
  const sitBody = main.querySelector('[data-sit-body]');
  const presenceButton = main.querySelector('[data-presence]');
  const presenceLabel = main.querySelector('[data-presence-label]');
  let world = null;
  let presence = null;
  let currentSpot = null;
  let sitTimer = null;

  const scrollToTool = (type) => {
    const card = main.querySelector(`.ritual[data-type="${type}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('flash');
      setTimeout(() => card.classList.remove('flash'), 1600);
    }
  };


  // ---------- Guides inside the 3D space (library, calendar, ceremonies, family tools...) ----------
  const guideSheet = createGuideSheet(stage, { content, navigate });
  main.querySelector('[data-guides]').addEventListener('click', () => guideSheet.open(AREA_GUIDES[area], 'Panduan'));
  const openEntry = (entryId) => guideSheet.open(`#/entri/${encodeURIComponent(entryId)}`);
  main.querySelectorAll('[data-area]').forEach((button) => {
    button.addEventListener('click', () => travel(button.dataset.area));
  });
  function travel(to) {
    if (to === area) {
      return;
    }
    navigate(`#/ruang/${faith.id}${to === 'ibadah' ? '' : `/${to}`}`);
  }

  // ---------- Food: menu, live cooking, eating ----------
  const menuSheet = main.querySelector('[data-menu]');
  const cookCard = main.querySelector('[data-cook]');
  const mealHud = main.querySelector('[data-meal]');
  const myFaith = prefs.get().faith || 'alam';
  const prayer = MEAL_PRAYER[myFaith] || MEAL_PRAYER.alam;

  function openMenu(spot) {
    if (!world) {
      return;
    }
    const stall = world.stalls().find((s) => s.id === spot.stallId);
    if (!stall) {
      return;
    }
    const def = stall.def;
    const method = METHODS[def.method] || METHODS.stir;
    const dishes = def.dishes.map((id) => dishById(id)).filter(Boolean);
    menuSheet.innerHTML = `
      <div class="menu-card">
        <header>
          <span class="eyebrow">${stall.home ? 'Dapur rumah' : 'Kios'} · ${esc(def.vendor.name)}</span>
          <h2 class="h3">${esc(def.name)}</h2>
          <p class="small muted">${esc(method.label)}. ${esc(method.about)}</p>
        </header>
        <ul class="menu-list-food">${dishes.map((dish) => `
          <li>
            <div><strong>${esc(dish.name)}</strong><span class="small muted">${esc(dish.desc)}</span>
              ${(dish.tags || []).map((tag) => `<span class="badge">${esc(tag)}</span>`).join(' ')}
              ${dish.note ? `<span class="small">${esc(dish.note)}</span>` : ''}</div>
            <div class="menu-actions">
              <span class="small muted">${priceLabel(dish.price)}</span>
              <button class="btn" type="button" data-order="${esc(dish.id)}">${stall.home ? 'Minta' : 'Makan di sini'}</button>
              ${stall.home ? '' : `<button class="btn-ghost" type="button" data-order="${esc(dish.id)}" data-takeaway="1">Bungkus</button>`}
            </div>
          </li>`).join('')}</ul>
        <p class="small muted">${stall.home ? 'Masakan rumah, dibuat dengan sayang.' : 'Harga hanya suasana: semua gratis di Jeda.'}</p>
        <button class="btn-ghost" type="button" data-menu-close>Tutup</button>
      </div>`;
    menuSheet.hidden = false;
    menuSheet.querySelector('[data-menu-close]').addEventListener('click', () => {
      menuSheet.hidden = true;
    });
    menuSheet.querySelectorAll('[data-order]').forEach((button) => {
      button.addEventListener('click', () => placeOrder(stall, dishById(button.dataset.order), Boolean(button.dataset.takeaway)));
    });
  }

  function placeOrder(stall, dish, takeaway) {
    if (!world || !dish) {
      return;
    }
    const ok = world.order(stall.id, dish, {
      takeaway,
      onStep: (step) => renderCook(stall, dish, step),
      onReady: ({ dish: ready, takeaway: bagged }) => {
        cookCard.hidden = true;
        if (bagged) {
          toast(`${ready.name} dibungkus. Bawa pulang dan makan di meja makan rumah, atau duduk di meja sini.`);
          return;
        }
        const table = world.spots.find((s) => s.sitMode === 'meal');
        toast(`${ready.name} siap. Membawa ke meja…`);
        if (table) {
          world.walkTo(table.id, { perform: true, instant: Boolean(prefs.get().reducedMotion) });
        }
      },
    });
    if (!ok) {
      toast('Penjualnya sedang memasak pesanan lain. Tunggu sebentar, ya.');
      return;
    }
    menuSheet.hidden = true;
    renderCook(stall, dish, { index: -1, total: 1, label: 'Pesanan diterima' });
  }

  function renderCook(stall, dish, step) {
    const method = METHODS[dish.method || stall.def.method] || METHODS.stir;
    const progress = Math.round(((step.index + 1) / Math.max(1, step.total)) * 100);
    cookCard.innerHTML = `
      <span class="eyebrow">Dimasak langsung · ${esc(stall.def.vendor.name)}</span>
      <strong>${esc(dish.name)}</strong>
      <p class="cook-step">${esc(step.label)}</p>
      <div class="cook-bar"><span style="width:${Math.max(6, progress)}%"></span></div>
      <p class="small">${esc(method.about)}</p>`;
    cookCard.hidden = false;
  }

  let autoTimer = null;
  let prayed = false;
  function stopAuto() {
    clearInterval(autoTimer);
    autoTimer = null;
  }
  function renderMeal(state) {
    if (!state || !state.meal) {
      mealHud.hidden = true;
      stopAuto();
      return;
    }
    mealHud.hidden = false;
    const items = state.items;
    const done = state.done;
    mealHud.innerHTML = `
      <div class="meal-card">
        <div class="meal-head">
          <span class="eyebrow">Makan · orang pertama</span>
          <strong>${esc(state.name)}</strong>
        </div>
        ${!prayed && !done ? `<details class="meal-prayer"><summary>🙏 ${esc(prayer.title)}</summary><p>${esc(prayer.text)}</p>${prayer.tip ? `<p class="small">${esc(prayer.tip)}</p>` : ''}</details>` : ''}
        ${done ? `<p class="meal-done">Habis! ${esc(prayer.after)}</p>` : '<p class="small meal-tip">Ketuk layar atau tombol untuk satu suapan. Pakai earphone untuk suara ASMR terbaik.</p>'}
        <div class="meal-bites">${items.map((item, index) => `
          <button class="btn${item.left <= 0 ? ' done' : ''}" type="button" data-bite="${index}" ${item.left <= 0 ? 'disabled' : ''}>${esc(item.verb)} ${esc(item.name.toLowerCase())} <small>${Math.max(0, item.left)}</small></button>`).join('')}</div>
        <div class="meal-tools">
          <button class="btn-ghost" type="button" data-auto aria-pressed="${autoTimer ? 'true' : 'false'}">${autoTimer ? '⏸ Berhenti otomatis' : '▶ Makan otomatis'}</button>
          <label class="asmr-volume">🔊<input type="range" min="0" max="2" step="0.1" value="${asmrLevel}" data-asmr aria-label="Volume ASMR"></label>
          <button class="btn-ghost" type="button" data-meal-close>${done ? 'Selesai' : 'Sudahan'}</button>
        </div>
      </div>`;
    mealHud.querySelector('.meal-prayer')?.addEventListener('toggle', () => {
      prayed = true;
      bellSound();
    });
    mealHud.querySelectorAll('[data-bite]').forEach((button) => {
      button.addEventListener('click', () => world && world.holdStep(Number(button.dataset.bite)));
    });
    mealHud.querySelector('[data-auto]').addEventListener('click', () => {
      if (autoTimer) {
        stopAuto();
      } else {
        // Hands-free: one bite every few seconds, alternating with sips of the drink.
        let turn = 0;
        autoTimer = setInterval(() => {
          const current = world && world.holding();
          if (!current || !current.meal || current.done) {
            stopAuto();
            if (current) {
              renderMeal(current);
            }
            return;
          }
          const open = current.items.map((item, index) => ({ item, index })).filter(({ item }) => item.left > 0);
          const food = open.filter(({ item }) => !item.drink);
          const choice = turn % 4 === 3 && open.some(({ item }) => item.drink) ? open.find(({ item }) => item.drink) : (food[0] || open[0]);
          turn += 1;
          world.holdStep(choice.index);
        }, 3400);
      }
      renderMeal(world.holding());
    });
    mealHud.querySelector('[data-asmr]').addEventListener('input', (event) => {
      asmrLevel = Number(event.target.value);
      setAsmrGain(asmrLevel);
    });
    mealHud.querySelector('[data-meal-close]').addEventListener('click', () => {
      stopAuto();
      if (world) {
        world.release();
      }
      if (currentSitSpot) {
        showSit(currentSitSpot);
      }
    });
  }
  let asmrLevel = 1;
  const mealRefresh = setInterval(() => {
    if (world && !mealHud.hidden) {
      const current = world.holding();
      if (current && current.meal) {
        // Counts change when a bite reaches the mouth, after the tap.
        mealHud.querySelectorAll('[data-bite]').forEach((button, index) => {
          const item = current.items[index];
          if (item) {
            button.querySelector('small').textContent = String(Math.max(0, item.left));
            button.disabled = item.left <= 0;
          }
        });
        if (current.done && !mealHud.querySelector('.meal-done')) {
          stopAuto();
          renderMeal(current);
        }
      }
    }
  }, 400);

  // ---------- Small talk with people (NPCs) ----------
  const chatPanel = main.querySelector('[data-chat]');
  const chatLog = main.querySelector('[data-chat-log]');
  const chatChips = main.querySelector('[data-chat-chips]');
  let chatting = null;
  const nextHoliday = upcoming[0] ? `${upcoming[0].name} (${relativeDays(upcoming[0].date)})` : null;
  function chatContext(info) {
    const stall = info.stallId && world ? world.stalls().find((s) => s.id === info.stallId) : null;
    const index = getIndex(content);
    return {
      culture: info.culture,
      userName: name,
      greeting: (greetingsFor(faith.id, 'home')[0] || {}).say,
      placeName: areaTitle,
      placeAbout: area === 'kedai' ? kedai.intro : area === 'rumah' ? home.intro : `${faith.spaceName}. ${faith.greeting}`,
      timeWord: { pagi: 'pagi', siang: 'siang', sore: 'sore', malam: 'malam' }[timeOfDay()] || 'hari',
      menu: stall ? stall.def.dishes.map((id) => (dishById(id) || {}).name).filter(Boolean) : null,
      methodAbout: stall ? (METHODS[stall.def.method] || {}).about : '',
      foodNote: kedai.notes.join(' '),
      kedaiTip: (dishById(kedai.stalls[0].dishes[0]) || {}).name,
      nextHoliday,
      ritualHint: (faith.rituals[0] || {}).title ? faith.rituals[0].title.toLowerCase() : 'berdoa',
      search: (question) => {
        const results = search(index, question, { faith: faith.pustaka ? faith.id : null, limit: 1 });
        const top = results[0];
        return top && top.score >= 1.2 ? { id: top.entry.id, title: top.entry.title, summary: top.entry.summary } : null;
      },
    };
  }
  function addChatLine(who, text, extra = {}) {
    const line = document.createElement('div');
    line.className = `chat-line ${who}`;
    line.innerHTML = `<p>${esc(text)}</p>`;
    if (extra.entry) {
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'chat-link';
      link.textContent = `📖 Baca: ${extra.entry.title}`;
      link.addEventListener('click', () => openEntry(extra.entry.id));
      line.appendChild(link);
    }
    if (extra.guide) {
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'chat-link';
      link.textContent = '📚 Buka panduan';
      link.addEventListener('click', () => guideSheet.open(AREA_GUIDES[area], 'Panduan'));
      line.appendChild(link);
    }
    chatLog.appendChild(line);
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  function openChat(npcId) {
    if (!world) {
      return;
    }
    const info = world.npcInfo(npcId);
    if (!info) {
      return;
    }
    if (chatting && chatting.id !== npcId) {
      world.npcTalking(chatting.id, false);
    }
    chatting = { id: npcId, info, ctx: chatContext(info) };
    world.npcTalking(npcId, true);
    main.querySelector('[data-chat-name]').textContent = info.persona.name;
    main.querySelector('[data-chat-role]').textContent = info.persona.job || '';
    main.querySelector('[data-chat-dot]').style.background = (info.persona.attire && info.persona.attire.top) || '#999';
    chatLog.innerHTML = '';
    const opening = chatOpening(info.persona, chatting.ctx);
    addChatLine('npc', opening);
    world.npcSay(npcId, opening);
    chatChips.innerHTML = chatSuggestions(info.persona, chatting.ctx).map((text) => `<button type="button" class="chip" data-say="${esc(text)}">${esc(text)}</button>`).join('');
    chatChips.querySelectorAll('[data-say]').forEach((chip) => chip.addEventListener('click', () => sendChat(chip.dataset.say)));
    chatPanel.hidden = false;
    document.body.classList.add('chatting');
  }
  function sendChat(text) {
    if (!chatting || !text.trim()) {
      return;
    }
    const current = chatting;
    addChatLine('me', text);
    world.say(text);
    const reply = chatReply(current.info.persona, text, current.ctx);
    setTimeout(() => {
      if (chatting !== current) {
        return;
      }
      addChatLine('npc', reply.text, reply);
      world.npcSay(current.id, reply.text);
      if (reply.end) {
        setTimeout(closeChat, 1800);
      }
    }, 650);
  }
  function closeChat() {
    if (chatting && world) {
      world.npcTalking(chatting.id, false);
    }
    chatting = null;
    chatPanel.hidden = true;
    document.body.classList.remove('chatting');
  }
  main.querySelector('[data-chat-close]').addEventListener('click', closeChat);
  main.querySelector('[data-chat-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = event.target.elements.msg;
    sendChat(input.value);
    input.value = '';
  });

  let currentSitSpot = null;
  function showSit(spot) {
    clearInterval(sitTimer);
    if (spot) {
      currentSitSpot = spot;
    }
    if (!spot) {
      sitSheet.hidden = true;
      return;
    }
    // Guests sit quietly; faith-specific prayer counters (zikir, rosario) are for that faith's own members.
    const guestQuiet = mode === 'visit' && ['dzikir', 'rosary'].includes(spot.sitMode);
    sitBody.innerHTML = guestQuiet
      ? `${sitPanel({ ...spot, sitMode: 'pray' }, faith)}<p class="small muted">${spot.sitMode === 'dzikir' ? 'Zikir' : 'Rosario'} adalah doa umat ${esc(faith.short || faith.name)}. Sebagai tamu, duduklah dengan hening.</p>`
      : sitPanel(spot, faith);
    sitSheet.hidden = false;
    if (spot.sitMode === 'meal' && world) {
      const food = world.tableFood();
      if (food.length) {
        sitBody.querySelector('[data-meal-hint]').textContent = `Di meja: ${food.map((d) => d.name).join(', ')}.`;
        const prayerNote = document.createElement('p');
        prayerNote.className = 'small muted';
        prayerNote.textContent = `${prayer.title}: ${prayer.text}`;
        const eatButton = document.createElement('button');
        eatButton.className = 'btn';
        eatButton.type = 'button';
        eatButton.textContent = '🍽 Mulai makan';
        eatButton.addEventListener('click', () => {
          prayed = false;
          sitSheet.hidden = true;
          world.eat({ note: prayer.tip, title: food.map((d) => d.name).join(' & ') });
        });
        sitBody.append(prayerNote, eatButton);
      }
    }
    sitBody.querySelector('[data-sit-hold]')?.addEventListener('click', () => {
      if (world) {
        world.hold({ observe: mode === 'visit' });
      }
    });
    const tap = sitBody.querySelector('[data-tap]');
    const phrase = sitBody.querySelector('[data-phrase]');
    if (tap) {
      let count = 0;
      tap.addEventListener('click', () => {
        count += 1;
        tap.textContent = String(count);
        bead();
        if (spot.sitMode === 'dzikir') {
          phrase.textContent = DZIKIR[Math.min(2, Math.floor((count - 1) / 33))];
          if (count === 99) {
            phrase.textContent = 'Lā ilāha illallāh';
          }
        } else if (spot.sitMode === 'rosary') {
          const inDecade = count % 12;
          phrase.textContent = inDecade === 1 ? 'Bapa Kami' : inDecade === 0 ? 'Kemuliaan' : 'Salam Maria';
        }
        if (navigator.vibrate) {
          navigator.vibrate(8);
        }
      });
    }
    const breath = sitBody.querySelector('[data-breath]');
    if (breath) {
      let inhale = true;
      const cycle = () => {
        breath.classList.toggle('in', inhale);
        phrase.textContent = inhale ? 'Tarik napas…' : 'Hembuskan…';
        inhale = !inhale;
      };
      cycle();
      sitTimer = setInterval(cycle, 4000);
    }
    const timer = sitBody.querySelector('[data-timer]');
    if (timer) {
      const started = Date.now();
      sitTimer = setInterval(() => {
        const seconds = Math.floor((Date.now() - started) / 1000);
        timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
        if (seconds > 0 && seconds % 300 === 0) {
          bellSound();
        }
      }, 1000);
    }
  }

  function describeAction(spot) {
    main.querySelectorAll('[data-chip]').forEach((chip) => chip.classList.toggle('on', Boolean(spot) && chip.dataset.chip === spot.id));
    if (!spot) {
      actionCard.hidden = true;
      return;
    }
    currentSpot = spot;
    actionCard.hidden = false;
    const learnOnly = mode === 'visit' && spot.devotional;
    const verbs = { stall: 'Lihat menu', guide: 'Buka', travel: 'Pergi', sit: 'Duduk' };
    actionKind.textContent = learnOnly ? 'Mode amati' : spot.kind === 'travel' ? 'Pindah tempat' : 'Di dekatmu';
    actionLabel.textContent = learnOnly ? `${spot.label} (untuk umat ${faith.short || faith.name})` : spot.label;
    actionGo.textContent = learnOnly ? 'Pelajari' : verbs[spot.kind] || 'Lakukan';
  }

  actionGo.addEventListener('click', () => {
    if (!currentSpot || !world) {
      return;
    }
    if (mode === 'visit' && currentSpot.devotional) {
      if (currentSpot.entry) {
        openEntry(currentSpot.entry);
      }
      return;
    }
    world.perform(currentSpot.id);
  });
  main.querySelector('[data-stand]').addEventListener('click', () => {
    if (world) {
      world.standUp();
    }
    showSit(null);
  });
  // Phones: keep the 3D view clear. Greetings fold away; the ⤢ button hides every control.
  const greetToggle = main.querySelector('[data-greet-toggle]');
  const greetRow = main.querySelector('[data-greetings]');
  greetToggle.addEventListener('click', () => {
    const open = !greetRow.classList.contains('open');
    greetRow.classList.toggle('open', open);
    greetToggle.setAttribute('aria-expanded', String(open));
    greetToggle.textContent = open ? 'Salam ▴' : 'Salam ▾';
  });
  const setImmersive = (on) => {
    document.body.classList.toggle('immersive', on);
    main.querySelector('[data-immersive]').setAttribute('aria-pressed', String(on));
  };
  main.querySelector('[data-immersive]').addEventListener('click', () => setImmersive(true));
  main.querySelector('[data-immersive-exit]').addEventListener('click', () => setImmersive(false));

  // ---------- First person, time of day, sacred object in hand ----------
  const viewToggle = main.querySelector('[data-view-toggle]');
  const timeToggle = main.querySelector('[data-time-toggle]');
  const holdButton = main.querySelector('[data-hold]');
  const holdHud = main.querySelector('[data-hold-hud]');
  const TIMES = [
    { id: 'auto', icon: '🕰', short: 'Nyata', name: 'Waktu nyata' },
    { id: 'dawn', icon: '🌅', short: 'Pagi', name: 'Pagi' },
    { id: 'day', icon: '☀️', short: 'Siang', name: 'Siang' },
    { id: 'dusk', icon: '🌇', short: 'Senja', name: 'Senja' },
    { id: 'night', icon: '🌙', short: 'Malam', name: 'Malam' },
  ];
  let timeIndex = 0;
  const renderView = () => {
    const first = world && world.view() === 'first';
    viewToggle.setAttribute('aria-pressed', String(first));
    viewToggle.innerHTML = first
      ? '<span aria-hidden="true">🧍</span><small>3P</small>'
      : '<span aria-hidden="true">👁</span><small>1P</small>';
    viewToggle.setAttribute('aria-label', first ? 'Kembali ke orang ketiga' : 'Lihat dari mata sendiri (orang pertama)');
  };
  viewToggle.addEventListener('click', () => {
    if (!world) {
      return;
    }
    const next = world.view() === 'first' ? 'third' : 'first';
    world.setView(next);
    renderView();
    toast(next === 'first' ? 'Orang pertama: seret untuk melihat, ketuk tanah untuk berjalan' : 'Orang ketiga');
  });
  timeToggle.addEventListener('click', () => {
    if (!world) {
      return;
    }
    timeIndex = (timeIndex + 1) % TIMES.length;
    const choice = TIMES[timeIndex];
    world.setTime(choice.id === 'auto' ? timeOfDay() : choice.id);
    timeToggle.innerHTML = `<span aria-hidden="true">${choice.icon}</span><small>${choice.short}</small>`;
    timeToggle.setAttribute('aria-label', `Ganti waktu: ${choice.name}`);
    toast(choice.id === 'auto' ? 'Waktu mengikuti jam perangkatmu' : `Suasana ${choice.name.toLowerCase()}`);
  });

  const stepLabels = { beads: 'Geser butir', book: 'Balik halaman', incense: 'Soja / pai' };
  let holdShownIntro = false;
  function renderHold(state) {
    if (state && state.meal) {
      holdHud.hidden = true;
      document.body.classList.add('holding');
      renderView();
      renderMeal(state);
      return;
    }
    renderMeal(null);
    renderView();
    document.body.classList.toggle('holding', Boolean(state));
    holdHud.hidden = !state;
    if (!state) {
      holdShownIntro = false;
      renderView();
      return;
    }
    const q = (selector) => holdHud.querySelector(selector);
    q('[data-hold-name]').textContent = `${state.icon} ${state.name}${state.observe ? ' · mode amati' : ''}`;
    q('[data-hold-context]').textContent = state.context || '';
    q('[data-hold-script]').textContent = state.script || '';
    q('[data-hold-label]').textContent = state.observe ? '' : state.label || '';
    const counted = !state.observe && state.count !== null && state.count !== undefined;
    q('[data-hold-count]').textContent = counted
      ? `${state.count} / ${state.total}${state.round ? ` · putaran ${state.round}` : ''}`
      : '';
    let note = state.note || '';
    if (state.observe) {
      note = `${state.about} Sebagai tamu, kamu bisa mengamatinya dari dekat (seret untuk memutar).`;
    } else if (!holdShownIntro) {
      note = state.intro;
      holdShownIntro = true;
    } else if (state.done && !note) {
      note = 'Selesai. Duduklah sejenak dalam hening.';
    }
    q('[data-hold-note]').textContent = note;
    const link = q('[data-hold-link]');
    if (state.observe && state.entry) {
      link.hidden = false;
      link.textContent = 'Pelajari maknanya di Pustaka';
      link.removeAttribute('target');
      link.href = `#/entri/${encodeURIComponent(state.entry)}`;
    } else if (state.link) {
      link.hidden = false;
      link.textContent = state.link.label;
      link.target = '_blank';
      link.href = state.link.url;
    } else {
      link.hidden = true;
    }
    const stepButton = q('[data-hold-step]');
    stepButton.hidden = state.observe || Boolean(state.finishSpot && state.done);
    stepButton.textContent = stepLabels[state.kind] || 'Lanjut';
    q('[data-hold-finish]').hidden = !(state.finishSpot && state.done);
    const voice = q('[data-hold-voice]');
    voice.hidden = state.observe || !state.hasVoice;
    voice.setAttribute('aria-pressed', String(state.voice));
    voice.textContent = state.voice ? '🔈 Lantunan' : '🔇 Hening';
  }
  holdButton.addEventListener('click', () => {
    if (world) {
      showSit(null);
      world.hold({ observe: mode === 'visit' });
    }
  });
  holdHud.querySelector('[data-hold-step]').addEventListener('click', () => world && world.holdStep());
  holdHud.querySelector('[data-hold-close]').addEventListener('click', () => {
    if (world) {
      world.release();
      if (world.debug.self().sitting && currentSitSpot) {
        showSit(currentSitSpot);
      }
    }
  });
  holdHud.querySelector('[data-hold-voice]').addEventListener('click', () => {
    if (world) {
      world.setVoice(!world.holding().voice);
      renderHold(world.holding());
    }
  });
  holdHud.querySelector('[data-hold-finish]').addEventListener('click', () => {
    if (!world) {
      return;
    }
    const spotId = world.holding()?.finishSpot;
    world.release();
    if (spotId) {
      world.walkTo(spotId, { perform: true });
    }
  });
  const onEscape = (event) => {
    if (event.key === 'Escape' && world && world.holding()) {
      world.release();
    }
  };
  document.addEventListener('keydown', onEscape);
  const explained = new Set();
  main.querySelectorAll('[data-greet]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!world) {
        return;
      }
      const greeting = greetingById(button.dataset.greet);
      world.greet(greeting.id);
      if (greetRow.classList.contains('open') && window.matchMedia('(max-width: 600px)').matches) {
        greetToggle.click();
      }
      if (presence) {
        presence.sendGreet(greeting.id);
      }
      if (!explained.has(greeting.id)) {
        explained.add(greeting.id);
        toast(greeting.note);
      }
    });
  });

  let liveCount = null; // total reported by the host (viewers only see their own shard)
  let hostPeerId = null;
  const verifiedHosts = new Set();

  function updatePresenceLabel() {
    const count = presence ? presence.peerCount() : 0;
    if (live) {
      const total = live.host ? count + 1 : Math.max(liveCount || 0, count + 1);
      presenceLabel.textContent = presence ? `${total} hadir` : 'Menghubungkan…';
      return;
    }
    presenceButton.setAttribute('aria-pressed', presence ? 'true' : 'false');
    presenceButton.classList.toggle('on', Boolean(presence));
    presenceLabel.textContent = presence ? (count ? `${count + 1} hadir` : 'Bersama · menunggu') : 'Sendiri';
  }

  async function addPeerChecked(id, info) {
    let isHost = false;
    if (live && info.host && info.proof) {
      const { verifyHost } = await import('../world/live.js');
      isHost = await verifyHost(live.code, info.proof);
    }
    if (isHost) {
      verifiedHosts.add(id);
      hostPeerId = id;
    }
    if (!world) {
      return;
    }
    world.addPeer(id, { ...info, host: isHost });
    if (isHost && !live.host) {
      toast(`${info.name} (pemandu) sudah di sini`);
    } else if (!live || live.host) {
      toast(`${info.name} hadir${info.mode === 'visit' ? ' sebagai tamu' : ''}`);
    }
    updatePresenceLabel();
  }

  async function startPresence() {
    if (presence || !world) {
      return;
    }
    try {
      presenceLabel.textContent = 'Menghubungkan…';
      let rooms = `ruang-${faith.id}${area === 'ibadah' ? '' : `-${area}`}`;
      const profile = { name, color: avatarColor(), mode };
      if (live) {
        const { shardRooms, viewerShard } = await import('../world/live.js');
        rooms = live.host ? shardRooms(live.code) : [viewerShard(live.code)];
        if (live.host) {
          profile.host = true;
          profile.proof = live.secret;
        }
      }
      presence = await joinPresenceLazy(rooms, profile, {
        join: (id, info) => {
          addPeerChecked(id, info);
        },
        leave: (id) => {
          world.removePeer(id);
          verifiedHosts.delete(id);
          updatePresenceLabel();
        },
        state: (id, state) => world.updatePeer(id, state),
        act: (id, spotId) => world.peerPerform(id, spotId),
        greet: (id, greetingId) => world.peerGreet(id, greetingId),
        lead: (id, data) => {
          if (verifiedHosts.has(id)) {
            onLead(data);
          }
        },
      });
      updatePresenceLabel();
      if (live && !live.host) {
        // If nobody shows up, say so instead of leaving people staring at "Menghubungkan…".
        setTimeout(() => {
          if (presence && presence.peerCount() === 0 && main.isConnected) {
            presenceLabel.textContent = 'Menunggu pemandu…';
            toast('Belum terhubung dengan pemandu. Pastikan siarannya masih berlangsung dan kodenya benar. Kamu tetap bisa berdoa di sini.');
          }
        }, 25000);
      }
    } catch (error) {
      console.error(error);
      presence = null;
      presenceLabel.textContent = live ? 'Tidak terhubung' : 'Sendiri';
      toast('Tidak dapat terhubung. Kamu tetap bisa beribadah sendiri.');
    }
  }

  function stopPresence() {
    if (presence) {
      presence.leave();
      presence = null;
    }
    if (!live) {
      updatePresenceLabel();
    }
  }

  if (!live) {
    presenceButton.addEventListener('click', async () => {
      if (presence) {
        stopPresence();
        prefs.set({ presence: 'alone' });
        return;
      }
      if (!prefs.get().presenceAcknowledged) {
        const ok = await askConfirm({
          title: 'Hadir bersama orang lain?',
          body: 'Pengunjung lain akan melihat nama tamu, warna, dan gerakmu di ruang ini. Koneksi langsung antarperangkat juga memperlihatkan alamat IP-mu. Tanpa akun; tidak ada yang disimpan di server Jeda.',
          ok: 'Hadir bersama',
        });
        if (!ok) {
          return;
        }
        prefs.set({ presenceAcknowledged: true });
      }
      prefs.set({ presence: 'together' });
      startPresence();
    });
    main.querySelector('[data-golive]').addEventListener('click', async () => {
      const ok = await askConfirm({
        title: 'Mulai Ruang Live?',
        body: 'Kamu mendapat tautan, kode, dan QR untuk dibagikan saat siaran (TikTok, Instagram, YouTube). Penonton masuk ruang ini bersamamu tanpa akun. Mereka melihat nama tamu dan gerakmu; koneksi antarperangkat memperlihatkan alamat IP.',
        ok: 'Mulai',
      });
      if (!ok) {
        return;
      }
      const { createLive } = await import('../world/live.js');
      const record = await createLive(faith.id);
      prefs.set({ presenceAcknowledged: true });
      navigate(`#/live/${record.code}`);
    });
  }

  // ---------- Ruang Live: host tools & viewer overlays ----------
  let silenceTimer = null;
  let countTimer = null;
  function runSilence(seconds) {
    const overlay = main.querySelector('[data-silence]');
    const label = main.querySelector('[data-silence-time]');
    if (!overlay) {
      return;
    }
    clearInterval(silenceTimer);
    let remaining = Math.max(5, Math.min(600, Math.round(seconds)));
    overlay.hidden = false;
    bellSound();
    const render = () => {
      label.textContent = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
    };
    render();
    silenceTimer = setInterval(() => {
      remaining -= 1;
      render();
      if (remaining <= 0) {
        clearInterval(silenceTimer);
        overlay.hidden = true;
        bellSound();
      }
    }, 1000);
  }

  function onLead(data) {
    if (data.type === 'silence') {
      runSilence(Number(data.seconds) || 60);
    } else if (data.type === 'count' && Number.isFinite(Number(data.n))) {
      liveCount = Math.max(0, Math.min(100000, Math.round(Number(data.n))));
      updatePresenceLabel();
    } else if (data.type === 'gather' && typeof data.spot === 'string' && world) {
      const spot = world.spots.find((s) => s.id === data.spot);
      if (spot) {
        toast(`Pemandu mengajak berkumpul: ${spot.label}`);
        main.querySelector(`[data-chip="${CSS.escape(spot.id)}"]`)?.classList.add('invite');
      }
    } else if (data.type === 'end') {
      stopPresence();
      main.querySelector('[data-ended]').hidden = false;
    }
  }

  async function fillShare() {
    const { liveUrl, qrSvg, shortJoinHint } = await import('../world/live.js');
    const url = liveUrl(live.code);
    main.querySelectorAll('[data-short-url]').forEach((el) => {
      el.textContent = shortJoinHint();
    });
    const linkInput = main.querySelector('[data-share-link]');
    if (linkInput) {
      linkInput.value = url;
    }
    try {
      const svg = await qrSvg(url);
      main.querySelectorAll('[data-qr], [data-share-qr]').forEach((el) => {
        el.innerHTML = svg;
      });
    } catch (error) {
      console.error(error);
    }
    return url;
  }

  if (live) {
    fillShare();
    const shareSheet = main.querySelector('[data-share-sheet]');
    const caption = () => `Yuk hadir dan berdoa bersama di ${faith.spaceName} virtual Jeda. Buka ${main.querySelector('[data-share-link]').value} atau masuk ${main.querySelector('[data-short-url]').textContent} lalu ketik kode ${live.code}`;
    main.querySelector('[data-live-share]').addEventListener('click', () => {
      shareSheet.hidden = false;
    });
    main.querySelector('[data-close-share]').addEventListener('click', () => {
      shareSheet.hidden = true;
    });
    main.querySelectorAll('[data-copy]').forEach((button) => {
      button.addEventListener('click', async () => {
        const text = button.dataset.copy === 'link' ? main.querySelector('[data-share-link]').value : caption();
        try {
          await navigator.clipboard.writeText(text);
          toast('Tersalin');
        } catch {
          main.querySelector('[data-share-link]').select();
          toast('Tekan lama untuk menyalin');
        }
      });
    });
    main.querySelector('[data-native-share]').addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({ title: `Ruang Live Jeda · ${faith.spaceName}`, text: caption(), url: main.querySelector('[data-share-link]').value });
        } catch {
          // dismissed
        }
      } else {
        toast('Gunakan "Salin tautan"');
      }
    });
    if (live.host) {
      main.querySelectorAll('[data-host]').forEach((button) => {
        button.addEventListener('click', async () => {
          const action = button.dataset.host;
          if (action === 'share') {
            shareSheet.hidden = false;
          } else if (action === 'silence') {
            runSilence(60);
            presence?.sendLead({ type: 'silence', seconds: 60 });
          } else if (action === 'gather') {
            if (!currentSpot) {
              toast('Berdirilah dekat salah satu tempat dulu, lalu ajak penonton ke sana.');
              return;
            }
            presence?.sendLead({ type: 'gather', spot: currentSpot.id });
            toast(`Penonton diajak ke: ${currentSpot.label}`);
          } else if (action === 'broadcast') {
            const card = main.querySelector('[data-broadcast]');
            card.hidden = !card.hidden;
            button.classList.toggle('on', !card.hidden);
            stage.classList.toggle('broadcasting', !card.hidden);
          } else if (action === 'end') {
            if (!(await askConfirm({ title: 'Akhiri Ruang Live?', body: 'Semua penonton akan melihat bahwa siaran sudah selesai.', ok: 'Akhiri', danger: true }))) {
              return;
            }
            presence?.sendLead({ type: 'end' });
            import('../world/live.js').then(({ endHosting }) => endHosting());
            setTimeout(() => {
              stopPresence();
              navigate(`#/ruang/${faith.id}`);
            }, 600);
          }
        });
      });
      countTimer = setInterval(() => {
        if (presence) {
          presence.sendLead({ type: 'count', n: presence.peerCount() + 1 });
          updatePresenceLabel();
        }
      }, 5000);
    }
  }

  (async () => {
    const { webglAvailable, createWorld } = await import('../world/engine.js');
    if (!webglAvailable()) {
      showFlat();
      return;
    }
    if (!main.isConnected) {
      return;
    }
    world = createWorld(worldBox, {
      sceneId,
      faithId: faith.id,
      carry: loadCarry(),
      onStall: openMenu,
      onGuide: (spot) => guideSheet.open(spot.guides || AREA_GUIDES[area], spot.label),
      onTravel: (spot) => travel(spot.to),
      onNpc: (id) => openChat(id),
      onCarry: saveCarry,
      time,
      mode,
      me: { name, color: avatarColor() },
      quality: prefs.get().quality3d || 'auto',
      onNearSpot: describeAction,
      onSit: (spot) => {
        if (!spot) {
          currentSitSpot = null;
        }
        showSit(spot);
      },
      onHold: renderHold,
      onAction: (spot) => {
        if (presence) {
          presence.sendAct(spot.id);
        }
      },
      onMove: (state) => {
        if (presence) {
          presence.sendState(state);
        }
      },
      onSpecial: (spot) => {
        if (spot.kind === 'ciamsi') {
          scrollToTool('ciamsi');
        } else if (spot.entry) {
          openEntry(spot.entry);
        }
      },
      onBlocked: (message) => toast(message),
    });
    window.__jedaWorld = world;
    const heldItem = world.heldItem();
    if (heldItem) {
      holdButton.hidden = false;
      main.querySelector('[data-hold-icon]').textContent = heldItem.icon;
      main.querySelector('[data-hold-short]').textContent = heldItem.name.replace(' 108', '');
      holdButton.setAttribute('aria-label', `${mode === 'visit' ? 'Amati' : 'Pegang'} ${heldItem.name} (orang pertama)`);
    }
    if (world.attire && area === 'ibadah') {
      setTimeout(() => toast(`Pakaianmu di ${faith.spaceName}: ${world.attire}`), 900);
    } else if (area === 'kedai') {
      setTimeout(() => toast('Dekati kios untuk pesan. Ketuk orang untuk mengobrol.'), 900);
    } else if (area === 'rumah' && world.carrying().length) {
      setTimeout(() => toast('Bungkusanmu ikut pulang. Duduk di meja makan untuk membukanya.'), 900);
    }
    if (query.get('panduan')) {
      guideSheet.open(query.get('panduan'));
    }
    const chips = main.querySelector('[data-chips]');
    chips.innerHTML = world.spots.filter((spot) => spot.kind !== 'travel').map((spot) => `<button type="button" class="chip" data-chip="${esc(spot.id)}">${esc(spot.short || spot.label)}</button>`).join('');
    chips.querySelectorAll('[data-chip]').forEach((chip) => {
      chip.addEventListener('click', () => {
        showSit(null);
        world.walkTo(chip.dataset.chip, { instant: Boolean(prefs.get().reducedMotion) });
      });
    });
    setTimeout(() => main.querySelector('[data-hint]')?.classList.add('fade'), 6000);
    if (live || (prefs.get().presence === 'together' && prefs.get().presenceAcknowledged)) {
      startPresence();
    }
  })().catch((error) => {
    console.error(error);
    showFlat();
  });

  // Last resort only (3D switched off in the browser or a blocklisted GPU): picture + how to turn 3D on.
  function showFlat() {
    worldBox.innerHTML = `${sceneSvg(faith.scene, time, faith.spaceName, festiveInfo ? festiveInfo.decor : null)}
      <div class="flat-note">
        <strong>3D belum aktif di browser ini</strong>
        <span>Buka di Chrome/Safari terbaru, atau nyalakan "akselerasi perangkat keras" (Chrome: Setelan → Sistem). Kegiatan, salam, panduan (📚), dan Ruang Live tetap bisa dipakai.</span>
      </div>`;
    stage.classList.add('flat');
  }

  return () => {
    cleanups.forEach((fn) => fn && fn());
    stopAuto();
    clearInterval(mealRefresh);
    closeChat();
    guideSheet.destroy();
    document.body.classList.remove('guide-open');
    clearInterval(sitTimer);
    clearInterval(silenceTimer);
    clearInterval(countTimer);
    stopPresence();
    if (world) {
      world.destroy();
    }
    delete window.__jedaWorld;
    delete document.body.dataset.faith;
    document.body.classList.remove('immersive');
    document.body.classList.remove('in-space');
    document.body.classList.remove('holding');
    document.removeEventListener('keydown', onEscape);
  };
}

async function joinPresenceLazy(room, profile, handlers) {
  const { joinPresence } = await import('../world/presence.js');
  return joinPresence(room, profile, handlers);
}
