'use client'

// ============================================================
// CalendarTab — Week schedule + Monthly Activity heatmap
// Week view: timetable slots + task due dates + exams in a
//            time-grid (07:00–21:00), navigate by week
// Month view: activity heatmap — every domain action visible,
//             see productivity density build over months
// ============================================================

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAppStore } from '@/store'
import { loadGratitudeEntries } from '@/components/orchestration/GratitudePrompt'
import { createClient } from '@/lib/supabase/client'
import type { TimetableEntry, Task, Exam, Module, WorkShift, CalendarEvent } from '@/types'

type CalMode = 'week' | 'month'

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

// ─── Category config ───────────────────────────────────────────

const CATEGORIES: { id: string; label: string; icon: string; color: string }[] = [
  { id: 'gym',       label: 'Gym',        icon: '🏋️', color: '#10b981' },
  { id: 'cooking',   label: 'Cooking',    icon: '🍳', color: '#f59e0b' },
  { id: 'study',     label: 'Self-study', icon: '📖', color: '#38bdf8' },
  { id: 'social',    label: 'Social',     icon: '👥', color: '#ec4899' },
  { id: 'errands',   label: 'Errands',    icon: '🛒', color: '#94a3b8' },
  { id: 'self_care', label: 'Self-care',  icon: '💆', color: '#c084fc' },
  { id: 'church',    label: 'Church',     icon: '✝️',  color: '#fbbf24' },
  { id: 'other',     label: 'Other',      icon: '⭐', color: '#4ecf9e' },
]

function catFor(id: string) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}

// ─── Types ────────────────────────────────────────────────────

interface Props {
  timetable:      TimetableEntry[]
  tasks:          Task[]
  exams:          Exam[]
  modules:        Module[]
  workShifts?:    WorkShift[]
  calendarEvents?: CalendarEvent[]
  userId?:        string
}

// ─── Work shift block ─────────────────────────────────────
function ShiftBlock({ shift, top, height }: { shift: WorkShift; top: number; height: number }) {
  const label = shift.job?.employer_name ?? shift.job?.role_title ?? 'Work shift'
  return (
    <div style={{
      position: 'absolute', top, height: Math.max(height, 28),
      left: 2, right: 2, zIndex: 1,
      background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.45)',
      borderRadius: 6, padding: '3px 5px', overflow: 'hidden',
    }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#a855f7', fontFamily: 'var(--font-mono)', lineHeight: 1.2 }}>
        💼
      </div>
      {height > 34 && (
        <div style={{ fontSize: '0.56rem', color: 'rgba(168,85,247,0.85)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </div>
      )}
    </div>
  )
}

// ─── Personal event block ────────────────────────────────────
function EventBlock({ event, top, height, onDelete }: {
  event: CalendarEvent; top: number; height: number; onDelete: () => void
}) {
  const cat = catFor(event.category)
  const col = event.color || cat.color
  return (
    <div
      title={`${event.title} — tap to delete`}
      onClick={onDelete}
      style={{
        position: 'absolute', top, height: Math.max(height, 28),
        left: 2, right: 2, zIndex: 2,
        background: `${col}18`, border: `1px solid ${col}55`,
        borderRadius: 6, padding: '3px 5px', overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: col, lineHeight: 1.2 }}>
        {cat.icon}
      </div>
      {height > 28 && (
        <div style={{ fontSize: '0.55rem', color: col, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.9 }}>
          {event.title}
        </div>
      )}
    </div>
  )
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

// ─── Attendance loader ────────────────────────────────────────

function loadAttendanceByDate(): Record<string, number> {
  // Returns {date: countPresent}
  if (typeof window === 'undefined') return {}
  try {
    const raw = JSON.parse(localStorage.getItem('varsityos-attendance') ?? '{}') as Record<string, { date: string; attended: boolean }[]>
    const byDate: Record<string, number> = {}
    Object.values(raw).forEach(records => {
      records.forEach(r => {
        if (r.attended) byDate[r.date] = (byDate[r.date] ?? 0) + 1
      })
    })
    return byDate
  } catch { return {} }
}

function loadMoodCache(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem('varsityos-mood-cache') ?? '{}') } catch { return {} }
}

// ─── Monthly activity heatmap ─────────────────────────────────

function ActivityScore({ tasks, expenses }: { tasks: Task[]; expenses: { expense_date: string }[] }) {
  const [attByDate, setAttByDate]   = useState<Record<string, number>>({})
  const [moodByDate, setMoodByDate] = useState<Record<string, number>>({})
  const [gratDates, setGratDates]   = useState<Set<string>>(new Set())
  const [monthOffset, setMonthOffset] = useState(0)
  const [selected, setSelected]     = useState<string | null>(null)

  useEffect(() => {
    setAttByDate(loadAttendanceByDate())
    setMoodByDate(loadMoodCache())
    const grats = loadGratitudeEntries().map(g => g.date)
    setGratDates(new Set(grats))
  }, [])

  const now = new Date()
  const year  = now.getFullYear()
  const month = ((now.getMonth() + monthOffset) % 12 + 12) % 12
  const adjYear = year + Math.floor((now.getMonth() + monthOffset) / 12)

  const firstDay = new Date(adjYear, month, 1)
  const daysInMonth = new Date(adjYear, month + 1, 0).getDate()

  // Pad to Monday-start grid
  const startDow = firstDay.getDay() // 0=Sun
  const padBefore = startDow === 0 ? 6 : startDow - 1

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const todayIso = isoDate(new Date())

  // Compute activity score per day: 0–5
  const scoreForDay = (iso: string): number => {
    let score = 0
    if (tasks.some(t => t.status === 'done' && t.completed_at?.slice(0,10) === iso)) score += 2
    if (tasks.filter(t => t.status === 'done' && t.completed_at?.slice(0,10) === iso).length > 2) score++ // bonus
    if (expenses.some(e => e.expense_date === iso)) score++
    if (attByDate[iso]) score++
    if (moodByDate[iso]) score++
    if (gratDates.has(iso)) score++
    return Math.min(score, 6)
  }

  const colorsForScore = (s: number): string => {
    if (s === 0) return 'var(--bg-elevated)'
    if (s === 1) return 'rgba(78,207,158,0.12)'
    if (s === 2) return 'rgba(78,207,158,0.25)'
    if (s === 3) return 'rgba(78,207,158,0.42)'
    if (s === 4) return 'rgba(78,207,158,0.60)'
    if (s === 5) return 'rgba(78,207,158,0.78)'
    return 'var(--teal)'
  }

  const selectedIso = selected
  const selTasks  = selectedIso ? tasks.filter(t => t.status === 'done' && t.completed_at?.slice(0,10) === selectedIso) : []
  const selDue    = selectedIso ? tasks.filter(t => t.due_date === selectedIso && t.status !== 'done') : []
  const selAtt    = selectedIso ? (attByDate[selectedIso] ?? 0) : 0
  const selMood   = selectedIso ? (moodByDate[selectedIso] ?? null) : null
  const MOOD_EMO  = [null,'😔','😐','🙂','😄','🔥']

  const cells = Array.from({ length: padBefore + daysInMonth }, (_, i) => {
    if (i < padBefore) return null
    const day  = i - padBefore + 1
    const d    = new Date(adjYear, month, day)
    const iso  = isoDate(d)
    const score = iso <= todayIso ? scoreForDay(iso) : -1
    return { day, iso, score, isToday: iso === todayIso, isFuture: iso > todayIso }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
        <button onClick={() => setMonthOffset(m => m - 1)} style={{ padding: '6px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>←</button>
        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
          {MONTH_NAMES[month]} {adjYear}
        </div>
        <button onClick={() => setMonthOffset(m => m + 1)} disabled={monthOffset >= 0} style={{ padding: '6px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: monthOffset >= 0 ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: monthOffset >= 0 ? 'default' : 'pointer', fontSize: '0.8rem' }}>→</button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', padding: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', paddingBottom: 4 }}>{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} />
            const isSelected = cell.iso === selected
            return (
              <button
                key={cell.iso}
                onClick={() => setSelected(isSelected ? null : cell.iso)}
                style={{
                  aspectRatio: '1', borderRadius: 6,
                  background: cell.isFuture
                    ? 'transparent'
                    : isSelected
                      ? 'var(--teal)'
                      : colorsForScore(cell.score),
                  border: cell.isToday
                    ? '1.5px solid var(--teal)'
                    : isSelected
                      ? '1.5px solid var(--teal)'
                      : '1px solid transparent',
                  cursor: cell.isFuture ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: 1,
                  position: 'relative',
                }}
              >
                <span style={{
                  fontSize: '0.62rem', fontWeight: cell.isToday ? 700 : 400,
                  color: isSelected ? '#000' : cell.isFuture ? 'var(--text-muted)' : cell.score > 3 ? 'var(--teal)' : 'var(--text-secondary)',
                }}>
                  {cell.day}
                </span>
                {!cell.isFuture && cell.score > 0 && (
                  <div style={{ display: 'flex', gap: 1 }}>
                    {selMood !== null && cell.iso === selected && MOOD_EMO[selMood] && (
                      <span style={{ fontSize: '0.45rem' }}>{MOOD_EMO[selMood]}</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Intensity legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>Less</span>
          {[0,1,2,3,4,5,6].map(s => (
            <div key={s} style={{ width: 10, height: 10, borderRadius: 2, background: colorsForScore(s) }} />
          ))}
          <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>More</span>
        </div>
      </div>

      {/* Day detail panel */}
      {selected && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 16px', animation: 'fadeInUp 0.2s ease' }}>
          <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--teal)', letterSpacing: '0.07em', marginBottom: 8 }}>
            {new Date(selected + 'T12:00:00').toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
          </div>

          {selTasks.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 5, fontFamily: 'var(--font-mono)' }}>✓ TASKS COMPLETED</div>
              {selTasks.slice(0, 5).map(t => (
                <div key={t.id} style={{ fontSize: '0.76rem', color: 'var(--text-primary)', padding: '3px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  {t.title}
                </div>
              ))}
              {selTasks.length > 5 && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 3 }}>+{selTasks.length - 5} more</div>}
            </div>
          )}

          {selDue.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 5, fontFamily: 'var(--font-mono)' }}>📌 DUE THIS DAY</div>
              {selDue.slice(0, 3).map(t => (
                <div key={t.id} style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', padding: '3px 0' }}>{t.title}</div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {selAtt > 0 && (
              <div style={{ padding: '4px 10px', background: 'rgba(78,207,158,0.1)', border: '1px solid rgba(78,207,158,0.25)', borderRadius: 20, fontSize: '0.65rem', color: 'var(--teal)' }}>
                📋 {selAtt} class{selAtt > 1 ? 'es' : ''} attended
              </div>
            )}
            {selMood !== null && (
              <div style={{ padding: '4px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 20, fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                {MOOD_EMO[selMood]} Mood logged
              </div>
            )}
            {gratDates.has(selected) && (
              <div style={{ padding: '4px 10px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, fontSize: '0.65rem', color: '#6366F1' }}>
                🙏 Gratitude saved
              </div>
            )}
            {selTasks.length === 0 && selDue.length === 0 && selAtt === 0 && selMood === null && (
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>No activity recorded for this day.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────

interface DraftEvent {
  date: string
  title: string
  category: string
  startTime: string
  endTime: string
  notes: string
}

export default function CalendarTab({ timetable, tasks, exams, workShifts = [], calendarEvents: initialEvents = [], userId = '' }: Props) {
  const [mode, setMode]             = useState<CalMode>('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [events, setEvents]         = useState<CalendarEvent[]>(initialEvents)
  const [showModal, setShowModal]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [draft, setDraft]           = useState<DraftEvent>({
    date: '', title: '', category: 'other', startTime: '08:00', endTime: '09:00', notes: '',
  })
  const { expenses } = useAppStore()
  const supabase = useRef(createClient()).current

  const openModal = (date: string) => {
    setDraft({ date, title: '', category: 'other', startTime: '08:00', endTime: '09:00', notes: '' })
    setShowModal(true)
  }

  const saveEvent = async () => {
    if (!draft.title.trim()) return
    setSaving(true)
    const cat   = catFor(draft.category)
    const row   = {
      user_id:    userId,
      title:      draft.title.trim(),
      event_date: draft.date,
      start_time: draft.startTime || null,
      end_time:   draft.endTime   || null,
      category:   draft.category,
      color:      cat.color,
      notes:      draft.notes.trim() || null,
    }
    const { data, error } = await supabase.from('calendar_events').insert(row).select().single()
    if (error || !data) {
      // Don't pretend it saved: keep the modal open and tell the user.
      toast.error('Could not save event — check your connection and try again.')
      setSaving(false)
      return
    }
    setEvents(prev => [...prev, data as CalendarEvent])
    setSaving(false)
    setShowModal(false)
  }

  const deleteEvent = async (id: string) => {
    const removed = events.find(e => e.id === id)
    if (!removed) return
    if (!window.confirm(`Delete "${removed.title}"? This can't be undone.`)) return
    setEvents(prev => prev.filter(e => e.id !== id))
    const { error } = await supabase.from('calendar_events').delete().eq('id', id)
    if (error) {
      // Roll back the optimistic removal so the user doesn't lose an event on a failed delete.
      setEvents(prev => [...prev, removed])
      toast.error('Could not delete event — please try again.')
    }
  }

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

  // Group tasks by due date (normalize ISO timestamp to date-only)
  const tasksByDate: Record<string, Task[]> = {}
  for (const t of tasks) {
    if (!t.due_date || t.status === 'done') continue
    const key = t.due_date.slice(0, 10)
    if (!tasksByDate[key]) tasksByDate[key] = []
    tasksByDate[key].push(t)
  }

  // Group work shifts by date
  const shiftsByDate: Record<string, WorkShift[]> = {}
  for (const s of workShifts) {
    if (!s.shift_date) continue
    const key = s.shift_date.slice(0, 10)
    if (!shiftsByDate[key]) shiftsByDate[key] = []
    shiftsByDate[key].push(s)
  }

  // Group personal events by date
  const eventsByDate: Record<string, CalendarEvent[]> = {}
  for (const ev of events) {
    if (!ev.event_date) continue
    const key = ev.event_date.slice(0, 10)
    if (!eventsByDate[key]) eventsByDate[key] = []
    eventsByDate[key].push(ev)
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

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 4, padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
        {([['week','📅 Week Schedule'],['month','📊 Activity History']] as [CalMode, string][]).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 9,
              background: mode === m ? 'rgba(78,207,158,0.12)' : 'var(--bg-elevated)',
              border: `1px solid ${mode === m ? 'rgba(78,207,158,0.35)' : 'var(--border-subtle)'}`,
              color: mode === m ? 'var(--teal)' : 'var(--text-secondary)',
              fontSize: '0.7rem', fontWeight: mode === m ? 700 : 400,
              cursor: 'pointer', fontFamily: 'var(--font-mono)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Monthly activity heatmap */}
      {mode === 'month' && (
        <ActivityScore tasks={tasks} expenses={expenses as { expense_date: string }[]} />
      )}

      {mode === 'week' && <>

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

      {/* First-use hint when timetable is empty */}
      {timetable.length === 0 && (
        <div style={{
          padding: '12px 14px',
          borderRadius: 12,
          border: '1px dashed rgba(56,189,248,0.2)',
          background: 'rgba(56,189,248,0.04)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>📅</span>
          <div>
            <p style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: '0.75rem', color: 'var(--text-primary)', margin: 0,
            }}>
              No classes scheduled yet
            </p>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
              color: 'var(--text-muted)', margin: '2px 0 0', lineHeight: 1.6,
            }}>
              Go to the Timetable tab to import your .ics calendar or add classes manually.
            </p>
          </div>
        </div>
      )}

      {/* Horizontally scrollable week grid — ensures readability on small phones */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
      <div style={{ minWidth: 480 }}>

      {/* Day header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `${LABEL_W}px repeat(7, 1fr)`,
        gap: 0,
        background: 'var(--bg-surface)',
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
                  fontSize: '0.65rem', color: '#f59e0b',
                  fontFamily: 'var(--font-mono)',
                }}>EXAM</div>
              )}
              <button
                onClick={() => openModal(iso)}
                title={`Add event on ${iso}`}
                style={{
                  marginTop: 2, padding: '1px 5px', borderRadius: 4,
                  background: 'transparent', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)', fontSize: '0.55rem', cursor: 'pointer',
                  lineHeight: 1.4,
                }}
              >+</button>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
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
            const slots      = slotsByDay[dayIdx] ?? []
            const dayTasks   = tasksByDate[iso]  ?? []
            const dayExams   = examsByDate[iso]  ?? []
            const dayShifts  = shiftsByDate[iso] ?? []
            const dayEvents  = eventsByDate[iso] ?? []
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

                {/* Work shift blocks */}
                {dayShifts.map(shift => {
                  if (!shift.start_time) return null
                  const startMins = timeToMins(shift.start_time)
                  const endMins   = shift.end_time ? timeToMins(shift.end_time) : startMins + 60
                  const top       = ((startMins - HOUR_START * 60) / 60) * CELL_H
                  const height    = ((endMins - startMins) / 60) * CELL_H
                  return <ShiftBlock key={shift.id} shift={shift} top={top} height={height} />
                })}

                {/* Personal event blocks */}
                {dayEvents.map(ev => {
                  if (!ev.start_time) return null
                  const startMins = timeToMins(ev.start_time)
                  const endMins   = ev.end_time ? timeToMins(ev.end_time) : startMins + 60
                  const top       = ((startMins - HOUR_START * 60) / 60) * CELL_H
                  const height    = ((endMins - startMins) / 60) * CELL_H
                  return <EventBlock key={ev.id} event={ev} top={top} height={height} onDelete={() => deleteEvent(ev.id)} />
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
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
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
      {/* close minWidth + scroll wrapper */}
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
          <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.45)' }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Work shift</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.45)' }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Personal event <span style={{ opacity: 0.6 }}>(tap to delete)</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 24, height: 2, background: 'var(--teal)', borderRadius: 1 }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Now</span>
        </div>
        <Link href="/study?tab=timetable" style={{ fontSize: '0.65rem', color: 'var(--teal)', textDecoration: 'none', marginLeft: 'auto' }}>
          Edit timetable →
        </Link>
      </div>

      </>}

      {/* ── Add-event modal ─────────────────────────────────── */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)', display: 'flex',
            alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px 20px 0 0',
              padding: '20px 20px 32px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Add event — {draft.date}
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.1rem', cursor: 'pointer' }}
              >✕</button>
            </div>

            {/* Category picker */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setDraft(d => ({ ...d, category: cat.id }))}
                  style={{
                    padding: '5px 10px', borderRadius: 20, cursor: 'pointer',
                    fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
                    background: draft.category === cat.id ? `${cat.color}22` : 'var(--bg-elevated)',
                    border: `1px solid ${draft.category === cat.id ? cat.color : 'var(--border-subtle)'}`,
                    color: draft.category === cat.id ? cat.color : 'var(--text-secondary)',
                    fontWeight: draft.category === cat.id ? 700 : 400,
                  }}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {/* Title */}
            <input
              autoFocus
              type="text"
              placeholder="Event title (e.g. Leg day, Bible study)"
              value={draft.title}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && saveEvent()}
              style={{
                width: '100%', padding: '10px 12px', marginBottom: 10,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.82rem',
                fontFamily: 'var(--font-display)', boxSizing: 'border-box',
              }}
            />

            {/* Time row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>Start</div>
                <input
                  type="time"
                  value={draft.startTime}
                  onChange={e => setDraft(d => ({ ...d, startTime: e.target.value }))}
                  style={{
                    width: '100%', padding: '8px 10px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                    borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.8rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>End</div>
                <input
                  type="time"
                  value={draft.endTime}
                  onChange={e => setDraft(d => ({ ...d, endTime: e.target.value }))}
                  style={{
                    width: '100%', padding: '8px 10px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                    borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.8rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              onClick={saveEvent}
              disabled={saving || !draft.title.trim()}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 12, cursor: 'pointer',
                background: draft.title.trim() ? catFor(draft.category).color : 'var(--bg-elevated)',
                border: 'none', color: draft.title.trim() ? '#000' : 'var(--text-muted)',
                fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving…' : '+ Add to calendar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
