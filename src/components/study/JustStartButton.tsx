'use client'

// JustStartButton — zero-friction focus launcher.
// Shows the #1 most urgent pending task and auto-starts a Pomodoro with one tap.
// Research: starting is 90% of the battle. Decision fatigue kills momentum.

import { useState, useEffect, useRef, useCallback } from 'react'
import { dispatchXP } from '@/lib/xp-engine'
import type { Task } from '@/types'
import FocusEnvironmentSetup from '@/components/study/FocusEnvironmentSetup'

const STYLE_ID = 'varsityos-juststart-styles'
function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes js-pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(78,207,158,0.4)} 50%{box-shadow:0 0 0 10px rgba(78,207,158,0)} }
    @keyframes js-ring    { from{stroke-dashoffset:var(--js-full)} to{stroke-dashoffset:0} }
    @keyframes js-slide-up{ from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes js-pop     { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
    @keyframes js-count   { from{transform:scale(1.4);opacity:0} to{transform:scale(1);opacity:1} }
    @keyframes js-shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
  `
  document.head.appendChild(el)
}

const DURATIONS = [
  { label: '5m', minutes: 5,  emoji: '⚡', desc: 'Micro sprint' },
  { label: '25m', minutes: 25, emoji: '🍅', desc: 'Classic' },
  { label: '50m', minutes: 50, emoji: '🔥', desc: 'Power' },
]

function pickTopTask(tasks: Task[]): Task | null {
  const pending = tasks.filter(t => t.status !== 'done')
  if (!pending.length) return null
  const today = new Date().toISOString().split('T')[0]
  return [...pending].sort((a, b) => {
    const aOver = !!(a.due_date && a.due_date < today)
    const bOver = !!(b.due_date && b.due_date < today)
    if (aOver && !bOver) return -1
    if (!aOver && bOver) return 1
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_date && !b.due_date) return -1
    if (!a.due_date && b.due_date) return 1
    return 0
  })[0]
}

// ── Circular SVG Timer ────────────────────────────────────────────────────────

function CircleTimer({ pct, size = 180, color = '#4ecf9e' }: { pct: number; size?: number; color?: string }) {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
    </svg>
  )
}

// ── Focus Session Modal ───────────────────────────────────────────────────────

interface FocusModalProps {
  task: Task
  onComplete: (minutes: number) => void
  onAbandon: () => void
}

function FocusSessionModal({ task, onComplete, onAbandon }: FocusModalProps) {
  const [durIdx, setDurIdx]       = useState(1)                  // default: 25m
  const [phase, setPhase]         = useState<'pick'|'countdown'|'focus'|'done'>('pick')
  const [countNum, setCountNum]   = useState(3)
  const [secondsLeft, setSeconds] = useState(0)
  const [paused, setPaused]       = useState(false)
  const tickRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const totalRef = useRef(0)

  const dur = DURATIONS[durIdx]
  const color = dur.minutes <= 5 ? '#c084fc' : dur.minutes >= 50 ? '#ff6b6b' : '#4ecf9e'

  const clearTick = () => { if (tickRef.current) clearInterval(tickRef.current) }

  const startCountdown = useCallback(() => {
    setPhase('countdown')
    setCountNum(3)
    let n = 3
    const iv = setInterval(() => {
      n--
      if (n <= 0) { clearInterval(iv); setPhase('focus'); totalRef.current = dur.minutes * 60; setSeconds(dur.minutes * 60) }
      else setCountNum(n)
    }, 900)
  }, [dur.minutes])

  useEffect(() => {
    if (phase !== 'focus' || paused) { clearTick(); return }
    tickRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearTick(); setPhase('done'); return 0 }
        return s - 1
      })
    }, 1000)
    return clearTick
  }, [phase, paused])

  useEffect(() => { return clearTick }, [])

  const mins  = Math.floor(secondsLeft / 60)
  const secs  = secondsLeft % 60
  const pct   = phase === 'focus' ? secondsLeft / (totalRef.current || 1) : 0
  const taskIsOverdue = task.due_date && task.due_date < new Date().toISOString().split('T')[0]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9900,
      background: 'rgba(4,6,18,0.96)',
      backdropFilter: 'blur(16px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      animation: 'js-slide-up 0.35s ease',
      padding: 24,
    }}>
      {/* Task header */}
      <div style={{ textAlign: 'center', marginBottom: 32, maxWidth: 320 }}>
        {taskIsOverdue && (
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#ff6b6b', letterSpacing: '0.18em', marginBottom: 8 }}>
            OVERDUE — LET'S FIX THIS
          </div>
        )}
        <div style={{
          fontFamily: 'Sora,sans-serif', fontWeight: 900,
          fontSize: 22, color: '#fff', lineHeight: 1.3, letterSpacing: '-0.02em',
        }}>
          {task.title}
        </div>
        {task.due_date && (
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
            Due {new Date(task.due_date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
        )}
      </div>

      {/* Duration picker */}
      {phase === 'pick' && (
        <div style={{ animation: 'js-pop 0.35s ease' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 36, justifyContent: 'center' }}>
            {DURATIONS.map((d, i) => (
              <button key={i} onClick={() => setDurIdx(i)} style={{
                fontFamily: '"JetBrains Mono",monospace', fontSize: 11,
                padding: '8px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: i === durIdx ? color : 'rgba(255,255,255,0.07)',
                color: i === durIdx ? '#000' : 'rgba(255,255,255,0.5)',
                fontWeight: 700, transition: 'all 0.2s',
              }}>
                {d.emoji} {d.label}
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              {dur.desc} · {dur.minutes} minute{dur.minutes !== 1 ? 's' : ''} of pure focus
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button onClick={startCountdown} style={{
              fontFamily: 'Sora,sans-serif', fontWeight: 900, fontSize: 18,
              padding: '16px 48px', borderRadius: 16, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              color: '#000', letterSpacing: '-0.01em',
              animation: 'js-pulse 2s ease-in-out infinite',
              boxShadow: `0 0 32px ${color}44`,
            }}>
              ▶ Start
            </button>
          </div>
        </div>
      )}

      {/* 3..2..1 countdown */}
      {phase === 'countdown' && (
        <div key={countNum} style={{
          fontFamily: 'Sora,sans-serif', fontWeight: 900,
          fontSize: 96, color, lineHeight: 1,
          textShadow: `0 0 60px ${color}88`,
          animation: 'js-count 0.9s ease',
        }}>
          {countNum}
        </div>
      )}

      {/* Live timer */}
      {phase === 'focus' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, animation: 'js-pop 0.4s ease' }}>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircleTimer pct={pct} size={200} color={color} />
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{
                fontFamily: '"JetBrains Mono",monospace', fontWeight: 700,
                fontSize: 40, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1,
              }}>
                {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
              </div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: '0.1em' }}>
                {paused ? 'PAUSED' : 'FOCUS'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={() => setPaused(p => !p)} style={{
              fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 700,
              padding: '10px 28px', borderRadius: 12, border: `1px solid ${color}44`,
              background: 'rgba(255,255,255,0.05)', color, cursor: 'pointer',
            }}>
              {paused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button onClick={() => { clearTick(); onComplete(dur.minutes) }} style={{
              fontFamily: '"JetBrains Mono",monospace', fontSize: 12,
              padding: '10px 22px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
            }}>
              Done early
            </button>
          </div>
        </div>
      )}

      {/* Done state */}
      {phase === 'done' && (
        <div style={{ textAlign: 'center', animation: 'js-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div style={{ fontSize: 72, marginBottom: 16, filter: `drop-shadow(0 0 24px ${color})` }}>🎉</div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 900, fontSize: 26, color, marginBottom: 8 }}>
            Session complete!
          </div>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>
            +25 XP · {dur.minutes} minutes of focused work
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => { setPhase('pick'); setPaused(false) }} style={{
              fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14,
              padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: color, color: '#000',
            }}>
              Go again
            </button>
            <button onClick={() => onComplete(dur.minutes)} style={{
              fontFamily: 'Sora,sans-serif', fontSize: 14,
              padding: '12px 24px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            }}>
              I'm done
            </button>
          </div>
        </div>
      )}

      {/* Abandon */}
      {(phase === 'pick' || phase === 'focus') && (
        <button onClick={() => { clearTick(); onAbandon() }} style={{
          position: 'absolute', top: 20, right: 20,
          fontFamily: '"JetBrains Mono",monospace', fontSize: 11,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '6px 14px', color: 'rgba(255,255,255,0.3)',
          cursor: 'pointer',
        }}>
          ✕ Close
        </button>
      )}
    </div>
  )
}

// ── Main widget card ──────────────────────────────────────────────────────────

interface Props { tasks: Task[] }

export default function JustStartButton({ tasks }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [showEnv,   setShowEnv]   = useState(false)
  const [mounted,   setMounted]   = useState(false)
  const topTask = pickTopTask(tasks)

  useEffect(() => { injectStyles(); setMounted(true) }, [])

  const handleComplete = useCallback((minutes: number) => {
    dispatchXP('pomodoro_session')
    void minutes
    setShowModal(false)
  }, [])

  if (!mounted || !topTask) return null

  const today    = new Date().toISOString().split('T')[0]
  const overdue  = !!(topTask.due_date && topTask.due_date < today)
  const accent   = overdue ? '#ff6b6b' : '#4ecf9e'

  return (
    <>
      <div style={{
        borderRadius: 18,
        border: `1px solid ${accent}28`,
        background: `linear-gradient(145deg, ${accent}08 0%, rgba(0,0,0,0) 70%)`,
        padding: '16px 18px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 120, height: 120, borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}14 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: accent, letterSpacing: '0.18em', marginBottom: 10 }}>
          {overdue ? '🚨 OVERDUE — START NOW' : '▸ YOUR MOVE'}
        </div>

        <div style={{
          fontFamily: 'Sora,sans-serif', fontWeight: 700,
          fontSize: 15, color: '#fff', lineHeight: 1.35,
          marginBottom: 14, paddingRight: 8,
        }}>
          {topTask.title}
        </div>

        {topTask.due_date && (
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>
            Due {new Date(topTask.due_date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
        )}

        <button
          onClick={() => setShowEnv(true)}
          style={{
            width: '100%', padding: '13px 0',
            fontFamily: 'Sora,sans-serif', fontWeight: 900, fontSize: 15,
            letterSpacing: '-0.01em',
            border: 'none', borderRadius: 12, cursor: 'pointer',
            background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
            color: '#000',
            backgroundSize: '200% auto',
            animation: 'js-shimmer 3s linear infinite, js-pulse 2.5s ease-in-out infinite',
          }}
        >
          ▶ Just Start
        </button>
      </div>

      {showEnv && (
        <FocusEnvironmentSetup
          taskTitle={topTask.title}
          onReady={() => { setShowEnv(false); setShowModal(true) }}
          onSkip={() => { setShowEnv(false); setShowModal(true) }}
        />
      )}

      {showModal && (
        <FocusSessionModal
          task={topTask}
          onComplete={handleComplete}
          onAbandon={() => setShowModal(false)}
        />
      )}
    </>
  )
}
