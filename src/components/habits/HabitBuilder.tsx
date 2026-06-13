'use client'

// ============================================================
// HabitBuilder — Atomic Habits system for students.
// 5 pre-built packs: Study, Wellness, Finances, Social, Morning
// Tracks streaks, cue-routine-reward loops, daily check-ins.
// Domain colour: --indigo (Growth OS)
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { signals } from '@/store/signals'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────

interface Habit {
  id:           string
  name:         string
  cue:          string          // when / where trigger
  reward:       string          // what you get
  frequency:    'daily' | 'weekdays' | 'weekly'
  pack:         HabitPack
  emoji:        string
  streakDays:   number
  lastCheckedIn: string | null  // ISO date
  completedToday: boolean
  totalCompleted: number
}

type HabitPack = 'study' | 'wellness' | 'finances' | 'social' | 'morning' | 'custom'

// ─── Pre-built packs ──────────────────────────────────────────

interface PackHabitTemplate {
  id:       string
  name:     string
  cue:      string
  reward:   string
  frequency: Habit['frequency']
  emoji:    string
}

interface Pack {
  id:          HabitPack
  name:        string
  description: string
  color:       string
  bg:          string
  emoji:       string
  habits:      PackHabitTemplate[]
}

const PACKS: Pack[] = [
  {
    id: 'morning', name: 'Morning Launch', description: 'Set the tone for every day before 8am.',
    color: 'var(--gold)', bg: 'var(--gold-dim)', emoji: '🌅',
    habits: [
      { id: 'm1', name: 'Make your bed', cue: 'Right after waking up', reward: 'Instant sense of control', frequency: 'daily', emoji: '🛏️' },
      { id: 'm2', name: 'Drink a glass of water', cue: 'Before reaching for phone', reward: '5 extra focus minutes', frequency: 'daily', emoji: '💧' },
      { id: 'm3', name: 'Review today\'s top 3 tasks', cue: 'Over morning tea/coffee', reward: 'Walk into class with a plan', frequency: 'daily', emoji: '📋' },
      { id: 'm4', name: '10-minute walk or stretch', cue: 'After getting dressed', reward: 'Mood lift that lasts 4h', frequency: 'daily', emoji: '🚶' },
    ],
  },
  {
    id: 'study', name: 'Deep Study', description: 'Build the habits that top students share.',
    color: 'var(--indigo, #6366F1)', bg: 'rgba(99,102,241,0.08)', emoji: '📚',
    habits: [
      { id: 's1', name: 'Read lecture notes before class', cue: 'Night before each lecture', reward: 'You\'re the smartest in the room', frequency: 'weekdays', emoji: '📖' },
      { id: 's2', name: '25-min Pomodoro session', cue: 'When you sit at your desk', reward: 'Cross something off your list', frequency: 'daily', emoji: '🍅' },
      { id: 's3', name: 'Review flashcards (10 cards)', cue: 'After lunch', reward: 'Compound memory gains', frequency: 'daily', emoji: '🗂️' },
      { id: 's4', name: 'Write a 3-sentence summary of today', cue: 'Last thing before sleep', reward: 'Sleep with clarity', frequency: 'daily', emoji: '✍️' },
      { id: 's5', name: 'Plan tomorrow\'s schedule', cue: 'After dinner', reward: 'Wake up with momentum', frequency: 'weekdays', emoji: '📅' },
    ],
  },
  {
    id: 'wellness', name: 'Body & Mind', description: 'Protect your health during high-pressure periods.',
    color: 'var(--rose, #FB7185)', bg: 'rgba(251,113,133,0.08)', emoji: '🧘',
    habits: [
      { id: 'w1', name: 'Sleep before midnight', cue: 'Phone on silent at 10:30pm', reward: '30% better memory recall', frequency: 'daily', emoji: '🌙' },
      { id: 'w2', name: 'Eat a real meal', cue: 'Between 12pm and 2pm', reward: 'Sustained afternoon energy', frequency: 'daily', emoji: '🍱' },
      { id: 'w3', name: '5-minute breathing exercise', cue: 'When feeling overwhelmed', reward: 'Cortisol drops in 90 seconds', frequency: 'daily', emoji: '🫁' },
      { id: 'w4', name: 'Move for 20+ minutes', cue: 'After your last lecture', reward: 'Better sleep tonight', frequency: 'daily', emoji: '🏃' },
      { id: 'w5', name: 'Journal one thing you\'re grateful for', cue: 'Right before sleep', reward: 'Wake up calmer', frequency: 'daily', emoji: '💙' },
    ],
  },
  {
    id: 'finances', name: 'Money Smart', description: 'Build the financial discipline that changes your trajectory.',
    color: 'var(--teal)', bg: 'var(--teal-dim)', emoji: '💰',
    habits: [
      { id: 'f1', name: 'Log every expense', cue: 'When you close your wallet/tap your phone', reward: 'No end-of-month mystery panic', frequency: 'daily', emoji: '📊' },
      { id: 'f2', name: 'Check account balance', cue: 'Every Monday morning', reward: 'Know exactly where you stand', frequency: 'weekly', emoji: '🏦' },
      { id: 'f3', name: 'Pack lunch from res', cue: 'Night before', reward: 'Save R50/day = R1000/month', frequency: 'weekdays', emoji: '🥗' },
      { id: 'f4', name: 'Transfer R50 to savings', cue: 'On NSFAS disbursement day', reward: 'R600 buffer by semester end', frequency: 'weekly', emoji: '🎯' },
    ],
  },
  {
    id: 'social', name: 'Community Roots', description: 'Ubuntu in action — stay connected to your people.',
    color: 'var(--nova)', bg: 'rgba(147,51,234,0.08)', emoji: '🤝',
    habits: [
      { id: 'c1', name: 'Message home (call/WhatsApp)', cue: 'Every Sunday after lunch', reward: 'They miss you; you feel grounded', frequency: 'weekly', emoji: '📱' },
      { id: 'c2', name: 'Introduce yourself to one new person', cue: 'First day of every week', reward: 'Your network grows 52x per year', frequency: 'weekly', emoji: '👋' },
      { id: 'c3', name: 'Attend one study group session', cue: 'Wednesdays', reward: 'Accountability + shared notes', frequency: 'weekly', emoji: '👥' },
      { id: 'c4', name: 'Do one thing kind without being asked', cue: 'Random daily trigger', reward: 'Positive ripple you can\'t predict', frequency: 'daily', emoji: '💚' },
    ],
  },
]

// ─── Storage helpers ──────────────────────────────────────────

const STORAGE_KEY = 'varsityos-habits'

function loadHabitsLocal(): Habit[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

function saveHabitsLocal(habits: Habit[]) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(habits))
}

const today = () => new Date().toISOString().split('T')[0]

function calcStreak(habit: Habit, wasCheckedIn: boolean): number {
  const last = habit.lastCheckedIn
  if (!last) return wasCheckedIn ? 1 : 0
  const lastDate = new Date(last)
  const todayDate = new Date(today())
  const diff = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000)
  if (diff === 0) return habit.streakDays // already checked in today
  if (diff === 1) return wasCheckedIn ? habit.streakDays + 1 : 0
  return wasCheckedIn ? 1 : 0
}

// ─── Habit card ───────────────────────────────────────────────

function HabitCard({ habit, pack, onToggle, onRemove }: {
  habit: Habit
  pack: Pack | null
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}) {
  const color = pack?.color ?? 'var(--indigo, #6366F1)'
  const isToday = habit.lastCheckedIn === today()

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'var(--bg-surface)',
      border: `1px solid ${isToday ? `${color}40` : 'var(--border-subtle)'}`,
      borderRadius: 12, padding: '12px 14px',
    }}>
      {isToday && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${color}, transparent)`,
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Checkbox */}
        <button
          onClick={() => onToggle(habit.id)}
          style={{
            flexShrink: 0, width: 28, height: 28,
            borderRadius: '50%',
            background: isToday ? `${color}20` : 'transparent',
            border: `2px solid ${isToday ? color : 'var(--border-default)'}`,
            color: isToday ? color : 'var(--text-muted)',
            fontSize: '0.75rem', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}>
          {isToday ? '✓' : ''}
        </button>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '0.84rem', fontWeight: 600,
            color: isToday ? 'var(--text-primary)' : 'var(--text-secondary)',
            textDecoration: isToday ? 'none' : 'none',
          }}>
            {habit.emoji} {habit.name}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {habit.cue}
          </div>
        </div>

        {/* Streak */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{
            fontSize: '0.9rem', fontWeight: 900, fontFamily: 'var(--font-mono)',
            color: habit.streakDays >= 7 ? color : 'var(--text-secondary)',
          }}>
            {habit.streakDays}
          </div>
          <div style={{ fontSize: '0.52rem', color: 'var(--text-muted)' }}>day streak</div>
        </div>

        <button
          onClick={() => onRemove(habit.id)}
          style={{
            padding: '4px', background: 'none', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.65rem',
          }}>✕</button>
      </div>

      {/* Reward preview on completion */}
      {isToday && (
        <div style={{
          marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.67rem', color: color,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>🎯</span>
          <span>{habit.reward}</span>
        </div>
      )}
    </div>
  )
}

// ─── Pack picker ──────────────────────────────────────────────

function PackPicker({ onAddPack }: { onAddPack: (pack: Pack) => void }) {
  const [selected, setSelected] = useState<Pack | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
        Choose a habit pack to add
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PACKS.map(pack => (
          <div key={pack.id}>
            <button
              onClick={() => setSelected(selected?.id === pack.id ? null : pack)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '12px 14px',
                background: selected?.id === pack.id ? pack.bg : 'var(--bg-surface)',
                border: `1px solid ${selected?.id === pack.id ? `${pack.color}40` : 'var(--border-subtle)'}`,
                borderRadius: 12, cursor: 'pointer', textAlign: 'left',
              }}>
              <span style={{ fontSize: '1.3rem' }}>{pack.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>{pack.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{pack.description}</div>
              </div>
              <span style={{
                fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
              }}>{pack.habits.length} habits</span>
            </button>

            {selected?.id === pack.id && (
              <div style={{
                background: 'var(--bg-elevated)', border: `1px solid ${pack.color}25`,
                borderTop: 'none', borderRadius: '0 0 12px 12px',
                padding: '10px 14px',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {pack.habits.map(h => (
                    <div key={h.id} style={{
                      display: 'flex', gap: 8, alignItems: 'flex-start',
                      fontSize: '0.73rem', color: 'var(--text-secondary)',
                    }}>
                      <span style={{ flexShrink: 0 }}>{h.emoji}</span>
                      <div>
                        <span style={{ fontWeight: 600 }}>{h.name}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>— {h.cue}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { onAddPack(pack); setSelected(null) }}
                  style={{
                    width: '100%', padding: '10px 0',
                    background: pack.bg, border: `1px solid ${pack.color}40`,
                    borderRadius: 8, color: pack.color,
                    fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                    cursor: 'pointer',
                  }}>
                  Add {pack.habits.length} habits from this pack →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────

export default function HabitBuilder() {
  const [habits, setHabits]     = useState<Habit[]>([])
  const [view, setView]         = useState<'today' | 'all' | 'add'>('today')
  const [showStats, setShowStats] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const refreshHabits = (raw: Habit[]) =>
      raw.map(h => ({ ...h, completedToday: h.lastCheckedIn === today() }))

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // No auth — use localStorage only
        setHabits(refreshHabits(loadHabitsLocal()))
        return
      }
      supabase.from('user_habits_state').select('habits').eq('user_id', user.id).single()
        .then(({ data }) => {
          if (data?.habits && Array.isArray(data.habits) && data.habits.length > 0) {
            setHabits(refreshHabits(data.habits as Habit[]))
            saveHabitsLocal(data.habits as Habit[])
          } else {
            const local = loadHabitsLocal()
            setHabits(refreshHabits(local))
            if (local.length > 0) {
              supabase.from('user_habits_state').upsert({ user_id: user.id, habits: local, updated_at: new Date().toISOString() }).then(() => {})
            }
          }
        })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const persist = (updated: Habit[]) => {
    setHabits(updated)
    saveHabitsLocal(updated)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) supabase.from('user_habits_state').upsert({ user_id: user.id, habits: updated, updated_at: new Date().toISOString() }).then(() => {})
      })
    }, 1000)
  }

  const [milestone, setMilestone] = useState<{ name: string; streak: number } | null>(null)
  const milestoneRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const MILESTONES = [7, 14, 21, 30, 60, 100]

  const toggleHabit = (id: string) => {
    const updated = habits.map(h => {
      if (h.id !== id) return h
      const checking = h.lastCheckedIn !== today()
      const newStreak = calcStreak(h, checking)

      if (checking) {
        // Emit signal
        signals.emit({
          type: 'habit_completed',
          payload: { habitId: h.id, habitName: h.name, streakDays: newStreak, pack: h.pack },
        })
        // Milestone celebration
        if (MILESTONES.includes(newStreak)) {
          if (milestoneRef.current) clearTimeout(milestoneRef.current)
          setMilestone({ name: h.name, streak: newStreak })
          milestoneRef.current = setTimeout(() => setMilestone(null), 4000)
        }
      }

      return {
        ...h,
        completedToday: checking,
        lastCheckedIn: checking ? today() : h.lastCheckedIn,
        streakDays: newStreak,
        totalCompleted: checking ? h.totalCompleted + 1 : h.totalCompleted,
      }
    })
    persist(updated)
  }

  const removeHabit = (id: string) => {
    persist(habits.filter(h => h.id !== id))
  }

  const addFromPack = (pack: Pack) => {
    const existingIds = new Set(habits.map(h => h.id))
    const newHabits: Habit[] = pack.habits
      .filter(h => !existingIds.has(`${pack.id}-${h.id}`))
      .map(h => ({
        id: `${pack.id}-${h.id}`,
        name: h.name,
        cue: h.cue,
        reward: h.reward,
        frequency: h.frequency,
        pack: pack.id,
        emoji: h.emoji,
        streakDays: 0,
        lastCheckedIn: null,
        completedToday: false,
        totalCompleted: 0,
      }))
    persist([...habits, ...newHabits])
    setView('today')
  }

  const todayHabits = habits.filter(h => {
    const dow = new Date().getDay()
    if (h.frequency === 'daily')    return true
    if (h.frequency === 'weekdays') return dow >= 1 && dow <= 5
    if (h.frequency === 'weekly') {
      const last = h.lastCheckedIn
      if (!last) return true
      const diff = Math.floor((Date.now() - new Date(last).getTime()) / 86400000)
      return diff >= 7
    }
    return true
  })

  const doneCount = todayHabits.filter(h => h.lastCheckedIn === today()).length
  const completionPct = todayHabits.length > 0 ? Math.round((doneCount / todayHabits.length) * 100) : 0
  const longestStreak = habits.reduce((max, h) => Math.max(max, h.streakDays), 0)
  const totalCheckins = habits.reduce((sum, h) => sum + h.totalCompleted, 0)

  const packFor = (h: Habit) => PACKS.find(p => p.id === h.pack) ?? null

  const hour = new Date().getHours()
  const streakAtRisk = hour >= 18
    ? todayHabits.filter(h => !h.completedToday && h.streakDays > 2)
    : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Milestone celebration */}
      {milestone && (
        <div style={{
          padding: '14px 16px', borderRadius: 14, textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(78,207,158,0.1))',
          border: '1px solid rgba(99,102,241,0.35)',
          animation: 'fadeInUp 0.3s ease',
        }}>
          <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>
            {milestone.streak >= 100 ? '🏆' : milestone.streak >= 30 ? '🥇' : milestone.streak >= 21 ? '⭐' : '🔥'}
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
            {milestone.streak}-day streak!
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {milestone.name} — keep going, you&apos;re building a real identity.
          </div>
        </div>
      )}

      {/* Streak-at-risk warning */}
      {streakAtRisk.length > 0 && (
        <div style={{
          padding: '10px 14px', borderRadius: 12,
          background: 'rgba(245,158,11,0.07)',
          border: '1px solid rgba(245,158,11,0.3)',
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
            🔥 STREAK AT RISK — COMPLETE BEFORE MIDNIGHT
          </div>
          {streakAtRisk.map(h => (
            <div key={h.id} style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
              {h.emoji} {h.name} — {h.streakDays} day streak
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'var(--bg-surface)', border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: 16, padding: '16px 18px',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, var(--indigo, #6366F1), transparent)',
        }} />
        <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--indigo, #6366F1)', letterSpacing: '0.09em', marginBottom: 4 }}>
          HABIT BUILDER — ATOMIC HABITS
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Small habits. Compound results.
        </div>

        {habits.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Today — {doneCount}/{todayHabits.length} done</span>
              <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--indigo, #6366F1)' }}>{completionPct}%</span>
            </div>
            <div style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 100 }}>
              <div style={{
                height: '100%', borderRadius: 100,
                background: completionPct === 100 ? 'var(--teal)' : 'var(--indigo, #6366F1)',
                width: `${completionPct}%`, transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Stats strip */}
      {habits.length > 0 && (
        <button
          onClick={() => setShowStats(v => !v)}
          style={{
            display: 'flex', gap: 0,
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
          }}>
          {[
            { label: 'Habits', value: habits.length },
            { label: 'Best streak', value: `${longestStreak}d` },
            { label: 'Total check-ins', value: totalCheckins },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: '10px 12px', textAlign: 'center',
              borderRight: i < 2 ? '1px solid var(--border-subtle)' : 'none',
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.57rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </button>
      )}

      {/* Tab row */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)' }}>
        {(['today', 'all', 'add'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              flex: 1, padding: '9px 0',
              background: 'none', border: 'none',
              borderBottom: view === v ? '2px solid var(--indigo, #6366F1)' : '2px solid transparent',
              color: view === v ? 'var(--indigo, #6366F1)' : 'var(--text-tertiary)',
              fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: view === v ? 700 : 400,
              cursor: 'pointer', marginBottom: -1,
            }}>
            {v === 'today' ? '📅 Today' : v === 'all' ? '📋 All habits' : '+ Add pack'}
          </button>
        ))}
      </div>

      {/* Content */}
      {view === 'today' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {todayHabits.length === 0 ? (
            <div style={{
              padding: '32px 20px', textAlign: 'center',
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 14,
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>🌱</div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                No habits yet
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                Start with the Morning Launch pack — it takes less than 20 minutes.
              </div>
              <button onClick={() => setView('add')} style={{
                marginTop: 14, padding: '9px 18px',
                background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.30)',
                borderRadius: 8, color: 'var(--indigo, #6366F1)',
                fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                cursor: 'pointer',
              }}>Add a habit pack →</button>
            </div>
          ) : (
            <>
              {completionPct === 100 && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.25)',
                  borderRadius: 12,
                  fontSize: '0.8rem', fontWeight: 700, color: 'var(--teal)', textAlign: 'center',
                }}>
                  🎉 All habits done today! Streak locked in.
                </div>
              )}
              {todayHabits.map(h => (
                <HabitCard key={h.id} habit={h} pack={packFor(h)} onToggle={toggleHabit} onRemove={removeHabit} />
              ))}
            </>
          )}
        </div>
      )}

      {view === 'all' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {habits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No habits saved yet.
            </div>
          ) : (
            habits.map(h => (
              <HabitCard key={h.id} habit={h} pack={packFor(h)} onToggle={toggleHabit} onRemove={removeHabit} />
            ))
          )}
        </div>
      )}

      {view === 'add' && (
        <PackPicker onAddPack={addFromPack} />
      )}

      {/* Atomic Habits principle footer */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 12, fontSize: '0.7rem', color: 'var(--text-muted)',
        fontStyle: 'italic', lineHeight: 1.6,
      }}>
        "You do not rise to the level of your goals. You fall to the level of your systems." — James Clear
      </div>
    </div>
  )
}
