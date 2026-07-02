'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'

interface Props {
  tier: string
  price: number
  colour: string
  gold?: boolean
  highlight?: boolean
}

// ⚠️ PAYMENTS: subscribe goes to Paystack (via /api/paystack/initiate → Mirembe hub).
// Not PayFast. Do not revert.
export default function UpgradeButton({ tier, price, colour, gold, highlight }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    trackEvent('upgrade_click', { tier, price })

    try {
      const res = await fetch('/api/paystack/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const json = await res.json()
      if (!res.ok || !json.redirect) {
        setError(json.error || 'Payment setup failed. Please try again.')
        setLoading(false)
        return
      }
      // Redirect to Paystack (hosted, secure, auto-renewing subscription).
      window.location.href = json.redirect
    } catch (err) {
      console.error('[Paystack]', err)
      setError('Network error. Check your connection and try again.')
      setLoading(false)
    }
  }

  const isAccented = gold || highlight

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          width: '100%',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '0.875rem',
          padding: '12px 0',
          borderRadius: 'var(--radius-md)',
          border: isAccented ? 'none' : `0.5px solid ${colour}40`,
          background: isAccented ? colour : `${colour}20`,
          color: gold ? '#1a1200' : highlight ? '#fff' : colour,
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'filter var(--duration-fast) var(--ease-out)',
        }}
      >
        {loading ? 'Redirecting to Paystack…' : `Subscribe · R${price}/month`}
      </button>
      {error && (
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          color: '#ef4444',
          marginTop: 6,
          textAlign: 'center',
        }}>
          {error}
        </p>
      )}
    </div>
  )
}
