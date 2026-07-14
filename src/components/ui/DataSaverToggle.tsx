'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { getDataSaverEnabled, setDataSaverEnabled, onDataSaverChange } from '@/lib/dataSaver'

interface DataSaverToggleProps {
  variant?: 'full' | 'compact'
}

export function DataSaverToggle({ variant = 'full' }: DataSaverToggleProps) {
  const [enabled, setEnabled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setEnabled(getDataSaverEnabled())
    setMounted(true)
    return onDataSaverChange(setEnabled)
  }, [])

  if (!mounted) return <div style={{ height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.07)' }} />

  function toggle() {
    const next = !enabled
    setDataSaverEnabled(next)
    setEnabled(next)
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={toggle}
        title={enabled ? 'Data Saver ON — tap to disable' : 'Enable Data Saver'}
        style={{
          width: 32, height: 32, borderRadius: 8,
          border: `0.5px solid ${enabled ? 'rgba(78,207,158,0.3)' : 'rgba(255,255,255,0.1)'}`,
          background: enabled ? 'rgba(78,207,158,0.1)' : 'rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0,
          color: enabled ? '#4ecf9e' : 'rgba(255,255,255,0.55)',
        }}
      >
        {enabled ? <WifiOff size={14} /> : <Wifi size={14} />}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: 10, width: '100%',
        background: enabled ? 'rgba(78,207,158,0.08)' : 'rgba(255,255,255,0.07)',
        border: `0.5px solid ${enabled ? 'rgba(78,207,158,0.25)' : 'rgba(255,255,255,0.08)'}`,
        cursor: 'pointer', transition: 'all 0.2s ease',
        color: enabled ? '#4ecf9e' : 'rgba(255,255,255,0.55)',
        fontSize: 13, fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
      }}
    >
      {enabled ? <WifiOff size={14} /> : <Wifi size={14} />}
      {enabled ? 'Data Saver ON' : 'Data Saver mode'}
      <span style={{
        marginLeft: 'auto', fontSize: 10,
        fontFamily: 'JetBrains Mono, monospace',
        color: enabled ? '#4ecf9e' : 'rgba(255,255,255,0.45)',
      }}>
        {enabled ? 'ON' : 'OFF'}
      </span>
    </button>
  )
}
