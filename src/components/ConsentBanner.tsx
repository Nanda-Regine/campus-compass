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
      // Small delay so the banner doesn't flash before the page loads
      const t = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(t)
    }
    setChoice(stored)
    applyConsent(stored)
  }, [])

  function applyConsent(c: ConsentChoice) {
    if (c === 'essential') {
      // Disable PostHog analytics
      if (typeof window !== 'undefined' && (window as { posthog?: { opt_out_capturing?: () => void } }).posthog?.opt_out_capturing) {
        (window as { posthog?: { opt_out_capturing?: () => void } }).posthog!.opt_out_capturing!()
      }
      // Block GTM analytics cookies (GTM is already loaded, but we suppress events)
      if (typeof window !== 'undefined') {
        (window as Record<string, unknown>).varsityos_analytics_allowed = false
      }
    } else if (c === 'all') {
      if (typeof window !== 'undefined') {
        (window as Record<string, unknown>).varsityos_analytics_allowed = true
        // Re-enable PostHog if previously opted out
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

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-20 md:bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
    >
      <div className="pointer-events-auto w-full max-w-md bg-[#0e1a18] border border-white/12 rounded-2xl shadow-2xl p-4 animate-slide-up">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-lg flex-shrink-0">🍪</span>
          <div>
            <p className="font-display font-bold text-white text-sm mb-1">Your data, your choice</p>
            <p className="font-mono text-[0.62rem] text-white/50 leading-relaxed">
              VarsityOS uses essential cookies to keep you logged in. We'd also like to use analytics
              cookies (PostHog, Vercel) to improve the app. Under POPIA you can choose what to allow.{' '}
              <a href="/privacy" className="text-teal-400 hover:underline">Privacy Policy →</a>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleChoice('all')}
            className="flex-1 font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-xl transition-all"
          >
            Accept all
          </button>
          <button
            onClick={() => handleChoice('essential')}
            className="flex-1 font-mono text-[0.72rem] text-white/60 hover:text-white border border-white/12 hover:border-white/25 py-2.5 rounded-xl transition-all"
          >
            Essential only
          </button>
        </div>
      </div>
    </div>
  )
}
