# VarsityOS — COMPLETE MASTER SESSION PROMPT
## Claude Code | Nanda Regine | April 2026
### ⚠️ ABSOLUTE RULE: DO NOT delete, overwrite, or modify .env or .env.local under ANY circumstances.

---

## SESSION SCOPE

This session covers 9 work streams for VarsityOS (varsityos.co.za):

1. Nova message strategy — restructure limits, add Unlimited tier option
2. Offline-first architecture — PWA service worker + IndexedDB caching
3. Task system overhaul — full life-of-a-student to-do app with categories
4. Gamification — confetti, streaks, win celebrations, encouragement
5. Supabase sync — ensure ALL new tables are wired and syncing
6. Legal documents — update with POPIA registration number
7. Reviews & feedback system — in-app form + Supabase table + Google review CTA
8. Landing page — full update reflecting all new features
9. Pricing page — updated plan features

---

## STREAM 1 — NOVA MESSAGE STRATEGY

### Decision context
200 messages/month is insufficient for daily-active students. A student checking in with Nova about exams, budget, and mental health daily hits 200 in ~10 days.

### Recommended restructure

**Option A — Add Nova Unlimited tier (RECOMMENDED)**

| Plan | Price | Nova | Notes |
|------|-------|------|-------|
| Free | R0 | 15 messages/month | Increased from 10 |
| Scholar | R39 | 100 messages/month | Increased from 75 |
| Premium | R79 | 250 messages/month | Increased from 200 |
| Nova Unlimited | R129/month | Unlimited | New tier |

**Option B — Smart quota (don't count quick responses)**
Classify Nova requests as "quick" or "deep":
- Quick: single-fact NSFAS questions, budget checks, reminder confirmations → free, don't count quota
- Deep: full conversation turns, study plans, mental health sessions → count quota

Implement classification in `/app/api/nova/route.ts`:
```ts
function isQuickQuery(message: string): boolean {
  const quickPatterns = [
    /how much.*left/i, /what.*nsfas/i, /when.*exam/i,
    /remind me/i, /check.*balance/i, /what.*deadline/i,
  ]
  return quickPatterns.some(p => p.test(message)) && message.length < 80
}
// If isQuickQuery → skip quota increment, still call API but with max_tokens: 200
```

### Implementation tasks

**1.1 — Update profiles table**
```sql
ALTER TABLE public.profiles 
  ALTER COLUMN nova_messages_limit SET DEFAULT 15;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' 
    CHECK (plan IN ('free', 'scholar', 'premium', 'nova_unlimited'));
```

**1.2 — Update quota constants**

Find the file that defines Nova limits (likely `lib/constants.ts` or `lib/nova/limits.ts`). Update:
```ts
export const NOVA_LIMITS = {
  free: 15,
  scholar: 100,
  premium: 250,
  nova_unlimited: -1, // -1 = unlimited
} as const

export function isAtNovaLimit(used: number, plan: keyof typeof NOVA_LIMITS): boolean {
  const limit = NOVA_LIMITS[plan]
  if (limit === -1) return false // unlimited
  return used >= limit
}

export function novaMessagesRemaining(used: number, plan: keyof typeof NOVA_LIMITS): number | 'unlimited' {
  const limit = NOVA_LIMITS[plan]
  if (limit === -1) return 'unlimited'
  return Math.max(0, limit - used)
}
```

**1.3 — Nova UI: show remaining messages**

In the Nova chat component, add a subtle indicator below the input:
- If > 50% remaining: muted grey text "X messages remaining this month"
- If < 25% remaining: amber text "Running low — X messages left"
- If 0 remaining: red banner with upgrade CTA
- If unlimited: no indicator shown

---

## STREAM 2 — OFFLINE-FIRST ARCHITECTURE

### Goal
Students must be able to open VarsityOS during load shedding with no data and see:
- Today's timetable
- Wallet balance and recent transactions
- Tasks and reminders for today/this week
- Savings goal progress
- Meal plan for today
- Exam countdowns

Nova requires internet — this is expected and acceptable.

### 2.1 — Service Worker strategy

The app is already a PWA. Update `public/sw.js` or wherever the service worker is defined:

```js
const CACHE_VERSION = 'varsityos-v3'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DATA_CACHE = `${CACHE_VERSION}-data`

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/budget',
  '/dashboard/tasks',
  '/dashboard/timetable',
  '/dashboard/meals',
  '/dashboard/savings',
  '/dashboard/groups',
  '/offline',
  // Add manifest, icons, fonts
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // API calls: network first, fall back to cached response
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(DATA_CACHE).then(c => c.put(request, clone))
          }
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Pages: cache first for dashboard routes
  if (url.pathname.startsWith('/dashboard')) {
    e.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    )
    return
  }

  // Everything else: network first
  e.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})
```

### 2.2 — IndexedDB for critical offline data

Create `lib/offline/db.ts` using the `idb` package (already available in most Next.js projects, or add it: `npm install idb`):

```ts
import { openDB } from 'idb'

const DB_NAME = 'varsityos'
const DB_VERSION = 2

export async function getOfflineDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Timetable
      if (!db.objectStoreNames.contains('timetable')) {
        db.createObjectStore('timetable', { keyPath: 'id' })
      }
      // Tasks
      if (!db.objectStoreNames.contains('tasks')) {
        const ts = db.createObjectStore('tasks', { keyPath: 'id' })
        ts.createIndex('by_due', 'due_date')
        ts.createIndex('by_status', 'status')
      }
      // Income entries (wallet)
      if (!db.objectStoreNames.contains('income_entries')) {
        db.createObjectStore('income_entries', { keyPath: 'id' })
      }
      // Expenses
      if (!db.objectStoreNames.contains('expenses')) {
        db.createObjectStore('expenses', { keyPath: 'id' })
      }
      // Savings goals
      if (!db.objectStoreNames.contains('savings_goals')) {
        db.createObjectStore('savings_goals', { keyPath: 'id' })
      }
      // Exams
      if (!db.objectStoreNames.contains('exams')) {
        db.createObjectStore('exams', { keyPath: 'id' })
      }
      // Meal plans
      if (!db.objectStoreNames.contains('meal_plans')) {
        db.createObjectStore('meal_plans', { keyPath: 'id' })
      }
      // Pending writes queue (for offline mutations)
      if (!db.objectStoreNames.contains('pending_writes')) {
        db.createObjectStore('pending_writes', { keyPath: 'id', autoIncrement: true })
      }
    },
  })
}
```

### 2.3 — Sync hook

Create `hooks/useOfflineSync.ts`:

```ts
import { useEffect } from 'react'
import { getOfflineDB } from '@/lib/offline/db'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useOfflineSync() {
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function syncToIndexedDB() {
      if (!navigator.onLine) return
      const db = await getOfflineDB()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Sync timetable
      const { data: timetable } = await supabase
        .from('timetable_slots').select('*').eq('user_id', user.id)
      if (timetable) {
        const tx = db.transaction('timetable', 'readwrite')
        await Promise.all([...timetable.map(r => tx.store.put(r)), tx.done])
      }

      // Sync tasks (current + next 30 days)
      const { data: tasks } = await supabase
        .from('tasks').select('*').eq('user_id', user.id).neq('status', 'done')
      if (tasks) {
        const tx = db.transaction('tasks', 'readwrite')
        await Promise.all([...tasks.map(r => tx.store.put(r)), tx.done])
      }

      // Sync income entries (current month)
      const monthYear = new Date().toISOString().slice(0, 7)
      const { data: income } = await supabase
        .from('income_entries').select('*').eq('user_id', user.id).eq('month_year', monthYear)
      if (income) {
        const tx = db.transaction('income_entries', 'readwrite')
        await Promise.all([...income.map(r => tx.store.put(r)), tx.done])
      }

      // Sync expenses (current month)
      const { data: expenses } = await supabase
        .from('expenses').select('*').eq('user_id', user.id).eq('month_year', monthYear)
      if (expenses) {
        const tx = db.transaction('expenses', 'readwrite')
        await Promise.all([...expenses.map(r => tx.store.put(r)), tx.done])
      }

      // Sync savings goals
      const { data: savings } = await supabase
        .from('savings_goals').select('*').eq('user_id', user.id)
      if (savings) {
        const tx = db.transaction('savings_goals', 'readwrite')
        await Promise.all([...savings.map(r => tx.store.put(r)), tx.done])
      }

      // Sync exams (upcoming)
      const { data: exams } = await supabase
        .from('exams').select('*').eq('user_id', user.id)
        .gte('exam_date', new Date().toISOString())
      if (exams) {
        const tx = db.transaction('exams', 'readwrite')
        await Promise.all([...exams.map(r => tx.store.put(r)), tx.done])
      }
    }

    syncToIndexedDB()

    // Re-sync when coming back online
    window.addEventListener('online', syncToIndexedDB)
    return () => window.removeEventListener('online', syncToIndexedDB)
  }, [])
}
```

### 2.4 — Offline indicator banner

Create `components/ui/OfflineBanner.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const online = () => setIsOffline(false)
    const offline = () => setIsOffline(true)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline) }
  }, [])

  if (!isOffline) return null

  return (
    <div className="offline-banner">
      <span>🌑 You're offline — showing saved data. Nova is unavailable until you reconnect.</span>
    </div>
  )
}
```

Style it: fixed top bar, amber background, small text. Add to `app/dashboard/layout.tsx`.

### 2.5 — Pending writes queue

When a user adds a task, expense, or savings contribution while offline:
1. Write to IndexedDB immediately (optimistic)
2. Add to `pending_writes` store with `{ table, operation, data, timestamp }`
3. When back online, process queue and sync to Supabase
4. Show a small indicator: "X changes pending sync" when offline writes exist

Create `lib/offline/pendingWrites.ts` with functions:
- `queueWrite(table, operation, data)` — adds to IndexedDB pending queue
- `flushPendingWrites(supabase)` — processes queue on reconnect
- `getPendingCount()` — returns count of pending operations

---

## STREAM 3 — TASK SYSTEM OVERHAUL

### Goal
Transform the task module into a full life-of-a-student productivity system. Not just "assignment due Friday" — every moving part of student life.

### 3.1 — Task categories

Update the `task_type` enum in the Supabase `tasks` table and in the TypeScript types:

```sql
-- Run in Supabase SQL Editor
ALTER TABLE public.tasks 
  DROP CONSTRAINT IF EXISTS tasks_task_type_check;

ALTER TABLE public.tasks 
  ADD CONSTRAINT tasks_task_type_check 
  CHECK (task_type IN (
    -- Academic
    'assignment', 'exam', 'test', 'project', 'presentation', 'reading', 'tutorial', 'lab', 'group_project',
    -- Admin & life
    'reminder', 'meeting', 'appointment', 'chore', 'errand', 'admin',
    -- Wellness & personal
    'self_care', 'exercise', 'social', 'personal_goal',
    -- Work
    'work_shift', 'work_task',
    -- Finance
    'payment_due', 'budget_review',
    -- Other
    'other'
  ));
```

### 3.2 — Category groups for UI

Create `lib/tasks/categories.ts`:

```ts
export const TASK_CATEGORY_GROUPS = {
  academic: {
    label: 'Academic',
    color: '#2D4A22',
    icon: '📚',
    types: ['assignment', 'exam', 'test', 'project', 'presentation', 'reading', 'tutorial', 'lab', 'group_project'],
  },
  life: {
    label: 'Life & Admin',
    color: '#5C6BC0',
    icon: '🏠',
    types: ['reminder', 'meeting', 'appointment', 'chore', 'errand', 'admin'],
  },
  wellness: {
    label: 'Wellness',
    color: '#66BB6A',
    icon: '🌿',
    types: ['self_care', 'exercise', 'social', 'personal_goal'],
  },
  work: {
    label: 'Work',
    color: '#FFA726',
    icon: '💼',
    types: ['work_shift', 'work_task'],
  },
  finance: {
    label: 'Finance',
    color: '#C9A84C',
    icon: '💰',
    types: ['payment_due', 'budget_review'],
  },
} as const

export const TASK_TYPE_LABELS: Record<string, string> = {
  assignment: 'Assignment',
  exam: 'Exam',
  test: 'Test / Quiz',
  project: 'Project',
  presentation: 'Presentation',
  reading: 'Reading',
  tutorial: 'Tutorial',
  lab: 'Lab / Practical',
  group_project: 'Group Project',
  reminder: 'Reminder',
  meeting: 'Meeting',
  appointment: 'Appointment',
  chore: 'Chore',
  errand: 'Errand',
  admin: 'Admin Task',
  self_care: 'Self Care',
  exercise: 'Exercise',
  social: 'Social',
  personal_goal: 'Personal Goal',
  work_shift: 'Work Shift',
  work_task: 'Work Task',
  payment_due: 'Payment Due',
  budget_review: 'Budget Review',
  other: 'Other',
}
```

### 3.3 — Task views

The task dashboard should support 3 views (tabs or toggle):

**Today view:** Tasks due today, overdue tasks, reminders for today. Sorted by urgency.

**Week view:** 7-day calendar-style list grouped by day. Shows academic, personal, and work tasks together.

**All tasks view:** Full list with filter by category group and status. Search by title.

### 3.4 — Quick-add task

Add a floating `+` button on the dashboard and task page. Tapping it opens a bottom sheet (mobile) or modal (desktop):

Fields:
- Title (text input, autofocus)
- Category (segmented control: Academic / Life / Wellness / Work / Finance)
- Type (dropdown filtered by category selection above)
- Due date (date picker, default: today)
- Priority (Low / Medium / High / Urgent — pill selector)
- Module (optional, dropdown from user's modules)
- Notes (optional, collapsible)

Save triggers:
1. Optimistic UI update (add to local state immediately)
2. Write to IndexedDB
3. Sync to Supabase `tasks` table

### 3.5 — Recurring tasks support

Add `recurrence_rule` column:
```sql
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence_rule TEXT 
  CHECK (recurrence_rule IN ('none', 'daily', 'weekly', 'monthly', 'custom'));
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
```

For chores, exercise, budget reviews — students can set "every Monday" etc.

---

## STREAM 4 — GAMIFICATION

### Goal
Celebrate every win. VarsityOS should feel alive, warm, and encouraging — not clinical.

### 4.1 — Confetti utility

Install canvas-confetti: `npm install canvas-confetti`
Install types: `npm install -D @types/canvas-confetti`

Create `lib/gamification/confetti.ts`:

```ts
import confetti from 'canvas-confetti'

// Colours: VarsityOS design system
const COLORS = ['#2D4A22', '#C9A84C', '#F5EFD6', '#9DB89A', '#ffffff']

export function celebrateSmall() {
  confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 }, colors: COLORS })
}

export function celebrateBig() {
  confetti({ particleCount: 120, spread: 100, origin: { y: 0.6 }, colors: COLORS })
  setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 }, colors: COLORS }), 200)
  setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, colors: COLORS }), 400)
}

export function celebrateStreak(streakCount: number) {
  if (streakCount % 7 === 0) celebrateBig()
  else celebrateSmall()
}

export function celebrateSavingsGoal() {
  confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 }, colors: ['#C9A84C', '#FFD700', '#FFF8DC', '#2D4A22'] })
}
```

### 4.2 — Win trigger map

Trigger `celebrateSmall()` when:
- Task marked as done
- Expense logged (staying on budget)
- Daily check-in completed
- Study session ended

Trigger `celebrateBig()` when:
- First task of the day completed
- All tasks for the day completed
- Streak milestone: 3, 7, 14, 30 days
- Savings goal reached
- Budget goal maintained for full month
- First time setting up wallet

Trigger `celebrateSavingsGoal()` when:
- `savings_goals.is_completed` flips to `true`

### 4.3 — Encouragement messages

Create `lib/gamification/encouragement.ts`:

```ts
export const ENCOURAGEMENT_BY_TYPE = {
  task_done: [
    "Done. One less thing standing between you and your degree.",
    "Tick. Your future self is grateful.",
    "That's the one. Keep moving.",
    "Checked off. Ubuntu — you did that for yourself AND everyone who believes in you.",
    "Completed. Small wins build big lives.",
  ],
  streak: (days: number) => [
    `${days} days straight. Discipline is just respect for your own goals.`,
    `${days}-day streak. The version of you from ${days} days ago would be proud.`,
    `${days} days consistent. Consistency is the quiet superpower.`,
  ],
  budget_on_track: [
    "Budget on track. Your money is listening to you.",
    "Every rand accounted for. That's financial intelligence.",
    "You're managing like someone who knows where they're going.",
  ],
  savings_progress: [
    "Getting closer. Every rand counts.",
    "Your future self is watching. Keep going.",
    "That goal is getting real.",
  ],
  savings_complete: [
    "You did it. You set a goal and you hit it. That's not small — that's character.",
    "Goal reached. What's next?",
    "Saved. Proven. Unstoppable.",
  ],
  exam_countdown_start: [
    "Your exam is coming. Let's prepare, not panic.",
    "Countdown started. You already know more than you think.",
  ],
}

export function getRandomEncouragement(type: keyof typeof ENCOURAGEMENT_BY_TYPE, param?: number): string {
  const pool = typeof ENCOURAGEMENT_BY_TYPE[type] === 'function'
    ? (ENCOURAGEMENT_BY_TYPE[type] as Function)(param)
    : ENCOURAGEMENT_BY_TYPE[type]
  return pool[Math.floor(Math.random() * pool.length)]
}
```

### 4.4 — Toast notification for wins

Create `components/ui/WinToast.tsx`:

A toast that appears bottom-center for 3 seconds on wins. Styled differently from error toasts:
- Background: `#2D4A22` (forest green)
- Text: `#F5EFD6` (cream)
- Small gold star icon on the left
- Encouragement message

```tsx
interface WinToastProps {
  message: string
  onDismiss: () => void
}
export function WinToast({ message, onDismiss }: WinToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="win-toast">
      <span className="win-icon">✦</span>
      <span>{message}</span>
    </div>
  )
}
```

### 4.5 — Streak system

The streak is already tracked in `profiles.streak_count` and `profiles.last_activity_date`. Add the increment logic:

Create `lib/gamification/streak.ts`:
```ts
export async function incrementStreak(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles').select('streak_count, last_activity_date').eq('id', userId).single()
  
  if (!profile) return

  const today = new Date().toISOString().split('T')[0]
  const lastActivity = profile.last_activity_date

  if (lastActivity === today) return // already incremented today

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const newStreak = lastActivity === yesterday ? profile.streak_count + 1 : 1

  await supabase.from('profiles').update({
    streak_count: newStreak,
    last_activity_date: today,
  }).eq('id', userId)

  return newStreak
}
```

Call `incrementStreak` whenever a user completes any meaningful action (task done, check-in, budget log, study session end).

---

## STREAM 5 — SUPABASE SYNC VERIFICATION

### 5.1 — Check all new tables exist

Run this query in Supabase SQL Editor to verify all required tables exist:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Required tables (all should appear):
- expenses, exams, group_members, group_messages, group_tasks, groups
- income_entries, meal_plans, modules, notifications, nova_conversations
- profiles, recipes, savings_contributions, savings_goals
- study_sessions, tasks, timetable_slots, wallet_config
- wellbeing_checkins, work_shifts

Any missing → run the MEGA SQL from the previous session.

### 5.2 — Realtime subscriptions for group features

In `app/dashboard/groups/[groupId]/page.tsx`, add Supabase Realtime for group messages:

```ts
useEffect(() => {
  const channel = supabase
    .channel(`group-messages-${groupId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'group_messages',
      filter: `group_id=eq.${groupId}`,
    }, (payload) => {
      setMessages(prev => [...prev, payload.new as GroupMessage])
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [groupId])
```

### 5.3 — New table: app_feedback (for Stream 7)

```sql
CREATE TABLE IF NOT EXISTS public.app_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  category TEXT CHECK (category IN (
    'bug', 'feature_request', 'general', 'nova_feedback',
    'budget', 'study', 'meals', 'groups', 'savings', 'other'
  )),
  message TEXT NOT NULL,
  app_version TEXT,
  platform TEXT, -- 'web', 'pwa_android', 'pwa_ios'
  is_resolved BOOLEAN DEFAULT false,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert (anonymous rating allowed) and view their own
CREATE POLICY "Anyone can submit feedback" ON public.app_feedback 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users see own feedback" ON public.app_feedback 
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.app_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON public.app_feedback(rating);
```

---

## STREAM 6 — LEGAL DOCUMENTS UPDATE

### POPIA Registration Details
```
Registration Number: 2026-005658
Registration Date: 2026-04-03
Information Officer: Kabali-Kagwa, Nandawula
Appointment Date: 2025-08-28
Regulator: Information Regulator of South Africa
```

### 6.1 — Privacy Policy (`app/legal/privacy/page.tsx`)

Find the Privacy Policy page and update/add these sections:

**POPIA Compliance section (add near top, after intro):**
```
POPIA Compliance

VarsityOS is operated by Mirembe Muse (Pty) Ltd, registered with the 
Information Regulator of South Africa under Registration No. 2026-005658 
(Registration Date: 3 April 2026).

Our Information Officer is Nandawula Kabali-Kagwa (appointed 28 August 2025), 
contactable at privacy@mirembemuse.co.za.

We process your personal information in compliance with the Protection of 
Personal Information Act, 2013 (POPIA). You have the right to:
- Access the personal information we hold about you
- Request correction of inaccurate information
- Request deletion of your information
- Object to the processing of your information
- Lodge a complaint with the Information Regulator at inforeg.org.za
```

**Data we collect — update to reflect new features:**
```
We collect and process:
- Account information (name, email, university, degree, year of study)
- Financial data you voluntarily log (income entries, expenses, savings goals)
- Academic data (modules, timetable, tasks, exam dates, study sessions)
- Wellness data (mood check-ins — stored securely, never shared)
- Usage data via PostHog analytics (anonymised where possible)
- Conversation content with Nova AI (used only to generate your response; 
  not used to train AI models)
- Device information for PWA functionality (OS, browser type)
- Voluntary feedback and reviews you submit in-app
```

**Nova AI and third-party processing:**
```
Nova conversations are processed via the Anthropic API. Your conversation 
content is sent to Anthropic's servers to generate responses. Anthropic's 
privacy policy applies to this processing. We do not store full conversation 
histories beyond your active session unless you are a paying subscriber 
(Scholar/Premium/Nova Unlimited), in which case recent context is stored 
to improve response quality.
```

**Data retention:**
```
- Account data: retained while your account is active + 12 months after deletion request
- Financial/academic data: retained while account is active + 6 months
- Nova conversations: 90 days for paying subscribers; not stored for free users
- Anonymous analytics: 24 months
```

**Contact for POPIA requests:**
```
Email: privacy@mirembemuse.co.za
Postal: Mirembe Muse (Pty) Ltd, East London, Eastern Cape, South Africa
Information Regulator: inforeg.org.za | complaints@inforeg.org.za
```

### 6.2 — Terms of Service (`app/legal/terms/page.tsx`)

Add/update:

**Jurisdiction:** South Africa. Governed by South African law.

**AI disclaimer:** 
```
Nova is an AI system and does not provide professional medical, psychological, 
legal, or financial advice. Nova's responses are for general informational 
and supportive purposes only. In a mental health crisis, please contact 
SADAG (0800 567 567) or Lifeline SA (0861 322 322) immediately.
```

**POPIA reference:**
```
We process your personal information as described in our Privacy Policy and 
in accordance with POPIA (Act 4 of 2013). Our POPIA registration number is 
2026-005658.
```

### 6.3 — Footer update (all pages)

The footer currently shows: `🛡 POPIA Compliant · Registration No. 2026-005658`

This is already correct. Ensure it is present on EVERY page including the dashboard pages — add to `app/dashboard/layout.tsx` footer if not already there.

### 6.4 — Cookie banner / consent

If no cookie/analytics consent banner exists, create a minimal one:

```tsx
// components/legal/ConsentBanner.tsx
// Show once on first visit, store consent in localStorage
// Two options: "Accept analytics" | "Essential only"
// On "Essential only": disable PostHog tracking
// Position: fixed bottom, compact bar design
```

---

## STREAM 7 — REVIEWS & FEEDBACK SYSTEM

### Google Review Link
`https://g.page/r/CdPIXBcTmJE6EAI/review`

### 7.1 — In-app feedback form

Create `components/feedback/FeedbackModal.tsx`:

```tsx
// Triggered by: 
// (a) "Give feedback" button in dashboard sidebar/nav
// (b) After completing first savings goal (gentle prompt)
// (c) After 7 consecutive days of use (gentle prompt, once only)

// Form fields:
// - Star rating: 1-5 (large tappable stars)
// - Category: bug / feature request / general / nova feedback / other (pill selector)
// - Message: textarea, placeholder: "Tell us what's working, what's broken, or what you wish existed."
// - Submit button: "Send feedback"

// On submit:
// 1. POST to /api/feedback (see below)
// 2. If rating >= 4: show Google review prompt (see 7.2)
// 3. Show thank you toast: "Thank you — your feedback goes directly to the builder."
```

### 7.2 — Google review prompt

After 4-5 star in-app rating, show a follow-up modal:

```tsx
// GoogleReviewPrompt.tsx
// Appears after high rating submission
// Heading: "You're helping other students find VarsityOS"
// Body: "A quick Google review makes a huge difference for students who are searching."
// Primary button: "Leave a Google Review →" → opens https://g.page/r/CdPIXBcTmJE6EAI/review in new tab
// Secondary: "Maybe later" (dismisses, sets flag so it doesn't show again for 30 days)
```

### 7.3 — Feedback API route

Create `app/api/feedback/route.ts`:

```ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  const body = await req.json()
  const { rating, category, message } = body

  if (!rating || rating < 1 || rating > 5 || !message?.trim()) {
    return NextResponse.json({ error: 'Invalid feedback' }, { status: 400 })
  }

  const platform = req.headers.get('user-agent')?.includes('Mobile') ? 'pwa_android' : 'web'

  const { error } = await supabase.from('app_feedback').insert({
    user_id: user?.id ?? null, // allow anonymous
    rating,
    category: category ?? 'general',
    message: message.trim(),
    platform,
    app_version: '1.0.0', // update with actual version
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
```

### 7.4 — Feedback CTA in settings page

In `app/dashboard/settings/page.tsx` (or wherever user settings are), add a "Feedback & Reviews" section:

```
📝 Send feedback
Tell us what's working or what you wish existed.
[Give feedback button]

⭐ Leave a review
Help other students discover VarsityOS.
[Review on Google →] (links to g.page URL)
```

### 7.5 — Trigger prompts (non-intrusive)

Add to `hooks/useReviewPrompt.ts`:

```ts
// Check localStorage for 'feedback_prompted' flag
// If not set AND (streak >= 7 OR first savings goal completed):
//   Set a state flag to show FeedbackModal
//   After showing, set 'feedback_prompted' = Date.now() in localStorage
//   Don't show again for 30 days
```

---

## STREAM 8 — LANDING PAGE UPDATE

### Locate the landing page file
This is likely `app/page.tsx` or `app/(landing)/page.tsx`. Find it and apply the following changes.

### 8.1 — Hero section

**Update the hero subtitle copy:**
```
OLD: "NSFAS tracking, budget management, study planner, meal prep, and Nova — an AI companion built for the reality of being a South African student."

NEW: "Budget, savings, study planner, group projects, meal prep, and Nova — your AI companion who actually understands SA student life. Works offline. No app store needed."
```

**Update hero stats bar:**
```
OLD: R0 · 5-in-1 tools · 15+ SA universities · R39 Scholar
NEW: R0 forever · 8+ tools · 15+ SA universities · Works offline
```

### 8.2 — Pain points section

Update card 1:
```
OLD: "Your NSFAS money runs out 10 days before month-end — and you're not sure where it went."
NEW: "Your money runs out 10 days before month-end — whether it's NSFAS, a bursary, pocket money, or your weekend shift — and you have no idea where it went."
```

Add new pain point card (5th):
```
icon: 💰 (savings piggy)
"You're trying to save for something — a laptop, a trip home, an emergency — but with no system, it just disappears."
```

### 8.3 — Dashboard preview mock

Update the preview widget that shows the budget/dashboard demo. Change the mock data from:
```
NSFAS food  R890
Transport   R340
Books       R210
```

To a multi-source wallet view:
```
Wallet · April
────────────────────────────────
NSFAS allowance      +R2,100  ●
Part-time (Checkers) +R480    ●
Pocket money (Mom)   +R300    ●
Total income         R2,880
────────────────────────────────
Spent so far         R1,040
Remaining            R1,840

🎯 Laptop Fund  ████████░░░  R1,350 / R2,000
```

### 8.4 — Features grid — replace entirely

Replace the current 6-feature grid with 8 feature tiles (responsive 2-col mobile, 4-col desktop):

```tsx
const features = [
  {
    icon: '💰',
    title: 'Flexible wallet',
    desc: 'Track every rand from any source — NSFAS, bursary, pocket money, shifts, gifts. Not just NSFAS. Every student. Every funding type.',
    isNew: true,
  },
  {
    icon: '🎯',
    title: 'Savings goals',
    desc: 'Set a goal, track contributions, celebrate when you hit it. Laptop fund. Emergency buffer. Trip home. Whatever matters.',
    isNew: true,
  },
  {
    icon: '📚',
    title: 'Study planner',
    desc: 'Timetable, exam countdowns, tasks, and AI study plans — academic, personal, and work all in one place.',
    isNew: false,
  },
  {
    icon: '🍲',
    title: 'Meal prep',
    desc: 'Budget SA recipes under R50, weekly meal plans, and an AI recipe generator that works with what you have.',
    isNew: false,
  },
  {
    icon: '✦',
    title: 'Nova AI',
    desc: 'A warm AI companion who knows NSFAS rules, understands imposter syndrome, detects crisis, and speaks your reality.',
    isNew: false,
  },
  {
    icon: '💼',
    title: 'Work & shifts',
    desc: 'Log part-time shifts, track earnings, and get alerts when a shift conflicts with a lecture.',
    isNew: false,
  },
  {
    icon: '👥',
    title: 'Group assignment manager',
    desc: 'Create groups, invite classmates with a code, assign tasks, chat, and track your shared deadline together.',
    isNew: true,
  },
  {
    icon: '🔔',
    title: 'Smart reminders',
    desc: 'Exam countdowns, budget warnings, streak alerts. VarsityOS runs quietly in the background so nothing slips.',
    isNew: false,
  },
]
```

### 8.5 — New section: Flexible Wallet

Insert after the features grid, before the Nova section. Structure:

**Heading:** "Your money. Your way."
**Subheading:** "VarsityOS works for every SA student — NSFAS, bursary, pocket money, weekend shifts, or all of the above. Add your sources. We track everything."

**Income source chips (horizontal scroll row on mobile):**
```
💚 NSFAS allowance
🎓 Bursary
👨‍👩‍👧 Pocket money
💼 Part-time job
🎁 Gift money
💡 Side hustle
➕ Add custom
```

Style: soft pill chips, light green background on NSFAS, light blue on bursary, etc. Use a `<div className="flex flex-wrap gap-2">` layout.

**CTA:** `[Set up your wallet →]` → `/auth/signup`

### 8.6 — New section: Savings Goals

Insert after Wallet section. Structure:

**Heading:** "Start saving. Even R50 at a time."
**Body:** "Create a savings goal, add to it whenever you can, and watch it grow. VarsityOS tracks every contribution and tells you how close you are — with a celebration when you get there."

**Mock savings card preview:**
```
🎯 Laptop Fund        ████████░░  R1,350 of R2,000    8 weeks left
🏠 Emergency Buffer   ██░░░░░░░░  R200 of R1,000      No deadline
✈️ Home for December  █████░░░░░  R680 of R1,500      28 Nov
```

Each card shows: goal name, emoji, progress bar, current/target, deadline or "no deadline".

### 8.7 — New section: Group Assignment Manager

Insert after Nova section. Structure:

**Heading:** "Group project chaos, finally solved."
**Body:** "Create a group, share an invite code, assign tasks to members, chat without WhatsApp, and track your shared deadline — all inside VarsityOS. No more 'who's doing the intro?' in a 47-message voice note chain."

**Feature bullets:**
- Create a group with one click, share a 6-character invite code
- Assign tasks to specific members with due dates
- In-app group chat — no WhatsApp needed
- Shared deadline countdown for the whole group
- See at a glance who's done what

### 8.8 — Update "How it works" step 3

```
OLD: "Add your modules, load your NSFAS budget, and meet Nova. Everything syncs."
NEW: "Set up your wallet, add your modules, and meet Nova. Works offline from day one."
```

### 8.9 — Update pricing plan feature lists

**Free plan:**
```
✓ Full Study Planner (academic + life + wellness tasks)
✓ Flexible Wallet (all income sources)
✓ Savings goals tracker
✓ Meal Prep module
✓ Work & shifts tracker
✓ Group Assignment Manager
✓ 15 Nova messages / month
✓ Works offline
```

**Scholar (R39/month):**
```
✓ Everything in Free
✓ 100 Nova messages / month
✓ AI Recipe Generator
✓ Study session tracking
✓ Priority support
```

**Premium (R79/month):**
```
✓ Everything in Scholar
✓ 250 Nova messages / month
✓ CSV data export
✓ Early access to new features
✓ Priority support
```

**Nova Unlimited (R129/month) — NEW TIER:**
```
✓ Everything in Premium
✓ Unlimited Nova messages
✓ First access to new Nova capabilities
✓ Direct feedback channel to the builder
```

Styling for Nova Unlimited: add a subtle gold border and a "For serious students" label above.

### 8.10 — Update FAQ

**Update Q1:**
```
Q: Is VarsityOS actually free?
A: Yes. The free plan includes the Study Planner, Flexible Wallet, Savings goals, Meal Prep, Work tracker, Group Assignment Manager, and 15 Nova messages every month — forever. Paid plans unlock more Nova conversations.
```

**Update Q2 (NSFAS question):**
```
Q: Do I need NSFAS to use VarsityOS?
A: No. VarsityOS works for every South African student. You can track NSFAS allowances, bursary payments, pocket money from family, part-time job earnings, gifts — or any combination. If your funding isn't on the list, you can add a custom source.
```

**Keep existing Q3 (Nova vs ChatGPT) — it's strong.**

**Add new Q:**
```
Q: Does VarsityOS work offline?
A: Yes. Your timetable, wallet balance, tasks, savings goals, and meal plan are available offline — perfect for load shedding. Nova requires an internet connection to respond, but everything else loads from your device.
```

**Add new Q:**
```
Q: Is my financial and wellness data private?
A: Yes. All your data is stored securely in our database with row-level security — meaning only you can access your information. We are registered with the Information Regulator of South Africa (POPIA Registration No. 2026-005658) and process your data in full compliance with POPIA. Read our Privacy Policy for full details.
```

### 8.11 — Footer legal update

Add to footer:
```
🛡 POPIA Compliant · Registration No. 2026-005658 · Information Regulator of South Africa
```

This should already be in the footer — verify it appears on the LANDING PAGE specifically (not just the app pages).

### 8.12 — Reviews section (above final CTA)

Insert a "Leave a review" nudge section before the final CTA:

```
⭐⭐⭐⭐⭐
"Loved by students at UCT, Wits, UKZN, and more."

[existing testimonials here]

[New row below testimonials:]
"Using VarsityOS? Your review helps the next student find it."
[⭐ Review on Google →] button → https://g.page/r/CdPIXBcTmJE6EAI/review (opens in new tab)
```

---

## STREAM 9 — PRICING PAGE UPDATE

If a dedicated `/upgrade` page exists, update the plan cards to reflect:
- New Nova message limits (15 / 100 / 250 / Unlimited)
- Nova Unlimited tier at R129/month
- Updated feature lists from Stream 8.9
- "Works offline" as a Free feature (this is a differentiator — show it)

---

## FINAL QA CHECKLIST

Before committing:
- [ ] .env / .env.local untouched
- [ ] Canvas confetti fires on task completion (test in dev)
- [ ] Offline banner appears when devtools → Network → Offline
- [ ] Feedback form submits and row appears in Supabase `app_feedback` table
- [ ] Google review link opens correctly (https://g.page/r/CdPIXBcTmJE6EAI/review)
- [ ] Nova Unlimited tier visible in pricing page and upgrade flow
- [ ] All legal pages show POPIA registration number 2026-005658
- [ ] FAQ has offline question and non-NSFAS question
- [ ] Feature grid shows 8 tiles with "New" badges on Wallet, Savings, Groups
- [ ] Income source chips render correctly on mobile (flex-wrap or horizontal scroll)

---

*VarsityOS · Mirembe Muse (Pty) Ltd · April 2026*
*"Where Transformation Has a Template"*