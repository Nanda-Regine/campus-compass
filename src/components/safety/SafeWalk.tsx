'use client'

// ============================================================
// SafeWalk — Virtual check-in timer for safe walking
// Domain: Safety OS  |  Accent: #f87171 (red/warm)
// Three screens: setup → active → alert
// Works fully offline via localStorage; syncs to DB when authed
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'

interface SafeWalkProps {
  userId: string | null
}

interface WalkForm {
  destination: string
  contactName: string
  contactPhone: string
  durationMinutes: number
}

interface WalkSession {
  form: WalkForm
  timeRemaining: number
  sessionStart: string
  checkpoints: string[]
}

type Screen = 'setup' | 'active' | 'alert'

const DURATION_OPTIONS = [10, 20, 30, 45, 60]
const SESSION_KEY = 'safe_walk_session'

function padTwo(n: number): string {
  return String(n).padStart(2, '0')
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60)
  const s = Math.max(0, seconds) % 60
  return `${padTwo(m)}:${padTwo(s)}`
}

function timeAgo(isoStr: string): string {
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function SafeWalk({ userId }: SafeWalkProps) {
  const [screen, setScreen] = useState<Screen>('setup')
  const [form, setForm] = useState<WalkForm>({
    destination: '',
    contactName: '',
    contactPhone: '',
    durationMinutes: 20,
  })
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [sessionStart, setSessionStart] = useState<Date | null>(null)
  const [checkpoints, setCheckpoints] = useState<string[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Restore session from localStorage on mount ─────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (!raw) return
      const session: WalkSession = JSON.parse(raw)
      if (session.timeRemaining > 0) {
        const elapsed = Math.floor(
          (Date.now() - new Date(session.sessionStart).getTime()) / 1000
        )
        const adjusted = session.timeRemaining - elapsed
        if (adjusted > 0) {
          setForm(session.form)
          setTimeRemaining(adjusted)
          setSessionStart(new Date(session.sessionStart))
          setCheckpoints(session.checkpoints)
          setScreen('active')
        } else {
          setForm(session.form)
          setCheckpoints(session.checkpoints)
          setScreen('alert')
        }
      }
    } catch { /* ignore parse errors */ }
  }, [])

  // ── Countdown interval ─────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (screen !== 'active') {
      clearTimer()
      return
    }
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const next = prev - 1
        if (next <= 0) {
          clearTimer()
          try {
            const raw = localStorage.getItem(SESSION_KEY)
            if (raw) {
              const s: WalkSession = JSON.parse(raw)
              localStorage.setItem(SESSION_KEY, JSON.stringify({ ...s, timeRemaining: 0 }))
            }
          } catch { /* ignore */ }
          setScreen('alert')
          return 0
        }
        if (next % 10 === 0) {
          try {
            const raw = localStorage.getItem(SESSION_KEY)
            if (raw) {
              const s: WalkSession = JSON.parse(raw)
              localStorage.setItem(SESSION_KEY, JSON.stringify({ ...s, timeRemaining: next }))
            }
          } catch { /* ignore */ }
        }
        return next
      })
    }, 1000)
    return clearTimer
  }, [screen, clearTimer])

  const persistSession = useCallback((
    walkForm: WalkForm,
    remaining: number,
    start: Date,
    pts: string[]
  ) => {
    const session: WalkSession = {
      form: walkForm,
      timeRemaining: remaining,
      sessionStart: start.toISOString(),
      checkpoints: pts,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }, [])

  const saveToDb = useCallback(async (
    walkForm: WalkForm,
    status: string,
    pts: string[]
  ) => {
    if (!userId) return
    try {
      await fetch('/api/safety/safe-walk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: walkForm.destination,
          contact_name: walkForm.contactName,
          contact_phone: walkForm.contactPhone,
          duration_minutes: walkForm.durationMinutes,
          status,
          checkpoints: pts,
        }),
      })
    } catch { /* non-critical */ }
  }, [userId])

  // ── Actions ───────────────────────────────────────────────
  const handleStart = () => {
    if (!form.destination || !form.contactName || !form.contactPhone) return
    const seconds = form.durationMinutes * 60
    const now = new Date()
    setTimeRemaining(seconds)
    setSessionStart(now)
    setCheckpoints([])
    persistSession(form, seconds, now, [])
    setScreen('active')
  }

  const handleCheckIn = () => {
    const newRemaining = timeRemaining + 15 * 60
    const newCheckpoints = [...checkpoints, new Date().toISOString()]
    setTimeRemaining(newRemaining)
    setCheckpoints(newCheckpoints)
    if (sessionStart) persistSession(form, newRemaining, sessionStart, newCheckpoints)
  }

  const handleExtend = () => {
    const newRemaining = timeRemaining + 600
    setTimeRemaining(newRemaining)
    if (sessionStart) persistSession(form, newRemaining, sessionStart, checkpoints)
  }

  const handleEndWalk = () => {
    clearTimer()
    saveToDb(form, 'completed', checkpoints)
    localStorage.removeItem(SESSION_KEY)
    setScreen('setup')
    setTimeRemaining(0)
    setSessionStart(null)
    setCheckpoints([])
  }

  const handleCancelAlert = () => {
    localStorage.removeItem(SESSION_KEY)
    setScreen('setup')
    setTimeRemaining(0)
    setSessionStart(null)
    setCheckpoints([])
  }

  // ── Countdown colour based on % remaining ─────────────────
  const totalSeconds = form.durationMinutes * 60
  const pct = totalSeconds > 0 ? timeRemaining / totalSeconds : 1
  const countdownColor = pct > 0.6 ? '#4ade80' : pct > 0.3 ? '#fbbf24' : '#f87171'

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 10,
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.72rem',
    color: 'var(--text-tertiary)',
    marginBottom: 6,
    fontWeight: 600,
    letterSpacing: '0.04em',
  }

  // ────────────────────────────────────────────────────────────
  // SETUP SCREEN
  // ────────────────────────────────────────────────────────────
  if (screen === 'setup') {
    const canStart = form.destination.trim() && form.contactName.trim() && form.contactPhone.trim()
    return (
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh', padding: '20px 16px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: '20px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: 'linear-gradient(90deg, #f87171, transparent)',
            }} />
            <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>🛡️</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Safe Walk
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
              Someone knows you&apos;re walking. Set a timer — if you don&apos;t check in, your contact will be alerted.
            </div>
          </div>

          {/* Form */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: '20px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>

            <div>
              <label style={labelStyle}>WHERE ARE YOU HEADING?</label>
              <input
                type="text"
                placeholder="Where are you heading?"
                value={form.destination}
                onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>WHO SHOULD WE ALERT?</label>
              <input
                type="text"
                placeholder="Who should we alert?"
                value={form.contactName}
                onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>CONTACT PHONE NUMBER</label>
              <input
                type="tel"
                placeholder="06x xxx xxxx"
                value={form.contactPhone}
                onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                style={inputStyle}
              />
            </div>

            {/* Duration pills */}
            <div>
              <label style={labelStyle}>HOW LONG IS YOUR WALK?</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DURATION_OPTIONS.map(min => (
                  <button
                    key={min}
                    onClick={() => setForm(f => ({ ...f, durationMinutes: min }))}
                    style={{
                      padding: '8px 16px',
                      background: form.durationMinutes === min
                        ? 'rgba(251,146,60,0.18)'
                        : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${form.durationMinutes === min ? 'rgba(251,146,60,0.5)' : 'rgba(255,255,255,0.10)'}`,
                      borderRadius: 100,
                      color: form.durationMinutes === min ? '#fb923c' : 'var(--text-tertiary)',
                      fontSize: '0.8rem',
                      fontWeight: form.durationMinutes === min ? 700 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {min} min
                  </button>
                ))}
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={handleStart}
              disabled={!canStart}
              style={{
                width: '100%',
                padding: '15px 0',
                background: canStart
                  ? 'linear-gradient(135deg, #f87171, #ef4444)'
                  : 'rgba(255,255,255,0.04)',
                border: 'none',
                borderRadius: 12,
                color: canStart ? '#fff' : 'var(--text-muted)',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: canStart ? 'pointer' : 'not-allowed',
                letterSpacing: '0.02em',
                boxShadow: canStart ? '0 4px 20px rgba(248,113,113,0.3)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              🛡️ Start Safe Walk
            </button>
          </div>

          {/* Emergency strip */}
          <a
            href="tel:10111"
            style={{
              display: 'block',
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 14, padding: '14px 18px',
              textDecoration: 'none', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>POLICE EMERGENCY</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f87171', fontFamily: 'monospace' }}>
              📞 10111
            </div>
          </a>
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────
  // ACTIVE SCREEN
  // ────────────────────────────────────────────────────────────
  if (screen === 'active') {
    return (
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh', padding: '20px 16px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Timer card */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${countdownColor}40`,
            borderRadius: 16, padding: '32px 20px',
            textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, ${countdownColor}, transparent)`,
            }} />

            <div style={{
              fontSize: '4rem', fontWeight: 900,
              fontFamily: 'monospace',
              color: countdownColor,
              letterSpacing: '0.04em',
              lineHeight: 1, marginBottom: 12,
              transition: 'color 0.5s',
            }}>
              {formatCountdown(timeRemaining)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 20 }}>remaining</div>

            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 8,
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Walking to: {form.destination}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                Contact: {form.contactName} · {form.contactPhone}
              </div>
            </div>

            {checkpoints.length > 0 && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 8 }}>
                ✓ Last check-in: {timeAgo(checkpoints[checkpoints.length - 1])}
              </div>
            )}
          </div>

          {/* Check-in button */}
          <button
            onClick={handleCheckIn}
            style={{
              width: '100%', padding: '18px 0',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none', borderRadius: 14,
              color: '#fff', fontSize: '1rem', fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.02em',
              boxShadow: '0 4px 20px rgba(34,197,94,0.3)',
            }}
          >
            ✓ I&apos;m Safe — Check In (+15 min)
          </button>

          {/* Secondary actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleExtend}
              style={{
                flex: 1, padding: '13px 0',
                background: 'rgba(251,146,60,0.10)',
                border: '1px solid rgba(251,146,60,0.30)',
                borderRadius: 12, color: '#fb923c',
                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Extend 10 min
            </button>
            <button
              onClick={handleEndWalk}
              style={{
                flex: 1, padding: '13px 0',
                background: 'transparent',
                border: '1px solid rgba(248,113,113,0.35)',
                borderRadius: 12, color: '#f87171',
                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              End Walk
            </button>
          </div>

          {/* SOS */}
          <a
            href="tel:10111"
            style={{
              display: 'block',
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 14, padding: '12px 18px',
              textDecoration: 'none', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>EMERGENCY?</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f87171' }}>📞 Call 10111</div>
          </a>
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────
  // ALERT SCREEN
  // ────────────────────────────────────────────────────────────
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', padding: '20px 16px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Alert card */}
        <div style={{
          background: 'rgba(248,113,113,0.06)',
          border: '2px solid #f87171',
          borderRadius: 16, padding: '28px 20px', textAlign: 'center',
          animation: 'pulseBorder 1.5s ease-in-out infinite',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🚨</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f87171', marginBottom: 12, lineHeight: 1.4 }}>
            ALERT: Your safe walk ended without check-in
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
            Please call <strong>{form.contactName}</strong>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171', fontFamily: 'monospace' }}>
            {form.contactPhone}
          </div>
        </div>

        {/* CALL 10111 */}
        <a
          href="tel:10111"
          style={{
            display: 'block',
            background: 'linear-gradient(135deg, #f87171, #ef4444)',
            border: 'none', borderRadius: 14,
            padding: '18px 0', textDecoration: 'none', textAlign: 'center',
            boxShadow: '0 4px 24px rgba(248,113,113,0.4)',
          }}
        >
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>
            📞 CALL 10111
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>
            South African Police Emergency
          </div>
        </a>

        {/* Call contact */}
        {form.contactPhone && (
          <a
            href={`tel:${form.contactPhone.replace(/\s/g, '')}`}
            style={{
              display: 'block',
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.30)',
              borderRadius: 14, padding: '15px 0',
              textDecoration: 'none', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f87171' }}>
              📞 Call {form.contactName}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
              {form.contactPhone}
            </div>
          </a>
        )}

        {/* Cancel alert */}
        <button
          onClick={handleCancelAlert}
          style={{
            width: '100%', padding: '14px 0',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12, color: 'var(--text-tertiary)',
            fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
          }}
        >
          I&apos;m okay — cancel alert
        </button>
      </div>

      <style>{`
        @keyframes pulseBorder {
          0%, 100% { box-shadow: 0 0 0 0 rgba(248,113,113,0.3); }
          50%       { box-shadow: 0 0 0 10px rgba(248,113,113,0); }
        }
      `}</style>
    </div>
  )
}
