// Content validation (runs in GitHub Actions on every push / pull request).
// Fails if an entry lacks required fields, uses unknown faiths/sections, or has duplicate ids.

import { readFileSync, readdirSync } from 'node:fs';
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

console.log(`Entri: ${total}, approved: ${approved}, draf/in_review: ${total - approved}`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Konten valid.');
