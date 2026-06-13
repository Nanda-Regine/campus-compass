'use client'
// ─── Goal Architecture ────────────────────────────────────────
// 10-year vision → 3-year goals → 90-day sprints → daily 3
import { useState, useEffect, useRef } from 'react'
import { signals } from '@/store/signals'
import { createClient } from '@/lib/supabase/client'

interface DailyThree { date: string; tasks: [string, string, string]; completed: [boolean, boolean, boolean] }
interface Sprint { id: number; goal: string; startDate: string; endDate: string; milestones: string[]; milestonesDone?: boolean[]; completed: boolean }
interface YearGoal { id: number; year: number; goal: string; whyItMatters: string; done: boolean }
interface GoalState { vision: string; visionWhy: string; yearGoals: YearGoal[]; sprints: Sprint[]; dailyLogs: DailyThree[] }

const EMPTY: GoalState = { vision: '', visionWhy: '', yearGoals: [], sprints: [], dailyLogs: [] }
const LS_KEY = 'varsityos-goals'

function loadLocal(): GoalState { if (typeof window === 'undefined') return EMPTY; try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') || EMPTY } catch { return EMPTY } }
function saveLocal(s: GoalState) { if (typeof window !== 'undefined') localStorage.setItem(LS_KEY, JSON.stringify(s)) }

function calcDailyStreak(logs: DailyThree[]): number {
  const today = new Date().toISOString().split('T')[0]
  let streak = 0
  let checkDate = today
  for (let i = 0; i < 365; i++) {
    const log = logs.find(l => l.date === checkDate)
    if (!log || !log.completed.some(Boolean)) break
    streak++
    const d = new Date(checkDate)
    d.setDate(d.getDate() - 1)
    checkDate = d.toISOString().split('T')[0]
  }
  return streak
}

type Tab = 'vision' | 'years' | 'sprint' | 'daily'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'vision', label: '10-Year Vision', icon: '🌟' },
  { id: 'years',  label: '3-Year Goals',   icon: '🗓️' },
  { id: 'sprint', label: '90-Day Sprint',  icon: '🏃' },
  { id: 'daily',  label: 'Daily 3',        icon: '☀️' },
]

export default function GoalArchitecture() {
  const [state, setState] = useState<GoalState>(loadLocal)
  const [tab, setTab] = useState<Tab>('vision')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()

  // Load from Supabase on mount, merge with localStorage (Supabase wins)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('user_goals').select('state').eq('user_id', user.id).single()
        .then(({ data }) => {
          if (data?.state && Object.keys(data.state).length > 0) {
            const remote = data.state as GoalState
            setState(remote)
            saveLocal(remote)
          } else {
            // First time — migrate localStorage data up to Supabase
            const local = loadLocal()
            if (local.vision || local.yearGoals.length || local.sprints.length) {
              supabase.from('user_goals').upsert({ user_id: user.id, state: local, updated_at: new Date().toISOString() }).then(() => {})
            }
          }
        })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const update = (s: GoalState) => {
    setState(s)
    saveLocal(s)
    // Debounce Supabase write — wait 1s after last change
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) supabase.from('user_goals').upsert({ user_id: user.id, state: s, updated_at: new Date().toISOString() }).then(() => {})
      })
    }, 1000)
  }

  const streak = calcDailyStreak(state.dailyLogs)
  const todayLog = state.dailyLogs.find(l => l.date === new Date().toISOString().split('T')[0])
  const todayDone = todayLog?.completed.filter(Boolean).length ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-surface)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, padding: '16px 18px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,var(--indigo,#6366F1),var(--teal),transparent)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--indigo,#6366F1)', letterSpacing: '0.09em', marginBottom: 4 }}>GOAL ARCHITECTURE</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Build the life you actually want</div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 3 }}>Vision → 3-year goals → 90-day sprints → daily 3</div>
          </div>
          {streak > 0 && (
            <div style={{ textAlign: 'center', padding: '6px 12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10 }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--indigo,#6366F1)', fontFamily: 'var(--font-mono)' }}>{streak}</div>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>day streak</div>
            </div>
          )}
        </div>
      </div>

      {/* Daily progress pulse — always visible */}
      {todayLog && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 14px', background: todayDone === 3 ? 'rgba(52,211,153,0.07)' : 'var(--bg-surface)', border: `1px solid ${todayDone === 3 ? 'rgba(52,211,153,0.2)' : 'var(--border-subtle)'}`, borderRadius: 10 }}>
          {([0, 1, 2] as const).map(i => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: todayLog.completed[i] ? 'var(--teal)' : 'var(--bg-elevated)', border: '1px solid var(--border-default)' }} />
          ))}
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: 4 }}>
            {todayDone === 3 ? '🎯 Daily 3 complete' : `${todayDone}/3 today`}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '1px solid var(--border-subtle)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flexShrink: 0, padding: '8px 10px', background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid var(--indigo,#6366F1)' : '2px solid transparent', color: tab === t.id ? 'var(--indigo,#6366F1)' : 'var(--text-tertiary)', fontSize: '0.67rem', fontFamily: 'var(--font-mono)', fontWeight: tab === t.id ? 700 : 400, cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'vision' && <VisionTab state={state} update={update} />}
      {tab === 'years'  && <YearsTab state={state} update={update} />}
      {tab === 'sprint' && <SprintTab state={state} update={update} />}
      {tab === 'daily'  && <DailyTab state={state} update={update} />}
    </div>
  )
}

function VisionTab({ state, update }: { state: GoalState; update: (s: GoalState) => void }) {
  const [editing, setEditing] = useState(!state.vision)
  const [form, setForm] = useState({ vision: state.vision, why: state.visionWhy })
  const save = () => { update({ ...state, vision: form.vision, visionWhy: form.why }); setEditing(false) }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
        Your 10-year vision is not a plan. It is a <em>direction</em>. Write it as if you are describing your life in vivid detail — not a résumé, but a real day in 2036. What do you see? Where do you live? What work do you do?
      </div>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>My 10-year vision (write freely)</div>
            <textarea value={form.vision} onChange={e => setForm(v => ({ ...v, vision: e.target.value }))} rows={5} placeholder="In 2036, I wake up in..." style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.8rem', lineHeight: 1.65, resize: 'vertical' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Why does this matter to me? (your deep reason)</div>
            <textarea value={form.why} onChange={e => setForm(v => ({ ...v, why: e.target.value }))} rows={3} placeholder="This matters because..." style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.8rem', lineHeight: 1.65, resize: 'vertical' }} />
          </div>
          <button onClick={save} style={{ padding: '11px 0', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, color: 'var(--indigo,#6366F1)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>Save vision →</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '16px', borderLeft: '3px solid var(--indigo,#6366F1)' }}>
            <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--indigo,#6366F1)', marginBottom: 6 }}>MY VISION — 2036</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.7, fontStyle: 'italic' }}>{state.vision}</div>
          </div>
          {state.visionWhy && (
            <div style={{ padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
              <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 4 }}>WHY IT MATTERS</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{state.visionWhy}</div>
            </div>
          )}
          <button onClick={() => setEditing(true)} style={{ padding: '9px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-muted)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>Edit vision</button>
        </div>
      )}
    </div>
  )
}

function YearsTab({ state, update }: { state: GoalState; update: (s: GoalState) => void }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ year: '2027', goal: '', why: '' })
  const add = () => { if (!form.goal) return; const g: YearGoal = { id: Date.now(), year: parseInt(form.year), goal: form.goal, whyItMatters: form.why, done: false }; update({ ...state, yearGoals: [...state.yearGoals, g].sort((a, b) => a.year - b.year) }); setAdding(false); setForm({ year: '2027', goal: '', why: '' }) }
  const years = [2026, 2027, 2028, 2029, 2030]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>3-year goals should be ambitious but achievable. Set 1–2 goals per year. Each should be a milestone toward your 10-year vision.</div>
      {years.map(y => {
        const yGoals = state.yearGoals.filter(g => g.year === y)
        return yGoals.length > 0 ? (
          <div key={y}>
            <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 6 }}>{y}</div>
            {yGoals.map(g => (
              <div key={g.id} style={{ background: 'var(--bg-surface)', border: `1px solid ${g.done ? 'rgba(52,211,153,0.2)' : 'var(--border-subtle)'}`, borderRadius: 10, padding: '11px 14px', marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{g.goal}</div>
                    {g.whyItMatters && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>Why: {g.whyItMatters}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                    <button onClick={() => update({ ...state, yearGoals: state.yearGoals.map(x => x.id === g.id ? { ...x, done: !x.done } : x) })} style={{ fontSize: '0.6rem', padding: '2px 8px', background: g.done ? 'rgba(52,211,153,0.1)' : 'transparent', border: `1px solid ${g.done ? 'rgba(52,211,153,0.25)' : 'var(--border-subtle)'}`, borderRadius: 100, color: g.done ? 'var(--teal)' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{g.done ? '✓ Done' : 'Mark done'}</button>
                    <button onClick={() => update({ ...state, yearGoals: state.yearGoals.filter(x => x.id !== g.id) })} style={{ fontSize: '0.6rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null
      })}
      {adding ? (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <select value={form.year} onChange={e => setForm(v => ({ ...v, year: e.target.value }))} style={{ padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <input placeholder="Goal (what will you achieve?) *" value={form.goal} onChange={e => setForm(v => ({ ...v, goal: e.target.value }))} style={{ padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }} />
          <input placeholder="Why does this matter?" value={form.why} onChange={e => setForm(v => ({ ...v, why: e.target.value }))} style={{ padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={add} style={{ flex: 1, padding: '9px 0', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, color: 'var(--indigo,#6366F1)', fontSize: '0.73rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>Add goal</button>
            <button onClick={() => setAdding(false)} style={{ padding: '9px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-tertiary)', fontSize: '0.73rem', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ padding: '11px 0', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, color: 'var(--indigo,#6366F1)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>+ Add year goal</button>
      )}
    </div>
  )
}

function SprintTab({ state, update }: { state: GoalState; update: (s: GoalState) => void }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ goal: '', start: '', end: '', m1: '', m2: '', m3: '' })
  const activeSprint = state.sprints.find(s => !s.completed)
  const add = () => {
    if (!form.goal || !form.start || !form.end) return
    const milestones = [form.m1, form.m2, form.m3].filter(Boolean)
    const s: Sprint = { id: Date.now(), goal: form.goal, startDate: form.start, endDate: form.end, milestones, milestonesDone: milestones.map(() => false), completed: false }
    update({ ...state, sprints: [...state.sprints, s] })
    setAdding(false); setForm({ goal: '', start: '', end: '', m1: '', m2: '', m3: '' })
  }
  const today = new Date().toISOString().split('T')[0]
  const daysLeft = activeSprint ? Math.max(0, Math.ceil((new Date(activeSprint.endDate).getTime() - new Date(today).getTime()) / 86400000)) : 0
  const totalDays = activeSprint ? Math.ceil((new Date(activeSprint.endDate).getTime() - new Date(activeSprint.startDate).getTime()) / 86400000) : 90
  const pct = activeSprint ? Math.min(100, Math.max(0, 100 - (daysLeft / totalDays * 100))) : 0

  const toggleMilestone = (idx: number) => {
    if (!activeSprint) return
    const done = [...(activeSprint.milestonesDone ?? activeSprint.milestones.map(() => false))]
    done[idx] = !done[idx]
    update({ ...state, sprints: state.sprints.map(s => s.id === activeSprint.id ? { ...s, milestonesDone: done } : s) })
  }
  const milestoneDoneArr = activeSprint ? (activeSprint.milestonesDone ?? activeSprint.milestones.map(() => false)) : []
  const milestonesComplete = milestoneDoneArr.filter(Boolean).length

  // Weekly review prompt on Sundays
  const isSunday = new Date().getDay() === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>A sprint is one focused outcome you commit to in 90 days. Not a list of tasks — one concrete result. &quot;Graduate Q1 with no fails.&quot; &quot;Launch side hustle and make first R500.&quot; &quot;Get internship offer.&quot;</div>

      {/* Sunday weekly review nudge */}
      {isSunday && activeSprint && (
        <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ fontSize: '1.2rem' }}>📋</div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--indigo,#6366F1)', marginBottom: 2 }}>Sunday Sprint Review</div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Review this week. Did you move toward your sprint goal? Tick off any milestones you have reached.</div>
          </div>
        </div>
      )}

      {activeSprint ? (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 14, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--indigo,#6366F1)', marginBottom: 4 }}>ACTIVE SPRINT</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeSprint.goal}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{activeSprint.startDate} → {activeSprint.endDate}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--indigo,#6366F1)', fontFamily: 'var(--font-mono)' }}>{daysLeft}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>days left</div>
            </div>
          </div>
          {/* Time progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>TIME ELAPSED</div>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{Math.round(pct)}%</div>
            </div>
            <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,var(--indigo,#6366F1),var(--teal))', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </div>
          {activeSprint.milestones.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>MILESTONES</div>
                <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: milestonesComplete === activeSprint.milestones.length ? 'var(--teal)' : 'var(--text-muted)' }}>
                  {milestonesComplete}/{activeSprint.milestones.length} done
                </div>
              </div>
              {activeSprint.milestones.map((m, i) => (
                <button key={i} onClick={() => toggleMilestone(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', marginBottom: 4, background: milestoneDoneArr[i] ? 'rgba(52,211,153,0.06)' : 'var(--bg-base)', border: `1px solid ${milestoneDoneArr[i] ? 'rgba(52,211,153,0.2)' : 'var(--border-subtle)'}`, borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${milestoneDoneArr[i] ? 'var(--teal)' : 'var(--border-default)'}`, background: milestoneDoneArr[i] ? 'rgba(52,211,153,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', color: 'var(--teal)', fontWeight: 800, flexShrink: 0 }}>
                    {milestoneDoneArr[i] ? '✓' : ''}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: milestoneDoneArr[i] ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: milestoneDoneArr[i] ? 'line-through' : 'none' }}>{m}</span>
                </button>
              ))}
            </div>
          )}
          <button onClick={() => update({ ...state, sprints: state.sprints.map(s => s.id === activeSprint.id ? { ...s, completed: true } : s) })} style={{ padding: '9px 0', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 8, color: 'var(--teal)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>Mark sprint complete ✓</button>
        </div>
      ) : (
        !adding && <div style={{ padding: '16px', textAlign: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, color: 'var(--text-muted)', fontSize: '0.75rem' }}>No active sprint. Start one below.</div>
      )}
      {adding ? (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="Sprint goal (one concrete outcome) *" value={form.goal} onChange={e => setForm(v => ({ ...v, goal: e.target.value }))} style={{ padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 3 }}>Start date</div><input type="date" value={form.start} onChange={e => setForm(v => ({ ...v, start: e.target.value }))} style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.78rem' }} /></div>
            <div><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 3 }}>End date (~90 days)</div><input type="date" value={form.end} onChange={e => setForm(v => ({ ...v, end: e.target.value }))} style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.78rem' }} /></div>
          </div>
          {[{ p: 'Milestone 1 (30-day check-in)', k: 'm1' }, { p: 'Milestone 2 (60-day check-in)', k: 'm2' }, { p: 'Milestone 3 (90-day outcome)', k: 'm3' }].map(({ p, k }) => (
            <input key={k} placeholder={p} value={form[k as keyof typeof form]} onChange={e => setForm(v => ({ ...v, [k]: e.target.value }))} style={{ padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.78rem' }} />
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={add} style={{ flex: 1, padding: '9px 0', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, color: 'var(--indigo,#6366F1)', fontSize: '0.73rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>Start sprint</button>
            <button onClick={() => setAdding(false)} style={{ padding: '9px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-tertiary)', fontSize: '0.73rem', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ padding: '11px 0', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, color: 'var(--indigo,#6366F1)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>+ New sprint</button>
      )}
    </div>
  )
}

function DailyTab({ state, update }: { state: GoalState; update: (s: GoalState) => void }) {
  const today = new Date().toISOString().split('T')[0]
  const todayLog = state.dailyLogs.find(l => l.date === today)
  const [tasks, setTasks] = useState<[string, string, string]>(todayLog?.tasks ?? ['', '', ''])
  const [saved, setSaved] = useState(!!todayLog)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const hour = new Date().getHours()
  const isSunday = new Date().getDay() === 0
  const activeSprint = state.sprints.find(s => !s.completed)
  const streak = calcDailyStreak(state.dailyLogs)

  // Sprint-derived task suggestions: first uncompleted milestone words
  const sprintSuggestions: string[] = activeSprint
    ? activeSprint.milestones
        .filter((_, i) => !(activeSprint.milestonesDone ?? [])[i])
        .map(m => `Work on: ${m}`)
        .slice(0, 3)
    : []

  const saveToday = () => {
    const log: DailyThree = { date: today, tasks, completed: [false, false, false] }
    const logs = state.dailyLogs.filter(l => l.date !== today)
    update({ ...state, dailyLogs: [log, ...logs].slice(0, 90) })
    setSaved(true)
  }

  const toggleDone = (i: number) => {
    const log = state.dailyLogs.find(l => l.date === today)
    if (!log) return
    const completed = [...log.completed] as [boolean, boolean, boolean]
    completed[i] = !completed[i]
    const logs = state.dailyLogs.map(l => l.date === today ? { ...l, completed } : l)
    update({ ...state, dailyLogs: logs })
    // Emit signal when all 3 done
    const newDone = completed.filter(Boolean).length
    if (newDone === 3) {
      signals.emit({ type: 'daily_three_complete', payload: { date: today, streak: calcDailyStreak(state.dailyLogs) } })
    }
  }

  const currentLog = state.dailyLogs.find(l => l.date === today)
  const doneTasks = currentLog?.completed.filter(Boolean).length ?? 0

  const applySuggestion = (suggestion: string, idx: number) => {
    const t = [...tasks] as [string, string, string]
    t[idx] = suggestion
    setTasks(t)
    setShowSuggestions(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Morning nudge: before 10am, not yet set */}
      {hour < 10 && !saved && (
        <div style={{ padding: '10px 14px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ fontSize: '1.1rem' }}>☀️</div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold,#FBBF24)', marginBottom: 1 }}>Good morning — set your Daily 3 first</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Starting with intention is the #1 predictor of productive days. 60 seconds. Go.</div>
          </div>
        </div>
      )}

      {/* Sunday ritual nudge */}
      {isSunday && !saved && (
        <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ fontSize: '1.1rem' }}>🗓️</div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--indigo,#6366F1)', marginBottom: 1 }}>Sunday planning ritual</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Use today to set your 3 most important tasks for the week ahead. One big, one medium, one habit.</div>
          </div>
        </div>
      )}

      {/* Streak celebrate */}
      {streak >= 7 && (
        <div style={{ padding: '8px 14px', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: '1rem' }}>🔥</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--teal)', fontWeight: 600 }}>{streak}-day streak — you are building real momentum</div>
        </div>
      )}

      <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Every morning, write your 3 most important tasks for today. Not a to-do list — the 3 things that would make today a success. Check them off as you complete them.
      </div>

      {saved && currentLog ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>TODAY — {doneTasks}/3 complete</div>
            <div style={{ height: 6, width: 100, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${(doneTasks / 3) * 100}%`, height: '100%', background: 'var(--indigo,#6366F1)', borderRadius: 3 }} />
            </div>
          </div>
          {currentLog.tasks.map((t, i) => (
            <button key={i} onClick={() => toggleDone(i)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-surface)', border: `1px solid ${currentLog.completed[i] ? 'rgba(52,211,153,0.2)' : 'var(--border-subtle)'}`, borderRadius: 10, cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${currentLog.completed[i] ? 'var(--teal)' : 'var(--border-default)'}`, background: currentLog.completed[i] ? 'rgba(52,211,153,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--teal)', fontWeight: 700, flexShrink: 0 }}>{currentLog.completed[i] ? '✓' : ''}</div>
              <span style={{ fontSize: '0.82rem', fontWeight: 500, color: currentLog.completed[i] ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: currentLog.completed[i] ? 'line-through' : 'none' }}>{t}</span>
            </button>
          ))}
          {doneTasks === 3 && (
            <div style={{ padding: '10px 14px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, textAlign: 'center', fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 600 }}>
              🎯 All 3 done. Today counts. {streak > 1 ? `${streak} days in a row.` : ''}
            </div>
          )}
          <button onClick={() => setSaved(false)} style={{ padding: '8px 0', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-muted)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', cursor: 'pointer', marginTop: 4 }}>Edit today&apos;s tasks</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Sprint suggestions pill */}
          {sprintSuggestions.length > 0 && (
            <div>
              <button onClick={() => setShowSuggestions(v => !v)} style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--indigo,#6366F1)', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 100, padding: '3px 10px', cursor: 'pointer' }}>
                {showSuggestions ? '▲ Hide sprint suggestions' : '✦ Suggest from sprint'}
              </button>
              {showSuggestions && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sprintSuggestions.map((s, si) => (
                    <div key={si} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ flex: 1, fontSize: '0.73rem', color: 'var(--text-secondary)', padding: '7px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>{s}</div>
                      {([0, 1, 2] as const).map(slot => (
                        <button key={slot} onClick={() => applySuggestion(s, slot)} style={{ padding: '5px 8px', fontSize: '0.6rem', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 6, color: 'var(--indigo,#6366F1)', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>{slot + 1}</button>
                      ))}
                    </div>
                  ))}
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', paddingLeft: 2 }}>Tap a slot number to use the suggestion in that position</div>
                </div>
              )}
            </div>
          )}

          {([0, 1, 2] as const).map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--indigo,#6366F1)', flexShrink: 0 }}>{i + 1}</div>
              <input value={tasks[i]} onChange={e => { const t = [...tasks] as [string, string, string]; t[i] = e.target.value; setTasks(t) }} placeholder={`Most important task ${i + 1}...`} style={{ flex: 1, padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }} />
            </div>
          ))}
          <button onClick={saveToday} disabled={!tasks[0] && !tasks[1] && !tasks[2]} style={{ padding: '11px 0', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, color: 'var(--indigo,#6366F1)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer', opacity: tasks[0] || tasks[1] || tasks[2] ? 1 : 0.4 }}>Set today&apos;s 3 →</button>
        </div>
      )}

      {state.dailyLogs.length > 1 && (
        <div>
          <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 8 }}>RECENT DAYS</div>
          {state.dailyLogs.filter(l => l.date !== today).slice(0, 7).map(l => {
            const done = l.completed.filter(Boolean).length
            return (
              <div key={l.date} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{l.date}</span>
                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: done === 3 ? 'var(--teal)' : done > 0 ? 'var(--gold)' : 'var(--text-muted)' }}>{done}/3 ✓</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
