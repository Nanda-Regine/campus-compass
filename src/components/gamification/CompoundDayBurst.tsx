'use client'

import { useEffect, useState } from 'react'
import { DOMAIN_META, DomainKey } from '@/lib/xp-engine'

interface CompoundPayload { domainsHit: DomainKey[]; xp: number }

const STYLE_ID = 'varsityos-compound-styles'

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const s = document.createElement('style')
  s.id = STYLE_ID
  s.textContent = `
    @keyframes cd-fade-in { from { opacity: 0; transform: scale(0.92) } to { opacity: 1; transform: scale(1) } }
    @keyframes cd-icon-pop { 0% { transform: scale(0) rotate(-20deg); opacity: 0 } 70% { transform: scale(1.15) rotate(4deg) } 100% { transform: scale(1) rotate(0); opacity: 1 } }
    @keyframes cd-title { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
    @keyframes cd-ring { 0% { transform: scale(0.5); opacity: 0.8 } 100% { transform: scale(2.5); opacity: 0 } }
    @keyframes cd-domain { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
    @keyframes cd-xp { from { opacity: 0; transform: scale(0.6) } to { opacity: 1; transform: scale(1) } }
  `
  document.head.appendChild(s)
}

export default function CompoundDayBurst() {
  const [payload, setPayload] = useState<CompoundPayload | null>(null)

  useEffect(() => {
    injectStyles()
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<CompoundPayload>).detail
      setPayload(detail)
      setTimeout(() => setPayload(null), 5000)
    }
    window.addEventListener('varsityos:compound_day', handler)
    return () => window.removeEventListener('varsityos:compound_day', handler)
  }, [])

  if (!payload) return null

  return (
    <div
      onClick={() => setPayload(null)}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        animation: 'cd-fade-in 0.4s ease both', cursor: 'pointer',
      }}
    >
      {/* Rings */}
      {[0, 0.3, 0.6].map((delay, i) => (
        <div key={i} style={{
          position: 'absolute', width: 160, height: 160, borderRadius: '50%',
          border: '2px solid rgba(78,207,158,0.6)',
          animation: `cd-ring 1.8s ${delay}s ease-out infinite`,
        }} />
      ))}

      {/* Main icon */}
      <div style={{ fontSize: 72, marginBottom: 20, animation: 'cd-icon-pop 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.2s both' }}>
        🌍
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#4ecf9e', letterSpacing: '0.2em', marginBottom: 8, animation: 'cd-title 0.4s 0.5s ease both', opacity: 0 }}>
        COMPOUND DAY
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(1.6rem, 5vw, 2.4rem)', color: '#fff', marginBottom: 8, animation: 'cd-title 0.4s 0.65s ease both', opacity: 0, letterSpacing: '-0.03em' }}>
        Ubuntu Mode Activated
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: 28, animation: 'cd-title 0.4s 0.8s ease both', opacity: 0 }}>
        You tended to {payload.domainsHit.length} areas of your life today
      </div>

      {/* Domain icons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        {payload.domainsHit.map((domain, i) => {
          const meta = DOMAIN_META[domain]
          return (
            <div key={domain} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              animation: `cd-domain 0.4s ${0.9 + i * 0.1}s ease both`,
              opacity: 0,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: meta.darkColor, border: `1.5px solid ${meta.color}60`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                {meta.emoji}
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: meta.color, textTransform: 'uppercase' }}>
                {meta.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* XP badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(78,207,158,0.12)', border: '1px solid rgba(78,207,158,0.4)',
        borderRadius: 14, padding: '10px 22px',
        animation: 'cd-xp 0.5s 1.4s cubic-bezier(0.34,1.56,0.64,1) both',
        opacity: 0,
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.2rem', color: '#4ecf9e' }}>
          +{payload.xp} XP
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
          Compound Bonus
        </span>
      </div>

      <div style={{ marginTop: 24, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)' }}>
        Tap to continue
      </div>
    </div>
  )
}
