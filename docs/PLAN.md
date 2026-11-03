# Hening — Plan v3 (iteration 3)

## 1. Restated brief
A free, no-login-required online app (Sansa-style) for Indonesia, built and run by one developer. Users choose their religion, stream and (for Chindo) dialect group, practise in a calm virtual space, and can visit other faiths to learn. Pustaka gives a complete, reviewed guide to every faith and stream, with scriptures readable in-app. Tanya Hening is an AI assistant answering only from approved sources with citations. Rumah Ibadah links users to real places of worship (direct donation links) and lets them support the developer. Chindo klenteng/Khonghucu is the flagship.

## 2. Changes since v2
- Coverage: all faiths **and all streams**, user-selectable; all Chindo dialect groups + Khonghucu, Tri Dharma, Tao
- Scriptures: integrated in-app (licence-gated, link-out fallback)
- Added Pillar 3: AI assistant (RAG, citation-only)
- Online architecture (Next.js + Supabase) instead of static-only; optional account for sync
- Added Pillar 4: real places-of-worship directory, direct donation links, developer support
- Reviewers: owner confirms reviewers are available
- Team: solo developer (owner)

## 3. New flaws / risks (iteration 3)
| # | Risk | Why it matters | Fix |
|---|---|---|---|
| 1 | **Scope vs solo developer** | All faiths × all streams × scriptures × AI × directory is years of work for one person | Architecture supports everything from day 1; ship Chindo first, then one faith per phase |
| 2 | AI can still misquote or over-interpret | One bad religious answer can go viral | RAG on approved content only, forced citations, "no source → no answer", test set of tricky questions per faith reviewed before launch |
| 3 | AI and hosting cost | LLM calls scale with users; Sansa got 100k visits/day | Cache, rate limits, spend cap, cheaper model for retrieval, donations fund it |
| 4 | Donation handling law | Collecting public money for others needs a PUB permit (UU 9/1961) | App never holds temple money; direct links only |
| 5 | Fake temple accounts | Scammers clone donation QRIS | "Terverifikasi" badge only after contacting the institution; report button |
| 6 | Online = religion data on server | Accounts, AI questions, presence can reveal faith (UU PDP) | No-account default, consent for sync, anonymised short-retention AI logs, no IP-room logging |
| 7 | PSE registration | Online services in Indonesia must register with Komdigi | Register before public launch |
| 8 | Reviewer load for all streams | Many streams need many reviewers; disagreements | Reviewer per stream, entries scoped by stream, disputes shown as variations |
| 9 | Licence delays block scripture readers | LAI, Kemenag, KWI, MATAKIN, PHDI permissions take time | Send requests in Phase 0; ship with deep links meanwhile |
| 10 | Developer support next to sacred content | Looks like selling religion | Separate page, never inside rituals, transparency page |
| 11 | Moderation (corrections, archive, directory) for one person | Backlog, abuse | Reviewer roles share the queue; public archive stays off until Phase 5 |

## 4. Phased plan (solo, rough estimates)
| Phase | Scope | Exit criteria |
|---|---|---|
| **0. Groundwork** (~2 wks) | Confirm reviewer list per faith/stream; send licence requests; draft privacy policy/terms; PSE prep; content schema; design system | Schema frozen; Chindo reviewer onboarded; licence requests sent |
| **1. Chindo MVP** (~6–8 wks) | Next.js + Supabase setup; landing + choose path (all faiths listed, streams selectable); Klenteng space; Pustaka for Khonghucu + Tradisi Tionghoa (Hokkien first, other dialects as variations); Ceremony Planner; klenteng directory with verified donation links; Dukung Developer; reviewer portal; search; PWA | ≥ 30 approved Chindo entries; works on low-end Android |
| **2. Tanya Hening (Chindo)** (~3 wks) | RAG pipeline, citations, refusal behaviour, rate limits, spend cap | Passes reviewer test set |
| **3. Other faiths** (~4–6 wks each) | Space + Pustaka core + streams + directory, per faith; order to decide | ≥ 20 approved core entries per faith; assistant enabled per faith after test set |
| **4. Scriptures & calendars** (rolling) | Readers as licences arrive; full calendar engine | Licence on file for each text |
| **5. Preservation & community** | Public oral-history archive, Javanese/Balinese/other dialects, Penghayat with partners | Moderation policy and capacity |

## 5. Decisions log
| # | Question | Decision |
|---|---|---|
| 1 | Reviewers | Owner has / will provide reviewers for each faith |
| 2 | Chindo scope | All: Khonghucu, Tri Dharma, Tao, all dialect groups |
| 3 | Scriptures | Integrated in-app (licence-gated) |
| 4 | AI assistant | Yes, citation-only RAG |
| 5 | Streams | All, user chooses |
| 6 | Architecture | Online (Next.js + Supabase), PWA cache |
| 7 | Money | Direct links to real places of worship + developer support |
| 8 | Languages | id/en + 汉字/Hokkien; Javanese/Balinese later |
| 9 | Team | Solo (owner) |

## 6. Open questions (iteration 3)
1. Order of faiths after Chindo (Phase 3)?
2. Monthly budget cap for hosting + AI?
3. Developer support channel (Saweria / Trakteer / own QRIS)?
4. Name "Hening" + domain OK? Developer credit name?
5. Start Phase 1 code now? Where (this scratch folder or a project folder)?


---

# Iteration 4 (build started)

## Decisions
| # | Question | Decision |
|---|---|---|
| 10 | Faith rollout order | All faiths at once (Chindo stays flagship / deepest content) |
| 11 | Budget | Free first; decide later |
| 12 | Developer support | Easiest: Saweria (primary), Trakteer, GitHub Sponsors; links prepared in `js/config.js`, inactive until accounts exist |
| 13 | Name | Working name "Hening", to be discussed; centralised in `js/config.js` |
| 14 | Developer credit | juw12 (github.com/juw12) |
| 15 | Build location | E:\hening |

## Stack change (vs v3)
Node.js is not installed and the owner wants free + easiest, so v0.1 is a **no-build static PWA** (HTML + ES modules + JSON content)
hosted free on **GitHub Pages**. Optional AI via a free **Cloudflare Worker**. Supabase (accounts, presence) deferred until needed.

## Built in v0.1
- 7 spaces with 16 ritual widget types, visit (observe) mode, path chooser (faith → stream → dialect)
- Pustaka: 79 draft entries across 6 faiths + inter-faith etiquette, search, bookmarks, scripture info pages
- Tanya Hening (free citation-search mode; AI worker ready), ceremony planner (10 guides), calendar (lunar/Hijri/Pawukon/liturgical + SKB 2027 overrides),
  places directory (26 listed, none verified), family archive with voice recording, support page, settings/export
- GitHub issue templates (correction, place, reviewer, proposal) + content validation workflow

## Found during build
- Browser Chinese calendar puts Imlek 2027 on 7 Feb (official 6 Feb; new moon ~4 min before Beijing midnight). Fixed by anchoring month-1 events to the official Imlek override. Today's lunar day shown on the home screen can still be 1 day off during that month.

## Next iteration candidates
- Real reviewers sign off core entries; ciam si poems from a consenting klenteng
- Anonymous presence counter (Supabase free tier), English UI, Javanese/Balinese/Hokkien
- Pixel/illustrated scenes by an artist; recorded ambience


---

# Iteration 5: renamed to **Jeda** (v0.2)

## Decisions
| # | Question | Decision |
|---|---|---|
| 16 | Name | **Jeda** ("pause"). One word, Indonesian, easy to say worldwide, carries Sansa's "rest for a moment" spirit. "Hening" was taken by an existing meditation app and a Riliv feature. |
| 17 | Folder / repo | E:\jeda, github.com/juw12/jeda |

## Name risk (checked by web search, not a legal search)
jeda.id is an active news site; small apps/brands named "Jeda" exist (holiday calendar app, Android Auto launcher, Jeda Academy, Jeda Digital detox device, Titik Jeda). None is a religious/multi-faith app. Use a distinctive full mark ("Jeda — ruang hening setiap iman") and check PDKI (DJKI) classes 9/42/45 before registering.

## Built in v0.2
- Rename across app, storage keys (jeda:v1:*), cache, manifest, docs
- Pause-symbol logo; "Ambil jeda" 1-minute guided breathing from the top bar, landing and home
- English interface toggle (navigation, landing, home, path chooser, settings, dates); Pustaka stays Indonesian
- Pustaka 79 → 95 entries; ceremony guides 10 → 13 (Nyepi incl. tourists in Bali, Prapaskah, Chinese memorial rites)
- Interaction tests: pause overlay, incense, ciam si + poe, tasbih, rosary, prayer times, visit-mode demo all pass


---

# Iteration 6: v0.3 additions (before launch)

- Sansa-style anonymous guest name (e.g. "Embun Senja") + small sitting figure in every space; re-roll in Settings; device-only
- Monthly observance cards: Ce It & Cap Go (klenteng), Uposatha (vihara, approx.), Purnama & Tilem (pura, approx.), puasa Senin-Kamis + Ayyamul Bidh (masjid)
- Sleep timer for ambience (15/30/60 min fade-out)
- Full offline library: all content JSON precached by the service worker
- Pustaka 95 → 120 entries; every faith now has ≥ 2 entries in all 8 sections (holy-book reading guides, Tri Hari Suci, Lectio Divina, Dhammapada, Xiao Jing, four madhhabs, ethnic churches, Catholic orders, Hindu outside Bali, Muslim Chinese-Indonesians, Ashin Jinarakkhita, oldest klenteng, Hokkien/Mandarin glossary, mourning customs, etc.)
- Verified: monthly dates (lunar month 10 starts 9 Nov 2026), sleep timer, guest rename, all spaces load without errors


---

# Iteration 7: v0.4 additions

- Holy-day decorations in spaces and home (lanterns Imlek/Cap Go Meh, ketupat Idulfitri/Iduladha, penjor Galungan/Kuningan, star Natal, lotus lamps Waisak) + greeting banner; window −3/+2 days; verified on official 2026–2027 dates
- "Dengarkan" read-aloud (Web Speech API, id-ID) on Pustaka entries and ceremony guides
- Reviewer workflow in-app (`#/tinjau`): approve/revise with notes → export file → owner merges files and downloads updated entry JSON; drafts viewable by reviewers via `?tinjau=1` even after launch. Merge verified end-to-end.
- Search synonyms (lebaran, shalat, kuburan, sincia, nikah, meninggal, …) for Pustaka search and Tanya
- Ceremony guides 13 → 20: pengurusan jenazah (Islam), akad nikah & KUA, menyambut Ramadan, pemberkatan nikah Kristen, otonan, duka Buddhis, Cioko


---

# Iteration 8: v0.5 additions

- Kamus Istilah (glossary): 80 terms across all faiths with links to Pustaka entries (`content/glossary.json`, `#/kamus`)
- Search now shows glossary terms + ceremony guides + Pustaka entries together
- Calendar export to phone (.ics, all-day events, per faith or all) — free reminders without a server
- "Teman berbeda iman merayakan" card on home with the right greeting for friends' holy days in the next 7 days
- Places directory 26 → 36 (still unverified; no donation info)
- Verified: glossary filter, combined search, .ics content (13 Chindo events), home render


## Iteration 9 — v0.6 (done)
- +18 library entries (138 total, all draft/ai-seed): Jumat, khitan, adab salam, ibadah keluarga, Paskah, Koronka, Krisma, Pengurapan Orang Sakit, Tumpek, pawiwahan, Purnama-Tilem, Atthasila, metta, Dewa Dapur, bakti sehari-hari, shio, nikah beda agama (hukum), toleransi kerja/sekolah.
- Calendar: 5 Tumpek days (Landep −60, Wariga −25, Krulut +45, Kandang +80, Wayang +115 from Galungan); verified all fall on Saniscara Kliwon in the right wuku (e.g. Tumpek Landep 2026-11-14).
- Jurnal Syukur (#/syukur): private, device-only, faith-aware daily prompt, no streaks/counts.
- Kartu Ucapan (#/kartu/<holiday>): canvas 1080x1350 card with faith scene + festive decor, Web Share files or PNG download; linked from home friend card, calendar, More menu.
- #/kitab without id now lists all scriptures (was a dead end).
- Version 0.6.0; sw.js precaches js/card.js and js/views/extras.js.
- Tested in headless Edge: calendar unit check, journal add/delete, card render (not tainted), 23 routes render with no JS errors.

## Iteration 10 — v0.7 (done)
- Peringatan Arwah (#/peringatan, js/memorial.js): device-only memorial list; day series per tradition (Tionghoa 7..49+100, tahlilan 3/7/40/100/1000, Katolik 3/7/40/100/1000, Buddha 7/49/100; Protestan/Hindu/Islam-umum none) counting death day as day 1; yearly anniversary by Imlek (ki-jit), Hijriah (haul) or Masehi; .ics export (series + 5 anniversaries). Short-month day-30 falls back to day 29; leap lunar month uses regular month; 29 Feb -> 28 Feb. Imlek month-1 dates corrected with official Imlek overrides (ICU puts 2027 CNY on 7 Feb; official 6 Feb). Lunar/Hijri dates labelled ±1 day.
- +13 entries (151): tahlilan & haul (NU vs Muhammadiyah/Persis), misa arwah, Siwaratri, Asadha, Magha Puja, Hari Reformasi, ki-jit, Hokkien, Hakka (Singkawang tatung), Teochew (Pontianak), Kanton & Hainan, Peranakan/Cina Benteng (Ciotau), ucapan duka lintas iman. Dialect variations tagged with dialect ids so the user's own dialect is highlighted.
- +16 glossary terms (96).
- Links: More menu, Arsip page.
- Not yet in calendar: Siwaratri, Asadha, Magha (need official dates from PHDI / majelis Buddha).

## Iteration 11 — v1.0 (feature-complete release candidate)
- Calendar: Siwaratri 2027-01-06 (purwaning Tilem Kapitu 7 Jan), Magha Puja 2027-02-21, Asadha 2027-07-18 added as *estimated* overrides (overrides now honour `estimated`); Asadha 27 Jul from one source rejected (not a full moon).
- Home: "Peringatan keluarga" card shows memorial dates within 14 days.
- Validator: variation stream/dialect ids, glossary links + duplicates, calendar override dates, memorial.js entry links, service-worker precache completeness.
- Publishing: publish.ps1 (gh repo create juw12/jeda --public, push, enable Pages), .nojekyll; README + LAUNCH_CHECKLIST updated (dialect review, memorial review, estimated dates, SKB 2028).
- Version 1.0.0 = app feature-complete; content remains draft (preview mode) until reviewers approve.
- Not done by design: public push (owner runs publish.ps1); ciam si poems (need licensed source); in-app scripture text (licences); AI endpoint (optional).


## Iteration 12 — v1.2 (3D spaces, presence, card onboarding)

- Every space is now a walkable low-poly 3D place (three.js r160, vendored): klenteng, vihara, pura, masjid, gereja, katedral + Gua Maria, alam.
- Activities at spots with particle/light effects; sit sheet with zikir 33×3 counter, rosary counter, breathing, quiet timer.
- Guests from another faith: devotional spots show "Pelajari" (links to Pustaka) instead of performing; zikir/rosario seats become quiet sitting.
- Optional live presence via Trystero (Nostr relays, WebRTC): name, colour, position, activities, emotes. Opt-in with IP disclosure. Verified with two headless browsers through public relays (join, state, act, emote).
- Card-based onboarding at `#/mulai` (one question per card, swipe, progress dots); `#/pilih` reuses it.
- Light paper theme by default, floating tab bar, simplified home (mood check-in, 3D space tile, today strip, quick actions).
- Fixed light pool (4 point lights) so lighting candles never triggers shader recompiles; "Pergi ke" chips for people who don't play 3D games; reduced-motion users teleport instead of walking.

Not yet verified: real phones (performance on low-end Android), presence across different networks/NAT (relays + STUN only, no TURN server).


## Iteration 13 — v1.3 (faith greetings, Ruang Live for TikTok, 3D everywhere)

- Emoji emotes replaced by faith-specific greetings with animated body gestures (avatars now have arms): soja, anjali/cakupang tangan, hand on chest, bow, open palms, raised arms, wave, sign of the cross. Your avatar turns to face the camera while greeting. Guests get neutral greetings.
- Ruang Live: host taps "Siarkan" → 7-char code (faith letter + 6 chars from SHA-256 of a device secret, so viewers verify the host), link, QR, caption text. Viewers: link or #/gabung + code → one join card (name, colour, umat/tamu, consent) → 3D. Host tools: Hening 1 menit (synced countdown + bell), Ajak ke sini, Mode siaran (on-screen code + QR), Akhiri. 6 shards × full mesh; host joins all; viewers see the host's total count; max 40 avatars rendered.
- 3D robustness: quality tiers (low/medium/high) from device memory/cores, adaptive pixel ratio then shadows-off when FPS < 28, renderer fallbacks (no AA → low-power/mediump), WebGL1 via three r160, webglcontextlost/restored handling, setting "Kualitas 3D".
- Verified headless: host + viewer on separate origins (separate storage) through public Nostr relays: code entry, join card, host verification, count "2 hadir", synced silence, end-of-live screen.
- Open: TURN relay (CONFIG.turnCredentialsUrl) needs an account (Cloudflare Realtime TURN free tier or Metered Open Relay); real-device testing on low-end Android / iOS Safari; shard capacity (~90 interactive viewers) not load-tested.
