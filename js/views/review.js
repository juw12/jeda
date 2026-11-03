// Tinjau: reviewers approve or flag entries; the owner merges review files and downloads updated content.
// Works fully in the browser, no server or tools needed.

import { load, save } from '../store.js';
import { esc, toast } from '../ui.js';
import { faithById } from '../content.js';
import { CONFIG } from '../config.js';
import { reviewIssueUrls } from '../review-lib.js';

const TODAY = () => new Date().toISOString().slice(0, 10);

function download(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

const REPO = CONFIG.repo.replace('https://github.com/', '');

async function loadReviewers() {
  try {
    const response = await fetch('content/reviewers.json', { cache: 'no-cache' });
    return response.ok ? await response.json() : [];
  } catch {
    return [];
  }
}

export async function review(main, params, query, { content, rerender }) {
  const state = load('review', { reviewer: '', role: '', reviewerId: '', faith: '', decisions: {} });
  const reviewers = await loadReviewers();
  const registered = reviewers.find((r) => r.id === state.reviewerId) || null;
  const faiths = content.faiths.filter((f) => f.pustaka);
  const filterFaith = query.get('iman') || state.faith || faiths[0].id;
  const filterStatus = query.get('status') || 'draft';
  const entries = content.rawEntries.filter((e) => e.faith === filterFaith && (filterStatus === 'all' || e.status === filterStatus));
  const decided = Object.keys(state.decisions).length;

  main.innerHTML = `
    <section class="stack narrow">
      <h1 class="h2">Tinjau Pustaka</h1>
      <p class="muted">Untuk pemuka agama dan reviewer. Baca entri, lalu tandai <strong>Setujui</strong> atau <strong>Perlu perbaikan</strong> dengan catatan.
        Hasil tinjauan tersimpan di perangkat ini; kirim berkasnya kepada pengelola Jeda.</p>
      <div class="card">
        <label class="field"><span>Saya reviewer terverifikasi</span>
          <select name="reviewerId">
            <option value="">— pilih nama Anda (${reviewers.length} reviewer terdaftar) —</option>
            ${reviewers.map((r) => `<option value="${esc(r.id)}" ${r.id === state.reviewerId ? 'selected' : ''}>${esc(r.name)} · ${esc(r.faiths.join(', '))}</option>`).join('')}
          </select>
        </label>
        <p class="small muted">Belum terdaftar? <a href="${CONFIG.repo}/issues/new?template=reviewer.yml" target="_blank" rel="noopener">Daftar sebagai reviewer</a> (gratis, butuh akun GitHub). Setelah diverifikasi pengelola, nama Anda muncul di sini.</p>
        <details class="small"><summary>Tanpa akun GitHub? Isi nama untuk ekspor berkas</summary>
          <label class="field"><span>Nama reviewer</span><input name="reviewer" value="${esc(state.reviewer)}" placeholder="Nama lengkap"></label>
          <label class="field"><span>Peran & lembaga</span><input name="role" value="${esc(state.role)}" placeholder="Mis. Rohaniwan, Litang X / Ustaz, PCNU Y"></label>
        </details>
      </div>
      <div class="row chips">
        ${faiths.map((f) => `<a class="chip ${f.id === filterFaith ? 'active' : ''}" href="#/tinjau?iman=${f.id}&status=${filterStatus}">${esc(f.short)}</a>`).join('')}
        <a class="chip" href="#/tinjau?iman=lintas&status=${filterStatus}">Lintas</a>
      </div>
      <div class="row chips">
        ${[['draft', 'Draf'], ['in_review', 'Sedang ditinjau'], ['approved', 'Disetujui'], ['all', 'Semua']].map(([id, label]) => `<a class="chip ${id === filterStatus ? 'active' : ''}" href="#/tinjau?iman=${filterFaith}&status=${id}">${label}</a>`).join('')}
      </div>
      <p class="small muted">${entries.length} entri · ${decided} keputusan tersimpan di perangkat ini</p>
      <div class="list review-list">
        ${entries.map((e) => {
    const d = state.decisions[e.id] || {};
    return `<article class="card review-item" data-id="${e.id}">
            <a href="#/entri/${encodeURIComponent(e.id)}?tinjau=1"><strong>${esc(e.title)}</strong></a>
            <span class="small muted">${esc(e.section)} · status: ${esc(e.status)} · v${esc(e.version)}</span>
            <div class="row">
              <label class="chip"><input type="radio" name="d-${e.id}" value="approve" ${d.decision === 'approve' ? 'checked' : ''}> Setujui</label>
              <label class="chip"><input type="radio" name="d-${e.id}" value="revise" ${d.decision === 'revise' ? 'checked' : ''}> Perlu perbaikan</label>
            </div>
            <textarea rows="2" placeholder="Catatan, koreksi, atau rujukan (kitab/ayat/buku/lembaga)">${esc(d.note || '')}</textarea>
          </article>`;
  }).join('') || '<p class="muted">Tidak ada entri dengan filter ini.</p>'}
      </div>
      <div class="row">
        <button class="btn" data-act="github">Kirim ke GitHub</button>
        <button class="btn-ghost" data-act="export">Ekspor berkas</button>
        <button class="btn-ghost danger" data-act="clear">Hapus keputusan</button>
      </div>
      <div class="send-result small"></div>

      <div class="card">
        <h2 class="h3">Untuk pengelola: gabungkan tinjauan</h2>
        <p class="small muted">Pilih satu atau beberapa berkas tinjauan. Jeda menerapkannya ke Pustaka, lalu mengunduh berkas <code>content/entries/&lt;agama&gt;.json</code> yang sudah diperbarui untuk di-commit.</p>
        <label class="btn-ghost file-label">Pilih berkas tinjauan<input type="file" accept="application/json" multiple hidden></label>
        <div class="merge-result small"></div>
      </div>
    </section>`;

  const persist = () => save('review', state);
  main.querySelector('select[name="reviewerId"]').addEventListener('change', (event) => {
    state.reviewerId = event.target.value;
    persist();
  });
  main.querySelectorAll('input[name="reviewer"], input[name="role"]').forEach((input) => {
    input.addEventListener('change', () => {
      state[input.name] = input.value.trim();
      persist();
    });
  });
  state.faith = filterFaith;
  persist();

  main.querySelector('.review-list').addEventListener('change', (event) => {
    const item = event.target.closest('.review-item');
    if (!item) {
      return;
    }
    const id = item.dataset.id;
    const radio = item.querySelector('input[type="radio"]:checked');
    const note = item.querySelector('textarea').value.trim();
    if (!radio && !note) {
      delete state.decisions[id];
    } else {
      const entry = content.rawEntries.find((e) => e.id === id);
      state.decisions[id] = { decision: radio ? radio.value : 'revise', note, version: entry.version };
    }
    persist();
  });

  main.querySelector('[data-act="github"]').addEventListener('click', () => {
    const reviewer = reviewers.find((r) => r.id === state.reviewerId);
    if (!reviewer) {
      toast('Pilih nama reviewer terverifikasi terlebih dahulu.');
      return;
    }
    const items = Object.entries(state.decisions)
      .map(([id, d]) => ({ id, ...d }))
      .filter((item) => {
        const entry = content.rawEntries.find((e) => e.id === item.id);
        return entry && reviewer.faiths.includes(entry.faith);
      });
    if (items.length === 0) {
      toast('Belum ada keputusan untuk agama yang Anda tinjau.');
      return;
    }
    const faithLabel = reviewer.faiths.map((id) => faithById(content, id)?.short || id).join(', ');
    const urls = reviewIssueUrls({ repo: REPO, reviewer, items, date: TODAY(), faithLabel });
    const box = main.querySelector('.send-result');
    if (urls.length === 1) {
      window.open(urls[0], '_blank', 'noopener');
      toast('Halaman GitHub dibuka. Tekan "Submit new issue" untuk mengirim.');
    }
    box.innerHTML = `<p>Kirim ${urls.length} bagian tinjauan (tekan <em>Submit new issue</em> di setiap halaman):</p>
      <ul>${urls.map((url, index) => `<li><a href="${esc(url)}" target="_blank" rel="noopener">Bagian ${index + 1} dari ${urls.length}</a></li>`).join('')}</ul>
      <p class="small muted">Bot Jeda menerapkan tinjauan otomatis bila dikirim dari akun GitHub Anda yang terdaftar.</p>`;
    box.scrollIntoView({ behavior: 'smooth' });
  });

  main.querySelector('[data-act="export"]').addEventListener('click', () => {
    if (!state.reviewer) {
      toast('Isi nama reviewer terlebih dahulu.');
      return;
    }
    const items = Object.entries(state.decisions).map(([id, d]) => ({ id, ...d }));
    if (items.length === 0) {
      toast('Belum ada keputusan.');
      return;
    }
    download(`tinjauan-${state.reviewer.replace(/\s+/g, '-').toLowerCase()}-${TODAY()}.json`, {
      app: 'jeda-review',
      reviewer: state.reviewer,
      role: state.role,
      date: TODAY(),
      items,
    });
  });

  main.querySelector('[data-act="clear"]').addEventListener('click', () => {
    if (confirm('Hapus semua keputusan tinjauan di perangkat ini?')) {
      state.decisions = {};
      persist();
      rerender();
    }
  });

  main.querySelector('input[type="file"]').addEventListener('change', async (event) => {
    const files = [...event.target.files];
    const resultBox = main.querySelector('.merge-result');
    const updated = new Map(content.rawEntries.map((e) => [e.id, JSON.parse(JSON.stringify(e))]));
    const touchedFaiths = new Set();
    const log = [];
    for (const file of files) {
      try {
        const payload = JSON.parse(await file.text());
        if (payload.app !== 'jeda-review') {
          throw new Error('bukan berkas tinjauan Jeda');
        }
        for (const item of payload.items) {
          const entry = updated.get(item.id);
          if (!entry) {
            log.push(`Lewati ${item.id}: tidak ditemukan`);
            continue;
          }
          if (item.version !== entry.version) {
            log.push(`Perhatian ${item.id}: ditinjau pada versi ${item.version}, kini versi ${entry.version}`);
          }
          entry.review_notes = entry.review_notes || [];
          if (item.note) {
            entry.review_notes.push({ by: payload.reviewer, role: payload.role, date: payload.date, decision: item.decision, note: item.note });
          }
          if (item.decision === 'approve') {
            entry.status = 'approved';
            entry.reviewed_by = payload.role ? `${payload.reviewer} (${payload.role})` : payload.reviewer;
            entry.reviewed_at = payload.date;
          } else if (entry.status !== 'approved') {
            entry.status = 'in_review';
          }
          entry.updated = TODAY();
          touchedFaiths.add(entry.faith);
        }
        log.push(`${file.name}: ${payload.items.length} keputusan dari ${payload.reviewer}`);
      } catch (error) {
        log.push(`${file.name}: gagal (${error.message})`);
      }
    }
    for (const faithId of touchedFaiths) {
      const list = [...updated.values()].filter((e) => e.faith === faithId);
      download(`${faithId}.json`, list);
    }
    resultBox.innerHTML = `<ul>${log.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
      <p>${touchedFaiths.size} berkas diunduh. Ganti berkas di <code>content/entries/</code>, lalu commit. Ingat: entri baru tampil publik setelah <code>showDrafts: false</code>.</p>`;
  });
}
