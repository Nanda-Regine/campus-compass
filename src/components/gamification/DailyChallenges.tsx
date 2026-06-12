'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTodayChallengesWithStatus, completeDailyChallenge, DailyChallenge } from '@/lib/xp-engine'

type Challenge = DailyChallenge & { completed: boolean }

export default function DailyChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [mounted, setMounted] = useState(false)

  const refresh = useCallback(() => {
    setChallenges(getTodayChallengesWithStatus())
  }, [])

  useEffect(() => {
    setMounted(true)
    refresh()
    window.addEventListener('varsityos:xp', refresh)
    return () => window.removeEventListener('varsityos:xp', refresh)
  }, [refresh])

  if (!mounted) return null

  const done = challenges.filter(c => c.completed).length

  return (
    <div style={{
      background: 'rgba(13,14,20,0.95)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '14px 16px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
          Daily Challenges
        </span>
        <span style={{
          fontFamily: 'JetBrains Mono,monospace', fontSize: 10,
          color: done === 3 ? '#4ecf9e' : 'rgba(255,255,255,0.35)',
          background: done === 3 ? 'rgba(78,207,158,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${done === 3 ? 'rgba(78,207,158,0.25)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 6, padding: '2px 7px',
        }}>
          {done}/3
        </span>
      </div>

      {/* Challenge rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {challenges.map(ch => (
          <ChallengeRow key={ch.id} challenge={ch} onComplete={refresh} />
        ))}
      </div>

      {done === 3 && (
        <div style={{
          marginTop: 10, padding: '8px 10px',
          background: 'rgba(78,207,158,0.06)', border: '1px solid rgba(78,207,158,0.2)',
          borderRadius: 8, textAlign: 'center',
          fontFamily: 'Sora,sans-serif', fontSize: 11, color: '#4ecf9e',
        }}>
          All challenges complete — come back tomorrow for new ones
        </div>
      )}
    </div>
  )
}

function ChallengeRow({ challenge: ch, onComplete }: { challenge: Challenge; onComplete: () => void }) {
  const [pressing, setPressing] = useState(false)

  function handleMark() {
    if (ch.completed) return
    completeDailyChallenge(ch.id, ch.title)
    onComplete()
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 10px', borderRadius: 10,
      background: ch.completed ? 'rgba(78,207,158,0.05)' : 'rgba(255,255,255,0.025)',
      border: `1px solid ${ch.completed ? 'rgba(78,207,158,0.18)' : 'rgba(255,255,255,0.06)'}`,
      opacity: ch.completed ? 0.7 : 1,
      transition: 'all 0.2s',
    }}>
      {/* Icon */}
      <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{ch.icon}</span>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 12,
          color: ch.completed ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.85)',
          textDecoration: ch.completed ? 'line-through' : 'none',
        }}>
          {ch.title}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
          {ch.description}
        </div>
      </div>

      {/* XP pill */}
      <span style={{
        fontFamily: 'JetBrains Mono,monospace', fontSize: 9,
        color: ch.completed ? 'rgba(78,207,158,0.6)' : 'rgba(255,255,255,0.3)',
        flexShrink: 0,
      }}>
        +{ch.xp} XP
      </span>

      {/* Mark done button (only for challenges without auto-detect) */}
      {!ch.autoDetect && !ch.completed && (
        <button
          onMouseDown={() => setPressing(true)}
          onMouseUp={() => { setPressing(false); handleMark() }}
          onMouseLeave={() => setPressing(false)}
          style={{
            flexShrink: 0, width: 22, height: 22, borderRadius: 6,
            background: pressing ? 'rgba(78,207,158,0.2)' : 'rgba(78,207,158,0.08)',
            border: '1px solid rgba(78,207,158,0.3)',
            color: '#4ecf9e', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          title="Mark as done"
        >
          ✓
        </button>
      )}

      {ch.completed && (
        <span style={{ flexShrink: 0, fontSize: 14 }}>✅</span>
      )}
    </div>
  )
}
