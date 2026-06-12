'use client'

// ============================================================
// InterventionModal — full-screen crisis modal for urgency-5
// interventions only. Blocks interaction until acted on or
// snoozed. Used for academic exclusion risk + financial crisis.
// ============================================================

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStudentState } from '@/store/studentState'

export default function InterventionModal() {
  const router = useRouter()
  const { interventions, dismissIntervention, suppressInterventions, setActiveIntervention } = useStudentState()

  // Find highest urgency modal intervention
  const crisis = interventions.queue.find(iv => iv.variant === 'modal' && iv.urgency === 5)

  // Set activeId when crisis appears
  useEffect(() => {
    if (crisis) setActiveIntervention(crisis.id)
    else setActiveIntervention(null)
  }, [crisis?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!crisis) return null

  // Check suppression
  if (interventions.suppressedUntil) {
    if (new Date(interventions.suppressedUntil).getTime() > Date.now()) return null
  }

  const handleAct = () => {
    dismissIntervention(crisis.id)
    router.push(crisis.actionRoute)
  }

  const handleSnooze = () => {
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    suppressInterventions(until)
  }

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(5, 4, 12, 0.88)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.25s ease',
      }} />

      {/* Modal card */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}>
        <div style={{
          position: 'relative', overflow: 'hidden',
          width: '100%', maxWidth: 420,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--danger-border)',
          borderRadius: 20,
          padding: '32px 24px 24px',
          animation: 'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: '0 0 60px rgba(224,90,107,0.2), 0 24px 48px rgba(0,0,0,0.6)',
        }}>
          {/* Top accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: 'linear-gradient(90deg, var(--danger), var(--coral), transparent)',
          }} />

          {/* Crisis icon */}
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'var(--danger-dim)',
            border: '1px solid var(--danger-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', marginBottom: 16,
          }}>
            ⚠️
          </div>

          {/* Label */}
          <div style={{
            fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
            color: 'var(--danger)', letterSpacing: '0.1em', marginBottom: 6,
          }}>
            CRITICAL ALERT
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)',
            margin: '0 0 10px', lineHeight: 1.3,
          }}>
            {crisis.title}
          </h2>

          {/* Message */}
          <p style={{
            fontSize: '0.82rem', color: 'var(--text-secondary)',
            lineHeight: 1.6, margin: '0 0 24px',
          }}>
            {crisis.message}
          </p>

          {/* Actions */}
          <button onClick={handleAct} style={{
            width: '100%', padding: '13px 0',
            background: 'var(--danger-dim)',
            border: '1px solid var(--danger-border)',
            borderRadius: 12, color: 'var(--danger)',
            fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
            cursor: 'pointer', marginBottom: 10,
          }}>
            {crisis.actionLabel} →
          </button>

          <button onClick={handleSnooze} style={{
            width: '100%', padding: '11px 0',
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12, color: 'var(--text-tertiary)',
            fontSize: '0.75rem', fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
          }}>
            Remind me tomorrow
          </button>
        </div>
      </div>
    </>
  )
}
