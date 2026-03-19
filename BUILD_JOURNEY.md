# Campus Compass — Build Journey

> The story of building South Africa's most ambitious student super-app.
> Built by **Nanda Regine** · Mirembe Muse Pty Ltd
> Started: 2025 · Target: 100k SA students by 2026

---

## Vision

Campus Compass is not just an app — it is infrastructure for South African student success.
Every feature is built around one question: **what does a first-generation SA university student
actually need to survive and thrive?** NSFAS budgeting, load-shedding awareness, 11 languages,
crisis support, part-time work balancing — all woven together with an AI companion named Nova.

---

## Phase 1 — Foundation (Early 2025)

### What was built
- Initial Next.js 14 App Router project setup
- Supabase authentication (email + password)
- Basic profile and onboarding flow
- Core database schema: profiles, budgets, expenses, tasks, modules

### Decisions made
- **Next.js App Router** over Pages Router — future-proof, server components, streaming
- **Supabase** over Firebase — open source, PostgreSQL, native RLS, SA-friendly pricing
- **Tailwind CSS** — rapid iteration, consistent design tokens (teal/coral brand)
- **TypeScript strict mode** — catch errors at build time, not in production

### Challenges
- Structuring the App Router correctly (server vs client components)
- Setting up Supabase SSR cookies properly for session persistence

---

## Phase 2 — Core Features (Mid 2025)

### Study Planner
- Tasks tab: assignment tracking with priority, due dates, module links
- Timetable tab: weekly lecture grid
- Exams tab: exam countdown with venue tracking
- Modules tab: full module management with colour coding

### Budget & NSFAS Tracker
- Animated spending ring (live percentage indicator)
- NSFAS allowance breakdown (living, accommodation, books)
- Expense logging by category
- CSV export for NSFAS records

### Meal Prep Module
- 7-day meal planner
- Grocery list with price tracking
- Budget-aware meal suggestions

### Database
- 15 tables with full RLS policies
- Auto-triggers: profile creation, updated_at, task done_at
- Dashboard summary SQL view for performance
- 14 strategic indexes

---

## Phase 3 — Nova AI Companion (Late 2025)

### The breakthrough
This is where Campus Compass became something unprecedented in African EdTech.
Nova is not a generic chatbot — she is purpose-built for SA students.

### Architecture
- **Anthropic claude-sonnet-4-6** as the model
- **Prompt caching**: 5000-line knowledge base cached (~90% API cost savings)
- **Dynamic context injection**: student's actual budget, tasks, exams, mood fed each call
- **Crisis detection**: keyword matching triggers emergency resource display
- **Usage metering**: 10 free messages/month, unlimited for premium

### Nova Knowledge Base covers
- SA university system (25+ institutions)
- NSFAS rules and appeal processes
- Load-shedding study strategies
- Mental health resources (SADAG, university counselling)
- Learning science (spaced repetition, Pomodoro, retrieval practice)
- 11 official SA languages awareness
- Student finance (bursaries, part-time work rights)

### AI Features across the app
- Budget Coach: spending pattern analysis + personalised tips
- Study Assist: AI study plans, exam prep, grade calculator
- Recipe Generator: budget-aware recipes with cost breakdown
- Proactive Insights: Nova notices stress signals and nudges proactively
- Daily Check-in: morning AI-generated snapshot

---

## Phase 4 — Work Module + PWA (Early 2026)

### Part-Time Work Hub
- Job tracking (employer, type, hourly rate, status)
- Shift logging with clock-in/out
- Earnings history and projections
- **Conflict detector**: AI checks if shift clashes with lectures or exams

### PWA (Progressive Web App)
- Service worker for offline support
- Cached pages when no network (common with SA data costs)
- Install-to-homescreen for app-like experience
- Background sync ready

### Payments — PayFast Integration
- ZAR-native (R49/month premium)
- ITN webhook for real-time payment confirmation
- Subscription token storage for recurring billing
- Full payment audit log

---

## Phase 5 — Production Hardening (March 2026)

### Build status
- `npm run build` → PASSES — zero TypeScript errors
- 22 routes, all correctly classified (static vs dynamic)
- CSP headers, image optimisation, security headers in next.config.js

### Type system
- 522 lines of strict TypeScript types
- SA-specific enums: SALanguage (11), SAUniversity (25+), ExpenseCategories
- Full API response typing

### Security
- RLS on all 15 tables
- Service role client isolated to webhook-only routes
- Anthropic API key never reaches browser
- Next.js CSP headers configured

---

## Current Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2.5 (App Router) |
| Language | TypeScript (strict) |
| UI | React 18.3.1 + Tailwind CSS 3.4.6 |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email + Google OAuth) |
| AI | Anthropic claude-sonnet-4-6 |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Payments | PayFast (ZAR) |
| Hosting | Vercel |
| Analytics | Vercel Analytics + Speed Insights |

---

## Planned: Phase 6 — Scale & Monetisation (Q2 2026)

### Security hardening
- [ ] Rate limiting on all API routes (Upstash Redis or Vercel KV)
- [ ] PayFast IP whitelist validation on ITN webhook
- [ ] Input length limits on all AI prompt inputs (prevent prompt injection)
- [ ] Concurrent request mutex for nova_usage (prevent race condition)
- [ ] API abuse detection: flag unusually high message bursts

### Performance
- [ ] Supabase Edge Functions for AI calls (lower cold start latency)
- [ ] React Query / SWR for client-side caching and stale-while-revalidate
- [ ] Image optimisation: WebP conversion for avatars
- [ ] Bundle analysis and code splitting audit

### New Features
- [ ] Push notifications (Web Push) — exam reminders, budget alerts
- [ ] Receipt scanning — OCR photo upload → auto-expense entry
- [ ] Pomodoro study timer with automatic study_sessions tracking
- [ ] Student noticeboard — campus events, subletting, textbook swaps
- [ ] Study groups — shared timetables and task accountability
- [ ] WhatsApp bot integration (SA's primary communication channel)
- [ ] pgvector semantic search across study notes
- [ ] Campus map integration (lecture hall navigation)

### Monetisation roadmap
- [ ] Referral program: 1 free premium month per referral
- [ ] Campus Partner Program: white-label for universities (SRC partnerships)
- [ ] Sponsored meal suggestions (SA food brands targeting students)
- [ ] Tutoring marketplace (verified students + commission)
- [ ] Official NSFAS data integration partnership
- [ ] Annual plan at R399/year (R32.25/month equiv — saves R197)

### UX improvements
- [ ] Bottom navigation bar (mobile-first redesign)
- [ ] Swipe-to-complete tasks
- [ ] Quick-add FAB (floating action button) on all screens
- [ ] Achievement system with streaks and badges
- [ ] Confetti animation on task completion
- [ ] Onboarding tutorial overlay for new users
- [ ] Voice input for Nova on mobile

### Automation
- [ ] Supabase cron: daily exam countdown email at 07:00 SAST
- [ ] Supabase cron: weekly budget summary every Monday
- [ ] Supabase cron: auto-expire premium after billing_date + 31 days
- [ ] Auto-suggest study schedule when exam is added
- [ ] Auto-alert when budget reaches 80% used
- [ ] Auto-detect university from .ac.za email domain

---

## Metrics to Track

| Metric | Target (6 months) |
|--------|-------------------|
| Registered users | 10,000 |
| Premium conversion rate | 8% |
| Daily active users | 2,500 |
| Average session length | 4 min |
| Nova messages/day | 15,000 |
| MRR | R39,200 (800 premium × R49) |

---

## Architecture Decisions Log

| Date | Decision | Reason |
|------|----------|--------|
| 2025 | Next.js App Router | Server components = less JS shipped, better SEO |
| 2025 | Supabase over Firebase | PostgreSQL RLS = row-level security without custom middleware |
| 2025 | Anthropic claude-sonnet-4-6 | Best instruction-following + prompt caching = 90% cost reduction |
| 2025 | PayFast over Stripe | ZAR-native, SA bank cards work out of the box |
| 2026-01 | Prompt caching architecture | 5000-line knowledge base cached — massive cost savings at scale |
| 2026-02 | Zustand over Redux | Minimal boilerplate, fine for this data shape |
| 2026-03 | Service role isolated to webhooks | Security boundary — never expose service role to client code |

---

## Commit History Highlights

| Commit | Feature |
|--------|---------|
| `4b05faf` | Initial upload |
| `b688a11` | Anthropic AI integration for production |
| `4ed997a` | Terms, Privacy, PayFast once-off payments |
| `009b910` | PayFast recurring billing |
| `7cd6bb7` | PWA setup + enhanced Nova knowledge base |
| `fa22a7e` | Multilingual AI across all agents |
| `aec9d96` | Performance: Haiku for structured routes + Nova soft cap |
| `effa986` | Offline support — persisted store + improved SW |

---

## The Bigger Picture

Campus Compass is building toward being the **operating system for SA student life**.
The goal is not just an app — it is a platform:

1. **Data layer**: Students consent to anonymised insights that help universities understand student stress, budget failures, and academic risk — sold back to institutions as aggregate analytics.

2. **Marketplace layer**: Verified tutors, textbook swaps, subletting listings, campus jobs — all within one trusted platform students already use daily.

3. **Financial layer**: NSFAS optimization, bursary matching, micro-loans for emergencies — partnering with student-focused fintech.

4. **Career layer**: CV builder, internship matching, skills gap analysis based on modules — the student-to-professional pipeline.

If we capture students at Year 1 and keep them through graduation, we own the most valuable demographic in African tech: the next generation of professionals.

---

*Last updated: 2026-03-19*
*Built with love for South African students*
