'use client'
// ─── Sunday Planning Session ──────────────────────────────────
// Guided 5-minute weekly ritual. Available anytime, prompted on Sundays.
// Generates a Monday-first weekly focus plan stored in localStorage.
import { useState } from 'react'

const STORAGE_KEY = 'varsityos-weekly-plan'
interface WeeklyPlan {
  weekStart: string  // Monday's date
  priorities: string[]
  wins: string[]
  blockers: string[]
  plan: string[]
  completedPriorities: number[]
  generatedAt: string
}

function getMonday(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day  // go back to Monday
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function buildWeeklyPlan(priorities: string[], wins: string[], blockers: string[]): string[] {
  const plan: string[] = []

  plan.push(`MONDAY — Priority attack: Start with "${priorities[0] || 'your biggest goal'}". Schedule a 90-minute deep work block before noon. This is your week's most important session.`)

  if (priorities[1]) plan.push(`TUESDAY–WEDNESDAY — Second priority: Focus on "${priorities[1]}". Break it into 2 concrete tasks and tick one per day.`)

  if (wins.length > 0) plan.push(`CARRY FORWARD — Last week you succeeded at: ${wins[0]}. Build on this momentum. Do more of what worked.`)

  if (blockers.length > 0 && blockers[0]) plan.push(`BLOCKER TO SOLVE: "${blockers[0]}" — Spend 15 minutes on Thursday identifying one specific action that would reduce this block. Don't let it drift into next week.`)

  plan.push(`THURSDAY — Mid-week check: Are you ahead or behind on your priorities? If behind, remove one lower-priority commitment to protect your main goals.`)

  plan.push(`FRIDAY — Completion day: Finish and submit anything that\'s due. Don\'t start new deep work. Log your wins for next week\'s planning session.`)

  plan.push(`WEEKEND — Recovery matters: 1 full rest day minimum. Your brain consolidates learning during rest. A rested student performs better than an exhausted one who studied through the weekend.`)

  if (priorities.length >= 3) plan.push(`WEEK'S THIRD PRIORITY — "${priorities[2]}" — Schedule this as a Thursday afternoon block, or attach it to something you\'re already doing.`)

  return plan
}

type Stage = 'intro' | 'wins' | 'priorities' | 'blockers' | 'plan'

export default function SundayPlanning() {
  const today = new Date()
  const isSunday = today.getDay() === 0
  const [open, setOpen] = useState(false)
  const [stage, setStage] = useState<Stage>('intro')
  const [wins, setWins] = useState(['', ''])
  const [priorities, setPriorities] = useState(['', '', ''])
  const [blockers, setBlockers] = useState([''])
  const [plan, setPlan] = useState<WeeklyPlan | null>(() => {
    if (typeof window === 'undefined') return null
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') } catch { return null }
  })

  const generate = () => {
    const w = wins.filter(Boolean)
    const p = priorities.filter(Boolean)
    const b = blockers.filter(Boolean)
    const weekPlan = buildWeeklyPlan(p, w, b)
    const weekly: WeeklyPlan = { weekStart: getMonday(), priorities: p, wins: w, blockers: b, plan: weekPlan, completedPriorities: [], generatedAt: new Date().toISOString() }
    setPlan(weekly)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(weekly))
    setStage('plan')
  }

  const togglePriority = (i: number) => {
    if (!plan) return
    const completed = plan.completedPriorities.includes(i) ? plan.completedPriorities.filter(x => x !== i) : [...plan.completedPriorities, i]
    const updated = { ...plan, completedPriorities: completed }
    setPlan(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  if (!open) {
    const hasPlan = plan && plan.weekStart === getMonday()
    const completedCount = plan?.completedPriorities.length || 0
    const totalPriorities = plan?.priorities.length || 0
    return (
      <button onClick={() => { setOpen(true); if (hasPlan) setStage('plan') }} style={{ display: 'flex', width: '100%', padding: '13px 16px', background: 'var(--bg-surface)', border: `1px solid ${isSunday && !hasPlan ? 'rgba(250,204,21,0.3)' : 'var(--border-subtle)'}`, borderRadius: 14, cursor: 'pointer', gap: 12, alignItems: 'center', textAlign: 'left' }}>
        <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{hasPlan ? '📋' : '🌅'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: isSunday && !hasPlan ? 'var(--gold)' : 'var(--text-muted)', letterSpacing: '0.07em', marginBottom: 2 }}>{isSunday ? 'SUNDAY PLANNING' : 'WEEKLY PLAN'}{isSunday && !hasPlan ? ' · TIME TO PLAN' : ''}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {hasPlan ? `Week of ${plan.weekStart} · ${completedCount}/${totalPriorities} priorities done` : 'Plan your week in 5 minutes'}
          </div>
        </div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>→</div>
      </button>
    )
  }

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--gold)', letterSpacing: '0.08em' }}>WEEKLY PLANNING SESSION</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 1 }}>5-minute weekly ritual</div>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
      </div>

      <div style={{ padding: '16px' }}>
        {stage === 'intro' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Weekly planning takes 5 minutes and gives you 3× more clarity about your week. You&apos;ll answer 3 questions in under 5 minutes.
            </div>
            {[{ icon: '🏆', q: '2 wins from last week' }, { icon: '🎯', q: '3 priorities for this week' }, { icon: '🧱', q: '1 thing blocking your progress' }].map(q => (
              <div key={q.q} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <span style={{ fontSize: '1.1rem' }}>{q.icon}</span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{q.q}</div>
              </div>
            ))}
            <button onClick={() => setStage('wins')} style={{ padding: '11px 0', background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.25)', borderRadius: 10, color: 'var(--gold)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
              Start planning →
            </button>
            {plan && plan.weekStart === getMonday() && (
              <button onClick={() => setStage('plan')} style={{ padding: '9px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-secondary)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
                View existing plan →
              </button>
            )}
          </div>
        )}

        {stage === 'wins' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>🏆 What did you accomplish last week?</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>No win is too small. Even showing up counts.</div>
            {[0, 1].map(i => (
              <input key={i} value={wins[i]} onChange={e => setWins(v => v.map((w, j) => j === i ? e.target.value : w))} placeholder={i === 0 ? 'e.g. Submitted my assignment on time' : 'e.g. Made it to all my classes this week'} style={{ padding: '10px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.8rem', width: '100%' }} />
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={() => setStage('intro')} style={{ padding: '9px 0', flex: 1, background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer' }}>Back</button>
              <button onClick={() => setStage('priorities')} style={{ padding: '9px 0', flex: 2, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.25)', borderRadius: 8, color: 'var(--gold)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>Next →</button>
            </div>
          </div>
        )}

        {stage === 'priorities' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>🎯 What are your 3 priorities this week?</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Be specific. "Study ECO1010" → "Complete Chapter 4 exercises + revision notes".</div>
            {[0, 1, 2].map(i => (
              <input key={i} value={priorities[i]} onChange={e => setPriorities(v => v.map((p, j) => j === i ? e.target.value : p))} placeholder={['Priority 1 (most important)', 'Priority 2', 'Priority 3 (optional)'][i]} style={{ padding: '10px 12px', background: 'var(--bg-base)', border: `1px solid ${i === 0 ? 'rgba(250,204,21,0.3)' : 'var(--border-default)'}`, borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.8rem', width: '100%' }} />
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={() => setStage('wins')} style={{ padding: '9px 0', flex: 1, background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer' }}>Back</button>
              <button onClick={() => setStage('blockers')} disabled={!priorities[0]} style={{ padding: '9px 0', flex: 2, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.25)', borderRadius: 8, color: 'var(--gold)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer', opacity: priorities[0] ? 1 : 0.5 }}>Next →</button>
            </div>
          </div>
        )}

        {stage === 'blockers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>🧱 What is blocking your progress?</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>One thing you need to remove or work around this week.</div>
            <input value={blockers[0]} onChange={e => setBlockers([e.target.value])} placeholder="e.g. Haven't started the assignment, feeling overwhelmed" style={{ padding: '10px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.8rem', width: '100%' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={() => setStage('priorities')} style={{ padding: '9px 0', flex: 1, background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer' }}>Back</button>
              <button onClick={generate} style={{ padding: '9px 0', flex: 2, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.25)', borderRadius: 8, color: 'var(--gold)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>Build my week plan →</button>
            </div>
          </div>
        )}

        {stage === 'plan' && plan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)' }}>Week of {plan.weekStart}</div>
              <div style={{ fontSize: '0.62rem', color: plan.completedPriorities.length === plan.priorities.length ? 'var(--teal)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{plan.completedPriorities.length}/{plan.priorities.length} done</div>
            </div>
            {/* Priorities with checkboxes */}
            {plan.priorities.map((p, i) => (
              <button key={i} onClick={() => togglePriority(i)} style={{ display: 'flex', gap: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${plan.completedPriorities.includes(i) ? 'rgba(52,211,153,0.2)' : 'var(--border-subtle)'}`, borderRadius: 8, cursor: 'pointer', textAlign: 'left', alignItems: 'center' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${plan.completedPriorities.includes(i) ? 'var(--teal)' : 'var(--border-default)'}`, background: plan.completedPriorities.includes(i) ? 'rgba(52,211,153,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.55rem', color: 'var(--teal)' }}>{plan.completedPriorities.includes(i) ? '✓' : ''}</div>
                <div style={{ fontSize: '0.75rem', color: plan.completedPriorities.includes(i) ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: plan.completedPriorities.includes(i) ? 'line-through' : 'none', flex: 1 }}>{p}</div>
              </button>
            ))}
            {/* Week plan steps */}
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 6 }}>YOUR WEEK STRATEGY</div>
              {plan.plan.map((s, i) => (
                <div key={i} style={{ padding: '8px 10px', marginBottom: 5, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 7, fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s}</div>
              ))}
            </div>
            <button onClick={() => { setStage('intro'); setWins(['', '']); setPriorities(['', '', '']); setBlockers(['']) }} style={{ padding: '9px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-muted)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', cursor: 'pointer', marginTop: 4 }}>
              Redo planning session
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
