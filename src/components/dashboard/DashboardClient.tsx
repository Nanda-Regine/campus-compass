'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAppStore } from '@/store'
import { signals } from '@/store/signals'
import PullToRefresh from '@/components/ui/PullToRefresh'
import MoodCheckin from '@/components/dashboard/MoodCheckin'
import {
  type Profile, type Budget, type Task, type Exam,
  type Module, type TimetableEntry, type Expense,
  type Subscription,
} from '@/types'
import { fmt, getDaysUntil, calcTotalBudget, cn } from '@/lib/utils'
import { NAV_MODULES } from '@/lib/navModules'
import { useCachedFetch } from '@/hooks/useCachedFetch'
import { ShareButton } from '@/components/ui/ShareButton'
import DayModeBanner, { getDayMode, type DayMode } from '@/components/dashboard/DayModeBanner'
import LoadSheddingWidget from '@/components/dashboard/LoadSheddingWidget'
import { getDataSaverEnabled } from '@/lib/dataSaver'
import LevelCard from '@/components/gamification/LevelCard'
import DailyChallenges from '@/components/gamification/DailyChallenges'
import StreakWidget from '@/components/gamification/StreakWidget'
import { AmbientImage } from '@/components/ui/AmbientImage'
import InterventionBanner from '@/components/orchestration/InterventionBanner'
import InterventionModal from '@/components/orchestration/InterventionModal'
import DailyBrief from '@/components/orchestration/DailyBrief'
import SundayPlanning from '@/components/orchestration/SundayPlanning'
import WeatherWidget from '@/components/dashboard/WeatherWidget'
import NotificationPrompt from '@/components/dashboard/NotificationPrompt'
import WelcomeBanner from '@/components/dashboard/WelcomeBanner'
import TaskCalendarStrip from '@/components/dashboard/TaskCalendarStrip'
import { useAutoTodoSpawner } from '@/lib/todoSpawner'
import InsightsCard from '@/components/dashboard/InsightsCard'
import DomainPulse from '@/components/dashboard/DomainPulse'
import CohortCard from '@/components/dashboard/CohortCard'
import TabErrorBoundary from '@/components/ui/TabErrorBoundary'
import BurnoutRadar from '@/components/regulate/BurnoutRadar'
import MoneyHealthScore from '@/components/budget/MoneyHealthScore'
import FinancialStressLink from '@/components/finance/FinancialStressLink'
import SassaSrdGuide from '@/components/finance/SassaSrdGuide'
import FitnessNudge from '@/components/fitness/FitnessNudge'
import ProcrastinationAlarm from '@/components/dashboard/ProcrastinationAlarm'
import JustStartButton from '@/components/study/JustStartButton'
import DeadlineTelescope from '@/components/study/DeadlineTelescope'
import CommitmentContracts from '@/components/study/CommitmentContracts'
import ImplementationIntentions from '@/components/study/ImplementationIntentions'
import BodyDoubleMode from '@/components/study/BodyDoubleMode'
import ProcrastinationJournal from '@/components/study/ProcrastinationJournal'
import RewardUnlock from '@/components/gamification/RewardUnlock'
import FocusMomentumScore from '@/components/dashboard/FocusMomentumScore'
import ProcrastinationProfiler from '@/components/study/ProcrastinationProfiler'
import AccountabilityPartner from '@/components/study/AccountabilityPartner'
import AntiSpiralRecovery from '@/components/study/AntiSpiralRecovery'
import CommunityChallengesHub from '@/components/community/CommunityChallengesHub'

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
  }
}

/* ── DayMode-driven design tokens ─────────────────────────── */
const DASH_THEME: Record<DayMode, {
  heroBg: string; accent: string; accentDim: string; accentGlow: string
  orb1: string; orb2: string; border: string
}> = {
  wake: {
    // Dawn — warm Kente gold breaking through deep cosmos
    heroBg: 'linear-gradient(145deg,#1A0E00 0%,#2E1A00 45%,#180C04 75%,#05040C 100%)',
    accent: '#D4A84B', accentDim: 'rgba(212,168,75,0.12)', accentGlow: 'rgba(212,168,75,0.30)',
    orb1: 'rgba(212,168,75,0.18)', orb2: 'rgba(232,191,106,0.10)',
    border: 'rgba(212,168,75,0.26)',
  },
  commute: {
    // Morning transit — sapphire sky before the city wakes
    heroBg: 'linear-gradient(145deg,#020E22 0%,#041830 45%,#020810 75%,#05040C 100%)',
    accent: '#5B9CF5', accentDim: 'rgba(91,156,245,0.12)', accentGlow: 'rgba(91,156,245,0.30)',
    orb1: 'rgba(91,156,245,0.18)', orb2: 'rgba(147,197,253,0.10)',
    border: 'rgba(91,156,245,0.26)',
  },
  class: {
    // Lecture hours — deep jade focus, ancestral knowledge
    heroBg: 'linear-gradient(145deg,#001A10 0%,#002818 45%,#000E08 75%,#05040C 100%)',
    accent: '#00CFA0', accentDim: 'rgba(0,207,160,0.12)', accentGlow: 'rgba(0,207,160,0.30)',
    orb1: 'rgba(0,207,160,0.18)', orb2: 'rgba(26,218,168,0.10)',
    border: 'rgba(0,207,160,0.26)',
  },
  study: {
    // Deep study — full amethyst cosmos, full power
    heroBg: 'linear-gradient(145deg,#0C0820 0%,#1A0C38 45%,#0A0618 75%,#05040C 100%)',
    accent: '#A855F7', accentDim: 'rgba(168,85,247,0.13)', accentGlow: 'rgba(168,85,247,0.32)',
    orb1: 'rgba(168,85,247,0.20)', orb2: 'rgba(139,92,246,0.12)',
    border: 'rgba(168,85,247,0.26)',
  },
  'wind-down': {
    // Copper sunset — warm and slow, day releasing
    heroBg: 'linear-gradient(145deg,#1A0800 0%,#2C1200 45%,#120600 75%,#05040C 100%)',
    accent: '#E87040', accentDim: 'rgba(232,112,64,0.12)', accentGlow: 'rgba(232,112,64,0.30)',
    orb1: 'rgba(232,112,64,0.18)', orb2: 'rgba(240,144,96,0.10)',
    border: 'rgba(232,112,64,0.26)',
  },
  sleep: {
    // Deep night — near-black cosmic stillness, stars barely visible
    heroBg: 'linear-gradient(145deg,#05040C 0%,#080617 45%,#040310 75%,#05040C 100%)',
    accent: '#6A7FA8', accentDim: 'rgba(106,127,168,0.10)', accentGlow: 'rgba(106,127,168,0.22)',
    orb1: 'rgba(106,127,168,0.12)', orb2: 'rgba(148,111,255,0.06)',
    border: 'rgba(106,127,168,0.18)',
  },
}

const MODE_LABEL: Record<DayMode, { label: string; emoji: string }> = {
  wake:        { label: 'Wake',       emoji: '🌅' },
  commute:     { label: 'Commute',    emoji: '🚌' },
  class:       { label: 'Class',      emoji: '🎓' },
  study:       { label: 'Study',      emoji: '📚' },
  'wind-down': { label: 'Wind Down',  emoji: '🌙' },
  sleep:       { label: 'Night',      emoji: '🌃' },
}

/* ── helpers ─────────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getWeekBadge() {
  const now = new Date()
  const day = now.getDay()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const f = (d: Date) => d.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
  return `${f(weekStart)} – ${f(weekEnd)}`
}

function FlameIcon({ streak }: { streak: number }) {
  if (streak === 0) return <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
  return <span>🔥</span>
}

function toISODate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getTodaySlots(timetable: TimetableEntry[]) {
  const now   = new Date()
  const jsDay = now.getDay()
  const dbDay = jsDay === 0 ? 7 : jsDay
  return {
    slots: timetable
      .filter(s => (s.day_of_week as number) === dbDay)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')),
    currentTime: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
  }
}


/* ── StudyTipsCard ──────────────────────────────────────── */
interface StudyTip { text: string; source: string }

function StudyTipsCard({ exam, profile }: { exam: Exam | null; profile: Profile }) {
  const today    = new Date().toISOString().split('T')[0]
  const cacheKey = exam ? `study_tips_${exam.id}_${today}` : null
  const { data: tips, loading } = useCachedFetch<StudyTip[]>(cacheKey, async () => {
    const subject    = (exam?.module as Module | undefined)?.module_name ?? 'General'
    const daysUntil  = Math.max(0, getDaysUntil(exam!.exam_date))
    const r = await fetch('/api/dashboard/study-tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examName: exam?.exam_name ?? (exam as unknown as { name?: string })?.name ?? 'Upcoming exam',
        examSubject: subject, daysUntil,
        degreeProgram: (profile as unknown as { university?: string }).university ?? 'University',
      }),
    })
    const d = r.ok ? await r.json() : null
    return d?.tips ?? null
  })

  if (!exam) return null

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' }}>
      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#9b6fd4 0%,rgba(155,111,212,0.15) 100%)' }} />
      <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9b6fd4', marginBottom: 8, fontWeight: 600 }}>Nova Study Tips</div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 10 }}>
        {(exam.module as Module | undefined)?.module_name ?? ''} · {Math.max(0, getDaysUntil(exam.exam_date))}d to go
      </div>
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[60, 80, 70].map((w, i) => <div key={i} className="skeleton-row" style={{ height: 14, width: `${w}%` }} />)}
        </div>
      )}
      {!loading && tips && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tips.map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 10px', background: 'rgba(155,111,212,0.06)', borderRadius: 8, border: '0.5px solid rgba(155,111,212,0.15)' }}>
              <span style={{ fontSize: 12, flexShrink: 0, color: '#9b6fd4', fontWeight: 700, lineHeight: 1.5 }}>{i + 1}</span>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip.text}</div>
                <div style={{ fontSize: 10, color: 'rgba(155,111,212,0.65)', marginTop: 2 }}>{tip.source}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !tips && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>Tips unavailable</div>
      )}
    </div>
  )
}

/* ── CoachSummaryCard ──────────────────────────────────── */
interface CoachInsight { tag: string; text: string }

function CoachSummaryCard({ userId, totalBudget, amountSpent, expenses }: {
  userId: string; totalBudget: number; amountSpent: number; expenses: Expense[]
}) {
  const now      = new Date()
  const month    = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const week     = Math.ceil(now.getDate() / 7)
  const cacheKey = totalBudget > 0 ? `coach_summary_${userId}_${month}_w${week}` : null
  const { data: insights, loading } = useCachedFetch<CoachInsight[]>(cacheKey, async () => {
    const catMap: Record<string, number> = {}
    expenses.forEach(e => { catMap[e.category] = (catMap[e.category] ?? 0) + e.amount })
    const topCategories  = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c).join(', ') || 'General'
    const percentUsed    = Math.round((amountSpent / totalBudget) * 100)
    const daysRemaining  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()
    const r = await fetch('/api/dashboard/coach-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalBudget, amountSpent, percentUsed, topCategories, daysRemaining, savingsGoals: 'None' }),
    })
    const d = r.ok ? await r.json() : null
    return d?.insights ?? null
  })

  if (totalBudget <= 0) return null

  const tagColors: Record<string, string> = {
    'Watch out': '#ff6b6b', 'Money tip': '#c9a84c',
    'Goal progress': '#4ecf9e', 'Well done': '#4ecf9e',
  }

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' }}>
      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#c9a84c 0%,rgba(201,168,76,0.15) 100%)' }} />
      <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 10, fontWeight: 600 }}>Budget Coach</div>
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[70, 85, 65].map((w, i) => <div key={i} className="skeleton-row" style={{ height: 14, width: `${w}%` }} />)}
        </div>
      )}
      {!loading && insights && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {insights.map((ins, i) => {
            const color = tagColors[ins.tag] ?? '#c9a84c'
            return (
              <div key={i} style={{ padding: '8px 10px', background: `${color}12`, borderRadius: 8, border: `0.5px solid ${color}28` }}>
                <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color, fontWeight: 700, marginBottom: 3 }}>{ins.tag}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ins.text}</div>
              </div>
            )
          })}
        </div>
      )}
      {!loading && !insights && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>Set a budget to get insights</div>
      )}
    </div>
  )
}

/* ── OSCommandHero ─────────────────────────────────────── */
function OSCommandHero({ timetable, tasks, exams, hour, firstName, profile, subscription, checkinMessage }: {
  timetable: TimetableEntry[]
  tasks: Task[]
  exams: Exam[]
  hour: number
  firstName: string
  profile: Profile
  subscription: Subscription | null
  checkinMessage: string | null
}) {
  const mode   = getDayMode(hour)
  const theme  = DASH_THEME[mode]
  const meta   = MODE_LABEL[mode]
  const isUnlimited = profile.subscription_tier === 'nova_unlimited'
  const novaLeft    = Math.max(0, (profile.nova_messages_limit ?? 10) - (profile.nova_messages_used ?? 0))
  void subscription

  return (
    <div
      className="dash-card-in"
      style={{ borderRadius: 20, border: `1px solid ${theme.border}`, overflow: 'hidden', position: 'relative' }}
    >
      {/* Background gradient */}
      <div style={{ position: 'absolute', inset: 0, background: theme.heroBg, zIndex: 0 }} />

      {/* Ambient texture — real image layer, lighter overlay since full-page bg handles depth */}
      <AmbientImage zone="dashboard" opacity={0.35} blurPx={3} saturation={1.6}
        overlayColor="rgba(5,4,12,0.0)" />

      {/* Internal floating orbs */}
      <div
        className="orb-float"
        style={{
          position: 'absolute', top: -60, right: -50, width: 240, height: 240, borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.orb1} 0%, transparent 70%)`,
          filter: 'blur(35px)', pointerEvents: 'none', zIndex: 0,
        }}
      />
      <div
        className="orb-float-r"
        style={{
          position: 'absolute', bottom: -30, left: -30, width: 160, height: 160, borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.orb2} 0%, transparent 70%)`,
          filter: 'blur(24px)', pointerEvents: 'none', zIndex: 0,
        }}
      />

      {/* Top accent line */}
      <div
        className="hero-line-glow"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, ${theme.accent} 0%, ${theme.accent}55 60%, transparent 100%)`,
          zIndex: 1,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, padding: '20px 22px 22px' }}>

        {/* Mode badge row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 12px 5px 9px', borderRadius: 9999,
            background: theme.accentDim, border: `0.5px solid ${theme.accent}45`,
          }}>
            <span style={{ fontSize: 13 }}>{meta.emoji}</span>
            <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.accent }}>
              {meta.label}
            </span>
            <span className="status-live" style={{ width: 5, height: 5, borderRadius: '50%', background: theme.accent, display: 'inline-block', marginLeft: 2 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: 'rgba(255,255,255,0.3)' }}>
              {isUnlimited ? '∞ msgs' : `${novaLeft} left`}
            </span>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `linear-gradient(135deg,${theme.accent} 0%,${theme.accent}99 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, boxShadow: `0 0 16px ${theme.accentGlow}`,
            }}>
              ✦
            </div>
          </div>
        </div>

        {/* Day context strip */}
        <DayModeBanner timetable={timetable} tasks={tasks} exams={exams} hour={hour} firstName={firstName} />
        {mode === 'sleep' && (
          <div style={{ padding: '10px 14px', background: theme.accentDim, border: `0.5px solid ${theme.accent}30`, borderRadius: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Night mode · all systems resting 🌃</span>
          </div>
        )}

        {/* Nova check-in */}
        {checkinMessage && (
          <div style={{
            marginTop: 14, padding: '12px 14px',
            background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.07)',
            borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: 13, color: theme.accent, flexShrink: 0, marginTop: 1 }}>✦</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.accent, marginBottom: 3, fontWeight: 600 }}>
                Nova · Daily check-in
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.62)', lineHeight: 1.6 }}>{checkinMessage}</div>
            </div>
            <ShareButton
              variant="icon"
              context="nova_checkin"
              title="Nova Daily Check-in"
              text={`Nova's message for me today 💜\n"${checkinMessage}"\n\nMy AI study companion on VarsityOS`}
            />
          </div>
        )}

        {/* Action row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <Link href="/nova" style={{ flex: 1, textDecoration: 'none' }}>
            <button style={{
              width: '100%',
              background: `linear-gradient(135deg,${theme.accent} 0%,${theme.accent}cc 100%)`,
              color: '#fff',
              fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13,
              border: 'none', borderRadius: 10, padding: '11px 0',
              cursor: 'pointer',
              boxShadow: `0 4px 22px ${theme.accentGlow}`,
            }}>
              Chat with Nova →
            </button>
          </Link>
          <Link href="/study" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.13)',
              color: 'rgba(255,255,255,0.72)', fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 13,
              borderRadius: 10, padding: '11px 18px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              Study →
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ── PriorityCommandStrip ────────────────────────────────── */
function PriorityCommandStrip({ tasks, exams, totalBudget, remaining }: {
  tasks: Task[]; exams: Exam[]; totalBudget: number; remaining: number
}) {
  const _now = new Date()
  const todayStr = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`

  const overdueList = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < todayStr)
  const dueTodayList = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date === todayStr)
  const nextExam    = exams[0]
  const daysToExam  = nextExam ? getDaysUntil(nextExam.exam_date) : null
  const budgetPct   = totalBudget > 0 ? Math.round((remaining / totalBudget) * 100) : 100

  const items: Array<{ label: string; value: string; color: string; href: string; urgent: boolean }> = []

  if (overdueList.length > 0) {
    const first = overdueList[0].title
    items.push({
      label: `${overdueList.length} overdue`,
      value: first.length > 22 ? first.slice(0, 22) + '…' : first,
      color: '#ff6b6b', href: '/study', urgent: true,
    })
  } else if (dueTodayList.length > 0) {
    items.push({
      label: 'Due today',
      value: `${dueTodayList.length} task${dueTodayList.length > 1 ? 's' : ''}`,
      color: '#c9a84c', href: '/study', urgent: false,
    })
  }

  if (daysToExam !== null && daysToExam >= 0 && daysToExam <= 14) {
    const modName = (nextExam!.module as Module | undefined)?.module_name ?? nextExam!.exam_name ?? 'Exam'
    items.push({
      label: daysToExam === 0 ? 'Exam TODAY' : `${daysToExam}d to exam`,
      value: modName.length > 22 ? modName.slice(0, 22) + '…' : modName,
      color: daysToExam <= 2 ? '#ff6b6b' : daysToExam <= 5 ? '#c9a84c' : '#7090d0',
      href: '/study', urgent: daysToExam <= 2,
    })
  }

  if (totalBudget > 0 && budgetPct < 20) {
    items.push({
      label: `${budgetPct}% budget left`,
      value: `R${Math.round(remaining)} remaining`,
      color: budgetPct < 10 ? '#ff6b6b' : '#c9a84c',
      href: '/budget', urgent: budgetPct < 10,
    })
  }

  if (items.length === 0) return null

  return (
    <section>
      <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', fontWeight: 600, marginBottom: 8 }}>
        ◈ Priority right now
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }} className="scrollbar-none">
        {items.map((item, i) => (
          <Link key={i} href={item.href} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div
              className="priority-slide"
              style={{
                padding: '11px 14px', minWidth: 148,
                background: `${item.color}10`,
                border: `1px solid ${item.color}38`,
                borderRadius: 12, position: 'relative', overflow: 'hidden',
                animationDelay: `${i * 0.08}s`,
              }}
            >
              <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: item.color, borderRadius: '2px 0 0 2px' }} />
              {item.urgent && (
                <span className="dot-urgent" style={{ position: 'absolute', top: 8, right: 8, width: 5, height: 5, borderRadius: '50%', background: item.color }} />
              )}
              <div style={{ fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: item.color, fontWeight: 700, marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.value}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ── StatCardsRow ─────────────────────────────────────── */
function StatCardsRow({ remaining, totalBudget, tasks, exams, streakDays, streakTodayDone, todayStudyMins, lastSleepHours, weekWorkouts }: {
  remaining: number; totalBudget: number; tasks: Task[]; exams: Exam[]; streakDays: number; streakTodayDone: boolean
  todayStudyMins: number; lastSleepHours: number | null; weekWorkouts: number
}) {
  const _now = new Date()
  const todayStr = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`
  const _w = new Date(_now); _w.setDate(_now.getDate() + 7)
  const weekAheadStr = `${_w.getFullYear()}-${String(_w.getMonth()+1).padStart(2,'0')}-${String(_w.getDate()).padStart(2,'0')}`
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < todayStr).length
  const tasksDueWeek = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date >= todayStr && t.due_date <= weekAheadStr).length
  const nextExam = exams[0]
  const daysToExam = nextExam ? getDaysUntil(nextExam.exam_date) : null

  const studyDisplay = todayStudyMins >= 60 ? `${Math.floor(todayStudyMins/60)}h${todayStudyMins%60>0?`${todayStudyMins%60}m`:''}` : todayStudyMins > 0 ? `${todayStudyMins}m` : '—'
  const sleepDisplay = lastSleepHours !== null ? `${lastSleepHours}h` : '—'
  void totalBudget
  const cards = [
    { value: remaining >= 0 ? `R${Math.round(remaining)}` : `−R${Math.round(Math.abs(remaining))}`, label: 'Budget left',    accent: remaining >= 0 ? '#c9a84c' : '#ff6b6b' },
    { value: daysToExam !== null ? (daysToExam <= 0 ? 'TODAY' : String(daysToExam)) : '—',           label: 'Days to exam',  accent: daysToExam !== null && daysToExam <= 3 ? '#ff6b6b' : '#7090d0' },
    { value: String(tasksDueWeek + overdueTasks),                                                      label: overdueTasks > 0 ? `${overdueTasks} overdue` : 'Tasks ahead', accent: overdueTasks > 0 ? '#ff6b6b' : '#4ecf9e' },
    { value: String(streakDays), label: streakTodayDone ? 'Streak safe ✓' : 'Study streak',           accent: streakTodayDone ? '#4ecf9e' : streakDays > 0 ? '#f59e0b' : '#4ecf9e', suffix: <FlameIcon streak={streakDays} /> },
    { value: studyDisplay, label: 'Studied today', accent: '#A855F7' },
    { value: sleepDisplay, label: 'Last sleep',    accent: '#38BDF8' },
    { value: String(weekWorkouts), label: 'Workouts wk', accent: '#FF6B9E' },
  ]

  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }} className="scrollbar-none">
      {cards.map(({ value, label, accent, suffix }, i) => (
        <div
          key={label}
          className="dash-card-in"
          style={{
            flexShrink: 0, minWidth: 112, flex: '1 0 112px',
            background: `${accent}0d`,
            border: `1px solid ${accent}38`,
            borderRadius: 14, padding: '15px 14px 12px',
            position: 'relative', overflow: 'hidden',
            animationDelay: `${i * 0.06}s`,
          }}
        >
          <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${accent} 0%,${accent}40 100%)`, borderRadius: '14px 14px 0 0' }} />
          <div style={{
            fontFamily: 'JetBrains Mono,monospace', fontSize: 24, fontWeight: 700, color: accent, lineHeight: 1,
            textShadow: `0 0 24px ${accent}55`,
          }}>
            {value}{suffix && <span style={{ marginLeft: 4 }}>{suffix}</span>}
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 7 }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

/* ── TodaysClasses ─────────────────────────────────────── */
function TodaysClasses({ timetable }: { timetable: TimetableEntry[] }) {
  const { slots: todaySlots, currentTime } = getTodaySlots(timetable)
  if (!todaySlots.length) return null
  const displaySlots = todaySlots.slice(0, 3)

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ecf9e', display: 'inline-block' }} />
          <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4ecf9e', fontWeight: 600 }}>Today&apos;s Classes</span>
        </div>
        <Link href="/study?tab=timetable" style={{ fontSize: 12, color: '#4ecf9e', textDecoration: 'none' }}>See all →</Link>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {displaySlots.map(slot => {
          const isNow = slot.start_time && slot.end_time ? currentTime >= slot.start_time && currentTime <= slot.end_time : false
          const colour = (slot.module as Module | undefined)?.color ?? (slot.module as Module | undefined)?.colour ?? '#4ecf9e'
          const moduleName = (slot.module as Module | undefined)?.module_name || 'Class'
          return (
            <div key={slot.id} style={{ flexShrink: 0, minWidth: 140, padding: '10px 12px', background: 'var(--bg-surface)', border: `1px solid ${isNow ? colour + '60' : 'var(--border-subtle)'}`, borderLeft: `2px solid ${colour}`, borderRadius: '0 10px 10px 0', position: 'relative' }}>
              {isNow && <span style={{ position: 'absolute', top: 6, right: 8, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: colour, textTransform: 'uppercase' }}>NOW</span>}
              <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: isNow ? 32 : 0 }}>{moduleName}</div>
              {(slot.start_time || slot.venue) && (
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {slot.start_time && `${slot.start_time}${slot.end_time ? ` – ${slot.end_time}` : ''}`}{slot.venue && ` · ${slot.venue}`}
                </div>
              )}
            </div>
          )
        })}
        {todaySlots.length > 3 && (
          <Link href="/study?tab=timetable" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: '#4ecf9e', padding: '10px 12px', whiteSpace: 'nowrap' }}>+{todaySlots.length - 3} more →</div>
          </Link>
        )}
      </div>
    </section>
  )
}

/* ── UrgentTasksStrip ─────────────────────────────────── */
function UrgentTasksStrip({ tasks }: { tasks: Task[] }) {
  const todayDate = new Date(); todayDate.setHours(0,0,0,0)
  const urgent = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date!) <= todayDate).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()).slice(0, 3)
  if (!urgent.length) return null

  return (
    <section style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="dot-urgent" style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff6b6b', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ff6b6b', fontWeight: 600 }}>Urgent</span>
        </div>
        <Link href="/study" style={{ fontSize: 12, color: '#4ecf9e', textDecoration: 'none' }}>See all →</Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {urgent.map(task => {
          const due = new Date(task.due_date!); due.setHours(0,0,0,0)
          const isToday = due.getTime() === todayDate.getTime()
          const diffDays = Math.round((todayDate.getTime() - due.getTime()) / 86400000)
          return (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.05)', borderLeft: `2px solid ${isToday ? '#c9a84c' : '#ff6b6b'}`, borderRadius: '0 8px 8px 0' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                {task.module && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.module.module_name}</div>}
              </div>
              <span style={{ flexShrink: 0, fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: isToday ? 'rgba(201,168,76,0.1)' : 'rgba(255,107,107,0.1)', color: isToday ? '#c9a84c' : '#ff6b6b', border: `0.5px solid ${isToday ? 'rgba(201,168,76,0.25)' : 'rgba(255,107,107,0.25)'}` }}>
                {isToday ? 'Due today' : `${diffDays}d late`}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ── FeatureGrid ─────────────────────────────────────── */
// Bento layout: Nova (wide hero) → 2×2 core cards → Groups (wide bar)
// Nav destinations come from NAV_MODULES (shared with ModulePillList).

// Per-card shape tokens — intentionally varied for organic feel
const CARD_STYLE: Record<string, { radius: number; minH: number; bg: string }> = {
  Nova:   { radius: 22, minH: 110, bg: 'linear-gradient(135deg,rgba(155,111,212,0.12) 0%,rgba(168,85,247,0.04) 100%)' },
  Study:  { radius: 18, minH: 124, bg: 'linear-gradient(160deg,rgba(78,207,158,0.08) 0%,rgba(26,158,117,0.02) 100%)' },
  Budget: { radius: 14, minH: 104, bg: 'linear-gradient(135deg,rgba(201,168,76,0.08) 0%,transparent 100%)' },
  Meals:  { radius: 20, minH: 104, bg: 'linear-gradient(135deg,rgba(232,131,74,0.08) 0%,transparent 100%)' },
  Work:   { radius: 16, minH: 100, bg: 'linear-gradient(135deg,rgba(112,144,208,0.08) 0%,transparent 100%)' },
  Groups:   { radius: 14, minH: 52,  bg: 'linear-gradient(90deg,rgba(78,207,158,0.06) 0%,transparent 100%)' },
  Regulate: { radius: 16, minH: 100, bg: 'linear-gradient(135deg,rgba(167,139,250,0.08) 0%,transparent 100%)' },
}

function FeatureGrid({ tasks, expenses, totalBudget, remaining, modules, subscription, profile, mealPlanExists, shiftsThisWeek, activeGroups, streakDays }: {
  tasks: Task[]; expenses: Expense[]; totalBudget: number; remaining: number
  modules: Module[]; subscription: Subscription | null; profile: Profile
  mealPlanExists: boolean; shiftsThisWeek: number; activeGroups: number; streakDays: number
}) {
  void cn(modules.length, subscription)
  const isUnlimited = profile.subscription_tier === 'nova_unlimited'
  const novaLeft = Math.max(0, (profile.nova_messages_limit ?? 10) - (profile.nova_messages_used ?? 0))
  const todayStr = toISODate()
  const _wa = new Date(); _wa.setDate(_wa.getDate() + 7)
  const weekAheadStr = toISODate(_wa)
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < todayStr).length
  const tasksDueWeek = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date >= todayStr && t.due_date <= weekAheadStr).length
  const budgetPct   = totalBudget > 0 ? Math.min(100, (remaining / totalBudget) * 100) : 100
  const budgetColor = budgetPct < 10 ? '#ff6b6b' : budgetPct < 30 ? '#c9a84c' : '#4ecf9e'
  const novaPct     = isUnlimited ? 100 : Math.min(100, (novaLeft / (profile.nova_messages_limit ?? 10)) * 100)

  const subtitles: Record<string, { text: string; color?: string; pct: number; barColor: string }> = {
    Study:  overdueTasks > 0 ? { text: `${overdueTasks} overdue`, color: '#ff6b6b', pct: 30, barColor: '#ff6b6b' } : tasksDueWeek > 0 ? { text: `${tasksDueWeek} due this week`, color: '#4ecf9e', pct: 70, barColor: '#4ecf9e' } : streakDays > 0 ? { text: `${streakDays}d streak 🔥`, color: '#4ecf9e', pct: Math.min(100, (streakDays / 30) * 100), barColor: '#4ecf9e' } : { text: 'All clear ✓', color: '#4ecf9e', pct: 100, barColor: '#4ecf9e' },
    Budget: totalBudget > 0 ? { text: remaining >= 0 ? `R${Math.round(remaining)} left` : 'Over budget', color: budgetColor, pct: Math.max(0, budgetPct), barColor: budgetColor } : { text: 'Set budget →', color: '#c9a84c', pct: 0, barColor: '#c9a84c' },
    Meals:  mealPlanExists ? { text: 'Week planned ✓', color: '#4ecf9e', pct: 90, barColor: '#4ecf9e' } : { text: 'Plan your week →', color: '#e8834a', pct: 10, barColor: '#e8834a' },
    Work:   shiftsThisWeek > 0 ? { text: `${shiftsThisWeek} shift${shiftsThisWeek > 1 ? 's' : ''} ahead`, color: '#7090d0', pct: 80, barColor: '#7090d0' } : { text: 'No shifts soon', color: 'rgba(255,255,255,0.3)', pct: 0, barColor: '#7090d0' },
    Nova:   isUnlimited ? { text: 'Unlimited', color: '#9b6fd4', pct: 100, barColor: '#9b6fd4' } : { text: `${novaLeft} msgs left`, color: novaLeft < 5 ? '#ff6b6b' : '#9b6fd4', pct: novaPct, barColor: novaLeft < 5 ? '#ff6b6b' : '#9b6fd4' },
    Groups:   activeGroups > 0 ? { text: `${activeGroups} group${activeGroups > 1 ? 's' : ''}`, color: '#4ecf9e', pct: 70, barColor: '#4ecf9e' } : { text: 'Join a group →', color: 'rgba(255,255,255,0.3)', pct: 0, barColor: '#4ecf9e' },
    Regulate: { text: 'Breathe & reset', color: '#a78bfa', pct: 100, barColor: '#a78bfa' },
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
      {NAV_MODULES.map(({ href, label, icon, color: accent, iconBg, wideInGrid: wide }) => {
        const subtitle = subtitles[label]
        const cs = CARD_STYLE[label]
        const isNova = label === 'Nova'
        const isGroups = label === 'Groups'
        return (
          <Link
            key={href}
            href={href}
            style={{ textDecoration: 'none', gridColumn: wide ? '1 / -1' : undefined }}
          >
            <div
              style={{
                background: cs.bg,
                border: '1px solid var(--border-subtle)',
                borderRadius: cs.radius,
                padding: isGroups ? '12px 16px' : isNova ? '16px 18px' : 14,
                minHeight: cs.minH,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${accent}50`; el.style.boxShadow = `0 0 0 1px ${accent}18` }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border-subtle)'; el.style.boxShadow = 'none' }}
            >
              {isNova ? (
                // Wide hero — side-by-side layout with accent glow orb
                <>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.18) 0%,transparent 70%)', pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: iconBg, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, boxShadow: `0 0 18px ${accent}30` }}>✨</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Nova AI</div>
                      <div style={{ fontSize: 12, color: subtitle.color ?? accent, marginTop: 2 }}>{subtitle.text}</div>
                    </div>
                    <span style={{ fontSize: 20, color: `${accent}70`, flexShrink: 0 }}>›</span>
                  </div>
                  <div style={{ marginTop: 10, height: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 2 }}>
                    <div className="bar-fill-anim" style={{ height: '100%', width: `${novaPct}%`, background: accent, borderRadius: 2, opacity: 0.7 }} />
                  </div>
                </>
              ) : isGroups ? (
                // Compact wide bar
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>👥</div>
                  <span style={{ fontFamily: 'Sora,sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Groups</span>
                  <span style={{ fontSize: 12, color: subtitle.color ?? accent, marginLeft: 4 }}>{subtitle.text}</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.2)' }}>›</span>
                </div>
              ) : (
                // Standard portrait card
                <>
                  <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: accent, opacity: 0.55, borderRadius: '2px 0 0 2px' }} />
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
                  <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 10 }}>{label}</div>
                  <div style={{ fontSize: 12, color: subtitle.color ?? accent, marginTop: 2 }}>{subtitle.text}</div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.04)' }}>
                    <div className="bar-fill-anim" style={{ height: '100%', width: `${subtitle.pct}%`, background: subtitle.barColor, borderRadius: 3 }} />
                  </div>
                </>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

/* ── ExamCountdownCard ──────────────────────────────────── */
function ExamCountdownCard({ exams }: { exams: Exam[] }) {
  const next = exams[0]
  if (!next) return null
  const days = getDaysUntil(next.exam_date)
  const urgencyColor = days <= 1 ? '#ff6b6b' : days <= 3 ? '#c9a84c' : '#7090d0'

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '16px 16px 16px 20px', position: 'relative', overflow: 'hidden' }}>
      <span style={{ position: 'absolute', left: 0, top: 16, bottom: 16, width: 2, background: '#7090d0', borderRadius: '0 1px 1px 0' }} />
      <span style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 20%,rgba(112,144,208,0.06) 0%,transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Next Exam</div>
        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 14, color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {next.exam_name}
        </div>
        {next.module && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', marginTop: 2 }}>{next.module.module_name}</div>}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 4 }}>
          {fmt.dateFull(next.exam_date)}{next.start_time && ` · ${fmt.time(next.start_time)}`}{next.venue && ` · ${next.venue}`}
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            {days < 0 ? (
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 48, fontWeight: 700, color: 'rgba(255,255,255,0.18)', lineHeight: 1 }}>✓</div>
            ) : days === 0 ? (
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 28, fontWeight: 700, color: '#ff6b6b', lineHeight: 1 }}>TODAY</div>
            ) : (
              <div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 48, fontWeight: 700, color: urgencyColor, lineHeight: 1, textShadow: `0 0 30px ${urgencyColor}50` }}>{days}</div>
                <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>DAYS</div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {exams.length > 1 && (
              <div style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: 'rgba(112,144,208,0.1)', color: '#7090d0', border: '0.5px solid rgba(112,144,208,0.25)' }}>+{exams.length - 1} more</div>
            )}
            {days > 0 && (
              <ShareButton
                variant="icon"
                context="exam_countdown"
                title="Exam Countdown"
                text={`My ${next.exam_name} exam is in ${days} day${days !== 1 ? 's' : ''}! 📚 Studying hard with VarsityOS`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── BudgetRingCard ─────────────────────────────────────── */
function BudgetRingCard({ monthSpent, totalBudget, expenses, compact = false }: {
  monthSpent: number; totalBudget: number; expenses: Expense[]; compact?: boolean
}) {
  const pct       = totalBudget > 0 ? Math.min(100, Math.round((monthSpent / totalBudget) * 100)) : 0
  const ringColor = pct > 85 ? '#ff6b6b' : pct > 60 ? '#c9a84c' : '#4ecf9e'
  const r = compact ? 26 : 38; const size = compact ? 64 : 96; const sw = compact ? 6 : 8
  const circ = 2 * Math.PI * r; const offset = circ * (1 - pct / 100)
  const catMap: Record<string, number> = {}
  expenses.forEach(e => { catMap[e.category] = (catMap[e.category] ?? 0) + e.amount })
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 3)

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: compact ? 12 : 16 }}>
      <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: compact ? 8 : 12 }}>This Month</div>
      <div style={{ display: 'flex', flexDirection: compact ? 'column' : 'row', alignItems: 'center', gap: compact ? 6 : 16 }}>
        <div style={{ flexShrink: 0, position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ringColor} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ filter: `drop-shadow(0 0 8px ${ringColor}60)` }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: compact ? 11 : 16, fontWeight: 700, color: ringColor, lineHeight: 1 }}>{pct}%</div>
            {!compact && <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>used</div>}
          </div>
        </div>
        <div style={{ flex: compact ? 'unset' : 1, minWidth: 0, textAlign: compact ? 'center' : 'left' }}>
          <div>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: compact ? 13 : 18, fontWeight: 700, color: '#c9a84c' }}>R{Math.round(monthSpent)}</span>
            {!compact && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}> of R{Math.round(totalBudget)}</span>}
          </div>
          {compact ? (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>of R{Math.round(totalBudget)}</div>
          ) : topCats.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
              {topCats.map(([cat, amt]) => (
                <span key={cat} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 9999, background: 'var(--bg-elevated)', border: '0.5px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}>
                  {cat} · R{Math.round(amt)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── UpgradeBar ─────────────────────────────────────────── */
function UpgradeBar() {
  return (
    <div style={{ margin: '16px -24px -20px', padding: '14px 24px', background: 'linear-gradient(90deg,rgba(155,111,212,0.07) 0%,rgba(201,168,76,0.07) 100%)', borderTop: '0.5px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>Unlock unlimited Nova messages</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>from R29/month</span>
      </div>
      <Link href="/upgrade" style={{ textDecoration: 'none' }}>
        <button style={{ background: 'linear-gradient(135deg,#9b6fd4 0%,#c9a84c 100%)', color: '#fff', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 12, border: 'none', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Upgrade →
        </button>
      </Link>
    </div>
  )
}

/* ── MobileTodayClasses ─────────────────────────────────── */
function MobileTodayClasses({ timetable }: { timetable: TimetableEntry[] }) {
  const { slots: todaySlots } = getTodaySlots(timetable)

  return (
    <div className="block md:hidden" style={{ background: '#0d1520', border: '1px solid rgba(26,158,117,0.2)', borderRadius: 14, padding: '12px 14px' }}>
      <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#5a5c70', marginBottom: 10, fontWeight: 600 }}>Today&apos;s Classes</div>
      {todaySlots.length === 0 ? (
        <div style={{ fontSize: 12, color: '#5a5c70' }}>No classes today — enjoy your day ✦</div>
      ) : (
        <div>
          {todaySlots.map((slot, i) => {
            const moduleName = (slot.module as Module | undefined)?.module_name || 'Class'
            return (
              <div key={slot.id}>
                {i > 0 && <div style={{ height: 1, background: '#1a2a20' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1a9e75', flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: '#e8e6f0', flex: 1 }}>{moduleName}</span>
                  {slot.start_time && (
                    <span style={{ fontSize: 10, color: '#1a9e75' }}>
                      {slot.start_time}{slot.end_time ? `–${slot.end_time}` : ''}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── MobileTasksToday ───────────────────────────────────── */
function MobileTasksToday({ tasks, onComplete }: { tasks: Task[]; onComplete: (id: string) => void }) {
  const TASK_CAT_STYLE: Record<string, { bg: string; color: string }> = {
    Study:  { bg: 'rgba(26,95,106,0.2)',    color: '#1a9e75' },
    Budget: { bg: 'rgba(201,168,76,0.15)',  color: '#c9a84c' },
    Meals:  { bg: 'rgba(232,131,74,0.12)',  color: '#e8834a' },
    Work:   { bg: 'rgba(122,153,184,0.12)', color: '#7a99b8' },
  }
  const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0)
  const todayTasks = tasks
    .filter(t => {
      if (!t.due_date) return false
      const due = new Date(t.due_date); due.setHours(0, 0, 0, 0)
      return due.getTime() <= todayDate.getTime()
    })
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5)

  const allDone = todayTasks.length > 0 && todayTasks.every(t => t.status === 'done')

  return (
    <div className="block md:hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#5a5c70', fontWeight: 600 }}>Tasks Today</div>
        <Link href="/study" style={{ fontSize: 10, color: '#9b6fd4', textDecoration: 'none' }}>See all →</Link>
      </div>
      {todayTasks.length === 0 ? (
        <div style={{ fontSize: 12, color: '#5a5c70' }}>No tasks today 🎉</div>
      ) : allDone ? (
        <div style={{ fontSize: 12, color: '#4ecf9e' }}>All done for today ✦</div>
      ) : (
        <div>
          {todayTasks.map((task, i) => {
            const isDone = task.status === 'done'
            const due = new Date(task.due_date!); due.setHours(0, 0, 0, 0)
            const isOverdue = due.getTime() < todayDate.getTime()
            const diffDays = isOverdue ? Math.round((todayDate.getTime() - due.getTime()) / 86400000) : 0
            const modName = task.module?.module_name ?? 'Study'
            const catS = TASK_CAT_STYLE[modName] ?? { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }
            return (
              <div key={task.id}>
                {i > 0 && <div style={{ height: 1, background: 'var(--border-subtle)' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                  <button
                    onClick={() => !isDone && onComplete(task.id)}
                    aria-label="Complete task"
                    style={{ width: 14, height: 14, borderRadius: 4, border: isDone ? 'none' : '1px solid #3a3b4e', background: isDone ? '#4ecf9e' : 'transparent', flexShrink: 0, cursor: isDone ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  >
                    {isDone && <span style={{ fontSize: 9, color: '#000', lineHeight: 1 }}>✓</span>}
                  </button>
                  <span style={{ fontSize: 11, color: isDone ? 'rgba(255,255,255,0.3)' : '#e8e6f0', flex: 1, textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.title}
                  </span>
                  {isOverdue && !isDone ? (
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 9999, background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: '0.5px solid rgba(255,107,107,0.25)', flexShrink: 0 }}>{diffDays}d late</span>
                  ) : !isDone && (
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 9999, background: catS.bg, color: catS.color, flexShrink: 0 }}>{modName}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── PrescriptionReminderCard ──────────────────────────── */
interface RxEntry { id: number; name: string; dose: string; frequency: string; nextRefill: string; instructions: string }

function PrescriptionReminderCard() {
  const [meds, setMeds] = useState<RxEntry[]>([])
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('varsityos-prescriptions') || '[]') as RxEntry[]
      setMeds(stored)
    } catch { /* ignore */ }
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const urgent = meds.filter(m => m.nextRefill && m.nextRefill <= tomorrow)
  if (!urgent.length) return null

  return (
    <Link href="/health?tab=prescriptions" style={{ textDecoration: 'none' }}>
      <div className="dash-card-in" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(244,114,182,0.30)', borderRadius: 14, padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,var(--rose),rgba(244,114,182,0.15))' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>💊</span>
            <span style={{ fontSize: 10, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--rose)', fontWeight: 700 }}>Prescription Reminder</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>→</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {urgent.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: 'rgba(244,114,182,0.06)', border: '0.5px solid rgba(244,114,182,0.20)', borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{m.dose} · {m.frequency}</div>
              </div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, fontFamily: 'var(--font-mono)', fontWeight: 700, background: m.nextRefill <= today ? 'rgba(153,27,27,0.10)' : 'rgba(244,114,182,0.10)', color: m.nextRefill <= today ? 'var(--danger)' : 'var(--rose)', border: `0.5px solid ${m.nextRefill <= today ? 'rgba(153,27,27,0.30)' : 'rgba(244,114,182,0.30)'}` }}>
                {m.nextRefill <= today ? 'Overdue' : 'Tomorrow'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}

/* ── ModulePillList (desktop only) ──────────────────────── */
function ModulePillList({ tasks, totalBudget, remaining, profile, mealPlanExists, shiftsThisWeek, activeGroups }: {
  tasks: Task[]; totalBudget: number; remaining: number
  profile: Profile; mealPlanExists: boolean; shiftsThisWeek: number; activeGroups: number
}) {
  const PILL_ORDER   = ['Study', 'Budget', 'Meals', 'Work', 'Nova', 'Groups']
  const todayStr     = toISODate()
  const _wa = new Date(); _wa.setDate(_wa.getDate() + 7)
  const weekAheadStr = toISODate(_wa)
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < todayStr).length
  const tasksDueWeek = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date >= todayStr && t.due_date <= weekAheadStr).length
  const isUnlimited  = profile.subscription_tier === 'nova_unlimited'
  const novaLeft     = Math.max(0, (profile.nova_messages_limit ?? 10) - (profile.nova_messages_used ?? 0))

  const subtitles: Record<string, string> = {
    Study:  overdueTasks > 0 ? `${overdueTasks} overdue` : tasksDueWeek > 0 ? `${tasksDueWeek} due this week` : 'All clear ✓',
    Budget: totalBudget > 0 ? (remaining >= 0 ? `R${Math.round(remaining)} remaining` : 'Over budget') : 'Set budget →',
    Meals:  mealPlanExists ? 'Week planned ✓' : 'Plan your week →',
    Work:   shiftsThisWeek > 0 ? `${shiftsThisWeek} shift${shiftsThisWeek > 1 ? 's' : ''} ahead` : 'No shifts soon',
    Nova:   isUnlimited ? 'Unlimited' : `${novaLeft} msgs left`,
    Groups: activeGroups > 0 ? `${activeGroups} group${activeGroups > 1 ? 's' : ''}` : 'Join a group →',
  }

  return (
    <div className="hidden md:block" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '10px 12px' }}>
      <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#5a5c70', marginBottom: 6, fontWeight: 600 }}>Your Modules</div>
      {PILL_ORDER.map(l => NAV_MODULES.find(m => m.label === l)!).map(({ href, label, icon, iconBg, color: subColor }, i) => (
        <div key={href}>
          {i > 0 && <div style={{ height: 1, background: 'var(--border-subtle)' }} />}
          <Link href={href} style={{ textDecoration: 'none' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderRadius: 9, cursor: 'pointer', transition: 'all 0.12s', border: '1px solid transparent' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#12131e'; el.style.borderColor = '#2e2f40' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderColor = 'transparent' }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: 11, color: subColor, marginTop: 1 }}>{subtitles[label]}</div>
              </div>
              <span style={{ fontSize: 16, color: '#3a3b4e', flexShrink: 0 }}>›</span>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}

/* ── main component ─────────────────────────────────────── */
export default function DashboardClient({ initialData }: DashboardClientProps) {
  const store = useAppStore()
  const [novaInsights, setNovaInsights] = useState<NovaInsight[]>([])
  const [mealPlanExists, setMealPlanExists] = useState(false)
  const [shiftsThisWeek, setShiftsThisWeek] = useState(0)
  const [activeGroups, setActiveGroups] = useState(0)
  const [novaCheckin, setNovaCheckin] = useState<string | null>(null)
  const [streakDays, setStreakDays] = useState(0)
  const [streakTodayDone, setStreakTodayDone] = useState(false)
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours())
  const [todayStudyMins, setTodayStudyMins] = useState(0)
  const [lastSleepHours, setLastSleepHours] = useState<number | null>(null)
  const [weekWorkouts, setWeekWorkouts] = useState(0)

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
      .then(d => { if (d.success) import('react-hot-toast').then(({ default: toast }) => { toast.success(`Referral applied! +${d.bonusMessages} Nova messages.`) }) })
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
    fetch('/api/insights').then(r => r.ok ? r.json() : null).then(d => {
      if (d) {
        setNovaInsights(d.insights ?? [])
        try { sessionStorage.setItem(key, JSON.stringify(d.insights ?? [])) } catch { /* quota */ }
      }
    }).catch(() => {})
  }, [])

  // 4. Parallel client-side fetch: meals, shifts, groups
  useEffect(() => {
    let mounted = true
    const fetchLiveData = async () => {
      if (!navigator.onLine) return
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const now = new Date()
        const jsDay = now.getDay()
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - jsDay + (jsDay === 0 ? -6 : 1)); weekStart.setHours(0,0,0,0)
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)
        const todayStr = now.toISOString().split('T')[0]
        const sevenDays = new Date(now); sevenDays.setDate(now.getDate() + 7)
        const [mealsRes, shiftsRes, groupsRes, nsfasRes] = await Promise.allSettled([
          supabase.from('meal_plans').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('week_start', weekStart.toISOString().split('T')[0]).lte('week_start', weekEnd.toISOString().split('T')[0]),
          supabase.from('work_shifts').select('id', { count: 'exact', head: true }).eq('student_id', user.id).gte('shift_date', todayStr).lte('shift_date', sevenDays.toISOString().split('T')[0]),
          supabase.from('group_members').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          // NSFAS delayed: any expected disbursement whose expected_date has passed
          supabase.from('nsfas_disbursements').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'expected').lt('expected_date', todayStr),
        ])
        if (mealsRes.status === 'fulfilled') { if (mounted) setMealPlanExists((mealsRes.value.count ?? 0) > 0) }
        if (shiftsRes.status === 'fulfilled') { if (mounted) setShiftsThisWeek(shiftsRes.value.count ?? 0) }
        if (groupsRes.status === 'fulfilled') { if (mounted) setActiveGroups(groupsRes.value.count ?? 0) }
        // Always write nsfasDelayed so a resolved payment clears the flag
        if (nsfasRes.status === 'fulfilled') { if (mounted) store.setNsfasDelayed((nsfasRes.value.count ?? 0) > 0) }
        const week7Ago = new Date(now.getTime() - 7 * 86_400_000).toISOString().split('T')[0]
        const [studyRes, sleepRes, workoutRes, study7Res, sleep7Res] = await Promise.allSettled([
          supabase.from('study_sessions').select('duration_minutes').eq('user_id', user.id).gte('started_at', `${todayStr}T00:00:00`),
          supabase.from('sleep_logs').select('bedtime,wake_time').eq('user_id', user.id).order('sleep_date', { ascending: false }).limit(1),
          supabase.from('workout_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('date', weekStart.toISOString().split('T')[0]).is('deleted_at', null),
          // 7-day study sessions for velocity
          supabase.from('study_sessions').select('duration_minutes').eq('user_id', user.id).gte('started_at', `${week7Ago}T00:00:00`),
          // 7-day sleep logs for debt
          supabase.from('sleep_logs').select('bedtime,wake_time,sleep_date').eq('user_id', user.id).gte('sleep_date', week7Ago).order('sleep_date', { ascending: false }),
        ])
        if (studyRes.status === 'fulfilled') {
          const rows = studyRes.value.data as Array<{ duration_minutes: number }> | null
          if (rows && mounted) setTodayStudyMins(rows.reduce((s, r) => s + (r.duration_minutes ?? 0), 0))
        }
        if (sleepRes.status === 'fulfilled') {
          const row = (sleepRes.value.data as Array<{ bedtime: string | null; wake_time: string | null }> | null)?.[0]
          if (row?.bedtime && row?.wake_time) {
            const [bh, bm] = row.bedtime.split(':').map(Number)
            const [wh, wm] = row.wake_time.split(':').map(Number)
            let hrs = (wh + wm / 60) - (bh + bm / 60)
            if (hrs < 0) hrs += 24
            if (mounted) setLastSleepHours(parseFloat(hrs.toFixed(1)))
          }
        }
        if (workoutRes.status === 'fulfilled') { if (mounted) setWeekWorkouts(workoutRes.value.count ?? 0) }

        // Study velocity: avg hours/day over last 7 days
        if (study7Res.status === 'fulfilled') {
          const rows = study7Res.value.data as Array<{ duration_minutes: number }> | null
          if (rows && rows.length > 0) {
            const totalMins = rows.reduce((s, r) => s + (r.duration_minutes ?? 0), 0)
            if (mounted) store.setStudyVelocity7d(parseFloat((totalMins / (7 * 60)).toFixed(2)))
          }
        }

        // Sleep debt: sum of max(0, 7h - actual) over logged days
        if (sleep7Res.status === 'fulfilled') {
          const rows = sleep7Res.value.data as Array<{ bedtime: string | null; wake_time: string | null }> | null
          if (rows && rows.length > 0) {
            let debt = 0
            for (const row of rows) {
              if (!row.bedtime || !row.wake_time) continue
              const [bh, bm] = row.bedtime.split(':').map(Number)
              const [wh, wm] = row.wake_time.split(':').map(Number)
              let hrs = (wh + wm / 60) - (bh + bm / 60)
              if (hrs < 0) hrs += 24
              debt += Math.max(0, 7 - hrs)
            }
            if (mounted) store.setSleepDebt(parseFloat(debt.toFixed(1)))
          }
        }
      } catch { /* silent */ }
    }
    fetchLiveData()
    return () => { mounted = false }
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

  const handleCompleteTask = useCallback(async (taskId: string) => {
    const currentTasks = store.tasks.length ? store.tasks : initialData.tasks
    const task = currentTasks.find(t => t.id === taskId)
    store.setTasks(currentTasks.map(t => t.id === taskId ? { ...t, status: 'done' } : t))
    if (task) {
      const deadline = task.due_date ? new Date(task.due_date + 'T23:59:59').getTime() : Date.now()
      signals.emit({ type: 'task_completed', payload: { taskId, moduleId: task.module_id ?? undefined, hoursBeforeDeadline: Math.max(0, Math.round((deadline - Date.now()) / 3_600_000)) } })
    }
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('tasks').update({ status: 'done' }).eq('id', taskId)
    } catch { /* silent */ }
  }, [store, initialData.tasks])

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

  // Mode-driven design tokens — everything derives from this
  const mode  = getDayMode(currentHour)
  const theme = DASH_THEME[mode]

  // Domain Pulse derived values — computed once for DomainPulse
  const todayISOStr  = toISODate()
  const domainOverdue   = allTasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < todayISOStr).length
  const domainExamDays  = allExams.length > 0 ? getDaysUntil(allExams[0].exam_date) : null

  return (
    <>
      {/* Full-page ambient image — fixed so it persists as user scrolls */}
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

      <div className="page-enter min-h-screen" style={{ background: 'rgba(5,4,12,0.62)' }}>

        <PullToRefresh onRefresh={handleRefresh} />

        {/* Topbar with mode indicator */}
        <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(10,11,16,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '0.5px solid rgba(255,255,255,0.05)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
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

            {/* Column 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Just Start — zero-friction focus launcher */}
              <TabErrorBoundary label="Just Start">
                <JustStartButton tasks={allTasks} />
              </TabErrorBoundary>

              {/* OS Command Hero — mode-adaptive, replaces bland DayModeBanner + NovaBanner */}
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

              {/* Priority command strip — what matters right now */}
              <PriorityCommandStrip
                tasks={allTasks}
                exams={allExams}
                totalBudget={totalBudget}
                remaining={remaining}
              />

              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '12px 16px' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>How are you feeling?</div>
                <MoodCheckin userId={p.id} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <TabErrorBoundary><BurnoutRadar userId={p.id} /></TabErrorBoundary>
                <TabErrorBoundary>
                  <MoneyHealthScore
                    budget={b}
                    monthlyExpenses={monthSpent}
                    nsfasStatus="ok"
                    savingsRate={0}
                  />
                </TabErrorBoundary>
              </div>

              {/* Orchestration — daily brief */}
              <TabErrorBoundary label="Daily Brief">
                <DailyBrief />
              </TabErrorBoundary>

              {/* Cross-domain correlation insights — 30-day pattern analysis */}
              <TabErrorBoundary label="Insights">
                <InsightsCard />
              </TabErrorBoundary>

              {/* Cohort comparison — anonymous peer benchmarking */}
              <TabErrorBoundary label="Cohort">
                <CohortCard />
              </TabErrorBoundary>

              {/* Task calendar: day / week toggle */}
              <TaskCalendarStrip tasks={allTasks} />

              {/* Weekly planning ritual */}
              <SundayPlanning />

              {/* Weather + outfit intelligence */}
              <WeatherWidget />

              <LevelCard />
              <StreakWidget />
              <DailyChallenges />

              {/* Commitment Contracts — stake XP on task completion */}
              <TabErrorBoundary label="Commitment Contracts">
                <CommitmentContracts />
              </TabErrorBoundary>

              {/* Implementation Intentions — schedule when + where */}
              <TabErrorBoundary label="Implementation Intentions">
                <ImplementationIntentions tasks={allTasks} />
              </TabErrorBoundary>

              {/* Reward Unlock — temptation bundling */}
              <TabErrorBoundary label="Reward Unlock">
                <RewardUnlock />
              </TabErrorBoundary>

              {/* Procrastination Journal — reflect & rewire */}
              <TabErrorBoundary label="Procrastination Journal">
                <ProcrastinationJournal />
              </TabErrorBoundary>

              {/* Procrastination Profiler — identify your type */}
              <TabErrorBoundary label="Procrastination Profiler">
                <ProcrastinationProfiler />
              </TabErrorBoundary>

              {/* Accountability Partner — go public with your commitment */}
              <TabErrorBoundary label="Accountability Partner">
                <AccountabilityPartner tasks={allTasks} />
              </TabErrorBoundary>

              <StatCardsRow remaining={remaining} totalBudget={totalBudget} tasks={allTasks} exams={allExams} streakDays={streakDays} streakTodayDone={streakTodayDone} todayStudyMins={todayStudyMins} lastSleepHours={lastSleepHours} weekWorkouts={weekWorkouts} />

              {/* Prescription medication reminders — surfaces overdue/tomorrow refills */}
              <PrescriptionReminderCard />

              {/* Quick-access bento tiles (mobile) */}
              <div className="md:hidden">
                <FeatureGrid tasks={allTasks} expenses={recentExp} totalBudget={totalBudget} remaining={remaining} modules={allMods} subscription={sub as Subscription | null} profile={p} mealPlanExists={mealPlanExists} shiftsThisWeek={shiftsThisWeek} activeGroups={activeGroups} streakDays={streakDays} />
              </div>

              {/* Domain Pulse — 9 life domains ranked by urgency score */}
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
            </div>

            {/* Column 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Deadline Telescope — shows when exam < 21 days */}
              <TabErrorBoundary label="Deadline Telescope">
                <DeadlineTelescope exams={allExams} />
              </TabErrorBoundary>

              {/* Body Double Mode — Supabase Realtime study presence */}
              <TabErrorBoundary label="Body Double Mode">
                <BodyDoubleMode />
              </TabErrorBoundary>

              {allExams.length > 0 && <ExamCountdownCard exams={allExams} />}
              <StudyTipsCard exam={allExams[0] ?? null} profile={p} />
            </div>

            {/* Column 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
