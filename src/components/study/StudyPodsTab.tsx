'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PodProfile {
  study_style: string
  preferred_times: string[]
  bio: string | null
  is_active: boolean
}

interface Match {
  user_id: string
  full_name: string
  year_of_study: string | null
  avatar_url: string | null
  study_style: string
  preferred_times: string[]
  sharedModules: string[]
  score: number
  blurb: string
}

interface Connection {
  id: string
  requester_id: string
  recipient_id: string
  status: string
  shared_modules: string[]
  ai_blurb: string | null
  created_at: string
}

const CACHE_KEY = () => {
  const d = new Date()
  return `varsityos-study-pods-${d.getFullYear()}-w${Math.ceil(d.getDate() / 7)}`
}

const TIME_LABELS: Record<string, string> = {
  morning: '🌅 Morning', afternoon: '☀️ Afternoon',
  evening: '🌙 Evening', weekend: '📅 Weekend',
}
const STYLE_LABELS: Record<string, string> = {
  silent: '🔇 Silent', discussion: '💬 Discussion', mixed: '🔀 Mixed',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MatchCard({ match, onConnect, connecting }: {
  match: Match
  onConnect: (m: Match) => void
  connecting: boolean
}) {
  return (
    <div style={{
      padding: '16px', borderRadius: 14,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(56,189,248,0.3), rgba(129,140,248,0.3))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, color: '#38BDF8',
        }}>
          {match.avatar_url
            ? <img src={match.avatar_url} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
            : match.full_name[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {match.full_name}
            </span>
            {match.year_of_study && (
              <span style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 10,
                background: 'rgba(56,189,248,0.1)', color: '#38BDF8',
                fontFamily: 'var(--font-mono)',
              }}>Y{match.year_of_study}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <Chip label={STYLE_LABELS[match.study_style] ?? match.study_style} />
            {match.preferred_times.slice(0, 2).map(t => (
              <Chip key={t} label={TIME_LABELS[t] ?? t} />
            ))}
          </div>
        </div>
      </div>

      {/* AI blurb */}
      <p style={{
        fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65,
        padding: '10px 12px', borderRadius: 9,
        background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.12)',
        margin: 0,
      }}>
        <span style={{ color: '#818CF8', fontWeight: 700, marginRight: 4 }}>✦</span>
        {match.blurb}
      </p>

      {/* Shared modules */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {match.sharedModules.map(code => (
          <span key={code} style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 8,
            background: 'rgba(78,207,158,0.08)', border: '1px solid rgba(78,207,158,0.2)',
            color: '#4ecf9e', fontFamily: 'var(--font-mono)',
          }}>{code}</span>
        ))}
      </div>

      <button
        onClick={() => onConnect(match)}
        disabled={connecting}
        style={{
          padding: '10px', borderRadius: 9, fontSize: 12, fontWeight: 700,
          background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)',
          color: '#38BDF8', cursor: connecting ? 'wait' : 'pointer',
          opacity: connecting ? 0.6 : 1,
        }}
      >
        {connecting ? 'Sending…' : '+ Send study request'}
      </button>
    </div>
  )
}

function ConnectionCard({ conn, myUserId, onAction, acting }: {
  conn: Connection
  myUserId: string
  onAction: (id: string, action: 'accept' | 'decline' | 'cancel') => void
  acting: boolean
}) {
  const isRequester = conn.requester_id === myUserId
  const otherId = isRequester ? conn.recipient_id : conn.requester_id
  const statusColour = conn.status === 'accepted' ? '#4ecf9e' : conn.status === 'declined' ? '#ef4444' : '#f59e0b'

  return (
    <div style={{
      padding: '14px 16px', borderRadius: 12,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          {otherId.slice(0, 8)}…
        </span>
        <span style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 10,
          background: `${statusColour}15`, color: statusColour,
          fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>{conn.status}</span>
      </div>

      {conn.shared_modules.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
          {conn.shared_modules.map(m => (
            <span key={m} style={{
              fontSize: 10, padding: '1px 7px', borderRadius: 7,
              background: 'rgba(78,207,158,0.06)', color: '#4ecf9e',
              fontFamily: 'var(--font-mono)',
            }}>{m}</span>
          ))}
        </div>
      )}

      {conn.ai_blurb && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 10px' }}>
          {conn.ai_blurb}
        </p>
      )}

      {conn.status === 'pending' && (
        <div style={{ display: 'flex', gap: 8 }}>
          {!isRequester && (
            <>
              <button
                onClick={() => onAction(conn.id, 'accept')}
                disabled={acting}
                style={{ ...actionBtn, background: 'rgba(78,207,158,0.12)', borderColor: 'rgba(78,207,158,0.3)', color: '#4ecf9e' }}
              >
                ✓ Accept
              </button>
              <button
                onClick={() => onAction(conn.id, 'decline')}
                disabled={acting}
                style={{ ...actionBtn, background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
              >
                ✕ Decline
              </button>
            </>
          )}
          {isRequester && (
            <button
              onClick={() => onAction(conn.id, 'cancel')}
              disabled={acting}
              style={{ ...actionBtn, background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}
            >
              Cancel request
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 10, padding: '2px 7px', borderRadius: 8,
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
      color: 'var(--text-muted)',
    }}>{label}</span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StudyPodsTab({ userId }: { userId: string }) {
  const [profile, setProfile]       = useState<PodProfile | null | 'loading'>('loading')
  const [view, setView]             = useState<'matches' | 'pods'>('matches')
  const [matches, setMatches]       = useState<Match[] | null>(null)
  const [matchReason, setMatchReason] = useState('')
  const [matchLoading, setMatchLoading] = useState(false)
  const [matchError, setMatchError] = useState('')
  const [connections, setConnections] = useState<Connection[]>([])
  const [connLoading, setConnLoading] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [acting, setActing]         = useState(false)

  // Join form state
  const [style, setStyle]   = useState('mixed')
  const [times, setTimes]   = useState<string[]>([])
  const [bio, setBio]       = useState('')
  const [joining, setJoining] = useState(false)

  const loadProfile = useCallback(async () => {
    const res = await fetch('/api/study-pods/join')
    const { profile: p } = await res.json()
    setProfile(p ?? null)
  }, [])

  const loadConnections = useCallback(async () => {
    setConnLoading(true)
    const res = await fetch('/api/study-pods/connect')
    const { connections: c } = await res.json()
    setConnections(c ?? [])
    setConnLoading(false)
  }, [])

  const loadMatches = useCallback(async (bypassCache = false) => {
    if (!bypassCache) {
      try {
        const cached = localStorage.getItem(CACHE_KEY())
        if (cached) { setMatches(JSON.parse(cached)); return }
      } catch { /* ignore */ }
    }
    setMatchLoading(true); setMatchError('')
    try {
      const res = await fetch('/api/study-pods/matches')
      const data = await res.json()
      if (!res.ok) { setMatchError(data.error || 'Failed to load matches'); return }
      if (data.notOptedIn) { await loadProfile(); return }
      if (data.reason)     { setMatchReason(data.reason) }
      const m = data.matches ?? []
      setMatches(m)
      if (m.length > 0) {
        try { localStorage.setItem(CACHE_KEY(), JSON.stringify(m)) } catch { /* quota */ }
      }
    } catch { setMatchError('Network error') }
    finally   { setMatchLoading(false) }
  }, [loadProfile])

  useEffect(() => { loadProfile() }, [loadProfile])
  useEffect(() => {
    if (profile && profile !== 'loading') {
      loadConnections()
      if (view === 'matches') loadMatches()
    }
  }, [profile, view, loadConnections, loadMatches])

  const handleJoin = async () => {
    setJoining(true)
    const res = await fetch('/api/study-pods/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ study_style: style, preferred_times: times, bio }),
    })
    if (res.ok) { await loadProfile(); setView('matches'); loadMatches(true) }
    setJoining(false)
  }

  const handleConnect = async (match: Match) => {
    setConnecting(match.user_id)
    const res = await fetch('/api/study-pods/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_id:   match.user_id,
        shared_modules: match.sharedModules,
        match_score:    match.score,
        ai_blurb:       match.blurb,
      }),
    })
    if (res.ok) {
      setMatches(prev => prev?.filter(m => m.user_id !== match.user_id) ?? [])
      await loadConnections()
    }
    setConnecting(null)
  }

  const handleAction = async (id: string, action: 'accept' | 'decline' | 'cancel') => {
    setActing(true)
    await fetch('/api/study-pods/connect', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    await loadConnections()
    setActing(false)
  }

  // Loading
  if (profile === 'loading') return (
    <div style={{ padding: '24px 0', textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>
    </div>
  )

  // Opt-in form
  if (!profile || !profile.is_active) return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '8px 0' }}>
      <div style={card}>
        <div style={{ height: 2, background: 'linear-gradient(90deg, #38BDF8, rgba(56,189,248,0.1))', margin: '-18px -16px 16px' }} />
        <div style={{ marginBottom: 14 }}>
          <span style={chipStyle}>Study Pods</span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, margin: '8px 0 4px' }}>
            Find your study crew
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
            Nova matches you with students sharing your modules and campus. Opt in to see your top matches.
          </p>
        </div>

        <label style={labelStyle}>How do you study?</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['silent','discussion','mixed'] as const).map(s => (
            <button key={s} onClick={() => setStyle(s)} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 11, fontWeight: 600,
              background: style === s ? 'rgba(56,189,248,0.14)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${style === s ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.07)'}`,
              color: style === s ? '#38BDF8' : 'var(--text-muted)', cursor: 'pointer',
            }}>{STYLE_LABELS[s]}</button>
          ))}
        </div>

        <label style={labelStyle}>When are you free? (select all that apply)</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {(['morning','afternoon','evening','weekend'] as const).map(t => (
            <button key={t} onClick={() => setTimes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                background: times.includes(t) ? 'rgba(56,189,248,0.14)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${times.includes(t) ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.07)'}`,
                color: times.includes(t) ? '#38BDF8' : 'var(--text-muted)', cursor: 'pointer',
              }}
            >{TIME_LABELS[t]}</button>
          ))}
        </div>

        <label style={labelStyle}>What are you looking for? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={300}
          rows={2}
          placeholder="e.g. Need someone to do past papers with for 3rd year Stats…"
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 12,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-primary)', resize: 'none', outline: 'none', boxSizing: 'border-box',
            marginBottom: 16,
          }}
        />

        <button
          onClick={handleJoin}
          disabled={joining}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 13,
            background: 'linear-gradient(135deg, rgba(56,189,248,0.22), rgba(56,189,248,0.1))',
            border: '1px solid rgba(56,189,248,0.4)', color: '#38BDF8',
            cursor: joining ? 'wait' : 'pointer', opacity: joining ? 0.7 : 1,
          }}
        >{joining ? 'Finding your matches…' : 'Find my study partners'}</button>
      </div>
    </div>
  )

  // Main view (opted in)
  const pending  = connections.filter(c => c.status === 'pending')
  const accepted = connections.filter(c => c.status === 'accepted')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['matches', 'pods'] as const).map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: view === v ? 'rgba(56,189,248,0.14)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${view === v ? 'rgba(56,189,248,0.35)' : 'rgba(255,255,255,0.07)'}`,
            color: view === v ? '#38BDF8' : 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {v === 'matches' ? '✨ Matches' : `👥 My pods${pending.length > 0 ? ` (${pending.length})` : ''}`}
          </button>
        ))}
        <button
          onClick={() => loadMatches(true)}
          style={{
            marginLeft: 'auto', padding: '7px 12px', borderRadius: 8, fontSize: 11,
            background: 'none', border: '1px solid rgba(255,255,255,0.07)',
            color: 'var(--text-muted)', cursor: 'pointer',
          }}
        >↻ Refresh</button>
      </div>

      {/* MATCHES view */}
      {view === 'matches' && (
        <>
          {matchLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton-row" style={{ height: 140, borderRadius: 14 }} />)}
            </div>
          )}
          {matchError && <p style={{ fontSize: 13, color: '#ef4444' }}>{matchError}</p>}
          {matchReason && !matchLoading && (
            <div style={{ ...card, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{matchReason}</p>
            </div>
          )}
          {!matchLoading && matches?.length === 0 && !matchReason && (
            <div style={{ ...card, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                No matches found yet. Check back as more students join Study Pods.
              </p>
            </div>
          )}
          {!matchLoading && (matches ?? []).map(m => (
            <MatchCard
              key={m.user_id} match={m}
              onConnect={handleConnect}
              connecting={connecting === m.user_id}
            />
          ))}
        </>
      )}

      {/* PODS view */}
      {view === 'pods' && (
        <>
          {pending.length > 0 && (
            <div>
              <p style={sectionLabel}>Pending requests</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pending.map(c => (
                  <ConnectionCard key={c.id} conn={c} myUserId={userId}
                    onAction={handleAction} acting={acting} />
                ))}
              </div>
            </div>
          )}
          {accepted.length > 0 && (
            <div>
              <p style={sectionLabel}>Active pods ({accepted.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {accepted.map(c => (
                  <ConnectionCard key={c.id} conn={c} myUserId={userId}
                    onAction={handleAction} acting={acting} />
                ))}
              </div>
            </div>
          )}
          {connLoading && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>}
          {!connLoading && connections.length === 0 && (
            <div style={{ ...card, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                No connections yet. Send a request from the Matches tab.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14, padding: '18px 16px',
}
const chipStyle: React.CSSProperties = {
  display: 'inline-block', padding: '3px 10px', borderRadius: 20,
  background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)',
  fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: '#38BDF8',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.04em',
}
const sectionLabel: React.CSSProperties = {
  fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
}
const actionBtn: React.CSSProperties = {
  padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700,
  border: '1px solid', cursor: 'pointer',
}
