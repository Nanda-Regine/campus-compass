'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore } from '@/store'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import {
  type Task, type Module, type TaskPriority,
  MODULE_COLOURS,
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
  { value: 'normal', label: 'Normal' },
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

  useEffect(() => {
    if (triggerAdd) openAdd()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerAdd])

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'academic', task_type: 'Assignment', priority: 'normal' },
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
      toast.error('Failed to add task')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const toggleDone = async (task: Task) => {
    const completing = task.status !== 'done'
    const newStatus = completing ? 'done' : 'todo'
    updateTask(task.id, { status: newStatus, completed_at: completing ? new Date().toISOString() : null })

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, completed_at: completing ? new Date().toISOString() : null })
      .eq('id', task.id)

    if (error) {
      updateTask(task.id, { status: task.status, completed_at: task.completed_at })
      toast.error('Failed to update task')
      return
    }

    if (completing) {
      const pendingAfter = tasks.filter(t => t.status !== 'done' && t.id !== task.id).length
      import('@/lib/confetti').then(({ triggerConfetti }) => {
        triggerConfetti(pendingAfter === 0 ? 'all_done' : 'task')
      })
      if (pendingAfter === 0) {
        toast.success('All tasks done! You crushed it today 🎉', { duration: 3000 })
      }
    }
  }

  const deleteTask = async (id: string) => {
    removeTask(id)
    await supabase.from('tasks').delete().eq('id', id)
  }

  const openAdd = () => { setModalOpen(true); setFormCategory('academic'); reset({ category: 'academic', task_type: 'assignment', priority: 'normal' }) }

  const todayCount = pendingTasks.filter(t => isToday(t.due_date) || isOverdue(t.due_date)).length
  const weekCount  = pendingTasks.filter(t => isThisWeek(t.due_date) || isOverdue(t.due_date)).length

  return (
    <div className="space-y-4">
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
                'px-3 py-1.5 rounded-lg font-mono text-[0.58rem] uppercase tracking-wide transition-all whitespace-nowrap',
                view === key ? 'bg-teal-600/20 text-teal-400' : 'text-white/40 hover:text-white/70'
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
              'flex-shrink-0 font-mono text-[0.58rem] px-3 py-1 rounded-full border transition-all',
              selectedCategory === 'all'
                ? 'bg-white/15 border-white/30 text-white'
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
            )}
          >
            All
          </button>
          {(Object.entries(TASK_CATEGORY_GROUPS) as [TaskCategoryGroup, typeof TASK_CATEGORY_GROUPS[TaskCategoryGroup]][]).map(([key, grp]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 font-mono text-[0.58rem] px-3 py-1 rounded-full border transition-all',
                selectedCategory === key
                  ? 'border-white/40 text-white'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
              )}
              style={selectedCategory === key ? { background: `${grp.color}25`, borderColor: `${grp.color}60`, color: grp.color } : {}}
            >
              <span>{grp.icon}</span>
              <span>{grp.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Task list ── */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-3">{view === 'done' ? '📋' : view === 'today' ? '✅' : '🎯'}</div>
          <p className="font-display font-bold text-white text-sm">
            {view === 'done' ? 'No completed tasks yet' : view === 'today' ? 'Nothing due today!' : 'No tasks here'}
          </p>
          <p className="font-mono text-[0.6rem] text-white/30 mt-1">
            {view === 'done' ? 'Complete tasks to see them here.' : view === 'today' ? "You're all caught up for today." : "Add tasks to stay on track."}
          </p>
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
              normal:  'bg-white/5 text-white/40 border-white/10',
            }[urgency]
            const modColour = task.module?.color ? MODULE_COLOURS[task.module.color] : null
            const priorityIcon = { normal: '', high: '🔺', urgent: '🚨' }[task.priority]
            const grp = getGroupForType(task.task_type)
            const grpDef = grp ? TASK_CATEGORY_GROUPS[grp] : null

            return (
              <div
                key={task.id}
                className={cn(
                  'flex items-start gap-3 bg-[#111a18] border rounded-xl px-4 py-3 transition-all group',
                  task.status === 'done' ? 'opacity-50 border-white/5' : 'border-white/8 hover:border-white/15'
                )}
              >
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
                    <span className={cn('font-display text-sm font-medium', task.status === 'done' ? 'line-through text-white/30' : 'text-white')}>
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="font-mono text-[0.58rem] text-white/30">
                      {TASK_TYPE_LABELS[task.task_type] ?? task.task_type}
                    </span>
                    {task.module && (
                      <span className="font-mono text-[0.58rem] px-1.5 py-0.5 rounded-full"
                        style={{ background: modColour?.bg, color: modColour?.text }}>
                        {task.module.module_name}
                      </span>
                    )}
                    {label && task.status !== 'done' && (
                      <span className={cn('font-mono text-[0.58rem] px-1.5 py-0.5 rounded-full border', urgencyBadge)}>
                        {label}
                      </span>
                    )}
                    {task.status === 'done' && task.completed_at && (
                      <span className="font-mono text-[0.58rem] text-white/20">Done {fmt.dateShort(task.completed_at)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {task.status !== 'done' && <div className="w-2 h-2 rounded-full" style={{ background: urgencyDot }} />}
                  {task.status !== 'done' && (
                    <button
                      onClick={e => { e.stopPropagation(); setAssistModal({ open: true, task }) }}
                      className="opacity-0 group-hover:opacity-100 text-teal-400/60 hover:text-teal-400 transition-all text-xs px-1"
                      title="AI Study Plan"
                      aria-label="Generate AI study plan"
                    >
                      ✨
                    </button>
                  )}
                  <button onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all text-xs">
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
            <label className="font-mono text-[0.62rem] text-white/50 uppercase tracking-wide mb-2 block">Category</label>
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
                    'flex items-center gap-1.5 font-mono text-[0.58rem] px-3 py-1.5 rounded-full border transition-all',
                    formCategory === key
                      ? 'border-white/40 text-white'
                      : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
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
