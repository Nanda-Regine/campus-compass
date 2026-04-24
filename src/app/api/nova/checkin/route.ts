export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit } from '@/lib/rateLimit'
import { currentMonthRange } from '@/lib/utils'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rl = checkRateLimit(user.id, 'nova_checkin', 5, 60_000)
    if (!rl.allowed) return NextResponse.json({ error: 'Rate limit' }, { status: 429 })

    const { start, end } = currentMonthRange()
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const hour = now.getHours()
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

    const [{ data: profile }, { data: overdueTasks }, { data: exams }, { data: expenses }, { data: budget }] = await Promise.all([
      supabase.from('profiles').select('full_name, university').eq('id', user.id).single(),
      supabase.from('tasks').select('id').eq('user_id', user.id).neq('status', 'done').lt('due_date', today),
      supabase.from('exams').select('exam_name, exam_date').eq('user_id', user.id).gte('exam_date', today).order('exam_date', { ascending: true }).limit(1),
      supabase.from('expenses').select('amount').eq('user_id', user.id).gte('expense_date', start).lte('expense_date', end),
      supabase.from('budgets').select('monthly_budget, nsfas_enabled, nsfas_living, nsfas_accom, nsfas_books').eq('user_id', user.id).single(),
    ])

    const firstName = profile?.full_name?.split(' ')[0] || 'friend'
    const overdueCount = overdueTasks?.length || 0
    const nextExam = exams?.[0]
    const totalSpent = expenses?.reduce((s, e) => s + (e.amount as number), 0) || 0
    const totalBudget =
      ((budget?.monthly_budget as number) || 0) +
      (budget?.nsfas_enabled
        ? (((budget?.nsfas_living as number) || 0) + ((budget?.nsfas_accom as number) || 0) + ((budget?.nsfas_books as number) || 0))
        : 0)
    const budgetLeft = totalBudget - totalSpent

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: 'You are Nova, a warm SA student AI companion. Generate one short (1–2 sentence) personalised check-in message. Be warm, specific, encouraging. Reference time of day. Never be generic. Never use quotes. Just the message.',
      messages: [{
        role: 'user',
        content: `Student: ${firstName}. Time: ${timeOfDay}. ${overdueCount > 0 ? `${overdueCount} overdue tasks.` : 'No overdue tasks.'} ${nextExam ? `Upcoming exam: "${nextExam.exam_name}" on ${nextExam.exam_date}.` : 'No upcoming exams.'} ${totalBudget > 0 ? `R${Math.round(budgetLeft)} budget remaining.` : 'Budget not set.'}`,
      }],
    })

    const message = response.content[0].type === 'text'
      ? response.content[0].text.trim()
      : "Nova's thinking about you. Tap to chat. 💜"

    return NextResponse.json({ message })
  } catch {
    return NextResponse.json({ message: "Nova's thinking about you. Tap to chat. 💜" })
  }
}
