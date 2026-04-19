'use client'

import { trackEvent } from '@/lib/analytics'

interface Props {
  tier: string
  price: number
  action: string
  fields: Record<string, string>
  colour: string
  gold?: boolean
  highlight?: boolean
}

export default function UpgradeButton({ tier, price, action, fields, colour, gold, highlight }: Props) {
  const handleClick = () => {
    trackEvent('upgrade_click', { tier, price })
  }

  const isAccented = gold || highlight

  return (
    <form action={action} method="POST">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        onClick={handleClick}
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
          cursor: 'pointer',
          transition: 'filter var(--duration-fast) var(--ease-out)',
        }}
      >
        Subscribe for R{price}/month
      </button>
    </form>
  )
}
