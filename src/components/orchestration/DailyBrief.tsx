'use client'

// ============================================================
// DailyBrief — Guardian OS Briefing Card
// Shows: greeting, today's classes, critical deadlines,
// top tasks with one-tap complete, and domain health pulses.
// The 24/7 guardian view of the student's life.
// ============================================================

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAppStore } from '@/store'
import { useStudentState } from '@/store/studentState'
import { signals } from '@/store/signals'
import type { Task, TimetableEntry, Module } from '@/types'

interface ProactiveBrief {
  headline: string
  bullets: string[]
  focus: string
  focusRoute: string
}

// ─── Helpers ──────────────────────────────────────────────────

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function hoursUntil(dateStr: string) {
  return (new Date(dateStr + 'T23:59:59').getTime() - Date.now()) / 3_600_000
}

function greetingByHour(h: number) {
  if (h < 5)  return 'Still up?'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

function formatTime(t: string) {
  const [hStr, mStr] = t.split(':')
  const h = parseInt(hStr, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return `${h12}:${mStr} ${ampm}`
}

function dayLabel() {
  const d = new Date()
  return d.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'short' })
}

// ─── Prescription loader ──────────────────────────────────────

interface Prescription { name: string; dosage?: string; times?: string[]; nextDue?: string }

function loadPrescriptions(): Prescription[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('varsityos-prescriptions')
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch { return [] }
}

function isDueToday(rx: Prescription) {
  if (!rx.nextDue) return false
  return rx.nextDue.slice(0, 10) <= todayStr()
}

// ─── Class chip ───────────────────────────────────────────────

function ClassChip({ slot }: { slot: TimetableEntry }) {
  const mod    = slot.module as (Module & { module_name?: string; module_code?: string; code?: string }) | undefined
  const colour = mod?.color ?? mod?.colour ?? '#4ecf9e'
  const code   = mod?.module_code ?? mod?.code ?? '—'
  const now    = new Date()
  const cur    = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  const isNow  = slot.start_time && slot.end_time
    ? cur >= slot.start_time && cur <= slot.end_time
    : false

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 2,
      padding: '8px 12px',
      background: `${colour}12`,
      border: `1px solid ${isNow ? colour : `${colour}35`}`,
      borderRadius: 10, minWidth: 90, flexShrink: 0,
      position: 'relative', overflow: 'hidden',
    }}>
      {isNow && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: colour }} />
      )}
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: colour, fontFamily: 'var(--font-mono)' }}>
        {code}
      </div>
      <div style={{ fontSize: '0.63rem', color: 'var(--text-secondary)' }}>
        {formatTime(slot.start_time)}
        {isNow && <span style={{ marginLeft: 4, color: colour }}>● now</span>}
      </div>
      {slot.venue && (
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{slot.venue}</div>
      )}
    </div>
  )
}

// ─── Task row ─────────────────────────────────────────────────

const P_COLOR: Record<string, string> = {
  urgent: 'var(--danger)', high: 'var(--coral)', medium: 'var(--gold)', low: 'var(--teal)',
}
const P_BG: Record<string, string> = {
  urgent: 'var(--danger-dim)', high: 'var(--coral-dim)', medium: 'var(--gold-dim)', low: 'var(--teal-dim)',
}

function TaskRow({ task, onComplete }: { task: Task; onComplete: () => void }) {
  const color  = P_COLOR[task.priority] ?? 'var(--teal)'
  const bg     = P_BG[task.priority]   ?? 'var(--teal-dim)'
  const mod    = task.module as (Module & { module_name?: string }) | undefined
  const isAuto = task.description?.startsWith('[auto]') ?? false

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 0', borderBottom: '1px solid var(--border-subtle)',
    }}>
      <button
        onClick={onComplete}
        aria-label={`Complete: ${task.title}`}
        style={{
          flexShrink: 0, width: 20, height: 20, borderRadius: 5,
          border: `1.5px solid ${color}`, background: bg,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.81rem', color: 'var(--text-primary)', fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {isAuto && (
            <span style={{
              fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--teal)',
              border: '1px solid var(--teal)', borderRadius: 4,
              padding: '1px 4px', marginRight: 5, verticalAlign: 'middle',
            }}>AUTO</span>
          )}
          {task.title}
        </div>
        {mod?.module_name && (
          <div style={{ fontSize: '0.64rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
            {mod.module_name}
          </div>
        )}
      </div>
      <span style={{
        flexShrink: 0, padding: '2px 7px',
        background: bg, border: `1px solid ${color}40`,
        borderRadius: 100, fontSize: '0.64rem',
        fontFamily: 'var(--font-mono)', color, fontWeight: 700,
      }}>
        {task.priority}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────

export default function DailyBrief() {
  const { profile, timetable, tasks, updateTask } = useAppStore()
  const { schedule, wellness, financial, academic } = useStudentState()
  const [hour, setHour]           = useState(new Date().getHours())
  const [rxList, setRxList]       = useState<Prescription[]>([])
  const [expanded, setExpanded]   = useState(false)
  const [brief, setBrief]         = useState<ProactiveBrief | null>(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const fetchedRef                = useRef(false)

  useEffect(() => {
    setRxList(loadPrescriptions().filter(isDueToday))
    const tick = setInterval(() => setHour(new Date().getHours()), 60_000)
    return () => clearInterval(tick)
  }, [])

  // Load Nova Proactive Brief once per day (cached in localStorage)
  useEffect(() => {
    if (fetchedRef.current) return

    const today   = todayStr()
    const cacheKey = `varsityos-proactive-brief-${today}`
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) { setBrief(JSON.parse(cached)); fetchedRef.current = true; return }
    } catch { /* ignore */ }

    // Wait for meaningful StudentState data — default Zustand values block a premature fetch
    if (academic.completionRate === 100 && wellness.burnoutScore === 0 && financial.runwayDays === 30) return

    fetchedRef.current = true
    setBriefLoading(true)
    const firstName = profile?.name?.split(' ')[0] ?? profile?.full_name?.split(' ')[0] ?? 'Student'

    fetch('/api/nova/proactive-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        academic: {
          riskLevel:       academic.riskLevel,
          completionRate:  academic.completionRate,
          catchUpDebtHrs:  academic.catchUpDebtHrs,
          examPressure:    academic.examPressure,
          studyVelocity:   academic.studyVelocity,
        },
        financial: {
          runwayDays:   financial.runwayDays,
          healthScore:  financial.healthScore,
          nsfasStatus:  financial.nsfasStatus,
          emergencyMode: financial.emergencyMode,
        },
        wellness: {
          burnoutScore:    wellness.burnoutScore,
          moodTrend:       wellness.moodTrend,
          moodAvg:         wellness.moodAvg,
          sleepDebt:       wellness.sleepDebt,
          recoveryNeeded:  wellness.recoveryNeeded,
        },
        schedule: {
          todayTaskCount: schedule.todayPlan.length,
          procrastIndex:  schedule.procrastIndex,
          planCoverage:   schedule.planCoverage,
        },
        profile: { firstName },
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then((data: ProactiveBrief | null) => {
        if (data) {
          setBrief(data)
          try { localStorage.setItem(cacheKey, JSON.stringify(data)) } catch { /* quota */ }
        }
      })
      .catch(() => {})
      .finally(() => setBriefLoading(false))
  }, [academic, financial, wellness, schedule, profile])

  const today    = todayStr()
  const jsDay    = new Date().getDay()
  const dbDay    = jsDay === 0 ? 7 : jsDay
  const firstName = profile?.name?.split(' ')[0] ?? profile?.full_name?.split(' ')[0] ?? 'there'

  const todayClasses = timetable
    .filter(s => (s.day_of_week as number) === dbDay)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))

  const critical = tasks
    .filter(t => t.status !== 'done' && t.due_date === today && (t.priority === 'urgent' || t.priority === 'high'))
    .sort((a, b) => (a.priority === 'urgent' ? -1 : 1) - (b.priority === 'urgent' ? -1 : 1))

  const nextDay = new Date(); nextDay.setDate(nextDay.getDate() + 1)
  const tomorrowStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth()+1).padStart(2,'0')}-${String(nextDay.getDate()).padStart(2,'0')}`
  const day2 = new Date(); day2.setDate(day2.getDate() + 2)
  const in2daysStr = `${day2.getFullYear()}-${String(day2.getMonth()+1).padStart(2,'0')}-${String(day2.getDate()).padStart(2,'0')}`
  const upcoming48h = tasks.filter(t =>
    t.status !== 'done' && t.due_date && t.due_date > today && t.due_date <= in2daysStr
  ).slice(0, 1)

  const topTasks  = schedule.todayPlan.slice(0, expanded ? 8 : 3)
  const extraCount = schedule.todayPlan.length - 3

  const handleComplete = (task: Task) => {
    const deadline     = task.due_date ? new Date(task.due_date + 'T23:59:59').getTime() : Date.now()
    const hoursAhead   = Math.max(0, Math.round((deadline - Date.now()) / 3_600_000))
    updateTask(task.id, { status: 'done', completed_at: new Date().toISOString() })
    signals.emit({ type: 'task_completed', payload: { taskId: task.id, moduleId: task.module_id ?? undefined, hoursBeforeDeadline: hoursAhead } })
  }

  const riskColor =
    academic.riskLevel === 'critical' ? 'var(--danger)' :
    academic.riskLevel === 'warning'  ? 'var(--coral)'  :
    academic.riskLevel === 'watch'    ? 'var(--gold)'   :
    'var(--teal)'

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 18,
      animation: 'fadeInUp 0.4s ease',
    }}>
      {/* Risk-adaptive top accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${riskColor}, var(--teal), transparent)`,
      }} />

      <div style={{ padding: '16px 18px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: 'var(--teal)', letterSpacing: '0.09em', marginBottom: 3 }}>
              TODAY&apos;S BRIEF · {dayLabel().toUpperCase()}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {greetingByHour(hour)}, {firstName}.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
            {wellness.burnoutScore >= 60 && (
              <div style={{
                padding: '3px 9px', background: 'var(--coral-dim)',
                border: '1px solid rgba(232,112,64,0.3)', borderRadius: 100,
                fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--coral)',
              }}>
                Burnout {wellness.burnoutScore}%
              </div>
            )}
            {academic.riskLevel !== 'safe' && (
              <div style={{
                padding: '3px 9px',
                background: academic.riskLevel === 'critical' ? 'var(--danger-dim)' : 'var(--gold-dim)',
                border: `1px solid ${riskColor}40`, borderRadius: 100,
                fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: riskColor,
              }}>
                {academic.riskLevel} risk
              </div>
            )}
          </div>
        </div>

        {/* Today's classes */}
        {todayClasses.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 7 }}>
              📅 {todayClasses.length} CLASS{todayClasses.length !== 1 ? 'ES' : ''} TODAY
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {todayClasses.map(s => <ClassChip key={s.id} slot={s} />)}
            </div>
          </div>
        )}

        {/* Critical deadlines */}
        {critical.slice(0, 2).map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 9, marginBottom: 6,
            background: t.priority === 'urgent' ? 'var(--danger-dim)' : 'rgba(245,158,11,0.08)',
            border: `1px solid ${t.priority === 'urgent' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
          }}>
            <span style={{ fontSize: '0.72rem' }}>⚡</span>
            <div style={{ flex: 1, minWidth: 0, fontSize: '0.76rem', fontWeight: 600, color: t.priority === 'urgent' ? 'var(--danger)' : 'var(--gold)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t.title}
            </div>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: t.priority === 'urgent' ? 'var(--danger)' : 'var(--gold)', flexShrink: 0 }}>
              due today
            </span>
          </div>
        ))}

        {/* Upcoming 48h warning */}
        {upcoming48h.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 10px', borderRadius: 9, marginBottom: 8,
            background: 'rgba(245,158,11,0.05)',
            border: '1px solid rgba(245,158,11,0.18)',
          }}>
            <span style={{ fontSize: '0.7rem' }}>🕐</span>
            <div style={{ flex: 1, minWidth: 0, fontSize: '0.73rem', fontWeight: 500, color: 'var(--gold)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t.title}
            </div>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexShrink: 0 }}>
              {t.due_date === tomorrowStr ? 'due tomorrow' : `due ${t.due_date}`}
            </span>
          </div>
        ))}

        {/* Tasks */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              🎯 FOCUS — {schedule.todayPlan.length} TASK{schedule.todayPlan.length !== 1 ? 'S' : ''} DUE TODAY
            </div>
            <Link href="/study?tab=tasks" style={{ fontSize: '0.65rem', color: 'var(--teal)', textDecoration: 'none' }}>
              All →
            </Link>
          </div>

          {schedule.todayPlan.length === 0 ? (
            <div style={{ padding: '8px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              No tasks due today — get ahead on tomorrow&apos;s work.
            </div>
          ) : (
            <>
              {topTasks.map(t => <TaskRow key={t.id} task={t} onComplete={() => handleComplete(t)} />)}
              {extraCount > 0 && (
                <button
                  onClick={() => setExpanded(e => !e)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0 2px',
                    fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)',
                  }}
                >
                  {expanded ? '↑ Show less' : `+${extraCount} more tasks`}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Nova Proactive Brief */}
      {(brief || briefLoading) && (
        <div style={{
          margin: '12px 0 0', padding: '12px 14px',
          background: 'rgba(155,111,255,0.05)',
          border: '1px solid rgba(155,111,255,0.15)',
          borderRadius: 12, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#9b6fff,transparent)' }} />
          <div style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: '#9b6fff', letterSpacing: '0.09em', marginBottom: 6 }}>
            ✦ NOVA&apos;S TAKE TODAY
          </div>
          {briefLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[80, 65, 75].map((w, i) => (
                <div key={i} className="skeleton-row" style={{ height: 11, width: `${w}%`, borderRadius: 4 }} />
              ))}
            </div>
          )}
          {brief && !briefLoading && (
            <>
              <div style={{ fontSize: '0.79rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4 }}>
                {brief.headline}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                {brief.bullets.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                    <span style={{ color: '#9b6fff', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', flexShrink: 0, marginTop: 2 }}>{i + 1}.</span>
                    <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{b}</span>
                  </div>
                ))}
              </div>
              <Link href={brief.focusRoute} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px',
                  background: 'rgba(155,111,255,0.12)',
                  border: '1px solid rgba(155,111,255,0.3)',
                  borderRadius: 100, cursor: 'pointer',
                }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#9b6fff', fontFamily: 'var(--font-mono)' }}>
                    FOCUS: {brief.focus}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#9b6fff' }}>→</span>
                </div>
              </Link>
            </>
          )}
        </div>
      )}

      {/* Domain pulse strip */}
      <div style={{ marginTop: 14, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap' }}>

        <Link href="/budget" style={{
          flex: '1 0 45%', padding: '10px 14px',
          borderRight: '1px solid var(--border-subtle)',
          textDecoration: 'none',
        }}>
          <div style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.07em', marginBottom: 2 }}>
            💰 BUDGET
          </div>
          <div style={{
            fontSize: '0.75rem', fontWeight: 600,
            color: financial.emergencyMode ? 'var(--danger)' :
              financial.spendingTrend === 'over' ? 'var(--coral)' : 'var(--text-primary)',
          }}>
            {financial.emergencyMode ? 'Emergency!' : `${financial.runwayDays}d runway`}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
            Health {financial.healthScore}/100
          </div>
        </Link>

        <Link href="/study" style={{
          flex: '1 0 45%', padding: '10px 14px',
          textDecoration: 'none',
        }}>
          <div style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.07em', marginBottom: 2 }}>
            📚 ACADEMIC
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: riskColor }}>
            {academic.completionRate}% done
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
            {academic.catchUpDebtHrs > 0 ? `${academic.catchUpDebtHrs}h overdue` : 'No overdue work'}
          </div>
        </Link>

        {rxList.length > 0 && (
          <Link href="/health?tab=prescriptions" style={{
            flex: '1 0 100%', padding: '10px 14px',
            borderTop: '1px solid var(--border-subtle)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(244,63,94,0.04)',
          }}>
            <span style={{ fontSize: '1rem' }}>💊</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--rose)' }}>
                {rxList[0].name}{rxList.length > 1 ? ` + ${rxList.length - 1} more` : ''} — due today
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Tap to mark as taken</div>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--rose)' }}>→</span>
          </Link>
        )}

        {wellness.recoveryNeeded && (
          <Link href="/study?tab=wellness" style={{
            flex: '1 0 100%', padding: '10px 14px',
            borderTop: '1px solid var(--border-subtle)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(232,131,74,0.04)',
          }}>
            <span style={{ fontSize: '1rem' }}>🌿</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--coral)' }}>
                Rest recommended today
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                Burnout {wellness.burnoutScore}/100 — block recovery time
              </div>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--coral)' }}>→</span>
          </Link>
        )}

        {wellness.sleepDebt >= 5 && (
          <Link href="/sleep" style={{
            flex: '1 0 100%', padding: '10px 14px',
            borderTop: '1px solid var(--border-subtle)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(56,189,248,0.04)',
          }}>
            <span style={{ fontSize: '1rem' }}>🌙</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--sky)' }}>
                {wellness.sleepDebt.toFixed(0)}h sleep debt this week
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                Sleep deprivation hurts exam performance — log tonight&apos;s sleep
              </div>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--sky)' }}>→</span>
          </Link>
        )}
      </div>
    </div>
  )
}
