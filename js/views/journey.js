// Three connected pages: Sekolah (learn about every faith, with quizzes), Bank Kebaikan (kindness points,
// tallies of everything you did, wishes) and Wisata (travel to 7 landmarks of faith in 3D).
// Studying earns points, points buy wishes and trips, trips teach more. Everything stays on the device.

import { esc, toast } from '../ui.js';
import { prefs } from '../store.js';
import { faithById, entryById } from '../content.js';
import { karma, tallies, rewardOnce, done, spend, addWish, hasTicket, addTicket, onKarma, WISHES, KARMA_NOTE } from '../karma.js';
import { WONDERS, TRIP_COST, wonderById } from '../wonders-data.js';

let schoolCache = null;
async function loadSchool() {
  if (!schoolCache) {
    const response = await fetch('content/school.json', { cache: 'no-cache' });
    schoolCache = await response.json();
  }
  return schoolCache;
}

function faithColor(content, id) {
  const faith = faithById(content, id);
  return faith ? faith.color : '#8a7f72';
}

function balanceChip() {
  return `<a class="karma-chip" href="#/karma" aria-label="Saldo Bank Kebaikan"><span aria-hidden="true">✦</span><span data-balance>${karma().balance}</span></a>`;
}

function bindBalance(main) {
  return onKarma(({ balance }) => {
    main.querySelectorAll('[data-balance]').forEach((el) => {
      el.textContent = String(balance);
    });
  });
}

// ---------------------------------------------------------------- Sekolah
export async function sekolah(main, [lessonId, mode], query, { content, navigate }) {
  main.innerHTML = '<section class="stack"><p class="muted">Membuka ruang kelas…</p></section>';
  const school = await loadSchool();
  const lessons = school.lessons;
  if (lessonId) {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      navigate('#/sekolah');
      return undefined;
    }
    return mode === 'kuis' ? quiz(main, lesson, content, navigate) : lessonView(main, lesson, content);
  }
  const read = lessons.filter((l) => done(`baca:${l.id}`)).length;
  const passed = lessons.filter((l) => done(`kuis:${l.id}`)).length;
  const mine = prefs.get().faith;
  const ordered = [...lessons].sort((a, b) => (b.faith === mine) - (a.faith === mine));
  main.innerHTML = `
    <section class="stack journey">
      <header class="page-head">
        <div>
          <p class="eyebrow">Sekolah lintas iman</p>
          <h1 class="h2">Belajar mengenal setiap iman</h1>
          <p class="muted">Pelajaran singkat, lalu kuis lima soal. Setiap pelajaran yang selesai menambah poin kebaikanmu.</p>
        </div>
        ${balanceChip()}
      </header>
      <div class="progress-card">
        <div><strong>${read}/${lessons.length}</strong><span>pelajaran dibaca</span></div>
        <div><strong>${passed}/${lessons.length}</strong><span>kuis lulus</span></div>
        <div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${lessons.length * 2}" aria-valuenow="${read + passed}" aria-label="Kemajuan belajar"><span style="width:${Math.round(((read + passed) / (lessons.length * 2)) * 100)}%"></span></div>
      </div>
      <div class="lesson-grid">
        ${ordered.map((lesson) => {
    const isRead = done(`baca:${lesson.id}`);
    const isPassed = done(`kuis:${lesson.id}`);
    return `
          <a class="lesson-card" href="#/sekolah/${lesson.id}" style="--c:${faithColor(content, lesson.faith)}">
            <span class="lesson-dot" aria-hidden="true"></span>
            <strong>${esc(lesson.title)}</strong>
            <span class="small muted">${lesson.minutes} menit · ${lesson.quiz.length} soal</span>
            <span class="lesson-status">${isPassed ? '<span class="tag ok">Lulus kuis</span>' : isRead ? '<span class="tag">Sudah dibaca</span>' : '<span class="tag soft">Baru</span>'}</span>
          </a>`;
  }).join('')}
      </div>
      <p class="small muted">${esc(school.note)}</p>
      <div class="row">
        <a class="btn-ghost" href="#/wisata">🧭 Wisata 7 keajaiban iman</a>
        <a class="btn-ghost" href="#/karma">✦ Bank Kebaikan</a>
      </div>
    </section>`;
  return bindBalance(main);
}

function lessonView(main, lesson, content) {
  main.innerHTML = `
    <section class="stack narrow journey" style="--c:${faithColor(content, lesson.faith)}">
      <a class="back-link" href="#/sekolah">← Semua pelajaran</a>
      <header class="page-head">
        <div>
          <p class="eyebrow">Pelajaran · ${lesson.minutes} menit</p>
          <h1 class="h2">${esc(lesson.title)}</h1>
        </div>
        ${balanceChip()}
      </header>
      <ol class="lesson-steps">
        ${lesson.sections.map((section) => `
          <li><h2 class="h3">${esc(section.h)}</h2><p>${esc(section.p)}</p></li>`).join('')}
      </ol>
      ${lesson.readMore.length ? `<div class="soft-card"><p class="eyebrow">Baca lebih dalam di Pustaka</p><ul class="clean-list">${lesson.readMore.map((id) => `<li><a href="#/entri/${encodeURIComponent(id)}">${esc(entryById(content, id)?.title || id)}</a></li>`).join('')}</ul></div>` : ''}
      <div class="row">
        <button class="btn" type="button" data-finish>${done(`baca:${lesson.id}`) ? 'Sudah dibaca ✓' : 'Selesai membaca (+3 ✦)'}</button>
        <a class="btn-ghost" href="#/sekolah/${lesson.id}/kuis">Mulai kuis →</a>
      </div>
    </section>`;
  main.querySelector('[data-finish]').addEventListener('click', (event) => {
    const gained = rewardOnce(`baca:${lesson.id}`, 3, `Belajar: ${lesson.title}`);
    event.target.textContent = 'Sudah dibaca ✓';
    toast(gained ? `+${gained} kebaikan. Lanjut ke kuis?` : 'Pelajaran ini sudah tercatat.');
  });
  return bindBalance(main);
}

function quiz(main, lesson, content, navigate) {
  let index = 0;
  let score = 0;
  let answered = false;
  const render = () => {
    if (index >= lesson.quiz.length) {
      const passed = score >= Math.ceil(lesson.quiz.length * 0.8);
      let gained = 0;
      if (passed) {
        gained += rewardOnce(`kuis:${lesson.id}`, 10, `Lulus kuis: ${lesson.title}`);
        if (score === lesson.quiz.length) {
          gained += rewardOnce(`sempurna:${lesson.id}`, 5, `Nilai sempurna: ${lesson.title}`);
        }
      }
      main.innerHTML = `
        <section class="stack narrow journey" style="--c:${faithColor(content, lesson.faith)}">
          <div class="result-card ${passed ? 'pass' : ''}">
            <p class="eyebrow">Hasil kuis</p>
            <p class="result-score">${score}<span>/${lesson.quiz.length}</span></p>
            <p>${passed ? 'Lulus! Terima kasih sudah belajar mengenal sesama.' : 'Belum lulus (minimal 4 benar). Baca lagi pelajarannya, lalu coba lagi.'}</p>
            ${gained ? `<p class="tag ok">+${gained} kebaikan</p>` : passed ? '<p class="small muted">Poin untuk kuis ini sudah pernah kamu dapat.</p>' : ''}
          </div>
          <div class="row">
            <button class="btn" type="button" data-retry>Ulangi kuis</button>
            <a class="btn-ghost" href="#/sekolah/${lesson.id}">Baca pelajaran</a>
            <a class="btn-ghost" href="#/sekolah">Pelajaran lain</a>
          </div>
        </section>`;
      main.querySelector('[data-retry]').addEventListener('click', () => {
        index = 0;
        score = 0;
        render();
      });
      return;
    }
    const item = lesson.quiz[index];
    answered = false;
    main.innerHTML = `
      <section class="stack narrow journey" style="--c:${faithColor(content, lesson.faith)}">
        <a class="back-link" href="#/sekolah/${lesson.id}">← ${esc(lesson.title)}</a>
        <div class="quiz-card">
          <div class="quiz-top"><span class="eyebrow">Soal ${index + 1} dari ${lesson.quiz.length}</span><span class="small muted">Benar: ${score}</span></div>
          <div class="progress-bar"><span style="width:${(index / lesson.quiz.length) * 100}%"></span></div>
          <h1 class="h3 quiz-q">${esc(item.q)}</h1>
          <div class="quiz-options">
            ${item.options.map((option, i) => `<button class="quiz-option" type="button" data-option="${i}">${esc(option)}</button>`).join('')}
          </div>
          <p class="quiz-why" data-why hidden></p>
          <button class="btn" type="button" data-next hidden>${index + 1 === lesson.quiz.length ? 'Lihat hasil' : 'Soal berikutnya'}</button>
        </div>
      </section>`;
    main.querySelectorAll('[data-option]').forEach((button) => {
      button.addEventListener('click', () => {
        if (answered) {
          return;
        }
        answered = true;
        const choice = Number(button.dataset.option);
        const right = choice === item.answer;
        if (right) {
          score += 1;
        }
        main.querySelectorAll('[data-option]').forEach((b) => {
          b.disabled = true;
          const i = Number(b.dataset.option);
          b.classList.toggle('right', i === item.answer);
          b.classList.toggle('wrong', i === choice && !right);
        });
        const why = main.querySelector('[data-why]');
        why.hidden = false;
        why.textContent = `${right ? 'Benar.' : 'Kurang tepat.'} ${item.why}`;
        main.querySelector('[data-next]').hidden = false;
        main.querySelector('[data-next]').focus();
      });
    });
    main.querySelector('[data-next]').addEventListener('click', () => {
      index += 1;
      render();
    });
  };
  render();
  return undefined;
}

// ---------------------------------------------------------------- Bank Kebaikan
export function karmaView(main) {
  const render = () => {
    const state = karma();
    const list = tallies();
    main.innerHTML = `
      <section class="stack journey">
        <header class="page-head">
          <div>
            <p class="eyebrow">Bank Kebaikan</p>
            <h1 class="h2">Tabungan kebaikanmu</h1>
          </div>
        </header>
        <div class="bank-card">
          <p class="eyebrow">Saldo</p>
          <p class="bank-balance">✦ <span data-balance>${state.balance}</span></p>
          <div class="bank-stats">
            <span><strong>+${state.earned}</strong> kebaikan</span>
            <span><strong>−${state.lost}</strong> kurang baik</span>
            <span><strong>${state.spent}</strong> diwujudkan</span>
          </div>
        </div>
        <p class="small muted">${esc(KARMA_NOTE)}</p>

        <h2 class="h3">Cara menambah kebaikan</h2>
        <ul class="how-list">
          <li><span>🙏</span>Beribadah & beraktivitas di ruang 3D (lonceng, lilin, hio, tasbih, rosario, mala…)</li>
          <li><span>🪙</span>Berbagi dengan orang yang meminta bantuan di dekat pintu masuk</li>
          <li><span>🎓</span>Belajar di Sekolah dan lulus kuis</li>
          <li><span>💬</span>Menyapa & mengobrol dengan sopan</li>
          <li class="bad"><span>✋</span>Mengusir orang, berkata kasar, atau memaksa masuk area suci mengurangi saldo</li>
        </ul>
        <div class="row">
          <a class="btn" href="#/sekolah">🎓 Ke Sekolah</a>
          <a class="btn-ghost" href="#/ruang/${prefs.get().faith || 'alam'}">⛩ Ke ruangmu</a>
        </div>

        <h2 class="h3">Wujudkan harapan</h2>
        <div class="wish-list">
          <a class="wish" href="#/wisata"><span class="wish-icon" aria-hidden="true">🧭</span><span class="wish-text"><strong>Tiket wisata iman</strong><small>Berkunjung ke Borobudur, Istiqlal, Katedral, dan lainnya dalam 3D.</small></span><span class="wish-cost">✦ ${TRIP_COST}</span></a>
          ${WISHES.map((wish) => `
            <button class="wish" type="button" data-wish="${wish.id}" ${state.balance < wish.cost ? 'disabled' : ''}>
              <span class="wish-icon" aria-hidden="true">${wish.icon}</span>
              <span class="wish-text"><strong>${esc(wish.name)}</strong><small>${esc(wish.desc)}</small></span>
              <span class="wish-cost">✦ ${wish.cost}</span>
            </button>`).join('')}
        </div>
        <form class="ribbon-form" data-ribbon-form hidden>
          <label class="field"><span>Harapan untuk pita (maks. 80 huruf)</span><input name="text" maxlength="80" required autocomplete="off" placeholder="Semoga ibu cepat sembuh…"></label>
          <div class="row"><button class="btn" type="submit">Gantungkan</button><button class="btn-ghost" type="button" data-ribbon-cancel>Batal</button></div>
        </form>
        <p class="small muted">Efek harapan (lentera, kelopak, kunang-kunang, traktir) tampil di ruang 3D tempatmu berada. Dari sini, harapan disimpan dan diputar saat kamu masuk ruang berikutnya.</p>

        <h2 class="h3">Hitungan setiap kegiatan</h2>
        ${list.length ? `<table class="tally-table"><thead><tr><th>Kegiatan</th><th>Hari ini</th><th>Total</th></tr></thead><tbody>
          ${list.slice(0, 30).map((row) => `<tr><td>${esc(row.icon || '✦')} ${esc(row.label)}</td><td>${row.today}</td><td>${row.total}</td></tr>`).join('')}
        </tbody></table>` : '<p class="muted">Belum ada kegiatan. Masuk ke ruang 3D dan mulailah.</p>'}

        <h2 class="h3">Riwayat</h2>
        <ul class="ledger">${state.ledger.slice(0, 25).map((row) => `<li><span>${esc(row.label)}<small>${new Date(row.t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</small></span><span class="${row.delta >= 0 ? 'plus' : 'minus'}">${row.delta >= 0 ? '+' : '−'}${Math.abs(row.delta)}</span></li>`).join('')}</ul>
        ${state.wishes.length ? `<h2 class="h3">Harapan yang terwujud</h2><ul class="ribbon-list">${state.wishes.slice(0, 12).map((wish) => `<li>${esc((WISHES.find((w) => w.id === wish.id) || {}).icon || '✦')} ${esc(wish.text)}</li>`).join('')}</ul>` : ''}
      </section>`;
    const ribbonForm = main.querySelector('[data-ribbon-form]');
    const buy = (wish, text) => {
      if (!spend(wish.cost, wish.tree ? `${wish.name}: ${text}` : wish.name)) {
        toast('Saldo kebaikan belum cukup.');
        return;
      }
      addWish({ id: wish.id, text });
      try {
        sessionStorage.setItem('jeda:v1:pendingWish', wish.effect);
      } catch {
        // storage unavailable
      }
      toast(wish.tree ? '🎗 Pita harapanmu tergantung di Pohon Harapan di rumah.' : `${wish.icon} ${wish.name}: tersimpan. Efeknya muncul saat kamu masuk ruang 3D.`);
      render();
    };
    ribbonForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const text = event.target.elements.text.value.trim().slice(0, 80);
      if (text) {
        buy(WISHES.find((w) => w.tree), text);
      }
    });
    main.querySelector('[data-ribbon-cancel]').addEventListener('click', () => {
      ribbonForm.hidden = true;
    });
    main.querySelectorAll('[data-wish]').forEach((button) => {
      button.addEventListener('click', () => {
        const wish = WISHES.find((w) => w.id === button.dataset.wish);
        if (wish.tree) {
          ribbonForm.hidden = false;
          ribbonForm.querySelector('input').focus();
          return;
        }
        const text = wish.name;
        if (!spend(wish.cost, wish.tree ? `${wish.name}: ${text}` : wish.name)) {
          toast('Saldo kebaikan belum cukup.');
          return;
        }
        addWish({ id: wish.id, text });
        try {
          sessionStorage.setItem('jeda:v1:pendingWish', wish.effect);
        } catch {
          // storage unavailable
        }
        toast(`${wish.icon} ${wish.name}: tersimpan. Efeknya muncul saat kamu masuk ruang 3D.`);
        render();
      });
    });
  };
  render();
  return bindBalance(main);
}

// ---------------------------------------------------------------- Wisata
function wonderArt(wonder) {
  // Small flat silhouettes so the list loads instantly (the real visit is in 3D).
  const shapes = {
    borobudur: '<path d="M20 78h120v-8H28zM34 70h92v-8H42zM48 62h64v-8H56zM62 54h36v-7H66z" fill="currentColor"/><circle cx="80" cy="38" r="9" fill="currentColor"/><rect x="78.5" y="20" width="3" height="10" fill="currentColor"/>',
    prambanan: '<path d="M80 12l12 30 6 36H62l6-36z" fill="currentColor"/><path d="M42 34l8 20 4 24H30l4-24zM118 34l8 20 4 24h-24l4-24z" fill="currentColor" opacity=".8"/>',
    istiqlal: '<path d="M36 78V52h88v26z" fill="currentColor"/><path d="M50 52a30 22 0 0 1 60 0z" fill="currentColor"/><rect x="128" y="22" width="6" height="56" fill="currentColor"/><path d="M126 22h10l-5-10z" fill="currentColor"/>',
    katedral: '<path d="M52 78V40h56v38z" fill="currentColor"/><path d="M50 40l8-30 8 30zM94 40l8-30 8 30z" fill="currentColor"/><circle cx="80" cy="50" r="6" fill="#fff" opacity=".7"/>',
    blenduk: '<path d="M44 78V50h72v28z" fill="currentColor"/><path d="M52 50a28 22 0 0 1 56 0z" fill="currentColor"/><rect x="34" y="40" width="10" height="38" fill="currentColor"/><rect x="116" y="40" width="10" height="38" fill="currentColor"/>',
    sampookong: '<path d="M44 78V56h72v22z" fill="currentColor"/><path d="M34 58l46-14 46 14zM48 46l32-10 32 10zM60 36l20-7 20 7z" fill="currentColor"/>',
    waerebo: '<path d="M30 78l14-46 14 46zM62 78l18-58 18 58zM102 78l14-46 14 46z" fill="currentColor"/>',
  };
  return `<svg viewBox="0 0 160 90" aria-hidden="true" class="wonder-art" style="color:${wonder.color}">${shapes[wonder.id] || ''}</svg>`;
}

export function wisata(main, [wonderId], query, ctx) {
  const { content, navigate } = ctx;
  if (wonderId) {
    const wonder = wonderById(wonderId);
    if (!wonder) {
      navigate('#/wisata');
      return undefined;
    }
    const firstFree = !karma().tickets.length;
    if (!hasTicket(wonder.id)) {
      if (!firstFree && !spend(TRIP_COST, `Tiket wisata: ${wonder.name}`, 'trip')) {
        toast(`Butuh ✦ ${TRIP_COST} untuk tiket ini. Berbuat baik atau belajar di Sekolah dulu, ya.`);
        navigate('#/wisata');
        return undefined;
      }
      addTicket(wonder.id);
      toast(firstFree ? 'Perjalanan pertamamu gratis. Selamat menikmati!' : `Tiket ${wonder.name} dibeli (✦ ${TRIP_COST}).`);
    }
    // Reuse the full 3D space (activities, guide, people) with the landmark as the scene.
    return import('./space.js').then(({ space }) => space(main, [wonder.faith, 'wisata', wonder.id], query, ctx));
  }
  const state = karma();
  const firstFree = !state.tickets.length;
  main.innerHTML = `
    <section class="stack journey">
      <header class="page-head">
        <div>
          <p class="eyebrow">Wisata iman</p>
          <h1 class="h2">7 Keajaiban Iman Nusantara</h1>
          <p class="muted">Kunjungi tempat-tempat yang dikunjungi umat dari berbagai iman, dalam 3D. Pelajari sejarah dan etikanya sebelum datang langsung.</p>
        </div>
        ${balanceChip()}
      </header>
      ${firstFree ? '<p class="notice">🎁 Perjalanan pertamamu gratis. Setelah itu tiap tiket ✦ ' + TRIP_COST + ', berlaku selamanya.</p>' : ''}
      <div class="wonder-grid">
        ${WONDERS.map((wonder) => {
    const owned = state.tickets.includes(wonder.id);
    const faith = faithById(content, wonder.faith);
    return `
          <article class="wonder-card" style="--c:${faith ? faith.color : wonder.color}">
            ${wonderArt(wonder)}
            <div class="wonder-text">
              <span class="eyebrow">${esc(faith ? faith.short || faith.name : '')} · ${esc(wonder.region)}</span>
              <h2 class="h3">${esc(wonder.name)}</h2>
              <p class="small">${esc(wonder.blurb)}</p>
            </div>
            <div class="wonder-foot">
              <span class="small muted">${owned ? 'Tiket dimiliki' : firstFree ? 'Gratis (pertama)' : `✦ ${TRIP_COST}`}</span>
              <a class="btn" href="#/wisata/${wonder.id}">${owned ? 'Kunjungi' : 'Berangkat'}</a>
            </div>
          </article>`;
  }).join('')}
      </div>
      <p class="small muted">Model 3D disederhanakan dari bentuk aslinya. Fakta dan etika diambil dari sumber resmi dan dapat dikoreksi lewat formulir Koreksi.</p>
    </section>`;
  return bindBalance(main);
}
