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

      // Build and submit a hidden form to PayFast
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = json.action

      for (const [name, value] of Object.entries(json.fields as Record<string, string>)) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = name
        input.value = value
        form.appendChild(input)
      }

      document.body.appendChild(form)
      form.submit()
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
        {loading ? 'Redirecting to PayFast…' : `Pay R${price} once`}
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
