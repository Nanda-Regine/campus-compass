// ============================================================
// Supabase Middleware Client
// Auth flow:
//   Unauthenticated  → /auth/login?redirectTo=[path]
//   Authenticated + onboarding_completed=false → /setup
//   Authenticated + onboarding_completed=true  → destination
//   Already on /setup after onboarding → /dashboard
// ============================================================
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          )
        },
      },
    }
  )

  // Refresh session — IMPORTANT: do not remove
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // If an OAuth/email code lands on the wrong page, route it to the callback handler
  const code = request.nextUrl.searchParams.get('code')
  if (code && !pathname.startsWith('/auth/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }

  // Public routes (no auth needed)
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/callback',
    '/auth/reset-password',
    '/privacy',
    '/terms',
  ]
  const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith('/auth/'))

  // Redirect unauthenticated users to login with redirect param
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  if (user) {
    // Redirect away from auth/landing pages
    if (pathname === '/' || pathname === '/auth/login' || pathname === '/auth/signup') {
      // Check onboarding status before deciding where to send them
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_complete')
        .eq('id', user.id)
        .single()

      const isOnboarded = profile?.onboarding_completed || profile?.onboarding_complete || false

      const url = request.nextUrl.clone()
      url.pathname = isOnboarded ? '/dashboard' : '/setup'
      return NextResponse.redirect(url)
    }

    // Enforce onboarding gate: authenticated users without onboarding must go to /setup
    const isSetupRoute = pathname.startsWith('/setup')
    const isApiRoute = pathname.startsWith('/api/')

    if (!isSetupRoute && !isApiRoute && !isPublic) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_complete')
        .eq('id', user.id)
        .single()

      const isOnboarded = profile?.onboarding_completed || profile?.onboarding_complete || false

      if (!isOnboarded) {
        const url = request.nextUrl.clone()
        url.pathname = '/setup'
        return NextResponse.redirect(url)
      }

      // If completed onboarding and trying to go to /setup → dashboard
      // (handled below — this branch only fires when !isSetupRoute)
    }

    // If onboarded user tries to revisit /setup → redirect to dashboard
    if (isSetupRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_complete')
        .eq('id', user.id)
        .single()

      const isOnboarded = profile?.onboarding_completed || profile?.onboarding_complete || false

      if (isOnboarded) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
