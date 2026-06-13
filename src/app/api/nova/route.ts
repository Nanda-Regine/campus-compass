export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { detectCrisis, currentMonthRange, NOVA_FREE_LIMIT, NOVA_SCHOLAR_LIMIT, NOVA_LIMITS } from '@/lib/utils'
import type { NovaTier } from '@/lib/utils'
import Anthropic from '@anthropic-ai/sdk'
import { NOVA_KNOWLEDGE_BASE } from '@/lib/nova-knowledge-base'
import { detectPrebuilt, detectTopicResources, formatResourceLinks } from '@/lib/nova-resources'
import { checkRateLimitAsync } from '@/lib/rateLimit'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  defaultHeaders: {
    'anthropic-beta': 'prompt-caching-2024-07-31',
  },
})

// ─── XP level lookup (mirrors xp-engine.ts — server-safe, no 'use client') ─
const XP_LEVELS = [
  { name: 'Fresher', minXP: 0 }, { name: 'Survivor', minXP: 100 },
  { name: 'Grinder', minXP: 300 }, { name: 'Scholar', minXP: 600 },
  { name: 'Pioneer', minXP: 1000 }, { name: 'Legend', minXP: 1500 },
  { name: 'Graduate', minXP: 2200 },
]
function getXPLevel(xp: number): string {
  let name = 'Fresher'
  for (const l of XP_LEVELS) { if (xp >= l.minXP) name = l.name }
  return name
}

// ─── Detect heavy tutoring topic from conversation history ────
const SUBJECT_PATTERNS: { keywords: string[]; name: string }[] = [
  { keywords: ['nsfas','allowance','appeal','n+ rule','n+','my.nsfas','bank detail','myNSFAS','funding','financial aid','late payment','allowance late'], name: 'NSFAS (financial aid)' },
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
  { keywords: ['bursary','scholarship','funza','sasol inzalo','eskom bursary','transnet','old mutual bursary','apply bursary','application plan','how to apply'], name: 'Bursaries & Scholarships' },
  { keywords: ['burnout','burnt out','exhausted','overwhelmed','can\'t cope','mental health','counselling','stress level','check-in','wellness','anxiety','depression'], name: 'Wellness & Mental Health' },
  { keywords: ['cv','curriculum vitae','resume','job interview','interview question','skills gap','career plan','graduate programme','job application','linkedin'], name: 'Career & Job Preparation' },
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

  if (messageCount >= 120) {
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

  if (messageCount >= 80 && heavyTopic) {
    return `\n\n[NOVA USAGE GUIDANCE]: Student has been asking a lot about ${heavyTopic}. Consider mentioning one specific free resource (Siyavula / Khan Academy / campus tutor / Professor Leonard) to help them build independent practice alongside your explanation.`
  }

  return ''
}

// ─── Build rich student context for Nova ─────────────────────
async function buildStudentContext(userId: string, supabase: ReturnType<typeof createServerSupabaseClient>) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const { start, end } = currentMonthRange()

  const [
    { data: profile },
    { data: budget },
    { data: tasks },
    { data: exams },
    { data: modules },
    { data: expenses },
    { data: wellnessCheckins },
    { data: xpState },
    { data: examConfidences },
    { data: gradesData },
    { data: savedBursaries },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('budgets').select('*').eq('user_id', userId).single(),
    supabase.from('tasks').select('*, module:modules(module_name)').eq('user_id', userId).neq('status', 'done').order('due_date', { ascending: true }),
    supabase.from('exams').select('*, module:modules(module_name)').eq('user_id', userId).gte('exam_date', today).order('exam_date', { ascending: true }),
    supabase.from('modules').select('module_name').eq('user_id', userId).eq('is_active', true),
    supabase.from('expenses').select('amount').eq('user_id', userId).gte('expense_date', start).lte('expense_date', end),
    // ── New Sprint 7/8A intelligence tables ──────────────────────
    supabase.from('wellness_checkins').select('date, score, sleep, stress, social, energy, motivation').eq('user_id', userId).order('date', { ascending: false }).limit(7),
    supabase.from('user_xp_state').select('total_xp, event_counts').eq('user_id', userId).maybeSingle(),
    supabase.from('exam_confidence').select('exam_id, confidence').eq('user_id', userId),
    supabase.from('student_grades_data').select('grade_modules').eq('user_id', userId).maybeSingle(),
    supabase.from('saved_bursaries').select('bursary_name').eq('user_id', userId).order('saved_at', { ascending: false }).limit(5),
  ])

  const budgetGoal = (budget?.monthly_budget || 0) +
    (budget?.nsfas_enabled ? ((budget.nsfas_living || 0) + (budget.nsfas_accom || 0) + (budget.nsfas_books || 0)) : 0)
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

  // ── Wellness processing ──────────────────────────────────────────────────
  type WellnessRow = { date: string; score: number; sleep: number; stress: number; social: number; energy: number; motivation: number }
  const recentCheckins = (wellnessCheckins || []) as WellnessRow[]
  const latestCheckin = recentCheckins[0] || null
  const wellnessTrend: 'improving' | 'stable' | 'declining' | null =
    recentCheckins.length >= 3
      ? recentCheckins[0].score > recentCheckins[2].score + 5 ? 'improving'
        : recentCheckins[0].score < recentCheckins[2].score - 5 ? 'declining'
        : 'stable'
      : null
  const daysSinceCheckin = latestCheckin
    ? Math.floor((now.getTime() - new Date(latestCheckin.date).getTime()) / (1000 * 60 * 60 * 24))
    : null

  // ── XP / Gamification ────────────────────────────────────────────────────
  const totalXP = (xpState as { total_xp?: number } | null)?.total_xp || 0
  const xpLevel = getXPLevel(totalXP)

  // ── Exam confidence map ──────────────────────────────────────────────────
  const confMap: Record<string, number> = {}
  ;(examConfidences || []).forEach((r: { exam_id: string; confidence: number }) => { confMap[r.exam_id] = r.confidence })

  // ── Grade module averages ─────────────────────────────────────────────────
  interface GradeAssessment { score: string; weight: string }
  interface GradeModule { moduleName: string; assessments: GradeAssessment[] }
  const gradeModuleList: GradeModule[] = (gradesData as { grade_modules?: GradeModule[] } | null)?.grade_modules || []
  const moduleAverages: { name: string; avg: number }[] = gradeModuleList
    .map(m => {
      const valid = m.assessments
        .map(a => ({ score: parseFloat(a.score), weight: parseFloat(a.weight) }))
        .filter(a => !isNaN(a.score) && !isNaN(a.weight) && a.weight > 0)
      if (valid.length === 0) return null
      const totalWeight = valid.reduce((s, a) => s + a.weight, 0)
      const weightedAvg = valid.reduce((s, a) => s + (a.score / 100) * a.weight, 0) / totalWeight * 100
      return { name: m.moduleName, avg: Math.round(weightedAvg) }
    })
    .filter((m): m is { name: string; avg: number } => m !== null)

  // ── Saved bursaries ───────────────────────────────────────────────────────
  const savedBursaryNames = (savedBursaries || []).map((b: { bursary_name: string }) => b.bursary_name)

  // ── Proactive signals for Nova ────────────────────────────────────────────
  // These are injected as hints so Nova naturally brings up important things
  const proactiveSignals: string[] = []
  if (latestCheckin && latestCheckin.score <= 40)
    proactiveSignals.push(`⚡ Wellness score is very low (${latestCheckin.score}/100${wellnessTrend === 'declining' ? ', declining' : ''}). Lead with empathy before any practical advice.`)
  if (wellnessTrend === 'declining' && latestCheckin && latestCheckin.score < 60)
    proactiveSignals.push(`📉 Wellness has been declining. If relevant, gently check in on how the student is coping.`)
  if (daysSinceCheckin !== null && daysSinceCheckin >= 4)
    proactiveSignals.push(`💭 No wellness check-in for ${daysSinceCheckin} days. If the student seems stressed, suggest they do a quick check-in.`)
  if (overdueTasks.length >= 4)
    proactiveSignals.push(`⚠️ ${overdueTasks.length} overdue tasks. Acknowledge the backlog warmly — don't lecture.`)
  const lowConfExams = exams?.filter(e => confMap[e.id] !== undefined && confMap[e.id] <= 2 && Math.ceil((new Date(e.exam_date).getTime() - now.getTime()) / (1000*60*60*24)) <= 7) || []
  if (lowConfExams.length > 0)
    proactiveSignals.push(`📚 ${lowConfExams.map(e => e.exam_name).join(', ')} — low confidence + within 7 days. Offer targeted help if it comes up.`)
  const atRiskModules = moduleAverages.filter(m => m.avg < 50)
  if (atRiskModules.length > 0)
    proactiveSignals.push(`📉 Grade tracker shows below 50% in: ${atRiskModules.map(m => `${m.name} (${m.avg}%)`).join(', ')}. Offer academic support if relevant.`)

  const p = profile as Record<string, unknown> | null
  // subscription_tier is the canonical column (set by PayFast webhook)
  // fall back to plan (legacy) then free
  const tier = (
    (p?.subscription_tier as NovaTier | null) ||
    (p?.plan as NovaTier | null) ||
    'free'
  ) as NovaTier

  // ─── Monthly reset check ──────────────────────────────────────
  // If nova_messages_reset_at is null or in a prior month, reset the counter
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastResetKey = (p?.nova_messages_reset_at as string | null)?.slice(0, 7) ?? ''
  let messageCount = (p?.nova_messages_used as number) || 0

  if (lastResetKey !== currentMonthKey) {
    // New month — reset counter
    await supabase
      .from('profiles')
      .update({ nova_messages_used: 0, nova_messages_reset_at: now.toISOString() })
      .eq('id', userId)
    messageCount = 0
  }

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
    wellness: {
      latestScore: latestCheckin?.score ?? null,
      trend: wellnessTrend,
      daysSinceCheckin,
      latestBreakdown: latestCheckin
        ? { sleep: latestCheckin.sleep, stress: latestCheckin.stress, energy: latestCheckin.energy, motivation: latestCheckin.motivation }
        : null,
    },
    gamification: {
      totalXP,
      xpLevel,
    },
    grades: {
      moduleAverages,
    },
    savedBursaryNames,
    proactiveSignals,
    stressSignals,
    messageCount,
    subscriptionTier: tier,
  }
}

interface CorrelationInsight {
  key: string
  text: string
  detail: string
  strength: 'strong' | 'moderate' | 'weak'
}

// ─── Dynamic student context (injected fresh every call, NOT cached) ──
function buildDynamicContext(
  ctx: Awaited<ReturnType<typeof buildStudentContext>>,
  usageGuidance: string,
  correlationInsights?: CorrelationInsight[] | null,
): string {
  const { profile, budget, academic, wellness, gamification, grades, savedBursaryNames, proactiveSignals, stressSignals } = ctx
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

  // ── Wellness section ──────────────────────────────────────────────────────
  const wellnessLine = wellness.latestScore !== null
    ? `Latest check-in: ${wellness.latestScore}/100 (${wellness.trend || 'single entry'})${wellness.daysSinceCheckin !== null && wellness.daysSinceCheckin >= 3 ? ` — ${wellness.daysSinceCheckin} days ago` : ''}`
    : 'No wellness check-ins recorded yet'
  const wellnessBreakdown = wellness.latestBreakdown
    ? `Sleep: ${wellness.latestBreakdown.sleep}/5, Energy: ${wellness.latestBreakdown.energy}/5, Stress: ${wellness.latestBreakdown.stress}/5, Motivation: ${wellness.latestBreakdown.motivation}/5`
    : null

  // ── Grades section ────────────────────────────────────────────────────────
  const gradesLine = grades.moduleAverages.length > 0
    ? grades.moduleAverages.map(m => `${m.name}: ${m.avg}%`).join(' · ')
    : 'No grade data entered yet'

  // ── Proactive signals ─────────────────────────────────────────────────────
  const proactiveBlock = proactiveSignals.length > 0
    ? `\n**Proactive awareness for this conversation:**\n${proactiveSignals.map(s => `- ${s}`).join('\n')}`
    : ''

  const patternsBlock = correlationInsights && correlationInsights.length > 0
    ? `\n**${p?.full_name ? (p.full_name as string).split(' ')[0] : 'This student'}'s 30-day behaviour patterns (real data):**\n${correlationInsights.map(i => `- [${i.strength}] ${i.text} — ${i.detail}`).join('\n')}\nWhen relevant, reference these actual patterns naturally (e.g. "I can see from your data that…"). Don't reveal the data source name.`
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

**Wellbeing & Progress (VarsityOS tracking):**
- Wellness: ${wellnessLine}${wellnessBreakdown ? `\n- Wellness breakdown: ${wellnessBreakdown}` : ''}
- Gamification: Level ${gamification.xpLevel} · ${gamification.totalXP} XP earned
- Grade tracker: ${gradesLine}
- Saved bursaries: ${savedBursaryNames.length > 0 ? savedBursaryNames.join(', ') : 'none saved yet'}
${proactiveBlock}

**Instructions for this response:**
- You are Nova 🌟. Use the persona and knowledge from the comprehensive knowledge base above.
- Use ${name}'s actual data above — don't ask what they've already told VarsityOS.
- ${stressSignals.length > 0 ? 'Stress signals detected — lead with warmth and support before advice.' : 'No major stress signals — respond helpfully and practically.'}
- Be concise by default. Go deeper only when ${name} needs it.
- You are NOT a licensed therapist. For serious issues, encourage professional help.${usageGuidance}${patternsBlock}`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ─── Rate limiting: max 15 Nova messages per minute per user ──────────
    const rateCheck = await checkRateLimitAsync(user.id, 'nova', 15, 60_000)
    if (!rateCheck.allowed) {
      return NextResponse.json({
        error: 'Too many messages — please wait a moment before sending again.',
        retryAfterMs: rateCheck.resetIn,
      }, { status: 429 })
    }

    const body = await request.json()
    const rawMessage: unknown = body?.message
    const message = typeof rawMessage === 'string' ? rawMessage.slice(0, 2000).trim() : ''
    // Sanitise history: enforce role whitelist at runtime (not just TypeScript cast) to
    // prevent prompt-injection via a crafted role:'system' entry, and cap per-message
    // content length to prevent cost-inflation attacks.
    const history: { role: 'user' | 'assistant'; content: string }[] = Array.isArray(body?.history)
      ? (body.history as { role: unknown; content: unknown }[])
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({
            role: m.role as 'user' | 'assistant',
            content: typeof m.content === 'string' ? m.content.slice(0, 2000) : '',
          }))
          .filter(m => m.content.length > 0)
      : []
    const mood: string | undefined = body?.mood
    const correlationInsights: CorrelationInsight[] | null = Array.isArray(body?.correlationInsights)
      ? (body.correlationInsights as CorrelationInsight[]).slice(0, 5)
      : null

    // Image attachment (optional) — base64 data + MIME type sent from client after compression
    const rawImageData: unknown = body?.imageData
    const imageData: string | null =
      typeof rawImageData === 'string' && rawImageData.length > 0 && rawImageData.length < 6_000_000
        ? rawImageData
        : null
    const imageMimeType = (['image/jpeg','image/png','image/gif','image/webp'] as const).includes(body?.mediaType)
      ? (body.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp')
      : 'image/jpeg' as const
    // conversationId: client passes the active conversation UUID so we append to the
    // right row. If absent (new chat), we INSERT a fresh row and return the new ID.
    const conversationId: string | undefined =
      typeof body?.conversationId === 'string' && body.conversationId.length > 0
        ? body.conversationId
        : undefined

    if (!message && !imageData) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // ─── Crisis detection — always check first ─────────────────────────────
    const isCrisis = detectCrisis(message || '')

    // ─── Pre-built response check — zero API cost ──────────────────────────
    // For breathing exercises, crisis, sleep tips, Pomodoro, etc. — respond instantly
    const prebuilt = detectPrebuilt(message)
    if (prebuilt?.skipApi) {
      const ctx = await buildStudentContext(user.id, supabase)
      const monthKey = new Date().toISOString().slice(0, 7)
      const { data: prebuiltUsage } = await supabase.rpc('try_use_nova_message', {
        p_user_id: user.id, p_month_key: monthKey, p_limit: -1,
      })
      const newCount = (prebuiltUsage?.messages_used as number | null) ?? ctx.messageCount + 1

      // Persist to nova_conversations so it shows in history
      const updatedMessages = [
        ...history.slice(-40),
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: prebuilt.response, timestamp: new Date().toISOString() },
      ]
      const autoTitle = message.slice(0, 60) + (message.length > 60 ? '…' : '')
      let resolvedConversationId = conversationId
      if (conversationId) {
        await supabase.from('nova_conversations').update({ messages: updatedMessages, message_count: updatedMessages.length, updated_at: new Date().toISOString() }).eq('id', conversationId).eq('user_id', user.id)
      } else {
        const { data: newConv } = await supabase.from('nova_conversations').insert({ user_id: user.id, messages: updatedMessages, title: autoTitle, conversation_type: isCrisis ? 'crisis' : 'general', crisis_detected: isCrisis, message_count: updatedMessages.length, started_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select('id').single()
        resolvedConversationId = (newConv as { id: string } | null)?.id
      }

      return NextResponse.json({
        message: prebuilt.response,
        isCrisis,
        resources: prebuilt.resources || [],
        prebuilt: true,
        messagesUsed: newCount,
        tier: ctx.subscriptionTier,
        conversationId: resolvedConversationId ?? null,
      })
    }

    // ─── Build student context ─────────────────────────────────────────────
    const ctx = await buildStudentContext(user.id, supabase)

    // ─── Atomic cap check + increment ────────────────────────────────────
    // Single Postgres FOR UPDATE call — eliminates concurrent-request race condition.
    // Both the limit check and the increment happen in one transaction.
    const tier = ctx.subscriptionTier
    const tierLimit = NOVA_LIMITS[tier]
    const isUnlimited = tier === 'nova_unlimited'
    const effectiveFreeLimit = NOVA_FREE_LIMIT
    const monthKey = new Date().toISOString().slice(0, 7)

    const { data: novaUsage } = await supabase.rpc('try_use_nova_message', {
      p_user_id:   user.id,
      p_month_key: monthKey,
      p_limit:     isUnlimited ? -1 : tierLimit,
    })

    if (!novaUsage?.allowed) {
      const limitMessage = tier === 'nova_unlimited'
        ? "Nova is taking a well-earned rest for the remainder of this month — your messages reset on the 1st. In the meantime, check out Siyavula, Khan Academy, or your campus counselling centre."
        : tier === 'free'
          ? `You've used all ${effectiveFreeLimit} Nova messages this month. Upgrade to Nova Scholar (R29) for 150 messages/month.`
          : `You've reached your 150-message Scholar limit. Upgrade to Nova Unlimited (R89) for unlimited messages.`
      return NextResponse.json({
        error: 'limit_reached',
        message: limitMessage,
        upgradeUrl: tier === 'nova_unlimited' ? null : '/upgrade',
        tier,
      }, { status: 402 })
    }

    const messagesUsed = novaUsage.messages_used as number

    // Topic detection + usage guidance
    const heavyTopic = detectHeavyTopic(history)
    const usageGuidance = getUsageGuidance(ctx.messageCount, tier, heavyTopic)

    // Topic-based resource links (appended to response, not API call)
    const topicResources = detectTopicResources(message)

    const userText = mood ? `[Mood: ${mood}] ${message || 'What do you see in this image?'}` : (message || 'What do you see in this image?')

    const userContent: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[] = imageData
      ? [
          {
            type: 'image',
            source: { type: 'base64', media_type: imageMimeType, data: imageData },
          },
          { type: 'text', text: userText },
        ]
      : [{ type: 'text', text: userText }]

    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-20).map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: userContent,
      },
    ]

    // ─── Prompt Caching: 2-block system ───────────────────────────────────
    // Block 1: Large static knowledge base — CACHED (~90% cost savings)
    // Block 2: Dynamic student context — NOT cached (fresh each call)
    const dynamicCtx = buildDynamicContext(ctx, usageGuidance, correlationInsights)
    const imageNote = imageData
      ? '\n\n**[Image attached]** The student has sent an image. Analyse it carefully and respond helpfully. If it looks like an exam paper, past paper, textbook page, or handwritten notes — provide detailed academic help. If it is something else, describe what you see and assist accordingly.'
      : ''

    const systemBlocks: Anthropic.TextBlockParam[] = [
      {
        type: 'text',
        text: NOVA_KNOWLEDGE_BASE,
        // @ts-expect-error — cache_control is supported but not yet in all SDK type defs
        cache_control: { type: 'ephemeral' },
      },
      {
        type: 'text',
        text: dynamicCtx + imageNote,
        // @ts-expect-error — cache_control supported at runtime, not in all SDK types
        cache_control: { type: 'ephemeral' },
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

    // Extract cache token usage for cost monitoring
    const usage = response.usage as unknown as Record<string, number> & { cache_creation_input_tokens?: number; cache_read_input_tokens?: number }
    const cacheCreationTokens = usage?.cache_creation_input_tokens ?? 0
    const cacheReadTokens = usage?.cache_read_input_tokens ?? 0
    const inputTokens = usage?.input_tokens ?? 0
    const outputTokens = usage?.output_tokens ?? 0

    // messagesUsed already set by the atomic RPC above — no separate update needed

    // ── Persist conversation history (best-effort, non-blocking) ─────────────
    // Strip image data from history — store a short placeholder instead to keep Supabase rows small
    const userHistoryContent = imageData
      ? `[📷 Image attached] ${message || ''}`.trim()
      : message
    const updatedMessages = [
      ...history.slice(-40),
      { role: 'user', content: userHistoryContent, timestamp: new Date().toISOString() },
      { role: 'assistant', content: assistantMessage, timestamp: new Date().toISOString() },
    ]
    const newMessageCount = updatedMessages.length
    const autoTitle = message.slice(0, 60) + (message.length > 60 ? '…' : '')

    let resolvedConversationId = conversationId
    if (conversationId) {
      // Append to existing conversation (best-effort, non-blocking)
      supabase.from('nova_conversations').update({
        messages: updatedMessages,
        conversation_type: isCrisis ? 'crisis' : 'general',
        crisis_detected: isCrisis,
        message_count: newMessageCount,
        updated_at: new Date().toISOString(),
      }).eq('id', conversationId).eq('user_id', user.id).then(() => {}, () => {})
    } else {
      // Insert a new conversation row and await so we get the ID to return to client
      const { data: newConv } = await supabase.from('nova_conversations').insert({
        user_id: user.id,
        messages: updatedMessages,
        title: autoTitle,
        conversation_type: isCrisis ? 'crisis' : 'general',
        crisis_detected: isCrisis,
        message_count: newMessageCount,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).select('id').single()
      resolvedConversationId = (newConv as { id: string } | null)?.id
    }

    // Log cache token usage for cost monitoring (best-effort)
    if (cacheCreationTokens > 0 || cacheReadTokens > 0 || inputTokens > 0) {
      supabase.from('nova_messages').insert({
        user_id: user.id,
        role: 'assistant',
        content: assistantMessage.slice(0, 500), // excerpt only
        cache_creation_input_tokens: cacheCreationTokens,
        cache_read_input_tokens: cacheReadTokens,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      }).then(() => {}, () => {})
    }

    return NextResponse.json({
      message: assistantMessage,
      isCrisis,
      resources: topicResources,
      messagesUsed,
      // Always return -1 (unlimited) to UI for nova_unlimited — internal cap is invisible to users
      messagesLimit: tier === 'nova_unlimited' ? -1 : tierLimit,
      tier,
      nearSoftCap: false,
      pastSoftCap: false,
      conversationId: resolvedConversationId ?? null,
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

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [
      { data: conversation },
      { data: profile },
      { data: nextExam },
      { data: urgentTaskRows },
      { data: wellnessLatest },
      { data: xpLatest },
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
        .select('full_name, plan, subscription_tier, nova_messages_used, nova_messages_limit, nova_messages_reset_at')
        .eq('id', user.id)
        .single(),
      supabase
        .from('exams')
        .select('exam_name, exam_date')
        .eq('user_id', user.id)
        .gte('exam_date', today)
        .order('exam_date', { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .neq('status', 'done')
        .lte('due_date', threeDaysLater),
      supabase
        .from('wellness_checkins')
        .select('score, date')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('user_xp_state')
        .select('total_xp')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    const p = profile as Record<string, unknown> | null
    const tier = (
      (p?.subscription_tier as NovaTier | null) ||
      (p?.plan as NovaTier | null) ||
      'free'
    ) as NovaTier
    const messageCount = (p?.nova_messages_used as number) || 0
    const messageLimit = tier === 'nova_unlimited' ? -1
      : tier === 'scholar' ? NOVA_SCHOLAR_LIMIT
      : NOVA_FREE_LIMIT

    const xpTotal = (xpLatest as { total_xp?: number } | null)?.total_xp || 0
    const daysToExam = nextExam
      ? Math.ceil((new Date(nextExam.exam_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

    return NextResponse.json({
      messages: (conversation?.messages as unknown[]) || [],
      messageCount,
      messageLimit,
      tier,
      dailyBriefData: {
        name: ((p?.full_name as string | null) || '').split(' ')[0] || null,
        nextExamName: nextExam?.exam_name || null,
        daysToExam,
        urgentTaskCount: urgentTaskRows?.length || 0,
        wellnessScore: (wellnessLatest as { score?: number } | null)?.score ?? null,
        xpLevel: getXPLevel(xpTotal),
        totalXP: xpTotal,
      },
    })
  } catch (error) {
    console.error('Nova GET error:', error)
    return NextResponse.json({ error: 'Failed to load chat history' }, { status: 500 })
  }
}
