'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/layout/TopBar'
import { fmt } from '@/lib/utils'

interface StreakData {
  streak: number
  longestStreak: number
  todayDone: boolean
}

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

  const streakEmoji = (s: number) => s >= 30 ? '🏆' : s >= 14 ? '💎' : s >= 7 ? '🔥' : s >= 3 ? '⚡' : '✨'
  const streakColor = (s: number) => s >= 7 ? '#f59e0b' : s >= 3 ? '#f97316' : '#0d9488'

  return (
    <div className="min-h-screen bg-[#080f0e] pb-24">
      <TopBar title="Streaks & Goals" />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-5">

        {/* ── Streak card ── */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(249,115,22,0.05))',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 blur-2xl"
            style={{ background: '#f59e0b', transform: 'translate(30%, -30%)' }} />
          <div className="font-mono text-[0.58rem] text-amber-400/60 uppercase tracking-widest mb-3">Daily Streak</div>

          {loading ? (
            <div className="skeleton h-12 rounded w-1/2" />
          ) : streak ? (
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-display font-black text-5xl" style={{ color: streakColor(streak.streak) }}>
                    {streak.streak}
                  </span>
                  <span className="font-mono text-sm text-white/40">days</span>
                </div>
                <div className="font-mono text-[0.6rem] text-white/30">
                  {streak.todayDone
                    ? '✓ Streak protected today'
                    : streak.streak > 0
                    ? '⚠ Complete a task to protect your streak'
                    : 'Complete a task to start your streak'}
                </div>
                {streak.longestStreak > streak.streak && (
                  <div className="font-mono text-[0.58rem] text-white/20 mt-1">
                    Best: {streak.longestStreak} days
                  </div>
                )}
              </div>
              <div className="text-5xl">{streakEmoji(streak.streak)}</div>
            </div>
          ) : (
            <p className="font-mono text-sm text-white/30">Complete tasks to start tracking your streak</p>
          )}

          {/* Mini milestone bar */}
          {streak && streak.streak > 0 && (
            <div className="mt-4">
              <div className="flex justify-between font-mono text-[0.52rem] text-white/25 mb-1.5">
                {[3, 7, 14, 30].map(m => (
                  <span key={m} style={{ color: streak.streak >= m ? streakColor(streak.streak) : undefined }}>
                    {m}d {streak.streak >= m ? '✓' : ''}
                  </span>
                ))}
              </div>
              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (streak.streak / 30) * 100)}%`,
                    background: `linear-gradient(90deg, ${streakColor(streak.streak)}, ${streakColor(streak.streak)}88)`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Savings Goals ── */}
        <div className="flex items-center justify-between">
          <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest">Savings Goals</div>
          <button
            onClick={() => setShowAdd(v => !v)}
            className="font-mono text-[0.6rem] text-teal-400 hover:text-teal-300 transition-colors"
          >
            {showAdd ? '✕ Cancel' : '+ New goal'}
          </button>
        </div>

        {/* Add goal form */}
        {showAdd && (
          <div className="bg-[#111a18] border border-teal-600/20 rounded-2xl p-4 space-y-3 animate-fade-up">
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
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-teal-600/50"
            />

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-mono text-[0.55rem] text-white/30 uppercase tracking-widest block mb-1">Target (R)</label>
                <input
                  type="number" placeholder="5000" value={form.target_amount}
                  onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-teal-600/50"
                />
              </div>
              <div>
                <label className="font-mono text-[0.55rem] text-white/30 uppercase tracking-widest block mb-1">Already saved (R)</label>
                <input
                  type="number" placeholder="0" value={form.current_amount}
                  onChange={e => setForm(f => ({ ...f, current_amount: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-teal-600/50"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[0.55rem] text-white/30 uppercase tracking-widest block mb-1">Target date (optional)</label>
              <input
                type="date" value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 font-mono text-sm text-white/70 focus:outline-none focus:border-teal-600/50"
              />
            </div>

            {/* Color picker */}
            <div>
              <label className="font-mono text-[0.55rem] text-white/30 uppercase tracking-widest block mb-1.5">Colour</label>
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
          <div className="bg-[#111a18] border border-white/7 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <p className="font-display font-bold text-white text-sm">No savings goals yet</p>
            <p className="font-mono text-[0.6rem] text-white/30 mt-1">Set a goal and track your progress</p>
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
                  className="bg-[#111a18] border border-white/7 rounded-2xl overflow-hidden"
                  style={goal.is_completed ? { borderColor: `${goal.color}40` } : undefined}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{goal.emoji}</span>
                        <div>
                          <div className="font-display font-bold text-white text-sm">{goal.name}</div>
                          {goal.deadline && (
                            <div className="font-mono text-[0.55rem] text-white/30 mt-0.5">
                              by {fmt.dateShort(goal.deadline)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold text-sm" style={{ color: goal.color }}>
                          {fmt.currency(goal.current_amount)}
                        </div>
                        <div className="font-mono text-[0.55rem] text-white/25">
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
                      <div className="font-mono text-[0.58rem]" style={{ color: goal.color }}>
                        {goal.is_completed ? '🎉 Goal reached!' : `${pct}% · R${remaining.toFixed(0)} left`}
                      </div>
                      <div className="flex items-center gap-2">
                        {!goal.is_completed && (
                          <button
                            onClick={() => {
                              setContributing(isContrib ? null : goal.id)
                              setContribAmount('')
                            }}
                            className="font-mono text-[0.58rem] px-2.5 py-1 rounded-lg transition-all"
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
                          className="font-mono text-[0.55rem] text-white/20 hover:text-red-400 transition-colors px-1"
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
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 font-body text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-teal-600/50"
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
                    <div className="px-4 py-2 font-mono text-[0.58rem] text-center" style={{ background: `${goal.color}15`, color: goal.color }}>
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
          className="block text-center font-mono text-[0.6rem] text-white/25 hover:text-white/40 transition-colors py-2"
        >
          Track expenses in Budget →
        </Link>
      </div>
    </div>
  )
}
