'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadXPState } from '@/lib/xp-engine'

interface Entry {
  rank:          number
  first_name:    string
  university:    string
  year_of_study: number
  degree:        string
  total_xp:      number
  is_me:         boolean
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

const FILTER_STYLE: React.CSSProperties = {
  padding: '5px 12px', borderRadius: 20, fontSize: 10,
  fontFamily: '"JetBrains Mono",monospace', cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'transparent', color: 'rgba(255,255,255,0.4)',
  transition: 'all 0.15s',
}
const FILTER_ACTIVE: React.CSSProperties = {
  ...FILTER_STYLE, background: '#c9a84c',
  color: '#000', border: '1px solid #c9a84c',
}

export default function CampusLeaderboard() {
  const [entries,    setEntries]    = useState<Entry[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState<'all' | 'uni' | 'year'>('all')
  const [myUni,      setMyUni]      = useState<string | null>(null)
  const [myYear,     setMyYear]     = useState<number | null>(null)
  const [myXP,       setMyXP]       = useState(0)

  const fetchLeaderboard = useCallback(async (f: 'all' | 'uni' | 'year') => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '15' })
    if (f === 'uni' && myUni)  params.set('university', myUni)
    if (f === 'year' && myYear) params.set('year', String(myYear))
    try {
      const res = await fetch(`/api/leaderboard?${params}`)
      if (!res.ok) throw new Error()
      const d = await res.json()
      setEntries(d.entries ?? [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [myUni, myYear])

  useEffect(() => {
    try {
      const xpState = loadXPState()
      setMyXP(xpState.totalXP)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    // Fetch profile info for filter values (best-effort, from the "me" row)
    fetch('/api/profile/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.university)    setMyUni(d.university)
      if (d?.year_of_study) setMyYear(d.year_of_study)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    fetchLeaderboard(filter)
  }, [filter, fetchLeaderboard])

  function xpBar(xp: number, max: number) {
    const pct = max > 0 ? Math.min(100, Math.round((xp / max) * 100)) : 0
    return (
      <div style={{ height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.05)', flex: 1, maxWidth: 60 }}>
        <div style={{ height: '100%', borderRadius: 3, background: '#c9a84c', width: `${pct}%`, transition: 'width 0.6s' }} />
      </div>
    )
  }

  const maxXP = entries[0]?.total_xp ?? 1

  return (
    <div>
      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#c9a84c', letterSpacing: '0.18em', marginBottom: 10 }}>
        🏆 CAMPUS LEADERBOARD
      </div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 16, color: '#fff', marginBottom: 4 }}>
        Who's studying hardest?
      </div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 14, lineHeight: 1.5 }}>
        Your XP: <span style={{ color: '#c9a84c', fontWeight: 700 }}>{myXP.toLocaleString()}</span>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['all', 'uni', 'year'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={filter === f ? FILTER_ACTIVE : FILTER_STYLE}>
            {f === 'all' ? '🌍 All SA' : f === 'uni' ? '🎓 My Varsity' : '📅 My Year'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0', fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
          Loading rankings…
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', fontFamily: 'Sora,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          No data yet — be the first to earn XP in this category!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {entries.map((e) => (
            <div key={e.rank} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 11,
              background: e.is_me ? 'rgba(201,168,76,0.09)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${e.is_me ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.15s',
            }}>
              {/* Rank */}
              <div style={{
                width: 22, textAlign: 'center', flexShrink: 0,
                fontFamily: '"JetBrains Mono",monospace', fontWeight: 700,
                fontSize: e.rank <= 3 ? 14 : 10,
                color: e.rank === 1 ? '#FFD700' : e.rank === 2 ? '#C0C0C0' : e.rank === 3 ? '#CD7F32' : 'rgba(255,255,255,0.3)',
              }}>
                {MEDALS[e.rank] ?? `#${e.rank}`}
              </div>

              {/* Name + info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13,
                  color: e.is_me ? '#c9a84c' : '#fff',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {e.first_name}
                  {e.is_me && <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#c9a84c' }}>YOU</span>}
                </div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
                  {e.university} · Yr {e.year_of_study ?? '?'}
                </div>
              </div>

              {/* XP + bar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700, color: '#c9a84c' }}>
                  {e.total_xp.toLocaleString()}
                </div>
                {xpBar(e.total_xp, maxXP)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
