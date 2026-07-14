'use client'
// ─── Stokvel OS ───────────────────────────────────────────────
// Group savings circle: members, contributions, payouts, ledger
// Persisted in Supabase (stokvel_groups / members / contributions / disputes)
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AmbientImage } from '@/components/ui/AmbientImage'

// ─── DB row types ──────────────────────────────────────────────
interface GroupRow {
  id: string
  user_id: string
  name: string
  contribution_amount: number
  created_at: string
}

interface MemberRow {
  id: string
  group_id: string
  name: string
  phone: string | null
  payout_month: number
  active: boolean
}

interface ContributionRow {
  id: string
  group_id: string
  member_id: string
  member_name: string
  amount: number
  contribution_date: string
  paid: boolean
  month: string
  notes: string | null
}

interface DisputeRow {
  id: string
  group_id: string
  description: string
  reported_by: string | null
  resolved: boolean
  created_at?: string
}

// ─── Tab config ────────────────────────────────────────────────
type Tab = 'overview' | 'members' | 'ledger' | 'payouts' | 'disputes' | 'board' | 'learn'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview',  label: 'Overview',  icon: '📊' },
  { id: 'members',   label: 'Members',   icon: '👥' },
  { id: 'ledger',    label: 'Ledger',    icon: '📒' },
  { id: 'payouts',   label: 'Payouts',   icon: '💵' },
  { id: 'disputes',  label: 'Disputes',  icon: '⚠️' },
  { id: 'board',     label: 'Board',     icon: '📋' },
  { id: 'learn',     label: 'Learn',     icon: '🎓' },
]

interface StokvelMessage {
  id: string
  group_id: string
  user_id: string
  content: string
  is_decision: boolean
  is_pinned: boolean
  created_at: string
}

// ─── Loading skeleton ─────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: 60, borderRadius: 12,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────
export default function StokvelOS() {
  const supabase = createClient()
  const userId = useAppStore(s => s.userId)

  const [group, setGroup]                   = useState<GroupRow | null>(null)
  const [members, setMembers]               = useState<MemberRow[]>([])
  const [contributions, setContributions]   = useState<ContributionRow[]>([])
  const [disputes, setDisputes]             = useState<DisputeRow[]>([])
  const [loading, setLoading]               = useState(true)
  const [tab, setTab]                       = useState<Tab>('overview')
  const [boardMessages, setBoardMessages]   = useState<StokvelMessage[]>([])
  const [boardText, setBoardText]           = useState('')
  const [boardIsDecision, setBoardIsDecision] = useState(false)
  const [sendingBoard, setSendingBoard]     = useState(false)
  const [loadingBoard, setLoadingBoard]     = useState(false)
  const [setupForm, setSetupForm]           = useState({ name: 'My Stokvel', contribution: '500' })
  const [creatingGroup, setCreatingGroup]   = useState(false)

  // ─── Load data ───────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)
    try {
      // Load group
      const { data: groups, error: gErr } = await supabase
        .from('stokvel_groups')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(1)
      if (gErr) throw gErr

      const g: GroupRow | null = groups?.[0] ?? null
      setGroup(g)

      if (!g) { setLoading(false); return }

      const currentMonth = new Date().toISOString().slice(0, 7)

      const [mRes, cRes, dRes] = await Promise.all([
        supabase
          .from('stokvel_members')
          .select('*')
          .eq('group_id', g.id)
          .is('deleted_at', null)
          .order('payout_month', { ascending: true }),
        supabase
          .from('stokvel_contributions')
          .select('*')
          .eq('group_id', g.id)
          .eq('month', currentMonth)
          .is('deleted_at', null)
          .order('member_name', { ascending: true }),
        supabase
          .from('stokvel_disputes')
          .select('*')
          .eq('group_id', g.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
      ])

      if (mRes.error) throw mRes.error
      if (cRes.error) throw cRes.error
      if (dRes.error) throw dRes.error

      setMembers(mRes.data ?? [])
      setContributions(cRes.data ?? [])
      setDisputes(dRes.data ?? [])
    } catch (err) {
      console.error('StokvelOS load error', err)
      toast.error('Failed to load stokvel data')
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => { loadData() }, [loadData])

  // ─── Board (notice board) ────────────────────────────────────
  const loadBoardMessages = async (groupId: string) => {
    setLoadingBoard(true)
    try {
      const res = await fetch(`/api/stokvel/messages?group_id=${groupId}`)
      if (res.ok) {
        const data = await res.json()
        setBoardMessages(data.messages || [])
      }
    } catch { /* non-critical */ }
    setLoadingBoard(false)
  }

  const sendBoardMessage = async (groupId: string) => {
    if (!boardText.trim() || sendingBoard) return
    setSendingBoard(true)
    const text = boardText.trim()
    setBoardText('')
    try {
      const res = await fetch('/api/stokvel/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId, content: text, is_decision: boardIsDecision }),
      })
      if (res.ok) {
        const data = await res.json()
        setBoardMessages(prev => [...prev, data.message])
        setBoardIsDecision(false)
      } else {
        setBoardText(text) // restore the typed notice — clearing it before a
        toast.error('Could not post to the board — please try again.') // failed post lost it
      }
    } catch {
      setBoardText(text)
      toast.error('Failed to post to board')
    }
    setSendingBoard(false)
  }

  // ─── Create group ────────────────────────────────────────────
  const handleCreateGroup = async () => {
    if (!userId || !setupForm.name.trim()) return
    setCreatingGroup(true)
    try {
      const { data, error } = await supabase
        .from('stokvel_groups')
        .insert({
          user_id: userId,
          name: setupForm.name.trim(),
          contribution_amount: parseFloat(setupForm.contribution) || 500,
        })
        .select()
        .single()
      if (error) throw error
      setGroup(data)
      setMembers([])
      setContributions([])
      setDisputes([])
      setTab('overview')
      toast.success('Stokvel created!')
    } catch (err) {
      console.error(err)
      toast.error('Could not create stokvel')
    } finally {
      setCreatingGroup(false)
    }
  }

  // ─── Reset stokvel ───────────────────────────────────────────
  const handleReset = async () => {
    if (!group) return
    try {
      const { error } = await supabase
        .from('stokvel_groups')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', group.id)
      if (error) throw error
      setGroup(null)
      setMembers([])
      setContributions([])
      setDisputes([])
      setTab('overview')
      toast.success('Stokvel reset')
    } catch (err) {
      console.error(err)
      toast.error('Could not reset stokvel')
    }
  }

  // ─── Setup screen ────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '24px 16px' }}>
      <Skeleton />
    </div>
  )

  if (!group) return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--bg-base)', padding: '24px 16px 96px' }}>
      <AmbientImage zone="community" opacity={0.34} blurPx={8} saturation={1.4} overlayColor="linear-gradient(180deg,rgba(5,4,12,0.55) 0%,rgba(5,4,12,0.64) 100%)" />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-surface)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 16, padding: '16px 18px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,var(--teal),transparent)' }} />
        <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--teal)', letterSpacing: '0.09em', marginBottom: 4 }}>STOKVEL OS</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Set up your savings circle</div>
      </div>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Stokvel name</div>
          <input value={setupForm.name} onChange={e => setSetupForm(v => ({ ...v, name: e.target.value }))} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }} />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Monthly contribution per member (R)</div>
          <input type="number" inputMode="decimal" aria-label="Monthly contribution per member in rands" value={setupForm.contribution} onChange={e => setSetupForm(v => ({ ...v, contribution: e.target.value }))} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }} />
        </div>
        <button
          onClick={handleCreateGroup}
          disabled={creatingGroup}
          style={{ padding: '11px 0', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 10, color: 'var(--teal)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: creatingGroup ? 'not-allowed' : 'pointer', opacity: creatingGroup ? 0.6 : 1 }}
        >
          {creatingGroup ? 'Creating…' : 'Create stokvel →'}
        </button>
      </div>
      </div>
    </div>
  )

  // ─── Main app ─────────────────────────────────────────────────
  const totalFund = members.length * group.contribution_amount
  const paidThisMonth = contributions.filter(c => c.paid).length
  // payout_month is a 1..N rotation TURN, not a calendar month. Matching it against the
  // current calendar month named the wrong recipient (or nobody) unless the circle happened
  // to start in January. Derive the active turn from whole months elapsed since the group was
  // created, wrapping by member count, so the rotation is correct whenever the circle started.
  const cycleLength = members.length
  const stokvelStart = new Date(group.created_at)
  const monthsElapsed = (new Date().getFullYear() - stokvelStart.getFullYear()) * 12
    + (new Date().getMonth() - stokvelStart.getMonth())
  const currentTurn = cycleLength > 0 ? ((monthsElapsed % cycleLength) + cycleLength) % cycleLength + 1 : 1
  const currentPayoutMember = members.find(m => m.payout_month === currentTurn)

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--bg-base)', display: 'flex' }}>
      <AmbientImage zone="community" opacity={0.34} blurPx={8} saturation={1.4} overlayColor="linear-gradient(180deg,rgba(5,4,12,0.55) 0%,rgba(5,4,12,0.64) 100%)" />

      {/* Side rail */}
      <div style={{
        position: 'sticky' as const, top: 57, zIndex: 1,
        width: 64, flexShrink: 0,
        height: 'calc(100vh - 57px)',
        overflowY: 'auto', scrollbarWidth: 'none',
        borderRight: '0.5px solid var(--border-subtle)',
        background: 'rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
      }}>
        {TABS.map(t => {
          const isActive = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); if (t.id === 'board') void loadBoardMessages(group.id) }}
              title={t.label}
              style={{
                width: '100%', minHeight: 64,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                background: isActive ? 'rgba(52,211,153,0.12)' : 'transparent',
                border: 'none', borderLeft: `2px solid ${isActive ? 'var(--teal)' : 'transparent'}`,
                color: isActive ? 'var(--teal)' : 'rgba(255,255,255,0.38)',
                cursor: 'pointer', transition: 'all 0.15s ease', padding: '6px 2px',
              }}
            >
              <span style={{ fontSize: '1.05rem', opacity: isActive ? 1 : 0.65 }}>{t.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.04em', fontWeight: isActive ? 700 : 400, lineHeight: 1, textTransform: 'uppercase', textAlign: 'center' }}>
                {t.label.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content column */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '14px 16px 12px', borderBottom: '0.5px solid var(--border-subtle)', background: 'rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: '0.63rem', fontFamily: 'var(--font-mono)', color: 'var(--teal)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>STOKVEL OS</div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>{group.name}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>{members.length} members · R{group.contribution_amount}/mo · R{totalFund.toLocaleString('en-ZA')} pot</div>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, padding: '14px 16px 96px', overflowY: 'auto' }}>

      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { l: 'Members',           v: members.length,                                        c: 'var(--teal)' },
              { l: 'Monthly pot',       v: `R${totalFund.toLocaleString('en-ZA')}`,               c: 'var(--gold)' },
              { l: 'Paid this month',   v: `${paidThisMonth}/${members.length}`,                  c: paidThisMonth === members.length ? 'var(--teal)' : 'var(--coral)' },
              { l: "This month's payout", v: currentPayoutMember?.name || 'TBC',                  c: 'var(--nova)' },
            ].map(s => (
              <div key={s.l} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 4 }}>{s.l}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: s.c, fontFamily: 'var(--font-mono)' }}>{s.v}</div>
              </div>
            ))}
          </div>
          {paidThisMonth < members.length && members.length > 0 && (
            <div style={{ padding: '10px 14px', background: 'rgba(232,112,64,0.08)', border: '1px solid rgba(232,112,64,0.2)', borderRadius: 10, fontSize: '0.72rem', color: 'var(--coral)' }}>
              ⚠️ {members.length - paidThisMonth} member{members.length - paidThisMonth !== 1 ? 's' : ''} have not yet contributed this month.
            </div>
          )}
          <button onClick={handleReset} style={{ padding: '9px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-muted)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
            Reset stokvel
          </button>
        </div>
      )}

      {tab === 'members'  && <MembersTab  groupId={group.id} supabase={supabase} members={members}  setMembers={setMembers} contributionAmount={group.contribution_amount} />}
      {tab === 'ledger'   && <LedgerTab   groupId={group.id} supabase={supabase} members={members}  contributions={contributions} setContributions={setContributions} contributionAmount={group.contribution_amount} />}
      {tab === 'payouts'  && <PayoutsTab  groupId={group.id} supabase={supabase} members={members}  setMembers={setMembers} contributionAmount={group.contribution_amount} />}
      {tab === 'disputes' && <DisputesTab groupId={group.id} supabase={supabase} disputes={disputes} setDisputes={setDisputes} />}
      {tab === 'board' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            📋 Group notice board — post updates, flag issues, log decisions. Mark important posts as 📌 Decision.
          </div>
          {loadingBoard ? (
            <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', padding: '20px 0' }}>Loading…</div>
          ) : boardMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>No posts yet. Share an update with your group.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {boardMessages.map(msg => (
                <div key={msg.id} style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: msg.is_decision ? 'rgba(245,158,11,0.07)' : 'var(--bg-surface)',
                  border: `1px solid ${msg.is_decision ? 'rgba(245,158,11,0.25)' : 'var(--border-subtle)'}`,
                  marginLeft: msg.user_id === userId ? 20 : 0,
                  marginRight: msg.user_id === userId ? 0 : 20,
                }}>
                  {msg.is_decision && <div style={{ fontSize: '0.63rem', color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: 4 }}>📌 DECISION</div>}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{msg.content}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {msg.user_id === userId ? 'You' : 'Member'} · {new Date(msg.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 12 }}>
            <textarea value={boardText} onChange={e => setBoardText(e.target.value)}
              placeholder="Post an update, question, or decision to the group…"
              rows={2} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.78rem', resize: 'none', fontFamily: 'var(--font-body)', lineHeight: 1.5 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={boardIsDecision} onChange={e => setBoardIsDecision(e.target.checked)} style={{ width: 13, height: 13 }} />
                <span style={{ fontSize: '0.62rem', color: 'var(--gold)' }}>📌 Mark as decision</span>
              </label>
              <button
                onClick={() => void sendBoardMessage(group.id)}
                disabled={!boardText.trim() || sendingBoard}
                style={{ padding: '7px 14px', background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.25)', borderRadius: 8, color: 'var(--teal)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: !boardText.trim() || sendingBoard ? 'not-allowed' : 'pointer', opacity: !boardText.trim() || sendingBoard ? 0.4 : 1 }}>
                {sendingBoard ? 'Posting…' : 'Post →'}
              </button>
            </div>
          </div>
        </div>
      )}
      {tab === 'learn'    && <LearnTab />}
        </div>
      </div>
    </div>
  )
}

// ─── Members Tab ──────────────────────────────────────────────
function MembersTab({
  groupId, supabase, members, setMembers, contributionAmount,
}: {
  groupId: string
  supabase: SupabaseClient
  members: MemberRow[]
  setMembers: React.Dispatch<React.SetStateAction<MemberRow[]>>
  contributionAmount: number
}) {
  const [form, setForm]     = useState({ name: '', phone: '' })
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', phone: '', payout_month: 1 })

  const add = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      // Smallest unused payout month — `members.length + 1` collided after any
      // deletion left a gap (e.g. [1,3] + 1 new → month 3 again).
      const used = new Set(members.map(m => m.payout_month))
      let nextPayout = 1
      while (used.has(nextPayout)) nextPayout++
      const { data, error } = await supabase
        .from('stokvel_members')
        .insert({ group_id: groupId, name: form.name.trim(), phone: form.phone.trim() || null, payout_month: nextPayout, active: true })
        .select()
        .single()
      if (error) throw error
      setMembers(prev => [...prev, data])
      setForm({ name: '', phone: '' })
      setAdding(false)
      toast.success('Member added')
    } catch (err) {
      console.error(err)
      toast.error('Could not add member')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (m: MemberRow) => {
    setEditId(m.id)
    setEditForm({ name: m.name, phone: m.phone ?? '', payout_month: m.payout_month })
  }

  const saveEdit = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('stokvel_members')
        .update({ name: editForm.name.trim(), phone: editForm.phone.trim() || null, payout_month: editForm.payout_month })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      setMembers(prev => prev.map(m => m.id === id ? data : m))
      setEditId(null)
      toast.success('Member updated')
    } catch (err) {
      console.error(err)
      toast.error('Could not update member')
    }
  }

  const remove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('stokvel_members')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      setMembers(prev => prev.filter(m => m.id !== id))
      toast.success('Member removed')
    } catch (err) {
      console.error(err)
      toast.error('Could not remove member')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {members.map(m => editId === m.id ? (
        <div key={m.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={editForm.name} onChange={e => setEditForm(v => ({ ...v, name: e.target.value }))} placeholder="Name *" style={{ padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }} />
          <input value={editForm.phone} onChange={e => setEditForm(v => ({ ...v, phone: e.target.value }))} placeholder="Phone" style={{ padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }} />
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginBottom: 3 }}>Payout month</div>
            <input type="number" inputMode="numeric" aria-label="Payout month number" min={1} value={editForm.payout_month} onChange={e => setEditForm(v => ({ ...v, payout_month: parseInt(e.target.value) || 1 }))} style={{ width: 80, padding: '8px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => saveEdit(m.id)} style={{ flex: 1, padding: '9px 0', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 8, color: 'var(--teal)', fontSize: '0.73rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>Save</button>
            <button onClick={() => setEditId(null)} style={{ padding: '9px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-tertiary)', fontSize: '0.73rem', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div key={m.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{m.phone ? m.phone + ' · ' : ''}Payout: month {m.payout_month}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => startEdit(m)} style={{ fontSize: '0.62rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', minWidth: 40, minHeight: 40 }}>✏️</button>
            <button onClick={() => remove(m.id)} style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', minWidth: 40, minHeight: 40 }}>✕</button>
          </div>
        </div>
      ))}

      {adding ? (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="Member name *" value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} style={{ padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }} />
          <input placeholder="Phone number (optional)" value={form.phone} onChange={e => setForm(v => ({ ...v, phone: e.target.value }))} style={{ padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={add} disabled={saving} style={{ flex: 1, padding: '9px 0', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 8, color: 'var(--teal)', fontSize: '0.73rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Adding…' : 'Add'}
            </button>
            <button onClick={() => setAdding(false)} style={{ padding: '9px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-tertiary)', fontSize: '0.73rem', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ padding: '11px 0', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, color: 'var(--teal)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>+ Add member</button>
      )}
    </div>
  )
}

// ─── Ledger Tab ───────────────────────────────────────────────
function LedgerTab({
  groupId, supabase, members, contributions, setContributions, contributionAmount,
}: {
  groupId: string
  supabase: SupabaseClient
  members: MemberRow[]
  contributions: ContributionRow[]
  setContributions: React.Dispatch<React.SetStateAction<ContributionRow[]>>
  contributionAmount: number
}) {
  const [generating, setGenerating] = useState(false)
  const currentMonth = new Date().toISOString().slice(0, 7)

  const togglePaid = async (row: ContributionRow) => {
    try {
      const { data, error } = await supabase
        .from('stokvel_contributions')
        .update({ paid: !row.paid })
        .eq('id', row.id)
        .select()
        .single()
      if (error) throw error
      setContributions(prev => prev.map(c => c.id === row.id ? data : c))
      toast.success(data.paid ? 'Marked as paid' : 'Marked as unpaid')
    } catch (err) {
      console.error(err)
      toast.error('Could not update contribution')
    }
  }

  const generateMonth = async () => {
    if (members.length === 0) { toast.error('Add members first'); return }
    setGenerating(true)
    try {
      const existingMemberIds = new Set(contributions.map(c => c.member_id))
      const toInsert = members
        .filter(m => !existingMemberIds.has(m.id))
        .map(m => ({
          group_id: groupId,
          member_id: m.id,
          member_name: m.name,
          amount: contributionAmount,
          contribution_date: currentMonth + '-01',
          paid: false,
          month: currentMonth,
        }))
      if (toInsert.length === 0) { toast('All members already have entries this month'); return }
      const { data, error } = await supabase
        .from('stokvel_contributions')
        .insert(toInsert)
        .select()
      if (error) throw error
      setContributions(prev => [...prev, ...(data ?? [])])
      toast.success(`Generated ${toInsert.length} contribution${toInsert.length !== 1 ? 's' : ''}`)
    } catch (err) {
      console.error(err)
      toast.error('Could not generate contributions')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{new Date().toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}</div>
        <button onClick={generateMonth} disabled={generating} style={{ padding: '6px 12px', background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', borderRadius: 8, color: 'var(--gold)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.6 : 1 }}>
          {generating ? 'Generating…' : 'Generate month'}
        </button>
      </div>
      {contributions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Click "Generate month" to create this month's contribution entries.</div>
      )}
      {contributions.map(c => (
        <button key={c.id} onClick={() => togglePaid(c)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--bg-surface)', border: `1px solid ${c.paid ? 'rgba(52,211,153,0.25)' : 'var(--border-subtle)'}`, borderRadius: 10, cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: c.paid ? 'rgba(52,211,153,0.15)' : 'transparent', border: `2px solid ${c.paid ? 'var(--teal)' : 'var(--border-default)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--teal)', fontWeight: 700 }}>{c.paid ? '✓' : ''}</div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.member_name}</span>
          </div>
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: c.paid ? 'var(--teal)' : 'var(--text-secondary)' }}>R{c.amount}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Payouts Tab ─────────────────────────────────────────────
function PayoutsTab({
  groupId, supabase, members, setMembers, contributionAmount,
}: {
  groupId: string
  supabase: SupabaseClient
  members: MemberRow[]
  setMembers: React.Dispatch<React.SetStateAction<MemberRow[]>>
  contributionAmount: number
}) {
  const sorted = [...members].sort((a, b) => a.payout_month - b.payout_month)
  const potAmount = members.length * contributionAmount

  const updatePayoutMonth = async (id: string, newMonth: number) => {
    const clamped = Math.max(1, newMonth)
    const editing = members.find(m => m.id === id)
    if (!editing || editing.payout_month === clamped) return
    // Reject collisions: two members on the same payout month means one silently
    // never shows as "this month's payout" and the rotation is disputed.
    if (members.some(m => m.id !== id && m.payout_month === clamped)) {
      toast.error(`Month ${clamped} is already taken by another member — move them first.`)
      return
    }
    try {
      const { data, error } = await supabase
        .from('stokvel_members')
        .update({ payout_month: clamped })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      setMembers(prev => prev.map(m => m.id === id ? data : m))
    } catch (err) {
      console.error(err)
      toast.error('Could not update payout month')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Each member receives the full pot (R{potAmount.toLocaleString('en-ZA')}) once per cycle. Drag or reassign months below.
      </div>
      {sorted.map(m => (
        <div key={m.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 1 }}>Turn {m.payout_month} of {members.length}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => updatePayoutMonth(m.id, m.payout_month - 1)} style={{ width: 24, height: 24, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer' }}>−</button>
            <span style={{ width: 28, textAlign: 'center', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontWeight: 700, lineHeight: '24px' }}>{m.payout_month}</span>
            <button onClick={() => updatePayoutMonth(m.id, m.payout_month + 1)} style={{ width: 24, height: 24, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer' }}>+</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Disputes Tab ─────────────────────────────────────────────
function DisputesTab({
  groupId, supabase, disputes, setDisputes,
}: {
  groupId: string
  supabase: SupabaseClient
  disputes: DisputeRow[]
  setDisputes: React.Dispatch<React.SetStateAction<DisputeRow[]>>
}) {
  const [form, setForm]         = useState({ description: '', reportedBy: '' })
  const [adding, setAdding]     = useState(false)
  const [saving, setSaving]     = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState('')

  const add = async () => {
    if (!form.description.trim()) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('stokvel_disputes')
        .insert({ group_id: groupId, description: form.description.trim(), reported_by: form.reportedBy.trim() || 'Anonymous', resolved: false })
        .select()
        .single()
      if (error) throw error
      setDisputes(prev => [data, ...prev])
      setForm({ description: '', reportedBy: '' })
      setAdding(false)
      toast.success('Dispute logged')
    } catch (err) {
      console.error(err)
      toast.error('Could not log dispute')
    } finally {
      setSaving(false)
    }
  }

  const toggleResolved = async (d: DisputeRow) => {
    try {
      const { data, error } = await supabase
        .from('stokvel_disputes')
        .update({ resolved: !d.resolved })
        .eq('id', d.id)
        .select()
        .single()
      if (error) throw error
      setDisputes(prev => prev.map(x => x.id === d.id ? data : x))
      toast.success(data.resolved ? 'Marked resolved' : 'Reopened dispute')
    } catch (err) {
      console.error(err)
      toast.error('Could not update dispute')
    }
  }

  const removeDispute = async (id: string) => {
    try {
      const { error } = await supabase
        .from('stokvel_disputes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      setDisputes(prev => prev.filter(d => d.id !== id))
      toast.success('Dispute removed')
    } catch (err) {
      console.error(err)
      toast.error('Could not remove dispute')
    }
  }

  const saveEditDesc = async (id: string) => {
    if (!editDesc.trim()) return
    try {
      const { data, error } = await supabase
        .from('stokvel_disputes')
        .update({ description: editDesc.trim() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      setDisputes(prev => prev.map(x => x.id === id ? data : x))
      setEditId(null)
      toast.success('Dispute updated')
    } catch (err) {
      console.error(err)
      toast.error('Could not update dispute')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button onClick={() => setAdding(v => !v)} style={{ padding: '10px 0', background: 'rgba(232,112,64,0.08)', border: '1px solid rgba(232,112,64,0.2)', borderRadius: 10, color: 'var(--coral)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>
        {adding ? 'Cancel' : '+ Log dispute'}
      </button>

      {adding && (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <textarea placeholder="Describe the dispute..." value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))} rows={3} style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 7, color: 'var(--text-primary)', fontSize: '0.78rem', resize: 'none' }} />
          <input placeholder="Reported by" value={form.reportedBy} onChange={e => setForm(v => ({ ...v, reportedBy: e.target.value }))} style={{ padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }} />
          <button onClick={add} disabled={saving} style={{ padding: '9px 0', background: 'rgba(232,112,64,0.1)', border: '1px solid rgba(232,112,64,0.25)', borderRadius: 8, color: 'var(--coral)', fontSize: '0.73rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Logging…' : 'Log dispute'}
          </button>
        </div>
      )}

      {disputes.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>No disputes logged — great sign!</div>}

      {disputes.map(d => (
        <div key={d.id} style={{ background: 'var(--bg-surface)', border: `1px solid ${d.resolved ? 'var(--border-subtle)' : 'rgba(232,112,64,0.2)'}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {d.created_at ? new Date(d.created_at).toLocaleDateString('en-ZA') : ''}{d.reported_by ? ` · ${d.reported_by}` : ''}
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={() => { setEditId(d.id); setEditDesc(d.description) }} style={{ fontSize: '0.62rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
              <button onClick={() => toggleResolved(d)} style={{ fontSize: '0.62rem', padding: '2px 8px', background: d.resolved ? 'rgba(52,211,153,0.1)' : 'transparent', border: `1px solid ${d.resolved ? 'rgba(52,211,153,0.25)' : 'var(--border-subtle)'}`, borderRadius: 100, color: d.resolved ? 'var(--teal)' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {d.resolved ? '✓ Resolved' : 'Mark resolved'}
              </button>
              <button onClick={() => removeDispute(d.id)} style={{ fontSize: '0.62rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
          </div>
          {editId === d.id ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 7, color: 'var(--text-primary)', fontSize: '0.78rem', resize: 'none' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => saveEditDesc(d.id)} style={{ flex: 1, padding: '7px 0', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 7, color: 'var(--teal)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>Save</button>
                <button onClick={() => setEditId(null)} style={{ padding: '7px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-tertiary)', fontSize: '0.7rem', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{d.description}</div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Learn Tab ────────────────────────────────────────────────
function LearnTab() {
  const [open, setOpen] = useState<number | null>(null)
  const items = [
    { q: 'What is a stokvel?', a: 'A stokvel is a rotating savings club where members contribute a fixed amount monthly and one member receives the full pot each cycle. It is a uniquely African financial innovation, practiced for centuries before modern banking.' },
    { q: 'Stokvel vs savings account: which is better?', a: 'A stokvel builds commitment and community. A savings account earns interest. Ideally: use a stokvel for large irregular purchases (groceries, tuition, events), and a savings account for emergency fund. They serve different psychological purposes.' },
    { q: 'How to protect the group from defaults', a: '1. Start small — only invite people you trust. 2. Have a written constitution signed by all. 3. Set a clear consequence for missing a payment (loan, reduced payout, or removal). 4. Use this ledger to keep transparent records. 5. Never combine stokvel money with personal money.' },
    { q: 'Tax implications (SA)', a: 'Stokvel contributions are not taxable income because they are your own money rotating back. However, if the stokvel invests and earns interest > R23,800/year (individuals), that interest is taxable. A stokvel with a bank account may need to register for income tax if earnings exceed thresholds.' },
    { q: 'How to grow the stokvel pot', a: 'Some stokvels invest the monthly pot in a notice account, money market fund, or JSE unit trust before paying out. This earns interest while the money waits. Example: R10,000 pot in a 5% annual notice account earns R42 in a month — buy grocery vouchers for the payout member.' },
    { q: 'Is our stokvel legally registered? Do we need to register with the NCR?', a: 'No. A stokvel with fewer than 20 members is NOT required to register with the National Credit Regulator (NCR) or any government body. Your written group constitution is your legal document. Only stokvels that offer credit to members (i.e. lending money at interest) may need to register under the National Credit Act. A pure savings rotation club is exempt. Keep signed records and a group bank account — that is sufficient legal standing for small student stokvels.' },
    { q: 'Best SA banks for a stokvel notice account', a: 'Notice accounts earn interest while your group\'s money waits for payout:\n\n• Capitec Bank — ~8.5% per year on notice deposits. No monthly fees. Open with R250 minimum. Best for small student stokvels.\n\n• TymeBank — ~9% per year on GoalSave accounts. Zero fees. Fully digital.\n\n• African Bank — ~9.5% per year on fixed-term savings. Slightly higher rate but needs a 32-day notice period before withdrawal.\n\nTip: Open the account in the stokvel\'s name (not one member\'s personal account) and require 2 signatories for withdrawals to protect the group.' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((s, i) => (
        <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 11, overflow: 'hidden' }}>
          <button onClick={() => setOpen(open === i ? null : i)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 10 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.q}</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', flexShrink: 0, transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          </button>
          {open === i && <div style={{ padding: '0 14px 12px', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{s.a}</div>}
        </div>
      ))}
    </div>
  )
}
