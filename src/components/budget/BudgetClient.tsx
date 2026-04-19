'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/layout/TopBar'
import { useAppStore } from '@/store'
import {
  type Budget, type Expense,
  EXPENSE_CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS,
} from '@/types'
import { fmt, calcTotalBudget, cn, exportToCSV, currentMonthRange } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import ReceiptScanner from '@/components/budget/ReceiptScanner'

interface BudgetClientProps {
  initialData: {
    budget: Budget | null
    expenses: Expense[]
    profile: { name: string; funding_type: string | null; university: string | null; year_of_study: string | null; is_premium: boolean } | null
    isPremium: boolean
    userId: string
    incomeEntries: IncomeEntry[]
  }
}

type TabId = 'overview' | 'expenses' | 'nsfas' | 'wallet' | 'ai_coach' | 'appeal'

const TABS = [
  { id: 'overview' as TabId, label: 'Overview', icon: '📊' },
  { id: 'expenses' as TabId, label: 'Expenses', icon: '💳' },
  { id: 'wallet' as TabId, label: 'Wallet', icon: '💼' },
  { id: 'nsfas' as TabId, label: 'NSFAS', icon: '🏛️' },
  { id: 'ai_coach' as TabId, label: 'AI Coach', icon: '🤖' },
  { id: 'appeal' as TabId, label: 'Appeal', icon: '📝' },
]

interface IncomeEntry {
  id: string
  source_type: string
  label: string
  amount: number
  received_date: string
  is_recurring: boolean
}

interface SavingsGoal {
  id: string
  name: string
  emoji: string
  color: string
  target_amount: number
  current_amount: number
  deadline: string | null
  is_completed: boolean
}

interface AIInsight {
  healthScore: number
  healthLabel: string
  summary: string
  tips: { icon: string; title: string; detail: string }[]
  projectedEndBalance: number
  biggestSpendCategory: string
  savingOpportunity: string
}

const NSFAS_DATES = [
  { event: 'NSFAS Applications Open', date: '1 February', type: 'info' },
  { event: 'Applications Close', date: '31 March', type: 'warning' },
  { event: 'Appeals Window', date: 'April – May', type: 'info' },
  { event: 'Funding Confirmation', date: 'June – July', type: 'success' },
  { event: 'Allowance Disbursement', date: 'Monthly from Feb', type: 'success' },
]

export default function BudgetClient({ initialData }: BudgetClientProps) {
  const supabase = createClient()
  const { setExpenses } = useAppStore()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [expenses, setLocalExpenses] = useState<Expense[]>(initialData.expenses)
  const [budget] = useState<Budget | null>(initialData.budget)
  const [aiInsights, setAiInsights] = useState<AIInsight | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [budgetData, setBudgetData] = useState<{ categoryTotals: Record<string, number> } | null>(null)

  // Wallet state
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>(initialData.incomeEntries)
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [walletLoaded, setWalletLoaded] = useState(false)
  const [addingGoal, setAddingGoal] = useState(false)
  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalEmoji, setGoalEmoji] = useState('🎯')
  const [goalDeadline, setGoalDeadline] = useState('')
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [addingIncome, setAddingIncome] = useState(false)
  const [incomeLabel, setIncomeLabel] = useState('')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomeType, setIncomeType] = useState('other')
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0])
  const [showIncomeForm, setShowIncomeForm] = useState(false)

  // Add expense form
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('food')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [addingExpense, setAddingExpense] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  // Appeal form
  const [appealSituation, setAppealSituation] = useState('')
  const [appealType, setAppealType] = useState('Financial hardship')
  const [appealLetter, setAppealLetter] = useState('')
  const [appealLoading, setAppealLoading] = useState(false)

  const totalBudget = budget ? calcTotalBudget(budget) : 0
  const totalIncome = incomeEntries.reduce((s, e) => s + e.amount, 0)
  const effectiveTotal = totalBudget + totalIncome
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
  const remaining = effectiveTotal - totalSpent
  const spentPct = effectiveTotal > 0 ? Math.min(100, Math.round((totalSpent / effectiveTotal) * 100)) : 0
  const overBudget = totalSpent > effectiveTotal

  const categoryTotals = budgetData?.categoryTotals || expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  const loadInsights = async () => {
    setInsightsLoading(true)
    try {
      const res = await fetch('/api/budget/insights')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setAiInsights(data.insights)
      setBudgetData(data.budgetData)
    } catch {
      toast.error('Could not load AI insights')
    } finally {
      setInsightsLoading(false)
    }
  }

  useEffect(() => {
    loadWalletData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeTab === 'ai_coach' && !aiInsights) {
      loadInsights()
    }
  }, [activeTab])

  const loadWalletData = async () => {
    const { data: goals } = await supabase
      .from('savings_goals').select('id,name,emoji,color,target_amount,current_amount,deadline,is_completed')
      .eq('user_id', initialData.userId)
      .eq('is_completed', false)
      .order('created_at', { ascending: true })
    setSavingsGoals((goals ?? []) as SavingsGoal[])
    setWalletLoaded(true)
  }

  const addIncome = async () => {
    if (!incomeLabel.trim() || !incomeAmount || parseFloat(incomeAmount) <= 0) {
      toast.error('Enter a label and valid amount')
      return
    }
    setAddingIncome(true)
    try {
      const { data, error } = await supabase.from('income_entries').insert({
        user_id: initialData.userId,
        source_type: incomeType,
        label: incomeLabel.trim(),
        amount: parseFloat(incomeAmount),
        received_date: incomeDate,
        month_year: incomeDate.slice(0, 7),
      }).select('id,source_type,label,amount,received_date,is_recurring').single()
      if (error) throw error
      setIncomeEntries(prev => [data as IncomeEntry, ...prev])
      setIncomeLabel(''); setIncomeAmount(''); setShowIncomeForm(false)
      toast.success('Income recorded!')
    } catch { toast.error('Failed to record income') }
    finally { setAddingIncome(false) }
  }

  const addGoal = async () => {
    if (!goalName.trim() || !goalTarget || parseFloat(goalTarget) <= 0) {
      toast.error('Enter a goal name and target amount')
      return
    }
    setAddingGoal(true)
    try {
      const { data, error } = await supabase.from('savings_goals').insert({
        user_id: initialData.userId,
        name: goalName.trim(),
        emoji: goalEmoji,
        color: '#0d9488',
        target_amount: parseFloat(goalTarget),
        deadline: goalDeadline || null,
      }).select('id,name,emoji,color,target_amount,current_amount,deadline,is_completed').single()
      if (error) throw error
      setSavingsGoals(prev => [...prev, data as SavingsGoal])
      setGoalName(''); setGoalTarget(''); setGoalDeadline(''); setShowGoalForm(false)
      toast.success('Savings goal created!')
    } catch { toast.error('Failed to create goal') }
    finally { setAddingGoal(false) }
  }

  const contributeToGoal = async (goalId: string, current: number, target: number) => {
    const amtStr = window.prompt('How much are you adding? (R)')
    const amt = parseFloat(amtStr || '')
    if (!amt || amt <= 0) return
    const newAmount = Math.min(current + amt, target)
    const { error } = await supabase.from('savings_goals').update({ current_amount: newAmount, is_completed: newAmount >= target, completed_at: newAmount >= target ? new Date().toISOString() : null }).eq('id', goalId)
    if (!error) {
      setSavingsGoals(prev => prev.map(g => g.id === goalId ? { ...g, current_amount: newAmount, is_completed: newAmount >= target } : g).filter(g => !g.is_completed))
      await supabase.from('savings_contributions').insert({ user_id: initialData.userId, goal_id: goalId, amount: amt, contribution_date: new Date().toISOString().split('T')[0] })
      toast.success(newAmount >= target ? 'Goal completed! 🎉' : `+${fmt.currencyShort(amt)} added!`)
    }
  }

  const addExpense = async () => {
    if (!desc.trim() || !amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a description and valid amount')
      return
    }
    setAddingExpense(true)
    try {
      const { data: expense, error } = await supabase
        .from('expenses')
        .insert({
          user_id: initialData.userId,
          description: desc.trim(),
          amount: parseFloat(amount),
          category,
          expense_date: date,
          month_year: date.slice(0, 7),
        })
        .select()
        .single()

      if (error) throw error
      const updated = [expense as Expense, ...expenses]
      setLocalExpenses(updated)
      setExpenses(updated)
      setDesc('')
      setAmount('')
      setShowAddForm(false)
      toast.success('Expense logged!')
      // Fire-and-forget 80% budget alert check
      fetch('/api/budget/alert', { method: 'POST' }).catch(() => null)
    } catch {
      toast.error('Failed to log expense')
    } finally {
      setAddingExpense(false)
    }
  }

  const refreshExpenses = async () => {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', initialData.userId)
      .gte('expense_date', currentMonthRange().start)
      .lte('expense_date', currentMonthRange().end)
      .order('expense_date', { ascending: false })
    if (data) {
      setLocalExpenses(data as Expense[])
      setExpenses(data as Expense[])
    }
  }

  const deleteExpense = async (id: string) => {
    const updated = expenses.filter(e => e.id !== id)
    setLocalExpenses(updated)
    setExpenses(updated)
    await supabase.from('expenses').delete().eq('id', id)
    toast.success('Expense removed')
  }

  const generateAppeal = async () => {
    if (!appealSituation.trim()) {
      toast.error('Please describe your situation')
      return
    }
    setAppealLoading(true)
    try {
      const res = await fetch('/api/budget/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: appealSituation, appealType }),
      })
      const data = await res.json()
      setAppealLetter(data.letter)
    } catch {
      toast.error('Failed to generate letter')
    } finally {
      setAppealLoading(false)
    }
  }

  const healthColour = aiInsights
    ? aiInsights.healthLabel === 'excellent' ? 'text-teal-400'
    : aiInsights.healthLabel === 'good' ? 'text-green-400'
    : aiInsights.healthLabel === 'tight' ? 'text-amber-400'
    : 'text-red-400'
    : 'text-white'

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-24">
      <TopBar title="Budget & NSFAS" />

      {/* Tab bar */}
      <div className="sticky top-[57px] z-20 bg-[var(--bg-base)] border-b border-white/7">
        <div className="flex px-2 overflow-x-auto scrollbar-none max-w-2xl mx-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-3 font-display text-xs font-bold transition-all relative whitespace-nowrap',
                activeTab === tab.id ? 'text-teal-400' : 'text-white/40 hover:text-white/70'
              )}
            >
              <span className="hidden sm:inline">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* ─── Overview Tab ─── */}
        {activeTab === 'overview' && (
          <>
            {/* Big donut-style ring */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-mono text-[0.58rem] text-white/40 uppercase tracking-widest">
                    {new Date().toLocaleString('en-ZA', { month: 'long', year: 'numeric' })}
                  </div>
                  <div className="font-display font-black text-2xl text-white mt-0.5">
                    {fmt.currencyShort(totalSpent)}
                    <span className="text-white/30 font-normal text-base"> of {fmt.currencyShort(effectiveTotal)}</span>
                  </div>
                </div>
                <div className={cn(
                  'font-mono text-[0.65rem] font-bold px-3 py-1.5 rounded-full border',
                  overBudget
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : spentPct > 80
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-teal-600/10 text-teal-400 border-teal-600/20'
                )}>
                  {overBudget ? '⚠️ Over budget' : `${spentPct}% spent`}
                </div>
              </div>

              {/* Progress ring bar */}
              <div className="h-3 bg-white/8 rounded-full overflow-hidden mb-4">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    overBudget ? 'bg-red-500' : spentPct > 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-teal-600 to-teal-400'
                  )}
                  style={{ width: `${Math.min(100, spentPct)}%` }}
                />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Remaining', value: fmt.currencyShort(Math.max(0, remaining)), colour: overBudget ? 'text-red-400' : 'text-teal-400' },
                  { label: 'Spent', value: fmt.currencyShort(totalSpent), colour: 'text-white' },
                  { label: 'Budget', value: fmt.currencyShort(totalBudget), colour: 'text-white/60' },
                  { label: 'Income', value: fmt.currencyShort(totalIncome), colour: 'text-teal-400' },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <div className={cn('font-display font-black text-lg', stat.colour)}>{stat.value}</div>
                    <div className="font-mono text-[0.55rem] text-white/30 uppercase">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category breakdown */}
            {Object.keys(categoryTotals).length > 0 && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5">
                <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest mb-4">
                  Spending by category
                </div>
                <div className="space-y-3">
                  {Object.entries(categoryTotals)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, amount]) => {
                      const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0
                      const colour = CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] || '#6b7280'
                      const icon = CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS] || '💳'
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{icon}</span>
                              <span className="font-display text-sm text-white">{cat}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[0.62rem] text-white/40">{pct}%</span>
                              <span className="font-display font-bold text-sm text-white">{fmt.currencyShort(amount)}</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: colour }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* AI Coach CTA */}
            <button
              onClick={() => setActiveTab('ai_coach')}
              className="w-full bg-gradient-to-r from-teal-900/30 to-purple-900/20 border border-teal-600/20 hover:border-teal-600/40 rounded-2xl p-4 flex items-center gap-4 transition-all text-left"
            >
              <div className="w-10 h-10 bg-teal-600/15 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🤖</div>
              <div>
                <div className="font-display font-bold text-teal-400 text-sm">Get AI Budget Analysis</div>
                <div className="font-mono text-[0.6rem] text-white/30">Personalised financial health score + tips →</div>
              </div>
            </button>
          </>
        )}

        {/* ─── Expenses Tab ─── */}
        {activeTab === 'expenses' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display font-bold text-white text-base">{expenses.length} expenses</div>
                <div className="font-mono text-[0.6rem] text-white/30">{fmt.currencyShort(totalSpent)} total this month</div>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => exportToCSV(expenses.map(e => ({ Date: e.expense_date, Description: e.description, Category: e.category, Amount: e.amount })), 'expenses.csv')}
                  className="font-mono text-[0.6rem] bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white px-3 py-1.5 rounded-lg transition-all"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white px-4 py-1.5 rounded-xl transition-all"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Add expense form */}
            {showAddForm && (
              <div className="bg-[var(--bg-surface)] border border-teal-600/20 rounded-2xl p-4 space-y-3 animate-fade-up">
                <div className="font-mono text-[0.6rem] text-teal-400 uppercase tracking-widest">Log expense</div>
                <input
                  className="w-full bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
                  placeholder="What did you spend on?"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    className="bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
                    placeholder="Amount (R)"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                  <input
                    type="date"
                    className="bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={cn(
                        'px-2.5 py-1 rounded-full font-mono text-[0.58rem] border transition-all',
                        category === cat
                          ? 'bg-teal-600/20 border-teal-500/50 text-teal-400'
                          : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                      )}
                    >
                      {CATEGORY_ICONS[cat]} {cat}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 font-display text-sm border border-white/15 text-white/50 hover:text-white py-2.5 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addExpense}
                    disabled={addingExpense}
                    className="flex-1 font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-xl transition-all disabled:opacity-50"
                  >
                    {addingExpense ? 'Saving…' : 'Log Expense'}
                  </button>
                </div>
              </div>
            )}

            {/* Receipt scanner */}
            {!showAddForm && (
              <ReceiptScanner
                userId={initialData.userId}
                supabase={supabase}
                onExpenseAdded={refreshExpenses}
              />
            )}

            {/* Expense list */}
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-3">💳</div>
                <p className="font-display font-bold text-white text-sm">No expenses logged yet</p>
                <p className="font-mono text-[0.6rem] text-white/30 mt-1">Add your first expense to start tracking.</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 font-mono text-[0.65rem] text-teal-400 border border-teal-600/25 bg-teal-600/10 hover:bg-teal-600/20 px-4 py-2 rounded-xl transition-all"
                >
                  + Log your first expense →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.map(exp => (
                  <div
                    key={exp.id}
                    className="group flex items-center gap-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-white/15 rounded-xl px-4 py-3 transition-all"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: (CATEGORY_COLORS[exp.category] || '#6b7280') + '20' }}
                    >
                      {CATEGORY_ICONS[exp.category] || '💳'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-body text-sm text-white truncate">{exp.description}</div>
                      <div className="font-mono text-[0.58rem] text-white/30">{exp.category} · {fmt.dateShort(exp.expense_date)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-display font-bold text-sm" style={{ color: CATEGORY_COLORS[exp.category] || '#f97316' }}>
                        -{fmt.currencyShort(exp.amount)}
                      </div>
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Wallet Tab ─── */}
        {activeTab === 'wallet' && (
          <>
            {/* Income this month */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display font-bold text-white text-base">Income this month</div>
                <div className="font-mono text-[0.6rem] text-white/30">
                  {fmt.currencyShort(incomeEntries.reduce((s, e) => s + e.amount, 0))} received
                </div>
              </div>
              <button
                onClick={() => setShowIncomeForm(!showIncomeForm)}
                className="font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white px-4 py-1.5 rounded-xl transition-all"
              >
                + Log income
              </button>
            </div>

            {showIncomeForm && (
              <div className="bg-[var(--bg-surface)] border border-teal-600/20 rounded-2xl p-4 space-y-3 animate-fade-up">
                <div className="font-mono text-[0.6rem] text-teal-400 uppercase tracking-widest">Record income</div>
                <input
                  className="w-full bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
                  placeholder="e.g. NSFAS deposit, Part-time pay"
                  value={incomeLabel}
                  onChange={e => setIncomeLabel(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    className="bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
                    placeholder="Amount (R)"
                    value={incomeAmount}
                    onChange={e => setIncomeAmount(e.target.value)}
                  />
                  <input
                    type="date"
                    className="bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all"
                    value={incomeDate}
                    onChange={e => setIncomeDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[['nsfas','🏛️ NSFAS'],['bursary','📜 Bursary'],['part_time','💼 Work'],['pocket_money','💵 Pocket money'],['family','👨‍👩‍👧 Family'],['scholarship','🎓 Scholarship'],['other','💳 Other']].map(([val, label]) => (
                    <button key={val} onClick={() => setIncomeType(val)}
                      className={cn('px-2.5 py-1 rounded-full font-mono text-[0.58rem] border transition-all',
                        incomeType === val ? 'bg-teal-600/20 border-teal-500/50 text-teal-400' : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                      )}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowIncomeForm(false)} className="flex-1 font-display text-sm border border-white/15 text-white/50 hover:text-white py-2.5 rounded-xl transition-all">Cancel</button>
                  <button onClick={addIncome} disabled={addingIncome} className="flex-1 font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-xl transition-all disabled:opacity-50">
                    {addingIncome ? 'Saving…' : 'Record'}
                  </button>
                </div>
              </div>
            )}

            {incomeEntries.length === 0 && !showIncomeForm ? (
              <div className="text-center py-8 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl">
                <div className="text-3xl mb-2">💵</div>
                <p className="font-display font-bold text-white text-sm">No income logged this month</p>
                <p className="font-mono text-[0.6rem] text-white/30 mt-1">Track NSFAS, bursary, shifts, and more.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {incomeEntries.map(entry => {
                  const icons: Record<string, string> = { nsfas:'🏛️', bursary:'📜', part_time:'💼', pocket_money:'💵', family:'👨‍👩‍👧', scholarship:'🎓', gift:'🎁', side_hustle:'⚡', other:'💳' }
                  return (
                    <div key={entry.id} className="flex items-center gap-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-3">
                      <div className="w-9 h-9 bg-teal-600/15 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                        {icons[entry.source_type] || '💳'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-body text-sm text-white truncate">{entry.label}</div>
                        <div className="font-mono text-[0.58rem] text-white/30">{entry.source_type.replace('_', ' ')} · {fmt.dateShort(entry.received_date)}</div>
                      </div>
                      <div className="font-display font-bold text-sm text-teal-400">+{fmt.currencyShort(entry.amount)}</div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Savings Goals */}
            <div className="flex items-center justify-between mt-2">
              <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest">Savings goals</div>
              <button
                onClick={() => setShowGoalForm(!showGoalForm)}
                className="font-mono text-[0.6rem] text-teal-500 hover:text-teal-400 transition-colors"
              >
                + New goal
              </button>
            </div>

            {showGoalForm && (
              <div className="bg-[var(--bg-surface)] border border-teal-600/20 rounded-2xl p-4 space-y-3 animate-fade-up">
                <div className="font-mono text-[0.6rem] text-teal-400 uppercase tracking-widest">Create savings goal</div>
                <div className="flex gap-2">
                  <input
                    className="w-12 bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-2 py-2.5 text-lg text-center outline-none transition-all"
                    value={goalEmoji}
                    onChange={e => setGoalEmoji(e.target.value)}
                    maxLength={2}
                  />
                  <input
                    className="flex-1 bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
                    placeholder="Goal name (e.g. New laptop)"
                    value={goalName}
                    onChange={e => setGoalName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    className="bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
                    placeholder="Target amount (R)"
                    value={goalTarget}
                    onChange={e => setGoalTarget(e.target.value)}
                  />
                  <input
                    type="date"
                    className="bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all"
                    value={goalDeadline}
                    onChange={e => setGoalDeadline(e.target.value)}
                    placeholder="Deadline (optional)"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowGoalForm(false)} className="flex-1 font-display text-sm border border-white/15 text-white/50 hover:text-white py-2.5 rounded-xl transition-all">Cancel</button>
                  <button onClick={addGoal} disabled={addingGoal} className="flex-1 font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-xl transition-all disabled:opacity-50">
                    {addingGoal ? 'Saving…' : 'Create Goal'}
                  </button>
                </div>
              </div>
            )}

            {savingsGoals.length === 0 && !showGoalForm ? (
              <div className="text-center py-8 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl">
                <div className="text-3xl mb-2">🎯</div>
                <p className="font-display font-bold text-white text-sm">No savings goals yet</p>
                <p className="font-mono text-[0.6rem] text-white/30 mt-1">Set a target and track progress toward it.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savingsGoals.map(goal => {
                  const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0
                  return (
                    <div key={goal.id} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{goal.emoji}</span>
                          <div>
                            <div className="font-display font-bold text-white text-sm">{goal.name}</div>
                            {goal.deadline && (
                              <div className="font-mono text-[0.55rem] text-white/30">By {fmt.dateShort(goal.deadline)}</div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => contributeToGoal(goal.id, goal.current_amount, goal.target_amount)}
                          className="font-mono text-[0.6rem] bg-teal-600/15 hover:bg-teal-600/30 text-teal-400 px-3 py-1 rounded-lg transition-all border border-teal-600/20"
                        >
                          + Add
                        </button>
                      </div>
                      <div className="h-2 bg-white/8 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-teal-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-[0.58rem] text-teal-400">{fmt.currencyShort(goal.current_amount)}</div>
                        <div className="font-mono text-[0.58rem] text-white/30">{pct}% of {fmt.currencyShort(goal.target_amount)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ─── NSFAS Tab ─── */}
        {activeTab === 'nsfas' && (
          <>
            {budget?.nsfas_enabled ? (
              <>
                <div className="bg-gradient-to-br from-teal-900/30 to-teal-950/20 border border-teal-600/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🏛️</span>
                    <div className="font-display font-bold text-white">NSFAS Allowances</div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Monthly Living', amount: budget.nsfas_living, icon: '🏠' },
                      { label: 'Accommodation', amount: budget.nsfas_accom, icon: '🏢' },
                      { label: 'Books & Stationery', amount: budget.nsfas_books, icon: '📚' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{item.icon}</span>
                          <span className="font-body text-sm text-white/80">{item.label}</span>
                        </div>
                        <span className="font-display font-bold text-teal-400">{fmt.currency(item.amount)}</span>
                      </div>
                    ))}
                    <div className="border-t border-teal-600/20 pt-3 flex items-center justify-between">
                      <span className="font-display font-bold text-white">Total NSFAS</span>
                      <span className="font-display font-black text-teal-400 text-lg">
                        {fmt.currency(budget.nsfas_living + budget.nsfas_accom + budget.nsfas_books)}
                      </span>
                    </div>
                  </div>
                </div>

                <a
                  href="https://my.nsfas.org.za"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between bg-[var(--bg-surface)] border border-white/10 hover:border-teal-600/30 rounded-2xl p-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-600/15 rounded-xl flex items-center justify-center text-lg">🔗</div>
                    <div>
                      <div className="font-display font-bold text-white text-sm">myNSFAS Portal</div>
                      <div className="font-mono text-[0.58rem] text-white/30">Check your status & allowances</div>
                    </div>
                  </div>
                  <span className="text-white/30 text-sm">→</span>
                </a>
              </>
            ) : (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 text-center">
                <div className="text-3xl mb-3">🏛️</div>
                <div className="font-display font-bold text-white text-sm mb-2">Not on NSFAS</div>
                <div className="font-mono text-[0.6rem] text-white/30 mb-4">
                  Your funding type is set to {initialData.profile?.funding_type || 'other'}.
                  Update your profile if this is incorrect.
                </div>
                <Link href="/setup" className="font-mono text-[0.6rem] text-teal-500 underline">
                  Update funding type →
                </Link>
              </div>
            )}

            {/* Important dates */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5">
              <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest mb-4">
                Important NSFAS Dates
              </div>
              <div className="space-y-3">
                {NSFAS_DATES.map(item => (
                  <div key={item.event} className="flex items-start gap-3">
                    <div className={cn(
                      'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                      item.type === 'success' ? 'bg-teal-500' : item.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                    )} />
                    <div>
                      <div className="font-body text-sm text-white">{item.event}</div>
                      <div className="font-mono text-[0.58rem] text-white/40">{item.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Appeal CTA */}
            <button
              onClick={() => setActiveTab('appeal')}
              className="w-full flex items-center gap-4 bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-4 transition-all text-left"
            >
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-xl">📝</div>
              <div>
                <div className="font-display font-bold text-amber-400 text-sm">Need to appeal? AI can help</div>
                <div className="font-mono text-[0.6rem] text-white/30">Generate a professional NSFAS appeal letter →</div>
              </div>
            </button>
          </>
        )}

        {/* ─── AI Coach Tab ─── */}
        {activeTab === 'ai_coach' && (
          <>
            {insightsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton h-24 rounded-2xl" />
                ))}
              </div>
            ) : aiInsights ? (
              <>
                {/* Health score */}
                <div className="bg-gradient-to-br from-teal-900/20 to-purple-900/10 border border-teal-600/20 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-mono text-[0.58rem] text-white/40 uppercase tracking-widest">Financial Health Score</div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <div className={cn('font-display font-black text-5xl', healthColour)}>
                          {aiInsights.healthScore}
                        </div>
                        <div className="font-mono text-[0.6rem] text-white/40">/10</div>
                      </div>
                      <div className={cn('font-mono text-[0.65rem] uppercase tracking-widest mt-1', healthColour)}>
                        {aiInsights.healthLabel}
                      </div>
                    </div>
                    <div className="w-20 h-20 relative flex-shrink-0">
                      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                        <circle
                          cx="40" cy="40" r="32"
                          fill="none"
                          stroke={aiInsights.healthLabel === 'critical' ? '#ef4444' : aiInsights.healthLabel === 'tight' ? '#f59e0b' : '#0d9488'}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${(aiInsights.healthScore / 10) * 201} 201`}
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="font-body text-sm text-white/70 leading-relaxed">{aiInsights.summary}</p>
                </div>

                {/* Tips */}
                <div className="space-y-3">
                  {aiInsights.tips.map((tip, i) => (
                    <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 flex gap-4">
                      <div className="text-2xl flex-shrink-0">{tip.icon}</div>
                      <div>
                        <div className="font-display font-bold text-white text-sm mb-1">{tip.title}</div>
                        <div className="font-body text-sm text-white/60 leading-relaxed">{tip.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Saving opportunity */}
                <div className="bg-green-500/8 border border-green-500/20 rounded-2xl p-4">
                  <div className="font-mono text-[0.6rem] text-green-400 uppercase tracking-widest mb-2">💡 Saving opportunity</div>
                  <p className="font-body text-sm text-white/80">{aiInsights.savingOpportunity}</p>
                </div>

                {/* Projection */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 text-center">
                    <div className="font-mono text-[0.55rem] text-white/30 uppercase mb-1">Projected end balance</div>
                    <div className={cn(
                      'font-display font-black text-xl',
                      aiInsights.projectedEndBalance < 0 ? 'text-red-400' : 'text-teal-400'
                    )}>
                      {fmt.currencyShort(aiInsights.projectedEndBalance)}
                    </div>
                  </div>
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 text-center">
                    <div className="font-mono text-[0.55rem] text-white/30 uppercase mb-1">Biggest spend</div>
                    <div className="font-display font-black text-xl text-white">
                      {aiInsights.biggestSpendCategory}
                    </div>
                  </div>
                </div>

                <button
                  onClick={loadInsights}
                  className="w-full font-mono text-[0.62rem] text-white/40 hover:text-white/60 border border-white/8 hover:border-white/15 py-2.5 rounded-xl transition-all"
                >
                  ↻ Refresh analysis
                </button>
              </>
            ) : (
              <button
                onClick={loadInsights}
                className="w-full bg-teal-600/10 border border-teal-600/20 hover:border-teal-600/40 rounded-2xl p-8 text-center transition-all"
              >
                <div className="text-4xl mb-3">🤖</div>
                <div className="font-display font-bold text-white text-base mb-1">Analyse my finances</div>
                <div className="font-mono text-[0.62rem] text-white/40">Get your AI financial health score</div>
              </button>
            )}
          </>
        )}

        {/* ─── Appeal Tab ─── */}
        {activeTab === 'appeal' && (
          <>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5">
              <div className="font-display font-bold text-white mb-1">NSFAS Appeal Letter Generator</div>
              <p className="font-mono text-[0.62rem] text-white/40 mb-5">
                Describe your situation and Claude will draft a professional appeal letter. Always review before submitting.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest mb-2">Appeal type</div>
                  <div className="flex flex-wrap gap-2">
                    {['Financial hardship', 'Academic exclusion', 'Allowance dispute', 'Funding cancellation', 'Other'].map(type => (
                      <button
                        key={type}
                        onClick={() => setAppealType(type)}
                        className={cn(
                          'px-3 py-1.5 rounded-full font-mono text-[0.6rem] border transition-all',
                          appealType === type
                            ? 'bg-teal-600/20 border-teal-500/50 text-teal-400'
                            : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest mb-2">Your situation</div>
                  <textarea
                    value={appealSituation}
                    onChange={e => setAppealSituation(e.target.value)}
                    placeholder="Describe what happened and why you need to appeal. Be specific — include dates, amounts, and any supporting circumstances."
                    className="w-full bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-all resize-none font-body"
                    rows={5}
                  />
                </div>

                <button
                  onClick={generateAppeal}
                  disabled={appealLoading || !appealSituation.trim()}
                  className="w-full font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white py-3 rounded-xl transition-all"
                >
                  {appealLoading ? '✍️ Drafting letter…' : '✍️ Generate Appeal Letter'}
                </button>
              </div>
            </div>

            {appealLetter && (
              <div className="bg-[var(--bg-surface)] border border-teal-600/20 rounded-2xl p-5 animate-fade-up">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-mono text-[0.6rem] text-teal-400 uppercase tracking-widest">Draft Letter</div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(appealLetter)
                      toast.success('Copied to clipboard!')
                    }}
                    className="font-mono text-[0.6rem] bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white px-3 py-1 rounded-lg transition-all"
                  >
                    Copy
                  </button>
                </div>
                <pre className="font-body text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                  {appealLetter}
                </pre>
                <p className="font-mono text-[0.56rem] text-white/25 mt-4 pt-4 border-t border-white/7">
                  ⚠️ Review this letter carefully before submitting. Add your student number, dates, and any supporting documents. This is a draft — you are responsible for its content.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
