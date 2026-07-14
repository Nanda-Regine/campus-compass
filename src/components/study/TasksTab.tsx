'use client'

import { useState, useEffect, useRef, useCallback, useReducer } from 'react'
import { signals } from '@/store/signals'
import { queueWrite, flushPendingWrites } from '@/lib/offline/pendingWrites'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore } from '@/store'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { dispatchXP } from '@/lib/xp-engine'
import Select from '@/components/ui/Select'
import {
  type Task, type Module, type TaskPriority,
  MODULE_COLOURS, type TaskType,
} from '@/types'
import { cn, getTaskUrgency, fmt } from '@/lib/utils'
import {
  TASK_CATEGORY_GROUPS, TASK_TYPE_LABELS, getGroupForType,
  type TaskCategoryGroup,
} from '@/lib/tasks/categories'
import toast from 'react-hot-toast'
import type { SupabaseClient } from '@supabase/supabase-js'
import StudyAssistModal from '@/components/study/StudyAssistModal'

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const schema = z.object({
  title:     z.string().min(2, 'Title is required'),
  category:  z.string().default('academic'),
  task_type: z.string(),
  due_date:  z.string().optional(),
  priority:  z.string(),
  module_id: z.string().optional(),
  notes:     z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  tasks:       Task[]
  modules:     Module[]
  userId:      string
  supabase:    SupabaseClient
  triggerAdd?: number // increment to open add modal from parent
}

const URGENCY_ORDER = { overdue: 0, today: 1, urgent: 2, soon: 3, normal: 4 }
type ViewMode = 'today' | 'week' | 'all' | 'done'

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false
  return dateStr === new Date().toISOString().split('T')[0]
}

function isThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  const end = new Date(now)
  end.setDate(now.getDate() + 7)
  return d <= end
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  return dateStr < new Date().toISOString().split('T')[0]
}

export default function TasksTab({ tasks, modules, userId, supabase, triggerAdd }: Props) {
  const { addTask, updateTask, removeTask } = useAppStore()
  const [modalOpen, setModalOpen]       = useState(false)
  const [saving, setSaving]             = useState(false)
  const [view, setView]                 = useState<ViewMode>('today')
  const [selectedCategory, setSelectedCategory] = useState<TaskCategoryGroup | 'all'>('all')
  const [assistModal, setAssistModal]   = useState<{ open: boolean; task: Task | null }>({ open: false, task: null })
  const [formCategory, setFormCategory] = useState<TaskCategoryGroup>('academic')
  const [swipingId, setSwipingId] = useState<string | null>(null)
  const [swipeDx, setSwipeDx] = useState(0)

  // AI task decomposition — per-task state
  interface DecompStep { id: string; title: string; minutes: number }
  interface DecompState { loading: boolean; steps: DecompStep[]; checked: string[] }
  type DecompAction =
    | { type: 'start' }
    | { type: 'done'; steps: DecompStep[] }
    | { type: 'toggle'; id: string }
    | { type: 'close' }
  const [decomp, decompDispatch] = useReducer(
    (state: Record<string, DecompState>, action: DecompAction & { taskId?: string }): Record<string, DecompState> => {
      const id = action.taskId ?? ''
      switch (action.type) {
        case 'start':  return { ...state, [id]: { loading: true,  steps: [], checked: [] } }
        case 'done':   return { ...state, [id]: { loading: false, steps: action.steps, checked: [] } }
        case 'toggle': {
          const cur = state[id] ?? { loading: false, steps: [], checked: [] }
          const checked = cur.checked.includes(action.id)
            ? cur.checked.filter(c => c !== action.id)
            : [...cur.checked, action.id]
          return { ...state, [id]: { ...cur, checked } }
        }
        case 'close':  {
          const next = { ...state }; delete next[id]; return next
        }
        default: return state
      }
    },
    {}
  )

  const breakItDown = useCallback(async (task: Task) => {
    decompDispatch({ type: 'start', taskId: task.id })
    try {
      const res = await fetch('/api/tasks/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: task.title, description: task.description }),
      })
      const data = await res.json() as { steps?: { id: string; title: string; minutes: number }[] }
      const steps = Array.isArray(data.steps) && data.steps.length > 0 ? data.steps : null
      if (!res.ok || !steps) {
        decompDispatch({ type: 'close', taskId: task.id })
        toast.error('Could not break down task — try again')
        return
      }
      decompDispatch({ type: 'done', taskId: task.id, steps })
    } catch {
      decompDispatch({ type: 'close', taskId: task.id })
      toast.error('Could not break down task — check your connection')
    }
  }, [])
  const swipeStart = useRef<{ id: string; x: number } | null>(null)

  const handleSwipeStart = useCallback((id: string, x: number) => {
    swipeStart.current = { id, x }
  }, [])

  const handleSwipeMove = useCallback((x: number) => {
    if (!swipeStart.current) return
    const dx = x - swipeStart.current.x
    if (dx > 0) {
      setSwipingId(swipeStart.current.id)
      setSwipeDx(Math.min(dx, 100))
    }
  }, [])

  const handleSwipeEnd = useCallback((toggleDone: (task: Task) => void, task: Task) => {
    if (swipeDx > 60) toggleDone(task)
    swipeStart.current = null
    setSwipingId(null)
    setSwipeDx(0)
  }, [swipeDx])

  // Sync queued offline writes when the connection returns
  useEffect(() => {
    const sync = () => { flushPendingWrites(supabase).catch(() => {}) }
    window.addEventListener('online', sync)
    return () => window.removeEventListener('online', sync)
  }, [supabase])

  useEffect(() => {
    if (triggerAdd) openAdd()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerAdd])

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'academic', task_type: 'Assignment', priority: 'medium' },
  })

  // ── Filter tasks by view ────────────────────────────────────
  const pendingTasks = tasks.filter(t => t.status !== 'done')
  const doneTasks    = tasks.filter(t => t.status === 'done')

  const filteredByView = (view === 'done' ? doneTasks : pendingTasks).filter(t => {
    if (view === 'today') return isToday(t.due_date) || isOverdue(t.due_date)
    if (view === 'week')  return isThisWeek(t.due_date) || isOverdue(t.due_date)
    return true
  })

  const filteredTasks = filteredByView
    .filter(t => {
      if (selectedCategory === 'all') return true
      const grp = getGroupForType(t.task_type)
      return grp === selectedCategory
    })
    .sort((a, b) => {
      if (view === 'done') return new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime()
      const ua = getTaskUrgency(a.due_date).urgency
      const ub = getTaskUrgency(b.due_date).urgency
      return URGENCY_ORDER[ua] - URGENCY_ORDER[ub]
    })

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      if (!navigator.onLine) {
        const tempId = crypto.randomUUID()
        const now = new Date().toISOString()
        const optimisticTask: Task = {
          id: tempId,
          user_id: userId,
          module_id: data.module_id || null,
          group_id: null,
          title: data.title,
          description: data.notes || null,
          task_type: data.task_type as TaskType,
          due_date: data.due_date || null,
          priority: data.priority as TaskPriority,
          status: 'todo',
          is_group_task: false,
          estimated_hours: null,
          recurrence_rule: null,
          completed_at: null,
          created_at: now,
          updated_at: now,
        }
        addTask(optimisticTask)
        await queueWrite('tasks', 'insert', {
          id: tempId,
          user_id: userId,
          title: data.title,
          task_type: data.task_type,
          due_date: data.due_date || null,
          priority: data.priority,
          module_id: data.module_id || null,
          description: data.notes || null,
        }).catch(() => {})
        toast.success('Saved offline — will sync when connected')
        setModalOpen(false)
        reset()
        return
      }

      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          user_id:   userId,
          title:     data.title,
          task_type: data.task_type,
          due_date:  data.due_date || null,
          priority:  data.priority,
          module_id: data.module_id || null,
          description: data.notes || null,
        })
        .select('*, module:modules(id,module_name,color)')
        .single()

      if (error) throw error
      addTask(task)
      toast.success('Task added!')
      setModalOpen(false)
      reset()
    } catch (err) {
      toast.error((err as { message?: string })?.message || 'Failed to add task')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const toggleDone = async (task: Task) => {
    const completing = task.status !== 'done'
    const newStatus = completing ? 'done' : 'todo'
    updateTask(task.id, { status: newStatus, completed_at: completing ? new Date().toISOString() : null })

    if (!navigator.onLine) {
      // Queue the write for later — Zustand state already updated above
      await queueWrite('tasks', 'update', {
        id: task.id,
        status: newStatus,
        completed_at: completing ? new Date().toISOString() : null,
      }).catch(() => {})
    } else {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, completed_at: completing ? new Date().toISOString() : null })
        .eq('id', task.id)

      if (error) {
        updateTask(task.id, { status: task.status, completed_at: task.completed_at })
        toast.error('Failed to update task')
        return
      }
    }

    if (completing) {
      signals.emit({
        type: 'task_completed',
        payload: {
          taskId: task.id,
          moduleId: task.module_id ?? undefined,
          hoursBeforeDeadline: task.due_date
            ? Math.max(0, Math.round((new Date(task.due_date).getTime() - Date.now()) / 3_600_000))
            : 0,
        },
      })
      const pendingAfter = tasks.filter(t => t.status !== 'done' && t.id !== task.id).length
      import('@/lib/confetti').then(({ triggerConfetti }) => {
        triggerConfetti(pendingAfter === 0 ? 'all_done' : 'task')
      })
      dispatchXP('task_complete')
      if (pendingAfter === 0) {
        dispatchXP('all_tasks_done')
        toast.success('All tasks done! You crushed it today 🎉', { duration: 3000 })
      }
    }
  }

  const deleteTask = async (id: string) => {
    removeTask(id)
    if (!navigator.onLine) {
      await queueWrite('tasks', 'delete', { id }).catch(() => {})
      return
    }
    await supabase.from('tasks').delete().eq('id', id)
  }

  const openAdd = () => { setModalOpen(true); setFormCategory('academic'); reset({ category: 'academic', task_type: 'Assignment', priority: 'medium' }) }

  const todayCount   = pendingTasks.filter(t => isToday(t.due_date) || isOverdue(t.due_date)).length
  const weekCount    = pendingTasks.filter(t => isThisWeek(t.due_date) || isOverdue(t.due_date)).length
  const overdueCount = pendingTasks.filter(t => isOverdue(t.due_date)).length
  const doneToday    = doneTasks.filter(t => t.completed_at?.startsWith(new Date().toISOString().split('T')[0])).length

  return (
    <div className="space-y-4">
      {/* ── Urgency strip ── */}
      {view !== 'done' && (overdueCount > 0 || doneToday > 0) && (
        <div className="flex gap-2 flex-wrap">
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/8 border border-red-500/20">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-[0.65rem] text-red-400 font-bold">{overdueCount} overdue</span>
            </div>
          )}
          {doneToday > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600/8 border border-teal-600/20">
              <span className="text-teal-400 text-xs">✓</span>
              <span className="font-mono text-[0.65rem] text-teal-400">{doneToday} done today</span>
            </div>
          )}
        </div>
      )}

      {/* ── View tabs ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex bg-white/5 rounded-xl p-1 gap-1">
          {([
            { key: 'today', label: `Today (${todayCount})` },
            { key: 'week',  label: `Week (${weekCount})` },
            { key: 'all',   label: `All (${pendingTasks.length})` },
            { key: 'done',  label: `Done (${doneTasks.length})` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={cn(
                'px-3 py-1.5 rounded-lg font-mono text-[0.65rem] uppercase tracking-wide transition-all whitespace-nowrap',
                view === key ? 'bg-teal-600/20 text-teal-400' : 'text-white/82 hover:text-white/70'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={openAdd}>+ Add</Button>
      </div>

      {/* ── Category filter pills ── */}
      {view !== 'done' && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'flex-shrink-0 font-mono text-[0.65rem] px-3 py-1 rounded-full border transition-all',
              selectedCategory === 'all'
                ? 'bg-white/15 border-white/30 text-white'
                : 'bg-white/5 border-white/10 text-white/82 hover:text-white/70'
            )}
          >
            All
          </button>
          {(Object.entries(TASK_CATEGORY_GROUPS) as [TaskCategoryGroup, typeof TASK_CATEGORY_GROUPS[TaskCategoryGroup]][]).map(([key, grp]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 font-mono text-[0.65rem] px-3 py-1 rounded-full border transition-all',
                selectedCategory === key
                  ? 'border-white/40 text-white'
                  : 'bg-white/5 border-white/10 text-white/82 hover:text-white/70'
              )}
              style={selectedCategory === key ? { background: `${grp.color}25`, borderColor: `${grp.color}60`, color: grp.color } : {}}
            >
              <span>{grp.icon}</span>
              <span>{grp.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── GTD insight strip ── */}
      {view === 'today' && pendingTasks.length > 0 && <GTDInsightCard pendingCount={pendingTasks.length} overdueCount={overdueCount} />}

      {/* ── Task list ── */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-3">{view === 'done' ? '📋' : view === 'today' ? '✅' : '🎯'}</div>
          <p className="font-display font-bold text-white text-sm">
            {view === 'done' ? 'No completed tasks yet' : view === 'today' ? 'Nothing due today!' : 'No tasks here'}
          </p>
          <p className="font-mono text-[0.6rem] text-white/78 mt-1">
            {view === 'done' ? 'Complete tasks to see them here.' : view === 'today' ? "You're all caught up for today." : "Add tasks to stay on track."}
          </p>
          {view !== 'done' && (
            <button
              onClick={openAdd}
              className="mt-4 font-mono text-[0.65rem] text-teal-400 border border-teal-600/25 bg-teal-600/10 hover:bg-teal-600/20 px-4 py-2 rounded-xl transition-all"
            >
              + Add your first task →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => {
            const { urgency, label } = getTaskUrgency(task.due_date)
            const urgencyDot = { overdue:'#ef4444', today:'#f97316', urgent:'#f59e0b', soon:'#0d9488', normal:'#4b5563' }[urgency]
            const urgencyBadge = {
              overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
              today:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
              urgent:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
              soon:    'bg-teal-600/10 text-teal-400 border-teal-600/20',
              normal:  'bg-white/5 text-white/82 border-white/10',
            }[urgency]
            const modColour = task.module?.color ? MODULE_COLOURS[task.module.color] : null
            const priorityIcon = ({ low: '', medium: '', high: '🔺', urgent: '🚨' } as Record<string, string>)[task.priority] ?? ''
            const grp = getGroupForType(task.task_type)
            const grpDef = grp ? TASK_CATEGORY_GROUPS[grp] : null

            const isSwiping = swipingId === task.id && task.status !== 'done'

            return (
              <div
                key={task.id}
                className={cn(
                  'relative flex items-start gap-3 bg-[var(--bg-surface)] border rounded-xl px-4 py-3 transition-all group overflow-hidden',
                  task.status === 'done' ? 'opacity-50 border-white/5' : 'border-white/8 hover:border-white/15'
                )}
                style={task.status !== 'done' ? { borderLeftColor: urgencyDot, borderLeftWidth: 3 } : undefined}
                onTouchStart={task.status !== 'done' ? (e) => handleSwipeStart(task.id, e.touches[0].clientX) : undefined}
                onTouchMove={task.status !== 'done' ? (e) => handleSwipeMove(e.touches[0].clientX) : undefined}
                onTouchEnd={task.status !== 'done' ? () => handleSwipeEnd(toggleDone, task) : undefined}
              >
                {isSwiping && (
                  <div
                    className="absolute inset-0 rounded-xl flex items-center px-4 pointer-events-none transition-opacity"
                    style={{
                      background: `rgba(13,148,136,${Math.min(swipeDx / 100, 0.35)})`,
                      opacity: swipeDx > 10 ? 1 : 0,
                    }}
                  >
                    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" style={{ opacity: Math.min(swipeDx / 60, 1) }}>
                      <path d="M1 7l5 5L17 1" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                <button
                  onClick={() => toggleDone(task)}
                  className={cn(
                    'flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all',
                    task.status === 'done' ? 'border-teal-600 bg-teal-600' : 'border-white/30 hover:border-teal-600'
                  )}
                >
                  {task.status === 'done' && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {grpDef && <span className="text-xs">{grpDef.icon}</span>}
                    {priorityIcon && <span className="text-xs">{priorityIcon}</span>}
                    <span className={cn('font-display text-sm font-medium', task.status === 'done' ? 'line-through text-white/78' : 'text-white')}>
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="font-mono text-[0.65rem] text-white/78">
                      {TASK_TYPE_LABELS[task.task_type] ?? task.task_type}
                    </span>
                    {task.module && (
                      <span className="font-mono text-[0.65rem] px-1.5 py-0.5 rounded-full"
                        style={{ background: modColour?.bg, color: modColour?.text }}>
                        {task.module.module_name}
                      </span>
                    )}
                    {label && task.status !== 'done' && (
                      <span className={cn('font-mono text-[0.65rem] px-1.5 py-0.5 rounded-full border', urgencyBadge)}>
                        {label}
                      </span>
                    )}
                    {task.status === 'done' && task.completed_at && (
                      <span className="font-mono text-[0.65rem] text-white/72">Done {fmt.dateShort(task.completed_at)}</span>
                    )}
                  </div>
                  {/* AI Decompose panel — inside content column, below metadata */}
                  {task.status !== 'done' && decomp[task.id] && !decomp[task.id].loading && (
                    <div className="mt-3 border-t border-white/5 pt-3 space-y-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[0.63rem] text-purple-400 tracking-widest">✦ MICRO-STEPS</span>
                        <button
                          onClick={e => { e.stopPropagation(); decompDispatch({ type: 'close', taskId: task.id }) }}
                          className="font-mono text-[0.63rem] text-white/75 hover:text-white/70"
                        >✕</button>
                      </div>
                      {decomp[task.id].steps.map(step => {
                        const stepDone = decomp[task.id].checked.includes(step.id)
                        return (
                          <button
                            key={step.id}
                            onClick={e => { e.stopPropagation(); decompDispatch({ type: 'toggle', taskId: task.id, id: step.id }) }}
                            className={cn(
                              'w-full flex items-start gap-2.5 text-left px-2.5 py-2 rounded-lg transition-all',
                              stepDone ? 'bg-teal-600/8 opacity-50' : 'bg-white/3 hover:bg-white/6'
                            )}
                          >
                            <div className={cn(
                              'flex-shrink-0 w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center transition-all',
                              stepDone ? 'border-teal-600 bg-teal-600' : 'border-white/20'
                            )}>
                              {stepDone && <svg width="7" height="5" viewBox="0 0 7 5" fill="none"><path d="M1 2.5l1.5 1.5L6 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={cn('font-sans text-xs leading-snug', stepDone ? 'line-through text-white/78' : 'text-white/80')}>
                                {step.title}
                              </div>
                              <div className="font-mono text-[0.65rem] text-white/75 mt-0.5">{step.minutes} min</div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {task.status !== 'done' && <div className="w-2 h-2 rounded-full" style={{ background: urgencyDot }} />}
                  {task.status !== 'done' && (
                    <button
                      onClick={e => { e.stopPropagation(); setAssistModal({ open: true, task }) }}
                      className="opacity-50 hover:opacity-100 text-teal-400 transition-all text-xs px-1 rounded-lg hover:bg-teal-400/10"
                      title="AI Study Plan"
                      aria-label="Generate AI study plan"
                    >
                      ✨
                    </button>
                  )}
                  {task.status !== 'done' && !decomp[task.id] && (
                    <button
                      onClick={e => { e.stopPropagation(); void breakItDown(task) }}
                      className="opacity-50 hover:opacity-100 text-purple-400 transition-all text-[0.6rem] px-1.5 py-0.5 rounded-lg hover:bg-purple-400/10 font-mono whitespace-nowrap"
                      title="Break into micro-steps with AI"
                    >
                      ✦ Break it down
                    </button>
                  )}
                  {task.status !== 'done' && decomp[task.id]?.loading && (
                    <span className="text-[0.6rem] font-mono text-purple-400/60 animate-pulse">thinking…</span>
                  )}
                  <button onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/72 hover:text-red-400 transition-all text-xs">
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <StudyAssistModal
        open={assistModal.open}
        onClose={() => setAssistModal({ open: false, task: null })}
        type="study_plan"
        taskTitle={assistModal.task?.title}
        moduleName={assistModal.task?.module?.module_name}
        dueDate={assistModal.task?.due_date ?? undefined}
      />

      {/* ── Add Task Modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); reset() }}
        title="Add Task"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalOpen(false); reset() }}>Cancel</Button>
            <Button form="task-form" type="submit" loading={saving}>Add Task</Button>
          </>
        }
      >
        <form id="task-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input label="Task title" placeholder="e.g. Submit research essay" error={errors.title?.message} {...register('title')} />

          {/* Category selector */}
          <div>
            <label className="font-mono text-[0.62rem] text-white/70 uppercase tracking-wide mb-2 block">Category</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(TASK_CATEGORY_GROUPS) as [TaskCategoryGroup, typeof TASK_CATEGORY_GROUPS[TaskCategoryGroup]][]).map(([key, grp]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setFormCategory(key)
                    setValue('category', key)
                    setValue('task_type', grp.types[0])
                  }}
                  className={cn(
                    'flex items-center gap-1.5 font-mono text-[0.65rem] px-3 py-1.5 rounded-full border transition-all',
                    formCategory === key
                      ? 'border-white/40 text-white'
                      : 'bg-white/5 border-white/10 text-white/82 hover:text-white/70'
                  )}
                  style={formCategory === key ? { background: `${grp.color}25`, borderColor: `${grp.color}60`, color: grp.color } : {}}
                >
                  <span>{grp.icon}</span>
                  <span>{grp.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              options={TASK_CATEGORY_GROUPS[formCategory].types.map(t => ({ value: t, label: TASK_TYPE_LABELS[t] ?? t }))}
              {...register('task_type')}
            />
            <Input label="Due date" type="date" {...register('due_date')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Priority" options={PRIORITIES.map(p => ({ value: p.value, label: p.label }))} {...register('priority')} />
            <Select label="Module (optional)" placeholder="No module" options={modules.map(m => ({ value: m.id, label: m.module_name }))} {...register('module_id')} />
          </div>
          <Input label="Notes (optional)" placeholder="Any extra details…" {...register('notes')} />
        </form>
      </Modal>
    </div>
  )
}

// ─── GTD Insight card ────────────────────────────────────────────────────────

function GTDInsightCard({ pendingCount, overdueCount }: { pendingCount: number; overdueCount: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      borderRadius: 13, overflow: 'hidden',
      background: 'rgba(99,102,241,0.05)',
      border: '0.5px solid rgba(99,102,241,0.2)',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '9px 12px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', gap: 8,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 11 }}>📥</span>
          <span className="font-mono text-[0.6rem] font-bold" style={{ color: '#818CF8', letterSpacing: '0.06em' }}>
            GTD principles for {pendingCount} open task{pendingCount !== 1 ? 's' : ''}
          </span>
        </span>
        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>
      {open && (
        <div className="space-y-3 px-3 pb-3">
          {overdueCount > 0 && (
            <div className="rounded-lg p-2.5 font-mono text-[0.6rem]" style={{ background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              ⚠️ {overdueCount} overdue task{overdueCount !== 1 ? 's' : ''} — GTD rule: overdue items create mental load and kill focus. Address them before adding anything new.
            </div>
          )}
          {[
            {
              book: 'Getting Things Done — David Allen',
              insight: 'The GTD system has 5 steps: Capture (get every commitment out of your head into this list), Clarify (define the next physical action), Organise (assign due date + priority), Reflect (weekly review — look at every open task and decide its next step), Engage (work by context: assignments together, admin together, not randomly).',
            },
            {
              book: 'The Compound Effect — Darren Hardy',
              insight: '"Small, seemingly insignificant steps completed consistently over time will create a radical difference." Breaking an assignment into 4–5 smaller tasks and completing one daily beats one panicked all-nighter. Every task you close today compounds into exam readiness next month.',
            },
            {
              book: 'Atomic Habits — James Clear',
              insight: 'Pair habits with tasks: "After my 9am class, I will immediately open my task list and complete one item before lunch." This implementation intention removes decision fatigue. Clear also recommends a weekly review — match your task list to your study schedule every Sunday.',
            },
          ].map(item => (
            <div key={item.book} className="pl-2.5" style={{ borderLeft: '2px solid rgba(99,102,241,0.4)' }}>
              <div className="font-mono text-[0.63rem] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.book}</div>
              <div className="font-mono text-[0.62rem] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.insight}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
