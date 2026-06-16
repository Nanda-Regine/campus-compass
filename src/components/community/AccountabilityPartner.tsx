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
  created_at: string
  updated_at: string
  // Profile joins (populated client-side)
  requester_display?: string
  partner_display?: string
}

interface PostForm {
  shared_goal: string
  goal_deadline: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysUntil(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / 86400000)
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function computeStreak(p: StudyAccountability): number {
  // Both checked in today = current day counts
  const today = todayISO()
  const rToday = p.requester_checkin_date === today
  const pToday = p.partner_checkin_date === today
  if (rToday && pToday) return (p.streak_days || 0) + 1
  return p.streak_days || 0
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
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
      // My partnerships (requester or partner)
      const { data: mine, error: mErr } = await supabase
        .from('study_accountability')
        .select('*')
        .or(`requester_id.eq.${userId},partner_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (mErr) throw new Error(mErr.message)

      const myList = (mine ?? []) as StudyAccountability[]
      setPartnerships(myList)

      const active = myList.find((p) => p.status === 'active') ?? null
      setMyPartnership(active)

      // If user has active, go to that tab
      if (active) setTab('active')

      // Open goals from others (pending, no partner, not mine)
      const { data: open, error: oErr } = await supabase
        .from('study_accountability')
        .select('*')
        .eq('status', 'pending')
        .is('partner_id', null)
        .neq('requester_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (oErr) throw new Error(oErr.message)
      setOpenGoals((open ?? []) as StudyAccountability[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function handlePostGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!postForm.shared_goal.trim() || !postForm.goal_deadline) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const { data, error: err } = await supabase
        .from('study_accountability')
        .insert({
          requester_id: userId,
          partner_id: null,
          shared_goal: postForm.shared_goal.trim(),
          goal_deadline: postForm.goal_deadline,
          status: 'pending',
          streak_days: 0,
          requester_checkin_date: null,
          partner_checkin_date: null,
        })
        .select()
        .single()

      if (err) throw new Error(err.message)
      setPartnerships((prev) => [data as StudyAccountability, ...prev])
      setPostForm({ shared_goal: '', goal_deadline: '' })
      dispatchXP('task_complete')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to post goal')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAccept(goalId: string) {
    setAcceptingId(goalId)
    try {
      const { data, error: err } = await supabase
        .from('study_accountability')
        .update({ partner_id: userId, status: 'active' })
        .eq('id', goalId)
        .select()
        .single()

      if (err) throw new Error(err.message)
      const updated = data as StudyAccountability
      setMyPartnership(updated)
      setOpenGoals((prev) => prev.filter((g) => g.id !== goalId))
      setPartnerships((prev) => [updated, ...prev])
      setTab('active')
      dispatchXP('task_complete')
    } catch {
      toast.error('Could not accept partnership — please try again')
    } finally {
      setAcceptingId(null)
    }
  }

  async function handleCheckIn() {
    if (!myPartnership) return
    setCheckingIn(true)
    const isRequester = myPartnership.requester_id === userId
    const field = isRequester ? 'requester_checkin_date' : 'partner_checkin_date'
    const today = todayISO()

    // Compute new streak if both checked in after this
    const otherDate = isRequester
      ? myPartnership.partner_checkin_date
      : myPartnership.requester_checkin_date

    const newStreak =
      otherDate === today
        ? (myPartnership.streak_days || 0) + 1
        : myPartnership.streak_days || 0

    const { data, error: err } = await supabase
      .from('study_accountability')
      .update({ [field]: today, streak_days: newStreak })
      .eq('id', myPartnership.id)
      .select()
      .single()

    if (!err && data) {
      setMyPartnership(data as StudyAccountability)
      dispatchXP('wellness_checkin')
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
      setPartnerships((prev) =>
        prev.map((p) => (p.id === myPartnership.id ? (data as StudyAccountability) : p))
      )
      setTab('find')
    }
  }

  const today = todayISO()
  const myCheckedIn = myPartnership
    ? myPartnership.requester_id === userId
      ? myPartnership.requester_checkin_date === today
      : myPartnership.partner_checkin_date === today
    : false
  const partnerCheckedIn = myPartnership
    ? myPartnership.requester_id === userId
      ? myPartnership.partner_checkin_date === today
      : myPartnership.requester_checkin_date === today
    : false

  const historyItems = partnerships.filter(
    (p) => p.status === 'completed' || p.status === 'cancelled'
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb' }} className="pb-24">
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(52,211,153,0.1) 0%, rgba(167,139,250,0.06) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '24px 16px 20px',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '28px' }}>🤜🤛</span>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#e5e7eb' }}>
              Accountability Partner
            </h1>
          </div>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>
            Share a goal. Find someone to hold you to it. Check in daily.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="max-w-2xl mx-auto" style={{ padding: '12px 16px 0' }}>
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '4px',
          }}
        >
          {(['find', 'active', 'history'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: '8px',
                border: 'none',
                background: tab === t ? '#34d399' : 'transparent',
                color: tab === t ? '#0a0a0f' : '#9ca3af',
                fontWeight: tab === t ? 700 : 400,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              {t === 'find' ? 'Find Partner' : t === 'active' ? 'Active' : 'History'}
              {t === 'active' && myPartnership && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '4px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: tab === 'active' ? '#0a0a0f' : '#34d399',
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto" style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>Loading...</div>
        ) : error ? (
          <div
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '12px',
              padding: '12px 14px',
              color: '#f87171',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        ) : null}

        {/* FIND TAB */}
        {tab === 'find' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Post goal form */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '16px',
              }}
            >
              <p style={{ margin: '0 0 14px', color: '#e5e7eb', fontWeight: 600, fontSize: '15px' }}>
                Post Your Goal
              </p>
              <form onSubmit={(e) => { void handlePostGoal(e) }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>
                    What goal do you want to achieve? *
                  </label>
                  <textarea
                    value={postForm.shared_goal}
                    onChange={(e) => setPostForm((f) => ({ ...f, shared_goal: e.target.value }))}
                    placeholder="e.g. Finish all 12 chapters of Accounting 201 before the exam. Study 2 hours every day."
                    rows={3}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: '#e5e7eb',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>
                    Goal deadline *
                  </label>
                  <input
                    type="date"
                    value={postForm.goal_deadline}
                    onChange={(e) => setPostForm((f) => ({ ...f, goal_deadline: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: '#e5e7eb',
                      fontSize: '14px',
                      outline: 'none',
                      colorScheme: 'dark',
                    }}
                  />
                </div>

                {submitError && (
                  <p style={{ margin: 0, color: '#f87171', fontSize: '13px' }}>{submitError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !postForm.shared_goal.trim() || !postForm.goal_deadline}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: submitting ? 'rgba(52,211,153,0.3)' : '#34d399',
                    color: '#0a0a0f',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Posting...' : 'Post Goal — Find Me a Partner'}
                </button>
              </form>
            </div>

            {/* Open goals from others */}
            <div>
              <p style={{ margin: '0 0 10px', color: '#9ca3af', fontSize: '13px', fontWeight: 600 }}>
                Open Goals — Accept as Partner
              </p>
              {openGoals.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '32px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    color: '#9ca3af',
                    fontSize: '13px',
                  }}
                >
                  No open goals right now. Post yours and others will find you.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {openGoals.map((goal) => {
                    const daysLeft = daysUntil(goal.goal_deadline)
                    return (
                      <div
                        key={goal.id}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '14px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <p style={{ margin: 0, color: '#e5e7eb', fontSize: '14px', fontWeight: 600, lineHeight: '1.4' }}>
                          {goal.shared_goal}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span
                              style={{
                                background: daysLeft <= 7 ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.12)',
                                color: daysLeft <= 7 ? '#fbbf24' : '#34d399',
                                border: daysLeft <= 7 ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(52,211,153,0.25)',
                                borderRadius: '20px',
                                padding: '2px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                              }}
                            >
                              {daysLeft <= 0 ? 'Deadline passed' : `${daysLeft}d to deadline`}
                            </span>
                            <span style={{ color: '#4b5563', fontSize: '11px' }}>{timeAgo(goal.created_at)}</span>
                          </div>
                          <button
                            onClick={() => { void handleAccept(goal.id) }}
                            disabled={acceptingId === goal.id}
                            style={{
                              padding: '6px 16px',
                              borderRadius: '20px',
                              border: '1px solid #34d399',
                              background: acceptingId === goal.id ? 'rgba(52,211,153,0.2)' : '#34d399',
                              color: '#0a0a0f',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: acceptingId === goal.id ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {acceptingId === goal.id ? 'Accepting...' : 'Accept as Partner'}
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

        {/* ACTIVE TAB */}
        {tab === 'active' && (
          <>
            {!myPartnership ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 16px',
                  color: '#9ca3af',
                }}
              >
                <p style={{ fontSize: '36px', margin: '0 0 12px' }}>🤝</p>
                <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 600, color: '#e5e7eb' }}>
                  No active partnership
                </p>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  Find a partner or post your goal above
                </p>
                <button
                  onClick={() => setTab('find')}
                  style={{
                    marginTop: '16px',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: '1px solid #34d399',
                    background: 'rgba(52,211,153,0.1)',
                    color: '#34d399',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Find a Partner
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Goal display */}
                <div
                  style={{
                    background: 'rgba(52,211,153,0.06)',
                    border: '1px solid rgba(52,211,153,0.2)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ margin: '0 0 8px', color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Shared Goal
                  </p>
                  <p
                    style={{
                      margin: '0 0 16px',
                      color: '#34d399',
                      fontSize: '18px',
                      fontWeight: 700,
                      lineHeight: '1.4',
                    }}
                  >
                    {myPartnership.shared_goal}
                  </p>

                  {/* Deadline */}
                  {(() => {
                    const daysLeft = daysUntil(myPartnership.goal_deadline)
                    return (
                      <span
                        style={{
                          display: 'inline-block',
                          background: daysLeft <= 3 ? 'rgba(239,68,68,0.15)' : daysLeft <= 7 ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.12)',
                          color: daysLeft <= 3 ? '#f87171' : daysLeft <= 7 ? '#fbbf24' : '#34d399',
                          border: daysLeft <= 3 ? '1px solid rgba(239,68,68,0.3)' : daysLeft <= 7 ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(52,211,153,0.25)',
                          borderRadius: '20px',
                          padding: '4px 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        {daysLeft <= 0
                          ? 'Deadline reached!'
                          : `${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining`}
                      </span>
                    )
                  })()}
                </div>

                {/* Streak */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#34d399' }}>
                      {computeStreak(myPartnership)}
                    </p>
                    <p style={{ margin: '2px 0 0', color: '#9ca3af', fontSize: '12px' }}>Day streak</p>
                  </div>
                  <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.08)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '20px' }}>{myCheckedIn ? '' : ''}</p>
                    <p style={{ margin: '2px 0 0', color: myCheckedIn ? '#34d399' : '#9ca3af', fontSize: '12px' }}>
                      {myCheckedIn ? 'You checked in' : 'You — pending'}
                    </p>
                  </div>
                  <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.08)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '20px' }}>{partnerCheckedIn ? '' : '⏳'}</p>
                    <p style={{ margin: '2px 0 0', color: partnerCheckedIn ? '#34d399' : '#9ca3af', fontSize: '12px' }}>
                      {partnerCheckedIn ? 'Partner checked in' : 'Partner — pending'}
                    </p>
                  </div>
                </div>

                {/* Check-in button */}
                {!myCheckedIn ? (
                  <button
                    onClick={() => { void handleCheckIn() }}
                    disabled={checkingIn}
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      border: 'none',
                      background: checkingIn ? 'rgba(52,211,153,0.3)' : 'linear-gradient(135deg, #34d399, #10b981)',
                      color: '#0a0a0f',
                      fontWeight: 700,
                      fontSize: '16px',
                      cursor: checkingIn ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 20px rgba(52,211,153,0.3)',
                    }}
                  >
                    {checkingIn ? 'Checking in...' : 'Check In Today'}
                  </button>
                ) : (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      background: 'rgba(52,211,153,0.08)',
                      border: '1px solid rgba(52,211,153,0.25)',
                      textAlign: 'center',
                      color: '#34d399',
                      fontWeight: 600,
                      fontSize: '14px',
                    }}
                  >
                    Checked in today
                  </div>
                )}

                {partnerCheckedIn ? (
                  <div
                    style={{
                      textAlign: 'center',
                      color: '#34d399',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    Partner checked in today — you're both on track!
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                    Waiting for partner check-in...
                  </div>
                )}

                {/* End partnership */}
                <button
                  onClick={() => { void handleEnd() }}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid rgba(239,68,68,0.25)',
                    background: 'rgba(239,68,68,0.06)',
                    color: '#f87171',
                    fontSize: '13px',
                    cursor: 'pointer',
                    marginTop: '4px',
                  }}
                >
                  End Partnership
                </button>
              </div>
            )}
          </>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div>
            {historyItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', fontSize: '14px' }}>
                No completed or cancelled partnerships yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {historyItems.map((p) => {
                  const isCompleted = p.status === 'completed'
                  return (
                    <div
                      key={p.id}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '14px',
                        padding: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                        <p style={{ margin: 0, color: '#e5e7eb', fontSize: '14px', fontWeight: 600, lineHeight: '1.4', flex: 1 }}>
                          {p.shared_goal}
                        </p>
                        <span
                          style={{
                            background: isCompleted ? 'rgba(52,211,153,0.12)' : 'rgba(156,163,175,0.12)',
                            color: isCompleted ? '#34d399' : '#9ca3af',
                            border: isCompleted ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(156,163,175,0.2)',
                            borderRadius: '20px',
                            padding: '2px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isCompleted ? 'Completed' : 'Cancelled'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span
                          style={{
                            background: 'rgba(52,211,153,0.1)',
                            color: '#34d399',
                            borderRadius: '20px',
                            padding: '2px 10px',
                            fontSize: '11px',
                          }}
                        >
                          {p.streak_days} day streak
                        </span>
                        <span style={{ color: '#4b5563', fontSize: '11px' }}>
                          Deadline: {new Date(p.goal_deadline).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
