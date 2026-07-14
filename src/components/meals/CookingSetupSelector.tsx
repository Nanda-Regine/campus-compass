'use client'

import { useEffect } from 'react'
import { type CookingSetup } from '@/types'

interface Props {
  value: CookingSetup
  onChange: (s: CookingSetup) => void
}

const OPTIONS: { value: CookingSetup; icon: string; label: string; desc: string }[] = [
  { value: 'full', icon: '🍳', label: 'Full Kitchen', desc: 'Stove, oven, fridge available' },
  { value: 'hotplate', icon: '⚡', label: 'Hotplate Only', desc: 'One-pot meals, no oven' },
  { value: 'kettle_microwave', icon: '♨️', label: 'Kettle & Microwave', desc: 'No-cook + microwaveable' },
  { value: 'no_cooking', icon: '🏫', label: 'Campus Dining', desc: 'Dining hall + no cooking' },
]

const ACCENT = '#fb923c'

export default function CookingSetupSelector({ value, onChange }: Props) {
  useEffect(() => {
    const stored = localStorage.getItem('cooking_setup') as CookingSetup | null
    if (stored && stored !== value) {
      onChange(stored)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSelect(setup: CookingSetup) {
    onChange(setup)
    localStorage.setItem('cooking_setup', setup)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Cooking setup
      </div>
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map(option => {
          const isSelected = value === option.value
          return (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              style={{
                background: isSelected ? 'rgba(251,146,60,0.1)' : 'rgba(255,255,255,0.06)',
                border: isSelected ? '1px solid rgba(251,146,60,0.5)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '16px 14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'background 0.18s, border-color 0.18s',
              }}
            >
              <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>{option.icon}</span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  color: isSelected ? ACCENT : '#e5e7eb',
                  transition: 'color 0.18s',
                }}
              >
                {option.label}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  color: isSelected ? 'rgba(251,146,60,0.7)' : '#9ca3af',
                  lineHeight: 1.4,
                  transition: 'color 0.18s',
                }}
              >
                {option.desc}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
