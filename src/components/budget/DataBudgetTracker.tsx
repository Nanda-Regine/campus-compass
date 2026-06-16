'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type DataBudget } from '@/types'

interface Props {
  userId: string
}

const TIPS = [
  'YouTube: Settings → Quality → 144p saves 90% data',
  'WhatsApp calls: Settings → Data → Use less data for calls',
  'Download lecture slides on Wi-Fi before leaving campus',
  'VarsityOS is text-first — designed to use minimal data',
  'Maps: Download offline maps for your area on Wi-Fi',
  'Chrome: Enable Lite mode (saves up to 60% data on pages)',
]

const SLIDER_LABELS = [
  { mb: 100, label: '100MB' },
  { mb: 1024, label: '1GB' },
  { mb: 2048, label: '2GB' },
  { mb: 5120, label: '5GB' },
  { mb: 10240, label: '10GB' },
]

function fmtMb(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)}GB`
  return `${mb}MB`
}

export default function DataBudgetTracker({ userId }: Props) {
  const [budget, setBudget] = useState<DataBudget | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addAmount, setAddAmount] = useState(100)
  const [setupMb, setSetupMb] = useState(2048)
  const [wifiToggle, setWifiToggle] = useState(false)
  const [saving, setSaving] = useState(false)

  const monthYear = new Date().toISOString().slice(0, 7)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('data_budget')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', monthYear)
        .maybeSingle()
      setBudget(data ?? null)
      setLoading(false)
    }
    load()
  }, [userId, monthYear])

  async function saveBudget() {
    setSaving(true)
    const mb = wifiToggle ? 5120 : setupMb
    const { data, error } = await supabase
      .from('data_budget')
      .upsert({ user_id: userId, month_year: monthYear, data_budget_mb: mb, data_used_mb: 0, wifi_sessions: 0 }, { onConflict: 'user_id,month_year' })
      .select()
      .maybeSingle()
    if (!error && data) setBudget(data)
    setSaving(false)
  }

  async function addUsage(mb: number) {
    if (!budget) return
    const newUsed = budget.data_used_mb + mb
    const { data } = await supabase
      .from('data_budget')
      .update({ data_used_mb: newUsed })
      .eq('id', budget.id)
      .select()
      .maybeSingle()
    if (data) setBudget(data)
    setShowAddModal(false)
    setAddAmount(100)
  }

  async function addWifiSession() {
    if (!budget) return
    const { data } = await supabase
      .from('data_budget')
      .update({ wifi_sessions: budget.wifi_sessions + 1 })
      .eq('id', budget.id)
      .select()
      .maybeSingle()
    if (data) setBudget(data)
  }

  if (loading) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }} className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-24 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>
    )
  }

  if (!budget) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }} className="p-4">
        <p className="text-sm font-semibold mb-1" style={{ color: '#e5e7eb' }}>Set your monthly data budget</p>
        <p className="text-xs mb-4" style={{ color: '#9ca3af' }}>Track mobile data usage to avoid overspending</p>

        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-xs" style={{ color: '#9ca3af' }}>Budget</span>
            <span className="text-xs font-medium" style={{ color: '#fbbf24' }}>{fmtMb(wifiToggle ? 5120 : setupMb)}</span>
          </div>
          <input
            type="range" min={100} max={10240} step={100}
            value={wifiToggle ? 5120 : setupMb}
            onChange={e => { setWifiToggle(false); setSetupMb(Number(e.target.value)) }}
            className="w-full accent-amber-400"
            disabled={wifiToggle}
          />
          <div className="flex justify-between mt-1">
            {SLIDER_LABELS.map(l => (
              <span key={l.mb} className="text-xs" style={{ color: '#9ca3af' }}>{l.label}</span>
            ))}
          </div>
        </div>

        <button
          onClick={() => setWifiToggle(!wifiToggle)}
          className="flex items-center gap-2 mb-4 text-xs"
          style={{ color: wifiToggle ? '#fbbf24' : '#9ca3af' }}
        >
          <div
            className="w-8 h-4 rounded-full flex items-center transition-all"
            style={{ background: wifiToggle ? '#fbbf24' : 'rgba(255,255,255,0.1)', padding: '2px' }}
          >
            <div
              className="w-3 h-3 rounded-full bg-white transition-all"
              style={{ transform: wifiToggle ? 'translateX(16px)' : 'translateX(0)' }}
            />
          </div>
          I mostly use Wi-Fi (sets 5GB)
        </button>

        <button
          onClick={saveBudget}
          disabled={saving}
          className="w-full py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#fbbf24', color: '#0a0a0f' }}
        >
          {saving ? 'Saving…' : 'Set Data Budget'}
        </button>
      </div>
    )
  }

  const usedPercent = Math.min(100, (budget.data_used_mb / budget.data_budget_mb) * 100)
  const gaugeColor = usedPercent < 50 ? '#4ecf9e' : usedPercent < 80 ? '#fbbf24' : '#f87171'
  const remaining = budget.data_budget_mb - budget.data_used_mb
  const dailyRate = budget.data_used_mb / new Date().getDate()
  const daysLeft = dailyRate > 0 ? Math.floor(remaining / dailyRate) : 99
  const circumference = 2 * Math.PI * 38
  const dashOffset = circumference - (usedPercent / 100) * circumference

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }} className="p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wider" style={{ color: '#9ca3af' }}>Data Budget</p>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
          {new Date().toLocaleString('en-ZA', { month: 'long' })}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-shrink-0" style={{ width: 90, height: 90 }}>
          <svg width="90" height="90" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
              cx="45" cy="45" r="38" fill="none"
              stroke={gaugeColor} strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 45 45)"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold" style={{ color: gaugeColor }}>{Math.round(usedPercent)}%</span>
            <span className="text-xs" style={{ color: '#9ca3af' }}>used</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#e5e7eb' }}>
            {fmtMb(budget.data_used_mb)} used of {fmtMb(budget.data_budget_mb)}
          </p>
          <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
            ~{daysLeft} days until data runs out
          </p>
          <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
            {budget.wifi_sessions} Wi-Fi sessions saved
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {[50, 100, 250].map(mb => (
          <button
            key={mb}
            onClick={() => addUsage(mb)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#e5e7eb' }}
          >
            +{mb}MB
          </button>
        ))}
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#fbbf24' }}
        >
          Custom
        </button>
        <button
          onClick={addWifiSession}
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'rgba(99,202,153,0.1)', color: '#4ecf9e' }}
        >
          +1 Wi-Fi session
        </button>
      </div>

      {showAddModal && (
        <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs mb-2" style={{ color: '#9ca3af' }}>Custom amount (MB)</p>
          <div className="flex gap-2">
            <input
              type="number" min={1} max={10240}
              value={addAmount}
              onChange={e => setAddAmount(Number(e.target.value))}
              className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-transparent outline-none"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb' }}
            />
            <button
              onClick={() => addUsage(addAmount)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: '#fbbf24', color: '#0a0a0f' }}
            >
              Add
            </button>
            <button
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ color: '#9ca3af' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs px-3 pt-2 pb-1 font-medium" style={{ color: '#fbbf24' }}>Data-saving tips</p>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {TIPS.map((tip, i) => (
            <p key={i} className="text-xs px-3 py-2" style={{ color: '#9ca3af' }}>• {tip}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
