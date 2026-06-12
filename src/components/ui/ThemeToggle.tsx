'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  compact?: boolean
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Avoid hydration mismatch — render placeholder until mounted
  if (!mounted) {
    return (
      <div style={{ width: compact ? 32 : 80, height: 32, borderRadius: 9999, background: 'rgba(255,255,255,0.04)' }} />
    )
  }

  const isLight = theme === 'light'

  if (compact) {
    return (
      <button
        onClick={() => setTheme(isLight ? 'dark' : 'light')}
        title={isLight ? 'Switch to dark mode' : 'Outdoor / light mode'}
        style={{
          width: 32, height: 32,
          borderRadius: 8,
          border: '0.5px solid rgba(255,255,255,0.1)',
          background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s ease',
          color: isLight ? '#0d9488' : 'rgba(255,255,255,0.45)',
          flexShrink: 0,
        }}
      >
        {isLight ? <Moon size={14} /> : <Sun size={14} />}
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: 10,
        background: isLight ? 'rgba(0,181,150,0.08)' : 'rgba(255,255,255,0.05)',
        border: `0.5px solid ${isLight ? 'rgba(0,181,150,0.25)' : 'rgba(255,255,255,0.08)'}`,
        cursor: 'pointer', transition: 'all 0.2s ease',
        color: isLight ? '#0d9488' : 'rgba(255,255,255,0.55)',
        fontSize: 13, fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
        width: '100%',
      }}
    >
      {isLight
        ? <><Moon size={14} /> Dark mode</>
        : <><Sun size={14} /> Outdoor mode</>
      }
      <span style={{
        marginLeft: 'auto', fontSize: 10,
        fontFamily: 'JetBrains Mono, monospace',
        color: isLight ? '#0d9488' : 'rgba(255,255,255,0.25)',
      }}>
        {isLight ? 'ON' : 'OFF'}
      </span>
    </button>
  )
}
