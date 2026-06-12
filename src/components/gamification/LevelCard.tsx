'use client'

import { useState, useEffect } from 'react'
import { loadXPState, getLevelProgress } from '@/lib/xp-engine'

export default function LevelCard() {
  const [xp, setXP] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setXP(loadXPState().totalXP)
    const handler = () => setXP(loadXPState().totalXP)
    window.addEventListener('varsityos:xp', handler)
    return () => window.removeEventListener('varsityos:xp', handler)
  }, [])

  if (!mounted) return null

  const { level, next, pct, xpThisLevel, xpToNext } = getLevelProgress(xp)

  return (
    <div style={{
      background: `linear-gradient(135deg, ${level.color}12 0%, rgba(13,14,20,0.95) 100%)`,
      border: `1px solid ${level.color}30`,
      borderRadius: 14, padding: '14px 16px',
      position: 'relative', overflow: 'hidden',
    }}>
      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${level.color} 0%, ${level.color}20 100%)` }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Level badge */}
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          background: `${level.color}18`, border: `1px solid ${level.color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {level.emoji}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
            <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, color: level.color }}>{level.name}</span>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{xp} XP</span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 5, borderRadius: 9999, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: `linear-gradient(90deg, ${level.color}, ${level.color}bb)`,
              borderRadius: 9999,
              transition: 'width 0.6s ease',
            }} />
          </div>

          {/* XP info below bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
              {xpThisLevel} / {next ? xpThisLevel + xpToNext : '—'} XP
            </span>
            {next ? (
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
                {xpToNext} to {next.emoji} {next.name}
              </span>
            ) : (
              <span style={{ fontSize: 9, color: level.color }}>Max level</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
