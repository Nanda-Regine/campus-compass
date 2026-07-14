'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { GradPlan } from '@/app/api/graduation/optimize/route'

function getWeekCacheKey(): string {
  const now = new Date()
  const weekNum = Math.ceil(
    (now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) + 6) / 7
  )
  return `varsityos-grad-optimizer-${now.getFullYear()}-w${weekNum}`
}

export default function GraduationOptimizer({ hasModules }: { hasModules: boolean }) {
  const [plan, setPlan]       = useState<GradPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const fetchedRef = useRef(false)

  // Auto-load from cache on mount
  useEffect(() => {
    if (!hasModules || fetchedRef.current) return
    fetchedRef.current = true
    try {
      const cached = localStorage.getItem(getWeekCacheKey())
      if (cached) {
        const parsed = JSON.parse(cached) as GradPlan
        setPlan(parsed)
        setRevealed(true)
      }
    } catch { /* ignore */ }
  }, [hasModules])

  const generate = async (bypassCache = false) => {
    setLoading(true)
    setError(null)

    if (!bypassCache) {
      try {
        const cached = localStorage.getItem(getWeekCacheKey())
        if (cached) {
          setPlan(JSON.parse(cached) as GradPlan)
          setRevealed(true)
          setLoading(false)
          return
        }
      } catch { /* ignore */ }
    }

    try {
      const res = await fetch('/api/graduation/optimize', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to generate plan')

      if (data.insufficientData) {
        setError('Add at least 2 module records to generate a graduation plan.')
        setLoading(false)
        return
      }

      const p = data as GradPlan
      setPlan(p)
      setRevealed(true)
      try { localStorage.setItem(getWeekCacheKey(), JSON.stringify(p)) } catch { /* quota */ }
    } catch (err) {
      setError((err as { message?: string })?.message || 'Could not generate plan')
    } finally {
      setLoading(false)
    }
  }

  const novaPrompt = plan
    ? encodeURIComponent(`My graduation plan says: "${plan.headline}". ${plan.gaps.length > 0 ? `My main gap is: ${plan.gaps[0]}` : ''} Can you help me make a concrete study plan?`)
    : ''

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid rgba(56,189,248,0.2)',
      borderRadius: 16, overflow: 'hidden',
    }}>
      {/* Accent bar */}
      <div style={{
        height: 2,
        background: 'linear-gradient(90deg, #38BDF8 0%, #818CF8 60%, rgba(129,140,248,0.1) 100%)',
      }} />

      <div style={{ padding: '14px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 13 }}>🤖</span>
            <span style={{
              fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: '#38BDF8', fontWeight: 700, fontFamily: 'var(--font-mono)',
            }}>
              Nova Graduation Plan
            </span>
          </div>
          {plan && (
            <button
              onClick={() => generate(true)}
              disabled={loading}
              style={{
                fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
                background: 'none', border: 'none', cursor: loading ? 'wait' : 'pointer', padding: 0,
              }}
            >
              {loading ? 'Thinking…' : '↻ Refresh'}
            </button>
          )}
        </div>

        {/* Not yet loaded */}
        {!revealed && !loading && !error && (
          <div style={{ textAlign: 'center', paddingBottom: 4 }}>
            {hasModules ? (
              <>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
                  Nova will analyse your academic history and build a personalised path to graduation.
                </p>
                <button
                  onClick={() => generate()}
                  style={{
                    width: '100%', padding: '11px 0', borderRadius: 10,
                    background: 'linear-gradient(135deg, rgba(56,189,248,0.18), rgba(56,189,248,0.08))',
                    border: '1px solid rgba(56,189,248,0.35)',
                    color: '#38BDF8', fontWeight: 700, fontSize: 13,
                    fontFamily: 'var(--font-display)', cursor: 'pointer',
                  }}
                >
                  Generate my graduation plan
                </button>
              </>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, paddingBottom: 4 }}>
                Add at least 2 module records above to unlock your AI graduation plan.
              </p>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[90, 75, 85, 60].map((w, i) => (
              <div key={i} className="skeleton-row" style={{ height: 12, width: `${w}%` }} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <p style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', lineHeight: 1.6 }}>{error}</p>
        )}

        {/* Plan */}
        {plan && revealed && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Headline + on-track badge */}
            <div style={{
              padding: '12px 14px',
              background: plan.onTrack ? 'rgba(78,207,158,0.08)' : 'rgba(255,107,107,0.08)',
              border: `1px solid ${plan.onTrack ? 'rgba(78,207,158,0.25)' : 'rgba(255,107,107,0.25)'}`,
              borderRadius: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>{plan.onTrack ? '✅' : '⚠️'}</span>
                <span style={{
                  fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: plan.onTrack ? 'var(--teal)' : 'var(--coral)',
                }}>
                  {plan.onTrack ? 'On track' : 'At risk'} · Est. graduation {plan.graduationYear}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
                {plan.headline}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '6px 0 0' }}>
                {plan.summary}
              </p>
            </div>

            {/* Gaps */}
            {plan.gaps.length > 0 && (
              <Section
                icon="🕳"
                label="Gaps to close"
                colour="#ef4444"
                items={plan.gaps}
              />
            )}

            {/* Next semester */}
            {plan.nextSemester.length > 0 && (
              <Section
                icon="📅"
                label="Next semester priorities"
                colour="#38BDF8"
                items={plan.nextSemester}
              />
            )}

            {/* Risks */}
            {plan.risks.length > 0 && (
              <Section
                icon="⚡"
                label="Watch out for"
                colour="#f59e0b"
                items={plan.risks}
              />
            )}

            {/* Ask Nova CTA */}
            <Link
              href={`/nova?prompt=${novaPrompt}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '11px 0', borderRadius: 10,
                background: 'rgba(156,111,255,0.1)', border: '1px solid rgba(156,111,255,0.25)',
                color: '#9B6FFF', fontWeight: 700, fontSize: 13,
                fontFamily: 'var(--font-display)', textDecoration: 'none',
              }}
            >
              <span>✦</span> Ask Nova to build my study plan
            </Link>
          </div>
        )}
      </div>

      {/* ── Static info panel ── always shown ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>

        {/* Gap type legend */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#38BDF8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Understanding gaps</div>
          {[
            { type: 'Failed core module', detail: 'A compulsory module you didn\'t pass. Must be repeated — no equivalent substitution. Delays graduation by at least one semester.', color: '#ef4444' },
            { type: 'Missing prerequisite', detail: 'A module that must be passed before you can register for a later one. Check your faculty handbook for chains.', color: '#f97316' },
            { type: 'Credit shortfall', detail: 'You don\'t have enough credits to qualify for graduation. Typically 360 credits for a 3-year degree, 480 for 4-year.', color: '#f59e0b' },
            { type: 'N+ rule risk', detail: 'You are approaching or have exceeded the funded years (N+1 or N+2). NSFAS funding may be suspended. Appeals are possible.', color: '#a78bfa' },
          ].map(g => (
            <div key={g.type} style={{ display: 'flex', gap: 8, marginBottom: 7, paddingLeft: 8, borderLeft: `2px solid ${g.color}` }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: g.color, marginBottom: 2 }}>{g.type}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{g.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* SA-specific graduation info */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#38BDF8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>SA graduation calendar</div>
          {[
            { item: 'Graduation ceremonies', detail: 'Most South African public universities hold two ceremonies per year: April (for November/December completions) and December/October (for June completions). If you complete mid-year, you\'ll often wait 6 months for your ceremony.' },
            { item: 'Supplementary exams', detail: 'If your final mark is 40–49%, most SA institutions offer a supplementary (supp) exam — one more attempt at the paper. A supp pass is usually capped at 50%. Below 40% = repeat the module (not a supp). Check your faculty rules — some departments don\'t offer supps for all modules.' },
            { item: 'Cost of extending graduation', detail: 'One extra semester at a South African public university typically costs R15,000–R45,000 in tuition (depending on institution and qualification). Add accommodation: R6,000–R18,000. Extension is expensive — addressing gaps early costs far less than extending.' },
            { item: 'Alternative options', detail: 'If you\'re significantly behind: (1) Part-time registration reduces annual cost, (2) Summer school at some universities allows extra credits, (3) Credit transfer from a related completed qualification may reduce remaining modules. Discuss with your faculty advisor.' },
          ].map(i => (
            <div key={i.item} style={{ marginBottom: 10, paddingLeft: 8, borderLeft: '2px solid rgba(56,189,248,0.3)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38BDF8', marginBottom: 2 }}>{i.item}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{i.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Section({ icon, label, colour, items }: {
  icon: string; label: string; colour: string; items: string[]
}) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
      }}>
        <span style={{ fontSize: 12 }}>{icon}</span>
        <span style={{
          fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase', color: colour,
        }}>
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            padding: '8px 10px',
            background: `${colour}08`,
            border: `0.5px solid ${colour}20`,
            borderRadius: 9,
          }}>
            <span style={{ color: colour, fontSize: 10, marginTop: 2, flexShrink: 0, fontWeight: 700 }}>→</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
