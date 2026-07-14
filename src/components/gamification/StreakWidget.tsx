'use client'

import { useState, useEffect } from 'react'

const STYLE_ID = 'varsityos-streak-styles'

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes sw-bob {
      0%, 100% { transform: translateY(0) scale(1); }
      40%       { transform: translateY(-5px) scale(1.08); }
      60%       { transform: translateY(2px) scale(0.96); }
    }
    @keyframes sw-shake {
      0%, 100%  { transform: translateX(0); }
      14%       { transform: translateX(-5px); }
      28%       { transform: translateX(5px); }
      42%       { transform: translateX(-4px); }
      56%       { transform: translateX(4px); }
      70%       { transform: translateX(-2px); }
      84%       { transform: translateX(2px); }
    }
    @keyframes sw-milestone-glow {
      0%, 100% { filter: drop-shadow(0 0 4px var(--sw-fc)); }
      50%      { filter: drop-shadow(0 0 10px var(--sw-fc)) drop-shadow(0 0 18px var(--sw-fc)); }
    }
    @keyframes sw-dot-pop {
      0%   { transform: scale(0); }
      60%  { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
  `
  document.head.appendChild(el)
}

interface StreakData {
  streak:        number
  longestStreak: number
  todayDone:     boolean
  last7days:     boolean[]
}

const MILESTONES = [
  { days: 3,   emoji: '🔥' },
  { days: 7,   emoji: '⚡' },
  { days: 14,  emoji: '💎' },
  { days: 30,  emoji: '🏆' },
  { days: 100, emoji: '👑' },
]

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function flameColor(streak: number): string {
  if (streak >= 30) return '#ff2a2a'
  if (streak >= 14) return '#ff5422'
  if (streak >= 7)  return '#ff7e00'
  if (streak >= 3)  return '#ff9a00'
  return '#ffb01c'
}

export default function StreakWidget() {
  const [data, setData]     = useState<StreakData | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    injectStyles()
    setMounted(true)
    fetch('/api/streak')
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
  }, [])

  if (!mounted || !data) return null
  if (data.streak === 0 && !data.todayDone) return null

  const isAtRisk = data.streak > 0 && !data.todayDone
  const fc       = flameColor(data.streak)
  const last7    = data.last7days?.length === 7 ? data.last7days : Array(7).fill(false)

  // Map each slot (0=6 days ago, 6=today) to a day-of-week label
  const todayDow = (new Date().getDay() + 6) % 7  // 0=Mon, 6=Sun

  return (
    <div
      style={{
        ['--sw-fc' as string]: fc,
        position: 'relative',
        background: `linear-gradient(145deg, ${fc}08 0%, rgba(0,0,0,0) 60%)`,
        border: `1px solid ${fc}22`,
        borderRadius: 20,
        padding: '18px 18px 15px',
        overflow: 'hidden',
        animation: isAtRisk ? 'sw-shake 0.65s ease 0.5s 3' : 'none',
      }}
    >
      {/* Top ambient glow */}
      <div style={{
        position: 'absolute', top: -48, left: '50%', transform: 'translateX(-50%)',
        width: 180, height: 90, borderRadius: '50%',
        background: `radial-gradient(ellipse, ${fc}14 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Best-streak badge — top right */}
      <div style={{
        position: 'absolute', top: 13, right: 14,
        textAlign: 'right', lineHeight: 1.3,
      }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>
          best
        </div>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 13, fontWeight: 700, color: fc }}>
          {data.longestStreak}d
        </div>
      </div>

      {/* Flame + count row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          fontSize: 44, lineHeight: 1,
          animation: 'sw-bob 2.6s ease-in-out infinite',
          filter: `drop-shadow(0 0 14px ${fc}bb)`,
        }}>
          🔥
        </div>
        <div>
          <div style={{
            fontFamily: 'Sora, sans-serif', fontWeight: 900,
            fontSize: 42, lineHeight: 1, letterSpacing: '-0.05em',
            color: fc, textShadow: `0 0 24px ${fc}55`,
          }}>
            {data.streak}
          </div>
          <div style={{
            fontFamily: '"JetBrains Mono",monospace',
            fontSize: 8.5, letterSpacing: '0.11em',
            marginTop: 3,
            color: isAtRisk ? '#ff9a00' : data.todayDone ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.45)',
          }}>
            {isAtRisk ? '⚠ AT RISK — DO A TASK OR HABIT' : data.todayDone ? 'PROTECTED TODAY ✓' : 'DAY STREAK'}
          </div>
        </div>
      </div>

      {/* 7-day dot calendar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4, marginBottom: 14,
      }}>
        {last7.map((done, i) => {
          const dow    = (todayDow - (6 - i) + 7) % 7
          const isToday = i === 6
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: done
                  ? isToday ? fc : `${fc}66`
                  : 'rgba(255,255,255,0.07)',
                border: isToday
                  ? `2px solid ${fc}`
                  : done ? `1px solid ${fc}40` : '1px solid rgba(255,255,255,0.1)',
                boxShadow: done && isToday ? `0 0 9px ${fc}99` : 'none',
                animation: done ? `sw-dot-pop 0.3s ease ${i * 0.04}s both` : 'none',
              }} />
              <div style={{
                fontFamily: '"JetBrains Mono",monospace', fontSize: 8,
                color: isToday ? fc : done ? 'rgba(255,255,255,0.58)' : 'rgba(255,255,255,0.18)',
                letterSpacing: '0.04em',
              }}>
                {DAY_LABELS[dow]}
              </div>
            </div>
          )
        })}
      </div>

      {/* Milestone map */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        paddingTop: 11,
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}>
        {MILESTONES.map(m => {
          const reached = data.streak >= m.days
          return (
            <div key={m.days} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              flex: 1, opacity: reached ? 1 : 0.28,
              transition: 'opacity 0.5s ease',
            }}>
              <div style={{
                fontSize: 17,
                animation: reached ? 'sw-milestone-glow 2.8s ease-in-out infinite' : 'none',
              }}>
                {m.emoji}
              </div>
              <div style={{
                fontFamily: '"JetBrains Mono",monospace', fontSize: 8,
                color: reached ? fc : 'rgba(255,255,255,0.42)',
                letterSpacing: '0.04em',
              }}>
                {m.days}d
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
