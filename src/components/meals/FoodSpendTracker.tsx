'use client'

// FoodSpendTracker — log daily meal costs and track food budget from within Meals OS.
// Writes to expenses table (category='food') — stays fully in sync with Budget OS.

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, TrendingDown, Utensils } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ──────────────────────────────────────────────────────────────────

interface FoodExpense {
  id: string
  description: string
  amount: number
  expense_date: string
}

// ─── SA student meal quick-log options ───────────────────────────────────────

const QUICK_MEALS: { name: string; amount: number; emoji: string }[] = [
  { name: 'Pap & stew',             amount: 25,  emoji: '🍲' },
  { name: 'Maggi noodles',          amount: 8,   emoji: '🍜' },
  { name: 'Bunny chow',             amount: 38,  emoji: '🍞' },
  { name: 'Vetkoek & mince',        amount: 18,  emoji: '🫓' },
  { name: 'Eggs on toast',          amount: 15,  emoji: '🍳' },
  { name: 'Bread & peanut butter',  amount: 12,  emoji: '🥜' },
  { name: 'Amasi & pap',            amount: 18,  emoji: '🥣' },
  { name: 'Stir-fry rice',          amount: 22,  emoji: '🍚' },
  { name: 'Chicken & chips',        amount: 45,  emoji: '🍗' },
  { name: 'Samoosa (3)',             amount: 15,  emoji: '🫔' },
  { name: 'Res cafeteria meal',     amount: 30,  emoji: '🏫' },
  { name: 'Tuck shop snack',        amount: 12,  emoji: '🛒' },
  { name: 'Coffee / tea',           amount: 18,  emoji: '☕' },
  { name: 'Fruit / juice',          amount: 10,  emoji: '🍎' },
]

// ─── Budget stretch tips ─────────────────────────────────────────────────────

const STRETCH_TIPS = [
  'Cook lentils in bulk — R20 of lentils feeds you for 5 meals.',
  'Eggs (R35/dozen) = 12 meals of cheap protein. Hardboiled for lunch.',
  'PnP No Name pasta + tomato paste = R8 dinner. Add beans for protein.',
  'Buy amasi instead of yoghurt — cheaper and high in protein.',
  'Frozen veg is cheaper than fresh and equally nutritious.',
  'Bulk-cook on Sunday. Freeze portions. Saves money AND time.',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  userId: string
  foodBudget: number
}

export default function FoodSpendTracker({ userId, foodBudget }: Props) {
  const supabase = createClient()

  const today      = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01'

  const [expenses,    setExpenses]    = useState<FoodExpense[]>([])
  const [loading,     setLoading]     = useState(true)
  const [logging,     setLogging]     = useState(false)
  const [showCustom,  setShowCustom]  = useState(false)
  const [customDesc,  setCustomDesc]  = useState('')
  const [customAmt,   setCustomAmt]   = useState('')
  // Start at 0 for a stable server/client first render, then pick a random tip on mount
  // (a random useState initializer runs on both sides and warns on hydration).
  const [tipIdx, setTipIdx]           = useState(0)

  useEffect(() => { setTipIdx(Math.floor(Math.random() * STRETCH_TIPS.length)) }, [])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('expenses')
        .select('id,description,amount,expense_date')
        .eq('user_id', userId)
        .eq('category', 'food')
        .gte('expense_date', monthStart)
        .order('expense_date', { ascending: false })
        .limit(100)
      setExpenses((data ?? []) as FoodExpense[])
      setLoading(false)
    }
    load()
  }, [userId])

  const logMeal = async (description: string, amount: number) => {
    if (logging) return
    setLogging(true)
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id:      userId,
        description,
        amount,
        category:     'food',
        expense_date: today,
        month_year:   today.slice(0, 7),
      })
      .select('id,description,amount,expense_date')
      .single()
    if (error) { toast.error('Failed to log meal'); setLogging(false); return }
    setExpenses(prev => [(data as FoodExpense), ...prev])
    toast.success(`R${amount} logged ✓`)
    setLogging(false)
  }

  const handleCustom = async () => {
    const a = parseFloat(customAmt)
    if (!customDesc.trim() || isNaN(a) || a <= 0) { toast.error('Enter a description and amount'); return }
    await logMeal(customDesc.trim(), Math.round(a * 100) / 100)
    setCustomDesc('')
    setCustomAmt('')
    setShowCustom(false)
  }

  const deleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id))
    void supabase.from('expenses').delete().eq('id', id)
    toast.success('Removed')
  }

  // ── Derived numbers ────────────────────────────────────────────────────────
  const totalSpent    = expenses.reduce((s, e) => s + e.amount, 0)
  const remaining     = foodBudget > 0 ? foodBudget - totalSpent : null
  const pct           = foodBudget > 0 ? Math.min(100, (totalSpent / foodBudget) * 100) : 0
  const todayTotal    = expenses.filter(e => e.expense_date === today).reduce((s, e) => s + e.amount, 0)
  const now           = new Date()
  const daysInMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysLeft      = daysInMonth - now.getDate() + 1
  const dailyLeft     = remaining != null && remaining > 0 && daysLeft > 0 ? remaining / daysLeft : null

  // Group by date for list view (up to last 7 distinct days)
  const byDate: Record<string, FoodExpense[]> = {}
  for (const e of expenses) {
    if (!byDate[e.expense_date]) byDate[e.expense_date] = []
    byDate[e.expense_date].push(e)
  }
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a)).slice(0, 7)

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '14px 16px',
  }

  const barColor = pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#4ecf9e'

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Loading food spend…</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Budget progress bar ──────────────────────────────────────────── */}
      {foodBudget > 0 ? (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                Food budget — {today.slice(0, 7)}
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'rgba(255,255,255,0.9)', lineHeight: 1 }}>
                R{totalSpent.toFixed(2)}
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>/ R{foodBudget}</span>
              </p>
            </div>
            {remaining != null && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: remaining < 0 ? '#ef4444' : '#4ecf9e', lineHeight: 1, marginBottom: 2 }}>
                  {remaining < 0 ? '-' : ''}R{Math.abs(remaining).toFixed(0)}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(255,255,255,0.3)' }}>remaining</p>
              </div>
            )}
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Today</p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>R{todayTotal.toFixed(0)}</p>
            </div>
            {dailyLeft != null && (
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Daily allowance left</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: dailyLeft < 20 ? '#f59e0b' : 'rgba(255,255,255,0.8)' }}>
                  R{dailyLeft.toFixed(0)}/day · {daysLeft}d left
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ ...card, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(245,158,11,0.7)', marginBottom: 4 }}>
            💡 Set a food budget in Budget OS to see your progress bar
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(255,255,255,0.3)' }}>
            You can still log meals below — they&apos;ll sync with your Budget tracker automatically.
          </p>
        </div>
      )}

      {/* ── Quick-log buttons ────────────────────────────────────────────── */}
      <div style={card}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          Quick log today&apos;s meals
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {QUICK_MEALS.map(m => (
            <button
              key={m.name}
              onClick={() => logMeal(m.name, m.amount)}
              disabled={logging}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 11px', borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.65)',
                fontFamily: 'var(--font-mono)', fontSize: 10.5,
                cursor: logging ? 'default' : 'pointer',
                opacity: logging ? 0.6 : 1,
              }}
            >
              <span>{m.emoji}</span>
              <span>{m.name}</span>
              <span style={{ color: '#4ecf9e', marginLeft: 3 }}>R{m.amount}</span>
            </button>
          ))}
        </div>

        {/* Custom entry */}
        {showCustom ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={customDesc}
                onChange={e => setCustomDesc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCustom()}
                placeholder="What did you eat?"
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0 10px', gap: 4 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>R</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={customAmt}
                  onChange={e => setCustomAmt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCustom()}
                  placeholder="0"
                  style={{ width: 54, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowCustom(false)} style={{ flex: 1, padding: '8px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleCustom} disabled={logging} style={{ flex: 2, padding: '8px', borderRadius: 10, border: '1px solid rgba(78,207,158,0.35)', background: 'rgba(78,207,158,0.12)', color: '#4ecf9e', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: logging ? 'default' : 'pointer', opacity: logging ? 0.6 : 1 }}>
                {logging ? 'Logging…' : 'Log meal'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustom(true)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer' }}
          >
            <Plus size={12} /> Custom meal / amount
          </button>
        )}
      </div>

      {/* ── Spending history ─────────────────────────────────────────────── */}
      {sortedDates.length > 0 ? (
        <div style={card}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Recent meals
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sortedDates.map(date => {
              const dayTotal = byDate[date].reduce((s, e) => s + e.amount, 0)
              return (
                <div key={date}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: date === today ? '#7dd3fc' : 'rgba(255,255,255,0.4)' }}>
                      {formatDate(date)}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                      R{dayTotal.toFixed(0)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {byDate[date].map(e => (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>🍽️</span>
                        <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.description}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4ecf9e', flexShrink: 0 }}>
                          R{e.amount.toFixed(0)}
                        </span>
                        <button onClick={() => deleteExpense(e.id)} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: '2px 4px' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ ...card, textAlign: 'center', padding: '28px 20px' }}>
          <Utensils size={28} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 10px' }} />
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>No meals logged this month</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(255,255,255,0.25)' }}>Use the quick buttons above to log your first meal</p>
        </div>
      )}

      {/* ── Budget stretch tip ───────────────────────────────────────────── */}
      <div style={{ background: 'rgba(78,207,158,0.06)', border: '1px solid rgba(78,207,158,0.14)', borderRadius: 12, padding: '12px 14px' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(78,207,158,0.65)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
          💡 Budget stretch tip
        </p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>
          {STRETCH_TIPS[tipIdx]}
        </p>
      </div>

      {/* ── Over budget warning ───────────────────────────────────────────── */}
      {foodBudget > 0 && pct > 85 && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <TrendingDown size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginBottom: 3 }}>
              {pct >= 100 ? 'Food budget exceeded' : 'Food budget almost gone'}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
              {pct >= 100
                ? `You&apos;ve spent R${(totalSpent - foodBudget).toFixed(0)} over your food budget this month.`
                : `${Math.round(100 - pct)}% left — about R${dailyLeft?.toFixed(0) ?? '?'}/day for the next ${daysLeft} days.`}
              {' '}Consider the Recipes or AI Planner tabs to stretch what you have.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
