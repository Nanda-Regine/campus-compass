'use client'

import { useState, useEffect } from 'react'
import { calculateArchetype, loadXPState, ARCHETYPES } from '@/lib/xp-engine'

interface ArchetypeCardProps {
  compact?: boolean
}

export default function ArchetypeCard({ compact = false }: ArchetypeCardProps) {
  const [archetype, setArchetype] = useState<typeof ARCHETYPES[number] | null>(null)
  const [daysAsThis, setDaysAsThis] = useState(0)

  useEffect(() => {
    const state = loadXPState()
    const calc = calculateArchetype(state)
    setArchetype(calc)

    // Estimate how many days they've held this archetype (rough)
    const days = Math.min(7, Object.keys(state.dailyEventLog).length)
    setDaysAsThis(days)

    // Persist archetype to DB
    fetch('/api/gamification/archetype', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archetype: calc.id }),
    }).catch(() => {})

    const handler = () => {
      const newState = loadXPState()
      const newCalc = calculateArchetype(newState)
      setArchetype(newCalc)
    }
    window.addEventListener('varsityos:xp', handler)
    return () => window.removeEventListener('varsityos:xp', handler)
  }, [])

  if (!archetype) return null

  if (compact) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, padding: '4px 10px',
      }}>
        <span style={{ fontSize: 14 }}>{archetype.emoji}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
          {archetype.name}
        </span>
      </div>
    )
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.01))',
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 20px',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 12 }}>
        This week you are
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
        }}>
          {archetype.emoji}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 4 }}>
            {archetype.name}
          </div>
          {daysAsThis > 0 && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>
              {daysAsThis} day{daysAsThis !== 1 ? 's' : ''} building this pattern
            </div>
          )}
        </div>
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.62)', lineHeight: 1.55, margin: 0 }}>
        {archetype.description}
      </p>
      <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.18)' }}>
        Updates weekly based on where you spend your energy
      </div>
    </div>
  )
}
