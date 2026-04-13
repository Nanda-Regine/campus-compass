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
            .select('onboarding_complete')
            .eq('id', user.id)
            .single()

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
