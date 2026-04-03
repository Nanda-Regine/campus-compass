import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { currentMonthRange, currentMonthYear } from '@/lib/utils'

// Called after each expense insert to check for 80% budget threshold
export async function POST() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { start, end } = currentMonthRange()
    const monthYear = currentMonthYear()

    const [{ data: budget }, { data: expenses }] = await Promise.all([
      supabase.from('budgets').select('monthly_budget, nsfas_enabled, nsfas_living, nsfas_accom, nsfas_books').eq('user_id', user.id).single(),
      supabase.from('expenses').select('amount').eq('user_id', user.id).gte('date', start).lte('date', end),
    ])

    if (!budget || !expenses) return NextResponse.json({ ok: false })

    const totalBudget = (budget.monthly_budget || 0) +
      (budget.nsfas_enabled ? (budget.nsfas_living + budget.nsfas_accom + budget.nsfas_books) : 0)
    if (totalBudget <= 0) return NextResponse.json({ ok: false })

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
    const spentPct = totalSpent / totalBudget

    if (spentPct < 0.8) return NextResponse.json({ ok: false, reason: 'below_threshold' })

    // Check if we already created a budget_80_warning insight this month
    const { data: existing } = await supabase
      .from('nova_insights')
      .select('id')
      .eq('user_id', user.id)
      .eq('insight_type', 'budget_80_warning')
      .gte('created_at', start)
      .limit(1)
      .single()

    if (existing) return NextResponse.json({ ok: false, reason: 'already_alerted' })

    // Calculate days remaining
    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysLeft = daysInMonth - now.getDate()

    await supabase.from('nova_insights').insert({
      user_id: user.id,
      insight_type: 'budget_80_warning',
      content: `You've used ${Math.round(spentPct * 100)}% of your R${totalBudget.toFixed(0)} budget with ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left this month. Nova can help you find ways to stretch what's left — just ask.`,
    })

    return NextResponse.json({ ok: true, alerted: true, spentPct: Math.round(spentPct * 100) })
  } catch (error) {
    console.error('Budget alert error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
