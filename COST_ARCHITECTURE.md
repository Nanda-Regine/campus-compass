# VarsityOS — AI Cost Architecture

> Analysis of prompt caching strategy, token economics, and cost projections.

---

## Model Selection Rationale

| Use Case | Model | Reason |
|---|---|---|
| Nova chat (full conversation) | claude-sonnet-4-6 | Quality, context retention, crisis detection |
| Daily check-in message | claude-haiku-4-5 | 100 token output, speed, 20× cheaper |
| Budget insights | claude-haiku-4-5 | Structured short output |
| Shift conflict detection | claude-haiku-4-5 | Deterministic reasoning, cheap |
| Study plan / exam prep | claude-sonnet-4-6 | Long-form quality output |

---

## Prompt Caching Strategy

Nova's system prompt includes a ~2 000-token knowledge base (`nova-knowledge-base.ts`) covering SA student context, NSFAS rules, crisis resources, and tone guidelines. Without caching this is re-processed on every request.

### Cache block structure

```
System message
├── [EPHEMERAL CACHE BLOCK] ← nova-knowledge-base (~2 000 tokens)
│   cache_control: { type: "ephemeral" }
└── Dynamic context (profile, budget, mood) ← not cached
```

The ephemeral cache has a 5-minute TTL. At typical chat cadence (one message every 30–60 seconds) the block stays warm for the entire conversation.

---

## Token Economics (per Nova conversation)

| Scenario | Without Cache | With Cache |
|---|---|---|
| System prompt tokens | 2 000 | 2 000 (write once) |
| Cache reads (5 turns) | 10 000 | 200 (5 × 40 dynamic tokens) |
| Input cost @ $3/M | $0.030 | $0.003 |
| Cache write cost @ $3.75/M | — | $0.0075 (one-time) |
| **Total input cost** | **$0.030** | **$0.0105** |
| **Saving** | — | **~65%** |

> Prices as of Anthropic's published rates for claude-sonnet-4-6.

---

## Monthly Cost Projections

### Assumptions
- 1 000 MAU, 30% daily active (300 DAU)
- Free tier: 15 Nova messages/month/user
- Scholar (R39): 100 msgs/month
- Premium (R79): 250 msgs/month
- Nova Unlimited (R129): 9 999 msgs/month

### Message volume estimate

| Tier | Users | Msgs/month | Total msgs |
|---|---|---|---|
| Free (300 MAU) | 700 | 10 avg | 7 000 |
| Scholar | 200 | 60 avg | 12 000 |
| Premium | 80 | 150 avg | 12 000 |
| Nova Unlimited | 20 | 500 avg | 10 000 |
| **Total** | **1 000** | — | **41 000** |

### Cost breakdown

| Cost component | Est. monthly |
|---|---|
| Nova chat (Sonnet, cached) | $8.00 |
| Check-ins (Haiku, 300 DAU) | $0.80 |
| Budget insights (Haiku) | $1.20 |
| Shift conflict detection (Haiku) | $0.40 |
| Study assist (Sonnet) | $2.50 |
| **Total AI cost** | **~$13/month** |

### Revenue at 1 000 MAU (conservative mix)

| | |
|---|---|
| Scholar × 200 | R7 800/month |
| Premium × 80 | R6 320/month |
| Nova Unlimited × 20 | R2 580/month |
| **Gross revenue** | **R16 700/month (~$900)** |
| AI cost | ~$13 |
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| Sentry / PostHog | $0 (free tiers) |
| **Net margin** | **~$840/month** |

---

## Rate Limiting as Cost Control

All 6 AI routes are protected with an in-memory sliding-window rate limiter:

| Route | Limit |
|---|---|
| `/api/nova` | 10 req/min (free) / 30 req/min (paid) |
| `/api/nova/checkin` | 5 req/min |
| `/api/budget/insights` | 5 req/min |
| `/api/meals/recipe` | 5 req/min |
| `/api/study/assist` | 5 req/min |
| `/api/work/shift-draft` | 5 req/min |

A runaway client cannot generate unbounded API cost. The Nova check-in also uses localStorage date-keyed caching — the Haiku call happens once per day per user regardless of how many times the dashboard is loaded.

---

## Scaling Levers

| Threshold | Action |
|---|---|
| 5 000 MAU | Migrate rate limiter to Redis (Upstash) |
| $100/month AI cost | Evaluate caching frequent prompts in Supabase |
| 20 000 MAU | Consider Anthropic volume pricing / reserved throughput |
| Nova Unlimited heavy users | Per-user monthly token cap at 9 999 msgs enforced in DB |
