'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Props {
  yearOfStudy?: string | number | null
  firstName?: string | null
}

type Mode = 'first' | 'final'

const CONFIG: Record<Mode, {
  accent: string
  dismissKey: string
  kicker: string
  title: (n?: string | null) => string
  blurb: string
  links: { href: string; icon: string; label: string; sub: string }[]
}> = {
  first: {
    accent: '#06B6D4',
    dismissKey: 'varsityos-firstyear-nudge-dismissed',
    kicker: 'New here? Start here',
    title: (n) => (n ? `Welcome, ${n} 👋` : 'Welcome 👋'),
    blurb: "Moving away from home for the first time is a big deal. We've put together everything you need to land softly — what to buy, how to settle in, and the life-admin nobody teaches you.",
    links: [
      { href: '/housing?tab=kit', icon: '🎒', label: 'Starter Kit', sub: 'What to buy & bring' },
      { href: '/housing?tab=settle', icon: '🌱', label: 'Settling In', sub: 'First weeks, homesickness' },
      { href: '/housing?tab=admin', icon: '🧰', label: 'Life Admin', sub: 'Prepaid, laundry, sick' },
    ],
  },
  final: {
    accent: '#6366F1',
    dismissKey: 'varsityos-finalyear-nudge-dismissed',
    kicker: 'Final stretch · what comes next',
    title: (n) => (n ? `You're nearly there, ${n} 🚀` : "You're nearly there 🚀"),
    blurb: "Leaving varsity is as big a change as starting it. Get ready for the leap — the exit admin, your first real salary, and the parts that hit your heart, not just your to-do list.",
    links: [
      { href: '/launchpad?tab=exit', icon: '✅', label: 'Exit Checklist', sub: 'Graduate & wrap up' },
      { href: '/launchpad?tab=salary', icon: '💼', label: 'First Salary', sub: 'Take-home pay, tax' },
      { href: '/launchpad?tab=leap', icon: '🚀', label: 'The Leap', sub: 'Life after varsity' },
    ],
  },
}

function detectMode(year: string): Mode | null {
  if (year.startsWith('1')) return 'first'
  if (/^[345]/.test(year) || year.includes('honours') || year.includes('master') || year.includes('phd')) return 'final'
  return null
}

export default function FirstYearStarter({ yearOfStudy, firstName }: Props) {
  const [mode, setMode] = useState<Mode | null>(null)

  useEffect(() => {
    const yr = yearOfStudy == null ? '' : String(yearOfStudy).trim().toLowerCase()
    const m = detectMode(yr)
    if (!m) return
    let dismissed = false
    try { dismissed = localStorage.getItem(CONFIG[m].dismissKey) === '1' } catch { /* ignore */ }
    if (!dismissed) setMode(m)
  }, [yearOfStudy])

  if (!mode) return null
  const c = CONFIG[mode]

  const dismiss = () => {
    setMode(null)
    try { localStorage.setItem(c.dismissKey, '1') } catch { /* ignore */ }
  }

  return (
    <div className="dash-card-in" style={{
      position: 'relative', background: `linear-gradient(135deg, ${c.accent}1a, rgba(168,85,247,0.08))`,
      border: `0.5px solid ${c.accent}40`, borderRadius: 14, padding: '16px 18px', marginBottom: 12,
    }}>
      <button onClick={dismiss} aria-label="Dismiss" style={{
        position: 'absolute', top: 10, right: 12, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 0,
      }}>✕</button>

      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.accent, marginBottom: 4, fontFamily: 'var(--font-mono)' }}>{c.kicker}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{c.title(firstName)}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: 4, marginBottom: 12 }}>{c.blurb}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
        {c.links.map(l => (
          <Link key={l.href} href={l.href} style={{
            display: 'flex', flexDirection: 'column', gap: 2, padding: '11px 12px',
            background: 'rgba(0,0,0,0.18)', border: `0.5px solid ${c.accent}30`, borderRadius: 11, textDecoration: 'none',
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
