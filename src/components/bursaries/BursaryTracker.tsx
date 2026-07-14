'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// ── Types ────────────────────────────────────────────────────────────────────

type AppStatus = 'researching' | 'drafting' | 'submitted' | 'interview' | 'accepted' | 'rejected' | 'waitlisted'

interface DocItem { name: string; done: boolean }

interface BursaryApp {
  id: string
  bursary_name: string
  organization: string | null
  amount_rands: number | null
  deadline: string | null
  status: AppStatus
  docs_checklist: DocItem[]
  notes: string | null
  result_date: string | null
  created_at: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<AppStatus, { label: string; emoji: string; color: string }> = {
  researching: { label: 'Researching', emoji: '🔍', color: '#94a3b8' },
  drafting:    { label: 'Drafting',    emoji: '✍️',  color: '#60a5fa' },
  submitted:   { label: 'Submitted',   emoji: '📤',  color: '#a78bfa' },
  interview:   { label: 'Interview',   emoji: '🤝',  color: '#f59e0b' },
  accepted:    { label: 'Accepted',    emoji: '✅',  color: '#4ecf9e' },
  waitlisted:  { label: 'Waitlisted', emoji: '⏳',  color: '#fbbf24' },
  rejected:    { label: 'Rejected',    emoji: '❌',  color: '#f87171' },
}

const STATUS_ORDER: AppStatus[] = ['researching','drafting','submitted','interview','accepted','waitlisted','rejected']

const DEFAULT_DOCS: DocItem[] = [
  { name: 'Certified ID copy',          done: false },
  { name: 'Proof of registration',      done: false },
  { name: 'Academic transcript',        done: false },
  { name: 'Motivation letter',          done: false },
  { name: 'Proof of household income',  done: false },
  { name: 'Recommendation letter',      done: false },
]

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

function formatDeadline(dateStr: string | null): { text: string; color: string } {
  const days = daysUntil(dateStr)
  if (days === null) return { text: 'No deadline set', color: 'rgba(255,255,255,0.45)' }
  if (days < 0)  return { text: `${Math.abs(days)}d overdue`, color: '#f87171' }
  if (days === 0) return { text: 'Due today!', color: '#ef4444' }
  if (days <= 3)  return { text: `${days}d left`, color: '#f87171' }
  if (days <= 7)  return { text: `${days}d left`, color: '#f59e0b' }
  if (days <= 14) return { text: `${days}d left`, color: '#fbbf24' }
  return { text: `${days}d left`, color: 'rgba(255,255,255,0.55)' }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BursaryTracker() {
  const [apps, setApps]           = useState<BursaryApp[]>([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<BursaryApp | null>(null)
  const [showNew, setShowNew]     = useState(false)
  const [creating, setCreating]   = useState(false)

  // Create form
  const [fName, setFName]           = useState('')
  const [fOrg, setFOrg]             = useState('')
  const [fAmount, setFAmount]       = useState('')
  const [fDeadline, setFDeadline]   = useState('')
  const [fStatus, setFStatus]       = useState<AppStatus>('researching')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/bursary/applications')
      if (res.ok) setApps((await res.json()).applications || [])
    } catch { /* non-critical */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const createApp = async () => {
    if (!fName.trim()) { toast.error('Bursary name required'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/bursary/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bursary_name: fName, organization: fOrg || null,
          amount_rands: fAmount ? Number(fAmount) : null,
          deadline: fDeadline || null, status: fStatus,
          docs_checklist: DEFAULT_DOCS,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Application added!')
      setShowNew(false)
      setFName(''); setFOrg(''); setFAmount(''); setFDeadline('')
      await load()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setCreating(false) }
  }

  const updateStatus = async (id: string, status: AppStatus) => {
    const res = await fetch(`/api/bursary/applications?id=${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
    }
  }

  const toggleDoc = async (app: BursaryApp, idx: number) => {
    const newDocs = app.docs_checklist.map((d, i) => i === idx ? { ...d, done: !d.done } : d)
    const res = await fetch(`/api/bursary/applications?id=${app.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docs_checklist: newDocs }),
    })
    if (res.ok) {
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, docs_checklist: newDocs } : a))
      if (selected?.id === app.id) setSelected(prev => prev ? { ...prev, docs_checklist: newDocs } : null)
    }
  }

  const saveNotes = async (app: BursaryApp, notes: string) => {
    await fetch(`/api/bursary/applications?id=${app.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
  }

  const deleteApp = async (id: string) => {
    if (!confirm('Delete this application?')) return
    await fetch(`/api/bursary/applications?id=${id}`, { method: 'DELETE' })
    setApps(prev => prev.filter(a => a.id !== id))
    if (selected?.id === id) setSelected(null)
    toast.success('Removed')
  }

  // Summary stats
  const accepted  = apps.filter(a => a.status === 'accepted')
  const active    = apps.filter(a => !['rejected'].includes(a.status))
  const totalPot  = active.reduce((s, a) => s + (a.amount_rands || 0), 0)
  const wonAmount = accepted.reduce((s, a) => s + (a.amount_rands || 0), 0)
  const urgent    = apps.filter(a => {
    const d = daysUntil(a.deadline)
    return d !== null && d >= 0 && d <= 7 && !['accepted','rejected'].includes(a.status)
  })

  // ── Detail view ───────────────────────────────────────────────────────────
  if (selected) {
    const meta    = STATUS_META[selected.status]
    const dl      = formatDeadline(selected.deadline)
    const docsDone = selected.docs_checklist.filter(d => d.done).length
    const docsTotal = selected.docs_checklist.length

    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => setSelected(null)}
          className="font-mono text-[0.62rem] text-white/80 hover:text-white/80 self-start">
          ← All applications
        </button>

        {/* Header */}
        <div className="bg-white/3 border border-white/7 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="font-display font-bold text-white text-base leading-tight">{selected.bursary_name}</div>
              {selected.organization && (
                <div className="font-mono text-[0.65rem] text-white/82 mt-0.5">{selected.organization}</div>
              )}
            </div>
            <button onClick={() => deleteApp(selected.id)}
              className="font-mono text-[0.65rem] text-white/72 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
              Delete
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center bg-white/3 rounded-xl py-2">
              <div className="font-mono text-[0.65rem] text-white/75 mb-1">DEADLINE</div>
              <div className="font-mono text-[0.62rem] font-bold" style={{ color: dl.color }}>{dl.text}</div>
              {selected.deadline && (
                <div className="font-mono text-[0.58rem] text-white/72 mt-0.5">
                  {new Date(selected.deadline).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
            <div className="text-center bg-white/3 rounded-xl py-2">
              <div className="font-mono text-[0.65rem] text-white/75 mb-1">AMOUNT</div>
              <div className="font-display font-black text-white text-sm">
                {selected.amount_rands ? `R${selected.amount_rands.toLocaleString()}` : '—'}
              </div>
            </div>
            <div className="text-center bg-white/3 rounded-xl py-2">
              <div className="font-mono text-[0.65rem] text-white/75 mb-1">DOCS</div>
              <div className="font-display font-black text-white text-sm">{docsDone}/{docsTotal}</div>
            </div>
          </div>

          {/* Status selector */}
          <div>
            <div className="font-mono text-[0.65rem] text-white/75 mb-1.5">STATUS</div>
            <div className="flex flex-wrap gap-1">
              {STATUS_ORDER.map(s => {
                const sm = STATUS_META[s]
                const isActive = selected.status === s
                return (
                  <button key={s} onClick={() => updateStatus(selected.id, s)}
                    className={cn('font-mono text-[0.63rem] px-2 py-1 rounded-lg border transition-all',
                      isActive ? 'border-transparent' : 'bg-white/3 border-white/8 text-white/82 hover:border-white/15')}
                    style={isActive ? { background: `${sm.color}20`, color: sm.color, borderColor: `${sm.color}30` } : {}}>
                    {sm.emoji} {sm.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Document checklist */}
        <div className="bg-white/3 border border-white/7 rounded-2xl p-4">
          <div className="font-mono text-[0.63rem] text-white/80 tracking-widest mb-3">DOCUMENT CHECKLIST</div>
          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden mb-3">
            <div className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${docsTotal > 0 ? (docsDone / docsTotal) * 100 : 0}%` }} />
          </div>
          <div className="space-y-1.5">
            {selected.docs_checklist.map((doc, i) => (
              <button key={i} onClick={() => toggleDoc(selected, i)}
                className="w-full flex items-center gap-2.5 text-left rounded-xl px-3 py-2.5 border transition-all bg-white/2 border-white/6 hover:border-white/12">
                <div className={cn('w-4 h-4 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all',
                  doc.done ? 'bg-emerald-500 border-emerald-500' : 'border-white/25')}>
                  {doc.done && <span className="text-white text-[0.63rem] font-bold">✓</span>}
                </div>
                <span className={cn('font-mono text-[0.6rem]', doc.done ? 'line-through text-white/78' : 'text-white/80')}>
                  {doc.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white/3 border border-white/7 rounded-2xl p-4">
          <div className="font-mono text-[0.63rem] text-white/80 tracking-widest mb-2">NOTES</div>
          <textarea
            defaultValue={selected.notes || ''}
            onBlur={e => saveNotes(selected, e.target.value)}
            placeholder="Add notes, contacts, requirements, URLs…"
            rows={3}
            className="w-full bg-white/4 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/72 outline-none focus:border-white/20 resize-none font-body"
          />
          <div className="font-mono text-[0.58rem] text-white/72 mt-1">Auto-saved on blur</div>
        </div>
      </div>
    )
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* Summary bar */}
      {apps.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center bg-white/3 border border-white/7 rounded-2xl py-3 px-2">
            <div className="font-display font-black text-white text-lg leading-none">{apps.length}</div>
            <div className="font-mono text-[0.65rem] text-white/78 mt-1">applications</div>
          </div>
          <div className="text-center bg-white/3 border border-white/7 rounded-2xl py-3 px-2">
            <div className="font-display font-black text-amber-400 text-base leading-none">
              {totalPot > 0 ? `R${(totalPot / 1000).toFixed(0)}k` : '—'}
            </div>
            <div className="font-mono text-[0.65rem] text-white/78 mt-1">potential</div>
          </div>
          <div className="text-center bg-white/3 border border-white/7 rounded-2xl py-3 px-2">
            <div className="font-display font-black text-emerald-400 text-base leading-none">
              {wonAmount > 0 ? `R${(wonAmount / 1000).toFixed(0)}k` : accepted.length > 0 ? accepted.length : '—'}
            </div>
            <div className="font-mono text-[0.65rem] text-white/78 mt-1">{accepted.length > 0 ? 'won' : 'accepted'}</div>
          </div>
        </div>
      )}

      {/* Urgent deadlines */}
      {urgent.length > 0 && (
        <div className="bg-red-500/6 border border-red-500/20 rounded-2xl p-3 space-y-1">
          <div className="font-mono text-[0.63rem] text-red-400 tracking-widest">⚠️ URGENT DEADLINES</div>
          {urgent.map(a => {
            const dl = formatDeadline(a.deadline)
            return (
              <button key={a.id} onClick={() => setSelected(a)}
                className="w-full flex items-center justify-between text-left rounded-xl px-2 py-1.5 hover:bg-white/4 transition-all">
                <span className="font-mono text-[0.6rem] text-white/70 truncate">{a.bursary_name}</span>
                <span className="font-mono text-[0.65rem] font-bold ml-2 flex-shrink-0" style={{ color: dl.color }}>{dl.text}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Create form */}
      {showNew ? (
        <div className="bg-white/3 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="font-display font-bold text-white text-sm">Add application</div>
          <input value={fName} onChange={e => setFName(e.target.value)} placeholder="Bursary / scholarship name *"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/72 outline-none focus:border-teal-500 font-body" />
          <div className="grid grid-cols-2 gap-2">
            <input value={fOrg} onChange={e => setFOrg(e.target.value)} placeholder="Organisation (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/72 outline-none focus:border-teal-500 font-body" />
            <input type="number" inputMode="decimal" aria-label="Bursary amount in rands" value={fAmount} onChange={e => setFAmount(e.target.value)} placeholder="Amount (R)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/72 outline-none focus:border-teal-500 font-body" />
            <div>
              <label className="font-mono text-[0.65rem] text-white/78 mb-1 block">Deadline</label>
              <input type="date" value={fDeadline} onChange={e => setFDeadline(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-teal-500 font-body" />
            </div>
            <div>
              <label className="font-mono text-[0.65rem] text-white/78 mb-1 block">Status</label>
              <select value={fStatus} onChange={e => setFStatus(e.target.value as AppStatus)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 outline-none focus:border-teal-500 font-body">
                {STATUS_ORDER.map(s => (
                  <option key={s} value={s}>{STATUS_META[s].emoji} {STATUS_META[s].label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createApp} disabled={creating || !fName.trim()}
              className="flex-1 font-display font-bold text-sm py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white transition-all">
              {creating ? 'Adding…' : 'Add Application'}
            </button>
            <button onClick={() => setShowNew(false)}
              className="px-4 font-mono text-sm text-white/82 border border-white/10 rounded-xl">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowNew(true)}
          className="w-full font-display font-bold text-sm py-3 rounded-xl bg-teal-600/12 hover:bg-teal-600/20 text-teal-400 border border-teal-600/25 transition-all">
          + Track a new application
        </button>
      )}

      {/* Application list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-white/4 animate-pulse" />)}</div>
      ) : apps.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-3xl mb-2">🎓</div>
          <div className="font-display font-bold text-white text-sm">No applications yet</div>
          <div className="font-mono text-[0.6rem] text-white/78 mt-1 leading-relaxed">
            Track every bursary you're applying for — deadlines, documents, and status updates in one place.
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {apps.map(a => {
            const meta = STATUS_META[a.status]
            const dl   = formatDeadline(a.deadline)
            const docsDone = a.docs_checklist.filter(d => d.done).length

            return (
              <button key={a.id} onClick={() => setSelected(a)}
                className="w-full text-left bg-white/3 border border-white/7 hover:border-white/14 rounded-2xl p-4 transition-all"
                style={{ borderLeft: `3px solid ${meta.color}40` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-mono text-[0.63rem] px-1.5 py-0.5 rounded-md"
                        style={{ background: `${meta.color}15`, color: meta.color }}>
                        {meta.emoji} {meta.label}
                      </span>
                      {a.docs_checklist.length > 0 && (
                        <span className="font-mono text-[0.65rem] text-white/75">
                          {docsDone}/{a.docs_checklist.length} docs
                        </span>
                      )}
                    </div>
                    <div className="font-display font-bold text-white text-sm truncate">{a.bursary_name}</div>
                    {a.organization && (
                      <div className="font-mono text-[0.63rem] text-white/80 truncate mt-0.5">{a.organization}</div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {a.amount_rands && (
                      <div className="font-display font-black text-white text-sm leading-none">
                        R{a.amount_rands.toLocaleString()}
                      </div>
                    )}
                    <div className="font-mono text-[0.63rem] mt-1" style={{ color: dl.color }}>{dl.text}</div>
                  </div>
                </div>
                {/* Doc progress bar */}
                {a.docs_checklist.length > 0 && (
                  <div className="h-1 rounded-full bg-white/8 mt-3 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${(docsDone / a.docs_checklist.length) * 100}%` }} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
