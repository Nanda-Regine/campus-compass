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

  return (
    <form action={action} method="POST">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        onClick={handleClick}
        className="w-full font-display font-bold text-sm py-3 rounded-xl transition-all active:scale-[0.98]"
        style={{
          background: gold || highlight ? colour : 'rgba(13,148,136,0.2)',
          color: gold ? '#1a1200' : highlight ? '#1a0a00' : '#2dd4bf',
          border: gold || highlight ? 'none' : '1px solid rgba(13,148,136,0.3)',
        }}
      >
        Subscribe for R{price}/month
      </button>
    </form>
  )
}
