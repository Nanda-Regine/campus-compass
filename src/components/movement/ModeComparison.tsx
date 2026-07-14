'use client'

// ============================================================
// ModeComparison — "cheapest vs fastest" strip for a searched route.
//
// Given a from/to, fetches the walking and driving times from Mapbox once
// and pairs them with VarsityOS's SA fare ranges so a student can see, at a
// glance, the trade-off: walk for free (slower) vs taxi/Uber (faster, costs).
// Flags the cheapest and the fastest option.
// ============================================================

import { useEffect, useState } from 'react'
import { geocodeZA, fetchRoute, fmtDuration, type LngLat } from '@/lib/mapbox'

interface Props {
  from: string
  to: string
  token: string
}

interface Mode {
  key: string
  emoji: string
  label: string
  fare: string
  // Lower rough cost rank = cheaper (for the "cheapest" badge).
  costRank: number
  basis: 'walking' | 'driving'
}

// Ordered cheapest → priciest for the "cheapest" flag.
const MODES: Mode[] = [
  { key: 'walk',    emoji: '🚶', label: 'Walk',    fare: 'Free',       costRank: 0, basis: 'walking' },
  { key: 'shuttle', emoji: '🚐', label: 'Shuttle', fare: 'Free–R5',    costRank: 1, basis: 'driving' },
  { key: 'taxi',    emoji: '🚕', label: 'Taxi',    fare: 'R7–R25',     costRank: 2, basis: 'driving' },
  { key: 'bus',     emoji: '🚌', label: 'Bus',     fare: 'R8–R30',     costRank: 3, basis: 'driving' },
  { key: 'uber',    emoji: '🚗', label: 'Uber',    fare: 'R40–R200+',  costRank: 4, basis: 'driving' },
]

export default function ModeComparison({ from, to, token }: Props) {
  const [walkSec, setWalkSec] = useState<number | null>(null)
  const [driveSec, setDriveSec] = useState<number | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    if (!token || !from || !to) return
    let alive = true
    setState('loading'); setWalkSec(null); setDriveSec(null)
    ;(async () => {
      const [f, t] = await Promise.all([geocodeZA(from, token), geocodeZA(to, token)])
      if (!alive) return
      if (!f || !t) { setState('error'); return }
      const a = f as LngLat; const b = t as LngLat
      const [walk, drive] = await Promise.all([
        fetchRoute(a, b, 'walking', token),
        fetchRoute(a, b, 'driving', token),
      ])
      if (!alive) return
      setWalkSec(walk?.duration ?? null)
      setDriveSec(drive?.duration ?? null)
      setState(walk || drive ? 'ready' : 'error')
    })()
    return () => { alive = false }
  }, [from, to, token])

  if (state === 'error') return null

  const secFor = (m: Mode) => (m.basis === 'walking' ? walkSec : driveSec)
  const usable = MODES.filter(m => secFor(m) != null)
  const fastestKey = usable.slice().sort((a, b) => (secFor(a)! - secFor(b)!))[0]?.key
  const cheapestKey = usable.slice().sort((a, b) => a.costRank - b.costRank)[0]?.key

  return (
    <div className="card-base p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[0.6rem] text-white uppercase tracking-wider">Compare your options</span>
        {state === 'loading' && <span className="font-mono text-[0.58rem] text-sky-400">estimating…</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(84px, 1fr))', gap: 8 }}>
        {MODES.map(m => {
          const sec = secFor(m)
          const isFastest = m.key === fastestKey
          const isCheapest = m.key === cheapestKey
          return (
            <div
              key={m.key}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${isFastest ? 'rgba(56,189,248,0.4)' : isCheapest ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 12, padding: '10px 8px', textAlign: 'center', position: 'relative',
              }}
            >
              <div style={{ fontSize: 20, lineHeight: 1 }}>{m.emoji}</div>
              <div className="font-mono text-[0.62rem] text-white mt-1">{m.label}</div>
              <div className="font-mono text-[0.66rem] mt-1" style={{ color: '#38bdf8' }}>
                {sec != null ? fmtDuration(sec) : '—'}
              </div>
              <div className="font-mono text-[0.58rem] text-teal-400 mt-0.5">{m.fare}</div>
              {(isFastest || isCheapest) && (
                <div style={{
                  position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%)',
                  background: isFastest ? '#0ea5e9' : '#10b981', color: '#04121a',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 8, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 100, whiteSpace: 'nowrap',
                }}>
                  {isFastest ? 'FASTEST' : 'CHEAPEST'}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="font-mono text-[0.56rem] text-white/55 mt-3 leading-relaxed">
        Taxi/bus/Uber times use driving estimates. Fares are typical SA ranges — confirm before you ride.
      </p>
    </div>
  )
}
