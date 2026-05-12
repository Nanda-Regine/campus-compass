import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// ─── AI route paths that get a stricter rate limit ────────────
const AI_ROUTES = [
  '/api/nova',
  '/api/budget/insights',
  '/api/meals/recipe',
  '/api/study/assist',
  '/api/work/shift-draft',
  '/api/insights/checkin',
]

// ─── Arcjet: shield + bot detection + sliding window rate limits ───
// ARCJET_KEY must be set in Vercel env vars. When unset, middleware
// skips Arcjet and falls through to Supabase session management only.
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // PayFast ITN webhook has its own IP + signature verification — skip Arcjet
  // so bot detection doesn't block the server-to-server callback
  if (pathname === '/api/payfast/notify') {
    return NextResponse.next()
  }

  // ── 1. Arcjet security gate (all matched routes) ────────────
  if (process.env.ARCJET_KEY) {
    const aj = await getArcjet()
    if (aj) {
      const isAiRoute = AI_ROUTES.some(r => pathname.startsWith(r))
      const decision = await (isAiRoute ? aj.ai : aj.base).protect(request)
      if (decision.isDenied()) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }
  }

  // ── 2. Supabase session update (page routes only, not API) ──
  if (!pathname.startsWith('/api/')) {
    return await updateSession(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT static files and public assets.
     * API routes are included so Arcjet can protect them.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|icons/|images/).*)',
  ],
}
