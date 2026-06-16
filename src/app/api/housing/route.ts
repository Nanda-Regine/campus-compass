export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface Payment { id: string; amount: number; date: string; note?: string }

const PLACE_TYPES = new Set(['res', 'digs', 'private', 'home', 'commune'])

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function clampMoney(v: unknown): number {
  const n = Number(v)
  if (!isFinite(n) || n < 0) return 0
  return Math.round(n * 100) / 100
}

function moneyOrNull(v: unknown): number | null {
  if (v == null || v === '') return null
  return clampMoney(v)
}

// GET /api/housing
export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('accommodation')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ record: data ?? null })
}

// POST /api/housing — create or update accommodation details
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const placeType = PLACE_TYPES.has(body.place_type) ? body.place_type : 'digs'
  const dueDay = body.rent_due_day ? Math.max(1, Math.min(31, parseInt(body.rent_due_day))) : null
  const housemates = body.num_housemates != null ? Math.max(0, Math.min(20, parseInt(body.num_housemates) || 0)) : 0

  const update: Record<string, unknown> = {
    user_id:            user.id,
    place_type:         placeType,
    name:               body.name ? String(body.name).slice(0, 160) : null,
    monthly_rent:       clampMoney(body.monthly_rent),
    deposit:            moneyOrNull(body.deposit),
    landlord_name:      body.landlord_name ? String(body.landlord_name).slice(0, 120) : null,
    landlord_contact:   body.landlord_contact ? String(body.landlord_contact).slice(0, 120) : null,
    lease_start:        body.lease_start || null,
    lease_end:          body.lease_end || null,
    is_nsfas_accredited: !!body.is_nsfas_accredited,
    includes_utilities: !!body.includes_utilities,
    num_housemates:     housemates,
    rent_due_day:       dueDay,
    notes:              body.notes ? String(body.notes).slice(0, 800) : null,
    updated_at:         new Date().toISOString(),
  }

  const { data: existing } = await supabase
    .from('accommodation')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) update.rent_payments = []

  const { data, error } = await supabase
    .from('accommodation')
    .upsert(update, { onConflict: 'user_id' })
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ record: data }, { status: existing ? 200 : 201 })
}

// PATCH /api/housing?action=pay  — log a rent payment
// PATCH /api/housing?action=unpay&payment_id=xxx — remove one
export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const action = new URL(request.url).searchParams.get('action')
  const body = await request.json().catch(() => ({}))

  const { data: rec, error: fetchErr } = await supabase
    .from('accommodation')
    .select('id, rent_payments')
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  if (!rec) return NextResponse.json({ error: 'Set up your place first' }, { status: 400 })

  const payments: Payment[] = Array.isArray(rec.rent_payments) ? rec.rent_payments : []
  let newPayments: Payment[]

  if (action === 'pay') {
    const amount = clampMoney(body.amount)
    if (amount <= 0) return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    const payment: Payment = {
      id: uid(),
      amount,
      date: body.date || new Date().toISOString().split('T')[0],
      note: body.note ? String(body.note).slice(0, 120) : undefined,
    }
    newPayments = [payment, ...payments].slice(0, 60)
  } else if (action === 'unpay') {
    if (!payments.some(p => p.id === body.payment_id))
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    newPayments = payments.filter(p => p.id !== body.payment_id)
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('accommodation')
    .update({ rent_payments: newPayments, updated_at: new Date().toISOString() })
    .eq('id', rec.id)
    .eq('user_id', user.id)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ record: data })
}
