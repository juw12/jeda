// Pure functions for the review + permission pipeline (used by scripts/issue-bot.mjs in GitHub Actions
// and by the in-app Tinjau page). No Node-specific imports so it can also be tested in a browser.

export const FAITH_LABELS = {
  Islam: 'islam',
  'Kristen Protestan': 'protestan',
  Katolik: 'katolik',
  Hindu: 'hindu',
  Buddha: 'buddha',
  'Khonghucu & tradisi Tionghoa': 'khonghucu',
  'Lintas iman': 'lintas',
};

export const PERMISSION_STATUSES = ['belum-diminta', 'diminta', 'diizinkan', 'ditolak', 'domain-publik'];
export const OPEN_STATUSES = new Set(['diizinkan', 'domain-publik']);

const NO_RESPONSE = new Set(['', '_No response_', 'None']);

// GitHub issue forms render as "### Label\n\nvalue" blocks.
export function parseIssueForm(body = '') {
  const fields = {};
  const parts = String(body).replace(/\r\n/g, '\n').split(/^### /m).slice(1);
  for (const part of parts) {
    const newline = part.indexOf('\n');
    const label = (newline === -1 ? part : part.slice(0, newline)).trim();
    const value = (newline === -1 ? '' : part.slice(newline + 1)).trim();
    fields[label] = NO_RESPONSE.has(value) ? '' : value;
  }
  return fields;
}

export function fieldStartingWith(fields, prefix) {
  const key = Object.keys(fields).find((label) => label.toLowerCase().startsWith(prefix.toLowerCase()));
  return key ? fields[key] : '';
}

export function extractJsonBlock(body = '') {
  const match = /```json\s*([\s\S]*?)```/.exec(String(body));
  if (!match) {
    return null;
  }
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

// Build a reviewer record from a "Daftar sebagai reviewer" issue that a maintainer labelled as verified.
export function reviewerFromIssue(issue, date) {
  const fields = parseIssueForm(issue.body);
  const name = fieldStartingWith(fields, 'Nama');
  const faithText = fieldStartingWith(fields, 'Agama yang ditinjau');
  const faiths = faithText
    .split(',')
    .map((label) => FAITH_LABELS[label.trim()])
    .filter(Boolean);
  if (!name) {
    return { error: 'Nama reviewer kosong.' };
  }
  if (faiths.length === 0) {
    return { error: 'Pilih minimal satu agama yang ditinjau.' };
  }
  return {
    reviewer: {
      id: `${slugify(name)}-${issue.number}`,
      name,
      tradition: fieldStartingWith(fields, 'Aliran / tradisi'),
      role: fieldStartingWith(fields, 'Peran & lembaga').split('\n')[0].slice(0, 160),
      faiths,
      github: issue.user && issue.user.login ? issue.user.login : '',
      verified_at: date,
      issue: issue.number,
    },
  };
}

export function addReviewer(reviewers, record) {
  const existing = reviewers.findIndex((r) => r.id === record.id || (record.github && r.github && r.github.toLowerCase() === record.github.toLowerCase() && r.name === record.name));
  const next = [...reviewers];
  if (existing >= 0) {
    next[existing] = { ...next[existing], ...record };
  } else {
    next.push(record);
  }
  return next;
}

// Apply a review submission. `entries` is a flat array of all entries (mutated copies are returned).
// Rules: the reviewer must be registered; each entry's faith must be in the reviewer's faiths;
// the reviewed version must equal the current version. `trusted` = submitted by the reviewer's own
// GitHub account or approved by a maintainer label.
export function applyReview({ entries, reviewers, submission, trusted, date }) {
  const log = [];
  const changedFaiths = new Set();
  if (!submission || submission.app !== 'jeda-review' || !Array.isArray(submission.items)) {
    return { ok: false, log: ['Blok JSON tinjauan tidak ditemukan atau tidak valid.'], changedFaiths, entries };
  }
  const reviewer = reviewers.find((r) => r.id === submission.reviewerId);
  if (!reviewer) {
    return { ok: false, log: [`Reviewer "${submission.reviewerId || submission.reviewer}" belum terdaftar/terverifikasi.`], changedFaiths, entries };
  }
  if (!trusted) {
    return { ok: false, pending: true, log: ['Menunggu konfirmasi pengelola (label `tinjauan:terapkan`), karena tidak dikirim dari akun GitHub reviewer.'], changedFaiths, entries };
  }
  const byId = new Map(entries.map((e) => [e.id, e]));
  for (const item of submission.items) {
    const entry = byId.get(item.id);
    if (!entry) {
      log.push(`- \`${item.id}\`: dilewati, entri tidak ditemukan.`);
      continue;
    }
    if (!reviewer.faiths.includes(entry.faith)) {
      log.push(`- \`${item.id}\`: dilewati, ${reviewer.name} tidak terdaftar untuk ${entry.faith}.`);
      continue;
    }
    if (Number(item.version) !== Number(entry.version)) {
      log.push(`- \`${item.id}\`: dilewati, ditinjau pada versi ${item.version} tetapi kini versi ${entry.version}.`);
      continue;
    }
    entry.review_notes = entry.review_notes || [];
    entry.review_notes.push({
      by: reviewer.name,
      reviewer_id: reviewer.id,
      date,
      decision: item.decision === 'approve' ? 'approve' : 'revise',
      note: String(item.note || '').slice(0, 2000),
    });
    if (item.decision === 'approve') {
      entry.status = 'approved';
      entry.reviewed_by = reviewer.role ? `${reviewer.name} (${reviewer.role})` : reviewer.name;
      entry.reviewer_id = reviewer.id;
      entry.reviewed_at = date;
      log.push(`- \`${item.id}\`: **disetujui**.`);
    } else {
      entry.status = 'in_review';
      log.push(`- \`${item.id}\`: perlu perbaikan, catatan disimpan.`);
    }
    entry.updated = date;
    changedFaiths.add(entry.faith);
  }
  return { ok: changedFaiths.size > 0, log, changedFaiths, entries };
}

// Permission grant from the "Beri izin konten" issue form, accepted by a maintainer label.
export function applyPermission({ permissions, issue, date, repoUrl }) {
  const fields = parseIssueForm(issue.body);
  const resourceText = fieldStartingWith(fields, 'Konten');
  const id = (/\[([a-z0-9-]+)\]/.exec(resourceText) || [])[1];
  const resource = permissions.find((p) => p.id === id);
  if (!resource) {
    return { ok: false, log: [`Konten "${resourceText}" tidak dikenali di permissions.json.`], permissions };
  }
  const updated = {
    ...resource,
    status: 'diizinkan',
    granted_by: fieldStartingWith(fields, 'Nama & jabatan pemberi izin'),
    institution: fieldStartingWith(fields, 'Lembaga'),
    scope: fieldStartingWith(fields, 'Cakupan izin'),
    license: fieldStartingWith(fields, 'Jenis izin'),
    evidence: `${repoUrl}/issues/${issue.number}`,
    updated: date,
  };
  return {
    ok: true,
    log: [`Izin untuk **${resource.name}** dicatat sebagai *diizinkan* oleh ${updated.granted_by || 'pemberi izin'} (${updated.institution || '-'}).`],
    permissions: permissions.map((p) => (p.id === id ? updated : p)),
  };
}

export function permissionFor(permissions, scriptureId) {
  return permissions.find((p) => (p.applies_to || []).includes(scriptureId)) || null;
}

// Build GitHub "new issue" URLs for a review, split so each URL stays under the length limit.
export function reviewIssueUrls({ repo, reviewer, items, date, faithLabel }, maxLength = 7000) {
  const batches = [];
  let current = [];
  const build = (batch, index, total) => {
    const payload = {
      app: 'jeda-review',
      reviewerId: reviewer.id,
      reviewer: reviewer.name,
      date,
      items: batch,
    };
    const lines = batch.map((item) => `| \`${item.id}\` | ${item.decision === 'approve' ? 'Setujui' : 'Perlu perbaikan'} | ${String(item.note || '').replace(/\n/g, ' ').replace(/\|/g, '/')} |`);
    const body = [
      `Tinjauan oleh **${reviewer.name}** untuk ${faithLabel}.`,
      '',
      '| Entri | Keputusan | Catatan |',
      '|---|---|---|',
      ...lines,
      '',
      '<!-- Jangan ubah blok di bawah; dipakai bot Jeda untuk menerapkan tinjauan. -->',
      '```json',
      JSON.stringify(payload),
      '```',
    ].join('\n');
    const suffix = total > 1 ? ` (bagian ${index + 1}/${total})` : '';
    const title = `[Tinjauan] ${faithLabel}: ${reviewer.name}, ${batch.length} entri${suffix}`;
    return `https://github.com/${repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  };
  for (const item of items) {
    const trial = [...current, item];
    if (current.length && build(trial, 0, 2).length > maxLength) {
      batches.push(current);
      current = [item];
    } else {
      current = trial;
    }
  }
  if (current.length) {
    batches.push(current);
  }
  return batches.map((batch, index) => build(batch, index, batches.length));
}
