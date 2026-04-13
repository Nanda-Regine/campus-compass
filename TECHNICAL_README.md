# VarsityOS — Technical Reference

Engineering architecture, design decisions, and implementation details.

---

## Project Structure

```
campus-compass/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # API route handlers (all server-side)
│   │   │   ├── nova/route.ts       # Streaming AI chat + proactive insights
│   │   │   ├── budget/
│   │   │   │   ├── insights/       # AI budget health analysis
│   │   │   │   └── alert/          # 80% spend alert trigger
│   │   │   ├── meals/recipe/       # AI recipe generator
│   │   │   ├── study/
│   │   │   │   ├── assist/         # AI study plans + exam prep
│   │   │   │   └── sessions/       # Pomodoro session persistence
│   │   │   ├── work/
│   │   │   │   ├── jobs/           # Part-time job CRUD
│   │   │   │   ├── shifts/         # Shift lifecycle management
│   │   │   │   └── shift-draft/    # AI shift request drafter
│   │   │   ├── insights/
│   │   │   │   ├── route.ts        # GET/PATCH nova_insights
│   │   │   │   └── checkin/        # Daily AI check-in generation
│   │   │   ├── referral/           # Referral code system
│   │   │   ├── streak/             # Streak data
│   │   │   ├── account/delete/     # POPIA full account deletion
│   │   │   └── payfast/notify/     # ITN webhook (service role)
│   │   ├── (pages)/                # Route segments — all RSC by default
│   │   ├── layout.tsx              # Root layout: GTM, PostHog, SW registration
│   │   └── opengraph-image.tsx     # Edge-rendered OG image
│   ├── components/
│   │   ├── layout/                 # TopBar, BottomNav
│   │   ├── budget/                 # BudgetClient, ReceiptScanner
│   │   ├── study/                  # TasksTab, TimetableTab, ExamsTab, ModulesTab, PomodoroTimer
│   │   ├── nova/                   # Chat UI, message bubbles, typing indicator
│   │   ├── dashboard/              # Greeting, mood check-in, insight cards
│   │   ├── gamification/           # StreakWidget, ReferralWidget
│   │   └── ui/                     # Button, Input, Select, Modal, Toast (primitives)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts           # createServerSupabaseClient(), createServiceRoleClient()
│   │   │   └── client.ts           # createClient() for browser
│   │   ├── rateLimit.ts            # In-process sliding-window rate limiter
│   │   ├── nova-knowledge-base.ts  # Static SA student context — prompt-cached
│   │   ├── nova-resources.ts       # Pre-built response detection + resource links
│   │   ├── tasks/categories.ts     # Task type taxonomy
│   │   └── utils.ts                # fmt, cn, calcTotalBudget, currentMonthRange, detectCrisis
│   ├── store/
│   │   └── index.ts                # Zustand store — versioned persist middleware
│   └── types/
│       └── index.ts                # Shared TypeScript types (strict)
├── supabase/
│   ├── migrations/                 # Timestamped SQL migrations (run in order)
│   ├── schema.sql                  # Canonical full schema
│   └── production_schema_fixes.sql # Indexes, triggers, race condition fixes (run last)
├── docs/                           # Build journey, contributing guide
├── public/                         # Static assets, PWA icons, service worker
├── middleware.ts                   # Auth + route protection (Next.js middleware)
├── next.config.js                  # Security headers, redirects, config
└── tailwind.config.ts              # Custom design tokens
```

---

## Data Flow

### Server Components → Client Components

Pages are React Server Components. They fetch data from Supabase server-side, then pass serialised `initialData` props to `'use client'` components. This means:

- Zero loading spinners on initial render — data is already there
- No client-side Supabase calls on mount for primary data
- Zustand store is seeded from `initialData` via a `useEffect` on mount, making subsequent mutations instant

```
RSC page (server)
  └─ Supabase fetch (server-side, authenticated)
       └─ <ClientComponent initialData={...} />
            └─ useState(initialData)   // immediate render
            └─ useEffect → store.set*  // seed Zustand
```

### Mutations

Client components write optimistically to local state + Zustand, then fire a Supabase client call. On error, state is rolled back. No API routes involved for standard CRUD — direct Supabase client with RLS enforcing auth.

AI-related writes (Nova messages, study plans, shift drafts) go through `/api/*` route handlers which enforce rate limiting before touching Anthropic.

---

## Nova AI Architecture

Nova uses a **two-block prompt caching** strategy to minimise cost:

```
┌─────────────────────────────────────────────────────────┐
│  Block 1: NOVA_KNOWLEDGE_BASE (~8k tokens)              │
│  Static SA student context, mental health protocols,    │
│  NSFAS rules, crisis hotlines, study strategies         │
│  → cache_control: ephemeral  (cached, ~90% cost saving) │
├─────────────────────────────────────────────────────────┤
│  Block 2: Dynamic student context (~400 tokens)         │
│  Live DB data: tasks, exams, budget, mood, usage        │
│  → NOT cached (fresh every call)                        │
└─────────────────────────────────────────────────────────┘
```

**Pre-built response detection** (`nova-resources.ts`) handles breathing exercises, crisis responses, Pomodoro instructions, sleep tips — zero API cost, instant response.

**Monthly counter reset** is handled server-side on every Nova call: if `nova_messages_reset_at` is in a prior calendar month, the counter resets before the cap check.

**Crisis detection** runs on every message before any API call. If triggered, the crisis response is prepended regardless of tier or message count.

---

## Rate Limiting

All 6 AI-calling routes share an in-process sliding-window rate limiter (`src/lib/rateLimit.ts`).

```typescript
// Per-user, per-route, configurable window
checkRateLimit(userId, 'nova', 15, 60_000)   // 15 req/min
checkRateLimit(userId, 'checkin', 5, 60_000) // 5 req/min
```

**Limitation:** In-process means per-instance. Horizontal scale (multiple Vercel function instances) would require Redis. This is acceptable for current traffic; Redis migration is on the roadmap.

---

## Authentication & Authorisation

- **Auth**: Supabase Auth — email/password + Google OAuth. JWT stored in httpOnly cookie via `@supabase/ssr`.
- **Middleware** (`middleware.ts`): checks session on every request. Unauthenticated users are redirected to `/auth/login`. Protected paths are defined via matcher config.
- **RLS**: Every Supabase table has Row Level Security policies. All user data queries include `.eq('user_id', user.id)` — RLS provides a second enforcement layer.
- **Service role**: Only used in `payfast/notify/route.ts` (ITN webhook needs to update any user's subscription tier). Never exposed to the client.

---

## PayFast Integration

```
User clicks "Upgrade"
  └─ /upgrade page renders a <form> POSTing to PayFast sandbox/live
       └─ Server-side: MD5 signature computed from all fields + passphrase
            └─ PayFast processes payment
                 └─ POST /api/payfast/notify (ITN webhook)
                      └─ Signature re-verified server-side
                           └─ profiles.subscription_tier updated via service role
```

Sandbox toggled via `PAYFAST_SANDBOX=true` env var. Signature generation uses the exact PayFast specification (alphabetical field order, URL-encoded, MD5).

---

## Zustand Store

Global state uses Zustand with `persist` middleware:

```typescript
{
  name: 'varsityos-store',
  version: 2,                        // bump to wipe stale persisted state
  migrate: (state, version) => {
    if (version < 2) return initialState  // clear on schema change
    return state
  },
  partialize: (state) => {           // don't persist ephemeral flags
    const { isOnline: _o, ...rest } = state
    return rest
  },
}
```

Primary data (tasks, modules, exams) is re-seeded from `initialData` on every page load, so the persisted store acts as a write-cache between navigations rather than a source of truth.

---

## Security Headers (`next.config.js`)

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [nonce-based CSP]
```

`poweredByHeader: false` — no `X-Powered-By: Next.js` leakage.

`ANTHROPIC_API_KEY` presence in client bundles is verified via grep in CI — it must never appear in `NEXT_PUBLIC_*` vars.

---

## Database Schema Design

Key design decisions:

- **`profiles` extends `auth.users`** via a trigger — created automatically on signup. Contains all app-level user data (subscription_tier, nova_messages_used, funding_type, etc.)
- **`subscription_tier`** is the canonical field (set by PayFast webhook). Legacy `plan` field exists for backwards compat but is not written to.
- **`month_year` columns** on `expenses` and `income_entries` are denormalised for fast monthly aggregations without date truncation in queries.
- **`nova_conversations`** uses `upsert` with `onConflict: 'user_id'` — one row per user, updated in place. Conversation history is stored as a JSONB array.
- **RLS policies** use `auth.uid()` directly — no application-level user ID is trusted for access control.

### Migration Strategy

All schema changes are in `supabase/migrations/` with timestamp prefixes. The canonical current schema is `supabase/schema.sql`. New migrations are additive (ADD COLUMN IF NOT EXISTS, DROP CONSTRAINT IF EXISTS) to be safe to re-run.

---

## PWA Configuration

- Service Worker at `public/sw.js` — precaches app shell, handles offline fallback
- Web App Manifest at `public/manifest.json` — installable on Android and iOS
- Push notification infrastructure: VAPID keys configured, service worker push handler ready. FCM integration is pending (see roadmap).

---

## Environment Variables

| Variable | Scope | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Safe to expose — RLS enforces access |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Bypasses RLS — never in client |
| `ANTHROPIC_API_KEY` | Server only | Never in client |
| `NEXT_PUBLIC_APP_URL` | Client + Server | `https://varsityos.co.za` in prod |
| `PAYFAST_MERCHANT_ID` | Server only | |
| `PAYFAST_MERCHANT_KEY` | Server only | |
| `PAYFAST_PASSPHRASE` | Server only | Used in MD5 signature |
| `PAYFAST_SANDBOX` | Server only | `false` in prod |
| `NEXT_PUBLIC_GTM_ID` | Client | GTM container ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | Client | PostHog project key |

---

## Roadmap

- [ ] **Redis rate limiting** — replace in-process limiter for multi-instance horizontal scale
- [ ] **FCM push notifications** — wire FCM init; VAPID + service worker handler already done
- [ ] **PostHog custom events** — `nova_message_sent`, `upgrade_click`, `feature_opened`
- [ ] **Sentry** — error monitoring (DSN ready, SDK not yet installed)
- [ ] **Pomodoro UI** — `/api/study/sessions` is complete; timer UI is the pending piece
- [ ] **Receipt OCR** — auto expense logging via Anthropic vision

---

*VarsityOS — Proprietary software. © 2026 Mirembe Muse (Pty) Ltd.*
