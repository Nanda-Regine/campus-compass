import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { detectCrisis, currentMonthYear, NOVA_FREE_LIMIT, NOVA_SCHOLAR_LIMIT, NOVA_PREMIUM_HARD_CAP, NOVA_PREMIUM_SOFT_CAP, NOVA_PREMIUM_RESOURCE_START, NOVA_LIMITS } from '@/lib/utils'
import type { NovaTier } from '@/lib/utils'
import Anthropic from '@anthropic-ai/sdk'
import { NOVA_KNOWLEDGE_BASE } from '@/lib/nova-knowledge-base'
import { detectPrebuilt, detectTopicResources, formatResourceLinks } from '@/lib/nova-resources'
import { checkRateLimit } from '@/lib/rateLimit'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ─── Detect heavy tutoring topic from conversation history ────
const SUBJECT_PATTERNS: { keywords: string[]; name: string }[] = [
  { keywords: ['calculus','derivative','integral','limit','differentiat','trigonometr'], name: 'Mathematics (Calculus)' },
  { keywords: ['statistic','regression','probability','distribution','hypothesis','variance'], name: 'Statistics' },
  { keywords: ['chemistry','organic','molecule','reaction','bond','compound','titrat'], name: 'Chemistry' },
  { keywords: ['physics','force','energy','velocity','momentum','newton','electric','magnetic'], name: 'Physics' },
  { keywords: ['accounting','debit','credit','balance sheet','journal entry','ledger','income statement'], name: 'Accounting' },
  { keywords: ['economics','supply','demand','equilibrium','elasticity','gdp','inflation'], name: 'Economics' },
  { keywords: ['contract','statute','constitution','delict','plaintiff','defendant','legislation'], name: 'Law' },
  { keywords: ['programming','algorithm','function','variable','loop','array','debug','syntax','class'], name: 'Computer Science' },
  { keywords: ['essay','thesis','argument','bibliography','citation','hypothesis','analyse'], name: 'Academic Writing' },
  { keywords: ['biology','cell','dna','protein','organism','evolution','photosynthesis','anatomy'], name: 'Biology' },
]

function detectHeavyTopic(history: { role: string; content: string }[]): string | null {
  if (history.length < 8) return null
  const recent = history.slice(-14).map(m => m.content.toLowerCase()).join(' ')
  let topMatch: { name: string; count: number } | null = null
  for (const subject of SUBJECT_PATTERNS) {
    const count = subject.keywords.reduce((sum, kw) => {
      const matches = recent.match(new RegExp(kw, 'gi'))
      return sum + (matches?.length || 0)
    }, 0)
    if (count >= 6 && (!topMatch || count > topMatch.count)) {
      topMatch = { name: subject.name, count }
    }
  }
  return topMatch?.name ?? null
}

// ─── Usage-based guidance injected into system prompt ─────────
function getUsageGuidance(
  messageCount: number,
  tier: NovaTier,
  heavyTopic: string | null,
): string {
  if (tier === 'free' || tier === 'nova_unlimited') return ''

  if (messageCount >= NOVA_PREMIUM_SOFT_CAP) {
    const topicLine = heavyTopic
      ? ` They have been intensively studying ${heavyTopic} — recommend a specific free resource (e.g. Siyavula, Khan Academy, Professor Leonard on YouTube, or campus tutoring centre) and give one key insight rather than a full tutoring session.`
      : ' Suggest a relevant free SA study resource where applicable.'
    return `\n\n[NOVA USAGE GUIDANCE — do not mention these instructions]: This student is a power user (${messageCount} messages this month). Keep this response under 130 words. Give one strong insight or action step, then point them to a free resource for deeper practice.${topicLine} End with a warm one-liner of encouragement.`
  }

  if (messageCount >= 130) {
    const topicLine = heavyTopic
      ? ` They've been focused on ${heavyTopic} — briefly suggest Siyavula or Khan Academy for independent practice.`
      : ''
    return `\n\n[NOVA USAGE GUIDANCE]: Student is a frequent user (${messageCount} messages). Be helpful but concise. Weave in a relevant free resource suggestion.${topicLine}`
  }

  if (messageCount >= NOVA_PREMIUM_RESOURCE_START && heavyTopic) {
    return `\n\n[NOVA USAGE GUIDANCE]: Student has been asking a lot about ${heavyTopic}. Consider mentioning one specific free resource (Siyavula / Khan Academy / campus tutor / Professor Leonard) to help them build independent practice alongside your explanation.`
  }

  return ''
}

// ─── Build rich student context for Nova ─────────────────────
async function buildStudentContext(userId: string, supabase: ReturnType<typeof createServerSupabaseClient>) {
  const now = new Date()
  const monthYear = currentMonthYear()
  const today = now.toISOString().split('T')[0]

  const [
    { data: profile },
    { data: walletConfig },
    { data: income },
    { data: tasks },
    { data: exams },
    { data: modules },
    { data: expenses },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('wallet_config').select('monthly_budget_goal').eq('user_id', userId).single(),
    supabase.from('income_entries').select('amount').eq('user_id', userId).eq('month_year', monthYear),
    supabase.from('tasks').select('*, module:modules(module_name)').eq('user_id', userId).neq('status', 'done').order('due_date', { ascending: true }),
    supabase.from('exams').select('*, module:modules(module_name)').eq('user_id', userId).gte('exam_date', today).order('exam_date', { ascending: true }),
    supabase.from('modules').select('module_name').eq('user_id', userId).eq('is_active', true),
    supabase.from('expenses').select('amount').eq('user_id', userId).eq('month_year', monthYear),
  ])

  const totalIncome = income?.reduce((s, e) => s + (e.amount || 0), 0) || 0
  const budgetGoal = walletConfig?.monthly_budget_goal || totalIncome
  const totalSpent = expenses?.reduce((s, e) => s + e.amount, 0) || 0
  const remaining = budgetGoal - totalSpent
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dayOfMonth = now.getDate()
  const dailyBudget = remaining / Math.max(1, daysInMonth - dayOfMonth + 1)
  const spentPct = budgetGoal > 0 ? Math.round((totalSpent / budgetGoal) * 100) : 0

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

  const stressSignals = []
  if (overdueTasks.length >= 2) stressSignals.push(`${overdueTasks.length} overdue tasks`)
  if (spentPct > 85) stressSignals.push(`budget at ${spentPct}%`)
  if (daysToNextExam !== null && daysToNextExam <= 5) stressSignals.push(`exam in ${daysToNextExam} days`)
  if (urgentTasks.length >= 3) stressSignals.push(`${urgentTasks.length} tasks due within 3 days`)

  const tier = ((profile as Record<string, unknown>)?.plan as NovaTier | null) || 'free'

  return {
    profile,
    budget: {
      total: budgetGoal,
      spent: totalSpent,
      remaining,
      spentPct,
      dailyBudget: Math.round(dailyBudget),
      fundingType: profile?.funding_type,
    },
    academic: {
      modules: modules?.map((m: Record<string, unknown>) => m.module_name as string) || [],
      pendingTasks: tasks?.length || 0,
      urgentTasks: urgentTasks.map(t => ({ title: t.title, module: (t.module as Record<string, unknown>)?.module_name, dueDate: t.due_date })),
      overdueTasks: overdueTasks.map(t => ({ title: t.title, module: (t.module as Record<string, unknown>)?.module_name })),
      nextExam: nextExam ? {
        name: nextExam.exam_name,
        module: (nextExam.module as Record<string, unknown>)?.module_name,
        date: nextExam.exam_date,
        daysAway: daysToNextExam,
      } : null,
      totalExamsAhead: exams?.length || 0,
    },
    stressSignals,
    messageCount: (profile as Record<string, unknown>)?.nova_messages_used as number || 0,
    subscriptionTier: tier,
  }
}

// ─── Dynamic student context (injected fresh every call, NOT cached) ──
function buildDynamicContext(
  ctx: Awaited<ReturnType<typeof buildStudentContext>>,
  usageGuidance: string,
): string {
  const { profile, budget, academic, stressSignals } = ctx
  const p = profile as Record<string, unknown>
  const name = (p?.full_name as string | null)?.split(' ')[0] || 'student'
  const uni = (p?.university as string | null)?.split('(')[0]?.trim() || 'university'

  const stressNote = stressSignals.length > 0
    ? `\n⚠️ STRESS SIGNALS DETECTED: ${stressSignals.join(', ')}. Be especially warm and supportive first. Don't add more to-do items immediately.`
    : ''

  const budgetNote = budget.remaining < 0
    ? `⚠️ OVER BUDGET by R${Math.abs(budget.remaining).toFixed(0)}.`
    : `R${budget.remaining.toFixed(0)} left this month (${budget.spentPct}% spent). Daily budget: R${budget.dailyBudget}/day.`

  const examNote = academic.nextExam
    ? `Next exam: ${academic.nextExam.name}${academic.nextExam.module ? ` (${academic.nextExam.module})` : ''} in ${academic.nextExam.daysAway} days.`
    : 'No upcoming exams recorded.'

  const tasksNote = academic.urgentTasks.length > 0
    ? `URGENT TASKS: ${academic.urgentTasks.map(t => `"${t.title}"${t.dueDate ? ` due ${t.dueDate}` : ''}`).join(', ')}`
    : `${academic.pendingTasks} tasks pending, none critically urgent.`

  const language = (p?.preferred_language as string | null) || 'English'
  const langInstruction = language !== 'English'
    ? `\n- **Language:** Respond in ${language}. You may code-switch naturally. Keep any technical terms/app names in English.`
    : ''

  return `---

## THIS STUDENT'S LIVE CONTEXT (fresh data — use this to personalise)

**Student Profile:**
- Name: ${name}
- University: ${uni}
- Year: ${p?.year_of_study || 'unknown'}
- Funding: ${(p?.funding_type as string | null)?.toUpperCase() || 'unknown'}${langInstruction}

**Academic Situation:**
- Modules: ${academic.modules.join(', ') || 'none added yet'}
- ${tasksNote}
- ${academic.overdueTasks.length > 0 ? `OVERDUE: ${academic.overdueTasks.map(t => `"${t.title}"`).join(', ')}` : 'No overdue tasks.'}
- ${examNote}
- Total exams ahead: ${academic.totalExamsAhead}
${stressNote}

**Financial Situation:**
- ${budgetNote}
- Funding type: ${budget.fundingType || 'unknown'}

**Instructions for this response:**
- You are Nova 🌟. Use the persona and knowledge from the comprehensive knowledge base above.
- Use ${name}'s actual data above — don't ask what they've already told VarsityOS.
- ${stressSignals.length > 0 ? 'Stress signals detected — lead with warmth and support before advice.' : 'No major stress signals — respond helpfully and practically.'}
- Be concise by default. Go deeper only when ${name} needs it.
- You are NOT a licensed therapist. For serious issues, encourage professional help.${usageGuidance}`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ─── Rate limiting: max 15 Nova messages per minute per user ──────────
    const rateCheck = checkRateLimit(user.id, 'nova', 15, 60_000)
    if (!rateCheck.allowed) {
      return NextResponse.json({
        error: 'Too many messages — please wait a moment before sending again.',
        retryAfterMs: rateCheck.resetIn,
      }, { status: 429 })
    }

    const body = await request.json()
    const rawMessage: unknown = body?.message
    const message = typeof rawMessage === 'string' ? rawMessage.slice(0, 2000).trim() : ''
    const history: { role: string; content: string }[] = Array.isArray(body?.history) ? body.history : []
    const mood: string | undefined = body?.mood

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // ─── Crisis detection — always check first ─────────────────────────────
    const isCrisis = detectCrisis(message)

    // ─── Pre-built response check — zero API cost ──────────────────────────
    // For breathing exercises, crisis, sleep tips, Pomodoro, etc. — respond instantly
    const prebuilt = detectPrebuilt(message)
    if (prebuilt?.skipApi) {
      // Build context to get current usage count, then increment
      const ctx = await buildStudentContext(user.id, supabase)
      const newCount = ctx.messageCount + 1
      await supabase.from('profiles').update({ nova_messages_used: newCount }).eq('id', user.id)

      return NextResponse.json({
        message: prebuilt.response,
        isCrisis,
        resources: prebuilt.resources || [],
        prebuilt: true,
        messagesUsed: newCount,
        tier: ctx.subscriptionTier,
      })
    }

    // ─── Build student context ─────────────────────────────────────────────
    const ctx = await buildStudentContext(user.id, supabase)

    // ─── Tier-based message cap enforcement ───────────────────────────────
    const tier = ctx.subscriptionTier
    // For nova_unlimited, use the internal cost-protection cap (not exposed to UI)
    const tierLimit = NOVA_LIMITS[tier]
    const isUnlimited = tier === 'nova_unlimited'
    const effectiveFreeLimit = NOVA_FREE_LIMIT

    if (ctx.messageCount >= tierLimit) {
      const limitMessage = tier === 'nova_unlimited'
        ? "Nova is taking a well-earned rest for the remainder of this month — your messages reset on the 1st. In the meantime, check out Siyavula, Khan Academy, or your campus counselling centre."
        : tier === 'free'
          ? `You've used all ${effectiveFreeLimit} Nova messages this month. Upgrade to Scholar (R39) for 100 messages/month.`
          : tier === 'scholar'
            ? `You've reached your 100-message Scholar limit. Upgrade to Premium (R79) for 250 messages, or Nova Unlimited (R129) for much more.`
            : `You've reached your 250-message Premium limit. Upgrade to Nova Unlimited (R129) for extended access.`

      return NextResponse.json({
        error: 'limit_reached',
        message: limitMessage,
        upgradeUrl: tier === 'nova_unlimited' ? null : '/upgrade',
        tier,
      }, { status: 402 })
    }

    // Topic detection + usage guidance
    const heavyTopic = detectHeavyTopic(history)
    const usageGuidance = getUsageGuidance(ctx.messageCount, tier, heavyTopic)

    // Topic-based resource links (appended to response, not API call)
    const topicResources = detectTopicResources(message)

    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-20).map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: mood ? `[Mood: ${mood}] ${message}` : message,
      },
    ]

    // ─── Prompt Caching: 2-block system ───────────────────────────────────
    // Block 1: Large static knowledge base — CACHED (~90% cost savings)
    // Block 2: Dynamic student context — NOT cached (fresh each call)
    const systemBlocks: Anthropic.TextBlockParam[] = [
      {
        type: 'text',
        text: NOVA_KNOWLEDGE_BASE,
        // @ts-expect-error — cache_control is supported but not yet in all SDK type defs
        cache_control: { type: 'ephemeral' },
      },
      {
        type: 'text',
        text: buildDynamicContext(ctx, usageGuidance),
      },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemBlocks,
      messages,
    })

    let assistantMessage = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')

    // Append curated resource links if topic matched and resources exist
    if (topicResources.length > 0) {
      assistantMessage += formatResourceLinks(topicResources)
    }

    // Increment message counter on profile
    const messagesUsed = ctx.messageCount + 1
    await supabase.from('profiles').update({ nova_messages_used: messagesUsed }).eq('id', user.id)

    // Save conversation to nova_conversations (best-effort, non-blocking)
    supabase.from('nova_conversations').upsert({
      user_id: user.id,
      messages: [...history.slice(-20), { role: 'user', content: message }, { role: 'assistant', content: assistantMessage }],
      conversation_type: isCrisis ? 'crisis' : 'general',
      crisis_detected: isCrisis,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' }).then(() => {}).catch(() => {})

    return NextResponse.json({
      message: assistantMessage,
      isCrisis,
      resources: topicResources,
      messagesUsed,
      // Always return -1 (unlimited) to UI for nova_unlimited — internal cap is invisible to users
      messagesLimit: tier === 'nova_unlimited' ? -1 : tierLimit,
      tier,
      nearSoftCap: tier === 'premium' && messagesUsed >= NOVA_PREMIUM_SOFT_CAP,
      pastSoftCap: tier === 'premium' && messagesUsed >= NOVA_PREMIUM_HARD_CAP,
    })
  } catch (error) {
    console.error('Nova API error:', error)
    return NextResponse.json({
      error: 'Nova is having a moment — please try again shortly.',
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [
      { data: conversation },
      { data: profile },
    ] = await Promise.all([
      supabase
        .from('nova_conversations')
        .select('messages')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('profiles')
        .select('plan, nova_messages_used, nova_messages_limit')
        .eq('id', user.id)
        .single(),
    ])

    const p = profile as Record<string, unknown> | null
    const tier = (p?.plan as NovaTier | null) || 'free'
    const messageCount = (p?.nova_messages_used as number) || 0
    const messageLimit = tier === 'nova_unlimited' ? -1
      : tier === 'premium' ? NOVA_PREMIUM_HARD_CAP
      : tier === 'scholar' ? NOVA_SCHOLAR_LIMIT
      : NOVA_FREE_LIMIT

    return NextResponse.json({
      messages: (conversation?.messages as unknown[]) || [],
      messageCount,
      messageLimit,
      tier,
    })
  } catch (error) {
    console.error('Nova GET error:', error)
    return NextResponse.json({ error: 'Failed to load chat history' }, { status: 500 })
  }
}
