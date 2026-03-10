# Campus Compass 🧭

> **Your varsity life, fully organised.**
> The go-to super-app for South African university students.

**A Mirembe Muse (Pty) Ltd product** — Built by Nanda Regine, Creative Technologist & AI Engineer
📍 East London, Eastern Cape · 🌐 [creativelynanda.co.za](https://creativelynanda.co.za)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Nanda-Regine/campus-compass)

---

## What is Campus Compass?

11 million South Africans are at university or TVET college. They face NSFAS stress, load shedding, tight budgets, mental health pressure, exam anxiety, and meal planning on R50 a day — all at once.

Campus Compass is their operating system. One app that handles everything: study planner, budget tracker, NSFAS management, meal prep, and an AI companion that actually understands the SA student experience.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2 (App Router, Server Components) |
| Language | TypeScript (strict mode) |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth (email + Google OAuth) |
| Styling | Tailwind CSS 3.4 (dark teal/coral design system) |
| State | Zustand |
| Forms | React Hook Form + Zod |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| Payments | PayFast (ZAR, once-off plans) |
| Hosting | Vercel |
| PWA | Service Worker (installable, offline-capable) |

---

## Features

### 🏠 Dashboard
Personalised greeting, live stats (pending tasks, budget remaining, upcoming exams), proactive Nova insights, daily AI check-in, load shedding status, budget progress widget.

### 📚 Study Planner
- **Tasks** — Assignments with module tagging, priority levels, AI study plan generator per task
- **Timetable** — Visual weekly grid (Mon–Sun, 07:00–17:00), colour-coded by module
- **Exams** — Countdown cards, venue + time, AI exam prep guide, conflict checker
- **Modules** — Subject management with 8 colour themes
- **AI Study Assist** — One-tap: study plans, exam prep guides, grade calculator, schedule conflict check

### 💰 Budget & NSFAS
- Animated spending ring (teal → amber → red as budget depletes)
- Expense logging by category with full history
- NSFAS allowance tracker (living, accommodation, books)
- CSV export of all expenses
- **AI Budget Coach** — Health score (0–100), spending analysis, savings tips, end-of-month projection

### 🍲 Meal Prep
- 7-day meal planner (Breakfast / Lunch / Supper / Snack)
- Grocery list with tick-off and cost estimator
- **AI Recipe Generator** — Input budget + dietary preference, get a full recipe with per-ingredient costs

### 🌟 Nova — AI Companion
- Conversational AI powered by Anthropic Claude
- Understands SA-specific stressors: NSFAS delays, load shedding, imposter syndrome, exam anxiety, homesickness
- Mood quick-select chips + guided conversation starters
- **Crisis detection** — Keyword-triggered SADAG + Lifeline SA helpline banners
- Proactive insights — Nova generates alerts that surface on your dashboard automatically
- Persistent chat history across sessions
- Free: 10 messages/month · Premium: unlimited

### ⭐ Premium (PayFast)
Once-off payments via PayFast (South African payment gateway):
- **1 Month** — R49
- **3 Months** — R129 (save R18)

Unlocks: unlimited Nova, AI Recipe Generator, AI Budget Coach, AI Study Plans, CSV export.

---

## AI Agent Architecture

Campus Compass uses a **multi-agent system** — not a single chatbot. Each agent reads from the same Supabase database, giving them real context about the student:

| Agent | Endpoint | Trigger |
|-------|----------|---------|
| Nova Companion | `POST /api/nova` | User sends a message |
| Proactive Insights | `GET /api/insights` | Dashboard load |
| Daily Check-In | `GET /api/insights/checkin` | User requests check-in |
| Budget Coach | `GET /api/budget/insights` | Budget → AI Coach tab |
| Recipe Generator | `POST /api/meals/recipe` | Meals → Generate Recipe |
| Study Planner | `POST /api/study/assist` | ✨ on task / exam card |

All agents use `claude-sonnet-4-6` and are server-side only — the API key never reaches the browser.

---

## Project Structure

```
repo/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── nova/route.ts              ← Nova chat + insight generation
│   │   │   ├── budget/insights/route.ts   ← AI budget analysis
│   │   │   ├── meals/recipe/route.ts      ← AI recipe generator
│   │   │   ├── study/assist/route.ts      ← Study plans, grade calc, exam prep
│   │   │   ├── insights/route.ts          ← GET/PATCH nova_insights
│   │   │   ├── insights/checkin/route.ts  ← Daily AI check-in
│   │   │   └── payfast/notify/route.ts    ← PayFast ITN webhook
│   │   ├── dashboard/page.tsx
│   │   ├── study/page.tsx
│   │   ├── budget/page.tsx
│   │   ├── meals/page.tsx
│   │   ├── nova/page.tsx
│   │   └── upgrade/page.tsx
│   ├── components/
│   │   ├── dashboard/DashboardClient.tsx
│   │   ├── study/                         ← TasksTab, ExamsTab, TimetableTab, ModulesTab, StudyAssistModal
│   │   ├── budget/BudgetClient.tsx
│   │   ├── meals/MealsClient.tsx
│   │   ├── layout/TopBar.tsx, Drawer.tsx
│   │   └── ui/                            ← Button, Input, Select, Badge, Modal, Skeleton
│   ├── lib/supabase/                      ← client.ts, server.ts, middleware.ts
│   ├── store/index.ts                     ← Zustand store
│   └── types/index.ts                     ← All interfaces + constants
├── public/
│   ├── sw.js                              ← PWA service worker
│   └── manifest.json                      ← PWA manifest
├── schema.sql                             ← Full Supabase schema
└── MIGRATION_RUN_IN_SUPABASE.sql          ← AI tables migration
```

---

## Local Development

### Prerequisites
- Node.js 18+
- A Supabase project
- An Anthropic API key

### Setup

```bash
# 1. Clone
git clone https://github.com/Nanda-Regine/campus-compass.git
cd campus-compass

# 2. Install
npm install

# 3. Environment variables
cp .env .env.local
# Fill in your values (see below)

# 4. Database
# Run schema.sql in Supabase SQL Editor, then MIGRATION_RUN_IN_SUPABASE.sql

# 5. Run
npm run dev
```

### Environment Variables

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_APP_URL` | Your deployed URL (e.g. `https://campuscompass.co.za`) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com/api-keys](https://console.anthropic.com/api-keys) |
| `PAYFAST_MERCHANT_ID` | PayFast Merchant Dashboard → Integration |
| `PAYFAST_MERCHANT_KEY` | PayFast Merchant Dashboard → Integration |
| `PAYFAST_PASSPHRASE` | PayFast Merchant Dashboard → Integration |
| `PAYFAST_SANDBOX` | `true` for testing, `false` for live |

---

## Database

Run `schema.sql` first (full schema), then `MIGRATION_RUN_IN_SUPABASE.sql` (AI feature tables).

Key tables: `profiles`, `budgets`, `expenses`, `tasks`, `modules`, `timetable_entries`, `exams`, `meal_plans`, `grocery_items`, `subscriptions`, `nova_messages`, `nova_usage`, `nova_insights`, `payment_logs`.

All tables have Row Level Security (RLS) enabled. Users can only access their own data.

---

## Deployment

The app deploys to Vercel automatically on every push to `main`.

1. Connect GitHub repo to Vercel
2. Add all environment variables in Vercel project settings
3. Deploy — done

PayFast ITN webhook: `https://yourdomain.co.za/api/payfast/notify`
The middleware excludes `/api/*` routes from auth redirects so webhooks reach their handlers.

---

## Roadmap

- [ ] Push notifications (service worker ready, needs wiring)
- [ ] Res Life module (maintenance requests, roommate board)
- [ ] NSFAS appeal tracker + deadline calendar
- [ ] Career Hub (CV builder, bursary tracker, internship listings)
- [ ] Load shedding integration (EskomSePush API)
- [ ] Campus social feed (events, societies, notices)
- [ ] University white-label partnerships

---

## About

**Mirembe Muse (Pty) Ltd**
Built by Nanda Regine · Creative Technologist & AI Engineer
📍 East London, Eastern Cape, South Africa
🌐 [creativelynanda.co.za](https://creativelynanda.co.za)
✉️ hello@mirembemuse.co.za
