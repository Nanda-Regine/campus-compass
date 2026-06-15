'use client'

// ProcrastinationAlarm — dashboard risk banner.
// Combines overdue task count + exam proximity + XP activity check.
// Shows nothing at 'safe'; escalates to critical with a red pulsing banner.

import { useMemo } from 'react'
import { loadXPState } from '@/lib/xp-engine'
import type { Task, Exam } from '@/types'

type Severity = 'safe' | 'watch' | 'warning' | 'critical'

interface AlarmState {
  severity: Severity
  message: string
  sub: string
  cta: string
}

function getSeverity(overdueCount: number, nearestExamDays: number | null, hasXPToday: boolean): AlarmState {
  const examClose = nearestExamDays !== null && nearestExamDays <= 14
  const examCritical = nearestExamDays !== null && nearestExamDays <= 3
  const examWarning = nearestExamDays !== null && nearestExamDays <= 7

  if (examCritical && overdueCount > 0 && !hasXPToday) {
    return {
      severity: 'critical',
      message: '🚨 Procrastination alarm — act now',
      sub: `${overdueCount} overdue task${overdueCount !== 1 ? 's' : ''} + exam in ${nearestExamDays} day${nearestExamDays !== 1 ? 's' : ''} + no study activity today`,
      cta: 'Just Start →',
    }
  }

  if ((examWarning && overdueCount >= 2) || (examCritical && (overdueCount > 0 || !hasXPToday))) {
    return {
      severity: 'warning',
      message: '⚠ Things are piling up',
      sub: `${overdueCount} overdue task${overdueCount !== 1 ? 's' : ''} · exam in ${nearestExamDays} day${nearestExamDays !== 1 ? 's' : ''}`,
      cta: 'Start a Pomodoro →',
    }
  }

  if (overdueCount >= 2 || (examClose && !hasXPToday)) {
    return {
      severity: 'watch',
      message: '👁 Keep an eye on this',
      sub: overdueCount >= 2
        ? `${overdueCount} tasks are overdue — clear them one by one`
        : `Exam in ${nearestExamDays} days and no activity yet today`,
      cta: 'See tasks →',
    }
  }

  return { severity: 'safe', message: '', sub: '', cta: '' }
}

const ALARM_STYLES: Record<Severity, { bg: string; border: string; text: string; pulse?: boolean }> = {
  safe:     { bg: 'transparent', border: 'transparent', text: '#fff' },
  watch:    { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.25)', text: '#f59e0b' },
  warning:  { bg: 'rgba(234,88,12,0.09)', border: 'rgba(234,88,12,0.3)',  text: '#f97316' },
  critical: { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.4)',  text: '#ef4444', pulse: true },
}

interface Props {
  tasks: Task[]
  exams: Exam[]
  /** Scroll to tasks section — called when CTA is clicked */
  onCTA?: () => void
}

export default function ProcrastinationAlarm({ tasks, exams, onCTA }: Props) {
  const { overdueCount, nearestExamDays, hasXPToday } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const overdueCount = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < today).length

    const nowD = new Date(); nowD.setHours(0, 0, 0, 0)
    const upcoming = exams
      .map(e => Math.ceil((new Date(e.exam_date).getTime() - nowD.getTime()) / 86_400_000))
      .filter(d => d > 0)
      .sort((a, b) => a - b)
    const nearestExamDays = upcoming[0] ?? null

    let hasXPToday = false
    try {
      const state = loadXPState()
      hasXPToday = (state.dailyEventLog[today] ?? []).length > 0
    } catch { /* localStorage unavailable */ }

    return { overdueCount, nearestExamDays, hasXPToday }
  }, [tasks, exams])

  const alarm = useMemo(
    () => getSeverity(overdueCount, nearestExamDays, hasXPToday),
    [overdueCount, nearestExamDays, hasXPToday]
  )

  if (alarm.severity === 'safe') return null

  const style = ALARM_STYLES[alarm.severity]

  return (
    <div style={{
      borderRadius: 14, padding: '12px 16px',
      background: style.bg,
      border: `1px solid ${style.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      animation: style.pulse ? 'procAlarm 2.5s ease-in-out infinite' : undefined,
    }}>
      <style>{`@keyframes procAlarm { 0%,100%{opacity:1} 50%{opacity:0.75} }`}</style>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13,
          color: style.text, marginBottom: 2,
        }}>
          {alarm.message}
        </div>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
          {alarm.sub}
        </div>
      </div>
      {onCTA && (
        <button onClick={onCTA} style={{
          flexShrink: 0,
          fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700,
          padding: '7px 14px', borderRadius: 9,
          border: `1px solid ${style.border}`,
          background: `${style.border}22`,
          color: style.text, cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>
          {alarm.cta}
        </button>
      )}
    </div>
  )
}
