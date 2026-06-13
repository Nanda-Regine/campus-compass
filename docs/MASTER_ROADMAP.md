# VarsityOS — Master Build Roadmap & Journal

> *"Umuntu ngumuntu ngabantu — I am because we are"*
>
> Built by **Nanda Regine** · Mirembe Muse Pty Ltd
> Last updated: 2026-06-14 (Phases 1–9 ✅ complete — Phase 10 active 🔨)

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

## Phase 5 — Orchestration Layer ✅ (Complete — 2026-06-13)

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
- ✅ "Help me catch up" button → CatchUpPlanner modal with Nova
- ✅ Daily "Just Do This" view — DailyBrief component (3 focus tasks)
- ✅ Catch-Up Velocity Meter — StudyVelocityTab with actual pace vs required
- ✅ Sunday Planning Session — SundayPlanning modal, Inngest cron reminder
- ✅ Academic Risk Early Warning — 4-level risk system wired to rules engine
- ✅ Attendance Tracker — AttendanceTab + per-module tools in ModulesTab

### Phase 5.5 — Wellness Intelligence (2026-06-13)
- ✅ Mood data → StudentState wiring — `moodAvg` and `moodTrend` computed from `varsityos-mood-cache`
- ✅ `mood_logged` signal → triggers StudentState recompute immediately
- ✅ `mood_sustained_low` rule — urgency 3 banner when declining for multiple days
- ✅ `mood_very_low` rule — urgency 4 banner + SADAG number when moodAvg < 1.8
- ✅ Mood factor in burnout score — sustained low mood adds up to 15 pts to burnout

---

## Phase 6 — Extended Life OS ✅ (Complete — 2026-06-13)

### 6A — Financial Intelligence (Money OS+) ✅

#### NSFAS Tracker OS ✅
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

#### Stokvel OS ✅
```
Group savings circle management:
  - Member roles and contribution rules
  - Payout schedule and rotation tracker
  - Trust ledger (paid/unpaid per member)
  - Auto-reminders for contributions and payouts
  - Dispute resolution log
  - Nova explains compound savings vs stokvel ROI
```

#### Tax Return Helper ✅
```
For students who earn part-time income:
  - SARS registration walkthrough
  - Threshold check (R95,750 for 2026)
  - IRP5 / tax certificate tracker (per employer)
  - Step-by-step eFiling guide
  - Auto-calculate potential refund
```

#### Credit Score Education ✅
```
  - Score explainer (TransUnion/Experian SA)
  - Impact simulator ("miss 1 payment → 12-month projection")
  - Good debt vs bad debt guide
  - First credit card guide (FNB Connect, Capitec)
  - Free credit report walkthrough
```

#### Entrepreneurship OS ✅
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

### 6B — Body OS (Fitness + Nutrition + Health) ✅

#### Fitness Tracker ✅
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

#### Nutrition & Meal Health Tracker ✅
```
Extends existing MealsClient:
  - Meal log with macro tracking (SA food database: pap, boerewors, roti, chakalaka)
  - Nutritional gap alerts ("no vegetables in 4 days", "low iron — common in female students")
  - Budget-nutrition intersection (cheapest protein per rand: eggs, tinned fish, lentils)
  - Hydration tracker with custom reminder times
  - Energy correlation: study quality vs. breakfast logged (your own data)
```

#### When You're Sick ✅
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

#### Sleep Science Module ✅
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

### 6C — Safety OS ✅

#### Female Safety Module ✅
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

#### Campus Safety Tools ✅
```
  - Safety Map: crowdsourced safe/danger zones, poorly lit paths (moderated)
  - Walk Me Home: share live GPS with trusted contact + timed check-in + auto-alert
  - SOS Button: one tap → GPS to 3 emergency contacts + nearest SAPS number
  - Safe Walk Partner Matching: "leaving library at 10pm, anyone going to Res B?"
  - Red Zone Alerts: push notification when incidents reported near you
  - Campus Security Quick Dial: per institution, pre-loaded
```

#### Legal Rights ✅
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

### 6D — Movement OS (Maps + Weather) ✅

#### Weather Intelligence ✅
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

#### Campus Maps ✅
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

#### Navigation & Transport ✅
```
  - Google Maps / Apple Maps deep-link integration (directions from location to campus)
  - Taxi route finder (crowdsourced SA minibus taxi routes — WhereIsMyTransport API)
  - Bus route planner (Rea Vaya, MyCiTi, Yarona)
  - Uber/Bolt quick estimate widget
  - Walking safety score (time of day + lighting + crime data)
  - Points of Interest: nearest Shoprite/Checkers, pharmacy, government clinic, SAPS
```

---

### 6E — Growth OS (Habits + Philosophy + Skills) ✅

#### Habit Builder ✅
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

#### Philosophy & Personal Development Feed ✅
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

#### Goal Architecture ✅
```
  - 10-year vision → 5-year milestones → 1-year goals → 90-day sprints → weekly top 3 → daily 3
  - Nova monthly review ("90 days ago you said you wanted to start a business. You've opened
    0 entrepreneurship journals. Want to revisit this goal?")
  - Vision Board — upload images representing your future self, shown every morning
  - Life Wheel assessment (quarterly, 8 life areas scored 1–10, improvement tracked)
```

#### Digital Skills Academy ✅
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

### 6F — Community OS ✅

#### Civic Education ✅
```
  - Voter registration guide (IEC, step-by-step for first-timers)
  - Know your ward councillor (search by location, track record)
  - SASSA guide (who qualifies, how to apply, appeals)
  - POPIA rights (what to do when companies misuse your data)
  - Fees Must Fall historical context and student rights
  - SRC toolkit (how to run for SRC, student governance basics)
  - DHET complaint escalation guide
```

#### Student Discounts Hub ✅
```
Verified SA student deals — updated quarterly:
  - Data bundles (Telkom, MTN, Vodacom student rates)
  - Food (Steers, Debonairs, Checkers, Woolworths student deals)
  - Software (Microsoft 365, Adobe CC, GitHub Pro, Notion — all free/discounted)
  - Banking (Capitec, TymeBank, Discovery student accounts)
  - Transport (Gautrain, MyCiTi student rates)
  - ISIC card integration
```

#### Alumni Mentor Network ✅
```
Tables: mentors, mentor_sessions, mentor_reviews
  - Match with alumni from same institution by career path
  - 30-minute virtual coffee chat booking
  - Industry panels per faculty
  - "From Res to CEO" story archive
```

---

### 6G — Work OS Extensions ✅

#### Graduation Audit ✅
```
Tables: degree_requirements, credit_tracker
  - Credit tracker (completed vs required per year level and stream)
  - Academic exclusion risk calculator
  - Module prerequisite checker ("you need MAT201 before MAT301")
  - Supplementary exam tracker
  - Expected graduation date calculator (based on current pace)
  - "Can I graduate on time?" dashboard card
```

#### Textbook Marketplace ✅
```
Tables: textbook_listings, textbook_transactions
  - List and buy by ISBN (auto-fills book details from Open Library API)
  - Trust score system (rating + verified student)
  - Safe meetup on campus (library, security office)
  - Library resource finder (does your campus library have it?)
  - Course material tracker (what you need per module)
```

#### SA Job & Internship Board ✅
```
Tables: job_listings (curated), job_applications
  - Part-time listings (on/near-campus, remote, weekends)
  - Vacation work and WIL placements
  - Graduate programme tracker (application deadlines per major company)
  - Internship application manager
  - Sources: Adzuna, PNet, Careers24, NYDA YouthPortal, institution-specific boards
```

#### True Offline Mode 🔨 (Phase 7 — in progress)
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

### ✅ Complete (Phase 5)
1. `src/store/signals.ts` — typed signal bus
2. `src/store/studentState.ts` — unified state model (with mood wiring)
3. `src/lib/rules.ts` — rules engine (13 rules, 2 wellness rules added 2026-06-13)
4. `InterventionBanner` + `InterventionModal` UI
5. `DailyBrief` component ("Just do these 3 things")
6. `CatchUpPlanner` modal — Nova-powered recovery
7. `generate-plan` API route — daily schedule generator
8. "Will I Pass?" calculator in ModulesTab

### ✅ Complete (Phase 6)
All 9 life-domain modules shipped: NSFAS Tracker OS, Weather, Safety OS, Habit Builder, Graduation Audit, When You're Sick, Entrepreneurship OS, Campus Maps (Movement OS), Tax Return Helper, Digital Skills Academy, Textbook Marketplace, Philosophy Feed, SA Job Board, Civic Education, Stokvel OS, Alumni Mentor Network, Credit Score Education, Student Discounts Hub.

### 🔨 Now (Phase 7 — Intelligence Depth)
1. ✅ Mood → StudentState (`moodAvg`, `moodTrend`, `mood_sustained_low` + `mood_very_low` rules)
2. ✅ Sleep debt → StudentState `sleepDebt` — 7-day `sleep_logs` query, deficit computed in DashboardClient → AppStore → `computeWellness`; 2 new sleep rules (urgency 2 + 3); DailyBrief shows sleep debt strip
3. ✅ Study velocity → StudentState `studyVelocity` — 7-day `study_sessions` query, avg hrs/day → AppStore → `computeAcademic`
4. ✅ Nova Proactive Brief — `/api/nova/proactive-brief` (Claude Haiku): real StudentState → headline + 3 bullets + focus action; cached daily in localStorage; DailyBrief shows "Nova's take" section with fallback
5. ✅ Cross-domain correlation engine — `/api/insights/correlations` (sleep × study × tasks, 30-day, 4-week buckets); `InsightsCard.tsx` shows top 3 insights; weekly localStorage cache
6. ✅ NSFAS disbursement status auto-detect — DashboardClient queries `nsfas_disbursements` where `status='expected'` AND `expected_date < today`; `nsfasDelayed` flag in AppStore → `computeFinancial` → `financial.nsfasStatus = 'delayed'` → triggers existing `nsfas_delayed` rule (urgency 3)
7. ✅ `low_study_velocity` rule (urgency 2) — fires when `studyVelocity < 0.5 hrs/day` AND `examPressure ≥ 35`; 12h cooldown
8. 🎯 Academic calendar sync — import timetable from institutional ICS feeds
9. 🎯 Offline-first CRUD — tasks + flashcards + Pomodoro fully offline with sync-on-reconnect
10. 🎯 "Graduation Optimizer" — AI-powered module selection to graduate on time

### ✅ Complete (Phase 8 — Platform & Revenue)
1. ✅ TWA Android app — Bubblewrap config + GitHub Actions CI (`twa-manifest.json`, `.github/workflows/twa-build.yml`)
2. ✅ PayFast subscription UI — upgrade/cancel flow, ITN webhook, success/cancel pages, ProfileClient SubscriptionSection
3. ✅ Graduation Optimizer — Claude Haiku `tool_use`, weekly localStorage cache, GraduationOptimizer component in GraduationAudit
4. ✅ Institutional onboarding — Migration 000018, `/institutions` landing, `/admin/institution` portal, invite system, `/join/institution/[token]`

### ✅ Complete (Phase 9 — Community Scale & Institutional Intelligence)
1. ✅ ICS Timetable Import — parse university .ics calendar files, auto-populate timetable + exam tables; SSRF protection, 2MB cap, batch inserts, SAST timezone; migration 000019
2. ✅ Study Pods — AI-matched peer study partners; migration 000019 (study_pod_profiles + study_pod_connections); Claude Haiku blurbs; weekly cache; opt-in form → matches → connections UI
3. ✅ Nova Voice Mode — useSpeechRecognition (en-ZA, auto-submit), useSpeechSynthesis (markdown-stripped, voice-selected), ElevenLabs TTS stream for premium, browser TTS fallback, per-message 🔊 button, auto-read toggle persisted in localStorage
4. ✅ SRC Analytics Dashboard — /api/admin/analytics (admin client, Promise.allSettled); /admin/institution Overview|Analytics tabs; CSS bar charts: year distribution, task completion, top modules, Nova engagement, active students, Study Pods adoption
5. ✅ Institution Broadcast — migration 000020 (institution_broadcasts + RLS); POST /api/admin/broadcast (rate-limit 3/24h, batch notifyUser in waves of 50); GET history; admin page compose form + priority selector + recent history list

### 🔨 Now (Phase 10 — Growth & Reach)
1. 🎯 Parent/Guardian view — optional read-only dashboard with magic-link access
2. 🎯 Nova multi-modal — image input (scan exam paper, past paper, textbook page → instant analysis)
3. 🎯 Cohort comparison — anonymous benchmarking vs same-degree peers (task completion %, GPA bracket, study velocity)
4. 📋 VarsityOS for TVET colleges — NCV/NC(V) qualifications, TVET NSFAS rules, N-level certificate tracking
5. 📋 LMS integrations — Blackboard, Moodle, Canvas webhooks for grade sync + assignment import

---

## Phase 7 — Intelligence Depth & Platform Maturity 🔨 (Building Now)

With all 9 life domains built, Phase 7 deepens the intelligence layer so VarsityOS stops being a collection of screens and becomes a system that genuinely understands each student's state across all domains simultaneously.

### 7A — Deep Signal Wiring (StudentState completeness)

The goal: every slice of StudentState reflects real data from the last 7 days — not placeholders.

| Slice field | Current | Phase 7 target |
|---|---|---|
| `wellness.moodTrend` | ✅ Computed from `varsityos-mood-cache` | Done |
| `wellness.moodAvg` | ✅ 0–5 average, 7-day rolling window | Done |
| `wellness.sleepDebt` | ✅ Computed from `sleep_logs` last 7d | Done — adds up to 20pts to burnout |
| `academic.studyVelocity` | ✅ Computed from `study_sessions` last 7d | Done — avg hrs/day |
| `wellness.burnoutScore` | ✅ Task + mood + sleep | Done |
| `financial.nsfasStatus` | ✅ `'delayed'` from `nsfas_disbursements.expected_date < today` | Done — `nsfasDelayed` in AppStore; triggers `nsfas_delayed` rule |

#### Implementation plan for sleep debt
```
1. Inngest cron (daily 06:00 SAST): read last 7 days from sleep_logs
2. Compute debt: sum(7h - actual_hours) for days where actual < 7h
3. Write to student_state_snapshots table
4. DashboardClient reads snapshot → passes sleepDebt to AppStore
5. initOrchestration picks it up → computeWellness uses it
```

#### Implementation plan for study velocity
```
1. On study_session_ended signal: call edge function to recompute velocity
2. Edge function: SELECT SUM(duration_minutes) FROM study_sessions WHERE user_id = X AND started_at > NOW()-7d
3. Convert to hours/day → write to profiles.study_velocity_7d
4. initOrchestration reads profiles.study_velocity_7d from AppStore
```

### 7B — Nova Proactive Intelligence

Current Nova: reactive (student asks, Nova answers).
Phase 7 Nova: proactive (Nova detects state changes, pushes insight without being asked).

```
StudentState changes         →  Rules engine fires
                             →  Queues intervention
                             →  Intervention rendered in UI (banner/modal) ✅ DONE
                             →  ALSO: if app backgrounded >4h, sends push notification
                             →  ALSO: once/day, Nova generates "your day in 3 points"
```

Components to build:
- ✅ `api/nova/proactive-brief` — Nova-generated daily brief from real StudentState JSON
- 🎯 `api/push/state-alert` — push triggered by rules engine when intervention is urgency ≥ 4
- ✅ DailyBrief upgrade — loads from `/api/nova/proactive-brief`, caches 24h, shows at first open

### 7C — Cross-Domain Correlation Engine

The "magic moment" where a student sees their own data telling a story:
```
"In weeks where you sleep 7+ hours, your task completion rate is 34% higher."
"Your mood drops every Tuesday — you have 3 lectures with no break. Consider a buffer."
"Your best study velocity happens at 19:00–21:00. Most of your Pomodoro sessions are at 22:00."
```

- ✅ `api/insights/correlations` — GET, auth-guarded; 30-day parallel queries (sleep_logs × study_sessions × tasks); 4-week buckets; 3 insight types: sleep-completion correlation, study-completion correlation, peak study time window
- ✅ `InsightsCard.tsx` — dashboard card showing up to 3 weekly insights with strength badges; 7-day localStorage cache; graceful "keep logging" empty state
- 🎯 Nova context injection — pass correlation summary to Nova system prompt so it references student's own patterns

### 7D — Offline-First CRUD

Target: Nomvula on 2G with 100MB remaining can still use VarsityOS at full functionality.

- 🎯 Tasks tab: full CRUD offline via IndexedDB + sync on reconnect (using `pendingWrites` queue already in codebase)
- 🎯 Flashcards: full SM-2 review offline — already mostly there
- 🎯 Pomodoro: sessions recorded offline, upload batch on reconnect
- 🎯 Timetable: read-only cached display

---

## Phase 7.1 — Intelligence Surface & Dashboard Cleanup ✅ (2026-06-13)

This sprint focused on two parallel goals: (1) surface the intelligence we've been computing from StudentState directly onto the dashboard in a proactive, ranked way, and (2) eliminate all hardcoded duplication in DashboardClient before the codebase grew any further.

### What shipped

#### Domain Pulse — Live-ranked Life OS on the dashboard
`src/components/dashboard/DomainPulse.tsx` (new, 280 lines)

Replaced the static `LifeOSSection` 2×9 tile grid with a live-scored Domain Pulse. Every session, all 9 life domains are scored 0–100 against real StudentState data:

| Domain | Signal used | Score drivers |
|---|---|---|
| Mind | `overdueTasks`, `nextExamDays`, `streakDays`, `streakTodayDone`, `todayStudyMins` | +55 for 3+ overdue; +45 for exam ≤2d; +28 for exam ≤7d; +22 streak at risk after 17:00 |
| Money | `remaining`, `totalBudget`, `nsfasDelayed` | +82 over budget; +68 for <R100; +48 for <20% remaining; +32 NSFAS delay |
| Body | `lastSleepHours`, `sleepDebt`, `weekWorkouts` | +52 for <5h sleep; +22 high sleep debt; +14 no workouts |
| Safety/Movement/Growth/Community/Work/Future | `activeGroups`, `shiftsThisWeek`, `weekWorkouts` | Baseline 5–16 until live data arrives for each |

**Render:** top 3 urgency domains → large pulse cards (left accent bar, health badge, headline, subline, action link). Remaining 6 → compact 3×2 navigation grid. Order recomputes every render as StudentState changes.

**Removed:** `LIFE_DOMAINS` constant (77 lines), `LifeOSSection` function (76 lines) — replaced entirely by `DomainPulse`.

#### Dashboard duplication — 6 categories eliminated

| Pattern | Before | After |
|---|---|---|
| Nav config | `FEATURE_CARDS` + `FEATURE_ICONS` + `MODULE_PILLS` defined inline 3 places | `NAV_MODULES` in `src/lib/navModules.ts` — single source of truth |
| Fetch + localStorage cache | Copy-pasted in `StudyTipsCard` and `CoachSummaryCard` | `useCachedFetch<T>` hook in `src/hooks/useCachedFetch.ts` |
| Date helpers | `toISODate` + day-of-week slot logic duplicated in `TodaysClasses` and `MobileTodayClasses` | `toISODate()` + `getTodaySlots()` defined once, used everywhere |
| Slot derivation | Manual `new Date()` math in both mobile and desktop class components | `getTodaySlots(timetable)` returns `{ slots, currentTime }` |
| Module-local constants | `TASK_CAT_STYLE` cluttering top of file | Moved inside `MobileTasksToday` where it's the only consumer |

#### Push notification SW — TS2353 fix
`worker/index.ts`: `renotify` not in `NotificationOptions` type in TypeScript's DOM lib. Fixed with `as NotificationOptions` type assertion instead of explicit type annotation.

#### Vercel build fix — untracked files
`InsightsCard.tsx`, `api/insights/correlations/route.ts`, and `api/nova/proactive-brief/route.ts` were created locally but never committed — every Vercel deploy since their import was added was silently broken. Committed all three in a single fix commit (`d6ca96e`). Build green.

### Commits this sprint
```
5427af9  feat: Domain Pulse — 9 life domains ranked by urgency on dashboard
d6ca96e  fix: add untracked InsightsCard and API routes missing from repo
2249e54  refactor: extract shared dashboard patterns (useCachedFetch, getTodaySlots)
5ef523d  refactor: deduplicate dashboard nav config and date helpers (NAV_MODULES)
```

### Phase 7 completion status — COMPLETE ✅
| Subsystem | Status |
|---|---|
| 7A — Deep Signal Wiring (StudentState completeness) | ✅ All 5 signals live |
| 7B — Nova Proactive Intelligence | ✅ proactive-brief + push notifications + rules engine done |
| 7B — Push state-alert endpoint | ✅ `/api/push/state-alert` — cooldown via push_cooldowns, admin client, urgency gate |
| 7C — Cross-Domain Correlation Engine | ✅ InsightsCard + correlations API done |
| 7C — Nova context injection | ✅ 30-day patterns from localStorage cache injected into Nova system prompt |
| 7D — Offline-First CRUD | ✅ Add/toggle/delete all offline-capable; sync-on-reconnect via `online` event |
| Domain Pulse (new in 7.1) | ✅ Shipped |

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
| 2026 | Mood data from localStorage cache, not API | `varsityos-mood-cache` already written by MoodCheckin; no extra Supabase call needed for StudentState |
| 2026 | `mood_logged` signal → recompute instead of polling | Rules engine reacts instantly when mood changes; no polling needed |
| PERMANENT | NEVER use Supabase MCP for VarsityOS | VarsityOS is on a DIFFERENT Supabase account from MCP-connected one. All DB changes go in `supabase/migrations/` for manual execution in Supabase SQL editor |

---

## Supabase Migration Log

All migrations must be run manually in the VarsityOS Supabase SQL editor (NOT via MCP).
Next migration number: **000021**

| File | Status | Description |
|---|---|---|
| `20260101000001_master.sql` | ✅ Run | Core schema: profiles, budgets, expenses, tasks, modules, exams, timetable |
| `20260101000002_all_fixes.sql` | ✅ Run | Schema fixes |
| `20260101000005_missing_tables.sql` | ✅ Run | Additional core tables |
| `20260612000001_gamification_and_wellness.sql` | ✅ Run | XP, streaks, wellness, mood_checkins |
| `20260612000002_notes_view_count_and_feed_moderation.sql` | ✅ Run | Notes view count, feed moderation |
| `20260612000003_campus_life_os.sql` | ✅ Run | Campus life, events, study groups |
| `20260612000004_orchestration_signals.sql` | ✅ Run | signal_events, intervention_log, daily_plans |
| `20260612000005_nsfas_tracker.sql` | ✅ Run | nsfas_tracker, disbursement records |
| `20260613000001_textbook_marketplace.sql` | ✅ Run | textbook_listings, textbook_transactions |
| `20260613000002_alumni_mentor_network.sql` | ✅ Run | mentors, mentor_sessions, mentor_reviews |
| `20260613000003_study_groups.sql` | ✅ Run | study_group_members, study_sessions (group) |
| `20260613000005_nutrition_sleep_logs.sql` | ✅ Run | nutrition_logs, sleep_logs |
| `20260613000006_full_sync_tables.sql` | ✅ Run | Cross-device sync tables |
| `20260613000007_mentors_and_textbooks.sql` | ✅ Run | Extended mentor + textbook schema |
| `20260613000008_movement_os.sql` | ✅ Run | routes, places, commute_logs |
| `20260613000010_profile_bio_avatar.sql` | ✅ Run | Bio and avatar on profiles |
| `20260613000011_pricing_v2.sql` | ✅ Run | Subscription tiers v2 |
| `20260613000012_atomic_nova_increment.sql` | ✅ Run | `try_use_nova_message` RPC |
| `20260613000013_cloud_sync_tables.sql` | ✅ Run | nova_conversations, user_goals, user_habits_state, push_cooldowns |
| `20260613000014_attendance_tracker.sql` | ✅ Run | attendance_records (UNIQUE per user+module+date) |
| `20260613000015_nsfas_disbursements.sql` | ✅ Run | nsfas_disbursements for Inngest late-payment alert |
| `20260613000016_graduation_modules.sql` | ✅ Run | graduation_modules, degree_config |
| `20260613000017_skill_progress.sql` | ✅ Run | skill_progress JSONB map |
| `20260613000018_institutions.sql` | ✅ Run | institutions, institution_admins, institution_invites; profiles.institution_id |
| `20260614000019_study_pods.sql` | ✅ Run | study_pod_profiles, study_pod_connections; RLS policies |
| `20260614000020_institution_broadcasts.sql` | ✅ Run | institution_broadcasts; admin SELECT + INSERT RLS |

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
