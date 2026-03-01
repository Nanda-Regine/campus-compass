'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore } from '@/store'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import {
  type Task, type Module, type TaskType, type TaskPriority,
  MODULE_COLOURS,
} from '@/types'
import { cn, getTaskUrgency, fmt } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { SupabaseClient } from '@supabase/supabase-js'

const TASK_TYPES: TaskType[] = ['Assignment','Test','Project','Presentation','Reading','Other']
const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'high',   label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const schema = z.object({
  title:     z.string().min(2, 'Title is required'),
  task_type: z.string(),
  due_date:  z.string().optional(),
  priority:  z.string(),
  module_id: z.string().optional(),
  notes:     z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  tasks:    Task[]
  modules:  Module[]
  userId:   string
  supabase: SupabaseClient
}

const URGENCY_ORDER = { overdue: 0, today: 1, urgent: 2, soon: 3, normal: 4 }

export default function TasksTab({ tasks, modules, userId, supabase }: Props) {
  const { addTask, updateTask, removeTask } = useAppStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [filter,    setFilter]    = useState<'all' | 'pending' | 'done'>('pending')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { task_type: 'Assignment', priority: 'normal' },
  })

  const filteredTasks = tasks
    .filter(t => {
      if (filter === 'pending') return !t.done
      if (filter === 'done')    return t.done
      return true
    })
    .sort((a, b) => {
      if (filter === 'done') return new Date(b.done_at ?? 0).getTime() - new Date(a.done_at ?? 0).getTime()
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
          notes:     data.notes || null,
        })
        .select('*, module:modules(id,name,colour)')
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
    updateTask(task.id, { done: !task.done })
    const { error } = await supabase
      .from('tasks')
      .update({ done: !task.done, done_at: !task.done ? new Date().toISOString() : null })
      .eq('id', task.id)
    if (error) {
      updateTask(task.id, { done: task.done })
      toast.error('Failed to update task')
    }
  }

  const deleteTask = async (id: string) => {
    removeTask(id)
    await supabase.from('tasks').delete().eq('id', id)
  }

  const pendingCount = tasks.filter(t => !t.done).length
  const doneCount    = tasks.filter(t => t.done).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex bg-white/5 rounded-xl p-1 gap-1">
          {(['pending','all','done'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg font-mono text-[0.6rem] uppercase tracking-wide transition-all',
                filter === f ? 'bg-teal-600/20 text-teal-400' : 'text-white/40 hover:text-white/70'
              )}
            >
              {f === 'pending' ? `Due (${pendingCount})` : f === 'done' ? `Done (${doneCount})` : 'All'}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>+ Add task</Button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-3">{filter === 'done' ? '📋' : '🎯'}</div>
          <p className="font-display font-bold text-white text-sm">
            {filter === 'done' ? 'No completed tasks yet' : 'No pending tasks!'}
          </p>
          <p className="font-mono text-[0.6rem] text-white/30 mt-1">
            {filter === 'done' ? 'Complete tasks to see them here.' : "You're all caught up!"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => {
            const { urgency, label } = getTaskUrgency(task.due_date)
            const urgencyDot = { overdue:'#ef4444', today:'#f97316', urgent:'#f59e0b', soon:'#0d9488', normal:'#4b5563' }[urgency]
            const urgencyBadge = {
              overdue:'bg-red-500/10 text-red-400 border-red-500/20',
              today:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
              urgent: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              soon:   'bg-teal-600/10 text-teal-400 border-teal-600/20',
              normal: 'bg-white/5 text-white/40 border-white/10',
            }[urgency]
            const modColour = task.module?.colour ? MODULE_COLOURS[task.module.colour] : null
            const priorityIcon = { normal: '', high: '🔺', urgent: '🚨' }[task.priority]

            return (
              <div
                key={task.id}
                className={cn(
                  'flex items-start gap-3 bg-[#111a18] border rounded-xl px-4 py-3 transition-all group',
                  task.done ? 'opacity-50 border-white/5' : 'border-white/8 hover:border-white/15'
                )}
              >
                <button
                  onClick={() => toggleDone(task)}
                  className={cn(
                    'flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all',
                    task.done ? 'border-teal-600 bg-teal-600' : 'border-white/30 hover:border-teal-600'
                  )}
                >
                  {task.done && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {priorityIcon && <span className="text-xs">{priorityIcon}</span>}
                    <span className={cn('font-display text-sm font-medium', task.done ? 'line-through text-white/30' : 'text-white')}>
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="font-mono text-[0.58rem] text-white/30">{task.task_type}</span>
                    {task.module && (
                      <span className="font-mono text-[0.58rem] px-1.5 py-0.5 rounded-full"
                        style={{ background: modColour?.bg, color: modColour?.text }}>
                        {task.module.name}
                      </span>
                    )}
                    {label && !task.done && (
                      <span className={cn('font-mono text-[0.58rem] px-1.5 py-0.5 rounded-full border', urgencyBadge)}>
                        {label}
                      </span>
                    )}
                    {task.done && task.done_at && (
                      <span className="font-mono text-[0.58rem] text-white/20">Done {fmt.dateShort(task.done_at)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!task.done && <div className="w-2 h-2 rounded-full" style={{ background: urgencyDot }} />}
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
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" options={TASK_TYPES.map(t => ({ value: t, label: t }))} {...register('task_type')} />
            <Input label="Due date" type="date" {...register('due_date')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Priority" options={PRIORITIES.map(p => ({ value: p.value, label: p.label }))} {...register('priority')} />
            <Select label="Module (optional)" placeholder="No module" options={modules.map(m => ({ value: m.id, label: m.name }))} {...register('module_id')} />
          </div>
          <Input label="Notes (optional)" placeholder="Any extra details…" {...register('notes')} />
        </form>
      </Modal>
    </div>
  )
}
