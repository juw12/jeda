// Pustaka (living library): faiths, sections, entries, search, scripture info.

import { CONFIG } from '../config.js';
import { prefs, load, save } from '../store.js';
import { esc, draftBanner, toast } from '../ui.js';
import { faithById, entryById, entriesFor, appliesToStreams } from '../content.js';
import { buildIndex, search } from '../search.js';
import { speakButton, stopSpeaking } from '../speak.js';

let searchIndex = null;

export function getIndex(content) {
  if (!searchIndex) {
    searchIndex = buildIndex(content.entries);
  }
  return searchIndex;
}

function faithLabel(content, id) {
  if (id === 'lintas') {
    return 'Lintas Iman';
  }
  return faithById(content, id)?.short || id;
}

function entryCard(content, entry, streams) {
  const fits = appliesToStreams(entry, streams);
  return `
    <a class="entry-card" href="#/entri/${encodeURIComponent(entry.id)}">
      <strong>${esc(entry.title)}</strong>
      <span class="small muted">${esc(entry.summary)}</span>
      <span class="entry-meta small">
        ${entry.status !== 'approved' ? '<span class="badge">draf</span>' : '<span class="badge badge-ok">ditinjau</span>'}
        ${!fits ? '<span class="badge badge-dim">aliran lain</span>' : ''}
        <span class="muted">${esc(faithLabel(content, entry.faith))}</span>
      </span>
    </a>`;
}

function searchBox(value = '') {
  return `
    <form class="search-form" role="search" action="#/cari">
      <input type="search" name="q" value="${esc(value)}" placeholder="Cari ajaran, ritual, upacara… (mis. Ceng Beng, wudu, rosario)" aria-label="Cari di Pustaka">
      <button class="btn" type="submit">Cari</button>
    </form>`;
}

function wireSearch(main, navigate) {
  const form = main.querySelector('.search-form');
  if (!form) {
    return;
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const q = new FormData(form).get('q');
    navigate(`#/cari?q=${encodeURIComponent(q)}`);
  });
}

export function pustaka(main, [faithId, sectionId], query, ctx) {
  const { content, navigate } = ctx;
  if (!faithId) {
    return pustakaHome(main, ctx);
  }
  if (faithId === 'lintas') {
    return lintas(main, ctx);
  }
  const faith = faithById(content, faithId);
  if (!faith || !faith.pustaka) {
    navigate('#/pustaka');
    return undefined;
  }
  const userPrefs = prefs.get();
  const streams = userPrefs.faith === faith.id ? userPrefs.streams : [];

  if (!sectionId) {
    const scriptures = content.scriptures.filter((s) => s.faith === faith.id);
    main.innerHTML = `
      <section class="stack">
        <p class="crumbs"><a href="#/pustaka">Pustaka</a> / ${esc(faith.name)}</p>
        <h1 class="h2">${esc(faith.name)}</h1>
        ${streams.length ? `<p class="small muted">Disesuaikan untuk: ${esc(faith.streams.filter((s) => streams.includes(s.id)).map((s) => s.name).join(', '))}. Entri aliran lain tetap ditampilkan dengan tanda.</p>` : ''}
        ${searchBox()}
        <div class="section-grid">
          ${content.sections.map((section) => {
    const count = entriesFor(content, faith.id, section.id).length;
    return `<a class="section-card" href="#/pustaka/${faith.id}/${section.id}">
              <span class="section-icon" aria-hidden="true">${section.icon}</span>
              <strong>${esc(section.name)}</strong>
              <span class="small muted">${esc(section.desc)}</span>
              <span class="small">${count} entri</span>
            </a>`;
  }).join('')}
        </div>
        ${scriptures.length ? `
          <h2 class="h3">Kitab suci</h2>
          <div class="list">${scriptures.map((s) => `<a class="entry-card" href="#/kitab/${s.id}"><strong>${esc(s.name)}</strong><span class="small muted">${esc(s.summary)}</span></a>`).join('')}</div>` : ''}
        <p class="small"><a href="#/ruang/${faith.id}">Masuk ke ${esc(faith.spaceName)}</a> · <a href="#/upacara?iman=${faith.id}">Panduan upacara</a></p>
      </section>`;
    wireSearch(main, navigate);
    return undefined;
  }

  const section = content.sections.find((s) => s.id === sectionId);
  const entries = entriesFor(content, faith.id, sectionId)
    .sort((a, b) => Number(appliesToStreams(b, streams)) - Number(appliesToStreams(a, streams)));
  main.innerHTML = `
    <section class="stack">
      <p class="crumbs"><a href="#/pustaka">Pustaka</a> / <a href="#/pustaka/${faith.id}">${esc(faith.short)}</a> / ${esc(section?.name || sectionId)}</p>
      <h1 class="h2">${esc(section?.name || sectionId)}</h1>
      <p class="muted">${esc(section?.desc || '')}</p>
      <div class="list">
        ${entries.length ? entries.map((e) => entryCard(content, e, streams)).join('') : '<p class="muted">Belum ada entri. Ingin membantu menulis atau meninjau? Lihat halaman Tentang.</p>'}
      </div>
    </section>`;
  return undefined;
}

function pustakaHome(main, { content, navigate }) {
  const mine = prefs.get().faith;
  const faiths = content.faiths.filter((f) => f.pustaka);
  main.innerHTML = `
    <section class="stack">
      <h1 class="h2">Pustaka</h1>
      <p class="muted">Panduan ajaran, kitab suci, ibadah harian, hari raya, siklus hidup, aturan, dan perbedaan aliran untuk setiap iman. Setiap entri mencantumkan sumber dan status tinjauan.</p>
      ${searchBox()}
      <div class="faith-grid">
        ${faiths.map((f) => `
          <a class="faith-card ${f.id === mine ? 'selected' : ''}" href="#/pustaka/${f.id}" style="--accent:${f.color}">
            <span class="faith-icon" aria-hidden="true">${f.icon}</span>
            <strong>${esc(f.name)}</strong>
            <span class="small muted">${entriesFor(content, f.id).length} entri</span>
          </a>`).join('')}
        <a class="faith-card" href="#/kamus" style="--accent:#c9a15a">
          <span class="faith-icon" aria-hidden="true">📖</span>
          <strong>Kamus Istilah</strong>
          <span class="small muted">${content.glossary.length} istilah</span>
        </a>
        <a class="faith-card" href="#/pustaka/lintas" style="--accent:#8aa">
          <span class="faith-icon" aria-hidden="true">🤝</span>
          <strong>Etiket Lintas Iman</strong>
          <span class="small muted">${entriesFor(content, 'lintas').length} entri</span>
        </a>
      </div>
    </section>`;
  wireSearch(main, navigate);
}

function lintas(main, { content }) {
  const entries = entriesFor(content, 'lintas');
  main.innerHTML = `
    <section class="stack">
      <p class="crumbs"><a href="#/pustaka">Pustaka</a> / Etiket Lintas Iman</p>
      <h1 class="h2">Etiket Lintas Iman</h1>
      <p class="muted">Cara hormat menghadiri pernikahan, duka, hari raya, dan mengunjungi rumah ibadah teman yang berbeda iman.</p>
      <div class="list">${entries.map((e) => entryCard(content, e, [])).join('')}</div>
    </section>`;
}

export function entry(main, [entryId], query, { content, navigate }) {
  // Reviewers open drafts via ?tinjau=1 even when drafts are hidden from the public.
  const item = entryById(content, entryId)
    || (query.get('tinjau') ? content.rawEntries.find((e) => e.id === entryId) : null);
  if (!item) {
    main.innerHTML = '<section class="stack"><p>Entri tidak ditemukan atau belum ditinjau.</p><a href="#/pustaka">Kembali ke Pustaka</a></section>';
    return;
  }
  const faith = faithById(content, item.faith);
  const section = content.sections.find((s) => s.id === item.section);
  const userPrefs = prefs.get();
  const streams = userPrefs.faith === item.faith ? userPrefs.streams : [];
  const dialect = userPrefs.faith === item.faith ? userPrefs.dialect : null;
  const bookmarks = load('bookmarks', []);
  const isBookmarked = bookmarks.includes(item.id);
  const streamName = (id) => faith?.streams?.find((s) => s.id === id)?.name
    || faith?.dialects?.find((d) => d.id === id)?.name
    || id;
  const correctionUrl = CONFIG.issueUrl('koreksi.yml', `[Koreksi] ${item.id}: ${item.title}`);

  main.innerHTML = `
    <article class="stack narrow prose entry">
      <p class="crumbs">
        <a href="#/pustaka">Pustaka</a> /
        ${faith ? `<a href="#/pustaka/${faith.id}">${esc(faith.short)}</a>` : '<a href="#/pustaka/lintas">Lintas Iman</a>'}
        ${section ? ` / <a href="#/pustaka/${item.faith}/${section.id}">${esc(section.name)}</a>` : ''}
      </p>
      <h1 class="h2">${esc(item.title)}</h1>
      ${draftBanner(item)}
      ${!appliesToStreams(item, streams) ? `<p class="notice small">Entri ini terutama berlaku untuk: ${esc(item.streams.map(streamName).join(', '))}.</p>` : ''}
      <p class="lead">${esc(item.summary)}</p>
      ${(item.body || []).map((p) => `<p>${esc(p)}</p>`).join('')}
      ${item.timing ? `<p><strong>Waktu:</strong> ${esc(item.timing)}</p>` : ''}

      ${item.items && item.items.length ? `
        <h2 class="h3">Perlengkapan</h2>
        <ul class="checklist">${item.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}

      ${item.steps && item.steps.length ? `
        <h2 class="h3">Langkah-langkah</h2>
        <ol class="steps">${item.steps.map((s) => `<li><span>${esc(s.text)}</span>${s.why ? `<span class="why"><strong>Mengapa:</strong> ${esc(s.why)}</span>` : ''}</li>`).join('')}</ol>` : ''}

      ${item.variations && item.variations.length ? `
        <h2 class="h3">Perbedaan & variasi</h2>
        <div class="variations">${item.variations.map((v) => `
          <div class="variation ${(v.stream && (streams.includes(v.stream) || v.stream === dialect)) ? 'mine' : ''}">
            <strong>${esc(v.label)}</strong>
            <p>${esc(v.text)}</p>
            ${v.source ? `<p class="small muted">Sumber: ${esc(v.source)}</p>` : ''}
          </div>`).join('')}</div>` : ''}

      ${item.links && item.links.length ? `
        <h2 class="h3">Tautan resmi</h2>
        <ul>${item.links.map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.name)}</a>${l.note ? ` <span class="small muted">${esc(l.note)}</span>` : ''}</li>`).join('')}</ul>` : ''}

      <h2 class="h3">Sumber</h2>
      <ul class="sources">${(item.sources || []).map((s) => `<li>${esc(s.title)}${s.detail ? `, ${esc(s.detail)}` : ''}${s.url ? ` <a href="${esc(s.url)}" target="_blank" rel="noopener">tautan</a>` : ''}</li>`).join('')}</ul>

      <p class="meta small muted">
        Status: ${esc(item.status)} · Versi ${esc(item.version)} · Diperbarui ${esc(item.updated)}
        ${item.reviewed_by ? ` · Ditinjau oleh ${esc(item.reviewed_by)} (${esc(item.reviewed_at)})` : ' · Belum ditinjau'}
      </p>
      <div class="row">
        <button class="btn-ghost" data-act="bookmark">${isBookmarked ? 'Hapus penanda' : 'Tandai'}</button>
        <button class="btn-ghost" data-act="share">Bagikan</button>
        <a class="btn-ghost" href="#/tanya?q=${encodeURIComponent(item.title)}">Tanya tentang ini</a>
        <a class="btn-ghost" href="${correctionUrl}" target="_blank" rel="noopener">Laporkan koreksi</a>
      </div>
    </article>`;

  speakButton(main.querySelector('.entry .row:last-of-type'), () => [
    item.title,
    item.summary,
    ...(item.body || []),
    ...(item.steps || []).map((s, i) => `Langkah ${i + 1}. ${s.text}${s.why ? `. Mengapa: ${s.why}` : ''}`),
  ].join('. '));
  main.querySelector('[data-act="bookmark"]').addEventListener('click', (event) => {
    const list = load('bookmarks', []);
    const index = list.indexOf(item.id);
    if (index >= 0) {
      list.splice(index, 1);
      event.target.textContent = 'Tandai';
    } else {
      list.unshift(item.id);
      event.target.textContent = 'Hapus penanda';
    }
    save('bookmarks', list);
  });
  main.querySelector('[data-act="share"]').addEventListener('click', async () => {
    const url = location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text: item.summary, url });
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast('Tautan disalin.');
    }
  });
  return () => stopSpeaking();
}

const FAITH_LABELS = { kristen: 'Kristen', lintas: 'Lintas iman' };

function glossaryLabel(content, faithId) {
  return FAITH_LABELS[faithId] || faithById(content, faithId)?.short || faithId;
}

function glossaryMatches(content, q) {
  const needle = q.toLowerCase();
  return content.glossary.filter((g) => g.term.toLowerCase().includes(needle) || g.definition.toLowerCase().includes(needle));
}

export function kamus(main, params, query, { content }) {
  const render = (text = '') => {
    const list = text ? glossaryMatches(content, text) : content.glossary;
    const groups = new Map();
    list.forEach((g) => {
      const letter = g.term[0].toUpperCase();
      if (!groups.has(letter)) {
        groups.set(letter, []);
      }
      groups.get(letter).push(g);
    });
    main.querySelector('.glossary').innerHTML = [...groups.entries()].map(([letter, terms]) => `
      <h2 class="h3 glossary-letter">${letter}</h2>
      <dl class="glossary-list">
        ${terms.map((g) => `<div class="glossary-item">
            <dt>${esc(g.term)} <span class="badge badge-dim">${esc(glossaryLabel(content, g.faith))}</span></dt>
            <dd>${esc(g.definition)} ${g.entry ? `<a class="small" href="#/entri/${encodeURIComponent(g.entry)}">Baca</a>` : ''}</dd>
          </div>`).join('')}
      </dl>`).join('') || '<p class="muted">Tidak ada istilah yang cocok.</p>';
  };
  main.innerHTML = `
    <section class="stack narrow">
      <p class="crumbs"><a href="#/pustaka">Pustaka</a> / Kamus Istilah</p>
      <h1 class="h2">Kamus Istilah</h1>
      <p class="muted">Arti singkat istilah dari setiap agama, agar mudah memahami iman sendiri dan iman sesama. ${content.glossary.length} istilah.</p>
      <input type="search" class="filter" placeholder="Cari istilah… (mis. hio, wudu, sidi, odalan)" aria-label="Cari istilah" value="${esc(query.get('q') || '')}">
      <div class="glossary"></div>
    </section>`;
  main.querySelector('.filter').addEventListener('input', (event) => render(event.target.value.trim()));
  render(query.get('q') || '');
}

export function searchView(main, params, query, { content, navigate }) {
  const q = query.get('q') || '';
  const results = q ? search(getIndex(content), q, { limit: 30 }) : [];
  const terms = q ? glossaryMatches(content, q).slice(0, 6) : [];
  const needle = q.toLowerCase();
  const guides = q ? content.ceremonies.filter((c) => `${c.title} ${c.summary}`.toLowerCase().includes(needle)).slice(0, 5) : [];
  const bookmarks = load('bookmarks', []).map((id) => entryById(content, id)).filter(Boolean);
  main.innerHTML = `
    <section class="stack">
      <h1 class="h2">Cari di Pustaka</h1>
      ${searchBox(q)}
      ${terms.length ? `<h2 class="h3">Kamus</h2><dl class="glossary-list">${terms.map((g) => `<div class="glossary-item"><dt>${esc(g.term)}</dt><dd>${esc(g.definition)}</dd></div>`).join('')}</dl>` : ''}
      ${guides.length ? `<h2 class="h3">Panduan Upacara</h2><div class="list">${guides.map((c) => `<a class="entry-card" href="#/upacara/${c.id}"><strong>${esc(c.title)}</strong><span class="small muted">${esc(c.summary)}</span></a>`).join('')}</div>` : ''}
      ${q ? `<h2 class="h3">Pustaka</h2><p class="muted">${results.length} hasil untuk "${esc(q)}"</p>
        <div class="list">${results.map((r) => entryCard(content, r.entry, [])).join('')}</div>` : ''}
      ${!q && bookmarks.length ? `<h2 class="h3">Penandamu</h2><div class="list">${bookmarks.map((e) => entryCard(content, e, [])).join('')}</div>` : ''}
    </section>`;
  wireSearch(main, navigate);
}

export async function scripture(main, [scriptureId], query, { content }) {
  const item = content.scriptures.find((s) => s.id === scriptureId);
  if (!item) {
    main.innerHTML = '<section class="stack"><p>Kitab tidak ditemukan.</p></section>';
    return;
  }
  const faith = faithById(content, item.faith);
  main.innerHTML = `
    <article class="stack narrow prose">
      <p class="crumbs"><a href="#/pustaka">Pustaka</a> / <a href="#/pustaka/${faith.id}">${esc(faith.short)}</a> / Kitab Suci</p>
      <h1 class="h2">${esc(item.name)}</h1>
      <p class="lead">${esc(item.summary)}</p>
      ${(item.structure || []).length ? `<h2 class="h3">Struktur</h2><ul>${item.structure.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
      <h2 class="h3">Baca</h2>
      <div class="notice small">
        ${item.inApp
    ? 'Teks tersedia di dalam aplikasi.'
    : `Pembaca di dalam aplikasi akan aktif setelah izin terjemahan diperoleh. ${esc(item.licenseNote || '')}`}
      </div>
      <ul>${(item.links || []).map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.name)}</a>${l.note ? ` <span class="small muted">${esc(l.note)}</span>` : ''}</li>`).join('')}</ul>
      <div class="reader"></div>
    </article>`;
  if (item.inApp && item.dataFile) {
    try {
      const response = await fetch(item.dataFile);
      const data = await response.json();
      main.querySelector('.reader').innerHTML = data.books.map((book) => `
        <details><summary>${esc(book.name)}</summary>
          ${book.chapters.map((chapter) => `<h3 class="h4">${esc(book.name)} ${chapter.n}</h3>
            <p>${chapter.verses.map((v) => `<sup>${v.n}</sup> ${esc(v.text)}`).join(' ')}</p>`).join('')}
        </details>`).join('');
    } catch {
      main.querySelector('.reader').innerHTML = '<p class="muted">Gagal memuat teks.</p>';
    }
  }
}
