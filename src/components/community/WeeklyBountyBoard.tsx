'use client'

// WeeklyBountyBoard — community-wide collective goal for the current week.
// Every Pomodoro or completed task increments a shared counter in Supabase.
// Seeing the community close in on a goal is a powerful social motivator.

import { useState, useEffect, useRef } from 'react'
import { loadXPState } from '@/lib/xp-engine'

interface BountyEvent {
  count: number
  goal:  number
}
interface BountyData {
  week_start: string
  events: Record<string, BountyEvent>
}

const BOUNTY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  pomodoro_session: { label: 'Pomodoros',   emoji: '🍅', color: '#ff6b6b' },
  task_complete:    { label: 'Tasks done',  emoji: '✅', color: '#4ecf9e' },
}

function Gauge({ count, goal, color }: { count: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min(100, Math.round((count / goal) * 100)) : 0
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color, fontWeight: 700 }}>
          {count.toLocaleString()} / {goal.toLocaleString()}
        </div>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
          {pct}%
        </div>
      </div>
      <div style={{ height: 8, borderRadius: 8, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 8, background: color,
          width: `${pct}%`, transition: 'width 1s ease',
          boxShadow: pct > 0 ? `0 0 8px ${color}60` : 'none',
        }} />
      </div>
    </div>
  )
}

export default function WeeklyBountyBoard() {
  const [data,       setData]       = useState<BountyData | null>(null)
  const [myContrib,  setMyContrib]  = useState<Record<string, number>>({})
  const [mounted,    setMounted]    = useState(false)
  const sentRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    setMounted(true)

    // Load community bounty
    fetch('/api/bounty').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setData(d)
    }).catch(() => {})

    // Calculate this user's weekly contribution from local XP state
    try {
      const state = loadXPState()
      const contrib: Record<string, number> = {}
      const today = new Date()
      for (let i = 0; i < 7; i++) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        const key = d.toISOString().split('T')[0]
        const events = state.dailyEventLog[key] ?? []
        for (const e of events) {
          if (e === 'pomodoro_session' || e === 'task_complete') {
            contrib[e] = (contrib[e] ?? 0) + 1
          }
        }
      }
      setMyContrib(contrib)
    } catch { /* ignore */ }

    // Listen to XP events and increment bounty counter
    const handler = (ev: Event) => {
      const { eventName } = (ev as CustomEvent).detail
      if (!['pomodoro_session', 'task_complete'].includes(eventName)) return
      // Deduplicate per session per event (avoid duplicate POSTs on re-renders)
      const sessionKey = `${eventName}_${Date.now()}`
      if (sentRef.current.has(eventName)) return
      sentRef.current.add(eventName)
      setTimeout(() => sentRef.current.delete(eventName), 60_000) // re-allow after 1 min

      fetch('/api/bounty', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: eventName }),
      }).then(() => {
        // Refresh bounty display
        fetch('/api/bounty').then(r => r.ok ? r.json() : null).then(d => {
          if (d) setData(d)
        })
      }).catch(() => {})
    }

    window.addEventListener('varsityos:xp', handler)
    return () => window.removeEventListener('varsityos:xp', handler)
  }, [])

  if (!mounted) return null

  const weekLabel = data?.week_start
    ? new Date(data.week_start).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
    : 'This week'

  const totalPomodoros = data?.events?.['pomodoro_session']?.count ?? 0
  const pomodoroGoal   = data?.events?.['pomodoro_session']?.goal  ?? 500
  const pct            = pomodoroGoal > 0 ? Math.min(100, Math.round((totalPomodoros / pomodoroGoal) * 100)) : 0

  const MILESTONES = [25, 50, 75, 100]

  return (
    <div>
      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7090d0', letterSpacing: '0.18em', marginBottom: 10 }}>
        🎯 WEEKLY COMMUNITY BOUNTY
      </div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
        Study together, win together
      </div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 18, lineHeight: 1.5 }}>
        Week of {weekLabel} · All VarsityOS students contribute
      </div>

      {/* Main pomodoro bounty */}
      <div style={{
        padding: '14px 16px', borderRadius: 14, marginBottom: 12,
        background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>🍅</span>
          <div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
              Community Pomodoros
            </div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
              Goal: {pomodoroGoal.toLocaleString()} this week
            </div>
          </div>
        </div>
        <Gauge count={totalPomodoros} goal={pomodoroGoal} color="#ff6b6b" />

        {/* Milestone markers */}
        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
          {MILESTONES.map(m => {
            const reached = pct >= m
            return (
              <div key={m} style={{
                padding: '3px 8px', borderRadius: 6,
                fontFamily: '"JetBrains Mono",monospace', fontSize: 8, fontWeight: 700,
                background: reached ? 'rgba(255,107,107,0.2)' : 'rgba(255,255,255,0.04)',
                color: reached ? '#ff6b6b' : 'rgba(255,255,255,0.2)',
                border: `1px solid ${reached ? 'rgba(255,107,107,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}>
                {reached ? '✓' : ''} {m}%
              </div>
            )
          })}
        </div>
      </div>

      {/* Task completion bounty */}
      {data?.events?.['task_complete'] && (
        <div style={{
          padding: '14px 16px', borderRadius: 14, marginBottom: 12,
          background: 'rgba(78,207,158,0.05)', border: '1px solid rgba(78,207,158,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <div>
              <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                Community Tasks
              </div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                Goal: {(data.events['task_complete'].goal).toLocaleString()} this week
              </div>
            </div>
          </div>
          <Gauge
            count={data.events['task_complete'].count}
            goal={data.events['task_complete'].goal}
            color="#4ecf9e"
          />
        </div>
      )}

      {/* My contribution */}
      {Object.keys(myContrib).length > 0 && (
        <div style={{
          padding: '10px 14px', borderRadius: 11,
          background: 'rgba(112,144,208,0.07)', border: '1px solid rgba(112,144,208,0.15)',
        }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#7090d0', marginBottom: 6 }}>
            YOUR CONTRIBUTION THIS WEEK
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {Object.entries(myContrib).map(([event, count]) => {
              const meta = BOUNTY_LABELS[event]
              if (!meta) return null
              return (
                <div key={event} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 13 }}>{meta.emoji}</span>
                  <div>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 12, color: meta.color }}>
                      {count}
                    </div>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 7, color: 'rgba(255,255,255,0.25)' }}>
                      {meta.label}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
