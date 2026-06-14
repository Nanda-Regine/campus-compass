'use client'

import { useState, useEffect } from 'react'

interface CohortMetric {
  myValue: number
  percentile: number
  label: string
  unit: string
}

interface CohortData {
  cohortSize: number
  cohortLabel: string
  university: string
  metrics: {
    streak?: CohortMetric
    studyVelocity?: CohortMetric
    taskCompletion?: CohortMetric
  }
}

function PercentileBar({ percentile, color }: { percentile: number; color: string }) {
  return (
    <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${percentile}%`,
        background: color,
        borderRadius: 999,
        transition: 'width 0.8s ease',
      }} />
    </div>
  )
}

function percentileLabel(p: number): string {
  if (p >= 90) return 'top 10%'
  if (p >= 75) return 'top 25%'
  if (p >= 50) return 'above average'
  if (p >= 25) return 'below average'
  return 'bottom 25%'
}

function metricColor(p: number): string {
  if (p >= 75) return '#4ecf9e'
  if (p >= 50) return '#38BDF8'
  if (p >= 25) return '#f59e0b'
  return '#f87171'
}

export default function CohortCard() {
  const [data, setData]       = useState<CohortData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    const cached = sessionStorage.getItem('varsityos-cohort-cache')
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { data: CohortData; ts: number }
        if (Date.now() - parsed.ts < 10 * 60_000) {
          setData(parsed.data)
          setLoading(false)
          return
        }
      } catch {}
    }

    fetch('/api/insights/cohort')
      .then(r => r.json())
      .then(json => {
        if (json.insufficient || json.error) {
          setError(json.reason ?? 'cohort_unavailable')
        } else {
          setData(json)
          sessionStorage.setItem('varsityos-cohort-cache', JSON.stringify({ data: json, ts: Date.now() }))
        }
      })
      .catch(() => setError('network'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: '16px 16px 14px' }}>
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', marginBottom: 12 }}>COHORT COMPARISON</div>
        <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 42, background: 'rgba(255,255,255,0.03)', borderRadius: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    // Profile incomplete or cohort too small — show encouragement, not an error
    if (error === 'profile_incomplete') {
      return (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: '16px 16px 14px' }}>
          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', marginBottom: 8 }}>COHORT COMPARISON</div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
            Complete your degree and year in <a href="/profile" style={{ color: '#4ecf9e' }}>your profile</a> to see how you compare with peers.
          </div>
        </div>
      )
    }
    return null  // cohort too small or network error — hide card silently
  }

  const metrics = Object.values(data.metrics).filter(Boolean) as CohortMetric[]
  const topMetric = metrics.reduce((best, m) => m.percentile > best.percentile ? m : best, metrics[0])

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: '16px 16px 14px', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #818CF8, transparent)' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', marginBottom: 3 }}>COHORT COMPARISON</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
            {topMetric && topMetric.percentile >= 50
              ? `You&apos;re ${percentileLabel(topMetric.percentile)} for ${topMetric.label.toLowerCase()}`
              : `${data.cohortSize} peers · ${data.cohortLabel}`}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            vs {data.cohortSize} peers at {data.university?.split('(')[0]?.trim()}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '1.2rem' }}>📊</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {metrics.map((m, i) => {
          const color = metricColor(m.percentile)
          return (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', flex: 1 }}>{m.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', color, fontWeight: 700 }}>
                  {m.myValue}{m.unit}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>
                  {percentileLabel(m.percentile)}
                </span>
              </div>
              <PercentileBar percentile={m.percentile} color={color} />
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 10, fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
        Anonymous · Never shows individual peer data
      </div>
    </div>
  )
}
