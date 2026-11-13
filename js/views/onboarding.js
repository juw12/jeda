// "Mulai": first-run onboarding as a deck of cards, one gentle question per card.
// Answers stay on this device (religion is sensitive personal data under UU PDP).

import { prefs, newGuestName } from '../store.js';
import { esc } from '../ui.js';
import { lang } from '../i18n.js';

const MOODS = [
  { id: 'tenang', icon: '🌿', label: 'Tenang' },
  { id: 'lelah', icon: '🌙', label: 'Lelah' },
  { id: 'gelisah', icon: '🌊', label: 'Gelisah' },
  { id: 'sedih', icon: '🌧️', label: 'Sedih' },
  { id: 'syukur', icon: '☀️', label: 'Bersyukur' },
];

export const AVATAR_COLORS = ['#e9c46a', '#e76f51', '#8ab17d', '#7fb3d5', '#b5838d', '#f4f1de'];

function buildSteps(faith) {
  const steps = ['welcome', 'mood', 'faith'];
  if (faith && faith.streams && faith.streams.length) {
    steps.push('stream');
  }
  if (faith && faith.dialects && faith.dialects.length) {
    steps.push('dialect');
  }
  steps.push('name', 'together', 'done');
  return steps;
}

export function onboarding(main, params, query, { content, navigate }) {
  const existing = prefs.get();
  const changing = query.get('dari') === 'pengaturan';
  const state = {
    mood: existing.mood || null,
    faith: existing.faith || null,
    streams: [...(existing.streams || [])],
    dialect: existing.dialect || null,
    guestName: existing.guestName || newGuestName(),
    avatarColor: existing.avatarColor || AVATAR_COLORS[0],
    presence: existing.presence || 'alone',
  };
  const faithOf = () => content.faiths.find((f) => f.id === state.faith) || null;
  let steps = buildSteps(faithOf());
  let index = changing ? steps.indexOf('faith') : 0;
  let direction = 1;

  document.body.classList.add('onboarding-mode');

  function cardHtml(step) {
    const faith = faithOf();
    switch (step) {
      case 'welcome':
        return `
          <div class="ob-mark" aria-hidden="true">‖</div>
          <h1 class="ob-title">Jeda</h1>
          <p class="ob-lead">${lang() === 'en' ? 'A quiet room for every faith.' : 'Ruang hening untuk setiap iman.'}</p>
          <a class="btn btn-big ob-quick" href="#/sejenak" data-quick>${lang() === 'en' ? 'Straight to stillness' : 'Langsung hening'}<small>${lang() === 'en' ? 'no questions' : 'tanpa pertanyaan'}</small></a>
          <button class="btn-ghost ob-setup" type="button" data-next>${lang() === 'en' ? 'Get acquainted first' : 'Kenalan dulu'}<small>${lang() === 'en' ? 'choose your mood & faith' : 'pilih suasana hati & iman'}</small></button>
          <div class="ob-footrow">
            <a class="ob-link" href="#/gabung">${lang() === 'en' ? 'Have a Live Room code?' : 'Punya kode Ruang Live?'}</a>
            <span aria-hidden="true">·</span>
            <button class="ob-link" type="button" data-lang>${lang() === 'en' ? 'Bahasa Indonesia' : 'English'}</button>
          </div>`;
      case 'mood':
        return `
          <p class="ob-q">Bagaimana hatimu hari ini?</p>
          <div class="ob-options">
            ${MOODS.map((m) => `<button type="button" class="ob-option ${state.mood === m.id ? 'on' : ''}" data-mood="${m.id}"><span class="ob-emoji">${m.icon}</span>${m.label}</button>`).join('')}
          </div>
          <p class="ob-foot">Tidak ada jawaban yang salah.</p>`;
      case 'faith':
        return `
          <p class="ob-q">Jalan iman mana yang ingin kamu masuki?</p>
          <div class="ob-faiths">
            ${content.faiths.map((f) => `
              <button type="button" class="ob-faith ${state.faith === f.id ? 'on' : ''}" data-faith="${f.id}" style="--c:${f.color}">
                <span class="ob-emoji">${f.icon || '◌'}</span><span>${esc(f.short || f.name)}</span>
              </button>`).join('')}
          </div>
          <p class="ob-foot">Pilihan ini hanya tersimpan di perangkatmu. Kamu tetap bisa mengunjungi ruang iman lain.</p>`;
      case 'stream':
        return `
          <p class="ob-q">Tradisi atau aliranmu?</p>
          <div class="ob-list">
            ${faith.streams.map((s) => `
              <button type="button" class="ob-row ${state.streams.includes(s.id) ? 'on' : ''}" data-stream="${s.id}">
                <strong>${esc(s.name)}</strong>${s.desc ? `<span>${esc(s.desc)}</span>` : ''}
              </button>`).join('')}
          </div>
          <p class="ob-foot">Boleh lebih dari satu, atau lewati saja.</p>
          <button class="btn" type="button" data-next>${state.streams.length ? 'Lanjut' : 'Lewati'}</button>`;
      case 'dialect':
        return `
          <p class="ob-q">Keluargamu dari kelompok mana?</p>
          <div class="ob-list">
            ${faith.dialects.map((d) => `
              <button type="button" class="ob-row ${state.dialect === d.id ? 'on' : ''}" data-dialect="${d.id}">
                <strong>${esc(d.name)}</strong><span>${esc(d.region || '')}</span>
              </button>`).join('')}
          </div>
          <p class="ob-foot">Agar tradisi keluargamu ditandai lebih dulu.</p>`;
      case 'name':
        return `
          <p class="ob-q">Namamu di ruang</p>
          <div class="ob-avatar" style="--c:${state.avatarColor}" aria-hidden="true"><span></span></div>
          <div class="ob-name">
            <input type="text" maxlength="24" value="${esc(state.guestName)}" aria-label="Nama tamu" data-name>
            <button type="button" class="ob-reroll" data-reroll aria-label="Nama lain">↻</button>
          </div>
          <div class="ob-colors" role="radiogroup" aria-label="Warna jubah">
            ${AVATAR_COLORS.map((c) => `<button type="button" class="ob-color ${state.avatarColor === c ? 'on' : ''}" data-color="${c}" style="--c:${c}" aria-label="Warna ${c}"></button>`).join('')}
          </div>
          <p class="ob-foot">Tanpa akun. Nama ini hanya terlihat bila kamu hadir bersama orang lain.</p>
          <button class="btn" type="button" data-next>Lanjut</button>`;
      case 'together':
        return `
          <p class="ob-q">Di ruang, kamu ingin…</p>
          <div class="ob-options two">
            <button type="button" class="ob-option tall ${state.presence === 'alone' ? 'on' : ''}" data-presence="alone">
              <span class="ob-emoji">🕯️</span><strong>Sendiri</strong><span>Hening, hanya kamu</span>
            </button>
            <button type="button" class="ob-option tall ${state.presence === 'together' ? 'on' : ''}" data-presence="together">
              <span class="ob-emoji">🤝</span><strong>Bersama</strong><span>Melihat dan menyapa umat lain yang sedang hadir</span>
            </button>
          </div>
          <p class="ob-foot">Bersama memakai koneksi langsung antarperangkat: pengunjung lain melihat nama tamu dan gerakmu, dan dapat melihat alamat IP-mu. Bisa diubah kapan saja.</p>`;
      case 'done': {
        const space = faith ? faith.spaceName : 'Ruang';
        return `
          <div class="ob-avatar big" style="--c:${state.avatarColor}" aria-hidden="true"><span></span></div>
          <h2 class="ob-title small">Selamat datang, ${esc(state.guestName)}</h2>
          <p class="ob-lead">${esc(faith ? faith.greeting : '')}</p>
          <button class="btn btn-big" type="button" data-finish="space">Masuk ${esc(space)}</button>
          <button class="ob-link" type="button" data-finish="home">Lihat beranda dulu</button>`;
      }
      default:
        return '';
    }
  }

  function render() {
    const step = steps[index];
    const showProgress = step !== 'welcome';
    const progressSteps = steps.filter((s) => s !== 'welcome');
    const position = progressSteps.indexOf(step);
    const accent = faithOf() ? faithOf().color : '#c9a227';
    main.innerHTML = `
      <section class="ob" style="--accent:${accent}">
        <div class="ob-glow" aria-hidden="true"></div>
        <header class="ob-head">
          ${index > 0 && step !== 'done' ? '<button type="button" class="ob-back" data-back aria-label="Kembali">←</button>' : '<span></span>'}
          ${showProgress ? `<div class="ob-dots" aria-label="Langkah ${position + 1} dari ${progressSteps.length}">${progressSteps.map((s, i) => `<span class="${i <= position ? 'on' : ''}"></span>`).join('')}</div>` : '<span></span>'}
          <span></span>
        </header>
        <div class="ob-deck">
          <article class="ob-card enter-${direction > 0 ? 'right' : 'left'}" data-step="${step}">${cardHtml(step)}</article>
        </div>
      </section>`;
    bind();
    const focusTarget = main.querySelector('.ob-card button, .ob-card input');
    if (focusTarget) {
      focusTarget.focus({ preventScroll: true });
    }
  }

  function go(delta) {
    const card = main.querySelector('.ob-card[data-step]');
    direction = delta;
    if (card) {
      card.classList.add(delta > 0 ? 'leave-left' : 'leave-right');
    }
    setTimeout(() => {
      index = Math.max(0, Math.min(steps.length - 1, index + delta));
      render();
    }, 220);
  }

  function finish(target) {
    prefs.set({
      faith: state.faith,
      streams: state.streams,
      dialect: state.dialect,
      mood: state.mood,
      moodDate: new Date().toISOString().slice(0, 10),
      guestName: state.guestName.trim() || newGuestName(),
      avatarColor: state.avatarColor,
      presence: state.presence,
      presenceAcknowledged: state.presence === 'together' ? true : existing.presenceAcknowledged,
      onboarded: true,
    });
    document.body.classList.remove('onboarding-mode');
    navigate(target === 'space' ? `#/ruang/${state.faith}` : '#/');
  }

  function bind() {
    const card = main.querySelector('.ob-card[data-step]');
    main.querySelector('[data-back]')?.addEventListener('click', () => go(-1));
    card.querySelectorAll('[data-next]').forEach((b) => b.addEventListener('click', () => go(1)));
    card.querySelector('[data-lang]')?.addEventListener('click', () => {
      prefs.set({ lang: lang() === 'en' ? 'id' : 'en' });
      location.reload();
    });
    card.querySelectorAll('[data-mood]').forEach((b) => b.addEventListener('click', () => {
      state.mood = b.dataset.mood;
      go(1);
    }));
    card.querySelectorAll('[data-faith]').forEach((b) => b.addEventListener('click', () => {
      if (state.faith !== b.dataset.faith) {
        state.streams = [];
        state.dialect = null;
      }
      state.faith = b.dataset.faith;
      steps = buildSteps(faithOf());
      index = steps.indexOf('faith');
      go(1);
    }));
    card.querySelectorAll('[data-stream]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.stream;
      state.streams = state.streams.includes(id) ? state.streams.filter((s) => s !== id) : [...state.streams, id];
      b.classList.toggle('on');
      card.querySelector('[data-next]').textContent = state.streams.length ? 'Lanjut' : 'Lewati';
    }));
    card.querySelectorAll('[data-dialect]').forEach((b) => b.addEventListener('click', () => {
      state.dialect = b.dataset.dialect;
      go(1);
    }));
    const nameInput = card.querySelector('[data-name]');
    nameInput?.addEventListener('input', () => {
      state.guestName = nameInput.value;
    });
    card.querySelector('[data-reroll]')?.addEventListener('click', () => {
      state.guestName = newGuestName();
      nameInput.value = state.guestName;
    });
    card.querySelectorAll('[data-color]').forEach((b) => b.addEventListener('click', () => {
      state.avatarColor = b.dataset.color;
      card.querySelectorAll('[data-color]').forEach((x) => x.classList.toggle('on', x === b));
      card.querySelector('.ob-avatar').style.setProperty('--c', state.avatarColor);
    }));
    card.querySelectorAll('[data-presence]').forEach((b) => b.addEventListener('click', () => {
      state.presence = b.dataset.presence;
      go(1);
    }));
    card.querySelectorAll('[data-finish]').forEach((b) => b.addEventListener('click', () => finish(b.dataset.finish)));

    // Swipe left = next (only where a "next" makes sense), swipe right = back.
    let startX = null;
    card.addEventListener('pointerdown', (event) => {
      startX = event.clientX;
    });
    card.addEventListener('pointerup', (event) => {
      if (startX === null) {
        return;
      }
      const dx = event.clientX - startX;
      startX = null;
      if (dx > 70 && index > 0) {
        go(-1);
      } else if (dx < -70 && card.querySelector('[data-next]')) {
        go(1);
      }
    });
  }

  render();
  return () => document.body.classList.remove('onboarding-mode');
}
