# VarsityOS — System Design

> SA student super-app: AI companion, budget, study planner, meal prep, work tracker.  
> Stack: Next.js 14 · Supabase · Anthropic · PayFast · Vercel

---

## 1. High-Level Architecture

```mermaid
graph TB
    subgraph Client["Client (Browser / PWA)"]
        UI[React 18 + Next.js App Router]
        SW[Service Worker — offline cache]
        LS[localStorage — Nova check-in cache]
    end

    subgraph Vercel["Vercel Edge Network"]
        NEXT[Next.js Server Components]
        API[API Routes — Node.js runtime]
        MW[Middleware — auth redirect]
    end

    subgraph Supabase["Supabase Platform"]
        AUTH[Auth — email + Google OAuth]
        DB[(PostgreSQL + RLS)]
        STORAGE[Storage — future assets]
    end

    subgraph AI["AI Layer"]
        SONNET[claude-sonnet-4-6 — Nova chat]
        HAIKU[claude-haiku-4-5 — check-ins / fast tasks]
    end

    subgraph Payments["Payments"]
        PF[PayFast — ZAR once-off]
    end

    subgraph Observability["Observability"]
        SENTRY[Sentry — error tracking]
        PH[PostHog — product analytics]
        FCM[Firebase FCM — push notifications]
    end

    UI -->|SSR + RSC| NEXT
    UI -->|fetch| API
    SW -->|cache-first| UI
    LS -->|date-keyed| UI

    NEXT -->|createServerSupabaseClient| AUTH
    NEXT -->|select| DB
    API -->|createAdminClient — bypasses RLS| DB
    API -->|anthropic.messages.create| SONNET
    API -->|anthropic.messages.create| HAIKU
    API -->|MD5 signature| PF
    PF -->|ITN webhook POST| API

    MW -->|supabase.auth.getUser| AUTH
    AUTH --> DB
```

---

## 2. User Journey

```mermaid
sequenceDiagram
    actor S as Student
    participant N as Next.js (SSR)
    participant SB as Supabase Auth
    participant DB as PostgreSQL
    participant AN as Anthropic API

    S->>N: Visit varsityos.co.za
    N->>SB: getUser() in middleware
    SB-->>N: null (unauthenticated)
    N-->>S: Redirect → /auth/login

    S->>N: Sign up / Google OAuth
    N->>SB: signUp() / signInWithOAuth()
    SB-->>N: Session cookie
    N-->>S: Redirect → /setup (5-step onboarding)

    S->>N: Complete onboarding
    N->>DB: INSERT profiles, budgets, modules
    N-->>S: Redirect → /dashboard

    S->>N: Open dashboard
    N->>DB: Parallel fetch — profile, tasks, exams, timetable, expenses
    N-->>S: Server-rendered dashboard (< 200ms)

    S->>N: Chat with Nova
    N->>AN: messages.create (streaming, claude-sonnet-4-6)
    AN-->>N: SSE stream chunks
    N-->>S: Streamed response
    N->>DB: INSERT nova_messages, UPSERT nova_insights
```

---

## 3. Database ERD (Core Tables)

```mermaid
erDiagram
    profiles {
        uuid id PK
        text full_name
        text university
        text plan
        text subscription_tier
        bool is_premium
        int  nova_messages_used
        int  nova_messages_limit
        text referral_code
    }

    budgets {
        uuid id PK
        uuid user_id FK
        num  monthly_budget
        bool nsfas_enabled
        num  nsfas_living
        num  nsfas_accom
        num  nsfas_books
    }

    tasks {
        uuid id PK
        uuid user_id FK
        uuid module_id FK
        text title
        text status
        date due_date
        text priority
    }

    modules {
        uuid id PK
        uuid user_id FK
        text module_name
        text color
        text lecturer
    }

    timetable_slots {
        uuid id PK
        uuid user_id FK
        uuid module_id FK
        int  day_of_week
        text start_time
        text end_time
        text venue
    }

    exams {
        uuid id PK
        uuid user_id FK
        uuid module_id FK
        text exam_name
        date exam_date
        text venue
    }

    expenses {
        uuid id PK
        uuid user_id FK
        num  amount
        text category
        date expense_date
    }

    work_shifts {
        uuid id PK
        uuid user_id FK
        uuid job_id FK
        date shift_date
        text start_time
        text end_time
        text status
    }

    payment_logs {
        uuid id PK
        uuid user_id FK
        text payfast_payment_id
        num  amount
        text status
        json raw_data
    }

    profiles ||--o{ budgets : "has"
    profiles ||--o{ tasks : "owns"
    profiles ||--o{ modules : "owns"
    profiles ||--o{ timetable_slots : "owns"
    profiles ||--o{ exams : "has"
    profiles ||--o{ expenses : "logs"
    profiles ||--o{ work_shifts : "works"
    profiles ||--o{ payment_logs : "pays"
    modules  ||--o{ tasks : "tagged"
    modules  ||--o{ timetable_slots : "slotted"
    modules  ||--o{ exams : "examined"
```

---

## 4. Nova AI Pipeline

```mermaid
flowchart LR
    subgraph Client
        Chat[Chat UI\napp/nova/page.tsx]
    end

    subgraph API["POST /api/nova"]
        RL[Rate limit check\n10 req/min free]
        CTX[Context assembly\nprofile + history + KB]
        CACHE[Prompt cache\nephemeral — system block]
        STREAM[Streaming response\nSSE]
        SAVE[Save message\n+ nova_messages_used++]
        INSIGHT[Async insight gen\nstress / budget / study nudges]
    end

    subgraph Anthropic
        SONNET[claude-sonnet-4-6\nmax_tokens 1024]
    end

    Chat -->|POST body + auth cookie| RL
    RL -->|allowed| CTX
    CTX -->|system + messages| CACHE
    CACHE -->|cached system block| SONNET
    SONNET -->|stream| STREAM
    STREAM -->|ReadableStream| Chat
    STREAM --> SAVE
    SAVE --> INSIGHT
    INSIGHT -.->|background| SONNET
```

---

## 5. Auth & Security

```mermaid
flowchart TD
    REQ[Incoming request] --> MW[Next.js Middleware\nmatches all routes]
    MW --> GU[supabase.auth.getUser\ncookie-based session]
    GU -->|no session| REDIR[Redirect /auth/login]
    GU -->|has session| ROUTE[Continue to route]

    ROUTE --> SC[Server Component\ncreateServerSupabaseClient]
    ROUTE --> API[API Route\ncreateServerSupabaseClient]
    ROUTE --> WBOOK[Webhook ITN\ncreateAdminClient — service role]

    SC --> RLS[RLS enforced\nuser sees only own rows]
    API --> RLS
    WBOOK --> NORLS[RLS bypassed\nPayFast can write any user]

    subgraph Headers["Security Headers next.config.js"]
        HSTS[Strict-Transport-Security\n2yr preload]
        CSP[Content-Security-Policy]
        XFO[X-Frame-Options DENY]
        XCTO[X-Content-Type-Options nosniff]
    end
```

---

## 6. Offline PWA Architecture

```mermaid
flowchart TB
    subgraph Browser
        APP[App Shell\nNext.js]
        SW[Service Worker\nnext-pwa]
        IDB[IndexedDB\noffline queue]
        LS[localStorage\nNova check-in cache]
    end

    subgraph Cache["Cache Strategies"]
        STATIC[Static assets\nCache First]
        FONTS[Google Fonts\nStale While Revalidate]
        API_CACHE[API responses\nNetwork First]
    end

    APP -->|register| SW
    SW -->|serves| STATIC
    SW -->|serves| FONTS
    SW -->|falls back to cached| API_CACHE
    APP -->|offline action| IDB
    IDB -->|sync on reconnect| API_CACHE
    APP -->|Nova message| LS
```

---

## 7. Payment Flow

```mermaid
sequenceDiagram
    actor U as User
    participant UPG as /upgrade page
    participant API as POST /api/payfast/initiate
    participant PF as PayFast
    participant ITN as POST /api/payfast/notify
    participant DB as Supabase profiles

    U->>UPG: Click "Upgrade — Scholar R39"
    UPG->>API: { tier: "scholar" }
    API->>API: Build fields + MD5 sig\n(alphabetical key sort)
    API-->>UPG: { action, fields }
    UPG->>UPG: Inject hidden form
    UPG->>PF: Auto-submit form
    PF-->>U: PayFast payment page
    U->>PF: Complete payment
    PF->>ITN: POST ITN (IP whitelist + MD5 verify)
    ITN->>DB: UPDATE plan, subscription_tier,\nis_premium, nova_messages_limit
    ITN-->>PF: 200 OK
    PF-->>U: Redirect /dashboard
```
