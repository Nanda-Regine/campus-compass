'use client'

// ============================================================
// NsfasTrackerOS — Full NSFAS payment tracking system.
// Tabs: Overview · Disbursements · Appeals · Documents · Guide
// Domain colour: --gold (Money OS)
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import type { Budget } from '@/types'
import {
  getDisbursements, getAppeals, getDocuments,
  updateDisbursementStatus, createAppeal, updateAppealStatus, upsertDocument,
  seedExpectedDisbursements, calcShortfall, REQUIRED_DOCUMENTS,
  type NsfasDisbursement, type NsfasAppeal, type NsfasDocument,
  type DisbursementStatus, type AppealStatus, type AppealType,
  type DocumentType, type DocumentStatus,
} from '@/lib/db/nsfas'
import { signals } from '@/store/signals'

// ─── Sub-tab config ───────────────────────────────────────────

type Tab = 'overview' | 'disbursements' | 'appeals' | 'documents' | 'guide'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview',       label: 'Overview',      icon: '📊' },
  { id: 'disbursements',  label: 'Payments',       icon: '💳' },
  { id: 'appeals',        label: 'Appeals',        icon: '📝' },
  { id: 'documents',      label: 'Documents',      icon: '📄' },
  { id: 'guide',          label: 'Guide',          icon: '🗺️' },
]

// ─── Status colour helpers ────────────────────────────────────

const STATUS_COLOR: Record<DisbursementStatus, string> = {
  expected: 'var(--text-tertiary)',
  pending:  'var(--gold)',
  received: 'var(--teal)',
  late:     'var(--coral)',
  partial:  'var(--gold)',
  missed:   'var(--danger)',
}

const STATUS_BG: Record<DisbursementStatus, string> = {
  expected: 'rgba(255,255,255,0.04)',
  pending:  'var(--gold-dim)',
  received: 'var(--teal-dim)',
  late:     'var(--coral-dim)',
  partial:  'var(--gold-dim)',
  missed:   'var(--danger-dim)',
}

const STATUS_LABEL: Record<DisbursementStatus, string> = {
  expected: 'EXPECTED',
  pending:  'PENDING',
  received: 'PAID',
  late:     'LATE',
  partial:  'PARTIAL',
  missed:   'MISSED',
}

const APPEAL_STATUS_COLOR: Record<AppealStatus, string> = {
  drafting:     'var(--text-tertiary)',
  submitted:    'var(--gold)',
  under_review: 'var(--sky, #38BDF8)',
  approved:     'var(--teal)',
  rejected:     'var(--danger)',
  escalated:    'var(--coral)',
  closed:       'var(--text-muted)',
}

const APPEAL_TYPE_LABEL: Record<AppealType, string> = {
  late_payment:        'Late Payment',
  underpayment:        'Underpayment',
  suspension:          'Suspension',
  n_plus_rule:         'N+ Rule',
  academic_progress:   'Academic Progress',
  other:               'Other',
}

const TYPE_ICON: Record<string, string> = {
  living: '🏠', accommodation: '🏢', books: '📚', transport: '🚌', meal: '🍽️', other: '💳',
}

// ─── Overview sub-tab ─────────────────────────────────────────

function OverviewTab({ budget, disbursements, onSeed }: {
  budget: Budget | null
  disbursements: NsfasDisbursement[]
  onSeed: () => void
}) {
  const stats = calcShortfall(disbursements)
  const paidPct = stats.totalExpected > 0
    ? Math.round((stats.totalReceived / stats.totalExpected) * 100)
    : 0

  const now = new Date()
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonth = disbursements.filter(d => d.period === currentPeriod)
  const thisMonthPaid   = thisMonth.filter(d => d.status === 'received' || d.status === 'partial')
  const thisMonthLate   = thisMonth.filter(d => d.status === 'late')
  const thisMonthTotal  = thisMonth.reduce((s, d) => s + d.expected_amount, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* This month card */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'var(--bg-surface)', border: '1px solid var(--gold-border)',
        borderRadius: 16, padding: '18px 18px 14px',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, var(--gold), transparent)',
        }} />
        <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--gold)', letterSpacing: '0.08em', marginBottom: 6 }}>
          THIS MONTH
        </div>
        {thisMonthTotal > 0 ? (
          <>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              R{thisMonthTotal.toLocaleString('en-ZA')}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              {thisMonthPaid.length} of {thisMonth.length} payment{thisMonth.length !== 1 ? 's' : ''} received
              {thisMonthLate.length > 0 && (
                <span style={{ color: 'var(--coral)', marginLeft: 6 }}>· {thisMonthLate.length} late</span>
              )}
            </div>
          </>
        ) : (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            No disbursements seeded yet.
            <button onClick={onSeed} style={{
              display: 'block', marginTop: 10, padding: '8px 16px',
              background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
              borderRadius: 8, color: 'var(--gold)',
              fontSize: '0.73rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
              cursor: 'pointer',
            }}>
              Seed 2026 expected disbursements →
            </button>
          </div>
        )}
      </div>

      {/* Year stats grid */}
      {disbursements.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Total Expected',  value: `R${stats.totalExpected.toLocaleString('en-ZA')}`, color: 'var(--text-secondary)' },
            { label: 'Total Received',  value: `R${stats.totalReceived.toLocaleString('en-ZA')}`, color: 'var(--teal)' },
            { label: 'Total Shortfall', value: `R${stats.totalShortfall.toLocaleString('en-ZA')}`, color: stats.totalShortfall > 0 ? 'var(--danger)' : 'var(--teal)' },
            { label: 'Paid %',          value: `${paidPct}%`, color: paidPct >= 90 ? 'var(--teal)' : paidPct >= 60 ? 'var(--gold)' : 'var(--danger)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 12, padding: '12px 14px',
            }}>
              <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Alert cards */}
      {stats.lateCount > 0 && (
        <div style={{
          background: 'var(--coral-dim)', border: '1px solid rgba(232,112,64,0.30)',
          borderRadius: 12, padding: '12px 14px',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--coral)' }}>
            ⚠️ {stats.lateCount} late payment{stats.lateCount !== 1 ? 's' : ''} detected
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            Log an appeal under the Appeals tab to dispute these delays.
          </div>
        </div>
      )}

      {stats.missedCount > 0 && (
        <div style={{
          background: 'var(--danger-dim)', border: '1px solid var(--danger-border)',
          borderRadius: 12, padding: '12px 14px',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--danger)' }}>
            🚨 {stats.missedCount} missed payment{stats.missedCount !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            Contact NSFAS immediately — missing 2+ months can affect your N+ rule standing.
          </div>
        </div>
      )}

      {/* Budget breakdown if enabled */}
      {budget?.nsfas_enabled && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 14, padding: '14px 16px',
        }}>
          <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', letterSpacing: '0.07em', marginBottom: 10 }}>
            MONTHLY ALLOWANCES (FROM BUDGET)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Living Allowance',   amount: budget.nsfas_living,  icon: '🏠' },
              { label: 'Accommodation',       amount: budget.nsfas_accom,   icon: '🏢' },
              { label: 'Books & Stationery',  amount: budget.nsfas_books,   icon: '📚' },
            ].filter(i => i.amount > 0).map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{item.icon}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                  R{item.amount.toLocaleString('en-ZA')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Disbursements sub-tab ────────────────────────────────────

function DisbursementsTab({ disbursements, onUpdate }: {
  disbursements: NsfasDisbursement[]
  onUpdate: () => void
}) {
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [form, setForm] = useState<{ id: string; actual: string; actualDate: string } | null>(null)

  const grouped: Record<string, NsfasDisbursement[]> = {}
  for (const d of disbursements) {
    if (!grouped[d.period]) grouped[d.period] = []
    grouped[d.period].push(d)
  }
  const periods = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const handleMark = async (d: NsfasDisbursement, status: DisbursementStatus) => {
    if (status === 'received') {
      setForm({ id: d.id, actual: String(d.expected_amount), actualDate: new Date().toISOString().split('T')[0] })
      return
    }
    setMarkingId(d.id)
    await updateDisbursementStatus(d.id, status)

    if (status === 'late' || status === 'missed') {
      signals.emit({
        type: 'nsfas_status_change',
        payload: { status, runwayDays: 0 },
      })
    }
    onUpdate()
    setMarkingId(null)
  }

  const handleConfirmReceived = async () => {
    if (!form) return
    setMarkingId(form.id)
    await updateDisbursementStatus(form.id, 'received', parseFloat(form.actual) || undefined, form.actualDate)
    signals.emit({
      type: 'expense_logged',
      payload: { amount: parseFloat(form.actual), category: 'accommodation', remainingBudget: 0 },
    })
    setForm(null)
    onUpdate()
    setMarkingId(null)
  }

  if (disbursements.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 14, padding: '32px 20px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>💳</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
          No payment records yet
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          Seed expected disbursements from the Overview tab to get started.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {form && (
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--teal-border)',
          borderRadius: 14, padding: '16px',
        }}>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--teal)', marginBottom: 10 }}>
            CONFIRM PAYMENT RECEIVED
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Actual amount received (R)</div>
              <input
                type="number"
                value={form.actual}
                onChange={e => setForm(f => f ? { ...f, actual: e.target.value } : f)}
                style={{
                  width: '100%', padding: '9px 12px',
                  background: 'var(--bg-base)', border: '1px solid var(--border-default)',
                  borderRadius: 8, color: 'var(--text-primary)',
                  fontSize: '0.85rem', fontFamily: 'var(--font-mono)',
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Date received</div>
              <input
                type="date"
                value={form.actualDate}
                onChange={e => setForm(f => f ? { ...f, actualDate: e.target.value } : f)}
                style={{
                  width: '100%', padding: '9px 12px',
                  background: 'var(--bg-base)', border: '1px solid var(--border-default)',
                  borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleConfirmReceived} style={{
              flex: 1, padding: '9px 0',
              background: 'var(--teal-dim)', border: '1px solid var(--teal-border)',
              borderRadius: 8, color: 'var(--teal)',
              fontSize: '0.73rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer',
            }}>Confirm</button>
            <button onClick={() => setForm(null)} style={{
              padding: '9px 16px',
              background: 'transparent', border: '1px solid var(--border-subtle)',
              borderRadius: 8, color: 'var(--text-tertiary)',
              fontSize: '0.73rem', fontFamily: 'var(--font-mono)', cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      )}

      {periods.map(period => (
        <div key={period}>
          <div style={{
            fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
            letterSpacing: '0.08em', marginBottom: 8,
          }}>
            {grouped[period][0].period_label.toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {grouped[period].map(d => {
              const color  = STATUS_COLOR[d.status]
              const bg     = STATUS_BG[d.status]
              const isNow  = period === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
              return (
                <div key={d.id} style={{
                  position: 'relative', overflow: 'hidden',
                  background: 'var(--bg-surface)', border: `1px solid ${isNow ? 'var(--gold-border)' : 'var(--border-subtle)'}`,
                  borderRadius: 12, padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1rem' }}>{TYPE_ICON[d.type] ?? '💳'}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                        {d.type}
                      </span>
                    </div>
                    <span style={{
                      padding: '2px 8px',
                      background: bg, borderRadius: 100,
                      fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                      color, letterSpacing: '0.06em',
                    }}>
                      {STATUS_LABEL[d.status]}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: '0.67rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>
                        Expected: <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>R{d.expected_amount.toLocaleString('en-ZA')}</span>
                        {d.expected_date && <span style={{ marginLeft: 8 }}>{new Date(d.expected_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</span>}
                      </div>
                      {d.actual_amount !== null && (
                        <div style={{ fontSize: '0.67rem', color: 'var(--text-tertiary)' }}>
                          Received: <span style={{ color: 'var(--teal)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>R{d.actual_amount.toLocaleString('en-ZA')}</span>
                          {d.actual_date && <span style={{ marginLeft: 8 }}>{new Date(d.actual_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</span>}
                        </div>
                      )}
                    </div>

                    {d.status === 'expected' || d.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleMark(d, 'received')}
                          disabled={!!markingId}
                          style={{
                            padding: '5px 10px',
                            background: 'var(--teal-dim)', border: '1px solid var(--teal-border)',
                            borderRadius: 6, color: 'var(--teal)',
                            fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                            cursor: 'pointer',
                          }}>
                          ✓ Paid
                        </button>
                        <button
                          onClick={() => handleMark(d, 'late')}
                          disabled={!!markingId}
                          style={{
                            padding: '5px 10px',
                            background: 'var(--coral-dim)', border: '1px solid rgba(232,112,64,0.30)',
                            borderRadius: 6, color: 'var(--coral)',
                            fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                            cursor: 'pointer',
                          }}>
                          Late
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {d.status === 'late' || d.status === 'missed' ? (
                    <div style={{ marginTop: 8, fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                      Shortfall: <span style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        R{(d.expected_amount - (d.actual_amount ?? 0)).toLocaleString('en-ZA')}
                      </span>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Appeals sub-tab ──────────────────────────────────────────

function AppealsTab({ appeals, onUpdate }: { appeals: NsfasAppeal[]; onUpdate: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ appeal_type: 'late_payment' as AppealType, title: '', description: '', reference_number: '' })
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!form.title) return
    setSaving(true)
    await createAppeal('', form) // user_id filled server-side via RLS
    setShowForm(false)
    setForm({ appeal_type: 'late_payment', title: '', description: '', reference_number: '' })
    onUpdate()
    setSaving(false)
  }

  const handleStatus = async (id: string, status: AppealStatus) => {
    await updateAppealStatus(id, status)
    onUpdate()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button
        onClick={() => setShowForm(v => !v)}
        style={{
          width: '100%', padding: '12px 0',
          background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
          borderRadius: 12, color: 'var(--gold)',
          fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
          cursor: 'pointer',
        }}>
        {showForm ? 'Cancel' : '+ Log a new appeal'}
      </button>

      {showForm && (
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 14, padding: '16px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Appeal type</div>
              <select
                value={form.appeal_type}
                onChange={e => setForm(f => ({ ...f, appeal_type: e.target.value as AppealType }))}
                style={{
                  width: '100%', padding: '9px 12px',
                  background: 'var(--bg-base)', border: '1px solid var(--border-default)',
                  borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem',
                }}>
                {Object.entries(APPEAL_TYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Title</div>
              <input
                type="text"
                placeholder="e.g. February 2026 living allowance not received"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                style={{
                  width: '100%', padding: '9px 12px',
                  background: 'var(--bg-base)', border: '1px solid var(--border-default)',
                  borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem',
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Description (optional)</div>
              <textarea
                placeholder="What happened, when, and what you've already tried..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                style={{
                  width: '100%', padding: '9px 12px',
                  background: 'var(--bg-base)', border: '1px solid var(--border-default)',
                  borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem',
                  resize: 'none', fontFamily: 'var(--font-body)',
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>NSFAS reference number (if any)</div>
              <input
                type="text"
                placeholder="REF-XXXXXXXX"
                value={form.reference_number}
                onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))}
                style={{
                  width: '100%', padding: '9px 12px',
                  background: 'var(--bg-base)', border: '1px solid var(--border-default)',
                  borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={saving || !form.title}
              style={{
                padding: '10px 0',
                background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
                borderRadius: 8, color: 'var(--gold)',
                fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                cursor: form.title ? 'pointer' : 'not-allowed', opacity: form.title ? 1 : 0.5,
              }}>
              {saving ? 'Saving...' : 'Log appeal'}
            </button>
          </div>
        </div>
      )}

      {appeals.length === 0 && !showForm && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 14, padding: '28px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.8rem', marginBottom: 10 }}>📝</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            No appeals logged. Use this to track any disputes with NSFAS.
          </div>
        </div>
      )}

      {appeals.map(a => (
        <div key={a.id} style={{
          position: 'relative', overflow: 'hidden',
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 12, padding: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 3 }}>
                {APPEAL_TYPE_LABEL[a.appeal_type]}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</div>
            </div>
            <span style={{
              flexShrink: 0, padding: '3px 8px',
              background: `${APPEAL_STATUS_COLOR[a.status]}18`,
              border: `1px solid ${APPEAL_STATUS_COLOR[a.status]}40`,
              borderRadius: 100,
              fontSize: '0.58rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
              color: APPEAL_STATUS_COLOR[a.status], letterSpacing: '0.06em',
            }}>
              {a.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {a.description && (
            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
              {a.description}
            </div>
          )}

          {a.reference_number && (
            <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginBottom: 8 }}>
              REF: {a.reference_number}
            </div>
          )}

          {a.status === 'drafting' && (
            <button
              onClick={() => handleStatus(a.id, 'submitted')}
              style={{
                padding: '6px 12px',
                background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
                borderRadius: 6, color: 'var(--gold)',
                fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                cursor: 'pointer',
              }}>
              Mark as submitted →
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Documents sub-tab ────────────────────────────────────────

function DocumentsTab({ documents, userId, onUpdate }: { documents: NsfasDocument[]; userId: string; onUpdate: () => void }) {
  const docMap = new Map(documents.map(d => [d.doc_type, d]))

  const handleToggle = async (docType: DocumentType, currentStatus: string, label: string) => {
    const next: DocumentStatus = currentStatus === 'required' || currentStatus === 'in_progress' ? 'uploaded'
      : currentStatus === 'uploaded' ? 'submitted'
      : 'required'
    await upsertDocument(userId, docType, label, next)
    onUpdate()
  }

  const STATUS_ICON: Record<string, string> = {
    required:    '○',
    in_progress: '◐',
    uploaded:    '✓',
    submitted:   '✓✓',
    verified:    '✅',
    rejected:    '✗',
  }

  const STATUS_C: Record<string, string> = {
    required:    'var(--text-muted)',
    in_progress: 'var(--gold)',
    uploaded:    'var(--teal)',
    submitted:   'var(--teal)',
    verified:    'var(--teal)',
    rejected:    'var(--danger)',
  }

  const completedCount = documents.filter(d => ['uploaded','submitted','verified'].includes(d.status)).length
  const totalRequired  = REQUIRED_DOCUMENTS.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Progress */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 12, padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Documents submitted</div>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--teal)' }}>
            {completedCount}/{totalRequired}
          </div>
        </div>
        <div style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 100 }}>
          <div style={{
            height: '100%', borderRadius: 100,
            background: completedCount === totalRequired ? 'var(--teal)' : 'var(--gold)',
            width: `${Math.round((completedCount / totalRequired) * 100)}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {REQUIRED_DOCUMENTS.map(({ doc_type, label }) => {
          const doc    = docMap.get(doc_type)
          const status = doc?.status ?? 'required'
          const color  = STATUS_C[status] ?? 'var(--text-muted)'
          return (
            <button
              key={doc_type}
              onClick={() => handleToggle(doc_type, status, label)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', textAlign: 'left',
                padding: '12px 14px',
                background: status !== 'required' ? `${color}10` : 'var(--bg-surface)',
                border: `1px solid ${status !== 'required' ? `${color}30` : 'var(--border-subtle)'}`,
                borderRadius: 10, cursor: 'pointer',
              }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{label}</span>
              <span style={{
                fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color,
              }}>
                {STATUS_ICON[status] ?? '○'}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Tap a document to cycle through: Required → Uploaded → Submitted
      </div>
    </div>
  )
}

// ─── Guide sub-tab ────────────────────────────────────────────

const GUIDE_STEPS = [
  {
    step: 1,
    title: 'Check your status on myNSFAS',
    detail: 'Log in at my.nsfas.org.za using your SA ID number. Check "Funding Status" — it should say "Approved". If it says "Provisionally Funded", your allowances may be on hold.',
    color: 'var(--teal)',
    link:  'https://my.nsfas.org.za',
  },
  {
    step: 2,
    title: 'Verify your banking details',
    detail: 'NSFAS pays into a Fundi-linked wallet or your bank account. Ensure your banking details match your ID exactly — a single character mismatch blocks payment.',
    color: 'var(--gold)',
  },
  {
    step: 3,
    title: 'Check N+ rule compliance',
    detail: 'NSFAS funds you for the minimum duration of your qualification plus N extra years (N+1 for 3-year degrees, N+2 for 4-year degrees). If you\'ve exceeded this, you must appeal.',
    color: 'var(--coral)',
  },
  {
    step: 4,
    title: 'Contact your institution\'s NSFAS office',
    detail: 'Before calling NSFAS directly, speak to your Student Financial Aid Office (SFAO). They can escalate on your behalf and have a direct channel to NSFAS.',
    color: 'var(--nova)',
  },
  {
    step: 5,
    title: 'Submit a formal appeal',
    detail: 'If your payment is late by more than 5 business days: log the appeal here, gather proof (bank statement showing no credit), and submit via the NSFAS online portal. Note your reference number.',
    color: 'var(--gold)',
    link:  'https://my.nsfas.org.za',
  },
  {
    step: 6,
    title: 'Escalate to the DHET if unresolved',
    detail: 'If NSFAS does not resolve within 15 business days, escalate to the Department of Higher Education and Training (DHET) via their complaints portal or email: highereducation@dhet.gov.za',
    color: 'var(--danger)',
  },
]

function GuideTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
        borderRadius: 12, padding: '12px 14px', fontSize: '0.76rem',
        color: 'var(--text-secondary)', lineHeight: 1.6,
      }}>
        This guide covers what to do when NSFAS is late, underpaid, or not paying at all. Each step escalates to the next.
      </div>
      {GUIDE_STEPS.map(s => (
        <div key={s.step} style={{
          position: 'relative', overflow: 'hidden',
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderLeft: `3px solid ${s.color}`,
          borderRadius: 12, padding: '14px 14px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
              background: `${s.color}18`, border: `1px solid ${s.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: s.color,
            }}>
              {s.step}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 5 }}>
                {s.title}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {s.detail}
              </div>
              {s.link && (
                <a
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block', marginTop: 8,
                    fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                    color: s.color, textDecoration: 'none',
                  }}>
                  Open portal →
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────

interface Props {
  budget: Budget | null
  userId: string
}

export default function NsfasTrackerOS({ budget, userId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [disbursements, setDisbursements] = useState<NsfasDisbursement[]>([])
  const [appeals, setAppeals] = useState<NsfasAppeal[]>([])
  const [documents, setDocuments] = useState<NsfasDocument[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [dis, app, docs] = await Promise.all([
      getDisbursements(userId),
      getAppeals(userId),
      getDocuments(userId),
    ])
    setDisbursements(dis)
    setAppeals(app)
    setDocuments(docs)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const handleSeed = async () => {
    if (!budget) return
    await seedExpectedDisbursements(
      userId,
      budget.nsfas_living ?? 0,
      budget.nsfas_accom ?? 0,
      budget.nsfas_books ?? 0,
    )
    load()
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          Loading NSFAS data...
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'var(--bg-surface)', border: '1px solid var(--gold-border)',
        borderRadius: 16, padding: '16px 18px',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, var(--gold), transparent)',
        }} />
        <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--gold)', letterSpacing: '0.09em', marginBottom: 4 }}>
          NSFAS TRACKER OS
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Payment Intelligence
        </div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 3 }}>
          Track every disbursement, appeal, and document — all in one place.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '1px solid var(--border-subtle)' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flexShrink: 0, padding: '9px 14px',
              background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--gold)' : 'var(--text-tertiary)',
              fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: activeTab === tab.id ? 700 : 400,
              cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap',
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ animation: 'fadeInUp 0.25s ease' }}>
        {activeTab === 'overview' && (
          <OverviewTab budget={budget} disbursements={disbursements} onSeed={handleSeed} />
        )}
        {activeTab === 'disbursements' && (
          <DisbursementsTab disbursements={disbursements} onUpdate={load} />
        )}
        {activeTab === 'appeals' && (
          <AppealsTab appeals={appeals} onUpdate={load} />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab documents={documents} userId={userId} onUpdate={load} />
        )}
        {activeTab === 'guide' && (
          <GuideTab />
        )}
      </div>
    </div>
  )
}
