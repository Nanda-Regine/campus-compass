'use client'

// ============================================================
// CatchUpPlanner — Nova-powered academic recovery modal.
// Triggered by "Help me catch up" button or academic_exclusion
// intervention. Streams a personalised 30-day recovery plan.
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { useStudentState } from '@/store/studentState'
import { useAppStore } from '@/store'
import type { RiskLevel } from '@/store/studentState'

interface Props {
  open: boolean
  onClose: () => void
}

const RISK_COLOR: Record<RiskLevel, string> = {
  safe:     'var(--teal)',
  watch:    'var(--gold)',
  warning:  'var(--coral)',
  critical: 'var(--danger)',
}

const RISK_BG: Record<RiskLevel, string> = {
  safe:     'var(--teal-dim)',
  watch:    'var(--gold-dim)',
  warning:  'var(--coral-dim)',
  critical: 'var(--danger-dim)',
}

export default function CatchUpPlanner({ open, onClose }: Props) {
  const { academic, wellness, schedule } = useStudentState()
  const { modules } = useAppStore()
  const [plan, setPlan] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const planRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom as plan streams in
  useEffect(() => {
    if (planRef.current) planRef.current.scrollTop = planRef.current.scrollHeight
  }, [plan])

  // Reset when modal closes
  useEffect(() => {
    if (!open) { setPlan(''); setStarted(false) }
  }, [open])

  if (!open) return null

  const atRiskModules = modules.filter(m => {
    const r = academic.moduleRisks[m.id]
    return r === 'warning' || r === 'critical'
  })

  const handleGenerate = async () => {
    setLoading(true)
    setStarted(true)
    setPlan('')

    const context = {
      riskLevel:        academic.riskLevel,
      catchUpDebtHrs:   academic.catchUpDebtHrs,
      completionRate:   academic.completionRate,
      examPressure:     academic.examPressure,
      burnoutScore:     wellness.burnoutScore,
      procrastIndex:    schedule.procrastIndex,
      overdueTaskCount: schedule.weekPlan.filter(t => t.status === 'overdue').length,
      atRiskModules:    atRiskModules.map(m => m.module_name || m.name),
    }

    try {
      const res = await fetch('/api/orchestration/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'catchup', context }),
      })

      if (!res.ok || !res.body) throw new Error('Failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6)
            if (raw === '[DONE]') break
            try {
              const evt = JSON.parse(raw)
              if (evt.type === 'content_block_delta' && evt.delta?.text) {
                setPlan(prev => prev + evt.delta.text)
              }
            } catch { /* skip malformed */ }
          }
        }
      }
    } catch {
      setPlan('Could not generate plan right now. Try again or ask Nova directly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 8998,
          background: 'rgba(5,4,12,0.82)', backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 8999,
        maxHeight: '90dvh',
        background: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border-default)',
        borderRadius: '20px 20px 0 0',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInFromBottom 0.35s cubic-bezier(0.32,0.72,0,1)',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 100, background: 'var(--border-default)' }} />
        </div>

        {/* Header */}
        <div style={{
          padding: '12px 20px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, var(--danger), var(--coral), var(--gold), transparent)',
          }} />
          <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--danger)', letterSpacing: '0.08em', marginBottom: 4 }}>
            RECOVERY MODE
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Catch-Up Planner
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            Nova will build you a personalised 30-day recovery plan.
          </div>
        </div>

        {/* Scroll content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>

          {/* State snapshot */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16,
          }}>
            {[
              { label: 'Academic risk', value: academic.riskLevel.toUpperCase(), risk: academic.riskLevel },
              { label: 'Catch-up debt',  value: `${academic.catchUpDebtHrs}h`,    risk: academic.catchUpDebtHrs >= 6 ? 'warning' : 'watch' as RiskLevel },
              { label: 'Completion',    value: `${academic.completionRate}%`,     risk: academic.completionRate >= 70 ? 'safe' : 'warning' as RiskLevel },
              { label: 'Burnout',       value: `${wellness.burnoutScore}/100`,    risk: wellness.burnoutScore > 60 ? 'warning' : 'safe' as RiskLevel },
            ].map(({ label, value, risk }) => (
              <div key={label} style={{
                background: 'var(--bg-surface)',
                border: `1px solid ${RISK_COLOR[risk as RiskLevel]}40`,
                borderRadius: 10, padding: '10px 12px',
              }}>
                <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: RISK_COLOR[risk as RiskLevel] }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* At-risk modules */}
          {atRiskModules.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', letterSpacing: '0.06em', marginBottom: 8 }}>
                MODULES NEEDING ATTENTION
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {atRiskModules.map(m => {
                  const risk = academic.moduleRisks[m.id] as RiskLevel ?? 'watch'
                  return (
                    <div key={m.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: RISK_BG[risk],
                      border: `1px solid ${RISK_COLOR[risk]}40`,
                      borderRadius: 8,
                    }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {m.module_name || m.name}
                      </span>
                      <span style={{
                        fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                        color: RISK_COLOR[risk], letterSpacing: '0.06em',
                      }}>
                        {risk.toUpperCase()}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Plan output */}
          {started && (
            <div
              ref={planRef}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12, padding: '14px 16px',
                fontSize: '0.8rem', color: 'var(--text-secondary)',
                lineHeight: 1.65, maxHeight: 320, overflowY: 'auto',
                whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)',
                marginBottom: 16,
              }}
            >
              {plan || (
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                  Nova is thinking...
                </span>
              )}
              {loading && (
                <span style={{ display: 'inline-block', width: 8, height: 14,
                  background: 'var(--nova)', borderRadius: 2,
                  animation: 'nova-dot-bounce 1s infinite', verticalAlign: 'middle', marginLeft: 2 }} />
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ padding: '12px 20px 28px', borderTop: '1px solid var(--border-subtle)' }}>
          {!started ? (
            <button
              onClick={handleGenerate}
              style={{
                width: '100%', padding: '14px 0',
                background: 'var(--danger-dim)',
                border: '1px solid var(--danger-border)',
                borderRadius: 14, color: 'var(--danger)',
                fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                cursor: 'pointer',
              }}>
              Build my recovery plan →
            </button>
          ) : (
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '14px 0',
                background: 'var(--teal-dim)',
                border: '1px solid var(--teal-border)',
                borderRadius: 14, color: 'var(--teal)',
                fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                cursor: 'pointer',
              }}>
              {loading ? 'Planning...' : 'Got it — close'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
