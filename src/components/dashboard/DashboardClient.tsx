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
import {
  fmt, getDaysUntil,
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

/* ── CSS animations injected once ───────────────────────── */
const DASH_STYLES = `
@keyframes novaOrbPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.3), 0 0 24px rgba(45,74,34,0.4); }
  50%       { box-shadow: 0 0 0 8px rgba(201,168,76,0), 0 0 40px rgba(45,74,34,0.6); }
}
@keyframes dotGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(231,76,76,0.6); }
  50%       { box-shadow: 0 0 0 5px rgba(231,76,76,0); }
}
@keyframes barFill {
  from { width: 0%; }
}
@keyframes dashFadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.nova-orb-gold  { animation: novaOrbPulse 3s ease-in-out infinite; }
.dot-urgent     { animation: dotGlow 1.8s ease-in-out infinite; }
.bar-fill-anim  { animation: barFill 1s ease-out both; }
.dash-card-in   { animation: dashFadeUp 0.35s ease-out both; }
`

/* ── sub-components ─────────────────────────────────────── */
function NovaBanner({
  profile, subscription, checkinMessage,
}: {
  profile: Profile; subscription: Subscription | null; checkinMessage: string | null
}) {
  const msgLimit    = profile.nova_messages_limit ?? 10
  const msgUsed     = profile.nova_messages_used ?? 0
  const remaining   = Math.max(0, msgLimit - msgUsed)
  const isUnlimited = profile?.subscription_tier === 'nova_unlimited'
  const tier        = profile?.subscription_tier || profile?.plan || 'free'

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(45,74,34,0.55) 0%, rgba(10,15,30,0.9) 100%)',
      border: '1px solid rgba(201,168,76,0.18)',
      borderRadius: 16,
      padding: '20px 22px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,#C9A84C 0%,rgba(201,168,76,0.2) 50%,transparent 100%)', pointerEvents: 'none' }} />
      <span style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 10% 50%,rgba(45,74,34,0.3) 0%,transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              className="nova-orb-gold"
              style={{
                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                background: 'radial-gradient(circle at 35% 35%,#C9A84C 0%,#2D4A22 55%,#1a3015 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: '#fff',
              }}
            >
              ✦
            </div>
            <div>
              <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 16, color: '#C9A84C', letterSpacing: '-0.01em' }}>Nova</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                {isUnlimited ? 'Unlimited conversations' : `${remaining} msgs left this month`}
              </div>
              {tier !== 'free' && (
                <div style={{ fontSize: 10, color: '#C9A84C', marginTop: 2, textTransform: 'capitalize', letterSpacing: '0.05em' }}>
                  {tier.replace('_', ' ')} plan
                </div>
              )}
            </div>
          </div>

          <Link href="/nova">
            <button style={{
              background: 'linear-gradient(135deg,#C9A84C 0%,#E8C46A 100%)',
              color: '#0a0f1e', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13,
              border: 'none', borderRadius: 10, padding: '9px 16px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              Chat with Nova →
            </button>
          </Link>
        </div>

        {checkinMessage && (
          <div style={{
            marginTop: 14,
            background: 'rgba(201,168,76,0.07)',
            border: '0.5px solid rgba(201,168,76,0.2)',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>💜</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 3 }}>Nova Check-in</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{checkinMessage}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCardsRow({
  profile, remaining, totalBudget, tasks, exams, streakDays,
}: {
  profile: Profile; remaining: number; totalBudget: number;
  tasks: Task[]; exams: Exam[]; streakDays: number
}) {
  const todayDate = new Date(); todayDate.setHours(0,0,0,0)
  const weekAhead = new Date(); weekAhead.setDate(weekAhead.getDate() + 7)
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < todayDate).length
  const tasksDueWeek = tasks.filter(t =>
    t.status !== 'done' && t.due_date && new Date(t.due_date) >= todayDate && new Date(t.due_date) <= weekAhead
  ).length

  const nextExam = exams[0]
  const daysToExam = nextExam ? getDaysUntil(nextExam.exam_date) : null

  const cards = [
    {
      value: remaining >= 0 ? `R${Math.round(remaining)}` : `−R${Math.round(Math.abs(remaining))}`,
      label: 'Budget left',
      accent: remaining >= 0 ? '#C9A84C' : 'var(--danger)',
    },
    {
      value: daysToExam !== null ? (daysToExam <= 0 ? 'TODAY' : String(daysToExam)) : '—',
      label: 'Days to exam',
      accent: '#6495ED',
    },
    {
      value: String(tasksDueWeek + overdueTasks),
      label: overdueTasks > 0 ? `${overdueTasks} overdue` : 'Tasks ahead',
      accent: overdueTasks > 0 ? 'var(--danger)' : 'var(--teal)',
    },
    {
      value: String(streakDays),
      label: 'Study streak',
      accent: 'var(--teal)',
      suffix: <FlameIcon streak={streakDays} />,
    },
  ]

  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }} className="scrollbar-none">
      {cards.map(({ value, label, accent, suffix }, i) => (
        <div
          key={label}
          className="dash-card-in"
          style={{
            flexShrink: 0,
            minWidth: 110,
            flex: '1 0 110px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '14px 14px 12px',
            position: 'relative',
            overflow: 'hidden',
            animationDelay: `${i * 0.06}s`,
          }}
        >
          <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent, borderRadius: '14px 14px 0 0', opacity: 0.9 }} />
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 22, fontWeight: 700, color: accent, lineHeight: 1 }}>
            {value}{suffix && <span style={{ marginLeft: 4 }}>{suffix}</span>}
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', marginTop: 6 }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}

function TodaysClasses({ timetable }: { timetable: TimetableEntry[] }) {
  const now = new Date()
  const jsDay = now.getDay()
  const dbDay = jsDay === 0 ? 7 : jsDay

  const todaySlots = timetable
    .filter(s => (s.day_of_week as number) === dbDay)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))

  if (!todaySlots.length) return null

  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const displaySlots = todaySlots.slice(0, 3)
  const hasMore = todaySlots.length > 3

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--teal)', fontWeight: 600 }}>Today&apos;s Classes</span>
        </div>
        <Link href="/study/timetable" style={{ fontSize: 12, color: 'var(--teal)', textDecoration: 'none' }}>See full timetable →</Link>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {displaySlots.map(slot => {
          const isNow = slot.start_time && slot.end_time
            ? currentTime >= slot.start_time && currentTime <= slot.end_time
            : false
          const colour = (slot.module as Module | undefined)?.color ?? (slot.module as Module | undefined)?.colour ?? '#0d9488'
          const moduleName = (slot.module as Module | undefined)?.module_name || 'Class'

          return (
            <div
              key={slot.id}
              style={{
                flexShrink: 0,
                minWidth: 140,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${isNow ? colour + '60' : 'rgba(255,255,255,0.08)'}`,
                borderLeft: `2px solid ${colour}`,
                borderRadius: `0 var(--radius-md) var(--radius-md) 0`,
                position: 'relative',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              {isNow && (
                <span style={{
                  position: 'absolute', top: 6, right: 8,
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                  color: colour, textTransform: 'uppercase',
                }}>NOW</span>
              )}
              <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: isNow ? 32 : 0 }}>
                {moduleName}
              </div>
              {(slot.start_time || slot.venue) && (
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {slot.start_time && `${slot.start_time}${slot.end_time ? ` – ${slot.end_time}` : ''}`}
                  {slot.venue && ` · ${slot.venue}`}
                </div>
              )}
            </div>
          )
        })}
        {hasMore && (
          <Link href="/study/timetable" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--teal)', padding: '10px 12px', whiteSpace: 'nowrap' }}>
              +{todaySlots.length - 3} more →
            </div>
          </Link>
        )}
      </div>
    </section>
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
    <section style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: '12px 14px',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="dot-urgent"
            style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block', flexShrink: 0 }}
          />
          <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--danger)', fontWeight: 600 }}>Urgent</span>
        </div>
        <Link href="/study" style={{ fontSize: 12, color: 'var(--teal)', textDecoration: 'none' }}>See all →</Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                background: 'rgba(255,255,255,0.03)',
                border: '0.5px solid rgba(255,255,255,0.07)',
                borderLeft: `2px solid ${isToday ? '#C9A84C' : 'var(--danger)'}`,
                borderRadius: `0 10px 10px 0`,
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
  { href: '/budget',            label: 'Budget',      accent: '#C9A84C',             iconBg: 'rgba(201,168,76,0.1)' },
  { href: '/meals',             label: 'Meals',       accent: 'var(--meals-orange)', iconBg: 'rgba(231,122,60,0.12)' },
  { href: '/dashboard/work',    label: 'Work',        accent: 'var(--work-blue)',    iconBg: 'rgba(74,144,217,0.12)' },
  { href: '/nova',              label: 'Nova',        accent: 'var(--nova)',         iconBg: 'var(--nova-dim)' },
  { href: '/dashboard/groups',  label: 'Groups',      accent: 'var(--groups-green)', iconBg: 'rgba(80,200,120,0.12)' },
]

const FEATURE_ICONS: Record<string, string> = {
  Study: '📚', Budget: '💰', Meals: '🍲', Work: '💼', Nova: '✨', Groups: '👥',
}

function FeatureGrid({
  tasks, expenses, totalBudget, remaining, modules, subscription, profile,
  mealPlanExists, shiftsThisWeek, activeGroups,
}: {
  tasks: Task[]; expenses: Expense[]; totalBudget: number; remaining: number;
  modules: Module[]; subscription: Subscription | null; profile: Profile;
  mealPlanExists: boolean; shiftsThisWeek: number; activeGroups: number;
}) {
  const _unused = cn(modules.length, subscription)
  const isUnlimited = profile.subscription_tier === 'nova_unlimited'
  const msgLimit   = profile.nova_messages_limit ?? 10
  const msgUsed    = profile.nova_messages_used ?? 0
  const novaLeft   = Math.max(0, msgLimit - msgUsed)

  const todayDate = new Date(); todayDate.setHours(0,0,0,0)
  const weekAhead = new Date(); weekAhead.setDate(weekAhead.getDate() + 7)

  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < todayDate).length
  const tasksDueWeek = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) >= todayDate && new Date(t.due_date) <= weekAhead).length

  const budgetPct   = totalBudget > 0 ? Math.min(100, (remaining / totalBudget) * 100) : 100
  const budgetColor = budgetPct < 10 ? 'var(--danger)' : budgetPct < 30 ? '#C9A84C' : 'var(--teal)'
  const novaPct     = isUnlimited ? 100 : Math.min(100, (novaLeft / (profile.nova_messages_limit ?? 10)) * 100)

  const subtitles: Record<string, { text: string; color?: string; pct: number; barColor: string }> = {
    Study: overdueTasks > 0
      ? { text: `${overdueTasks} overdue`, color: 'var(--danger)', pct: 30, barColor: 'var(--danger)' }
      : tasksDueWeek > 0
        ? { text: `${tasksDueWeek} due this week`, color: 'var(--teal)', pct: 70, barColor: 'var(--teal)' }
        : { text: 'All clear ✓', color: 'var(--teal)', pct: 100, barColor: 'var(--teal)' },
    Budget: totalBudget > 0
      ? { text: remaining >= 0 ? `R${Math.round(remaining)} left` : 'Over budget', color: budgetColor, pct: Math.max(0, budgetPct), barColor: budgetColor }
      : { text: 'Set budget →', color: '#C9A84C', pct: 0, barColor: '#C9A84C' },
    Meals: mealPlanExists
      ? { text: 'Week planned ✓', color: 'var(--teal)', pct: 90, barColor: 'var(--teal)' }
      : { text: 'Plan your week →', color: 'var(--meals-orange)', pct: 10, barColor: 'var(--meals-orange)' },
    Work: shiftsThisWeek > 0
      ? { text: `${shiftsThisWeek} shift${shiftsThisWeek > 1 ? 's' : ''} ahead`, color: 'var(--work-blue)', pct: 80, barColor: 'var(--work-blue)' }
      : { text: 'No shifts soon', color: 'var(--text-tertiary)', pct: 0, barColor: 'var(--work-blue)' },
    Nova: isUnlimited
      ? { text: 'Unlimited', color: 'var(--nova)', pct: 100, barColor: 'var(--nova)' }
      : { text: `${novaLeft} msgs left`, color: novaLeft < 5 ? 'var(--danger)' : 'var(--nova)', pct: novaPct, barColor: novaLeft < 5 ? 'var(--danger)' : 'var(--nova)' },
    Groups: activeGroups > 0
      ? { text: `${activeGroups} group${activeGroups > 1 ? 's' : ''}`, color: 'var(--groups-green)', pct: 70, barColor: 'var(--groups-green)' }
      : { text: 'Join a group →', color: 'var(--text-tertiary)', pct: 0, barColor: 'var(--groups-green)' },
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {FEATURE_CARDS.map(({ href, label, accent, iconBg }) => {
        const subtitle = subtitles[label]
        return (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: 16,
                minHeight: 100,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.2s ease, background 0.2s ease',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
              }}
            >
              <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: accent, borderRadius: '2px 0 0 2px', opacity: 0.6 }} />
              <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {FEATURE_ICONS[label]}
              </div>
              <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 10 }}>{label}</div>
              <div style={{ fontSize: 12, color: subtitle.color ?? accent, marginTop: 2 }}>{subtitle.text}</div>

              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.05)' }}>
                <div
                  className="bar-fill-anim"
                  style={{ height: '100%', width: `${subtitle.pct}%`, background: subtitle.barColor, borderRadius: 3 }}
                />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function ExamCountdownCard({ exams }: { exams: Exam[] }) {
  const next = exams[0]
  if (!next) return null

  const days = getDaysUntil(next.exam_date)
  const urgencyColor = days <= 1 ? 'var(--danger)' : days <= 3 ? '#C9A84C' : '#6495ED'

  return (
    <div style={{
      background: 'linear-gradient(135deg,rgba(10,15,44,0.9) 0%,rgba(6,12,36,0.95) 100%)',
      border: '1px solid rgba(100,149,237,0.2)',
      borderRadius: 14,
      padding: '16px 16px 16px 20px',
      position: 'relative',
      overflow: 'hidden',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      <span style={{ position: 'absolute', left: 0, top: 16, bottom: 16, width: 2, background: '#6495ED', borderRadius: '0 1px 1px 0' }} />
      <span style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 20%,rgba(100,149,237,0.08) 0%,transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', marginBottom: 6 }}>Next Exam</div>
        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{next.exam_name}</div>
        {next.module && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{next.module.module_name}</div>}
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
          {fmt.dateFull(next.exam_date)}
          {next.start_time && ` · ${fmt.time(next.start_time)}`}
          {next.venue && ` · ${next.venue}`}
        </div>

        <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            {days < 0 ? (
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 48, fontWeight: 700, color: 'rgba(255,255,255,0.3)', lineHeight: 1 }}>✓</div>
            ) : days === 0 ? (
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 28, fontWeight: 700, color: 'var(--danger)', lineHeight: 1 }}>TODAY</div>
            ) : (
              <div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 48, fontWeight: 700, color: urgencyColor, lineHeight: 1 }}>{days}</div>
                <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>DAYS</div>
              </div>
            )}
          </div>
          {exams.length > 1 && (
            <div style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 9999,
              background: 'rgba(100,149,237,0.1)', color: '#6495ED',
              border: '0.5px solid rgba(100,149,237,0.25)',
            }}>
              +{exams.length - 1} more
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BudgetRingCard({ monthSpent, totalBudget, expenses, compact = false }: {
  monthSpent: number; totalBudget: number; expenses: Expense[]; compact?: boolean
}) {
  const pct       = totalBudget > 0 ? Math.min(100, Math.round((monthSpent / totalBudget) * 100)) : 0
  const ringColor = pct > 85 ? 'var(--danger)' : pct > 60 ? '#C9A84C' : 'var(--teal)'

  const r    = compact ? 26 : 38
  const size = compact ? 64 : 96
  const sw   = compact ? 6 : 8
  const circ   = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)

  const catMap: Record<string, number> = {}
  expenses.forEach(e => { catMap[e.category] = (catMap[e.category] ?? 0) + e.amount })
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 3)

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: compact ? 12 : 16,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', marginBottom: compact ? 8 : 12 }}>This Month</div>

      <div style={{ display: 'flex', flexDirection: compact ? 'column' : 'row', alignItems: 'center', gap: compact ? 6 : 16 }}>
        <div style={{ flexShrink: 0, position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
            <circle
              cx={size/2} cy={size/2} r={r} fill="none"
              stroke={ringColor} strokeWidth={sw}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              className="ring-fill-animated"
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: compact ? 11 : 16, fontWeight: 700, color: ringColor, lineHeight: 1 }}>{pct}%</div>
            {!compact && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>used</div>}
          </div>
        </div>

        <div style={{ flex: compact ? 'unset' : 1, minWidth: 0, textAlign: compact ? 'center' : 'left' }}>
          <div style={{ lineHeight: compact ? 1.3 : 1 }}>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: compact ? 13 : 18, fontWeight: 700, color: '#C9A84C' }}>R{Math.round(monthSpent)}</span>
            {!compact && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}> of R{Math.round(totalBudget)}</span>}
          </div>
          {compact ? (
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>of R{Math.round(totalBudget)}</div>
          ) : topCats.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
              {topCats.map(([cat, amt]) => (
                <span key={cat} style={{
                  fontSize: 10, padding: '3px 8px', borderRadius: 9999,
                  background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.55)',
                }}>
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

function UpgradeCard() {
  return (
    <Link href="/upgrade" style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: 'linear-gradient(135deg,rgba(20,15,4,0.95) 0%,rgba(14,12,6,0.95) 100%)',
        border: '1px solid rgba(201,168,76,0.25)',
        borderRadius: 14,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,#C9A84C 0%,rgba(201,168,76,0.2) 60%,transparent 100%)' }} />
        <span style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 90% 10%,rgba(201,168,76,0.07) 0%,transparent 50%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
            Go further with Nova
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>
            More messages. More tools. More you.
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {['250 msgs/mo', 'AI Meal Prep', 'Grade Calc', 'Priority support'].map(f => (
              <span key={f} style={{
                fontSize: 10, padding: '3px 9px', borderRadius: 9999,
                background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.25)', color: '#C9A84C',
              }}>{f}</span>
            ))}
          </div>

          <div style={{ fontSize: 13, color: '#C9A84C', fontFamily: 'JetBrains Mono,monospace', marginBottom: 12 }}>From R39/month</div>

          <button style={{
            width: '100%', background: 'linear-gradient(135deg,#C9A84C 0%,#E8C46A 100%)',
            color: '#0E0C06', fontFamily: 'Sora,sans-serif', fontWeight: 700, border: 'none', borderRadius: 10,
            padding: '10px 0', fontSize: 14, cursor: 'pointer',
          }}>
            Upgrade now →
          </button>
        </div>
      </div>
    </Link>
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

  // Parallel client-side fetch: meals, shifts, groups
  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const now = new Date()
        const jsDay = now.getDay()
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - jsDay + (jsDay === 0 ? -6 : 1))
        weekStart.setHours(0, 0, 0, 0)
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)
        const weekStartStr = weekStart.toISOString().split('T')[0]
        const weekEndStr = weekEnd.toISOString().split('T')[0]
        const todayStr = now.toISOString().split('T')[0]
        const sevenDays = new Date(now); sevenDays.setDate(now.getDate() + 7)
        const sevenDaysStr = sevenDays.toISOString().split('T')[0]

        const [mealsRes, shiftsRes, groupsRes] = await Promise.allSettled([
          supabase.from('meal_plans').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('week_start', weekStartStr).lte('week_start', weekEndStr),
          supabase.from('work_shifts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('shift_date', todayStr).lte('shift_date', sevenDaysStr),
          supabase.from('group_members').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ])

        if (mealsRes.status === 'fulfilled') setMealPlanExists((mealsRes.value.count ?? 0) > 0)
        if (shiftsRes.status === 'fulfilled') setShiftsThisWeek(shiftsRes.value.count ?? 0)
        if (groupsRes.status === 'fulfilled') setActiveGroups(groupsRes.value.count ?? 0)
      } catch { /* silent */ }
    }
    fetchLiveData()
  }, [])

  // Nova check-in — localStorage cached per day
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const cachedDate = localStorage.getItem('nova_last_checkin_date')
    const cachedMsg  = localStorage.getItem('nova_checkin_message')

    if (cachedDate === today && cachedMsg) {
      setNovaCheckin(cachedMsg)
      return
    }

    fetch('/api/nova/checkin')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.message) {
          setNovaCheckin(d.message)
          localStorage.setItem('nova_last_checkin_date', today)
          localStorage.setItem('nova_checkin_message', d.message)
        }
      })
      .catch(() => {})
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

  const isPremium  = p?.is_premium || ['premium', 'scholar', 'nova_unlimited'].includes(p?.subscription_tier ?? '')
  const streakDays = 0

  const todayDateStr = new Date().toDateString()

  return (
    <>
      <style>{DASH_STYLES}</style>

      <div
        className="page-enter min-h-screen"
        style={{ background: 'linear-gradient(135deg,#0a0f1e 0%,#0d1a2e 40%,#0f1a10 100%)' }}
      >
        {/* Ambient orbs */}
        <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(45,74,34,0.25) 0%,transparent 70%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', top: '40%', right: '-8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(10,15,44,0.6) 0%,transparent 70%)', filter: 'blur(50px)' }} />
          <div style={{ position: 'absolute', bottom: '10%', left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(201,168,76,0.08) 0%,transparent 70%)', filter: 'blur(40px)' }} />
        </div>

        <PullToRefresh onRefresh={handleRefresh} />

        <div style={{ padding: '24px 24px', maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Greeting */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em' }}>
              {getGreeting()}, {p?.full_name?.split(' ')[0] ?? 'Student'} 🌱
            </div>
            {p?.university && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{p.university}</div>
            )}
          </div>

          {/* Nova proactive insights */}
          {novaInsights.map(insight => (
            <div
              key={insight.id}
              className="animate-fade-up"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                background: 'var(--nova-dim)', border: '0.5px solid var(--nova-border)',
                borderRadius: 12, padding: '12px 16px', marginBottom: 12,
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

          {/* Two-column layout */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

            {/* ── LEFT COLUMN ── */}
            <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <NovaBanner profile={p} subscription={sub} checkinMessage={novaCheckin} />
              <StatCardsRow
                profile={p}
                remaining={remaining}
                totalBudget={totalBudget}
                tasks={allTasks}
                exams={allExams}
                streakDays={streakDays}
              />
              <MoodCheckin userId={p.id} />
              <TodaysClasses timetable={initialData.timetable} />
              <UrgentTasksStrip tasks={allTasks} today={todayDateStr} />
              <FeatureGrid
                tasks={allTasks}
                expenses={recentExp}
                totalBudget={totalBudget}
                remaining={remaining}
                modules={allMods}
                subscription={sub as Subscription | null}
                profile={p}
                mealPlanExists={mealPlanExists}
                shiftsThisWeek={shiftsThisWeek}
                activeGroups={activeGroups}
              />
            </div>

            {/* ── RIGHT COLUMN (desktop only, sticky) ── */}
            <div
              className="hidden lg:flex flex-col gap-4"
              style={{ width: 320, flexShrink: 0, position: 'sticky', top: 24, alignSelf: 'flex-start' }}
            >
              {allExams.length > 0 && <ExamCountdownCard exams={allExams} />}
              <BudgetRingCard monthSpent={monthSpent} totalBudget={totalBudget} expenses={recentExp} />
              {!isPremium && <UpgradeCard />}
            </div>
          </div>

          {/* Mobile: exam + budget side-by-side, upgrade below */}
          <div className="lg:hidden mt-4 space-y-4">
            {allExams.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                <ExamCountdownCard exams={allExams} />
                <BudgetRingCard monthSpent={monthSpent} totalBudget={totalBudget} expenses={recentExp} compact />
              </div>
            ) : (
              <BudgetRingCard monthSpent={monthSpent} totalBudget={totalBudget} expenses={recentExp} />
            )}
            {!isPremium && <UpgradeCard />}
          </div>
        </div>
      </div>
    </>
  )
}
