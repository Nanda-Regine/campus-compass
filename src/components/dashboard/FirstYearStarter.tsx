'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const ACCENT = '#06B6D4'
const DISMISS_KEY = 'varsityos-firstyear-nudge-dismissed'

interface Props {
  yearOfStudy?: string | number | null
  firstName?: string | null
}

const LINKS = [
  { href: '/housing?tab=kit', icon: '🎒', label: 'Starter Kit', sub: 'What to buy & bring' },
  { href: '/housing?tab=settle', icon: '🌱', label: 'Settling In', sub: 'First weeks, homesickness' },
  { href: '/housing?tab=admin', icon: '🧰', label: 'Life Admin', sub: 'Prepaid, laundry, sick' },
]

export default function FirstYearStarter({ yearOfStudy, firstName }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const yr = yearOfStudy == null ? '' : String(yearOfStudy).trim().toLowerCase()
    const isFirstYear = yr.startsWith('1')
    if (!isFirstYear) return
    let dismissed = false
    try { dismissed = localStorage.getItem(DISMISS_KEY) === '1' } catch { /* ignore */ }
    if (!dismissed) setShow(true)
  }, [yearOfStudy])

  if (!show) return null

  const dismiss = () => {
    setShow(false)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
  }

  return (
    <div className="dash-card-in" style={{
      position: 'relative', background: `linear-gradient(135deg, ${ACCENT}1a, rgba(168,85,247,0.08))`,
      border: `0.5px solid ${ACCENT}40`, borderRadius: 14, padding: '16px 18px', marginBottom: 12,
    }}>
      <button onClick={dismiss} aria-label="Dismiss" style={{
        position: 'absolute', top: 10, right: 12, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 0,
      }}>✕</button>

      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT, marginBottom: 4, fontFamily: 'var(--font-mono)' }}>New here? Start here</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
        {firstName ? `Welcome, ${firstName} 👋` : 'Welcome 👋'}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: 4, marginBottom: 12 }}>
        Moving away from home for the first time is a big deal. We&apos;ve put together everything you need to land softly — what to buy, how to settle in, and the life-admin nobody teaches you.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
        {LINKS.map(l => (
          <Link key={l.href} href={l.href} style={{
            display: 'flex', flexDirection: 'column', gap: 2, padding: '11px 12px',
            background: 'rgba(0,0,0,0.18)', border: `0.5px solid ${ACCENT}30`, borderRadius: 11, textDecoration: 'none',
          }}>
            <span style={{ fontSize: 18 }}>{l.icon}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{l.label}</span>
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{l.sub}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
