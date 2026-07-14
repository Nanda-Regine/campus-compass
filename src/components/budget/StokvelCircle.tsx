'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface StokvelMember {
  id: string
  user_id: string | null
  email: string
  display_name: string | null
  payout_position: number
  status: 'invited' | 'joined'
  invite_token: string | null
  joined_at: string | null
}

interface Stokvel {
  id: string
  created_by: string
  name: string
  description: string | null
  contribution_amount: number
  frequency: 'weekly' | 'biweekly' | 'monthly'
  current_round: number
  status: 'active' | 'paused' | 'completed'
  created_at: string
  stokvel_circle_members: StokvelMember[]
}

interface Contribution {
  id: string
  member_id: string
  round_number: number
  amount: number
  paid_at: string
}

type View = 'list' | 'detail'

const FREQ_LABEL: Record<string, string> = {
  weekly: 'weekly', biweekly: 'fortnightly', monthly: 'monthly',
}

export default function StokvelCircle({ userId }: { userId: string }) {
  const [stokvels, setStokvels]   = useState<Stokvel[]>([])
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState<View>('list')
  const [selected, setSelected]   = useState<Stokvel | null>(null)
  const [contribs, setContribs]   = useState<Contribution[]>([])
  const [loadingC, setLoadingC]   = useState(false)
  const [showNew, setShowNew]     = useState(false)
  const [creating, setCreating]   = useState(false)

  // New stokvel form
  const [newName, setNewName]           = useState('')
  const [newDesc, setNewDesc]           = useState('')
  const [newAmount, setNewAmount]       = useState('')
  const [newFreq, setNewFreq]           = useState<'weekly'|'biweekly'|'monthly'>('monthly')
  const [memberRows, setMemberRows]     = useState([{ email: '', name: '' }, { email: '', name: '' }])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/stokvel/groups')
      if (res.ok) setStokvels((await res.json()).stokvels || [])
    } catch { toast.error('Failed to load stokvels') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const loadContribs = async (stokvelId: string, round: number) => {
    setLoadingC(true)
    try {
      const res = await fetch(`/api/stokvel/contributions?stokvel_id=${stokvelId}&round=${round}`)
      if (res.ok) setContribs((await res.json()).contributions || [])
    } catch { /* non-critical */ }
    setLoadingC(false)
  }

  const createStokvel = async () => {
    if (!newName.trim() || !newAmount) return
    setCreating(true)
    try {
      const members = memberRows.filter(r => r.email.trim())
      const res = await fetch('/api/stokvel/groups', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName, description: newDesc || null,
          contribution_amount: Number(newAmount), frequency: newFreq, members,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Stokvel circle created!')
      setShowNew(false); setNewName(''); setNewDesc(''); setNewAmount('')
      setMemberRows([{ email: '', name: '' }, { email: '', name: '' }])
      await load()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to create') }
    finally { setCreating(false) }
  }

  const markPaid = async (stokvelId: string, memberId: string, round: number) => {
    try {
      const res = await fetch('/api/stokvel/contributions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stokvel_id: stokvelId, member_id: memberId, round_number: round }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Contribution marked as paid!')
      await loadContribs(stokvelId, round)
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to mark paid') }
  }

  const unmarkPaid = async (memberId: string, round: number, stokvelId: string) => {
    try {
      await fetch(`/api/stokvel/contributions?member_id=${memberId}&round=${round}`, { method: 'DELETE' })
      await loadContribs(stokvelId, round)
    } catch { toast.error('Failed to unmark') }
  }

  if (loading) {
    return <div className="space-y-3 p-2">{[1,2].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}</div>
  }

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (view === 'detail' && selected) {
    const round     = selected.current_round
    const members   = selected.stokvel_circle_members.filter(m => m.status === 'joined').sort((a, b) => a.payout_position - b.payout_position)
    const isCreator = selected.created_by === userId
    const potSize   = members.length * selected.contribution_amount

    // Who receives this round (sequential by payout_position)
    const recipientIdx  = (round - 1) % members.length
    const recipient     = members[recipientIdx]

    // Which members have paid this round
    const paidMemberIds = new Set(contribs.filter(c => c.round_number === round).map(c => c.member_id))

    const paidCount  = paidMemberIds.size
    const totalCount = members.length
    const allPaid    = paidCount === totalCount && totalCount > 0

    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => { setView('list'); setContribs([]) }} className="font-mono text-[0.62rem] text-white/80 hover:text-white/80 self-start">
          ← All circles
        </button>

        {/* Header */}
        <div className="bg-white/3 border border-emerald-500/20 rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.06) 0%, transparent 70%)' }}>
          <div className="font-mono text-[0.63rem] text-emerald-400 tracking-widest mb-1">STOKVEL CIRCLE</div>
          <div className="font-display font-bold text-white text-lg leading-tight">{selected.name}</div>
          {selected.description && <div className="font-mono text-[0.62rem] text-white/82 mt-1">{selected.description}</div>}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center">
              <div className="font-display font-black text-emerald-400 text-base">R{selected.contribution_amount.toFixed(0)}</div>
              <div className="font-mono text-[0.65rem] text-white/78 uppercase">{FREQ_LABEL[selected.frequency]}</div>
            </div>
            <div className="text-center">
              <div className="font-display font-black text-white text-base">{members.length}</div>
              <div className="font-mono text-[0.65rem] text-white/78 uppercase">members</div>
            </div>
            <div className="text-center">
              <div className="font-display font-black text-amber-400 text-base">R{potSize.toFixed(0)}</div>
              <div className="font-mono text-[0.65rem] text-white/78 uppercase">pot size</div>
            </div>
          </div>
        </div>

        {/* This round */}
        <div className="bg-white/3 border border-white/7 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[0.6rem] text-white/82 uppercase tracking-wide">Round {round}</div>
            {allPaid && <div className="font-mono text-[0.63rem] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">All paid ✓</div>}
          </div>

          {recipient && (
            <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-3 py-2.5">
              <div className="font-mono text-[0.63rem] text-emerald-400 mb-1">🎉 THIS ROUND'S RECIPIENT</div>
              <div className="font-display font-bold text-white text-sm">{recipient.display_name || recipient.email}</div>
              <div className="font-mono text-[0.65rem] text-emerald-300/70 mt-0.5">Receives R{potSize.toFixed(0)} when all members have paid</div>
            </div>
          )}

          {/* Contribution tracker */}
          <div>
            <div className="font-mono text-[0.64rem] text-white/75 uppercase mb-2">{paidCount}/{totalCount} contributed</div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden mb-3">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${totalCount > 0 ? (paidCount / totalCount) * 100 : 0}%` }} />
            </div>
            {loadingC ? (
              <div className="font-mono text-[0.62rem] text-white/78 text-center py-4">Loading…</div>
            ) : (
              <div className="space-y-2">
                {members.map((m, i) => {
                  const hasPaid   = paidMemberIds.has(m.id)
                  const isMe      = m.user_id === userId
                  const isRcpt    = i === recipientIdx
                  return (
                    <div key={m.id} className={cn(
                      'flex items-center justify-between rounded-xl px-3 py-2.5 border',
                      hasPaid ? 'bg-emerald-500/6 border-emerald-500/15' : 'bg-white/2 border-white/7'
                    )}>
                      <div className="flex items-center gap-2.5">
                        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-display flex-shrink-0', hasPaid ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/82')}>
                          {hasPaid ? '✓' : m.payout_position}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-display font-bold text-white text-xs">{m.display_name || m.email}</span>
                            {isMe && <span className="font-mono text-[0.58rem] bg-white/8 text-white/80 px-1 rounded">you</span>}
                            {isRcpt && <span className="font-mono text-[0.58rem] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">receives pot</span>}
                          </div>
                          <div className="font-mono text-[0.65rem] text-white/78 mt-0.5">
                            {hasPaid ? `Paid R${selected.contribution_amount.toFixed(0)}` : `Owes R${selected.contribution_amount.toFixed(0)}`}
                          </div>
                        </div>
                      </div>
                      {!hasPaid && (isMe || isCreator) && (
                        <button
                          onClick={() => markPaid(selected.id, m.id, round)}
                          className="font-mono text-[0.63rem] px-2.5 py-1 rounded-lg bg-emerald-600/15 text-emerald-400 border border-emerald-600/25 hover:bg-emerald-600/25 transition-all flex-shrink-0"
                        >
                          Mark paid
                        </button>
                      )}
                      {hasPaid && isCreator && (
                        <button
                          onClick={() => unmarkPaid(m.id, round, selected.id)}
                          className="font-mono text-[0.58rem] text-white/72 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          undo
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Payout order */}
        <div className="bg-white/3 border border-white/7 rounded-2xl p-4">
          <div className="font-mono text-[0.6rem] text-white/82 uppercase tracking-wide mb-3">Payout schedule</div>
          <div className="space-y-1.5">
            {members.map((m, i) => {
              const roundNum    = i + 1
              const isPast      = roundNum < round
              const isCurrent   = roundNum === round
              return (
                <div key={m.id} className={cn('flex items-center gap-3 rounded-lg px-2.5 py-2', isCurrent ? 'bg-emerald-500/8 border border-emerald-500/15' : isPast ? 'opacity-40' : 'bg-white/2')}>
                  <div className={cn('font-mono text-[0.63rem] w-5 text-center font-bold', isCurrent ? 'text-emerald-400' : isPast ? 'text-white/75' : 'text-white/80')}>
                    {roundNum}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-display font-bold text-white text-xs">{m.display_name || m.email}</span>
                  </div>
                  <div className={cn('font-mono text-[0.65rem]', isCurrent ? 'text-emerald-400' : isPast ? 'text-white/72' : 'text-white/78')}>
                    {isPast ? 'received' : isCurrent ? 'this round' : `round ${roundNum}`}
                  </div>
                  <div className="font-mono text-[0.63rem] text-white/82">R{potSize.toFixed(0)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Invited members */}
        {selected.stokvel_circle_members.some(m => m.status === 'invited') && (
          <div className="bg-white/3 border border-white/7 rounded-2xl p-4">
            <div className="font-mono text-[0.6rem] text-white/82 uppercase tracking-wide mb-2">Pending invites</div>
            <div className="space-y-1.5">
              {selected.stokvel_circle_members.filter(m => m.status === 'invited').map(m => {
                const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/stokvel/join/${m.invite_token}`
                return (
                  <div key={m.id} className="flex items-center justify-between bg-white/2 border border-white/5 rounded-xl px-3 py-2">
                    <div>
                      <span className="font-mono text-[0.62rem] text-white/70">{m.email}</span>
                      <div className="font-mono text-[0.65rem] text-white/75">position #{m.payout_position}</div>
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(link); toast.success('Invite link copied!') }}
                      className="font-mono text-[0.63rem] px-2 py-1 rounded border border-white/10 text-teal-400 hover:bg-teal-600/10 transition-all"
                    >
                      Copy link
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Explainer */}
      <div className="bg-emerald-500/6 border border-emerald-500/20 rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.06) 0%, transparent 70%)' }}>
        <div className="font-mono text-[0.63rem] text-emerald-400 tracking-widest mb-1">STOKVEL CIRCLE</div>
        <div className="font-display font-bold text-white text-base leading-tight mb-1.5">Ubuntu savings for students</div>
        <div className="font-mono text-[0.62rem] text-white/85 leading-relaxed">
          A digital stokvel — everyone contributes R{'{'}amount{'}'} each round. One person gets the full pot. Rotate until everyone has received. No banks, no fees.
        </div>
      </div>

      {/* Create form */}
      {showNew ? (
        <div className="bg-white/3 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="font-display font-bold text-white text-sm">Start a new circle</div>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Circle name (e.g. Res Floor Stokvel)" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/75 outline-none focus:border-emerald-500 font-body" />
          <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/75 outline-none focus:border-emerald-500 resize-none font-body" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-mono text-[0.63rem] text-white/80 mb-1 block">Contribution amount (R) *</label>
              <input type="number" inputMode="decimal" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="e.g. 200" min={10} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/75 outline-none focus:border-emerald-500 font-body" />
            </div>
            <div>
              <label className="font-mono text-[0.63rem] text-white/80 mb-1 block">Frequency</label>
              <select value={newFreq} onChange={e => setNewFreq(e.target.value as 'weekly'|'biweekly'|'monthly')} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 outline-none focus:border-emerald-500 font-body">
                <option value="weekly">Weekly</option>
                <option value="biweekly">Fortnightly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-mono text-[0.63rem] text-white/80 mb-2 block">Invite members (they&apos;ll get a join link)</label>
            <div className="space-y-2">
              {memberRows.map((r, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input type="email" value={r.email} onChange={e => { const next = [...memberRows]; next[i] = { ...next[i], email: e.target.value }; setMemberRows(next) }} placeholder={`Email ${i+1}`} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/72 outline-none focus:border-emerald-500 font-body" />
                  <input value={r.name} onChange={e => { const next = [...memberRows]; next[i] = { ...next[i], name: e.target.value }; setMemberRows(next) }} placeholder="Name (optional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/72 outline-none focus:border-emerald-500 font-body" />
                </div>
              ))}
              <button onClick={() => setMemberRows([...memberRows, { email: '', name: '' }])} className="font-mono text-[0.65rem] text-white/78 hover:text-teal-400 transition-colors">
                + Add another member
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={createStokvel} disabled={creating || !newName.trim() || !newAmount} className="flex-1 font-display font-bold text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white py-2.5 rounded-xl transition-all">
              {creating ? 'Creating…' : 'Start Circle'}
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 font-mono text-sm text-white/82 border border-white/10 rounded-xl">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowNew(true)} className="w-full font-display font-bold text-sm bg-emerald-600/12 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/25 py-3 rounded-xl transition-all">
          + Start a new stokvel circle
        </button>
      )}

      {/* Stokvel list */}
      {stokvels.length === 0 && !showNew ? (
        <div className="text-center py-8">
          <div className="text-3xl mb-2">🫱🏾‍🫲🏽</div>
          <div className="font-display font-bold text-white text-sm">No circles yet</div>
          <div className="font-mono text-[0.62rem] text-white/78 mt-1">Start one above or ask a friend to invite you.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {stokvels.map(s => {
            const joined   = s.stokvel_circle_members.filter(m => m.status === 'joined')
            const potSize  = joined.length * s.contribution_amount
            const isCreator = s.created_by === userId
            return (
              <button
                key={s.id}
                onClick={() => { setSelected(s); setView('detail'); loadContribs(s.id, s.current_round) }}
                className="w-full text-left bg-white/3 border border-white/7 hover:border-emerald-600/30 rounded-2xl p-4 transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-display font-bold text-white text-sm">{s.name}</div>
                    <div className="font-mono text-[0.65rem] text-emerald-400/70 mt-0.5">R{s.contribution_amount.toFixed(0)} {FREQ_LABEL[s.frequency]} · {joined.length} members</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="font-display font-black text-white text-base leading-none">R{potSize.toFixed(0)}</div>
                    <div className="font-mono text-[0.58rem] text-white/75">pot size</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn('font-mono text-[0.65rem] px-1.5 py-0.5 rounded border', s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/78 border-white/10')}>
                    {s.status}
                  </div>
                  <div className="font-mono text-[0.65rem] text-white/75">Round {s.current_round}</div>
                  {isCreator && <div className="font-mono text-[0.65rem] text-amber-400/60">organizer</div>}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
