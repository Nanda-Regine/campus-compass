import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { currentMonthRange } from '@/lib/utils'
import { checkRateLimit } from '@/lib/rateLimit'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function GET(_request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rl = checkRateLimit(user.id, 'checkin', 5, 60_000)
    if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })

    const { start, end } = currentMonthRange()
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    const [
      { data: profile },
      { data: budget },
      { data: tasks },
      { data: doneTasks },
      { data: exams },
      { data: expenses },
      { data: modules },
    ] = await Promise.all([
      supabase.from('profiles').select('*, ai_language').eq('id', user.id).single(),
      supabase.from('budgets').select('*').eq('user_id', user.id).single(),
      supabase.from('tasks').select('*').eq('user_id', user.id).eq('done', false),
      supabase.from('tasks').select('*').eq('user_id', user.id).eq('done', true).gte('done_at', start),
      supabase.from('exams').select('*, module:modules(name)').eq('user_id', user.id).gte('exam_date', today).order('exam_date', { ascending: true }),
      supabase.from('expenses').select('*').eq('user_id', user.id).gte('date', start).lte('date', end),
      supabase.from('modules').select('*').eq('user_id', user.id),
    ])

    const totalBudget = (budget?.monthly_budget || 0) +
      (budget?.nsfas_enabled ? (budget.nsfas_living + budget.nsfas_accom + budget.nsfas_books) : 0)
    const totalSpent = expenses?.reduce((s, e) => s + e.amount, 0) || 0
    const remaining = totalBudget - totalSpent

    const overdueTasks = tasks?.filter(t => t.due_date && new Date(t.due_date) < now) || []
    const completedThisMonth = doneTasks?.length || 0
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dayOfMonth = now.getDate()
    const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100)

    const checkinLang = profile?.ai_language || 'English'
    const checkinLangNote = checkinLang !== 'English' ? `\nWRITE IN ${checkinLang}: Respond entirely in ${checkinLang}.` : ''

    const prompt = `You are Nova, a warm AI companion for South African university students. Write a personalised semester check-in for ${profile?.name?.split(' ')[0] || 'this student'}.${checkinLangNote}

THEIR SNAPSHOT:
- University: ${profile?.university?.split('(')[0]?.trim()}
- Year: ${profile?.year_of_study}
- Month progress: ${monthProgress}% through the month
- Completed tasks this month: ${completedThisMonth}
- Pending tasks: ${tasks?.length || 0} (${overdueTasks.length} overdue)
- Upcoming exams: ${exams?.length || 0}${exams?.[0] ? ` (next: ${exams[0].name})` : ''}
- Budget: R${remaining.toFixed(0)} remaining of R${totalBudget.toFixed(0)} (${totalBudget > 0 ? Math.round(((totalBudget - remaining) / totalBudget) * 100) : 0}% spent)
- Modules: ${modules?.length || 0}
- Funding: ${profile?.funding_type}

Write a check-in that feels like it's from a caring friend who's been watching their semester. Include:
1. Acknowledge what they've achieved (be specific with the data)
2. What to focus on right now (1-2 things max)
3. One encouraging closing line

Tone: warm, real, South African-coded. NOT corporate. NOT a list. 3 flowing paragraphs.
Maximum 180 words total.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const checkIn = response.content[0].type === 'text' ? response.content[0].text : ''

    // Also generate 3 personalised action items
    const actionPrompt = `Based on this student's data, give exactly 3 specific, actionable next steps.${checkinLangNote}

DATA: ${completedThisMonth} tasks done this month, ${overdueTasks.length} overdue, ${exams?.length || 0} exams ahead, R${remaining.toFixed(0)} remaining budget.

Respond with valid JSON only — array of 3 objects:
[
  { "icon": <emoji>, "action": <specific action, max 8 words>, "urgency": <"now" | "today" | "this week"> }
]`

    const actionResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: actionPrompt }],
    })

    const rawActions = actionResponse.content[0].type === 'text' ? actionResponse.content[0].text : '[]'
    const actions = JSON.parse(rawActions.replace(/```json|```/g, '').trim())

    return NextResponse.json({
      checkIn,
      actions,
      snapshot: {
        completedTasks: completedThisMonth,
        pendingTasks: tasks?.length || 0,
        overdueTasks: overdueTasks.length,
        upcomingExams: exams?.length || 0,
        nextExam: exams?.[0]?.name || null,
        budgetRemaining: remaining,
        budgetTotal: totalBudget,
        monthProgress,
      },
    })
  } catch (error) {
    console.error('Insights API error:', error)
    return NextResponse.json({ error: 'Failed to generate check-in' }, { status: 500 })
  }
}
