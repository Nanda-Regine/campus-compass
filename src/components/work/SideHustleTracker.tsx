'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { dispatchXP } from '@/lib/xp-engine'

interface Props {
  userId: string
}

interface SideHustleEntry {
  id: string
  user_id: string
  hustle_name: string
  hustle_type: string
  income_this_month: number
  hours_this_month: number
  description: string
  started_date: string
  is_active: boolean
}

type HustleType = keyof typeof HUSTLE_TYPES

const HUSTLE_TYPES = {
  tutoring: '📚 Tutoring',
  crafts: '🎨 Crafts',
  food: '🍱 Food',
  reselling: '🛒 Reselling',
  digital: '💻 Digital',
  services: '✂️ Services',
  other: '💼 Other',
} as const

function HustleTypeEmoji({ type }: { type: string }) {
  const label = HUSTLE_TYPES[type as HustleType] ?? '💼 Other'
  return <>{label.split(' ')[0]}</>
}

function HustleTypeLabel({ type }: { type: string }) {
  return <>{HUSTLE_TYPES[type as HustleType] ?? '💼 Other'}</>
}

const CARD_STYLE = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '16px',
}

const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '10px',
  color: '#e5e7eb',
  padding: '10px 14px',
  width: '100%',
  fontSize: '14px',
  outline: 'none',
}

export default function SideHustleTracker({ userId }: Props) {
  const [hustles, setHustles] = useState<SideHustleEntry[]>([])
  const [addModal, setAddModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedInvoice, setCopiedInvoice] = useState(false)

  const [form, setForm] = useState<Partial<SideHustleEntry>>({
    hustle_type: 'tutoring',
    income_this_month: 500,
    hours_this_month: 10,
    description: '',
    started_date: new Date().toISOString().split('T')[0],
  })

  const loadHustles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: dbError } = await supabase
        .from('side_hustle_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (dbError) throw dbError
      setHustles(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hustles')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { loadHustles() }, [loadHustles])

  const totalThisMonth = hustles.reduce((sum, h) => sum + (h.income_this_month ?? 0), 0)
  // No grand_total column in schema — derive lifetime total from monthly income across hustles.
  const grandTotal = totalThisMonth
  const highEarners = hustles.filter(h => (h.income_this_month ?? 0) >= 500)

  const handleSave = async () => {
    if (!form.hustle_name?.trim()) return
    setSaving(true)
    try {
      const supabase = createClient()
      const row = {
        user_id: userId,
        hustle_name: form.hustle_name.trim(),
        hustle_type: form.hustle_type ?? 'other',
        income_this_month: form.income_this_month ?? 0,
        hours_this_month: form.hours_this_month ?? 0,
        description: form.description ?? '',
        started_date: form.started_date ?? new Date().toISOString().split('T')[0],
        is_active: true,
      }
      const { data, error: dbError } = await supabase
        .from('side_hustle_entries')
        .insert(row)
        .select()
        .single()
      if (dbError) throw dbError
      setHustles(prev => [data, ...prev])
      dispatchXP('side_hustle_logged')
      setAddModal(false)
      setForm({
        hustle_type: 'tutoring',
        income_this_month: 500,
        hours_this_month: 10,
        description: '',
        started_date: new Date().toISOString().split('T')[0],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string) => {
    const supabase = createClient()
    await supabase
      .from('side_hustle_entries')
      .update({ is_active: false })
      .eq('id', id)
    setHustles(prev => prev.filter(h => h.id !== id))
  }

  const invoiceTemplate = (hustle: SideHustleEntry) =>
    `INVOICE\n————————————————\nFrom: [Your Name]\nDate: ${new Date().toLocaleDateString('en-ZA')}\nService: ${hustle.hustle_name}\nAmount: R${hustle.income_this_month.toLocaleString('en-ZA')}\nPayment: EFT to [Your Bank Details]\n————————————————\nThank you for your business.`

  const handleCopyInvoice = (hustle: SideHustleEntry) => {
    navigator.clipboard.writeText(invoiceTemplate(hustle)).then(() => {
      setCopiedInvoice(true)
      setTimeout(() => setCopiedInvoice(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="animate-pulse h-20 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(248,113,113,0.10)', color: '#f87171', border: '1px solid rgba(248,113,113,0.20)' }}
        >
          {error}
        </div>
      )}

      {/* Total this month */}
      <div style={CARD_STYLE} className="px-5 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs mb-1" style={{ color: '#9ca3af' }}>Total this month</div>
          <div className="text-3xl font-bold" style={{ color: '#fbbf24' }}>
            R{totalThisMonth.toLocaleString('en-ZA')}
          </div>
        </div>
        <button
          onClick={() => setAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: '#60a5fa18', border: '1px solid #60a5fa30', color: '#60a5fa' }}
        >
          <span className="text-base">+</span> Add hustle
        </button>
      </div>

      {/* Hustle cards */}
      {hustles.length === 0 ? (
        <div
          style={CARD_STYLE}
          className="px-5 py-10 text-center"
        >
          <div className="text-4xl mb-3">💼</div>
          <p className="text-sm font-semibold" style={{ color: '#e5e7eb' }}>
            No side hustles tracked yet
          </p>
          <p className="text-xs mt-1 mb-4" style={{ color: '#9ca3af' }}>
            Add your first hustle to start tracking income and hours.
          </p>
          <button
            onClick={() => setAddModal(true)}
            className="px-5 py-2 rounded-xl text-sm font-semibold"
            style={{ background: '#60a5fa', color: '#0a0a0f' }}
          >
            Add a hustle
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {hustles.map(hustle => {
            const effectiveRate =
              hustle.hours_this_month > 0
                ? (hustle.income_this_month / hustle.hours_this_month).toFixed(0)
                : '—'
            return (
              <div key={hustle.id} style={CARD_STYLE} className="px-4 py-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">
                      <HustleTypeEmoji type={hustle.hustle_type} />
                    </span>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: '#e5e7eb' }}>
                        {hustle.hustle_name}
                      </div>
                      <div
                        className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                        style={{
                          background: '#60a5fa14',
                          border: '1px solid #60a5fa25',
                          color: '#60a5fa',
                        }}
                      >
                        <HustleTypeLabel type={hustle.hustle_type} />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(hustle.id)}
                    className="text-xs transition-colors"
                    style={{ color: '#9ca3af' }}
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div
                    className="rounded-xl py-2"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="text-sm font-bold" style={{ color: '#4ecf9e' }}>
                      R{hustle.income_this_month.toLocaleString('en-ZA')}
                    </div>
                    <div className="text-xs" style={{ color: '#9ca3af' }}>
                      /month
                    </div>
                  </div>
                  <div
                    className="rounded-xl py-2"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="text-sm font-bold" style={{ color: '#e5e7eb' }}>
                      {hustle.hours_this_month}hrs
                    </div>
                    <div className="text-xs" style={{ color: '#9ca3af' }}>
                      /month
                    </div>
                  </div>
                  <div
                    className="rounded-xl py-2"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="text-sm font-bold" style={{ color: '#fbbf24' }}>
                      R{effectiveRate}/hr
                    </div>
                    <div className="text-xs" style={{ color: '#9ca3af' }}>
                      effective
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Structure My Hustle panel */}
      {highEarners.length > 0 && (
        <div
          style={{
            background: 'rgba(96,165,250,0.05)',
            border: '1px solid rgba(96,165,250,0.15)',
            borderRadius: '16px',
          }}
          className="p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">📋</span>
            <span className="text-sm font-semibold" style={{ color: '#60a5fa' }}>
              Structure My Hustle
            </span>
          </div>

          {/* Invoice template */}
          <div>
            <p className="text-xs mb-2" style={{ color: '#9ca3af' }}>
              Invoice template — copy and send to clients
            </p>
            <div
              className="rounded-xl p-3 font-mono text-xs whitespace-pre-wrap mb-2"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#9ca3af',
              }}
            >
              {invoiceTemplate(highEarners[0])}
            </div>
            <button
              onClick={() => handleCopyInvoice(highEarners[0])}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: copiedInvoice ? '#4ecf9e18' : '#60a5fa18',
                border: `1px solid ${copiedInvoice ? '#4ecf9e30' : '#60a5fa30'}`,
                color: copiedInvoice ? '#4ecf9e' : '#60a5fa',
              }}
            >
              {copiedInvoice ? '✓ Copied!' : 'Copy invoice template'}
            </button>
          </div>

          {/* CIPC tip */}
          <div
            className="rounded-xl p-3 text-xs space-y-1"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              color: '#9ca3af',
            }}
          >
            <p>
              <span style={{ color: '#e5e7eb', fontWeight: 600 }}>
                At R500+/month consistently →
              </span>{' '}
              Consider registering as a sole proprietor. It&apos;s free at{' '}
              <span style={{ color: '#60a5fa' }}>CIPC.co.za</span> and makes you
              look professional to clients.
            </p>
            <p>
              <span style={{ color: '#e5e7eb', fontWeight: 600 }}>Tax threshold:</span>{' '}
              Under R95,750 total annual income = no tax owed. You likely don&apos;t
              need to register for tax yet.
            </p>
          </div>
        </div>
      )}

      {/* Motivation footer */}
      {hustles.length > 0 && (
        <div
          className="px-4 py-3 rounded-xl text-sm text-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            color: '#9ca3af',
          }}
        >
          Total earned since you started:{' '}
          <span className="font-bold" style={{ color: '#fbbf24' }}>
            R{grandTotal.toLocaleString('en-ZA')}
          </span>
          {grandTotal > 1000 && <span className="ml-1">🎉</span>}
        </div>
      )}

      {/* Add modal */}
      {addModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setAddModal(false) }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            style={{
              background: '#0f1117',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold" style={{ color: '#e5e7eb' }}>
                Add a side hustle
              </h3>
              <button
                onClick={() => setAddModal(false)}
                className="text-sm"
                style={{ color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#9ca3af' }}>
                Hustle name *
              </label>
              <input
                type="text"
                placeholder="e.g. Campus tutoring"
                value={form.hustle_name ?? ''}
                onChange={e => setForm(prev => ({ ...prev, hustle_name: e.target.value }))}
                style={INPUT_STYLE}
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-xs mb-2 block" style={{ color: '#9ca3af' }}>
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(HUSTLE_TYPES) as HustleType[]).map(key => (
                  <button
                    key={key}
                    onClick={() => setForm(prev => ({ ...prev, hustle_type: key }))}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: form.hustle_type === key ? '#60a5fa20' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${form.hustle_type === key ? '#60a5fa50' : 'rgba(255,255,255,0.08)'}`,
                      color: form.hustle_type === key ? '#60a5fa' : '#9ca3af',
                    }}
                  >
                    {HUSTLE_TYPES[key]}
                  </button>
                ))}
              </div>
            </div>

            {/* Income slider */}
            <div>
              <label className="text-xs mb-1.5 flex justify-between" style={{ color: '#9ca3af' }}>
                <span>Monthly income</span>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                  R{(form.income_this_month ?? 0).toLocaleString('en-ZA')}
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={5000}
                step={50}
                value={form.income_this_month ?? 0}
                onChange={e =>
                  setForm(prev => ({ ...prev, income_this_month: Number(e.target.value) }))
                }
                className="w-full accent-blue-400"
              />
              <div className="flex justify-between text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                <span>R0</span>
                <span>R5,000</span>
              </div>
            </div>

            {/* Hours slider */}
            <div>
              <label className="text-xs mb-1.5 flex justify-between" style={{ color: '#9ca3af' }}>
                <span>Hours per month</span>
                <span style={{ color: '#e5e7eb', fontWeight: 600 }}>
                  {form.hours_this_month ?? 0}hrs
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={200}
                step={1}
                value={form.hours_this_month ?? 0}
                onChange={e =>
                  setForm(prev => ({ ...prev, hours_this_month: Number(e.target.value) }))
                }
                className="w-full accent-blue-400"
              />
              <div className="flex justify-between text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                <span>0hrs</span>
                <span>200hrs</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#9ca3af' }}>
                Description (optional)
              </label>
              <textarea
                rows={2}
                placeholder="What do you do?"
                value={form.description ?? ''}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                style={{ ...INPUT_STYLE, resize: 'none' }}
              />
            </div>

            {/* Started date */}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#9ca3af' }}>
                Started date
              </label>
              <input
                type="date"
                value={form.started_date ?? ''}
                onChange={e => setForm(prev => ({ ...prev, started_date: e.target.value }))}
                style={INPUT_STYLE}
              />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving || !form.hustle_name?.trim()}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: saving || !form.hustle_name?.trim() ? 'rgba(96,165,250,0.2)' : '#60a5fa',
                color: saving || !form.hustle_name?.trim() ? '#60a5fa80' : '#0a0a0f',
              }}
            >
              {saving ? 'Saving...' : 'Save hustle'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
