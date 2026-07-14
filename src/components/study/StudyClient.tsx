'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import PullToRefresh from '@/components/ui/PullToRefresh'
import dynamic from 'next/dynamic'
import { type Module, type Task, type TimetableEntry, type Exam } from '@/types'
import TasksTab from '@/components/study/TasksTab'                     // default tab — static, no flash
import { AmbientImage } from '@/components/ui/AmbientImage'
import TabErrorBoundary from '@/components/ui/TabErrorBoundary'
import StudyContextEngine from '@/components/study/StudyContextEngine' // always rendered above the tabs

// The Study planner has ~18 tabs but shows one at a time. Code-split every non-default tab so
// only the active tab's JS loads on demand — the heavy ones (ModuleOrbitMap pulls in React Flow,
// StudyKitGenerator/AI, CalendarTab, FlashcardsTab) no longer ship in every visit's bundle.
const TabLoading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
    <div style={{ width: 22, height: 22, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
)
const TimetableTab        = dynamic(() => import('@/components/study/TimetableTab'), { ssr: false, loading: () => <TabLoading /> })
const ExamsTab            = dynamic(() => import('@/components/study/ExamsTab'), { ssr: false, loading: () => <TabLoading /> })
const ModulesTab          = dynamic(() => import('@/components/study/ModulesTab'), { ssr: false, loading: () => <TabLoading /> })
const PomodoroTimer       = dynamic(() => import('@/components/study/PomodoroTimer'), { ssr: false, loading: () => <TabLoading /> })
const GradesTab           = dynamic(() => import('@/components/study/GradesTab'), { ssr: false, loading: () => <TabLoading /> })
const FlashcardsTab       = dynamic(() => import('@/components/study/FlashcardsTab'), { ssr: false, loading: () => <TabLoading /> })
const WellnessTab         = dynamic(() => import('@/components/study/WellnessTab'), { ssr: false, loading: () => <TabLoading /> })
const HabitBuilder        = dynamic(() => import('@/components/habits/HabitBuilder'), { ssr: false, loading: () => <TabLoading /> })
const GraduationAudit     = dynamic(() => import('@/components/study/GraduationAudit'), { ssr: false, loading: () => <TabLoading /> })
const AttendanceTab       = dynamic(() => import('@/components/study/AttendanceTab'), { ssr: false, loading: () => <TabLoading /> })
const CalendarTab         = dynamic(() => import('@/components/study/CalendarTab'), { ssr: false, loading: () => <TabLoading /> })
const StudyVelocityTab    = dynamic(() => import('@/components/study/StudyVelocityTab'), { ssr: false, loading: () => <TabLoading /> })
const StudyPodsTab        = dynamic(() => import('@/components/study/StudyPodsTab'), { ssr: false, loading: () => <TabLoading /> })
const PastPaperVault      = dynamic(() => import('@/components/study/PastPaperVault'), { ssr: false, loading: () => <TabLoading /> })
const SmartGradeForecaster = dynamic(() => import('@/components/study/SmartGradeForecaster'), { ssr: false, loading: () => <TabLoading /> })
const ModuleOrbitMap      = dynamic(() => import('@/components/study/ModuleOrbitMap'), { ssr: false, loading: () => <TabLoading /> })
const StudyKitGenerator   = dynamic(() => import('@/components/study/StudyKitGenerator'), { ssr: false, loading: () => <TabLoading /> })
import Link from 'next/link'

interface StudyClientProps {
  initialTab?: string
  initialData: {
    modules:        Module[]
    tasks:          Task[]
    timetable:      TimetableEntry[]
    exams:          Exam[]
    workShifts:     import('@/types').WorkShift[]
    calendarEvents: import('@/types').CalendarEvent[]
    userId:         string
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
  wake:      { gradient: 'linear-gradient(160deg,#0e1a14 0%,#142210 100%)', label: 'Morning grind' },
  commute:   { gradient: 'linear-gradient(160deg,#0a1820 0%,#0d2030 100%)', label: 'On the move' },
  class:     { gradient: 'linear-gradient(160deg,#0a1c16 0%,#0d2218 100%)', label: 'Class in session' },
  study:     { gradient: 'linear-gradient(160deg,#0f0a1e 0%,#150e28 100%)', label: 'Deep work' },
  wind_down: { gradient: 'linear-gradient(160deg,#1a0e14 0%,#200c18 100%)', label: 'Winding down' },
  sleep:     { gradient: 'linear-gradient(160deg,#06080e 0%,#08090e 100%)', label: 'Late night' },
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
  { id: 'velocity',    label: 'Velocity',   icon: '📈', accent: '#7090d0', glow: 'rgba(112,144,208,0.2)' },
  { id: 'pods',        label: 'Study Pods', icon: '👥', accent: '#38BDF8', glow: 'rgba(56,189,248,0.2)' },
  { id: 'pastpapers',  label: 'Past Papers', icon: '📄', accent: '#4ecf9e', glow: 'rgba(78,207,158,0.2)' },
  { id: 'forecaster',  label: 'Forecast',    icon: '📊', accent: '#fbbf24', glow: 'rgba(251,191,36,0.2)' },
  { id: 'orbit',       label: 'Orbit Map',   icon: '⊙',  accent: '#818cf8', glow: 'rgba(129,140,248,0.2)' },
  { id: 'kit',         label: 'AI Study Kit', icon: '✨', accent: '#c084fc', glow: 'rgba(192,132,252,0.2)' },
] as const

type TabId = typeof TAB_CONFIG[number]['id']

export default function StudyClient({ initialData, initialTab }: StudyClientProps) {
  const store = useAppStore()
  const validTabs = TAB_CONFIG.map(t => t.id) as string[]
  const [activeTab, setActiveTab] = useState<TabId>(
    initialTab && validTabs.includes(initialTab) ? initialTab as TabId : 'tasks'
  )
  const [triggerAdd, setTriggerAdd] = useState(0)
  const [hour, setHour] = useState(new Date().getHours())
  const supabase = useMemo(() => createClient(), [])
  // True once the store has been seeded on mount; avoids falling back to stale
  // initialData when the store is intentionally empty (e.g. user deleted all tasks).
  const storeSeeded = useRef(false)

  useEffect(() => {
    store.setModules(initialData.modules)
    store.setTasks(initialData.tasks)
    store.setTimetable(initialData.timetable)
    store.setExams(initialData.exams)
    storeSeeded.current = true
    const tick = setInterval(() => setHour(new Date().getHours()), 60_000)
    return () => clearInterval(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRefresh = useCallback(async () => {
    if (!navigator.onLine) return
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
  const modules   = storeSeeded.current ? store.modules   : initialData.modules
  const tasks     = storeSeeded.current ? store.tasks     : initialData.tasks
  const timetable = storeSeeded.current ? store.timetable : initialData.timetable
  const exams     = storeSeeded.current ? store.exams     : initialData.exams

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
      return { count: modules.length, color: '#fff', glow: 'transparent' }
    }
    return null
  }

  return (
    <div className="page-enter study-page min-h-screen pb-24" style={{ background: 'var(--bg-base)', position: 'relative', overflowX: 'hidden' }}>
      <AmbientImage zone="schedule" opacity={0.46} blurPx={6} saturation={1.8} overlayColor="linear-gradient(180deg,rgba(5,4,12,0.4) 0%,rgba(5,4,12,0.5) 100%)" />
      <PullToRefresh onRefresh={handleRefresh} />

      {/* ── Page header ── */}
      <div style={{ background: headerTheme.gradient, borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>

        {/* Title strip + live alerts */}
        <div style={{ padding: '18px 20px 10px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
              color: '#fff', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 3,
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
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {overdueCount > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 8,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', flexShrink: 0, boxShadow: '0 0 5px rgba(239,68,68,0.8)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#ef4444', fontWeight: 700 }}>
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
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#4ecf9e', fontWeight: 700 }}>
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
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700 }}>
                  {nextExam.module?.module_name?.slice(0, 6) ?? 'Exam'} ⟶
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Main: vertical rail + content ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>

        {/* Vertical tab rail */}
        <div style={{
          width: 56, flexShrink: 0,
          position: 'sticky', top: 57,
          height: 'calc(100vh - 57px)',
          overflowY: 'auto', scrollbarWidth: 'none',
          borderRight: '0.5px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.18)',
        }}>
          {TAB_CONFIG.map(tab => {
            const active = activeTab === tab.id
            const badge  = getBadge(tab.id)
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%', minHeight: 52,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 3,
                  background: active ? `${tab.accent}14` : 'transparent',
                  borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                  borderLeft: `2px solid ${active ? tab.accent : 'transparent'}`,
                  cursor: 'pointer', position: 'relative',
                  transition: 'background 0.15s',
                  padding: '6px 3px',
                }}
              >
                <span style={{ fontSize: '1.05rem', lineHeight: 1, opacity: active ? 1 : 0.45 }}>{tab.icon}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  color: active ? tab.accent : 'var(--text-tertiary)',
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                  maxWidth: 60,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}>
                  {tab.label.slice(0, 7).toUpperCase()}
                </span>
                {badge && (
                  <span style={{
                    position: 'absolute', top: 5, right: 4,
                    minWidth: 14, height: 14, padding: '0 2px',
                    borderRadius: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: '0.63rem', fontWeight: 700,
                    background: `${badge.color}20`, color: badge.color,
                    border: `0.5px solid ${badge.color}40`,
                  }}>
                    {badge.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab content + Reading Mode CTA */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="max-w-2xl mx-auto px-3 py-4">
            <StudyContextEngine exams={exams} userId={initialData.userId} />
            {activeTab === 'tasks'      && <TabErrorBoundary label="Tasks"><TasksTab     tasks={tasks}     modules={modules}   userId={userId} supabase={supabase} triggerAdd={triggerAdd} /></TabErrorBoundary>}
            {activeTab === 'calendar'   && <TabErrorBoundary label="Calendar"><CalendarTab  timetable={timetable} tasks={tasks} exams={exams} modules={modules} workShifts={initialData.workShifts} calendarEvents={initialData.calendarEvents} userId={userId} /></TabErrorBoundary>}
            {activeTab === 'timetable'  && <TabErrorBoundary label="Timetable"><TimetableTab timetable={timetable} modules={modules} userId={userId} supabase={supabase} /></TabErrorBoundary>}
            {activeTab === 'exams'      && <TabErrorBoundary label="Exams"><ExamsTab     exams={exams}     modules={modules}   tasks={tasks}   userId={userId} supabase={supabase} /></TabErrorBoundary>}
            {activeTab === 'grades'     && <TabErrorBoundary label="Grades"><GradesTab    modules={modules} /></TabErrorBoundary>}
            {activeTab === 'flashcards' && <TabErrorBoundary label="Flashcards"><FlashcardsTab modules={modules} /></TabErrorBoundary>}
            {activeTab === 'wellness'   && <TabErrorBoundary label="Wellness"><WellnessTab /></TabErrorBoundary>}
            {activeTab === 'modules'    && <TabErrorBoundary label="Modules"><ModulesTab   modules={modules} tasks={tasks} exams={exams} userId={userId} supabase={supabase} /></TabErrorBoundary>}
            {activeTab === 'pomodoro'   && <TabErrorBoundary label="Pomodoro"><PomodoroTimer modules={modules} tasks={tasks} userId={userId} /></TabErrorBoundary>}
            {activeTab === 'habits'     && <TabErrorBoundary label="Habits"><HabitBuilder /></TabErrorBoundary>}
            {activeTab === 'graduation' && <TabErrorBoundary label="Graduation Audit"><GraduationAudit /></TabErrorBoundary>}
            {activeTab === 'attendance' && <TabErrorBoundary label="Attendance"><AttendanceTab modules={modules} userId={userId} /></TabErrorBoundary>}
            {activeTab === 'velocity'   && <TabErrorBoundary label="Study Velocity"><StudyVelocityTab modules={modules} userId={userId} /></TabErrorBoundary>}
            {activeTab === 'pods'       && <TabErrorBoundary label="Study Pods"><StudyPodsTab userId={userId} /></TabErrorBoundary>}
            {activeTab === 'pastpapers' && <TabErrorBoundary label="Past Papers"><PastPaperVault userId={initialData.userId} /></TabErrorBoundary>}
            {activeTab === 'forecaster' && <TabErrorBoundary label="Forecast"><SmartGradeForecaster modules={modules} /></TabErrorBoundary>}
            {activeTab === 'orbit'      && <TabErrorBoundary label="Orbit Map"><ModuleOrbitMap modules={modules} exams={exams} /></TabErrorBoundary>}
            {activeTab === 'kit'        && <TabErrorBoundary label="AI Study Kit"><StudyKitGenerator modules={modules} /></TabErrorBoundary>}
          </div>
          <div className="max-w-2xl mx-auto px-3 pb-2">
            <Link href="/reader" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 14,
              border: '1px solid rgba(245,158,11,0.18)',
              background: 'rgba(245,158,11,0.05)',
              textDecoration: 'none',
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>📖</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: '#f59e0b', margin: 0 }}>
                  Reading Mode
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#fff', marginTop: 2 }}>
                  Upload a PDF or Word doc — read section by section, not all at once
                </p>
              </div>
              <span style={{ color: 'rgb(245,158,11)', fontSize: 16, flexShrink: 0 }}>→</span>
            </Link>
          </div>
        </div>
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
