export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

async function isMember(supabase: ReturnType<typeof createServerSupabaseClient>, stokvelId: string, userId: string) {
  const [{ data: owner }, { data: member }] = await Promise.all([
    supabase.from('stokvels').select('id').eq('id', stokvelId).eq('created_by', userId).maybeSingle(),
    supabase.from('stokvel_circle_members').select('id').eq('stokvel_id', stokvelId).eq('user_id', userId).eq('status', 'joined').maybeSingle(),
  ])
  return !!(owner || member)
}

// GET /api/stokvel/contributions?stokvel_id=xxx&round=N
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = new URL(request.url).searchParams
  const stokvelId = params.get('stokvel_id')
  const round = params.get('round')
  if (!stokvelId) return NextResponse.json({ error: 'stokvel_id required' }, { status: 400 })

  if (!(await isMember(supabase, stokvelId, user.id)))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let query = supabase
    .from('stokvel_circle_contributions')
    .select('id, member_id, round_number, amount, paid_at')
    .eq('stokvel_id', stokvelId)
    .order('round_number', { ascending: false })
    .order('paid_at', { ascending: false })

  if (round) query = query.eq('round_number', Number(round))

  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contributions: data || [] })
}

// POST /api/stokvel/contributions — mark a contribution as paid (creator or self)
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { stokvel_id, member_id, round_number } = await request.json()
  if (!stokvel_id || !member_id || !round_number)
    return NextResponse.json({ error: 'stokvel_id, member_id, round_number required' }, { status: 400 })

  // Verify the caller is either the stokvel creator or the member themselves
  const { data: stokvel } = await supabase.from('stokvels').select('created_by, contribution_amount').eq('id', stokvel_id).maybeSingle()
  if (!stokvel) return NextResponse.json({ error: 'Stokvel not found' }, { status: 404 })

  const { data: member } = await supabase.from('stokvel_circle_members').select('user_id').eq('id', member_id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  if (stokvel.created_by !== user.id && member.user_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('stokvel_circle_contributions')
    .upsert({
      stokvel_id,
      member_id,
      round_number: Number(round_number),
      amount: stokvel.contribution_amount,
      paid_at: new Date().toISOString(),
    }, { onConflict: 'member_id,round_number' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contribution: data })
}

// DELETE /api/stokvel/contributions?member_id=xxx&round=N — unmark (creator only)
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = new URL(request.url).searchParams
  const memberId = params.get('member_id')
  const round = params.get('round')
  if (!memberId || !round) return NextResponse.json({ error: 'member_id and round required' }, { status: 400 })

  const { data: member } = await supabase.from('stokvel_circle_members').select('stokvel_id').eq('id', memberId).maybeSingle()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Only creator can unmark
  const { data: stokvel } = await supabase.from('stokvels').select('id').eq('id', member.stokvel_id).eq('created_by', user.id).maybeSingle()
  if (!stokvel) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await supabase.from('stokvel_circle_contributions').delete().eq('member_id', memberId).eq('round_number', Number(round))
  return NextResponse.json({ success: true })
}
