export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface Payment { id: string; amount: number; date: string; note?: string }

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function clampMoney(v: unknown): number {
  const n = Number(v)
  if (!isFinite(n) || n < 0) return 0
  return Math.round(n * 100) / 100
}

// GET /api/budget/fees?year=2026
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const year = parseInt(new URL(request.url).searchParams.get('year') ?? '') || new Date().getFullYear()

  const { data, error } = await supabase
    .from('academic_fees')
    .select('*')
    .eq('user_id', user.id)
    .eq('academic_year', year)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ record: data ?? null, year })
}

// POST /api/budget/fees — create or update the fee account for a year
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const year = parseInt(body.academic_year) || new Date().getFullYear()

  const update: Record<string, unknown> = {
    user_id:       user.id,
    academic_year: year,
    total_fees:    clampMoney(body.total_fees),
    institution:   body.institution ? String(body.institution).slice(0, 120) : null,
    block_threshold: body.block_threshold != null && body.block_threshold !== '' ? clampMoney(body.block_threshold) : null,
    payment_plan:  body.payment_plan ? String(body.payment_plan).slice(0, 600) : null,
    next_payment_amount: body.next_payment_amount != null && body.next_payment_amount !== '' ? clampMoney(body.next_payment_amount) : null,
    next_payment_date:   body.next_payment_date || null,
    updated_at:    new Date().toISOString(),
  }

  // Preserve an existing amount_paid / payments log; only set on first create
  const { data: existing } = await supabase
    .from('academic_fees')
    .select('id')
    .eq('user_id', user.id)
    .eq('academic_year', year)
    .maybeSingle()

  if (!existing) {
    update.amount_paid = clampMoney(body.amount_paid)
    update.payments = []
  }

  const { data, error } = await supabase
    .from('academic_fees')
    .upsert(update, { onConflict: 'user_id,academic_year' })
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ record: data }, { status: existing ? 200 : 201 })
}

// PATCH /api/budget/fees?action=pay  — log a payment (increments amount_paid)
// PATCH /api/budget/fees?action=unpay&payment_id=xxx  — remove a logged payment
export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const action = url.searchParams.get('action')
  const body = await request.json().catch(() => ({}))
  const year = parseInt(body.academic_year) || new Date().getFullYear()

  const { data: rec, error: fetchErr } = await supabase
    .from('academic_fees')
    .select('id, amount_paid, payments')
    .eq('user_id', user.id)
    .eq('academic_year', year)
    .maybeSingle()

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  if (!rec) return NextResponse.json({ error: 'Set up your fee account first' }, { status: 400 })

  const payments: Payment[] = Array.isArray(rec.payments) ? rec.payments : []

  let newPayments: Payment[]
  let newPaid: number

  if (action === 'pay') {
    const amount = clampMoney(body.amount)
    if (amount <= 0) return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    const payment: Payment = {
      id: uid(),
      amount,
      date: body.date || new Date().toISOString().split('T')[0],
      note: body.note ? String(body.note).slice(0, 120) : undefined,
    }
    newPayments = [payment, ...payments].slice(0, 100)
    newPaid = clampMoney(Number(rec.amount_paid) + amount)
  } else if (action === 'unpay') {
    const pid = body.payment_id
    const removed = payments.find(p => p.id === pid)
    if (!removed) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    newPayments = payments.filter(p => p.id !== pid)
    newPaid = clampMoney(Number(rec.amount_paid) - removed.amount)
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('academic_fees')
    .update({ amount_paid: newPaid, payments: newPayments, updated_at: new Date().toISOString() })
    .eq('id', rec.id)
    .eq('user_id', user.id)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ record: data })
}
