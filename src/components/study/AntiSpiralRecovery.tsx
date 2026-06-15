'use client'

// AntiSpiralRecovery — detects when a student has fallen into the procrastination spiral
// (2+ idle days OR 4+ overdue tasks) and guides them through a 4-step recovery protocol.
// Research: action-based recovery ("do one tiny thing") beats motivation-based ("feel ready")
// — Pychyl & Flett, 2012; the 2-minute rule (Allen, Getting Things Done).

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { loadXPState } from '@/lib/xp-engine'
import { dispatchXP } from '@/lib/xp-engine'
import type { Task } from '@/types'

const STYLE_ID = 'varsityos-spiral-styles'
function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes sp-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,107,107,0.4)} 50%{box-shadow:0 0 0 8px rgba(255,107,107,0)} }
    @keyframes sp-in    { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes sp-step  { from{transform:scale(0.9);opacity:0} to{transform:scale(1);opacity:1} }
  `
  document.head.appendChild(el)
}

// ── Spiral detection ──────────────────────────────────────────────────────────

function detectIdleDays(): number {
  try {
    const state = loadXPState()
    let streak = 0
    for (let i = 1; i <= 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      if (!state.dailyEventLog[key] || state.dailyEventLog[key].length === 0) {
        streak++
      } else {
        break
      }
    }
    return streak
  } catch { return 0 }
}

function countOverdueTasks(tasks: Task[]): number {
  const now = new Date()
  return tasks.filter(t => {
    if (t.status === 'done') return false
    if (!t.due_date) return false
    return new Date(t.due_date) < now
  }).length
}

// ── Recovery steps ────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: 1,
    icon: '🎯',
    title: 'Name one task',
    desc: 'Just one. The smallest one you can possibly do in the next 5 minutes. Your task list is open — pick it.',
    cta: 'Open my task list',
    ctaLink: '/study',
    color: '#ff6b6b',
  },
  {
    n: 2,
    icon: '⏱️',
    title: 'Do a 5-min Pomodoro',
    desc: 'Set a timer for 5 minutes only. No 25-minute pressure. Just start.',
    cta: 'Start 5-min timer',
    ctaLink: null,
    color: '#f59e0b',
  },
  {
    n: 3,
    icon: '👥',
    title: 'Find your body double',
    desc: 'Work alongside someone else — even silently. Go to Study Groups, find an active session, or share your WhatsApp status.',
    cta: 'Find study partner',
    ctaLink: '/dashboard/groups',
    color: '#7090d0',
  },
  {
    n: 4,
    icon: '🧠',
    title: 'Reset your mindset',
    desc: 'You don\'t need to "feel like it." Action comes before motivation, not after.',
    cta: 'I\'m back. Let\'s go.',
    ctaLink: null,
    color: '#4ecf9e',
  },
]

// ── Timer for step 2 ──────────────────────────────────────────────────────────

function MiniTimer({ onDone }: { onDone: () => void }) {
  const TOTAL = 5 * 60
  const [left, setLeft] = useState(TOTAL)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    if (left <= 0) { onDone(); return }
    const t = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(t)
  }, [running, left, onDone])

  const min = String(Math.floor(left / 60)).padStart(2, '0')
  const sec = String(left % 60).padStart(2, '0')
  const pct = ((TOTAL - left) / TOTAL) * 100

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        position: 'relative', width: 72, height: 72, margin: '0 auto 12px',
      }}>
        <svg width={72} height={72} viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={36} cy={36} r={28} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={6} />
          <circle cx={36} cy={36} r={28} fill="none" stroke="#f59e0b" strokeWidth={6}
            strokeDasharray={`${2 * Math.PI * 28 * pct / 100} ${2 * Math.PI * 28 * (1 - pct / 100)}`}
            strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.5s' }} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"JetBrains Mono",monospace', fontSize: 14, fontWeight: 700, color: '#f59e0b',
        }}>
          {min}:{sec}
        </div>
      </div>
      <button onClick={() => setRunning(r => !r)} style={{
        padding: '8px 24px', borderRadius: 10, cursor: 'pointer',
        background: running ? 'rgba(245,158,11,0.15)' : '#f59e0b',
        color: running ? '#f59e0b' : '#000',
        fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13,
        border: running ? '1px solid rgba(245,158,11,0.3)' : 'none',
      } as React.CSSProperties}>
        {running ? '⏸ Pause' : left === TOTAL ? '▶ Start 5-min timer' : '▶ Resume'}
      </button>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props { tasks: Task[] }

export default function AntiSpiralRecovery({ tasks }: Props) {
  const router = useRouter()
  const [idleDays,   setIdleDays]   = useState(0)
  const [overdue,    setOverdue]    = useState(0)
  const [dismissed,  setDismissed]  = useState(false)
  const [step,       setStep]       = useState(0)   // 0 = banner, 1-4 = recovery steps
  const [done,       setDone]       = useState(false)
  const [mounted,    setMounted]    = useState(false)

  useEffect(() => {
    injectStyles()
    setMounted(true)
    setIdleDays(detectIdleDays())
    setOverdue(countOverdueTasks(tasks))

    // Auto-dismiss when a Pomodoro session completes
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.eventName === 'pomodoro_session') setDismissed(true)
    }
    window.addEventListener('varsityos:xp', handler)
    return () => window.removeEventListener('varsityos:xp', handler)
  }, [tasks])

  const inSpiral = !dismissed && !done && (idleDays >= 2 || overdue >= 4)

  const handleStart = useCallback(() => {
    setStep(1)
    dispatchXP('recovery_initiated')
  }, [])

  const advance = useCallback((link?: string | null) => {
    if (step >= 4) {
      setDone(true)
      return
    }
    if (link) {
      setDone(true)
      router.push(link)
      return
    }
    setStep(s => s + 1)
  }, [step, router])

  if (!mounted || !inSpiral) return null

  // ── Spiral banner (step 0) ────────────────────────────────────────────────
  if (step === 0) {
    const reason = idleDays >= 2
      ? `${idleDays} days without activity`
      : `${overdue} overdue task${overdue !== 1 ? 's' : ''}`

    return (
      <div style={{
        borderRadius: 18, padding: '18px 20px', marginBottom: 16,
        background: 'linear-gradient(135deg, rgba(255,107,107,0.12) 0%, rgba(245,158,11,0.08) 100%)',
        border: '1px solid rgba(255,107,107,0.35)',
        animation: 'sp-in 0.4s ease',
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            fontSize: 26, flexShrink: 0, marginTop: 2,
            animation: 'sp-pulse 2s infinite',
            borderRadius: '50%', padding: 2,
          }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#ff6b6b', letterSpacing: '0.16em', marginBottom: 6 }}>
              SPIRAL DETECTED — {reason}
            </div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 16, color: '#fff', marginBottom: 8, lineHeight: 1.2 }}>
              You've slipped into the spiral.
            </div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 1.55 }}>
              That's okay — every student hits this. The 4-step protocol below has you back on track in under 10 minutes.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleStart} style={{
                flex: 2, padding: '11px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: '#ff6b6b', color: '#fff',
                fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13,
              }}>
                🚀 Start recovery protocol
              </button>
              <button onClick={() => setDismissed(true)} style={{
                flex: 1, padding: '11px 0', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: 'rgba(255,255,255,0.3)',
                fontFamily: 'Sora,sans-serif', fontSize: 12, cursor: 'pointer',
              }}>
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Recovery modal (steps 1-4) ────────────────────────────────────────────
  const current = STEPS[step - 1]
  const progress = ((step - 1) / STEPS.length) * 100

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9900,
      background: 'rgba(4,6,18,0.95)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#0d1225', borderRadius: 24, padding: '28px 26px', maxWidth: 420, width: '100%',
        border: '1px solid rgba(255,255,255,0.08)',
        animation: 'sp-step 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: current.color, letterSpacing: '0.18em' }}>
            RECOVERY PROTOCOL · STEP {step} OF {STEPS.length}
          </div>
          <button onClick={() => { setStep(0); setDismissed(true) }} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.25)', fontSize: 16, lineHeight: 1,
          }}>✕</button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 4, background: current.color, width: `${progress}%`, transition: 'width 0.4s ease' }} />
        </div>

        {/* Step content */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>{current.icon}</div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 900, fontSize: 20, color: '#fff', marginBottom: 10 }}>
            {current.title}
          </div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>
            {current.desc}
          </div>
        </div>

        {/* Step 2 has inline timer */}
        {step === 2 && <MiniTimer onDone={advance} />}

        {/* CTA */}
        {step !== 2 && (
          <button onClick={() => advance(current.ctaLink)} style={{
            width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: current.color, color: step === 4 ? '#000' : '#fff',
            fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 15,
            transition: 'transform 0.1s', marginTop: step === 2 ? 16 : 0,
          }}>
            {step === 4 ? `✓ ${current.cta}` : current.ctaLink ? `${current.cta} ↗` : `${current.cta} →`}
          </button>
        )}
        {step === 2 && (
          <button onClick={() => advance(null)} style={{
            width: '100%', marginTop: 12, padding: '11px 0', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: 'rgba(255,255,255,0.35)',
            fontFamily: 'Sora,sans-serif', fontSize: 12, cursor: 'pointer',
          }}>
            Skip timer →
          </button>
        )}
      </div>
    </div>
  )
}
