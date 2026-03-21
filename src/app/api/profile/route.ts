import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/profile — full profile + stats + nova usage
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const monthYear = new Date().toISOString().slice(0, 7) // YYYY-MM

    const [
      { data: profile },
      { data: usage },
      { data: referral },
      { data: sessions },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('nova_usage').select('message_count').eq('user_id', user.id).eq('month_year', monthYear).single(),
      supabase.from('profiles').select('referral_code, referral_credits').eq('id', user.id).single(),
      supabase.from('study_sessions')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .gte('started_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ])

    const { count: referralCount } = await supabase
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', user.id)

    const novaMessagesUsed = usage?.message_count ?? 0
    const novaLimit = profile?.is_premium ? null : 10 // null = unlimited
    const totalStudyMinutes = (sessions ?? []).reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0)

    return NextResponse.json({
      profile,
      stats: {
        novaMessagesUsed,
        novaLimit,
        totalStudyMinutesThisMonth: totalStudyMinutes,
        referralCount: referralCount ?? 0,
        referralCredits: referral?.referral_credits ?? 0,
        referralCode: referral?.referral_code ?? null,
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

    // Whitelist editable fields — never allow is_premium, payfast_token etc.
    const allowed = [
      'name', 'emoji', 'university', 'year_of_study', 'faculty',
      'funding_type', 'dietary_pref', 'living_situation', 'ai_language',
    ]
    const updates: Record<string, string> = {}
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
