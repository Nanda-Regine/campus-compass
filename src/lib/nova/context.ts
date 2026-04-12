/**
 * Nova Context Builder
 * Pulls all student data in a single Promise.all and returns a structured
 * NovaContext object. This is the single source of truth Nova uses to
 * personalise every response.
 *
 * Cache: simple in-memory TTL cache (60 s) keyed by user_id.
 * Invalidate by calling invalidateNovaContext(userId) after any mutation.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface NovaProfile {
  id: string
  name: string | null
  full_name: string | null
  email: string | null
  university: string | null
  faculty: string | null
  degree: string | null
  degree_name: string | null
  year_of_study: number | null
  funding_type: string | null
  nsfas_monthly_amount: number | null
  accommodation_type: string | null
  dietary_preferences: string[]
  languages: string[]
  study_style: string | null
  biggest_challenges: string[]
  emergency_contact_name: string | null
  emergency_contact_number: string | null
  plan: string
  nova_messages_used: number
  nova_messages_limit: number
  preferred_language: string
  ai_language: string
  streak_count: number
}

export interface NovaBudgetContext {
  monthlyBudget: number
  totalSpent: number
  remaining: number
  spentPct: number
  dailyBudget: number
  fundingType: string | null
  nsfasEnabled: boolean
  topExpenseCategory: string | null
  daysLeftInMonth: number
}

export interface NovaExam {
  id: string
  name: string
  module: string | null
  date: string
  venue: string | null
  daysAway: number
}

export interface NovaTask {
  id: string
  title: string
  module: string | null
  dueDate: string | null
  daysOverdue: number
  status: string
}

export interface NovaStudySession {
  module: string | null
  durationMinutes: number
  startedAt: string
}

export interface NovaMessage {
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface NovaContext {
  profile: NovaProfile
  budget: NovaBudgetContext
  upcomingExams: NovaExam[]         // next 14 days
  overdueTasks: NovaTask[]
  pendingTasks: NovaTask[]
  studySessions: NovaStudySession[] // last 7 days
  recentMessages: NovaMessage[]     // last 20
  crisisFlags: string[]
  fetchedAt: number
}

// ─── In-memory cache (60 s TTL) ─────────────────────────────────────────────

const cache = new Map<string, NovaContext>()
const CACHE_TTL_MS = 60_000

export function invalidateNovaContext(userId: string) {
  cache.delete(userId)
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysFromNow(dateStr: string): number {
  const now = new Date()
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function topCategory(expenses: { category: string; amount: number }[]): string | null {
  if (!expenses.length) return null
  const totals: Record<string, number> = {}
  for (const e of expenses) {
    totals[e.category] = (totals[e.category] || 0) + e.amount
  }
  return Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

// ─── Main fetch ─────────────────────────────────────────────────────────────

export async function buildNovaContext(userId: string): Promise<NovaContext> {
  // Return cached result if fresh
  const cached = cache.get(userId)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached
  }

  const supabase = createServerSupabaseClient()
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // 14 days ahead for exams
  const examCutoff = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()

  // 30 days back for expenses
  const expenseStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // 7 days back for study sessions
  const sessionStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Start of current month for budget
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const [
    profileRes,
    budgetRes,
    expensesRes,
    upcomingExamsRes,
    tasksRes,
    studySessionsRes,
    messagesRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,name,full_name,email,university,faculty,degree,degree_name,year_of_study,funding_type,nsfas_monthly_amount,accommodation_type,dietary_preferences,languages,study_style,biggest_challenges,emergency_contact_name,emergency_contact_number,plan,nova_messages_used,nova_messages_limit,preferred_language,ai_language,streak_count')
      .eq('id', userId)
      .single(),
    supabase
      .from('budgets')
      .select('monthly_budget,food_budget,nsfas_enabled,nsfas_living,nsfas_accom,nsfas_books')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('expenses')
      .select('category,amount')
      .eq('user_id', userId)
      .gte('expense_date', expenseStart)
      .lte('expense_date', monthEnd),
    supabase
      .from('exams')
      .select('id,exam_name,exam_date,venue,module:modules(module_name)')
      .eq('user_id', userId)
      .gte('exam_date', today)
      .lte('exam_date', examCutoff)
      .order('exam_date', { ascending: true }),
    supabase
      .from('tasks')
      .select('id,title,due_date,status,module:modules(module_name)')
      .eq('user_id', userId)
      .neq('status', 'done')
      .order('due_date', { ascending: true }),
    supabase
      .from('study_sessions')
      .select('duration_minutes,started_at,module:modules(module_name)')
      .eq('user_id', userId)
      .gte('started_at', sessionStart)
      .order('started_at', { ascending: false }),
    supabase
      .from('nova_conversations')
      .select('messages')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  // ── Profile ──────────────────────────────────────────────────────────────
  const rawProfile = profileRes.data
  const profile: NovaProfile = {
    id: userId,
    name: rawProfile?.name || rawProfile?.full_name || null,
    full_name: rawProfile?.full_name || null,
    email: rawProfile?.email || null,
    university: rawProfile?.university || null,
    faculty: rawProfile?.faculty || null,
    degree: rawProfile?.degree || null,
    degree_name: rawProfile?.degree_name || null,
    year_of_study: rawProfile?.year_of_study || null,
    funding_type: rawProfile?.funding_type || null,
    nsfas_monthly_amount: rawProfile?.nsfas_monthly_amount || null,
    accommodation_type: rawProfile?.accommodation_type || null,
    dietary_preferences: (rawProfile?.dietary_preferences as string[]) || [],
    languages: (rawProfile?.languages as string[]) || [],
    study_style: rawProfile?.study_style || null,
    biggest_challenges: (rawProfile?.biggest_challenges as string[]) || [],
    emergency_contact_name: rawProfile?.emergency_contact_name || null,
    emergency_contact_number: rawProfile?.emergency_contact_number || null,
    plan: rawProfile?.plan || 'free',
    nova_messages_used: rawProfile?.nova_messages_used || 0,
    nova_messages_limit: rawProfile?.nova_messages_limit || 15,
    preferred_language: rawProfile?.preferred_language || 'en',
    ai_language: rawProfile?.ai_language || 'English',
    streak_count: rawProfile?.streak_count || 0,
  }

  // ── Budget ───────────────────────────────────────────────────────────────
  const rawBudget = budgetRes.data
  const nsfasTotal = rawBudget?.nsfas_enabled
    ? ((rawBudget.nsfas_living || 0) + (rawBudget.nsfas_accom || 0) + (rawBudget.nsfas_books || 0))
    : 0
  const monthlyBudget = (rawBudget?.monthly_budget || 0) + nsfasTotal
  const expenses = expensesRes.data || []
  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const remaining = monthlyBudget - totalSpent
  const spentPct = monthlyBudget > 0 ? Math.round((totalSpent / monthlyBudget) * 100) : 0
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dayOfMonth = now.getDate()
  const daysLeftInMonth = Math.max(1, daysInMonth - dayOfMonth + 1)
  const dailyBudget = remaining / daysLeftInMonth

  const budget: NovaBudgetContext = {
    monthlyBudget,
    totalSpent,
    remaining,
    spentPct,
    dailyBudget,
    fundingType: rawProfile?.funding_type || null,
    nsfasEnabled: rawBudget?.nsfas_enabled || false,
    topExpenseCategory: topCategory(expenses as { category: string; amount: number }[]),
    daysLeftInMonth,
  }

  // ── Exams ────────────────────────────────────────────────────────────────
  const upcomingExams: NovaExam[] = (upcomingExamsRes.data || []).map((e) => ({
    id: e.id,
    name: e.exam_name,
    module: (e.module as { module_name?: string } | null)?.module_name || null,
    date: e.exam_date,
    venue: e.venue || null,
    daysAway: daysFromNow(e.exam_date),
  }))

  // ── Tasks ────────────────────────────────────────────────────────────────
  const allTasks = tasksRes.data || []
  const overdueTasks: NovaTask[] = allTasks
    .filter((t) => t.due_date && new Date(t.due_date) < now)
    .map((t) => ({
      id: t.id,
      title: t.title,
      module: (t.module as { module_name?: string } | null)?.module_name || null,
      dueDate: t.due_date,
      daysOverdue: Math.abs(daysFromNow(t.due_date!)),
      status: t.status,
    }))

  const pendingTasks: NovaTask[] = allTasks
    .filter((t) => !t.due_date || new Date(t.due_date) >= now)
    .map((t) => ({
      id: t.id,
      title: t.title,
      module: (t.module as { module_name?: string } | null)?.module_name || null,
      dueDate: t.due_date,
      daysOverdue: 0,
      status: t.status,
    }))

  // ── Study sessions ───────────────────────────────────────────────────────
  const studySessions: NovaStudySession[] = (studySessionsRes.data || []).map((s) => ({
    module: (s.module as { module_name?: string } | null)?.module_name || null,
    durationMinutes: s.duration_minutes || 0,
    startedAt: s.started_at,
  }))

  // ── Recent messages ──────────────────────────────────────────────────────
  const rawMessages = (messagesRes.data?.messages as { role: string; content: string; created_at?: string }[]) || []
  const recentMessages: NovaMessage[] = rawMessages.slice(-20).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
    createdAt: m.created_at || '',
  }))

  // ── Crisis flags (keyword scan on recent messages) ────────────────────────
  const crisisKeywords = ['suicid', 'kill myself', 'self-harm', 'end it', 'no reason to live', 'hopeless', 'worthless', 'can\'t go on']
  const recentText = recentMessages.map((m) => m.content.toLowerCase()).join(' ')
  const crisisFlags = crisisKeywords.filter((k) => recentText.includes(k))

  const context: NovaContext = {
    profile,
    budget,
    upcomingExams,
    overdueTasks,
    pendingTasks,
    studySessions,
    recentMessages,
    crisisFlags,
    fetchedAt: Date.now(),
  }

  cache.set(userId, context)
  return context
}

// ─── Dynamic context string for Nova prompts ────────────────────────────────

export function formatNovaContext(ctx: NovaContext, usageGuidance = ''): string {
  const p = ctx.profile
  const firstName = p.name?.split(' ')[0] || p.full_name?.split(' ')[0] || 'student'
  const uni = p.university?.split('(')[0]?.trim() || 'their university'
  const b = ctx.budget

  const budgetNote = b.remaining < 0
    ? `⚠️ OVER BUDGET by R${Math.abs(b.remaining).toFixed(0)}.`
    : `R${b.remaining.toFixed(0)} left this month (${b.spentPct}% of R${b.monthlyBudget.toFixed(0)} spent). Daily allowance: R${b.dailyBudget.toFixed(0)}/day. ${b.daysLeftInMonth} days left in month.`

  const topCatNote = b.topExpenseCategory ? `Top expense category: ${b.topExpenseCategory}.` : ''

  const examNote = ctx.upcomingExams.length > 0
    ? ctx.upcomingExams.slice(0, 3).map((e) =>
        `${e.name}${e.module ? ` (${e.module})` : ''} — ${e.daysAway} days away${e.venue ? ` at ${e.venue}` : ''}`
      ).join('; ')
    : 'No upcoming exams in the next 14 days.'

  const overdueNote = ctx.overdueTasks.length > 0
    ? `⚠️ OVERDUE: ${ctx.overdueTasks.slice(0, 5).map((t) => `"${t.title}" (${t.daysOverdue}d overdue)`).join(', ')}`
    : ''

  const pendingNote = ctx.pendingTasks.length > 0
    ? `${ctx.pendingTasks.length} pending task(s). ${ctx.pendingTasks.slice(0, 3).map((t) => `"${t.title}"${t.dueDate ? ` due ${t.dueDate.split('T')[0]}` : ''}`).join(', ')}.`
    : 'No pending tasks.'

  const studyNote = ctx.studySessions.length > 0
    ? `Study this week: ${ctx.studySessions.reduce((s, ss) => s + ss.durationMinutes, 0)} min total. Subjects: ${[...new Set(ctx.studySessions.map((s) => s.module).filter(Boolean))].join(', ') || 'various'}.`
    : 'No study sessions logged this week.'

  const challengesNote = p.biggest_challenges?.length
    ? `Self-reported challenges: ${p.biggest_challenges.join(', ')}.`
    : ''

  const langInstruction = (p.ai_language && p.ai_language !== 'English')
    ? `\n- **Language:** Respond in ${p.ai_language}. You may code-switch naturally. Keep technical terms and app names in English.`
    : ''

  const crisisNote = ctx.crisisFlags.length > 0
    ? `\n⚠️ CRISIS SIGNALS DETECTED in recent messages. Lead with warmth, validate feelings, share SADAG number (0800 456 789), and encourage them to speak to campus counselling before moving to practical advice.`
    : ''

  return `---

## STUDENT LIVE DATA (fresh — use to personalise every response)

**Profile:**
- Name: ${firstName} | University: ${uni} | Year: ${p.year_of_study || 'unknown'} | Faculty: ${p.faculty || 'unknown'}
- Degree: ${p.degree_name || p.degree || 'unknown'} | Funding: ${p.funding_type?.toUpperCase() || 'unknown'}${p.nsfas_monthly_amount ? ` (R${p.nsfas_monthly_amount}/mo)` : ''}
- Accommodation: ${p.accommodation_type || 'unknown'} | Study style: ${p.study_style || 'not specified'}
- Streak: ${p.streak_count} days${challengesNote ? `\n- ${challengesNote}` : ''}${langInstruction}

**Finances:**
- ${budgetNote}
- ${topCatNote}

**Upcoming exams (next 14 days):**
- ${examNote}

**Tasks:**
- ${overdueNote ? overdueNote + '\n- ' : ''}${pendingNote}

**Study:**
- ${studyNote}
${crisisNote}
**Instructions:**
- You are Nova 🌟. Use the knowledge base above for SA context. Personalise using ${firstName}'s live data.
- Do NOT ask for info already in their profile above.
- Be concise. Go deeper only when they need it.
- You are NOT a licensed therapist. For serious issues, encourage professional help.${usageGuidance}`
}
