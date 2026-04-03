# VarsityOS

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwindcss) ![Anthropic](https://img.shields.io/badge/Claude-Sonnet--4.6-D97706) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel) ![License](https://img.shields.io/badge/License-Proprietary-red)

**The free super-app for South African university students.**

VarsityOS brings NSFAS tracking, student budgeting, study planning, meal prep, and Nova — an AI companion built for the reality of SA varsity life — into a single, beautifully designed PWA.

🌐 **Live:** [varsityos.co.za](https://varsityos.co.za)

---

## Pricing

| Plan | Price | Nova Messages | Key Features |
|------|-------|---------------|--------------|
| **Free** | R0/month | 10 msg/month | Study Planner, Budget & NSFAS, Meal Prep, Work Tracker |
| **Scholar** | R39/month | 75 msg/month | All Free features + AI Recipe Generator, AI Budget Coach, priority support |
| **Premium** | R79/month | 200 msg/month | All Scholar features + CSV export, early access to new features |

Payments via PayFast recurring monthly subscriptions (ZAR).

---

## Features

| Module | What it does |
|--------|-------------|
| **Budget & NSFAS** | Log NSFAS allowances, track expenses by category, AI budget health analysis, 80% spend alert |
| **Study Planner** | Timetable builder, exam countdowns, task management, module tracking, AI study plans |
| **Pomodoro Timer** | Focus sessions with auto study session logging and streak tracking |
| **Meal Prep** | Budget SA recipes under R50, weekly meal plans, grocery lists, AI recipe generator |
| **Nova AI** | CBT-based mental health support, NSFAS coaching, study strategies, crisis detection + SA hotlines |
| **Work & Shifts** | Part-time job tracker, shift logging, earnings dashboard, conflict detection with timetable |
| **Group Assignment Manager** | Collaborative spaces, shared tasks, invite system, deadline tracking |
| **Referral Program** | Share your code, earn bonus Nova messages |
| **Streak System** | Daily task completion streak with visual rewards |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2 (App Router, Server Components) |
| Language | TypeScript (strict mode) |
| Auth + DB | Supabase (PostgreSQL, RLS, OAuth) |
| AI | Anthropic Claude Sonnet 4.6 (streaming, prompt caching) |
| Styling | Tailwind CSS 3.4 + custom warm African-modern design |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Payments | PayFast (ZAR, MD5 signature, ITN webhook, recurring) |
| Hosting | Vercel (edge functions, analytics, speed insights) |
| Analytics | PostHog (product analytics) + GTM / GA4 |
| Error Monitoring | Sentry |
| PWA | Service Worker, offline support, installable (Android & iOS) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [Anthropic](https://anthropic.com) API key
- A [PayFast](https://www.payfast.co.za) merchant account (for payments)

### Installation

```bash
git clone https://github.com/Nanda-Regine/campus-compass.git
cd campus-compass
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Key variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only — never expose) |
| `ANTHROPIC_API_KEY` | Anthropic API key (server only — never expose) |
| `NEXT_PUBLIC_APP_URL` | `https://varsityos.co.za` in production |
| `PAYFAST_SANDBOX` | `false` in production |
| `NEXT_PUBLIC_GTM_ID` | `GTM-W7R77VP9` |

### Database Setup

Run these SQL files in your Supabase SQL Editor **in order**:

1. `schema.sql` — complete database schema
2. `MIGRATION_RUN_IN_SUPABASE.sql` — functions, triggers, RLS policies
3. `MIGRATION_SCHOLAR_TIER.sql` — subscription_tier column, backfill
4. `GROUP_SCHEMA_MIGRATION.sql` — study group tables
5. `REFERRAL_MIGRATION.sql` — referral code system
6. `PRODUCTION_SCHEMA_FIXES.sql` — race condition fix, indexes, triggers (run last)

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

---

## Architecture

```
src/
├── app/
│   ├── api/              # Server-side API routes (all AI routes rate-limited)
│   │   ├── nova/         # Streaming chat + proactive insights
│   │   ├── budget/       # AI budget analysis + 80% alert
│   │   ├── meals/        # AI recipe generator
│   │   ├── study/        # AI study plans + Pomodoro session tracking
│   │   ├── work/         # Shift CRUD + AI conflict detection
│   │   ├── referral/     # Referral code system
│   │   ├── insights/     # Dashboard insights + daily check-in
│   │   ├── account/      # POPIA account deletion
│   │   └── payfast/      # ITN webhook
│   ├── dashboard/        # Main dashboard with Nova insights
│   ├── study/            # Study planner (Tasks, Timetable, Exams, Modules, Pomodoro)
│   ├── budget/           # Budget & NSFAS tracker
│   ├── meals/            # Meal prep module
│   ├── nova/             # AI chat interface
│   ├── work/             # Work & shifts module
│   ├── upgrade/          # Pricing + PayFast checkout
│   └── auth/             # Login, Signup, OAuth, Password Reset
├── components/
│   ├── layout/           # TopBar, BottomNav (mobile)
│   ├── dashboard/        # Dashboard cards, greeting, mood check-in
│   ├── study/            # Tabs: Tasks, Timetable, Exams, Modules, PomodoroTimer
│   ├── budget/           # Budget overview, expense list, AI coach
│   ├── nova/             # Chat interface
│   └── setup/            # 5-step onboarding with university auto-detect
├── lib/
│   ├── supabase/         # Server + client Supabase helpers
│   ├── rateLimit.ts      # In-process sliding window rate limiter
│   └── nova-knowledge-base.ts  # SA student context for Nova
├── store/                # Zustand global state
└── types/                # TypeScript type definitions
```

---

## Nova AI — Message Limits

| Tier | Messages/month | Notes |
|------|---------------|-------|
| Free | 10 | +50 bonus per successful referral |
| Scholar (R39) | 75 | ~2.5 messages per day |
| Premium (R79) | 200 | ~6–7 messages per day — hard cap, never unlimited |

Rate limiting: 15 messages per minute per user (in-process sliding window).

---

## Security

- All API routes require Supabase authentication — no anonymous access
- `ANTHROPIC_API_KEY` is server-side only — never exposed to the client
- All AI-calling API routes protected with sliding-window rate limiting
- Full Content Security Policy, HSTS (2yr preload), X-Frame-Options in `next.config.js`
- Supabase RLS enabled on all tables with per-user policies
- PayFast ITN webhook uses service role client + MD5 signature verification
- GTM ID loaded from `NEXT_PUBLIC_GTM_ID` env var (not hardcoded)
- `poweredByHeader: false` — no X-Powered-By leakage
- POPIA-compliant: full account deletion API at `DELETE /api/account/delete`

---

## Roadmap

- [ ] Push notifications for exam reminders (VAPID done, FCM wiring pending)
- [ ] PostHog custom events: `nova_message_sent`, `upgrade_click`, `feature_opened`
- [ ] Redis rate limiting for multi-instance horizontal scale
- [ ] Supabase cron: daily exam reminders + weekly budget summary insights
- [ ] Receipt OCR → auto expense logging

---

## Built By

**Nanda Regine** — [creativelynanda.co.za](https://creativelynanda.co.za)  
Mirembe Muse (Pty) Ltd · East London, Eastern Cape, South Africa

> Built for the student who's figuring it all out — with an African soul and startup-grade polish.

---

*VarsityOS is proprietary software. All rights reserved. © 2026 Mirembe Muse (Pty) Ltd.*
