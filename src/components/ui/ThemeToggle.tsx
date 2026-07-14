'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Eye } from 'lucide-react'

type VTheme = 'dark' | 'light' | 'outdoor'
const CYCLE: VTheme[] = ['dark', 'light', 'outdoor']

const META: Record<VTheme, { label: string; next: string; icon: typeof Sun }> = {
  dark:    { label: 'Dark',    next: 'Sunrise',  icon: Moon },
  light:   { label: 'Sunrise', next: 'Outdoor',  icon: Sun  },
  outdoor: { label: 'Outdoor', next: 'Dark',     icon: Eye  },
}

interface ThemeToggleProps { compact?: boolean }

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return <div style={{ width: compact ? 32 : 80, height: 32, borderRadius: 9999, background: 'rgba(255,255,255,0.07)' }} />
  }

  const current: VTheme = (CYCLE.includes(theme as VTheme) ? theme : 'dark') as VTheme
  const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length]
  const { label, icon: Icon } = META[current]

  const isLight = current === 'light'
  const isOutdoor = current === 'outdoor'
  const accentColor = isOutdoor ? '#065F46' : isLight ? '#0BAE88' : 'rgba(255,255,255,0.62)'

  if (compact) {
    return (
      <button
        onClick={() => setTheme(next)}
        title={`${label} mode — tap to switch`}
        style={{
          width: 32, height: 32, borderRadius: 8,
          border: `0.5px solid ${isLight || isOutdoor ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)'}`,
          background: isLight || isOutdoor ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s ease',
          color: accentColor, flexShrink: 0,
        }}
      >
        <Icon size={14} />
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(next)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: 10,
        background: isLight || isOutdoor ? 'rgba(0,181,150,0.08)' : 'rgba(255,255,255,0.08)',
        border: `0.5px solid ${isLight || isOutdoor ? 'rgba(0,181,150,0.25)' : 'rgba(255,255,255,0.08)'}`,
        cursor: 'pointer', transition: 'all 0.2s ease',
        color: accentColor,
        fontSize: 13, fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
        width: '100%',
      }}
    >
      <Icon size={14} />
      {label} mode
      <span style={{
        marginLeft: 'auto', fontSize: 10,
        fontFamily: 'JetBrains Mono, monospace',
        color: isLight || isOutdoor ? accentColor : 'rgba(255,255,255,0.45)',
      }}>
        ON
      </span>
    </button>
  )
}
