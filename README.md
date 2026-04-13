# VarsityOS

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwindcss) ![Anthropic](https://img.shields.io/badge/Claude-Sonnet--4.5-D97706) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel) ![License](https://img.shields.io/badge/License-Proprietary-red)

**The free super-app for South African university students.**

VarsityOS brings NSFAS tracking, student budgeting, study planning, meal prep, and Nova — an AI companion built for the reality of SA varsity life — into a single beautifully designed PWA.

🌐 **Live:** [varsityos.co.za](https://varsityos.co.za)

---

## What it does

| Module | Description |
|--------|-------------|
| **Budget & NSFAS** | Log NSFAS allowances, track expenses by category, AI budget health analysis, 80% spend alerts |
| **Study Planner** | Timetable builder, exam countdowns, task management with urgency scoring, module tracking |
| **Pomodoro Timer** | Focus sessions with auto study-session logging and streak tracking |
| **Meal Prep** | Budget SA recipes under R50, weekly meal plans, grocery lists, AI recipe generator |
| **Nova AI** | CBT-based mental health support, NSFAS coaching, study strategies, crisis detection + SA hotlines |
| **Work & Shifts** | Part-time job tracker, shift logging, earnings dashboard, AI conflict detection with timetable |
| **Group Assignments** | Collaborative spaces, shared tasks, invite system, deadline tracking |
| **Referral + Streaks** | Referral codes for bonus Nova messages; daily completion streaks with visual rewards |

---

## Pricing

| Plan | Price | Nova Messages |
|------|-------|---------------|
| **Free** | R0/month | 10 msg/month |
| **Scholar** | R39/month | 75 msg/month |
| **Premium** | R79/month | 200 msg/month |

Payments via PayFast recurring monthly subscriptions (ZAR). MD5 signature + ITN webhook verification.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2 (App Router, Server Components, RSC) |
| Language | TypeScript strict mode |
| Auth + DB | Supabase (PostgreSQL, RLS, Google OAuth) |
| AI | Anthropic Claude Sonnet 4.5 (streaming, prompt caching) |
| Styling | Tailwind CSS 3.4 — dark warm / teal / coral design system |
| State | Zustand with versioned persistence |
| Forms | React Hook Form + Zod |
| Payments | PayFast (ZAR, recurring, ITN webhook) |
| Hosting | Vercel |
| Analytics | PostHog + GTM / GA4 |
| PWA | Service Worker, offline support, installable |

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) project
- [Anthropic](https://anthropic.com) API key
- [PayFast](https://www.payfast.co.za) merchant account

### Install

```bash
git clone https://github.com/Nanda-Regine/campus-compass.git
cd campus-compass
npm install
cp .env.example .env.local   # fill in your values
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — server only |
| `ANTHROPIC_API_KEY` | Anthropic API key — server only |
| `NEXT_PUBLIC_APP_URL` | `https://varsityos.co.za` in production |
| `PAYFAST_SANDBOX` | `true` in development, `false` in production |
| `NEXT_PUBLIC_GTM_ID` | GTM container ID |

### Database Setup

Run SQL files from `supabase/migrations/` in your Supabase SQL Editor in chronological order, then run `supabase/production_schema_fixes.sql` last.

### Run

```bash
npm run dev       # http://localhost:3000
npm run build     # production build
npm run typecheck # tsc --noEmit
```

---

## Security

- All routes require Supabase auth — zero anonymous access to data
- `ANTHROPIC_API_KEY` is server-side only — never in client bundles
- All 6 AI routes protected with sliding-window rate limiting
- Full CSP, HSTS (2yr preload), X-Frame-Options, X-Content-Type-Options headers
- Supabase RLS on every table with per-user policies
- PayFast ITN webhook: MD5 signature verification + service role client
- `poweredByHeader: false` — no X-Powered-By leakage
- POPIA-compliant: full account deletion at `DELETE /api/account/delete`

For architecture detail, performance decisions, and engineering rationale see [TECHNICAL_README.md](./TECHNICAL_README.md).

---

## Built By

**Nanda Regine** — [creativelynanda.co.za](https://creativelynanda.co.za)  
Mirembe Muse (Pty) Ltd · East London, Eastern Cape, South Africa

> Built for the student who's figuring it all out — with an African soul and startup-grade polish.

---

*Proprietary software. All rights reserved. © 2026 Mirembe Muse (Pty) Ltd.*
