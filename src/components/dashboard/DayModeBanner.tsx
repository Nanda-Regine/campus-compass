'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import type { Task, Exam, TimetableEntry, Module } from '@/types'

/* ── Types ─────────────────────────────────────────────── */
export type DayMode = 'wake' | 'commute' | 'class' | 'study' | 'wind-down' | 'sleep'

interface DayModeBannerProps {
  timetable: TimetableEntry[]
  tasks: Task[]
  exams: Exam[]
  hour: number        // 0-23 SAST
  firstName: string
}

/* ── Mode detection ─────────────────────────────────────── */
export function getDayMode(hour: number): DayMode {
  if (hour >= 5  && hour < 7)  return 'wake'
  if (hour >= 7  && hour < 9)  return 'commute'
  if (hour >= 9  && hour < 17) return 'class'
  if (hour >= 17 && hour < 20) return 'study'
  if (hour >= 20 && hour < 24) return 'wind-down'
  return 'sleep'  // midnight-5am
}

const MODE_META: Record<DayMode, { label: string; emoji: string; accent: string; dim: string }> = {
  wake:       { label: 'Wake',       emoji: '🌅', accent: '#f59e0b', dim: 'rgba(245,158,11,0.12)' },
  commute:    { label: 'Commute',    emoji: '🚌', accent: '#7090d0', dim: 'rgba(112,144,208,0.12)' },
  class:      { label: 'Class',      emoji: '🎓', accent: '#4ecf9e', dim: 'rgba(78,207,158,0.10)' },
  study:      { label: 'Study',      emoji: '📚', accent: '#9b6fd4', dim: 'rgba(155,111,212,0.10)' },
  'wind-down':{ label: 'Wind Down',  emoji: '🌙', accent: '#7a99b8', dim: 'rgba(122,153,184,0.12)' },
  sleep:      { label: 'Rest',       emoji: '🌙', accent: '#7a99b8', dim: 'rgba(122,153,184,0.08)' },
}

/* ── Slot helpers ───────────────────────────────────────── */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function getCurrentAndNextClass(timetable: TimetableEntry[], now: Date): {
  current: TimetableEntry | null
  next: TimetableEntry | null
  minutesToNext: number | null
} {
  const jsDay = now.getDay()
  const dbDay = jsDay === 0 ? 7 : jsDay
  const todaySlots = timetable.filter(s => (s.day_of_week as number) === dbDay)
  const nowMins = now.getHours() * 60 + now.getMinutes()

  let current: TimetableEntry | null = null
  let next: TimetableEntry | null = null
  let minutesToNext: number | null = null

  for (const slot of todaySlots) {
    const start = toMinutes(slot.start_time ?? '00:00')
    const end   = toMinutes(slot.end_time   ?? '00:00')
    if (nowMins >= start && nowMins < end) {
      current = slot
    } else if (nowMins < start && !next) {
      next = slot
      minutesToNext = start - nowMins
    }
  }
  return { current, next, minutesToNext }
}

/* ── Sub-messages per mode ──────────────────────────────── */
function getContextLine(
  mode: DayMode,
  timetable: TimetableEntry[],
  tasks: Task[],
  exams: Exam[],
  now: Date,
  firstName: string,
): { primary: string; cta?: string; ctaHref?: string } {
  const overdue = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < now).length
  const dueSoon = tasks.filter(t => {
    if (t.status === 'done') return false
    const d = t.due_date ? new Date(t.due_date) : null
    if (!d) return false
    const diff = (d.getTime() - now.getTime()) / 86400000
    return diff >= 0 && diff <= 2
  }).length
  const nextExam = exams.find(e => new Date(e.exam_date) > now)
  const daysToExam = nextExam ? Math.ceil((new Date(nextExam.exam_date).getTime() - now.getTime()) / 86400000) : null
  const { current, next, minutesToNext } = getCurrentAndNextClass(timetable, now)

  const moduleName = (m: TimetableEntry) => (m.module as Module | undefined)?.module_name ?? 'Class'

  switch (mode) {
    case 'wake': {
      const todaySlots = timetable.filter(s => (s.day_of_week as number) === (now.getDay() || 7))
      const firstClass = todaySlots.sort((a,b) => (a.start_time??'').localeCompare(b.start_time??''))[0]
      if (firstClass) return {
        primary: `First class: ${moduleName(firstClass)} at ${firstClass.start_time?.slice(0,5)}`,
        cta: 'See today', ctaHref: '/study/timetable',
      }
      if (dueSoon) return {
        primary: `${dueSoon} task${dueSoon>1?'s':''} due in the next 2 days`,
        cta: 'View tasks', ctaHref: '/study',
      }
      return { primary: `Morning, ${firstName}! Set your intention for today`, cta: 'Open Nova', ctaHref: '/nova' }
    }

    case 'commute': {
      if (next) return {
        primary: `${moduleName(next)} starts in ${minutesToNext} min · ${next.venue ?? 'check timetable'}`,
        cta: 'Directions', ctaHref: '/study/timetable',
      }
      if (overdue) return {
        primary: `${overdue} overdue task${overdue>1?'s':''} waiting — commute time to plan`,
        cta: 'Open tasks', ctaHref: '/study',
      }
      return { primary: 'Commuting · Audio is best right now', cta: 'Ask Nova', ctaHref: '/nova' }
    }

    case 'class': {
      if (current) return {
        primary: `Now: ${moduleName(current)} · ends ${current.end_time?.slice(0,5)}`,
        cta: 'Next class', ctaHref: '/study/timetable',
      }
      if (next) return {
        primary: `Up next: ${moduleName(next)} in ${minutesToNext} min`,
        cta: next.venue ? `Room: ${next.venue}` : 'See timetable', ctaHref: '/study/timetable',
      }
      if (daysToExam !== null && daysToExam <= 14) return {
        primary: `${daysToExam}d to ${(nextExam!.module as Module | undefined)?.module_name ?? 'exam'}`,
        cta: 'Study tips', ctaHref: '/study',
      }
      return { primary: 'All classes done for now · good time to review notes', cta: 'Open study', ctaHref: '/study' }
    }

    case 'study': {
      if (dueSoon) return {
        primary: `${dueSoon} task${dueSoon>1?'s':''} due within 48h · focus window open`,
        cta: 'Start now', ctaHref: '/study',
      }
      if (daysToExam !== null && daysToExam <= 7) return {
        primary: `${daysToExam}d to exam · your best study window is now`,
        cta: 'Focus timer', ctaHref: '/study',
      }
      if (overdue) return {
        primary: `${overdue} overdue — tackle one before tonight`,
        cta: 'View tasks', ctaHref: '/study',
      }
      return { primary: 'Golden study hours: 4pm–7pm · put your phone down', cta: 'Start Pomodoro', ctaHref: '/study' }
    }

    case 'wind-down': {
      const doneToday = tasks.filter(t => {
        if (t.status !== 'done' || !t.completed_at) return false
        const d = new Date(t.completed_at)
        return d.toDateString() === now.toDateString()
      }).length
      if (doneToday) return {
        primary: `${doneToday} task${doneToday>1?'s':''} done today · well done`,
        cta: 'Tomorrow\'s tasks', ctaHref: '/study',
      }
      return {
        primary: 'Wind down · 8 hours of sleep = better exam results',
        cta: 'View budget', ctaHref: '/budget',
      }
    }

    case 'sleep':
    default:
      return { primary: 'Night owl mode · remember to rest', cta: 'Check tasks', ctaHref: '/study' }
  }
}

const MODE_LABEL_KEY: Record<DayMode, string> = {
  wake:        'wake',
  commute:     'commute',
  class:       'class',
  study:       'study',
  'wind-down': 'windDown',
  sleep:       'sleep',
}

/* ── Component ──────────────────────────────────────────── */
export default function DayModeBanner({ timetable, tasks, exams, hour, firstName }: DayModeBannerProps) {
  const t   = useTranslations('dayMode')
  const now = useMemo(() => new Date(), [])
  const mode = getDayMode(hour)
  const meta = MODE_META[mode]
  const ctx  = useMemo(
    () => getContextLine(mode, timetable, tasks, exams, now, firstName),
    [mode, timetable, tasks, exams, now, firstName],
  )

  if (mode === 'sleep') return null  // no banner during late-night hours

  return (
    <div
      className="dash-card-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        background: meta.dim,
        border: `0.5px solid ${meta.accent}30`,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Subtle left accent line */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: `linear-gradient(180deg, ${meta.accent} 0%, ${meta.accent}50 100%)`,
        borderRadius: '3px 0 0 3px',
      }} />

      {/* Emoji + mode pill */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0, paddingLeft: 4 }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>{meta.emoji}</span>
        <span style={{
          fontSize: 7, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: meta.accent, opacity: 0.75,
        }}>
          {t(MODE_LABEL_KEY[mode] as Parameters<typeof t>[0])}
        </span>
      </div>

      {/* Main message */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 12, fontFamily: 'DM Sans, sans-serif',
          color: 'rgba(255,255,255,0.75)', lineHeight: 1.4,
          margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {ctx.primary}
        </p>
      </div>

      {/* CTA */}
      {ctx.cta && ctx.ctaHref && (
        <Link
          href={ctx.ctaHref}
          style={{
            flexShrink: 0,
            fontSize: 10, fontFamily: 'Sora, sans-serif', fontWeight: 600,
            color: meta.accent,
            background: `${meta.accent}15`,
            border: `0.5px solid ${meta.accent}35`,
            borderRadius: 8,
            padding: '4px 8px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            transition: 'background 0.15s',
          }}
        >
          {ctx.cta} →
        </Link>
      )}
    </div>
  )
}
