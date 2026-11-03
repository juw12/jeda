// Core views: landing, home, choose path, visit list, more menu, settings, about, support.

import { CONFIG } from '../config.js';
import { prefs, exportAll, importAll, clearAll } from '../store.js';
import { esc, toast, formatDate, formatShortDate, relativeDays, timeOfDay } from '../ui.js';
import { faithById } from '../content.js';
import { holyDays, todaySummary, matchesFaith } from '../calendar.js';
import { sceneSvg } from '../scenes.js';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) {
    return 'Selamat pagi';
  }
  if (hour < 15) {
    return 'Selamat siang';
  }
  if (hour < 19) {
    return 'Selamat sore';
  }
  return 'Selamat malam';
}

export function landing(main, params, query, { content }) {
  main.innerHTML = `
    <section class="landing">
      <div class="landing-scene">${sceneSvg('alam', timeOfDay(), 'Pemandangan tenang')}</div>
      <div class="landing-text">
        <h1>${esc(CONFIG.appName)}</h1>
        <p class="lead">${esc(CONFIG.tagline)}</p>
        <p>Ruang ibadah virtual yang tenang, pustaka ajaran dan upacara, untuk umat Islam, Kristen, Katolik, Hindu, Buddha, dan Khonghucu.
           Tanpa daftar. Tanpa iklan. Pilihanmu hanya tersimpan di perangkat ini.</p>
        <a class="btn btn-big" href="#/pilih">Masuk dengan tenang</a>
        <p class="small muted"><a href="#/pustaka">Jelajahi Pustaka</a> · <a href="#/tentang">Tentang Hening</a></p>
      </div>
    </section>`;
}

export function home(main, params, query, ctx) {
  const { content } = ctx;
  const userPrefs = prefs.get();
  if (!userPrefs.faith) {
    return landing(main, params, query, ctx);
  }
  const faith = faithById(content, userPrefs.faith);
  const today = todaySummary();
  const upcoming = holyDays(new Date(), 120, content.calendarOverrides)
    .filter((h) => faith.id === 'alam' || matchesFaith(h, faith.id))
    .slice(0, 4);
  main.innerHTML = `
    <section class="hero" style="--accent:${faith.color}">
      <a class="hero-scene" href="#/ruang/${faith.id}" aria-label="Masuk ke ${esc(faith.spaceName)}">
        ${sceneSvg(faith.scene, timeOfDay(), faith.spaceName)}
        <span class="hero-cta">Masuk ke ${esc(faith.spaceName)} →</span>
      </a>
    </section>
    <section class="stack">
      <h1 class="h2">${greeting()}.</h1>
      <p class="muted">${esc(formatDate(new Date()))}</p>
      <div class="today-grid">
        <div class="mini-card"><span class="small muted">Imlek / Kongzili</span><span>${esc(today.lunar)}</span></div>
        <div class="mini-card"><span class="small muted">Hijriah</span><span>${esc(today.hijri)}</span></div>
        <div class="mini-card"><span class="small muted">Pawukon Bali</span><span>${esc(today.pawukon)}</span></div>
      </div>

      ${upcoming.length ? `
      <h2 class="h3">Hari suci mendatang</h2>
      <ul class="holy-list">
        ${upcoming.map((h) => `<li><span>${esc(h.name)}</span><span class="muted small">${formatShortDate(h.date)} · ${relativeDays(h.date)}${h.estimated ? ' · perkiraan' : ''}</span></li>`).join('')}
      </ul>
      <a class="small" href="#/kalender">Lihat kalender lengkap</a>` : ''}

      <div class="quick-grid">
        <a class="quick" href="#/pustaka/${faith.pustaka ? faith.id : ''}"><strong>Pustaka</strong><span>Ajaran, kitab, ritual, upacara</span></a>
        <a class="quick" href="#/tanya"><strong>Tanya Hening</strong><span>Jawaban bersumber dari Pustaka</span></a>
        <a class="quick" href="#/upacara"><strong>Panduan Upacara</strong><span>Daftar persiapan yang bisa dicetak</span></a>
        <a class="quick" href="#/ibadah"><strong>Rumah Ibadah</strong><span>Tempat ibadah nyata & donasi langsung</span></a>
        <a class="quick" href="#/kunjungi"><strong>Kunjungi & Kenali</strong><span>Belajar mengenal iman sesama</span></a>
        <a class="quick" href="#/arsip"><strong>Arsip Keluarga</strong><span>Simpan tradisi & suara para tetua</span></a>
      </div>
    </section>`;
}

export function choose(main, params, query, { content, navigate }) {
  const current = prefs.get();
  let state = {
    faith: current.faith,
    streams: [...(current.streams || [])],
    dialect: current.dialect,
    step: 1,
  };

  const render = () => {
    const faith = state.faith ? faithById(content, state.faith) : null;
    if (state.step === 1) {
      main.innerHTML = `
        <section class="stack narrow">
          <p class="step-label">Langkah 1 dari ${faith && faith.dialects ? 3 : 2}</p>
          <h1 class="h2">Apa jalan imanmu?</h1>
          <p class="muted">Pilihan ini menentukan ruang utamamu dan hanya tersimpan di perangkat ini. Kamu tetap bisa mengunjungi ruang iman lain kapan saja.</p>
          <div class="faith-grid">
            ${content.faiths.map((f) => `
              <button class="faith-card ${state.faith === f.id ? 'selected' : ''}" data-faith="${f.id}" style="--accent:${f.color}">
                <span class="faith-icon" aria-hidden="true">${f.icon}</span>
                <strong>${esc(f.name)}</strong>
                <span class="small muted">${esc(f.spaceName)}</span>
              </button>`).join('')}
          </div>
        </section>`;
      main.querySelectorAll('[data-faith]').forEach((button) => {
        button.addEventListener('click', () => {
          if (state.faith !== button.dataset.faith) {
            state.streams = [];
            state.dialect = null;
          }
          state.faith = button.dataset.faith;
          const chosen = faithById(content, state.faith);
          state.step = chosen.streams && chosen.streams.length ? 2 : 4;
          if (state.step === 4) {
            finish();
            return;
          }
          render();
        });
      });
      return;
    }
    if (state.step === 2) {
      main.innerHTML = `
        <section class="stack narrow">
          <p class="step-label">Langkah 2 dari ${faith.dialects ? 3 : 2}</p>
          <h1 class="h2">Aliran / komunitas</h1>
          <p class="muted">Pilih satu atau lebih. Pustaka akan menampilkan panduan untuk alirannya, dan perbedaan dengan aliran lain tetap terlihat. Tidak yakin? Pilih "Umum".</p>
          <div class="check-list">
            ${faith.streams.map((s) => `
              <label class="check-card">
                <input type="checkbox" value="${s.id}" ${state.streams.includes(s.id) ? 'checked' : ''}>
                <span><strong>${esc(s.name)}</strong><br><span class="small muted">${esc(s.desc || '')}</span></span>
              </label>`).join('')}
          </div>
          <div class="row">
            <button class="btn-ghost" data-act="back">Kembali</button>
            <button class="btn" data-act="next">Lanjut</button>
          </div>
        </section>`;
      main.querySelector('[data-act="back"]').addEventListener('click', () => {
        state.step = 1;
        render();
      });
      main.querySelector('[data-act="next"]').addEventListener('click', () => {
        state.streams = [...main.querySelectorAll('input:checked')].map((i) => i.value);
        if (faith.dialects) {
          state.step = 3;
          render();
        } else {
          finish();
        }
      });
      return;
    }
    if (state.step === 3) {
      main.innerHTML = `
        <section class="stack narrow">
          <p class="step-label">Langkah 3 dari 3</p>
          <h1 class="h2">Tradisi keluarga (suku/dialek)</h1>
          <p class="muted">Adat Tionghoa di Indonesia berbeda-beda menurut asal leluhur. Pilihan ini menonjolkan variasi yang sesuai di Pustaka.</p>
          <div class="check-list">
            ${faith.dialects.map((d) => `
              <label class="check-card">
                <input type="radio" name="dialect" value="${d.id}" ${state.dialect === d.id ? 'checked' : ''}>
                <span><strong>${esc(d.name)}</strong><br><span class="small muted">${esc(d.region || '')}</span></span>
              </label>`).join('')}
          </div>
          <div class="row">
            <button class="btn-ghost" data-act="back">Kembali</button>
            <button class="btn" data-act="next">Selesai</button>
          </div>
        </section>`;
      main.querySelector('[data-act="back"]').addEventListener('click', () => {
        state.step = 2;
        render();
      });
      main.querySelector('[data-act="next"]').addEventListener('click', () => {
        const checked = main.querySelector('input[name="dialect"]:checked');
        state.dialect = checked ? checked.value : null;
        finish();
      });
    }
  };

  const finish = () => {
    prefs.set({ faith: state.faith, streams: state.streams, dialect: state.dialect });
    toast('Tersimpan di perangkat ini.');
    navigate(`#/ruang/${state.faith}`);
  };

  render();
}

export function visitList(main, params, query, { content }) {
  const mine = prefs.get().faith;
  main.innerHTML = `
    <section class="stack">
      <h1 class="h2">Kunjungi & Kenali</h1>
      <p class="muted">Masuklah sebagai tamu yang hormat. Di ruang iman lain, ritual ditampilkan sebagai demonstrasi untuk dipelajari, bukan untuk dilakukan.</p>
      <div class="space-grid">
        ${content.faiths.map((f) => `
          <a class="space-card" href="#/ruang/${f.id}" style="--accent:${f.color}">
            ${sceneSvg(f.scene, timeOfDay(), f.spaceName)}
            <span class="space-card-label"><strong>${esc(f.spaceName)}</strong><span class="small">${esc(f.name)}${f.id === mine ? ' · ruangmu' : ''}</span></span>
          </a>`).join('')}
      </div>
    </section>`;
}

export function more(main) {
  const links = [
    ['#/kalender', 'Kalender Hari Suci', 'Imlek, Hijriah, Pawukon, liturgi'],
    ['#/upacara', 'Panduan Upacara', 'Daftar persiapan dan urutan acara'],
    ['#/ibadah', 'Rumah Ibadah', 'Tempat ibadah nyata dan donasi langsung'],
    ['#/arsip', 'Arsip Tradisi Keluarga', 'Catatan dan rekaman suara, tersimpan di perangkat'],
    ['#/kunjungi', 'Kunjungi & Kenali', 'Ruang iman lain dalam mode amati'],
    ['#/pustaka/lintas', 'Etiket Lintas Iman', 'Cara hormat menghadiri acara iman lain'],
    ['#/dukung', 'Dukung Hening', 'Bantu biaya server dan pengembangan'],
    ['#/tentang', 'Tentang & Prinsip', 'Privasi, sumber, status tinjauan'],
    ['#/pengaturan', 'Pengaturan', 'Ubah jalan iman, tampilan, data'],
  ];
  main.innerHTML = `
    <section class="stack narrow">
      <h1 class="h2">Lainnya</h1>
      <ul class="menu-list">
        ${links.map(([href, title, desc]) => `<li><a href="${href}"><strong>${title}</strong><span class="small muted">${desc}</span></a></li>`).join('')}
      </ul>
    </section>`;
}

export function settings(main, params, query, { content, rerender }) {
  const p = prefs.get();
  const faith = p.faith ? faithById(content, p.faith) : null;
  const streamNames = faith && faith.streams
    ? faith.streams.filter((s) => p.streams.includes(s.id)).map((s) => s.name).join(', ')
    : '';
  main.innerHTML = `
    <section class="stack narrow">
      <h1 class="h2">Pengaturan</h1>
      <div class="card">
        <h2 class="h3">Jalan iman</h2>
        <p>${faith ? `${esc(faith.name)}${streamNames ? ` · ${esc(streamNames)}` : ''}` : 'Belum dipilih'}</p>
        <a class="btn-ghost" href="#/pilih">Ubah</a>
      </div>
      <div class="card">
        <h2 class="h3">Tampilan & suara</h2>
        <label class="toggle"><input type="checkbox" data-pref="largeText" ${p.largeText ? 'checked' : ''}> Teks besar</label>
        <label class="toggle"><input type="checkbox" data-pref="lightTheme" ${p.theme === 'light' ? 'checked' : ''}> Tema terang</label>
        <label class="toggle"><input type="checkbox" data-pref="sound" ${p.sound ? 'checked' : ''}> Suara (genta, ambience)</label>
        <label class="toggle"><input type="checkbox" data-pref="reducedMotion" ${p.reducedMotion ? 'checked' : ''}> Kurangi animasi</label>
      </div>
      <div class="card">
        <h2 class="h3">Data di perangkat ini</h2>
        <p class="small muted">Semua data (pilihan iman, lilin, papan leluhur, catatan) hanya ada di perangkat ini. Rekaman suara Arsip disimpan terpisah dan diekspor dari halaman Arsip.</p>
        <div class="row">
          <button class="btn-ghost" data-act="export">Ekspor cadangan</button>
          <label class="btn-ghost file-label">Impor cadangan<input type="file" accept="application/json" hidden></label>
          <button class="btn-ghost danger" data-act="clear">Hapus semua data</button>
        </div>
      </div>
    </section>`;
  main.querySelectorAll('[data-pref]').forEach((input) => {
    input.addEventListener('change', () => {
      const key = input.dataset.pref;
      if (key === 'lightTheme') {
        prefs.set({ theme: input.checked ? 'light' : 'dark' });
      } else {
        prefs.set({ [key]: input.checked });
      }
      rerender();
    });
  });
  main.querySelector('[data-act="export"]').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type: 'application/json' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `hening-cadangan-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  });
  main.querySelector('input[type="file"]').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    try {
      importAll(JSON.parse(await file.text()));
      toast('Cadangan dipulihkan.');
      rerender();
    } catch (error) {
      toast(error.message);
    }
  });
  main.querySelector('[data-act="clear"]').addEventListener('click', () => {
    if (confirm('Hapus semua data Hening di perangkat ini?')) {
      clearAll();
      toast('Data dihapus.');
      location.hash = '#/';
    }
  });
}

export function about(main, params, query, { content }) {
  const total = content.allEntriesCount;
  const approved = content.entries.filter((e) => e.status === 'approved').length;
  main.innerHTML = `
    <section class="stack narrow prose">
      <h1 class="h2">Tentang ${esc(CONFIG.appName)}</h1>
      <p>${esc(CONFIG.appName)} adalah ruang hening virtual dan pustaka untuk setiap iman di Indonesia: tempat beristirahat sejenak,
         belajar cara beribadah dan beradat yang benar menurut tradisi masing-masing, dan mengenal iman sesama.</p>

      <h2 class="h3">Prinsip</h2>
      <ul>
        <li><strong>Bukan otoritas agama.</strong> Hening menyajikan ajaran dari sumber yang disebutkan dan ditinjau oleh pemuka/reviewer tiap agama. Perbedaan antar-aliran ditampilkan berdampingan, tidak dinilai.</li>
        <li><strong>Tidak menggantikan ibadah.</strong> Ruang virtual membantu ketenangan dan belajar, bukan pengganti ibadah wajib atau sakramen.</li>
        <li><strong>Kunjungi dengan hormat.</strong> Di ruang iman lain, ritual hanya ditampilkan sebagai demonstrasi.</li>
        <li><strong>Tanpa poin, tanpa jual berkah.</strong> Tidak ada skor, peringkat, atau imbalan rohani berbayar. Donasi tidak pernah dikaitkan dengan ritual.</li>
        <li><strong>Privasi.</strong> Pilihan agama dan semua catatanmu hanya tersimpan di perangkat ini (UU PDP No. 27/2022). Tidak ada akun, iklan, atau pelacak.</li>
        <li><strong>Konten AI.</strong> Kerangka awal Pustaka disusun dengan bantuan AI dan ditandai <em>Draf</em> sampai ditinjau. Tanya Hening hanya mengutip Pustaka.</li>
      </ul>

      <h2 class="h3">Status Pustaka</h2>
      <p>${approved} dari ${total} entri telah ditinjau. ${CONFIG.showDrafts ? 'Mode pratinjau: draf ditampilkan dengan tanda.' : 'Hanya entri yang telah ditinjau yang ditampilkan.'}</p>
      <p>Menemukan kesalahan? Setiap entri punya tombol <em>Laporkan koreksi</em>. Ingin menjadi reviewer? <a href="${CONFIG.issueUrl('reviewer.yml', 'Daftar reviewer')}" target="_blank" rel="noopener">Daftar di sini</a>.</p>

      <h2 class="h3">Sumber & lisensi</h2>
      <p>Teks kitab suci hanya dimuat bila berstatus domain publik atau telah mendapat izin; selain itu Hening menautkan ke sumber resmi. Daftar sumber ada di setiap entri dan halaman <a href="#/pustaka">Kitab Suci</a> tiap agama.</p>

      <h2 class="h3">Pembuat</h2>
      <p>Dibuat oleh <a href="${CONFIG.developer.github}" target="_blank" rel="noopener">${esc(CONFIG.developer.name)}</a>. Kode: <a href="${CONFIG.repo}" target="_blank" rel="noopener">${esc(CONFIG.repo.replace('https://', ''))}</a>. Versi ${esc(CONFIG.version)}.</p>
      <p>Terinspirasi oleh "Sansa" (산사), kuil virtual dari Korea.</p>
    </section>`;
}

export function support(main) {
  const activeLinks = CONFIG.support.filter((s) => s.active);
  main.innerHTML = `
    <section class="stack narrow prose">
      <h1 class="h2">Dukung Hening</h1>
      <p>Hening gratis dan tanpa iklan, dibuat oleh satu orang:
        <a href="${CONFIG.developer.github}" target="_blank" rel="noopener">${esc(CONFIG.developer.name)}</a>.
        Dukunganmu membantu biaya server, AI, dan peninjauan konten.</p>
      <div class="support-grid">
        ${CONFIG.support.map((s) => s.active
    ? `<a class="support-card" href="${esc(s.url)}" target="_blank" rel="noopener"><strong>${esc(s.name)}</strong><span class="small muted">${esc(s.note)}</span></a>`
    : `<div class="support-card disabled"><strong>${esc(s.name)}</strong><span class="small muted">Segera hadir</span></div>`).join('')}
      </div>
      ${activeLinks.length === 0 ? '<p class="small muted">Tautan dukungan belum aktif.</p>' : ''}
      <h2 class="h3">Ingin berdonasi untuk rumah ibadah?</h2>
      <p>Donasi untuk klenteng, vihara, pura, masjid, atau gereja <strong>langsung ke rekening/QRIS resmi rumah ibadah</strong>, bukan lewat Hening.
         Lihat <a href="#/ibadah">Rumah Ibadah</a>; info donasi hanya tampil untuk tempat yang sudah terverifikasi.</p>
      <h2 class="h3">Janji kami</h2>
      <ul>
        <li>Dukungan untuk pengembang tidak pernah dikaitkan dengan doa, berkah, atau ritual.</li>
        <li>Tidak ada fitur berbayar untuk ibadah.</li>
        <li>Penggunaan dana dilaporkan secara terbuka di halaman ini.</li>
      </ul>
    </section>`;
}

export { formatDate };
