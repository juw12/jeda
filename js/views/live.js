// Ruang Live entry points:
//   #/live/<KODE>  — open from a shared link (TikTok/IG bio, chat). One welcome card, then straight into 3D.
//   #/gabung       — type the code you heard on stream.
// No full onboarding for viewers: they came for one event; they can explore Jeda later.

import { prefs, newGuestName } from '../store.js';
import { esc } from '../ui.js';
import { faithById } from '../content.js';
import { space } from './space.js';
import { AVATAR_COLORS } from './onboarding.js';
import { parseCode, hostingRecord, normalizeCode } from '../world/live.js';

export function joinView(main, params, query, { navigate }) {
  document.body.classList.add('onboarding-mode');
  main.innerHTML = `
    <section class="ob">
      <div class="ob-glow" aria-hidden="true"></div>
      <header class="ob-head"><a class="ob-back" href="#/" aria-label="Kembali">←</a><span></span><span></span></header>
      <div class="ob-deck">
        <article class="ob-card">
          <p class="eyebrow">Ruang Live</p>
          <h1 class="ob-title small">Gabung bersama</h1>
          <p class="ob-lead">Masukkan kode yang disebut atau ditulis oleh pemandu siaran.</p>
          <form class="code-form" data-form>
            <input class="code-input" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="K7QX2MA" aria-label="Kode Ruang Live" data-code value="${esc(params[0] || '')}">
            <p class="small code-error" data-error hidden>Kode tidak dikenal. Periksa lagi 7 hurufnya.</p>
            <button class="btn btn-big" type="submit">Masuk</button>
          </form>
          <p class="ob-foot">Tanpa akun. Kode berisi 7 huruf/angka, contoh K7QX2MA.</p>
        </article>
      </div>
    </section>`;
  const input = main.querySelector('[data-code]');
  input.addEventListener('input', () => {
    // Accept a pasted link ("…#/live/K7QX2MA") or a caption that contains the code.
    const fromLink = input.value.match(/live\/([A-Za-z0-9]{7})/);
    input.value = normalizeCode(fromLink ? fromLink[1] : input.value);
    main.querySelector('[data-error]').hidden = true;
  });
  main.querySelector('[data-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    const parsed = parseCode(input.value);
    if (!parsed) {
      main.querySelector('[data-error]').hidden = false;
      return;
    }
    navigate(`#/live/${parsed.code}`);
  });
  setTimeout(() => input.focus(), 50);
  return () => document.body.classList.remove('onboarding-mode');
}

export function liveView(main, params, query, ctx) {
  const parsed = parseCode(params[0]);
  if (!parsed) {
    return joinView(main, [params[0] || ''], query, ctx);
  }
  const faith = faithById(ctx.content, parsed.faith);
  const hosting = hostingRecord(parsed.code);
  const userPrefs = prefs.get();
  const homeMode = (role) => (parsed.faith === 'alam' || role === 'member' ? 'home' : 'visit');

  if (hosting) {
    const mode = userPrefs.faith === parsed.faith || parsed.faith === 'alam' ? 'home' : 'visit';
    return space(main, [parsed.faith], query, ctx, { live: { code: parsed.code, host: true, secret: hosting.secret, mode } });
  }

  const joinedKey = `jeda:live-joined:${parsed.code}`;
  const joined = sessionStorage.getItem(joinedKey);
  if (joined) {
    return space(main, [parsed.faith], query, ctx, { live: { code: parsed.code, host: false, mode: homeMode(joined) } });
  }

  // One welcome card: name, robe colour, member or guest, consent.
  const state = {
    name: userPrefs.guestName || newGuestName(),
    color: userPrefs.avatarColor || AVATAR_COLORS[0],
  };
  const askRole = parsed.faith !== 'alam';
  document.body.classList.add('onboarding-mode');
  main.innerHTML = `
    <section class="ob" style="--accent:${faith.color}">
      <div class="ob-glow" aria-hidden="true"></div>
      <div class="ob-deck">
        <article class="ob-card live-card">
          <p class="eyebrow">Ruang Live · ${esc(parsed.code)}</p>
          <h1 class="ob-title small">${esc(faith.spaceName)}</h1>
          <p class="ob-lead">Kamu diundang hadir bersama secara langsung di ruang 3D.</p>
          <div class="ob-avatar" style="--c:${state.color}" aria-hidden="true"><span></span></div>
          <div class="ob-name">
            <input type="text" maxlength="24" value="${esc(state.name)}" aria-label="Nama tamu" data-name>
            <button type="button" class="ob-reroll" data-reroll aria-label="Nama lain">↻</button>
          </div>
          <div class="ob-colors" role="radiogroup" aria-label="Warna jubah">
            ${AVATAR_COLORS.map((c) => `<button type="button" class="ob-color ${state.color === c ? 'on' : ''}" data-color="${c}" style="--c:${c}" aria-label="Warna ${c}"></button>`).join('')}
          </div>
          ${askRole ? `
            <p class="role-q">Masuk sebagai</p>
            <div class="role-enter">
              <button type="button" class="btn btn-big" data-enter="member">Umat ${esc(faith.short || faith.name)}<small>ikut berdoa & beribadah</small></button>
              <button type="button" class="btn btn-big btn-soft" data-enter="guest">Tamu<small>mengamati dengan hormat</small></button>
            </div>` : `
            <button class="btn btn-big" type="button" data-enter="member">Masuk sekarang</button>`}
          <p class="ob-foot">Tanpa akun. Orang lain di ruang ini melihat nama tamu, warna, dan gerakmu; koneksi langsung antarperangkat juga memperlihatkan alamat IP. Tidak ada yang disimpan di server Jeda.</p>
        </article>
      </div>
    </section>`;

  const card = main.querySelector('.live-card');
  const nameInput = card.querySelector('[data-name]');
  nameInput.addEventListener('input', () => {
    state.name = nameInput.value;
  });
  card.querySelector('[data-reroll]').addEventListener('click', () => {
    state.name = newGuestName();
    nameInput.value = state.name;
  });
  card.querySelectorAll('[data-color]').forEach((button) => button.addEventListener('click', () => {
    state.color = button.dataset.color;
    card.querySelectorAll('[data-color]').forEach((x) => x.classList.toggle('on', x === button));
    card.querySelector('.ob-avatar').style.setProperty('--c', state.color);
  }));
  let cleanup = () => document.body.classList.remove('onboarding-mode');
  card.querySelectorAll('[data-enter]').forEach((button) => button.addEventListener('click', () => {
    const role = button.dataset.enter;
    prefs.set({ guestName: state.name.trim() || newGuestName(), avatarColor: state.color, presenceAcknowledged: true });
    sessionStorage.setItem(joinedKey, role);
    document.body.classList.remove('onboarding-mode');
    cleanup = space(main, [parsed.faith], query, ctx, { live: { code: parsed.code, host: false, mode: homeMode(role) } }) || (() => {});
  }));
  return () => cleanup();
}
