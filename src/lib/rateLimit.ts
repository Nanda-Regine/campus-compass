// ─────────────────────────────────────────────────────────────────────────────
// Rate limiter — Upstash Redis (distributed) with in-memory fallback.
//
// Upstash mode: Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in Vercel.
//   Correct for multi-instance / serverless deployments (limits are shared across all
//   Vercel function instances — the only correct behaviour at scale).
//
// In-memory fallback (UPSTASH_REDIS_REST_URL not set):
//   Works on a single instance. Fine for development or low-traffic staging.
//   Each serverless cold start gets a fresh counter — limits are per-instance only.
//   NOT suitable for production scale.
// ─────────────────────────────────────────────────────────────────────────────

// ── In-memory store (fallback) ─────────────────────────────────────────────
interface WindowEntry { count: number; windowStart: number }
const _store = new Map<string, WindowEntry>()

// Clean up stale entries every 5 minutes (only meaningful in long-lived processes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cutoff = Date.now() - 300_000
    for (const [key, entry] of _store.entries()) {
      if (entry.windowStart < cutoff) _store.delete(key)
    }
  }, 300_000)
}

function inMemoryCheck(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = _store.get(key)
  if (!entry || now - entry.windowStart > windowMs) {
    _store.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs }
  }
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: windowMs - (now - entry.windowStart) }
  }
  entry.count += 1
  return { allowed: true, remaining: maxRequests - entry.count, resetIn: windowMs - (now - entry.windowStart) }
}

// ── Upstash Redis check (distributed, atomic) ─────────────────────────────
// Uses a simple REST increment + TTL approach compatible with the Upstash REST API.
async function upstashCheck(
  restUrl: string,
  restToken: string,
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetIn: number } | null> {
  try {
    const windowSec = Math.ceil(windowMs / 1000)
    // Pipeline: INCR key, EXPIRE key windowSec (only sets TTL if key is new)
    const pipeline = [
      ['INCR', key],
      ['EXPIRE', key, windowSec, 'NX'], // NX = set only if no expiry yet
    ]
    const res = await fetch(`${restUrl}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${restToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(pipeline),
    })
    if (!res.ok) return null

    const results = (await res.json()) as { result: number }[]
    const count = results[0]?.result ?? 1
    const allowed = count <= maxRequests
    return {
      allowed,
      remaining: Math.max(0, maxRequests - count),
      resetIn: windowMs, // approximate — Upstash TTL is the authoritative source
    }
  } catch {
    return null // fall through to in-memory on network error
  }
}

/**
 * Check and increment rate limit for a key on a given route.
 * @param userId - Supabase user ID or derived key (e.g. IP prefix)
 * @param route  - route identifier (e.g. 'nova', 'feedback')
 * @param maxRequests - max requests in the window
 * @param windowMs    - window duration in ms (default 60 s)
 */
export async function checkRateLimitAsync(
  userId: string,
  route: string,
  maxRequests: number,
  windowMs = 60_000,
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const key = `rl:${route}:${userId}`
  const restUrl = process.env.UPSTASH_REDIS_REST_URL
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (restUrl && restToken) {
    const result = await upstashCheck(restUrl, restToken, key, maxRequests, windowMs)
    if (result) return result
    // Upstash call failed — fall through to in-memory
  }

  return inMemoryCheck(key, maxRequests, windowMs)
}

/**
 * Synchronous in-memory rate limit check (backward-compatible).
 * Use checkRateLimitAsync() for new routes — it supports Upstash.
 */
export function checkRateLimit(
  userId: string,
  route: string,
  maxRequests: number,
  windowMs = 60_000,
): { allowed: boolean; remaining: number; resetIn: number } {
  const key = `rl:${route}:${userId}`
  return inMemoryCheck(key, maxRequests, windowMs)
}
