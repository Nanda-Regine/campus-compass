'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/layout/TopBar'
import { fmt } from '@/lib/utils'
import { AmbientImage } from '@/components/ui/AmbientImage'

interface StreakData {
  streak: number
  longestStreak: number
  todayDone: boolean
  last7days: boolean[]
}

const TIERS = [
  { name: 'Spark',   min: 1,  max: 6,   color: '#60A5FA', emoji: '✨', bg: 'rgba(96,165,250,0.08)',  glow: 'rgba(96,165,250,0.15)'  },
  { name: 'Flame',   min: 7,  max: 13,  color: '#F97316', emoji: '🔥', bg: 'rgba(249,115,22,0.08)',  glow: 'rgba(249,115,22,0.18)'  },
  { name: 'Blaze',   min: 14, max: 29,  color: '#F59E0B', emoji: '⚡', bg: 'rgba(245,158,11,0.08)',  glow: 'rgba(245,158,11,0.18)'  },
  { name: 'Inferno', min: 30, max: 59,  color: '#EF4444', emoji: '💎', bg: 'rgba(239,68,68,0.08)',   glow: 'rgba(239,68,68,0.18)'   },
  { name: 'Legend',  min: 60, max: 9999,color: '#A855F7', emoji: '🏆', bg: 'rgba(168,85,247,0.08)', glow: 'rgba(168,85,247,0.18)'  },
]
function getTier(s: number) { return TIERS.find(t => s >= t.min && s <= t.max) ?? null }

const MILESTONES = [
  { days: 3,   label: '3 Days',   emoji: '🌱', xp: 50   },
  { days: 7,   label: '1 Week',   emoji: '🔥', xp: 150  },
  { days: 14,  label: '2 Weeks',  emoji: '⚡', xp: 300  },
  { days: 21,  label: '21 Days',  emoji: '💪', xp: 500  },
  { days: 30,  label: '1 Month',  emoji: '💎', xp: 750  },
  { days: 60,  label: '2 Months', emoji: '🏆', xp: 1500 },
  { days: 100, label: '100 Days', emoji: '🌟', xp: 3000 },
]

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface SavingsGoal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  emoji: string
  color: string
  is_completed: boolean
}

interface AddGoalForm {
  name: string
  emoji: string
  target_amount: string
  current_amount: string
  deadline: string
  color: string
}

const EMOJIS = ['🎯', '✈️', '📱', '💻', '👟', '🎓', '🏠', '🚗', '💍', '🌍', '📚', '🎮', '💪', '🎸', '🏋️']
const COLORS = ['#0d9488', '#3b82f6', '#8b5cf6', '#e8956e', '#f59e0b', '#ec4899', '#2D4A22']

export default function StreakPage() {
  const supabase = createClient()
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [contributing, setContributing] = useState<string | null>(null)
  const [contribAmount, setContribAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<AddGoalForm>({
    name: '', emoji: '🎯', target_amount: '', current_amount: '0', deadline: '', color: '#0d9488',
  })

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const [streakRes, goalsRes] = await Promise.all([
      fetch('/api/streak').then(r => r.json()).catch(() => null),
      loadGoals(),
    ])
    if (streakRes && !streakRes.error) setStreak(streakRes)
    setLoading(false)
    return goalsRes
  }

  async function loadGoals() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setGoals(data ?? [])
  }

  async function addGoal() {
    if (!form.name || !form.target_amount) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    await supabase.from('savings_goals').insert({
      user_id: user.id,
      name: form.name,
      emoji: form.emoji,
      target_amount: parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount) || 0,
      deadline: form.deadline || null,
      color: form.color,
    })
    setForm({ name: '', emoji: '🎯', target_amount: '', current_amount: '0', deadline: '', color: '#0d9488' })
    setShowAdd(false)
    setSaving(false)
    loadGoals()
  }

  async function addContribution(goalId: string) {
    const amount = parseFloat(contribAmount)
    if (!amount || amount <= 0) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const goal = goals.find(g => g.id === goalId)
    const newAmount = Math.min((goal?.current_amount ?? 0) + amount, goal?.target_amount ?? 0)
    await Promise.all([
      supabase.from('savings_contributions').insert({
        user_id: user.id, goal_id: goalId, amount, contribution_date: new Date().toISOString().split('T')[0],
      }),
      supabase.from('savings_goals').update({
        current_amount: newAmount,
        is_completed: newAmount >= (goal?.target_amount ?? 0),
        updated_at: new Date().toISOString(),
      }).eq('id', goalId),
    ])
    setContributing(null)
    setContribAmount('')
    setSaving(false)
    loadGoals()
  }

  async function deleteGoal(id: string) {
    await supabase.from('savings_goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      <AmbientImage zone="habits" opacity={0.15} blurPx={16} saturation={1.3} overlayColor="rgba(5,4,12,0.72)" />
      <TopBar title="Streaks & Goals" />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-5">

        {/* ── Streak Hero ── */}
        {loading ? (
          <div className="skeleton h-56 rounded-3xl" />
        ) : (() => {
          const s = streak?.streak ?? 0
          const tier = getTier(s)
          const accentColor = tier?.color ?? '#4ecf9e'
          const nextMilestone = MILESTONES.find(m => m.days > s)
          const prevMilestone = [...MILESTONES].reverse().find(m => m.days <= s)
          const progressPct = nextMilestone
            ? Math.round(((s - (prevMilestone?.days ?? 0)) / (nextMilestone.days - (prevMilestone?.days ?? 0))) * 100)
            : 100
          const days7 = streak?.last7days ?? Array(7).fill(false)
          const todayIdx = new Date().getDay() // 0=Sun
          const dayLabelOffset = (todayIdx === 0 ? 6 : todayIdx - 1) // index of today in Mon-Sun
          return (
            <div
              className="rounded-3xl overflow-hidden relative"
              style={{ background: tier?.bg ?? 'rgba(78,207,158,0.06)', border: `1px solid ${accentColor}28` }}
            >
              {/* Glow blob */}
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl pointer-events-none"
                style={{ background: tier?.glow ?? 'rgba(78,207,158,0.10)' }} />

              {/* Tier badge */}
              <div className="px-5 pt-5 pb-0 flex items-center justify-between">
                {tier ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}35` }}>
                    <span className="text-sm">{tier.emoji}</span>
                    <span className="font-mono text-[0.62rem] font-bold uppercase tracking-widest" style={{ color: accentColor }}>
                      {tier.name} Tier
                    </span>
                  </div>
                ) : (
                  <span className="font-mono text-[0.62rem] text-white uppercase tracking-widest">Daily Streak</span>
                )}
                {streak?.todayDone && (
                  <span className="font-mono text-[0.6rem] px-2 py-1 rounded-full" style={{ background: 'rgba(78,207,158,0.12)', color: '#4ecf9e' }}>
                    ✓ Done today
                  </span>
                )}
              </div>

              {/* Big number */}
              <div className="px-5 pt-3 pb-2 flex items-end gap-3">
                <span className="font-display font-black leading-none" style={{ fontSize: 72, color: accentColor }}>{s}</span>
                <div className="pb-3">
                  <div className="font-mono text-sm text-white">day{s !== 1 ? 's' : ''}</div>
                  {streak && streak.longestStreak > s && (
                    <div className="font-mono text-[0.62rem] text-white mt-0.5">best: {streak.longestStreak}</div>
                  )}
                </div>
              </div>

              {/* Status line */}
              <div className="px-5 mb-4">
                <div className="font-mono text-[0.65rem]" style={{ color: streak?.todayDone ? '#4ecf9e' : s > 0 ? '#f59e0b' : 'rgba(255,255,255,0.3)' }}>
                  {streak?.todayDone
                    ? '🔒 Streak locked in — see you tomorrow'
                    : s > 0
                    ? '⚡ Complete a task to protect your streak'
                    : '🌱 Complete your first task to start a streak'}
                </div>
              </div>

              {/* 7-day activity grid */}
              <div className="px-5 pb-4">
                <div className="font-mono text-[0.62rem] text-white uppercase tracking-widest mb-2">Last 7 days</div>
                <div className="flex gap-1.5">
                  {days7.map((done, i) => {
                    const labelIdx = (dayLabelOffset - 6 + i + 7) % 7
                    const isToday = i === 6
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full aspect-square rounded-lg flex items-center justify-center text-[0.6rem]"
                          style={{
                            background: done ? `${accentColor}28` : 'rgba(255,255,255,0.04)',
                            border: isToday ? `1.5px solid ${accentColor}60` : done ? `1px solid ${accentColor}30` : '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          {done ? <span style={{ color: accentColor }}>✓</span> : <span className="text-white">·</span>}
                        </div>
                        <span className="font-mono text-[0.62rem] text-white">{DAY_LABELS[labelIdx]?.slice(0, 2)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Next milestone progress */}
              {nextMilestone && (
                <div className="px-5 pb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[0.62rem] text-white">
                      Next: {nextMilestone.emoji} {nextMilestone.label} (+{nextMilestone.xp} XP)
                    </span>
                    <span className="font-mono text-[0.62rem]" style={{ color: accentColor }}>{nextMilestone.days - s}d away</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* ── Milestone unlocks ── */}
        <div>
          <div className="font-mono text-[0.6rem] text-white uppercase tracking-widest mb-3">Milestones</div>
          <div className="grid grid-cols-4 gap-2">
            {MILESTONES.map(m => {
              const s = streak?.streak ?? 0
              const unlocked = s >= m.days
              return (
                <div
                  key={m.days}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl"
                  style={{
                    background: unlocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    border: unlocked ? `1px solid rgba(255,255,255,0.12)` : '1px solid rgba(255,255,255,0.04)',
                    opacity: unlocked ? 1 : 0.45,
                  }}
                >
                  <span className="text-xl" style={{ filter: unlocked ? 'none' : 'grayscale(1)' }}>{m.emoji}</span>
                  <span className="font-mono text-[0.62rem] text-white text-center leading-tight">{m.label}</span>
                  <span className="font-mono text-[0.62rem]" style={{ color: unlocked ? '#f59e0b' : 'rgba(255,255,255,0.2)' }}>
                    {unlocked ? '✓' : `${m.days}d`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Savings Goals ── */}
        <div className="flex items-center justify-between">
          <div className="font-mono text-[0.6rem] text-white uppercase tracking-widest">Savings Goals</div>
          <button
            onClick={() => setShowAdd(v => !v)}
            className="font-mono text-[0.6rem] text-teal-400 hover:text-teal-300 transition-colors"
          >
            {showAdd ? '✕ Cancel' : '+ New goal'}
          </button>
        </div>

        {/* Add goal form */}
        {showAdd && (
          <div className="bg-[var(--bg-surface)] border border-teal-600/20 rounded-2xl p-4 space-y-3 animate-fade-up">
            {/* Emoji picker */}
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className={`text-xl p-1.5 rounded-lg transition-all ${form.emoji === e ? 'bg-white/15' : 'hover:bg-white/8'}`}
                >
                  {e}
                </button>
              ))}
            </div>

            <input
              placeholder="Goal name (e.g. New laptop)"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 font-body text-sm text-white placeholder:text-white focus:outline-none focus:border-teal-600/50"
            />

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-mono text-[0.62rem] text-white uppercase tracking-widest block mb-1">Target (R)</label>
                <input
                  type="number" placeholder="5000" value={form.target_amount}
                  onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 font-body text-sm text-white placeholder:text-white focus:outline-none focus:border-teal-600/50"
                />
              </div>
              <div>
                <label className="font-mono text-[0.62rem] text-white uppercase tracking-widest block mb-1">Already saved (R)</label>
                <input
                  type="number" placeholder="0" value={form.current_amount}
                  onChange={e => setForm(f => ({ ...f, current_amount: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 font-body text-sm text-white placeholder:text-white focus:outline-none focus:border-teal-600/50"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[0.62rem] text-white uppercase tracking-widest block mb-1">Target date (optional)</label>
              <input
                type="date" value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 font-mono text-sm text-white focus:outline-none focus:border-teal-600/50"
              />
            </div>

            {/* Color picker */}
            <div>
              <label className="font-mono text-[0.62rem] text-white uppercase tracking-widest block mb-1.5">Colour</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    className="w-6 h-6 rounded-full transition-all"
                    style={{
                      background: c,
                      outline: form.color === c ? `2px solid white` : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={addGoal}
              disabled={saving || !form.name || !form.target_amount}
              className="w-full py-3 rounded-xl font-display font-bold text-sm transition-all disabled:opacity-40"
              style={{ background: '#0d9488', color: '#fff' }}
            >
              {saving ? 'Saving…' : 'Create Goal'}
            </button>
          </div>
        )}

        {/* Goals list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : goals.length === 0 ? (
          <div className="bg-[var(--bg-surface)] border border-white/7 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <p className="font-display font-bold text-white text-sm">No savings goals yet</p>
            <p className="font-mono text-[0.6rem] text-white mt-1">Set a goal and track your progress</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map(goal => {
              const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
              const remaining = goal.target_amount - goal.current_amount
              const isContrib = contributing === goal.id

              return (
                <div
                  key={goal.id}
                  className="bg-[var(--bg-surface)] border border-white/7 rounded-2xl overflow-hidden"
                  style={goal.is_completed ? { borderColor: `${goal.color}40` } : undefined}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{goal.emoji}</span>
                        <div>
                          <div className="font-display font-bold text-white text-sm">{goal.name}</div>
                          {goal.deadline && (
                            <div className="font-mono text-[0.62rem] text-white mt-0.5">
                              by {fmt.dateShort(goal.deadline)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold text-sm" style={{ color: goal.color }}>
                          {fmt.currency(goal.current_amount)}
                        </div>
                        <div className="font-mono text-[0.62rem] text-white">
                          of {fmt.currency(goal.target_amount)}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-white/8 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: goal.color }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="font-mono text-[0.62rem]" style={{ color: goal.color }}>
                        {goal.is_completed ? '🎉 Goal reached!' : `${pct}% · R${remaining.toFixed(0)} left`}
                      </div>
                      <div className="flex items-center gap-2">
                        {!goal.is_completed && (
                          <button
                            onClick={() => {
                              setContributing(isContrib ? null : goal.id)
                              setContribAmount('')
                            }}
                            className="font-mono text-[0.62rem] px-2.5 py-1 rounded-lg transition-all"
                            style={{
                              background: isContrib ? 'rgba(255,255,255,0.08)' : `${goal.color}22`,
                              color: goal.color,
                            }}
                          >
                            {isContrib ? 'Cancel' : '+ Add'}
                          </button>
                        )}
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="font-mono text-[0.62rem] text-white hover:text-red-400 transition-colors px-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Contribution input */}
                    {isContrib && (
                      <div className="mt-3 pt-3 border-t border-white/7 flex gap-2 animate-fade-up">
                        <input
                          type="number"
                          placeholder="Amount (R)"
                          value={contribAmount}
                          onChange={e => setContribAmount(e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 font-body text-sm text-white placeholder:text-white focus:outline-none focus:border-teal-600/50"
                          autoFocus
                        />
                        <button
                          onClick={() => addContribution(goal.id)}
                          disabled={saving || !contribAmount}
                          className="px-4 py-2 rounded-xl font-display font-bold text-sm disabled:opacity-40 transition-all"
                          style={{ background: goal.color, color: '#fff' }}
                        >
                          {saving ? '…' : 'Save'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Completed banner */}
                  {goal.is_completed && (
                    <div className="px-4 py-2 font-mono text-[0.62rem] text-center" style={{ background: `${goal.color}15`, color: goal.color }}>
                      Goal complete! Well done 🎉
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Link to budget */}
        <Link
          href="/budget"
          className="block text-center font-mono text-[0.6rem] text-white hover:text-white transition-colors py-2"
        >
          Track expenses in Budget →
        </Link>
      </div>
    </div>
  )
}
