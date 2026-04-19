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
import StudyAssistModal from '@/components/study/StudyAssistModal'
import PomodoroTimer from '@/components/study/PomodoroTimer'

interface StudyClientProps {
  initialData: {
    modules:   Module[]
    tasks:     Task[]
    timetable: TimetableEntry[]
    exams:     Exam[]
    userId:    string
  }
}

const TABS = [
  { id: 'tasks',     label: 'Tasks',     emoji: '✓' },
  { id: 'timetable', label: 'Timetable', emoji: '⊞' },
  { id: 'exams',     label: 'Exams',     emoji: '◎' },
  { id: 'modules',   label: 'Modules',   emoji: '≡' },
  { id: 'pomodoro',  label: 'Focus',     emoji: '◷' },
] as const

type TabId = typeof TABS[number]['id']

export default function StudyClient({ initialData }: StudyClientProps) {
  const store = useAppStore()
  const [activeTab, setActiveTab] = useState<TabId>('tasks')
  const [triggerAdd, setTriggerAdd] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    store.setModules(initialData.modules)
    store.setTasks(initialData.tasks)
    store.setTimetable(initialData.timetable)
    store.setExams(initialData.exams)
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

  const pendingCount      = tasks.filter(t => t.status !== 'done').length
  const upcomingExamCount = exams.filter(e => new Date(e.exam_date) >= new Date()).length

  return (
    <div className="page-enter min-h-screen pb-24" style={{ background: 'var(--bg-base)' }}>
      <PullToRefresh onRefresh={handleRefresh} />

      {/* ── Page header ── */}
      <div style={{
        padding: '20px 20px 0',
        borderBottom: '0.5px solid var(--border-subtle)',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '1.25rem',
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginBottom: 12,
        }}>
          Study Planner
        </h1>

        {/* ── Tab bar ── */}
        <div className="flex gap-0 overflow-x-auto scrollbar-none">
          {TABS.map(tab => {
            const badge =
              tab.id === 'tasks'   ? pendingCount :
              tab.id === 'exams'   ? upcomingExamCount :
              tab.id === 'modules' ? modules.length : 0
            const active = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '10px 14px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.78rem',
                  fontWeight: active ? 700 : 400,
                  color: active ? 'var(--teal)' : 'var(--text-tertiary)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s',
                  flexShrink: 0,
                }}
              >
                {tab.label}
                {badge > 0 && (
                  <span style={{
                    minWidth: 16,
                    height: 16,
                    padding: '0 4px',
                    borderRadius: 9999,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: active ? 'var(--teal-dim)' : 'rgba(255,255,255,0.07)',
                    color: active ? 'var(--teal)' : 'var(--text-tertiary)',
                  }}>
                    {badge}
                  </span>
                )}
                {active && (
                  <span style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 4,
                    right: 4,
                    height: 2,
                    borderRadius: '2px 2px 0 0',
                    background: 'var(--teal)',
                  }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {activeTab === 'tasks'     && <TasksTab     tasks={tasks}     modules={modules}   userId={userId} supabase={supabase} triggerAdd={triggerAdd} />}
        {activeTab === 'timetable' && <TimetableTab timetable={timetable} modules={modules} userId={userId} supabase={supabase} />}
        {activeTab === 'exams'     && <ExamsTab     exams={exams}     modules={modules}   userId={userId} supabase={supabase} />}
        {activeTab === 'modules'   && <ModulesTab   modules={modules}                     userId={userId} supabase={supabase} />}
        {activeTab === 'pomodoro'  && <PomodoroTimer modules={modules} tasks={tasks} userId={userId} />}
      </div>

      {/* ── Quick-add FAB (tasks tab only) ── */}
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
