# VarsityOS

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwindcss) ![Anthropic](https://img.shields.io/badge/Claude-Sonnet--4.6-D97706) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel) ![License](https://img.shields.io/badge/License-Proprietary-red)

**The free super-app for South African university students.**

VarsityOS brings NSFAS tracking, student budgeting, study planning, meal prep, and Nova — an AI companion built for the reality of SA varsity life — into a single, beautifully designed PWA.

🌐 **Live:** [varsityos.co.za](https://varsityos.co.za)

---

## Features

| Module | What it does |
|--------|-------------|
| **Budget & NSFAS** | Log NSFAS allowances, track expenses by category, get AI budget health analysis, export CSV |
| **Study Planner** | Timetable builder, exam countdowns, task management, module tracking, AI study plans |
| **Meal Prep** | Budget SA recipes under R50, weekly meal plans, grocery lists, AI recipe generator |
| **Nova AI** | CBT-based mental health support, NSFAS coaching, study strategies, crisis detection + SA hotlines |
| **Work & Shifts** | Part-time job tracker, shift logging, earnings dashboard, conflict detection with timetable |
| **Study Groups** | Collaborative spaces, shared tasks, invite system |
| **Pomodoro Timer** | Focus sessions with auto study session logging and streak tracking |
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
| Styling | Tailwind CSS 3.4 + custom design system |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Payments | PayFast (ZAR, MD5 signature, ITN webhook) |
| Hosting | Vercel (edge functions, analytics, speed insights) |
| PWA | Service Worker, offline support, installable |

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

Create a `.env.local` file in the root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# PayFast
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
PAYFAST_PASSPHRASE=your_passphrase
PAYFAST_SANDBOX=true
```

### Database Setup

Run the migrations in your Supabase SQL Editor (in order):

1. `MIGRATION_RUN_IN_SUPABASE.sql` — core tables
2. `REFERRAL_MIGRATION.sql` — referral system
3. `GROUP_SCHEMA_MIGRATION.sql` — study groups

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
│   │   ├── budget/       # AI budget analysis
│   │   ├── meals/        # AI recipe generator
│   │   ├── study/        # AI study plans + session tracking
│   │   ├── work/         # Shift CRUD + AI conflict detection
│   │   ├── referral/     # Referral code system
│   │   ├── insights/     # Dashboard insights + daily check-in
│   │   └── payfast/      # ITN webhook
│   ├── dashboard/        # Main dashboard with Nova insights
│   ├── study/            # Study planner (Tasks, Timetable, Exams, Modules)
│   ├── budget/           # Budget & NSFAS tracker
│   ├── meals/            # Meal prep module
│   ├── nova/             # AI chat interface
│   ├── work/             # Work & shifts module
│   ├── upgrade/          # Pricing + PayFast checkout
│   └── auth/             # Login, Signup, OAuth, Password Reset
├── components/           # Reusable UI components
├── lib/
│   ├── supabase/         # Server + client Supabase helpers
│   ├── rateLimit.ts      # In-process sliding window rate limiter
│   └── nova-knowledge-base.ts  # SA student context for Nova
├── store/                # Zustand global state
└── types/                # TypeScript type definitions
```

---

## Security

- All API routes require Supabase authentication — no anonymous access
- `ANTHROPIC_API_KEY` is server-side only — never exposed to the client
- All 6 AI-calling API routes protected with sliding-window rate limiting
- Full Content Security Policy, HSTS (2yr preload), X-Frame-Options in `next.config.js`
- Supabase RLS enabled on all tables with per-user policies
- PayFast ITN webhook uses service role client + MD5 signature verification
- `poweredByHeader: false` — no X-Powered-By leakage

---

## Roadmap

- [ ] Pomodoro timer UI (API complete)
- [ ] Push notifications for exam reminders
- [ ] Receipt OCR → auto expense logging
- [ ] Redis rate limiting for multi-instance scale
- [ ] Google Review integration for testimonials

---

## Built By

**Nanda Regine** — [creativelynanda.co.za](https://creativelynanda.co.za)
Mirembe Muse (Pty) Ltd · East London, Eastern Cape, South Africa

> Built for the student who's figuring it all out — with an African soul and startup-grade polish.

---

*VarsityOS is proprietary software. All rights reserved. © 2025 Mirembe Muse (Pty) Ltd.*
