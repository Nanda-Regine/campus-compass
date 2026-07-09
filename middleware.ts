import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { logSecurityEvent } from '@/lib/security'

// ─── AI route paths that get a stricter rate limit ────────────
const AI_ROUTES = [
  '/api/nova',                    // also covers /api/nova/proactive-brief, /api/nova/quick
  '/api/budget/insights',
  '/api/meals/recipe',
  '/api/study/assist',
  '/api/study/past-papers',
  '/api/work/shift-draft',
  '/api/insights/checkin',
  '/api/insights/weekly-report',
  '/api/study-pods/matches',
  '/api/career/mock-interview',
  '/api/graduation/optimize',
]

// ─── Mutating methods that require CSRF origin check ──────────
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// ─── Arcjet: shield + bot detection + sliding window rate limits ───
async function getArcjet() {
  if (!process.env.ARCJET_KEY) return null
  try {
    const { default: arcjet, shield, detectBot, slidingWindow } = await import('@arcjet/next')
    const base = arcjet({
      key: process.env.ARCJET_KEY,
      rules: [
        shield({ mode: 'LIVE' }),
        detectBot({
          mode: 'LIVE',
          allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:MONITOR', 'CATEGORY:PREVIEW'],
        }),
        slidingWindow({ mode: 'LIVE', interval: '1m', max: 60 }),
      ],
    })
    const ai = base.withRule(slidingWindow({ mode: 'LIVE', interval: '1m', max: 10 }))
    return { base, ai }
  } catch {
    return null
  }
}

// ─── CSRF origin check ────────────────────────────────────────
function checkCsrf(request: NextRequest): boolean {
  if (!MUTATING_METHODS.has(request.method)) return true
  const origin = request.headers.get('origin')
  if (!origin) return true // server-to-server — no browser Origin header
  const host = request.headers.get('host')
  if (!host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

// ─── Path traversal detection ─────────────────────────────────
function hasPatchTraversal(pathname: string): boolean {
  return pathname.includes('..') || /%2e%2e/i.test(pathname)
}

// ─── Payload size guard (Content-Length header) ───────────────
const MAX_BODY_BYTES = 2_097_152 // 2 MB

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const reqId = crypto.randomUUID()

  // Paystack subscription webhook is an external POST forwarded by the Mirembe hub;
  // it authenticates via the x-hub-secret shared secret, so it must skip the CSRF
  // origin check (which would 403 a cross-origin POST) — its own auth is stronger.
  if (pathname === '/api/paystack/webhook') {
    return NextResponse.next()
  }

  // ── 0. Path traversal block ─────────────────────────────────
  if (hasPatchTraversal(pathname)) {
    logSecurityEvent('path_traversal', { reqId, pathname })
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  // ── 1. Payload size guard ────────────────────────────────────
  const cl = request.headers.get('content-length')
  if (cl && parseInt(cl, 10) > MAX_BODY_BYTES) {
    logSecurityEvent('payload_too_large', { reqId, contentLength: cl })
    return new NextResponse('Payload Too Large', { status: 413 })
  }

  // ── 2. CSRF origin check (API mutations only) ────────────────
  if (pathname.startsWith('/api/') && !checkCsrf(request)) {
    logSecurityEvent('csrf_blocked', {
      reqId,
      method: request.method,
      origin: request.headers.get('origin') ?? '',
      host: request.headers.get('host') ?? '',
    })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── 3. Arcjet security gate (all matched routes) ─────────────
  if (process.env.ARCJET_KEY) {
    const aj = await getArcjet()
    if (aj) {
      try {
        const isAiRoute = AI_ROUTES.some(r => pathname.startsWith(r))
        const decision = await (isAiRoute ? aj.ai : aj.base).protect(request)
        if (decision.isDenied()) {
          logSecurityEvent('rate_limited', { reqId, pathname, reason: decision.reason?.toString() ?? 'arcjet' })
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      } catch (err) {
        // An Arcjet outage/timeout must NEVER take the whole site down — especially not
        // login/signup during a traffic surge. Fail open (allow the request through).
        logSecurityEvent('arcjet_error', { reqId, pathname, error: err instanceof Error ? err.message : 'unknown' })
      }
    }
  }

  // ── 4. Supabase session update (page routes only, not API) ───
  let response: NextResponse
  if (!pathname.startsWith('/api/')) {
    try {
      response = await updateSession(request) as NextResponse
    } catch (err) {
      // A Supabase/network hiccup in the auth gate must not 500 every page route
      // (including /auth/login and /auth/signup) and lock everyone out. Fail open —
      // the destination page still runs its own server-side getUser() check and
      // redirects if the user is genuinely unauthenticated, and RLS still protects data.
      logSecurityEvent('middleware_session_error', { reqId, pathname, error: err instanceof Error ? err.message : 'unknown' })
      response = NextResponse.next()
    }
  } else {
    response = NextResponse.next()
  }

  // ── 5. Security response headers ─────────────────────────────
  response.headers.set('X-Request-ID', reqId)
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('X-Download-Options', 'noopen')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT static files and public assets.
     * API routes are included so Arcjet can protect them.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|manifest\\.webmanifest|sw\\.js|workbox-|firebase-messaging-sw\\.js|robots\\.txt|sitemap\\.xml|icons/|images/|_next/data).*)',
  ],
}
