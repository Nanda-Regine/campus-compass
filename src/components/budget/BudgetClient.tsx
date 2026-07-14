'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { dispatchXP } from '@/lib/xp-engine'
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
import { signals } from '@/store/signals'
import ReceiptScanner from '@/components/budget/ReceiptScanner'
import { AmbientImage } from '@/components/ui/AmbientImage'
import NsfasTrackerOS from '@/components/nsfas/NsfasTrackerOS'
import CreditScoreEducation from '@/components/finance/CreditScoreEducation'
import FinancialLiteracy101 from '@/components/finance/FinancialLiteracy101'
import MoneyHealthCalculator from '@/components/finance/MoneyHealthCalculator'
import FirstInvestment from '@/components/finance/FirstInvestment'
import TabErrorBoundary from '@/components/ui/TabErrorBoundary'
import dynamic from 'next/dynamic'

const StokvelCircle = dynamic(() => import('@/components/budget/StokvelCircle'), { ssr: false })
const FeeBlockTracker = dynamic(() => import('@/components/budget/FeeBlockTracker'), { ssr: false })
const DataBudgetTracker = dynamic(() => import('@/components/budget/DataBudgetTracker'), { ssr: false })

const supabase = createClient()

interface WorkedShift {
  id: string
  shift_date: string
  start_time: string
  end_time: string
  earnings: number | null
  duration_hours: number
  // Supabase join returns array; access [0] to get the job record
  job?: Array<{ id: string; employer_name: string | null; role_title: string | null }> | null
}

interface BudgetClientProps {
  initialTab?: string
  initialData: {
    budget: Budget | null
    expenses: Expense[]
    profile: { name: string; funding_type: string | null; university: string | null; year_of_study: string | null; is_premium: boolean; institution_type: string | null; student_status: string | null } | null
    isPremium: boolean
    userId: string
    incomeEntries: IncomeEntry[]
    workedShifts: WorkedShift[]
  }
}

type TabId = 'overview' | 'expenses' | 'nsfas' | 'wallet' | 'fees' | 'data' | 'ai_coach' | 'appeal' | 'credit' | 'literacy' | 'stokvel'

const TABS = [
  { id: 'overview' as TabId,  label: 'Overview',  icon: '📊' },
  { id: 'expenses' as TabId,  label: 'Expenses',  icon: '💳' },
  { id: 'wallet' as TabId,    label: 'Wallet',    icon: '💼' },
  { id: 'fees' as TabId,      label: 'Fees',      icon: '🎓' },
  { id: 'nsfas' as TabId,     label: 'NSFAS',     icon: '🏛️' },
  { id: 'data' as TabId,      label: 'Data',      icon: '📶' },
  { id: 'ai_coach' as TabId,  label: 'AI Coach',  icon: '🤖' },
  { id: 'appeal' as TabId,    label: 'Appeal',    icon: '📝' },
  { id: 'credit' as TabId,    label: 'Credit',    icon: '📈' },
  { id: 'literacy' as TabId,  label: 'Money 101', icon: '📚' },
  { id: 'stokvel' as TabId,   label: 'Stokvel',   icon: '🫱🏾‍🫲🏽' },
]

interface IncomeEntry {
  id: string
  source_type: string
  label: string
  amount: number
  received_date: string
  is_recurring: boolean
  nsfas_disbursement_id?: string | null
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


export default function BudgetClient({ initialData, initialTab }: BudgetClientProps) {
  const router = useRouter()
  const { setExpenses } = useAppStore()
  const VALID_BUDGET_TABS: TabId[] = ['overview','expenses','nsfas','wallet','fees','data','ai_coach','appeal','credit','literacy','stokvel']
  const [activeTab, setActiveTab] = useState<TabId>(
    initialTab && VALID_BUDGET_TABS.includes(initialTab as TabId) ? initialTab as TabId : 'overview'
  )
  const [expenses, setLocalExpenses] = useState<Expense[]>(initialData.expenses)
  const [budget] = useState<Budget | null>(initialData.budget)
  const [aiInsights, setAiInsights] = useState<AIInsight | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [budgetData, setBudgetData] = useState<{ categoryTotals: Record<string, number> } | null>(null)

  // Wallet state
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>(initialData.incomeEntries)
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [contributingGoalId, setContributingGoalId] = useState<string | null>(null)
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

  const totalBudget    = budget ? calcTotalBudget(budget) : 0
  const manualIncome   = incomeEntries.reduce((s, e) => s + e.amount, 0)
  const shiftEarnings  = initialData.workedShifts.reduce((s, sh) => s + (sh.earnings ?? 0), 0)
  const totalIncome    = manualIncome + shiftEarnings
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
    } catch (err) {
      console.error('[BudgetClient] loadInsights:', err)
      toast.error('Could not load AI insights')
    } finally {
      setInsightsLoading(false)
    }
  }

  useEffect(() => {
    loadWalletData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // File Handling API — when a PDF is opened from the Files app, route to Nova for analysis
  useEffect(() => {
    if (!('launchQueue' in window)) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).launchQueue.setConsumer(async (launchParams: { files: FileSystemFileHandle[] }) => {
      if (!launchParams.files.length) return
      const fileHandle = launchParams.files[0]
      const file = await fileHandle.getFile()
      if (file.type === 'application/pdf') {
        toast('Bank statement detected — opening Nova to analyse it', { icon: '📄' })
        const prompt = `I just opened my bank statement (${file.name}). Can you help me understand my spending and give me a budget health check based on the filename and context?`
        router.push(`/nova?prompt=${encodeURIComponent(prompt)}`)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeTab === 'ai_coach' && !aiInsights) {
      loadInsights()
    }
  }, [activeTab])

  const loadWalletData = async () => {
    const [{ data: goals }, { data: income }] = await Promise.all([
      supabase
        .from('savings_goals')
        .select('id,name,emoji,color,target_amount,current_amount,deadline,is_completed')
        .eq('user_id', initialData.userId)
        .eq('is_completed', false)
        .order('created_at', { ascending: true }),
      supabase
        .from('income_entries')
        .select('id,source_type,label,amount,received_date,is_recurring,nsfas_disbursement_id')
        .eq('user_id', initialData.userId)
        .order('received_date', { ascending: false })
        .limit(100),
    ])
    setSavingsGoals((goals ?? []) as SavingsGoal[])
    if (income) setIncomeEntries(income as IncomeEntry[])
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
      }).select('id,source_type,label,amount,received_date,is_recurring,nsfas_disbursement_id').single()
      if (error) throw error
      setIncomeEntries(prev => [data as IncomeEntry, ...prev])
      setIncomeLabel(''); setIncomeAmount(''); setShowIncomeForm(false)
      dispatchXP('income_logged')
      toast.success('Income recorded!')
    } catch (err) { console.error('[BudgetClient] addIncome:', err); toast.error('Failed to record income') }
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
    } catch (err) { console.error('[BudgetClient] addGoal:', err); toast.error('Failed to create goal') }
    finally { setAddingGoal(false) }
  }

  const contributeToGoal = async (goalId: string, current: number, target: number) => {
    if (contributingGoalId) return // in-flight lock — a double-tap can't create two contribution rows
    const amtStr = window.prompt('How much are you adding? (R)')
    const amt = parseFloat(amtStr || '')
    if (!amt || amt <= 0) return
    // Store the CAPPED delta so the contributions ledger can never sum past the
    // goal (the goal balance was already capped, but the raw amount was logged).
    const delta = Math.min(amt, Math.max(0, target - current))
    if (delta <= 0) { toast('Goal already reached 🎉'); return }
    const newAmount = current + delta
    setContributingGoalId(goalId)
    try {
      const { error: goalErr } = await supabase.from('savings_goals')
        .update({ current_amount: newAmount, is_completed: newAmount >= target, completed_at: newAmount >= target ? new Date().toISOString() : null })
        .eq('id', goalId)
      if (goalErr) throw goalErr
      const { error: contribErr } = await supabase.from('savings_contributions')
        .insert({ user_id: initialData.userId, goal_id: goalId, amount: delta, contribution_date: new Date().toISOString().split('T')[0] })
      if (contribErr) throw contribErr
      // Update local state only after both writes succeed, so a failure never
      // shows a contribution that wasn't recorded.
      setSavingsGoals(prev => prev.map(g => g.id === goalId ? { ...g, current_amount: newAmount, is_completed: newAmount >= target } : g).filter(g => !g.is_completed))
      if (newAmount >= target) dispatchXP('savings_goal_hit')
      toast.success(newAmount >= target ? 'Goal completed! 🎉' : `+${fmt.currencyShort(delta)} added!`)
    } catch {
      toast.error('Could not add your contribution — please try again.')
    } finally {
      setContributingGoalId(null)
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
      dispatchXP('budget_entry')
      toast.success('Expense logged!')
      // Emit signals for orchestration layer
      const newTotalSpent = updated.reduce((s, e) => s + e.amount, 0)
      const budgetTotal = totalBudget + totalIncome
      const remaining = Math.max(0, budgetTotal - newTotalSpent)
      signals.emit({ type: 'expense_logged', payload: { amount: parseFloat(amount), category, remainingBudget: remaining } })
      if (budgetTotal > 0 && newTotalSpent / budgetTotal >= 0.8) {
        signals.emit({ type: 'budget_threshold', payload: { percentage: Math.round(newTotalSpent / budgetTotal * 100), remainingRands: remaining } })
      }
      // Fire-and-forget 80% budget alert check
      fetch('/api/budget/alert', { method: 'POST' }).catch(() => null)
    } catch (err) {
      console.error('[BudgetClient] logExpense:', err)
      toast.error('Failed to log expense')
    } finally {
      setAddingExpense(false)
    }
  }

  const refreshExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', initialData.userId)
      .gte('expense_date', currentMonthRange().start)
      .lte('expense_date', currentMonthRange().end)
      .order('expense_date', { ascending: false })
    if (error) {
      console.error('[BudgetClient] refreshExpenses:', error)
      return
    }
    if (data) {
      setLocalExpenses(data as Expense[])
      setExpenses(data as Expense[])
    }
  }

  const deleteExpense = async (id: string) => {
    const previous = [...expenses]
    const updated = expenses.filter(e => e.id !== id)
    setLocalExpenses(updated)
    setExpenses(updated)
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      toast.success('Expense removed')
    } catch (err) {
      console.error('[BudgetClient] deleteExpense:', err)
      setLocalExpenses(previous)
      setExpenses(previous)
      toast.error('Could not remove expense — please try again')
    }
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
    } catch (err) {
      console.error('[BudgetClient] generateAppeal:', err)
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
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-base)', position: 'relative', overflowX: 'hidden' }}>
      {/* Kente gold fire — subtle texture for the finance domain */}
      <AmbientImage zone="budget" opacity={0.48} blurPx={6} saturation={1.5} overlayColor="rgba(5,4,12,0.58)" />
      <TopBar title="Budget & NSFAS" />

      {/* ── Main: vertical tab rail + content ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>

        {/* Vertical tab rail */}
        <div style={{
          width: 60, flexShrink: 0,
          position: 'sticky', top: 73,
          height: 'calc(100vh - 73px)',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          borderRight: '0.5px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.15)',
        }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%', minHeight: 62,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                  background: active ? 'rgba(78,207,158,0.1)' : 'transparent',
                  borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                  borderLeft: `2px solid ${active ? '#4ecf9e' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  padding: '4px 2px',
                }}
              >
                <span style={{ fontSize: '1.2rem', lineHeight: 1, opacity: active ? 1 : 0.82 }}>{tab.icon}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.56rem',
                  color: active ? '#4ecf9e' : 'rgba(255,255,255,0.75)',
                  letterSpacing: '0.04em',
                  lineHeight: 1,
                  maxWidth: 54,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  textAlign: 'center',
                }}>
                  {tab.label.toUpperCase()}
                </span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <TabErrorBoundary key={activeTab} label={activeTab}>

        {/* ─── Overview Tab ─── */}
        {activeTab === 'overview' && (
          <>
            {/* Budget Overview — SVG donut ring */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5">
              {/* Month + health status */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="font-mono text-[0.64rem] text-white/80 uppercase tracking-widest">
                    {new Date().toLocaleString('en-ZA', { month: 'long', year: 'numeric' })}
                  </div>
                  <div className="font-display font-bold text-white text-sm mt-0.5">Budget overview</div>
                </div>
                <div className={cn(
                  'font-mono text-[0.6rem] font-bold px-3 py-1.5 rounded-full border',
                  overBudget
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : spentPct > 80
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-teal-600/10 text-teal-400 border-teal-600/20'
                )}>
                  {overBudget ? '⚠ Over budget' : spentPct > 80 ? '⚡ Almost out' : '✓ On track'}
                </div>
              </div>

              {/* Donut + stats */}
              <div className="flex items-center gap-5">
                {/* SVG donut */}
                <div className="relative flex-shrink-0">
                  <svg width="108" height="108" viewBox="0 0 108 108" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="54" cy="54" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="11" />
                    <circle
                      cx="54" cy="54" r="42" fill="none"
                      stroke={overBudget ? '#ef4444' : spentPct > 80 ? '#f59e0b' : '#0d9488'}
                      strokeWidth="11" strokeLinecap="round"
                      strokeDasharray={`${(Math.min(100, spentPct) / 100) * 263.9} 263.9`}
                      style={{
                        transition: 'stroke-dasharray 0.9s cubic-bezier(0.34,1.56,0.64,1)',
                        filter: `drop-shadow(0 0 8px ${overBudget ? 'rgba(239,68,68,0.4)' : spentPct > 80 ? 'rgba(245,158,11,0.35)' : 'rgba(13,148,136,0.4)'})`,
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={cn(
                      'font-display font-black text-xl leading-none',
                      overBudget ? 'text-red-400' : spentPct > 80 ? 'text-amber-400' : 'text-teal-400'
                    )}>
                      {spentPct}%
                    </div>
                    <div className="font-mono text-[0.56rem] text-white/75 uppercase tracking-widest mt-0.5">spent</div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-3">
                  {[
                    { label: 'Remaining', value: fmt.currencyShort(Math.max(0, remaining)), colour: overBudget ? 'text-red-400' : 'text-teal-400' },
                    { label: 'Spent',  value: fmt.currencyShort(totalSpent),    colour: 'text-white' },
                    { label: 'Budget',  value: fmt.currencyShort(totalBudget),   colour: 'text-white/78' },
                    { label: 'Income',  value: fmt.currencyShort(totalIncome),   colour: 'text-teal-400' },
                  ].map(stat => (
                    <div key={stat.label}>
                      <div className={cn('font-display font-black text-base leading-none', stat.colour)}>{stat.value}</div>
                      <div className="font-mono text-[0.58rem] text-white/75 uppercase tracking-wide mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category breakdown */}
            {Object.keys(categoryTotals).length > 0 && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5">
                <div className="font-mono text-[0.6rem] text-white/82 uppercase tracking-widest mb-4">
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
                              <span className="font-mono text-[0.62rem] text-white/82">{pct}%</span>
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
                <div className="font-mono text-[0.6rem] text-white/78">Personalised financial health score + tips →</div>
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
                <div className="font-mono text-[0.6rem] text-white/78">{fmt.currencyShort(totalSpent)} total this month</div>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => exportToCSV(expenses.map(e => ({ Date: e.expense_date, Description: e.description, Category: e.category, Amount: e.amount })), 'expenses.csv')}
                  className="font-mono text-[0.6rem] bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white px-3 py-1.5 rounded-lg transition-all"
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
                  className="w-full bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/75 outline-none transition-all"
                  placeholder="What did you spend on?"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    inputMode="decimal"
                    aria-label="Expense amount in rands"
                    className="bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/75 outline-none transition-all"
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
                        'px-2.5 py-1 rounded-full font-mono text-[0.65rem] border transition-all',
                        category === cat
                          ? 'bg-teal-600/20 border-teal-500/50 text-teal-400'
                          : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                      )}
                    >
                      {CATEGORY_ICONS[cat]} {cat}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 font-display text-sm border border-white/15 text-white/70 hover:text-white py-2.5 rounded-xl transition-all"
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
                <p className="font-mono text-[0.6rem] text-white/78 mt-1">Add your first expense to start tracking.</p>
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
                      <div className="font-mono text-[0.65rem] text-white/78">{exp.category} · {fmt.dateShort(exp.expense_date)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-display font-bold text-sm" style={{ color: CATEGORY_COLORS[exp.category] || '#f97316' }}>
                        -{fmt.currencyShort(exp.amount)}
                      </div>
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="opacity-0 group-hover:opacity-100 text-white/72 hover:text-red-400 transition-all text-xs"
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
                <div className="font-mono text-[0.6rem] text-white/78">
                  {fmt.currencyShort(totalIncome)} total
                  {shiftEarnings > 0 && (
                    <span className="text-teal-400/70"> · {fmt.currencyShort(shiftEarnings)} from shifts</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowIncomeForm(!showIncomeForm)}
                className="font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white px-4 py-1.5 rounded-xl transition-all"
              >
                + Log income
              </button>
            </div>

            {/* ── Auto-synced shift earnings ── */}
            {initialData.workedShifts.length > 0 && (() => {
              // Group by employer
              const byJob: Record<string, { name: string; shifts: number; earned: number }> = {}
              for (const sh of initialData.workedShifts) {
                const j    = Array.isArray(sh.job) ? sh.job[0] : sh.job
                const key  = j?.id ?? 'unknown'
                const name = j?.employer_name ?? j?.role_title ?? 'Side hustle'
                if (!byJob[key]) byJob[key] = { name, shifts: 0, earned: 0 }
                byJob[key].shifts++
                byJob[key].earned += sh.earnings ?? 0
              }
              return (
                <div className="bg-[var(--bg-surface)] border border-teal-600/20 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚡</span>
                      <div className="font-mono text-[0.6rem] text-teal-400 uppercase tracking-widest">Shift earnings — auto-synced</div>
                    </div>
                    <div className="font-display font-black text-sm text-teal-400">+{fmt.currencyShort(shiftEarnings)}</div>
                  </div>
                  <div className="space-y-2 mb-3">
                    {Object.values(byJob).map(job => (
                      <div key={job.name} className="flex items-center justify-between">
                        <div>
                          <div className="font-body text-sm text-white">{job.name}</div>
                          <div className="font-mono text-[0.63rem] text-white/78">{job.shifts} shift{job.shifts !== 1 ? 's' : ''} worked this month</div>
                        </div>
                        <div className="font-display font-bold text-sm text-white/70">+{fmt.currencyShort(job.earned)}</div>
                      </div>
                    ))}
                  </div>
                  <Link href="/dashboard/work" className="font-mono text-[0.6rem] text-teal-400/70 hover:text-teal-400 transition-colors">
                    View all shifts →
                  </Link>
                </div>
              )
            })()}

            {showIncomeForm && (
              <div className="bg-[var(--bg-surface)] border border-teal-600/20 rounded-2xl p-4 space-y-3 animate-fade-up">
                <div className="font-mono text-[0.6rem] text-teal-400 uppercase tracking-widest">Record income</div>
                <input
                  className="w-full bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/75 outline-none transition-all"
                  placeholder="e.g. NSFAS deposit, Part-time pay"
                  value={incomeLabel}
                  onChange={e => setIncomeLabel(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    inputMode="decimal"
                    aria-label="Income amount in rands"
                    className="bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/75 outline-none transition-all"
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
                      className={cn('px-2.5 py-1 rounded-full font-mono text-[0.65rem] border transition-all',
                        incomeType === val ? 'bg-teal-600/20 border-teal-500/50 text-teal-400' : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                      )}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowIncomeForm(false)} className="flex-1 font-display text-sm border border-white/15 text-white/70 hover:text-white py-2.5 rounded-xl transition-all">Cancel</button>
                  <button onClick={addIncome} disabled={addingIncome} className="flex-1 font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-xl transition-all disabled:opacity-50">
                    {addingIncome ? 'Saving…' : 'Record'}
                  </button>
                </div>
              </div>
            )}

            {/* Manual income label */}
            <div className="font-mono text-[0.6rem] text-white/78 uppercase tracking-widest">
              Manual income — NSFAS, bursary, pocket money
            </div>

            {incomeEntries.length === 0 && !showIncomeForm ? (
              <div className="text-center py-8 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl">
                <div className="text-3xl mb-2">💵</div>
                <p className="font-display font-bold text-white text-sm">No income logged this month</p>
                <p className="font-mono text-[0.6rem] text-white/78 mt-1">Track NSFAS, bursary, pocket money and more.</p>
                <button
                  onClick={() => setShowIncomeForm(true)}
                  className="mt-4 px-4 py-2 rounded-xl font-display font-bold text-xs bg-teal-600/15 border border-teal-500/30 text-teal-400 hover:bg-teal-600/25 transition-all"
                >
                  + Record income
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {incomeEntries.map(entry => {
                  const icons: Record<string, string> = { nsfas:'🏛️', bursary:'📜', part_time:'💼', pocket_money:'💵', family:'👨‍👩‍👧', scholarship:'🎓', gift:'🎁', side_hustle:'⚡', other:'💳' }
                  const isSynced = !!entry.nsfas_disbursement_id
                  return (
                    <div key={entry.id} className="flex items-center gap-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-3" style={isSynced ? { borderColor: 'rgba(234,179,8,0.2)' } : {}}>
                      <div className="w-9 h-9 bg-teal-600/15 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                        {icons[entry.source_type] || '💳'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-body text-sm text-white truncate">{entry.label}</div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[0.65rem] text-white/78">{entry.source_type.replace('_', ' ')} · {fmt.dateShort(entry.received_date)}</span>
                          {isSynced && <span className="font-mono text-[0.65rem] text-amber-400/70 bg-amber-400/8 border border-amber-400/15 px-1.5 py-0.5 rounded-full">🔗 NSFAS</span>}
                        </div>
                      </div>
                      <div className="font-display font-bold text-sm text-teal-400">+{fmt.currencyShort(entry.amount)}</div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Savings Goals */}
            <div className="flex items-center justify-between mt-2">
              <div className="font-mono text-[0.6rem] text-white/82 uppercase tracking-widest">Savings goals</div>
              <button
                onClick={() => setShowGoalForm(!showGoalForm)}
                className="font-mono text-[0.6rem] text-teal-500 hover:text-teal-400 transition-colors"
              >
                + New goal
              </button>
            </div>

            {/* Savings Score card — shown when there are goals */}
            {savingsGoals.length > 0 && (() => {
              const totalPct = savingsGoals.reduce((s, g) => {
                return s + (g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0)
              }, 0)
              const avgPct = Math.round(totalPct / savingsGoals.length)
              const score = Math.round((savingsGoals.length * 10) + avgPct)
              const scoreColor = score >= 80 ? '#4ecf9e' : score >= 50 ? '#f59e0b' : '#FB7185'
              return (
                <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: `${scoreColor}0C`, border: `0.5px solid ${scoreColor}30` }}>
                  <div className="text-center flex-shrink-0">
                    <div className="font-display font-black text-2xl" style={{ color: scoreColor }}>{score}</div>
                    <div className="font-mono text-[0.65rem] text-white/78 mt-0.5">Savings Score</div>
                  </div>
                  <div>
                    <div className="font-display font-bold text-white text-xs">{savingsGoals.length} active goal{savingsGoals.length !== 1 ? 's' : ''}</div>
                    <div className="font-mono text-[0.65rem] text-white/82 mt-0.5">Avg {avgPct}% funded · Keep contributing weekly to grow your score</div>
                  </div>
                </div>
              )
            })()}

            {showGoalForm && (
              <div className="bg-[var(--bg-surface)] border border-teal-600/20 rounded-2xl p-4 space-y-3 animate-fade-up">
                <div className="font-mono text-[0.6rem] text-teal-400 uppercase tracking-widest">Create savings goal</div>
                {/* Quick templates */}
                <div>
                  <div className="font-mono text-[0.63rem] text-white/75 mb-1.5">Quick templates</div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { emoji: '🛡️', name: 'Emergency Fund',  target: '3000' },
                      { emoji: '📚', name: 'Textbooks',        target: '1500' },
                      { emoji: '💻', name: 'Laptop',           target: '8000' },
                      { emoji: '🏖️', name: 'Holiday',          target: '2500' },
                      { emoji: '🚗', name: 'Car Deposit',      target: '15000' },
                    ].map(t => (
                      <button
                        key={t.name}
                        onClick={() => { setGoalEmoji(t.emoji); setGoalName(t.name); setGoalTarget(t.target) }}
                        className="px-2.5 py-1 rounded-full font-mono text-[0.63rem] border bg-white/5 border-white/10 text-white/70 hover:text-teal-400 hover:border-teal-600/40 transition-all"
                      >
                        {t.emoji} {t.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    className="w-12 bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-2 py-2.5 text-lg text-center outline-none transition-all"
                    value={goalEmoji}
                    onChange={e => setGoalEmoji(e.target.value)}
                    maxLength={2}
                  />
                  <input
                    className="flex-1 bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/75 outline-none transition-all"
                    placeholder="Goal name (e.g. New laptop)"
                    value={goalName}
                    onChange={e => setGoalName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    inputMode="decimal"
                    aria-label="Savings goal target amount in rands"
                    className="bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/75 outline-none transition-all"
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
                  <button onClick={() => setShowGoalForm(false)} className="flex-1 font-display text-sm border border-white/15 text-white/70 hover:text-white py-2.5 rounded-xl transition-all">Cancel</button>
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
                <p className="font-mono text-[0.6rem] text-white/78 mt-1">Set a target and track progress toward it.</p>
                <div className="flex flex-wrap justify-center gap-1.5 mt-3 px-4">
                  {[
                    { emoji: '🛡️', name: 'Emergency Fund',  target: '3000' },
                    { emoji: '📚', name: 'Textbooks',        target: '1500' },
                    { emoji: '💻', name: 'Laptop',           target: '8000' },
                  ].map(t => (
                    <button
                      key={t.name}
                      onClick={() => { setGoalEmoji(t.emoji); setGoalName(t.name); setGoalTarget(t.target); setShowGoalForm(true) }}
                      className="px-3 py-1.5 rounded-full font-mono text-[0.65rem] border bg-teal-600/10 border-teal-500/25 text-teal-400 hover:bg-teal-600/20 transition-all"
                    >
                      {t.emoji} {t.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowGoalForm(true)}
                  className="mt-3 px-4 py-2 rounded-xl font-display font-bold text-xs bg-teal-600/15 border border-teal-500/30 text-teal-400 hover:bg-teal-600/25 transition-all"
                >
                  + Custom goal
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {savingsGoals.map(goal => {
                  const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0
                  const isComplete = pct >= 100
                  const milestones = [25, 50, 75, 100]
                  const barColor = isComplete ? '#f59e0b' : '#14b8a6'
                  return (
                    <div key={goal.id} className="rounded-2xl p-4 transition-all" style={{
                      background: isComplete ? 'rgba(245,158,11,0.06)' : 'var(--bg-surface)',
                      border: isComplete ? '0.5px solid rgba(245,158,11,0.4)' : '0.5px solid var(--border-subtle)',
                    }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{goal.emoji}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <div className="font-display font-bold text-white text-sm">{goal.name}</div>
                              {isComplete && <span className="text-xs">✨</span>}
                            </div>
                            {goal.deadline && (
                              <div className="font-mono text-[0.63rem] text-white/78">By {fmt.dateShort(goal.deadline)}</div>
                            )}
                          </div>
                        </div>
                        {!isComplete ? (
                          <button
                            onClick={() => contributeToGoal(goal.id, goal.current_amount, goal.target_amount)}
                            disabled={contributingGoalId !== null}
                            className="font-mono text-[0.6rem] bg-teal-600/15 hover:bg-teal-600/30 text-teal-400 px-3 py-1 rounded-lg transition-all border border-teal-600/20 disabled:opacity-50"
                          >
                            {contributingGoalId === goal.id ? 'Adding…' : '+ Add'}
                          </button>
                        ) : (
                          <span className="font-mono text-[0.65rem] text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-lg">Goal reached!</span>
                        )}
                      </div>
                      <div className="h-2 bg-white/8 rounded-full overflow-hidden mb-2">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                      {/* Milestone diamonds */}
                      <div className="flex items-center gap-1 mb-2">
                        {milestones.map(m => {
                          const hit = pct >= m
                          const milestoneBadges: Record<number, string> = { 25: '¼', 50: '½', 75: '¾', 100: '✓' }
                          return (
                            <div key={m} className="flex items-center gap-0.5">
                              <span className="font-mono text-[0.65rem]" style={{ color: hit ? barColor : 'rgba(255,255,255,0.12)' }}>
                                ◆
                              </span>
                              <span className="font-mono text-[0.56rem]" style={{ color: hit ? barColor : 'rgba(255,255,255,0.12)' }}>
                                {milestoneBadges[m]}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-[0.65rem]" style={{ color: barColor }}>{fmt.currencyShort(goal.current_amount)}</div>
                        <div className="font-mono text-[0.65rem] text-white/78">{pct}% of {fmt.currencyShort(goal.target_amount)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ─── NSFAS Tracker OS ─── */}
        {activeTab === 'nsfas' && (
          <>
            {initialData.profile?.institution_type === 'tvet' && (
              <div style={{
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 16, padding: '14px 16px', marginBottom: 16,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #6366f1, transparent)' }} />
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', paddingTop: 4 }}>
                  <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>🎓</span>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc', marginBottom: 4 }}>TVET College NSFAS Allowances</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                      As a TVET student, your NSFAS allowances differ from university rates:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {[
                        { label: 'Living allowance', value: 'R1,625/month' },
                        { label: 'Accommodation (day)', value: 'R2,400/month' },
                        { label: 'Accommodation (res)', value: 'Up to R5,000/month' },
                        { label: 'Books & stationery', value: 'R5,460/year' },
                        { label: 'Transport', value: 'R455/month' },
                      ].map(item => (
                        <div key={item.label} style={{
                          padding: '5px 10px', background: 'rgba(99,102,241,0.1)',
                          border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8,
                        }}>
                          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.58)', marginBottom: 1 }}>{item.label}</div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a5b4fc' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
                      Amounts set by NSFAS for 2024/25. Contact your college financial aid office for confirmation.
                    </div>
                  </div>
                </div>
              </div>
            )}
            {initialData.profile?.student_status === 'international' && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 14, padding: '12px 14px', marginBottom: 16,
                fontSize: '0.75rem', color: '#fca5a5', lineHeight: 1.6,
              }}>
                ⚠️ International students are <strong>not eligible for NSFAS</strong>. Visit the <strong>International Student Hub</strong> in your profile for alternative funding options.
              </div>
            )}
            <NsfasTrackerOS budget={budget} userId={initialData.userId} fundingType={initialData.profile?.funding_type} />
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
                      <div className="font-mono text-[0.65rem] text-white/82 uppercase tracking-widest">Financial Health Score</div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <div className={cn('font-display font-black text-5xl', healthColour)}>
                          {aiInsights.healthScore}
                        </div>
                        <div className="font-mono text-[0.6rem] text-white/82">/10</div>
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
                        <div className="font-body text-sm text-white/80 leading-relaxed">{tip.detail}</div>
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
                    <div className="font-mono text-[0.63rem] text-white/78 uppercase mb-1">Projected end balance</div>
                    <div className={cn(
                      'font-display font-black text-xl',
                      aiInsights.projectedEndBalance < 0 ? 'text-red-400' : 'text-teal-400'
                    )}>
                      {fmt.currencyShort(aiInsights.projectedEndBalance)}
                    </div>
                  </div>
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 text-center">
                    <div className="font-mono text-[0.63rem] text-white/78 uppercase mb-1">Biggest spend</div>
                    <div className="font-display font-black text-xl text-white">
                      {aiInsights.biggestSpendCategory}
                    </div>
                  </div>
                </div>

                <button
                  onClick={loadInsights}
                  className="w-full font-mono text-[0.62rem] text-white/82 hover:text-white/80 border border-white/8 hover:border-white/15 py-2.5 rounded-xl transition-all"
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
                <div className="font-mono text-[0.62rem] text-white/82">Get your AI financial health score</div>
              </button>
            )}
          </>
        )}

        {/* ─── Appeal Tab ─── */}
        {activeTab === 'appeal' && (
          <>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5">
              <div className="font-display font-bold text-white mb-1">NSFAS Appeal Letter Generator</div>
              <p className="font-mono text-[0.62rem] text-white/82 mb-5">
                Describe your situation and Claude will draft a professional appeal letter. Always review before submitting.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="font-mono text-[0.6rem] text-white/82 uppercase tracking-widest mb-2">Appeal type</div>
                  <div className="flex flex-wrap gap-2">
                    {['Financial hardship', 'Academic exclusion', 'Allowance dispute', 'Funding cancellation', 'Other'].map(type => (
                      <button
                        key={type}
                        onClick={() => setAppealType(type)}
                        className={cn(
                          'px-3 py-1.5 rounded-full font-mono text-[0.6rem] border transition-all',
                          appealType === type
                            ? 'bg-teal-600/20 border-teal-500/50 text-teal-400'
                            : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[0.6rem] text-white/82 uppercase tracking-widest mb-2">Your situation</div>
                  <textarea
                    value={appealSituation}
                    onChange={e => setAppealSituation(e.target.value)}
                    placeholder="Describe what happened and why you need to appeal. Be specific — include dates, amounts, and any supporting circumstances."
                    className="w-full bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-white/75 outline-none transition-all resize-none font-body"
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
                    className="font-mono text-[0.6rem] bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white px-3 py-1 rounded-lg transition-all"
                  >
                    Copy
                  </button>
                </div>
                <pre className="font-body text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                  {appealLetter}
                </pre>
                <p className="font-mono text-[0.64rem] text-white/75 mt-4 pt-4 border-t border-white/7">
                  ⚠️ Review this letter carefully before submitting. Add your student number, dates, and any supporting documents. This is a draft — you are responsible for its content.
                </p>
              </div>
            )}
          </>
        )}

        {/* ─── Credit Score Education Tab ─── */}
        {activeTab === 'credit' && (
          <CreditScoreEducation />
        )}

        {/* ─── Financial Literacy 101 Tab ─── */}
        {activeTab === 'literacy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <MoneyHealthCalculator />
            <FirstInvestment />
            <FinancialLiteracy101 />
          </div>
        )}

        {/* ─── Academic Fee & Block Tracker ─── */}
        {activeTab === 'fees' && (
          <FeeBlockTracker userId={initialData.userId} />
        )}

        {/* ─── Mobile Data Budget ─── */}
        {activeTab === 'data' && (
          <DataBudgetTracker userId={initialData.userId} />
        )}

        {/* ─── Stokvel Savings Circle ─── */}
        {activeTab === 'stokvel' && (
          <StokvelCircle userId={initialData.userId} />
        )}

        </TabErrorBoundary>
      </div>
        </div>
      </div>
    </div>
  )
}
