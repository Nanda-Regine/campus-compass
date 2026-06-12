'use client'

// ============================================================
// InterventionBanner — renders the top-queued non-modal
// intervention. Chip / nudge / banner variants only.
// Modal variant is handled by InterventionModal.
// ============================================================

import { useRouter } from 'next/navigation'
import { useStudentState } from '@/store/studentState'
import type { Intervention, InterventionUrgency } from '@/store/studentState'

// ─── Urgency → accent colour ──────────────────────────────────
function urgencyColor(urgency: InterventionUrgency): string {
  switch (urgency) {
    case 5: return 'var(--danger)'
    case 4: return 'var(--coral)'
    case 3: return 'var(--gold)'
    case 2: return 'var(--teal)'
    case 1: return 'var(--nova)'
  }
}

function urgencyBg(urgency: InterventionUrgency): string {
  switch (urgency) {
    case 5: return 'var(--danger-dim)'
    case 4: return 'var(--coral-dim)'
    case 3: return 'var(--gold-dim)'
    case 2: return 'var(--teal-dim)'
    case 1: return 'var(--nova-dim)'
  }
}

function urgencyBorder(urgency: InterventionUrgency): string {
  switch (urgency) {
    case 5: return 'var(--danger-border)'
    case 4: return 'rgba(232,112,64,0.30)'
    case 3: return 'var(--gold-border)'
    case 2: return 'var(--teal-border)'
    case 1: return 'var(--nova-border)'
  }
}

function urgencyLabel(urgency: InterventionUrgency): string {
  switch (urgency) {
    case 5: return 'CRITICAL'
    case 4: return 'IMPORTANT'
    case 3: return 'ACTION NEEDED'
    case 2: return 'HEADS UP'
    case 1: return 'NICE WORK'
  }
}

// ─── Chip variant ─────────────────────────────────────────────
function ChipBanner({ iv, onDismiss, onAction }: BannerProps) {
  const color = urgencyColor(iv.urgency)
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 12px 6px 10px',
      background: urgencyBg(iv.urgency),
      border: `1px solid ${urgencyBorder(iv.urgency)}`,
      borderRadius: 100,
      fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
      animation: 'fadeInUp 0.3s ease',
    }}>
      <span style={{ color, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em' }}>
        {urgencyLabel(iv.urgency)}
      </span>
      <span style={{ color: 'var(--text-secondary)' }}>{iv.title}</span>
      <button
        onClick={onAction}
        style={{ color, background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '0.7rem', fontFamily: 'var(--font-mono)', padding: 0 }}>
        {iv.actionLabel} →
      </button>
      <button onClick={onDismiss} aria-label="Dismiss"
        style={{ color: 'var(--text-muted)', background: 'none', border: 'none',
          cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}>
        ×
      </button>
    </div>
  )
}

// ─── Nudge variant ────────────────────────────────────────────
function NudgeBanner({ iv, onDismiss, onAction }: BannerProps) {
  const color = urgencyColor(iv.urgency)
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'var(--bg-surface)',
      border: `1px solid ${urgencyBorder(iv.urgency)}`,
      borderRadius: 12, padding: '12px 14px',
      animation: 'fadeInUp 0.3s ease',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '0.62rem', fontFamily: 'var(--font-mono)',
            color, letterSpacing: '0.07em', marginBottom: 3,
          }}>
            {urgencyLabel(iv.urgency)}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 2 }}>
            {iv.title}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {iv.message}
          </div>
        </div>
        <button onClick={onDismiss} aria-label="Dismiss"
          style={{ color: 'var(--text-muted)', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, flexShrink: 0, padding: 0 }}>
          ×
        </button>
      </div>
      <button onClick={onAction} style={{
        marginTop: 10, padding: '7px 14px',
        background: urgencyBg(iv.urgency),
        border: `1px solid ${urgencyBorder(iv.urgency)}`,
        borderRadius: 8, color,
        fontSize: '0.73rem', fontFamily: 'var(--font-mono)',
        cursor: 'pointer', fontWeight: 600,
      }}>
        {iv.actionLabel} →
      </button>
    </div>
  )
}

// ─── Banner variant ───────────────────────────────────────────
function FullBanner({ iv, onDismiss, onAction, onSnooze }: BannerProps & { onSnooze: () => void }) {
  const color = urgencyColor(iv.urgency)
  const bg    = urgencyBg(iv.urgency)
  const border = urgencyBorder(iv.urgency)
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'var(--bg-surface)',
      border: `1px solid ${border}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 14, padding: '14px 16px',
      animation: 'fadeInUp 0.35s ease',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}80, transparent)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
            color, letterSpacing: '0.08em', marginBottom: 4,
          }}>
            {urgencyLabel(iv.urgency)}
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: 5 }}>
            {iv.title}
          </div>
          <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {iv.message}
          </div>
        </div>
        <button onClick={onDismiss} aria-label="Dismiss"
          style={{ color: 'var(--text-muted)', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, flexShrink: 0, padding: 0, marginTop: -2 }}>
          ×
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={onAction} style={{
          flex: 1, padding: '8px 0',
          background: bg, border: `1px solid ${border}`,
          borderRadius: 8, color,
          fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
          cursor: 'pointer',
        }}>
          {iv.actionLabel} →
        </button>
        <button onClick={onSnooze} style={{
          padding: '8px 14px',
          background: 'transparent',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8, color: 'var(--text-tertiary)',
          fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
          cursor: 'pointer',
        }}>
          Snooze 4h
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────
interface BannerProps {
  iv: Intervention
  onDismiss: () => void
  onAction: () => void
}

export default function InterventionBanner() {
  const router = useRouter()
  const { interventions, dismissIntervention, suppressInterventions } = useStudentState()

  // Find top non-modal intervention
  const top = interventions.queue.find(iv => iv.variant !== 'modal')
  if (!top) return null

  // Check global suppression
  if (interventions.suppressedUntil) {
    if (new Date(interventions.suppressedUntil).getTime() > Date.now()) return null
  }

  const handleAction = () => {
    dismissIntervention(top.id)
    router.push(top.actionRoute)
  }

  const handleDismiss = () => dismissIntervention(top.id)

  const handleSnooze = () => {
    const until = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    suppressInterventions(until)
  }

  if (top.variant === 'chip') {
    return <ChipBanner iv={top} onDismiss={handleDismiss} onAction={handleAction} />
  }
  if (top.variant === 'nudge') {
    return <NudgeBanner iv={top} onDismiss={handleDismiss} onAction={handleAction} />
  }
  return <FullBanner iv={top} onDismiss={handleDismiss} onAction={handleAction} onSnooze={handleSnooze} />
}
