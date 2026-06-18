import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]
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

  const today = new Date().toISOString().split('T')[0]
  const { reward_type, reward_value, xp_awarded } = await req.json() as {
    reward_type: string; reward_value: Record<string, unknown>; xp_awarded: number
  }

  const { data, error } = await supabase
    .from('mystery_box_claims')
    .insert({ user_id: user.id, claimed_date: today, reward_type, reward_value, xp_awarded })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already claimed today' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, claim: data })
}
