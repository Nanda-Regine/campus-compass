'use client'
// ─── Fitness Tracker ──────────────────────────────────────────
// Workout logger, campus sport finder, streak tracker
// Data layer: Supabase (workout_logs table)
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────
interface WorkoutLog {
  id: string          // UUID from Supabase
  date: string
  type: string
  duration: number
  calories: number | null
  notes: string
}

// ─── Static data ──────────────────────────────────────────────
const WORKOUT_TYPES = [
  { id: 'run',   label: 'Run / Walk',    emoji: '🏃' },
  { id: 'gym',   label: 'Gym / Weights', emoji: '🏋️' },
  { id: 'swim',  label: 'Swimming',      emoji: '🏊' },
  { id: 'sport', label: 'Campus Sport',  emoji: '⚽' },
  { id: 'yoga',  label: 'Yoga / Stretch',emoji: '🧘' },
  { id: 'cycle', label: 'Cycling',       emoji: '🚲' },
  { id: 'dance', label: 'Dance',         emoji: '💃' },
  { id: 'hike',  label: 'Hike',          emoji: '🥾' },
  { id: 'other', label: 'Other',         emoji: '⚡' },
]

const CAMPUS_SPORTS = [
  { sport: 'Football (soccer)',     contact: "Register at sports office or student union. Most unis have men's and women's leagues.",       trial: 'Walk-on tryouts at start of semester.' },
  { sport: 'Basketball',            contact: 'Check your SRC noticeboard or student sports federation page.',                              trial: 'Usually open to all — bring kit and show up.' },
  { sport: 'Netball',               contact: 'Most SA universities have active netball clubs.',                                             trial: 'Inter-res and club leagues available.' },
  { sport: 'Athletics (track & field)', contact: 'Contact your university athletics club.',                                                trial: 'Open time trials at the start of the year.' },
  { sport: 'Swimming',              contact: 'Check if your campus has a pool — most large universities do.',                              trial: 'Club competitive or recreational swimming.' },
  { sport: 'Tennis',                contact: 'Campus sports facilities — book a court via the sports office.',                             trial: 'Club membership usually free or R100–300/year.' },
  { sport: 'Volleyball',            contact: 'Indoor and beach volleyball at some campuses.',                                              trial: 'SRC sports day is a good time to connect.' },
  { sport: 'Rugby / Touch Rugby',   contact: 'Varsity Cup and inter-res leagues across SA universities.',                                  trial: 'Touch rugby is lower contact — great entry point.' },
  { sport: 'Gym (student discount)',contact: 'Most campuses have on-site gyms at subsidised rates.',                                       trial: 'R100–300/month vs R500+ commercial.' },
]

const TIPS = [
  { title: 'Exercise 3× week minimum for academic performance',   body: 'Meta-analysis of 400+ studies: students who exercise 3× per week score 10–15% higher on memory and concentration tests. 30 minutes of moderate exercise is enough.' },
  { title: 'Campus gym = cheapest gym in South Africa',           body: "Your student card gives you access to the campus gym at R0–R300/month. Commercial gyms charge R400–R800. If you're at Wits, UCT, UP, UJ, or UKZN — you have a world-class facility already." },
  { title: 'Walk to class — it counts',                           body: 'Students who walk to campus rather than drive or taxi are 23% more likely to meet the minimum daily activity recommendation. If you commute by taxi, get off one stop early.' },
  { title: 'Sleep + exercise compound',                           body: "Exercise improves sleep quality. Better sleep improves next-day exercise motivation. It's a positive feedback loop. Start the loop by doing even 10 minutes of movement daily." },
  { title: 'Load shedding fitness tip',                           body: 'No electricity for gym equipment? Body weight training (pushups, squats, lunges, planks) requires zero equipment. A 20-minute bodyweight circuit burns as many calories as 30 minutes on a treadmill.' },
]

type Tab = 'log' | 'sports' | 'tips'

// ─── Streak calculator ────────────────────────────────────────
// Uses SAST calendar dates (toISOString() is UTC and rolls over at 02:00 SAST,
// dropping yesterday's log overnight) and keeps a streak alive if the most recent
// workout was yesterday but today isn't logged yet.
const sastDay = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })
function calcStreak(logs: WorkoutLog[]): number {
  const dates = new Set(logs.map(l => l.date))
  let streak = 0
  const check = new Date()
  if (!dates.has(sastDay(check))) check.setDate(check.getDate() - 1) // allow "yesterday" to keep it alive
  while (dates.has(sastDay(check))) {
    streak++
    check.setDate(check.getDate() - 1)
  }
  return streak
}

// ─── Loading skeleton ─────────────────────────────────────────
function LogSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: 54, borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', animation: 'pulse 1.4s ease-in-out infinite', opacity: 0.6 }} />
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────
export default function FitnessTracker() {
  const userId   = useAppStore(s => s.userId)
  const supabase = createClient()

  const [logs,    setLogs]    = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<Tab>('log')
  const [adding,  setAdding]  = useState(false)
  const [editId,  setEditId]  = useState<string | null>(null)

  const blankForm = { type: 'run', duration: '30', notes: '', date: new Date().toISOString().split('T')[0] }
  const [form, setForm] = useState(blankForm)

  // ─── Load logs on mount ──────────────────────────────────────
  useEffect(() => {
    if (!userId) { setLoading(false); return }
    let cancelled = false

    async function fetchLogs() {
      setLoading(true)
      const { data, error } = await supabase
        .from('workout_logs')
        .select('id, date, type, duration, calories, notes')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .limit(90)

      if (cancelled) return
      if (error) {
        toast.error('Could not load workouts')
      } else {
        setLogs(
          (data ?? []).map(r => ({
            id:       r.id as string,
            date:     r.date as string,
            type:     r.type as string,
            duration: r.duration as number,
            calories: r.calories as number | null,
            notes:    (r.notes ?? '') as string,
          }))
        )
      }
      setLoading(false)
    }

    fetchLogs()
    return () => { cancelled = true }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Create ───────────────────────────────────────────────────
  async function logWorkout() {
    if (!userId) { toast.error('Sign in to log workouts'); return }

    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        user_id:  userId,
        date:     form.date,
        type:     form.type,
        duration: parseInt(form.duration) || 30,
        notes:    form.notes || null,
      })
      .select('id, date, type, duration, calories, notes')
      .single()

    if (error) {
      toast.error('Could not save workout')
      return
    }

    const newLog: WorkoutLog = {
      id:       data.id as string,
      date:     data.date as string,
      type:     data.type as string,
      duration: data.duration as number,
      calories: data.calories as number | null,
      notes:    (data.notes ?? '') as string,
    }

    setLogs(prev => [newLog, ...prev].slice(0, 90))
    toast.success('Workout logged!')
    setAdding(false)
    setForm(blankForm)
  }

  // ─── Edit save ────────────────────────────────────────────────
  async function saveEdit() {
    if (!editId) return

    const { error } = await supabase
      .from('workout_logs')
      .update({
        date:       form.date,
        type:       form.type,
        duration:   parseInt(form.duration) || 30,
        notes:      form.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editId)
      .eq('user_id', userId)

    if (error) {
      toast.error('Could not update workout')
      return
    }

    setLogs(prev =>
      prev.map(l =>
        l.id === editId
          ? { ...l, date: form.date, type: form.type, duration: parseInt(form.duration) || 30, notes: form.notes }
          : l
      )
    )
    toast.success('Workout updated!')
    setEditId(null)
    setAdding(false)
    setForm(blankForm)
  }

  // ─── Soft delete ──────────────────────────────────────────────
  async function deleteLog(id: string) {
    const { error } = await supabase
      .from('workout_logs')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      toast.error('Could not remove workout')
      return
    }

    setLogs(prev => prev.filter(l => l.id !== id))
    toast.success('Workout removed')
  }

  // ─── Open edit form ───────────────────────────────────────────
  function openEdit(log: WorkoutLog) {
    setEditId(log.id)
    setForm({ type: log.type, duration: String(log.duration), notes: log.notes, date: log.date })
    setAdding(true)
  }

  function cancelForm() {
    setAdding(false)
    setEditId(null)
    setForm(blankForm)
  }

  // ─── Derived stats ────────────────────────────────────────────
  const streak    = calcStreak(logs)
  const thisWeek  = logs.filter(l => { const d = new Date(l.date); const diff = (Date.now() - d.getTime()) / 86400000; return diff >= 0 && diff < 7 })
  const totalMins = thisWeek.reduce((a, b) => a + b.duration, 0)

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-surface)', border: '1px solid rgba(251,113,133,0.25)', borderRadius: 16, padding: '16px 18px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,var(--rose,#FB7185),transparent)' }} />
        <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--rose,#FB7185)', letterSpacing: '0.09em', marginBottom: 4 }}>FITNESS TRACKER</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Move your body, sharpen your mind</div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 3 }}>Log workouts · Campus sports · Streak tracker</div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {[
          { l: 'Streak',      v: `${streak}d`,              c: 'var(--rose,#FB7185)' },
          { l: 'This week',   v: `${thisWeek.length} sessions`, c: 'var(--teal)' },
          { l: 'Weekly mins', v: `${totalMins}m`,            c: totalMins >= 150 ? 'var(--teal)' : totalMins >= 90 ? 'var(--gold)' : 'var(--coral)' },
        ].map(s => (
          <div key={s.l} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.c }}>{s.v}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {totalMins < 150 && (
        <div style={{ padding: '8px 12px', background: 'rgba(251,113,133,0.06)', border: '1px solid rgba(251,113,133,0.2)', borderRadius: 8, fontSize: '0.7rem', color: 'var(--rose,#FB7185)' }}>
          WHO recommendation: 150 mins/week · You&apos;re at {totalMins}min · {Math.max(0, 150 - totalMins)} min to go
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)' }}>
        {([['log', 'Log', '📝'], ['sports', 'Campus Sport', '⚽'], ['tips', 'Science', '🧬']] as [Tab, string, string][]).map(([id, l, e]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: '8px 0', background: 'none', border: 'none', borderBottom: tab === id ? '2px solid var(--rose,#FB7185)' : '2px solid transparent', color: tab === id ? 'var(--rose,#FB7185)' : 'var(--text-tertiary)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: tab === id ? 700 : 400, cursor: 'pointer', marginBottom: -1 }}>
            {e} {l}
          </button>
        ))}
      </div>

      {/* Log tab */}
      {tab === 'log' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {adding ? (
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {editId && (
                <div style={{ fontSize: '0.65rem', color: 'var(--rose,#FB7185)', fontFamily: 'var(--font-mono)', marginBottom: -4 }}>EDITING WORKOUT</div>
              )}
              {/* Workout type picker */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                {WORKOUT_TYPES.map(w => (
                  <button key={w.id} onClick={() => setForm(v => ({ ...v, type: w.id }))} style={{ padding: '8px 4px', background: form.type === w.id ? 'rgba(251,113,133,0.12)' : 'transparent', border: `1px solid ${form.type === w.id ? 'rgba(251,113,133,0.3)' : 'var(--border-subtle)'}`, borderRadius: 8, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: '1.1rem' }}>{w.emoji}</span>
                    <span style={{ fontSize: '0.55rem', color: form.type === w.id ? 'var(--rose,#FB7185)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)', textAlign: 'center', lineHeight: 1.2 }}>{w.label}</span>
                  </button>
                ))}
              </div>
              {/* Date + duration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 3 }}>Date</div>
                  <input type="date" value={form.date} onChange={e => setForm(v => ({ ...v, date: e.target.value }))} style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 7, color: 'var(--text-primary)', fontSize: '0.78rem' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 3 }}>Duration (min)</div>
                  <input type="number" inputMode="numeric" aria-label="Duration in minutes" value={form.duration} onChange={e => setForm(v => ({ ...v, duration: e.target.value }))} style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 7, color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }} />
                </div>
              </div>
              {/* Notes */}
              <input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(v => ({ ...v, notes: e.target.value }))} style={{ padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 7, color: 'var(--text-primary)', fontSize: '0.78rem' }} />
              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={editId ? saveEdit : logWorkout}
                  style={{ flex: 1, padding: '10px 0', background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.25)', borderRadius: 9, color: 'var(--rose,#FB7185)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}
                >
                  {editId ? 'Save changes ✓' : 'Log workout ✓'}
                </button>
                <button onClick={cancelForm} style={{ padding: '10px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 9, color: 'var(--text-tertiary)', fontSize: '0.73rem', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} style={{ padding: '12px 0', background: 'rgba(251,113,133,0.07)', border: '1px solid rgba(251,113,133,0.2)', borderRadius: 10, color: 'var(--rose,#FB7185)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>
              + Log today&apos;s workout
            </button>
          )}

          {/* Log list */}
          {loading ? (
            <LogSkeleton />
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>No workouts logged yet. Start with 20 minutes today.</div>
          ) : (
            logs.slice(0, 14).map(l => {
              const wt = WORKOUT_TYPES.find(w => w.id === l.type)
              return (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.2rem' }}>{wt?.emoji || '⚡'}</span>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{wt?.label || l.type}</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{l.date}{l.notes ? ` · ${l.notes}` : ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--rose,#FB7185)' }}>{l.duration}m</div>
                    {/* Edit button */}
                    <button
                      onClick={() => openEdit(l)}
                      title="Edit workout"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1 }}
                    >
                      ✏️
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={() => { if (confirm('Remove this workout?')) deleteLog(l.id) }}
                      title="Remove workout"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1 }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Sports tab */}
      {tab === 'sports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Campus sports are free or subsidised. Join a team to build community, structure, and discipline — all of which predict academic success.</div>
          {CAMPUS_SPORTS.map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 11, padding: '12px 14px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{s.sport}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 4 }}>{s.contact}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{s.trial}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tips tab */}
      {tab === 'tips' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TIPS.map((t, i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid var(--rose,#FB7185)', borderRadius: 11, padding: '12px 14px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5 }}>{t.title}</div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{t.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
