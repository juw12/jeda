// Lightweight full-text search over Pustaka entries (used by search page and Tanya Jeda).

const STOPWORDS = new Set(`
  yang dan di ke dari untuk apa apakah bagaimana gimana cara itu ini dengan adalah saya aku kamu
  kah lah pun atau juga ada tidak bisa harus boleh akan sudah belum dalam pada oleh sebagai karena
  kalau jika agar supaya seperti tentang the a an of to in is how what why mau ingin tolong jelaskan
  apa saja berapa kapan dimana siapa sih dong ya nya kita kami mereka
`.split(/\s+/).filter(Boolean));

export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function tokenize(text) {
  return normalize(text)
    .split(/[^a-z0-9\u3400-\u9fff]+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function entryText(entry) {
  const steps = (entry.steps || []).map((step) => `${step.text} ${step.why || ''}`).join(' ');
  const variations = (entry.variations || []).map((v) => `${v.label} ${v.text}`).join(' ');
  return {
    title: entry.title,
    tags: (entry.tags || []).join(' '),
    summary: entry.summary,
    body: `${(entry.body || []).join(' ')} ${steps} ${(entry.items || []).join(' ')} ${variations}`,
  };
}

const WEIGHTS = { title: 4, tags: 3, summary: 2, body: 1 };

export function buildIndex(entries) {
  const documents = entries.map((entry) => {
    const fields = entryText(entry);
    const termCounts = new Map();
    let length = 0;
    for (const [field, text] of Object.entries(fields)) {
      for (const token of tokenize(text)) {
        termCounts.set(token, (termCounts.get(token) || 0) + WEIGHTS[field]);
        length += 1;
      }
    }
    return { entry, termCounts, length };
  });
  const documentFrequency = new Map();
  documents.forEach((doc) => {
    doc.termCounts.forEach((_, term) => {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    });
  });
  const averageLength = documents.reduce((sum, doc) => sum + doc.length, 0) / Math.max(1, documents.length);
  return { documents, documentFrequency, averageLength, total: documents.length };
}

// BM25-style ranking with prefix matching for partial words.
export function search(index, query, { faith = null, limit = 10 } = {}) {
  const terms = tokenize(query);
  if (terms.length === 0) {
    return [];
  }
  const k1 = 1.2;
  const b = 0.75;
  const results = [];
  for (const doc of index.documents) {
    if (faith && doc.entry.faith !== faith) {
      continue;
    }
    let score = 0;
    let matched = 0;
    for (const term of terms) {
      let frequency = doc.termCounts.get(term) || 0;
      let df = index.documentFrequency.get(term) || 0;
      if (!frequency && term.length >= 4) {
        for (const [docTerm, count] of doc.termCounts) {
          if (docTerm.startsWith(term) || term.startsWith(docTerm)) {
            frequency += count * 0.6;
            df = Math.max(df, index.documentFrequency.get(docTerm) || 1);
          }
        }
      }
      if (!frequency) {
        continue;
      }
      matched += 1;
      const idf = Math.log(1 + (index.total - df + 0.5) / (df + 0.5));
      score += idf * ((frequency * (k1 + 1)) / (frequency + k1 * (1 - b + b * (doc.length / index.averageLength))));
    }
    if (score > 0) {
      results.push({ entry: doc.entry, score: score * (matched / terms.length) });
    }
  }
  return results.sort((a, b2) => b2.score - a.score).slice(0, limit);
}
