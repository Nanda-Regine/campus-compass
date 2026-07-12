# VarsityOS — Master Build Roadmap & Journal

> *"Umuntu ngumuntu ngabantu — I am because we are"*
>
> Built by **Nanda Regine** · Mirembe Muse Pty Ltd
> Last updated: 2026-06-19 (Phase 21 ✅ complete — Full dopamine-architecture gamification system: Domain Flames, Compound Day, Mystery Box, Archetype, Pending XP, Chapters, Pod Feed; migration 000046; commit 936c3d7)

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
API: Open-Meteo (free, no key) + OpenAQ v2 for PM2.5 air quality — Phase 13
Previously OpenWeatherMap (removed Phase 13; OPENWEATHER_API_KEY no longer needed)
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

### ✅ Phase 10 — Growth & Reach (Complete)

**Sprint date: 2026-06-14**

1. ✅ **10A: Nova multi-modal** — Already fully implemented (image capture → Claude Vision API → UI camera button). Confirmed complete, no rebuild needed.
2. ✅ **10B: Parent/Guardian view** — Magic-link read-only dashboard. `guardian_access_tokens` table (migration 000023, 90-day expiry, max 5 per student). Public `/guardian/[token]` page (server component, no auth). Token management UI in Profile → Account tab (`GuardianAccess.tsx`). Privacy: first name only, no rand amounts, risk levels not raw data. API routes: GET/POST `/api/guardian/tokens`, DELETE `/api/guardian/tokens/[id]`, GET `/api/guardian/[token]` (admin client).
3. ✅ **10C: Cohort comparison** — Anonymous peer benchmarking. `/api/insights/cohort` (admin client, min 5 peers anonymity threshold). Metrics: streak percentile, study velocity percentile, task completion percentile. `CohortCard.tsx` on dashboard with 10-min sessionStorage cache, PercentileBar components, silently hides if cohort too small.
4. ✅ **10D: TVET college support foundation** — `tvet_nsfas` funding type added to Profile funding options. `NsfasTrackerOS` accepts `fundingType` prop; shows TVET-specific info banner with 2025/26 DHET allowance amounts (living, transport, books, meals, clothing) and N-level progression rule. BudgetClient passes `fundingType={initialData.profile?.funding_type}` to NsfasTrackerOS.
5. 📋 **10E: LMS integrations** — Blackboard, Moodle, Canvas webhooks for grade sync + assignment import (backlog — requires institutional partnerships)

### Phase 10 — What Was Also Shipped (Phase 7.3 Quick Wins)

Shipped in the same sprint as Phase 10 groundwork:
- ✅ **7.3a: `attendance_marked` signal** — AttendanceTab emits signal on every mark; StudentState re-runs recompute
- ✅ **7.3b: `grade_below_pass` rule** — Urgency-4 rule fires when `lowestGrade > 0 && lowestGrade < 50`; `lowestGrade` field added to AcademicSlice; localStorage cache `varsityos-grade-cache` feeds initial value
- ✅ **7.3c: Rules engine push** — Switched from `/api/push/notify` to `/api/push/state-alert` with DB-backed cooldowns (ruleId, urgency, cooldownHours)
- ✅ **7.3d: Correlation insights → Nova** — `patternInsights[]` computed from existing study sessions (no extra DB query); peak study window + burnout pattern injected into Nova system prompt via `novaContext.patternInsights`

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

## Phase 7.2 — Ubuntu OS: Cross-Domain Intelligence & Nervous System Stability 🔨 (2026-06-14)

> *"Think about what in the app feeds into what and how we can contribute to stable nervous systems through this Life OS."*
> — Nanda Regine, 2026-06-14

This sprint closes the most critical gap in VarsityOS: the app knew everything **within** domains but nothing **between** them. A student working 30 hours, burning out, with an exam in 4 days and R50 left saw four separate warnings. This sprint gives them one compound view — and the OS starts learning what these signals mean **together**.

### The Ubuntu Principle Applied to Data Flow

Ubuntu: "I am because we are." A student's Mind is not separate from their Body, which is not separate from their Money. A student working night shifts is a different student than one who isn't — they have less sleep, less study time, more financial security, but more burnout risk. The OS must see them whole.

**10 cross-domain connection gaps identified in the data flow audit:**

| Gap | What was missing | Risk |
|---|---|---|
| Work shifts → Budget | Shift earnings not included in budget calculations | Budget showed fake deficit |
| Work shifts → Dashboard | Income from work not in dashboard total | Wrong financial picture |
| Work shifts → AI insights | Budget AI ignored shift earnings entirely | Wrong spending advice |
| Work hours → Burnout score | Working 30h/week had zero burnout contribution | Burnout underestimated |
| Work hours → Nova context | Nova didn't know if student was working | Advice ignored life reality |
| Mood → Nova context | Nova didn't know student's mood trend | Generic advice regardless of emotional state |
| Compound signals → Rules engine | burnout + exam + budget failures seen separately | No crisis-level compound intervention |
| Flashcards → DB | Flashcards lost on session close (no persistence) | SM-2 algorithm wasted |
| Calendar events → Personal life | No way to add gym/church/errands to timetable | Work/life not visible together |
| Budget AI → Work earnings | Insights route didn't know about income | Bad financial health scoring |

### What shipped

#### Monetary System — Full interconnection ✅

**`src/app/dashboard/page.tsx`**: Fetches `work_shifts` (status=worked, current month) with earnings, start_time, end_time. Computes `shiftEarnings` (total rand) + `shiftHoursThisWeek` (hours in current week from time diff). Both passed to DashboardClient.

**`src/components/dashboard/DashboardClient.tsx`**: 
- `shiftHoursThisWeek` seeds `varsityos-work-hours-cache` localStorage on mount (same pattern as mood cache) so the orchestration layer picks it up on every StudentState recompute.
- `manualIncome + shiftEarnings = totalIncome` → `totalBudget = baseBudget + totalIncome`.
- DomainPulse shows "⚡ Rx earned" label on Money domain when shifts > 0.

**`src/components/budget/BudgetClient.tsx`**: Wallet tab groups shift earnings by employer, shows shift count + earnings, links to /dashboard/work.

**`src/app/api/budget/insights/route.ts`**: Budget AI now knows `baseBudget`, `shiftEarnings`, `manualIncome`, `totalBudget` — gives advice on real total, not just allowance.

#### Personal Calendar Events ✅

**Migration `20260614000022_custom_calendar_events.sql`**: `calendar_events` table (user_id, title, event_date, start_time, end_time, category, color, notes). RLS.

**`src/components/study/CalendarTab.tsx`**: 8-category personal events (gym, cooking, study, social, errands, self_care, church, other) with colour-coded EventBlock components, optimistic CRUD, bottom-sheet modal, category chips. Work shifts appear as purple ShiftBlock. Full week view now shows a student's complete life — classes + study + work + personal.

**`src/app/study/page.tsx`**: Fetches `calendar_events` for ±90 day window and passes to CalendarTab.

#### Flashcard Persistence ✅

**Migration `20260614000021_flashcard_tables.sql`**: `flashcard_decks` + `flashcard_cards` with SM-2 fields (interval_days, ease_factor, repetitions, next_review, last_review). RLS. Cards now survive sessions.

#### Wellness into StudentState ✅

**`src/store/studentState.ts`**:
- `WellnessSlice` gets `workHoursThisWeek: number`
- `RecomputeInput` gets `workHoursThisWeek?: number`
- `computeWellness()`: work hours > 20h/week → up to 15 pts added to burnout score
- `readWorkHoursCache()`: reads from `varsityos-work-hours-cache` (same pattern as `readMoodCache`)
- `initOrchestration()`: passes `workHoursThisWeek: readWorkHoursCache()` to every recompute
- `burnout_computed` signal emitted after every recompute (was previously a dead signal)

#### Cross-Domain Rules — 6 new rules ✅

**`src/lib/rules.ts`** — Added compound-aware rules that REPLACE four separate warnings with one compound view:

| Rule | Urgency | Cross-domain trigger |
|---|---|---|
| `compound_crisis` | 5 (modal) | burnout > 60 AND exam pressure ≥ 65 AND runway < 14d |
| `work_exam_collision` | 4 (banner) | workHoursThisWeek ≥ 20 AND examPressure ≥ 65 |
| `burnout_exam_trap` | 4 (banner) | burnout > 55 AND examPressure ≥ 65 AND sleepDebt ≥ 5h |
| `mood_cascade_risk` | 4 (banner) | mood declining AND avg < 2.8 AND burnout > 40 OR academic risk |
| `money_stress_academic_drain` | 3 (banner) | emergency mode AND academic risk ≠ safe |
| `movement_recovery_nudge` | 2 (nudge) | mood < 2.8 AND burnout > 35 → "move your body" |

**The compound_crisis rule is the most important:** for the first time, VarsityOS can detect when a student is failing across 3 domains simultaneously and escalate to a crisis modal instead of three separate quiet banners.

#### Nova Wellness Context ✅

**`src/lib/nova/context.ts`**:
- New `NovaWellnessContext` type: `{ moodAvg, moodTrend, workHoursThisWeek, workShiftsThisWeek, burnoutProxy }`
- `buildNovaContext()` now fetches `mood_logs` (last 7 days) + `work_shifts` (last 7 days, status=worked) in the same `Promise.all`
- Computes `burnoutProxy`: mood deficit + work overload + overdue tasks
- `formatNovaContext()` adds **Wellness & Work** section to every Nova prompt:
  ```
  Mood avg: 3.2/5 (declining). Work: 3 shifts (≈18h) this week. Burnout risk moderate (42/100).
  ```
  When burnout > 60: `⚠️ Burnout risk HIGH — prioritise recovery in your advice.`

Nova now gives burnout-aware, work-aware advice for the first time.

### The data flow after this sprint

```
work_shifts (Supabase)
  → dashboard/page.tsx: shiftEarnings + shiftHoursThisWeek
    → DashboardClient: totalIncome + totalBudget (display)
    → localStorage: varsityos-work-hours-cache (weekHours, weekOf)
      → initOrchestration: workHoursThisWeek in every recompute
        → computeWellness: burnoutScore += work hours overload penalty
          → signals.emit('burnout_computed') [was dead signal — now live]
          → rules engine: compound_crisis, work_exam_collision, burnout_exam_trap
          → Nova context: burnoutProxy, workHoursThisWeek, moodTrend in every prompt

mood_logs (Supabase)
  → buildNovaContext: moodAvg + moodTrend
    → formatNovaContext: Wellness & Work section
      → Nova advice adapts to emotional state in real-time
```

### What this means for Nomvula

Before this sprint, VarsityOS saw four separate problems:
- "3 tasks overdue" (academic warning)
- "R80 left" (budget warning)  
- "burnout score 72" (wellness warning)
- "shift tomorrow" (schedule entry)

After this sprint, VarsityOS sees ONE compound reality:
- **compound_crisis fires**: "Mind, money, and body all under pressure at once. Burnout 72/100. Exam pressure 85/100. 3 days of money left. This is the #1 reason students drop out. Let Nova help you triage right now."

One intervention. The whole person. Ubuntu.

### ✅ Phase 7.3 — Quick Wins (Complete 2026-06-14)
- ✅ `attendance_marked` signal emitted from AttendanceTab on every mark; StudentState recomputes
- ✅ `grade_below_pass` urgency-4 rule (lowestGrade > 0 && < 50); lowestGrade in AcademicSlice; localStorage cache feed
- ✅ Rules engine push switched to `/api/push/state-alert` with DB-backed cooldowns
- ✅ Correlation pattern insights → Nova system prompt via `patternInsights[]`

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
| `20260614000021_flashcard_tables.sql` | ✅ Run | Flashcard tables |
| `20260614000022_custom_calendar_events.sql` | ✅ Run | Custom calendar events |
| `20260614000023_guardian_access_tokens.sql` | ✅ Run | guardian_access_tokens; 90-day expiry; max 5 per student; admin client for public guardian page |
| `20260615000001_varsityos_amplification.sql` | ✅ Run | Amplification sprint: 15 tables — regulation_sessions, nervous_system_scores, past_papers, cycle_tracking, safe_walk_sessions, data_budget, health_conditions, wisdom_posts, wisdom_votes, mutual_aid_requests, study_accountability, walking_routes, user_values, safety_incidents, side_hustle_entries — all with RLS |
| `20260615000002_commitment_contracts.sql` | ✅ Run | Commitment contracts table with RLS |
| `20260615000003_procrastination_journal.sql` | ✅ Run | Procrastination profiler journal entries |
| `20260615000004_community_challenges.sql` | ✅ Run | Community challenges + participant join table |
| `20260615000005_profile_personalization.sql` | ✅ Run | Profile personalization columns (avatar, theme, pronouns) |
| `20260616000001_institution_international_support.sql` | ✅ Run | International student support columns on profiles |
| `20260616000002_lms_integrations.sql` | ✅ Run | LMS integration tokens and webhook state |
| `20260616000003_discussion_boards_and_emergency_contacts.sql` | ✅ Run | Group + stokvel discussion threads; emergency contacts with Supabase insert/delete |
| `20260616000004_assignment_messages_stokvel_board.sql` | ✅ Run | Assignment DMs and stokvel discussion board |
| `20260616000005_income_entries_nsfas_link.sql` | ✅ Run | Income entries linked to NSFAS disbursement reference |
| `20260616000006_study_accountability_fix.sql` | ✅ Run | `streak_days`, `updated_at` trigger, `university` column on study_accountability; full RLS |
| `20260616000007_timetable_slots_label.sql` | ✅ Run | `label` column on timetable_slots (ICS import subject name) |

Next migration number: **000036**

---

## Phase 11 — Engagement & Monetisation Hardening ✅ (2026-06-14)

| Item | Status | Detail |
|---|---|---|
| Streak nudge cron | ✅ | Inngest 21:00 SAST — fires for streak ≥ 3 students who haven't opened today; 20h cooldown via push_cooldowns; 500/run cap |
| Sunday planner reminder | ✅ | Inngest 19:00 SAST every Sunday — skips users with existing weekly_plan; 6-day cooldown; 500/run cap |
| Paywall hardening | ✅ | `UpgradePromptModal.tsx` + `useUpgradePrompt()` hook — Nova quota hit opens modal instead of toast; Study Pods join gated for free users; FlashcardsTab cloud sync gated (free = localStorage only with banner) |
| Referral flow | ✅ | Referral code generation, claim endpoint, attribution on signup |
| ICS timetable import | ✅ | Confirmed fully implemented: `ICSImportButton` + `/api/timetable/import-ics` with SSRF guard, 2MB cap, preview+confirm, RRULE support, SAST timezone |

---

## Phase 12 — Intelligence Layer for New Rooms ✅ (2026-06-15)

Wired the 10 amplification-sprint rooms into the core orchestration layer so every user action feeds burnout score, rules engine, and Nova context.

### Signal bus additions
```ts
| { type: 'regulation_completed'; payload: { sessionType: string; durationSeconds: number } }
| { type: 'ns_score_updated';     payload: { score: number } }
| { type: 'cycle_phase_logged';   payload: { phase: string; energyLevel: number | null } }
```

### StudentState — WellnessSlice additions
- `regulationSessionsToday` — regulation recovery bonus (up to −16 pts from burnout)
- `nsScore` — 60/40 blend with burnout proxy
- `cyclePhase` / `cycleEnergyLevel` — menstrual cycle-aware energy adaptation

### 6 new rules
| Rule | Urgency | Trigger |
|---|---|---|
| `ns_score_critical` | 4 | nsScore < 30 |
| `exam_week_regulate` | 4 | burnout > 65 AND examPressure ≥ 65 AND no regulation today |
| `suggest_regulation` | 3 | burnout > 55 AND no regulation today |
| `cycle_low_energy_adapt` | 2 | menstrual/luteal phase AND energyLevel ≤ 2 |
| `regulation_reward` | 1 | regulationSessionsToday ≥ 2 |
| `cycle_peak_window` | 1 | cyclePhase = ovulation |

### Nova context extensions
4 new parallel fetches (regulation_sessions, NS scores, cycle_tracking, safety_incidents last 48h) → nsNote, regulationNote, cycleNote, safetyNote sections in every prompt.

### Supabase — Amplification Migration (000024)
15 new tables executed: `regulation_sessions`, `nervous_system_scores`, `past_papers`, `cycle_tracking`, `safe_walk_sessions`, `data_budget`, `health_conditions`, `wisdom_posts`, `wisdom_votes`, `mutual_aid_requests`, `study_accountability`, `walking_routes`, `user_values`, `safety_incidents`, `side_hustle_entries` — all with RLS.

---

## Phase 13 — Open APIs + Client Intelligence ✅ (2026-06-15)

Four zero-API-key integrations. No new paid dependencies.

### 13A — Open-Meteo Weather (replaces OpenWeatherMap)
- `src/app/api/weather/route.ts` fully rewritten
- Geocoding via `geocoding-api.open-meteo.com` — falls back to 16 hardcoded SA city coordinates
- Single Open-Meteo call: current temp/UV/humidity/wind/precip/weather-code + 2-day daily forecast (vs. 3 separate OWM calls)
- WMO weather-code decoder covers all 30+ codes including SA-relevant fog, drizzle, thunderstorm-with-hail
- **`OPENWEATHER_API_KEY` env var no longer needed** — remove from Vercel + `.env.local`
- Same response shape → `WeatherWidget` works unchanged

### 13B — OpenAQ Air Quality
- New `air_quality` field on the weather response
- `https://api.openaq.org/v2/latest?coordinates={lat},{lon}&radius=50000&parameter=pm25` — no key required
- PM2.5 → AQI category with SA-contextualised advice strings (4 risk tiers + "stay indoors" for very unhealthy)
- Best-effort: response is `null` if OpenAQ is unreachable, weather still returns normally

### 13C — Tesseract.js v7 OCR
- New **"Scan" tab** in `PastPaperVault` — before Upload, after tab bar
- Mobile camera capture: `<input type="file" accept="image/*" capture="environment">`
- Data-usage warning before first run (~8MB WASM + language pack download) — critical for Nomvula's prepaid plan
- Dynamic `import('tesseract.js')` — zero SSR bundle impact; WASM loaded only when user taps "Scan anyway"
- Live progress bar (0–100%) during recognition
- Extracted text auto-populates the Upload form's `extracted_text` field → 1.2s redirect to Upload tab
- **Privacy**: OCR runs entirely on-device; no image is sent to any server

### 13D — React Flow Orbit Map (@xyflow/react v12)
- New component: `src/components/study/ModuleOrbitMap.tsx`
- New tab in StudyClient: "Orbit Map" (⊙ icon, indigo accent)
- Layout: centre node = student (🎓), inner orbit (r=152) = registered modules colour-coded by `module.color`, outer orbit (r=280) = upcoming exams
- Edges: solid for centre→module; dashed amber for module→exam; animated red pulse for exams ≤7 days away
- Fully read-only: `nodesDraggable={false}`, `panOnDrag={false}`, `zoomOnScroll={false}`, `fitView`
- Empty state when no modules registered

### Commit
```
1d29613  feat: Open-Meteo weather, OpenAQ air quality, Tesseract OCR, React Flow orbit map
```
**Vercel deploy:** `dpl_5MAVowvbkLTRMhkqMfR3z9H4Vuix` — triggered automatically from GitHub push on 2026-06-15.

---

## Phase 14 — Bug Sweep ✅ (2026-06-15)

21 bugs fixed across Phase 12 + 13 builds. All TypeScript clean.

| Bug | Fix |
|---|---|
| Burnout trend always shows "stable" | Fixed trend direction logic — compares latest vs earliest score in window, not adjacent pairs |
| Grade cache ratchet — grade never drops | Removed `Math.max` guard; cache now overwrites with latest DB value on every fetch |
| Signal handler leak | `useEffect` cleanup now calls `signals.off()` for all registered handlers |
| NSScore formula mismatch | Unified 60/40 blend between raw burnout proxy and nervous system session score |
| Upsert error unguarded in amplification routes | All upserts wrapped in try/catch; errors return 500 with structured JSON |
| WMO weather code gap (codes 80–82 missing) | Added shower codes to WMO decoder map |
| Timezone bug in exam filter | All exam date comparisons normalised to SAST (`Africa/Johannesburg`) before comparison |
| Missing `TabErrorBoundary` labels on 8 tabs | All tabs now have named `label=` prop so errors show the correct tab name |

---

## Phase 15 — Security & Correctness Sprint ✅ (2026-06-15)

23 security and correctness fixes. Commit: `f3109f3`.

**Root cause discovered:** Dashboard loading failures traced to webpack file-watcher corruption caused by OneDrive syncing the `.next/` cache — fixed by adding `.next/` to OneDrive exclusions.

| Category | Fix |
|---|---|
| Mass-assignment | All API routes now whitelist accepted body fields; extra keys ignored |
| Unauthenticated GETs | 6 API routes missing auth guard now check session before any DB query |
| `setInterval` leak | All polling intervals (`usePushNotifications`, weather widget) clear on unmount |
| WhatsApp HMAC bypass | Signature verification uses `timingSafeEqual` — prevents timing attacks on the webhook |
| PayFast UUID validation | ITN webhook rejects any `m_payment_id` that is not a valid UUID |
| PayFast NaN amounts | Amount fields validated with `Number.isFinite()` before processing |
| PayFast sensitive logging | Removed `console.log` of full ITN payload; logs only `m_payment_id` + status |

---

## Phase 16 — QA Hardening ✅ (2026-06-15)

Profile, pagination, and mobile fixes. All TypeScript clean.

### Profile load/save
- Null profile on first login no longer returns 404 — server component returns empty profile shape; client creates on first save
- Bio update allowlisted: only `bio`, `university`, `year_of_study`, `faculty`, `major`, `funding_type`, `avatar_url`, `theme`, `pronouns` accepted
- Fetch error from profile API now shows user-facing toast instead of blank page

### Pagination limits
- 10 list pages capped at 50 items max (previously unbounded)
- 5 API routes now enforce `limit = Math.min(requested, 100)` to prevent scraping

### Mobile responsiveness
- Vertical side rails stable on iOS Safari (safe-area-inset applied to bottom padding)
- Tab content areas no longer clip on screens narrower than 375px
- `ICSImportButton` preview table horizontally scrollable on mobile

### Offline
- `CACHED_PAGES` expanded from 6 → 14 routes — timetable, meals, safety, movement, career, growth all pre-cached on install

---

## Phase 17 — Social OS + Hustle Layer ✅ (2026-06-16)

80+ bugs fixed across 3 commits. New rooms wired to Supabase and to Nova context.

### What shipped

#### Safety Reports → Supabase
`SafetyClient.tsx` incident report form now inserts to `safety_incidents` table. Map overlay fetches and pins recent incidents. Incidents feed into Nova context via Phase 12's `safetyNote`.

#### Group + Stokvel Discussion Boards
Migration `000031` (discussion_boards_and_emergency_contacts): `discussion_threads` + `discussion_posts` tables with RLS.
- Group rooms show threaded discussion board: create thread, reply, delete own posts
- Stokvel board: same component re-used with `board_type='stokvel'`
- Nova can reference recent group discussion topics in advice

#### Hustle Side Nav
`HustleClient.tsx` — new side rail with 5 tabs: Ideas, Journal, Funding, Invoices, Income. Side Hustle entries wired to `side_hustle_entries` table. Income tracked separately from main budget.

#### Study Velocity Rescue Mode
When `studyVelocity < 0.3 hrs/day` for 3+ consecutive days AND exam pressure ≥ 50:
- New rule `study_velocity_critical` (urgency 4) fires
- CatchUpPlanner auto-opens with Nova pre-populated with rescue prompt
- Rescue mode badge shown in StudyVelocityTab

#### Emergency Contacts → Supabase
SOS contacts previously hardcoded. Now read from and written to `emergency_contacts` table. Three-contact limit enforced at DB level via CHECK constraint.

### Migrations
| File | Number | Description |
|---|---|---|
| `20260616000003_discussion_boards_and_emergency_contacts.sql` | 000031 | Discussion threads + emergency contacts with RLS |
| `20260616000004_assignment_messages_stokvel_board.sql` | 000032 | Assignment DMs + stokvel board |
| `20260616000005_income_entries_nsfas_link.sql` | 000033 | Income entries linked to NSFAS reference |

---

## Phase 18 — Polish, Live APIs & Push Activation ✅ (2026-06-16)

Five features that were scaffolded but non-functional made fully live.

### 18A — Accountability Partner (Fix)

`src/components/community/AccountabilityPartner.tsx` — complete rewrite (~450 lines).

**What was broken:** university field missing from insert + filter, partner names showed raw UUIDs, streak never incremented, RLS blocked all reads.

**What shipped:**
- University auto-loaded from `profiles` on mount; passed to insert and to the open-goals filter so users only see goals from their own institution
- Partner names batch-fetched: `.from('profiles').select('id, name').in('id', requesterIds)` — single query for all visible goals
- Streak logic: `streak_days` column + `updated_at` trigger (migration 000034). Days computed from consecutive check-in dates; resets to 0 on missed day
- Accept guard: `.is('partner_id', null)` on UPDATE prevents two users accepting simultaneously (race condition)
- Three tabs: Find (open goals from same university), Active (your current partnership), History (completed/expired)

Migration `20260616000006_study_accountability_fix.sql` (000034): adds `streak_days`, `updated_at` trigger, `university`; enables RLS with correct policies.

### 18B — ICS Timetable Import (Fix)

**What was broken:** all imported slots showed "Class" (no subject name); re-importing created duplicates; no way to clear old timetable before import.

**What shipped:**
- Migration `20260616000007_timetable_slots_label.sql` (000035): adds `label text` column to `timetable_slots`
- `src/types/index.ts`: `label: string | null` added to `TimetableEntry` interface
- `src/app/api/timetable/import-ics/route.ts`: sets `label: summary || null` on every slot; accepts `replace?: boolean` in request body; when `replace=true`, deletes all existing slots for the user before inserting
- `src/components/study/ICSImportButton.tsx`: "Replace existing timetable" checkbox (red border when checked), warning banner on preview step, confirm button shows `Replace & import N entries` vs `Import N entries`
- `src/components/study/TimetableTab.tsx`: grid label shows `module_name ?? entry.label ?? 'Class'` — ICS subject name surfaces when no module is matched

### 18C — Nova Multi-Modal (Fix)

**What was broken:** `capture="environment"` on the file input locked iOS users to camera only (no gallery access); `max_tokens: 1024` truncated image answers; no paste-from-clipboard support.

**What shipped:**
- `src/app/nova/page.tsx`: removed `capture="environment"` → mobile users see camera + gallery chooser
- Added `handlePaste` on the textarea — detects image items in clipboard, compresses and sets as pending image (same `compressImage` pipeline as camera capture)
- Textarea placeholder switches to `'Add a question about your image…'` when image is pending
- `src/app/api/nova/route.ts`: `max_tokens: imageData ? 2048 : 1024` — vision answers no longer truncated

### 18D — Push Notifications (Activation)

**What was blocking:** the entire push notification system (service worker, `usePushNotifications` hook, `/api/push/subscribe` + `/api/push/notify` + `/api/push/state-alert` routes, Inngest cron functions) was fully built but had no VAPID keys — every subscription call threw a 500.

**What shipped:**
- Generated VAPID key pair via `npx web-push generate-vapid-keys`
- Added `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` to `.env.local` and Vercel environment variables
- Push notifications now fully live: streak nudge (21:00 SAST), Sunday planner reminder, rules engine state-alerts (urgency ≥ 4)

No code changes — keys only.

### 18E — Adzuna SA Jobs (Upgrade)

`src/components/career/CareerClient.tsx` — `JobsTab` upgraded from blank empty state to a live, filterable job feed.

**What was broken:** auto-load on mount missing; raw HTML in descriptions; no filters; no pagination; no NSFAS income warning; no posted date.

**What shipped:**
```typescript
const QUICK_FILTERS = [
  { label: '🎓 Graduate',   q: 'graduate programme' },
  { label: '📋 Internship', q: 'internship' },
  { label: '🏆 Learnership',q: 'learnership' },
  { label: '⏰ Part-time',  q: 'part time' },
  { label: '🌍 Remote',     q: 'remote work from home' },
  { label: '💻 Tech',       q: 'software developer engineer' },
] as const
```
- Auto-loads `graduate internship learnership` on mount
- `stripHtml()` helper decodes HTML entities + strips tags from Adzuna descriptions
- `timeAgoJob()` shows "2h ago", "3d ago" relative dates
- `fmtSalary()` formats `salary_min/max` as "R300k – R400k p/a"
- **NSFAS warning badge**: ⚠️ shown when `salary_min > 79_080` (NSFAS annual allowance threshold) — warns student that accepting could affect bursary
- Pagination: "Load 12 more" button; `doSearch(q, loc, page, append=true)` merges results; 5-page cap
- Six filter chips with active state; tapping a chip reruns search with that query

### Commits this sprint (Phase 18)
```
[accountability-partner]  fix: university filter, profile names, streak RLS on study_accountability
[ics-import]             fix: label column, replace option for ICS timetable import
[nova-vision]            fix: remove capture=environment, add paste handler, double vision token limit
[push-notifications]     chore: activate push notifications with generated VAPID keys
[adzuna-jobs]            feat: auto-load, quick filters, pagination, NSFAS warning on JobsTab
```

---

## Phase 19–20 — Life Arc, Presence & Multilingual Onboarding ✅ (2026-06-17)

### 19A — Student Lifecycle Arc
Housing OS (`/housing`), Launch Pad OS (`/launchpad`), Alumni Bridge (Ubuntu loop). Year-aware dashboard nudge. Referrals → XP. 26 SA university outcomes. Social side rail + Clubs + Focus rooms. Migrations through 000039.

### 19B — Campus Presence ("Who's Around Now")
Migration 000041: `presence` table with RLS. `/api/presence` upsert + read. Social OS "Around" tab shows students currently on campus — warm, not surveillance. Heartbeat every 60s.

### 20A — Study Pods + Sidebar Restructure
Study Pods free tier (removed Nova Scholar paywall). Timetable-aware matching: shared slots +2, preferred_times string overlap +2, modules ×10. Sidebar restructure: MONEY section, 6 previously unreachable pages surfaced.

### 20B — Multilingual Onboarding Tour
SetupFlow language picker (EN/ZU/XH/AF/ST/TN). `/tour` with `TourWizard.tsx` — 6 domains × 6 languages = 36 localised screens. Ubuntu philosophy woven through every domain intro. Redirects to dashboard after completion.

---

## Phase 21 — Dopamine-Architecture Gamification System ✅ (2026-06-19)

### The Design Question

The brief was deceptively simple: *"make the gamification dopamine-hitting, addictive, and fun — the deep meaning is habit building for all domains of life so students grow into well-functioning, stable, hard-working adults."*

This required resolving a genuine tension: **addictive mechanics vs. compassionate design for burned-out, resource-constrained students**. The resolution was to borrow the mechanics of dopamine loops but redirect them toward habits that compound over a student's life — not toward the app itself.

### The Psychology Stack

Every mechanic maps to a peer-reviewed framework:

| Mechanic | Framework | Why it works |
|---|---|---|
| Domain Flames with Shields | Kahneman loss aversion + Compassion | Shields mean a missed day costs one of two weekly tokens, not a streak reset. Students keep streaks without anxiety spirals. |
| Compound Day | Csikszentmihalyi Flow + Ubuntu | Being in multiple life domains in one day IS flow. The burst overlay is a cultural moment, not a score. |
| Mystery Box | Skinner variable ratio reinforcement | Unpredictable reward schedules produce the strongest response rates. But all outcomes are *positive* (no punishment). |
| Archetype System | Atomic Habits identity layer | James Clear: "Every action is a vote for who you want to become." The archetype card names who the student *is this week*, making identity the habit carrier. |
| Pending XP | Kahneman pre-ownership (endowment effect) | "220 XP waiting tonight" creates ownership of unearned XP. Missing it feels like a loss — loss aversion without negative framing. |
| Semester Chapters | Hengchen Dai Fresh Start Effect | Students are more likely to start habits after temporal landmarks. Each semester chapter is a fresh start at scale. |
| Pod Activity Feed | Ryan & Deci Self-Determination Theory (Relatedness) | Seeing a pod member's compound day is Ubuntu in action — motivation through connection, not competition. |

### Architecture Decisions

**1. Domain-agnostic event mapping** — Rather than hard-coding which screens increment which streak, we built `DOMAIN_EVENTS` as a lookup table in `xp-engine.ts`. Any future feature that dispatches an existing XP event automatically increments the right domain streak with zero code changes.

**2. Auto-detection in dispatchXP** — `checkAndFireCompoundDay()` is appended to the end of `dispatchXP()`. This means compound day detection is a consequence of the existing XP system, not a parallel one. No feature needs to know about compound days to trigger them.

**3. Variable-ratio without randomness in build** — `rollMysteryBox()` uses `Math.random()` at claim time (client-side, user-triggered), not at build or seed time. This is correct: the unpredictability is the point, and it belongs in the UX layer, not the data layer.

**4. Shields are real data** — `domain_streaks JSONB` in `profiles` stores `{ streak, last_date, shields, best }` per domain. Shields are decremented in the API route, not client-side, so they can't be gamed via localStorage manipulation.

**5. Archetype is calculated, not polled** — `calculateArchetype(state)` runs client-side from `localStorage` XP state (fast, no network) and then persists to `profiles.archetype` in the background. The UI is instant; the DB is eventually consistent.

**6. Chapter XP tracks within-semester progress** — `user_chapter_xp` accumulates XP earned during a chapter. This gives every semester a "final score" that students can look back on — a Personal Record for each academic period.

### What We Intentionally Left Out

- **Leaderboards** — Ubuntu philosophy rejects zero-sum competition. Pod feed shows peers' wins, not ranks.
- **Daily streaks with punishment** — Global streak exists in `StreakWidget` (pre-existing). Domain Flames are *separate* and use shields. Two systems, different emotional contracts.
- **Loot box monetisation** — Mystery box is earned by completing challenges, never purchased. The reward schedule is addictive by design but the content is always positive and free.
- **Push notification pressure** — Notifications are opt-in (existing system). Pending XP motivates via the app surface, not interruptions.

### Schema (Migration 000046)

```sql
-- Profiles additions
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS domain_streaks JSONB DEFAULT '{"academic":{"streak":0,...}}',
  ADD COLUMN IF NOT EXISTS archetype TEXT DEFAULT 'Explorer',
  ADD COLUMN IF NOT EXISTS archetype_updated_at DATE,
  ADD COLUMN IF NOT EXISTS pending_xp_shown INTEGER DEFAULT 200;

-- New tables
CREATE TABLE compound_days (user_id, day_date, domains_hit TEXT[], xp_bonus, UNIQUE(user_id, day_date));
CREATE TABLE mystery_box_claims (user_id, claimed_date, reward_type, reward_value JSONB, xp_awarded, UNIQUE(user_id, claimed_date));
CREATE TABLE semester_chapters (name, slug, emoji, start_date, end_date, is_active);
CREATE TABLE user_chapter_xp (user_id, chapter_id, xp, UNIQUE(user_id, chapter_id));
```

Seeded chapters: Semester 1 · 2026 (done), **Winter Sprint · 2026 (active)**, Semester 2 · 2026 (upcoming).

### Engine Additions (xp-engine.ts, +201 lines)

New XP events: `compound_day` (+200 XP, 1/day cap), `mystery_box_opened`, `domain_streak_7` (+75), `domain_streak_30` (+200).

New badges: `compound_first`, `compound_7`, `compound_30`, `mystery_opener`, `mystery_7`.

New functions:
- `getDomainsHitToday()` → `Set<DomainKey>` — reads today's `dailyEventLog` and maps events → domains
- `calculateArchetype(state)` → runs 11 archetype conditions against last-7-days domain event counts
- `getPendingXP()` → rough estimate of earnable XP remaining today (220 → 40 as domains fill)
- `rollMysteryBox()` → weighted random from 5-outcome loot table
- `checkAndFireCompoundDay()` → auto-called inside `dispatchXP()`; fires `varsityos:compound_day` event once per day when domains ≥ 3

### Components Built

| Component | Trigger | Psychology |
|---|---|---|
| `DomainFlames.tsx` | Dashboard, live on `varsityos:xp` | 5 flame cards; flame intensity (💤→🕯️→🔥→💎→👑) grows with streak |
| `CompoundDayBurst.tsx` | `varsityos:compound_day` event | Full-screen overlay; rings, domain icons, +200 XP badge; 5-second auto-dismiss |
| `MysteryBox.tsx` | `varsityos:mystery_box_ready` after 3 challenges | Bouncing box → shake → open → reveal; 5 loot outcomes |
| `ArchetypeCard.tsx` | Dashboard, live on `varsityos:xp` | Shows weekly identity; persists to DB in background |
| `PendingXP.tsx` | Dashboard, live on `varsityos:xp` | Hides when ≥ 40 XP pending left; shows "Ubuntu Day Complete" at 5/5 domains |
| `ChapterBanner.tsx` | Dashboard, API call on mount | Progress bar through chapter; days remaining; chapter XP |
| `PodActivityFeed.tsx` | Dashboard, API call on mount | Pod members' compound days; domain emoji chips; time-ago |

### API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/gamification/domain-streak` | GET/POST | Read streaks or increment/shield/reset a domain |
| `/api/gamification/compound-day` | GET/POST | Record compound day; triggers domain streak increments |
| `/api/gamification/mystery-box` | GET/POST | Check if claimed today; persist loot claim |
| `/api/gamification/chapter` | GET | Current chapter + user XP + all chapters |
| `/api/gamification/pod-feed` | GET | Compound day feed from pod members (via admin client) |
| `/api/gamification/archetype` | GET/POST | Read/update archetype identity |

### Commit

```
936c3d7  feat(gamification): Phase 21 — dopamine-architecture habit system
         17 files changed, 1189 insertions(+), 1 deletion(-)
```

**Next migration:** `000047`

---

## Sweep — App Health, Security & Onboarding Hardening (2026-07-12)

Two parallel audit agents (security + onboarding) plus a full type-check/lint pass. App health restored (`tsc --noEmit` was failing on two untyped `SecurityEvent`s from the middleware fail-open commit) and eight audit findings triaged into fix-now vs deferred.

### Fixed

| Area | Fix | Files |
|---|---|---|
| Type-check | `SecurityEvent` union missing `arcjet_error` / `middleware_session_error` → `tsc` red | `lib/security.ts` |
| XSS (MED) | Flashcard `parseMathHtml` HTML-escapes non-math text before `dangerouslySetInnerHTML`; KaTeX still renders math | `study/FlashcardsTab.tsx` |
| SSRF (MED) | ICS import follows redirects manually and re-validates every hop against the private/loopback guard | `api/timetable/import-ics/route.ts` |
| POPIA (HIGH) | Consent recorded server-side in `/auth/callback` (client write ran as anon → blocked by RLS → swallowed); carried in signUp metadata | `auth/callback/route.ts`, `hooks/useAuth.ts` |
| POPIA (HIGH) | Google OAuth button gated behind the consent checkbox | `auth/SignupForm.tsx` |
| Onboarding | Satellite writes first, profile (`onboarding_complete` gate) last, all errors checked; module/exam inserts guarded against duplicate-on-retry; language/status/TVET/country persist across mid-setup refresh | `setup/SetupFlow.tsx` |

### Deferred (bigger / riskier — tracked)

CSP `unsafe-inline`/`unsafe-eval` (needs nonce migration); Paystack webhook trusts a static secret + attacker-supplied metadata instead of real HMAC; ICS DNS-rebinding residual; dashboard SSR computes today/week in UTC not SAST (exam filter off by a day 00:00–02:00); dead `DashboardGreeting.tsx` hydration hazard; setup-form a11y gaps.

### Prod env must-verify (checked `.env.local` only)

`INNGEST_SIGNING_KEY` (functions publicly triggerable if unset — **security**), `UPSTASH_*` (rate limiting degrades to per-instance in-memory), `ARCJET_KEY`, `SENTRY_DSN`.

### Commits

```
b73045b  fix(security): escape flashcard HTML, harden ICS SSRF, restore type-check
         3 files changed, 60 insertions(+), 12 deletions(-)
97ee606  fix(onboarding): persist POPIA consent, order writes safely, keep draft on refresh
         4 files changed, 103 insertions(+), 46 deletions(-)
```

---

## Sweep — Forms, Gamification & Long-Term Durability (2026-07-12)

Three parallel audit agents (gamification/XP engine · all forms · long-term durability) plus verification of the highest-value findings. Focus: things that miscount or break for a student using the app daily for years.

### Fixed

| Area | Fix |
|---|---|
| Safety (critical) | Incident report showed "submitted" even when the save failed (swallowed error) — now confirms only on 2xx, keeps the form, shows the 10111/112 fallback. Dead fake-success `SafetyFeed.tsx` deleted. |
| SAST day boundary | `xp-engine`, `FocusMomentumScore`, `studentState`, all 6 `/api/gamification` routes keyed "today" to UTC → late-night activity split/reset at 02:00. Now SAST everywhere. |
| XP inflation | Daily challenges counted lifetime events (free XP daily) → now count today's; mystery box double-credited on a 409 → now 2xx-only; habit milestone XP had no cap and re-awarded on toggle → now idempotent per habit. |
| Durability | Dashboard SSR + refetch SAST-anchored & bounded/ordered (kills "Exam in -340d"); StudyVelocity/Attendance bounded to ~180 days; `dailyEventLog` pruned to 90 days; streak window 60→400 with a true longest-run "best"; money formatted via `fmt.currencyShort`. |
| Money forms | Savings-goal in-flight lock + error checks + capped delta; stokvel board-message restore + payout-collision rejection + gap-free month assignment; server-side numeric validation on work/jobs; confirm + rollback on exam/module deletes; attendance-sync errors surfaced. |

### Deferred (design judgment / heavier)

Shield semantics, `ubuntu_graduate` archetype threshold, VarsityOS-score trailing window, multi-device XP merge, hardcoded years/rates (PAYE/NSFAS/GoalArchitecture), true all-time streak persistence (needs a `longest_streak` column).

### Commits

```
74f2871  fix(safety): never show a false "report submitted" on a failed incident save
2337ef1  fix(gamification): SAST day boundaries, stop XP inflation, prune event log
c22953c  fix(durability): bound long-lived queries, SAST dashboard, fix stale exam UI
24e8f44  fix(money-forms): lock contributions, guard amounts, safe deletes
```

---

## Testing — XP Engine Harness (2026-07-12)

First automated test suite in the repo. **Vitest** + **happy-dom** (dev deps), `npm test` / `npm run test:watch`, config at `vitest.config.ts` (`@/` alias + happy-dom for `localStorage`).

`src/lib/xp-engine.test.ts` — 21 tests over the XP engine's pure functions: `getLevel` / `getLevelProgress` thresholds, `MYSTERY_LOOT_TABLE` invariants (weights = 100, xp matches the server allowlist), `rollMysteryBox` (always-defined + boundary tiers), `calculateArchetype`, `getUnlockedBadges`, and SAST-anchored `getDomainsHitToday` / `getPendingXP` (a regression guard for the UTC→SAST day-boundary fix). The single Supabase-backed import is mocked so the suite runs in ~0.4s with no network/auth.

```
53aa346  test(xp-engine): add Vitest harness for the XP engine's pure functions
```

---

## UX + Full-Loop Audit (2026-07-12)

Four-agent audit: ambient-background legibility + three content clusters (academic/money/life) checking whether every system closes its loop (see → act → feedback → persist). Full report + prioritised backlog in **[docs/FULL_LOOP_AUDIT_2026-07.md](FULL_LOOP_AUDIT_2026-07.md)**.

**Fixed & shipped:** ambient legibility on ~19 pages (killed the `opacity=0.38`+`transparent`-scrim-over-bright-image contrast bug), Nova never renders blank on API failure, onboarding tour no longer stacks on the consent banner, JobApplicationTracker Rules-of-Hooks crash, three false-success toasts (StudyTwins / alumni mentor request + become-mentor), exam module field.

**Documented backlog (not built — needs product decisions):** safety incident read-feed + real SafeWalk alerts, XP server-authoritative, domain flames on daily activity, unify the two stokvel systems + rotating payouts, money streams (side-hustle/rent) into Budget, Study-Kit→Flashcards, single attendance source, Bursary Find→Track with real dates, mount 5 orphaned components (FoodInsecurityMode, BrainFoodGuide, SkillsToIncome, NsfasWorkCheck, MockInterviewCoach), persist generated AI plans, mentor inbox, marketplace messaging entry point. Verified via a Playwright login+screenshot walkthrough of the live app.

---

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
