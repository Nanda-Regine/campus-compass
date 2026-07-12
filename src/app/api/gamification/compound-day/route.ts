import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sastToday } from '@/lib/utils'

// Server-authoritative compound-day XP bonus (mirrors XP_VALUES.compound_day).
// Kept as a literal so this server route never imports the 'use client' xp-engine.
const COMPOUND_DAY_XP = 200

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { domains_hit?: unknown }
  const domains_hit = Array.isArray(body?.domains_hit)
    ? body.domains_hit.filter((d): d is string => typeof d === 'string')
    : []
  // A compound day is 3+ distinct domains in one day — reject anything less so
  // the XP bonus / streak bumps can't be forged from a single action.
  const unique = [...new Set(domains_hit)]
  if (unique.length < 3) {
    return NextResponse.json({ error: 'A compound day needs 3+ domains' }, { status: 400 })
  }

  const today = sastToday()

  const { data, error } = await supabase
    .from('compound_days')
    .upsert(
      { user_id: user.id, day_date: today, domains_hit: unique, xp_bonus: COMPOUND_DAY_XP },
      { onConflict: 'user_id,day_date', ignoreDuplicates: true },
    )
    .select()

  if (error) return NextResponse.json({ error: 'Failed to record compound day' }, { status: 400 })

  // Advance each hit domain's streak. Use the request's own origin — the previous
  // `NEXT_PUBLIC_SITE_URL ?? ''` fallback produced a relative URL that fetch()
  // rejects server-side, so domain streaks never actually moved.
  for (const domain of unique) {
    await fetch(`${req.nextUrl.origin}/api/gamification/domain-streak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
      body: JSON.stringify({ domain, action: 'increment' }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, data })
}

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('compound_days')
    .select('day_date, domains_hit, xp_bonus')
    .eq('user_id', user.id)
    .order('day_date', { ascending: false })
    .limit(30)

  return NextResponse.json({ compound_days: data ?? [] })
}
