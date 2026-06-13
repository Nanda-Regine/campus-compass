'use client'

// ============================================================
// CalendarTab — Full weekly calendar for the Study tab
// Shows timetable slots + task due dates + exams on a
// Mon–Sun grid. Navigate weeks forward/back.
// ============================================================

import { useState } from 'react'
import Link from 'next/link'
import type { TimetableEntry, Task, Exam, Module } from '@/types'

const DAY_LABELS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOUR_START  = 7
const HOUR_END    = 21

// DB day_of_week: 1=Mon … 7=Sun  (maps to index 0–6)
const DB_TO_IDX: Record<number, number> = { 1:0, 2:1, 3:2, 4:3, 5:4, 6:5, 7:6 }

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getMondayOf(d: Date): Date {
  const jsDay = d.getDay() // 0=Sun
  const toMon = jsDay === 0 ? -6 : 1 - jsDay
  const mon   = new Date(d)
  mon.setDate(d.getDate() + toMon)
  mon.setHours(0,0,0,0)
  return mon
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(d.getDate() + n)
  return r
}

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function formatTime(t: string) {
  const [hStr, mStr] = t.split(':')
  const h = parseInt(hStr, 10)
  return `${h % 12 || 12}:${mStr}${h >= 12 ? 'PM' : 'AM'}`
}

// ─── Types ────────────────────────────────────────────────────

interface Props {
  timetable: TimetableEntry[]
  tasks:     Task[]
  exams:     Exam[]
  modules:   Module[]
}

// ─── Timetable block (positioned absolutely in time grid) ─────

function SlotBlock({ slot, top, height }: { slot: TimetableEntry; top: number; height: number }) {
  const mod    = slot.module as (Module & { module_name?: string; module_code?: string; code?: string }) | undefined
  const colour = mod?.color ?? mod?.colour ?? '#4ecf9e'
  const code   = mod?.module_code ?? mod?.code ?? ''
  return (
    <div style={{
      position: 'absolute', top, height: Math.max(height, 28),
      left: 2, right: 2, zIndex: 1,
      background: `${colour}18`, border: `1px solid ${colour}50`,
      borderRadius: 6, padding: '3px 5px', overflow: 'hidden',
    }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: colour, fontFamily: 'var(--font-mono)', lineHeight: 1.2 }}>
        {code}
      </div>
      {height > 34 && (
        <div style={{ fontSize: '0.56rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>
          {slot.venue ?? slot.slot_type ?? ''}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────

export default function CalendarTab({ timetable, tasks, exams }: Props) {
  const [weekOffset, setWeekOffset] = useState(0)

  const monday = addDays(getMondayOf(new Date()), weekOffset * 7)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const weekDayIsos = weekDays.map(isoDate)
  const todayIso   = isoDate(new Date())

  const CELL_H    = 48   // px per hour
  const GRID_H    = (HOUR_END - HOUR_START) * CELL_H
  const LABEL_W   = 36   // left label column

  // Group timetable by day index (0=Mon…6=Sun)
  const slotsByDay: TimetableEntry[][] = Array.from({ length: 7 }, () => [])
  for (const slot of timetable) {
    const idx = DB_TO_IDX[slot.day_of_week as number]
    if (idx !== undefined) slotsByDay[idx].push(slot)
  }

  // Group tasks by due date (iso string)
  const tasksByDate: Record<string, Task[]> = {}
  for (const t of tasks) {
    if (!t.due_date || t.status === 'done') continue
    if (!tasksByDate[t.due_date]) tasksByDate[t.due_date] = []
    tasksByDate[t.due_date].push(t)
  }

  // Group exams by date
  const examsByDate: Record<string, Exam[]> = {}
  for (const e of exams) {
    if (!examsByDate[e.exam_date]) examsByDate[e.exam_date] = []
    examsByDate[e.exam_date].push(e)
  }

  const weekLabel = () => {
    const end = addDays(monday, 6)
    const mOpt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    return `${monday.toLocaleDateString('en-ZA', mOpt)} – ${end.toLocaleDateString('en-ZA', mOpt)}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12,
      }}>
        <button
          onClick={() => setWeekOffset(w => w - 1)}
          style={{
            padding: '6px 12px', background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)', borderRadius: 8,
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem',
          }}
        >
          ← Prev
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {weekLabel()}
          </div>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.62rem', color: 'var(--teal)', padding: 0, marginTop: 2,
              }}
            >
              Back to this week
            </button>
          )}
        </div>
        <button
          onClick={() => setWeekOffset(w => w + 1)}
          style={{
            padding: '6px 12px', background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)', borderRadius: 8,
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem',
          }}
        >
          Next →
        </button>
      </div>

      {/* Day header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `${LABEL_W}px repeat(7, 1fr)`,
        gap: 0,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px 12px 0 0',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '8px 4px', borderRight: '1px solid var(--border-subtle)' }} />
        {weekDays.map((d, i) => {
          const iso     = weekDayIsos[i]
          const isToday = iso === todayIso
          const hasExam = !!examsByDate[iso]?.length
          return (
            <div key={i} style={{
              padding: '8px 4px', textAlign: 'center',
              borderRight: i < 6 ? '1px solid var(--border-subtle)' : undefined,
              background: isToday ? 'var(--teal-dim)' : undefined,
            }}>
              <div style={{
                fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
                color: isToday ? 'var(--teal)' : 'var(--text-muted)',
                letterSpacing: '0.06em',
              }}>
                {DAY_LABELS[i]}
              </div>
              <div style={{
                fontSize: '0.85rem', fontWeight: 700,
                color: isToday ? 'var(--teal)' : 'var(--text-primary)',
              }}>
                {d.getDate()}
              </div>
              {hasExam && (
                <div style={{
                  fontSize: '0.5rem', color: '#f59e0b',
                  fontFamily: 'var(--font-mono)',
                }}>EXAM</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderTop: 'none', borderRadius: '0 0 12px 12px',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `${LABEL_W}px repeat(7, 1fr)`,
          position: 'relative',
        }}>
          {/* Hour labels */}
          <div style={{ position: 'relative', height: GRID_H }}>
            {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
              <div key={i} style={{
                position: 'absolute', top: i * CELL_H - 7,
                left: 0, right: 0,
                fontSize: '0.54rem', fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)', textAlign: 'right',
                paddingRight: 6,
              }}>
                {String(HOUR_START + i).padStart(2,'0')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((d, dayIdx) => {
            const iso      = weekDayIsos[dayIdx]
            const slots    = slotsByDay[dayIdx] ?? []
            const dayTasks = tasksByDate[iso] ?? []
            const dayExams = examsByDate[iso] ?? []
            const isToday  = iso === todayIso

            // Current time indicator
            const now        = new Date()
            const nowMins    = now.getHours() * 60 + now.getMinutes()
            const showNowBar = isToday && nowMins >= HOUR_START * 60 && nowMins <= HOUR_END * 60

            return (
              <div key={dayIdx} style={{
                position: 'relative', height: GRID_H,
                borderLeft: '1px solid var(--border-subtle)',
                background: isToday ? 'rgba(78,207,158,0.02)' : undefined,
              }}>
                {/* Hour grid lines */}
                {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
                  <div key={i} style={{
                    position: 'absolute', top: i * CELL_H, left: 0, right: 0, height: 1,
                    background: 'var(--border-subtle)',
                  }} />
                ))}

                {/* Current time bar */}
                {showNowBar && (
                  <div style={{
                    position: 'absolute', zIndex: 3,
                    top: ((nowMins - HOUR_START * 60) / 60) * CELL_H,
                    left: 0, right: 0, height: 1.5,
                    background: 'var(--teal)', opacity: 0.8,
                  }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'var(--teal)',
                      position: 'absolute', left: -3, top: -3,
                    }} />
                  </div>
                )}

                {/* Timetable blocks */}
                {slots.map(slot => {
                  if (!slot.start_time) return null
                  const startMins = timeToMins(slot.start_time)
                  const endMins   = slot.end_time ? timeToMins(slot.end_time) : startMins + 60
                  const top       = ((startMins - HOUR_START * 60) / 60) * CELL_H
                  const height    = ((endMins - startMins) / 60) * CELL_H
                  return <SlotBlock key={slot.id} slot={slot} top={top} height={height} />
                })}

                {/* Exam badges (top of day column) */}
                {dayExams.map((exam, i) => (
                  <div key={exam.id} style={{
                    position: 'absolute', top: 4 + i * 18, left: 2, right: 2, zIndex: 2,
                    padding: '2px 4px', background: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.4)', borderRadius: 4,
                    fontSize: '0.55rem', color: '#f59e0b', fontWeight: 700,
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  }}>
                    ✦ {exam.exam_name}
                  </div>
                ))}

                {/* Task dots (bottom of column) */}
                {dayTasks.length > 0 && (
                  <div style={{
                    position: 'absolute', bottom: 4, left: 2, right: 2, zIndex: 2,
                    display: 'flex', flexWrap: 'wrap', gap: 2,
                  }}>
                    {dayTasks.slice(0, 4).map((t, i) => {
                      const color = t.priority === 'urgent' ? 'var(--danger)' :
                        t.priority === 'high' ? 'var(--coral)' :
                        t.priority === 'medium' ? 'var(--gold)' : 'var(--teal)'
                      return (
                        <div key={i} title={t.title} style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: color, flexShrink: 0,
                        }} />
                      )
                    })}
                    {dayTasks.length > 4 && (
                      <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        +{dayTasks.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 12,
        padding: '10px 14px',
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(78,207,158,0.3)', border: '1px solid rgba(78,207,158,0.5)' }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Timetable class</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--danger)' }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Urgent task</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(245,158,11,0.3)', border: '1px solid rgba(245,158,11,0.4)' }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Exam</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 24, height: 2, background: 'var(--teal)', borderRadius: 1 }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Now</span>
        </div>
        <Link href="/study/timetable" style={{ fontSize: '0.65rem', color: 'var(--teal)', textDecoration: 'none', marginLeft: 'auto' }}>
          Edit timetable →
        </Link>
      </div>
    </div>
  )
}
