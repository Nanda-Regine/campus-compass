import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sastToday } from '@/lib/utils'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = sastToday()
  const { data } = await supabase
    .from('mystery_box_claims')
    .select('reward_type, reward_value, xp_awarded, created_at')
    .eq('user_id', user.id)
    .eq('claimed_date', today)
    .single()

  return NextResponse.json({ claimed: !!data, claim: data ?? null })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = sastToday()
  const { reward_type, reward_value, xp_awarded } = await req.json().catch(() => ({})) as {
    reward_type?: string; reward_value?: Record<string, unknown>; xp_awarded?: number
  }

  // Server-side allowlist so the logged reward can't be forged (e.g. xp_awarded:999999).
  // Mirrors MYSTERY_LOOT_TABLE. XP itself is credited client-side via the XP engine;
  // this table is the claim record, so we clamp it to the real loot values.
  const LOOT_XP: Record<string, number> = {
    xp_small: 50, xp_medium: 150, xp_large: 500, multiplier: 0, shield: 0, badge_fragment: 100,
  }
  if (!reward_type || !(reward_type in LOOT_XP)) {
    return NextResponse.json({ error: 'invalid reward_type' }, { status: 400 })
  }
  const safeXp = LOOT_XP[reward_type]

  const { data, error } = await supabase
    .from('mystery_box_claims')
    .insert({ user_id: user.id, claimed_date: today, reward_type, reward_value: reward_value ?? {}, xp_awarded: safeXp })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already claimed today' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, claim: data })
}
