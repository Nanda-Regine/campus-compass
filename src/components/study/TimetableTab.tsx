'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useAppStore } from '@/store'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import { MODULE_COLOURS, WEEKDAYS, type Module, type TimetableEntry, DAYS_OF_WEEK, type DayOfWeek } from '@/types'
import { fmt } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { SupabaseClient } from '@supabase/supabase-js'
import { offlineInsert, offlineDelete } from '@/lib/offline/pendingWrites'
import ICSImportButton from './ICSImportButton'

interface SAHoliday { date: string; localName: string; name: string }

async function fetchSAHolidays(year: number): Promise<SAHoliday[]> {
  const key = `varsityos_holidays_${year}`
  try {
    const cached = sessionStorage.getItem(key)
    if (cached) return JSON.parse(cached) as SAHoliday[]
  } catch { /* ignore */ }
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ZA`, { next: { revalidate: 86400 } })
    if (!res.ok) return []
    const data = await res.json() as SAHoliday[]
    try { sessionStorage.setItem(key, JSON.stringify(data)) } catch { /* ignore */ }
    return data
  } catch { return [] }
}

// ─── Grid geometry ────────────────────────────────────────────────────────────
const GRID_START  = 7   // 07:00 first visible hour
const GRID_END    = 22  // 22:00 last visible hour
const ROW_H       = 56  // px per hour
const TOTAL_H     = (GRID_END - GRID_START) * ROW_H
const HOURS_RANGE = Array.from({ length: GRID_END - GRID_START }, (_, i) => GRID_START + i)

function toMins(t: string): number {
  const [h, m = 0] = t.split(':').map(Number)
  return h * 60 + m
}
function entryTop(start: string): number {
  return Math.max(0, (toMins(start) - GRID_START * 60) / 60 * ROW_H)
}
function entryHeight(start: string, end?: string | null): number {
  if (!end) return ROW_H - 4
  return Math.max(24, (toMins(end) - toMins(start)) / 60 * ROW_H) - 3
}

interface StudySlot { top: number; height: number }
function detectStudyWindows(entries: TimetableEntry[]): StudySlot[] {
  const sorted = [...entries].sort(
    (a, b) => toMins(a.start_time ?? '00:00') - toMins(b.start_time ?? '00:00')
  )
  const slots: StudySlot[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur  = sorted[i]
    const next = sorted[i + 1]
    const endMins = cur.end_time
      ? toMins(cur.end_time)
      : toMins(cur.start_time ?? '08:00') + 60
    const nextStart = toMins(next.start_time ?? '00:00')
    if (nextStart - endMins >= 45) {
      slots.push({
        top:    (endMins - GRID_START * 60) / 60 * ROW_H,
        height: (nextStart - endMins) / 60 * ROW_H,
      })
    }
  }
  return slots
}

// ─── Types ────────────────────────────────────────────────────────────────────
const DAY_TO_INT: Record<DayOfWeek, number> = {
  Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4,
  // 0=Sunday (matches JS getDay()); the day_of_week CHECK constraint is 0..6, so 7 silently failed to insert.
  Friday: 5, Saturday: 6, Sunday: 0,
}

const TIME_OPTIONS = HOURS_RANGE.map(h => {
  const v = `${String(h).padStart(2, '0')}:00`
  return { value: v, label: fmt.time(v) }
})
const END_OPTIONS = HOURS_RANGE.slice(1).map(h => {
  const v = `${String(h).padStart(2, '0')}:00`
  return { value: v, label: fmt.time(v) }
})

interface Props {
  timetable: TimetableEntry[]
  modules:   Module[]
  userId:    string
  supabase:  SupabaseClient
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TimetableTab({ timetable, modules, userId, supabase }: Props) {
  const router = useRouter()
  const { addTimetableEntry, removeTimetableEntry } = useAppStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [nowMins,   setNowMins]   = useState(() => {
    const n = new Date(); return n.getHours() * 60 + n.getMinutes()
  })
  const [prefill, setPrefill] = useState<{ day: string; time: string } | null>(null)

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { module_id: '', day_of_week: 'Monday', start_time: '08:00', end_time: '', venue: '' },
  })

  // Tick current-time line every minute
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date(); setNowMins(n.getHours() * 60 + n.getMinutes())
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  const openModal = (day?: string, time?: string) => {
    if (day && time) {
      setPrefill({ day, time })
      setValue('day_of_week', day)
      setValue('start_time', time)
    }
    setModalOpen(true)
  }

  const onSubmit = async (data: Record<string, string>) => {
    setSaving(true)
    try {
      // Offline-safe: writes online, or queues during load shedding / no data.
      const { row: entry, queued } = await offlineInsert<TimetableEntry>(supabase, 'timetable_slots', {
        user_id:          userId,
        module_id:        data.module_id || null,
        day_of_week:      DAY_TO_INT[data.day_of_week as DayOfWeek] ?? 1,
        day_of_week_text: data.day_of_week,
        start_time:       data.start_time,
        end_time:         data.end_time || null,
        venue:            data.venue || null,
      }, '*, module:modules(id,module_name,color)')
      addTimetableEntry(entry)
      toast.success(queued ? 'Saved offline — will sync' : 'Class added!')
      setModalOpen(false)
      reset()
      setPrefill(null)
    } catch (err) {
      toast.error('Failed to add class')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const deleteEntry = async (id: string) => {
    removeTimetableEntry(id)
    await offlineDelete(supabase, 'timetable_slots', id)
  }

  // Helpers
  const today    = new Date()
  const todayName = DAYS_OF_WEEK[today.getDay() === 0 ? 6 : today.getDay() - 1] as string
  const nowTop   = (nowMins - GRID_START * 60) / 60 * ROW_H

  const [holidays, setHolidays] = useState<SAHoliday[]>([])
  useEffect(() => {
    fetchSAHolidays(today.getFullYear()).then(setHolidays)
  }, [today.getFullYear()])

  const dayEntries = (day: string) =>
    timetable.filter(e =>
      (e as unknown as { day_of_week_text?: string }).day_of_week_text === day ||
      e.day_of_week === day
    )

  const getDayDate = (day: string) => {
    const idx  = WEEKDAYS.indexOf(day as DayOfWeek)
    const tIdx = today.getDay() === 0 ? 6 : today.getDay() - 1
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + (idx - tIdx)).getDate()
  }

  const getDayISO = (day: string) => {
    const idx  = WEEKDAYS.indexOf(day as DayOfWeek)
    const tIdx = today.getDay() === 0 ? 6 : today.getDay() - 1
    const d    = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (idx - tIdx))
    return d.toISOString().split('T')[0]
  }

  const getDayHoliday = (day: string): SAHoliday | undefined =>
    holidays.find(h => h.date === getDayISO(day))

  // Cognitive load heatmap (0–1): more classes → higher load
  const cogLoad  = (day: string) => Math.min(1, dayEntries(day).length / 5)
  const loadColor = (s: number) =>
    s > 0.7 ? '#ff6b6b' : s > 0.4 ? '#f59e0b' : s > 0 ? '#4ecf9e' : 'transparent'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: '#fff', fontWeight: 600,
        }}>
          Week · {today.toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ICSImportButton onImported={() => { toast.success('Timetable imported!'); router.refresh() }} />
          <Button size="sm" onClick={() => openModal()}>+ Add class</Button>
        </div>
      </div>

      {/* Empty state — ICS import as primary CTA */}
      {timetable.length === 0 && (
        <div style={{
          margin: '8px 0 12px',
          padding: '20px 16px 16px',
          borderRadius: 16,
          border: '1px solid rgba(56,189,248,0.15)',
          background: 'rgba(56,189,248,0.04)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🗓️</div>
          <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: '#fff', fontSize: 13, margin: 0 }}>
            Your timetable is empty
          </p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#fff', margin: '4px 0 14px' }}>
            Import your university calendar to add all classes at once, or tap any slot below.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ICSImportButton onImported={() => { toast.success('Timetable imported!'); router.refresh() }} />
          </div>
        </div>
      )}

      {/* ── Calendar grid ─────────────────────────────────────────────────── */}
      <div style={{ overflowX: 'auto', marginLeft: -4, marginRight: -4 }}>
        <div style={{ display: 'flex', minWidth: 480, paddingLeft: 4, paddingRight: 4 }}>

          {/* Time-label column */}
          <div style={{ width: 32, flexShrink: 0, marginTop: 48 }}>
            <div style={{ position: 'relative', height: TOTAL_H }}>
              {HOURS_RANGE.map(h => (
                <div key={h} style={{
                  position: 'absolute', top: (h - GRID_START) * ROW_H - 7,
                  right: 4, fontSize: 8,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: '#fff',
                  userSelect: 'none',
                }}>
                  {h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`}
                </div>
              ))}
            </div>
          </div>

          {/* Day columns */}
          {WEEKDAYS.map(day => {
            const isToday  = (day as string) === todayName
            const entries  = dayEntries(day)
            const windows  = detectStudyWindows(entries)
            const load     = cogLoad(day)
            const dateNum  = getDayDate(day)
            const holiday  = getDayHoliday(day)

            return (
              <div key={day} style={{ flex: 1, minWidth: 66 }}>

                {/* Day header */}
                <div style={{ paddingBottom: 8, textAlign: 'center' }}>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 7.5,
                    fontWeight: isToday ? 700 : 400,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: isToday ? '#4ecf9e' : 'rgba(255,255,255,0.28)',
                    marginBottom: 3,
                  }}>
                    {(day as string).slice(0, 3)}
                  </div>
                  {/* Date circle */}
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', margin: '0 auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: holiday
                      ? 'rgba(251,191,36,0.15)'
                      : isToday ? 'rgba(78,207,158,0.15)' : 'transparent',
                    border: holiday
                      ? '1.5px solid rgba(251,191,36,0.45)'
                      : isToday ? '1.5px solid rgba(78,207,158,0.45)' : '1px solid transparent',
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700,
                    color: holiday ? '#fbbf24' : isToday ? '#4ecf9e' : 'rgba(255,255,255,0.35)',
                    boxShadow: holiday
                      ? '0 0 10px rgba(251,191,36,0.15)'
                      : isToday ? '0 0 12px rgba(78,207,158,0.2)' : 'none',
                  }}>
                    {dateNum}
                  </div>
                  {/* Public holiday pill */}
                  {holiday && (
                    <div
                      title={holiday.localName}
                      style={{
                        margin: '3px 2px 0',
                        background: 'rgba(251,191,36,0.1)',
                        border: '0.5px solid rgba(251,191,36,0.3)',
                        borderRadius: 4, padding: '1px 3px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 6, color: '#fbbf24',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      🇿🇦 {holiday.localName.length > 10 ? holiday.localName.slice(0, 9) + '…' : holiday.localName}
                    </div>
                  )}
                  {/* Cognitive-load bar */}
                  <div style={{
                    height: 2, borderRadius: 1, overflow: 'hidden',
                    background: 'rgba(255,255,255,0.05)', margin: '4px 6px 0',
                  }}>
                    <div style={{
                      height: '100%', width: `${load * 100}%`,
                      background: loadColor(load), borderRadius: 1,
                      transition: 'width 0.5s',
                    }} />
                  </div>
                </div>

                {/* Column body */}
                <div style={{
                  position: 'relative', height: TOTAL_H, cursor: 'pointer',
                  background: isToday ? 'rgba(78,207,158,0.022)' : 'transparent',
                  borderLeft: `1px solid ${isToday
                    ? 'rgba(78,207,158,0.12)'
                    : 'rgba(255,255,255,0.04)'}`,
                  marginLeft: 2, marginRight: 2,
                }}>

                  {/* Hour gridlines */}
                  {HOURS_RANGE.map(h => (
                    <div key={h} style={{
                      position: 'absolute', top: (h - GRID_START) * ROW_H,
                      left: 0, right: 0, height: 1, pointerEvents: 'none',
                      background: h % 2 === 0
                        ? 'rgba(255,255,255,0.055)'
                        : 'rgba(255,255,255,0.025)',
                    }} />
                  ))}

                  {/* Study-window suggestions */}
                  {windows.map((w, i) => (
                    <div key={i} style={{
                      position: 'absolute', top: w.top + 2, left: 3, right: 3,
                      height: Math.max(20, w.height - 4),
                      background: 'rgba(78,207,158,0.04)',
                      border: '1px dashed rgba(78,207,158,0.16)',
                      borderRadius: 6, pointerEvents: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 7,
                        color: 'rgb(78,207,158)',
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>
                        ✦ study
                      </span>
                    </div>
                  ))}

                  {/* Class entries — proportionally positioned */}
                  {entries.map(entry => {
                    const mod = entry.module || modules.find(m => m.id === entry.module_id)
                    const col = (mod?.color ? MODULE_COLOURS[mod.color] : null)
                      ?? { bg: 'rgba(78,207,158,0.12)', text: '#4ecf9e', dot: '#4ecf9e' }
                    const top    = entryTop(entry.start_time ?? '08:00')
                    const height = entryHeight(entry.start_time ?? '08:00', entry.end_time)
                    const isNow  = isToday && entry.start_time && entry.end_time
                      ? nowMins >= toMins(entry.start_time) && nowMins < toMins(entry.end_time)
                      : false

                    return (
                      <div
                        key={entry.id}
                        className="group"
                        style={{
                          position: 'absolute', top, left: 3, right: 3, height,
                          background: col.bg,
                          border: `1px solid ${col.dot}35`,
                          borderLeft: `2.5px solid ${col.dot}`,
                          borderRadius: '0 5px 5px 0',
                          padding: '3px 5px',
                          overflow: 'hidden',
                          zIndex: 1,
                          boxShadow: isNow ? `0 0 12px ${col.dot}35` : 'none',
                          transition: 'box-shadow 0.3s',
                        }}
                      >
                        {/* "In-progress" accent top line */}
                        {isNow && (
                          <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                            background: `linear-gradient(90deg, ${col.dot} 0%, transparent 100%)`,
                          }} />
                        )}
                        <div style={{
                          fontFamily: 'JetBrains Mono, monospace', fontSize: 7.5, fontWeight: 700,
                          color: col.text, lineHeight: 1.25,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {mod?.module_name?.split(' ').slice(0, 3).join(' ') ?? entry.label ?? 'Class'}
                        </div>
                        {entry.venue && height > 40 && (
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 6.5, color: col.text, opacity: 0.55, marginTop: 1 }}>
                            {entry.venue}
                          </div>
                        )}
                        {entry.start_time && height > 54 && (
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 6.5, color: col.text, opacity: 0.42, marginTop: 1 }}>
                            {entry.start_time.slice(0, 5)}{entry.end_time ? `–${entry.end_time.slice(0, 5)}` : ''}
                          </div>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); if (confirm('Delete this timetable slot?')) deleteEntry(entry.id) }}
                          className="hidden group-hover:flex items-center justify-center"
                          style={{
                            position: 'absolute', top: 2, right: 2,
                            width: 14, height: 14, borderRadius: 3,
                            background: 'rgba(0,0,0,0.45)', border: 'none',
                            cursor: 'pointer', fontSize: 7.5, color: col.text,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}

                  {/* Live current-time line (today only) */}
                  {isToday && nowMins >= GRID_START * 60 && nowMins < GRID_END * 60 && (
                    <div style={{
                      position: 'absolute', top: nowTop, left: -1, right: 0,
                      height: 1.5, background: '#4ecf9e', zIndex: 10,
                      pointerEvents: 'none',
                      boxShadow: '0 0 7px rgba(78,207,158,0.7)',
                    }}>
                      <div style={{
                        position: 'absolute', left: -4, top: -3,
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#4ecf9e',
                        boxShadow: '0 0 10px rgba(78,207,158,0.9)',
                      }} />
                    </div>
                  )}

                  {/* Clickable overlay — tap to add class at that time */}
                  <div
                    style={{ position: 'absolute', inset: 0, zIndex: 0 }}
                    onClick={e => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                      const h = Math.min(GRID_END - 1, GRID_START + Math.floor((e.clientY - rect.top) / ROW_H))
                      openModal(day as string, `${String(h).padStart(2, '0')}:00`)
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Add class modal ──────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); reset(); setPrefill(null) }}
        title="Add Class"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalOpen(false); reset(); setPrefill(null) }}>
              Cancel
            </Button>
            <Button form="class-form" type="submit" loading={saving}>Add Class</Button>
          </>
        }
      >
        <form id="class-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Select
            label="Module"
            placeholder="Select module…"
            options={modules.map(m => ({ value: m.id, label: m.module_name }))}
            {...register('module_id')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Day"
              options={WEEKDAYS.map(d => ({ value: d as string, label: d as string }))}
              {...register('day_of_week')}
            />
            <Select label="Start time" options={TIME_OPTIONS} {...register('start_time')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="End time (optional)"
              placeholder="No end time"
              options={END_OPTIONS}
              {...register('end_time')}
            />
            <Input label="Venue (optional)" placeholder="e.g. LS1A" {...register('venue')} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
