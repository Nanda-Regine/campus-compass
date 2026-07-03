'use client'

// RewardUnlock — temptation bundling.
// Students define personal rewards tied to Pomodoro session milestones.
// Research: pairing an immediate reward with a boring task (temptation bundling)
// increases task initiation and completion by 52% (Milkman et al., 2014).

import { useState, useEffect, useCallback } from 'react'
import { loadXPState } from '@/lib/xp-engine'

const STYLE_ID = 'varsityos-reward-styles'
function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes rw-glow  { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0.4)} 50%{box-shadow:0 0 0 12px rgba(201,168,76,0)} }
    @keyframes rw-pop   { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
    @keyframes rw-shine { 0%{background-position:-200% center} 100%{background-position:200% center} }
  `
  document.head.appendChild(el)
}

const LS_KEY = 'varsityos_rewards'

interface Reward {
  id:        string
  title:     string
  milestone: number   // Pomodoro sessions needed
  claimed:   boolean
  created_at: string
}

const MILESTONE_OPTIONS = [1, 3, 5, 10, 20]

function loadRewards(): Reward[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}

function saveRewards(r: Reward[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(r))
}

function getPomodoroCount(): number {
  try {
    const state = loadXPState()
    return state.eventCounts['pomodoro_session'] ?? 0
  } catch { return 0 }
}

// ── Claim Celebration ─────────────────────────────────────────────────────────

function ClaimCelebration({ reward, onDone }: { reward: Reward; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9950,
      background: 'rgba(4,6,18,0.94)', backdropFilter: 'blur(16px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      animation: 'rw-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <div style={{ fontSize: 72, marginBottom: 20, filter: 'drop-shadow(0 0 32px #c9a84c)' }}>🎉</div>
      <div style={{
        fontFamily: 'Sora,sans-serif', fontWeight: 900, fontSize: 24,
        color: '#c9a84c', marginBottom: 12, textAlign: 'center',
        textShadow: '0 0 32px rgba(201,168,76,0.5)',
      }}>
        Reward unlocked!
      </div>
      <div style={{
        fontFamily: 'Sora,sans-serif', fontSize: 18, color: '#fff',
        marginBottom: 32, textAlign: 'center', maxWidth: 280, lineHeight: 1.4,
      }}>
        {reward.title}
      </div>
      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
        You earned it. Go enjoy it.
      </div>
    </div>
  )
}

// ── Create Form ───────────────────────────────────────────────────────────────

interface CreateFormProps {
  onSave:   (r: Reward) => void
  onCancel: () => void
}

function CreateForm({ onSave, onCancel }: CreateFormProps) {
  const [title,     setTitle]     = useState('')
  const [milestone, setMilestone] = useState(3)

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      id:         crypto.randomUUID(),
      title:      title.trim(),
      milestone,
      claimed:    false,
      created_at: new Date().toISOString(),
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9800,
      background: 'rgba(4,6,18,0.9)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#0d1225', borderRadius: 20, padding: 26,
        border: '1px solid rgba(201,168,76,0.2)', maxWidth: 380, width: '100%',
      }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#c9a84c', letterSpacing: '0.18em', marginBottom: 12 }}>
          🎁 DEFINE YOUR REWARD
        </div>
        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 17, color: '#fff', marginBottom: 20 }}>
          What will you treat yourself to?
        </div>

        <input
          type="text" value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Watch an episode of my show"
          style={{
            width: '100%', padding: '11px 14px', borderRadius: 11,
            fontFamily: 'Sora,sans-serif', fontSize: 13, marginBottom: 16,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', outline: 'none', boxSizing: 'border-box',
          }}
        />

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 10, letterSpacing: '0.1em' }}>
            AFTER HOW MANY POMODOROS?
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {MILESTONE_OPTIONS.map(m => (
              <button key={m} onClick={() => setMilestone(m)} style={{
                flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
                fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
                background: milestone === m ? '#c9a84c' : 'rgba(255,255,255,0.06)',
                color: milestone === m ? '#000' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.2s',
              }}>{m}</button>
            ))}
          </div>
        </div>

        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 18,
          background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
        }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 12, color: '#c9a84c' }}>
            After <strong>{milestone}</strong> Pomodoro{milestone !== 1 ? 's' : ''}: <strong>{title || '…'}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '11px 0', borderRadius: 11,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: 'rgba(255,255,255,0.4)',
            fontFamily: 'Sora,sans-serif', cursor: 'pointer', fontSize: 13,
          }}>Cancel</button>
          <button onClick={handleSave} disabled={!title.trim()} style={{
            flex: 2, padding: '11px 0', borderRadius: 11, border: 'none',
            background: title.trim() ? '#c9a84c' : 'rgba(255,255,255,0.06)',
            color: title.trim() ? '#000' : 'rgba(255,255,255,0.2)',
            fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13,
            cursor: title.trim() ? 'pointer' : 'not-allowed',
          }}>🎁 Set reward</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Widget ───────────────────────────────────────────────────────────────

export default function RewardUnlock() {
  const [rewards,       setRewards]       = useState<Reward[]>([])
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [showForm,      setShowForm]      = useState(false)
  const [celebrating,   setCelebrating]   = useState<Reward | null>(null)
  const [mounted,       setMounted]       = useState(false)

  useEffect(() => {
    injectStyles()
    setMounted(true)
    setRewards(loadRewards())
    setPomodoroCount(getPomodoroCount())

    // Listen for new XP events to refresh pomodoro count
    const handler = () => setPomodoroCount(getPomodoroCount())
    window.addEventListener('varsityos:xp', handler)
    return () => window.removeEventListener('varsityos:xp', handler)
  }, [])

  const addReward = useCallback((r: Reward) => {
    const next = [...rewards, r]
    setRewards(next)
    saveRewards(next)
    setShowForm(false)
  }, [rewards])

  const claimReward = useCallback((id: string) => {
    const reward = rewards.find(r => r.id === id)
    if (!reward) return
    const next = rewards.map(r => r.id === id ? { ...r, claimed: true } : r)
    setRewards(next)
    saveRewards(next)
    setCelebrating(reward)
  }, [rewards])

  const removeReward = useCallback((id: string) => {
    const next = rewards.filter(r => r.id !== id)
    setRewards(next)
    saveRewards(next)
  }, [rewards])

  if (!mounted) return null

  const activeRewards  = rewards.filter(r => !r.claimed)
  const unlocked       = activeRewards.filter(r => pomodoroCount >= r.milestone)
  const inProgress     = activeRewards.filter(r => pomodoroCount < r.milestone)

  return (
    <>
      <div style={{
        borderRadius: 18, padding: '16px 18px',
        border: '1px solid rgba(201,168,76,0.15)',
        background: unlocked.length > 0 ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#c9a84c', letterSpacing: '0.18em' }}>
              🎁 REWARD UNLOCK
            </div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginTop: 3 }}>
              Earn it, then enjoy it
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#c9a84c', fontWeight: 700 }}>
              🍅 {pomodoroCount}
            </div>
            <button onClick={() => setShowForm(true)} style={{
              fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700,
              padding: '6px 12px', borderRadius: 9, border: 'none',
              background: 'rgba(201,168,76,0.15)', color: '#c9a84c', cursor: 'pointer',
            }}>
              + Reward
            </button>
          </div>
        </div>

        {/* Unlocked — ready to claim */}
        {unlocked.map(r => (
          <div key={r.id} style={{
            borderRadius: 14, padding: '14px 16px', marginBottom: 10,
            background: 'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.06) 100%)',
            border: '1px solid rgba(201,168,76,0.4)',
            animation: 'rw-glow 2s ease-in-out infinite',
          }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#c9a84c', letterSpacing: '0.12em', marginBottom: 6 }}>
              🎉 UNLOCKED — YOU EARNED THIS
            </div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 12 }}>
              {r.title}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => claimReward(r.id)} style={{
                flex: 2, padding: '11px 0', borderRadius: 11, border: 'none',
                background: '#c9a84c', color: '#000',
                fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>
                🎁 Claim reward
              </button>
              <button onClick={() => removeReward(r.id)} style={{
                flex: 1, padding: '11px 0', borderRadius: 11,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: 'rgba(255,255,255,0.3)',
                fontFamily: 'Sora,sans-serif', fontSize: 12, cursor: 'pointer',
              }}>Remove</button>
            </div>
          </div>
        ))}

        {/* In progress */}
        {inProgress.map(r => {
          const pct = Math.min(100, Math.round((pomodoroCount / r.milestone) * 100))
          return (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 12, marginBottom: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 12, color: 'var(--text-primary)', marginBottom: 6 }}>
                  {r.title}
                </div>
                <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: 'linear-gradient(90deg, #c9a84c, #e8d080)',
                    borderRadius: 4, transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#c9a84c', fontWeight: 700 }}>
                  {pomodoroCount}/{r.milestone}
                </div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                  🍅 sessions
                </div>
              </div>
              <button onClick={() => removeReward(r.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.2)', fontSize: 12, padding: 0, flexShrink: 0,
              }}>✕</button>
            </div>
          )
        })}

        {activeRewards.length === 0 && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>🎁</div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
              Define a reward to unlock after your next study sessions. Working toward something you want makes starting easier.
            </div>
          </div>
        )}
      </div>

      {showForm && <CreateForm onSave={addReward} onCancel={() => setShowForm(false)} />}
      {celebrating && <ClaimCelebration reward={celebrating} onDone={() => setCelebrating(null)} />}
    </>
  )
}
