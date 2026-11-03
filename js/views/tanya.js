// Tanya Jeda: answers only from Pustaka entries, always with citations.
// Free mode = retrieval over the Pustaka. Optional AI mode = CONFIG.tanyaEndpoint (worker), still citation-bound.

import { CONFIG } from '../config.js';
import { prefs } from '../store.js';
import { esc } from '../ui.js';
import { faithById } from '../content.js';
import { search } from '../search.js';
import { getIndex } from './pustaka.js';

const CRISIS = /(bunuh diri|ingin mati|pengen mati|mau mati|mengakhiri hidup|menyakiti diri|self.?harm|suicide)/i;
const COMPARE = /(agama (mana|apa) yang (paling )?(benar|salah|sesat)|agama .* (sesat|salah)|lebih benar)/i;
const MIN_SCORE = 1.2;

function citationList(results) {
  return `<ul class="citations">${results.map((r) => `<li><a href="#/entri/${encodeURIComponent(r.entry.id)}">${esc(r.entry.title)}</a>${r.entry.status !== 'approved' ? ' <span class="badge">draf</span>' : ''}</li>`).join('')}</ul>`;
}

function extractiveAnswer(results) {
  const top = results[0].entry;
  const steps = (top.steps || []).slice(0, 4);
  return `
    <p>Dari Pustaka Jeda, entri yang paling sesuai: <strong>${esc(top.title)}</strong>.</p>
    <p>${esc(top.summary)}</p>
    ${steps.length ? `<ol>${steps.map((s) => `<li>${esc(s.text)}</li>`).join('')}</ol>` : ''}
    ${top.variations && top.variations.length ? '<p class="small muted">Ada perbedaan antar-aliran/daerah; lihat entrinya.</p>' : ''}
    <p class="small muted">Sumber:</p>
    ${citationList(results.slice(0, 3))}
    ${results.some((r) => r.entry.status !== 'approved') ? '<p class="small muted">Sebagian sumber masih draf yang belum ditinjau. Pastikan kepada pemuka agama Anda.</p>' : ''}`;
}

async function aiAnswer(question, results, userPrefs) {
  const passages = results.slice(0, 5).map((r) => ({
    id: r.entry.id,
    title: r.entry.title,
    faith: r.entry.faith,
    status: r.entry.status,
    text: [r.entry.summary, ...(r.entry.body || []), ...(r.entry.steps || []).map((s) => s.text)].join('\n').slice(0, 2500),
  }));
  const response = await fetch(CONFIG.tanyaEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, faith: userPrefs.faith, streams: userPrefs.streams, passages }),
  });
  if (!response.ok) {
    throw new Error(`AI ${response.status}`);
  }
  const data = await response.json();
  const allowed = new Set(passages.map((p) => p.id));
  const cited = (data.citations || []).filter((id) => allowed.has(id));
  if (!data.answer || cited.length === 0) {
    throw new Error('Jawaban tanpa sitasi ditolak');
  }
  const citedResults = results.filter((r) => cited.includes(r.entry.id));
  return `<p>${esc(data.answer).replace(/\n/g, '<br>')}</p><p class="small muted">Sumber:</p>${citationList(citedResults)}`;
}

export function tanya(main, params, query, { content }) {
  const userPrefs = prefs.get();
  const faithOptions = content.faiths.filter((f) => f.pustaka);
  main.innerHTML = `
    <section class="stack narrow tanya">
      <h1 class="h2">Tanya Jeda</h1>
      <p class="muted small">Jawaban hanya diambil dari Pustaka Jeda dan selalu disertai sumber. Jeda tidak memberi fatwa atau tafsir pribadi.
        Untuk hal yang menyangkut keyakinan dan keputusan penting, tanyakan kepada pemuka agama Anda.</p>
      <label class="field inline"><span>Cari di</span>
        <select name="faith">
          <option value="">Semua iman</option>
          ${faithOptions.map((f) => `<option value="${f.id}" ${f.id === userPrefs.faith ? 'selected' : ''}>${esc(f.short)}</option>`).join('')}
          <option value="lintas">Lintas iman</option>
        </select>
      </label>
      <div class="chat" aria-live="polite"></div>
      <form class="chat-form">
        <input name="q" autocomplete="off" required maxlength="300" placeholder="Mis. Apa saja yang perlu disiapkan untuk Ceng Beng?">
        <button class="btn" type="submit">Tanya</button>
      </form>
      <div class="row suggestions">
        ${['Persiapan Ceng Beng', 'Urutan sholat dan wudu', 'Doa rosario hari ini', 'Arti Galungan', 'Etika melayat teman beda agama'].map((s) => `<button class="chip" data-q="${esc(s)}">${esc(s)}</button>`).join('')}
      </div>
      <p class="small muted">Pertanyaan tidak disimpan. ${CONFIG.tanyaEndpoint ? 'Mode AI aktif: pertanyaan dan kutipan Pustaka dikirim ke server untuk dirangkum.' : 'Mode gratis: pencarian Pustaka di perangkat ini.'}</p>
    </section>`;
  const chat = main.querySelector('.chat');
  const form = main.querySelector('.chat-form');
  const select = main.querySelector('select');

  const add = (role, html) => {
    const bubble = document.createElement('div');
    bubble.className = `bubble ${role}`;
    bubble.innerHTML = html;
    chat.append(bubble);
    bubble.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return bubble;
  };

  const ask = async (question) => {
    add('user', esc(question));
    if (CRISIS.test(question)) {
      add('bot', `<p>Terima kasih sudah bercerita. Kamu tidak sendirian. Jika kamu sedang dalam bahaya atau berpikir menyakiti diri, segera hubungi:</p>
        <ul>${CONFIG.helpLines.map((h) => `<li><strong>${esc(h.contact)}</strong> ${esc(h.name)}</li>`).join('')}</ul>
        <p>Berbicaralah juga dengan orang yang kamu percaya atau pemuka agamamu.</p>`);
      return;
    }
    if (COMPARE.test(question)) {
      add('bot', '<p>Jeda tidak membandingkan atau menilai kebenaran agama. Setiap iman dihormati dan dijelaskan menurut ajarannya sendiri. Kamu bisa membaca Pustaka tiap agama atau etiket lintas iman.</p><p><a href="#/pustaka">Buka Pustaka</a></p>');
      return;
    }
    const results = search(getIndex(content), question, { faith: select.value || null, limit: 5 });
    if (results.length === 0 || results[0].score < MIN_SCORE) {
      add('bot', `<p>Belum ada sumber di Pustaka Jeda yang menjawab pertanyaan ini, jadi Jeda tidak akan menebak.</p>
        <p>Silakan tanyakan kepada pemuka agama atau pengurus rumah ibadah terdekat: <a href="#/ibadah">Rumah Ibadah</a>.
        Kamu juga bisa <a href="${CONFIG.issueUrl('usulan.yml', `[Usulan entri] ${question.slice(0, 80)}`)}" target="_blank" rel="noopener">mengusulkan entri baru</a>.</p>`);
      return;
    }
    if (CONFIG.tanyaEndpoint) {
      const pending = add('bot', '<p class="muted">Merangkum dari Pustaka…</p>');
      try {
        pending.innerHTML = await aiAnswer(question, results, userPrefs);
        return;
      } catch (error) {
        console.warn(error);
        pending.remove();
      }
    }
    add('bot', extractiveAnswer(results));
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = form.querySelector('input');
    const question = input.value.trim();
    if (question) {
      input.value = '';
      ask(question);
    }
  });
  main.querySelectorAll('[data-q]').forEach((chip) => chip.addEventListener('click', () => ask(chip.dataset.q)));
  const initial = query.get('q');
  if (initial) {
    ask(initial);
  }
  if (!faithById(content, userPrefs.faith)?.pustaka) {
    select.value = '';
  }
}
