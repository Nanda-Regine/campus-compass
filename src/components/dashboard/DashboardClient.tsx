'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/store'
import { signals } from '@/store/signals'
import PullToRefresh from '@/components/ui/PullToRefresh'
import MoodCheckin from '@/components/dashboard/MoodCheckin'
import {
  type Profile, type Budget, type Task, type Exam,
  type Module, type TimetableEntry, type Expense,
  type Subscription,
} from '@/types'
import { getDaysUntil, calcTotalBudget } from '@/lib/utils'
import { useAutoTodoSpawner } from '@/lib/todoSpawner'
import { getDataSaverEnabled, onDataSaverChange } from '@/lib/dataSaver'
import { getDayMode } from '@/components/dashboard/DayModeBanner'
import { DASH_THEME, MODE_LABEL, getGreeting, getWeekBadge, toISODate } from '@/components/dashboard/dashboardHelpers'
import { SectionHeader, CollapsibleSection, Deferred } from '@/components/dashboard/layout'
import dynamic from 'next/dynamic'
import LevelCard from '@/components/gamification/LevelCard'
import DailyChallenges from '@/components/gamification/DailyChallenges'
import StreakWidget from '@/components/gamification/StreakWidget'
import { AmbientImage } from '@/components/ui/AmbientImage'
import InterventionBanner from '@/components/orchestration/InterventionBanner'
import InterventionModal from '@/components/orchestration/InterventionModal'
import SundayPlanning from '@/components/orchestration/SundayPlanning'
import WeatherWidget from '@/components/dashboard/WeatherWidget'
import NotificationPrompt from '@/components/dashboard/NotificationPrompt'
import FirstYearStarter from '@/components/dashboard/FirstYearStarter'
import WelcomeBanner from '@/components/dashboard/WelcomeBanner'
import TaskCalendarStrip from '@/components/dashboard/TaskCalendarStrip'
import TabErrorBoundary from '@/components/ui/TabErrorBoundary'
import BurnoutRadar from '@/components/regulate/BurnoutRadar'
import MoneyHealthScore from '@/components/budget/MoneyHealthScore'
import ProcrastinationAlarm from '@/components/dashboard/ProcrastinationAlarm'
import JustStartButton from '@/components/study/JustStartButton'
import DeadlineTelescope from '@/components/study/DeadlineTelescope'
import AntiSpiralRecovery from '@/components/study/AntiSpiralRecovery'
import OSCommandHero from '@/components/dashboard/cards/OSCommandHero'
import PriorityCommandStrip from '@/components/dashboard/cards/PriorityCommandStrip'
import StatCardsRow from '@/components/dashboard/cards/StatCardsRow'
import FeatureGrid from '@/components/dashboard/cards/FeatureGrid'
import UpgradeBar from '@/components/dashboard/cards/UpgradeBar'
import PrescriptionReminderCard from '@/components/dashboard/cards/PrescriptionReminderCard'

// Code-split below-the-fold widgets: each one only mounts inside a <Deferred> (on scroll)
// or inside the collapsed "Focus tools" section, so ssr:false keeps their JS out of the
// initial bundle with no visual flash — a real first-paint win on low-end / prepaid Android.
const LoadSheddingWidget       = dynamic(() => import('@/components/dashboard/LoadSheddingWidget'), { ssr: false })
const DailyBrief               = dynamic(() => import('@/components/orchestration/DailyBrief'), { ssr: false })
const InsightsCard             = dynamic(() => import('@/components/dashboard/InsightsCard'), { ssr: false })
const WeeklyReport             = dynamic(() => import('@/components/dashboard/WeeklyReport'), { ssr: false })
const DomainPulse              = dynamic(() => import('@/components/dashboard/DomainPulse'), { ssr: false })
const CohortCard               = dynamic(() => import('@/components/dashboard/CohortCard'), { ssr: false })
const FinancialStressLink      = dynamic(() => import('@/components/finance/FinancialStressLink'), { ssr: false })
const SassaSrdGuide            = dynamic(() => import('@/components/finance/SassaSrdGuide'), { ssr: false })
const CommitmentContracts      = dynamic(() => import('@/components/study/CommitmentContracts'), { ssr: false })
const ImplementationIntentions = dynamic(() => import('@/components/study/ImplementationIntentions'), { ssr: false })
const BodyDoubleMode           = dynamic(() => import('@/components/study/BodyDoubleMode'), { ssr: false })
const ProcrastinationJournal   = dynamic(() => import('@/components/study/ProcrastinationJournal'), { ssr: false })
const RewardUnlock             = dynamic(() => import('@/components/gamification/RewardUnlock'), { ssr: false })
const FocusMomentumScore       = dynamic(() => import('@/components/dashboard/FocusMomentumScore'), { ssr: false })
const ProcrastinationProfiler  = dynamic(() => import('@/components/study/ProcrastinationProfiler'), { ssr: false })
const AccountabilityPartner    = dynamic(() => import('@/components/study/AccountabilityPartner'), { ssr: false })
const CommunityChallengesHub   = dynamic(() => import('@/components/community/CommunityChallengesHub'), { ssr: false })
const StudyTipsCard            = dynamic(() => import('@/components/dashboard/cards/StudyTipsCard'), { ssr: false })
const CoachSummaryCard         = dynamic(() => import('@/components/dashboard/cards/CoachSummaryCard'), { ssr: false })
const ExamCountdownCard        = dynamic(() => import('@/components/dashboard/cards/ExamCountdownCard'), { ssr: false })
const BudgetRingCard           = dynamic(() => import('@/components/dashboard/cards/BudgetRingCard'), { ssr: false })
const DomainFlames             = dynamic(() => import('@/components/gamification/DomainFlames'), { ssr: false })
const ArchetypeCard            = dynamic(() => import('@/components/gamification/ArchetypeCard'), { ssr: false })
const PendingXP                = dynamic(() => import('@/components/gamification/PendingXP'), { ssr: false })
const ChapterBanner            = dynamic(() => import('@/components/gamification/ChapterBanner'), { ssr: false })
const PodActivityFeed          = dynamic(() => import('@/components/gamification/PodActivityFeed'), { ssr: false })

/* ── types ──────────────────────────────────────────────── */
interface NovaInsight { id: string; insight_type: string; content: string; created_at: string }
interface IncomeEntry { id: string; source_type: string; label: string; amount: number; received_date: string; is_recurring: boolean }

interface DashboardClientProps {
  initialData: {
    profile: Profile
    budget: Budget | null
    tasks: Task[]
    exams: Exam[]
    modules: Module[]
    timetable: TimetableEntry[]
    recentExpenses: Expense[]
    incomeEntries: IncomeEntry[]
    shiftEarnings: number
    shiftHoursThisWeek: number
    subscription: Subscription | null
    // Enhancement data folded into SSR (formerly fetched client-side on mount)
    mealPlanExists: boolean
    shiftsThisWeek: number
    activeGroups: number
    nsfasDelayed: boolean
    weekWorkouts: number
    todayStudyMins: number
    lastSleepHours: number | null
    studyVelocity7d: number
    sleepDebt: number
  }
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const store = useAppStore()
  const [novaInsights, setNovaInsights] = useState<NovaInsight[]>([])
  // Seeded from SSR initialData — no client fetch needed on mount.
  const [mealPlanExists] = useState(initialData.mealPlanExists)
  const [shiftsThisWeek] = useState(initialData.shiftsThisWeek)
  const [activeGroups] = useState(initialData.activeGroups)
  const [novaCheckin, setNovaCheckin] = useState<string | null>(null)
  const [streakDays, setStreakDays] = useState(0)
  const [streakTodayDone, setStreakTodayDone] = useState(false)
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours())
  const [todayStudyMins] = useState(initialData.todayStudyMins)
  const [lastSleepHours] = useState<number | null>(initialData.lastSleepHours)
  const [weekWorkouts] = useState(initialData.weekWorkouts)
  // Data Saver — gates the ambient imagery and the enhancement fetches/widgets below.
  // Starts false for SSR safety, then reads the real preference on mount and stays in sync.
  const [dataSaver, setDataSaver] = useState(false)
  useEffect(() => {
    setDataSaver(getDataSaverEnabled())
    return onDataSaverChange(setDataSaver)
  }, [])

  // Guardian: auto-spawn todos from timetable, deadlines, and domain state
  useAutoTodoSpawner()

  // 1. Store init
  useEffect(() => {
    store.setProfile(initialData.profile)
    store.setBudget(initialData.budget)
    store.setTasks(initialData.tasks)
    store.setExams(initialData.exams)
    store.setModules(initialData.modules)
    store.setTimetable(initialData.timetable)
    store.setExpenses(initialData.recentExpenses)
    if (initialData.subscription) store.setSubscription(initialData.subscription)
    // Seed orchestration signals from SSR (formerly written by the client-side live-data effect)
    store.setNsfasDelayed(initialData.nsfasDelayed)
    store.setStudyVelocity7d(initialData.studyVelocity7d)
    store.setSleepDebt(initialData.sleepDebt)
    // Seed work-hours cache so the orchestration layer can factor it into burnout
    if (initialData.shiftHoursThisWeek > 0) {
      const now = new Date()
      const jsDay = now.getDay()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (jsDay === 0 ? 6 : jsDay - 1))
      try {
        localStorage.setItem('varsityos-work-hours-cache', JSON.stringify({
          weekHours: initialData.shiftHoursThisWeek,
          weekOf:    weekStart.toISOString().split('T')[0],
        }))
      } catch { /* quota full */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2. Pending referral apply
  useEffect(() => {
    const pendingRef = localStorage.getItem('pending_ref')
    if (!pendingRef) return
    const ctrl = new AbortController()
    localStorage.removeItem('pending_ref')
    fetch('/api/referral', { method: 'POST', signal: ctrl.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: pendingRef }) })
      .then(r => r.json())
      .then(d => { if (d.success) import('react-hot-toast').then(({ default: toast }) => { toast.success(`🎉 Referral applied! +${d.referredXp ?? 100} XP unlocked.`) }) })
      .catch(() => {})
    return () => ctrl.abort()
  }, [])

  // 3. Load proactive nova insights — session-cached to prevent layout shift on re-navigation
  useEffect(() => {
    const key = `nova-insights-${new Date().toISOString().split('T')[0]}`
    try {
      const cached = sessionStorage.getItem(key)
      if (cached) { setNovaInsights(JSON.parse(cached)); return }
    } catch { /* ignore */ }
    if (getDataSaverEnabled()) return // Data Saver: skip the proactive-insights network call
    fetch('/api/insights').then(r => r.ok ? r.json() : null).then(d => {
      if (d) {
        setNovaInsights(d.insights ?? [])
        try { sessionStorage.setItem(key, JSON.stringify(d.insights ?? [])) } catch { /* quota */ }
      }
    }).catch(() => {})
  }, [])

  // 5. Nova check-in — localStorage cached per day; skipped in Data Saver mode
  useEffect(() => {
    if (getDataSaverEnabled()) return
    const today = new Date().toISOString().split('T')[0]
    const cachedDate = localStorage.getItem('nova_last_checkin_date')
    const cachedMsg  = localStorage.getItem('nova_checkin_message')
    if (cachedDate === today && cachedMsg) { setNovaCheckin(cachedMsg); return }
    const ctrl = new AbortController()
    fetch('/api/nova/checkin', { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.message) { setNovaCheckin(d.message); localStorage.setItem('nova_last_checkin_date', today); localStorage.setItem('nova_checkin_message', d.message) } })
      .catch(() => {})
    return () => ctrl.abort()
  }, [])

  // 6. Streak — session-cached
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const cached = sessionStorage.getItem(`streak_${today}`)
    if (cached) {
      try {
        const d = JSON.parse(cached)
        setStreakDays(d.streak ?? 0)
        setStreakTodayDone(d.todayDone ?? false)
        store.setStreakDays(d.streak ?? 0)
        store.setStreakTodayDone(d.todayDone ?? false)
        return
      } catch { /* ignore */ }
    }
    const ctrl = new AbortController()
    fetch('/api/streak', { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && !d.error) {
          setStreakDays(d.streak ?? 0)
          setStreakTodayDone(d.todayDone ?? false)
          store.setStreakDays(d.streak ?? 0)
          store.setStreakTodayDone(d.todayDone ?? false)
          sessionStorage.setItem(`streak_${today}`, JSON.stringify(d))
        }
      })
      .catch(() => {})
    return () => ctrl.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 7. Exam push check (once per session)
  useEffect(() => {
    if (sessionStorage.getItem('push_checked')) return
    sessionStorage.setItem('push_checked', '1')
    fetch('/api/push/check-exams').catch(() => {})
  }, [])

  // 8. FCM push notification subscription
  useEffect(() => {
    if (sessionStorage.getItem('fcm_init')) return
    sessionStorage.setItem('fcm_init', '1')
    const userId = initialData.profile.id
    import('@/lib/firebase-messaging').then(({ initPushNotifications }) => initPushNotifications(userId)).catch(() => {})
  }, [])

  // 9a. Cache totalIncome so studentState.ts computeFinancial uses real income in runway formula
  useEffect(() => {
    const manualIncome  = initialData.incomeEntries.reduce((s: number, e: { amount: number }) => s + e.amount, 0)
    const shiftEarnings = initialData.shiftEarnings
    const totalIncome   = manualIncome + shiftEarnings
    const now           = new Date()
    const month         = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    try { localStorage.setItem('varsityos-income-cache', JSON.stringify({ totalIncome, month })) } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 9. Keep currentHour in sync
  useEffect(() => {
    const update = () => setCurrentHour(new Date().getHours())
    const now = new Date()
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
    let interval: ReturnType<typeof setInterval> | null = null
    const timeout = setTimeout(() => {
      update()
      interval = setInterval(update, 60_000)
    }, msToNextMinute)
    return () => {
      clearTimeout(timeout)
      if (interval !== null) clearInterval(interval)
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    try {
      const [insightsRes, streakRes] = await Promise.all([
        fetch('/api/insights').catch(() => null),
        fetch('/api/streak').catch(() => null),
      ])
      if (insightsRes?.ok) { const d = await insightsRes.json(); setNovaInsights(d.insights ?? []) }
      if (streakRes?.ok) {
        const d = await streakRes.json()
        if (!d.error) {
          setStreakDays(d.streak ?? 0)
          setStreakTodayDone(d.todayDone ?? false)
          store.setStreakDays(d.streak ?? 0)
          store.setStreakTodayDone(d.todayDone ?? false)
          sessionStorage.setItem(`streak_${new Date().toISOString().split('T')[0]}`, JSON.stringify(d))
        }
      }
      if (!navigator.onLine) return
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: tasks }, { data: exams }] = await Promise.all([
        supabase.from('tasks').select('*, module:modules(id,module_name,color)').eq('user_id', user.id),
        supabase.from('exams').select('*, module:modules(id,module_name,color)').eq('user_id', user.id),
      ])
      if (tasks) store.setTasks(tasks)
      if (exams)  store.setExams(exams)
    } catch { /* silent */ }
  }, [store])

  const dismissInsight = async (id: string) => {
    const prev = novaInsights
    setNovaInsights(p => p.filter(i => i.id !== id))
    try {
      const res = await fetch('/api/insights', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      if (!res.ok) setNovaInsights(prev)
    } catch { setNovaInsights(prev) }
  }

  const { profile, budget, tasks, exams, modules, expenses } = store
  const p         = profile  ?? initialData.profile
  const b         = budget   ?? initialData.budget
  const allTasks  = tasks.length   ? tasks   : initialData.tasks
  const allExams  = exams.length   ? exams   : initialData.exams
  const allMods   = modules.length ? modules : initialData.modules
  const recentExp = expenses.length ? expenses : initialData.recentExpenses
  const sub       = store.subscription ?? initialData.subscription

  const baseBudget    = b ? calcTotalBudget(b) : 0
  const manualIncome  = initialData.incomeEntries.reduce((s, e) => s + e.amount, 0)
  const shiftEarnings = initialData.shiftEarnings
  const totalIncome   = manualIncome + shiftEarnings
  const totalBudget   = baseBudget + totalIncome
  const monthSpent  = recentExp.reduce((s, e) => s + e.amount, 0)
  const remaining   = totalBudget - monthSpent
  const isPremium   = p?.is_premium || ['scholar', 'nova_unlimited'].includes(p?.subscription_tier ?? '')
  const firstName   = p?.full_name?.split(' ')[0] ?? 'Student'

  // Real income/savings signals for the Money Health widget (previously hardcoded
  // to nsfasStatus="ok"/savingsRate=0, so its Income bar was always full and Savings empty).
  const incomeStatus: 'ok' | 'delayed' | 'partial' | 'none' =
    p?.funding_type === 'nsfas'
      ? (store.nsfasDelayed ? 'delayed' : 'ok')
      : (totalIncome > 0 ? 'ok' : 'none')
  const savingsRate = totalBudget > 0
    ? Math.max(0, Math.min(100, (remaining / totalBudget) * 100))
    : 0

  // Mode-driven design tokens — everything derives from this
  const mode  = getDayMode(currentHour)
  const theme = DASH_THEME[mode]

  // Domain Pulse derived values — computed once for DomainPulse
  const todayISOStr  = toISODate()
  const domainOverdue   = allTasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < todayISOStr).length
  const domainExamDays  = allExams.length > 0 ? getDaysUntil(allExams[0].exam_date) : null

  return (
    <>
      {/* Full-page ambient image + blurred orbs — decorative only. Skipped in Data Saver mode:
          it avoids an image download and the GPU cost of large blur radii, which is the main
          source of scroll jank on low-end Android. */}
      {!dataSaver && (
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <AmbientImage zone="dashboard" opacity={0.30} blurPx={25} saturation={1.0}
          overlayColor="rgba(5,4,12,0.0)" />
        {/* Mode-driven orbs float above the ambient image */}
        <div className="orb-float" style={{
          position: 'absolute', top: '-6%', left: '-10%', width: 620, height: 620, borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.orb1} 0%, transparent 70%)`,
          filter: 'blur(75px)',
        }} />
        <div className="orb-float-r" style={{
          position: 'absolute', bottom: '12%', right: '-8%', width: 520, height: 520, borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.orb2} 0%, transparent 70%)`,
          filter: 'blur(65px)',
        }} />
        <div style={{
          position: 'absolute', top: '48%', left: '28%', width: 360, height: 360, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(201,168,76,0.06) 0%,transparent 70%)',
          filter: 'blur(50px)',
        }} />
      </div>
      )}

      <div className="page-enter min-h-screen" style={{ background: dataSaver ? '#05040c' : 'rgba(5,4,12,0.62)' }}>

        <PullToRefresh onRefresh={handleRefresh} />

        {/* Topbar with mode indicator */}
        <div style={{ position: 'sticky', top: 0, zIndex: 30, background: dataSaver ? 'rgba(10,11,16,0.98)' : 'rgba(10,11,16,0.92)', backdropFilter: dataSaver ? undefined : 'blur(20px)', WebkitBackdropFilter: dataSaver ? undefined : 'blur(20px)', borderBottom: '0.5px solid rgba(255,255,255,0.05)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em' }}>
              {getGreeting()}, {firstName}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <span className="status-live" style={{ width: 5, height: 5, borderRadius: '50%', background: theme.accent, display: 'inline-block' }} />
              <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: theme.accent, letterSpacing: '0.06em' }}>
                {MODE_LABEL[mode].label} mode{p?.university ? ` · ${p.university}` : ''}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 11, padding: '4px 10px', borderRadius: 9999, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {getWeekBadge()}
          </div>
        </div>

        {/* Mode accent line below topbar */}
        <div style={{
          position: 'sticky', top: 60, zIndex: 29, height: 1,
          background: `linear-gradient(90deg, ${theme.accent}70 0%, ${theme.accent}25 50%, transparent 100%)`,
        }} />

        <div style={{ padding: '20px 24px', maxWidth: 1600, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Welcome banner — shows once after onboarding completes */}
          <WelcomeBanner />

          {/* Push notification opt-in — shows once for new users */}
          <NotificationPrompt />

          {/* First-year onboarding nudge → Housing OS starter kit / settling in */}
          <FirstYearStarter yearOfStudy={p?.year_of_study} firstName={firstName} />

          {/* Orchestration — intervention banner (urgency 1-4) */}
          <div style={{ marginBottom: 12 }}>
            <TabErrorBoundary label="Intervention Banner">
              <InterventionBanner />
            </TabErrorBoundary>
          </div>

          {/* Nova proactive insights */}
          {novaInsights.map(insight => (
            <div key={insight.id} className="dash-card-in" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(155,111,212,0.08)', border: '0.5px solid rgba(155,111,212,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>
                {{ study_nudge: '📚', budget_warning: '💰', stress_alert: '💙' }[insight.insight_type] ?? '🌟'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9b6fd4', marginBottom: 4 }}>Nova</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{insight.content}</div>
              </div>
              <button onClick={() => dismissInsight(insight.id)} aria-label="Dismiss" style={{ color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: 0 }}>✕</button>
            </div>
          ))}

          {/* Anti-Spiral Recovery — full recovery protocol when 2+ idle days or 4+ overdue */}
          <TabErrorBoundary label="Anti-Spiral Recovery">
            <AntiSpiralRecovery tasks={allTasks} />
          </TabErrorBoundary>

          {/* Procrastination Alarm — shows only when severity > safe */}
          <TabErrorBoundary label="Procrastination Alarm">
            <ProcrastinationAlarm tasks={allTasks} exams={allExams} />
          </TabErrorBoundary>

          {/* 3-column bento grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr] gap-4 items-start">

            {/* Column 1 — hero + check-in + life balance; appears first everywhere */}
            <div className="order-1 lg:order-1" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* ── Act now: focal point ── */}
              <TabErrorBoundary label="Just Start">
                <JustStartButton tasks={allTasks} />
              </TabErrorBoundary>

              <OSCommandHero
                timetable={initialData.timetable}
                tasks={allTasks}
                exams={allExams}
                hour={currentHour}
                firstName={firstName}
                profile={p}
                subscription={sub}
                checkinMessage={novaCheckin}
              />

              <PriorityCommandStrip
                tasks={allTasks}
                exams={allExams}
                totalBudget={totalBudget}
                remaining={remaining}
              />

              {/* Quick-access bento tiles (mobile) — surfaced near the top for fast nav */}
              <div className="md:hidden">
                <FeatureGrid tasks={allTasks} expenses={recentExp} totalBudget={totalBudget} remaining={remaining} modules={allMods} subscription={sub as Subscription | null} profile={p} mealPlanExists={mealPlanExists} shiftsThisWeek={shiftsThisWeek} activeGroups={activeGroups} streakDays={streakDays} />
              </div>

              {/* ── Check-in: how you're doing ── */}
              <SectionHeader label="Check-in" />

              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '12px 16px' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>How are you feeling?</div>
                <MoodCheckin userId={p.id} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                <TabErrorBoundary><BurnoutRadar userId={p.id} /></TabErrorBoundary>
                <TabErrorBoundary>
                  <MoneyHealthScore
                    budget={b}
                    monthlyExpenses={monthSpent}
                    nsfasStatus={incomeStatus}
                    savingsRate={savingsRate}
                  />
                </TabErrorBoundary>
              </div>

              {/* Prescription medication reminders — surfaces overdue/tomorrow refills */}
              <PrescriptionReminderCard />

              {/* ── Plan & track ── */}
              <SectionHeader label="Plan & track" />

              <TaskCalendarStrip tasks={allTasks} />
              <SundayPlanning />
              <WeatherWidget />
              <StatCardsRow remaining={remaining} totalBudget={totalBudget} tasks={allTasks} exams={allExams} streakDays={streakDays} streakTodayDone={streakTodayDone} todayStudyMins={todayStudyMins} lastSleepHours={lastSleepHours} weekWorkouts={weekWorkouts} />

              {/* ── Focus tools: power-user cluster, collapsed by default ── */}
              <CollapsibleSection label="Focus tools" hint="6 anti-procrastination tools">
                <TabErrorBoundary label="Commitment Contracts">
                  <CommitmentContracts />
                </TabErrorBoundary>
                <TabErrorBoundary label="Implementation Intentions">
                  <ImplementationIntentions tasks={allTasks} />
                </TabErrorBoundary>
                <TabErrorBoundary label="Reward Unlock">
                  <RewardUnlock />
                </TabErrorBoundary>
                <TabErrorBoundary label="Procrastination Journal">
                  <ProcrastinationJournal />
                </TabErrorBoundary>
                <TabErrorBoundary label="Procrastination Profiler">
                  <ProcrastinationProfiler />
                </TabErrorBoundary>
                <TabErrorBoundary label="Accountability Partner">
                  <AccountabilityPartner tasks={allTasks} />
                </TabErrorBoundary>
              </CollapsibleSection>

              {/* ── Life balance ── */}
              <SectionHeader label="Life balance" />

              <Deferred minHeight={160} dataSaver={dataSaver} label="life balance">
              <TabErrorBoundary label="Domain Pulse">
                <DomainPulse
                  overdueTasks={domainOverdue}
                  nextExamDays={domainExamDays}
                  streakDays={streakDays}
                  streakTodayDone={streakTodayDone}
                  todayStudyMins={todayStudyMins}
                  studyVelocity={store.studyVelocity7d}
                  lastSleepHours={lastSleepHours}
                  sleepDebt={store.sleepDebt}
                  weekWorkouts={weekWorkouts}
                  totalBudget={totalBudget}
                  remaining={remaining}
                  shiftEarnings={shiftEarnings}
                  nsfasDelayed={store.nsfasDelayed}
                  mealPlanExists={mealPlanExists}
                  shiftsThisWeek={shiftsThisWeek}
                  activeGroups={activeGroups}
                  hour={currentHour}
                />
              </TabErrorBoundary>
              </Deferred>
            </div>

            {/* Column 2 — insights + study cards; order-3 on mobile (below gamification) */}
            <div className="order-3 lg:order-2" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Deadline Telescope — shows when exam < 21 days */}
              <TabErrorBoundary label="Deadline Telescope">
                <DeadlineTelescope exams={allExams} />
              </TabErrorBoundary>

              {/* Below-fold col-2 cluster — deferred until scrolled near */}
              <Deferred gap={14} dataSaver={dataSaver} label="insights & study cards">
              {/* Body Double Mode — Supabase Realtime study presence */}
              <TabErrorBoundary label="Body Double Mode">
                <BodyDoubleMode />
              </TabErrorBoundary>

              {allExams.length > 0 && <ExamCountdownCard exams={allExams} />}
              <StudyTipsCard exam={allExams[0] ?? null} profile={p} />

              {/* ── Insights: analytics & reflection (rebalanced from main column) ── */}
              <SectionHeader label="Insights" />
              <TabErrorBoundary label="Daily Brief">
                <DailyBrief />
              </TabErrorBoundary>
              <TabErrorBoundary label="Weekly Report">
                <WeeklyReport />
              </TabErrorBoundary>
              <TabErrorBoundary label="Insights">
                <InsightsCard />
              </TabErrorBoundary>
              <TabErrorBoundary label="Cohort">
                <CohortCard />
              </TabErrorBoundary>
              </Deferred>
            </div>

            {/* Column 3 — gamification momentum; order-2 on mobile so it appears before insights */}
            <div className="order-2 lg:order-3" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* ── Momentum: gamification (rebalanced from main column) ── */}
              <SectionHeader label="Momentum" />
              <PendingXP />
              <DomainFlames />
              <LevelCard />
              <StreakWidget />
              <DailyChallenges />
              <ChapterBanner />
              <ArchetypeCard />
              <PodActivityFeed />

              {/* Below-fold col-3 cluster — deferred until scrolled near */}
              <Deferred gap={14} dataSaver={dataSaver} label="momentum & money cards">
              {/* Focus Momentum Score — daily 0-100 score with 7-day sparkline */}
              <TabErrorBoundary label="Focus Momentum Score">
                <FocusMomentumScore />
              </TabErrorBoundary>

              {/* Community Challenges — leaderboard, battles, weekly bounty */}
              <TabErrorBoundary label="Community Challenges">
                <CommunityChallengesHub />
              </TabErrorBoundary>

              <BudgetRingCard monthSpent={monthSpent} totalBudget={totalBudget} expenses={recentExp} />
              {monthSpent > 0 && (
                <TabErrorBoundary>
                  <FinancialStressLink
                    stressLevel={
                      monthSpent / (b?.monthly_budget || 1) < 0.5 ? 'low'
                      : monthSpent / (b?.monthly_budget || 1) < 0.85 ? 'medium'
                      : 'high'
                    }
                  />
                </TabErrorBoundary>
              )}
              {(p.funding_type === 'nsfas' || p.funding_type === 'other' || !p.funding_type) && (
                <TabErrorBoundary><SassaSrdGuide /></TabErrorBoundary>
              )}
              <LoadSheddingWidget />
              <CoachSummaryCard userId={p.id} totalBudget={totalBudget} amountSpent={monthSpent} expenses={recentExp} />
              </Deferred>
            </div>

          </div>

          {!isPremium && <UpgradeBar />}
        </div>
      </div>

      {/* Orchestration — crisis modal (urgency 5, modal variant) */}
      <TabErrorBoundary label="Intervention Modal">
        <InterventionModal />
      </TabErrorBoundary>
    </>
  )
}
