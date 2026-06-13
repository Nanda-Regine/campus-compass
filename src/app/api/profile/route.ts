import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { NOVA_FREE_LIMIT, NOVA_SCHOLAR_LIMIT } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// GET /api/profile — full profile + stats + nova usage
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [
      { data: profile },
      { data: sessions },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('study_sessions')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .gte('started_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ])

    const p = profile as Record<string, unknown> | null
    const novaMessagesUsed = (p?.nova_messages_used as number) ?? 0
    const plan = (p?.plan as string) ?? 'free'
    // null = unlimited (ProfileClient checks === null)
    const novaLimit: number | null = plan === 'nova_unlimited' ? null
      : plan === 'scholar' ? NOVA_SCHOLAR_LIMIT
      : NOVA_FREE_LIMIT
    const totalStudyMinutes = (sessions ?? []).reduce((sum, s) => sum + ((s as Record<string, unknown>).duration_minutes as number ?? 0), 0)

    // Fetch referral stats inline so profile page has everything in one request
    const [{ data: referralProfile }, { count: referralCount }] = await Promise.all([
      supabase.from('profiles').select('referral_code, referral_credits').eq('id', user.id).single(),
      supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', user.id),
    ])

    return NextResponse.json({
      profile,
      stats: {
        novaMessagesUsed,
        novaLimit,
        totalStudyMinutesThisMonth: totalStudyMinutes,
        referralCount: referralCount || 0,
        referralCredits: (referralProfile as Record<string, unknown> | null)?.referral_credits as number || 0,
        referralCode: (referralProfile as Record<string, unknown> | null)?.referral_code as string | null || null,
      },
    })
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

// PATCH /api/profile — update editable profile fields
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    // Whitelist editable fields — never allow plan, nova_messages etc.
    const allowed = [
      'full_name', 'name', 'emoji', 'university', 'degree', 'year_of_study', 'student_number',
      'funding_type', 'phone', 'preferred_language', 'notifications_enabled',
      'avatar_url', 'onboarding_complete',
      'faculty', 'dietary_pref', 'living_situation', 'ai_language',
    ]
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Profile PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
