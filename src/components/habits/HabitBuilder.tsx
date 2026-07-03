'use client'

// ============================================================
// HabitBuilder — Atomic Habits system for students.
// 5 pre-built packs: Study, Wellness, Finances, Social, Morning
// Tracks streaks, cue-routine-reward loops, daily check-ins.
// Domain colour: --indigo (Growth OS)
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { dispatchXP } from '@/lib/xp-engine'
import { signals } from '@/store/signals'
import { createClient } from '@/lib/supabase/client'
import { refreshStreak } from '@/lib/intelligenceSync'

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
  checkInDates?: string[]       // SAST YYYY-MM-DD history — feeds the global streak
}

type HabitPack = 'study' | 'wellness' | 'finances' | 'social' | 'morning' | 'mental_health' | 'load_shedding' | 'exam_mode' | 'deep_work' | 'custom'

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
  {
    id: 'mental_health', name: 'Mind First', description: 'Daily rituals that protect your mental health through the academic grind.',
    color: 'var(--rose, #FB7185)', bg: 'rgba(251,113,133,0.08)', emoji: '🧠',
    habits: [
      { id: 'mh1', name: 'Morning gratitude (3 things)', cue: 'Before you check your phone', reward: 'Retrains your brain to notice good — backed by 12-week studies', frequency: 'daily', emoji: '🙏' },
      { id: 'mh2', name: '10-minute free journal', cue: 'After dinner, pen and paper only', reward: 'Externalises anxiety — stops thoughts looping at 2am', frequency: 'daily', emoji: '📓' },
      { id: 'mh3', name: 'Digital sunset at 9pm', cue: 'Set a phone alarm called "Sunset"', reward: '40% deeper sleep; less comparison anxiety', frequency: 'daily', emoji: '🌅' },
      { id: 'mh4', name: '5-minute nature or sunlight break', cue: 'Between study blocks', reward: 'Serotonin boost that lasts 2–3 hours', frequency: 'daily', emoji: '☀️' },
      { id: 'mh5', name: 'Box breathing when stressed', cue: 'When you feel your chest tighten', reward: 'Cortisol drops measurably in 90 seconds', frequency: 'daily', emoji: '🫁' },
      { id: 'mh6', name: 'One screen-free social hour', cue: 'Saturday afternoon', reward: 'Real connection restores what social media drains', frequency: 'weekly', emoji: '🤝' },
    ],
  },
  {
    id: 'load_shedding', name: 'Load Shedding Proof', description: 'Stay productive when Eskom cuts the power. Built for SA students.',
    color: 'var(--gold)', bg: 'var(--gold-dim)', emoji: '🕯️',
    habits: [
      { id: 'ls1', name: 'Charge devices before 8am', cue: 'First thing after waking', reward: 'Never caught at 5% when power goes', frequency: 'daily', emoji: '🔋' },
      { id: 'ls2', name: 'Print or screenshot tomorrow\'s key notes', cue: 'Night before, while power is on', reward: 'Offline revision ready for any outage', frequency: 'daily', emoji: '🖨️' },
      { id: 'ls3', name: 'Pre-plan candle/torch study spot', cue: 'When load shedding schedule drops', reward: 'No scramble when it goes dark at 6pm', frequency: 'weekly', emoji: '🕯️' },
      { id: 'ls4', name: 'Download lectures/videos for offline', cue: 'After your last online session', reward: 'Content available even on Stage 6', frequency: 'daily', emoji: '⬇️' },
      { id: 'ls5', name: 'Use load shedding for flashcard review', cue: 'When power goes — no laptop needed', reward: 'Turns frustration into 25 min of spaced repetition', frequency: 'daily', emoji: '🗂️' },
    ],
  },
  {
    id: 'exam_mode', name: 'Exam Mode', description: 'The habits that separate distinction students from those who just scrape through.',
    color: 'var(--coral, #F97316)', bg: 'rgba(249,115,22,0.08)', emoji: '📝',
    habits: [
      { id: 'em1', name: 'One past paper per day (timed)', cue: 'After your first study block', reward: 'Question pattern recognition builds in 5 days', frequency: 'daily', emoji: '📄' },
      { id: 'em2', name: 'Sleep by 10:30pm', cue: 'Phone alarm at 10pm = start winding down', reward: 'Memory consolidates during sleep — cramming at 2am costs more than it earns', frequency: 'daily', emoji: '🌙' },
      { id: 'em3', name: 'No social media after 9pm', cue: 'Put phone in drawer after dinner', reward: 'Removes comparison anxiety before sleep + saves 45 min of scrolling', frequency: 'daily', emoji: '📵' },
      { id: 'em4', name: 'Protein breakfast on exam day', cue: 'Set ingredients out night before', reward: 'Brain needs glucose + protein — skipping breakfast drops concentration by 20%', frequency: 'daily', emoji: '🥚' },
      { id: 'em5', name: 'Review weak topics first each session', cue: 'Before you open what you already know', reward: 'Strengthens lowest-scored areas first — maximises marks gained', frequency: 'daily', emoji: '🎯' },
    ],
  },
  {
    id: 'deep_work', name: 'Deep Work', description: 'Cal Newport\'s framework for producing your best academic work without distraction.',
    color: 'var(--indigo, #6366F1)', bg: 'rgba(99,102,241,0.08)', emoji: '🔬',
    habits: [
      { id: 'dw1', name: '90-min deep work block (phone away)', cue: 'After morning routine — before 11am', reward: 'Produces 4× the output of distracted working — Cal Newport', frequency: 'daily', emoji: '🔒' },
      { id: 'dw2', name: 'Single-task only (one tab open)', cue: 'When you sit at your desk', reward: 'Task-switching costs 23 min recovery time per interruption', frequency: 'daily', emoji: '🎯' },
      { id: 'dw3', name: 'End-of-day shutdown ritual', cue: 'When your last study session ends', reward: 'Tells your brain work is done — prevents evening anxiety', frequency: 'daily', emoji: '✅' },
      { id: 'dw4', name: 'Plan tomorrow the night before', cue: 'During shutdown ritual', reward: 'Zeigarnik effect: planning releases the mental "open loop" so you sleep better', frequency: 'daily', emoji: '📋' },
      { id: 'dw5', name: 'Weekly deep work review (Sunday 5pm)', cue: 'Before the week starts', reward: 'Know exactly what got done vs planned — compound improvement week on week', frequency: 'weekly', emoji: '📊' },
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

// SAST calendar date — toISOString() is UTC and rolls over at 02:00 SAST, which would
// mis-attribute a late-night check-in to the next day and break "checked in today" logic.
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })

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
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>day streak</div>
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
      raw.map(h => ({
        ...h,
        completedToday: h.lastCheckedIn === today(),
        // Backfill history for habits saved before check-in dates were tracked,
        // so an existing streak still counts toward the global streak.
        checkInDates: h.checkInDates ?? (h.lastCheckedIn ? [h.lastCheckedIn] : []),
      }))

    // Merge remote and local habit arrays. For each habit, keep whichever copy
    // has the more recent lastCheckedIn (string comparison works for YYYY-MM-DD).
    // This prevents stale Supabase data from overwriting a fresh local check-in.
    const mergeHabits = (remote: Habit[], local: Habit[]): Habit[] => {
      if (!local.length) return remote
      const localMap = new Map(local.map(h => [h.id, h]))
      const merged = remote.map(h => {
        const lh = localMap.get(h.id)
        if (!lh) return h
        const remoteDate = h.lastCheckedIn ?? ''
        const localDate  = lh.lastCheckedIn ?? ''
        if (localDate > remoteDate) return lh
        if (localDate === remoteDate && lh.streakDays > h.streakDays) return lh
        return h
      })
      // Add any local-only habits not in remote
      local.forEach(lh => { if (!remote.find(r => r.id === lh.id)) merged.push(lh) })
      return merged
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setHabits(refreshHabits(loadHabitsLocal()))
        return
      }
      supabase.from('user_habits_state').select('habits').eq('user_id', user.id).single()
        .then(({ data }) => {
          const local = loadHabitsLocal()
          if (data?.habits && Array.isArray(data.habits) && data.habits.length > 0) {
            const merged = mergeHabits(data.habits as Habit[], local)
            setHabits(refreshHabits(merged))
            saveHabitsLocal(merged)
          } else {
            setHabits(refreshHabits(local))
            if (local.length > 0) {
              supabase.from('user_habits_state').upsert({ user_id: user.id, habits: local, updated_at: new Date().toISOString() }).then(() => {})
            }
          }
        })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const syncToDB = async (updated: Habit[]) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('user_habits_state')
      .upsert({ user_id: user.id, habits: updated, updated_at: new Date().toISOString() })
    if (error) console.error('[habits] sync failed:', error.message)
  }

  const persist = (updated: Habit[], immediate = false) => {
    setHabits(updated)
    saveHabitsLocal(updated)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (immediate) {
      // Flush now so /api/streak sees today's check-in before we re-read it.
      return syncToDB(updated)
    }
    // Debounce rapid toggles but don't wait longer than 400ms so navigation
    // away from the page doesn't silently lose the streak update.
    saveTimer.current = setTimeout(() => { syncToDB(updated) }, 400)
    return Promise.resolve()
  }

  const [milestone, setMilestone] = useState<{ name: string; streak: number } | null>(null)
  const milestoneRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const MILESTONES = [7, 14, 21, 30, 60, 100]

  const toggleHabit = (id: string) => {
    const t = today()
    const updated = habits.map(h => {
      if (h.id !== id) return h
      const dates = h.checkInDates ?? (h.lastCheckedIn ? [h.lastCheckedIn] : [])

      // ── Un-check today's completion ────────────────────────────
      // Previously this was a no-op (lastCheckedIn stayed = today), so the card
      // could never be un-ticked. Revert to the prior check-in state instead.
      if (h.lastCheckedIn === t) {
        const remaining = dates.filter(d => d !== t)
        return {
          ...h,
          completedToday: false,
          lastCheckedIn: remaining.length ? remaining[remaining.length - 1] : null,
          streakDays: Math.max(0, h.streakDays - 1),
          totalCompleted: Math.max(0, h.totalCompleted - 1),
          checkInDates: remaining,
        }
      }

      // ── Check in for today ─────────────────────────────────────
      const newStreak = calcStreak(h, true)
      dispatchXP('habit_checkin')
      if (newStreak === 7)   dispatchXP('habit_streak_7')
      if (newStreak === 30)  dispatchXP('habit_streak_30')
      if (newStreak === 100) dispatchXP('habit_streak_100')
      signals.emit({
        type: 'habit_completed',
        payload: { habitId: h.id, habitName: h.name, streakDays: newStreak, pack: h.pack },
      })
      if (MILESTONES.includes(newStreak)) {
        if (milestoneRef.current) clearTimeout(milestoneRef.current)
        setMilestone({ name: h.name, streak: newStreak })
        milestoneRef.current = setTimeout(() => setMilestone(null), 4000)
      }

      return {
        ...h,
        completedToday: true,
        lastCheckedIn: t,
        streakDays: newStreak,
        totalCompleted: h.totalCompleted + 1,
        // Keep a bounded date history — this is what makes a daily habit
        // extend the global streak even on days with no completed tasks.
        checkInDates: [...new Set([...dates, t])].sort().slice(-120),
      }
    })
    // Flush to DB first, then re-read the global streak so it reflects today.
    persist(updated, true).then(() => refreshStreak()).catch(() => {})
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
        checkInDates: [],
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
