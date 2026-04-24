# VarsityOS

**The AI-powered super-app for South African university students.**

Budget tracker, study planner, meal prep, work shifts, and Nova — a warm AI companion that knows NSFAS, understands township life, and speaks student. Built in South Africa, for South Africa.

---

## What it does

| Module | Capability |
|---|---|
| **Nova AI** | Full conversational AI (claude-sonnet-4-6), mood tracking, crisis detection, proactive daily check-ins |
| **Budget** | NSFAS + personal income tracking, category breakdowns, AI budget coach |
| **Study Planner** | Tasks, timetable, exam countdown, AI study plans, grade calculator, Pomodoro sessions |
| **Meal Prep** | Weekly meal planning, AI recipe generator (ingredients you actually have) |
| **Work Tracker** | Part-time jobs, shifts, earnings, AI conflict detection against timetable/exams |
| **Study Groups** | Group creation, assignments, tasks, invite system |
| **Campus Life** | Hub for all campus-specific features |
| **Referral + Streaks** | Gamified engagement — study streak flames, referral bonus Nova messages |

---

## Tech Stack

```
Frontend    Next.js 14 (App Router) · React 18 · TypeScript strict · Tailwind CSS 3.4
State       Zustand · React Hook Form + Zod
Backend     Next.js API Routes (Node.js runtime) · Supabase (PostgreSQL + RLS + Auth)
AI          Anthropic claude-sonnet-4-6 (Nova) · claude-haiku-4-5 (fast tasks)
Payments    PayFast ZAR — R39 / R79 / R129 tiers
Hosting     Vercel · varsityos.co.za
Monitoring  Sentry · PostHog · Firebase FCM (push notifications)
PWA         next-pwa — offline-first service worker
```

---

## Architecture Highlights

- **Server Components by default** — dashboard SSR'd in one round-trip, data fetched in parallel before paint
- **RLS everywhere** — Supabase Row Level Security means the DB itself enforces access control; API bugs can't leak data
- **Two-model AI strategy** — Sonnet for quality (Nova chat), Haiku for speed/cost (check-ins, budget insights, conflict detection)
- **Prompt caching** — Nova's 2 000-token knowledge base cached ephemerally; ~65% reduction in input token cost per conversation
- **PayFast ITN hardened** — IP whitelist + MD5 re-verification + alphabetically-sorted param signature on every webhook
- **Rate limited** — all 6 AI routes protected with sliding-window limiter; Nova check-in additionally cached in localStorage per day

---

## Key Files

```
src/
  app/
    api/
      nova/route.ts          ← Streaming chat + proactive insights
      nova/checkin/route.ts  ← Daily personalised check-in (Haiku)
      payfast/initiate/      ← MD5 signature + PayFast redirect
      payfast/notify/        ← ITN webhook — upgrades profile on payment
      budget/insights/       ← AI budget health analysis
      meals/recipe/          ← AI recipe generator
      study/assist/          ← Study plans + exam prep
  components/
    dashboard/DashboardClient.tsx  ← Live card data, Today's Classes, Nova bubble
    nova/NovaChatClient.tsx        ← Full streaming chat UI
  lib/
    supabase/server.ts       ← createServerSupabaseClient / createAdminClient
    rateLimit.ts             ← In-memory sliding window
    nova-knowledge-base.ts   ← SA-specific system prompt context

SYSTEM_DESIGN.md       ← 7 Mermaid architecture diagrams
TECHNICAL_DECISIONS.md ← Architectural rationale
COST_ARCHITECTURE.md   ← AI token economics + cost projections
```

---

## Subscription Tiers

| Tier | Price | Nova Messages | Key Features |
|---|---|---|---|
| Free | R0/mo | 15 | All core tools, full study planner, budget tracker |
| Scholar | R39/mo | 100 | AI recipe generator, AI budget coach, AI study plans |
| Premium | R79/mo | 250 | All Scholar + CSV export, early feature access |
| Nova Unlimited | R129/mo | ∞ | Everything + direct feedback channel |

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=https://varsityos.co.za
PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
PAYFAST_PASSPHRASE=
PAYFAST_SANDBOX=false
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

---

## Running Locally

```bash
git clone https://github.com/Nanda-Regine/campus-compass.git
cd campus-compass
npm install
cp .env.example .env.local   # fill in Supabase + Anthropic keys
npm run dev
```

---

Built by [Nanda Regine](https://github.com/Nanda-Regine) · Mirembe Muse Pty Ltd · South Africa
