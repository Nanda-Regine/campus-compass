'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

interface Insight {
  key: string
  text: string
  detail: string
  strength: 'strong' | 'moderate' | 'weak'
}

interface CorrelationResponse {
  insights: Insight[]
  insufficientData: boolean
  dataPoints: number
}

const STRENGTH_COLOR: Record<Insight['strength'], string> = {
  strong:   '#4ecf9e',
  moderate: '#A855F7',
  weak:     '#7090d0',
}

const INSIGHT_ICON: Record<string, string> = {
  sleep_completion:  '🌙',
  study_completion:  '📚',
  peak_study_time:   '⏰',
}

function getWeekCacheKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const weekNum = Math.ceil((now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) + 6) / 7)
  return `varsityos-correlations-${year}-w${weekNum}`
}

export default function InsightsCard() {
  const [data, setData] = useState<CorrelationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    const cacheKey = getWeekCacheKey()
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        setData(JSON.parse(cached))
        setLoading(false)
        return
      }
    } catch { /* ignore */ }

    const ctrl = new AbortController()

    fetch('/api/insights/correlations', { signal: ctrl.signal })
      .then(r => {
        if (!r.ok) { setFetchError(true); return null }
        return r.json()
      })
      .then(d => {
        if (d) {
          setData(d)
          try { localStorage.setItem(cacheKey, JSON.stringify(d)) } catch { /* quota */ }
        }
      })
      .catch(e => {
        if (e instanceof Error && e.name === 'AbortError') return
        setFetchError(true)
      })
      .finally(() => setLoading(false))

    return () => ctrl.abort()
  }, [])

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 14,
      padding: '14px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Purple-to-sky accent bar */}
      <span style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg,#A855F7 0%,#38BDF8 60%,rgba(56,189,248,0.1) 100%)',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 13 }}>📊</span>
          <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A855F7', fontWeight: 700 }}>
            Your 30-day patterns
          </span>
        </div>
        <Link href="/nova?prompt=explain-my-patterns" style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
          Ask Nova →
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[85, 70, 90].map((w, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="skeleton-row" style={{ height: 13, width: `${w}%` }} />
              <div className="skeleton-row" style={{ height: 11, width: `${w - 20}%`, opacity: 0.6 }} />
            </div>
          ))}
        </div>
      )}

      {/* Network error */}
      {!loading && fetchError && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
          Could not load patterns — will retry next visit
        </div>
      )}

      {/* Insufficient data */}
      {!loading && !fetchError && (data?.insufficientData || !data?.insights?.length) && (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>🌱</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Keep logging sleep, mood, and study sessions
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Patterns unlock after a few weeks of data
          </div>
        </div>
      )}

      {/* Insights */}
      {!loading && !fetchError && data && data.insights.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.insights.map((insight, i) => {
            const color = STRENGTH_COLOR[insight.strength]
            const icon  = INSIGHT_ICON[insight.key] ?? '✦'
            return (
              <div
                key={insight.key}
                className="dash-card-in"
                style={{
                  padding: '10px 12px',
                  background: `${color}0a`,
                  border: `0.5px solid ${color}28`,
                  borderRadius: 10,
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.5 }}>
                      {insight.text}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>
                      {insight.detail}
                    </div>
                  </div>
                  {insight.strength === 'strong' && (
                    <span style={{ flexShrink: 0, fontSize: 9, padding: '2px 7px', borderRadius: 9999, background: `${color}18`, color, border: `0.5px solid ${color}40`, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
                      STRONG
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      {!loading && !fetchError && data && data.insights.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#A855F7', display: 'inline-block' }} />
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Computed from {data.dataPoints ?? 0} real data points
          </span>
        </div>
      )}
    </div>
  )
}
