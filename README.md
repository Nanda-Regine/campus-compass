# VarsityOS

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwindcss) ![Anthropic](https://img.shields.io/badge/AI-Claude%20%2B%20Groq-D97706) ![Mapbox](https://img.shields.io/badge/Maps-Mapbox%20GL-000?logo=mapbox) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel) ![License](https://img.shields.io/badge/License-Proprietary-red)

**The AI-powered life operating system for South African university students.**

VarsityOS unifies the entire student experience — NSFAS tracking, budgeting, study planning, safety, transport, meals, career, community, and Nova (an AI companion built for the reality of SA varsity life) — into a single offline-first, 11-language PWA that runs on a budget phone with expensive prepaid data.

🌐 **Live:** [varsityos.co.za](https://varsityos.co.za) · 📣 Full product story: [docs/MARKETING.md](./docs/MARKETING.md)

*Umuntu ngumuntu ngabantu — I am because we are.*

---

## What it does

Rooms are grouped the way students think — by area of life.

| Domain | Highlights |
|--------|-----------|
| **🧠 Academic** | StudyOS (18 tabs: tasks, timetable, exams, grades, FSRS flashcards, Pomodoro, study pods, past papers, grade forecaster, grad audit), notes marketplace, peer tutoring, textbook marketplace, document reader, LMS sync (Moodle/Blackboard/Canvas) |
| **💰 Money** | BudgetOS (11 tabs), NSFAS tracker (disbursements, N+ rule, appeals), bursary finder, digital stokvels, student tax, SASSA/SRD guide, discount directory |
| **❤️ Body & Mind** | Health hub, cycle tracker, sexual health, sleep, fitness, MealsOS (AI planner, <R50 recipes, food-insecurity mode), emotional regulation |
| **🛡️ Safety** | SOS (SA emergency numbers), Walk-Me-Home offline check-in timer, safety map (incident hotspots + nearest safe points), self-defence, guardian access, GBV response guide |
| **🚕 Movement** | Mapbox route planning, saved routes, lift club, cheapest-vs-fastest transport (taxi/bus/Uber/shuttle), commute planner |
| **🚀 Career** | CareerOS (AI CV builder, AI mock interviews, skills gap, SA jobs, mentors, grad outcomes), skills academy, side-hustle OS, work & shift tracker, launch pad |
| **🤝 Community** | SocialOS (feed, "who's around" presence + map, focus rooms, events, clubs, study twins, mutual aid), campus marketplace, civic education, SRC analytics |
| **🧭 Nova AI** | Dual-model companion: subject tutoring, NSFAS/bursary coaching, CV & interview prep, crisis detection with SA hotlines, proactive daily briefs |

Cross-cutting: **gamification** (9 levels, domain flames, compound days, 11 archetypes, mystery box, VarsityOS Score), **11 official SA languages**, **offline-first PWA**, and **Data Saver Mode** throughout.

---

## Pricing

| Plan | Price | Nova access |
|------|-------|-------------|
| **Free** | R0/month | Free tier — core safety, academic & money tools always free |
| **Scholar** | R39/month | Expanded Nova + premium tools |
| **Premium** | R79/month | Highest Nova limits |

Payments via **Paystack** recurring monthly subscriptions (ZAR), verified with HMAC-SHA512 webhook signatures.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2 (App Router, Server Components) |
| Language | TypeScript strict mode |
| Auth + DB | Supabase (PostgreSQL, RLS on every table, Google OAuth, SSR middleware) |
| AI | Anthropic Claude (Sonnet) for depth + Groq (Llama 3.1) for fast tasks — streaming, prompt caching, tiered limits |
| Maps | Mapbox GL (cached tiles + geocoding for data savings) |
| Styling | Tailwind CSS 3.4 — dark-first design system; Framer Motion |
| State | Zustand with versioned persistence |
| Forms | React Hook Form + Zod |
| Payments | Paystack (ZAR, recurring, HMAC-SHA512 webhook) |
| i18n | next-intl — 11 official SA languages |
| Learning | ts-fsrs (spaced repetition); tesseract.js (OCR); pdf-parse / mammoth (docs) |
| Security | Arcjet (bot protection), Upstash Redis (rate limiting), strict CSP/HSTS |
| Infra | Vercel hosting; Inngest (background jobs); web-push + Firebase FCM |
| Monitoring | Sentry (errors); PostHog + GTM/GA4 (analytics) |
| Testing | Vitest + happy-dom; Playwright |
| PWA | Workbox service worker, offline write queue, installable (TWA on Android) |

**By the numbers:** 72 screens · 129 API routes · 238 components · 82 database migrations · 11 languages · 26 universities in scope.

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) project
- [Anthropic](https://anthropic.com) API key (and optionally a [Groq](https://groq.com) key)
- [Paystack](https://paystack.com) account (for subscriptions)
- [Mapbox](https://mapbox.com) public token (for maps)

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
| `GROQ_API_KEY` | Groq API key — server only (fast AI tasks) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public token (`pk.…`) — maps |
| `PAYSTACK_SECRET_KEY` | Paystack secret key — server only |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key |
| `NEXT_PUBLIC_APP_URL` | `https://varsityos.co.za` in production |
| `NEXT_PUBLIC_GTM_ID` | GTM container ID (optional) |

See `.env.example` for the full list (Upstash, Arcjet, Sentry, VAPID push, etc.).

### Database Setup

Run the SQL files from `supabase/migrations/` in chronological order in your Supabase SQL Editor (82 migrations).

### Run

```bash
npm run dev         # http://localhost:3000
npm run build       # production build
npm run type-check  # tsc --noEmit
npm test            # Vitest
npm run lint        # next lint
```

---

## Security

- All data routes require Supabase auth — zero anonymous access to user data
- `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `PAYSTACK_SECRET_KEY` and the service role key are server-side only — never in client bundles
- AI routes protected with sliding-window rate limiting (Upstash) + Arcjet bot protection
- Full CSP, HSTS (2yr preload), X-Frame-Options, X-Content-Type-Options, and related headers
- Supabase RLS on every table with per-user policies
- Paystack webhook: HMAC-SHA512 signature verification + service role client
- `poweredByHeader: false` — no X-Powered-By leakage
- POPIA/PAIA compliant: consent gating, full account deletion at `DELETE /api/account/delete`, and `/privacy` · `/terms` · `/paia` pages

For architecture detail, performance decisions, and engineering rationale see [TECHNICAL_README.md](./TECHNICAL_README.md).

---

## Built By

**Nanda Regine** — [creativelynanda.co.za](https://creativelynanda.co.za)  
Mirembe Muse (Pty) Ltd · East London, Eastern Cape, South Africa

> Built for the student who's figuring it all out — with an African soul and startup-grade polish. Built for Nomvula.

---

*Proprietary software. All rights reserved. © 2026 Mirembe Muse (Pty) Ltd.*
