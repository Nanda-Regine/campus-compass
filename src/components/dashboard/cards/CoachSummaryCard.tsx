'use client'

import { type Expense } from '@/types'
import { useCachedFetch } from '@/hooks/useCachedFetch'

interface CoachInsight { tag: string; text: string }

export default function CoachSummaryCard({ userId, totalBudget, amountSpent, expenses }: {
  userId: string; totalBudget: number; amountSpent: number; expenses: Expense[]
}) {
  const now      = new Date()
  const month    = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const week     = Math.ceil(now.getDate() / 7)
  const cacheKey = totalBudget > 0 ? `coach_summary_${userId}_${month}_w${week}` : null
  const { data: insights, loading } = useCachedFetch<CoachInsight[]>(cacheKey, async () => {
    const catMap: Record<string, number> = {}
    expenses.forEach(e => { catMap[e.category] = (catMap[e.category] ?? 0) + e.amount })
    const topCategories  = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c).join(', ') || 'General'
    const percentUsed    = Math.round((amountSpent / totalBudget) * 100)
    const daysRemaining  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()
    const r = await fetch('/api/dashboard/coach-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalBudget, amountSpent, percentUsed, topCategories, daysRemaining, savingsGoals: 'None' }),
    })
    const d = r.ok ? await r.json() : null
    return d?.insights ?? null
  })

  if (totalBudget <= 0) return null

  const tagColors: Record<string, string> = {
    'Watch out': '#ff6b6b', 'Money tip': '#c9a84c',
    'Goal progress': '#4ecf9e', 'Well done': '#4ecf9e',
  }

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' }}>
      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#c9a84c 0%,rgba(201,168,76,0.15) 100%)' }} />
      <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 10, fontWeight: 600 }}>Budget Coach</div>
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[70, 85, 65].map((w, i) => <div key={i} className="skeleton-row" style={{ height: 14, width: `${w}%` }} />)}
        </div>
      )}
      {!loading && insights && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {insights.map((ins, i) => {
            const color = tagColors[ins.tag] ?? '#c9a84c'
            return (
              <div key={i} style={{ padding: '8px 10px', background: `${color}12`, borderRadius: 8, border: `0.5px solid ${color}28` }}>
                <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color, fontWeight: 700, marginBottom: 3 }}>{ins.tag}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ins.text}</div>
              </div>
            )
          })}
        </div>
      )}
      {!loading && !insights && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>Set a budget to get insights</div>
      )}
    </div>
  )
}
