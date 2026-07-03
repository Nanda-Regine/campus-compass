# VarsityOS — The Build Journey

> *"Umuntu ngumuntu ngabantu — I am because we are"*
>
> The story of building South Africa's most ambitious student operating system.
> Built by **Nanda Regine** · Mirembe Muse Pty Ltd
> Started: 2025 · Updated: June 2026 · Target: 100,000 SA students by end of 2026

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

## Phase 3 — Intelligence & Platform (2025–2026) ✅

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
| Institutions supported | 100+ (unis+TVET+private) | 100+ | 100+ |
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
- [x] Bursary finder — 100+ curated SA bursaries with search, filters, deadline countdowns, and Nova deep-links
- [x] Nova ?prompt= deep-link from bursary cards
- [x] Saved bursaries — bookmark any bursary, persisted to Supabase `saved_bursaries` table

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
- [x] XP engine (`src/lib/xp-engine.ts`) — 11 XP events, daily caps, Supabase sync
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
- [x] **Supabase persistence**: `user_xp_state`, `user_daily_challenges`, `wellness_checkins`, `user_cv_profile`, `flashcard_decks`, `flashcard_cards` — all 6 tables live (RLS + indexes)
- [x] **DB access layer**: `src/lib/db/xp.ts`, `wellness.ts`, `cv.ts`, `flashcards.ts` — upsert-based, local-first pattern
- [x] **WellnessTab** → Supabase (removed localStorage; loads last 30 check-ins on mount)
- [x] **CareerClient** → Supabase (CV skills, career path, summary all persisted; no localStorage)
- [x] **FlashcardsTab** → Supabase (loads decks from DB on mount; saveDeck, deleteDeck, updateCard fire-and-forget sync)
- [x] **XP engine** → background Supabase sync on every `dispatchXP` + `completeDailyChallenge`; `initXPFromDB()` for cross-device restore
- [x] **UX**: Cosmic Campus dark + Ubuntu Sunrise light design system — gradient text utilities, glow borders, `bg-cosmic` radial overlay, gamification animations (`xp-pop`, `badge-unlock`, `challenge-check`, `level-up`)

### Sprint 8A — Complete DB Persistence (Month 5) 🗄️ ✅
- [x] **GradesTab → Supabase**: `student_grades_data` table (JSONB) stores grade calculator modules + GPA rows; debounced auto-save 800 ms after any change; loads on mount
- [x] **ExamReadinessPanel → Supabase**: `exam_confidence` table; per-exam confidence slider scores persist cross-device; replaced localStorage `readConf`/`writeConf` with DB calls
- [x] **Bursary favourites**: `saved_bursaries` table; bookmark button on every bursary card; Saved filter tab with count badge; save/unsave syncs to DB
- [x] DB layer: `src/lib/db/grades.ts`, `exam-confidence.ts`, `saved-bursaries.ts`
- [x] GpaCalculator rows state lifted to parent GradesTab so both views share one save cycle

### Sprint 8B — Onboarding + Push Notifications (Month 5) 🔔 ✅
- [x] **SetupFlow upgraded to 6 steps**: Added Step 6 — "Stay on track" push notification opt-in with `ExamPushBanner` inline, notification type preview list, and PWA install prompt
- [x] **XP dispatch on onboarding complete**: `dispatchXP('task_complete')` fires at the end of setup so the student's journey starts with a reward
- [x] **Supabase admin client** (`src/lib/supabase/admin.ts`): service role client for server-to-server operations — bypasses RLS, used only in cron routes
- [x] **`push-notify.ts` helper**: shared server util to send push to all subscriptions for a user, auto-cleans stale (410) subscriptions
- [x] **Vercel Cron — exam reminders** (`/api/cron/exam-reminders`): runs daily at 09:00 SAST, sends reminders to all subscribed users for exams 1, 3, and 7 days away — fully background, no user action needed
- [x] **Vercel Cron — wellness nudge** (`/api/cron/wellness-nudge`): runs daily at 19:00 SAST, sends evening check-in prompt to users who haven't logged a wellness entry today
- [x] **`vercel.json`**: cron schedule configuration for both jobs
- [x] **VAPID keys generated** — add to Vercel env vars: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`

### Sprint 8C — Nova Intelligence Upgrade (Month 5) 🧠 ✅
- [x] **`buildStudentContext` enriched**: 5 new parallel Supabase queries — wellness check-ins (last 7 days), XP state, exam confidence map, grade module averages, saved bursaries
- [x] **Wellness context**: latest score + trend (improving/stable/declining) + days since last check-in — injected into every Nova conversation
- [x] **Gamification context**: XP level + total XP — Nova knows where the student is in their journey
- [x] **Grade-awareness**: weighted averages per module computed server-side — below-50% triggers proactive academic support signal
- [x] **Proactive signals system**: Nova's dynamic context block includes auto-generated hints based on live data (low wellness, low exam confidence + <7 days, overdue task pile, below-50% grades) so Nova naturally brings up important things without being asked
- [x] **Nova GET enriched**: `dailyBriefData` returned on every page load — name, next exam, urgent task count, wellness score, XP level — zero extra API cost
- [x] **Personalised daily brief**: Nova welcome screen replaced with data-driven `NovaDailyBrief` component showing live brief cards (exam countdown, urgent tasks, wellness score, XP level) + clickable quick-start prompts that pre-fill real student questions
- [x] XP level lookup replicated server-side (no `'use client'` import needed)

### Sprint 8B — Social + Platform (Month 5+) 👥 ✅
- [x] **Notes Marketplace** (`/notes`): community notes via Google Drive / OneDrive links; browse by module code; save/bookmark toggle; per-institution filter; uploader profile join; `community_notes` + `note_saves` tables (Supabase, RLS)
- [x] **Study Twins** (`/social`): opt-in directory; matches by university + faculty; optional WhatsApp number; TwinCard + TwinGroup components; Nova intro helper deep-link; `study_twin_opt_in` + `whatsapp_number` columns on `profiles`
- [x] **Peer Tutoring Marketplace** (`/tutoring`): full lifecycle (pending → confirmed → completed); tutor profiles with subjects array, rate/hr, bio, availability; `BecomeATutorModal`; `BookSessionModal` (subject picker, date, duration pills); **communication-only — payment arranged directly between student and tutor** (cash or EFT, VarsityOS does not touch money); push notification to tutor on book, to student on confirm/complete; star reviews on completed sessions; `tutors`, `tutoring_sessions`, `tutor_reviews` tables (Supabase, RLS, star average trigger)
- [x] **Navigation**: Notes, Social, Tutoring added to BottomNav `MORE_ITEMS` and `APP_PREFIXES`
- [x] **Institution list** (`src/types/index.ts`): `SA_UNIVERSITIES` expanded from 26 → 100+ entries covering all 26 public universities, all 50 TVET colleges by province, and 17 major private HEIs
- [x] **Nova knowledge base Parts 18–20** (`src/lib/nova-knowledge-base.ts`): Part 18 — full VarsityOS feature map (every feature with path, trigger phrases, when/when NOT to redirect); Part 19 — 100+ bursary entries with amounts, eligibility, deadlines, obligations; Part 20 — TVET intelligence (NCV L2-L4, N1-N6 structure, all 50 colleges by province, NSFAS TVET 80% rule, SETA bursaries, trade salaries, articulation paths to universities)
- [x] **Campus Feed** (`/social` Feed tab): every student can post and interact; institution-scoped feed with opt-in "All SA Students" scope toggle; 5 post categories (General, Opportunity, Academic, Campus, Sell/Swap); inline post composer with character counter + category picker; optimistic toggle reactions (❤️ with count); collapsible inline comment threads; cursor pagination (20 posts/page); own-post deletion; `campus_posts`, `post_reactions`, `post_comments` tables (Supabase, RLS, indexes on institution + created_at + post_id)
- [x] **Social page updated**: `SocialClient` tabbed wrapper — Campus Feed (default) | Study Twins; lazy-loaded with `next/dynamic` for code splitting

### Sprint 9 — Growth, SEO & Discovery (June 2026) 🔍 ✅
- [x] **SEO flood** (`src/app/layout.tsx`): keywords expanded from ~100 → 300+ terms; full coverage of all 26 public universities (abbreviation + full name + `"student app"` variant); all 50 TVET colleges; 17 private HEIs; NSFAS 2025/2026 payment dates/appeals; peer tutoring, notes sharing, bursary finder, study twins; N2–N6 TVET terms; load shedding; data saver mode; city/province-specific; student cultural terms (lekker, eish, kasi, Mzansi)
- [x] **Landing page refresh** (`src/app/page.tsx`):
  - Title + description updated to explicitly mention TVET colleges
  - Page-level `keywords` array added (30 high-intent terms)
  - `FEATURES` expanded from 8 → 12 cards (added Notes Marketplace, Peer Tutoring, Study Twins, Bursary Finder with `New` badges)
  - Features grid: `lg:grid-cols-4` → `lg:grid-cols-3` for 12-card layout
  - `UNIVERSITIES` chips expanded from 20 → 40+ (includes TVET colleges and private HEIs)
  - Stats bar: `8+ tools` → `15+ tools`; `15+ SA universities` → `100+ institutions · unis · TVETs · private`
  - Institution label updated: "For students at all 26 public universities · all 50 TVET colleges · private HEIs"
  - Hero description updated to mention bursaries, notes, tutoring
  - Hero CTA: replaced "I have an account" with "▶ See interactive demo" (teal border)
  - Nav: added "See demo" link (desktop only)
  - 6 new FAQ entries: TVET support, Notes Marketplace mechanics, Peer Tutoring lifecycle, Bursary Finder, Study Twins
  - JSON-LD `featureList`: 14 → 22 features (added tutoring, notes, bursary, study twins, flashcards, data saver, gamification)
  - JSON-LD `FAQPage`: 5 new Q&As for structured data
- [x] **Interactive demo page** (`src/app/demo/page.tsx`):
  - New `/demo` route — standalone conversion page, no auth required
  - 6 tabbed feature demos: Budget & NSFAS, Nova AI, Study Planner, Peer Tutoring, Notes Marketplace, Bursary Finder
  - Each tab: tagline + description + 4 bullet points + feature-coloured CTA button
  - Live-rendered UI previews for each feature (Budget tracker with categories + AI coaching card; Nova CBT conversation; Study planner with flashcard queue + streak; Tutor marketplace with booking button; Notes cards with save + filter; Bursary list with deadline urgency)
  - Social proof strip with 4 testimonials (including TVET student from Capricorn)
  - Final conversion CTA with gradient background
  - TypeScript clean, no extra dependencies

### Sprint 9.5 — Habits × Streak + SEO Depth (3 July 2026) 🔥 ✅
Branch `fix/ux-payments-scale-hardening` · commit `253fb19`
- [x] **Habit check-ins now extend the global streak** (`src/app/api/streak/route.ts`, `src/components/habits/HabitBuilder.tsx`): the dashboard / bottom-nav / `StreakWidget` streak previously counted **completed tasks only**, so a student who did their habits every day but logged no task saw the streak stay flat ("habits doesn't add days to the streak"). `/api/streak` now treats a day as active if a task was completed **OR** a habit was checked in that day (SAST `YYYY-MM-DD` union of both sources)
  - HabitBuilder persists a bounded `checkInDates` history **inside the existing `user_habits_state` JSONB** — no migration; backfilled from `lastCheckedIn` for habits saved before tracking existed
  - Per-habit "day streak" logic was verified correct (1→2→3→4→5 across consecutive days, resets after a miss) — it just can't advance more than once per SAST calendar day; the real gap was the global streak feed
- [x] **Habit un-check fixed**: toggling a completed habit was a silent no-op (the card could never be un-ticked because `lastCheckedIn` stayed = today). It now properly reverts streak / date / count
- [x] **Check-in flush ordering**: a check-in flushes to the DB immediately, then re-reads `/api/streak` (via `refreshStreak`), so the nav/widget update without a reload and avoid the 400 ms debounce race. `StreakWidget` at-risk copy: "AT RISK — DO A TASK OR HABIT"
- [x] **SEO depth pass** (root `layout.tsx` was already saturated with 300+ keywords + `SoftwareApplication` JSON-LD): added a second JSON-LD **`@graph`** — `Organization` (logo, founder, `sameAs` socials, contactPoint, languages), `WebSite`, and a 6-question `FAQPage` (free / NSFAS / offline / Nova / institutions / pricing)
- [x] **Sitemap expanded** (`src/app/sitemap.ts`): added `/demo`, `/institutions`, `/security`, `/feedback`, `/paia` with priorities; auth-walled app pages deliberately excluded (they redirect to login)
- [x] **robots.ts hardened**: comprehensive disallow of every authenticated app section to focus crawl budget on public pages
- [x] **Metadata for public client pages**: `/demo` and `/institutions` (both `'use client'`) got titles/descriptions/canonical/OG via route-level `layout.tsx`
- TypeScript clean; `next build` green (only offline-sandbox font-fetch warnings)

### Sprint 10 — Onboarding Polish + Quality Signals (Upcoming) ✨
- [ ] **Onboarding flow review**: audit SetupFlow 6-step onboarding; improve university/TVET selector with searchable full 100+ list; better onboarding for TVET students (N-level, trade subjects)
- [ ] **Tutor verification badge**: manual verification flow (student card upload) to distinguish verified tutors in search results
- [ ] **Notes quality scoring**: save count + view count surface high-quality notes at top of browse feed
- [ ] **Campus Feed moderation**: report-post flow; basic keyword filter for harmful content; admin view
- [ ] **WhatsApp Bot MVP**: `/nova`, `/budget`, `/tasks`, `/exam` commands via WhatsApp Business API — zero-data access for SA prepaid users

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
| Late 2025 | Inngest for scheduled jobs | Durable execution + built-in retries over plain Vercel crons |
| Early 2026 | Notes Marketplace via Drive links | No Supabase Storage bucket needed; SA students already use Google Drive |
| Early 2026 | Tutoring: communication-only, no payments | VarsityOS is a booking/connection platform — money stays between tutor and student (cash or EFT); avoids merchant liability, payout ledger, and PayFast integration complexity at this stage |
| June 2026 | SA_UNIVERSITIES expanded to 100+ | All 26 public unis + all 50 TVET colleges + 17 private HEIs for correct institution matching |
| June 2026 | /demo page over product screenshots | Interactive previews convert better; browsers need to see the real UI before trusting a free app |
| June 2026 | Campus Feed institution-scoped by default | Ubuntu principle — community first at your campus, then broader SA; avoids noisy all-SA feed before critical mass |
| June 2026 | Campus Feed Sell/Swap category | Turns the feed into a campus marketplace networking model without building a separate classifieds product |
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
