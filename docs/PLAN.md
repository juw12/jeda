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
