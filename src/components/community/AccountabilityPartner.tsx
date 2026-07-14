'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { dispatchXP } from '@/lib/xp-engine'
import toast from 'react-hot-toast'

const supabase = createClient()

// ── Types ─────────────────────────────────────────────────────────────────────
type PartnershipStatus = 'pending' | 'active' | 'completed' | 'cancelled'
type Tab = 'find' | 'active' | 'history'

interface StudyAccountability {
  id: string
  requester_id: string
  partner_id: string | null
  shared_goal: string
  goal_deadline: string
  status: PartnershipStatus
  requester_checkin_date: string | null
  partner_checkin_date: string | null
  streak_days: number
  university: string | null
  created_at: string
  updated_at: string
  // enriched client-side
  requester_name?: string
}

interface PostForm {
  shared_goal: string
  goal_deadline: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysUntil(dateStr: string): number {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / 86400000)
}

function todayISO(): string { return new Date().toISOString().split('T')[0] }

function computeStreak(p: StudyAccountability): number {
  const today = todayISO()
  if (p.requester_checkin_date === today && p.partner_checkin_date === today) {
    return (p.streak_days || 0) + 1
  }
  return p.streak_days || 0
}

function timeAgo(dateStr: string): string {
  const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AccountabilityPartner({ userId }: { userId: string }) {
  const [partnerships, setPartnerships] = useState<StudyAccountability[]>([])
  const [myPartnership, setMyPartnership] = useState<StudyAccountability | null>(null)
  const [openGoals, setOpenGoals] = useState<StudyAccountability[]>([])
  const [myUniversity, setMyUniversity] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('find')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [postForm, setPostForm] = useState<PostForm>({ shared_goal: '', goal_deadline: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Load profile for university
      const { data: profile } = await supabase
        .from('profiles')
        .select('university, name')
        .eq('id', userId)
        .maybeSingle()
      const uni = profile?.university ?? null
      setMyUniversity(uni)

      // My partnerships (as requester or partner)
      const { data: mine, error: mErr } = await supabase
        .from('study_accountability')
        .select('*')
        .or(`requester_id.eq.${userId},partner_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (mErr) throw new Error(mErr.message)
      const myList = (mine ?? []) as StudyAccountability[]
      setPartnerships(myList)

      const active = myList.find(p => p.status === 'active') ?? null
      setMyPartnership(active)
      if (active) setTab('active')

      // Open goals from others — filter by same university if we know it
      let openQuery = supabase
        .from('study_accountability')
        .select('*')
        .eq('status', 'pending')
        .is('partner_id', null)
        .neq('requester_id', userId)
        .gt('goal_deadline', todayISO()) // only non-expired goals
        .order('created_at', { ascending: false })
        .limit(20)

      if (uni) openQuery = openQuery.eq('university', uni)

      const { data: open, error: oErr } = await openQuery
      if (oErr) throw new Error(oErr.message)

      // Enrich open goals with requester names
      const openList = (open ?? []) as StudyAccountability[]
      if (openList.length > 0) {
        const requesterIds = [...new Set(openList.map(g => g.requester_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', requesterIds)
        const nameMap: Record<string, string> = {}
        for (const p of profiles ?? []) nameMap[p.id] = p.name ?? 'A student'
        for (const g of openList) g.requester_name = nameMap[g.requester_id] ?? 'A student'
      }

      setOpenGoals(openList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { void loadData() }, [loadData])

  async function handlePostGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!postForm.shared_goal.trim() || !postForm.goal_deadline) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const { data, error: err } = await supabase
        .from('study_accountability')
        .insert({
          requester_id:          userId,
          partner_id:            null,
          shared_goal:           postForm.shared_goal.trim().slice(0, 500),
          goal_deadline:         postForm.goal_deadline,
          status:                'pending',
          streak_days:           0,
          university:            myUniversity,
          requester_checkin_date: null,
          partner_checkin_date:  null,
        })
        .select()
        .single()

      if (err) throw new Error(err.message)
      setPartnerships(prev => [data as StudyAccountability, ...prev])
      setPostForm({ shared_goal: '', goal_deadline: '' })
      toast.success('Goal posted! Others at your university can now partner with you.')
      dispatchXP('task_complete')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to post goal')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAccept(goalId: string) {
    if (myPartnership) {
      toast.error('End your current partnership before starting a new one')
      return
    }
    setAcceptingId(goalId)
    try {
      const { data, error: err } = await supabase
        .from('study_accountability')
        .update({ partner_id: userId, status: 'active' })
        .eq('id', goalId)
        .is('partner_id', null) // guard: only accept if still open
        .select()
        .single()

      if (err) throw new Error(err.message)
      const updated = data as StudyAccountability
      setMyPartnership(updated)
      setOpenGoals(prev => prev.filter(g => g.id !== goalId))
      setPartnerships(prev => [updated, ...prev])
      setTab('active')
      toast.success('Partnership started! Check in daily to build your streak.')
      dispatchXP('task_complete')
    } catch {
      toast.error('Could not accept — someone else may have already taken this goal')
      void loadData()
    } finally {
      setAcceptingId(null)
    }
  }

  async function handleCheckIn() {
    if (!myPartnership) return
    const today = todayISO()
    const isRequester = myPartnership.requester_id === userId
    const myField = isRequester ? 'requester_checkin_date' : 'partner_checkin_date'
    const otherDate = isRequester
      ? myPartnership.partner_checkin_date
      : myPartnership.requester_checkin_date

    // If both check in today, increment streak
    const newStreak = otherDate === today
      ? (myPartnership.streak_days || 0) + 1
      : myPartnership.streak_days || 0

    setCheckingIn(true)
    const { data, error: err } = await supabase
      .from('study_accountability')
      .update({ [myField]: today, streak_days: newStreak })
      .eq('id', myPartnership.id)
      .select()
      .single()

    if (!err && data) {
      setMyPartnership(data as StudyAccountability)
      const both = otherDate === today
      toast.success(both ? `Both checked in! 🔥 ${newStreak} day streak!` : 'Checked in! Waiting for your partner.')
      dispatchXP('wellness_checkin')
    } else {
      toast.error('Check-in failed — please try again')
    }
    setCheckingIn(false)
  }

  async function handleEnd() {
    if (!myPartnership) return
    if (!confirm('End this accountability partnership?')) return
    const { data, error: err } = await supabase
      .from('study_accountability')
      .update({ status: 'cancelled' })
      .eq('id', myPartnership.id)
      .select()
      .single()

    if (!err && data) {
      setMyPartnership(null)
      setPartnerships(prev => prev.map(p => p.id === myPartnership.id ? (data as StudyAccountability) : p))
      setTab('find')
      void loadData()
    }
  }

  async function handleComplete() {
    if (!myPartnership) return
    if (!confirm('Mark this goal as completed?')) return
    const { data, error: err } = await supabase
      .from('study_accountability')
      .update({ status: 'completed' })
      .eq('id', myPartnership.id)
      .select()
      .single()

    if (!err && data) {
      setMyPartnership(null)
      setPartnerships(prev => prev.map(p => p.id === myPartnership.id ? (data as StudyAccountability) : p))
      setTab('history')
      toast.success('Goal completed! Great work together. 🎉')
      dispatchXP('task_complete')
    }
  }

  const today = todayISO()
  const myCheckedIn = myPartnership
    ? (myPartnership.requester_id === userId
        ? myPartnership.requester_checkin_date
        : myPartnership.partner_checkin_date) === today
    : false
  const partnerCheckedIn = myPartnership
    ? (myPartnership.requester_id === userId
        ? myPartnership.partner_checkin_date
        : myPartnership.requester_checkin_date) === today
    : false

  const historyItems = partnerships.filter(p => p.status === 'completed' || p.status === 'cancelled')

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: 16,
  }

  return (
    <div style={{ color: 'var(--text-secondary)' }} className="pb-8">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(52,211,153,0.1) 0%, rgba(167,139,250,0.06) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '20px 16px 16px',
        borderRadius: '16px 16px 0 0',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 24 }}>🤜🤛</span>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)' }}>Accountability Partner</h2>
        </div>
        <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: 13, lineHeight: 1.5 }}>
          Share a goal · Find a partner at {myUniversity ?? 'your university'} · Check in daily · Build your streak
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: 4, marginBottom: 16,
      }}>
        {(['find', 'active', 'history'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none',
              background: tab === t ? '#34d399' : 'transparent',
              color: tab === t ? '#0a0a0f' : '#9ca3af',
              fontWeight: tab === t ? 700 : 400,
              fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
              position: 'relative',
            }}
          >
            {t === 'find' ? 'Find Partner' : t === 'active' ? 'Active' : 'History'}
            {t === 'active' && myPartnership && (
              <span style={{
                position: 'absolute', top: 2, right: 4,
                width: 6, height: 6, borderRadius: '50%',
                background: tab === 'active' ? '#0a0a0f' : '#34d399',
              }} />
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
      ) : error ? (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 14px', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
          {error} <button onClick={() => void loadData()} style={{ marginLeft: 8, color: '#34d399', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>Retry</button>
        </div>
      ) : null}

      {/* ── FIND TAB ─────────────────────────────────────────── */}
      {tab === 'find' && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {myPartnership && (
            <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#34d399' }}>
              You have an active partnership. <button onClick={() => setTab('active')} style={{ color: '#34d399', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline', fontSize: 13 }}>View it →</button>
            </div>
          )}

          {/* Post goal form */}
          <div style={card}>
            <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 15 }}>Post Your Goal</p>
            <form onSubmit={e => { void handlePostGoal(e) }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-tertiary)', fontSize: 12, marginBottom: 6 }}>What goal do you want to achieve? *</label>
                <textarea
                  value={postForm.shared_goal}
                  onChange={e => setPostForm(f => ({ ...f, shared_goal: e.target.value }))}
                  placeholder="e.g. Finish all 12 chapters of Accounting 201 before my exam. Study 2 hours every weekday."
                  rows={3}
                  maxLength={500}
                  required
                  style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-secondary)', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
                <div style={{ textAlign: 'right', fontSize: 11, color: '#4b5563', marginTop: 3 }}>{postForm.shared_goal.length}/500</div>
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-tertiary)', fontSize: 12, marginBottom: 6 }}>Deadline *</label>
                <input
                  type="date"
                  value={postForm.goal_deadline}
                  onChange={e => setPostForm(f => ({ ...f, goal_deadline: e.target.value }))}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // at least tomorrow
                  required
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-secondary)', fontSize: 14, outline: 'none', colorScheme: 'dark', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {submitError && <p style={{ margin: 0, color: '#f87171', fontSize: 13 }}>{submitError}</p>}

              <button
                type="submit"
                disabled={submitting || !postForm.shared_goal.trim() || !postForm.goal_deadline}
                style={{
                  padding: '11px', borderRadius: 10, border: 'none',
                  background: submitting || !postForm.shared_goal.trim() || !postForm.goal_deadline
                    ? 'rgba(52,211,153,0.25)' : '#34d399',
                  color: '#0a0a0f', fontWeight: 700, fontSize: 14,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Posting…' : '🎯 Post Goal — Find Me a Partner'}
              </button>
            </form>
          </div>

          {/* Open goals */}
          <div>
            <p style={{ margin: '0 0 10px', color: 'var(--text-tertiary)', fontSize: 13, fontWeight: 600 }}>
              Open Goals at {myUniversity ?? 'Your University'}
              <span style={{ fontWeight: 400, marginLeft: 8, color: '#4b5563' }}>Accept to become their partner</span>
            </p>
            {openGoals.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: 13 }}>
                No open goals right now.<br />
                <span style={{ color: '#4b5563', fontSize: 12 }}>Post yours — when others join you'll be notified.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {openGoals.map(goal => {
                  const daysLeft = daysUntil(goal.goal_deadline)
                  return (
                    <div key={goal.id} style={{ ...card, gap: 12, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                          🎯
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '0 0 4px', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
                            {goal.shared_goal}
                          </p>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                            {goal.requester_name ?? 'A student'} · {timeAgo(goal.created_at)}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{
                          background: daysLeft <= 7 ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.12)',
                          color: daysLeft <= 7 ? '#fbbf24' : '#34d399',
                          border: daysLeft <= 7 ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(52,211,153,0.25)',
                          borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                        }}>
                          {daysLeft <= 0 ? 'Deadline today' : `${daysLeft}d to deadline`}
                        </span>
                        <button
                          onClick={() => { void handleAccept(goal.id) }}
                          disabled={!!acceptingId || !!myPartnership}
                          style={{
                            padding: '7px 18px', borderRadius: 20,
                            border: '1px solid #34d399',
                            background: acceptingId === goal.id ? 'rgba(52,211,153,0.2)' : '#34d399',
                            color: '#0a0a0f', fontSize: 13, fontWeight: 700,
                            cursor: acceptingId || myPartnership ? 'not-allowed' : 'pointer',
                            opacity: myPartnership ? 0.5 : 1,
                          }}
                        >
                          {acceptingId === goal.id ? 'Accepting…' : '🤝 Accept as Partner'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ACTIVE TAB ───────────────────────────────────────── */}
      {tab === 'active' && !loading && (
        <>
          {!myPartnership ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-tertiary)' }}>
              <p style={{ fontSize: 36, margin: '0 0 12px' }}>🤝</p>
              <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>No active partnership</p>
              <p style={{ margin: '0 0 16px', fontSize: 13 }}>Post a goal or accept someone else&apos;s goal to get started.</p>
              <button onClick={() => setTab('find')} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #34d399', background: 'rgba(52,211,153,0.1)', color: '#34d399', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Find a Partner
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Shared goal card */}
              <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px', color: 'var(--text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shared Goal</p>
                <p style={{ margin: '0 0 14px', color: '#34d399', fontSize: 17, fontWeight: 700, lineHeight: 1.4 }}>
                  {myPartnership.shared_goal}
                </p>
                {(() => {
                  const dl = daysUntil(myPartnership.goal_deadline)
                  return (
                    <span style={{
                      display: 'inline-block',
                      background: dl <= 3 ? 'rgba(239,68,68,0.15)' : dl <= 7 ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.12)',
                      color: dl <= 3 ? '#f87171' : dl <= 7 ? '#fbbf24' : '#34d399',
                      border: dl <= 3 ? '1px solid rgba(239,68,68,0.3)' : dl <= 7 ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(52,211,153,0.25)',
                      borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 600,
                    }}>
                      {dl <= 0 ? '🏁 Deadline reached!' : `${dl} day${dl === 1 ? '' : 's'} remaining`}
                    </span>
                  )
                })()}
              </div>

              {/* Streak + check-in status */}
              <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#34d399' }}>
                    🔥 {computeStreak(myPartnership)}
                  </p>
                  <p style={{ margin: '2px 0 0', color: 'var(--text-tertiary)', fontSize: 12 }}>Day streak</p>
                </div>
                <div style={{ width: 1, height: 44, background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 22 }}>{myCheckedIn ? '✅' : '⏳'}</p>
                  <p style={{ margin: '2px 0 0', color: myCheckedIn ? '#34d399' : '#9ca3af', fontSize: 12 }}>
                    {myCheckedIn ? 'You ✓' : 'You — pending'}
                  </p>
                </div>
                <div style={{ width: 1, height: 44, background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 22 }}>{partnerCheckedIn ? '✅' : '⏳'}</p>
                  <p style={{ margin: '2px 0 0', color: partnerCheckedIn ? '#34d399' : '#9ca3af', fontSize: 12 }}>
                    {partnerCheckedIn ? 'Partner ✓' : 'Partner — pending'}
                  </p>
                </div>
              </div>

              {/* Check-in button */}
              {!myCheckedIn ? (
                <button
                  onClick={() => { void handleCheckIn() }}
                  disabled={checkingIn}
                  style={{ padding: 14, borderRadius: 14, border: 'none', background: checkingIn ? 'rgba(52,211,153,0.3)' : 'linear-gradient(135deg, #34d399, #10b981)', color: '#0a0a0f', fontWeight: 700, fontSize: 16, cursor: checkingIn ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(52,211,153,0.25)' }}
                >
                  {checkingIn ? 'Checking in…' : '✅ Check In Today'}
                </button>
              ) : (
                <div style={{ padding: 14, borderRadius: 14, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', textAlign: 'center', color: '#34d399', fontWeight: 600, fontSize: 14 }}>
                  ✅ Checked in today!
                </div>
              )}

              {partnerCheckedIn && myCheckedIn && (
                <div style={{ textAlign: 'center', color: '#34d399', fontSize: 13, fontWeight: 600 }}>
                  Both checked in today — streak +1! 🔥
                </div>
              )}
              {!partnerCheckedIn && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Waiting for partner to check in today…
                </div>
              )}

              {/* Complete + End buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { void handleComplete() }}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.08)', color: '#34d399', fontSize: 13, cursor: 'pointer' }}
                >
                  🎉 Mark Complete
                </button>
                <button
                  onClick={() => { void handleEnd() }}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', color: '#f87171', fontSize: 13, cursor: 'pointer' }}
                >
                  End Partnership
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── HISTORY TAB ──────────────────────────────────────── */}
      {tab === 'history' && !loading && (
        <div>
          {historyItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              No completed or cancelled partnerships yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {historyItems.map(p => (
                <div key={p.id} style={{ ...card }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>
                      {p.shared_goal}
                    </p>
                    <span style={{
                      background: p.status === 'completed' ? 'rgba(52,211,153,0.12)' : 'rgba(156,163,175,0.12)',
                      color: p.status === 'completed' ? '#34d399' : '#9ca3af',
                      border: p.status === 'completed' ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(156,163,175,0.2)',
                      borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                    }}>
                      {p.status === 'completed' ? '✅ Completed' : 'Cancelled'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>
                      🔥 {p.streak_days} day streak
                    </span>
                    <span style={{ color: '#4b5563', fontSize: 11 }}>
                      Deadline: {new Date(p.goal_deadline).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
