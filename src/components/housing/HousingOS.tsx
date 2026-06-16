'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Payment { id: string; amount: number; date: string; note?: string }

interface Place {
  id: string
  place_type: 'res' | 'digs' | 'private' | 'home' | 'commune'
  name: string | null
  monthly_rent: number
  deposit: number | null
  landlord_name: string | null
  landlord_contact: string | null
  lease_start: string | null
  lease_end: string | null
  is_nsfas_accredited: boolean
  includes_utilities: boolean
  num_housemates: number
  rent_due_day: number | null
  notes: string | null
  rent_payments: Payment[]
}

type Tab = 'place' | 'kit' | 'settle' | 'admin' | 'split' | 'checklist'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'place', label: 'My Place', icon: '🏠' },
  { id: 'kit', label: 'Starter Kit', icon: '🎒' },
  { id: 'settle', label: 'Settling In', icon: '🌱' },
  { id: 'admin', label: 'Life Admin', icon: '🧰' },
  { id: 'split', label: 'Split', icon: '🧮' },
  { id: 'checklist', label: 'Before You Sign', icon: '📋' },
]

const PLACE_LABELS: Record<Place['place_type'], string> = {
  res: 'University Res', digs: 'Digs / Shared', private: 'Private Rental', home: 'Living at Home', commune: 'Commune',
}

function fmtR(n: number): string {
  return 'R' + Math.round(n).toLocaleString('en-ZA')
}

function daysUntilDueDay(due: number): number {
  const today = new Date()
  const y = today.getFullYear(), m = today.getMonth(), d = today.getDate()
  const lastDay = new Date(y, m + 1, 0).getDate()
  const thisMonthDue = Math.min(due, lastDay)
  if (d <= thisMonthDue) return thisMonthDue - d
  const nextLast = new Date(y, m + 2, 0).getDate()
  const nextDue = Math.min(due, nextLast)
  return (lastDay - d) + nextDue
}

const card: React.CSSProperties = {
  background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '14px 16px',
}
const input: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)',
  borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem',
}
const ACCENT = '#06B6D4'

/* ───────────────────────── My Place ───────────────────────── */
function MyPlaceTab() {
  const [rec, setRec] = useState<Place | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    place_type: 'digs', name: '', monthly_rent: '', deposit: '', landlord_name: '', landlord_contact: '',
    lease_start: '', lease_end: '', is_nsfas_accredited: false, includes_utilities: false,
    num_housemates: '', rent_due_day: '', notes: '',
  })

  const [payOpen, setPayOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [payNote, setPayNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/housing')
      const data = await res.json()
      if (data.record) setRec(data.record)
      else { setRec(null); setEditing(true) }
    } catch { setError('Could not load your place') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (editing && rec) {
      setForm({
        place_type: rec.place_type, name: rec.name ?? '', monthly_rent: String(rec.monthly_rent || ''),
        deposit: rec.deposit != null ? String(rec.deposit) : '', landlord_name: rec.landlord_name ?? '',
        landlord_contact: rec.landlord_contact ?? '', lease_start: rec.lease_start ?? '', lease_end: rec.lease_end ?? '',
        is_nsfas_accredited: rec.is_nsfas_accredited, includes_utilities: rec.includes_utilities,
        num_housemates: rec.num_housemates ? String(rec.num_housemates) : '',
        rent_due_day: rec.rent_due_day != null ? String(rec.rent_due_day) : '', notes: rec.notes ?? '',
      })
    }
  }, [editing, rec])

  async function save() {
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/housing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setRec(data.record); setEditing(false)
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') }
    finally { setSaving(false) }
  }

  async function logPayment() {
    const amt = parseFloat(payAmount)
    if (!amt || amt <= 0) { setError('Enter an amount'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/housing?action=pay', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, date: payDate, note: payNote }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not log payment')
      setRec(data.record); setPayOpen(false); setPayAmount(''); setPayNote('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not log payment') }
    finally { setSaving(false) }
  }

  async function removePayment(pid: string) {
    setSaving(true)
    try {
      const res = await fetch('/api/housing?action=unpay', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_id: pid }),
      })
      const data = await res.json()
      if (res.ok) setRec(data.record)
    } finally { setSaving(false) }
  }

  if (loading) return <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading…</div>

  if (editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Type of place</label>
          <select value={form.place_type} onChange={e => setForm(v => ({ ...v, place_type: e.target.value }))} style={input}>
            {Object.entries(PLACE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        {([
          { k: 'name', label: 'Name / address', ph: 'e.g. 12 Smit St, Braamfontein' },
          { k: 'monthly_rent', label: 'Monthly rent (R)', ph: '3500', type: 'number' },
          { k: 'deposit', label: 'Deposit paid (R) — optional', ph: '3500', type: 'number' },
          { k: 'rent_due_day', label: 'Rent due day of month (1–31) — optional', ph: '1', type: 'number' },
          { k: 'num_housemates', label: 'Number of housemates (excl. you) — optional', ph: '2', type: 'number' },
          { k: 'landlord_name', label: 'Landlord / agent name — optional', ph: 'Mr Dlamini' },
          { k: 'landlord_contact', label: 'Landlord contact — optional', ph: '082 123 4567' },
          { k: 'lease_start', label: 'Lease start — optional', type: 'date' },
          { k: 'lease_end', label: 'Lease end — optional', type: 'date' },
        ] as const).map(f => (
          <div key={f.k}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>{f.label}</label>
            <input type={('type' in f ? f.type : 'text')} inputMode={('type' in f && f.type === 'number') ? 'decimal' : undefined}
              value={form[f.k]} placeholder={'ph' in f ? f.ph : ''} onChange={e => setForm(v => ({ ...v, [f.k]: e.target.value }))} style={input} />
          </div>
        ))}
        {[
          { k: 'is_nsfas_accredited' as const, label: 'NSFAS-accredited accommodation' },
          { k: 'includes_utilities' as const, label: 'Rent includes utilities (water/lights/wifi)' },
        ].map(c => (
          <button key={c.k} onClick={() => setForm(v => ({ ...v, [c.k]: !v[c.k] }))} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-base)',
            border: '1px solid var(--border-default)', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${form[c.k] ? ACCENT : 'var(--border-default)'}`, background: form[c.k] ? ACCENT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#0a0a0f', fontSize: '0.7rem', fontWeight: 900 }}>{form[c.k] ? '✓' : ''}</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{c.label}</span>
          </button>
        ))}
        <div>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Notes — optional</label>
          <textarea value={form.notes} placeholder="e.g. shared kitchen, no prepaid meter, landlord slow to fix things" rows={2}
            onChange={e => setForm(v => ({ ...v, notes: e.target.value }))} style={{ ...input, resize: 'none', fontFamily: 'var(--font-body)', lineHeight: 1.5 }} />
        </div>
        {error && <div style={{ fontSize: '0.72rem', color: 'var(--danger, #ef4444)' }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={saving} style={{ flex: 1, padding: '11px 0', background: ACCENT, border: 'none', borderRadius: 10, color: '#04181c', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save my place'}</button>
          {rec && <button onClick={() => { setEditing(false); setError(null) }} style={{ padding: '11px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-tertiary)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>Cancel</button>}
        </div>
      </div>
    )
  }

  if (!rec) return null

  const dueDays = rec.rent_due_day ? daysUntilDueDay(rec.rent_due_day) : null
  const thisMonth = new Date().toISOString().slice(0, 7)
  const paidThisMonth = rec.rent_payments
    .filter(p => p.date.startsWith(thisMonth))
    .reduce((s, p) => s + p.amount, 0)
  const rentCovered = rec.monthly_rent > 0 && paidThisMonth >= rec.monthly_rent

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Hero */}
      <div style={{ ...card, borderColor: `${ACCENT}40` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: ACCENT, letterSpacing: '0.08em' }}>{PLACE_LABELS[rec.place_type].toUpperCase()}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{rec.name || 'My place'}</div>
          </div>
          {rec.is_nsfas_accredited && <span style={{ padding: '3px 8px', background: 'rgba(78,207,158,0.12)', border: '1px solid rgba(78,207,158,0.3)', borderRadius: 100, fontSize: '0.56rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--teal, #4ecf9e)' }}>NSFAS ✓</span>}
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{fmtR(rec.monthly_rent)}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>per month{rec.includes_utilities ? ' · utils incl.' : ''}</div>
          </div>
          {dueDays != null && (
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: rentCovered ? 'var(--teal, #4ecf9e)' : dueDays <= 3 ? '#f59e0b' : 'var(--text-primary)' }}>
                {rentCovered ? '✓' : dueDays === 0 ? 'today' : `${dueDays}d`}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{rentCovered ? 'rent paid' : 'until rent due'}</div>
            </div>
          )}
        </div>
      </div>

      {/* This month rent progress */}
      {rec.monthly_rent > 0 && (
        <div style={{ ...card }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: 6 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{new Date().toLocaleString('en-ZA', { month: 'long' })} rent</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: rentCovered ? 'var(--teal, #4ecf9e)' : 'var(--text-secondary)' }}>{fmtR(paidThisMonth)} / {fmtR(rec.monthly_rent)}</span>
          </div>
          <div style={{ height: 7, background: 'var(--bg-base)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, (paidThisMonth / rec.monthly_rent) * 100)}%`, background: rentCovered ? 'var(--teal, #4ecf9e)' : ACCENT, borderRadius: 100, transition: 'width 0.4s' }} />
          </div>
        </div>
      )}

      {/* Key facts */}
      <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.74rem' }}>
        {([
          rec.deposit != null && ['Deposit', fmtR(rec.deposit)],
          rec.lease_end && ['Lease ends', rec.lease_end],
          rec.landlord_name && ['Landlord', rec.landlord_name + (rec.landlord_contact ? ` · ${rec.landlord_contact}` : '')],
          rec.num_housemates > 0 && ['Housemates', `${rec.num_housemates}`],
        ].filter(Boolean) as [string, string][]).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>{k}</span>
            <span style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>{v}</span>
          </div>
        ))}
        {rec.notes && <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>{rec.notes}</div>}
      </div>

      {/* Log rent */}
      {payOpen ? (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-primary)' }}>Log a rent payment</div>
          <input type="number" inputMode="decimal" placeholder="Amount (R)" value={payAmount} onChange={e => setPayAmount(e.target.value)} style={input} />
          <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} style={input} />
          <input type="text" placeholder="Note (optional)" value={payNote} onChange={e => setPayNote(e.target.value)} style={input} />
          {error && <div style={{ fontSize: '0.72rem', color: 'var(--danger, #ef4444)' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={logPayment} disabled={saving} style={{ flex: 1, padding: '10px 0', background: ACCENT, border: 'none', borderRadius: 9, color: '#04181c', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>{saving ? 'Saving…' : 'Add payment'}</button>
            <button onClick={() => { setPayOpen(false); setError(null) }} style={{ padding: '10px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 9, color: 'var(--text-tertiary)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setPayOpen(true)} style={{ padding: '11px 0', background: `${ACCENT}1a`, border: `1px solid ${ACCENT}40`, borderRadius: 12, color: ACCENT, fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>+ Log rent payment</button>
      )}

      {rec.rent_payments.length > 0 && (
        <div style={{ ...card, padding: '8px 0' }}>
          <div style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', padding: '4px 16px 8px' }}>RENT HISTORY</div>
          {rec.rent_payments.map(p => (
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

      <button onClick={() => setEditing(true)} style={{ padding: '9px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-tertiary)', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>Edit place details</button>
    </div>
  )
}

/* ───────────────────────── Split calculator ───────────────────────── */
interface Bill { id: number; label: string; amount: string }
function SplitTab() {
  const [rent, setRent] = useState('')
  const [people, setPeople] = useState('2')
  const [bills, setBills] = useState<Bill[]>([{ id: 1, label: 'Electricity', amount: '' }])

  const n = Math.max(1, parseInt(people) || 1)
  const rentNum = parseFloat(rent) || 0
  const billsTotal = bills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0)
  const total = rentNum + billsTotal
  const perPerson = total / n

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...card, background: `${ACCENT}0d`, borderColor: `${ACCENT}40`, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        🧮 Split rent and shared bills fairly between housemates. Settle every month so nobody carries the others — and keep a record in case anyone disputes it.
      </div>
      <div>
        <label style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Total rent (R)</label>
        <input type="number" inputMode="decimal" placeholder="3500" value={rent} onChange={e => setRent(e.target.value)} style={input} />
      </div>
      <div>
        <label style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Number of people sharing</label>
        <input type="number" inputMode="numeric" min={1} value={people} onChange={e => setPeople(e.target.value)} style={input} />
      </div>

      <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Shared monthly bills</div>
        {bills.map(b => (
          <div key={b.id} style={{ display: 'flex', gap: 8 }}>
            <input value={b.label} placeholder="Bill name" onChange={e => setBills(bs => bs.map(x => x.id === b.id ? { ...x, label: e.target.value } : x))} style={{ ...input, flex: 1 }} />
            <input type="number" inputMode="decimal" value={b.amount} placeholder="R" onChange={e => setBills(bs => bs.map(x => x.id === b.id ? { ...x, amount: e.target.value } : x))} style={{ ...input, width: 90 }} />
            {bills.length > 1 && <button onClick={() => setBills(bs => bs.filter(x => x.id !== b.id))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>}
          </div>
        ))}
        <button onClick={() => setBills(bs => [...bs, { id: Date.now(), label: '', amount: '' }])} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: ACCENT, fontSize: '0.74rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>+ Add bill</button>
      </div>

      <div style={{ ...card, textAlign: 'center', borderColor: `${ACCENT}40` }}>
        <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>EACH PERSON PAYS</div>
        <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: ACCENT, lineHeight: 1.1 }}>{fmtR(perPerson)}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 4 }}>{fmtR(total)} total ÷ {n} {n === 1 ? 'person' : 'people'}</div>
      </div>
    </div>
  )
}

/* ───────────────────────── Before You Sign checklist ───────────────────────── */
const CHECK_ITEMS = [
  'I have seen the actual room/unit in person (not just photos)',
  'Water runs and there is hot water',
  'Electricity works — confirm if it is a prepaid meter and whose name it is in',
  'Doors and windows lock properly; the building/yard is secure',
  'I asked exactly what the rent includes (water, lights, wifi, refuse)',
  'I know the deposit amount and that it is refundable',
  'There is a written lease/agreement — never rely on a verbal deal',
  'The lease states the rent, deposit, notice period and who fixes what',
  'I checked the landlord/agent is legit (ask other tenants, verify ID)',
  'I took dated photos of the condition before moving in',
  'I never paid a deposit before seeing the place or signing',
  'If NSFAS-funded: the accommodation is on the accredited list',
]

const RIGHTS = [
  { t: 'Your deposit is yours', d: 'A landlord must keep your deposit in an interest-bearing account and refund it (with interest) within 14 days of you moving out, minus only proven damages. Take dated move-in and move-out photos.' },
  { t: 'A lease must be honoured', d: 'Once signed, neither side can change the rent or terms mid-lease unless the lease allows it. Get every promise in writing — verbal agreements are almost impossible to enforce.' },
  { t: 'Notice works both ways', d: 'You usually must give one calendar month written notice to leave (check your lease). The landlord must also give proper notice and cannot just lock you out or throw out your things — that is illegal.' },
  { t: 'Beware digs scams', d: 'Never pay a deposit via eWallet/cash for a place you have not seen. Scammers post fake listings, take deposits and disappear. Verify the person owns or manages the property first.' },
  { t: 'NSFAS accommodation', d: 'If NSFAS pays your accommodation allowance, your place should be on your institution’s accredited list and within the allowance cap. Landlords cannot demand extra "top-up" cash outside the agreement.' },
]

function ChecklistTab() {
  const [checked, setChecked] = useState<Record<number, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('varsityos-housing-checklist') || '{}') } catch { return {} }
  })
  const toggle = (i: number) => {
    const next = { ...checked, [i]: !checked[i] }
    setChecked(next)
    try { localStorage.setItem('varsityos-housing-checklist', JSON.stringify(next)) } catch { /* ignore */ }
  }
  const done = CHECK_ITEMS.filter((_, i) => checked[i]).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...card, background: `${ACCENT}0d`, borderColor: `${ACCENT}40` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Before you sign / move in</span>
          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: ACCENT }}>{done}/{CHECK_ITEMS.length}</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>Tick these off before you hand over any money. Saved on this device.</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {CHECK_ITEMS.map((item, i) => (
          <button key={i} onClick={() => toggle(i)} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 13px', background: 'var(--bg-surface)',
            border: `1px solid ${checked[i] ? `${ACCENT}40` : 'var(--border-subtle)'}`, borderRadius: 11, cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${checked[i] ? ACCENT : 'var(--border-default)'}`, background: checked[i] ? ACCENT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, color: '#04181c', fontSize: '0.7rem', fontWeight: 900 }}>{checked[i] ? '✓' : ''}</div>
            <span style={{ fontSize: '0.76rem', color: checked[i] ? 'var(--text-muted)' : 'var(--text-secondary)', lineHeight: 1.45, textDecoration: checked[i] ? 'line-through' : 'none' }}>{item}</span>
          </button>
        ))}
      </div>

      <div style={{ fontSize: '0.66rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.06em', marginTop: 6 }}>KNOW YOUR RIGHTS</div>
      {RIGHTS.map((r, i) => (
        <div key={i} style={{ ...card }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{r.t}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{r.d}</div>
        </div>
      ))}
      <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', lineHeight: 1.5, textAlign: 'center' }}>
        General guidance, not legal advice. For disputes, contact your campus housing office or the Rental Housing Tribunal in your province (free).
      </div>
    </div>
  )
}

/* ───────────────────────── Settling In ───────────────────────── */
const FIRST_48 = [
  'Tell someone at home you arrived safely',
  'Find the nearest shop / spaza, ATM and clinic',
  'Buy electricity — find your prepaid meter and a vendor (see Life Admin)',
  'Stock the basics: water, bread, a meal, toilet paper, soap, airtime / data',
  'Find the water shut-off tap and the DB board (trip switch) for your place',
  'Save key numbers: landlord, campus security, a neighbour, a close friend',
  'Check every door and window locks before your first night',
]
const FIRST_MONTH = [
  'Set a monthly budget — your money now has to last the whole month',
  'Cook at least one proper meal for yourself',
  'Do a full load of laundry (sooner than you think you need to)',
  'Build a daily rhythm: sleep, eat, study, rest — structure steadies you',
  'Introduce yourself to one neighbour and one person in class',
  'Find your campus clinic and counselling office before you need them',
  'Say yes to one social thing, even when you would rather hide',
]

function SettleChecklist({ storeKey, title, items }: { storeKey: string; title: string; items: string[] }) {
  const [checked, setChecked] = useState<Record<number, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(storeKey) || '{}') } catch { return {} }
  })
  const toggle = (i: number) => {
    const next = { ...checked, [i]: !checked[i] }
    setChecked(next)
    try { localStorage.setItem(storeKey, JSON.stringify(next)) } catch { /* ignore */ }
  }
  const done = items.filter((_, i) => checked[i]).length
  return (
    <div style={{ ...card, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: ACCENT }}>{done}/{items.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((item, i) => (
          <button key={i} onClick={() => toggle(i)} style={{
            display: 'flex', alignItems: 'flex-start', gap: 9, padding: '8px 4px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{ width: 17, height: 17, borderRadius: 5, border: `1.5px solid ${checked[i] ? ACCENT : 'var(--border-default)'}`, background: checked[i] ? ACCENT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, color: '#04181c', fontSize: '0.66rem', fontWeight: 900 }}>{checked[i] ? '✓' : ''}</div>
            <span style={{ fontSize: '0.75rem', color: checked[i] ? 'var(--text-muted)' : 'var(--text-secondary)', lineHeight: 1.45, textDecoration: checked[i] ? 'line-through' : 'none' }}>{item}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface AlumniLetter { id: string; display_name: string | null; course: string | null; grad_year: number | null; letter: string }

function AlumniLetters() {
  const [letters, setLetters] = useState<AlumniLetter[]>([])
  const [loaded, setLoaded] = useState(false)
  const [idx, setIdx] = useState(0)
  const [thanked, setThanked] = useState<Record<string, boolean>>({})
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replySent, setReplySent] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/alumni/bridge?letters=1')
      .then(r => r.json())
      .then(d => { if (active) { setLetters(d.letters || []); setLoaded(true) } })
      .catch(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [])

  if (!loaded || letters.length === 0) return null
  const l = letters[idx % letters.length]
  const who = l.display_name || 'An alum'
  const meta = [l.course, l.grad_year].filter(Boolean).join(' · ')

  async function react(kind: 'thank' | 'reply') {
    setBusy(true)
    try {
      const res = await fetch('/api/alumni/bridge/react', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bridge_id: l.id, kind, message: kind === 'reply' ? replyText : undefined }),
      })
      if (res.ok) {
        if (kind === 'thank') setThanked(t => ({ ...t, [l.id]: true }))
        else { setReplySent(s => ({ ...s, [l.id]: true })); setReplyOpen(false); setReplyText('') }
      }
    } finally { setBusy(false) }
  }

  function next() {
    setIdx(i => i + 1); setReplyOpen(false); setReplyText('')
  }

  return (
    <div style={{ ...card, background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.25)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>💌 From those who walked before you</span>
        {letters.length > 1 && (
          <button onClick={next} style={{ fontSize: '0.66rem', fontFamily: 'var(--font-mono)', color: ACCENT, background: 'none', border: 'none', cursor: 'pointer' }}>another →</button>
        )}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>{l.letter}</div>
      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 8 }}>— {who}{meta ? `, ${meta}` : ''}</div>

      {/* Thank / reply */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={() => react('thank')} disabled={busy || thanked[l.id]} style={{
          flex: 1, padding: '8px 0', borderRadius: 9, cursor: thanked[l.id] ? 'default' : 'pointer',
          border: `1px solid ${thanked[l.id] ? 'rgba(168,85,247,0.4)' : 'var(--border-default)'}`,
          background: thanked[l.id] ? 'rgba(168,85,247,0.12)' : 'var(--bg-base)',
          color: thanked[l.id] ? '#c4b5fd' : 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 600,
        }}>{thanked[l.id] ? '💛 Thank you sent' : '🙏 Say thanks'}</button>
        {!replySent[l.id] && (
          <button onClick={() => setReplyOpen(o => !o)} disabled={busy} style={{
            flex: 1, padding: '8px 0', borderRadius: 9, cursor: 'pointer', border: '1px solid var(--border-default)',
            background: 'var(--bg-base)', color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 600,
          }}>✍🏾 Reply</button>
        )}
        {replySent[l.id] && (
          <div style={{ flex: 1, padding: '8px 0', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Reply sent ✓</div>
        )}
      </div>
      {replyOpen && !replySent[l.id] && (
        <div style={{ marginTop: 8 }}>
          <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={2} maxLength={500}
            placeholder="Send them a line back — it means more than you know."
            style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.78rem', resize: 'none', fontFamily: 'var(--font-body)', lineHeight: 1.5 }} />
          <button onClick={() => react('reply')} disabled={busy || !replyText.trim()} style={{
            marginTop: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: ACCENT, color: '#04181c',
            fontSize: '0.74rem', fontWeight: 700, fontFamily: 'var(--font-mono)', cursor: replyText.trim() ? 'pointer' : 'default', opacity: replyText.trim() ? 1 : 0.5,
          }}>Send reply</button>
        </div>
      )}
    </div>
  )
}

function SettleTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...card, background: `${ACCENT}0d`, borderColor: `${ACCENT}40` }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>You&apos;ve got this — even if it doesn&apos;t feel like it yet</div>
        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Living away from home for the first time is one of the biggest changes you&apos;ll ever make. Feeling unsure, homesick or overwhelmed isn&apos;t weakness — almost everyone feels it, and it does ease. Take it one small step at a time. Here&apos;s how to land softly.
        </div>
      </div>

      <SettleChecklist storeKey="varsityos-housing-first48" title="🚪 Your first 48 hours" items={FIRST_48} />
      <SettleChecklist storeKey="varsityos-housing-firstmonth" title="📅 Your first month" items={FIRST_MONTH} />

      {/* Homesickness */}
      <div style={{ ...card }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>💛 Homesickness is normal</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          It often hits hardest in the first few weeks and after the excitement fades — then slowly settles as the new place starts to feel like yours. What helps:
        </div>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            'Call home on a rhythm (e.g. every second evening) rather than every hour — it helps you settle here.',
            "Bring or keep something from home: a photo, a blanket, a recipe, your gran's voice note.",
            'Build small daily routines — they make a strange place feel safe.',
            'Eat properly and sleep enough. Low food and low sleep make everything feel worse.',
            'Say yes to one social thing a week, even a small one. Connection is the cure for loneliness.',
          ].map((t, i) => (
            <li key={i} style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t}</li>
          ))}
        </ul>
      </div>

      {/* Ubuntu line */}
      <div style={{ ...card, textAlign: 'center', background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.25)' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
          You are not doing this alone. Your people back home are still your people — and the friends, neighbours and classmates here are becoming new ones. <strong style={{ color: 'var(--text-primary)' }}>Umuntu ngumuntu ngabantu.</strong>
        </div>
      </div>

      {/* Letters left by alumni who were once exactly here */}
      <AlumniLetters />

      {/* When it's more than homesickness */}
      <div style={{ ...card, borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>🚩 When it&apos;s more than settling in</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          If for two weeks or more you feel hopeless, can&apos;t get out of bed, stop eating, cry most days, can&apos;t face class — or you ever think about hurting yourself — that is <strong style={{ color: 'var(--text-primary)' }}>not weakness and not just adjusting</strong>. Please reach out. It helps, and you deserve support.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          <a href="tel:0800456789" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 9, textDecoration: 'none' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>SADAG — free, 24/7</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>0800 456 789</span>
          </a>
          <Link href="/regulate" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 9, textDecoration: 'none' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Write it out in your private journal</span>
            <span style={{ fontSize: '0.74rem', color: ACCENT }}>Open →</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── Life Admin ───────────────────────── */
const GUIDES: { icon: string; title: string; points: string[]; link?: { href: string; label: string } }[] = [
  {
    icon: '🔌', title: 'Prepaid electricity',
    points: [
      "Most student places run on a prepaid meter — no token loaded means no lights. It won't warn you politely; it just cuts.",
      'Buy tokens from your banking app, an ATM, most supermarkets and spazas, or a vendor USSD line on your phone.',
      'You get a 20-digit number. Punch it into the meter keypad and press enter — units load straight away.',
      'Always keep a small buffer loaded. Running out at 11pm in winter is miserable and sometimes unsafe.',
      "Load shedding is different — that's a scheduled cut, not your meter. Check the load-shedding widget on your dashboard.",
    ],
  },
  {
    icon: '🚰', title: 'Water & plumbing',
    points: [
      'Know where your main tap (stopcock) is so you can shut the water if a pipe bursts or a toilet overflows.',
      "No water at all? It's usually a municipal cut or an unpaid bill — ask the landlord or neighbours before panicking.",
      'A slow drain usually clears with boiling water or a cheap plunger before you need to call anyone.',
      'Keep a few bottles filled for cuts — they often come with little warning.',
    ],
  },
  {
    icon: '🧺', title: 'Laundry without stress',
    points: [
      'Separate lights from darks, and keep anything new and red away from everything (it bleeds).',
      'No machine? Hand-wash in a basin with a little washing powder, rinse well, wring out, hang to dry.',
      "Don't let it pile up — a weekly wash beats a mountain, and damp clothes go mouldy and smell.",
      "Dry outside if you can; indoors, hang near an open window so your room doesn't get damp.",
    ],
  },
  {
    icon: '🧹', title: 'Keeping your space liveable',
    points: [
      'A tidy space genuinely lifts your mood and helps you study — mess and low mood feed each other.',
      'A simple rhythm: dishes daily, bin out before it smells, floors and surfaces weekly, bathroom weekly.',
      'Store food covered and sealed — open food brings cockroaches, ants and mice fast.',
      '15 minutes a day beats a dreaded three-hour clean once a month.',
    ],
  },
  {
    icon: '🍳', title: 'Eating when broke & tired',
    points: [
      "You don't need to be a chef. Rotate three easy meals: eggs and bread, pap with soup or veg, rice or pasta with a tin of fish or beans.",
      'Cook once, eat twice — make extra and keep leftovers covered in the fridge (eat within 2–3 days).',
      'Smell and look before eating leftovers; when in doubt, throw it out. Food poisoning alone is rough.',
      'Full meal plans, grocery lists and cheap recipes live in Meals OS.',
    ],
    link: { href: '/meals', label: 'Open Meals OS' },
  },
  {
    icon: '🤒', title: 'Being sick on your own',
    points: [
      'Keep a tiny kit: paracetamol, rehydrate sachets, plasters, and a thermometer if you can.',
      "Rest, fluids and time fix most things. Tell someone you're sick so a person knows to check on you.",
      "Go to the campus clinic for a fever that won't break, a wound, or anything that scares you.",
      'Emergency — struggling to breathe, chest pain, heavy bleeding, fainting: call 10177 or get to a hospital.',
    ],
    link: { href: '/health', label: 'Open Health' },
  },
  {
    icon: '💸', title: 'Making money last a month',
    points: [
      "The trick: take your money for the month, subtract rent and transport, then divide what's left by the number of weeks.",
      'Needs before wants — food, transport and electricity come before takeaways and going out.',
      "Don't lend money you can't afford to lose, even to friends. \"Next week\" often doesn't come.",
      'Track it so the end of the month never ambushes you.',
    ],
    link: { href: '/budget', label: 'Open Budget OS' },
  },
  {
    icon: '🔐', title: 'Staying safe somewhere new',
    points: [
      'Lock up every single time, even for a quick shop run. Most break-ins are opportunistic.',
      "Don't broadcast that you live alone or are new in town — not online, not to strangers.",
      'Learn your routes in daylight first, and trust your gut: if a place or person feels wrong, leave.',
      "Save campus security and use Safe Walk when you're heading home after dark.",
    ],
    link: { href: '/safety', label: 'Open Safety' },
  },
]

const NUMBERS: [string, string][] = [
  ['Ambulance / medical', '10177'],
  ['Police (national)', '10111'],
  ['All emergencies (from a cell)', '112'],
  ['SADAG mental health, 24/7', '0800456789'],
  ['GBV Command Centre', '0800428428'],
]

function LifeAdminTab() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ ...card, background: `${ACCENT}0d`, borderColor: `${ACCENT}40`, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        🧰 The stuff nobody sits you down and teaches — until you&apos;re standing in the dark wondering why the lights went off. No shame in not knowing yet. Tap each one.
      </div>

      {GUIDES.map((g, i) => (
        <div key={i} style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <button onClick={() => setOpen(open === i ? null : i)} style={{
            display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '13px 15px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
          }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{g.icon}</span>
            <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{g.title}</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          </button>
          {open === i && (
            <div style={{ padding: '0 15px 14px' }}>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {g.points.map((p, j) => (
                  <li key={j} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{p}</li>
                ))}
              </ul>
              {g.link && (
                <Link href={g.link.href} style={{ display: 'inline-block', marginTop: 10, fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: ACCENT, textDecoration: 'none' }}>
                  {g.link.label} →
                </Link>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Important numbers */}
      <div style={{ ...card, padding: '12px 0' }}>
        <div style={{ fontSize: '0.66rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.06em', padding: '0 15px 8px' }}>SAVE THESE NUMBERS NOW</div>
        {NUMBERS.map(([label, num]) => (
          <a key={num} href={`tel:${num}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 15px', borderTop: '1px solid var(--border-subtle)', textDecoration: 'none' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: ACCENT }}>{num.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────── First-Year Starter Kit ───────────────────────── */
type Pri = 'essential' | 'recommended' | 'optional'
interface KitItem { name: string; est: number; pri: Pri; tip?: string }
interface KitCat { icon: string; title: string; note?: string; items: KitItem[] }

const KIT: KitCat[] = [
  {
    icon: '🛏️', title: 'Bedding & sleep',
    items: [
      { name: 'Single duvet + inner', est: 280, pri: 'essential', tip: 'Pep / Mr Price Home are cheapest' },
      { name: 'Fitted sheets ×2', est: 150, pri: 'essential' },
      { name: 'Pillow + 2 pillowcases', est: 120, pri: 'essential' },
      { name: 'Warm blanket', est: 150, pri: 'essential', tip: 'Winter res rooms get cold' },
      { name: 'Bath towels ×2', est: 120, pri: 'essential' },
    ],
  },
  {
    icon: '🍳', title: 'Kitchen & eating',
    note: 'Check what your res / digs already provides first — don’t double-buy.',
    items: [
      { name: '2-plate stove', est: 350, pri: 'essential', tip: 'Only if not provided' },
      { name: 'Pot + frying pan', est: 200, pri: 'essential' },
      { name: 'Plate, bowl, mug, glass', est: 90, pri: 'essential' },
      { name: 'Knife, fork, spoon set', est: 60, pri: 'essential' },
      { name: 'Sharp knife + cutting board', est: 80, pri: 'recommended' },
      { name: 'Kettle', est: 200, pri: 'essential' },
      { name: 'Food containers (leftovers)', est: 60, pri: 'recommended' },
      { name: 'Can opener', est: 25, pri: 'recommended' },
      { name: 'Dish cloth + scourer', est: 30, pri: 'essential' },
    ],
  },
  {
    icon: '🧼', title: 'Bathroom & toiletries',
    items: [
      { name: 'Toothbrush + toothpaste', est: 45, pri: 'essential' },
      { name: 'Soap / body wash + shampoo', est: 80, pri: 'essential' },
      { name: 'Toilet paper (multipack)', est: 60, pri: 'essential' },
      { name: 'Deodorant', est: 35, pri: 'essential' },
      { name: 'Sanitary products', est: 60, pri: 'essential', tip: 'If needed' },
      { name: 'Basic first-aid (plasters, paracetamol, rehydrate)', est: 90, pri: 'recommended' },
    ],
  },
  {
    icon: '🧹', title: 'Cleaning',
    note: 'Split the big stuff with a roommate — you don’t each need a broom.',
    items: [
      { name: 'All-purpose cleaner', est: 40, pri: 'essential' },
      { name: 'Dishwashing liquid', est: 30, pri: 'essential' },
      { name: 'Washing powder', est: 60, pri: 'essential' },
      { name: 'Broom + dustpan', est: 70, pri: 'recommended', tip: 'Share with roommate' },
      { name: 'Bin + bin bags', est: 60, pri: 'recommended' },
    ],
  },
  {
    icon: '🔌', title: 'Study & tech',
    items: [
      { name: 'Notebooks + pens', est: 90, pri: 'essential' },
      { name: 'Backpack', est: 200, pri: 'essential' },
      { name: 'Charger + multiplug / extension', est: 120, pri: 'essential', tip: 'Lifesaver during load shedding' },
      { name: 'Power bank', est: 250, pri: 'recommended', tip: 'Charge phone when power is out' },
      { name: 'Laptop / tablet', est: 0, pri: 'recommended', tip: 'Ask about NSFAS device or a campus loan scheme' },
      { name: 'Desk lamp', est: 100, pri: 'optional' },
    ],
  },
  {
    icon: '🍲', title: 'First grocery shop (starter pantry)',
    note: 'Roughly a week of basics to land with so you’re never stuck with nothing.',
    items: [
      { name: 'Maize meal (pap)', est: 40, pri: 'essential' },
      { name: 'Rice / pasta', est: 40, pri: 'essential' },
      { name: 'Bread', est: 20, pri: 'essential' },
      { name: 'Eggs (½ dozen+)', est: 40, pri: 'essential' },
      { name: 'Tinned fish / beans ×3', est: 60, pri: 'essential' },
      { name: 'Cooking oil', est: 45, pri: 'essential' },
      { name: 'Salt + a spice (e.g. Aromat)', est: 40, pri: 'recommended' },
      { name: 'Tea / coffee + sugar', est: 80, pri: 'recommended' },
      { name: 'Long-life milk', est: 20, pri: 'recommended' },
      { name: 'Onions, potatoes, tomatoes', est: 60, pri: 'essential' },
    ],
  },
]

// Documents to bring — not money, a separate "sort this" checklist
const KIT_DOCS = [
  'Certified copy of your ID',
  'Proof of registration / acceptance letter',
  'NSFAS or bursary confirmation',
  'Bank card + banking app set up',
  'Proof of residence / signed lease',
  'A few passport photos',
  'Emergency contacts written on paper (in case your phone dies)',
]

const PRI_META: Record<Pri, { label: string; color: string }> = {
  essential: { label: 'Need', color: '#ef4444' },
  recommended: { label: 'Soon', color: '#f59e0b' },
  optional: { label: 'Nice', color: 'var(--text-muted)' },
}

function KitTab() {
  const [have, setHave] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('varsityos-starter-kit') || '{}') } catch { return {} }
  })
  const [essentialsOnly, setEssentialsOnly] = useState(false)

  const toggle = (key: string) => {
    const next = { ...have, [key]: !have[key] }
    setHave(next)
    try { localStorage.setItem('varsityos-starter-kit', JSON.stringify(next)) } catch { /* ignore */ }
  }

  // Totals from cost items still needed (not yet ticked as "have")
  let stillAll = 0, stillEssential = 0, fullTotal = 0
  for (let ci = 0; ci < KIT.length; ci++) {
    for (let ii = 0; ii < KIT[ci].items.length; ii++) {
      const it = KIT[ci].items[ii]
      fullTotal += it.est
      if (!have[`${ci}-${ii}`]) {
        stillAll += it.est
        if (it.pri === 'essential') stillEssential += it.est
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...card, background: `${ACCENT}0d`, borderColor: `${ACCENT}40`, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        🎒 Everything you actually need to move into res or digs, with rough rand prices. Tick what you already have or have bought — the total updates so you can budget the rest. Buy cheap (Pep, Shoprite, Mr Price Home, second-hand) and share big items with a roommate.
      </div>

      {/* Live totals */}
      <div style={{ ...card, display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#ef4444' }}>{fmtR(stillEssential)}</div>
          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>ESSENTIALS LEFT</div>
        </div>
        <div style={{ width: 1, background: 'var(--border-subtle)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: ACCENT }}>{fmtR(stillAll)}</div>
          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>EVERYTHING LEFT</div>
        </div>
        <div style={{ width: 1, background: 'var(--border-subtle)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{fmtR(fullTotal)}</div>
          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>FULL KIT</div>
        </div>
      </div>

      <button onClick={() => setEssentialsOnly(v => !v)} style={{
        alignSelf: 'flex-start', padding: '6px 12px', background: essentialsOnly ? `${ACCENT}1a` : 'transparent',
        border: `1px solid ${essentialsOnly ? `${ACCENT}40` : 'var(--border-subtle)'}`, borderRadius: 100,
        color: essentialsOnly ? ACCENT : 'var(--text-tertiary)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', cursor: 'pointer',
      }}>
        {essentialsOnly ? '● Essentials only' : '○ Show essentials only'}
      </button>

      {KIT.map((cat, ci) => {
        const items = cat.items.map((it, ii) => ({ it, ii })).filter(({ it }) => !essentialsOnly || it.pri === 'essential')
        if (items.length === 0) return null
        return (
          <div key={ci} style={{ ...card, padding: '12px 0' }}>
            <div style={{ padding: '0 15px 8px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{cat.icon} {cat.title}</div>
              {cat.note && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.4 }}>{cat.note}</div>}
            </div>
            {items.map(({ it, ii }) => {
              const key = `${ci}-${ii}`
              const got = !!have[key]
              return (
                <button key={key} onClick={() => toggle(key)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 15px',
                  background: 'none', border: 'none', borderTop: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${got ? ACCENT : 'var(--border-default)'}`, background: got ? ACCENT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#04181c', fontSize: '0.7rem', fontWeight: 900 }}>{got ? '✓' : ''}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', color: got ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: got ? 'line-through' : 'none' }}>{it.name}</div>
                    {it.tip && <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 1 }}>{it.tip}</div>}
                  </div>
                  {it.pri === 'essential' && !got && (
                    <span style={{ fontSize: '0.5rem', fontFamily: 'var(--font-mono)', color: PRI_META.essential.color, border: `1px solid ${PRI_META.essential.color}40`, borderRadius: 100, padding: '1px 6px', flexShrink: 0 }}>NEED</span>
                  )}
                  <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: got ? 'var(--text-muted)' : 'var(--text-secondary)', flexShrink: 0 }}>
                    {it.est > 0 ? fmtR(it.est) : '—'}
                  </span>
                </button>
              )
            })}
          </div>
        )
      })}

      {/* Documents to bring */}
      <div style={{ ...card, padding: '12px 0' }}>
        <div style={{ padding: '0 15px 8px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>📄 Documents to bring</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>Not things to buy — things to sort before you leave home.</div>
        </div>
        {KIT_DOCS.map((doc, i) => {
          const key = `doc-${i}`
          const got = !!have[key]
          return (
            <button key={key} onClick={() => toggle(key)} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', padding: '9px 15px',
              background: 'none', border: 'none', borderTop: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${got ? ACCENT : 'var(--border-default)'}`, background: got ? ACCENT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, color: '#04181c', fontSize: '0.7rem', fontWeight: 900 }}>{got ? '✓' : ''}</div>
              <span style={{ fontSize: '0.78rem', color: got ? 'var(--text-muted)' : 'var(--text-secondary)', lineHeight: 1.45, textDecoration: got ? 'line-through' : 'none' }}>{doc}</span>
            </button>
          )
        })}
      </div>

      <div style={{ ...card, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        💡 <strong style={{ color: 'var(--text-primary)' }}>On a tight budget?</strong> Start with essentials only, buy the rest over your first month, and check campus second-hand groups, donation drives and the SRC — many run starter packs for first-gen and NSFAS students. You can also split kitchen and cleaning gear with a roommate. Prices are rough guides, not exact.
      </div>
    </div>
  )
}

/* ───────────────────────── Shell ───────────────────────── */
const VALID_TABS: Tab[] = ['place', 'kit', 'settle', 'admin', 'split', 'checklist']

export default function HousingOS({ initialTab }: { initialTab?: string } = {}) {
  const [tab, setTab] = useState<Tab>(
    initialTab && VALID_TABS.includes(initialTab as Tab) ? initialTab as Tab : 'place'
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-surface)', border: `1px solid ${ACCENT}40`, borderRadius: 16, padding: '16px 18px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${ACCENT},transparent)` }} />
        <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: ACCENT, letterSpacing: '0.09em', marginBottom: 4 }}>HOUSING OS</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Your place, sorted</div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 3 }}>Rent tracking · split bills fairly · know your rights before you sign</div>
      </div>

      <div style={{ display: 'flex', gap: 0, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ width: 58, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '12px 4px', background: 'none', border: 'none',
              borderLeft: tab === t.id ? `2px solid ${ACCENT}` : '2px solid transparent',
              color: tab === t.id ? ACCENT : 'var(--text-muted)', fontSize: '0.5rem', fontFamily: 'var(--font-mono)', cursor: 'pointer', width: '100%',
            }}>
              <span style={{ fontSize: '1.05rem' }}>{t.icon}</span>
              <span style={{ lineHeight: 1.2, textAlign: 'center' }}>{t.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0, padding: '14px 16px' }}>
          {tab === 'place' && <MyPlaceTab />}
          {tab === 'kit' && <KitTab />}
          {tab === 'settle' && <SettleTab />}
          {tab === 'admin' && <LifeAdminTab />}
          {tab === 'split' && <SplitTab />}
          {tab === 'checklist' && <ChecklistTab />}
        </div>
      </div>
    </div>
  )
}
