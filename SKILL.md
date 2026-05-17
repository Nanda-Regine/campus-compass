# VarsityOS SKILL.md — Claude Build Reference

## Project Snapshot
- **App:** VarsityOS — AI student OS for SA university students
- **Live:** varsityos.co.za
- **Repo dir:** `C:\Users\nanda\OneDrive\campus-compass\repo` (source in `src/`)
- **Stack:** Next.js 14 App Router + TypeScript + Tailwind + Supabase + Claude API + Upstash Redis + web-push + PayFast
- **Vercel project:** `prj_axCqYOZ3W046uxVkDDPFOXL3FA9P` | team: `team_nD1dkYaCFb6fJ5lVZyOTfeBE`

---

## Architecture Rules (NEVER violate)

### Auth pattern — ALL API routes
```ts
const supabase = createServerSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

### Rate limiting — ALL AI routes
```ts
const rl = await checkRateLimitAsync(user.id, 'route-name', MAX, WINDOW_MS)
if (!rl.allowed) return NextResponse.json({ error: 'Too many requests...' }, { status: 429 })
```
Import: `import { checkRateLimitAsync } from '@/lib/rateLimit'`  
Dual-mode: Upstash Redis (production) → in-memory fallback (dev/missing env). Key: `rl:{route}:{userId}`

### AI JSON parse — ALWAYS wrap
```ts
let parsed: unknown
try { parsed = JSON.parse(clean) }
catch { return NextResponse.json({ error: 'AI response parse error' }, { status: 502 }) }
```
Return **502** for AI failures, **500** for infra failures.

### Field whitelisting — ALL PATCH/PUT routes
```ts
const ALLOWED = ['field1', 'field2']
const safeUpdates = Object.fromEntries(Object.entries(body).filter(([k]) => ALLOWED.includes(k)))
```

### Input capping — ALL AI prompt injections
```ts
const userInput = typeof raw === 'string' ? raw.slice(0, MAX_CHARS).trim() : ''
```

### RLS enforcement
All DB tables have `user_id`/`student_id`/`created_by`. Always add `.eq('user_id', user.id)` — DB RLS is backup not primary guard.

---

## Model Routing

| Route | Model | Max tokens | Notes |
|-------|-------|-----------|-------|
| `/api/nova` | claude-sonnet-4-6 | 1024 | Prompt cached, 2000-char msg cap |
| `/api/insights/checkin` | sonnet + haiku | 400 + 300 | Parallel calls |
| `/api/nova/checkin` | claude-haiku-4-5-20251001 | 100 | Micro check-in |
| `/api/work/shift-draft` | claude-sonnet-4-6 | 300 | WhatsApp message draft |
| All other AI routes | claude-haiku-4-5-20251001 | 400–1200 | budget, meals, study, dashboard |
| `/api/budget/receipt` | claude-haiku-4-5-20251001 | 400 | Vision (base64 image) |

**Haiku model name:** `claude-haiku-4-5-20251001`  
**Sonnet model name:** `claude-sonnet-4-6`

---

## Rate Limits Reference

| Route key | Limit | Window |
|-----------|-------|--------|
| `nova` | 15/100/250/9999 (tier) | monthly msg counter |
| `budget-insights` | 5 | 60s |
| `nsfas-appeal` | 3 | 60s |
| `study-assist` | 10 | 60s |
| `meals-recipe` | 8 | 60s |
| `meals-plan` | 4 | 60s |
| `receipt-ocr` | 6 | 60s |
| `shift-draft` | 10 | 60s |
| `nova_checkin` | 5 | 60s |
| `checkin` | 5 | 60s |
| `dashboard-coach-summary` | 3 | 1hr |
| `dashboard-study-tips` | 3 | 1hr |
| `feedback` | 5 | 1hr |

---

## API Routes Map

```
src/app/api/
├── account/delete/         DELETE — 19-table cascade delete, service role, 1/hr RL
├── auth/callback/          OAuth callback (Supabase SSR)
├── budget/
│   ├── alert/              POST — 80% budget threshold alert → nova_insights
│   ├── insights/           GET (analysis) + POST (NSFAS appeal letter)
│   └── receipt/            POST — vision OCR, base64, 5MB limit
├── dashboard/
│   ├── coach-summary/      POST — 3 financial insights, 3/hr RL
│   └── study-tips/         POST — 3 exam tips, 3/hr RL
├── feedback/               POST — anonymous-friendly, IP fallback RL
├── groups/
│   ├── assignments/        GET/POST/PATCH/DELETE — RLS via created_by
│   ├── invite/             POST/GET/PATCH — token-based, service role for lookup
│   └── tasks/              POST/PATCH/DELETE — verifyTaskAccess() helper
├── insights/               GET (nova_insights list) + PATCH (dismiss)
├── insights/checkin/       GET — full semester check-in, sonnet+haiku parallel
├── meals/recipe/           POST (recipe) + GET (weekly plan, 2500 tokens)
├── nova/                   POST — main chat, prompt cached, tier enforcement
├── nova/checkin/           GET — micro personalised check-in, haiku 100 tokens
├── payfast/
│   ├── initiate/           POST — PayFast form fields + MD5 sig, notify→creativelynanda.co.za hub
│   └── notify/             POST — ITN webhook, IP whitelist + MD5 verify, NO auth
├── profile/                GET (full profile + stats) + PATCH (whitelist 18 fields)
├── push/
│   ├── check-exams/        GET — exam reminders within 3 days
│   ├── notify/             POST — send to all user subscriptions, cleanup 410s
│   └── subscribe/          POST (upsert) + DELETE
├── referral/               GET (code+stats) + POST (apply code → RPC)
├── streak/                 GET — task completion streak, SAST timezone
├── study/
│   ├── assist/             POST — 4 types: study_plan, grade_calc, conflict_check, exam_prep
│   └── sessions/           GET (today+week stats) + POST (save pomodoro)
└── work/
    ├── jobs/               GET/POST/PATCH/DELETE — ALLOWED_JOB_FIELDS whitelist
    └── shifts/             GET/POST/PATCH/DELETE — conflict detection, time validation
```

---

## Key Lib Files

| File | Purpose |
|------|---------|
| `src/lib/supabase/server.ts` | `createServerSupabaseClient()` + `createServiceRoleClient()` |
| `src/lib/rateLimit.ts` | `checkRateLimitAsync()` dual-mode (Upstash / in-memory) |
| `src/lib/webpush.ts` | `webpush` singleton + `canSendPush()` guard |
| `src/lib/utils.ts` | `currentMonthRange()`, `currentMonthYear()`, Nova tier constants |
| `src/lib/workSchedule/conflictDetector.ts` | `detectShiftConflicts()` |
| `src/middleware.ts` | Arcjet shield/bot/RL + Supabase session + PayFast bypass |

---

## Supabase Tables (user-scoped, all have RLS)

`profiles`, `budgets`, `expenses`, `tasks`, `modules`, `exams`, `study_sessions`, `nova_messages`, `nova_insights`, `push_subscriptions`, `push_notification_log`, `timetable_slots`, `part_time_jobs`, `work_shifts`, `group_assignments`, `group_members`, `group_tasks`, `group_invites`, `referrals`, `subscriptions`, `app_feedback`

Key columns: `nova_messages_used`, `nova_messages_reset_at`, `plan` (free/scholar/premium/nova_unlimited), `referral_code`, `referral_credits`, `ai_language`

---

## PayFast Architecture

- **Initiate:** `POST /api/payfast/initiate` → returns `{ action, fields }` for browser form POST
- **Notify:** Routed via `https://creativelynanda.co.za/api/payfast/universal-notify` (central hub)
- **Local notify** `POST /api/payfast/notify` — IP whitelist (13 IPs) + MD5 sig, NO Supabase auth
- **m_payment_id format:** `varsityos_{uuid36}_{tier}_{timestamp}`
- **phpUrlencode()** helper exists in both initiate and notify — must match PHP ksort() + urlencode
- **Tiers:** scholar=R39, premium=R79, nova_unlimited=R129 — subscription_type=1, frequency=3, cycles=0

---

## Nova AI Architecture

```
POST /api/nova
├── Auth + rate limit (monthly counter per tier)
├── Free tier = 15 msgs/mo | Scholar = 100 | Premium = 250 | nova_unlimited = 9999
├── Crisis detection → structured crisis response (no AI call)
├── Heavy topic detection → NOVA_KNOWLEDGE_BASE injection
├── Prompt caching: cachedSystemBlock (static) + buildDynamicContext (fresh)
├── buildStudentContext: 6 parallel Supabase queries
├── Message history: role whitelist ('user'|'assistant' only)
├── 2000-char message cap
└── Returns: { message, isCrisis, resources, messagesUsed, tier, nearSoftCap, pastSoftCap }
```

---

## PWA Config

- **Package:** `@ducanh2912/next-pwa@^10.2.9` — CJS, use `require().default({...})`
- **NOT** `next-pwa@5.x` — incompatible with @sentry/nextjs webpack wrapping
- SW disabled in development (`disable: process.env.NODE_ENV === 'development'`)
- Fallback page: `/offline`
- Runtime caching: Google Fonts (CacheFirst), static images (CacheFirst), pages (NetworkFirst), Supabase (NetworkOnly), Anthropic (NetworkOnly)

---

## Security Headers (all routes)

X-Frame-Options: DENY | X-Content-Type-Options: nosniff | HSTS 63072000s  
CSP: script-src includes PostHog, Vercel Live, GTM, Crisp, Hotjar  
connect-src: Supabase, Anthropic, PayFast, Firebase FCM, PostHog, Sentry

---

## Middleware (src/middleware.ts)

1. PayFast bypass: `/api/payfast/notify` → `NextResponse.next()` (no auth/RL)
2. Arcjet: lazy-loaded (only if `ARCJET_KEY` set) — shield + bot detection
   - Base: 60 req/min | AI routes: 10 req/min
3. Supabase `updateSession()` — only for non-API page routes
4. AI routes: `/api/nova`, `/api/budget/insights`, `/api/meals/recipe`, `/api/study/assist`, `/api/work/shift-draft`, `/api/insights/checkin`

**CRITICAL:** Arcjet MUST NOT be in middleware on Vercel Hobby (1MB Edge bundle limit). It's lazy-loaded.

---

## Common Patterns

### Parallel Supabase queries
```ts
const [{ data: a }, { data: b }] = await Promise.all([
  supabase.from('table_a').select('*').eq('user_id', user.id).single(),
  supabase.from('table_b').select('*').eq('user_id', user.id),
])
```

### AI JSON response (safe)
```ts
const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
const clean = raw.replace(/```json|```/g, '').trim()
// OR use regex: const jsonMatch = raw.match(/\{[\s\S]*\}/)
let parsed: unknown
try { parsed = JSON.parse(clean) }
catch { return NextResponse.json({ error: 'AI response parse error' }, { status: 502 }) }
```

### Multilingual AI (ai_language profile field)
```ts
const language = profile?.ai_language || 'English'
const langLine = language !== 'English'
  ? `\nRESPONSE LANGUAGE: ${language} — human text in ${language}, JSON keys in English.`
  : ''
```

---

## Build Commands
```bash
npm run dev          # Next.js dev (SW disabled)
npm run build        # cross-env NODE_OPTIONS=--max-old-space-size=4096 next build
npm run type-check   # tsc --noEmit
```

## Env Vars Required
`ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYFAST_SANDBOX`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ARCJET_KEY`, `NEXT_PUBLIC_APP_URL`
