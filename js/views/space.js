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
        <p class="small muted">Ketuk untuk menghitung · 33 × 3</p>`;
    case 'rosary':
      return `<p class="sit-title">Rosario</p><p class="sit-phrase" data-phrase>Salam Maria</p>
        <button class="sit-tap" type="button" data-tap aria-label="Hitung butir">0</button>
        <p class="small muted">Satu peristiwa = 1 Bapa Kami, 10 Salam Maria, 1 Kemuliaan</p>`;
    case 'meditate':
    case 'breathe':
      return `<p class="sit-title">${spot.sitMode === 'meditate' ? 'Meditasi' : 'Bernapas'}</p>
        <div class="sit-breath" data-breath></div><p class="sit-phrase" data-phrase>Tarik napas…</p>
        <p class="small muted">Ikuti lingkaran. Satu menit saja sudah cukup.</p>`;
    default:
      return `<p class="sit-title">Hening</p><p class="sit-phrase">Diam sejenak di ${esc(faith.spaceName)}.</p>
        <p class="sit-timer" data-timer>00:00</p>`;
  }
}

export function space(main, [faithId], query, { content, navigate }, extra = {}) {
  const faith = faithById(content, faithId);
  if (!faith) {
    navigate('#/kunjungi');
    return undefined;
  }
  const userPrefs = prefs.get();
  const live = extra.live || null; // { code, host, secret?, mode }
  const mode = live && live.mode ? live.mode : (!userPrefs.faith || userPrefs.faith === faith.id || faith.id === 'alam' ? 'home' : 'visit');
  const greetings = greetingsFor(faith.id, mode);
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
          <span class="eyebrow">${mode === 'visit' ? 'Kunjungi & kenali' : 'Ruangmu'}</span>
          <h1>${esc(faith.spaceName)}</h1>
        </div>
        <div class="stage-pills">
          ${live ? `
            <button class="pill live-pill" type="button" data-live-share><span class="rec"></span>LIVE · <span data-live-code>${esc(live.code)}</span></button>
            <span class="pill count-pill" data-presence-label aria-live="polite">Menghubungkan…</span>` : `
            <button class="pill" type="button" data-presence aria-pressed="false">
              <span class="dot"></span><span data-presence-label>Sendiri</span>
            </button>
            <button class="pill" type="button" data-golive>Siarkan</button>`}
        </div>
      </div>
      ${festiveInfo ? `<div class="stage-banner">${esc(festiveInfo.text)}</div>` : ''}
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
        <div class="greetings" role="group" aria-label="Salam">
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
      </div>
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

  function showSit(spot) {
    clearInterval(sitTimer);
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
    actionKind.textContent = learnOnly ? 'Mode amati' : 'Di dekatmu';
    actionLabel.textContent = learnOnly ? `${spot.label} (untuk umat ${faith.short || faith.name})` : spot.label;
    actionGo.textContent = learnOnly ? 'Pelajari' : spot.kind === 'sit' ? 'Duduk' : 'Lakukan';
  }

  actionGo.addEventListener('click', () => {
    if (!currentSpot || !world) {
      return;
    }
    if (mode === 'visit' && currentSpot.devotional) {
      if (currentSpot.entry) {
        location.hash = `#/entri/${currentSpot.entry}`;
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
  const explained = new Set();
  main.querySelectorAll('[data-greet]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!world) {
        return;
      }
      const greeting = greetingById(button.dataset.greet);
      world.greet(greeting.id);
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
      let rooms = `ruang-${faith.id}`;
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
      sceneId: faith.scene,
      time,
      mode,
      me: { name, color: avatarColor() },
      quality: prefs.get().quality3d || 'auto',
      onNearSpot: describeAction,
      onSit: showSit,
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
          location.hash = `#/entri/${spot.entry}`;
        }
      },
      onBlocked: (message) => toast(message),
    });
    window.__jedaWorld = world;
    if (world.attire) {
      setTimeout(() => toast(`Pakaianmu di ${faith.spaceName}: ${world.attire}`), 900);
    }
    const chips = main.querySelector('[data-chips]');
    chips.innerHTML = world.spots.map((spot) => `<button type="button" class="chip" data-chip="${esc(spot.id)}">${esc(spot.short || spot.label)}</button>`).join('');
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
        <span>Buka di Chrome/Safari terbaru, atau nyalakan "akselerasi perangkat keras" (Chrome: Setelan → Sistem). Kegiatan, salam, dan Ruang Live tetap bisa dipakai di bawah.</span>
      </div>`;
    stage.classList.add('flat');
  }

  return () => {
    cleanups.forEach((fn) => fn && fn());
    clearInterval(sitTimer);
    clearInterval(silenceTimer);
    clearInterval(countTimer);
    stopPresence();
    if (world) {
      world.destroy();
    }
    delete window.__jedaWorld;
    delete document.body.dataset.faith;
    document.body.classList.remove('in-space');
  };
}

async function joinPresenceLazy(room, profile, handlers) {
  const { joinPresence } = await import('../world/presence.js');
  return joinPresence(room, profile, handlers);
}
