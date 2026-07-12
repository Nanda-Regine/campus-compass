import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  // Validate next to prevent open redirect attacks — must be a relative path
  const rawNext = searchParams.get('next') ?? ''
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes('://') ? rawNext : '/dashboard'

  // Always use the canonical app URL to avoid Vercel internal URLs being used as origin
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://varsityos.co.za').replace(/\/$/, '')

  if (code) {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Skip onboarding check for auth flows (e.g. password reset)
      if (!next.startsWith('/auth/')) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_complete, popia_consent')
            .eq('id', user.id)
            .single()

          // Record POPIA consent server-side. The client-side signUp write runs
          // as anon (no session until confirmation) and is blocked by RLS, so
          // consent must be stamped here where we hold an authenticated session.
          // Covers both email/password and Google OAuth — the signup UI gates
          // each path behind the consent checkbox. Stamp once; never overwrite
          // the original timestamp on later logins.
          if (profile && profile.popia_consent !== true) {
            await supabase
              .from('profiles')
              .update({ popia_consent: true, popia_consent_at: new Date().toISOString() })
              .eq('id', user.id)
          }

          if (!profile?.onboarding_complete) {
            return NextResponse.redirect(`${appUrl}/setup`)
          }
        }
      }

      return NextResponse.redirect(`${appUrl}${next}`)
    }
  }

  return NextResponse.redirect(`${appUrl}/auth/login?error=callback_failed`)
}
