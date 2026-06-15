'use client'

// FocusEnvironmentSetup — pre-Pomodoro ritual modal.
// Research: a consistent pre-focus ritual reduces "I'm not ready" excuses
// and primes the prefrontal cortex for sustained attention (30-second habit stack).

import { useState } from 'react'

const CHECKLIST = [
  { id: 'tabs',  emoji: '💻', label: 'Close distracting tabs',      sub: 'Social media, news, YouTube' },
  { id: 'water', emoji: '💧', label: 'Get water or a snack',         sub: 'Hydration improves focus by 14%' },
  { id: 'phone', emoji: '📵', label: 'Phone face-down or on silent', sub: 'Notifications kill deep work' },
  { id: 'goal',  emoji: '🎯', label: 'Set your micro-goal',          sub: 'One concrete thing to finish this session' },
]

interface Props {
  taskTitle: string
  onReady: () => void
  onSkip: () => void
}

export default function FocusEnvironmentSetup({ taskTitle, onReady, onSkip }: Props) {
  const [checked, setChecked] = useState<string[]>([])
  const [goal, setGoal]       = useState('')

  const toggle = (id: string) =>
    setChecked(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const nonGoalItems = CHECKLIST.filter(c => c.id !== 'goal')
  const allNonGoalDone = nonGoalItems.every(c => checked.includes(c.id))
  const isReady = allNonGoalDone && goal.trim().length > 2

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9850,
      background: 'rgba(4,6,18,0.96)', backdropFilter: 'blur(16px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 24,
    }}>
      <div style={{ maxWidth: 380, width: '100%' }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#4ecf9e', letterSpacing: '0.18em', marginBottom: 12 }}>
          ⚡ PRE-FOCUS RITUAL
        </div>
        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 6, lineHeight: 1.2 }}>
          30 seconds to<br />prime your brain
        </div>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 28 }}>
          Working on: {taskTitle}
        </div>

        {/* Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {nonGoalItems.map(item => {
            const done = checked.includes(item.id)
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px', borderRadius: 14,
                  background: done ? 'rgba(78,207,158,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${done ? 'rgba(78,207,158,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${done ? '#4ecf9e' : 'rgba(255,255,255,0.2)'}`,
                  background: done ? '#4ecf9e' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {done && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5L8 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <div>
                  <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 13, color: done ? '#4ecf9e' : '#fff' }}>
                    {item.emoji} {item.label}
                  </div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                    {item.sub}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Micro-goal input */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: '0.1em' }}>
            🎯 THIS SESSION I WILL FINISH…
          </div>
          <input
            type="text"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="e.g. Write the introduction section"
            style={{
              width: '100%', padding: '11px 14px',
              fontFamily: 'Sora,sans-serif', fontSize: 13,
              background: goal.trim().length > 2 ? 'rgba(78,207,158,0.08)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${goal.trim().length > 2 ? 'rgba(78,207,158,0.3)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 12, color: '#fff', outline: 'none',
              boxSizing: 'border-box', transition: 'all 0.2s',
            }}
          />
        </div>

        {/* Progress indicator */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {[...nonGoalItems.map(c => checked.includes(c.id)), goal.trim().length > 2].map((done, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 3,
              background: done ? '#4ecf9e' : 'rgba(255,255,255,0.08)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <button
          onClick={onReady}
          disabled={!isReady}
          style={{
            width: '100%', padding: '15px 0',
            fontFamily: 'Sora,sans-serif', fontWeight: 900, fontSize: 16,
            borderRadius: 14, border: 'none', cursor: isReady ? 'pointer' : 'not-allowed',
            background: isReady ? '#4ecf9e' : 'rgba(255,255,255,0.07)',
            color: isReady ? '#000' : 'rgba(255,255,255,0.2)',
            transition: 'all 0.3s',
            boxShadow: isReady ? '0 0 24px rgba(78,207,158,0.3)' : 'none',
          }}
        >
          {isReady ? "▶ I'm ready — let's go" : `${[...nonGoalItems.map(c => checked.includes(c.id)), goal.trim().length > 2].filter(Boolean).length} / 4 complete`}
        </button>

        <button onClick={onSkip} style={{
          display: 'block', margin: '14px auto 0',
          fontFamily: '"JetBrains Mono",monospace', fontSize: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.2)',
        }}>
          skip ritual →
        </button>
      </div>
    </div>
  )
}
