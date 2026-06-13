# VarsityOS — Master Build Roadmap & Journal

> *"Umuntu ngumuntu ngabantu — I am because we are"*
>
> Built by **Nanda Regine** · Mirembe Muse Pty Ltd
> Last updated: June 2026

---

## Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Shipped and live |
| 🔨 | In progress this sprint |
| 🎯 | Next to build |
| 📋 | Planned — backlog |
| 💡 | Vision — longer horizon |

---

## The Product in One Sentence

VarsityOS is the operating system for the full life of a South African student — from 6am alarm to midnight study session, from NSFAS disbursement to graduation audit, from burnout recovery to entrepreneurship launch.

---

## The 9 Life Domains

Every feature in VarsityOS maps to one of these. Nothing gets built that doesn't serve at least one domain.

```
1. MIND      — academics, study, cognition, memory, exam performance
2. BODY      — fitness, nutrition, sleep, health, illness, sexual health
3. MONEY     — budgeting, NSFAS, savings, tax, investing, entrepreneurship
4. SAFETY    — physical safety, online safety, gender-based violence, legal rights
5. MOVEMENT  — navigation, maps, weather, transport, commute planning
6. GROWTH    — habits, philosophy, books, goal architecture, digital skills
7. COMMUNITY — campus social, study twins, notes market, tutoring, civic life
8. WORK      — part-time jobs, career, CV, interviews, skills, freelance
9. FUTURE    — graduation planning, academic trajectory, life after university
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     VarsityOS Life OS                                │
├─────────────────────────────────────────────────────────────────────┤
│  ORCHESTRATION LAYER (Phase 5 — building now)                        │
│  StudentState · Signal Bus · Rules Engine · Intervention Queue       │
│  Daily Plan Generator · Catch-Up Planner · Academic Risk Engine      │
├────────────┬────────────┬───────────┬───────────┬───────────────────┤
│  MIND OS   │  MONEY OS  │  BODY OS  │  WORK OS  │  LIFE OS          │
│  Study     │  Budget    │  Fitness  │  Career   │  Safety           │
│  Tasks     │  NSFAS     │  Meals    │  CV       │  Maps             │
│  Exams     │  Bursary   │  Sleep    │  Skills   │  Weather          │
│  Notes     │  Stokvel   │  Wellness │  Jobs     │  Community        │
│  Flashcard │  Tax       │  Health   │  Freelance│  Growth           │
│  GPA       │  Investing │  Sick     │  Mentor   │  Civic            │
├────────────┴────────────┴───────────┴───────────┴───────────────────┤
│  NOVA AI (Claude Sonnet) — Life Advisor, not just chatbot            │
│  Proactive intelligence · Crisis detection · Personalised plans      │
├─────────────────────────────────────────────────────────────────────┤
│  AMBIENT INTELLIGENCE                                                │
│  DayMode · Load Shedding · Data Saver · Offline Sync · Push         │
├─────────────────────────────────────────────────────────────────────┤
│  PLATFORM                                                            │
│  Next.js 14 PWA → TWA Android → Expo Native (Phase 6)               │
│  Supabase · Vercel · PayFast · Firebase FCM                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Design System

### Color Philosophy

Each life domain has a dedicated brand color. Components use CSS custom properties — never hardcoded hex values.

| Token | Dark Hex | Purpose / Domain |
|---|---|---|
| `--teal` | `#00E5B0` | Primary brand · Study · Academic (Mind OS) |
| `--gold` | `#F0B429` | Financial · Budget · Achievements (Money OS) |
| `--nova` / `--purple` | `#9B6FFF` | Nova AI · Intelligence · Social (Community OS) |
| `--rose` | `#F472B6` | Fitness · Body · Health (Body OS) |
| `--emerald` | `#10B981` | Safety · Protection · Calm action (Safety OS) |
| `--sky` | `#38BDF8` | Navigation · Maps · Weather · Movement (Movement OS) |
| `--indigo` | `#818CF8` | Philosophy · Habit growth · Wisdom (Growth OS) |
| `--coral` | `#FF8C42` | Meals · Nutrition · Warmth |
| `--work-blue` | `#4A9EF5` | Career · Jobs · Professional (Work OS) |
| `--danger` | `#FF6B6B` | Alerts · Risk · Urgency |

#### Risk / State Colors (for orchestration layer)
| Token | Maps to | Meaning |
|---|---|---|
| `--risk-safe` | `--teal` | On track, no action needed |
| `--risk-watch` | `--gold` | Monitor — slight concern |
| `--risk-warning` | `--coral` | Act soon — situation deteriorating |
| `--risk-critical` | `--danger` | Act now — at risk of exclusion/failure |

### Typography Tokens
| Token | Font | Used for |
|---|---|---|
| `--font-display` | Sora | Headings, labels, UI text |
| `--font-body` | DM Sans | Body copy, descriptions, chat |
| `--font-mono` | JetBrains Mono | Numbers, data, code, timestamps |

### Component Patterns

Every card/section follows these atomic patterns:

**Top accent line** (2px colored bar at top of card):
```tsx
<div style={{
  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
  background: `linear-gradient(90deg, ${color}60, transparent)`,
  borderRadius: '16px 16px 0 0',
}} />
```

**Tab active indicator** (colored bottom border):
```tsx
borderBottom: activeTab === id ? `2px solid ${accent}` : '2px solid transparent'
```

**Per-tab gradient header**:
```tsx
background: `linear-gradient(180deg, ${activeTab.glow.replace('0.2','0.06')} 0%, transparent 100%)`
```

**Stats card with top accent**:
```tsx
<div style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-surface)', ... }}>
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
    background: `linear-gradient(90deg, ${color}, transparent)` }} />
```

---

## Phase 1 — Foundation ✅

- Next.js 14 App Router + TypeScript strict
- Supabase Auth (email + Google OAuth, httpOnly cookies)
- Core schema: profiles, budgets, expenses, tasks, modules, exams
- Profile + multi-step onboarding
- RLS on every table from day one

---

## Phase 2 — Core Features ✅

### Mind OS (Study Planner)
- ✅ Tasks tab — assignments with priority, due dates, module links
- ✅ Timetable tab — weekly lecture grid, colour-coded modules
- ✅ Exams tab — countdown timer, venue, push notification scheduling
- ✅ Modules tab — module management with grade tracking
- ✅ Pomodoro timer — focus sessions with streaks

### Money OS (Budget & NSFAS)
- ✅ Animated spending ring with live percentage
- ✅ NSFAS allowance breakdown (living, accommodation, books, transport)
- ✅ Expense logging with category taxonomy
- ✅ Receipt scanner (Claude Vision API)
- ✅ AI budget health scoring with personalised recommendations
- ✅ CSV export for record-keeping
- ✅ 80% spend threshold alerts

### Body OS (Meals)
- ✅ 7-day meal planner with slot-based planning
- ✅ AI recipe generator — meals under R50 from SA ingredients
- ✅ Smart grocery list builder

### Work OS (Jobs & Earnings)
- ✅ Part-time job tracker with employer details
- ✅ Shift calendar with conflict detection against timetable
- ✅ Earnings dashboard with pay period summaries

### Nova AI
- ✅ Streaming chat with Claude Sonnet
- ✅ SA knowledge base (prompt cached — 90% cost saving)
- ✅ Crisis detection → SADAG/LifeLine immediate response
- ✅ Pre-built responses for common queries (zero API cost)
- ✅ Monthly message limits by tier

---

## Phase 3 — Intelligence & Platform ✅

### Intelligence Layer
- ✅ GradesTab with SA grade scale (D/M/C+/C/D-/F+/F)
- ✅ ExamReadinessPanel — composite readiness score
- ✅ FlashcardsTab with SM-2 spaced repetition algorithm
- ✅ NSFAS Oracle — disbursement breakdown and planning
- ✅ BursaryFinder — SA bursary search and tracking
- ✅ DayModeBanner — time-aware modes (Wake/Commute/Class/Study/WindDown/Sleep)
- ✅ Load Shedding Widget — EskomSePush API, area schedule, advice
- ✅ Notes Marketplace — share/buy notes, module-tagged, trust score
- ✅ Study Twins — study partner matching within institution
- ✅ Peer Tutoring Marketplace — tutor profiles, session booking
- ✅ Campus Feed — institution-scoped social feed, reactions, comments
- ✅ XP Engine — gamification across all modules

### Ambient Intelligence
- ✅ Data Saver Mode — reduced AI calls, compressed assets
- ✅ Online/offline detector with graceful degradation
- ✅ DayMode system (6 modes keyed to SAST hour)

### Platform
- ✅ TWA Android app (Google Play Store via Bubblewrap)
- ✅ PWA with service worker (Workbox)
- ✅ PostHog analytics + Sentry error tracking
- ✅ PayFast subscription billing (ZAR)
- ✅ Light Mode (Ubuntu Sunrise theme)

### Database
- ✅ 25+ tables with full RLS policies
- ✅ Triggers: profile creation, `updated_at`, exam scheduling
- ✅ Optimised parallel fetches on every server component

---

## Phase 4 — Redesign Sweep ✅

Full visual modernisation pass across every component:

### Design System Enforcement
- ✅ Zero hardcoded hex values remaining — all surfaces use CSS custom properties
- ✅ `var(--bg-base)` / `var(--bg-surface)` / `var(--border-subtle)` consistently applied
- ✅ Light mode works across every component

### Per-Component Upgrades
- ✅ **Nova page** — Brief cards with top accent line, monospace labels, "Tap to ask →" hint
- ✅ **CareerClient** — TAB_CONFIG with per-tab accent/glow, dynamic gradient header, 2-column career grid
- ✅ **SocialClient** — Complete rewrite with TAB_CONFIG pattern, institution label, bottom-border tabs
- ✅ **ProfileClient** — Hero with teal gradient accent, stats strip with per-card top accents, themed modals
- ✅ **MealsClient** — TAB_ACCENTS record, per-tab bottom border indicator, budget context in header
- ✅ **PomodoroTimer** — SVG ring with dual-layer glow filter, phase-aware colors, pulsing time display
- ✅ **NotesMarketplace** — Top accent lines, gradient left bar on note cards, BookMarked icon badge
- ✅ **TutoringMarketplace** — TutorCard with accent lines, teal avatar border, gradient book button
- ✅ **DashboardClient** — Mass CSS var replacement (8+ occurrences), semantic hover states
- ✅ **LoadSheddingWidget** — `var(--bg-surface)`, stage-colored top bar
- ✅ **Sidebar** — `var(--bg-base)`, active state indicator dot
- ✅ **ReceiptScanner** — All inputs use `var(--bg-base)`, container uses `var(--bg-surface)`

### SQL Migrations — All Applied ✅
- ✅ `20260612000002_notes_view_count_and_feed_moderation.sql`
- ✅ `20260612000003_campus_life_os.sql`
- ✅ `20260613000001_nova_conversations.sql` — multi-conversation Nova history
- ✅ `20260613000002_user_goals.sql` — GoalArchitecture cloud sync
- ✅ `20260613000003_user_habits_state.sql` — HabitBuilder cloud sync
- ✅ `20260613000004_push_cooldowns.sql` — push notification deduplication
- ✅ `20260613000012_atomic_nova_increment.sql` — `try_use_nova_message` RPC

---

## Phase 4.5 — Cloud Sync & Intelligence Hardening ✅

### Nova AI — Multi-conversation history
- ✅ `nova_conversations` table — one row per conversation, multi per user
- ✅ `/api/nova/history` — GET list/single conversation, DELETE
- ✅ `nova/page.tsx` — History drawer with conversation list, load/delete, SOS badge
- ✅ `/api/nova` — passes & tracks `conversationId`, auto-titles from first message
- ✅ `/api/nova/catchup` — atomic quota via `try_use_nova_message` RPC (no race conditions)
- ✅ `try_use_nova_message` RPC — `FOR UPDATE` row lock, handles month reset atomically

### Cloud sync for localStorage modules
- ✅ `GoalArchitecture.tsx` — Supabase `user_goals` sync (debounced writes, localStorage cache)
- ✅ `HabitBuilder.tsx` — Supabase `user_habits_state` sync (debounced writes, localStorage cache)

### Push Notifications
- ✅ `/api/push/daily` — Vercel Cron at 07:00 SAST; exam countdowns, morning nudge, Nova quota warnings
- ✅ `vercel.json` — cron schedule at `0 5 * * *` (UTC = 07:00 SAST)
- ✅ `push_cooldowns` table — deduplication per rule per user

### Feed — Realtime hydration
- ✅ `/api/feed?id=` — single-post lookup endpoint for realtime INSERT handler

---

## Phase 4.6 — Sprint 4 Build ✅ (2026-06-13)

### New features shipped this sprint
- ✅ **Study Velocity Tracker** — `StudyVelocityTab.tsx`: per-module pace vs required exam pace, velocity bar, in-tab session logger
- ✅ **Exam Study Plan Generator** — "Plan" button in ExamsTab creates day-by-day task list (3-phase algorithm, up to 21 days)
- ✅ **NSFAS Late Payment Inngest alert** — `nsfasLateAlert`: 09:00 SAST, queries overdue disbursements, personalized push
- ✅ **Weekly Digest Inngest cron** — `weeklyDigest`: Sunday 20:00 SAST, tasks/exams/wellness summary + Sunday Planning nudge
- ✅ **Graduation Audit — real data** — loads/saves `graduation_modules` + `degree_config` from Supabase, add/delete/seed records
- ✅ **Skill Progress sync** — `skill_progress` table; DigitalSkillsAcademy dual-writes localStorage + Supabase
- ✅ **Daily State Snapshot** — `dailyStateSnapshot` Inngest cron: captures burnout/academic_risk/procrastination daily
- ✅ **Orchestration Intervention Trigger** — detects 3-day negative trends, sends targeted push alerts, logs to intervention_log
- ✅ **Attendance Tab** — `AttendanceTab.tsx`: per-module tracking, SVG rings, 80% threshold, history drawer
- ✅ **Nova conversation continuity** — awaited INSERT so conversationId returns to client correctly

### New DB tables
- `graduation_modules` (full academic history per student)
- `degree_config` (degree settings per user)
- `nsfas_disbursements` (separate from existing nsfas_tracker table — used by Inngest alert)
- `skill_progress` (JSONB progress map per user)
- `attendance_records` (UNIQUE per user+module+date)

### Inngest functions now registered (10 total)
`attendanceAlert` · `examReminders` · `budgetAlert` · `studyGapAlert` · `morningBrief` · `wellnessNudge` · `nsfasLateAlert` · `weeklyDigest` · `dailyStateSnapshot` · `orchestrationIntervention`

---

## Phase 5 — Orchestration Layer 🔨 (Building Now)

The nervous system that connects every module into a unified life OS. Without this layer, VarsityOS is a collection of tools. With it, it's an operating system.

### Architecture

```
[Signal Bus]         Every app action emits a typed event
       ↓
[StudentState]       Unified model of student across all 9 domains
       ↓
[Rules Engine]       17 rules fire on state changes → interventions queued
       ↓
[Intervention UI]    4 urgency levels: chip → nudge → banner → modal
       ↓
[Action Handlers]    Every intervention ends in a named, one-tap action
```

### Signal Types to implement
```typescript
// Academic
grade_updated · attendance_marked · study_session_ended
task_completed · task_pushed · exam_added

// Financial
expense_logged · nsfas_status_change · budget_threshold

// Wellness
mood_logged · sleep_logged · burnout_computed

// Behaviour
app_opened · session_abandoned · plan_ignored
```

### StudentState Model (9 domains)
```typescript
interface StudentState {
  academic:  { riskLevel, moduleRisks, studyVelocity, catchUpDebtHrs, completionRate, examPressure }
  financial: { runwayDays, healthScore, nsfasStatus, spendingTrend, emergencyMode }
  wellness:  { burnoutScore, moodTrend, sleepDebt, recoveryNeeded }
  schedule:  { planCoverage, procrastIndex, todayPlan, weekPlan, lastPlannedAt }
  body:      { fitnessStreak, sleepAvg, hydrationLogged, lastWorkout }
  growth:    { habitsCompletedToday, currentStreak, philosophyRead, goalsActive }
  safety:    { safetyCheckActive, sosContactsSet, lastSafetyBriefing }
  interventions: { queue, activeId, suppressedUntil }
  meta:      { lastComputedAt, dataCompleteness }
}
```

### Core Rules (priority 1–5)
| ID | Priority | Condition | Action |
|---|---|---|---|
| `academic_exclusion_risk` | 5 | risk=critical AND examPressure>80 | Open catch-up planner |
| `financial_runway_critical` | 5 | runwayDays<5 | Budget emergency mode |
| `exam_crunch_unprepared` | 4 | exam<14 days AND velocity<required | Adjust schedule |
| `burnout_overload` | 4 | burnout>75 AND planCoverage>80 | Rest and rebalance |
| `plan_ignored_3_days` | 3 | procrastIndex>70 AND no session 3d | Rebuild plan |
| `nsfas_delayed` | 3 | nsfasStatus=delayed AND runwayDays<14 | Emergency budget + NSFAS steps |
| `no_plan_for_today` | 2 | before noon AND todayPlan=empty | Generate today's plan |
| `attendance_risk` | 3 | any module attendance <70% | Attendance warning |
| `good_momentum` | 1 | completionRate>80% this week | Celebrate + reinforce |

### Components to build
- ✅ `src/store/signals.ts` — typed signal bus + Supabase persistence
- ✅ `src/store/studentState.ts` — Zustand StudentState with computed slices
- ✅ `src/lib/rules.ts` — rules engine with cooldowns + intervention queue (17 rules, urgency 1–5)
- ✅ `src/components/orchestration/InterventionBanner.tsx` — sticky dashboard banner
- ✅ `src/components/orchestration/InterventionModal.tsx` — priority-5 full-screen
- ✅ `src/components/orchestration/DailyBrief.tsx` — "Just do these 3 things today"
- ✅ `src/components/orchestration/CatchUpPlanner.tsx` — recovery mode modal
- ✅ `src/app/api/orchestration/generate-plan/route.ts` — Nova-powered day/week planner
- ✅ `supabase/migrations/*_orchestration_signals.sql` — applied

### Daily Planning Engine
Input context:
```
timetable · tasks (urgency sorted) · exam dates · module risks
available hours · burnout score · loadshedding schedule
dayMode · chronotype (lark/wolf)
```

Algorithm:
1. Place fixed blocks (classes, commute)
2. Calculate cognitive budget (hours, adjusted for burnout score)
3. Sort tasks: `(days_to_deadline × 0.4) + (module_risk × 0.4) + (effort × 0.2)`
4. Fill available windows, highest-priority first
5. Enforce work:rest ratio (max 90min blocks, 15min breaks)
6. Mark loadshedding windows as offline-only tasks
7. Guarantee recovery time if burnout > 60

### The "Will I Pass?" Calculator
```
Per module:
  Current average:       38%
  Exam weighting:        60%
  Exam date:             14 days away
  To pass (50%):         Need 57% — achievable
  At current pace:       41% likely
  Action required:       +1h/day → 61% projected
```

### Academic Struggling Student Features
- 🎯 "Help me catch up" button → Nova 5-question recovery session → generated 30-day plan
- 🎯 Daily "Just Do This" view — 3 specific tasks, nothing else
- 🎯 Catch-Up Velocity Meter — pages/topics per day needed vs current pace
- 🎯 Sunday Planning Session — guided 5-minute weekly ritual with Nova
- 🎯 Academic Risk Early Warning — yellow/orange/red escalation system
- 🎯 Attendance Tracker — per module, flags missed streaks, links to lecture catch-up

---

## Phase 6 — Extended Life OS 📋

### 6A — Financial Intelligence (Money OS+)

#### NSFAS Tracker OS 🎯 (Highest impact — build first in Phase 6)
```
Tables: nsfas_disbursements, nsfas_appeals, nsfas_documents
Features:
  - Disbursement history with expected vs actual dates
  - Late payment alert (auto-detects based on academic calendar)
  - Appeal log with status tracking
  - Underpayment calculator
  - Document checklist and upload tracker
  - Step-by-step NSFAS portal walkthrough (Nova-guided)
```

#### Stokvel OS 📋
```
Group savings circle management:
  - Member roles and contribution rules
  - Payout schedule and rotation tracker
  - Trust ledger (paid/unpaid per member)
  - Auto-reminders for contributions and payouts
  - Dispute resolution log
  - Nova explains compound savings vs stokvel ROI
```

#### Tax Return Helper 📋
```
For students who earn part-time income:
  - SARS registration walkthrough
  - Threshold check (R95,750 for 2026)
  - IRP5 / tax certificate tracker (per employer)
  - Step-by-step eFiling guide
  - Auto-calculate potential refund
```

#### Credit Score Education 📋
```
  - Score explainer (TransUnion/Experian SA)
  - Impact simulator ("miss 1 payment → 12-month projection")
  - Good debt vs bad debt guide
  - First credit card guide (FNB Connect, Capitec)
  - Free credit report walkthrough
```

#### Entrepreneurship OS 📋
```
Tables: business_ideas, startup_journal, funding_applications, invoices
Features:
  - Business Idea Validator (7 questions → viability score + SA competitor map)
  - Side Hustle Tracker (separate from salary income)
  - SA Funding Map (NYDA, DTI SEDA, Branson Centre, Grindstone)
  - Business Model Canvas builder (Nova-powered)
  - Lean Startup Journal (weekly: test → learn → iterate)
  - SA Regulatory Path (CIPC registration, VAT threshold, bookkeeping basics)
  - Invoice Generator (professional PDF via Supabase Edge Function)
  - Alumni Mentor Connect (match by institution + career path)
```

---

### 6B — Body OS (Fitness + Nutrition + Health)

#### Fitness Tracker 📋
```
Tables: workouts, fitness_goals, step_logs
Features:
  - Workout logger (gym, run, campus sport, home, yoga)
  - Campus Sport Finder (societies per institution, training times)
  - No-equipment home workouts (res room routines, 15min)
  - Fitness streaks (same XP system as study streaks)
  - Step counter integration (accelerometer / Google Fit / Apple Health)
  - Recovery tracking (rest days, soreness, sleep correlation)
  - Fitness ↔ mood correlation report (your own data, 30-day view)
```

#### Nutrition & Meal Health Tracker 📋
```
Extends existing MealsClient:
  - Meal log with macro tracking (SA food database: pap, boerewors, roti, chakalaka)
  - Nutritional gap alerts ("no vegetables in 4 days", "low iron — common in female students")
  - Budget-nutrition intersection (cheapest protein per rand: eggs, tinned fish, lentils)
  - Hydration tracker with custom reminder times
  - Energy correlation: study quality vs. breakfast logged (your own data)
```

#### When You're Sick 📋
```
Nova feature + static content:
  - Symptom checker (lightweight — not diagnostic, refers to GP for anything serious)
  - Home remedy guide (SA-context: rooibos + honey, ginger, saline, paracetamol dosing)
  - Campus clinic finder per institution (hours, booking, free vs private)
  - Medical aid / free clinic access explainer
  - Prescription tracker (upcoming refills, chronic medication reminders)
  - Menstrual health module (cycle tracker, PMS patterns, when to seek help, endo awareness)
  - Sexual health resources (free contraception on campus, PrEP awareness, HIV testing dates)
```

#### Sleep Science Module 📋
```
Tables: sleep_logs
Features:
  - Sleep log (bedtime, wake time, quality 1–5)
  - Chronotype quiz (morning lark / evening wolf → adjusts study time recommendations)
  - Exam sleep protocol (no all-nighter guide, sleep science backed)
  - Sleep debt calculator (cognitive debt from shortfalls)
  - Nap optimizer (20min vs 90min, when each applies)
  - Correlation report: grades vs. sleep hours (your own 30-day data)
```

---

### 6C — Safety OS

#### Female Safety Module 📋
```
Content modules (illustrated + video where possible):
  - Self-defense library: wrist grabs, bear hugs, chokehold escape, walking safely at night
  - Awareness drills: parking lot protocol, late-night campus
  - Body language reading course:
      - Threatening intention signals (proxemics, blocking behaviour, micro-expressions)
      - Coercive control red flags in relationships
      - Confidence posture training (7-day mini-course)
      - De-escalation language scripts
```

#### Campus Safety Tools 📋
```
  - Safety Map: crowdsourced safe/danger zones, poorly lit paths (moderated)
  - Walk Me Home: share live GPS with trusted contact + timed check-in + auto-alert
  - SOS Button: one tap → GPS to 3 emergency contacts + nearest SAPS number
  - Safe Walk Partner Matching: "leaving library at 10pm, anyone going to Res B?"
  - Red Zone Alerts: push notification when incidents reported near you
  - Campus Security Quick Dial: per institution, pre-loaded
```

#### Legal Rights 📋
```
  - Rights when stopped by police (SAPS interaction guide)
  - Tenant rights (res and private accommodation)
  - What constitutes harassment vs assault (SA law definitions)
  - How to lay a charge at SAPS (step-by-step)
  - Legal aid clinic finder per campus
  - Consumer rights (CPA: returns, defective products, NCC escalation)
  - Basic labour law (minimum wage, UIF, notice periods — for part-time workers)
```

---

### 6D — Movement OS (Maps + Weather)

#### Weather Intelligence 📋
```
API: OpenWeatherMap or AccuWeather (South African cities)
Features:
  - Daily "What to wear" summary: temperature + rain + wind + SA context
  - Pack for class checklist: weather + today's timetable combined
    ("You have a 3h lab at 2pm, rain from 4pm — pack: laptop, lab coat, umbrella")
  - Loadshedding + weather intersection:
    ("Power off at 18:00 AND 8°C tonight — study now while you have light")
  - Seasonal health alerts (flu season warning, UV index for outdoor activities)
  - Student city support: JHB, CPT, DBN, PTA, PE, Bloem, Mthatha, Polokwane
```

#### Campus Maps 📋
```
Interactive building maps (26+ universities, 50+ TVET colleges):
  - Room/lecture hall finder ("Where is F-Block Hall 3?")
  - Lift/elevator locations (accessibility)
  - Accessible routes for mobility challenges
  - Library occupancy overlay
  - Print/photocopy station locations
  - ATM and food vendor map
  - Campus clinic location
  Implementation: start with SVG-based floor plans, sourced per institution
```

#### Navigation & Transport 📋
```
  - Google Maps / Apple Maps deep-link integration (directions from location to campus)
  - Taxi route finder (crowdsourced SA minibus taxi routes — WhereIsMyTransport API)
  - Bus route planner (Rea Vaya, MyCiTi, Yarona)
  - Uber/Bolt quick estimate widget
  - Walking safety score (time of day + lighting + crime data)
  - Points of Interest: nearest Shoprite/Checkers, pharmacy, government clinic, SAPS
```

---

### 6E — Growth OS (Habits + Philosophy + Skills)

#### Habit Builder 📋
```
Tables: habits, habit_completions, habit_streaks
System: Atomic Habits (James Clear) framework
Features:
  - Habit stacking (pair with existing anchors)
  - Streaks with 2-day recovery rule ("never miss twice")
  - Temptation bundling
  - Daily habit scoreboard: 5 domains (body, mind, money, relationships, spirit) rated 1–5
  - Pre-built habit packs:
      "First-Gen Student Success Pack"
      "Broke But Building Wealth Pack"
      "Exam Season Survival Pack"
      "Entrepreneur Daily Ritual Pack"
```

#### Philosophy & Personal Development Feed 📋
```
Tables: philosophy_reads, journal_entries
Content: Jim Rohn · Marcus Aurelius · Nelson Mandela · Steve Biko · Ubuntu philosophy
Features:
  - Daily 60-second insight (matched to DayMode + current situation)
  - Applied philosophy (not motivational posters — specific to student's actual state)
    "You have 3 overdue tasks. Rohn: 'Discipline is the bridge between goals and accomplishment.'"
  - Book of the Month club (shared in campus feed per institution)
  - 5-minute book summaries (100 essential books: Rich Dad Poor Dad, Man's Search for Meaning,
    Long Walk to Freedom, Atomic Habits, Thinking Fast and Slow, Lean Startup)
```

#### Goal Architecture 📋
```
  - 10-year vision → 5-year milestones → 1-year goals → 90-day sprints → weekly top 3 → daily 3
  - Nova monthly review ("90 days ago you said you wanted to start a business. You've opened
    0 entrepreneurship journals. Want to revisit this goal?")
  - Vision Board — upload images representing your future self, shown every morning
  - Life Wheel assessment (quarterly, 8 life areas scored 1–10, improvement tracked)
```

#### Digital Skills Academy 📋
```
Bite-sized learning tracks (5-10 min per module):
  - Professional Email & Communication
  - Excel / Google Sheets for Students
  - Google Docs & Presentations (academic formatting)
  - AI Tools for Students (prompting Claude/ChatGPT ethically for research)
  - Python basics (10-day track, runs in browser)
  - Digital Security (passwords, 2FA, phishing, public WiFi)
  - Social Media for Professionals (LinkedIn, what NOT to post pre-job-hunt)
  - Canva for Students (CV, poster, presentation design — directly actionable)
  - Online Business Basics (Shopify, Gumtree, WhatsApp Business)
```

---

### 6F — Community OS

#### Civic Education 📋
```
  - Voter registration guide (IEC, step-by-step for first-timers)
  - Know your ward councillor (search by location, track record)
  - SASSA guide (who qualifies, how to apply, appeals)
  - POPIA rights (what to do when companies misuse your data)
  - Fees Must Fall historical context and student rights
  - SRC toolkit (how to run for SRC, student governance basics)
  - DHET complaint escalation guide
```

#### Student Discounts Hub 📋
```
Verified SA student deals — updated quarterly:
  - Data bundles (Telkom, MTN, Vodacom student rates)
  - Food (Steers, Debonairs, Checkers, Woolworths student deals)
  - Software (Microsoft 365, Adobe CC, GitHub Pro, Notion — all free/discounted)
  - Banking (Capitec, TymeBank, Discovery student accounts)
  - Transport (Gautrain, MyCiTi student rates)
  - ISIC card integration
```

#### Alumni Mentor Network 📋
```
Tables: mentors, mentor_sessions, mentor_reviews
  - Match with alumni from same institution by career path
  - 30-minute virtual coffee chat booking
  - Industry panels per faculty
  - "From Res to CEO" story archive
```

---

### 6G — Work OS Extensions

#### Graduation Audit 📋
```
Tables: degree_requirements, credit_tracker
  - Credit tracker (completed vs required per year level and stream)
  - Academic exclusion risk calculator
  - Module prerequisite checker ("you need MAT201 before MAT301")
  - Supplementary exam tracker
  - Expected graduation date calculator (based on current pace)
  - "Can I graduate on time?" dashboard card
```

#### Textbook Marketplace 📋
```
Tables: textbook_listings, textbook_transactions
  - List and buy by ISBN (auto-fills book details from Open Library API)
  - Trust score system (rating + verified student)
  - Safe meetup on campus (library, security office)
  - Library resource finder (does your campus library have it?)
  - Course material tracker (what you need per module)
```

#### SA Job & Internship Board 📋
```
Tables: job_listings (curated), job_applications
  - Part-time listings (on/near-campus, remote, weekends)
  - Vacation work and WIL placements
  - Graduate programme tracker (application deadlines per major company)
  - Internship application manager
  - Sources: Adzuna, PNet, Careers24, NYDA YouthPortal, institution-specific boards
```

#### True Offline Mode 📋
```
Service worker enhancements:
  - Tasks tab: full CRUD offline (sync on reconnect)
  - Timetable: read offline from cache
  - Flashcards: full SM-2 review offline
  - Pomodoro: sessions recorded offline, upload on reconnect
  - Notes: offline read access for saved notes
  - Dashboard: cached last-known state shown with "offline" badge
```

---

## Priority Build Order

### Now (Phase 5 — Orchestration)
1. `src/store/signals.ts` — typed signal bus
2. `src/store/studentState.ts` — unified state model
3. `src/lib/rules.ts` — rules engine
4. `InterventionBanner` + `InterventionModal` UI
5. `DailyBrief` component ("Just do these 3 things")
6. `CatchUpPlanner` modal — Nova-powered recovery
7. `generate-plan` API route — daily schedule generator
8. "Will I Pass?" calculator in ModulesTab

### Next (Phase 6 — High Impact)
1. NSFAS Tracker OS — #1 life-changing feature for SA students
2. Weather Integration — daily brief + what to wear
3. Female Safety Module — self-defense + body language + SOS
4. Habit Builder — Atomic Habits system
5. Graduation Audit — credit tracker + exclusion risk
6. When You're Sick — symptom guide + clinic finder

### Then (Phase 6 — Ecosystem)
1. Entrepreneurship OS — idea validator + funding map + invoice gen
2. Campus Maps — interactive building maps per institution
3. Tax Return Helper — SARS eFiling guide for working students
4. Digital Skills Academy — 5-track learning paths
5. Textbook Marketplace — ISBN-based buy/sell
6. Philosophy Feed — Jim Rohn + Ubuntu applied to student's day
7. SA Job Board — part-time + vacation work
8. Civic Education — voter registration + rights guide
9. Stokvel OS — group savings circle management
10. Alumni Mentor Network

---

## Technical Decisions Log

| Date | Decision | Reason |
|---|---|---|
| 2025 | Next.js App Router over Pages | RSC reduces bundle 40%, streaming, future-ready |
| 2025 | Supabase RLS from day one | Security at database level, not just API |
| 2025 | PayFast over Stripe | ZAR native, no Play Store cut, SA banks support it |
| 2025 | Claude Sonnet for Nova | Best instruction following, prompt caching (90% cost saving) |
| 2026 | TWA over React Native | Zero extra codebase, Play Store presence without rewrite |
| 2026 | CSS vars over Tailwind color classes | Light/dark mode works without component duplication |
| 2026 | Zustand over Redux | Tiny, persisted, works with RSC initialData pattern |
| 2026 | Signal bus over direct state mutation | Enables orchestration layer without coupling all modules |
| PERMANENT | NEVER use Supabase MCP for VarsityOS | VarsityOS is on a DIFFERENT Supabase account from MCP-connected one. All DB changes go in `supabase/migrations/` for manual execution in Supabase SQL editor |

---

## Supabase Migration Log

All migrations must be run manually in the VarsityOS Supabase SQL editor (NOT via MCP).

| File | Status | Description |
|---|---|---|
| `...001_initial_schema.sql` | ✅ Run | Core tables: profiles, budgets, expenses, tasks, modules, exams |
| `...002_notes_view_count_and_feed_moderation.sql` | ⚠️ PENDING | Notes view count, feed moderation flags |
| `...003_campus_life_os.sql` | ⚠️ PENDING | Campus life tables |
| `...004_orchestration_signals.sql` | 🎯 To create | Signal bus, student_state, intervention_log, daily_plans |
| `...005_nsfas_tracker.sql` | 📋 Planned | nsfas_disbursements, nsfas_appeals, nsfas_documents |
| `...006_body_os.sql` | 📋 Planned | workouts, sleep_logs, meal_logs, habits, habit_completions |
| `...007_safety_os.sql` | 📋 Planned | safety_contacts, sos_events, safety_map_pins |
| `...008_growth_os.sql` | 📋 Planned | goals, vision_board, philosophy_reads, journal_entries |
| `...009_entrepreneurship_os.sql` | 📋 Planned | business_ideas, startup_journal, invoices, funding_applications |
| `...010_textbook_marketplace.sql` | 📋 Planned | textbook_listings, textbook_transactions |

---

## The Student We Build For

Every feature decision is tested against Nomvula:

> **Nomvula** is a first-generation student from Soweto. She's studying BCom Accounting at Wits on a full NSFAS bursary. She has a prepaid Tecno Spark with 2GB of data per month. She takes two taxis to get to campus. She's brilliant, but she arrives without the network of tutors, advisors, and mentors that her more privileged classmates take for granted. She is homesick, occasionally overwhelmed, and full of potential.

Questions we ask of every feature:
- Does this work on 2G with 200MB remaining?
- Does this still help if Nomvula never sets it up perfectly?
- Does this make a decision FOR her, or does it add to her cognitive load?
- Does this see the whole person, not just the student?
- Would this have changed her trajectory if she had it in first year?

---

*The measure of VarsityOS is not its feature count. It is whether, 10 years from now, a student who used it looks back and says: "That's where I learned how to build a life."*
