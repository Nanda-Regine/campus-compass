'use client'

import { useState, useEffect } from 'react'
import { getPendingXP, getDomainsHitToday } from '@/lib/xp-engine'

export default function PendingXP() {
  const [pending, setPending] = useState(0)
  const [domainsHit, setDomainsHit] = useState(0)

  useEffect(() => {
    const update = () => {
      setPending(getPendingXP())
      setDomainsHit(getDomainsHitToday().size)
    }
    update()
    window.addEventListener('varsityos:xp', update)
    return () => window.removeEventListener('varsityos:xp', update)
  }, [])

  if (domainsHit >= 5) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(78,207,158,0.08)', border: '1px solid rgba(78,207,158,0.2)',
        borderRadius: 12, padding: '8px 14px',
      }}>
        <span style={{ fontSize: 16 }}>🌍</span>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.72rem', color: '#4ecf9e' }}>Ubuntu Day Complete!</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>All 5 domains active — incredible.</div>
        </div>
      </div>
    )
  }

  if (pending <= 40) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
      borderRadius: 12, padding: '8px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>⏳</span>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.72rem', color: '#f59e0b' }}>
            {pending} XP waiting tonight
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>
            {domainsHit === 0 ? 'Start in any domain to claim it' : `${5 - domainsHit} more domain${5 - domainsHit !== 1 ? 's' : ''} to unlock compound bonus`}
          </div>
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(245,158,11,0.5)' }}>
        Don't leave it
      </div>
    </div>
  )
}
