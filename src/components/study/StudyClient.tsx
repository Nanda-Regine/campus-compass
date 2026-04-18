'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import TopBar from '@/components/layout/TopBar'
import PullToRefresh from '@/components/ui/PullToRefresh'
import TasksTab from '@/components/study/TasksTab'
import TimetableTab from '@/components/study/TimetableTab'
import ExamsTab from '@/components/study/ExamsTab'
import ModulesTab from '@/components/study/ModulesTab'
import { type Module, type Task, type TimetableEntry, type Exam } from '@/types'
import { cn } from '@/lib/utils'
import StudyAssistModal from '@/components/study/StudyAssistModal'
import StreakWidget from '@/components/gamification/StreakWidget'
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
  { id: 'tasks',     label: 'Tasks',     icon: '📋' },
  { id: 'timetable', label: 'Timetable', icon: '🗓️' },
  { id: 'exams',     label: 'Exams',     icon: '📝' },
  { id: 'modules',   label: 'Modules',   icon: '📚' },
  { id: 'pomodoro',  label: 'Focus',     icon: '⏱️' },
] as const

type TabId = typeof TABS[number]['id']

export default function StudyClient({ initialData }: StudyClientProps) {
  const store = useAppStore()
  const [activeTab, setActiveTab] = useState<TabId>('tasks')
  const [triggerAdd, setTriggerAdd]       = useState(0)
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
    <div className="min-h-screen bg-[#080f0e] pb-24">
      <PullToRefresh onRefresh={handleRefresh} />
      <TopBar title="Study Planner" />

      <div className="sticky top-[57px] z-20 bg-[#080f0e] border-b border-white/7">
        <div className="flex px-4 gap-1 max-w-2xl mx-auto">
          {TABS.map(tab => {
            const badge =
              tab.id === 'tasks'   ? pendingCount :
              tab.id === 'exams'   ? upcomingExamCount :
              tab.id === 'modules' ? modules.length : 0

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-1.5 px-3 py-3 font-display text-xs font-bold transition-all whitespace-nowrap',
                  activeTab === tab.id ? 'text-teal-400' : 'text-white/40 hover:text-white/70'
                )}
              >
                <span className="hidden sm:inline">{tab.icon}</span>
                {tab.label}
                {badge > 0 && (
                  <span className={cn(
                    'min-w-[16px] h-4 px-1 rounded-full font-mono text-[0.5rem] flex items-center justify-center',
                    activeTab === tab.id ? 'bg-teal-600/20 text-teal-400' : 'bg-white/8 text-white/40'
                  )}>
                    {badge}
                  </span>
                )}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-t-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {activeTab === 'tasks' && <div className="mb-3"><StreakWidget /></div>}
        {activeTab === 'tasks'     && <TasksTab     tasks={tasks}     modules={modules}   userId={userId} supabase={supabase} triggerAdd={triggerAdd} />}
        {activeTab === 'timetable' && <TimetableTab timetable={timetable} modules={modules} userId={userId} supabase={supabase} />}
        {activeTab === 'exams'     && <ExamsTab     exams={exams}     modules={modules}   userId={userId} supabase={supabase} />}
        {activeTab === 'modules'   && <ModulesTab   modules={modules}                     userId={userId} supabase={supabase} />}
        {activeTab === 'pomodoro'  && <PomodoroTimer modules={modules} tasks={tasks} userId={userId} />}
      </div>

      {/* ── Quick-add FAB ── */}
      {activeTab === 'tasks' && (
        <button
          onClick={() => setTriggerAdd(n => n + 1)}
          className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 md:bottom-8"
          style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)', boxShadow: '0 4px 20px rgba(13,148,136,0.4)' }}
          aria-label="Add task"
        >
          <span className="text-white text-2xl font-light leading-none">+</span>
        </button>
      )}
    </div>
  )
}
