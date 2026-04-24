# VarsityOS — Technical Decisions

> Executive brief on architectural choices, trade-offs, and rationale.

---

## Framework: Next.js 14 App Router

**Chosen over:** Remix, SvelteKit, plain React SPA.

Server Components let us SSR the dashboard in one round-trip — profile, tasks, exams, timetable fetched in parallel on the server before a byte reaches the browser. RLS-protected Supabase queries run server-side where the service-role key never touches the client. Route-level `export const dynamic = 'force-dynamic'` keeps auth-gated pages uncached.

**Trade-off:** App Router DX is rougher than Pages Router. Server/client boundary confusion is a real footgun. We mitigate by keeping all DB reads in Server Components and keeping Client Components shallow — they receive data as props and handle only interactivity.

---

## Database: Supabase (PostgreSQL + RLS)

**Chosen over:** PlanetScale, Prisma + Neon, Firebase Firestore.

RLS policies mean access control lives in the database, not scattered across every API route. A bug in an API route can't leak another user's data. The `createAdminClient()` (service-role) is used *only* in the PayFast ITN webhook — the one place where RLS must be bypassed to write a payment update for any user.

`createServerSupabaseClient()` uses `@supabase/ssr` with cookie-based sessions, compatible with both Server Components and API Routes. `createAdminClient()` uses `@supabase/supabase-js` with no cookie handling — appropriate for server-only webhook contexts.

---

## AI: Anthropic (claude-sonnet-4-6 + claude-haiku-4-5)

**Chosen over:** OpenAI GPT-4o, Google Gemini.

Two-model strategy:
- **claude-sonnet-4-6** — Nova chat (full context, memory, crisis detection, streaming). Quality matters more than cost.
- **claude-haiku-4-5** — Daily check-ins, shift conflict detection, budget insights. Speed and cost matter; quality is sufficient.

System prompts use Anthropic's prompt caching (ephemeral cache block) to avoid re-processing the 2000-token Nova knowledge base on every message. At 10 msgs/day × 1000 users this saves ~$15/day in input token costs.

**Trade-off:** No multi-modal yet. No function-calling / tool use — Nova responds in plain text. This simplifies the pipeline but limits structured output.

---

## State Management: Zustand

**Chosen over:** Redux Toolkit, Jotai, React Context.

Zustand's flat store with no boilerplate fits a single-developer app. The store (`useAppStore`) holds profile, budget, tasks, exams, modules, timetable, expenses, subscription. Server-fetched data hydrates the store on mount; client-side mutations update the store optimistically.

**Trade-off:** Store is not persisted to IndexedDB — a refresh re-fetches from the server. Acceptable given Vercel's edge caching makes these fetches fast.

---

## Payments: PayFast (once-off, ZAR)

**Chosen over:** Stripe, Yoco, Peach Payments.

PayFast is the dominant South African payment gateway with the broadest local card + instant EFT support. Integration is a redirect-based form submission with an MD5 signature. No SDK — raw `crypto.createHash('md5')` with PHP-compatible `urlencode` (PayFast signs using PHP conventions).

Critical implementation detail: params **must be sorted alphabetically** before hashing. Insertion-order produces a mismatched signature and a 500. ITN webhook verifies IP against PayFast's published CIDR list and re-verifies the MD5 before writing to `profiles`.

**Trade-off:** No recurring billing SDK. Subscription management (cancel, upgrade mid-cycle) must be handled via manual PayFast dashboard or custom ITN logic.

---

## Hosting: Vercel

**Chosen over:** Railway, Fly.io, AWS.

Zero-config Next.js deployment with automatic preview URLs per branch. `export const runtime = 'nodejs'` on all API routes — no Edge Function limitations. Environment variables managed via `vercel env`. Domain `varsityos.co.za` wired via Vercel DNS.

Sentry for error tracking with source map uploads. PostHog for product analytics (nova_message_sent, upgrade_click, feature_opened events). Firebase FCM for push notifications (exam reminders).

---

## PWA / Offline

Service worker via `next-pwa`. Static assets and fonts are cache-first. API responses are network-first with a stale fallback. Nova check-in message is cached in `localStorage` keyed by date — the dashboard re-uses the cached message for the rest of the day with zero API calls.

---

## Security Posture

| Layer | Control |
|---|---|
| Auth | Supabase session cookies, middleware blocks unauthenticated routes |
| Data | PostgreSQL RLS — users can only read/write own rows |
| AI key | `ANTHROPIC_API_KEY` server-side only — verified absent from client bundles |
| Payments | PayFast IP whitelist + MD5 re-verification on every ITN |
| Transport | HSTS 2yr preload, CSP, X-Frame-Options DENY, X-Content-Type-Options |
| Rate limiting | All 6 AI routes protected with in-memory sliding window |
