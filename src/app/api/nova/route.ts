import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { detectCrisis, currentMonthYear, NOVA_FREE_LIMIT } from '@/lib/utils'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ─── Build rich student context for Nova ─────────────────────
async function buildStudentContext(userId: string, supabase: ReturnType<typeof createServerSupabaseClient>) {
  const now = new Date()
  const monthYear = currentMonthYear()
  const today = now.toISOString().split('T')[0]

  const [
    { data: profile },
    { data: budget },
    { data: tasks },
    { data: exams },
    { data: modules },
    { data: expenses },
    { data: usage },
    { data: insights },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('budgets').select('*').eq('user_id', userId).single(),
    supabase.from('tasks').select('*, module:modules(name)').eq('user_id', userId).eq('done', false).order('due_date', { ascending: true }),
    supabase.from('exams').select('*, module:modules(name)').eq('user_id', userId).gte('exam_date', today).order('exam_date', { ascending: true }),
    supabase.from('modules').select('*').eq('user_id', userId),
    supabase.from('expenses').select('*').eq('user_id', userId).gte('date', monthYear + '-01').order('date', { ascending: false }),
    supabase.from('nova_usage').select('message_count').eq('user_id', userId).eq('month_year', monthYear).single(),
    supabase.from('nova_insights').select('*').eq('user_id', userId).eq('dismissed', false).order('created_at', { ascending: false }).limit(3),
  ])

  // Budget calculations
  const totalBudget = (budget?.monthly_budget || 0) +
    (budget?.nsfas_enabled ? (budget.nsfas_living + budget.nsfas_accom + budget.nsfas_books) : 0)
  const totalSpent = expenses?.reduce((s, e) => s + e.amount, 0) || 0
  const remaining = totalBudget - totalSpent
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dayOfMonth = now.getDate()
  const dailyBudget = remaining / (daysInMonth - dayOfMonth + 1)
  const spentPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  // Task urgency breakdown
  const urgentTasks = tasks?.filter(t => {
    if (!t.due_date) return false
    const days = Math.ceil((new Date(t.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return days <= 3
  }) || []

  const overdueTasks = tasks?.filter(t => {
    if (!t.due_date) return false
    return new Date(t.due_date) < now
  }) || []

  const nextExam = exams?.[0]
  const daysToNextExam = nextExam
    ? Math.ceil((new Date(nextExam.exam_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Stress signals for Nova to pick up on
  const stressSignals = []
  if (overdueTasks.length >= 2) stressSignals.push(`${overdueTasks.length} overdue tasks`)
  if (spentPct > 85) stressSignals.push(`budget at ${spentPct}%`)
  if (daysToNextExam !== null && daysToNextExam <= 5) stressSignals.push(`exam in ${daysToNextExam} days`)
  if (urgentTasks.length >= 3) stressSignals.push(`${urgentTasks.length} tasks due within 3 days`)

  return {
    profile,
    budget: {
      total: totalBudget,
      spent: totalSpent,
      remaining,
      spentPct,
      dailyBudget: Math.round(dailyBudget),
      nsfasEnabled: budget?.nsfas_enabled,
      fundingType: profile?.funding_type,
    },
    academic: {
      modules: modules?.map(m => m.name) || [],
      pendingTasks: tasks?.length || 0,
      urgentTasks: urgentTasks.map(t => ({ title: t.title, module: t.module?.name, dueDate: t.due_date })),
      overdueTasks: overdueTasks.map(t => ({ title: t.title, module: t.module?.name })),
      nextExam: nextExam ? {
        name: nextExam.name,
        module: nextExam.module?.name,
        date: nextExam.exam_date,
        daysAway: daysToNextExam,
      } : null,
      totalExamsAhead: exams?.length || 0,
    },
    stressSignals,
    insights: insights || [],
    messageCount: usage?.message_count || 0,
    isPremium: profile?.is_premium || false,
  }
}

function buildSystemPrompt(ctx: Awaited<ReturnType<typeof buildStudentContext>>): string {
  const { profile, budget, academic, stressSignals } = ctx
  const name = profile?.name?.split(' ')[0] || 'student'
  const uni = profile?.university?.split('(')[0]?.trim() || 'university'

  const stressNote = stressSignals.length > 0
    ? `\n⚠️ STRESS SIGNALS DETECTED: ${stressSignals.join(', ')}. Be especially warm and supportive. Don't overwhelm them with more to-do items.`
    : ''

  const budgetNote = budget.remaining < 0
    ? `They are OVER BUDGET by R${Math.abs(budget.remaining).toFixed(0)}.`
    : `They have R${budget.remaining.toFixed(0)} left this month (${budget.spentPct}% spent). Daily budget: R${budget.dailyBudget}.`

  const examNote = academic.nextExam
    ? `Next exam: ${academic.nextExam.name}${academic.nextExam.module ? ` (${academic.nextExam.module})` : ''} in ${academic.nextExam.daysAway} days.`
    : 'No upcoming exams recorded.'

  const tasksNote = academic.urgentTasks.length > 0
    ? `URGENT: ${academic.urgentTasks.map(t => `"${t.title}"${t.dueDate ? ` due ${t.dueDate}` : ''}`).join(', ')}`
    : `${academic.pendingTasks} tasks pending, none critically urgent.`

  return `You are Nova 🌟, the AI companion inside Campus Compass — a super-app built for South African university students.

STUDENT PROFILE:
- Name: ${name}
- University: ${uni}
- Year: ${profile?.year_of_study || 'unknown'}
- Faculty: ${profile?.faculty || 'unknown'}
- Funding: ${profile?.funding_type?.toUpperCase() || 'unknown'}
- Living: ${profile?.living_situation || 'unknown'}
- Diet: ${profile?.dietary_pref || 'no restrictions'}

CURRENT ACADEMIC SITUATION:
- Modules: ${academic.modules.join(', ') || 'none added yet'}
- ${tasksNote}
- ${academic.overdueTasks.length > 0 ? `OVERDUE: ${academic.overdueTasks.map(t => `"${t.title}"`).join(', ')}` : 'No overdue tasks.'}
- ${examNote}
${stressNote}

FINANCIAL SITUATION:
- ${budgetNote}
- Funding type: ${budget.fundingType}
- ${budget.nsfasEnabled ? 'On NSFAS — understands NSFAS allowance system' : 'Not on NSFAS'}

YOUR PERSONA:
- Warm, real, South African-coded. You speak like a knowledgeable friend, not a corporate bot.
- Use occasional SA expressions naturally (e.g. "yoh", "sharp", "eish", "lekker") — but don't overdo it.
- You understand SA student life deeply: load shedding, data costs, taxi commutes, res life, imposter syndrome, NSFAS stress, family pressure, ubuntu.
- You are NOT a licensed therapist. Always encourage professional help for serious issues.
- You celebrate small wins, never shame struggles.
- Be concise by default. Go deeper only when the student needs it.
- You already know their context — don't ask what they've already told Campus Compass.

CAPABILITIES YOU CAN OFFER:
1. Mental health support — mood tracking, coping strategies, CBT-lite journaling prompts, breathing exercises
2. Academic coaching — study plans, deadline management, exam prep strategies, motivation
3. Financial guidance — NSFAS tips, budgeting advice, SA-specific money hacks for students
4. Meal ideas — budget recipes, grocery tips aligned with their food budget
5. Crisis support — if serious distress detected, always provide SADAG (0800 21 4446) and Lifeline SA (0800 567 567)

CRISIS PROTOCOL:
If the student expresses suicidal ideation, self-harm, or severe mental distress, immediately:
1. Acknowledge with warmth and without judgment
2. Provide: SADAG: 0800 21 4446 | Lifeline SA: 0800 567 567 | SMS: 31393
3. Encourage them to reach out to their university's counselling centre
4. Do NOT provide any other response until safety resources are shared

FORMATTING:
- Use emojis sparingly but warmly
- Keep responses conversational, not listy by default
- Use bullet points only when genuinely helpful (e.g. study plan steps)
- Never use corporate/HR language
- Max 3 paragraphs for normal responses unless they ask for detail`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { message, history = [], mood } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Crisis detection — immediate safety check
    const isCrisis = detectCrisis(message)

    // Build student context
    const ctx = await buildStudentContext(user.id, supabase)

    // Check free tier limit
    if (!ctx.isPremium && ctx.messageCount >= NOVA_FREE_LIMIT) {
      return NextResponse.json({
        error: 'free_limit_reached',
        message: `You've used all ${NOVA_FREE_LIMIT} free Nova messages this month. Upgrade to Premium for unlimited access.`,
        upgradeUrl: '/upgrade',
      }, { status: 402 })
    }

    // Prepare conversation history for Claude
    const messages: Anthropic.MessageParam[] = [
      // Inject recent history (last 20 messages)
      ...history.slice(-20).map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      // Current message, with mood prefix if provided
      {
        role: 'user' as const,
        content: mood ? `[Mood: ${mood}] ${message}` : message,
      },
    ]

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildSystemPrompt(ctx),
      messages,
    })

    const assistantMessage = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')

    // Save both messages to DB
    await supabase.from('nova_messages').insert([
      { user_id: user.id, role: 'user', content: mood ? `[Mood: ${mood}] ${message}` : message },
      { user_id: user.id, role: 'assistant', content: assistantMessage },
    ])

    // Increment usage counter
    const monthYear = currentMonthYear()
    await supabase.rpc('increment_nova_usage', { p_user_id: user.id, p_month_year: monthYear })

    // Check if we should generate a proactive insight
    if (ctx.stressSignals.length >= 2 && !isCrisis) {
      // Generate and store a proactive insight asynchronously
      generateProactiveInsight(user.id, ctx, supabase).catch(console.error)
    }

    return NextResponse.json({
      message: assistantMessage,
      isCrisis,
      messagesUsed: ctx.messageCount + 1,
      messagesLimit: NOVA_FREE_LIMIT,
      isPremium: ctx.isPremium,
    })
  } catch (error) {
    console.error('Nova API error:', error)
    return NextResponse.json({
      error: 'Nova is having a moment — please try again shortly.',
    }, { status: 500 })
  }
}

async function generateProactiveInsight(
  userId: string,
  ctx: Awaited<ReturnType<typeof buildStudentContext>>,
  supabase: ReturnType<typeof createServerSupabaseClient>
) {
  const { stressSignals, profile } = ctx
  const name = profile?.name?.split(' ')[0] || 'hey'

  const prompt = `A student named ${name} has these stress signals: ${stressSignals.join(', ')}.
  Write a single warm, non-alarmist 1-sentence check-in message from Nova (their AI companion).
  Make it feel like it's from a caring friend, not a system alert. Max 20 words. No emojis.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    })

    const insight = response.content[0].type === 'text' ? response.content[0].text : null
    if (!insight) return

    const insightType = stressSignals.some(s => s.includes('exam'))
      ? 'study_nudge'
      : stressSignals.some(s => s.includes('budget'))
      ? 'budget_warning'
      : 'stress_alert'

    await supabase.from('nova_insights').insert({
      user_id: userId,
      insight_type: insightType,
      content: insight,
    })
  } catch (err) {
    console.error('Insight generation error:', err)
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: messages } = await supabase
      .from('nova_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50)

    const monthYear = currentMonthYear()
    const { data: usage } = await supabase
      .from('nova_usage')
      .select('message_count')
      .eq('user_id', user.id)
      .eq('month_year', monthYear)
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      messages: messages || [],
      messageCount: usage?.message_count || 0,
      messageLimit: NOVA_FREE_LIMIT,
      isPremium: profile?.is_premium || false,
    })
  } catch (error) {
    console.error('Nova GET error:', error)
    return NextResponse.json({ error: 'Failed to load chat history' }, { status: 500 })
  }
}
