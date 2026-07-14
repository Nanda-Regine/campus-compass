'use client'

import { useState } from 'react'

interface Props {
  monthlyEarnings: number
  userId: string
}

const THRESHOLD = 350000

const BAND_COLORS = {
  safe: '#4ecf9e',
  watch: '#fbbf24',
  warning: '#f87171',
} as const

const BAND_LABELS = {
  safe: 'Your work earnings are well within safe limits',
  watch: 'Approaching 60% of disclosure threshold — watch total household income',
  warning: 'Consider discussing your earnings with the Financial Aid Office',
} as const

type RiskLevel = keyof typeof BAND_COLORS

export default function NsfasWorkCheck({ monthlyEarnings }: Props) {
  const [infoOpen, setInfoOpen] = useState(false)

  const annualized = monthlyEarnings * 12
  const pct = Math.min(100, (annualized / THRESHOLD) * 100)
  const risk: RiskLevel = pct < 30 ? 'safe' : pct < 60 ? 'watch' : 'warning'
  const riskColor = BAND_COLORS[risk]

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
      }}
      className="p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          style={{
            background: `${riskColor}18`,
            border: `1px solid ${riskColor}30`,
            borderRadius: '10px',
          }}
          className="w-10 h-10 flex items-center justify-center flex-shrink-0"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"
              stroke={riskColor}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <div className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
            NSFAS Income Compatibility
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Work earnings check
          </div>
        </div>
      </div>

      {/* Annualized earnings */}
      <div>
        <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
          Your annualized work earnings
        </div>
        <div className="text-2xl font-bold" style={{ color: 'var(--text-secondary)' }}>
          R{annualized.toLocaleString('en-ZA')}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: '6px', background: 'rgba(255,255,255,0.06)' }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: riskColor,
              borderRadius: '9999px',
              transition: 'width 0.6s ease',
            }}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            R0
          </span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Household income threshold: R350,000/year
          </span>
        </div>
      </div>

      {/* Status card */}
      <div
        style={{
          background: `${riskColor}10`,
          border: `1px solid ${riskColor}25`,
          borderRadius: '10px',
        }}
        className="px-4 py-3 flex items-center gap-3"
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: riskColor }}
        />
        <p className="text-sm leading-snug" style={{ color: riskColor }}>
          {BAND_LABELS[risk]}
        </p>
      </div>

      {/* Collapsible info */}
      <div>
        <button
          onClick={() => setInfoOpen(prev => !prev)}
          className="flex items-center gap-2 text-xs transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              transform: infoOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {infoOpen ? 'Hide' : 'How does NSFAS means-testing work?'}
        </button>

        {infoOpen && (
          <div
            className="mt-3 p-4 rounded-xl text-sm leading-relaxed space-y-2"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'var(--text-tertiary)',
            }}
          >
            <p>
              NSFAS means test applies to your <strong style={{ color: 'var(--text-secondary)' }}>total household income</strong> —
              this includes your parents&apos; or guardian&apos;s income as well as your own.
            </p>
            <p>
              NSFAS does cross-reference with SARS, so declared income should be accurate and consistent.
            </p>
            <p>
              If you&apos;re unsure about your situation, speak to your <strong style={{ color: 'var(--text-secondary)' }}>Financial Aid Office</strong> —
              they are there to help you, not penalise you. Many students successfully disclose work income without affecting their funding.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
