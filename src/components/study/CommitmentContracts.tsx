'use client'

// CommitmentContracts — loss-aversion anti-procrastination.
// Students stake XP on a task+deadline. Fail → XP deducted. Win → bonus XP.
// Enforced: 1 active contract at a time (server-side, also client-guarded).

import { useState, useEffect, useCallback } from 'react'
import { dispatchXP, penalizeXP } from '@/lib/xp-engine'

const STYLE_ID = 'varsityos-cc-styles'
function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes cc-slide { from{transform:translateY(8px);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes cc-pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
  `
  document.head.appendChild(el)
}

interface Contract {
  id: string
  task_description: string
  deadline: string
  xp_stake: number
  status: 'active' | 'completed' | 'failed'
  completed_at: string | null
  failed_at: string | null
  created_at: string
}

function deadline24h(isoDeadline: string): boolean {
  return new Date(isoDeadline).getTime() - Date.now() < 24 * 60 * 60 * 1000
}

function formatDeadline(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffH = Math.round(diffMs / 3_600_000)
  if (diffH < 0)    return 'Deadline passed'
  if (diffH < 1)    return 'Due in <1 hour'
  if (diffH < 24)   return `Due in ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `Due in ${diffD}d ${diffH % 24}h`
}

// ── Create Modal ─────────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void
  onCreate: (contract: Contract) => void
}

function CreateModal({ onClose, onCreate }: CreateModalProps) {
  const [desc, setDesc]       = useState('')
  const [date, setDate]       = useState('')
  const [time, setTime]       = useState('23:59')
  const [stake, setStake]     = useState(50)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  // Default deadline: tomorrow
  useEffect(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    setDate(d.toISOString().split('T')[0])
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!desc.trim() || !date) { setError('Fill in task and deadline'); return }
    setSaving(true)
    setError('')
    try {
      const deadlineIso = `${date}T${time}:00+02:00`  // SAST
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_description: desc.trim(), deadline: deadlineIso, xp_stake: stake }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create contract'); return }
      onCreate(data.contract)
      onClose()
    } catch {
      setError('Network error — check your connection')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    fontFamily: 'Sora,sans-serif', fontSize: 14,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, color: '#fff', outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9800,
      background: 'rgba(4,6,18,0.9)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#0d1225', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: 28, maxWidth: 420, width: '100%',
        animation: 'cc-slide 0.3s ease',
      }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#4ecf9e', letterSpacing: '0.18em', marginBottom: 12 }}>
          🤝 COMMITMENT CONTRACT
        </div>
        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 20 }}>
          What do you commit to?
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="e.g. Submit my CSC3002 assignment"
            rows={2}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...inputStyle, width: 110 }} />
          </div>

          <div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
              XP STAKE — you lose this if you fail: <span style={{ color: '#ff6b6b' }}>{stake} XP</span>
              {' '}(win bonus: <span style={{ color: '#4ecf9e' }}>+75 XP</span>)
            </div>
            <input
              type="range" min={10} max={500} step={5}
              value={stake} onChange={e => setStake(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#ff6b6b' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
              <span>Low risk (10)</span><span>High stakes (500)</span>
            </div>
          </div>

          {error && <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#ff6b6b' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '12px 0', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: 'rgba(255,255,255,0.5)',
              fontFamily: 'Sora,sans-serif', cursor: 'pointer', fontSize: 14,
            }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{
              flex: 2, padding: '12px 0', borderRadius: 12, border: 'none',
              background: saving ? 'rgba(78,207,158,0.4)' : '#4ecf9e',
              color: '#000', fontFamily: 'Sora,sans-serif', fontWeight: 700,
              fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? 'Committing…' : '🤝 I commit to this'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Widget ───────────────────────────────────────────────────────────────

export default function CommitmentContracts() {
  const [contracts, setContracts]   = useState<Contract[]>([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [acting, setActing]         = useState<string | null>(null)

  useEffect(() => { injectStyles() }, [])

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/contracts')
      const data = await res.json()
      setContracts(data.contracts ?? [])
    } catch { /* offline */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  // Auto-fail contracts that have passed their deadline while we were offline
  useEffect(() => {
    const active = contracts.filter(c => c.status === 'active')
    for (const c of active) {
      if (new Date(c.deadline) < new Date()) {
        void handleAction(c.id, 'fail', c.xp_stake)
        break
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts])

  const handleAction = async (id: string, action: 'complete' | 'fail', xpStake: number) => {
    setActing(id)
    try {
      const res  = await fetch('/api/contracts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      if (!res.ok) return
      const { contract } = await res.json()
      setContracts(prev => prev.map(c => c.id === id ? contract : c))

      if (action === 'complete') {
        dispatchXP('contract_completed')
      } else {
        penalizeXP(xpStake, 'Commitment contract failed')
      }
    } catch { /* offline */ } finally {
      setActing(null)
    }
  }

  const active    = contracts.find(c => c.status === 'active')
  const recent    = contracts.filter(c => c.status !== 'active').slice(0, 3)
  const hasActive = !!active

  if (loading) return null

  return (
    <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', padding: '16px 18px', animation: 'cc-slide 0.35s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#4ecf9e', letterSpacing: '0.18em' }}>
            🤝 COMMITMENT CONTRACTS
          </div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, color: '#fff', marginTop: 3 }}>
            Stake your XP on your word
          </div>
        </div>
        {!hasActive && (
          <button onClick={() => setShowCreate(true)} style={{
            fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700,
            padding: '7px 14px', borderRadius: 10, border: 'none',
            background: '#4ecf9e', color: '#000', cursor: 'pointer',
          }}>
            + Commit
          </button>
        )}
      </div>

      {/* Active contract */}
      {active && (() => {
        const isNear    = deadline24h(active.deadline)
        const isPassed  = new Date(active.deadline) < new Date()
        const accent    = isPassed ? '#ff6b6b' : isNear ? '#f59e0b' : '#4ecf9e'
        return (
          <div style={{
            borderRadius: 14, padding: '14px 16px', marginBottom: 14,
            background: `linear-gradient(135deg, ${accent}10 0%, rgba(0,0,0,0) 70%)`,
            border: `1px solid ${accent}30`,
            animation: isNear ? 'cc-pulse 2s ease-in-out infinite' : undefined,
          }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: accent, letterSpacing: '0.12em', marginBottom: 6 }}>
              {isPassed ? '⏰ DEADLINE PASSED' : isNear ? '⚡ ALMOST DUE' : '🎯 ACTIVE CONTRACT'}
            </div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 6, lineHeight: 1.35 }}>
              {active.task_description}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
                {formatDeadline(active.deadline)}
              </div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#ff6b6b' }}>
                💰 {active.xp_stake} XP at stake
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                disabled={!!acting}
                onClick={() => void handleAction(active.id, 'complete', active.xp_stake)}
                style={{
                  flex: 2, padding: '10px 0', borderRadius: 10, border: 'none',
                  background: '#4ecf9e', color: '#000',
                  fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13,
                  cursor: acting ? 'not-allowed' : 'pointer',
                }}
              >
                ✅ Done! (+75 XP)
              </button>
              <button
                disabled={!!acting}
                onClick={() => void handleAction(active.id, 'fail', active.xp_stake)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  border: '1px solid rgba(255,107,107,0.25)',
                  background: 'rgba(255,107,107,0.08)',
                  color: '#ff6b6b', fontFamily: 'Sora,sans-serif', fontSize: 12,
                  cursor: acting ? 'not-allowed' : 'pointer',
                }}
              >
                😔 Failed
              </button>
            </div>
          </div>
        )
      })()}

      {/* No active + history */}
      {!hasActive && recent.length === 0 && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🤝</div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
            No active contract. Commit to finishing something today — stake your XP on it.
          </div>
        </div>
      )}

      {/* Recent history */}
      {recent.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {recent.map(c => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              opacity: 0.7,
            }}>
              <span style={{ fontSize: 14 }}>{c.status === 'completed' ? '✅' : '❌'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Sora,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.6)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {c.task_description}
                </div>
              </div>
              <div style={{
                fontFamily: '"JetBrains Mono",monospace', fontSize: 9,
                color: c.status === 'completed' ? '#4ecf9e' : '#ff6b6b',
              }}>
                {c.status === 'completed' ? `+75 XP` : `-${c.xp_stake} XP`}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={c => { setContracts(prev => [c, ...prev]); setShowCreate(false) }}
        />
      )}
    </div>
  )
}
