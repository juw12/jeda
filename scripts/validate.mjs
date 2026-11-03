// Content validation (runs in GitHub Actions on every push / pull request).
// Fails if an entry lacks required fields, uses unknown faiths/sections, or has duplicate ids.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../content/', import.meta.url));
const meta = JSON.parse(readFileSync(join(root, 'faiths.json'), 'utf8'));
const faithIds = new Set([...meta.faiths.map((f) => f.id), 'lintas']);
const sectionIds = new Set(meta.sections.map((s) => s.id));
const statuses = new Set(['draft', 'in_review', 'approved']);
const errors = [];
const ids = new Set();
let approved = 0;
let total = 0;

for (const file of readdirSync(join(root, 'entries'))) {
  const entries = JSON.parse(readFileSync(join(root, 'entries', file), 'utf8'));
  for (const entry of entries) {
    total += 1;
    const where = `${file} → ${entry.id || '(tanpa id)'}`;
    for (const field of ['id', 'faith', 'section', 'title', 'summary', 'status', 'version', 'updated']) {
      if (entry[field] === undefined || entry[field] === null || entry[field] === '') {
        errors.push(`${where}: field "${field}" wajib diisi`);
      }
    }
    if (ids.has(entry.id)) {
      errors.push(`${where}: id ganda`);
    }
    ids.add(entry.id);
    if (!faithIds.has(entry.faith)) {
      errors.push(`${where}: faith tidak dikenal "${entry.faith}"`);
    }
    if (!sectionIds.has(entry.section)) {
      errors.push(`${where}: section tidak dikenal "${entry.section}"`);
    }
    if (!statuses.has(entry.status)) {
      errors.push(`${where}: status tidak valid "${entry.status}"`);
    }
    if (!Array.isArray(entry.sources) || entry.sources.length === 0) {
      errors.push(`${where}: minimal satu sumber`);
    }
    if (entry.status === 'approved') {
      approved += 1;
      if (!entry.reviewed_by || !entry.reviewed_at) {
        errors.push(`${where}: entri approved wajib punya reviewed_by dan reviewed_at`);
      }
    }
  }
}

const places = JSON.parse(readFileSync(join(root, 'places.json'), 'utf8'));
for (const place of places) {
  if (place.donation && !place.verified) {
    errors.push(`places.json → ${place.id}: info donasi hanya boleh untuk tempat terverifikasi`);
  }
}

// Variation streams must be a known stream or dialect id (or null).
const streamIds = new Set(meta.faiths.flatMap((f) => [...(f.streams || []), ...(f.dialects || [])].map((s) => s.id)));
for (const file of readdirSync(join(root, 'entries'))) {
  for (const entry of JSON.parse(readFileSync(join(root, 'entries', file), 'utf8'))) {
    for (const variation of entry.variations || []) {
      if (variation.stream && !streamIds.has(variation.stream)) {
        errors.push(`${file} → ${entry.id}: variasi memakai stream/dialek tidak dikenal "${variation.stream}"`);
      }
    }
  }
}

// Glossary terms that point to an entry must point to an existing one.
const glossary = JSON.parse(readFileSync(join(root, 'glossary.json'), 'utf8'));
const terms = new Set();
for (const item of glossary) {
  if (item.entry && !ids.has(item.entry)) {
    errors.push(`glossary.json → ${item.term}: entri "${item.entry}" tidak ada`);
  }
  if (terms.has(item.term.toLowerCase())) {
    errors.push(`glossary.json → ${item.term}: istilah ganda`);
  }
  terms.add(item.term.toLowerCase());
}

// Calendar overrides need a valid ISO date, id, name and faith.
const calendar = JSON.parse(readFileSync(join(root, 'calendar.json'), 'utf8'));
for (const override of calendar.overrides) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(override.date) || Number.isNaN(Date.parse(override.date))) {
    errors.push(`calendar.json → ${override.id}: tanggal tidak valid "${override.date}"`);
  }
  if (!override.id || !override.name || !override.faith) {
    errors.push(`calendar.json → ${override.date}: id, name, dan faith wajib diisi`);
  }
}

// Library links inside app code (memorial traditions) must exist.
const appRoot = fileURLToPath(new URL('../', import.meta.url));
const memorialSource = readFileSync(join(appRoot, 'js', 'memorial.js'), 'utf8');
for (const match of memorialSource.matchAll(/entry: '([\w-]+)'/g)) {
  if (!ids.has(match[1])) {
    errors.push(`js/memorial.js: entri "${match[1]}" tidak ada`);
  }
}

// Offline: every JS module and content file must be precached by the service worker.
const sw = readFileSync(join(appRoot, 'sw.js'), 'utf8');
function walk(dir, prefix) {
  return readdirSync(join(appRoot, dir)).flatMap((name) => {
    const rel = `${dir}/${name}`;
    return statSync(join(appRoot, rel)).isDirectory() ? walk(rel, prefix) : [rel];
  });
}
for (const rel of [...walk('js'), ...walk('content')]) {
  if ((rel.endsWith('.js') || rel.endsWith('.json')) && !sw.includes(`'${rel}'`)) {
    errors.push(`sw.js: berkas "${rel}" belum masuk daftar SHELL (tidak tersedia offline)`);
  }
}

console.log(`Entri: ${total}, approved: ${approved}, draf/in_review: ${total - approved}`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Konten valid.');
