// Optional Cloudflare Worker for Tanya Jeda (AI mode). Free tier is enough to start.
// It only rewrites the Pustaka passages the app sends; it never answers from its own knowledge.
//
// Environment variables (Cloudflare dashboard → Worker → Settings → Variables):
//   LLM_BASE_URL   OpenAI-compatible base URL, e.g. https://generativelanguage.googleapis.com/v1beta/openai
//                  (Google Gemini free tier) or https://api.groq.com/openai/v1 (Groq free tier)
//   LLM_API_KEY    secret key
//   LLM_MODEL      model name offered by that provider
//   ALLOWED_ORIGIN your site, e.g. https://juw12.github.io

const SYSTEM_PROMPT = `Kamu adalah Tanya Jeda, asisten pustaka keagamaan.
ATURAN WAJIB:
1. Jawab HANYA berdasarkan PASSAGES yang diberikan. Jangan menambah fakta, ayat, hadis, atau aturan dari pengetahuanmu sendiri.
2. Jika PASSAGES tidak cukup menjawab, katakan dengan jujur bahwa sumber di Pustaka belum ada dan sarankan bertanya kepada pemuka agama.
3. Jangan pernah memberi fatwa, vonis halal/haram pribadi, atau tafsir baru. Jangan menilai atau membandingkan kebenaran agama.
4. Jika ada perbedaan aliran di PASSAGES, sebutkan perbedaannya secara berdampingan.
5. Bahasa Indonesia yang sopan dan sederhana, maksimal 180 kata.
6. Balas dalam JSON: {"answer": "...", "citations": ["id-passage", ...]} dengan id dari PASSAGES yang benar-benar kamu pakai.`;

function cors(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors(env) });
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: cors(env) });
    }
    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response('Bad request', { status: 400, headers: cors(env) });
    }
    const question = String(payload.question || '').slice(0, 300);
    const passages = (payload.passages || []).slice(0, 5).map((p) => ({
      id: String(p.id),
      title: String(p.title).slice(0, 200),
      text: String(p.text).slice(0, 2500),
    }));
    if (!question || passages.length === 0) {
      return new Response('Bad request', { status: 400, headers: cors(env) });
    }

    const userMessage = `PERTANYAAN: ${question}\n\nPASSAGES:\n${passages.map((p) => `[${p.id}] ${p.title}\n${p.text}`).join('\n\n')}`;
    const response = await fetch(`${env.LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.LLM_API_KEY}` },
      body: JSON.stringify({
        model: env.LLM_MODEL,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      }),
    });
    if (!response.ok) {
      return new Response('Upstream error', { status: 502, headers: cors(env) });
    }
    const data = await response.json();
    let parsed;
    try {
      parsed = JSON.parse(data.choices[0].message.content);
    } catch {
      return new Response('Invalid model output', { status: 502, headers: cors(env) });
    }
    const allowed = new Set(passages.map((p) => p.id));
    const citations = (parsed.citations || []).filter((id) => allowed.has(id));
    // No questions are logged or stored.
    return new Response(JSON.stringify({ answer: String(parsed.answer || ''), citations }), {
      headers: { ...cors(env), 'Content-Type': 'application/json' },
    });
  },
};
