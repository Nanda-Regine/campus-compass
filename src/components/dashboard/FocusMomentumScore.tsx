'use client'

// FocusMomentumScore — daily 0-100 focus score with 7-day sparkline.
// Computed purely from XP state in localStorage — no API calls.
// Color-coded: <30 red · 30-60 amber · 60-80 green · 80+ gold

import { useState, useEffect, useMemo } from 'react'
import { loadXPState } from '@/lib/xp-engine'

function dateKey(daysAgo = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

function computeScore(events: string[]): number {
  const counts: Record<string, number> = {}
  for (const e of events) counts[e] = (counts[e] ?? 0) + 1

  const pomodoro  = Math.min(40, (counts['pomodoro_session'] ?? 0) * 13)
  const tasks     = Math.min(25, (counts['task_complete'] ?? 0) * 8)
  const habits    = Math.min(20, (counts['habit_checkin'] ?? 0) * 7)
  const wellness  = Math.min(15, (counts['wellness_checkin'] ?? 0) * 15)
  return Math.round(pomodoro + tasks + habits + wellness)
}

function scoreColor(score: number): string {
  if (score >= 80) return '#c9a84c'
  if (score >= 60) return '#4ecf9e'
  if (score >= 30) return '#f59e0b'
  return '#ff6b6b'
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'On fire 🔥'
  if (score >= 60) return 'Solid 💪'
  if (score >= 30) return 'Getting there'
  return 'Needs a push'
}

// ── SVG Sparkline ─────────────────────────────────────────────────────────────

function Sparkline({ scores }: { scores: number[] }) {
  const W = 160, H = 36, PAD = 4
  const max = Math.max(...scores, 1)
  const pts = scores.map((s, i) => {
    const x = PAD + (i / (scores.length - 1)) * (W - PAD * 2)
    const y = H - PAD - (s / max) * (H - PAD * 2)
    return `${x},${y}`
  })
  const today = scores[scores.length - 1]
  const color = scoreColor(today)
  const lastX = PAD + ((scores.length - 1) / (scores.length - 1)) * (W - PAD * 2)
  const lastY = H - PAD - (today / Math.max(max, 1)) * (H - PAD * 2)

  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }}>
      {/* Area fill */}
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`${PAD},${H} ${pts.join(' ')} ${W - PAD},${H}`}
        fill="url(#sparkGrad)"
      />
      <polyline
        points={pts.join(' ')}
        fill="none" stroke={color} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Today dot */}
      <circle cx={lastX} cy={lastY} r={3.5} fill={color} />
    </svg>
  )
}

// ── Score Arc ─────────────────────────────────────────────────────────────────

function ScoreArc({ score }: { score: number }) {
  const R = 36, size = 88
  const circ = 2 * Math.PI * R
  // Arc spans 200° (start -110°, end +90°)
  const ARC_DEG = 200
  const arcLen  = (ARC_DEG / 360) * circ
  const gap     = circ - arcLen
  const fill    = (score / 100) * arcLen
  const rotate  = -110  // degrees
  const color   = scoreColor(score)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size/2} cy={size/2} r={R}
        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6}
        strokeDasharray={`${arcLen} ${gap}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(${rotate} ${size/2} ${size/2})`}
      />
      <circle
        cx={size/2} cy={size/2} r={R}
        fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(${rotate} ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 1s ease, stroke 0.5s ease' }}
      />
      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 18, fill: color }}>
        {score}
      </text>
      <text x={size/2} y={size/2 + 16} textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 7, fill: 'rgba(255,255,255,0.3)' }}>
        /100
      </text>
    </svg>
  )
}

// ── Day dots ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ── Main ──────────────────────────────────────────────────────────────────────

export default function FocusMomentumScore() {
  const [scores,  setScores]  = useState<number[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const state = loadXPState()
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const key    = dateKey(6 - i)
        const events = state.dailyEventLog[key] ?? []
        return computeScore(events)
      })
      setScores(last7)
    } catch {
      setScores(Array(7).fill(0))
    }
  }, [])

  // Refresh when XP fires
  useEffect(() => {
    const handler = () => {
      try {
        const state = loadXPState()
        const key   = dateKey(0)
        const score = computeScore(state.dailyEventLog[key] ?? [])
        setScores(prev => {
          const next = [...prev]
          next[6] = score
          return next
        })
      } catch { /* ignore */ }
    }
    window.addEventListener('varsityos:xp', handler)
    return () => window.removeEventListener('varsityos:xp', handler)
  }, [])

  const todayScore = useMemo(() => scores[6] ?? 0, [scores])
  const yesterday  = useMemo(() => scores[5] ?? 0, [scores])
  const trend      = todayScore - yesterday
  const color      = scoreColor(todayScore)

  if (!mounted || scores.length === 0) return null

  return (
    <div style={{
      borderRadius: 18, padding: '16px 18px',
      border: `1px solid ${color}22`,
      background: `linear-gradient(145deg, ${color}06 0%, rgba(0,0,0,0) 70%)`,
    }}>
      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color, letterSpacing: '0.18em', marginBottom: 12 }}>
        ⚡ FOCUS MOMENTUM SCORE
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <ScoreArc score={todayScore} />
        <div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 900, fontSize: 18, color, lineHeight: 1 }}>
            {scoreLabel(todayScore)}
          </div>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 5 }}>
            {trend > 0 ? `▲ +${trend}` : trend < 0 ? `▼ ${trend}` : '— same'} vs yesterday
          </div>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 8, lineHeight: 1.6 }}>
            🍅 Pomodoros · ✅ Tasks<br/>🔄 Habits · 🧠 Check-ins
          </div>
        </div>
      </div>

      {/* 7-day sparkline */}
      <div style={{ marginBottom: 8 }}>
        <Sparkline scores={scores} />
      </div>

      {/* Day labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {Array.from({ length: 7 }, (_, i) => {
          const dow = (new Date().getDay() + 6 - (6 - i)) % 7
          return (
            <div key={i} style={{
              fontFamily: '"JetBrains Mono",monospace', fontSize: 8,
              color: i === 6 ? color : 'rgba(255,255,255,0.2)',
              fontWeight: i === 6 ? 700 : 400,
            }}>
              {DAY_LABELS[dow]}
            </div>
          )
        })}
      </div>

      {/* Breakdown hint */}
      {todayScore < 30 && (
        <div style={{
          marginTop: 12, padding: '8px 12px', borderRadius: 9,
          background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)',
          fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#ff6b6b',
        }}>
          One Pomodoro right now adds +13 points. Start small.
        </div>
      )}
      {todayScore >= 80 && (
        <div style={{
          marginTop: 12, padding: '8px 12px', borderRadius: 9,
          background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
          fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#c9a84c',
        }}>
          ✦ Elite session — you've earned your reward today.
        </div>
      )}
    </div>
  )
}
