'use client'

import { useState, useEffect, useCallback } from 'react'

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

type Tab = 'place' | 'split' | 'checklist'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'place', label: 'My Place', icon: '🏠' },
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

/* ───────────────────────── Shell ───────────────────────── */
export default function HousingOS() {
  const [tab, setTab] = useState<Tab>('place')
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
          {tab === 'split' && <SplitTab />}
          {tab === 'checklist' && <ChecklistTab />}
        </div>
      </div>
    </div>
  )
}
