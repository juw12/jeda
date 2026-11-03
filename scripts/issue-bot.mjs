// GitHub Actions issue bot for Jeda: applies reviews, registers verified reviewers, records permissions.
// Reads the event from GITHUB_EVENT_PATH, edits content files, and writes bot-result.json for the workflow.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractJsonBlock,
  applyReview,
  reviewerFromIssue,
  addReviewer,
  applyPermission,
} from '../js/review-lib.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const repo = process.env.GITHUB_REPOSITORY || 'juw12/jeda';
const repoUrl = `https://github.com/${repo}`;
const owner = repo.split('/')[0].toLowerCase();
const issue = event.issue;
const action = event.action;
const label = event.label ? event.label.name : '';
const labels = (issue.labels || []).map((l) => (typeof l === 'string' ? l : l.name));
const date = new Date().toISOString().slice(0, 10);
const result = { changed: false, comment: '', close: false, commitMessage: '' };

const readJson = (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8'));
const writeJson = (rel, data) => writeFileSync(join(root, rel), JSON.stringify(data, null, 2) + '\n');

function handleReview() {
  const submission = extractJsonBlock(issue.body);
  const reviewers = readJson('content/reviewers.json');
  const reviewer = submission ? reviewers.find((r) => r.id === submission.reviewerId) : null;
  const author = (issue.user && issue.user.login ? issue.user.login : '').toLowerCase();
  const fromReviewerAccount = Boolean(reviewer && reviewer.github && reviewer.github.toLowerCase() === author);
  const maintainerApproved = labels.includes('tinjauan:terapkan') || author === owner;
  const files = readdirSync(join(root, 'content/entries')).filter((f) => f.endsWith('.json'));
  const entries = files.flatMap((file) => readJson(`content/entries/${file}`).map((e) => ({ ...e, __file: file })));
  const outcome = applyReview({ entries, reviewers, submission, trusted: fromReviewerAccount || maintainerApproved, date });
  if (outcome.ok) {
    for (const file of files) {
      const list = outcome.entries.filter((e) => e.__file === file).map(({ __file, ...rest }) => rest);
      writeJson(`content/entries/${file}`, list);
    }
    result.changed = true;
    result.close = true;
    result.commitMessage = `Tinjauan #${issue.number} oleh ${reviewer.name}`;
    result.comment = `Terima kasih, ${reviewer.name}! Tinjauan diterapkan:\n\n${outcome.log.join('\n')}\n\nPerubahan tampil di aplikasi dalam beberapa menit.`;
  } else {
    result.comment = `Tinjauan belum diterapkan.\n\n${outcome.log.join('\n')}`;
  }
}

function handleReviewerVerified() {
  const { reviewer, error } = reviewerFromIssue(issue, date);
  if (error) {
    result.comment = `Pendaftaran belum bisa diproses: ${error}`;
    return;
  }
  writeJson('content/reviewers.json', addReviewer(readJson('content/reviewers.json'), reviewer));
  result.changed = true;
  result.close = true;
  result.commitMessage = `Reviewer terverifikasi: ${reviewer.name} (#${issue.number})`;
  result.comment = `Selamat datang, ${reviewer.name}! Anda terdaftar sebagai reviewer untuk: ${reviewer.faiths.join(', ')} (ID: \`${reviewer.id}\`).\n\nBuka menu **Tinjau Pustaka** di aplikasi, pilih nama Anda, beri keputusan, lalu tekan **Kirim ke GitHub** dari akun ini.`;
}

function handlePermission() {
  const outcome = applyPermission({ permissions: readJson('content/permissions.json'), issue, date, repoUrl });
  if (outcome.ok) {
    writeJson('content/permissions.json', outcome.permissions);
    result.changed = true;
    result.close = true;
    result.commitMessage = `Izin konten dicatat (#${issue.number})`;
  }
  result.comment = outcome.log.join('\n');
}

const title = issue.title || '';
if (title.startsWith('[Tinjauan]') && (action === 'opened' || (action === 'labeled' && label === 'tinjauan:terapkan'))) {
  handleReview();
} else if (action === 'labeled' && label === 'reviewer:terverifikasi') {
  handleReviewerVerified();
} else if (action === 'labeled' && label === 'izin:diterima') {
  handlePermission();
}

writeFileSync(join(root, 'bot-result.json'), JSON.stringify(result));
console.log(JSON.stringify(result, null, 2));
