'use client'

// ProcrastinationJournal — structured post-failure reflection.
// Research: "What got in the way?" + "What will I do differently?" journaling
// increases follow-through on rescheduled tasks by 38% (Oettingen, 2014).
// Triggered from CommitmentContracts on fail, or opened manually.

import { useState, useEffect, useCallback } from 'react'
import { dispatchXP } from '@/lib/xp-engine'
import toast from 'react-hot-toast'

interface JournalEntry {
  id:         string
  trigger:    string
  obstacle:   string
  plan:       string
  created_at: string
}

// ── Reflection Modal ──────────────────────────────────────────────────────────

interface ReflectionModalProps {
  trigger:  'contract_failed' | 'deadline_missed' | 'manual'
  taskDesc: string
  onClose:  () => void
  onSaved:  (entry: JournalEntry) => void
}

export function ProcrastinationReflectionModal({ trigger, taskDesc, onClose, onSaved }: ReflectionModalProps) {
  const [obstacle, setObstacle] = useState('')
  const [plan,     setPlan]     = useState('')
  const [saving,   setSaving]   = useState(false)

  const triggerLabel = trigger === 'contract_failed'  ? 'Contract failed'
                     : trigger === 'deadline_missed'  ? 'Deadline missed'
                     : 'Reflection'

  const handleSave = async () => {
    if (!obstacle.trim() || !plan.trim()) {
      toast.error('Answer both questions to earn your XP')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/procrastination-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger, obstacle: obstacle.trim(), plan: plan.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        dispatchXP('journal_entry')
        onSaved(data.entry)
        toast.success('Reflection saved · +10 XP')
        onClose()
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const taStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 11,
    fontFamily: 'Sora,sans-serif', fontSize: 13, lineHeight: 1.55,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', outline: 'none', resize: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9900,
      background: 'rgba(4,6,18,0.95)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#0d1225', borderRadius: 22, padding: 28, maxWidth: 420, width: '100%',
        maxHeight: '85dvh', overflowY: 'auto',
        border: '1px solid rgba(255,107,107,0.2)',
      }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#ff6b6b', letterSpacing: '0.18em', marginBottom: 10 }}>
          📓 {triggerLabel.toUpperCase()} — REFLECTION
        </div>
        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 6 }}>
          What happened?
        </div>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>
          {taskDesc}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 7, letterSpacing: '0.1em' }}>
              1. WHAT GOT IN THE WAY?
            </div>
            <textarea
              value={obstacle}
              onChange={e => setObstacle(e.target.value)}
              placeholder="e.g. I kept checking Instagram, got anxious about where to start, ran out of time…"
              rows={3}
              style={taStyle}
            />
          </div>

          <div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 7, letterSpacing: '0.1em' }}>
              2. WHAT WILL YOU DO DIFFERENTLY?
            </div>
            <textarea
              value={plan}
              onChange={e => setPlan(e.target.value)}
              placeholder="e.g. I'll put my phone in another room and start with just 5 minutes…"
              rows={3}
              style={taStyle}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px 0', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: 'rgba(255,255,255,0.4)',
            fontFamily: 'Sora,sans-serif', cursor: 'pointer', fontSize: 13,
          }}>Skip</button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 2, padding: '12px 0', borderRadius: 12, border: 'none',
            background: saving ? 'rgba(78,207,158,0.3)' : '#4ecf9e',
            color: '#000', fontFamily: 'Sora,sans-serif', fontWeight: 700,
            fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Saving…' : '📓 Save reflection (+10 XP)'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Journal History Widget ────────────────────────────────────────────────────

export default function ProcrastinationJournal() {
  const [entries,    setEntries]    = useState<JournalEntry[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [expanded,   setExpanded]   = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/procrastination-journal')
      const data = await res.json()
      setEntries(data.entries ?? [])
    } catch { /* offline */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const triggerIcon = (t: string) =>
    t === 'contract_failed' ? '❌' : t === 'deadline_missed' ? '⏰' : '📓'

  if (loading) return null

  return (
    <>
      <div style={{
        borderRadius: 18, padding: '16px 18px',
        border: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em' }}>
              📓 PROCRASTINATION JOURNAL
            </div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginTop: 3 }}>
              Reflect & rewire
            </div>
          </div>
          <button onClick={() => setShowModal(true)} style={{
            fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700,
            padding: '7px 14px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
          }}>
            + Reflect
          </button>
        </div>

        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>📓</div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
              When things don't go to plan, reflect here. Every miss is data — not failure.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {entries.slice(0, 4).map(entry => (
              <div
                key={entry.id}
                onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                style={{
                  borderRadius: 11, padding: '10px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: expanded === entry.id ? 10 : 0 }}>
                  <span>{triggerIcon(entry.trigger)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'Sora,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.6)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {entry.obstacle.slice(0, 60)}{entry.obstacle.length > 60 ? '…' : ''}
                    </div>
                  </div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
                    {new Date(entry.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                {expanded === entry.id && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: 'rgba(255,255,255,0.25)', marginBottom: 4, letterSpacing: '0.1em' }}>OBSTACLE</div>
                      <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{entry.obstacle}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: 'rgba(255,255,255,0.25)', marginBottom: 4, letterSpacing: '0.1em' }}>PLAN</div>
                      <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 12, color: '#4ecf9e', lineHeight: 1.5 }}>{entry.plan}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <ProcrastinationReflectionModal
          trigger="manual"
          taskDesc="General reflection"
          onClose={() => setShowModal(false)}
          onSaved={entry => { setEntries(prev => [entry, ...prev]); setShowModal(false) }}
        />
      )}
    </>
  )
}
