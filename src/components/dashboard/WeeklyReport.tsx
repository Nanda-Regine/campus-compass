'use client'

import { useEffect, useState, useRef } from 'react'

interface WeeklyStats {
  studyMins: number
  sessionCount: number
  tasksCompleted: number
  tasksTotal: number
  moodAvg: number
  moodCount: number
  sleepAvg: number
  sleepCount: number
  cardsReviewed: number
  contractsCompleted: number
  contractsFailed: number
}

interface WeeklyReportData {
  weekStart: string
  weekLabel: string
  stats: WeeklyStats
  summary: string | null
  tip: string | null
}

// Cache key changes every week (keyed by ISO week start date)
function getCacheKey(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(now)
  mon.setDate(now.getDate() + diff)
  return `varsityos-weekly-report-${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`
}

function fmtStudy(mins: number): string {
  if (mins === 0) return '0m'
  const h = Math.floor(mins / 60), m = mins % 60
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`
}

function moodLabel(avg: number): string {
  if (avg === 0)  return '—'
  if (avg >= 4.5) return '😄'
  if (avg >= 3.5) return '🙂'
  if (avg >= 2.5) return '😐'
  if (avg >= 1.5) return '😟'
  return '😞'
}

interface StatTileProps {
  value: string
  label: string
  sub?: string
  accent: string
  dim?: boolean
}

function StatTile({ value, label, sub, accent, dim }: StatTileProps) {
  return (
    <div style={{
      background: dim ? 'rgba(255,255,255,0.03)' : `${accent}0d`,
      border:     `0.5px solid ${dim ? 'var(--border-subtle)' : `${accent}28`}`,
      borderRadius: 10,
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      minWidth: 0,
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: dim ? 'var(--text-muted)' : 'var(--text-primary)', lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: `${accent}cc`, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>
      )}
    </div>
  )
}

export default function WeeklyReport() {
  const [data, setData] = useState<WeeklyReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    const cacheKey = getCacheKey()
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        setData(JSON.parse(cached) as WeeklyReportData)
        setLoading(false)
        return
      }
    } catch { /* ignore */ }

    const ctrl = new AbortController()
    fetch('/api/insights/weekly-report', { signal: ctrl.signal })
      .then(r => {
        if (!r.ok) { setError(true); return null }
        return r.json() as Promise<WeeklyReportData>
      })
      .then(d => {
        if (d) {
          setData(d)
          try { localStorage.setItem(cacheKey, JSON.stringify(d)) } catch { /* quota */ }
        }
      })
      .catch(e => {
        if (e instanceof Error && e.name === 'AbortError') return
        setError(true)
      })
      .finally(() => setLoading(false))

    return () => ctrl.abort()
  }, [])

  // Don't render early in the week with near-zero data (Mon–Tue)
  const dayOfWeek = new Date().getDay()
  const earlyWeek = dayOfWeek === 1 || dayOfWeek === 2  // Mon or Tue

  if (error) return null

  const s = data?.stats

  // Has any meaningful data at all?
  const hasData = s && (s.studyMins > 0 || s.tasksTotal > 0 || s.moodCount > 0 || s.sleepCount > 0)

  if (!loading && !hasData && earlyWeek) return null  // too early + no data

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 14,
      padding: '14px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Emerald-to-indigo accent bar */}
      <span style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg,#10b981 0%,#6366f1 70%,rgba(99,102,241,0.1) 100%)',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 13 }}>📅</span>
          <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#10b981', fontWeight: 700 }}>
            {data ? `Week of ${data.weekLabel}` : 'This week'}
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Nova's take</span>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ height: 64, borderRadius: 10, background: 'rgba(255,255,255,0.05)' }} className="skeleton-row" />
            ))}
          </div>
          <div className="skeleton-row" style={{ height: 13, width: '90%' }} />
          <div className="skeleton-row" style={{ height: 13, width: '70%' }} />
        </div>
      )}

      {/* Content */}
      {!loading && data && (
        <>
          {/* Stat grid — 2×2 (+ cards tile if reviewed) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
            marginBottom: 12,
          }}>
            <StatTile
              value={fmtStudy(s?.studyMins ?? 0)}
              label="studied"
              sub={s && s.sessionCount > 0 ? `${s.sessionCount} session${s.sessionCount !== 1 ? 's' : ''}` : 'no sessions yet'}
              accent="#10b981"
              dim={!s?.studyMins}
            />
            <StatTile
              value={s && s.tasksTotal > 0 ? `${s.tasksCompleted}/${s.tasksTotal}` : '—'}
              label="tasks done"
              sub={s && s.tasksTotal > 0 ? `${Math.round(s.tasksCompleted / s.tasksTotal * 100)}% complete` : 'no tasks due yet'}
              accent="#7090d0"
              dim={!s?.tasksTotal}
            />
            <StatTile
              value={s && s.moodCount > 0 ? `${s.moodAvg}/5 ${moodLabel(s.moodAvg)}` : '—'}
              label="mood avg"
              sub={s && s.moodCount > 0 ? `${s.moodCount} check-in${s.moodCount !== 1 ? 's' : ''}` : 'no mood logs yet'}
              accent="#A855F7"
              dim={!s?.moodCount}
            />
            <StatTile
              value={s && s.sleepCount > 0 ? `${s.sleepAvg}h` : '—'}
              label="sleep/night"
              sub={s && s.sleepCount > 0 ? `${s.sleepCount} night${s.sleepCount !== 1 ? 's' : ''} logged` : 'no sleep logs yet'}
              accent="#38BDF8"
              dim={!s?.sleepCount}
            />
            {s && s.cardsReviewed > 0 && (
              <StatTile
                value={String(s.cardsReviewed)}
                label="cards reviewed"
                sub="flashcard practice"
                accent="#e8834a"
              />
            )}
            {s && (s.contractsCompleted > 0 || s.contractsFailed > 0) && (
              <StatTile
                value={`${s.contractsCompleted}/${s.contractsCompleted + s.contractsFailed}`}
                label="contracts kept"
                sub={s.contractsFailed > 0 ? `${s.contractsFailed} failed` : 'all kept 🔥'}
                accent={s.contractsFailed > 0 ? '#ff6b6b' : '#4ecf9e'}
              />
            )}
          </div>

          {/* Nova summary */}
          {data.summary && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(16,185,129,0.06)',
              border: '0.5px solid rgba(16,185,129,0.2)',
              borderRadius: 10,
              marginBottom: data.tip ? 8 : 0,
            }}>
              <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>
                Nova's reflection
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {data.summary}
              </div>
            </div>
          )}

          {/* Focus tip */}
          {data.tip && (
            <div style={{
              padding: '9px 12px',
              background: 'rgba(99,102,241,0.06)',
              border: '0.5px solid rgba(99,102,241,0.2)',
              borderRadius: 10,
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>🎯</span>
              <div>
                <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>
                  Next week's focus
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.55, fontWeight: 500 }}>
                  {data.tip}
                </div>
              </div>
            </div>
          )}

          {/* No AI — stats-only fallback */}
          {!data.summary && !data.tip && hasData && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', paddingTop: 4 }}>
              Add an Anthropic API key to unlock Nova's weekly reflection
            </div>
          )}

          {/* No data empty state */}
          {!hasData && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>🌱</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Log study sessions, tasks, mood, and sleep to unlock your weekly review
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
