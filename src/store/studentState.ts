// ============================================================
// VarsityOS — StudentState Store (Orchestration Layer)
// Unified model of the student across all 9 life domains.
// Computed from the app store on every data change.
// Rules engine reads from here to decide interventions.
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAppStore } from './index'
import { signals } from './signals'
import { refreshSleepDebt, refreshStudyVelocity, refreshStreak, refreshNsfas } from '@/lib/intelligenceSync'
import type { Task, Module, Exam, Expense, Budget, Profile } from '@/types'

// ─── Shared enums ──────────────────────────────────────────────

export type RiskLevel = 'safe' | 'watch' | 'warning' | 'critical'

// ─── Intervention model ────────────────────────────────────────

export type InterventionUrgency = 1 | 2 | 3 | 4 | 5
export type InterventionVariant = 'chip' | 'nudge' | 'banner' | 'modal'

export interface Intervention {
  id: string
  ruleId: string
  urgency: InterventionUrgency
  variant: InterventionVariant
  title: string
  message: string
  actionLabel: string
  actionRoute: string
  createdAt: string
  expiresAt?: string
}

// ─── Domain slices ─────────────────────────────────────────────

export interface AcademicSlice {
  riskLevel: RiskLevel
  moduleRisks: Record<string, RiskLevel>   // moduleId → risk level
  studyVelocity: number                     // avg sessions/day, last 7 days (future: from study_sessions table)
  catchUpDebtHrs: number                    // estimated hours needed to get back on track
  completionRate: number                    // 0–100, tasks completed this week
  examPressure: number                      // 0–100, composite score from nearest exam
}

export interface FinancialSlice {
  runwayDays: number                        // days until budget runs out at current burn rate
  healthScore: number                       // 0–100, pacing score vs expected spend
  nsfasStatus: 'ok' | 'delayed' | 'unknown'
  spendingTrend: 'under' | 'on_track' | 'over'
  emergencyMode: boolean                    // true when runwayDays < 5 or remaining < R100
}

export interface WellnessSlice {
  burnoutScore: number                      // 0–100, composite from task overload + urgency
  moodTrend: 'improving' | 'stable' | 'declining' | 'unknown'
  moodAvg: number                           // 0–5 average of last 7 logged days
  sleepDebt: number                         // hours (future: from sleep_logs table)
  recoveryNeeded: boolean                   // burnoutScore > 60 or mood persistently low
}

export interface ScheduleSlice {
  planCoverage: number                      // % of active tasks that have due dates
  procrastIndex: number                     // % of due tasks that are overdue
  todayPlan: Task[]                         // tasks due today, priority sorted
  weekPlan: Task[]                          // tasks due this week, date sorted
  lastPlannedAt: string | null              // ISO timestamp of last AI-generated plan
  streakDays: number                        // current study streak (days)
  streakTodayDone: boolean                  // true when streak already safe today
}

// ─── Input contract for recompute ─────────────────────────────

export interface RecomputeInput {
  tasks: Task[]
  modules: Module[]
  exams: Exam[]
  expenses: Expense[]
  budget: Budget | null
  profile: Profile | null
  moodScores?: number[]     // last N days, 1–5 scale, oldest first (from varsityos-mood-cache)
  sleepDebt?: number        // hours deficit last 7 days (from AppStore.sleepDebt)
  studyVelocity?: number    // avg study hours/day, last 7 days (from AppStore.studyVelocity7d)
  nsfasDelayed?: boolean    // true when nsfas_disbursements has overdue expected rows
  streakDays?: number       // current study streak (from AppStore.streakDays)
  streakTodayDone?: boolean // true when streak already safe today (from AppStore.streakTodayDone)
}

// ─── Full store interface ──────────────────────────────────────

interface StudentStateStore {
  academic:      AcademicSlice
  financial:     FinancialSlice
  wellness:      WellnessSlice
  schedule:      ScheduleSlice
  interventions: {
    queue:            Intervention[]
    activeId:         string | null
    suppressedUntil:  string | null  // ISO — suppress all interventions until this time
  }
  meta: {
    lastComputedAt:   string | null
    dataCompleteness: number         // 0–100, how many data sources are populated
  }

  // Recompute all derived state from raw app store data
  recompute:             (data: RecomputeInput) => void
  // Intervention queue management
  queueIntervention:     (intervention: Intervention) => void
  dismissIntervention:   (id: string) => void
  setActiveIntervention: (id: string | null) => void
  suppressInterventions: (untilIso: string) => void
  setLastPlannedAt:      (iso: string) => void
}

// ─── Date helpers (SAST-aware as best we can in JS) ───────────

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysFromNow(dateStr: string): number {
  const t = new Date(dateStr).getTime()
  return Math.ceil((t - Date.now()) / 86_400_000)
}

function weekBounds(): { start: string; end: string } {
  const now = new Date()
  const day = now.getDay() // 0 = Sun
  const toMon = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + toMon)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { start: fmt(monday), end: fmt(sunday) }
}

// ─── Domain computation functions ─────────────────────────────

function computeAcademic(tasks: Task[], modules: Module[], exams: Exam[], studyVelocity = 0): AcademicSlice {
  const today = todayStr()
  const { start: weekStart, end: weekEnd } = weekBounds()

  const activeTasks  = tasks.filter(t => t.status !== 'done')
  const overdueTasks = activeTasks.filter(t => t.due_date && t.due_date < today)

  // Completion rate: tasks due this week done / tasks due this week total
  const dueThisWeek  = tasks.filter(t => t.due_date && t.due_date >= weekStart && t.due_date <= weekEnd)
  const doneThisWeek = dueThisWeek.filter(t => t.status === 'done')
  const completionRate = dueThisWeek.length > 0
    ? Math.round((doneThisWeek.length / dueThisWeek.length) * 100)
    : 100

  // Module risk: driven by overdue task count per module
  const moduleRisks: Record<string, RiskLevel> = {}
  for (const mod of modules) {
    const overdueCount = overdueTasks.filter(t => t.module_id === mod.id).length
    const hasNearExam  = exams.some(e => e.module_id === mod.id && daysFromNow(e.exam_date) <= 14 && daysFromNow(e.exam_date) >= 0)

    if (overdueCount >= 3)                           moduleRisks[mod.id] = 'critical'
    else if (overdueCount === 2)                     moduleRisks[mod.id] = 'warning'
    else if (overdueCount === 1 || hasNearExam)      moduleRisks[mod.id] = 'watch'
    else                                             moduleRisks[mod.id] = 'safe'
  }

  // Overall academic risk rolls up from module risks + raw overdue count
  const criticals = Object.values(moduleRisks).filter(r => r === 'critical').length
  const warnings  = Object.values(moduleRisks).filter(r => r === 'warning').length
  let riskLevel: RiskLevel = 'safe'
  if (criticals >= 2 || overdueTasks.length >= 5)        riskLevel = 'critical'
  else if (criticals >= 1 || warnings >= 2 || overdueTasks.length >= 3) riskLevel = 'warning'
  else if (warnings >= 1  || overdueTasks.length >= 1)   riskLevel = 'watch'

  // Exam pressure: closest upcoming exam drives the score
  const nextExam = exams
    .filter(e => daysFromNow(e.exam_date) >= 0)
    .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())[0]

  let examPressure = 0
  if (nextExam) {
    const days = daysFromNow(nextExam.exam_date)
    if      (days <= 3)  examPressure = 100
    else if (days <= 7)  examPressure = 85
    else if (days <= 14) examPressure = 65
    else if (days <= 30) examPressure = 35
    else                 examPressure = 15
  }

  return {
    riskLevel,
    moduleRisks,
    studyVelocity,
    catchUpDebtHrs: overdueTasks.length * 2,  // 2h estimate per overdue task
    completionRate,
    examPressure,
  }
}

function computeFinancial(expenses: Expense[], budget: Budget | null, profile: Profile | null, nsfasDelayed = false): FinancialSlice {
  if (!budget) {
    return { runwayDays: 30, healthScore: 50, nsfasStatus: nsfasDelayed ? 'delayed' : 'unknown', spendingTrend: 'on_track', emergencyMode: false }
  }

  const now          = new Date()
  const dayOfMonth   = now.getDate()
  const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const monthYear    = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const thisMonthExpenses = expenses.filter(e =>
    (e.month_year && e.month_year === monthYear) ||
    (e.expense_date && e.expense_date.startsWith(monthYear))
  )
  const spentThisMonth = thisMonthExpenses.reduce((s, e) => s + (e.amount ?? 0), 0)
  const remaining      = Math.max(0, budget.monthly_budget - spentThisMonth)
  const dailyBurn      = dayOfMonth > 0 ? spentThisMonth / dayOfMonth : 0
  const runwayDays     = dailyBurn > 0
    ? Math.floor(remaining / dailyBurn)
    : (daysInMonth - dayOfMonth)

  // Health score: actual spend % vs expected % of month elapsed
  const expectedPct = dayOfMonth / daysInMonth
  const actualPct   = budget.monthly_budget > 0 ? spentThisMonth / budget.monthly_budget : 0
  const healthScore = Math.max(0, Math.min(100, Math.round((1 - (actualPct - expectedPct) * 2) * 100)))

  // Spending trend: this week vs last week
  const msPerDay   = 86_400_000
  const thisWeekCutoff = Date.now() - 7 * msPerDay
  const lastWeekCutoff = Date.now() - 14 * msPerDay
  const thisWeekSpend = expenses
    .filter(e => e.expense_date && new Date(e.expense_date).getTime() >= thisWeekCutoff)
    .reduce((s, e) => s + e.amount, 0)
  const lastWeekSpend = expenses
    .filter(e => {
      const t = new Date(e.expense_date).getTime()
      return t >= lastWeekCutoff && t < thisWeekCutoff
    })
    .reduce((s, e) => s + e.amount, 0)

  let spendingTrend: FinancialSlice['spendingTrend'] = 'on_track'
  if (lastWeekSpend > 0) {
    const ratio = thisWeekSpend / lastWeekSpend
    if      (ratio > 1.2) spendingTrend = 'over'
    else if (ratio < 0.8) spendingTrend = 'under'
  }

  return {
    runwayDays,
    healthScore,
    nsfasStatus:  nsfasDelayed ? 'delayed' : (profile?.funding_type === 'nsfas' ? 'ok' : 'unknown'),
    spendingTrend,
    emergencyMode: runwayDays < 5 || remaining < 100,
  }
}

function computeWellness(tasks: Task[], moodScores: number[] = [], sleepDebt = 0): WellnessSlice {
  const today      = todayStr()
  const active     = tasks.filter(t => t.status !== 'done')
  const overdue    = active.filter(t => t.due_date && t.due_date < today)
  const urgent     = active.filter(t => t.priority === 'urgent')

  // Burnout: overdue tasks + urgent tasks + queue overload
  let burnoutScore = 0
  burnoutScore += Math.min(40, overdue.length * 8)
  burnoutScore += Math.min(30, urgent.length * 10)
  burnoutScore += Math.min(20, Math.max(0, active.length - 10) * 2)

  // Mood data adjusts burnout: sustained low mood adds to the score
  let moodAvg = 0
  let moodTrend: WellnessSlice['moodTrend'] = 'unknown'
  if (moodScores.length >= 3) {
    moodAvg = moodScores.reduce((s, v) => s + v, 0) / moodScores.length
    const midpoint    = Math.ceil(moodScores.length / 2)
    const firstHalf   = moodScores.slice(0, midpoint)
    const secondHalf  = moodScores.slice(midpoint)
    const avgFirst    = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length
    const avgSecond   = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length
    const delta       = avgSecond - avgFirst
    if (delta > 0.4)       moodTrend = 'improving'
    else if (delta < -0.4) moodTrend = 'declining'
    else                   moodTrend = 'stable'

    // Low sustained mood adds up to 15 pts to burnout score
    if (moodAvg < 2.5) burnoutScore += Math.round((2.5 - moodAvg) / 2.5 * 15)
  }

  // Sleep debt: up to 20 pts added to burnout (14h debt = full 20 pts)
  if (sleepDebt > 0) {
    burnoutScore += Math.min(20, Math.round(sleepDebt * 20 / 14))
  }

  burnoutScore = Math.min(100, Math.round(burnoutScore))

  return {
    burnoutScore,
    moodTrend,
    moodAvg,
    sleepDebt,
    recoveryNeeded: burnoutScore > 60 || (moodAvg > 0 && moodAvg < 2) || sleepDebt > 10,
  }
}

function computeSchedule(tasks: Task[], streakDays = 0, streakTodayDone = false): ScheduleSlice {
  const today       = todayStr()
  const { end: weekEnd } = weekBounds()
  const active      = tasks.filter(t => t.status !== 'done')
  const withDates   = active.filter(t => t.due_date)
  const dueOrPast   = active.filter(t => t.due_date && t.due_date <= today)
  const overdue     = active.filter(t => t.due_date && t.due_date < today)

  const planCoverage  = active.length > 0
    ? Math.round((withDates.length / active.length) * 100) : 100
  const procrastIndex = dueOrPast.length > 0
    ? Math.round((overdue.length / dueOrPast.length) * 100) : 0

  const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

  const todayPlan = active
    .filter(t => t.due_date === today)
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3))

  const weekPlan = active
    .filter(t => t.due_date && t.due_date >= today && t.due_date <= weekEnd)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())

  return { planCoverage, procrastIndex, todayPlan, weekPlan, lastPlannedAt: null, streakDays, streakTodayDone }
}

function computeCompleteness(data: RecomputeInput): number {
  let score = 0
  if (data.profile)          score += 20
  if (data.modules.length > 0) score += 20
  if (data.tasks.length > 0)   score += 20
  if (data.exams.length > 0)   score += 20
  if (data.budget)           score += 20
  return score
}

// ─── Defaults ─────────────────────────────────────────────────

const DEFAULT_ACADEMIC: AcademicSlice  = { riskLevel: 'safe', moduleRisks: {}, studyVelocity: 0, catchUpDebtHrs: 0, completionRate: 100, examPressure: 0 }
const DEFAULT_FINANCIAL: FinancialSlice = { runwayDays: 30, healthScore: 75, nsfasStatus: 'unknown', spendingTrend: 'on_track', emergencyMode: false }
const DEFAULT_WELLNESS: WellnessSlice  = { burnoutScore: 0, moodTrend: 'unknown', moodAvg: 0, sleepDebt: 0, recoveryNeeded: false }
const DEFAULT_SCHEDULE: ScheduleSlice  = { planCoverage: 100, procrastIndex: 0, todayPlan: [], weekPlan: [], lastPlannedAt: null, streakDays: 0, streakTodayDone: false }

// ─── Zustand store ─────────────────────────────────────────────

export const useStudentState = create<StudentStateStore>()(
  persist(
    (set, get) => ({
      academic:      DEFAULT_ACADEMIC,
      financial:     DEFAULT_FINANCIAL,
      wellness:      DEFAULT_WELLNESS,
      schedule:      DEFAULT_SCHEDULE,
      interventions: { queue: [], activeId: null, suppressedUntil: null },
      meta:          { lastComputedAt: null, dataCompleteness: 0 },

      recompute(data: RecomputeInput) {
        const academic    = computeAcademic(data.tasks, data.modules, data.exams, data.studyVelocity ?? 0)
        const financial   = computeFinancial(data.expenses, data.budget, data.profile, data.nsfasDelayed ?? false)
        const wellness    = computeWellness(data.tasks, data.moodScores ?? [], data.sleepDebt ?? 0)
        // Preserve lastPlannedAt across recomputes
        const prevLastPlanned = get().schedule.lastPlannedAt
        const schedule    = { ...computeSchedule(data.tasks, data.streakDays ?? 0, data.streakTodayDone ?? false), lastPlannedAt: prevLastPlanned }

        set({
          academic,
          financial,
          wellness,
          schedule,
          meta: {
            lastComputedAt:   new Date().toISOString(),
            dataCompleteness: computeCompleteness(data),
          },
        })
      },

      queueIntervention(intervention: Intervention) {
        set((state) => {
          // One active intervention per rule at a time — replace if re-triggered
          const deduped = state.interventions.queue.filter(i => i.ruleId !== intervention.ruleId)
          return {
            interventions: {
              ...state.interventions,
              queue: [...deduped, intervention].sort((a, b) => b.urgency - a.urgency),
            },
          }
        })
      },

      dismissIntervention(id: string) {
        set((state) => ({
          interventions: {
            ...state.interventions,
            queue:    state.interventions.queue.filter(i => i.id !== id),
            activeId: state.interventions.activeId === id ? null : state.interventions.activeId,
          },
        }))
      },

      setActiveIntervention(id: string | null) {
        set((state) => ({ interventions: { ...state.interventions, activeId: id } }))
      },

      suppressInterventions(untilIso: string) {
        set((state) => ({
          interventions: { ...state.interventions, suppressedUntil: untilIso, activeId: null },
        }))
      },

      setLastPlannedAt(iso: string) {
        set((state) => ({
          schedule: { ...state.schedule, lastPlannedAt: iso },
        }))
      },
    }),
    {
      name: 'varsityos-student-state',
      version: 1,
      // Only persist the intervention queue and meta — computed slices are always derived fresh
      partialize: (state) => ({
        interventions: state.interventions,
        meta:          { lastComputedAt: state.meta.lastComputedAt, dataCompleteness: state.meta.dataCompleteness },
      }),
    }
  )
)

// ─── App store subscription ────────────────────────────────────
// Call initOrchestration() once in the root layout.
// It subscribes to the app store and recomputes StudentState on every change.

let _unsubscribe: (() => void) | null = null

// Read last 7 days of mood scores from the localStorage cache written by MoodCheckin.
// Sorted oldest-first so computeWellness can detect trend direction.
function readMoodCache(): number[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('varsityos-mood-cache')
    if (!raw) return []
    const cache = JSON.parse(raw) as Record<string, number>
    const now = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (6 - i))
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return cache[key] ?? null
    }).filter((v): v is number => v !== null)
  } catch {
    return []
  }
}

export function initOrchestration(): () => void {
  _unsubscribe?.()

  const runRecompute = (state: ReturnType<typeof useAppStore.getState>) => {
    useStudentState.getState().recompute({
      tasks:           state.tasks,
      modules:         state.modules,
      exams:           state.exams,
      expenses:        state.expenses,
      budget:          state.budget,
      profile:         state.profile,
      moodScores:      readMoodCache(),
      sleepDebt:       state.sleepDebt,
      studyVelocity:   state.studyVelocity7d,
      nsfasDelayed:    state.nsfasDelayed,
      streakDays:      state.streakDays,
      streakTodayDone: state.streakTodayDone,
    })
  }

  _unsubscribe = useAppStore.subscribe(runRecompute)

  // Hydrate immediately with current state
  runRecompute(useAppStore.getState())

  // Trigger recompute when modules emit relevant signals so the rules
  // engine picks up changes that don't flow through the AppStore.
  // For signals where the relevant AppStore intelligence field needs a
  // fresh Supabase fetch, we call the refresh function first — the
  // AppStore subscription then fires runRecompute automatically with
  // the updated value. For signals where the data is already in the
  // AppStore (tasks, grades, expenses) we call runRecompute directly.
  const getState = () => useAppStore.getState()
  const signalUnsubs = [
    signals.on('task_completed',      () => runRecompute(getState())),
    signals.on('grade_updated',       () => runRecompute(getState())),
    signals.on('expense_logged',      () => runRecompute(getState())),
    // Mood logged → re-read localStorage cache; AppStore not involved
    signals.on('mood_logged',         () => runRecompute(getState())),
    // These need a fresh Supabase fetch before recomputing
    signals.on('sleep_logged',        () => { refreshSleepDebt().catch(() => {}) }),
    signals.on('study_session_ended', () => { refreshStudyVelocity().catch(() => {}); refreshStreak().catch(() => {}) }),
    signals.on('nsfas_status_change', () => { refreshNsfas().catch(() => {}) }),
  ]

  return () => {
    _unsubscribe?.()
    signalUnsubs.forEach(u => u())
  }
}
