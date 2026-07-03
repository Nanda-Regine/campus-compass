'use client'

import { type Budget } from '@/types'

interface Props {
  budget: Budget | null
  monthlyExpenses: number
  nsfasStatus: 'ok' | 'delayed' | 'partial' | 'none'
  savingsRate: number
}

const BANDS = [
  { min: 80, label: 'Strong',   color: '#4ecf9e', desc: 'Your finances are healthy. Keep building savings.' },
  { min: 60, label: 'Steady',   color: '#7090d0', desc: 'On track. Watch for budget creep.' },
  { min: 40, label: 'Tight',    color: '#fbbf24', desc: 'Money is stretched. Prioritise essentials.' },
  { min: 20, label: 'Stressed', color: '#fb923c', desc: 'High financial stress. Explore support options.' },
  { min: 0,  label: 'Crisis',   color: '#f87171', desc: 'Urgent financial situation. Seek help today.' },
]

function calcScore(props: Props): number {
  const monthlyBudget = props.budget?.monthly_budget ?? 0
  let score = 0
  const ratio = monthlyBudget > 0 ? props.monthlyExpenses / monthlyBudget : 1
  if (ratio < 0.8) score += 40
  else if (ratio < 1.0) score += 28
  else if (ratio < 1.2) score += 12
  const nsfasPoints: Record<string, number> = { ok: 20, delayed: 10, partial: 8, none: 0 }
  score += nsfasPoints[props.nsfasStatus] ?? 0
  if (props.savingsRate > 10) score += 20
  else if (props.savingsRate > 5) score += 15
  else if (props.savingsRate > 0) score += 8
  score += props.budget ? 20 : 0
  return Math.min(100, score)
}

function getBand(score: number) {
  return BANDS.find(b => score >= b.min) ?? BANDS[BANDS.length - 1]
}

export default function MoneyHealthScore(props: Props) {
  const score = calcScore(props)
  const band = getBand(score)

  const monthlyBudget = props.budget?.monthly_budget ?? 0
  const budgetUsePercent = monthlyBudget > 0 ? Math.min(100, (props.monthlyExpenses / monthlyBudget) * 100) : 100
  const savingsPercent = Math.min(100, Math.max(0, props.savingsRate * 5))
  const incomePercent = { ok: 100, delayed: 50, partial: 40, none: 0 }[props.nsfasStatus] ?? 0

  const circumference = 2 * Math.PI * 38
  const dashOffset = circumference - (score / 100) * circumference

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }} className="p-4">
      <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Money Health</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexShrink: 0, width: 80, height: 80 }}>
          <svg width="80" height="80" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
              cx="45" cy="45" r="38" fill="none"
              stroke={band.color} strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 45 45)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: band.color }}>{score}</span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{band.label}</span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{band.desc}</p>

          <div className="mt-3 space-y-2">
            <MiniBar label="Budget Use" value={budgetUsePercent} color={budgetUsePercent > 100 ? '#f87171' : budgetUsePercent > 80 ? '#fbbf24' : '#4ecf9e'} invert />
            <MiniBar label="Savings" value={savingsPercent} color="#7090d0" />
            <MiniBar label="Income" value={incomePercent} color="#4ecf9e" />
          </div>
        </div>
      </div>

      {score < 50 && (
        <a href="/budget" className="block mt-3 text-xs" style={{ color: '#fbbf24' }}>
          See financial support options →
        </a>
      )}
    </div>
  )
}

function MiniBar({ label, value, color, invert }: { label: string; value: number; color: string; invert?: boolean }) {
  const displayValue = invert ? Math.min(value, 100) : value
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{Math.round(value)}%</span>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}>
        <div
          style={{ width: `${displayValue}%`, background: color, height: '100%', borderRadius: '9999px', transition: 'width 0.5s ease' }}
        />
      </div>
    </div>
  )
}
