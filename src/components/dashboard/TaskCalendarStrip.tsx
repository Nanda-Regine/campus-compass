'use client'

// ============================================================
// TaskCalendarStrip — Dashboard Day / Week task view
// Day mode: today's tasks in priority order
// Week mode: 7-column mini calendar with task counts per day
// ============================================================

import { useState } from 'react'
import Link from 'next/link'
import type { Task } from '@/types'

type ViewMode = 'day' | 'week'

const DAY_ABBR   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const P_COLOR: Record<string, string> = {
  urgent: 'var(--danger)', high: 'var(--coral)', medium: 'var(--gold)', low: 'var(--teal)',
}
const P_BG: Record<string, string> = {
  urgent: 'var(--danger-dim)', high: 'var(--coral-dim)', medium: 'var(--gold-dim)', low: 'var(--teal-dim)',
}

function offsetDateStr(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function todayStr() { return offsetDateStr(0) }

function getWeekDays(): { date: string; label: string; dayNum: number; isToday: boolean }[] {
  const today    = new Date()
  const jsDay    = today.getDay()        // 0 = Sun
  // Start from Monday of current week
  const toMon    = jsDay === 0 ? -6 : 1 - jsDay
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + toMon + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    return {
      date:    iso,
      label:   DAY_ABBR[d.getDay()],
      dayNum:  d.getDate(),
      isToday: iso === todayStr(),
    }
  })
}

interface Props {
  tasks: Task[]
}

// ── Day view ───────────────────────────────────────────────────

function DayView({ tasks, selectedDate }: { tasks: Task[]; selectedDate: string }) {
  const dayTasks = tasks
    .filter(t => t.status !== 'done' && t.due_date === selectedDate)
    .sort((a, b) => {
      const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
      return (order[a.priority] ?? 3) - (order[b.priority] ?? 3)
    })

  const overdue = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < todayStr())

  return (
    <div>
      {overdue.length > 0 && selectedDate === todayStr() && (
        <div style={{
          marginBottom: 8, padding: '6px 10px', borderRadius: 8,
          background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.25)',
          fontSize: '0.72rem', color: 'var(--danger)',
        }}>
          ⚠ {overdue.length} overdue task{overdue.length !== 1 ? 's' : ''} — clear these first
        </div>
      )}

      {dayTasks.length === 0 ? (
        <div style={{ padding: '10px 0', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          {selectedDate === todayStr() ? 'Nothing due today — you\'re clear ✓' : 'No tasks this day'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {dayTasks.slice(0, 8).map(task => {
            const color = P_COLOR[task.priority] ?? 'var(--teal)'
            const bg    = P_BG[task.priority]   ?? 'var(--teal-dim)'
            const mod   = task.module as { module_name?: string } | undefined
            const isAuto = task.description?.startsWith('[auto]') ?? false
            return (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 0', borderBottom: '1px solid var(--border-subtle)',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: color, flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {isAuto && (
                      <span style={{
                        fontSize: '0.52rem', fontFamily: 'var(--font-mono)', color: 'var(--teal)',
                        border: '1px solid var(--teal)', borderRadius: 4,
                        padding: '1px 4px', marginRight: 5, verticalAlign: 'middle',
                      }}>AUTO</span>
                    )}
                    {task.title}
                  </div>
                  {mod?.module_name && (
                    <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                      {mod.module_name}
                    </div>
                  )}
                </div>
                <span style={{
                  padding: '2px 7px', background: bg,
                  border: `1px solid ${color}40`, borderRadius: 100,
                  fontSize: '0.56rem', fontFamily: 'var(--font-mono)',
                  color, fontWeight: 700, flexShrink: 0,
                }}>
                  {task.priority}
                </span>
              </div>
            )
          })}
          {dayTasks.length > 8 && (
            <Link href="/study?tab=tasks" style={{
              padding: '6px 0', fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)',
              textDecoration: 'none',
            }}>
              +{dayTasks.length - 8} more →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// ── Week view ──────────────────────────────────────────────────

function WeekView({ tasks, onDaySelect }: { tasks: Task[]; onDaySelect: (date: string) => void }) {
  const weekDays = getWeekDays()

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
      {weekDays.map(day => {
        const dayTasks = tasks.filter(t => t.status !== 'done' && t.due_date === day.date)
        const urgentCount  = dayTasks.filter(t => t.priority === 'urgent').length
        const highCount    = dayTasks.filter(t => t.priority === 'high').length
        const overdue      = tasks.filter(t => t.status !== 'done' && t.due_date === day.date && day.date < todayStr())

        const dotColor = urgentCount > 0 ? 'var(--danger)' :
          highCount > 0  ? 'var(--coral)' :
          dayTasks.length > 0 ? 'var(--teal)' : 'transparent'

        return (
          <button
            key={day.date}
            onClick={() => onDaySelect(day.date)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '8px 4px',
              background: day.isToday ? 'var(--teal-dim)' : 'transparent',
              border: `1px solid ${day.isToday ? 'var(--teal)' : 'transparent'}`,
              borderRadius: 10, cursor: 'pointer',
            }}
          >
            <div style={{
              fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
              color: day.isToday ? 'var(--teal)' : 'var(--text-muted)',
              letterSpacing: '0.05em',
            }}>
              {day.label}
            </div>
            <div style={{
              fontSize: '0.82rem', fontWeight: 700,
              color: day.isToday ? 'var(--teal)' :
                overdue.length > 0 ? 'var(--danger)' : 'var(--text-primary)',
            }}>
              {day.dayNum}
            </div>
            {dayTasks.length > 0 ? (
              <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                {dayTasks.slice(0, 3).map((t, i) => (
                  <div key={i} style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: P_COLOR[t.priority] ?? 'var(--teal)',
                  }} />
                ))}
                {dayTasks.length > 3 && (
                  <div style={{
                    fontSize: '0.5rem', color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)', lineHeight: '5px',
                  }}>
                    +{dayTasks.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ width: 5, height: 5 }} />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────

export default function TaskCalendarStrip({ tasks }: Props) {
  const [mode, setMode]             = useState<ViewMode>('day')
  const [selectedDate, setSelected] = useState(todayStr())

  const weekDays   = getWeekDays()
  const selectedDay = weekDays.find(d => d.date === selectedDate)

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 16, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px 10px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {mode === 'day'
            ? (selectedDate === todayStr() ? "Today's tasks" : `${selectedDay?.label} ${selectedDay?.dayNum}`)
            : 'This week'
          }
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['day', 'week'] as ViewMode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); if (m === 'day') setSelected(todayStr()) }}
              style={{
                padding: '4px 10px', borderRadius: 7, cursor: 'pointer',
                fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 600,
                background: mode === m ? 'var(--teal)' : 'var(--bg-elevated)',
                border: `1px solid ${mode === m ? 'var(--teal)' : 'var(--border-subtle)'}`,
                color: mode === m ? '#000' : 'var(--text-secondary)',
              }}
            >
              {m === 'day' ? 'Day' : 'Week'}
            </button>
          ))}
          <Link href="/study?tab=tasks" style={{
            padding: '4px 10px', borderRadius: 7,
            fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)', textDecoration: 'none',
          }}>
            All →
          </Link>
        </div>
      </div>

      {/* Week picker shown in day mode */}
      {mode === 'day' && (
        <div style={{ padding: '10px 14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <WeekView
            tasks={tasks}
            onDaySelect={(date) => { setSelected(date) }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '12px 14px' }}>
        {mode === 'day'
          ? <DayView tasks={tasks} selectedDate={selectedDate} />
          : <WeekView tasks={tasks} onDaySelect={(date) => { setMode('day'); setSelected(date) }} />
        }
      </div>
    </div>
  )
}
