'use client'

import { useState, useEffect, useCallback } from 'react'
import TopBar from '@/components/layout/TopBar'
import { type WorkShift } from '@/types'

interface MonthSummary {
  month: string
  label: string
  hours: number
  earnings: number
  shifts: number
}

export default function EarningsPage() {
  const [shifts, setShifts] = useState<WorkShift[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const res = await fetch('/api/work/shifts')
    if (res.ok) {
      const d = await res.json()
      setShifts(d.shifts ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Build monthly summaries from worked shifts
  const workedShifts = shifts.filter(s => s.status === 'worked')

  const monthSummaries = workedShifts.reduce<Record<string, MonthSummary>>((acc, shift) => {
    const month = shift.shift_date.slice(0, 7)
    if (!acc[month]) {
      acc[month] = {
        month,
        label: new Date(month + '-01').toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }),
        hours: 0,
        earnings: 0,
        shifts: 0,
      }
    }
    acc[month].hours    += shift.duration_hours
    acc[month].earnings += shift.earnings ?? 0
    acc[month].shifts   += 1
    return acc
  }, {})

  const sorted = Object.values(monthSummaries).sort((a, b) => b.month.localeCompare(a.month))

  const totalEarnings = workedShifts.reduce((s, sh) => s + (sh.earnings ?? 0), 0)
  const totalHours    = workedShifts.reduce((s, sh) => s + sh.duration_hours, 0)

  // What this month's earnings covered
  const thisMonth = sorted[0]

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-24">
      <TopBar title="Earnings" />
      <div className="px-4 py-3 space-y-4 max-w-2xl mx-auto">

        {/* ─── All-time totals ─── */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(13,148,136,0.12) 0%, rgba(13,148,136,0.05) 100%)',
            border: '1px solid rgba(13,148,136,0.2)',
          }}
        >
          <div className="font-mono text-[0.6rem] text-teal-400/60 uppercase tracking-widest mb-2">Total earned (all time)</div>
          <div className="font-display font-black text-3xl text-white">
            R{totalEarnings.toFixed(0)}
          </div>
          <div className="font-mono text-[0.58rem] text-teal-300/50 mt-1">
            {totalHours.toFixed(1)} hours worked · {workedShifts.length} shifts
          </div>
        </div>

        {/* ─── Current month context ─── */}
        {thisMonth && thisMonth.earnings > 0 && (
          <div className="bg-[var(--bg-surface)] border border-white/7 rounded-2xl p-4">
            <div className="font-mono text-[0.58rem] text-white/30 uppercase tracking-widest mb-2">
              {thisMonth.label}
            </div>
            <div className="font-display font-black text-2xl text-amber-400 mb-1">
              R{thisMonth.earnings.toFixed(0)}
            </div>
            <div className="font-mono text-[0.58rem] text-white/40">
              {thisMonth.hours.toFixed(1)} hours across {thisMonth.shifts} shifts
            </div>

            {/* What it covered */}
            <div className="mt-3 pt-3 border-t border-white/7">
              <div className="font-mono text-[0.58rem] text-white/30 mb-1.5">Approximate coverage</div>
              <div className="space-y-1">
                {getWhatItCovers(thisMonth.earnings).map(item => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <span className="font-body text-white/55">{item.emoji} {item.label}</span>
                    <span className={`font-mono font-bold ${item.covered ? 'text-teal-400' : 'text-white/25'}`}>
                      {item.covered ? '✓ covered' : `R${item.cost}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Month history ─── */}
        <section>
          <div className="font-mono text-[0.6rem] text-white/30 uppercase tracking-widest mb-2.5">Monthly history</div>
          {loading ? (
            <div className="space-y-2">
              {[1,2].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">💸</div>
              <p className="font-mono text-[0.6rem] text-white/30">No worked shifts yet — mark shifts as worked to track earnings</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sorted.map(m => (
                <div key={m.month} className="bg-[var(--bg-surface)] border border-white/7 rounded-2xl px-4 py-3.5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-white text-sm">{m.label}</div>
                    <div className="font-mono text-[0.58rem] text-white/35 mt-0.5">
                      {m.hours.toFixed(1)} hrs · {m.shifts} shifts
                    </div>
                  </div>
                  <div className="font-display font-black text-lg text-amber-400">
                    R{m.earnings.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

// Contextualise earnings against common student expenses (ZAR 2026 estimates)
function getWhatItCovers(earnings: number) {
  const items = [
    { emoji: '📱', label: 'Data (10GB)',    cost: 250 },
    { emoji: '🚌', label: 'Transport/month', cost: 400 },
    { emoji: '🍳', label: 'Groceries/month', cost: 600 },
    { emoji: '🏠', label: 'Rent contrib.',   cost: 1500 },
    { emoji: '💰', label: 'Emergency fund',  cost: 500 },
  ]

  let remaining = earnings
  return items.map(item => {
    const covered = remaining >= item.cost
    if (covered) remaining -= item.cost
    return { ...item, covered }
  })
}
