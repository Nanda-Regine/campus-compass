'use client'

import { type Task, type Exam } from '@/types'
import { getDaysUntil, sastToday, sastDatePlus } from '@/lib/utils'
import { FlameIcon } from '../dashboardHelpers'

export default function StatCardsRow({ remaining, totalBudget, tasks, exams, streakDays, streakTodayDone, todayStudyMins, lastSleepHours, weekWorkouts }: {
  remaining: number; totalBudget: number; tasks: Task[]; exams: Exam[]; streakDays: number; streakTodayDone: boolean
  todayStudyMins: number; lastSleepHours: number | null; weekWorkouts: number
}) {
  // SAST dates, identical on server + client (avoids a near-midnight hydration mismatch)
  const todayStr = sastToday()
  const weekAheadStr = sastDatePlus(7)
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < todayStr).length
  const tasksDueWeek = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date >= todayStr && t.due_date <= weekAheadStr).length
  const nextExam = exams[0]
  const daysToExam = nextExam ? getDaysUntil(nextExam.exam_date) : null

  const studyDisplay = todayStudyMins >= 60 ? `${Math.floor(todayStudyMins/60)}h${todayStudyMins%60>0?`${todayStudyMins%60}m`:''}` : todayStudyMins > 0 ? `${todayStudyMins}m` : '—'
  const sleepDisplay = lastSleepHours !== null ? `${lastSleepHours}h` : '—'
  void totalBudget
  const cards = [
    { value: remaining >= 0 ? `R${Math.round(remaining)}` : `−R${Math.round(Math.abs(remaining))}`, label: 'Budget left',    accent: remaining >= 0 ? '#c9a84c' : '#ff6b6b' },
    { value: daysToExam !== null ? (daysToExam <= 0 ? 'TODAY' : String(daysToExam)) : '—',           label: 'Days to exam',  accent: daysToExam !== null && daysToExam <= 3 ? '#ff6b6b' : '#7090d0' },
    { value: String(tasksDueWeek + overdueTasks),                                                      label: overdueTasks > 0 ? `${overdueTasks} overdue` : 'Tasks ahead', accent: overdueTasks > 0 ? '#ff6b6b' : '#4ecf9e' },
    { value: String(streakDays), label: streakTodayDone ? 'Streak safe ✓' : 'Study streak',           accent: streakTodayDone ? '#4ecf9e' : streakDays > 0 ? '#f59e0b' : '#4ecf9e', suffix: <FlameIcon streak={streakDays} /> },
    { value: studyDisplay, label: 'Studied today', accent: '#A855F7' },
    { value: sleepDisplay, label: 'Last sleep',    accent: '#38BDF8' },
    { value: String(weekWorkouts), label: 'Workouts wk', accent: '#FF6B9E' },
  ]

  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }} className="scrollbar-none">
      {cards.map(({ value, label, accent, suffix }, i) => (
        <div
          key={label}
          className="dash-card-in"
          style={{
            flexShrink: 0, minWidth: 112, flex: '1 0 112px',
            background: `${accent}0d`,
            border: `1px solid ${accent}38`,
            borderRadius: 14, padding: '15px 14px 12px',
            position: 'relative', overflow: 'hidden',
            animationDelay: `${i * 0.06}s`,
          }}
        >
          <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${accent} 0%,${accent}40 100%)`, borderRadius: '14px 14px 0 0' }} />
          <div style={{
            fontFamily: 'JetBrains Mono,monospace', fontSize: 24, fontWeight: 700, color: accent, lineHeight: 1,
            textShadow: `0 0 24px ${accent}55`,
          }}>
            {value}{suffix && <span style={{ marginLeft: 4 }}>{suffix}</span>}
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 7 }}>{label}</div>
        </div>
      ))}
    </div>
  )
}
