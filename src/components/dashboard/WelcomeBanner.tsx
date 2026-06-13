'use client'

import { useState, useEffect } from 'react'

export default function WelcomeBanner() {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('varsityos-new-user')
    if (stored) {
      setName(stored)
      // Clear immediately so it only ever shows once
      localStorage.removeItem('varsityos-new-user')
    }
  }, [])

  if (!name) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      padding: '16px 18px',
      background: 'linear-gradient(135deg, rgba(13,148,136,0.12) 0%, rgba(8,145,178,0.08) 100%)',
      border: '1px solid rgba(13,148,136,0.25)',
      borderRadius: 16,
      marginBottom: 16,
      animation: 'fadeIn 0.5s ease',
    }}>
      <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>🎉</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'rgba(255,255,255,0.92)', marginBottom: 4 }}>
          Welcome, {name}!
        </div>
        <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
          Your profile is set up. Explore your OS — study, budget, safety, and more are ready.
        </div>
      </div>
    </div>
  )
}
