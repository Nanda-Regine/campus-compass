'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface StreakData {
  streak: number
  longestStreak: number
  todayDone: boolean
}

export default function StreakWidget() {
  const [data, setData] = useState<StreakData | null>(null)

  useEffect(() => {
    fetch('/api/streak')
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {/* silent */})
  }, [])

  if (!data) return null
  if (data.streak === 0 && !data.todayDone) return null // hide until first task

  const isAlive = data.todayDone || data.streak > 0
  const isAtRisk = data.streak > 0 && !data.todayDone // streak alive but not protected today

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-xl border transition-all',
      data.streak >= 7 ? 'bg-amber-500/15 border-amber-500/25'
      : data.streak >= 3 ? 'bg-orange-500/10 border-orange-500/20'
      : 'bg-white/5 border-white/10'
    )}>
      <span className="text-lg">{data.streak >= 7 ? '🔥' : data.streak >= 3 ? '⚡' : '✨'}</span>
      <div>
        <p className={cn('font-display font-bold text-sm leading-none',
          data.streak >= 7 ? 'text-amber-400' : data.streak >= 3 ? 'text-orange-400' : 'text-white/70'
        )}>
          {data.streak} day{data.streak !== 1 ? 's' : ''} streak
        </p>
        {isAtRisk && (
          <p className="font-mono text-[0.55rem] text-amber-400/70 mt-0.5">Complete a task today to keep it!</p>
        )}
        {data.todayDone && (
          <p className="font-mono text-[0.55rem] text-white/30 mt-0.5">Today&apos;s streak protected ✓</p>
        )}
      </div>
    </div>
  )
}
