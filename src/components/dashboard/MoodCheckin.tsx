'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signals } from '@/store/signals'
import { queueWrite } from '@/lib/offline/pendingWrites'
import type { MoodScore } from '@/types'
import GratitudePrompt from '@/components/orchestration/GratitudePrompt'

const MOODS = [
  { score: 1 as const, emoji: '😔', label: 'Tough' },
  { score: 2 as const, emoji: '😐', label: 'Okay' },
  { score: 3 as const, emoji: '🙂', label: 'Good' },
  { score: 4 as const, emoji: '😄', label: 'Great' },
  { score: 5 as const, emoji: '🔥', label: 'On fire' },
]

// Mirror mood to localStorage so CalendarTab can read it without an extra Supabase query
export function cacheMood(date: string, score: number) {
  if (typeof window === 'undefined') return
  try {
    const cache = JSON.parse(localStorage.getItem('varsityos-mood-cache') ?? '{}')
    cache[date] = score
    // Keep 90 days max
    const keys = Object.keys(cache).sort().slice(-90)
    const trimmed: Record<string, number> = {}
    keys.forEach(k => { trimmed[k] = cache[k] })
    localStorage.setItem('varsityos-mood-cache', JSON.stringify(trimmed))
  } catch { /* quota */ }
}

interface Props { userId: string }

export default function MoodCheckin({ userId }: Props) {
  const [todayScore, setTodayScore]       = useState<number | null>(null)
  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)
  const [showGratitude, setShowGratitude] = useState(false)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    supabaseRef.current
      .from('mood_checkins')
      .select('mood_score')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setTodayScore(data.mood_score)
          cacheMood(today, data.mood_score)
        }
        setLoading(false)
      }, () => setLoading(false)) // never leave the card stuck hidden on a failed load
  }, [userId])

  const handleSelect = async (score: number) => {
    setSaving(true)
    setTodayScore(score) // optimistic — safe because failures are queued, not dropped
    const today = new Date().toISOString().split('T')[0]
    const row = { user_id: userId, mood_score: score, date: today }
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        // Offline (load shedding / no data) — queue so the check-in syncs later
        // instead of throwing an unhandled rejection and being lost.
        await queueWrite('mood_checkins', 'upsert', row)
      } else {
        const { error } = await supabaseRef.current
          .from('mood_checkins')
          .upsert(row, { onConflict: 'user_id,date' })
        if (error) await queueWrite('mood_checkins', 'upsert', row)
      }
    } catch {
      // Network threw mid-request — queue rather than lose the check-in.
      try { await queueWrite('mood_checkins', 'upsert', row) } catch { /* quota */ }
    } finally {
      setSaving(false)
    }

    // Signal emission
    signals.emit({ type: 'mood_logged', payload: { score: score as MoodScore, date: today } })

    // Mirror to localStorage for calendar
    cacheMood(today, score)

    // Evening gratitude prompt (after 5PM)
    const hour = new Date().getHours()
    if (hour >= 17) {
      // Only prompt if not already done today
      try {
        const existing = JSON.parse(localStorage.getItem('varsityos-gratitude') ?? '[]') as { date: string }[]
        const alreadyDone = existing.some(g => g.date === today)
        if (!alreadyDone) setShowGratitude(true)
      } catch { setShowGratitude(true) }
    }
  }

  if (loading) return null

  // Already checked in — show compact status
  if (todayScore !== null && !showGratitude) {
    const mood = MOODS.find(m => m.score === todayScore)
    return (
      <div className="flex items-center gap-2 px-1">
        <span className="font-mono text-[0.58rem] text-white/25 uppercase tracking-widest">Today</span>
        <span className="text-base">{mood?.emoji}</span>
        <span className="font-mono text-[0.58rem] text-white/35">{mood?.label}</span>
      </div>
    )
  }

  if (showGratitude) {
    return (
      <GratitudePrompt
        moodScore={todayScore ?? 3}
        onDone={() => setShowGratitude(false)}
      />
    )
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-white/10 rounded-2xl px-4 py-3.5">
      <div className="font-mono text-[0.58rem] text-white/30 uppercase tracking-widest mb-3">
        How are you feeling today?
      </div>
      <div className="flex items-center justify-between gap-1">
        {MOODS.map(mood => (
          <button
            key={mood.score}
            onClick={() => handleSelect(mood.score)}
            disabled={saving}
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-white/8 active:scale-95 transition-all disabled:opacity-50"
            title={mood.label}
          >
            <span className="text-2xl">{mood.emoji}</span>
            <span className="font-mono text-[0.65rem] text-white/25">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
