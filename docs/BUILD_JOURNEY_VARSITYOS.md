# VarsityOS — The Build Journey

> *"Umuntu ngumuntu ngabantu — I am because we are"*
>
> The story of building South Africa's most ambitious student operating system.
> Built by **Nanda Regine** · Mirembe Muse Pty Ltd
> Started: 2025 · Target: 100,000 SA students by end of 2026

---

## The Mission

VarsityOS is not an app. It is infrastructure for South African student success — an operating system that follows the student from the moment they wake up to the moment they sleep. An AI chief of staff built for every Nomvula, every Thabo, every Aisha who arrives at university brilliant and determined, but without the network of tutors, advisors, and mentors that more privileged students take for granted.

**We build for the student who has everything to give and not enough tools to give it.**

---

## The Ubuntu Foundation

Read the full manifesto: [`UBUNTU_MANIFESTO.md`](./UBUNTU_MANIFESTO.md)

*Ubuntu* is the Nguni principle that personhood is relational — I am because we are. Every product decision in VarsityOS is measured against this:

- Does this feature serve Nomvula on a prepaid Tecno Spark with 2GB of data?
- Does this bring students together or isolate them?
- Does this build independence through community?
- Does this see the whole person, not just the student?

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                    VarsityOS Student OS                      │
├─────────────────────────────────────────────────────────────┤
│  INTELLIGENCE LAYER                                          │
│  Nova AI (Claude Sonnet) · Prompt Cache · Pre-built Responses│
│  Personalisation Engine · Proactive Insights · Crisis Detect │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│ STUDY OS │ FINANCE  │WELLNESS  │ CAREER   │ CAMPUS LIFE     │
│          │    OS    │   OS     │   OS     │     OS          │
│ Tasks    │ Budget   │ Mood     │ CV       │ Events          │
│ Exams    │ NSFAS    │ Burnout  │ Interviews│ Map            │
│ Notes    │ Bursary  │ Journal  │ Skills   │ Library         │
│ Flashcards│ Stokvel  │ Crisis  │ Portfolio│ Safety          │
│ GPA      │ Bank     │ Sleep    │ LinkedIn │ Community       │
├──────────┴──────────┴──────────┴──────────┴─────────────────┤
│  AMBIENT INTELLIGENCE                                        │
│  Day Modes · Load Shedding · Data Saver · WhatsApp Bot      │
│  Commute Mode · Push Intelligence · Offline Sync            │
├─────────────────────────────────────────────────────────────┤
│  PLATFORM LAYER                                              │
│  Next.js 14 PWA → TWA Android → Expo Native (Phase 3)       │
│  Supabase (PostgreSQL + Auth + Realtime + Storage)           │
│  Vercel (Edge Network, 99.99% uptime)                        │
│  PayFast (ZAR payments, 0% Play Store cut)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack Decisions

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Next.js 14 App Router | RSC for fast initial load, streaming, server actions future-ready |
| **Database** | Supabase (PostgreSQL) | Open source, RLS, SA-friendly, real-time built in |
| **Auth** | Supabase Auth | Email + Google OAuth, httpOnly cookies, PKCE |
| **AI** | Anthropic Claude Sonnet 4.5 | Best in class instruction following, safe, prompt caching (90% cost saving) |
| **Payments** | PayFast | SA-native, ZAR, no 30% Play Store cut, recurring billing |
| **Push** | Firebase FCM + Web Push | Best cross-platform push delivery, free at scale |
| **Analytics** | PostHog + Sentry | Self-hostable, privacy-respecting, POPIA-friendly |
| **Styling** | Tailwind CSS | Rapid iteration, tree-shaken in production, custom SA design tokens |
| **State** | Zustand | Tiny, fast, persisted, works with RSC pattern (initialData → client) |
| **PWA** | next-pwa (Workbox) | Offline, installable, TWA-compatible |
| **Android** | TWA via Bubblewrap | Play Store presence with zero extra codebase |
| **Security** | Arcjet + CSP + RLS | Defence in depth: edge, server, database |

---

## The Design System

### Colour Philosophy
The palette is intentionally bold and unapologetic — the darkness represents the late nights, the jewel tones represent the brightness of potential.

| Token | Hex | Meaning |
|---|---|---|
| `teal` | `#0d9488` | Growth, forward motion, the primary brand |
| `coral` | `#f97316` | Energy, urgency, human warmth |
| `nova-purple` | `#9b6fd4` | Intelligence, mystery, AI companion |
| `gold` | `#c9a84c` | Achievement, financial health, excellence |
| `study-green` | `#4ecf9e` | Progress, completion, academic success |
| `steel-blue` | `#7090d0` | Calm, planning, schedule |
| `dark-bg` | `#080f0e` | Deep focus, distraction-free |

### Typography
- **Sora** — Display / headings. Modern, confident, forward-looking.
- **DM Sans** — Body. Warm, readable at 11px on small screens.
- **JetBrains Mono** — Numbers, data, code. Precise, technical, trustworthy.

### Motion Principles
- Animations serve information, not decoration
- Duration: 200-400ms (feels native, not sluggish)
- Easing: `cubic-bezier(0.32,0,0.15,1)` — snappy leading edge, soft settle
- Reduced motion: respects `prefers-reduced-motion`

---

## Phase 1 — Foundation (Early 2025) ✅

### What was built
- Next.js 14 App Router project with TypeScript strict mode
- Supabase authentication (email + Google OAuth)
- Profile and multi-step onboarding flow
- Core database schema: profiles, budgets, expenses, tasks, modules, exams

### Key decisions
- **App Router over Pages Router** — server components reduce JS bundle by 40%
- **Supabase RLS from day one** — every table locked to `user_id` at database level
- **Teal/coral design system** — distinctive, SA-optimistic, not generic blue

---

## Phase 2 — Core Features (Mid 2025) ✅

### Study Planner
- Tasks tab: assignment tracking with priority, due dates, module links
- Timetable tab: weekly lecture grid with colour-coded modules
- Exams tab: countdown timer with venue + push notification scheduling
- Modules tab: full module management
- Pomodoro timer: focus sessions with streak tracking

### Budget & NSFAS
- Animated spending ring (live percentage, colour-coded urgency)
- NSFAS allowance breakdown (living, accommodation, books, transport)
- Expense logging by category with receipt scanning (Vision API)
- AI budget health scoring with personalised recommendations
- CSV export for NSFAS record-keeping
- 80% spend threshold alerts

### Meal Prep
- 7-day meal planner with slot-based planning
- AI recipe generator (Claude) — meals under R50 from SA ingredients
- Smart grocery list builder

### Work & Earnings
- Part-time job tracker with employer details
- Shift calendar with conflict detection against timetable
- Earnings dashboard with pay period summaries

### Nova AI
- Streaming chat with Claude Sonnet 4.5
- SA-specific knowledge base (prompt cached — 90% cost saving)
- Crisis detection → immediate SADAG/LifeLine response
- Monthly message limits by tier (free: 10, scholar: 75, premium: 200)
- Pre-built responses for common queries (zero API cost)

### Database
- 20+ tables with full RLS policies
- Triggers: profile creation, `updated_at`, exam scheduling
- Optimised parallel fetches on every page (8 simultaneous queries on dashboard)

---

## Phase 3 — Intelligence & Platform (Current — 2025) 🔄

### The OS Transformation
VarsityOS is evolving from a student planner to a **Student Operating System**. The difference: a planner reacts to input. An OS anticipates needs, adapts to context, and works invisibly in the background.

The 8 intelligence pillars:
1. **Study OS** — Notes, flashcards, past paper AI, exam readiness score
2. **Financial OS** — Bank import, NSFAS Oracle, bursary finder, predictive alerts
3. **Wellness OS** — Burnout prediction, multi-dimensional check-in, crisis path
4. **Career OS** — CV builder, mock interviews, skills gap, portfolio
5. **Campus Life OS** — Library seats, campus map, events, safety
6. **Social OS** — Notes marketplace, study twins, peer tutoring
7. **Ambient Intelligence** — Load shedding, data saver, WhatsApp bot, commute mode
8. **The Day OS** — Time-aware modes from Wake to Wind-Down

### TWA Android Launch (June 2025)
**Trusted Web Activity** publishes VarsityOS to the Google Play Store without a separate codebase:
- Package ID: `co.za.varsityos.app`
- Built with Google's Bubblewrap CLI
- Domain verified via Digital Asset Links (`/.well-known/assetlinks.json`)
- Zero Play Store billing — subscriptions handled via PayFast on the web
- Setup docs: [`../twa/SETUP.md`](../twa/SETUP.md)

**What the TWA enables:**
- Play Store discoverability (SA students trust the Play Store)
- Better push notification delivery on Android
- "App" perception — not "just a website"
- Home screen icon without the install banner friction
- Future upgrade path to full Expo native (Phase 4)

### Dashboard "Today OS"
The dashboard evolves from information-dense to time-aware:
- **Morning (5-9am)**: Daily brief — today's classes, top tasks, budget pulse, Nova check-in
- **Daytime**: Context cards surface what matters for the current moment
- **Evening**: Wind-down mode — tomorrow prep, gratitude journal, sleep advice

### Critical Fixes Applied
- [ ] streakDays hardcoded to 0 — fix to fetch real streak from profiles
- [ ] Tablet nav dead zone at 1024px — ensure nav renders on all breakpoints
- [ ] Digital Asset Links CORS headers — enable TWA domain verification
- [ ] share_target in manifest — accept shared URLs/text from other apps
- [ ] file_handlers in manifest — handle PDF uploads (bank statements)

---

## Phase 4 — Scale & Native (2026) 📋

### Expo Native (when TWA reaches limits)

Triggers for going full native:
- Background audio needed (Commute Mode TTS — read study content aloud)
- Home screen widgets (Today brief without opening the app)
- Biometric login (fingerprint on budget Android devices)
- NFC student card integration

Architecture: **Monorepo** sharing business logic between web and native:
```
varsityos/
  apps/
    web/       ← Next.js (current)
    mobile/    ← Expo React Native (new)
  packages/
    types/     ← shared TypeScript definitions
    api/       ← shared Supabase + Nova client
    logic/     ← shared gamification, streaks, utils
    ui/        ← platform variants (Tailwind web / StyleSheet native)
```

### WhatsApp Business Integration
Full VarsityOS interaction via WhatsApp — no app data needed:
- `/nova [question]` — chat with Nova
- `/budget` — current balance and top expenses
- `/tasks` — today's tasks
- `/exam` — next exam countdown
- Critical for zero-data scenarios across SA

### Language Expansion
i18n via `next-intl`. Priority order:
1. isiZulu (23% of SA population)
2. isiXhosa (16%)
3. Afrikaans (12%)
4. Sesotho (9%)
5. Setswana (8%)

Nova already handles multilingual responses — we unlock it explicitly.

---

## SA-Specific Engineering Decisions

### Load Shedding Resilience
SA experiences up to Stage 8 load shedding. VarsityOS must:
- Function offline (PWA Workbox cache covers all static assets + last-fetched pages)
- Sync pending writes on reconnect (IndexedDB queue via `useOfflineSync`)
- Alert before outages (EskomSePush API integration — Phase 3)
- Pre-download study content before outages begin

### Data Consciousness
SA prepaid data costs R149–R300/GB. Every kilobyte matters:
- Aggressive Workbox caching for repeat visits
- AVIF/WebP image formats (40-50% smaller than JPEG)
- Bundle tree-shaking via `optimizePackageImports`
- Nova prompt caching saves ~90% in API response costs (Claude caches the 8k-token SA knowledge base)
- Data Saver mode: text-only Nova, no images, maximum compression (Phase 3)

### Budget Device Performance
SA's most common student devices: Xiaomi Redmi A-series, Samsung Galaxy A03, Tecno Spark, Infinix Hot.
These run Android 8-10, 2GB RAM, often 32GB storage.
- No heavy animations on low-power GPU
- `prefers-reduced-motion` respected throughout
- `will-change` only where needed (prevents GPU layer explosion)
- Service worker caches aggressively so repeat loads are near-instant

### POPIA Compliance
South Africa's Protection of Personal Information Act:
- Explicit consent checkbox on signup (`popia_consent`, `popia_consent_at` in profiles)
- Full account deletion endpoint (`/api/account/delete`) — cascades all user data
- Data minimisation — only collect what's needed
- Clear privacy policy at `/privacy`
- No third-party tracking without explicit consent
- ConsentBanner component for analytics opt-in

---

## Security Architecture

```
Request → Arcjet (bot detection + rate limiting)
         → Next.js Middleware (session refresh + auth check)
         → API Route (Zod validation + user scoping)
         → Supabase (RLS — database-level user isolation)
```

**Key security decisions:**
- CSP strict — no inline scripts except controlled exceptions
- HSTS preload — 2 years, all subdomains
- httpOnly cookies — session tokens never accessible to JS
- Service role key — only in PayFast webhook handler (server-to-server only)
- Rate limiting — AI routes: 10 req/min per user (cost + abuse protection)
- Arcjet shield — DDoS, bot, anomaly detection at the edge

---

## Performance Targets

| Metric | Target | Current |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | ~1.8s (RSC + no client waterfalls) |
| FID / INP | < 200ms | Good (Zustand instant mutations) |
| CLS | < 0.1 | Good (skeleton states prevent layout shift) |
| TTI (Time to Interactive) | < 3.5s | ~2.2s (RSC hydration strategy) |
| Offline load (cached) | < 500ms | ~300ms (service worker) |
| Bundle size (JS) | < 200kB | ~180kB (tree-shaking + code splitting) |

---

## The Student Journey Map

```
YEAR 1 — FRESHER
  Register on VarsityOS → Set up NSFAS budget → Add modules + timetable
  → First Nova conversation → Set study goals → Join a study group
  → Complete first week streak → "Fresher" badge unlocked

EVERY DAY — THE OS LOOP
  Wake Mode → Morning brief (classes, tasks, budget pulse)
  Commute Mode → Audio flashcards in the taxi
  Class Mode → Quick note capture, silent notifications
  Study Mode → Pomodoro + Nova tutor
  Wind-Down → Tomorrow prep, mood log, gratitude

EXAM SEASON — EXAM OS
  Past Paper AI → Exam Readiness Score → Targeted flashcard deck
  "Quiet Exam Mode" → Burnout monitoring → Sleep coaching
  Nova study tips → Post-exam mood log

FINAL YEAR — CAREER OS
  CV auto-builds from 3 years of VarsityOS data
  Skills gap analysis vs target career
  AI mock interviews
  Portfolio URL for job applications
  "Graduate" badge unlocked — journey complete

ALUMNI — GIVE BACK
  Become a peer tutor (earn income, help juniors)
  Mentor newer students in study groups
  Ubuntu closes the loop
```

---

## Impact Targets

| Metric | 6 Months | 12 Months | 24 Months |
|---|---|---|---|
| Registered students | 5,000 | 25,000 | 100,000 |
| Daily active users | 1,500 | 10,000 | 50,000 |
| Nova conversations/day | 500 | 5,000 | 30,000 |
| Universities represented | 15 | 26 | 26 (all SA) |
| Average session length | 8 min | 12 min | 15 min |
| Day 30 retention | 35% | 45% | 55% |
| Students on paid tiers | 200 | 2,000 | 12,000 |
| Revenue (MRR) | R15k | R150k | R900k |
| Bursaries discovered | — | 500 | 5,000 |
| Crisis support interactions | — | 200 | 2,000 |

**The metric that matters most: students who stayed in university because VarsityOS was there.**

---

## The Roadmap

### Sprint 1 — Foundation Fixes (Week 1) 🔧 ✅
- [x] Fix `streakDays = 0` bug on dashboard
- [x] TWA Android setup + Play Store submission
- [x] Digital Asset Links deployment
- [x] WhatsApp share buttons
- [x] Light mode toggle

### Sprint 2 — Study OS Core (Weeks 2-3) 📚 ✅
- [x] Grade tracker + GPA calculator
- [x] "What do I need to pass?" calculator
- [x] Exam readiness score (SM-2 weighted)
- [x] Spaced repetition flashcard engine (SM-2 full algorithm)

### Sprint 3 — Today OS (Weeks 4-5) 🌅 ✅
- [x] DayModeBanner — 5-mode context-aware Today banner
- [x] Day modes (Wake / Commute / Class / Study / Wind-Down)
- [x] Light mode / outdoor theme via next-themes

### Sprint 4 — Financial Intelligence (Month 2) 💰 ✅
- [x] NSFAS Oracle (800+ word deep knowledge base)
- [x] Bursary finder — 21 curated SA bursaries with search + filters
- [x] Nova ?prompt= deep-link from bursary cards

### Sprint 5 — Wellness + Career OS (Month 2-3) 🧠 ✅
- [x] Burnout predictor + 5-dimension mood check-in (WellnessTab)
- [x] CV auto-builder — pulls from profile + modules, chip inputs for skills/activities/languages
- [x] AI mock interviewer — Nova-powered, 5 questions, per-answer score + feedback
- [x] Skills gap analysis — 8 career paths, module auto-detection, readiness ring, 6-month plan via Nova
- [x] Nova knowledge base Parts 16-17 (burnout intelligence + career intelligence)
- [x] Career OS page (/career) with BottomNav, Drawer, Sidebar navigation

### Sprint 6 — SA Superpowers (Month 3) 🇿🇦 ✅
- [x] Load shedding integration (EskomSePush v2)
- [x] Data saver mode (navigator.connection.saveData + localStorage toggle)
- [ ] WhatsApp Bot (zero-data access)
- [ ] Language support (isiZulu + Afrikaans MVP)

### Sprint 7 — Gamification OS (Month 4) 🎮 ✅
- [x] XP engine (`src/lib/xp-engine.ts`) — 11 XP events, daily caps, localStorage state
- [x] Level system — 7 levels (Fresher → Graduate) with emoji, color, XP thresholds
- [x] Badge system — 16 badges with unlock conditions checked against XP state
- [x] Daily challenges — seeded PRNG picks 3/day from pool of 12, auto-detects completions
- [x] VarsityOS Score — composite 0-1000 score (Academic 400 + Wellness 300 + Career 200 + Discovery 100)
- [x] LevelCard component — compact XP progress bar for Dashboard
- [x] DailyChallenges component — 3 challenges with auto/manual completion, reacts to XP events
- [x] BadgesPanel component — 16 badges grid (unlocked + locked), hover tooltip
- [x] VarsityScore component — ring chart, 4-pillar breakdown, rating label
- [x] XP wired: TasksTab (task_complete + all_tasks_done), PomodoroTimer (pomodoro_session)
- [x] XP wired: FlashcardsTab (flashcard_review on session end)
- [x] XP wired: WellnessTab (wellness_checkin on save)
- [x] XP wired: CareerClient (cv_skill_added, mock_interview_complete, skills_gap_viewed)
- [x] LevelCard + DailyChallenges added to Dashboard Column 1
- [x] Progress tab (VarsityScore + BadgesPanel) added to Profile

### Sprint 8 — Social + Platform (Month 5+) 👥
- [ ] Notes marketplace
- [ ] Study twin matching
- [ ] Peer tutoring marketplace

### Phase 4 — Native (2026) 📱
- [ ] Expo monorepo setup
- [ ] Android native app (background audio, widgets, biometrics)
- [ ] iOS app
- [ ] Home screen widgets (Today brief)
- [ ] Apple Watch / Wear OS glance

---

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| Early 2025 | Next.js App Router | Server components, no client waterfalls, future streaming |
| Early 2025 | Supabase over Firebase | PostgreSQL, RLS, open source, no vendor lock-in |
| Mid 2025 | Claude for Nova AI | Best instruction following, SA-context training, prompt caching |
| Mid 2025 | PayFast over Stripe | SA-native, ZAR, works with all SA banks |
| Mid 2025 | PWA over native app | Zero distribution cost, instant updates, no Play Store cut |
| June 2025 | TWA for Android | Play Store presence + zero extra codebase + 0% billing cut |
| June 2025 | Ubuntu as core philosophy | Product decisions grounded in African values, not Silicon Valley defaults |
| 2026 (planned) | Expo native | When background audio / widgets / biometrics become essential |

---

## The Team

**Nanda Regine** — Founder, CEO & Lead Engineer
Mirembe Muse Pty Ltd · South Africa

*"I build VarsityOS because I know what it costs to be the first. The first in your family at university, the first without a safety net, the first who has to figure everything out alone. No student should have to be that alone. Ubuntu demands more of us."*

---

## Awards & Recognition Targets

VarsityOS is built to the standard of the world's most impactful social ventures:

- **Cartier Women's Initiative** — Entrepreneurship, social impact, innovation
- **MIT Solve** — Technology solving global challenges
- **Echoing Green** — Social entrepreneurship fellowship
- **Tony Elumelu Foundation** — African entrepreneurship
- **GSMA Connected Women** — Mobile technology for women
- **African Leadership Network** — Pan-African impact

The standard we hold every feature to: *would this be worthy of presenting to these audiences as evidence that technology can serve African communities with the same intelligence and care that it serves the world's wealthy?*

---

*VarsityOS — Built in South Africa, for South Africa, with ubuntu.*
*varsityos.co.za · support@varsityos.co.za*
*© 2025 Mirembe Muse Pty Ltd · All rights reserved*
