'use client'

import { useState, useEffect } from 'react'
import { getVarsityScore, VarsityScoreBreakdown } from '@/lib/xp-engine'

const PILLARS: { key: keyof Omit<VarsityScoreBreakdown, 'total'>; label: string; max: number; color: string; emoji: string }[] = [
  { key: 'academic', label: 'Academic',  max: 400, color: '#9b6fd4', emoji: '📚' },
  { key: 'wellness', label: 'Wellness',  max: 300, color: '#4ecf9e', emoji: '🧠' },
  { key: 'career',   label: 'Career',    max: 200, color: '#7090d0', emoji: '💼' },
  { key: 'social',   label: 'Discovery', max: 100, color: '#e8834a', emoji: '🌍' },
]

function getRating(total: number): { label: string; color: string } {
  if (total >= 800) return { label: 'Outstanding', color: '#4ecf9e' }
  if (total >= 600) return { label: 'Excellent',   color: '#9b6fd4' }
  if (total >= 400) return { label: 'Good',         color: '#7090d0' }
  if (total >= 200) return { label: 'Building',     color: '#c9a84c' }
  return { label: 'Getting started', color: 'rgba(255,255,255,0.55)' }
}

export default function VarsityScore() {
  const [score, setScore] = useState<VarsityScoreBreakdown | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setScore(getVarsityScore())
    const handler = () => setScore(getVarsityScore())
    window.addEventListener('varsityos:xp', handler)
    return () => window.removeEventListener('varsityos:xp', handler)
  }, [])

  if (!mounted || !score) return null

  const { label: ratingLabel, color: ratingColor } = getRating(score.total)
  const totalPct = Math.round((score.total / 1000) * 100)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
          VarsityOS Score
        </span>
        <span style={{
          fontFamily: 'JetBrains Mono,monospace', fontSize: 10,
          color: ratingColor,
          background: `${ratingColor}10`, border: `1px solid ${ratingColor}25`,
          borderRadius: 6, padding: '2px 8px',
        }}>
          {ratingLabel}
        </span>
      </div>

      {/* Big score ring */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
        <ScoreRing value={score.total} max={1000} pct={totalPct} color={ratingColor} />
        <div>
          <div style={{
            fontFamily: 'JetBrains Mono,monospace', fontWeight: 700,
            fontSize: 34, color: ratingColor, lineHeight: 1,
          }}>
            {score.total}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>out of 1000</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>
            {1000 - score.total} points to go
          </div>
        </div>
      </div>

      {/* Pillar breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PILLARS.map(p => {
          const val = score[p.key]
          const pct = Math.round((val / p.max) * 100)
          return (
            <div key={p.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>{p.emoji}</span> {p.label}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: p.color }}>
                  {val}/{p.max}
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 9999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: `linear-gradient(90deg, ${p.color}, ${p.color}80)`,
                  borderRadius: 9999, transition: 'width 0.7s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* How score is calculated */}
      <details style={{ marginTop: 16 }}>
        <summary style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', userSelect: 'none' }}>
          How is this calculated?
        </summary>
        <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          <b style={{ color: '#9b6fd4' }}>Academic (400):</b> Tasks · Pomodoro sessions · Flashcard reviews<br />
          <b style={{ color: '#4ecf9e' }}>Wellness (300):</b> Check-in streak · Burnout score<br />
          <b style={{ color: '#7090d0' }}>Career (200):</b> Mock interviews · Skills gap · CV skills<br />
          <b style={{ color: '#e8834a' }}>Discovery (100):</b> Bursary browsing · Daily challenges
        </div>
      </details>
    </div>
  )
}

function ScoreRing({ value, max, pct, color }: { value: number; max: number; pct: number; color: string }) {
  const r = 34
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <svg width={88} height={88} style={{ flexShrink: 0 }}>
      {/* Track */}
      <circle cx={44} cy={44} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      {/* Progress */}
      <circle
        cx={44} cy={44} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 44 44)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x={44} y={46} textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, fontSize: 13, fill: color }}>
        {pct}%
      </text>
    </svg>
  )
}
