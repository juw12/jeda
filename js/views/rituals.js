// Interactive ritual widgets. Each builder returns { cleanup, demo }.
// In visit mode, devotional widgets are shown as demonstrations only (observe and learn).

import * as audio from '../audio.js';
import { esc, toast, uid } from '../ui.js';
import { load, save, prefs } from '../store.js';
import { prayerTimes, CITIES, formatClock } from '../prayertimes.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const todayKey = () => new Date().toISOString().slice(0, 10);

// ---------- Incense (hio / dupa) ----------
function incense(body, ritual) {
  const count = ritual.sticks || 3;
  const sticks = Array.from({ length: count }, (_, i) => {
    const x = 100 + (i - (count - 1) / 2) * 16;
    return `<g class="stick" style="--i:${i}">
        <line x1="${x}" y1="34" x2="${x}" y2="112" stroke="#b5462f" stroke-width="2.5" stroke-linecap="round"/>
        <circle class="tip" cx="${x}" cy="34" r="2.6" fill="#5a2a1a"/>
        <path class="smoke" d="M${x} 30 q -6 -10 0 -18 q 6 -8 0 -18" stroke="#ddd" stroke-width="1.6" fill="none"/>
      </g>`;
  }).join('');
  body.innerHTML = `
    <div class="incense-stage">
      <svg viewBox="0 0 200 160" class="ritual-svg" aria-hidden="true">
        <g class="sticks">${sticks}</g>
        <path d="M46 112 L154 112 L146 134 Q100 150 54 134 Z" fill="#9b7a35"/>
        <rect x="42" y="106" width="116" height="9" rx="4" fill="#c29a45"/>
        <path d="M64 124 h72" stroke="#6d5221" stroke-width="2"/>
      </svg>
    </div>
    <div class="row">
      <button class="btn" data-act="light">Nyalakan ${count} batang</button>
      <button class="btn" data-act="place" disabled>Tancapkan di ${esc(ritual.burner || 'tempat dupa')}</button>
    </div>
    <p class="ritual-status" aria-live="polite"></p>`;
  const stage = body.querySelector('.incense-stage');
  const status = body.querySelector('.ritual-status');
  const lightButton = body.querySelector('[data-act="light"]');
  const placeButton = body.querySelector('[data-act="place"]');

  const light = () => {
    stage.classList.remove('placed');
    stage.classList.add('lit');
    audio.woodblock();
    status.textContent = ritual.litText || 'Api dikibas padam (tidak ditiup). Pegang dengan kedua tangan, hening sejenak.';
    placeButton.disabled = body.classList.contains('observe');
    lightButton.disabled = true;
  };
  const place = () => {
    stage.classList.add('placed');
    audio.chime();
    status.textContent = ritual.placedText || 'Telah ditancapkan. Asap naik perlahan; biarkan hati ikut tenang.';
    placeButton.disabled = true;
    setTimeout(() => {
      lightButton.disabled = body.classList.contains('observe');
      lightButton.textContent = 'Ulangi';
    }, 1500);
  };
  lightButton.addEventListener('click', light);
  placeButton.addEventListener('click', place);
  return {
    demo: async () => {
      light();
      await sleep(2200);
      place();
    },
  };
}

// ---------- Candle ----------
function candle(body, ritual, { faith }) {
  const storeKey = `candles:${faith.id}`;
  body.innerHTML = `
    <div class="candle-stage">
      <svg viewBox="0 0 120 160" class="ritual-svg candle-svg" aria-hidden="true">
        <g class="flame">
          <ellipse cx="60" cy="44" rx="16" ry="22" fill="#ffb347" opacity="0.25"/>
          <path d="M60 22 Q70 40 60 56 Q50 40 60 22 Z" fill="#ffd27a"/>
          <path d="M60 34 Q64 44 60 52 Q56 44 60 34 Z" fill="#fff4cc"/>
        </g>
        <line x1="60" y1="56" x2="60" y2="62" stroke="#333" stroke-width="2"/>
        <rect x="44" y="62" width="32" height="76" rx="4" fill="#f4ede1"/>
        <rect x="34" y="136" width="52" height="8" rx="3" fill="#a88b5c"/>
      </svg>
    </div>
    ${ritual.intention === false ? '' : `
    <label class="field">
      <span>${esc(ritual.intentionLabel || 'Ujud / doa pribadi (opsional)')}</span>
      <textarea rows="2" maxlength="280" placeholder="Hanya tersimpan di perangkat ini."></textarea>
    </label>`}
    <div class="row">
      <button class="btn" data-act="light">Nyalakan lilin</button>
    </div>
    <p class="ritual-status" aria-live="polite"></p>
    <details class="mine"><summary>Lilin yang pernah kunyalakan di sini</summary><div class="mine-list"></div></details>`;
  const stage = body.querySelector('.candle-stage');
  const status = body.querySelector('.ritual-status');
  const textarea = body.querySelector('textarea');
  const list = body.querySelector('.mine-list');

  const renderList = () => {
    const candles = load(storeKey, []);
    list.innerHTML = candles.length === 0
      ? '<p class="muted small">Belum ada.</p>'
      : `<ul class="plain">${candles.slice(0, 20).map((c) => `<li><span class="muted small">${new Date(c.at).toLocaleDateString('id-ID')}</span> ${esc(c.text || '(tanpa ujud)')}</li>`).join('')}</ul>
         <button class="btn-ghost small" data-act="clear-candles">Hapus semua</button>`;
  };
  const light = (persist = true) => {
    stage.classList.add('lit');
    audio.chime();
    if (persist) {
      const candles = load(storeKey, []);
      candles.unshift({ id: uid(), text: textarea ? textarea.value.trim() : '', at: Date.now() });
      save(storeKey, candles.slice(0, 200));
      if (textarea) {
        textarea.value = '';
      }
      renderList();
    }
    status.textContent = ritual.litText || 'Lilin menyala. Biarkan doamu sederhana dan jujur.';
  };
  body.querySelector('[data-act="light"]').addEventListener('click', () => light(true));
  body.addEventListener('click', (event) => {
    if (event.target.matches('[data-act="clear-candles"]')) {
      save(storeKey, []);
      renderList();
    }
  });
  renderList();
  return { demo: async () => light(false) };
}

// ---------- Counter (bows, mala, tasbih, rosary) ----------
const RING = 2 * Math.PI * 52;

function counterCore(body, ritual, phases, header = '') {
  const isBow = ritual.style === 'bow';
  body.innerHTML = `
    ${header}
    <div class="counter">
      <div class="counter-visual">
        <svg viewBox="0 0 120 120" class="counter-ring" aria-hidden="true">
          <circle cx="60" cy="60" r="52" class="track"/>
          <circle cx="60" cy="60" r="52" class="progress" stroke-dasharray="${RING}" stroke-dashoffset="${RING}"/>
        </svg>
        ${isBow ? `<svg viewBox="0 0 120 120" class="bow-figure" aria-hidden="true">
            <ellipse cx="60" cy="104" rx="30" ry="6" fill="#7a2e2e"/>
            <g class="bower"><circle cx="60" cy="44" r="9" fill="currentColor"/><path d="M48 100 Q46 70 60 56 Q74 70 72 100 Z" fill="currentColor"/></g>
          </svg>` : ''}
        <div class="counter-center">
          <div class="counter-context small muted"></div>
          <div class="counter-script" dir="auto"></div>
          <div class="counter-label"></div>
          <div class="counter-num">0</div>
          <div class="counter-of muted"></div>
        </div>
      </div>
      <button class="btn btn-big" data-act="tap">${esc(ritual.tapLabel || (isBow ? 'Bersujud' : 'Ketuk'))}</button>
      <div class="row">
        ${(ritual.presets || []).map((n) => `<button class="chip" data-act="preset" data-n="${n}">${n}×</button>`).join('')}
        <button class="btn-ghost" data-act="reset">Ulang dari awal</button>
      </div>
      <p class="ritual-status" aria-live="polite"></p>
    </div>`;
  let currentPhases = phases;
  let phaseIndex = 0;
  let count = 0;
  const progress = body.querySelector('.progress');
  const elements = {
    context: body.querySelector('.counter-context'),
    script: body.querySelector('.counter-script'),
    label: body.querySelector('.counter-label'),
    num: body.querySelector('.counter-num'),
    of: body.querySelector('.counter-of'),
    status: body.querySelector('.ritual-status'),
    bower: body.querySelector('.bow-figure'),
  };
  const totalKey = `count:${ritual.id}`;

  const render = () => {
    const phase = currentPhases[Math.min(phaseIndex, currentPhases.length - 1)];
    elements.context.textContent = phase.context || '';
    elements.script.textContent = phase.script || '';
    elements.label.textContent = phase.label;
    elements.num.textContent = count;
    elements.of.textContent = `/ ${phase.n}`;
    progress.setAttribute('stroke-dashoffset', String(RING * (1 - count / phase.n)));
  };
  const tap = (persist = true) => {
    if (phaseIndex >= currentPhases.length) {
      return;
    }
    const phase = currentPhases[phaseIndex];
    count += 1;
    if (isBow) {
      audio.woodblock();
      elements.bower.classList.remove('bowing');
      void elements.bower.offsetWidth;
      elements.bower.classList.add('bowing');
    } else {
      audio.bead();
    }
    if (persist) {
      save(totalKey, load(totalKey, 0) + 1);
    }
    if (count >= phase.n) {
      phaseIndex += 1;
      if (phaseIndex >= currentPhases.length) {
        audio.bell();
        render();
        elements.status.textContent = ritual.doneText || 'Selesai. Duduklah sejenak dalam hening.';
        return;
      }
      audio.chime();
      count = 0;
      elements.status.textContent = `Lanjut: ${currentPhases[phaseIndex].label}`;
    }
    render();
  };
  const reset = () => {
    phaseIndex = 0;
    count = 0;
    elements.status.textContent = '';
    render();
  };
  body.querySelector('[data-act="tap"]').addEventListener('click', () => tap(true));
  body.querySelector('[data-act="reset"]').addEventListener('click', reset);
  body.querySelectorAll('[data-act="preset"]').forEach((button) => {
    button.addEventListener('click', () => {
      const n = Number(button.dataset.n);
      currentPhases = [{ ...phases[0], n }];
      reset();
    });
  });
  const keyHandler = (event) => {
    if (event.code === 'Space' && body.closest('.ritual').contains(document.activeElement)
      && !['TEXTAREA', 'INPUT', 'SELECT'].includes(document.activeElement.tagName)) {
      event.preventDefault();
      tap(true);
    }
  };
  document.addEventListener('keydown', keyHandler);
  render();
  return {
    cleanup: () => document.removeEventListener('keydown', keyHandler),
    demo: async () => {
      reset();
      for (let i = 0; i < 5; i++) {
        tap(false);
        await sleep(700);
      }
      elements.status.textContent = 'Demonstrasi: hitungan berlanjut hingga selesai.';
    },
  };
}

function counter(body, ritual) {
  return counterCore(body, ritual, ritual.phases);
}

const ROSARY_MYSTERIES = {
  gembira: {
    name: 'Peristiwa Gembira',
    list: [
      'Maria menerima kabar gembira dari Malaikat Gabriel',
      'Maria mengunjungi Elisabet',
      'Yesus dilahirkan di Betlehem',
      'Yesus dipersembahkan di Bait Allah',
      'Yesus diketemukan dalam Bait Allah',
    ],
  },
  terang: {
    name: 'Peristiwa Terang',
    list: [
      'Yesus dibaptis di Sungai Yordan',
      'Yesus menyatakan diri-Nya dalam pesta perkawinan di Kana',
      'Yesus memberitakan Kerajaan Allah dan menyerukan pertobatan',
      'Yesus menampakkan kemuliaan-Nya',
      'Yesus menetapkan Ekaristi',
    ],
  },
  sedih: {
    name: 'Peristiwa Sedih',
    list: [
      'Yesus berdoa kepada Bapa-Nya di Taman Getsemani',
      'Yesus didera',
      'Yesus dimahkotai duri',
      'Yesus memanggul salib-Nya ke Gunung Kalvari',
      'Yesus wafat di salib',
    ],
  },
  mulia: {
    name: 'Peristiwa Mulia',
    list: [
      'Yesus bangkit dari antara orang mati',
      'Yesus naik ke surga',
      'Roh Kudus turun atas para rasul',
      'Maria diangkat ke surga',
      'Maria dimahkotai di surga',
    ],
  },
};
// Sunday..Saturday
const ROSARY_BY_WEEKDAY = ['mulia', 'gembira', 'sedih', 'mulia', 'terang', 'sedih', 'gembira'];

function rosary(body, ritual) {
  const key = ROSARY_BY_WEEKDAY[new Date().getDay()];
  const set = ROSARY_MYSTERIES[key];
  const phases = [
    { label: 'Tanda Salib & Aku Percaya', n: 1 },
    { label: 'Bapa Kami', n: 1 },
    { label: 'Salam Maria (iman, harapan, kasih)', n: 3 },
    { label: 'Kemuliaan', n: 1 },
  ];
  set.list.forEach((mystery, index) => {
    const context = `${set.name} ${index + 1}: ${mystery}`;
    phases.push(
      { label: 'Bapa Kami', n: 1, context },
      { label: 'Salam Maria', n: 10, context },
      { label: 'Kemuliaan', n: 1, context },
    );
  });
  phases.push({ label: 'Salam, ya Ratu', n: 1 });
  const header = `<p class="small">Hari ini: <strong>${set.name}</strong>
    <span class="muted">(Senin & Sabtu Gembira, Selasa & Jumat Sedih, Rabu & Minggu Mulia, Kamis Terang)</span></p>`;
  return counterCore(body, { ...ritual, tapLabel: 'Butir berikutnya' }, phases, header);
}

// ---------- Poe (jiaobei) ----------
function tossPoe() {
  const first = Math.random() < 0.5 ? 'flat' : 'round';
  const second = Math.random() < 0.5 ? 'flat' : 'round';
  if (first !== second) {
    return { pair: [first, second], kind: 'sing' };
  }
  return { pair: [first, second], kind: first === 'flat' ? 'cio' : 'im' };
}

const POE_TEXT = {
  sing: { title: 'Sing Poe (Siang Poe)', text: 'Satu telungkup, satu telentang: dimaknai sebagai "ya / setuju".' },
  cio: { title: 'Cio Poe (poe tertawa)', text: 'Keduanya telentang: dimaknai belum jelas. Renungkan kembali pertanyaanmu, lalu ulangi.' },
  im: { title: 'Im Poe', text: 'Keduanya telungkup: dimaknai "belum / tidak". Tenangkan diri dan coba lagi nanti.' },
};

function poeSvg(pair) {
  return pair.map((side) => `
    <svg viewBox="0 0 60 40" class="poe-block ${side}" aria-label="${side === 'flat' ? 'sisi datar di atas' : 'sisi cembung di atas'}">
      ${side === 'flat'
    ? '<path d="M5 30 Q30 2 55 30 Z" fill="#c0392b"/><path d="M5 30 L55 30" stroke="#7b1f16" stroke-width="3"/>'
    : '<path d="M5 30 Q30 2 55 30 Q30 38 5 30 Z" fill="#a93226"/>'}
    </svg>`).join('');
}

function poe(body) {
  body.innerHTML = `
    <p class="small muted">Pikirkan satu pertanyaan dengan hormat. Pertanyaan tidak disimpan.</p>
    <div class="poe-stage" aria-live="polite"></div>
    <div class="row"><button class="btn" data-act="toss">Lempar poe</button></div>
    <p class="ritual-status"></p>`;
  const stage = body.querySelector('.poe-stage');
  const status = body.querySelector('.ritual-status');
  const toss = () => {
    const result = tossPoe();
    audio.woodblock();
    setTimeout(audio.woodblock, 180);
    stage.innerHTML = `<div class="poe-pair tossed">${poeSvg(result.pair)}</div>`;
    status.innerHTML = `<strong>${POE_TEXT[result.kind].title}.</strong> ${POE_TEXT[result.kind].text}`;
  };
  body.querySelector('[data-act="toss"]').addEventListener('click', toss);
  return { demo: async () => toss() };
}

// ---------- Ciam si ----------
function ciamsi(body, ritual, { content }) {
  const set = content.ciamsi.sets[ritual.set] || { name: 'Ciam si', poems: {} };
  const total = ritual.count || 100;
  const sticks = Array.from({ length: 14 }, (_, i) => `<line x1="${70 + i * 4.5}" y1="${30 + (i % 3) * 4}" x2="${72 + i * 4}" y2="100" stroke="#c9a15a" stroke-width="2.4" stroke-linecap="round"/>`).join('');
  body.innerHTML = `
    <div class="ciamsi-stage">
      <svg viewBox="0 0 200 160" class="ritual-svg" aria-hidden="true">
        <g class="cylinder">
          ${sticks}
          <rect x="66" y="70" width="68" height="76" rx="8" fill="#b22222"/>
          <rect x="66" y="80" width="68" height="6" fill="#e0b44c"/>
          <text x="100" y="122" text-anchor="middle" font-size="18" fill="#e0b44c">籤</text>
        </g>
        <line class="fallen" x1="120" y1="150" x2="182" y2="138" stroke="#c9a15a" stroke-width="3" stroke-linecap="round"/>
      </svg>
    </div>
    <p class="small muted">Pikirkan pertanyaanmu dengan tenang dan sopan. Pertanyaan tidak disimpan.</p>
    <div class="row">
      <button class="btn" data-act="shake">Kocok ciam</button>
      <button class="btn" data-act="toss" disabled>Lempar poe untuk konfirmasi</button>
    </div>
    <div class="poe-stage"></div>
    <div class="ciamsi-result" aria-live="polite"></div>`;
  const stage = body.querySelector('.ciamsi-stage');
  const result = body.querySelector('.ciamsi-result');
  const poeStage = body.querySelector('.poe-stage');
  const shakeButton = body.querySelector('[data-act="shake"]');
  const tossButton = body.querySelector('[data-act="toss"]');
  let number = null;

  const shake = async () => {
    stage.classList.remove('dropped');
    stage.classList.add('shaking');
    shakeButton.disabled = true;
    poeStage.innerHTML = '';
    result.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      audio.woodblock();
      await sleep(140);
    }
    stage.classList.remove('shaking');
    stage.classList.add('dropped');
    number = 1 + Math.floor(Math.random() * total);
    result.innerHTML = `<p>Batang ciam <strong>nomor ${number}</strong> jatuh. Lempar poe untuk memastikan.</p>`;
    tossButton.disabled = body.classList.contains('observe');
    shakeButton.disabled = body.classList.contains('observe');
  };
  const toss = () => {
    const outcome = tossPoe();
    audio.woodblock();
    poeStage.innerHTML = `<div class="poe-pair tossed">${poeSvg(outcome.pair)}</div>`;
    const info = POE_TEXT[outcome.kind];
    if (outcome.kind !== 'sing') {
      result.innerHTML = `<p><strong>${info.title}.</strong> ${outcome.kind === 'cio'
        ? 'Belum jelas. Renungkan kembali, lalu lempar poe lagi.'
        : 'Nomor ini belum dikonfirmasi. Kocok ulang ciam.'}</p>`;
      if (outcome.kind === 'im') {
        tossButton.disabled = true;
      }
      return;
    }
    tossButton.disabled = true;
    const poem = set.poems[String(number)];
    result.innerHTML = `
      <p><strong>${info.title}.</strong> Nomor <strong>${number}</strong> dikonfirmasi.</p>
      ${poem
    ? `<blockquote class="poem">${poem.hanzi ? `<p lang="zh">${esc(poem.hanzi)}</p>` : ''}${poem.hokkien ? `<p class="muted">${esc(poem.hokkien)}</p>` : ''}<p>${esc(poem.id)}</p><footer class="small muted">${esc(set.name)}</footer></blockquote>`
    : `<p class="muted">Teks syair nomor ${number} untuk ${esc(set.name)} belum tersedia di Hening.
           Syair resmi berbeda di tiap klenteng; mintalah lembar syair dan tafsirnya kepada pengurus klenteng.</p>`}
      <p class="small muted">Ciam si adalah tradisi permenungan, bukan ramalan pasti. Beberapa klenteng mensyaratkan tiga kali Sing Poe berturut-turut.</p>`;
  };
  shakeButton.addEventListener('click', shake);
  tossButton.addEventListener('click', toss);
  return {
    demo: async () => {
      await shake();
      await sleep(900);
      toss();
    },
  };
}

// ---------- Burn joss paper ----------
function burn(body, ritual) {
  body.innerHTML = `
    <div class="burn-stage">
      <svg viewBox="0 0 200 160" class="ritual-svg" aria-hidden="true">
        <g class="papers">
          <rect x="20" y="40" width="22" height="16" fill="#e8c35a" stroke="#b8902a"/>
          <rect x="26" y="34" width="22" height="16" fill="#e8c35a" stroke="#b8902a"/>
          <rect x="32" y="28" width="22" height="16" fill="#d8b04a" stroke="#b8902a"/>
        </g>
        <rect x="70" y="60" width="80" height="84" rx="4" fill="#5b4636"/>
        <path d="M64 62 L110 30 L156 62 Z" fill="#6e5442"/>
        <rect x="92" y="96" width="36" height="34" rx="3" fill="#1a1210"/>
        <g class="fire">
          <path d="M98 128 Q102 108 110 100 Q118 108 122 128 Z" fill="#ff7a1a"/>
          <path d="M104 128 Q106 116 110 110 Q114 116 116 128 Z" fill="#ffd36b"/>
        </g>
        <path class="smoke" d="M110 30 q -8 -10 0 -18 q 8 -8 0 -16" stroke="#bbb" stroke-width="2" fill="none"/>
      </svg>
    </div>
    <div class="row"><button class="btn" data-act="burn">${esc(ritual.actionLabel || 'Bakar kim cua')}</button></div>
    <p class="ritual-status" aria-live="polite"></p>`;
  const stage = body.querySelector('.burn-stage');
  const status = body.querySelector('.ritual-status');
  const button = body.querySelector('[data-act="burn"]');
  const run = async () => {
    button.disabled = true;
    stage.classList.remove('burning');
    void stage.offsetWidth;
    stage.classList.add('burning');
    audio.crackle(4);
    status.textContent = 'Kertas dimasukkan ke kim lo (tungku). Api membesar lalu mereda.';
    await sleep(4500);
    status.textContent = ritual.doneText || 'Selesai. Secara virtual ini simbol penghormatan; maknanya dijelaskan di Pustaka.';
    button.disabled = body.classList.contains('observe');
  };
  button.addEventListener('click', run);
  return { demo: run };
}

// ---------- Ancestor altar ----------
function ancestor(body) {
  const storeKey = 'ancestors';
  body.innerHTML = `
    <p class="small muted">Nama leluhur hanya tersimpan di perangkat ini.</p>
    <form class="ancestor-form row">
      <input name="name" required maxlength="60" placeholder="Nama (mis. Kong Tan / Ma Lim)">
      <input name="relation" maxlength="40" placeholder="Hubungan (mis. kakek)">
      <input name="years" maxlength="30" placeholder="Tahun (opsional)">
      <button class="btn" type="submit" data-act="add">Tambah papan nama</button>
    </form>
    <div class="tablets"></div>`;
  const tablets = body.querySelector('.tablets');
  const form = body.querySelector('form');
  const OFFERINGS = [
    { id: 'tea', label: 'Teh', icon: '🍵' },
    { id: 'fruit', label: 'Buah', icon: '🍊' },
    { id: 'incense', label: 'Hio', icon: '🕯️' },
  ];
  const render = () => {
    const list = load(storeKey, []);
    if (list.length === 0) {
      tablets.innerHTML = '<p class="muted small">Belum ada papan nama leluhur.</p>';
      return;
    }
    const today = todayKey();
    tablets.innerHTML = list.map((item) => {
      const offered = (item.offerings && item.offerings[today]) || [];
      return `<div class="tablet" data-id="${item.id}">
          <div class="tablet-name">${esc(item.name)}</div>
          <div class="small muted">${esc(item.relation || '')} ${esc(item.years || '')}</div>
          <div class="tablet-offered" aria-label="Persembahan hari ini">${offered.map((o) => OFFERINGS.find((x) => x.id === o)?.icon || '').join(' ')}</div>
          <div class="row">${OFFERINGS.map((o) => `<button class="chip" data-act="offer" data-offer="${o.id}">${o.icon} ${o.label}</button>`).join('')}
          <button class="btn-ghost small" data-act="remove">Hapus</button></div>
        </div>`;
    }).join('');
  };
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const list = load(storeKey, []);
    list.push({
      id: uid(),
      name: String(data.get('name')).trim(),
      relation: String(data.get('relation') || '').trim(),
      years: String(data.get('years') || '').trim(),
      offerings: {},
    });
    save(storeKey, list);
    form.reset();
    render();
  });
  tablets.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) {
      return;
    }
    const id = button.closest('.tablet').dataset.id;
    const list = load(storeKey, []);
    const item = list.find((x) => x.id === id);
    if (button.dataset.act === 'offer') {
      const today = todayKey();
      item.offerings = item.offerings || {};
      const offered = new Set(item.offerings[today] || []);
      offered.add(button.dataset.offer);
      item.offerings[today] = [...offered];
      audio.chime();
    }
    if (button.dataset.act === 'remove') {
      if (!confirm(`Hapus papan nama ${item.name}?`)) {
        return;
      }
      list.splice(list.indexOf(item), 1);
    }
    save(storeKey, list);
    render();
  });
  render();
  return {};
}

// ---------- Canang sari ----------
function offering(body) {
  const colors = [
    { id: 'putih', label: 'Putih', fill: '#f5f5f0' },
    { id: 'merah', label: 'Merah', fill: '#d13a2f' },
    { id: 'kuning', label: 'Kuning', fill: '#f2c230' },
    { id: 'hitam', label: 'Biru/Hitam', fill: '#2c3e70' },
  ];
  const slots = [
    { id: 'timur', label: 'Timur', expected: 'putih', x: 150, y: 80 },
    { id: 'selatan', label: 'Selatan', expected: 'merah', x: 100, y: 130 },
    { id: 'barat', label: 'Barat', expected: 'kuning', x: 50, y: 80 },
    { id: 'utara', label: 'Utara', expected: 'hitam', x: 100, y: 30 },
  ];
  body.innerHTML = `
    <div class="canang-stage">
      <svg viewBox="0 0 200 160" class="ritual-svg" aria-label="Susunan canang sari">
        <rect x="40" y="20" width="120" height="120" rx="10" fill="#6b8e3a"/>
        <rect x="48" y="28" width="104" height="104" rx="8" fill="#86a94a"/>
        <circle cx="100" cy="80" r="12" fill="#2f5d2a"/>
        ${slots.map((slot) => `<g class="slot" data-slot="${slot.id}" tabindex="0" role="button" aria-label="Tempatkan bunga di ${slot.label}">
            <circle cx="${slot.x}" cy="${slot.y}" r="16" fill="rgba(255,255,255,0.15)" stroke="#fff" stroke-dasharray="3 3"/>
            <text x="${slot.x}" y="${slot.y + 30 > 158 ? slot.y - 20 : slot.y + 30}" text-anchor="middle" font-size="9" fill="#fff">${slot.label}</text>
          </g>`).join('')}
        <path class="smoke" d="M100 66 q -6 -10 0 -18 q 6 -8 0 -18" stroke="#eee" stroke-width="1.6" fill="none"/>
      </svg>
    </div>
    <div class="row palette">${colors.map((c) => `<button class="chip" data-act="color" data-color="${c.id}"><span class="swatch" style="background:${c.fill}"></span>${c.label}</button>`).join('')}</div>
    <p class="small muted">Pilih warna bunga, lalu ketuk arah pada canang.</p>
    <div class="row"><button class="btn" data-act="offer" disabled>Haturkan</button><button class="btn-ghost" data-act="reset">Ulang</button></div>
    <p class="ritual-status" aria-live="polite"></p>`;
  const stage = body.querySelector('.canang-stage');
  const status = body.querySelector('.ritual-status');
  const offerButton = body.querySelector('[data-act="offer"]');
  let selected = null;
  let placed = {};

  const place = (slotId, colorId) => {
    const slot = slots.find((s) => s.id === slotId);
    const color = colors.find((c) => c.id === colorId);
    const group = stage.querySelector(`[data-slot="${slotId}"]`);
    group.querySelector('.flower')?.remove();
    group.insertAdjacentHTML('beforeend', `<g class="flower">${[0, 72, 144, 216, 288].map((angle) => {
      const rx = slot.x + 7 * Math.cos((angle * Math.PI) / 180);
      const ry = slot.y + 7 * Math.sin((angle * Math.PI) / 180);
      return `<circle cx="${rx}" cy="${ry}" r="6" fill="${color.fill}"/>`;
    }).join('')}<circle cx="${slot.x}" cy="${slot.y}" r="3" fill="#f2c230"/></g>`);
    placed[slotId] = colorId;
    audio.bead();
    if (Object.keys(placed).length === slots.length) {
      const correct = slots.every((s) => placed[s.id] === s.expected);
      status.textContent = correct
        ? 'Tersusun sesuai pakem yang umum: Timur putih, Selatan merah, Barat kuning, Utara biru/hitam.'
        : 'Pakem yang umum: Timur putih, Selatan merah, Barat kuning, Utara biru/hitam. Tradisi bisa berbeda per daerah.';
      offerButton.disabled = body.classList.contains('observe');
    }
  };
  const offer = () => {
    stage.classList.add('offered');
    audio.chime();
    status.textContent = 'Canang dihaturkan dengan dupa. Persembahan tulus adalah wujud terima kasih.';
    offerButton.disabled = true;
  };
  const reset = () => {
    placed = {};
    stage.classList.remove('offered');
    stage.querySelectorAll('.flower').forEach((f) => f.remove());
    status.textContent = '';
    offerButton.disabled = true;
  };
  body.addEventListener('click', (event) => {
    const colorButton = event.target.closest('[data-act="color"]');
    if (colorButton && !body.classList.contains('observe')) {
      selected = colorButton.dataset.color;
      body.querySelectorAll('[data-act="color"]').forEach((b) => b.classList.toggle('active', b === colorButton));
      return;
    }
    const slot = event.target.closest('.slot');
    if (slot && !body.classList.contains('observe')) {
      if (!selected) {
        toast('Pilih warna bunga dahulu.');
        return;
      }
      place(slot.dataset.slot, selected);
    }
  });
  offerButton.addEventListener('click', offer);
  body.querySelector('[data-act="reset"]').addEventListener('click', reset);
  return {
    demo: async () => {
      reset();
      for (const slot of slots) {
        place(slot.id, slot.expected);
        await sleep(600);
      }
      offer();
    },
  };
}

// ---------- Timer ----------
function timer(body, ritual) {
  const durations = ritual.durations || [5, 10, 20];
  body.innerHTML = `
    <div class="timer">
      <div class="timer-display" aria-live="off">${String(durations[0]).padStart(2, '0')}:00</div>
      <div class="row">${durations.map((d, i) => `<button class="chip ${i === 0 ? 'active' : ''}" data-act="duration" data-min="${d}">${d} menit</button>`).join('')}</div>
      <div class="row"><button class="btn" data-act="start">Mulai</button></div>
      <p class="ritual-status" aria-live="polite"></p>
    </div>`;
  const display = body.querySelector('.timer-display');
  const status = body.querySelector('.ritual-status');
  const startButton = body.querySelector('[data-act="start"]');
  let minutes = durations[0];
  let interval = null;
  let endAt = 0;
  const show = (ms) => {
    const total = Math.max(0, Math.ceil(ms / 1000));
    display.textContent = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };
  const stop = (finished) => {
    clearInterval(interval);
    interval = null;
    startButton.textContent = 'Mulai';
    if (finished) {
      audio.bell();
      setTimeout(audio.bell, 2500);
      status.textContent = ritual.doneText || 'Waktu selesai. Kembalilah perlahan.';
    }
    show(minutes * 60000);
  };
  body.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-act="duration"]');
    if (chip && !interval) {
      minutes = Number(chip.dataset.min);
      body.querySelectorAll('[data-act="duration"]').forEach((c) => c.classList.toggle('active', c === chip));
      show(minutes * 60000);
    }
  });
  startButton.addEventListener('click', () => {
    if (interval) {
      stop(false);
      status.textContent = 'Dihentikan.';
      return;
    }
    audio.bell();
    endAt = Date.now() + minutes * 60000;
    startButton.textContent = 'Hentikan';
    status.textContent = ritual.startText || 'Duduk tegak, napas wajar, perhatikan napas masuk dan keluar.';
    interval = setInterval(() => {
      const left = endAt - Date.now();
      show(left);
      if (left <= 0) {
        stop(true);
      }
    }, 500);
  });
  return { cleanup: () => clearInterval(interval) };
}

// ---------- Fixed daily times (Tri Sandhya, Angelus) ----------
function fixedTimes(body, ritual) {
  const times = ritual.times || ['06:00', '12:00', '18:00'];
  const remindKey = `remind:${ritual.id}`;
  body.innerHTML = `
    <ul class="times">${times.map((t) => `<li data-time="${t}"><span>${t}</span></li>`).join('')}</ul>
    <p class="next-time"></p>
    <label class="toggle"><input type="checkbox" ${load(remindKey, false) ? 'checked' : ''}> Bunyikan genta saat waktunya (selama halaman terbuka)</label>`;
  const next = body.querySelector('.next-time');
  const checkbox = body.querySelector('input');
  let lastRung = null;
  const update = () => {
    const now = new Date();
    const upcoming = times
      .map((t) => {
        const [h, m] = t.split(':').map(Number);
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
        if (date < now) {
          date.setDate(date.getDate() + 1);
        }
        return { t, date };
      })
      .sort((a, b) => a.date - b.date)[0];
    const minutes = Math.round((upcoming.date - now) / 60000);
    next.innerHTML = `Berikutnya <strong>${upcoming.t}</strong>, ${minutes >= 60 ? `${Math.floor(minutes / 60)} jam ${minutes % 60} menit` : `${minutes} menit`} lagi.`;
    body.querySelectorAll('.times li').forEach((li) => li.classList.toggle('next', li.dataset.time === upcoming.t));
    const nowLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (checkbox.checked && times.includes(nowLabel) && lastRung !== nowLabel) {
      lastRung = nowLabel;
      audio.bell();
      toast(`${ritual.title}: ${nowLabel}`);
    }
  };
  checkbox.addEventListener('change', () => save(remindKey, checkbox.checked));
  update();
  const interval = setInterval(update, 20000);
  return { cleanup: () => clearInterval(interval) };
}

// ---------- Prayer times ----------
function prayerTimesWidget(body) {
  const options = CITIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  body.innerHTML = `
    <div class="row">
      <label class="field inline"><span>Kota</span><select>${options}<option value="custom">Lokasi saya</option></select></label>
      <button class="btn-ghost" data-act="locate">Gunakan lokasi saya</button>
    </div>
    <ul class="times prayer"></ul>
    <p class="next-time"></p>
    <p class="small muted">Perkiraan dengan parameter Kemenag (Subuh 20°, Isya 18°, Ashar Syafi'i, ihtiyat 2 menit).
      Ikuti jadwal resmi Kemenag dan masjid setempat.</p>`;
  const select = body.querySelector('select');
  const list = body.querySelector('.prayer');
  const next = body.querySelector('.next-time');
  let location = CITIES.find((c) => c.id === prefs.get().city) || CITIES.find((c) => c.id === 'jakarta');
  select.value = location.id;

  const render = () => {
    const now = new Date();
    const times = prayerTimes(now, location);
    const upcoming = times.find((p) => p.id !== 'terbit' && p.id !== 'imsak' && p.time > now);
    list.innerHTML = times.map((p) => `<li class="${upcoming && p.id === upcoming.id ? 'next' : ''}"><span>${p.name}</span><strong>${formatClock(p.time)}</strong></li>`).join('');
    if (upcoming) {
      const minutes = Math.round((upcoming.time - now) / 60000);
      next.innerHTML = `Menuju <strong>${upcoming.name}</strong>: ${minutes >= 60 ? `${Math.floor(minutes / 60)} jam ${minutes % 60} menit` : `${minutes} menit`}.`;
    } else {
      next.textContent = 'Waktu Isya telah masuk. Jadwal besok tampil setelah tengah malam.';
    }
  };
  select.addEventListener('change', () => {
    if (select.value === 'custom') {
      return;
    }
    location = CITIES.find((c) => c.id === select.value);
    prefs.set({ city: location.id });
    render();
  });
  body.querySelector('[data-act="locate"]').addEventListener('click', () => {
    if (!navigator.geolocation) {
      toast('Perangkat tidak mendukung lokasi.');
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
      location = {
        id: 'custom',
        name: 'Lokasi saya',
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        tz: -new Date().getTimezoneOffset() / 60,
      };
      select.value = 'custom';
      render();
      toast('Lokasi dipakai hanya di perangkat ini.');
    }, () => toast('Izin lokasi ditolak.'));
  });
  render();
  const interval = setInterval(render, 30000);
  return { cleanup: () => clearInterval(interval) };
}

// ---------- Ambience ----------
function ambienceWidget(body, ritual) {
  const options = ritual.options || ['rain'];
  body.innerHTML = `<div class="row">${options.map((o) => `<button class="chip" data-act="amb" data-type="${o}">${audio.AMBIENCE_LABELS[o] || o}</button>`).join('')}</div>
    <p class="small muted">Suara disintesis di perangkat; tidak perlu unduh.</p>`;
  let stop = null;
  let active = null;
  body.addEventListener('click', (event) => {
    const button = event.target.closest('[data-act="amb"]');
    if (!button) {
      return;
    }
    if (stop) {
      stop();
      stop = null;
    }
    body.querySelectorAll('[data-act="amb"]').forEach((b) => b.classList.remove('active'));
    if (active === button.dataset.type) {
      active = null;
      return;
    }
    active = button.dataset.type;
    button.classList.add('active');
    stop = audio.ambience(active);
  });
  return { cleanup: () => stop && stop() };
}

// ---------- Breathing ----------
function breath(body) {
  body.innerHTML = `
    <div class="breath"><div class="breath-circle"></div><p class="breath-label">Siap</p></div>
    <div class="row"><button class="btn" data-act="start">Mulai bernapas</button></div>
    <p class="small muted">Tarik 4 detik, tahan 4 detik, embuskan 6 detik.</p>`;
  const circle = body.querySelector('.breath-circle');
  const label = body.querySelector('.breath-label');
  const button = body.querySelector('[data-act="start"]');
  let timerId = null;
  const steps = [
    { text: 'Tarik napas', ms: 4000, cls: 'in' },
    { text: 'Tahan', ms: 4000, cls: 'hold' },
    { text: 'Embuskan', ms: 6000, cls: 'out' },
  ];
  const run = (index = 0) => {
    const step = steps[index % steps.length];
    circle.className = `breath-circle ${step.cls}`;
    circle.style.transitionDuration = `${step.ms}ms`;
    label.textContent = step.text;
    timerId = setTimeout(() => run(index + 1), step.ms);
  };
  button.addEventListener('click', () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
      circle.className = 'breath-circle';
      label.textContent = 'Siap';
      button.textContent = 'Mulai bernapas';
      return;
    }
    button.textContent = 'Berhenti';
    run();
  });
  return { cleanup: () => clearTimeout(timerId) };
}

// ---------- Daily reading from Pustaka ----------
function daily(body, ritual, { content, faith }) {
  const entries = content.entries.filter((e) => e.faith === faith.id);
  if (entries.length === 0) {
    body.innerHTML = '<p class="muted">Belum ada bacaan.</p>';
    return {};
  }
  const dayIndex = Math.floor(Date.now() / 86400000) % entries.length;
  const entry = entries[dayIndex];
  body.innerHTML = `
    <h4>${esc(entry.title)}</h4>
    <p>${esc(entry.summary)}</p>
    <a class="btn-ghost" href="#/entri/${encodeURIComponent(entry.id)}">Baca selengkapnya</a>
    ${entry.status !== 'approved' ? '<p class="small muted">Draf, belum ditinjau.</p>' : ''}`;
  return {};
}

// ---------- External link ----------
function link(body, ritual) {
  body.innerHTML = `<a class="btn" href="${esc(ritual.url)}" target="_blank" rel="noopener">${esc(ritual.linkLabel || 'Buka')}</a>
    <p class="small muted">${esc(ritual.linkNote || 'Membuka sumber resmi di luar Hening.')}</p>`;
  return {};
}

const BUILDERS = {
  incense,
  candle,
  counter,
  rosary,
  poe,
  ciamsi,
  burn,
  ancestor,
  offering,
  timer,
  fixedTimes,
  prayerTimes: prayerTimesWidget,
  ambience: ambienceWidget,
  breath,
  daily,
  link,
};

// Widgets that represent devotional acts of a specific faith (observe-only for visitors).
const NON_DEVOTIONAL = new Set(['ambience', 'timer', 'breath', 'daily', 'link', 'prayerTimes', 'fixedTimes']);

export function isDevotional(ritual) {
  if (typeof ritual.devotional === 'boolean') {
    return ritual.devotional;
  }
  return !NON_DEVOTIONAL.has(ritual.type);
}

export function mountRitual(card, ritual, options) {
  const body = card.querySelector('.ritual-body');
  const build = BUILDERS[ritual.type];
  if (!build) {
    body.innerHTML = '<p class="muted">Belum tersedia.</p>';
    return () => {};
  }
  const result = build(body, ritual, options) || {};
  if (options.mode === 'visit' && isDevotional(ritual)) {
    body.classList.add('observe');
    body.querySelectorAll('button, input, textarea, select').forEach((element) => {
      element.disabled = true;
    });
    const bar = document.createElement('div');
    bar.className = 'observe-bar';
    if (result.demo) {
      bar.innerHTML = '<span class="small">Mode amati: kamu melihat cara ritual ini dilakukan.</span> <button class="btn-ghost small">Putar demonstrasi</button>';
      bar.querySelector('button').addEventListener('click', () => result.demo());
    } else {
      bar.innerHTML = '<span class="small">Mode amati: ritual ini khusus untuk umatnya. Baca maknanya di bawah.</span>';
    }
    body.prepend(bar);
  }
  return result.cleanup || (() => {});
}
