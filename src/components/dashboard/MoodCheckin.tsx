'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const MOODS = [
  { score: 1 as const, emoji: '😔', label: 'Tough' },
  { score: 2 as const, emoji: '😐', label: 'Okay' },
  { score: 3 as const, emoji: '🙂', label: 'Good' },
  { score: 4 as const, emoji: '😄', label: 'Great' },
  { score: 5 as const, emoji: '🔥', label: 'On fire' },
]

interface Props {
  userId: string
}

export default function MoodCheckin({ userId }: Props) {
  const [todayScore, setTodayScore] = useState<number | null>(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseRef.current
    const today = new Date().toISOString().split('T')[0]
    supabase
      .from('mood_checkins')
      .select('mood_score')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setTodayScore(data.mood_score)
        setLoading(false)
      })
  }, [userId])

  const handleSelect = async (score: number) => {
    setSaving(true)
    setTodayScore(score)
    const today = new Date().toISOString().split('T')[0]
    await supabaseRef.current.from('mood_checkins').upsert(
      { user_id: userId, mood_score: score, date: today },
      { onConflict: 'user_id,date' }
    )
    setSaving(false)
  }

  if (loading) return null

  // Already checked in — show compact status
  if (todayScore !== null) {
    const mood = MOODS.find(m => m.score === todayScore)
    return (
      <div className="flex items-center gap-2 px-1">
        <span className="font-mono text-[0.58rem] text-white/25 uppercase tracking-widest">Today</span>
        <span className="text-base">{mood?.emoji}</span>
        <span className="font-mono text-[0.58rem] text-white/35">{mood?.label}</span>
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-white/7 rounded-2xl px-4 py-3.5">
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
            <span className="font-mono text-[0.5rem] text-white/25">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
