'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAppStore } from '@/store'
import PullToRefresh from '@/components/ui/PullToRefresh'
import MoodCheckin from '@/components/dashboard/MoodCheckin'
import {
  type Profile, type Budget, type Task, type Exam,
  type Module, type TimetableEntry, type Expense,
  type Subscription, MODULE_COLOURS, DAYS_OF_WEEK,
} from '@/types'
import {
  fmt, getDaysUntil, getTaskUrgency,
  calcTotalBudget, cn,
} from '@/lib/utils'

/* ── types ──────────────────────────────────────────────── */
interface NovaInsight { id: string; insight_type: string; content: string; created_at: string }
interface IncomeEntry  { id: string; source_type: string; label: string; amount: number; received_date: string; is_recurring: boolean }

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

function FlameIcon({ streak }: { streak: number }) {
  if (streak === 0) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>
  if (streak <= 2)  return <span>🔥</span>
  if (streak <= 6)  return <span style={{ color: 'var(--teal)' }}>🔥</span>
  if (streak <= 13) return <span style={{ color: 'var(--gold)' }}>🔥</span>
  return (
    <span style={{ filter: 'drop-shadow(0 0 4px rgba(201,168,76,0.4))', background: 'linear-gradient(135deg,var(--teal),var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
      🔥
    </span>
  )
}

/* ── sub-components ─────────────────────────────────────── */
function NovaCard({ profile, subscription }: { profile: Profile; subscription: Subscription | null }) {
  const msgLimit   = subscription?.monthly_message_limit ?? 10
  const msgUsed    = subscription?.messages_used_this_month ?? 0
  const remaining  = Math.max(0, msgLimit - msgUsed)
  const isUnlimited = profile?.subscription_tier === 'nova_unlimited'

  return (
    <div
      style={{
        background: 'var(--nova-bg)',
        border: '0.5px solid var(--nova-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top highlight */}
      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,rgba(130,100,255,0.7) 0%,rgba(130,100,255,0.2) 50%,transparent 100%)', pointerEvents: 'none' }} />

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Left */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Nova orb */}
          <div
            className="nova-orb flex-shrink-0"
            style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #9B7AFF 0%, #5A3DB8 60%, #3D2A8A 100%)',
            }}
          />
          <div className="min-w-0">
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--nova)' }}>Nova</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {isUnlimited ? 'Unlimited conversations' : `${remaining} msgs left this month`}
            </div>
          </div>
        </div>

        {/* Right */}
        <Link href="/nova" style={{ flexShrink: 0 }}>
          <button
            style={{
              background: 'var(--nova)', color: '#fff', border: 'none',
              borderRadius: 'var(--radius-md)', padding: '10px 18px',
              fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Chat with Nova →
          </button>
        </Link>
      </div>
    </div>
  )
}

function UrgentTasksStrip({ tasks, today }: { tasks: Task[]; today: string }) {
  const todayDate = new Date(); todayDate.setHours(0,0,0,0)

  const urgent = tasks
    .filter(t => t.status !== 'done' && t.due_date)
    .filter(t => new Date(t.due_date!) <= todayDate)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 3)

  if (!urgent.length) return null

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--danger)', fontWeight: 600 }}>Urgent</span>
        </div>
        <Link href="/study" style={{ fontSize: 12, color: 'var(--teal)', textDecoration: 'none' }}>See all →</Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {urgent.map(task => {
          const due = new Date(task.due_date!); due.setHours(0,0,0,0)
          const isToday = due.getTime() === todayDate.getTime()
          const diffDays = Math.round((todayDate.getTime() - due.getTime()) / 86400000)

          return (
            <div
              key={task.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                background: 'var(--bg-surface)',
                border: '0.5px solid var(--border-subtle)',
                borderLeft: `2px solid ${isToday ? 'var(--gold)' : 'var(--danger)'}`,
                borderRadius: `0 var(--radius-md) var(--radius-md) 0`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                {task.module && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.module.module_name}</div>
                )}
              </div>
              <span style={{
                flexShrink: 0, fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                background: isToday ? 'var(--gold-dim)' : 'var(--danger-dim)',
                color: isToday ? 'var(--gold)' : 'var(--danger)',
                border: `0.5px solid ${isToday ? 'var(--gold-border)' : 'var(--danger-border)'}`,
              }}>
                {isToday ? 'Due today' : `${diffDays}d late`}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

const FEATURE_CARDS = [
  { href: '/study',             label: 'Study',       accent: 'var(--teal)',         iconBg: 'var(--teal-dim)' },
  { href: '/budget',            label: 'Budget',      accent: 'var(--gold)',         iconBg: 'var(--gold-dim)' },
  { href: '/meals',             label: 'Meals',       accent: 'var(--meals-orange)', iconBg: 'rgba(231,122,60,0.12)' },
  { href: '/dashboard/work',    label: 'Work',        accent: 'var(--work-blue)',    iconBg: 'rgba(74,144,217,0.12)' },
  { href: '/nova',              label: 'Nova',        accent: 'var(--nova)',         iconBg: 'var(--nova-dim)' },
  { href: '/dashboard/groups',  label: 'Groups',      accent: 'var(--groups-green)', iconBg: 'rgba(80,200,120,0.12)' },
]

const FEATURE_ICONS: Record<string, string> = {
  Study: '📚', Budget: '💰', Meals: '🍲', Work: '💼', Nova: '✨', Groups: '👥',
}

function FeatureGrid({
  tasks, expenses, totalBudget, remaining, modules, subscription,
}: {
  tasks: Task[]; expenses: Expense[]; totalBudget: number; remaining: number;
  modules: Module[]; subscription: Subscription | null
}) {
  const isUnlimited = subscription?.tier === 'nova_unlimited'
  const msgLimit   = subscription?.monthly_message_limit ?? 10
  const msgUsed    = subscription?.messages_used_this_month ?? 0
  const novaLeft   = Math.max(0, msgLimit - msgUsed)

  const weekAhead = new Date(); weekAhead.setDate(weekAhead.getDate() + 7)
  const tasksDueWeek = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) <= weekAhead).length

  const subtitles: Record<string, string> = {
    Study:  tasksDueWeek > 0 ? `${tasksDueWeek} task${tasksDueWeek > 1 ? 's' : ''} due` : 'All clear',
    Budget: remaining >= 0 ? `R${Math.round(remaining)} left` : 'Over budget',
    Meals:  'Plan your week',
    Work:   'Track shifts',
    Nova:   isUnlimited ? 'Unlimited' : `${novaLeft} msgs left`,
    Groups: `${modules.length} module${modules.length !== 1 ? 's' : ''}`,
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {FEATURE_CARDS.map(({ href, label, accent, iconBg }) => (
        <Link
          key={href}
          href={href}
          style={{ textDecoration: 'none' }}
        >
          <div
            className="card-base"
            style={{ padding: 16, minHeight: 100, cursor: 'pointer' }}
          >
            {/* Left accent bar (visible on hover via CSS — simplified: always visible at 40% on cards) */}
            <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: accent, borderRadius: '2px 0 0 2px', opacity: 0.5 }} />

            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              {FEATURE_ICONS[label]}
            </div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 10 }}>{label}</div>
            <div style={{ fontSize: 12, color: accent, marginTop: 2 }}>{subtitles[label]}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function HeroStatsCard({
  profile, remaining, totalBudget, tasks, exams, streakDays,
}: {
  profile: Profile; remaining: number; totalBudget: number;
  tasks: Task[]; exams: Exam[]; streakDays: number
}) {
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date())
  const tasksDueWeek = tasks.filter(t => {
    const wk = new Date(); wk.setDate(wk.getDate() + 7)
    return t.status !== 'done' && t.due_date && new Date(t.due_date) <= wk
  }).length

  const nextExam = exams[0]
  const daysToExam = nextExam ? getDaysUntil(nextExam.exam_date) : null

  return (
    <div
      style={{
        background: 'var(--bg-hero)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top highlight */}
      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,rgba(0,181,150,0.5) 0%,rgba(0,181,150,0.1) 40%,transparent 70%)', pointerEvents: 'none' }} />
      {/* Ambient glows */}
      <span style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 15% 25%,rgba(0,181,150,0.07) 0%,transparent 55%),radial-gradient(ellipse at 85% 75%,rgba(201,168,76,0.05) 0%,transparent 45%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Name + greeting */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            {getGreeting()}, {profile?.full_name?.split(' ')[0] ?? 'Student'} 🌱
          </div>
          {profile?.university && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{profile.university}</div>
          )}
        </div>

        {/* Stats 2×2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            {
              value: remaining >= 0 ? `R${Math.round(remaining)}` : `−R${Math.round(Math.abs(remaining))}`,
              label: 'Budget left',
              color: remaining >= 0 ? 'var(--gold)' : 'var(--danger)',
            },
            {
              value: daysToExam !== null ? (daysToExam === 0 ? 'TODAY' : daysToExam < 0 ? 'Done' : String(daysToExam)) : '—',
              label: 'Days to exam',
              color: 'var(--exam-blue)',
            },
            {
              value: String(tasksDueWeek),
              label: 'Tasks this week',
              color: 'var(--teal)',
            },
            {
              value: String(streakDays),
              label: 'Study streak',
              color: 'var(--teal)',
              suffix: <FlameIcon streak={streakDays} />,
            },
          ].map(({ value, label, color, suffix }) => (
            <div key={label} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 22, fontWeight: 700, color }}>
                {value} {suffix}
              </div>
              <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-label)', marginTop: 2 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Overdue warning */}
        {overdueTasks.length > 0 && (
          <div style={{
            marginTop: 12, background: 'var(--danger-dim)', border: '0.5px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)', padding: '8px 12px',
            fontSize: 12, color: 'var(--danger)',
          }}>
            ⚠ {overdueTasks.length} task{overdueTasks.length > 1 ? 's' : ''} overdue
          </div>
        )}
      </div>
    </div>
  )
}

function ExamCountdownCard({ exams }: { exams: Exam[] }) {
  const next = exams[0]
  if (!next) return null

  const days = getDaysUntil(next.exam_date)
  const urgencyColor = days <= 1 ? 'var(--danger)' : days <= 3 ? 'var(--gold)' : 'var(--exam-blue)'

  return (
    <div
      style={{
        background: 'linear-gradient(135deg,rgba(100,149,237,0.07) 0%,rgba(60,100,200,0.03) 100%)',
        border: '0.5px solid var(--exam-blue-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 16px 16px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span style={{ position: 'absolute', left: 0, top: 16, bottom: 16, width: 2, background: 'var(--exam-blue)', borderRadius: '0 1px 1px 0' }} />

      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-label)', marginBottom: 6 }}>Next Exam</div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{next.exam_name}</div>
      {next.module && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{next.module.module_name}</div>}
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
        {fmt.dateFull(next.exam_date)}
        {next.start_time && ` · ${fmt.time(next.start_time)}`}
        {next.venue && ` · ${next.venue}`}
      </div>

      <div style={{ marginTop: 10, textAlign: 'right' }}>
        {days < 0 ? (
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 22, fontWeight: 700, color: 'var(--text-tertiary)' }}>Done</div>
        ) : days === 0 ? (
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 18, fontWeight: 700, color: 'var(--danger)' }}>TODAY</div>
        ) : (
          <>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 36, fontWeight: 700, color: urgencyColor, lineHeight: 1 }}>{days}</div>
            <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-label)', marginTop: 2 }}>DAYS</div>
          </>
        )}
      </div>

      {exams.length > 1 && (
        <div style={{
          marginTop: 8, display: 'inline-block', fontSize: 11, padding: '2px 8px',
          borderRadius: 'var(--radius-pill)', background: 'var(--exam-blue-dim)', color: 'var(--exam-blue)',
        }}>
          +{exams.length - 1} more
        </div>
      )}
    </div>
  )
}

function BudgetPreviewCard({ monthSpent, totalBudget, expenses }: { monthSpent: number; totalBudget: number; expenses: Expense[] }) {
  const pct = totalBudget > 0 ? Math.min(100, Math.round((monthSpent / totalBudget) * 100)) : 0
  const barColor = pct > 85 ? 'var(--danger)' : pct > 60 ? 'var(--gold)' : 'var(--teal)'

  const catMap: Record<string, number> = {}
  expenses.forEach(e => { catMap[e.category] = (catMap[e.category] ?? 0) + e.amount })
  const topCats = Object.entries(catMap).sort((a,b) => b[1]-a[1]).slice(0, 3)

  return (
    <div style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-label)', marginBottom: 8 }}>This Month</div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>R{Math.round(monthSpent)}</span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}> of R{Math.round(totalBudget)}</span>
        </div>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{pct}%</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
        <div
          className="progress-bar-fill"
          style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3 }}
        />
      </div>

      {/* Category pills */}
      {topCats.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {topCats.map(([cat, amt]) => (
            <span key={cat} style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 'var(--radius-pill)',
              background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}>
              {cat} · R{Math.round(amt)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function UpgradeCard() {
  return (
    <Link href="/upgrade" style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: 'linear-gradient(135deg,#140F04 0%,#0E0C06 100%)',
        border: '0.5px solid var(--gold-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,var(--gold) 0%,rgba(201,168,76,0.2) 60%,transparent 100%)' }} />

        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
          Go further with Nova
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
          More messages. More tools. More you.
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {['250 msgs/mo', 'Meal AI', 'Priority support'].map(f => (
            <span key={f} style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-pill)',
              background: 'var(--gold-dim)', border: '0.5px solid var(--gold-border)', color: 'var(--gold)',
            }}>{f}</span>
          ))}
        </div>

        <div style={{ fontSize: 14, color: 'var(--gold)', fontFamily: 'JetBrains Mono,monospace', marginBottom: 10 }}>From R39/month</div>

        <button style={{
          width: '100%', background: 'linear-gradient(135deg,var(--gold) 0%,var(--gold-bright) 100%)',
          color: '#0E0C06', fontWeight: 700, border: 'none', borderRadius: 'var(--radius-md)',
          padding: '10px 0', fontSize: 14, cursor: 'pointer',
        }}>
          Upgrade now →
        </button>
      </div>
    </Link>
  )
}

/* ── main component ─────────────────────────────────────── */
export default function DashboardClient({ initialData }: DashboardClientProps) {
  const store = useAppStore()
  const [novaInsights, setNovaInsights] = useState<NovaInsight[]>([])

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

  // Apply pending referral on first load
  useEffect(() => {
    const pendingRef = localStorage.getItem('pending_ref')
    if (!pendingRef) return
    localStorage.removeItem('pending_ref')
    fetch('/api/referral', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: pendingRef }) })
      .then(r => r.json())
      .then(d => { if (d.success) import('react-hot-toast').then(({ default: toast }) => { toast.success(`Referral applied! +${d.bonusMessages} Nova messages.`) }) })
      .catch(() => {})
  }, [])

  // Load proactive insights
  useEffect(() => {
    fetch('/api/insights').then(r => r.ok ? r.json() : null).then(d => { if (d) setNovaInsights(d.insights ?? []) }).catch(() => {})
  }, [])

  // Exam push check (once per session)
  useEffect(() => {
    if (sessionStorage.getItem('push_checked')) return
    sessionStorage.setItem('push_checked', '1')
    fetch('/api/push/check-exams').catch(() => {})
  }, [])

  // FCM push notification subscription (once per session, after auth)
  useEffect(() => {
    if (sessionStorage.getItem('fcm_init')) return
    sessionStorage.setItem('fcm_init', '1')
    const userId = initialData.profile.id
    import('@/lib/firebase-messaging')
      .then(({ initPushNotifications }) => initPushNotifications(userId))
      .catch(() => {})
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
      if (exams) store.setExams(exams)
    } catch { /* silent */ }
  }, [store])

  const dismissInsight = async (id: string) => {
    setNovaInsights(prev => prev.filter(i => i.id !== id))
    await fetch('/api/insights', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
  }

  const { profile, budget, tasks, exams, modules, expenses } = store
  const p          = profile ?? initialData.profile
  const b          = budget  ?? initialData.budget
  const allTasks   = tasks.length   ? tasks   : initialData.tasks
  const allExams   = exams.length   ? exams   : initialData.exams
  const allMods    = modules.length ? modules : initialData.modules
  const recentExp  = expenses.length ? expenses : initialData.recentExpenses
  const sub        = store.subscription ?? initialData.subscription

  const baseBudget  = b ? calcTotalBudget(b) : 0
  const totalIncome = initialData.incomeEntries.reduce((s, e) => s + e.amount, 0)
  const totalBudget = baseBudget + totalIncome
  const monthSpent  = recentExp.reduce((s, e) => s + e.amount, 0)
  const remaining   = totalBudget - monthSpent

  const isPremium   = p?.is_premium || ['premium', 'scholar', 'nova_unlimited'].includes(p?.subscription_tier ?? '')
  const streakDays  = 0 // streak API not yet wired to dashboard state — default 0

  const todayDateStr = new Date().toDateString()

  return (
    <div className="page-enter min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <PullToRefresh onRefresh={handleRefresh} />

      {/* Page padding — desktop: sidebar already handles left margin */}
      <div style={{ padding: '24px 24px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Nova proactive insights (full-width, above grid) */}
        {novaInsights.map(insight => (
          <div
            key={insight.id}
            className="animate-fade-up"
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              background: 'var(--nova-dim)', border: '0.5px solid var(--nova-border)',
              borderRadius: 'var(--radius-lg)', padding: '12px 16px',
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 20, flexShrink: 0 }}>
              {{ study_nudge: '📚', budget_warning: '💰', stress_alert: '💙' }[insight.insight_type] ?? '🌟'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nova)', marginBottom: 4 }}>Nova</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{insight.content}</div>
            </div>
            <button
              onClick={() => dismissInsight(insight.id)}
              aria-label="Dismiss insight"
              style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: 0 }}
            >
              ✕
            </button>
          </div>
        ))}

        {/* Two-column layout on desktop */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <NovaCard profile={p} subscription={sub} />
            <MoodCheckin userId={p.id} />
            <UrgentTasksStrip tasks={allTasks} today={todayDateStr} />
            <FeatureGrid
              tasks={allTasks}
              expenses={recentExp}
              totalBudget={totalBudget}
              remaining={remaining}
              modules={allMods}
              subscription={sub as any}
            />
          </div>

          {/* ── RIGHT COLUMN (desktop only, sticky) ── */}
          <div
            className="hidden lg:flex flex-col gap-4"
            style={{ width: 320, flexShrink: 0, position: 'sticky', top: 24, alignSelf: 'flex-start' }}
          >
            <HeroStatsCard
              profile={p}
              remaining={remaining}
              totalBudget={totalBudget}
              tasks={allTasks}
              exams={allExams}
              streakDays={streakDays}
            />
            {allExams.length > 0 && <ExamCountdownCard exams={allExams} />}
            <BudgetPreviewCard monthSpent={monthSpent} totalBudget={totalBudget} expenses={recentExp} />
            {!isPremium && <UpgradeCard />}
          </div>
        </div>

        {/* Mobile: stats + exam + budget stacked below feature grid */}
        <div className="lg:hidden mt-4 flex flex-col gap-4">
          <HeroStatsCard
            profile={p}
            remaining={remaining}
            totalBudget={totalBudget}
            tasks={allTasks}
            exams={allExams}
            streakDays={streakDays}
          />
          {allExams.length > 0 && <ExamCountdownCard exams={allExams} />}
          <BudgetPreviewCard monthSpent={monthSpent} totalBudget={totalBudget} expenses={recentExp} />
          {!isPremium && <UpgradeCard />}
        </div>
      </div>
    </div>
  )
}
