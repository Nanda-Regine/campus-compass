'use client'

// ─── Study Velocity Tracker ───────────────────────────────────────────────────
// Shows actual study hours per module vs the required pace to be exam-ready.
// Velocity ≥ 1.0 = on track. < 0.7 = falling behind. < 0.4 = critical.

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Module { id: string; module_name: string; module_code: string; credits: number; color: string }
interface Exam { id: string; module_id: string | null; exam_date: string; module?: { id: string } | null }

interface StudySession {
  id: string
  module_id: string | null
  duration_minutes: number
  started_at: string
}

interface ModuleVelocity {
  module: Module
  totalHours: number
  last7Hours: number
  avgHoursPerDay: number
  requiredHours: number
  remainingHours: number
  daysUntilExam: number | null
  requiredPerDay: number | null
  velocityRatio: number | null // actual / required; null = no exam set
  risk: 'on_track' | 'watch' | 'behind' | 'critical' | 'no_exam'
}

const HOURS_PER_CREDIT = 10 // NQF SA standard: ~10 notional hours per credit

function calcRisk(ratio: number | null): ModuleVelocity['risk'] {
  if (ratio === null) return 'no_exam'
  if (ratio >= 1.0) return 'on_track'
  if (ratio >= 0.7) return 'watch'
  if (ratio >= 0.4) return 'behind'
  return 'critical'
}

const RISK_META = {
  on_track: { color: '#4ecf9e', label: 'On track', icon: '✓' },
  watch:    { color: '#f59e0b', label: 'Slightly behind', icon: '!' },
  behind:   { color: '#f97316', label: 'Falling behind', icon: '↓' },
  critical: { color: '#f87171', label: 'Critically behind', icon: '⚠' },
  no_exam:  { color: '#7090d0', label: 'No exam set', icon: '–' },
}

function VelocityBar({ ratio, color }: { ratio: number; color: string }) {
  const pct = Math.min(ratio * 100, 100)
  return (
    <div style={{ height: 4, borderRadius: 4, background: 'var(--border-subtle)', overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
    </div>
  )
}

export default function StudyVelocityTab({ modules, userId }: { modules: Module[]; userId: string }) {
  const supabase   = createClient()
  const [velocity, setVelocity]   = useState<ModuleVelocity[]>([])
  const [loading,  setLoading]    = useState(true)
  const [logging,  setLogging]    = useState(false)
  const [form,     setForm]       = useState({ moduleId: '', minutes: 60, notes: '' })
  const [showForm, setShowForm]   = useState(false)

  const load = useCallback(async () => {
    if (!modules.length) { setLoading(false); return }
    const now      = new Date()
    const today    = now.toISOString().slice(0, 10)
    const week7Ago = new Date(now.getTime() - 7 * 86400000).toISOString()

    const [sessionsRes, examsRes] = await Promise.all([
      supabase.from('study_sessions').select('id, module_id, duration_minutes, started_at')
        .eq('user_id', userId).not('module_id', 'is', null),
      supabase.from('exams').select('id, module_id, exam_date, module:modules(id)')
        .eq('user_id', userId).gte('exam_date', today),
    ])

    const sessions = (sessionsRes.data ?? []) as StudySession[]
    const exams    = (examsRes.data ?? []) as Exam[]

    const computed: ModuleVelocity[] = modules.map(mod => {
      const modSessions = sessions.filter(s => s.module_id === mod.id)
      const totalHours  = modSessions.reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0) / 60
      const last7Hours  = modSessions
        .filter(s => s.started_at >= week7Ago)
        .reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0) / 60
      const avgHoursPerDay = last7Hours / 7

      const requiredHours = (mod.credits || 4) * HOURS_PER_CREDIT
      const remainingHours = Math.max(0, requiredHours - totalHours)

      const nextExam = exams
        .filter(e => e.module_id === mod.id || e.module?.id === mod.id)
        .sort((a, b) => a.exam_date.localeCompare(b.exam_date))[0]

      const daysUntilExam = nextExam
        ? Math.max(1, Math.ceil((new Date(nextExam.exam_date).getTime() - now.getTime()) / 86400000))
        : null

      const requiredPerDay = daysUntilExam !== null
        ? remainingHours / daysUntilExam
        : null

      const velocityRatio = requiredPerDay !== null && requiredPerDay > 0
        ? avgHoursPerDay / requiredPerDay
        : requiredPerDay === 0 ? null : null

      return {
        module: mod, totalHours, last7Hours, avgHoursPerDay,
        requiredHours, remainingHours, daysUntilExam, requiredPerDay, velocityRatio,
        risk: calcRisk(velocityRatio),
      }
    })

    setVelocity(computed.sort((a, b) => {
      const order = { critical: 0, behind: 1, watch: 2, on_track: 3, no_exam: 4 }
      return order[a.risk] - order[b.risk]
    }))
    setLoading(false)
  }, [modules, userId, supabase])

  useEffect(() => { load() }, [load])

  const logSession = async () => {
    if (!form.moduleId || form.minutes < 1) { toast.error('Pick a module and duration'); return }
    setLogging(true)
    const { error } = await supabase.from('study_sessions').insert({
      user_id:          userId,
      module_id:        form.moduleId,
      duration_minutes: form.minutes,
      notes:            form.notes || null,
      started_at:       new Date().toISOString(),
      ended_at:         new Date(Date.now() + form.minutes * 60000).toISOString(),
    })
    if (error) { toast.error('Could not save session'); }
    else {
      toast.success(`${form.minutes} min logged`)
      setShowForm(false)
      setForm({ moduleId: '', minutes: 60, notes: '' })
      await load()
    }
    setLogging(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 24, height: 24, border: '2px solid var(--border-subtle)', borderTopColor: '#7090d0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!modules.length) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '2rem', marginBottom: 12 }}>📈</div>
      <p style={{ fontSize: '0.85rem' }}>Add modules first to track study velocity.</p>
    </div>
  )

  const totalHoursWeek  = velocity.reduce((a, v) => a + v.last7Hours, 0)
  const criticalCount   = velocity.filter(v => v.risk === 'critical' || v.risk === 'behind').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>This week</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, marginTop: 4 }}>
            {totalHoursWeek.toFixed(1)}<span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>hrs</span>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {(totalHoursWeek / 7).toFixed(1)} avg hrs/day
          </div>
        </div>
        <div style={{
          background: criticalCount > 0 ? 'rgba(248,113,113,0.06)' : 'rgba(78,207,158,0.06)',
          border: `1px solid ${criticalCount > 0 ? 'rgba(248,113,113,0.2)' : 'rgba(78,207,158,0.2)'}`,
          borderRadius: 12, padding: '12px 14px',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: criticalCount > 0 ? '#f87171' : '#4ecf9e', lineHeight: 1.2, marginTop: 4 }}>
            {criticalCount > 0 ? criticalCount : '✓'}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {criticalCount > 0 ? `module${criticalCount > 1 ? 's' : ''} falling behind` : 'all modules on pace'}
          </div>
        </div>
      </div>

      {/* Log session button */}
      <button
        onClick={() => setShowForm(v => !v)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 12,
          background: showForm ? 'var(--bg-surface)' : 'linear-gradient(135deg, #7090d0, #4e5fd0)',
          border: showForm ? '1px solid var(--border-subtle)' : 'none',
          color: showForm ? 'var(--text-muted)' : '#fff',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        {showForm ? '✕ Cancel' : '+ Log Study Session'}
      </button>

      {/* Log session form */}
      {showForm && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <select
            value={form.moduleId}
            onChange={e => setForm(f => ({ ...f, moduleId: e.target.value }))}
            style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '0.82rem' }}
          >
            <option value="">Select module…</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.module_name}</option>)}
          </select>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>Duration:</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[30, 45, 60, 90, 120].map(m => (
                <button key={m} onClick={() => setForm(f => ({ ...f, minutes: m }))}
                  style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', cursor: 'pointer',
                    background: form.minutes === m ? 'rgba(112,144,208,0.15)' : 'var(--bg-base)',
                    border: `0.5px solid ${form.minutes === m ? '#7090d0' : 'var(--border-subtle)'}`,
                    color: form.minutes === m ? '#7090d0' : 'var(--text-muted)',
                    fontWeight: form.minutes === m ? 700 : 400,
                  }}>
                  {m >= 60 ? `${m / 60}h` : `${m}m`}
                </button>
              ))}
              <input
                type="number" min={1} max={480}
                value={form.minutes}
                onChange={e => setForm(f => ({ ...f, minutes: parseInt(e.target.value) || 60 }))}
                style={{ width: 56, padding: '4px 8px', borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '0.72rem' }}
              />
            </div>
          </div>

          <input
            type="text" placeholder="Notes (optional)…"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            style={{ padding: '7px 10px', borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '0.78rem' }}
          />

          <button onClick={logSession} disabled={logging}
            style={{
              padding: '9px 14px', borderRadius: 10,
              background: 'linear-gradient(135deg, #7090d0, #4e5fd0)',
              border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.82rem',
              cursor: logging ? 'wait' : 'pointer', opacity: logging ? 0.7 : 1,
            }}>
            {logging ? 'Saving…' : 'Save Session'}
          </button>
        </div>
      )}

      {/* Module velocity cards */}
      {velocity.map(v => {
        const meta  = RISK_META[v.risk]
        const pct   = v.velocityRatio !== null ? Math.min(v.velocityRatio, 1) : null
        const totPct = Math.min((v.totalHours / v.requiredHours) * 100, 100)

        return (
          <div key={v.module.id} style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${v.risk === 'on_track' || v.risk === 'no_exam' ? 'var(--border-subtle)' : `${meta.color}30`}`,
            borderRadius: 14, overflow: 'hidden', position: 'relative',
          }}>
            {/* Top accent stripe */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${meta.color}, transparent)` }} />

            <div style={{ padding: '14px 14px 12px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {v.module.module_name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700,
                      color: meta.color, background: `${meta.color}15`,
                      border: `0.5px solid ${meta.color}40`, padding: '2px 7px', borderRadius: 999,
                    }}>
                      {meta.icon} {meta.label}
                    </span>
                    {v.daysUntilExam !== null && (
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                        Exam in {v.daysUntilExam}d
                      </span>
                    )}
                  </div>
                </div>

                {/* Velocity ratio display */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: meta.color, lineHeight: 1 }}>
                    {v.velocityRatio !== null ? `${(v.velocityRatio * 100).toFixed(0)}%` : '—'}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: 2 }}>pace</div>
                </div>
              </div>

              {/* Velocity bar */}
              {pct !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-muted)', flexShrink: 0, width: 36 }}>pace</span>
                  <VelocityBar ratio={pct} color={meta.color} />
                </div>
              )}

              {/* Coverage bar (total hours done / required) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-muted)', flexShrink: 0, width: 36 }}>done</span>
                <div style={{ height: 4, borderRadius: 4, background: 'var(--border-subtle)', overflow: 'hidden', flex: 1 }}>
                  <div style={{ height: '100%', width: `${totPct}%`, background: 'rgba(112,144,208,0.5)', borderRadius: 4, transition: 'width 0.4s ease' }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {v.totalHours.toFixed(1)}h
                </span>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {[
                  { label: 'Avg/day', value: `${v.avgHoursPerDay.toFixed(1)}h` },
                  { label: 'Need/day', value: v.requiredPerDay !== null ? `${v.requiredPerDay.toFixed(1)}h` : '—' },
                  { label: 'Remaining', value: `${v.remainingHours.toFixed(0)}h` },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-base)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Advice line */}
              {v.risk === 'critical' && v.requiredPerDay !== null && (
                <div style={{ marginTop: 10, padding: '7px 10px', borderRadius: 8, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', fontSize: '0.68rem', color: '#f87171' }}>
                  You need <strong>{v.requiredPerDay.toFixed(1)} hrs/day</strong> but are averaging <strong>{v.avgHoursPerDay.toFixed(1)} hrs/day</strong>. Schedule 2× daily sessions now.
                </div>
              )}
              {v.risk === 'behind' && v.requiredPerDay !== null && (
                <div style={{ marginTop: 10, padding: '7px 10px', borderRadius: 8, background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)', fontSize: '0.68rem', color: '#f97316' }}>
                  Increase from {v.avgHoursPerDay.toFixed(1)} to {v.requiredPerDay.toFixed(1)} hrs/day to finish on time.
                </div>
              )}
              {v.risk === 'no_exam' && (
                <div style={{ marginTop: 10, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Add an exam date to see required pace.
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Footer note */}
      <div style={{ textAlign: 'center', fontSize: '0.62rem', color: 'var(--text-muted)', paddingBottom: 8 }}>
        Required hours estimated at {HOURS_PER_CREDIT}h per credit (NQF notional hours). Log sessions after studying to keep velocity accurate.
      </div>
    </div>
  )
}
