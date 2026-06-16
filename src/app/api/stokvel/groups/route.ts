export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const VALID_FREQUENCY = new Set(['weekly', 'biweekly', 'monthly'])

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Stokvels created by user + stokvels user has joined as a member
  const [{ data: created }, { data: memberRows }] = await Promise.all([
    supabase.from('stokvels')
      .select('*, stokvel_circle_members(id, user_id, email, display_name, payout_position, status, invite_token, joined_at)')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('stokvel_circle_members')
      .select('stokvel_id')
      .eq('user_id', user.id)
      .eq('status', 'joined'),
  ])

  const memberStokvelIds = (memberRows || []).map(r => r.stokvel_id)
  let joined: typeof created = []
  if (memberStokvelIds.length > 0) {
    const { data } = await supabase.from('stokvels')
      .select('*, stokvel_circle_members(id, user_id, email, display_name, payout_position, status, invite_token, joined_at)')
      .in('id', memberStokvelIds)
      .order('created_at', { ascending: false })
      .limit(20)
    joined = data || []
  }

  const createdIds = new Set((created || []).map((s: { id: string }) => s.id))
  const stokvels = [
    ...(created || []),
    ...(joined || []).filter((s: { id: string }) => !createdIds.has(s.id)),
  ]

  return NextResponse.json({ stokvels })
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description, contribution_amount, frequency, members } = await request.json()

  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })
  const amount = Number(contribution_amount)
  if (!amount || amount <= 0) return NextResponse.json({ error: 'valid contribution_amount required' }, { status: 400 })
  if (!VALID_FREQUENCY.has(String(frequency))) return NextResponse.json({ error: 'invalid frequency' }, { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('full_name,email').eq('id', user.id).maybeSingle()

  const { data: stokvel, error } = await supabase
    .from('stokvels')
    .insert({
      created_by: user.id,
      name: String(name).slice(0, 100),
      description: description ? String(description).slice(0, 500) : null,
      contribution_amount: amount,
      frequency: String(frequency),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Add creator as first member (payout_position 1)
  await supabase.from('stokvel_circle_members').insert({
    stokvel_id: stokvel.id,
    user_id: user.id,
    email: user.email || '',
    display_name: profile?.full_name || user.email || 'You',
    payout_position: 1,
    status: 'joined',
    joined_at: new Date().toISOString(),
  })

  // Add additional members from the invite list
  const extras = Array.isArray(members) ? members : []
  for (let i = 0; i < Math.min(extras.length, 19); i++) {
    const m = extras[i]
    if (!m?.email) continue
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    await supabase.from('stokvel_circle_members').insert({
      stokvel_id: stokvel.id,
      email: String(m.email).toLowerCase().slice(0, 100),
      display_name: m.name ? String(m.name).slice(0, 80) : null,
      payout_position: i + 2,
      status: 'invited',
      invite_token: token,
    })
  }

  return NextResponse.json({ stokvel })
}
