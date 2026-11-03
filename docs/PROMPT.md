# Build Prompt v3 — "Jeda": Virtual Sacred Spaces + Living Library for Every Faith in Indonesia

## Role
You are a senior product designer + full-stack engineer helping a **solo developer** (the owner) build and run this product, working with religious reviewers from each tradition. Build production-quality software, in phases. You never invent religious content; you structure, present and cite content supplied or approved by qualified reviewers.

## Context (reference product)
"Sansa" (산사) is a viral Korean web app (Nov 2026): a quiet virtual Buddhist temple in the browser: no install, no login, no chat. Novice-monk avatar with a random name, bows (108), prayer beads, Heart Sutra / nature audio. Popular because it gives exhausted young people an anonymous, pressure-free place to rest.

## Goal
Build **Jeda**, the Indonesian answer to Sansa, and better, with four pillars:

1. **Ruang (Spaces)**: calm, interactive sacred spaces for reflection and practice
2. **Pustaka (Living Library)**: complete, cited, reviewed guide to every faith's teachings, scriptures (read in-app), rituals, ceremonies and rules, so people can check the proper way and fading traditions are preserved
3. **Tanya Jeda (Ask)**: AI assistant that answers only from approved Pustaka content and scripture, with citations
4. **Rumah Ibadah (Real places)**: directory of real places of worship with verified info and direct donation links, plus support for the developer

Flagship: Chindo (Chinese-Indonesian) klenteng/Khonghucu. Coverage: **all** religions officially served in Indonesia and **all** their major streams, user-selectable:

| Faith | Streams the user can choose (initial list, extendable) |
|---|---|
| Islam | NU, Muhammadiyah, Persis, Al-Washliyah, other/umum |
| Kristen Protestan | HKBP, GPIB, GKI, GKJ, GMIM, Pentakosta/Karismatik (GBI, GPdI), Baptis, Advent, other |
| Katolik | Katolik Roma (KWI) |
| Hindu | Bali (PHDI), Tengger, Kaharingan, Hindu India-Indonesia |
| Buddha | Theravada, Mahayana, Tantrayana/Vajrayana, Buddhayana, Maitreya, Nichiren |
| Khonghucu & Tradisi Tionghoa | Khonghucu (MATAKIN), Tri Dharma / klenteng, Tao; dialect customs: Hokkien, Hakka, Teochew, Kanton, Hainan, Peranakan (Cina Benteng etc.) |
| Penghayat Kepercayaan | Phase 5, only with community partners |
| Ruang Alam | Non-religious quiet space |

## Core flow
1. **Landing**: calm scene, "Masuk dengan tenang." No signup required.
2. **Choose your path**: religion → stream(s) → (Chindo) dialect group; or "Saya hanya ingin tenang". Stored on-device by default.
3. **Home Space**: devotional space + Pustaka filtered to the user's stream (other streams one tap away).
4. **Kunjungi & Kenali**: other faiths in observe-and-learn mode.
5. **Optional account** (email/Google) only to sync bookmarks, family archive and preferences across devices; never required.

## Pillar 1: Ruang (Spaces)
| Space | Interactions |
|---|---|
| **Klenteng (flagship)** | Hio ×3 into hiolo; ciam si + poe/jiaobei (poems in Indonesian / 汉字 / Hokkien, other dialect readings later); ancestor altar (local tablets, offerings); kim cua burning; lunar events: Imlek, Cap Go Meh, Ceng Beng, Cioko, Tang Ce, deity birthdays |
| **Vihara** | Bows 1/3/108, mala 108, incense/candle/lotus lamp, chanting per stream, meditation bell, Waisak |
| **Pura** | Canang sari, Tri Sandhya + Gayatri at 06/12/18, tirta, gamelan/kidung; Galungan, Kuningan, Nyepi (silent dark screen) |
| **Masjid** | Tasbih 33×3, dzikir & doa per stream, murottal, prayer times (Kemenag method), Ramadan imsak/buka. No figurative depiction of Allah or prophets; sholat as guidance, not animation |
| **Gereja Protestan** | Candle + private prayer, daily verse, hymns, reflection timer; Natal, Jumat Agung, Paskah |
| **Gereja Katolik** | Rosario, Gua Maria candle, Angelus 06/12/18, liturgical colour & daily reading; no simulated sacraments |
| **Ruang Alam** | Nature scenes, breathing guide, silent timer |

Ambient presence: anonymous "N orang sedang hening di sini", soft traces. No chat.

## Pillar 2: Pustaka (Living Library)
Same 8 sections per faith: **Pokok Ajaran · Kitab Suci & Sumber · Ibadah Harian · Hari Raya & Kalender · Siklus Hidup · Aturan & Etika · Perbedaan Mazhab/Aliran · Sejarah & Tokoh di Indonesia**.

**In-app scripture readers** (only with licence; otherwise deep-link to the official app until licence arrives):
- Al-Qur'an (Arabic text + transliteration + Indonesian translation + tafsir) and major Hadith collections
- Alkitab (Indonesian translation(s) + deuterokanonika for Catholics)
- Tipitaka (Pali) / Mahayana sutra / Tantrayana texts
- Weda, Bhagavad Gita, Sarasamuccaya, lontar-based texts
- Si Shu & Wu Jing (classical Chinese + Indonesian)
Reader features: verse-level linking, parallel translations, audio, bookmarks, highlights, offline download.

**Every entry**: summary, explanation, numbered steps with "why", items/perlengkapan, timing, variations per stream/dialect (each sourced), sources, licence, reviewer, review date, version, status (`draft` / `in_review` / `approved`), "Laporkan koreksi".

**Tools**: full-text search; Panduan Upacara (Ceremony Planner) with printable/shareable checklists; Etiket Lintas Iman; Arsip Tradisi Keluarga (elders' voice notes, recipes, ancestors; private by default, opt-in moderated public archive); audio narration; large text.

## Pillar 3: Tanya Jeda (AI assistant)
- Retrieval-augmented only: answers are built **exclusively** from approved Pustaka entries and licensed scripture, shown with citations (entry/verse links).
- Answers per the user's chosen stream, and shows where other streams differ.
- If no approved source covers the question: say so and suggest asking a religious leader / nearby place of worship (link to Rumah Ibadah). Never issue rulings (fatwa), personal spiritual judgements, or interpretations beyond sources.
- Guardrails: refuses mockery, cross-faith attacks, and harmful requests; crisis keywords (self-harm) → show help resources.
- Privacy: no question logs tied to identity; anonymised, short-retention logs only for quality review.
- Cost control: rate limit per device, caching of common Q&A, monthly spend cap.

## Pillar 4: Rumah Ibadah & Dukungan
- Map/list of real klenteng, vihara, pura, masjid, gereja, litang: address, schedule, contacts, events, languages, accessibility.
- **Donation links go directly to the place of worship's own QRIS/bank/official page**; the app never holds or forwards third-party money. Listings marked "Terverifikasi" only after verification with the institution (anti-fraud).
- **Dukung Developer**: separate, clearly labelled support link for the solo developer (e.g. Saweria/Trakteer/QRIS); never placed inside a ritual, never linked to blessings or merit.
- Transparency page: what support money is used for (hosting, AI, content).

## What makes it better than Sansa
- All faiths and streams, a reviewed library with in-app scriptures, a source-grounded AI, and a bridge to real communities
- Living calendars (Hijri with Kemenag isbat + stream differences, Chinese lunar, Pawukon/Saka, liturgical) that change spaces and surface guides before each holy day
- Practical tools: Ceremony Planner, inter-faith etiquette, family archive for preserving traditions
- Quiet presence without chat; privacy by design; works on low-end Android

## Hard rules
- No AI-generated religious content in Pustaka. The assistant only quotes/summarises approved sources with citations.
- App is not a religious authority; recognised bodies' positions are shown side by side, never ranked.
- Virtual practice doesn't replace obligatory worship; no simulated sacraments; Visit mode is observe-and-learn.
- No points, streaks, leaderboards, paid merit or sold blessings. Donations are never tied to rituals or outcomes.
- Divination framed as tradition/reflection.
- Licensed or public-domain texts/audio only; "Sumber" page lists all sources and licences.
- Religion/stream stored on-device by default; synced only with an optional account and explicit consent (UU PDP No. 27/2022: specific personal data). Presence: no IDs, no IP logging tied to rooms.
- Before public launch: PSE registration (Komdigi), privacy policy & terms, legal review incl. KUHP UU No. 1/2023, reviewer sign-off per faith.

## Tech stack
- **Next.js (App Router) + TypeScript**, Tailwind, PWA offline cache; SSR/SSG for Pustaka pages (SEO, shareable links)
- **Supabase**: Postgres (content, directory, corrections), Auth (optional users; reviewer/admin roles), Storage (audio, images), Realtime (presence), **pgvector** (RAG embeddings)
- Content: Git-versioned MDX + JSON front-matter in `/content/<faith>/<stream>/<section>/<entry>.mdx`; schema validation in CI; only `approved` ships. Reviewer portal (role-based) for review, approve, corrections
- Scripture: normalised verse tables per text + licence metadata
- AI: LLM API behind a server route with retrieval from pgvector over approved content only; citation enforcement; rate limits; spend cap
- Search: Postgres full-text + client index for offline packs
- Calendars: maintained Hijri & Chinese-lunar libs; tested Pawukon/Saka module; admin-editable holy-day overrides
- Maps: OpenStreetMap/Leaflet; directory seeded from OSM + verified submissions
- Hosting: Vercel + Supabase; i18n `id`/`en` + 汉字/Hokkien (Javanese, Balinese later)

## Deliverables (per phase, see PLAN.md)
Working app, reviewer portal, content schema + Chindo flagship content, directory, assistant, README (run/build/deploy, content & review guide), assumptions and open review items.

## Process
1. Each iteration: restate the brief, find flaws, plan, ask only blocking questions (`reiterate-plan` skill).
2. Build order: Phase 1 Chindo MVP → Tanya Jeda (Chindo) → other faiths → scriptures as licences arrive → archive & languages.
3. Test on 360 × 800 and desktop; calendar dates of the current year; RAG refuses uncovered questions; unapproved content never ships; no religion data leaves the device without consent.
