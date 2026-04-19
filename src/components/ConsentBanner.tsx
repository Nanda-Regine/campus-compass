'use client'

import { useState, useEffect } from 'react'

const CONSENT_KEY = 'varsityos_cookie_consent'

type ConsentChoice = 'all' | 'essential' | null

export default function ConsentBanner() {
  const [choice, setChoice] = useState<ConsentChoice>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY) as ConsentChoice | null
    if (!stored) {
      const t = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(t)
    }
    setChoice(stored)
    applyConsent(stored)
  }, [])

  function applyConsent(c: ConsentChoice) {
    if (c === 'essential') {
      if (typeof window !== 'undefined' && (window as { posthog?: { opt_out_capturing?: () => void } }).posthog?.opt_out_capturing) {
        (window as { posthog?: { opt_out_capturing?: () => void } }).posthog!.opt_out_capturing!()
      }
      if (typeof window !== 'undefined') {
        ;(window as unknown as Record<string, unknown>).varsityos_analytics_allowed = false
      }
    } else if (c === 'all') {
      if (typeof window !== 'undefined') {
        ;(window as unknown as Record<string, unknown>).varsityos_analytics_allowed = true
        const ph = (window as { posthog?: { opt_in_capturing?: () => void; has_opted_out_capturing?: () => boolean } }).posthog
        if (ph?.has_opted_out_capturing?.() && ph.opt_in_capturing) {
          ph.opt_in_capturing()
        }
      }
    }
  }

  function handleChoice(c: 'all' | 'essential') {
    localStorage.setItem(CONSENT_KEY, c)
    setChoice(c)
    setVisible(false)
    applyConsent(c)
  }

  if (!visible) return null

  void choice

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        background: 'rgba(7,11,9,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '0.5px solid var(--border-subtle)',
        padding: '16px 20px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        animation: 'slideInFromBottom 300ms var(--ease-out) both',
      }}
    >
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>
            Your data, your choice
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.69rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            VarsityOS uses essential cookies to keep you logged in. We'd also like to use analytics cookies (PostHog, Vercel)
            to improve the app. Under POPIA you can choose what to allow.{' '}
            <a href="/privacy" style={{ color: 'var(--teal)', textDecoration: 'none' }}>Privacy Policy →</a>
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.69rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
            POPIA Reg: 2026-005658 · Mirembe Muse Pty Ltd
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => handleChoice('all')}
            style={{
              flex: 1,
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.875rem',
              background: 'var(--teal)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '10px 0',
              cursor: 'pointer',
            }}
          >
            Accept all
          </button>
          <button
            onClick={() => handleChoice('essential')}
            style={{
              flex: 1,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              background: 'transparent',
              color: 'var(--text-tertiary)',
              border: '0.5px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 0',
              cursor: 'pointer',
            }}
          >
            Essential only
          </button>
        </div>
      </div>
    </div>
  )
}
