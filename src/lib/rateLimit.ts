// ─────────────────────────────────────────────────────────────────────────────
// Simple in-process rate limiter for API routes
// Uses a sliding window per user. Good for single-instance Vercel deployments.
// At scale (multiple instances), upgrade to Upstash Redis.
// ─────────────────────────────────────────────────────────────────────────────

interface WindowEntry {
  count: number
  windowStart: number
}

// In-memory store — resets on serverless cold start (acceptable for our use case)
const store = new Map<string, WindowEntry>()

/**
 * Check and increment rate limit for a user on a given route.
 * @param userId - Supabase user ID
 * @param route - route identifier (e.g. 'nova', 'budget-insights')
 * @param maxRequests - max requests allowed in the window
 * @param windowMs - window duration in milliseconds (default 60s)
 * @returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
  userId: string,
  route: string,
  maxRequests: number,
  windowMs = 60_000,
): { allowed: boolean; remaining: number; resetIn: number } {
  const key = `${userId}:${route}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now - entry.windowStart > windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs }
  }

  if (entry.count >= maxRequests) {
    const resetIn = windowMs - (now - entry.windowStart)
    return { allowed: false, remaining: 0, resetIn }
  }

  entry.count += 1
  return { allowed: true, remaining: maxRequests - entry.count, resetIn: windowMs - (now - entry.windowStart) }
}

// Clean up old entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cutoff = Date.now() - 300_000 // 5 min
    for (const [key, entry] of store.entries()) {
      if (entry.windowStart < cutoff) store.delete(key)
    }
  }, 300_000)
}
