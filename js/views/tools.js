// Tools: ceremony planner, places of worship, holy-day calendar, family tradition archive.

import { CONFIG } from '../config.js';
import { prefs, load, save, archivePut, archiveAll, archiveDelete } from '../store.js';
import { esc, toast, uid, formatShortDate, relativeDays, draftBanner } from '../ui.js';
import { faithById, entryById } from '../content.js';
import { holyDays, todaySummary, matchesFaith } from '../calendar.js';
import { speakButton, stopSpeaking } from '../speak.js';

function faithChips(content, active, base) {
  return `<div class="row chips">
      <a class="chip ${!active ? 'active' : ''}" href="${base}">Semua</a>
      ${content.faiths.filter((f) => f.pustaka).map((f) => `<a class="chip ${active === f.id ? 'active' : ''}" href="${base}?iman=${f.id}">${esc(f.short)}</a>`).join('')}
    </div>`;
}

// ---------- Ceremony planner ----------
export function planner(main, [ceremonyId], query, { content }) {
  if (!ceremonyId) {
    const active = query.get('iman') || '';
    const list = content.ceremonies.filter((c) => !active || c.faith === active);
    main.innerHTML = `
      <section class="stack">
        <h1 class="h2">Panduan Upacara</h1>
        <p class="muted">Daftar persiapan, urutan acara, dan hal yang perlu diperhatikan. Centang yang sudah siap; bisa dicetak atau dibagikan ke keluarga.</p>
        ${faithChips(content, active, '#/upacara')}
        <div class="list">
          ${list.map((c) => `<a class="entry-card" href="#/upacara/${c.id}"><strong>${esc(c.title)}</strong><span class="small muted">${esc(c.summary)}</span>
            <span class="entry-meta small">${c.status !== 'approved' ? '<span class="badge">draf</span>' : ''}<span class="muted">${esc(faithById(content, c.faith)?.short || 'Lintas iman')}</span></span></a>`).join('') || '<p class="muted">Belum ada panduan.</p>'}
        </div>
      </section>`;
    return;
  }
  const ceremony = content.ceremonies.find((c) => c.id === ceremonyId);
  if (!ceremony) {
    main.innerHTML = '<section class="stack"><p>Panduan tidak ditemukan.</p></section>';
    return;
  }
  const stateKey = `planner:${ceremony.id}`;
  const checked = new Set(load(stateKey, []));
  const related = (ceremony.related || []).map((id) => entryById(content, id)).filter(Boolean);
  main.innerHTML = `
    <article class="stack narrow prose planner">
      <p class="crumbs no-print"><a href="#/upacara">Panduan Upacara</a></p>
      <h1 class="h2">${esc(ceremony.title)}</h1>
      ${draftBanner(ceremony)}
      <p class="lead">${esc(ceremony.summary)}</p>
      ${ceremony.timing ? `<p><strong>Waktu:</strong> ${esc(ceremony.timing)}</p>` : ''}
      ${ceremony.groups.map((group, gi) => `
        <h2 class="h3">${esc(group.title)}</h2>
        <ul class="check-items">
          ${group.items.map((item, ii) => {
    const key = `${gi}-${ii}`;
    return `<li><label><input type="checkbox" data-key="${key}" ${checked.has(key) ? 'checked' : ''}> <span>${esc(item)}</span></label></li>`;
  }).join('')}
        </ul>`).join('')}
      ${ceremony.steps && ceremony.steps.length ? `<h2 class="h3">Urutan acara</h2><ol class="steps">${ceremony.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
      ${ceremony.dos && ceremony.dos.length ? `<h2 class="h3">Dianjurkan</h2><ul>${ceremony.dos.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
      ${ceremony.donts && ceremony.donts.length ? `<h2 class="h3">Dihindari</h2><ul>${ceremony.donts.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
      ${ceremony.variations && ceremony.variations.length ? `<h2 class="h3">Variasi</h2>${ceremony.variations.map((v) => `<div class="variation"><strong>${esc(v.label)}</strong><p>${esc(v.text)}</p></div>`).join('')}` : ''}
      ${related.length ? `<h2 class="h3 no-print">Bacaan terkait</h2><ul class="no-print">${related.map((e) => `<li><a href="#/entri/${encodeURIComponent(e.id)}">${esc(e.title)}</a></li>`).join('')}</ul>` : ''}
      <h2 class="h3">Sumber</h2>
      <ul class="sources">${(ceremony.sources || []).map((s) => `<li>${esc(s.title)}${s.detail ? `, ${esc(s.detail)}` : ''}</li>`).join('')}</ul>
      <div class="row no-print">
        <button class="btn" data-act="print">Cetak / simpan PDF</button>
        <button class="btn-ghost" data-act="reset">Kosongkan centang</button>
        <a class="btn-ghost" href="${CONFIG.issueUrl('koreksi.yml', `[Koreksi] upacara ${ceremony.id}`)}" target="_blank" rel="noopener">Laporkan koreksi</a>
      </div>
    </article>`;
  main.querySelectorAll('input[type="checkbox"]').forEach((box) => {
    box.addEventListener('change', () => {
      if (box.checked) {
        checked.add(box.dataset.key);
      } else {
        checked.delete(box.dataset.key);
      }
      save(stateKey, [...checked]);
    });
  });
  speakButton(main.querySelector('.planner .row.no-print'), () => [
    ceremony.title,
    ceremony.summary,
    ...ceremony.groups.map((g) => `${g.title}: ${g.items.join(', ')}`),
    ...(ceremony.steps || []).map((s, i) => `Langkah ${i + 1}. ${s}`),
  ].join('. '));
  main.querySelector('[data-act="print"]').addEventListener('click', () => window.print());
  main.querySelector('[data-act="reset"]').addEventListener('click', () => {
    save(stateKey, []);
    main.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.checked = false;
    });
  });
  return () => stopSpeaking();
}

// ---------- Places of worship ----------
export function places(main, params, query, { content }) {
  const active = query.get('iman') || '';
  const render = (text = '') => {
    const needle = text.toLowerCase();
    const list = content.places.filter((p) => (!active || p.faith === active)
      && (!needle || `${p.name} ${p.city} ${p.province}`.toLowerCase().includes(needle)));
    main.querySelector('.places').innerHTML = list.map((p) => {
      const faith = faithById(content, p.faith);
      const mapUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${p.name} ${p.city}`)}`;
      return `<article class="card place" style="--accent:${faith?.color || '#888'}">
          <header>
            <h2 class="h3">${esc(p.name)}</h2>
            <p class="small muted">${esc(faith?.short || '')}${p.tradition ? ` · ${esc(p.tradition)}` : ''} · ${esc(p.city)}, ${esc(p.province)}</p>
          </header>
          ${p.note ? `<p class="small">${esc(p.note)}</p>` : ''}
          <p class="small">${p.verified ? '<span class="badge badge-ok">Terverifikasi</span>' : '<span class="badge badge-dim">Belum terverifikasi</span>'}</p>
          ${p.verified && p.donation ? `<div class="donation"><strong>Donasi langsung ke rumah ibadah</strong><p class="small">${esc(p.donation.method)}: ${esc(p.donation.detail)}</p><p class="small muted">Dana langsung ke rumah ibadah, tidak melalui Jeda.</p></div>`
    : '<p class="small muted">Info donasi tampil setelah diverifikasi langsung dengan pengurus.</p>'}
          <div class="row">
            <a class="btn-ghost small" href="${mapUrl}" target="_blank" rel="noopener">Lihat peta</a>
            ${p.website ? `<a class="btn-ghost small" href="${esc(p.website)}" target="_blank" rel="noopener">Situs resmi</a>` : ''}
            <a class="btn-ghost small" href="${CONFIG.issueUrl('rumah-ibadah.yml', `[Perbarui] ${p.name}`)}" target="_blank" rel="noopener">Perbarui info</a>
          </div>
        </article>`;
    }).join('') || '<p class="muted">Tidak ada hasil.</p>';
  };
  main.innerHTML = `
    <section class="stack">
      <h1 class="h2">Rumah Ibadah</h1>
      <p class="muted">Tempat ibadah nyata di Indonesia. Jeda tidak menerima atau meneruskan dana; donasi selalu langsung ke rumah ibadah. Waspadai rekening palsu: percayai hanya info bertanda <em>Terverifikasi</em>.</p>
      ${faithChips(content, active, '#/ibadah')}
      <input type="search" class="filter" placeholder="Cari nama atau kota…" aria-label="Cari rumah ibadah">
      <div class="places place-grid"></div>
      <div class="card">
        <h2 class="h3">Pengurus rumah ibadah?</h2>
        <p class="small">Daftarkan atau perbarui data tempat ibadahmu. Verifikasi dilakukan dengan menghubungi pengurus resmi sebelum info donasi ditampilkan.</p>
        <a class="btn" href="${CONFIG.issueUrl('rumah-ibadah.yml', '[Daftar] Rumah ibadah baru')}" target="_blank" rel="noopener">Daftarkan rumah ibadah</a>
      </div>
    </section>`;
  main.querySelector('.filter').addEventListener('input', (event) => render(event.target.value));
  render();
}

// ---------- Calendar ----------
export function calendarView(main, params, query, { content }) {
  const mine = prefs.get().faith;
  const active = query.has('iman') ? query.get('iman') : (mine && mine !== 'alam' ? mine : '');
  const list = holyDays(new Date(), 400, content.calendarOverrides)
    .filter((h) => !active || matchesFaith(h, active));
  const today = todaySummary();
  const guides = content.ceremonies.reduce((map, c) => {
    (c.holidays || []).forEach((id) => {
      map[id] = c.id;
    });
    return map;
  }, {});
  const byMonth = new Map();
  list.forEach((h) => {
    const key = h.date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    if (!byMonth.has(key)) {
      byMonth.set(key, []);
    }
    byMonth.get(key).push(h);
  });
  main.innerHTML = `
    <section class="stack">
      <h1 class="h2">Kalender Hari Suci</h1>
      <div class="today-grid">
        <div class="mini-card"><span class="small muted">Imlek / Kongzili</span><span>${esc(today.lunar)}</span></div>
        <div class="mini-card"><span class="small muted">Hijriah</span><span>${esc(today.hijri)}</span></div>
        <div class="mini-card"><span class="small muted">Pawukon Bali</span><span>${esc(today.pawukon)}</span></div>
      </div>
      <div class="row chips">
        <a class="chip ${!active ? 'active' : ''}" href="#/kalender?iman=">Semua</a>
        ${content.faiths.filter((f) => f.pustaka).map((f) => `<a class="chip ${active === f.id ? 'active' : ''}" href="#/kalender?iman=${f.id}">${esc(f.short)}</a>`).join('')}
      </div>
      <p class="small muted">Tanda <em>perkiraan</em> = hasil perhitungan; tanggal resmi (SKB 3 Menteri, sidang isbat, majelis agama) dapat berbeda. Waisak dan Nyepi hanya dari tanggal resmi.</p>
      ${[...byMonth.entries()].map(([month, days]) => `
        <h2 class="h3">${esc(month)}</h2>
        <ul class="holy-list">
          ${days.map((h) => `<li>
              <span>${esc(h.name)} ${guides[h.id] ? `<a class="small" href="#/upacara/${guides[h.id]}">panduan</a>` : ''}</span>
              <span class="small muted">${formatShortDate(h.date)} · ${relativeDays(h.date)}${h.estimated ? ' · perkiraan' : ' · resmi/terhitung'}</span>
            </li>`).join('')}
        </ul>`).join('')}
    </section>`;
}

// ---------- Family tradition archive ----------
const CATEGORIES = ['Kebiasaan & adat', 'Doa & sembahyang', 'Resep hari raya', 'Silsilah & leluhur', 'Cerita tetua', 'Lainnya'];

function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export async function archive(main) {
  main.innerHTML = `
    <section class="stack narrow">
      <h1 class="h2">Arsip Tradisi Keluarga</h1>
      <p class="muted">Catat tata cara, resep, doa, dan cerita dari orang tua dan kakek-nenek sebelum hilang. Rekam suara mereka. Semua tersimpan hanya di perangkat ini; ekspor untuk dibagikan ke keluarga.</p>
      <form class="card archive-form">
        <label class="field"><span>Judul</span><input name="title" required maxlength="100" placeholder="Mis. Cara Ma menyiapkan sembahyang Ceng Beng"></label>
        <label class="field"><span>Kategori</span><select name="category">${CATEGORIES.map((c) => `<option>${c}</option>`).join('')}</select></label>
        <label class="field"><span>Catatan</span><textarea name="text" rows="5" maxlength="10000" placeholder="Tuliskan langkah, bahan, makna, siapa yang mengajarkan…"></textarea></label>
        <label class="field"><span>Dari siapa (opsional)</span><input name="source" maxlength="80" placeholder="Mis. Ma (nenek), Hakka Singkawang"></label>
        <div class="row">
          <button type="button" class="btn-ghost" data-act="record">🎙️ Rekam suara</button>
          <span class="rec-status small muted"></span>
        </div>
        <audio class="rec-preview" controls hidden></audio>
        <div class="row"><button class="btn" type="submit">Simpan</button></div>
      </form>
      <div class="row">
        <button class="btn-ghost" data-act="export">Ekspor arsip (JSON)</button>
        <label class="btn-ghost file-label">Impor arsip<input type="file" accept="application/json" hidden></label>
      </div>
      <div class="archive-list"></div>
      <p class="small muted">Arsip publik bersama (dengan izin dan moderasi) direncanakan di tahap berikutnya.</p>
    </section>`;
  const form = main.querySelector('.archive-form');
  const list = main.querySelector('.archive-list');
  const recordButton = main.querySelector('[data-act="record"]');
  const recStatus = main.querySelector('.rec-status');
  const preview = main.querySelector('.rec-preview');
  let recorder = null;
  let chunks = [];
  let audioBlob = null;
  const urls = [];

  const renderList = async () => {
    const items = await archiveAll();
    urls.forEach((u) => URL.revokeObjectURL(u));
    urls.length = 0;
    list.innerHTML = items.length === 0 ? '<p class="muted">Belum ada catatan.</p>' : items.map((item) => {
      let audioTag = '';
      if (item.audio) {
        const url = URL.createObjectURL(item.audio);
        urls.push(url);
        audioTag = `<audio controls src="${url}"></audio>`;
      }
      return `<article class="card" data-id="${item.id}">
          <h2 class="h3">${esc(item.title)}</h2>
          <p class="small muted">${esc(item.category)}${item.source ? ` · ${esc(item.source)}` : ''} · ${new Date(item.created).toLocaleDateString('id-ID')}</p>
          ${item.text ? `<p class="pre">${esc(item.text)}</p>` : ''}
          ${audioTag}
          <button class="btn-ghost small danger" data-act="delete">Hapus</button>
        </article>`;
    }).join('');
  };

  recordButton.addEventListener('click', async () => {
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream);
      chunks = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        preview.src = URL.createObjectURL(audioBlob);
        preview.hidden = false;
        recordButton.textContent = '🎙️ Rekam ulang';
        recStatus.textContent = 'Rekaman siap disimpan.';
      };
      recorder.start();
      recordButton.textContent = '⏹️ Berhenti';
      recStatus.textContent = 'Merekam…';
    } catch {
      toast('Mikrofon tidak tersedia atau izin ditolak.');
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    await archivePut({
      id: uid(),
      title: String(data.get('title')).trim(),
      category: String(data.get('category')),
      text: String(data.get('text') || '').trim(),
      source: String(data.get('source') || '').trim(),
      audio: audioBlob,
      created: Date.now(),
    });
    form.reset();
    audioBlob = null;
    preview.hidden = true;
    recStatus.textContent = '';
    recordButton.textContent = '🎙️ Rekam suara';
    toast('Tersimpan di perangkat ini.');
    renderList();
  });

  list.addEventListener('click', async (event) => {
    if (event.target.matches('[data-act="delete"]')) {
      const id = event.target.closest('[data-id]').dataset.id;
      if (confirm('Hapus catatan ini?')) {
        await archiveDelete(id);
        renderList();
      }
    }
  });

  main.querySelector('[data-act="export"]').addEventListener('click', async () => {
    const items = await archiveAll();
    const serialised = await Promise.all(items.map(async (item) => ({
      ...item,
      audio: item.audio ? await blobToDataUrl(item.audio) : null,
    })));
    const blob = new Blob([JSON.stringify({ app: 'jeda-arsip', items: serialised }, null, 2)], { type: 'application/json' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `arsip-keluarga-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
  });

  main.querySelector('input[type="file"]').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    try {
      const payload = JSON.parse(await file.text());
      if (payload.app !== 'jeda-arsip') {
        throw new Error('Bukan berkas arsip Jeda.');
      }
      for (const item of payload.items) {
        const audio = item.audio ? await (await fetch(item.audio)).blob() : null;
        await archivePut({ ...item, audio });
      }
      toast('Arsip diimpor.');
      renderList();
    } catch (error) {
      toast(error.message);
    }
  });

  renderList().catch((error) => {
    console.warn(error);
    list.innerHTML = '<p class="muted">Penyimpanan perangkat tidak tersedia (mungkin mode penjelajahan pribadi). Arsip tidak dapat disimpan di sini.</p>';
  });
  return () => urls.forEach((u) => URL.revokeObjectURL(u));
}
