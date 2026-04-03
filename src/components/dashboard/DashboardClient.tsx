'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAppStore } from '@/store'
import TopBar from '@/components/layout/TopBar'
import PWAInstallBanner from '@/components/PWAInstallBanner'
import DashboardGreeting from '@/components/dashboard/DashboardGreeting'
import MoodCheckin from '@/components/dashboard/MoodCheckin'
import {
  type Profile, type Budget, type Task, type Exam,
  type Module, type TimetableEntry, type Expense,
  type Subscription, MODULE_COLOURS, DAYS_OF_WEEK,
} from '@/types'
import {
  fmt, getDaysUntil, getTaskUrgency,
  calcTotalBudget, getLoadSheddingStatus, cn,
} from '@/lib/utils'

interface NovaInsight {
  id: string
  insight_type: string
  content: string
  created_at: string
}

interface CheckInData {
  checkIn: string
  actions: { icon: string; action: string; urgency: string }[]
  snapshot: {
    completedTasks: number
    pendingTasks: number
    overdueTasks: number
    upcomingExams: number
    nextExam: string | null
    budgetRemaining: number
    budgetTotal: number
    monthProgress: number
  }
}

interface DashboardClientProps {
  initialData: {
    profile: Profile
    budget: Budget
    tasks: Task[]
    exams: Exam[]
    modules: Module[]
    timetable: TimetableEntry[]
    recentExpenses: Expense[]
    subscription: Subscription | null
  }
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const store = useAppStore()
  const [novaInsights, setNovaInsights] = useState<NovaInsight[]>([])
  const [checkInData, setCheckInData] = useState<CheckInData | null>(null)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [showCheckIn, setShowCheckIn] = useState(false)

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

  // Apply pending referral code on first dashboard load (captured from signup URL)
  useEffect(() => {
    const pendingRef = localStorage.getItem('pending_ref')
    if (!pendingRef) return
    localStorage.removeItem('pending_ref') // clear immediately to prevent double-apply
    fetch('/api/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: pendingRef }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          // Dynamic import to keep bundle lean
          import('react-hot-toast').then(({ default: toast }) => {
            toast.success(`🎉 Referral applied! You got ${d.bonusMessages} bonus Nova messages.`)
          })
        }
      })
      .catch(() => { /* silent — referral is best-effort */ })
  }, [])

  // Load Nova proactive insights
  useEffect(() => {
    const loadInsights = async () => {
      try {
        const res = await fetch('/api/insights')
        if (res.ok) {
          const data = await res.json()
          setNovaInsights(data.insights || [])
        }
      } catch { /* silent */ }
    }
    loadInsights()
  }, [])

  // Check exam reminders — once per session
  useEffect(() => {
    if (sessionStorage.getItem('push_checked')) return
    sessionStorage.setItem('push_checked', '1')
    fetch('/api/push/check-exams').catch(() => {})
  }, [])

  const loadCheckIn = useCallback(async () => {
    setCheckInLoading(true)
    setShowCheckIn(true)
    try {
      const res = await fetch('/api/insights/checkin')
      if (res.ok) {
        const data = await res.json()
        setCheckInData(data)
      }
    } catch { /* silent */ } finally {
      setCheckInLoading(false)
    }
  }, [])

  const dismissInsight = async (id: string) => {
    setNovaInsights(prev => prev.filter(i => i.id !== id))
    await fetch('/api/insights', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  const { profile, budget, tasks, exams, modules, timetable, expenses } = store

  const p        = profile ?? initialData.profile
  const b        = budget  ?? initialData.budget
  const allTasks  = tasks.length     ? tasks     : initialData.tasks
  const allExams  = exams.length     ? exams     : initialData.exams
  const allMods   = modules.length   ? modules   : initialData.modules
  const allTT     = timetable.length ? timetable : initialData.timetable
  const recentExp = expenses.length  ? expenses  : initialData.recentExpenses

  const totalBudget = b ? calcTotalBudget(b) : 0
  const monthSpent  = recentExp.reduce((s, e) => s + e.amount, 0)
  const remaining   = totalBudget - monthSpent
  const spentPct    = fmt.pct(monthSpent, totalBudget)
  const overBudget  = monthSpent > totalBudget

  const todayName = DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
  const todayClasses = allTT
    .filter(e => e.day_of_week === todayName)
    .sort((a, bb) => a.start_time.localeCompare(bb.start_time))

  const pendingTasks = allTasks.filter(t => !t.done).slice(0, 5)
  const overdueTasks = allTasks.filter(t => !t.done && t.due_date && new Date(t.due_date) < new Date())
  const nextExam     = allExams[0] ?? null
  const ls           = getLoadSheddingStatus()
  const isPremium    = p?.is_premium || initialData.subscription?.plan === 'premium'

  const insightIcon: Record<string, string> = {
    study_nudge: '📚',
    budget_warning: '💰',
    stress_alert: '💙',
  }

  return (
    <div className="min-h-screen bg-[#080f0e] pb-24">
      <TopBar title="Dashboard" />

      <PWAInstallBanner variant="banner" />

      <div className="px-4 py-3 space-y-4 max-w-2xl mx-auto">

        {/* ─── Mood check-in ─── */}
        <MoodCheckin userId={p.id} />

        {/* ─── Nova Proactive Insights ─── */}
        {novaInsights.map(insight => (
          <div
            key={insight.id}
            className="flex items-start gap-3 bg-purple-500/8 border border-purple-500/20 rounded-2xl px-4 py-3 animate-fade-up"
          >
            <span className="text-xl flex-shrink-0">{insightIcon[insight.insight_type] || '🌟'}</span>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[0.55rem] text-purple-400 uppercase tracking-widest mb-1">Nova</div>
              <div className="font-body text-sm text-white/80">{insight.content}</div>
            </div>
            <button
              onClick={() => dismissInsight(insight.id)}
              className="text-white/20 hover:text-white/50 transition-colors text-xs flex-shrink-0 mt-0.5"
            >
              ✕
            </button>
          </div>
        ))}

        {/* ─── Hero greeting card ─── */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #134e4a 0%, #0f766e 50%, #0d9488 100%)',
            border: '1px solid rgba(13,148,136,0.4)',
          }}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%)' }}
          />
          <div className="relative">
            <div className="mb-3">
              <DashboardGreeting
                profile={p}
                budget={b}
                nextExam={nextExam}
                overdueTasks={overdueTasks}
                isPremium={isPremium}
              />
            </div>


            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
                <div className="font-display font-black text-lg text-white">{pendingTasks.length}</div>
                <div className="font-mono text-[0.55rem] text-teal-200/60 uppercase">Tasks due</div>
              </div>
              <div className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
                <div className="font-display font-black text-lg text-white">{allExams.length}</div>
                <div className="font-mono text-[0.55rem] text-teal-200/60 uppercase">Exams ahead</div>
              </div>
              <div className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
                <div className={cn('font-display font-black text-lg', overBudget ? 'text-red-300' : 'text-white')}>
                  {fmt.currencyShort(remaining)}
                </div>
                <div className="font-mono text-[0.55rem] text-teal-200/60 uppercase">Left</div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── AI Check-in button ─── */}
        {!showCheckIn ? (
          <button
            onClick={loadCheckIn}
            className="w-full flex items-center gap-4 bg-gradient-to-r from-purple-900/20 to-teal-900/20 border border-purple-500/15 hover:border-purple-500/30 rounded-2xl p-4 transition-all text-left"
          >
            <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🌟</div>
            <div>
              <div className="font-display font-bold text-purple-300 text-sm">How am I doing?</div>
              <div className="font-mono text-[0.6rem] text-white/30">Nova checks in on your whole semester →</div>
            </div>
          </button>
        ) : (
          <div className="bg-gradient-to-br from-purple-900/20 to-teal-900/10 border border-purple-500/20 rounded-2xl p-5 animate-fade-up">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-purple-500/20 flex items-center justify-center text-sm">🌟</div>
              <div className="font-mono text-[0.6rem] text-purple-400 uppercase tracking-widest">Nova Semester Check-in</div>
            </div>

            {checkInLoading ? (
              <div className="space-y-2">
                <div className="skeleton h-4 rounded w-full" />
                <div className="skeleton h-4 rounded w-5/6" />
                <div className="skeleton h-4 rounded w-4/6" />
              </div>
            ) : checkInData ? (
              <>
                <p className="font-body text-sm text-white/80 leading-relaxed whitespace-pre-wrap mb-4">
                  {checkInData.checkIn}
                </p>
                {checkInData.actions.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-mono text-[0.58rem] text-white/30 uppercase tracking-widest">Your next moves</div>
                    {checkInData.actions.map((action, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
                        <span className="text-base">{action.icon}</span>
                        <div className="flex-1 font-body text-sm text-white/80">{action.action}</div>
                        <span className={cn(
                          'font-mono text-[0.55rem] px-2 py-0.5 rounded-full border',
                          action.urgency === 'now'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : action.urgency === 'today'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-teal-600/10 text-teal-400 border-teal-600/20'
                        )}>
                          {action.urgency}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/7">
                  <button
                    onClick={loadCheckIn}
                    className="font-mono text-[0.58rem] text-white/30 hover:text-white/50 transition-colors"
                  >
                    ↻ Refresh
                  </button>
                  <button
                    onClick={() => setShowCheckIn(false)}
                    className="font-mono text-[0.58rem] text-white/30 hover:text-white/50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ─── Load shedding alert ─── */}
        {ls.active && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <span className="text-amber-400 text-lg flex-shrink-0">⚡</span>
            <div className="min-w-0">
              <div className="font-display font-bold text-amber-400 text-xs">Load shedding active — {ls.stage}</div>
              {ls.time && <div className="font-mono text-[0.6rem] text-amber-400/60">{ls.time}</div>}
            </div>
          </div>
        )}

        {/* ─── Budget ring ─── */}
        <Link href="/budget" className="block">
          <div className="bg-[#111a18] border border-white/7 hover:border-teal-600/30 rounded-2xl p-4 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest">Budget this month</div>
                <div className="font-display font-black text-xl text-white mt-0.5">
                  {fmt.currencyShort(monthSpent)}
                  <span className="text-white/30 font-normal text-sm"> / {fmt.currencyShort(totalBudget)}</span>
                </div>
              </div>
              <span className={cn(
                'font-mono text-[0.6rem] font-bold px-2.5 py-1 rounded-full border',
                overBudget
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : spentPct > 80
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-teal-600/10 text-teal-400 border-teal-600/20'
              )}>
                {overBudget ? 'Over budget' : `${spentPct}% spent`}
              </span>
            </div>
            <div className="h-2 bg-white/8 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  overBudget ? 'bg-red-500' : spentPct > 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-teal-600 to-teal-400'
                )}
                style={{ width: `${Math.min(100, spentPct)}%` }}
              />
            </div>
            {b?.nsfas_enabled && (
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className="text-teal-400 text-xs">🏛️</span>
                <span className="font-mono text-[0.58rem] text-white/30">
                  NSFAS {fmt.currencyShort(b.nsfas_living + b.nsfas_accom + b.nsfas_books)} included
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* ─── Quick action grid ─── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/study',                  icon: '📚', label: 'Study Planner', colour: 'teal',   sub: `${allMods.length} modules` },
            { href: '/budget',                 icon: '💰', label: 'Budget',         colour: 'coral',  sub: `${recentExp.length} expenses` },
            { href: '/meals',                  icon: '🍲', label: 'Meal Prep',      colour: 'amber',  sub: 'AI recipes + planner' },
            { href: '/nova',                   icon: '🌟', label: 'Nova',            colour: 'purple', sub: 'AI companion' },
            { href: '/dashboard/work',         icon: '💼', label: 'Work',            colour: 'blue',   sub: 'Shifts & earnings' },
            { href: '/dashboard/campus-life',  icon: '🏛️', label: 'Campus Life',    colour: 'green',  sub: '10 guides by Nova' },
          ].map(item => {
            const colorMap = {
              teal:   { border: 'hover:border-teal-600/40',   icon: 'bg-teal-600/15',   text: 'text-teal-400' },
              coral:  { border: 'hover:border-orange-500/40', icon: 'bg-orange-500/15', text: 'text-orange-400' },
              amber:  { border: 'hover:border-amber-500/40',  icon: 'bg-amber-500/15',  text: 'text-amber-400' },
              purple: { border: 'hover:border-purple-500/40', icon: 'bg-purple-500/15', text: 'text-purple-400' },
              blue:   { border: 'hover:border-blue-500/40',   icon: 'bg-blue-500/15',   text: 'text-blue-400' },
              green:  { border: 'hover:border-green-500/40',  icon: 'bg-green-500/15',  text: 'text-green-400' },
            }
            const c = colorMap[item.colour as keyof typeof colorMap]
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`bg-[#111a18] border border-white/7 ${c.border} rounded-2xl p-4 transition-all hover:scale-[1.01]`}
              >
                <div className={`w-10 h-10 ${c.icon} rounded-xl flex items-center justify-center text-xl mb-3`}>
                  {item.icon}
                </div>
                <div className="font-display font-bold text-white text-sm">{item.label}</div>
                <div className={`font-mono text-[0.58rem] ${c.text} mt-0.5`}>{item.sub}</div>
              </Link>
            )
          })}
        </div>

        {/* ─── Today's timetable ─── */}
        {todayClasses.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest">Today — {todayName}</div>
              <Link href="/study" className="font-mono text-[0.6rem] text-teal-500 hover:text-teal-400">Full timetable →</Link>
            </div>
            <div className="space-y-2">
              {todayClasses.map(entry => {
                const mod = entry.module
                const colour = mod?.colour ? MODULE_COLOURS[mod.colour] : MODULE_COLOURS.teal
                return (
                  <div key={entry.id} className="flex items-center gap-3 bg-[#111a18] border border-white/7 rounded-xl px-4 py-3">
                    <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: colour.dot }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-sm truncate" style={{ color: colour.text }}>
                        {mod?.name ?? 'Class'}
                      </div>
                      <div className="font-mono text-[0.6rem] text-white/40">
                        {fmt.time(entry.start_time)}
                        {entry.end_time && ` – ${fmt.time(entry.end_time)}`}
                        {entry.venue && ` · ${entry.venue}`}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ─── Pending tasks ─── */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest">
              Upcoming tasks ({pendingTasks.length})
            </div>
            <Link href="/study" className="font-mono text-[0.6rem] text-teal-500 hover:text-teal-400">All tasks →</Link>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="bg-[#111a18] border border-white/7 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <p className="font-display font-bold text-white text-sm">No pending tasks!</p>
              <p className="font-mono text-[0.6rem] text-white/30 mt-1">You&apos;re all caught up.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map(task => {
                const { urgency, label } = getTaskUrgency(task.due_date)
                const urgencyStyle = {
                  overdue: { dot: '#ef4444', label: 'bg-red-500/10 text-red-400 border-red-500/20' },
                  today:   { dot: '#f97316', label: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
                  urgent:  { dot: '#f59e0b', label: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                  soon:    { dot: '#0d9488', label: 'bg-teal-600/10 text-teal-400 border-teal-600/20' },
                  normal:  { dot: '#4b5563', label: 'bg-white/5 text-white/40 border-white/10' },
                }[urgency]
                const modColour = task.module?.colour ? MODULE_COLOURS[task.module.colour] : null

                return (
                  <Link
                    href="/study"
                    key={task.id}
                    className="flex items-center gap-3 bg-[#111a18] border border-white/7 hover:border-white/15 rounded-xl px-4 py-3 transition-all"
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: urgencyStyle.dot }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-sm text-white truncate">{task.title}</div>
                      {task.module && (
                        <div className="font-mono text-[0.58rem] truncate mt-0.5" style={{ color: modColour?.text ?? '#6b7280' }}>
                          {task.module.name}
                        </div>
                      )}
                    </div>
                    {label && (
                      <span className={cn('flex-shrink-0 font-mono text-[0.58rem] px-2 py-0.5 rounded-full border', urgencyStyle.label)}>
                        {label}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* ─── Next exam countdown ─── */}
        {nextExam && (
          <section>
            <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest mb-2.5">Next exam</div>
            <Link href="/study">
              <div
                className="rounded-2xl p-4 border transition-all hover:border-purple-500/40"
                style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(168,85,247,0.04) 100%)',
                  border: '1px solid rgba(168,85,247,0.15)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display font-bold text-white text-sm">{nextExam.name}</div>
                    {nextExam.module && (
                      <div className="font-mono text-[0.58rem] mt-0.5" style={{ color: nextExam.module.colour ? MODULE_COLOURS[nextExam.module.colour].text : '#c084fc' }}>
                        {nextExam.module.name}
                      </div>
                    )}
                    <div className="font-mono text-[0.6rem] text-purple-300/60 mt-1.5">
                      {fmt.dateFull(nextExam.exam_date)}
                      {nextExam.start_time && ` · ${fmt.time(nextExam.start_time)}`}
                      {nextExam.venue && ` · ${nextExam.venue}`}
                    </div>
                  </div>
                  <div className="text-center flex-shrink-0 ml-4">
                    {(() => {
                      const days = getDaysUntil(nextExam.exam_date)
                      return (
                        <>
                          <div className="font-display font-black text-3xl text-purple-300">
                            {days < 0 ? 'Done' : days === 0 ? 'Today!' : days}
                          </div>
                          {days > 0 && <div className="font-mono text-[0.55rem] text-purple-300/50 uppercase">days left</div>}
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* ─── Recent expenses ─── */}
        {recentExp.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest">Recent expenses</div>
              <Link href="/budget" className="font-mono text-[0.6rem] text-teal-500 hover:text-teal-400">All →</Link>
            </div>
            <div className="bg-[#111a18] border border-white/7 rounded-2xl overflow-hidden">
              {recentExp.slice(0, 4).map((exp, i) => (
                <div key={exp.id} className={cn('flex items-center justify-between px-4 py-3', i < 3 && 'border-b border-white/5')}>
                  <div className="flex items-center gap-3">
                    <div className="text-base">
                      {['🍔','🚌','📱','📖','🏠','🎮','💊','💳'][
                        ['Food','Transport','Data','Stationery','Accommodation','Entertainment','Health','Other'].indexOf(exp.category)
                      ] ?? '💳'}
                    </div>
                    <div>
                      <div className="font-body text-sm text-white truncate max-w-[160px]">{exp.description}</div>
                      <div className="font-mono text-[0.58rem] text-white/30">{exp.category} · {fmt.dateShort(exp.date)}</div>
                    </div>
                  </div>
                  <div className="font-display font-bold text-sm text-orange-400">-{fmt.currencyShort(exp.amount)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Upgrade CTA ─── */}
        {!isPremium && (
          <Link href="/upgrade" className="block">
            <div
              className="rounded-2xl p-4 flex items-center gap-4"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.04))', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center text-xl flex-shrink-0">⭐</div>
              <div className="flex-1">
                <div className="font-display font-bold text-amber-400 text-sm">Upgrade to Premium</div>
                <div className="font-mono text-[0.6rem] text-white/30">200 messages/month · AI recipes · Financial coach · R79/month</div>
              </div>
              <div className="font-mono text-[0.6rem] text-amber-400 flex-shrink-0">→</div>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
