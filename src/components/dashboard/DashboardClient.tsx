'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAppStore } from '@/store'
import PullToRefresh from '@/components/ui/PullToRefresh'
import MoodCheckin from '@/components/dashboard/MoodCheckin'
import {
  type Profile, type Budget, type Task, type Exam,
  type Module, type TimetableEntry, type Expense,
  type Subscription,
} from '@/types'
import { fmt, getDaysUntil, calcTotalBudget, cn } from '@/lib/utils'

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
    subscription: Subscription | null
  }
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

/* ── CSS animations ─────────────────────────────────────── */
const DASH_STYLES = `
@keyframes novaPulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50%       { transform: scale(1.4); opacity: 1; }
}
@keyframes dotGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,107,0.6); }
  50%       { box-shadow: 0 0 0 5px rgba(255,107,107,0); }
}
@keyframes barFill { from { width: 0%; } }
@keyframes dashFadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes shimmerSkeleton {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
.nova-pulse-ring { animation: novaPulse 2.4s ease-in-out infinite; }
.dot-urgent      { animation: dotGlow 1.8s ease-in-out infinite; }
.bar-fill-anim   { animation: barFill 1s ease-out both; }
.dash-card-in    { animation: dashFadeUp 0.35s ease-out both; }
.skeleton-row {
  background: linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 75%);
  background-size: 200% 100%;
  animation: shimmerSkeleton 1.4s infinite;
  border-radius: 6px;
}
`

/* ── StudyTipsCard ──────────────────────────────────────── */
interface StudyTip { text: string; source: string }

function StudyTipsCard({ exam, profile }: { exam: Exam | null; profile: Profile }) {
  const [tips, setTips] = useState<StudyTip[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!exam) return
    const today = new Date().toISOString().split('T')[0]
    const cacheKey = `study_tips_${exam.id}_${today}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try { setTips(JSON.parse(cached)); return } catch { /* ignore */ }
    }
    setLoading(true)
    const subject = (exam.module as Module | undefined)?.module_name ?? 'General'
    const daysUntil = Math.max(0, getDaysUntil(exam.exam_date))
    fetch('/api/dashboard/study-tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examName: exam.exam_name ?? (exam as unknown as { name?: string }).name ?? 'Upcoming exam',
        examSubject: subject,
        daysUntil,
        degreeProgram: (profile as unknown as { university?: string }).university ?? 'University',
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.tips) { setTips(d.tips); localStorage.setItem(cacheKey, JSON.stringify(d.tips)) }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [exam, profile])

  if (!exam) return null

  return (
    <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' }}>
      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#9b6fd4 0%,rgba(155,111,212,0.15) 100%)' }} />
      <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9b6fd4', marginBottom: 8, fontWeight: 600 }}>Nova Study Tips</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
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
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{tip.text}</div>
                <div style={{ fontSize: 10, color: 'rgba(155,111,212,0.65)', marginTop: 2 }}>{tip.source}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !tips && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '12px 0' }}>Tips unavailable</div>
      )}
    </div>
  )
}

/* ── CoachSummaryCard ──────────────────────────────────── */
interface CoachInsight { tag: string; text: string }

function CoachSummaryCard({ userId, totalBudget, amountSpent, expenses }: {
  userId: string; totalBudget: number; amountSpent: number; expenses: Expense[]
}) {
  const [insights, setInsights] = useState<CoachInsight[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (totalBudget <= 0) return
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const week = Math.ceil(now.getDate() / 7)
    const cacheKey = `coach_summary_${userId}_${month}_w${week}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try { setInsights(JSON.parse(cached)); return } catch { /* ignore */ }
    }
    setLoading(true)
    const catMap: Record<string, number> = {}
    expenses.forEach(e => { catMap[e.category] = (catMap[e.category] ?? 0) + e.amount })
    const topCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c).join(', ') || 'General'
    const percentUsed = Math.round((amountSpent / totalBudget) * 100)
    const daysRemaining = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()

    fetch('/api/dashboard/coach-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalBudget, amountSpent, percentUsed, topCategories, daysRemaining, savingsGoals: 'None' }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.insights) { setInsights(d.insights); localStorage.setItem(cacheKey, JSON.stringify(d.insights)) }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId, totalBudget, amountSpent, expenses])

  if (totalBudget <= 0) return null

  const tagColors: Record<string, string> = {
    'Watch out': '#ff6b6b', 'Money tip': '#c9a84c',
    'Goal progress': '#4ecf9e', 'Well done': '#4ecf9e',
  }

  return (
    <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' }}>
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
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{ins.text}</div>
              </div>
            )
          })}
        </div>
      )}
      {!loading && !insights && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '12px 0' }}>Set a budget to get insights</div>
      )}
    </div>
  )
}

/* ── NovaBanner ─────────────────────────────────────────── */
function NovaBanner({ profile, subscription, checkinMessage }: {
  profile: Profile; subscription: Subscription | null; checkinMessage: string | null
}) {
  const msgLimit    = profile.nova_messages_limit ?? 10
  const msgUsed     = profile.nova_messages_used ?? 0
  const remaining   = Math.max(0, msgLimit - msgUsed)
  const isUnlimited = profile?.subscription_tier === 'nova_unlimited'
  void subscription

  return (
    <div style={{ background: 'linear-gradient(135deg,#12102a 0%,#1a1530 50%,#0d0e14 100%)', border: '1px solid rgba(155,111,212,0.22)', borderRadius: 16, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,#9b6fd4 0%,rgba(155,111,212,0.2) 50%,transparent 100%)', pointerEvents: 'none' }} />
      <span style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 5% 50%,rgba(155,111,212,0.1) 0%,transparent 60%)', pointerEvents: 'none' }} />
      <span style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(155,111,212,0.07) 0%,transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div className="nova-pulse-ring" style={{ position: 'absolute', inset: -6, borderRadius: '50%', background: 'rgba(155,111,212,0.15)', pointerEvents: 'none' }} />
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#9b6fd4 0%,#6b3fa0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', boxShadow: '0 0 20px rgba(155,111,212,0.4)' }}>
                ✦
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 16, color: '#c5a8f0', letterSpacing: '-0.01em' }}>Nova</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                {isUnlimited ? 'Unlimited conversations' : `${remaining} msgs left this month`}
              </div>
            </div>
          </div>
          <Link href="/nova">
            <button style={{ background: 'linear-gradient(135deg,#9b6fd4 0%,#b589e8 100%)', color: '#fff', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, border: 'none', borderRadius: 10, padding: '9px 16px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(155,111,212,0.3)' }}>
              Chat with Nova →
            </button>
          </Link>
        </div>

        {checkinMessage && (
          <div style={{ marginTop: 14, background: 'rgba(155,111,212,0.08)', border: '0.5px solid rgba(155,111,212,0.2)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>💜</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9b6fd4', marginBottom: 3 }}>Nova Check-in</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{checkinMessage}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── StatCardsRow ─────────────────────────────────────── */
function StatCardsRow({ remaining, totalBudget, tasks, exams, streakDays }: {
  remaining: number; totalBudget: number; tasks: Task[]; exams: Exam[]; streakDays: number
}) {
  const todayDate = new Date(); todayDate.setHours(0,0,0,0)
  const weekAhead = new Date(); weekAhead.setDate(weekAhead.getDate() + 7)
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < todayDate).length
  const tasksDueWeek = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) >= todayDate && new Date(t.due_date) <= weekAhead).length
  const nextExam = exams[0]
  const daysToExam = nextExam ? getDaysUntil(nextExam.exam_date) : null

  const cards = [
    { value: remaining >= 0 ? `R${Math.round(remaining)}` : `−R${Math.round(Math.abs(remaining))}`, label: 'Budget left', accent: remaining >= 0 ? '#c9a84c' : '#ff6b6b' },
    { value: daysToExam !== null ? (daysToExam <= 0 ? 'TODAY' : String(daysToExam)) : '—', label: 'Days to exam', accent: '#7090d0' },
    { value: String(tasksDueWeek + overdueTasks), label: overdueTasks > 0 ? `${overdueTasks} overdue` : 'Tasks ahead', accent: overdueTasks > 0 ? '#ff6b6b' : '#4ecf9e' },
    { value: String(streakDays), label: 'Study streak', accent: '#4ecf9e', suffix: <FlameIcon streak={streakDays} /> },
  ]

  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }} className="scrollbar-none">
      {cards.map(({ value, label, accent, suffix }, i) => (
        <div key={label} className="dash-card-in" style={{ flexShrink: 0, minWidth: 110, flex: '1 0 110px', background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '14px 14px 12px', position: 'relative', overflow: 'hidden', animationDelay: `${i * 0.06}s` }}>
          <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent, borderRadius: '14px 14px 0 0' }} />
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 22, fontWeight: 700, color: accent, lineHeight: 1 }}>
            {value}{suffix && <span style={{ marginLeft: 4 }}>{suffix}</span>}
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

/* ── TodaysClasses ─────────────────────────────────────── */
function TodaysClasses({ timetable }: { timetable: TimetableEntry[] }) {
  const now = new Date()
  const jsDay = now.getDay()
  const dbDay = jsDay === 0 ? 7 : jsDay
  const todaySlots = timetable.filter(s => (s.day_of_week as number) === dbDay).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
  if (!todaySlots.length) return null
  const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  const displaySlots = todaySlots.slice(0, 3)

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ecf9e', display: 'inline-block' }} />
          <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4ecf9e', fontWeight: 600 }}>Today&apos;s Classes</span>
        </div>
        <Link href="/study/timetable" style={{ fontSize: 12, color: '#4ecf9e', textDecoration: 'none' }}>See all →</Link>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {displaySlots.map(slot => {
          const isNow = slot.start_time && slot.end_time ? currentTime >= slot.start_time && currentTime <= slot.end_time : false
          const colour = (slot.module as Module | undefined)?.color ?? (slot.module as Module | undefined)?.colour ?? '#4ecf9e'
          const moduleName = (slot.module as Module | undefined)?.module_name || 'Class'
          return (
            <div key={slot.id} style={{ flexShrink: 0, minWidth: 140, padding: '10px 12px', background: '#0d0e14', border: `1px solid ${isNow ? colour + '60' : '#1e1f2e'}`, borderLeft: `2px solid ${colour}`, borderRadius: '0 10px 10px 0', position: 'relative' }}>
              {isNow && <span style={{ position: 'absolute', top: 6, right: 8, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: colour, textTransform: 'uppercase' }}>NOW</span>}
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: isNow ? 32 : 0 }}>{moduleName}</div>
              {(slot.start_time || slot.venue) && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                  {slot.start_time && `${slot.start_time}${slot.end_time ? ` – ${slot.end_time}` : ''}`}{slot.venue && ` · ${slot.venue}`}
                </div>
              )}
            </div>
          )
        })}
        {todaySlots.length > 3 && (
          <Link href="/study/timetable" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
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
    <section style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '12px 14px' }}>
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
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                {task.module && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.module.module_name}</div>}
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
const FEATURE_CARDS = [
  { href: '/study',            label: 'Study',  accent: '#4ecf9e', iconBg: 'rgba(78,207,158,0.1)' },
  { href: '/budget',           label: 'Budget', accent: '#c9a84c', iconBg: 'rgba(201,168,76,0.1)' },
  { href: '/meals',            label: 'Meals',  accent: '#e8834a', iconBg: 'rgba(232,131,74,0.1)' },
  { href: '/dashboard/work',   label: 'Work',   accent: '#7090d0', iconBg: 'rgba(112,144,208,0.1)' },
  { href: '/nova',             label: 'Nova',   accent: '#9b6fd4', iconBg: 'rgba(155,111,212,0.1)' },
  { href: '/dashboard/groups', label: 'Groups', accent: '#4ecf9e', iconBg: 'rgba(78,207,158,0.1)' },
]
const FEATURE_ICONS: Record<string, string> = { Study: '📚', Budget: '💰', Meals: '🍲', Work: '💼', Nova: '✨', Groups: '👥' }

function FeatureGrid({ tasks, expenses, totalBudget, remaining, modules, subscription, profile, mealPlanExists, shiftsThisWeek, activeGroups }: {
  tasks: Task[]; expenses: Expense[]; totalBudget: number; remaining: number
  modules: Module[]; subscription: Subscription | null; profile: Profile
  mealPlanExists: boolean; shiftsThisWeek: number; activeGroups: number
}) {
  void cn(modules.length, subscription)
  const isUnlimited = profile.subscription_tier === 'nova_unlimited'
  const novaLeft = Math.max(0, (profile.nova_messages_limit ?? 10) - (profile.nova_messages_used ?? 0))
  const todayDate = new Date(); todayDate.setHours(0,0,0,0)
  const weekAhead = new Date(); weekAhead.setDate(weekAhead.getDate() + 7)
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < todayDate).length
  const tasksDueWeek = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) >= todayDate && new Date(t.due_date) <= weekAhead).length
  const budgetPct   = totalBudget > 0 ? Math.min(100, (remaining / totalBudget) * 100) : 100
  const budgetColor = budgetPct < 10 ? '#ff6b6b' : budgetPct < 30 ? '#c9a84c' : '#4ecf9e'
  const novaPct     = isUnlimited ? 100 : Math.min(100, (novaLeft / (profile.nova_messages_limit ?? 10)) * 100)

  const subtitles: Record<string, { text: string; color?: string; pct: number; barColor: string }> = {
    Study:  overdueTasks > 0 ? { text: `${overdueTasks} overdue`, color: '#ff6b6b', pct: 30, barColor: '#ff6b6b' } : tasksDueWeek > 0 ? { text: `${tasksDueWeek} due this week`, color: '#4ecf9e', pct: 70, barColor: '#4ecf9e' } : { text: 'All clear ✓', color: '#4ecf9e', pct: 100, barColor: '#4ecf9e' },
    Budget: totalBudget > 0 ? { text: remaining >= 0 ? `R${Math.round(remaining)} left` : 'Over budget', color: budgetColor, pct: Math.max(0, budgetPct), barColor: budgetColor } : { text: 'Set budget →', color: '#c9a84c', pct: 0, barColor: '#c9a84c' },
    Meals:  mealPlanExists ? { text: 'Week planned ✓', color: '#4ecf9e', pct: 90, barColor: '#4ecf9e' } : { text: 'Plan your week →', color: '#e8834a', pct: 10, barColor: '#e8834a' },
    Work:   shiftsThisWeek > 0 ? { text: `${shiftsThisWeek} shift${shiftsThisWeek > 1 ? 's' : ''} ahead`, color: '#7090d0', pct: 80, barColor: '#7090d0' } : { text: 'No shifts soon', color: 'rgba(255,255,255,0.3)', pct: 0, barColor: '#7090d0' },
    Nova:   isUnlimited ? { text: 'Unlimited', color: '#9b6fd4', pct: 100, barColor: '#9b6fd4' } : { text: `${novaLeft} msgs left`, color: novaLeft < 5 ? '#ff6b6b' : '#9b6fd4', pct: novaPct, barColor: novaLeft < 5 ? '#ff6b6b' : '#9b6fd4' },
    Groups: activeGroups > 0 ? { text: `${activeGroups} group${activeGroups > 1 ? 's' : ''}`, color: '#4ecf9e', pct: 70, barColor: '#4ecf9e' } : { text: 'Join a group →', color: 'rgba(255,255,255,0.3)', pct: 0, barColor: '#4ecf9e' },
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {FEATURE_CARDS.map(({ href, label, accent, iconBg }) => {
        const subtitle = subtitles[label]
        return (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div
              style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: 16, minHeight: 100, cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s ease, background 0.2s ease' }}
              onMouseEnter={e => { ;(e.currentTarget as HTMLElement).style.borderColor = accent + '50'; ;(e.currentTarget as HTMLElement).style.background = '#0f1016' }}
              onMouseLeave={e => { ;(e.currentTarget as HTMLElement).style.borderColor = '#1e1f2e'; ;(e.currentTarget as HTMLElement).style.background = '#0d0e14' }}
            >
              <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: accent, opacity: 0.6 }} />
              <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{FEATURE_ICONS[label]}</div>
              <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginTop: 10 }}>{label}</div>
              <div style={{ fontSize: 12, color: subtitle.color ?? accent, marginTop: 2 }}>{subtitle.text}</div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.04)' }}>
                <div className="bar-fill-anim" style={{ height: '100%', width: `${subtitle.pct}%`, background: subtitle.barColor, borderRadius: 3 }} />
              </div>
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
    <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '16px 16px 16px 20px', position: 'relative', overflow: 'hidden' }}>
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
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 48, fontWeight: 700, color: urgencyColor, lineHeight: 1 }}>{days}</div>
                <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>DAYS</div>
              </div>
            )}
          </div>
          {exams.length > 1 && (
            <div style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: 'rgba(112,144,208,0.1)', color: '#7090d0', border: '0.5px solid rgba(112,144,208,0.25)' }}>+{exams.length - 1} more</div>
          )}
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
    <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: compact ? 12 : 16 }}>
      <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: compact ? 8 : 12 }}>This Month</div>
      <div style={{ display: 'flex', flexDirection: compact ? 'column' : 'row', alignItems: 'center', gap: compact ? 6 : 16 }}>
        <div style={{ flexShrink: 0, position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ringColor} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: compact ? 11 : 16, fontWeight: 700, color: ringColor, lineHeight: 1 }}>{pct}%</div>
            {!compact && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>used</div>}
          </div>
        </div>
        <div style={{ flex: compact ? 'unset' : 1, minWidth: 0, textAlign: compact ? 'center' : 'left' }}>
          <div>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: compact ? 13 : 18, fontWeight: 700, color: '#c9a84c' }}>R{Math.round(monthSpent)}</span>
            {!compact && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}> of R{Math.round(totalBudget)}</span>}
          </div>
          {compact ? (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>of R{Math.round(totalBudget)}</div>
          ) : topCats.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
              {topCats.map(([cat, amt]) => (
                <span key={cat} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 9999, background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>
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

/* ── UpgradeCard ─────────────────────────────────────── */
function UpgradeCard() {
  return (
    <Link href="/upgrade" style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ background: 'linear-gradient(135deg,rgba(20,15,4,0.98) 0%,rgba(14,12,6,0.98) 100%)', border: '1px solid rgba(201,168,76,0.22)', borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,#c9a84c 0%,rgba(201,168,76,0.15) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>Go further with Nova</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>More messages. More tools. More you.</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {['250 msgs/mo', 'AI Meal Prep', 'Grade Calc'].map(f => (
              <span key={f} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 9999, background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.22)', color: '#c9a84c' }}>{f}</span>
            ))}
          </div>
          <div style={{ fontSize: 13, color: '#c9a84c', fontFamily: 'JetBrains Mono,monospace', marginBottom: 12 }}>From R39/month</div>
          <button style={{ width: '100%', background: 'linear-gradient(135deg,#c9a84c 0%,#e8c46a 100%)', color: '#0E0C06', fontFamily: 'Sora,sans-serif', fontWeight: 700, border: 'none', borderRadius: 10, padding: '10px 0', fontSize: 14, cursor: 'pointer' }}>
            Upgrade now →
          </button>
        </div>
      </div>
    </Link>
  )
}

/* ── UpgradeBar ─────────────────────────────────────────── */
function UpgradeBar() {
  return (
    <div style={{ margin: '16px -24px -20px', padding: '14px 24px', background: 'linear-gradient(90deg,rgba(155,111,212,0.07) 0%,rgba(201,168,76,0.07) 100%)', borderTop: '0.5px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>Unlock unlimited Nova messages</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>from R39/month</span>
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
  const now = new Date()
  const jsDay = now.getDay()
  const dbDay = jsDay === 0 ? 7 : jsDay
  const todaySlots = timetable
    .filter(s => (s.day_of_week as number) === dbDay)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))

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
const TASK_CAT_STYLE: Record<string, { bg: string; color: string }> = {
  Study:  { bg: 'rgba(26,95,106,0.2)',    color: '#1a9e75' },
  Budget: { bg: 'rgba(201,168,76,0.15)',  color: '#c9a84c' },
  Meals:  { bg: 'rgba(232,131,74,0.12)',  color: '#e8834a' },
  Work:   { bg: 'rgba(122,153,184,0.12)', color: '#7a99b8' },
}

function MobileTasksToday({ tasks, onComplete }: { tasks: Task[]; onComplete: (id: string) => void }) {
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
    <div className="block md:hidden" style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '12px 14px' }}>
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
            const catS = TASK_CAT_STYLE[modName] ?? { bg: '#1e1f2e', color: '#5a5c70' }
            return (
              <div key={task.id}>
                {i > 0 && <div style={{ height: 1, background: '#1e1f2e' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                  <button
                    onClick={() => !isDone && onComplete(task.id)}
                    aria-label="Complete task"
                    style={{ width: 14, height: 14, borderRadius: 4, border: isDone ? 'none' : '1px solid #3a3b4e', background: isDone ? '#4ecf9e' : 'transparent', flexShrink: 0, cursor: isDone ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  >
                    {isDone && <span style={{ fontSize: 9, color: '#0a0b10', lineHeight: 1 }}>✓</span>}
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

/* ── ModulePillList (desktop only) ──────────────────────── */
const MODULE_PILLS = [
  { href: '/study',            label: 'Study',  icon: '📚', iconBg: 'rgba(26,95,106,0.12)',    subColor: '#1a9e75' },
  { href: '/budget',           label: 'Budget', icon: '💰', iconBg: 'rgba(201,168,76,0.10)',   subColor: '#c9a84c' },
  { href: '/meals',            label: 'Meals',  icon: '🍲', iconBg: 'rgba(232,131,74,0.10)',   subColor: '#e8834a' },
  { href: '/dashboard/work',   label: 'Work',   icon: '💼', iconBg: 'rgba(122,153,184,0.10)',  subColor: '#7a99b8' },
  { href: '/nova',             label: 'Nova',   icon: '✨', iconBg: 'rgba(155,111,212,0.12)',  subColor: '#9b6fd4' },
  { href: '/dashboard/groups', label: 'Groups', icon: '👥', iconBg: 'rgba(112,144,208,0.10)',  subColor: '#7090d0' },
]

function ModulePillList({ tasks, totalBudget, remaining, profile, mealPlanExists, shiftsThisWeek, activeGroups }: {
  tasks: Task[]; totalBudget: number; remaining: number
  profile: Profile; mealPlanExists: boolean; shiftsThisWeek: number; activeGroups: number
}) {
  const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0)
  const weekAhead = new Date(); weekAhead.setDate(weekAhead.getDate() + 7)
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < todayDate).length
  const tasksDueWeek = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) >= todayDate && new Date(t.due_date) <= weekAhead).length
  const isUnlimited = profile.subscription_tier === 'nova_unlimited'
  const novaLeft = Math.max(0, (profile.nova_messages_limit ?? 10) - (profile.nova_messages_used ?? 0))

  const subtitles: Record<string, string> = {
    Study:  overdueTasks > 0 ? `${overdueTasks} overdue` : tasksDueWeek > 0 ? `${tasksDueWeek} due this week` : 'All clear ✓',
    Budget: totalBudget > 0 ? (remaining >= 0 ? `R${Math.round(remaining)} remaining` : 'Over budget') : 'Set budget →',
    Meals:  mealPlanExists ? 'Week planned ✓' : 'Plan your week →',
    Work:   shiftsThisWeek > 0 ? `${shiftsThisWeek} shift${shiftsThisWeek > 1 ? 's' : ''} ahead` : 'No shifts soon',
    Nova:   isUnlimited ? 'Unlimited' : `${novaLeft} msgs left`,
    Groups: activeGroups > 0 ? `${activeGroups} group${activeGroups > 1 ? 's' : ''}` : 'Join a group →',
  }

  return (
    <div className="hidden md:block" style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '10px 12px' }}>
      <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#5a5c70', marginBottom: 6, fontWeight: 600 }}>Your Modules</div>
      {MODULE_PILLS.map(({ href, label, icon, iconBg, subColor }, i) => (
        <div key={href}>
          {i > 0 && <div style={{ height: 1, background: '#1e1f2e' }} />}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2. Pending referral apply
  useEffect(() => {
    const pendingRef = localStorage.getItem('pending_ref')
    if (!pendingRef) return
    localStorage.removeItem('pending_ref')
    fetch('/api/referral', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: pendingRef }) })
      .then(r => r.json())
      .then(d => { if (d.success) import('react-hot-toast').then(({ default: toast }) => { toast.success(`Referral applied! +${d.bonusMessages} Nova messages.`) }) })
      .catch(() => {})
  }, [])

  // 3. Load proactive nova insights
  useEffect(() => {
    fetch('/api/insights').then(r => r.ok ? r.json() : null).then(d => { if (d) setNovaInsights(d.insights ?? []) }).catch(() => {})
  }, [])

  // 4. Parallel client-side fetch: meals, shifts, groups
  useEffect(() => {
    const fetchLiveData = async () => {
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
        const [mealsRes, shiftsRes, groupsRes] = await Promise.allSettled([
          supabase.from('meal_plans').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('week_start', weekStart.toISOString().split('T')[0]).lte('week_start', weekEnd.toISOString().split('T')[0]),
          supabase.from('work_shifts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('shift_date', todayStr).lte('shift_date', sevenDays.toISOString().split('T')[0]),
          supabase.from('group_members').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ])
        if (mealsRes.status === 'fulfilled') setMealPlanExists((mealsRes.value.count ?? 0) > 0)
        if (shiftsRes.status === 'fulfilled') setShiftsThisWeek(shiftsRes.value.count ?? 0)
        if (groupsRes.status === 'fulfilled') setActiveGroups(groupsRes.value.count ?? 0)
      } catch { /* silent */ }
    }
    fetchLiveData()
  }, [])

  // 5. Nova check-in — localStorage cached per day
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const cachedDate = localStorage.getItem('nova_last_checkin_date')
    const cachedMsg  = localStorage.getItem('nova_checkin_message')
    if (cachedDate === today && cachedMsg) { setNovaCheckin(cachedMsg); return }
    fetch('/api/nova/checkin')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.message) { setNovaCheckin(d.message); localStorage.setItem('nova_last_checkin_date', today); localStorage.setItem('nova_checkin_message', d.message) } })
      .catch(() => {})
  }, [])

  // 6. Exam push check (once per session)
  useEffect(() => {
    if (sessionStorage.getItem('push_checked')) return
    sessionStorage.setItem('push_checked', '1')
    fetch('/api/push/check-exams').catch(() => {})
  }, [])

  // 7. FCM push notification subscription (once per session)
  useEffect(() => {
    if (sessionStorage.getItem('fcm_init')) return
    sessionStorage.setItem('fcm_init', '1')
    const userId = initialData.profile.id
    import('@/lib/firebase-messaging').then(({ initPushNotifications }) => initPushNotifications(userId)).catch(() => {})
  }, [])

  const handleRefresh = useCallback(async () => {
    try {
      const insightsRes = await fetch('/api/insights').catch(() => null)
      if (insightsRes?.ok) { const d = await insightsRes.json(); setNovaInsights(d.insights ?? []) }
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
    store.setTasks(currentTasks.map(t => t.id === taskId ? { ...t, status: 'done' } : t))
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('tasks').update({ status: 'done' }).eq('id', taskId)
    } catch { /* silent */ }
  }, [store, initialData.tasks])

  const dismissInsight = async (id: string) => {
    setNovaInsights(prev => prev.filter(i => i.id !== id))
    await fetch('/api/insights', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
  }

  const { profile, budget, tasks, exams, modules, expenses } = store
  const p         = profile  ?? initialData.profile
  const b         = budget   ?? initialData.budget
  const allTasks  = tasks.length   ? tasks   : initialData.tasks
  const allExams  = exams.length   ? exams   : initialData.exams
  const allMods   = modules.length ? modules : initialData.modules
  const recentExp = expenses.length ? expenses : initialData.recentExpenses
  const sub       = store.subscription ?? initialData.subscription

  const baseBudget  = b ? calcTotalBudget(b) : 0
  const totalIncome = initialData.incomeEntries.reduce((s, e) => s + e.amount, 0)
  const totalBudget = baseBudget + totalIncome
  const monthSpent  = recentExp.reduce((s, e) => s + e.amount, 0)
  const remaining   = totalBudget - monthSpent
  const isPremium   = p?.is_premium || ['premium', 'scholar', 'nova_unlimited'].includes(p?.subscription_tier ?? '')
  const streakDays  = 0

  return (
    <>
      <style>{DASH_STYLES}</style>
      <div className="page-enter min-h-screen" style={{ background: '#0a0b10' }}>

        {/* Ambient orbs */}
        <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-5%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(155,111,212,0.07) 0%,transparent 70%)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '15%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(78,207,158,0.05) 0%,transparent 70%)', filter: 'blur(50px)' }} />
          <div style={{ position: 'absolute', top: '50%', left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(201,168,76,0.04) 0%,transparent 70%)', filter: 'blur(40px)' }} />
        </div>

        <PullToRefresh onRefresh={handleRefresh} />

        {/* Topbar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(10,11,16,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '0.5px solid rgba(255,255,255,0.05)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>
              {getGreeting()}, {p?.full_name?.split(' ')[0] ?? 'Student'}
            </span>
            {p?.university && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>{p.university}</span>}
          </div>
          <div style={{ fontSize: 11, padding: '4px 10px', borderRadius: 9999, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {getWeekBadge()}
          </div>
        </div>

        <div style={{ padding: '20px 24px', maxWidth: 1600, margin: '0 auto', position: 'relative', zIndex: 1 }}>

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

          {/* 3-column bento grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr] gap-4 items-start">

            {/* Column 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <NovaBanner profile={p} subscription={sub} checkinMessage={novaCheckin} />
              <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '12px 16px' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>How are you feeling?</div>
                <MoodCheckin userId={p.id} />
              </div>
              <MobileTodayClasses timetable={initialData.timetable} />
              <MobileTasksToday tasks={allTasks} onComplete={handleCompleteTask} />
              <StatCardsRow remaining={remaining} totalBudget={totalBudget} tasks={allTasks} exams={allExams} streakDays={streakDays} />
              <div className="hidden md:block"><TodaysClasses timetable={initialData.timetable} /></div>
              <div className="hidden md:block"><UrgentTasksStrip tasks={allTasks} /></div>
              <div className="md:hidden"><FeatureGrid tasks={allTasks} expenses={recentExp} totalBudget={totalBudget} remaining={remaining} modules={allMods} subscription={sub as Subscription | null} profile={p} mealPlanExists={mealPlanExists} shiftsThisWeek={shiftsThisWeek} activeGroups={activeGroups} /></div>
              <ModulePillList tasks={allTasks} totalBudget={totalBudget} remaining={remaining} profile={p} mealPlanExists={mealPlanExists} shiftsThisWeek={shiftsThisWeek} activeGroups={activeGroups} />
            </div>

            {/* Column 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {allExams.length > 0 && <ExamCountdownCard exams={allExams} />}
              <StudyTipsCard exam={allExams[0] ?? null} profile={p} />
            </div>

            {/* Column 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <BudgetRingCard monthSpent={monthSpent} totalBudget={totalBudget} expenses={recentExp} />
              <CoachSummaryCard userId={p.id} totalBudget={totalBudget} amountSpent={monthSpent} expenses={recentExp} />
            </div>
          </div>

          {!isPremium && <UpgradeBar />}
        </div>
      </div>
    </>
  )
}
