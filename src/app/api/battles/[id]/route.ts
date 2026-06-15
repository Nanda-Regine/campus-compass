import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/battles/[id] — get battle details
// [id] can be a UUID or a 6-char battle code
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isCode = params.id.length === 6
    let query = supabase.from('study_battles').select('*')
    query = isCode
      ? query.eq('battle_code', params.id.toUpperCase())
      : query.eq('id', params.id)

    const { data, error } = await query.single()
    if (error || !data) return NextResponse.json({ error: 'Battle not found' }, { status: 404 })

    // Fetch current XP for both players
    const userIds = [data.challenger_id, data.opponent_id].filter(Boolean)
    const { data: xpRows } = await supabase
      .from('user_xp_state')
      .select('user_id, total_xp')
      .in('user_id', userIds)

    const xpMap: Record<string, number> = {}
    for (const r of xpRows ?? []) xpMap[r.user_id] = r.total_xp

    return NextResponse.json({
      battle: data,
      live_xp: {
        challenger: xpMap[data.challenger_id] ?? data.challenger_xp_start ?? 0,
        opponent:   data.opponent_id ? (xpMap[data.opponent_id] ?? data.opponent_xp_start ?? 0) : null,
      },
    })
  } catch (err) {
    console.error('Battle GET error:', err)
    return NextResponse.json({ error: 'Failed to load battle' }, { status: 500 })
  }
}

// PATCH /api/battles/[id]
// body: { action: 'join' | 'cancel' | 'compute_result' }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action } = await req.json()

    // Fetch battle by UUID or code
    const isCode = params.id.length === 6
    let q = supabase.from('study_battles').select('*')
    q = isCode ? q.eq('battle_code', params.id.toUpperCase()) : q.eq('id', params.id)
    const { data: battle, error: fetchErr } = await q.single()
    if (fetchErr || !battle) return NextResponse.json({ error: 'Battle not found' }, { status: 404 })

    if (action === 'join') {
      if (battle.status !== 'pending') {
        return NextResponse.json({ error: 'Battle is not open' }, { status: 409 })
      }
      if (battle.challenger_id === user.id) {
        return NextResponse.json({ error: 'Cannot join your own battle' }, { status: 400 })
      }

      const { data: xpRow } = await supabase
        .from('user_xp_state')
        .select('total_xp')
        .eq('user_id', user.id)
        .single()

      const now    = new Date()
      const endAt  = new Date(now.getTime() + battle.duration_hours * 60 * 60 * 1000)

      const { data, error } = await supabase
        .from('study_battles')
        .update({
          opponent_id:        user.id,
          opponent_xp_start:  xpRow?.total_xp ?? 0,
          status:             'active',
          start_at:           now.toISOString(),
          end_at:             endAt.toISOString(),
        })
        .eq('id', battle.id)
        .select()
        .single()

      if (error) throw error

      // Send push to challenger that their battle was accepted
      await supabase.functions.invoke('push-to-user', {
        body: {
          user_id: battle.challenger_id,
          title:   '⚔️ Battle accepted!',
          body:    'A student joined your study battle. The race is on!',
          url:     '/dashboard',
        },
      }).catch(() => {})

      return NextResponse.json({ battle: data })
    }

    if (action === 'cancel') {
      if (battle.challenger_id !== user.id) {
        return NextResponse.json({ error: 'Only the challenger can cancel' }, { status: 403 })
      }
      const { data, error } = await supabase
        .from('study_battles')
        .update({ status: 'cancelled' })
        .eq('id', battle.id)
        .select()
        .single()
      if (error) throw error
      return NextResponse.json({ battle: data })
    }

    if (action === 'compute_result') {
      if (battle.status !== 'active') {
        return NextResponse.json({ error: 'Battle is not active' }, { status: 409 })
      }
      if (new Date(battle.end_at) > new Date()) {
        return NextResponse.json({ error: 'Battle has not ended yet' }, { status: 409 })
      }

      // Read final XP for both players
      const { data: xpRows } = await supabase
        .from('user_xp_state')
        .select('user_id, total_xp')
        .in('user_id', [battle.challenger_id, battle.opponent_id].filter(Boolean))

      const xpMap: Record<string, number> = {}
      for (const r of xpRows ?? []) xpMap[r.user_id] = r.total_xp

      const challengerGain = (xpMap[battle.challenger_id] ?? 0) - (battle.challenger_xp_start ?? 0)
      const opponentGain   = battle.opponent_id
        ? (xpMap[battle.opponent_id] ?? 0) - (battle.opponent_xp_start ?? 0)
        : -1

      const winnerId = challengerGain >= opponentGain
        ? battle.challenger_id
        : battle.opponent_id

      const { data, error } = await supabase
        .from('study_battles')
        .update({
          status:            'complete',
          challenger_xp_end: xpMap[battle.challenger_id] ?? battle.challenger_xp_start,
          opponent_xp_end:   battle.opponent_id ? (xpMap[battle.opponent_id] ?? battle.opponent_xp_start) : null,
          winner_id:         winnerId,
        })
        .eq('id', battle.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ battle: data, challenger_gain: challengerGain, opponent_gain: opponentGain })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('Battle PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update battle' }, { status: 500 })
  }
}
