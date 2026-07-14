'use client'

// BodyDoubleMode — virtual study room using Supabase Realtime presence.
// Research: having others present (even virtually) dramatically reduces
// procrastination and time-on-task for both ADHD and neurotypical students.

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { dispatchXP } from '@/lib/xp-engine'
import type { RealtimeChannel } from '@supabase/supabase-js'

const STYLE_ID = 'varsityos-bodydouble-styles'
function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes bd-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    @keyframes bd-pop   { 0%{transform:scale(0.85);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
    @keyframes bd-tick  { from{stroke-dashoffset:calc(var(--circ) * 1)} to{stroke-dashoffset:0} }
  `
  document.head.appendChild(el)
}

interface PresenceUser {
  user_id:    string
  started_at: number
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${String(m).padStart(2,'0')}m`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

export default function BodyDoubleMode() {
  const [joined,    setJoined]    = useState(false)
  const [count,     setCount]     = useState(0)
  const [elapsed,   setElapsed]   = useState(0)
  const [mounted,   setMounted]   = useState(false)
  const [xpAwarded, setXpAwarded] = useState(false)

  const channelRef  = useRef<RealtimeChannel | null>(null)
  const startRef    = useRef<number>(0)
  const tickRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const xpAwardedRef = useRef(false)

  useEffect(() => { injectStyles(); setMounted(true) }, [])

  const leaveRoom = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current)
    if (channelRef.current) {
      channelRef.current.untrack().catch(() => {})
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
    xpAwardedRef.current = false
    setJoined(false)
    setElapsed(0)
    setXpAwarded(false)
  }, [])

  const joinRoom = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const channel = supabase.channel('varsityos-body-double', {
      config: { presence: { key: user.id } },
    })

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceUser>()
      setCount(Object.keys(state).length)
    })

    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: user.id, started_at: Date.now() })
        startRef.current = Date.now()
        setJoined(true)

        tickRef.current = setInterval(() => {
          const el = Date.now() - startRef.current
          setElapsed(el)

          // Award XP after 25 minutes of body-doubling (use ref to avoid stale closure)
          if (!xpAwardedRef.current && el >= 25 * 60 * 1000) {
            xpAwardedRef.current = true
            dispatchXP('body_double_joined')
            setXpAwarded(true)
          }
        }, 1000)
      }
    })

    channelRef.current = channel
  }, [])

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
      if (channelRef.current) {
        channelRef.current.untrack().catch(() => {})
        channelRef.current.unsubscribe()
      }
    }
  }, [])

  if (!mounted) return null

  const elapsedPct = Math.min(100, (elapsed / (25 * 60 * 1000)) * 100)
  const ringR = 28
  const ringCirc = 2 * Math.PI * ringR
  const ringOffset = ringCirc * (1 - elapsedPct / 100)

  return (
    <div style={{
      borderRadius: 18, padding: '16px 18px',
      border: '1px solid rgba(201,168,76,0.2)',
      background: joined ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.02)',
      transition: 'all 0.3s',
    }}>
      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#c9a84c', letterSpacing: '0.18em', marginBottom: 12 }}>
        👥 BODY DOUBLE MODE
      </div>

      {!joined ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
                Study with others
              </div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#fff' }}>
                Virtual presence reduces procrastination by 40%
              </div>
            </div>
            {count > 0 && (
              <div style={{
                fontFamily: '"JetBrains Mono",monospace', fontWeight: 700,
                fontSize: 22, color: '#c9a84c',
                animation: 'bd-pulse 2s ease-in-out infinite',
              }}>
                {count}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {Array.from({ length: Math.min(count || 3, 6) }).map((_, i) => (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `hsl(${(i * 47) % 360}, 60%, 55%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, opacity: count > 0 ? 1 : 0.25,
                border: '2px solid rgba(0,0,0,0.3)',
              }}>
                {['📚','💻','✍️','🎧','📖','🔬'][i]}
              </div>
            ))}
            {count > 6 && (
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#fff',
              }}>+{count - 6}</div>
            )}
          </div>

          <button onClick={() => void joinRoom()} style={{
            width: '100%', padding: '13px 0',
            fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14,
            borderRadius: 12, border: 'none', cursor: 'pointer',
            background: '#c9a84c', color: '#000',
          }}>
            {count > 0 ? `👥 Join ${count} student${count !== 1 ? 's' : ''} studying now` : '👥 Start the study room'}
          </button>
        </>
      ) : (
        <div style={{ animation: 'bd-pop 0.4s ease', textAlign: 'center' }}>
          {/* Ring timer */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={36} cy={36} r={ringR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
              <circle
                cx={36} cy={36} r={ringR} fill="none"
                stroke="#c9a84c" strokeWidth={4} strokeLinecap="round"
                strokeDasharray={ringCirc}
                strokeDashoffset={ringOffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 700, color: '#c9a84c', lineHeight: 1 }}>
                {formatElapsed(elapsed)}
              </div>
            </div>
          </div>

          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>
            You are studying with
          </div>
          <div style={{
            fontFamily: '"JetBrains Mono",monospace', fontWeight: 700,
            fontSize: 36, color: '#c9a84c', lineHeight: 1, marginBottom: 4,
            animation: 'bd-pulse 2.5s ease-in-out infinite',
          }}>
            {count}
          </div>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#fff', marginBottom: 20 }}>
            {count === 1 ? 'student' : 'students'} · {elapsed < 25 * 60 * 1000
              ? `+15 XP at 25 min`
              : xpAwarded ? '✦ +15 XP earned!' : 'Keep going'}
          </div>

          <button onClick={leaveRoom} style={{
            fontFamily: '"JetBrains Mono",monospace', fontSize: 11,
            padding: '9px 24px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
            color: '#fff', cursor: 'pointer',
          }}>
            Leave room
          </button>
        </div>
      )}
    </div>
  )
}
