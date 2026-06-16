'use client'

import { useState, useEffect, useCallback } from 'react'

interface Payment { id: string; amount: number; date: string; note?: string }

interface FeeRecord {
  id: string
  academic_year: number
  institution: string | null
  total_fees: number
  amount_paid: number
  block_threshold: number | null
  payment_plan: string | null
  next_payment_amount: number | null
  next_payment_date: string | null
  payments: Payment[]
}

const YEAR = new Date().getFullYear()

function fmtR(n: number): string {
  return 'R' + Math.round(n).toLocaleString('en-ZA')
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

const card: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 14,
  padding: '14px 16px',
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: 'var(--bg-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
}

export default function FeeBlockTracker({ userId }: { userId: string }) {
  const [rec, setRec] = useState<FeeRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Account setup form
  const [form, setForm] = useState({
    institution: '', total_fees: '', amount_paid: '', block_threshold: '',
    payment_plan: '', next_payment_amount: '', next_payment_date: '',
  })

  // Payment log form
  const [payOpen, setPayOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [payNote, setPayNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/budget/fees?year=${YEAR}`)
      const data = await res.json()
      if (data.record) {
        setRec(data.record)
      } else {
        setRec(null)
        setEditing(true)
      }
    } catch {
      setError('Could not load fee record')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  // Prime the edit form when opening with an existing record
  useEffect(() => {
    if (editing && rec) {
      setForm({
        institution: rec.institution ?? '',
        total_fees: String(rec.total_fees || ''),
        amount_paid: String(rec.amount_paid || ''),
        block_threshold: rec.block_threshold != null ? String(rec.block_threshold) : '',
        payment_plan: rec.payment_plan ?? '',
        next_payment_amount: rec.next_payment_amount != null ? String(rec.next_payment_amount) : '',
        next_payment_date: rec.next_payment_date ?? '',
      })
    }
  }, [editing, rec])

  async function saveAccount() {
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/budget/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academic_year: YEAR, ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setRec(data.record)
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function logPayment() {
    const amt = parseFloat(payAmount)
    if (!amt || amt <= 0) { setError('Enter a payment amount'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/budget/fees?action=pay', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academic_year: YEAR, amount: amt, date: payDate, note: payNote }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not log payment')
      setRec(data.record)
      setPayOpen(false); setPayAmount(''); setPayNote('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not log payment')
    } finally {
      setSaving(false)
    }
  }

  async function removePayment(pid: string) {
    setSaving(true)
    try {
      const res = await fetch('/api/budget/fees?action=unpay', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academic_year: YEAR, payment_id: pid }),
      })
      const data = await res.json()
      if (res.ok) setRec(data.record)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading fee record…</div>
  }

  /* ── Setup / edit form ── */
  if (editing) {
    const fields: { k: keyof typeof form; label: string; ph: string; type?: string }[] = [
      { k: 'institution', label: 'Institution (optional)', ph: 'e.g. University of Johannesburg' },
      { k: 'total_fees', label: `Total fees billed for ${YEAR} (R)`, ph: '52000', type: 'number' },
      { k: 'amount_paid', label: 'Amount paid so far (R)', ph: '15000', type: 'number' },
      { k: 'block_threshold', label: 'Fee-block threshold (R) — optional', ph: 'e.g. 10000' },
      { k: 'next_payment_amount', label: 'Next payment amount (R) — optional', ph: '3000', type: 'number' },
      { k: 'next_payment_date', label: 'Next payment date — optional', ph: '', type: 'date' },
    ]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ ...card, background: 'var(--gold-dim, rgba(245,158,11,0.08))', borderColor: 'var(--gold-border, rgba(245,158,11,0.25))' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            🎓 Track what you owe your university for {YEAR}. Many SA institutions <strong>block your results, registration or graduation</strong> if your outstanding balance is too high — knowing the number is the first step to not getting caught out.
          </div>
        </div>

        {fields.map(f => (
          <div key={f.k}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>{f.label}</label>
            <input
              type={f.type || 'text'}
              inputMode={f.type === 'number' ? 'decimal' : undefined}
              value={form[f.k]}
              placeholder={f.ph}
              onChange={e => setForm(v => ({ ...v, [f.k]: e.target.value }))}
              style={input}
            />
          </div>
        ))}

        <div>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Payment arrangement notes (optional)</label>
          <textarea
            value={form.payment_plan}
            placeholder="e.g. R3000/month debit order agreed with finance dept"
            onChange={e => setForm(v => ({ ...v, payment_plan: e.target.value }))}
            rows={2}
            style={{ ...input, resize: 'none', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}
          />
        </div>

        {error && <div style={{ fontSize: '0.72rem', color: 'var(--danger, #ef4444)' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={saveAccount} disabled={saving} style={{
            flex: 1, padding: '11px 0', background: 'var(--gold, #f59e0b)', border: 'none', borderRadius: 10,
            color: '#0a0a0f', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'var(--font-mono)', cursor: 'pointer',
          }}>{saving ? 'Saving…' : 'Save fee record'}</button>
          {rec && (
            <button onClick={() => { setEditing(false); setError(null) }} style={{
              padding: '11px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 10,
              color: 'var(--text-tertiary)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', cursor: 'pointer',
            }}>Cancel</button>
          )}
        </div>
      </div>
    )
  }

  if (!rec) return null

  /* ── Dashboard ── */
  const outstanding = Math.max(0, rec.total_fees - rec.amount_paid)
  const paidPct = rec.total_fees > 0 ? Math.min(100, (rec.amount_paid / rec.total_fees) * 100) : 0
  const threshold = rec.block_threshold

  // Block status
  let blockState: 'clear' | 'watch' | 'risk' | 'blocked' = 'clear'
  let blockMsg = ''
  let blockColor = 'var(--teal, #4ecf9e)'
  if (threshold != null) {
    if (outstanding > threshold) {
      blockState = 'blocked'; blockColor = 'var(--danger, #ef4444)'
      blockMsg = `Your balance is ${fmtR(outstanding - threshold)} over the block threshold. Results, registration or graduation may be withheld until you pay this down.`
    } else if (outstanding > threshold * 0.8) {
      blockState = 'risk'; blockColor = '#f59e0b'
      blockMsg = `You're within ${fmtR(threshold - outstanding)} of the block threshold. Plan a payment before you cross it.`
    } else {
      blockState = 'clear'; blockColor = 'var(--teal, #4ecf9e)'
      blockMsg = `You can owe up to ${fmtR(threshold - outstanding)} more before hitting the block threshold.`
    }
  }

  const npDays = rec.next_payment_date ? daysUntil(rec.next_payment_date) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Outstanding hero */}
      <div style={{ ...card, textAlign: 'center', borderColor: outstanding > 0 ? 'var(--border-default)' : 'rgba(78,207,158,0.3)' }}>
        <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 6 }}>
          OUTSTANDING · {rec.academic_year}{rec.institution ? ` · ${rec.institution}` : ''}
        </div>
        <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: outstanding > 0 ? 'var(--text-primary)' : 'var(--teal, #4ecf9e)', lineHeight: 1 }}>
          {fmtR(outstanding)}
        </div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 6 }}>
          {fmtR(rec.amount_paid)} paid of {fmtR(rec.total_fees)}
        </div>
        {/* Progress bar */}
        <div style={{ height: 8, background: 'var(--bg-base)', borderRadius: 100, marginTop: 12, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${paidPct}%`, background: 'var(--teal, #4ecf9e)', borderRadius: 100, transition: 'width 0.4s' }} />
        </div>
        <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 4 }}>{Math.round(paidPct)}% settled</div>
      </div>

      {/* Block status */}
      {threshold != null && (
        <div style={{
          ...card,
          borderColor: `${blockColor}40`,
          background: `${blockColor}0d`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: '1.1rem' }}>{blockState === 'blocked' ? '🚫' : blockState === 'risk' ? '⚠️' : '✅'}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: blockColor }}>
              {blockState === 'blocked' ? 'Block risk — over threshold' : blockState === 'risk' ? 'Approaching block threshold' : 'Clear of block threshold'}
            </span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{blockMsg}</div>
          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', marginTop: 6 }}>Threshold: {fmtR(threshold)} outstanding</div>
        </div>
      )}

      {/* Next payment */}
      {(rec.next_payment_amount || rec.next_payment_date) && (
        <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 2 }}>NEXT PAYMENT</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {rec.next_payment_amount ? fmtR(rec.next_payment_amount) : 'Scheduled'}
            </div>
          </div>
          {npDays != null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: npDays < 0 ? 'var(--danger, #ef4444)' : npDays <= 7 ? '#f59e0b' : 'var(--text-secondary)' }}>
                {npDays < 0 ? `${Math.abs(npDays)}d overdue` : npDays === 0 ? 'Due today' : `in ${npDays}d`}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{rec.next_payment_date}</div>
            </div>
          )}
        </div>
      )}

      {/* Payment arrangement */}
      {rec.payment_plan && (
        <div style={{ ...card }}>
          <div style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 4 }}>ARRANGEMENT</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rec.payment_plan}</div>
        </div>
      )}

      {/* Log a payment */}
      {payOpen ? (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-primary)' }}>Log a payment</div>
          <input type="number" inputMode="decimal" placeholder="Amount (R)" value={payAmount} onChange={e => setPayAmount(e.target.value)} style={input} />
          <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} style={input} />
          <input type="text" placeholder="Note (optional) — e.g. EFT, bursary top-up" value={payNote} onChange={e => setPayNote(e.target.value)} style={input} />
          {error && <div style={{ fontSize: '0.72rem', color: 'var(--danger, #ef4444)' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={logPayment} disabled={saving} style={{ flex: 1, padding: '10px 0', background: 'var(--teal, #4ecf9e)', border: 'none', borderRadius: 9, color: '#0a0a0f', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>{saving ? 'Saving…' : 'Add payment'}</button>
            <button onClick={() => { setPayOpen(false); setError(null) }} style={{ padding: '10px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 9, color: 'var(--text-tertiary)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setPayOpen(true)} style={{ padding: '11px 0', background: 'rgba(78,207,158,0.1)', border: '1px solid rgba(78,207,158,0.25)', borderRadius: 12, color: 'var(--teal, #4ecf9e)', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
          + Log a payment
        </button>
      )}

      {/* Payment history */}
      {rec.payments.length > 0 && (
        <div style={{ ...card, padding: '8px 0' }}>
          <div style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', padding: '4px 16px 8px' }}>PAYMENT HISTORY</div>
          {rec.payments.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{fmtR(p.amount)}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{p.date}{p.note ? ` · ${p.note}` : ''}</div>
              </div>
              <button onClick={() => removePayment(p.id)} disabled={saving} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* SA guidance */}
      <details style={{ ...card }}>
        <summary style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
          🇿🇦 Struggling to pay? Your options
        </summary>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          <div><strong style={{ color: 'var(--text-primary)' }}>Payment arrangement:</strong> Almost every SA university finance department will agree to a monthly instalment plan. Ask before they block you — it&apos;s much harder to negotiate after.</div>
          <div><strong style={{ color: 'var(--text-primary)' }}>Hardship / appeal funds:</strong> Many institutions have a Student Financial Aid hardship fund or a fee appeals committee for students in genuine difficulty. The SRC office can point you to it.</div>
          <div><strong style={{ color: 'var(--text-primary)' }}>NSFAS shortfall:</strong> If you&apos;re NSFAS-funded but still owe, you may have a registration/historic-debt gap. Check the NSFAS tab and raise it with financial aid.</div>
          <div><strong style={{ color: 'var(--text-primary)' }}>Don&apos;t ignore it:</strong> Blocks compound — unpaid fees can stop you registering next year and withhold your qualification even after you finish. Engage early.</div>
        </div>
      </details>

      <button onClick={() => setEditing(true)} style={{ padding: '9px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-tertiary)', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
        Edit fee details
      </button>
    </div>
  )
}
