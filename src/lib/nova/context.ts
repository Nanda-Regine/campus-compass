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
  procrastination_type: string | null
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

export interface NovaWellnessContext {
  moodAvg: number | null           // 0–5, last 7 days (null = no data)
  moodTrend: 'improving' | 'stable' | 'declining' | 'unknown'
  workHoursThisWeek: number        // hours worked across all jobs
  workShiftsThisWeek: number       // shift count this week
  burnoutProxy: number             // 0–100 estimated from mood + work
  regulationSessionsThisWeek: number // completed regulation sessions this week
  nsScore: number | null           // latest nervous system score (0–100, null = not checked in)
  cyclePhase: string | null        // current cycle phase if tracked (null = not tracked/not applicable)
  cycleEnergyLevel: number | null  // self-reported energy 1–5 from cycle tracker
  recentSafetyIncidents: number    // campus safety incidents in last 48h at their institution
}

export interface NovaContext {
  profile: NovaProfile
  budget: NovaBudgetContext
  upcomingExams: NovaExam[]         // next 14 days
  overdueTasks: NovaTask[]
  pendingTasks: NovaTask[]
  studySessions: NovaStudySession[] // last 7 days
  recentMessages: NovaMessage[]     // last 20
  wellness: NovaWellnessContext
  crisisFlags: string[]
  patternInsights: string[]    // correlation insights from 30-day behavioural data
  upcomingCampusEvents: Array<{ title: string; event_type: string; venue: string | null; event_date: string; institution: string }>
  upcomingBursaryDeadlines: Array<{ bursary_name: string; deadline: string; status: string; amount_rands: number | null }>
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

  // 7 days back for study sessions and wellness
  const sessionStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const week7AgoDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // 48h back for safety incidents
  const safety48hAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()

  // 72h ahead for campus events
  const events72hAhead = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString()

  // 21 days ahead for bursary deadlines
  const bursary21dAhead = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

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
    moodLogsRes,
    workShiftsRes,
    regulationSessionsRes,
    nsScoreRes,
    cycleRes,
    safetyIncidentsRes,
    campusEventsRes,
    bursaryDeadlinesRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,name,full_name,email,university,faculty,degree,degree_name,year_of_study,funding_type,nsfas_monthly_amount,accommodation_type,dietary_preferences,languages,study_style,biggest_challenges,emergency_contact_name,emergency_contact_number,plan,nova_messages_used,nova_messages_limit,preferred_language,ai_language,streak_count,procrastination_type')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('budgets')
      .select('monthly_budget,food_budget,nsfas_enabled,nsfas_living,nsfas_accom,nsfas_books')
      .eq('user_id', userId)
      .maybeSingle(),
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
      .maybeSingle(),
    // Mood logs — graceful: table may not exist in all environments
    supabase
      .from('mood_logs')
      .select('score,logged_at')
      .eq('user_id', userId)
      .gte('logged_at', sessionStart)
      .order('logged_at', { ascending: true }),
    // Worked shifts this week for burnout context
    supabase
      .from('work_shifts')
      .select('start_time,end_time')
      .eq('student_id', userId)
      .eq('status', 'worked')
      .gte('shift_date', week7AgoDate),
    // Regulation sessions this week
    supabase
      .from('regulation_sessions')
      .select('id,session_type,completed')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('created_at', sessionStart),
    // Latest nervous system score
    supabase
      .from('nervous_system_scores')
      .select('ns_score,score_date')
      .eq('user_id', userId)
      .order('score_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Latest cycle entry (most recent date)
    supabase
      .from('cycle_tracking')
      .select('phase,energy_level,entry_date')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Safety incidents at their institution in last 48h (graceful — may be empty)
    supabase
      .from('safety_incidents')
      .select('id,severity,institution')
      .gte('created_at', safety48hAgo),
    // Campus events in next 72h
    supabase
      .from('campus_events')
      .select('title,event_type,venue,event_date,duration_minutes,institution')
      .eq('is_cancelled', false)
      .gte('event_date', now.toISOString())
      .lte('event_date', events72hAhead)
      .order('event_date', { ascending: true })
      .limit(5),
    // Bursary application deadlines in next 21 days
    supabase
      .from('bursary_applications')
      .select('bursary_name,deadline,status,amount_rands')
      .eq('user_id', userId)
      .not('status', 'in', '("accepted","rejected")')
      .not('deadline', 'is', null)
      .gte('deadline', today)
      .lte('deadline', bursary21dAhead)
      .order('deadline', { ascending: true })
      .limit(5),
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
    nova_messages_used: rawProfile?.nova_messages_used ?? 0,
    nova_messages_limit: rawProfile?.nova_messages_limit ?? 15,
    preferred_language: rawProfile?.preferred_language || 'en',
    ai_language: rawProfile?.ai_language || 'English',
    streak_count: rawProfile?.streak_count ?? 0,
    procrastination_type: rawProfile?.procrastination_type || null,
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

  // ── Wellness context ─────────────────────────────────────────────────────
  const rawMoodLogs = (moodLogsRes.data || []) as Array<{ score: number; logged_at: string }>
  let moodAvg: number | null = null
  let moodTrend: NovaWellnessContext['moodTrend'] = 'unknown'
  if (rawMoodLogs.length >= 3) {
    const scores = rawMoodLogs.map(m => m.score)
    moodAvg = scores.reduce((s, v) => s + v, 0) / scores.length
    const mid = Math.ceil(scores.length / 2)
    const avgFirst = scores.slice(0, mid).reduce((s, v) => s + v, 0) / mid
    const avgSecond = scores.slice(mid).reduce((s, v) => s + v, 0) / (scores.length - mid)
    const delta = avgSecond - avgFirst
    moodTrend = delta > 0.4 ? 'improving' : delta < -0.4 ? 'declining' : 'stable'
  }

  const rawWorkShifts = (workShiftsRes.data || []) as Array<{ start_time: string | null; end_time: string | null }>
  let workHoursThisWeek = 0
  let workShiftsThisWeek = rawWorkShifts.length
  for (const shift of rawWorkShifts) {
    if (shift.start_time && shift.end_time) {
      const [sh, sm] = shift.start_time.split(':').map(Number)
      const [eh, em] = shift.end_time.split(':').map(Number)
      let hrs = (eh + em / 60) - (sh + sm / 60)
      if (hrs < 0) hrs += 24
      workHoursThisWeek += hrs
    } else {
      // Fallback: assume 4h per shift when times not recorded
      workHoursThisWeek += 4
    }
  }
  workHoursThisWeek = parseFloat(workHoursThisWeek.toFixed(1))

  const burnoutProxy = Math.min(100, Math.round(
    (moodAvg !== null && moodAvg < 2.5 ? (2.5 - moodAvg) / 2.5 * 40 : 0) +
    (workHoursThisWeek > 20 ? Math.min(30, (workHoursThisWeek - 20) * 3) : 0) +
    (overdueTasks.length * 8)
  ))

  // Regulation sessions this week
  const regulationSessionsThisWeek = (regulationSessionsRes.data || []).length

  // NS Score (latest — may be from a past day)
  const nsScore = (nsScoreRes.data?.ns_score as number | null) ?? null

  // Cycle phase
  const cyclePhase = (cycleRes.data?.phase as string | null) ?? null
  const cycleEnergyLevel = (cycleRes.data?.energy_level as number | null) ?? null

  // Safety incidents count — filtered to user's institution only
  const safetyData = (safetyIncidentsRes.data || []) as Array<{ id: string; severity: string; institution: string }>
  const recentSafetyIncidents = safetyData.filter(inc =>
    !rawProfile?.university || inc.institution === rawProfile.university
  ).length

  const wellness: NovaWellnessContext = {
    moodAvg,
    moodTrend,
    workHoursThisWeek,
    workShiftsThisWeek,
    burnoutProxy,
    regulationSessionsThisWeek,
    nsScore,
    cyclePhase,
    cycleEnergyLevel,
    recentSafetyIncidents,
  }

  // Campus events (filter to user's institution)
  const allEvents = (campusEventsRes.data || []) as Array<{ title: string; event_type: string; venue: string | null; event_date: string; institution: string }>
  const upcomingCampusEvents = allEvents.filter(ev =>
    !rawProfile?.university || ev.institution === rawProfile.university
  ).slice(0, 4)

  // Bursary deadlines
  const upcomingBursaryDeadlines = (bursaryDeadlinesRes.data || []) as Array<{ bursary_name: string; deadline: string; status: string; amount_rands: number | null }>

  // ── Pattern insights (computed from already-fetched study sessions) ─────────
  const patternInsights: string[] = []

  // Peak study hour window
  if (studySessions.length >= 5) {
    const hourCounts = new Array(24).fill(0) as number[]
    const rawSessions = studySessionsRes.data ?? []
    rawSessions.forEach(s => {
      const h = new Date(s.started_at as string).getHours()
      hourCounts[h]++
    })
    let maxCount = 0, peakHour = -1
    for (let h = 0; h < 22; h++) {
      const count = hourCounts[h] + (hourCounts[h + 1] ?? 0)
      if (count > maxCount) { maxCount = count; peakHour = h }
    }
    const peakPct = Math.round(maxCount / rawSessions.length * 100)
    const fmtH = (h: number) => h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`
    if (peakHour >= 0 && peakPct >= 35) {
      patternInsights.push(`${peakPct}% of study sessions start between ${fmtH(peakHour)}–${fmtH(peakHour + 2)} — protect this natural deep-work window`)
    }
  }

  // Mood → study load correlation (rough proxy from this week's data)
  if (wellness.moodAvg !== null && studySessions.length > 0) {
    const totalStudyMins = studySessions.reduce((s, ss) => s + ss.durationMinutes, 0)
    const avgMinsPerDay  = totalStudyMins / 7
    if (wellness.moodAvg < 2.5 && avgMinsPerDay > 90) {
      patternInsights.push(`Low mood (${wellness.moodAvg.toFixed(1)}/5) despite high study load (${Math.round(avgMinsPerDay)} min/day avg) — possible burnout pattern`)
    }
  }

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
    wellness,
    crisisFlags,
    patternInsights,
    upcomingCampusEvents,
    upcomingBursaryDeadlines,
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

  const w = ctx.wellness
  const moodNote = w.moodAvg !== null
    ? `Mood avg: ${w.moodAvg.toFixed(1)}/5 (${w.moodTrend}). `
    : 'Mood: not logged. '
  const workNote = w.workShiftsThisWeek > 0
    ? `Work: ${w.workShiftsThisWeek} shift${w.workShiftsThisWeek > 1 ? 's' : ''} (≈${w.workHoursThisWeek}h) this week.`
    : 'No shifts worked this week.'
  const burnoutNote = w.burnoutProxy > 60
    ? ` ⚠️ Burnout risk HIGH (${w.burnoutProxy}/100) — prioritise recovery in your advice.`
    : w.burnoutProxy > 35
    ? ` Burnout risk moderate (${w.burnoutProxy}/100).`
    : ''

  const nsNote = w.nsScore !== null
    ? `NS score: ${w.nsScore}/100${w.nsScore < 30 ? ' ⚠️ CRITICAL — nervous system depleted, advise regulation before study' : w.nsScore < 50 ? ' (strained)' : ' (ok)'}.`
    : ''
  const regulationNote = w.regulationSessionsThisWeek > 0
    ? `Regulation this week: ${w.regulationSessionsThisWeek} session${w.regulationSessionsThisWeek > 1 ? 's' : ''} completed.`
    : 'No regulation sessions this week.'
  const cycleNote = w.cyclePhase
    ? `Cycle phase: ${w.cyclePhase}${w.cycleEnergyLevel !== null ? `, self-reported energy ${w.cycleEnergyLevel}/5` : ''}. Adapt study advice to phase (menstrual/luteal = rest/review focus; ovulation = peak performance; follicular = learning new concepts).`
    : ''
  const safetyNote = w.recentSafetyIncidents > 0
    ? `⚠️ Campus safety: ${w.recentSafetyIncidents} incident${w.recentSafetyIncidents > 1 ? 's' : ''} reported in the last 48h. Be aware if they mention campus safety or walking at night.`
    : ''

  const bursaryNote = ctx.upcomingBursaryDeadlines.length > 0
    ? `Bursary deadlines in next 21 days: ${ctx.upcomingBursaryDeadlines.map(b => {
        const daysLeft = Math.ceil((new Date(b.deadline).getTime() - Date.now()) / 86400000)
        const urgency  = daysLeft <= 3 ? ' ⚠️ URGENT' : daysLeft <= 7 ? ' (this week)' : ''
        const amt      = b.amount_rands ? ` R${b.amount_rands.toLocaleString()}` : ''
        return `"${b.bursary_name}"${amt} — ${daysLeft}d left [${b.status}]${urgency}`
      }).join('; ')}.`
    : ''

  const eventsNote = ctx.upcomingCampusEvents.length > 0
    ? `Upcoming campus events (next 72h): ${ctx.upcomingCampusEvents.map(e => {
        const d = new Date(e.event_date)
        const timeStr = d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
        const dayStr = d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })
        return `"${e.title}" (${e.event_type}) — ${dayStr} at ${timeStr}${e.venue ? ` @ ${e.venue}` : ''}`
      }).join('; ')}.`
    : ''

  const challengesNote = p.biggest_challenges?.length
    ? `Self-reported challenges: ${p.biggest_challenges.join(', ')}.`
    : ''

  const procrastinationNote = p.procrastination_type
    ? `Procrastination style: ${p.procrastination_type} — tailor study/productivity advice to this type.`
    : ''

  const langInstruction = (p.ai_language && p.ai_language !== 'English')
    ? `\n- **Language:** Respond in ${p.ai_language}. You may code-switch naturally. Keep technical terms and app names in English.`
    : ''

  const crisisNote = ctx.crisisFlags.length > 0
    ? `\n⚠️ CRISIS SIGNALS DETECTED in recent messages. Lead with warmth, validate feelings, share SADAG number (0800 456 789), and encourage them to speak to campus counselling before moving to practical advice.`
    : ''

  const patternsNote = ctx.patternInsights.length > 0
    ? `\n**${firstName}'s behavioural patterns (reference when relevant):**\n${ctx.patternInsights.map(i => `- ${i}`).join('\n')}`
    : ''

  return `---

## STUDENT LIVE DATA (fresh — use to personalise every response)

**Profile:**
- Name: ${firstName} | University: ${uni} | Year: ${p.year_of_study || 'unknown'} | Faculty: ${p.faculty || 'unknown'}
- Degree: ${p.degree_name || p.degree || 'unknown'} | Funding: ${p.funding_type?.toUpperCase() || 'unknown'}${p.nsfas_monthly_amount ? ` (R${p.nsfas_monthly_amount}/mo)` : ''}
- Accommodation: ${p.accommodation_type || 'unknown'} | Study style: ${p.study_style || 'not specified'}
- Streak: ${p.streak_count} days${challengesNote ? `\n- ${challengesNote}` : ''}${procrastinationNote ? `\n- ${procrastinationNote}` : ''}${langInstruction}

**Finances:**
- ${budgetNote}
- ${topCatNote}

**Upcoming exams (next 14 days):**
- ${examNote}

**Tasks:**
- ${overdueNote ? overdueNote + '\n- ' : ''}${pendingNote}

**Study:**
- ${studyNote}

**Wellness & Work:**
- ${moodNote}${workNote}${burnoutNote}
- ${regulationNote}${nsNote ? ' ' + nsNote : ''}
${cycleNote ? `- ${cycleNote}` : ''}
${safetyNote ? `- ${safetyNote}` : ''}
${eventsNote ? `- ${eventsNote}` : ''}
${bursaryNote ? `- ${bursaryNote}` : ''}
${patternsNote}
${crisisNote}
**Instructions:**
- You are Nova 🌟. Use the knowledge base above for SA context. Personalise using ${firstName}'s live data.
- Do NOT ask for info already in their profile above.
- Be concise. Go deeper only when they need it.
- You are NOT a licensed therapist. For serious issues, encourage professional help.${usageGuidance}`
}
