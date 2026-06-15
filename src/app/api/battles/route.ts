import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// GET /api/battles — list caller's battles (active + pending + last 5 complete)
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('study_battles')
      .select('*')
      .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
      .in('status', ['pending', 'active', 'complete'])
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error
    return NextResponse.json({ battles: data ?? [] })
  } catch (err) {
    console.error('Battles GET error:', err)
    return NextResponse.json({ error: 'Failed to load battles' }, { status: 500 })
  }
}

// POST /api/battles — create a new battle
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const durationHours = [24, 48, 168].includes(Number(body.duration_hours))
      ? Number(body.duration_hours)
      : 24

    // Read challenger's current XP from user_xp_state
    const { data: xpRow } = await supabase
      .from('user_xp_state')
      .select('total_xp')
      .eq('user_id', user.id)
      .single()

    const challengerXpStart = xpRow?.total_xp ?? 0

    // Generate unique code (retry on collision, max 5 attempts)
    let code = genCode()
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: existing } = await supabase
        .from('study_battles')
        .select('id')
        .eq('battle_code', code)
        .single()
      if (!existing) break
      code = genCode()
    }

    const { data, error } = await supabase
      .from('study_battles')
      .insert({
        challenger_id:       user.id,
        battle_code:         code,
        duration_hours:      durationHours,
        status:              'pending',
        challenger_xp_start: challengerXpStart,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ battle: data })
  } catch (err) {
    console.error('Battles POST error:', err)
    return NextResponse.json({ error: 'Failed to create battle' }, { status: 500 })
  }
}
