'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import PullToRefresh from '@/components/ui/PullToRefresh'
import TasksTab from '@/components/study/TasksTab'
import TimetableTab from '@/components/study/TimetableTab'
import ExamsTab from '@/components/study/ExamsTab'
import ModulesTab from '@/components/study/ModulesTab'
import { type Module, type Task, type TimetableEntry, type Exam } from '@/types'
import PomodoroTimer from '@/components/study/PomodoroTimer'
import GradesTab from '@/components/study/GradesTab'
import FlashcardsTab from '@/components/study/FlashcardsTab'
import WellnessTab from '@/components/study/WellnessTab'
import HabitBuilder from '@/components/habits/HabitBuilder'
import GraduationAudit from '@/components/study/GraduationAudit'
import AttendanceTab from '@/components/study/AttendanceTab'
import CalendarTab from '@/components/study/CalendarTab'
import { AmbientImage } from '@/components/ui/AmbientImage'

interface StudyClientProps {
  initialData: {
    modules:   Module[]
    tasks:     Task[]
    timetable: TimetableEntry[]
    exams:     Exam[]
    userId:    string
  }
}

// Inlined day mode — avoids cross-component import fragility
function getDayMode(hour: number): string {
  if (hour >= 5  && hour < 8)  return 'wake'
  if (hour >= 8  && hour < 10) return 'commute'
  if (hour >= 10 && hour < 17) return 'class'
  if (hour >= 17 && hour < 21) return 'study'
  if (hour >= 21 && hour < 23) return 'wind_down'
  return 'sleep'
}

const MODE_HEADER: Record<string, { gradient: string; label: string }> = {
  wake:      { gradient: 'linear-gradient(160deg,#0f1225 0%,#1a1a35 100%)', label: 'Morning grind' },
  commute:   { gradient: 'linear-gradient(160deg,#0e1a28 0%,#0f2038 100%)', label: 'On the move' },
  class:     { gradient: 'linear-gradient(160deg,#0d1820 0%,#0f1c2e 100%)', label: 'Class in session' },
  study:     { gradient: 'linear-gradient(160deg,#0a1228 0%,#0d1535 100%)', label: 'Deep work' },
  wind_down: { gradient: 'linear-gradient(160deg,#160e28 0%,#1a1232 100%)', label: 'Winding down' },
  sleep:     { gradient: 'linear-gradient(160deg,#090a14 0%,#0c0d1c 100%)', label: 'Late night' },
}

const TAB_CONFIG = [
  { id: 'tasks',      label: 'Tasks',    icon: '✓',  accent: '#4ecf9e', glow: 'rgba(78,207,158,0.2)' },
  { id: 'calendar',   label: 'Calendar', icon: '📅', accent: '#4ecf9e', glow: 'rgba(78,207,158,0.2)' },
  { id: 'timetable',  label: 'Schedule', icon: '⊞',  accent: '#7090d0', glow: 'rgba(112,144,208,0.2)' },
  { id: 'exams',      label: 'Exams',    icon: '◉',  accent: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },
  { id: 'grades',     label: 'Grades',   icon: '▲',  accent: '#4ecf9e', glow: 'rgba(78,207,158,0.2)' },
  { id: 'flashcards', label: 'Cards',    icon: '◫',  accent: '#c084fc', glow: 'rgba(192,132,252,0.2)' },
  { id: 'wellness',   label: 'Wellness', icon: '♥',  accent: '#7090d0', glow: 'rgba(112,144,208,0.2)' },
  { id: 'modules',    label: 'Modules',  icon: '▦',  accent: '#4ecf9e', glow: 'rgba(78,207,158,0.2)' },
  { id: 'pomodoro',    label: 'Focus',     icon: '⏱',  accent: '#e8834a', glow: 'rgba(232,131,74,0.2)' },
  { id: 'habits',      label: 'Habits',    icon: '🌱', accent: '#6366F1', glow: 'rgba(99,102,241,0.2)' },
  { id: 'graduation',  label: 'Grad Audit',icon: '🎓', accent: '#38BDF8', glow: 'rgba(56,189,248,0.2)' },
  { id: 'attendance',  label: 'Attendance', icon: '📋', accent: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },
] as const

type TabId = typeof TAB_CONFIG[number]['id']

export default function StudyClient({ initialData }: StudyClientProps) {
  const store = useAppStore()
  const [activeTab, setActiveTab] = useState<TabId>('tasks')
  const [triggerAdd, setTriggerAdd] = useState(0)
  const [hour, setHour] = useState(new Date().getHours())
  const supabase = createClient()

  useEffect(() => {
    store.setModules(initialData.modules)
    store.setTasks(initialData.tasks)
    store.setTimetable(initialData.timetable)
    store.setExams(initialData.exams)
    const tick = setInterval(() => setHour(new Date().getHours()), 60_000)
    return () => clearInterval(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRefresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: tasks }, { data: exams }, { data: timetable }, { data: modules }] = await Promise.all([
      supabase.from('tasks').select('*, module:modules(id,module_name,color)').eq('user_id', user.id),
      supabase.from('exams').select('*, module:modules(id,module_name,color)').eq('user_id', user.id),
      supabase.from('timetable_slots').select('*, module:modules(id,module_name,color)').eq('user_id', user.id),
      supabase.from('modules').select('*').eq('user_id', user.id),
    ])
    if (tasks)     store.setTasks(tasks)
    if (exams)     store.setExams(exams)
    if (timetable) store.setTimetable(timetable)
    if (modules)   store.setModules(modules)
  }, [supabase, store])

  const userId    = initialData.userId
  const modules   = store.modules.length   ? store.modules   : initialData.modules
  const tasks     = store.tasks.length     ? store.tasks     : initialData.tasks
  const timetable = store.timetable.length ? store.timetable : initialData.timetable
  const exams     = store.exams.length     ? store.exams     : initialData.exams

  const today          = new Date().toISOString().split('T')[0]
  const pendingTasks   = tasks.filter(t => t.status !== 'done')
  const overdueCount   = pendingTasks.filter(t => t.due_date && t.due_date < today).length
  const todayCount     = pendingTasks.filter(t => t.due_date === today).length
  const upcomingExams  = exams.filter(e => new Date(e.exam_date) >= new Date())
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date))
  const nextExam       = upcomingExams[0]

  const dayMode      = getDayMode(hour)
  const headerTheme  = MODE_HEADER[dayMode] ?? MODE_HEADER.study

  function getBadge(id: string): { count: number; color: string; glow: string } | null {
    if (id === 'tasks' && pendingTasks.length > 0) {
      const c = overdueCount > 0 ? '#ef4444' : '#4ecf9e'
      return { count: pendingTasks.length, color: c, glow: overdueCount > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(78,207,158,0.2)' }
    }
    if (id === 'exams' && upcomingExams.length > 0) {
      return { count: upcomingExams.length, color: '#f59e0b', glow: 'rgba(245,158,11,0.25)' }
    }
    if (id === 'modules' && modules.length > 0) {
      return { count: modules.length, color: 'rgba(255,255,255,0.3)', glow: 'transparent' }
    }
    return null
  }

  return (
    <div className="page-enter min-h-screen pb-24" style={{ background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      <AmbientImage zone="study" opacity={0.38} blurPx={5} saturation={1.3} overlayColor="transparent" />
      <PullToRefresh onRefresh={handleRefresh} />

      {/* ── Page header ── */}
      <div style={{ background: headerTheme.gradient, borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>

        {/* Title strip + live alerts */}
        <div style={{ padding: '18px 20px 10px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.5rem',
              color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 3,
            }}>
              {headerTheme.label}
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: '1.25rem', color: 'var(--text-primary)',
              letterSpacing: '-0.03em', lineHeight: 1, margin: 0,
            }}>
              Study Planner
            </h1>
          </div>

          {/* Live status chips */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            {overdueCount > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 8,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', flexShrink: 0, boxShadow: '0 0 5px rgba(239,68,68,0.8)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: '#ef4444', fontWeight: 700 }}>
                  {overdueCount} overdue
                </span>
              </div>
            )}
            {todayCount > 0 && overdueCount === 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 8,
                background: 'rgba(78,207,158,0.08)', border: '1px solid rgba(78,207,158,0.2)',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: '#4ecf9e', fontWeight: 700 }}>
                  {todayCount} due today
                </span>
              </div>
            )}
            {nextExam && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 8,
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: '#f59e0b', fontWeight: 700 }}>
                  {nextExam.module?.module_name?.slice(0, 6) ?? 'Exam'} ⟶
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Pill tab bar ── */}
        <div
          style={{
            display: 'flex', gap: 2, padding: '0 8px',
            overflowX: 'auto', scrollbarWidth: 'none',
          }}
        >
          {TAB_CONFIG.map(tab => {
            const active = activeTab === tab.id
            const badge  = getBadge(tab.id)

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '8px 11px',
                  borderRadius: '10px 10px 0 0',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.7rem',
                  fontWeight: active ? 700 : 400,
                  color: active ? tab.accent : 'rgba(255,255,255,0.32)',
                  background: active ? `${tab.accent}10` : 'transparent',
                  border: active ? `1px solid ${tab.accent}25` : '1px solid transparent',
                  borderBottom: active ? `2px solid ${tab.accent}` : '2px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease',
                  flexShrink: 0,
                  boxShadow: active ? `0 -2px 12px ${tab.glow}` : 'none',
                }}
              >
                <span style={{ fontSize: '0.9rem', lineHeight: 1, opacity: active ? 1 : 0.6 }}>{tab.icon}</span>
                <span>{tab.label}</span>
                {badge && (
                  <span style={{
                    minWidth: 15, height: 15, padding: '0 3px',
                    borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: '0.48rem', fontWeight: 700,
                    background: `${badge.color}18`, color: badge.color,
                    border: `0.5px solid ${badge.color}35`,
                    boxShadow: active ? `0 0 6px ${badge.glow}` : 'none',
                  }}>
                    {badge.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {activeTab === 'tasks'      && <TasksTab     tasks={tasks}     modules={modules}   userId={userId} supabase={supabase} triggerAdd={triggerAdd} />}
        {activeTab === 'calendar'   && <CalendarTab  timetable={timetable} tasks={tasks} exams={exams} modules={modules} />}
        {activeTab === 'timetable'  && <TimetableTab timetable={timetable} modules={modules} userId={userId} supabase={supabase} />}
        {activeTab === 'exams'      && <ExamsTab     exams={exams}     modules={modules}   tasks={tasks}   userId={userId} supabase={supabase} />}
        {activeTab === 'grades'     && <GradesTab    modules={modules} />}
        {activeTab === 'flashcards' && <FlashcardsTab modules={modules} />}
        {activeTab === 'wellness'   && <WellnessTab />}
        {activeTab === 'modules'    && <ModulesTab   modules={modules} tasks={tasks} exams={exams} userId={userId} supabase={supabase} />}
        {activeTab === 'pomodoro'   && <PomodoroTimer modules={modules} tasks={tasks} userId={userId} />}
        {activeTab === 'habits'     && <HabitBuilder />}
        {activeTab === 'graduation' && <GraduationAudit />}
        {activeTab === 'attendance' && <AttendanceTab modules={modules} userId={userId} />}
      </div>

      {/* ── Quick-add FAB ── */}
      {activeTab === 'tasks' && (
        <button
          onClick={() => setTriggerAdd(n => n + 1)}
          className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 md:bottom-8"
          style={{
            background: 'linear-gradient(135deg, var(--teal), #0f766e)',
            boxShadow: '0 4px 20px rgba(0,181,150,0.35)',
          }}
          aria-label="Add task"
        >
          <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 300, lineHeight: 1 }}>+</span>
        </button>
      )}
    </div>
  )
}
