'use client'

import { useState, useEffect, useRef } from 'react'

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
  overallPercentile: number
  metrics: {
    xp?: CohortMetric
    streak?: CohortMetric
    studyVelocity?: CohortMetric
    taskCompletion?: CohortMetric
  }
}

// ── Arc gauge (SVG) ──────────────────────────────────────────────────────────
function ArcGauge({ percentile, color }: { percentile: number; color: string }) {
  const r = 42
  const cx = 54
  const cy = 54
  const startAngle = -210
  const sweepDeg = 240
  const endAngle = startAngle + sweepDeg
  const filled = startAngle + sweepDeg * (percentile / 100)

  function polar(angle: number, radius: number) {
    const rad = (angle * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  function arcPath(from: number, to: number, rad: number) {
    const s = polar(from, rad)
    const e = polar(to, rad)
    const large = to - from > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${rad} ${rad} 0 ${large} 1 ${e.x} ${e.y}`
  }

  return (
    <svg width={108} height={108} viewBox="0 0 108 108" style={{ overflow: 'visible' }}>
      {/* Track */}
      <path d={arcPath(startAngle, endAngle, r)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} strokeLinecap="round" />
      {/* Fill */}
      {percentile > 0 && (
        <path d={arcPath(startAngle, filled, r)} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }} />
      )}
      {/* Percentile text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#fff" fontSize={22} fontWeight={700} fontFamily="monospace">
        {percentile}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={9} fontFamily="monospace">
        PERCENTILE
      </text>
    </svg>
  )
}

// ── Metric row ───────────────────────────────────────────────────────────────
function MetricRow({ metric, expanded }: { metric: CohortMetric; expanded: boolean }) {
  const barRef = useRef<HTMLDivElement>(null)
  const color = metricColor(metric.percentile)

  useEffect(() => {
    if (!barRef.current) return
    const el = barRef.current
    el.style.width = '0%'
    const t = setTimeout(() => { el.style.width = `${metric.percentile}%` }, 80)
    return () => clearTimeout(t)
  }, [metric.percentile, expanded])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', flex: 1 }}>{metric.label}</span>
        <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', color, fontWeight: 700 }}>
          {metric.myValue}{metric.unit}
        </span>
        <span style={{
          fontFamily: 'monospace', fontSize: '0.58rem', padding: '1px 6px', borderRadius: 999,
          background: `${color}18`, color, border: `1px solid ${color}40`,
        }}>
          {percentileLabel(metric.percentile)}
        </span>
      </div>
      <div style={{ position: 'relative', height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
        <div ref={barRef} style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          background: color, borderRadius: 999, transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  )
}

function percentileLabel(p: number): string {
  if (p >= 90) return 'top 10%'
  if (p >= 75) return 'top 25%'
  if (p >= 50) return 'above avg'
  if (p >= 25) return 'below avg'
  return 'bottom 25%'
}

function metricColor(p: number): string {
  if (p >= 75) return '#4ecf9e'
  if (p >= 50) return '#38BDF8'
  if (p >= 25) return '#f59e0b'
  return '#f87171'
}

function heroMessage(p: number, cohortSize: number): string {
  if (p >= 90) return `Crushing it — you outperform ${cohortSize - Math.floor(cohortSize * 0.1)} of your peers.`
  if (p >= 75) return `Strong performance — you're in the top quarter of your cohort.`
  if (p >= 50) return `You're above average — keep the momentum going.`
  if (p >= 25) return `There's room to climb — your peers are moving, so are you.`
  return `Every step counts — small wins stack into big percentile jumps.`
}

// ── Main component ───────────────────────────────────────────────────────────
export default function CohortCard() {
  const [data, setData]           = useState<CohortData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [expanded, setExpanded]   = useState(false)
  const [prevPct, setPrevPct]     = useState<number | null>(null)

  useEffect(() => {
    const cached = sessionStorage.getItem('varsityos-cohort-cache')
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { data: CohortData; ts: number; percentile: number }
        if (Date.now() - parsed.ts < 10 * 60_000) {
          setData(parsed.data)
          setLoading(false)
          return
        }
        setPrevPct(parsed.percentile ?? null)
      } catch {}
    }

    const ctrl = new AbortController()
    fetch('/api/insights/cohort', { signal: ctrl.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((json: CohortData & { insufficient?: boolean; reason?: string; error?: string }) => {
        if (json.insufficient || json.error) {
          setError(json.reason ?? 'cohort_unavailable')
        } else {
          setData(json)
          sessionStorage.setItem('varsityos-cohort-cache', JSON.stringify({
            data: json, ts: Date.now(), percentile: json.overallPercentile,
          }))
        }
      })
      .catch(e => { if (!(e instanceof Error && e.name === 'AbortError')) setError('network') })
      .finally(() => setLoading(false))

    return () => ctrl.abort()
  }, [])

  // ── Loading skeleton ───────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: '18px 16px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 108, height: 108, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[80, 60, 90].map((w, i) => (
              <div key={i} style={{ height: 14, width: `${w}%`, background: 'rgba(255,255,255,0.04)', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Profile incomplete prompt ──────────────────────────────────
  if (error === 'profile_incomplete') {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: '16px 16px 14px' }}>
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', marginBottom: 8, letterSpacing: '0.1em' }}>COHORT COMPARISON</div>
        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
          Add your degree and year in{' '}
          <a href="/profile" style={{ color: '#4ecf9e', textDecoration: 'none' }}>your profile</a>{' '}
          to see how you compare with peers.
        </div>
      </div>
    )
  }

  // ── Cohort too small or network error — hide silently ─────────
  if (error || !data) return null

  const metrics = Object.values(data.metrics).filter(Boolean) as CohortMetric[]
  const p = data.overallPercentile
  const color = metricColor(p)
  const trend = prevPct !== null ? p - prevPct : null

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 18, overflow: 'hidden', position: 'relative',
    }}>
      {/* Top accent bar */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />

      <div style={{ padding: '16px 16px 14px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ fontSize: '0.63rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
            COHORT COMPARISON
          </div>
          {trend !== null && trend !== 0 && (
            <div style={{
              fontSize: '0.58rem', fontFamily: 'monospace',
              color: trend > 0 ? '#4ecf9e' : '#f87171',
              background: trend > 0 ? '#4ecf9e18' : '#f8717118',
              padding: '1px 6px', borderRadius: 999,
            }}>
              {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}pts
            </div>
          )}
          <div style={{ marginLeft: 'auto', fontSize: '0.63rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
            {data.cohortSize} peers
          </div>
        </div>

        {/* Hero row: gauge + text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div style={{ flexShrink: 0 }}>
            <ArcGauge percentile={p} color={color} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: 6 }}>
              {p >= 50 ? `{"You're in the"} {percentileLabel(p)}` : percentileLabel(p).charAt(0).toUpperCase() + percentileLabel(p).slice(1)}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, marginBottom: 8 }}>
              {heroMessage(p, data.cohortSize)}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {data.cohortLabel} · {data.university?.split('(')[0]?.trim()}
            </div>
          </div>
        </div>

        {/* Expand / collapse metrics */}
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10, padding: '7px 12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem', fontFamily: 'monospace',
          }}
        >
          <span>Breakdown by metric</span>
          <span style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
        </button>

        {expanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {metrics.map((m, i) => <MetricRow key={i} metric={m} expanded={expanded} />)}
          </div>
        )}

        <div style={{ marginTop: 10, fontSize: '0.55rem', color: 'rgba(255,255,255,0.18)', fontFamily: 'monospace', textAlign: 'right' }}>
          Anonymous · never shows individual peer data
        </div>
      </div>
    </div>
  )
}
