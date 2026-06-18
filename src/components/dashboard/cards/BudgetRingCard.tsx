import { type Expense } from '@/types'

export default function BudgetRingCard({ monthSpent, totalBudget, expenses, compact = false }: {
  monthSpent: number; totalBudget: number; expenses: Expense[]; compact?: boolean
}) {
  const pct       = totalBudget > 0 ? Math.min(100, Math.round((monthSpent / totalBudget) * 100)) : 0
  const ringColor = pct > 85 ? '#ff6b6b' : pct > 60 ? '#c9a84c' : '#4ecf9e'
  const r = compact ? 26 : 38; const size = compact ? 64 : 96; const sw = compact ? 6 : 8
  const circ = 2 * Math.PI * r; const offset = circ * (1 - pct / 100)
  const catMap: Record<string, number> = {}
  expenses.forEach(e => { catMap[e.category] = (catMap[e.category] ?? 0) + e.amount })
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 3)

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: compact ? 12 : 16 }}>
      <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: compact ? 8 : 12 }}>This Month</div>
      <div style={{ display: 'flex', flexDirection: compact ? 'column' : 'row', alignItems: 'center', gap: compact ? 6 : 16 }}>
        <div style={{ flexShrink: 0, position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ringColor} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ filter: `drop-shadow(0 0 8px ${ringColor}60)` }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: compact ? 11 : 16, fontWeight: 700, color: ringColor, lineHeight: 1 }}>{pct}%</div>
            {!compact && <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>used</div>}
          </div>
        </div>
        <div style={{ flex: compact ? 'unset' : 1, minWidth: 0, textAlign: compact ? 'center' : 'left' }}>
          <div>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: compact ? 13 : 18, fontWeight: 700, color: '#c9a84c' }}>R{Math.round(monthSpent)}</span>
            {!compact && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}> of R{Math.round(totalBudget)}</span>}
          </div>
          {compact ? (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>of R{Math.round(totalBudget)}</div>
          ) : topCats.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
              {topCats.map(([cat, amt]) => (
                <span key={cat} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 9999, background: 'var(--bg-elevated)', border: '0.5px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}>
                  {cat} · R{Math.round(amt)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
