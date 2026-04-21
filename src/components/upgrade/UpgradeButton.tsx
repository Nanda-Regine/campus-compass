'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payfast_do_onsite_payment: (data: { uuid: string }, callback?: (result: boolean) => void) => void
  }
}

interface Props {
  tier: string
  price: number
  colour: string
  gold?: boolean
  highlight?: boolean
}

function loadPayFastScript(isSandbox: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const src = isSandbox
      ? 'https://sandbox.payfast.co.za/onsite/engine.js'
      : 'https://www.payfast.co.za/onsite/engine.js'

    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }

    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load PayFast script'))
    document.head.appendChild(script)
  })
}

export default function UpgradeButton({ tier, price, colour, gold, highlight }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    trackEvent('upgrade_click', { tier, price })

    try {
      const res = await fetch('/api/payfast/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Payment setup failed. Please try again.')
        setLoading(false)
        return
      }

      await loadPayFastScript(json.isSandbox)

      if (typeof window.payfast_do_onsite_payment !== 'function') {
        setError('Payment script unavailable. Please refresh and try again.')
        setLoading(false)
        return
      }

      window.payfast_do_onsite_payment({ uuid: json.uuid }, (result: boolean) => {
        setLoading(false)
        if (result) window.location.href = '/dashboard'
      })
    } catch (err) {
      console.error('[PayFast]', err)
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
        {loading ? 'Setting up payment…' : `Pay R${price} once`}
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
