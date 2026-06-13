'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Institution {
  id: string
  name: string
  short_name: string | null
  domain: string
  status: string
}

interface Invite {
  id: string
  token: string
  domain_lock: string | null
  uses_limit: number | null
  uses_count: number
  expires_at: string
}

interface Broadcast {
  id: string
  title: string
  body: string
  url: string | null
  priority: 'info' | 'warning' | 'urgent'
  sent_count: number
  failed_count: number
  created_at: string
}

interface AnalyticsData {
  totalStudents: number
  activeStudentsThisWeek: number
  upcomingExams7Days: number
  studyPodsAdoption: number
  tasksCompletedThisWeek: number
  totalTasksThisWeek: number
  completionRate: number | null
  yearDistribution: Record<string, number>
  topModules: { code: string; name: string; count: number }[]
  novaSessionsThisWeek: number | null
  truncated: boolean
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Mini chart components ────────────────────────────────────────────────────

function BarRow({ label, value, max, colour, suffix = '' }: {
  label: string; value: number; max: number; colour: string; suffix?: string
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 80, flexShrink: 0, fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 4, width: `${pct}%`,
          background: colour, transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{ fontSize: 11, color: colour, fontFamily: 'var(--font-mono)', width: 40, flexShrink: 0 }}>
        {value}{suffix}
      </span>
    </div>
  )
}

function StatCard({ label, value, colour, sub }: {
  label: string; value: string | number; colour: string; sub?: string
}) {
  return (
    <div style={{
      padding: '16px', borderRadius: 12,
      background: `${colour}0a`, border: `1px solid ${colour}20`,
    }}>
      <p style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 800, color: colour, margin: '0 0 2px' }}>
        {value === null || value === undefined ? '—' : value}
      </p>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.4 }}>
        {label}
      </p>
      {sub && <p style={{ fontSize: 10, color: colour, margin: '4px 0 0', opacity: 0.7 }}>{sub}</p>}
    </div>
  )
}

// ─── Analytics panel ─────────────────────────────────────────────────────────

function AnalyticsPanel({ data }: { data: AnalyticsData }) {
  const yearEntries = Object.entries(data.yearDistribution)
    .sort((a, b) => {
      if (a[0] === 'Unknown') return 1
      if (b[0] === 'Unknown') return -1
      return Number(a[0]) - Number(b[0])
    })
  const maxYear = Math.max(...yearEntries.map(([, v]) => v), 1)
  const maxModule = Math.max(...data.topModules.map(m => m.count), 1)

  const engagementRate = data.totalStudents > 0
    ? Math.round((data.activeStudentsThisWeek / data.totalStudents) * 100)
    : 0

  const podsRate = data.totalStudents > 0
    ? Math.round((data.studyPodsAdoption / data.totalStudents) * 100)
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {data.truncated && (
        <div style={{
          padding: '8px 14px', borderRadius: 8, fontSize: 11,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          color: '#f59e0b',
        }}>
          Showing analytics for first 200 linked students.
        </div>
      )}

      {/* 4-stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatCard label="Total students" value={data.totalStudents} colour="#38BDF8" />
        <StatCard
          label="Active this week"
          value={`${data.activeStudentsThisWeek}`}
          colour="#4ecf9e"
          sub={`${engagementRate}% engagement`}
        />
        <StatCard label="Exams next 7 days" value={data.upcomingExams7Days} colour="#f59e0b" />
        <StatCard
          label="Study Pods users"
          value={data.studyPodsAdoption}
          colour="#818CF8"
          sub={`${podsRate}% adoption`}
        />
      </div>

      {/* Nova engagement */}
      {data.novaSessionsThisWeek !== null && (
        <div style={sectionCard}>
          <SectionLabel label="Nova Engagement" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(56,189,248,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>🌟</div>
            <div>
              <p style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 800, color: '#818CF8', margin: 0 }}>
                {data.novaSessionsThisWeek}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                students chatted with Nova this week
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Task completion */}
      <div style={sectionCard}>
        <SectionLabel label="Task Completion · This Week" />
        {data.totalTasksThisWeek === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No task activity recorded this week.</p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 5,
                  width: `${data.completionRate ?? 0}%`,
                  background: 'linear-gradient(90deg, #4ecf9e, #38BDF8)',
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#4ecf9e', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                {data.completionRate ?? 0}%
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              {data.tasksCompletedThisWeek} of {data.totalTasksThisWeek} tasks completed this week
            </p>
          </>
        )}
      </div>

      {/* Year distribution */}
      {yearEntries.length > 0 && (
        <div style={sectionCard}>
          <SectionLabel label="Year of Study Distribution" />
          {yearEntries.map(([yr, count]) => (
            <BarRow
              key={yr}
              label={yr === 'Unknown' ? 'Unknown' : `Year ${yr}`}
              value={count} max={maxYear}
              colour="#38BDF8"
            />
          ))}
        </div>
      )}

      {/* Top modules */}
      {data.topModules.length > 0 && (
        <div style={sectionCard}>
          <SectionLabel label="Most Common Modules" />
          {data.topModules.map(m => (
            <div key={m.code} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                fontSize: 10, fontFamily: 'var(--font-mono)', color: '#4ecf9e',
                background: 'rgba(78,207,158,0.08)', border: '1px solid rgba(78,207,158,0.2)',
                padding: '1px 7px', borderRadius: 6, flexShrink: 0, minWidth: 72, textAlign: 'center',
              }}>
                {m.code}
              </span>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${Math.round((m.count / maxModule) * 100)}%`,
                  background: '#4ecf9e44',
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 32, textAlign: 'right', flexShrink: 0 }}>
                {m.count}
              </span>
            </div>
          ))}
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
            Student count per module code across all linked students.
          </p>
        </div>
      )}

    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{
      fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12,
    }}>{label}</p>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InstitutionAdminPage() {
  const [institution, setInstitution]     = useState<Institution | null>(null)
  const [invites, setInvites]             = useState<Invite[]>([])
  const [studentCount, setStudentCount]   = useState<number | null>(null)
  const [loading, setLoading]             = useState(true)
  const [notAdmin, setNotAdmin]           = useState(false)
  const [view, setView]                   = useState<'overview' | 'analytics'>('overview')
  const [analytics, setAnalytics]         = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError]     = useState('')

  const [genLoading, setGenLoading]   = useState(false)
  const [genError, setGenError]       = useState('')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  // Broadcast
  const [broadcasts, setBroadcasts]           = useState<Broadcast[]>([])
  const [bcastTitle, setBcastTitle]           = useState('')
  const [bcastBody, setBcastBody]             = useState('')
  const [bcastUrl, setBcastUrl]               = useState('')
  const [bcastPriority, setBcastPriority]     = useState<'info' | 'warning' | 'urgent'>('info')
  const [bcastLoading, setBcastLoading]       = useState(false)
  const [bcastError, setBcastError]           = useState('')
  const [bcastResult, setBcastResult]         = useState<{ sent: number; failed: number; total: number } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setNotAdmin(true); setLoading(false); return }

    const { data: adminRow } = await supabase
      .from('institution_admins')
      .select('institution_id, role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRow) { setNotAdmin(true); setLoading(false); return }

    const [instRes, invRes, countRes] = await Promise.all([
      supabase
        .from('institutions')
        .select('id, name, short_name, domain, status')
        .eq('id', adminRow.institution_id)
        .maybeSingle(),
      supabase
        .from('institution_invites')
        .select('id, token, domain_lock, uses_limit, uses_count, expires_at')
        .eq('institution_id', adminRow.institution_id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('institution_id', adminRow.institution_id),
    ])

    setInstitution(instRes.data ?? null)
    setInvites(invRes.data ?? [])
    setStudentCount(countRes.count ?? 0)
    setLoading(false)
  }, [])

  const loadBroadcasts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/broadcast')
      if (!res.ok) return
      const data = await res.json()
      setBroadcasts(data.broadcasts ?? [])
    } catch { /* non-critical */ }
  }, [])

  const sendBroadcast = async () => {
    if (!bcastTitle.trim() || !bcastBody.trim()) {
      setBcastError('Title and message are required.')
      return
    }
    setBcastLoading(true); setBcastError(''); setBcastResult(null)
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bcastTitle.trim(),
          body: bcastBody.trim(),
          url: bcastUrl.trim() || undefined,
          priority: bcastPriority,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setBcastError(data.error || 'Failed to send broadcast'); return }
      setBcastResult(data)
      setBcastTitle(''); setBcastBody(''); setBcastUrl('')
      await loadBroadcasts()
    } catch { setBcastError('Network error') }
    finally { setBcastLoading(false) }
  }

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    setAnalyticsError('')
    try {
      const res = await fetch('/api/admin/analytics')
      const data = await res.json()
      if (!res.ok) { setAnalyticsError(data.error || 'Failed to load analytics'); return }
      setAnalytics(data as AnalyticsData)
    } catch { setAnalyticsError('Network error') }
    finally { setAnalyticsLoading(false) }
  }, [])

  useEffect(() => { loadData(); loadBroadcasts() }, [loadData, loadBroadcasts])

  useEffect(() => {
    if (view === 'analytics' && !analytics && !analyticsLoading) {
      loadAnalytics()
    }
  }, [view, analytics, analyticsLoading, loadAnalytics])

  const generateInvite = async () => {
    if (!institution) return
    setGenLoading(true); setGenError('')
    try {
      const res = await fetch('/api/institutions/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institution_id: institution.id }),
      })
      const data = await res.json()
      if (!res.ok) { setGenError(data.error || 'Failed'); return }
      await loadData()
    } catch { setGenError('Network error') }
    finally { setGenLoading(false) }
  }

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/join/institution/${token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2000)
    })
  }

  if (loading) return <LoadingScreen />

  if (notAdmin) return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        <div style={cardStyle}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>
            You don&apos;t have institution admin access.<br />
            Contact VarsityOS to get set up.
          </p>
        </div>
      </div>
    </div>
  )

  if (!institution) return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        <div style={cardStyle}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>
            Institution not found.
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <span style={chipStyle}>Institution Admin</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, margin: '10px 0 4px' }}>
            {institution.name}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            {institution.domain} ·{' '}
            {institution.status === 'active'
              ? <span style={{ color: '#4ecf9e' }}>Active</span>
              : <span style={{ color: '#f59e0b' }}>Pending approval</span>}
          </p>
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['overview', 'analytics'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: view === v ? 'rgba(13,148,136,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${view === v ? 'rgba(13,148,136,0.4)' : 'rgba(255,255,255,0.07)'}`,
                color: view === v ? '#0d9488' : 'var(--text-muted)',
                cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {v === 'analytics' ? '📊 Analytics' : '⚙️ Overview'}
            </button>
          ))}
          {view === 'analytics' && (
            <button
              onClick={() => { setAnalytics(null); loadAnalytics() }}
              disabled={analyticsLoading}
              style={{
                marginLeft: 'auto', padding: '7px 12px', borderRadius: 8, fontSize: 11,
                background: 'none', border: '1px solid rgba(255,255,255,0.07)',
                color: 'var(--text-muted)', cursor: analyticsLoading ? 'wait' : 'pointer',
              }}
            >
              ↻ Refresh
            </button>
          )}
        </div>

        {/* ── Overview tab ── */}
        {view === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <StatCard label="Students joined" value={studentCount?.toString() ?? '—'} colour="#38BDF8" />
              <StatCard
                label="Active invite links"
                value={invites.filter(i => new Date(i.expires_at) > new Date()).length.toString()}
                colour="#4ecf9e"
              />
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Invite links</span>
                <button
                  onClick={generateInvite}
                  disabled={genLoading}
                  style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: 'rgba(13,148,136,0.18)', border: '1px solid rgba(13,148,136,0.4)',
                    color: '#0d9488', cursor: genLoading ? 'wait' : 'pointer',
                    opacity: genLoading ? 0.7 : 1,
                  }}
                >
                  {genLoading ? 'Generating…' : '+ New link'}
                </button>
              </div>

              {genError && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 12 }}>{genError}</p>}

              {invites.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                  No invite links yet. Generate one to share with your students.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {invites.map(inv => {
                    const expired = new Date(inv.expires_at) < new Date()
                    const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://varsityos.co.za'}/join/institution/${inv.token}`
                    return (
                      <div key={inv.id} style={{
                        padding: '12px 14px', borderRadius: 10,
                        background: expired ? 'rgba(255,255,255,0.02)' : 'rgba(56,189,248,0.04)',
                        border: `1px solid ${expired ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.15)'}`,
                        opacity: expired ? 0.5 : 1,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontSize: 11, fontFamily: 'var(--font-mono)',
                              color: 'var(--text-secondary)', margin: '0 0 4px',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {url}
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                              {inv.uses_count} used
                              {inv.uses_limit != null ? ` / ${inv.uses_limit}` : ''}
                              {' · '}
                              {expired ? 'Expired' : `Expires ${new Date(inv.expires_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                              {inv.domain_lock ? ` · @${inv.domain_lock} only` : ''}
                            </p>
                          </div>
                          {!expired && (
                            <button
                              onClick={() => copyLink(inv.token)}
                              style={{
                                padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                background: copiedToken === inv.token ? 'rgba(78,207,158,0.15)' : 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: copiedToken === inv.token ? '#4ecf9e' : 'var(--text-secondary)',
                                cursor: 'pointer', flexShrink: 0,
                              }}
                            >
                              {copiedToken === inv.token ? '✓ Copied' : 'Copy'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Broadcast compose ── */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 16 }}>📣</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Send Announcement</span>
                <span style={{
                  marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  max 3 / 24 h
                </span>
              </div>

              {/* Priority selector */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {(['info','warning','urgent'] as const).map(p => {
                  const colours = { info: '#38BDF8', warning: '#f59e0b', urgent: '#ef4444' }
                  const c = colours[p]
                  return (
                    <button
                      key={p}
                      onClick={() => setBcastPriority(p)}
                      style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: bcastPriority === p ? `${c}22` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${bcastPriority === p ? `${c}50` : 'rgba(255,255,255,0.07)'}`,
                        color: bcastPriority === p ? c : 'var(--text-muted)',
                        cursor: 'pointer', textTransform: 'capitalize',
                      }}
                    >
                      {p === 'info' ? 'ℹ️' : p === 'warning' ? '⚠️' : '🚨'} {p}
                    </button>
                  )
                })}
              </div>

              <input
                value={bcastTitle}
                onChange={e => { setBcastTitle(e.target.value.slice(0, 100)); setBcastResult(null); setBcastError('') }}
                placeholder="Title (max 100 chars)"
                style={inputStyle}
              />
              <textarea
                value={bcastBody}
                onChange={e => { setBcastBody(e.target.value.slice(0, 300)); setBcastResult(null); setBcastError('') }}
                placeholder="Message (max 300 chars)"
                rows={3}
                style={{ ...inputStyle, resize: 'none', marginTop: 8 }}
              />
              <input
                value={bcastUrl}
                onChange={e => setBcastUrl(e.target.value)}
                placeholder="Link URL (optional) — /dashboard or https://…"
                style={{ ...inputStyle, marginTop: 8 }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {bcastBody.length}/300
                </span>
                <button
                  onClick={sendBroadcast}
                  disabled={bcastLoading || !bcastTitle.trim() || !bcastBody.trim()}
                  style={{
                    padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.35)',
                    color: '#ef4444', cursor: (bcastLoading || !bcastTitle.trim() || !bcastBody.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (bcastLoading || !bcastTitle.trim() || !bcastBody.trim()) ? 0.5 : 1,
                  }}
                >
                  {bcastLoading ? 'Sending…' : '📣 Send to all students'}
                </button>
              </div>

              {bcastError && (
                <p style={{ fontSize: 12, color: '#ef4444', marginTop: 10 }}>{bcastError}</p>
              )}
              {bcastResult && (
                <div style={{
                  marginTop: 10, padding: '10px 14px', borderRadius: 8, fontSize: 12,
                  background: 'rgba(78,207,158,0.08)', border: '1px solid rgba(78,207,158,0.2)',
                  color: '#4ecf9e',
                }}>
                  Sent to {bcastResult.sent} of {bcastResult.total} students
                  {bcastResult.failed > 0 && ` · ${bcastResult.failed} failed`}
                </div>
              )}
            </div>

            {/* ── Broadcast history ── */}
            {broadcasts.length > 0 && (
              <div style={cardStyle}>
                <p style={{
                  fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12,
                }}>Recent broadcasts</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {broadcasts.map(b => {
                    const pColour = b.priority === 'urgent' ? '#ef4444' : b.priority === 'warning' ? '#f59e0b' : '#38BDF8'
                    return (
                      <div key={b.id} style={{
                        padding: '10px 12px', borderRadius: 10,
                        background: `${pColour}08`, border: `1px solid ${pColour}20`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px' }}>
                              {b.title}
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.4 }}>
                              {b.body}
                            </p>
                            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-mono)' }}>
                              {new Date(b.created_at).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              {' · '}{b.sent_count} reached
                              {b.failed_count > 0 && <span style={{ color: '#ef4444' }}> · {b.failed_count} failed</span>}
                            </p>
                          </div>
                          <span style={{
                            fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                            letterSpacing: '0.08em', color: pColour, padding: '2px 7px',
                            borderRadius: 20, border: `1px solid ${pColour}40`,
                            background: `${pColour}10`, flexShrink: 0,
                          }}>{b.priority}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Analytics tab ── */}
        {view === 'analytics' && (
          <>
            {analyticsLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[180, 120, 200, 150].map((h, i) => (
                  <div key={i} className="skeleton-row" style={{ height: h, borderRadius: 14 }} />
                ))}
              </div>
            )}
            {analyticsError && !analyticsLoading && (
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#ef4444' }}>{analyticsError}</p>
              </div>
            )}
            {analytics && !analyticsLoading && <AnalyticsPanel data={analytics} />}
            {!analytics && !analyticsLoading && !analyticsError && (
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading analytics…</p>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--bg-base)',
  color: 'var(--text-primary)',
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14, padding: '18px 16px',
  marginBottom: 16,
}

const sectionCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14, padding: '16px',
}

const chipStyle: React.CSSProperties = {
  display: 'inline-block', padding: '3px 10px', borderRadius: 20,
  background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.3)',
  fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: '#0d9488',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
}
