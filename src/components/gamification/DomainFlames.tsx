'use client'

import { useState, useEffect } from 'react'
import { DOMAIN_META, DomainKey, getDomainsHitToday } from '@/lib/xp-engine'

interface DomainStreak {
  streak: number
  last_date: string | null
  shields: number
  best: number
}

type DomainStreaks = Record<DomainKey, DomainStreak>

function getFlameState(streak: number): { emoji: string; label: string; color: string; glow: string } {
  if (streak >= 60) return { emoji: '👑', label: 'Legendary', color: '#f59e0b', glow: '0 0 20px rgba(245,158,11,0.6)' }
  if (streak >= 30) return { emoji: '💎', label: 'Blazing',   color: '#f472b6', glow: '0 0 16px rgba(244,114,182,0.5)' }
  if (streak >= 14) return { emoji: '🔥', label: 'Burning',   color: '#ff5422', glow: '0 0 14px rgba(255,84,34,0.5)' }
  if (streak >= 7)  return { emoji: '🔥', label: 'Warm',      color: '#ff7e00', glow: '0 0 10px rgba(255,126,0,0.4)' }
  if (streak >= 3)  return { emoji: '🔥', label: 'Lit',       color: '#ffb01c', glow: '0 0 8px rgba(255,176,28,0.3)' }
  if (streak >= 1)  return { emoji: '🕯️', label: 'Sparked',  color: '#4ecf9e', glow: '0 0 6px rgba(78,207,158,0.3)' }
  return { emoji: '💤', label: 'Cold', color: 'rgba(255,255,255,0.2)', glow: 'none' }
}

const DOMAIN_ORDER: DomainKey[] = ['academic', 'money', 'life', 'career', 'community']

export default function DomainFlames() {
  const [streaks, setStreaks] = useState<DomainStreaks | null>(null)
  const [todayDomains, setTodayDomains] = useState<Set<DomainKey>>(new Set())

  useEffect(() => {
    setTodayDomains(getDomainsHitToday())
    fetch('/api/gamification/domain-streak')
      .then(r => r.json())
      .then(d => { if (d.domain_streaks) setStreaks(d.domain_streaks) })
      .catch(() => {})

    const handler = () => setTodayDomains(getDomainsHitToday())
    window.addEventListener('varsityos:xp', handler)
    return () => window.removeEventListener('varsityos:xp', handler)
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Domain Flames</span>
        {todayDomains.size >= 3 && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#4ecf9e', background: 'rgba(78,207,158,0.12)', border: '1px solid rgba(78,207,158,0.3)', borderRadius: 6, padding: '1px 6px' }}>
            🔥 Compound Day!
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {DOMAIN_ORDER.map(domain => {
          const meta = DOMAIN_META[domain]
          const ds: DomainStreak = streaks?.[domain] ?? { streak: 0, last_date: null, shields: 2, best: 0 }
          const flame = getFlameState(ds.streak)
          const isActiveToday = todayDomains.has(domain)

          return (
            <div key={domain} style={{
              background: isActiveToday ? meta.darkColor : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isActiveToday ? meta.color + '40' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 14, padding: '10px 6px', textAlign: 'center',
              transition: 'all 0.3s ease',
              boxShadow: isActiveToday ? flame.glow : 'none',
            }}>
              <div style={{ fontSize: 18, marginBottom: 4, filter: ds.streak === 0 ? 'grayscale(1)' : 'none' }}>
                {flame.emoji}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: flame.color, lineHeight: 1 }}>
                {ds.streak}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {meta.label}
              </div>
              {ds.shields > 0 && (
                <div style={{ marginTop: 4, fontSize: 8, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
                  {'🛡️'.repeat(ds.shields)}
                </div>
              )}
              {isActiveToday && (
                <div style={{ marginTop: 3, width: '100%', height: 2, background: meta.color, borderRadius: 1, opacity: 0.7 }} />
              )}
            </div>
          )
        })}
      </div>
      {todayDomains.size > 0 && (
        <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
          {todayDomains.size}/5 domains active today
          {todayDomains.size < 3 && <span style={{ color: 'rgba(255,255,255,0.15)' }}> · {3 - todayDomains.size} more for Compound Day</span>}
        </div>
      )}
    </div>
  )
}
