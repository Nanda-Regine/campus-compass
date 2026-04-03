import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { detectCrisis, currentMonthYear, NOVA_FREE_LIMIT, NOVA_SCHOLAR_LIMIT, NOVA_PREMIUM_HARD_CAP, NOVA_PREMIUM_SOFT_CAP, NOVA_PREMIUM_RESOURCE_START } from '@/lib/utils'
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
  tier: 'free' | 'scholar' | 'premium',
  heavyTopic: string | null,
): string {
  if (tier === 'free') return ''

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

  const totalBudget = (budget?.monthly_budget || 0) +
    (budget?.nsfas_enabled ? (budget.nsfas_living + budget.nsfas_accom + budget.nsfas_books) : 0)
  const totalSpent = expenses?.reduce((s, e) => s + e.amount, 0) || 0
  const remaining = totalBudget - totalSpent
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dayOfMonth = now.getDate()
  const dailyBudget = remaining / (daysInMonth - dayOfMonth + 1)
  const spentPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

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
    // Derive subscription tier: subscription_tier column (new) → fallback to is_premium bool
    subscriptionTier: (profile?.subscription_tier as 'free' | 'scholar' | 'premium' | null) || (profile?.is_premium ? 'premium' : 'free'),
    // Referral bonus credits stack on top of the free tier limit
    referralCredits: profile?.referral_credits || 0,
  }
}

// ─── Dynamic student context (injected fresh every call, NOT cached) ──
function buildDynamicContext(
  ctx: Awaited<ReturnType<typeof buildStudentContext>>,
  usageGuidance: string,
): string {
  const { profile, budget, academic, stressSignals } = ctx
  const name = profile?.name?.split(' ')[0] || 'student'
  const uni = profile?.university?.split('(')[0]?.trim() || 'university'

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

  const language = profile?.ai_language || 'English'
  const langInstruction = language !== 'English'
    ? `\n- **Language:** Respond in ${language}. You may code-switch naturally. Keep any technical terms/app names in English.`
    : ''

  return `---

## THIS STUDENT'S LIVE CONTEXT (fresh data — use this to personalise)

**Student Profile:**
- Name: ${name}
- University: ${uni}
- Year: ${profile?.year_of_study || 'unknown'}
- Faculty: ${profile?.faculty || 'unknown'}
- Funding: ${profile?.funding_type?.toUpperCase() || 'unknown'}
- Living: ${profile?.living_situation || 'unknown'}
- Diet: ${profile?.dietary_pref || 'no restrictions'}${langInstruction}

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
- ${budget.nsfasEnabled ? 'NSFAS student — apply NSFAS-specific financial context.' : 'Not on NSFAS.'}

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
      // Save to DB then return — no Anthropic call
      const supabase2 = createServerSupabaseClient()
      await supabase2.from('nova_messages').insert([
        { user_id: user.id, role: 'user', content: mood ? `[Mood: ${mood}] ${message}` : message },
        { user_id: user.id, role: 'assistant', content: prebuilt.response },
      ])
      const monthYear = currentMonthYear()
      await supabase2.rpc('check_and_increment_nova_usage', {
        p_user_id: user.id,
        p_month_year: monthYear,
        p_max_messages: 9999, // prebuilt path — cap already enforced above
      })

      return NextResponse.json({
        message: prebuilt.response,
        isCrisis,
        resources: prebuilt.resources || [],
        prebuilt: true,
        messagesUsed: 1,
        isPremium: false,
      })
    }

    // ─── Build student context ─────────────────────────────────────────────
    const ctx = await buildStudentContext(user.id, supabase)

    // ─── Tier-based message cap enforcement ───────────────────────────────
    const tier = ctx.subscriptionTier
    const effectiveFreeLimit = NOVA_FREE_LIMIT + ctx.referralCredits
    const tierLimit = tier === 'premium' ? NOVA_PREMIUM_HARD_CAP
      : tier === 'scholar' ? NOVA_SCHOLAR_LIMIT
      : effectiveFreeLimit

    const tierLabel = tier === 'premium' ? 'Premium (200/month)'
      : tier === 'scholar' ? 'Scholar (75/month)'
      : `Free (${effectiveFreeLimit}/month)`

    if (ctx.messageCount >= tierLimit) {
      const isFreeTier = tier === 'free'
      return NextResponse.json({
        error: 'limit_reached',
        message: isFreeTier
          ? `You've used all ${effectiveFreeLimit} Nova messages this month. Upgrade to Scholar (R39) for 75 messages, or refer a friend for +50 bonus messages.`
          : `You've reached your ${tierLabel} limit for this month. ${tier === 'scholar' ? 'Upgrade to Premium (R79) for 200 messages.' : 'Your messages reset on the 1st of next month.'}`,
        upgradeUrl: '/upgrade',
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

    // Save messages to DB
    await supabase.from('nova_messages').insert([
      { user_id: user.id, role: 'user', content: mood ? `[Mood: ${mood}] ${message}` : message },
      { user_id: user.id, role: 'assistant', content: assistantMessage },
    ])

    // Atomically increment — the check already happened above, this is the post-response write
    const monthYear = currentMonthYear()
    await supabase.rpc('check_and_increment_nova_usage', {
      p_user_id: user.id,
      p_month_year: monthYear,
      p_max_messages: tierLimit + 1, // always allow: we checked the cap before the API call
    })

    // Generate proactive insight if stress signals detected
    if (ctx.stressSignals.length >= 2 && !isCrisis) {
      generateProactiveInsight(user.id, ctx, supabase).catch(console.error)
    }

    const messagesUsed = ctx.messageCount + 1
    return NextResponse.json({
      message: assistantMessage,
      isCrisis,
      resources: topicResources,
      messagesUsed,
      messagesLimit: tierLimit,
      isPremium: ctx.isPremium,
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

async function generateProactiveInsight(
  userId: string,
  ctx: Awaited<ReturnType<typeof buildStudentContext>>,
  supabase: ReturnType<typeof createServerSupabaseClient>
) {
  const { stressSignals, profile } = ctx
  const name = profile?.name?.split(' ')[0] || 'hey'

  // Use pre-built templates for common stress combos to save API credits
  const templates: Record<string, string> = {
    exam: `${name}, your exam is coming up fast — even 25 minutes of focused revision today will make a difference.`,
    budget: `Hey ${name}, your budget is getting tight. Want me to help you find a few places to cut back this week?`,
    overdue: `${name}, you have some overdue tasks building up. Let's tackle the smallest one first — that's often all it takes.`,
    default: `${name}, things look a little full on your plate right now. You've got this — one step at a time.`,
  }

  const hasExam = stressSignals.some(s => s.includes('exam'))
  const hasBudget = stressSignals.some(s => s.includes('budget'))
  const hasOverdue = stressSignals.some(s => s.includes('overdue'))

  const insightText = hasExam ? templates.exam
    : hasBudget ? templates.budget
    : hasOverdue ? templates.overdue
    : templates.default

  const insightType = hasExam ? 'study_nudge'
    : hasBudget ? 'budget_warning'
    : 'stress_alert'

  try {
    // Check we haven't already sent a similar insight today
    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabase
      .from('nova_insights')
      .select('id')
      .eq('user_id', userId)
      .eq('insight_type', insightType)
      .gte('created_at', today)
      .limit(1)
      .single()

    if (existing) return // Already sent one today for this type

    await supabase.from('nova_insights').insert({
      user_id: userId,
      insight_type: insightType,
      content: insightText,
    })
  } catch {
    // Ignore — proactive insight is best-effort
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
      .select('is_premium, subscription_tier, referral_credits')
      .eq('id', user.id)
      .single()

    const tier = (profile as { subscription_tier?: string | null } | null)?.subscription_tier as 'free' | 'scholar' | 'premium' | null
      || (profile?.is_premium ? 'premium' : 'free')
    const referralCredits = (profile as { referral_credits?: number } | null)?.referral_credits || 0
    const messageLimit = tier === 'premium' ? NOVA_PREMIUM_HARD_CAP
      : tier === 'scholar' ? NOVA_SCHOLAR_LIMIT
      : NOVA_FREE_LIMIT + referralCredits

    return NextResponse.json({
      messages: messages || [],
      messageCount: usage?.message_count || 0,
      messageLimit,
      isPremium: profile?.is_premium || false,
      tier,
    })
  } catch (error) {
    console.error('Nova GET error:', error)
    return NextResponse.json({ error: 'Failed to load chat history' }, { status: 500 })
  }
}
