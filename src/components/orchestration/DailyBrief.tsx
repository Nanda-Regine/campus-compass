'use client'

// ============================================================
// DailyBrief — "Just do these 3 things today"
// Reads today's plan from StudentState and shows top 3 tasks
// with one-tap completion. Lives on the dashboard.
// ============================================================

import { useRouter } from 'next/navigation'
import { useStudentState } from '@/store/studentState'
import { useAppStore } from '@/store'
import { signals } from '@/store/signals'
import type { Task } from '@/types'

const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'var(--danger)',
  high:   'var(--coral)',
  medium: 'var(--gold)',
  low:    'var(--teal)',
}

const PRIORITY_BG: Record<string, string> = {
  urgent: 'var(--danger-dim)',
  high:   'var(--coral-dim)',
  medium: 'var(--gold-dim)',
  low:    'var(--teal-dim)',
}

function TaskRow({ task, onComplete }: { task: Task; onComplete: () => void }) {
  const color = PRIORITY_COLOR[task.priority] ?? 'var(--teal)'
  const bg    = PRIORITY_BG[task.priority]    ?? 'var(--teal-dim)'

  const module = task.module as { module_name?: string } | undefined
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      {/* Checkbox */}
      <button
        onClick={onComplete}
        aria-label={`Complete: ${task.title}`}
        style={{
          flexShrink: 0, width: 22, height: 22,
          borderRadius: 6, border: `1.5px solid ${color}`,
          background: bg, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.82rem', color: 'var(--text-primary)',
          fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {task.title}
        </div>
        {module?.module_name && (
          <div style={{
            fontSize: '0.68rem', color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)', marginTop: 1,
          }}>
            {module.module_name}
          </div>
        )}
      </div>

      {/* Priority pill */}
      <span style={{
        flexShrink: 0, padding: '2px 8px',
        background: bg, border: `1px solid ${color}40`,
        borderRadius: 100,
        fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
        color, fontWeight: 700, letterSpacing: '0.05em',
      }}>
        {task.priority}
      </span>
    </div>
  )
}

export default function DailyBrief() {
  const router = useRouter()
  const { schedule, wellness } = useStudentState()
  const { updateTask } = useAppStore()

  const topTasks = schedule.todayPlan.slice(0, 3)

  if (topTasks.length === 0) {
    // Nothing due today — show positive state
    return (
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16, padding: '16px 18px',
        animation: 'fadeInUp 0.4s ease',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, var(--teal), transparent)',
        }} />
        <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--teal)', letterSpacing: '0.07em', marginBottom: 4 }}>
          TODAY'S BRIEF
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 }}>
          No tasks due today 🎉
        </div>
        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 4 }}>
          Use today to get ahead on tomorrow's work.
        </div>
      </div>
    )
  }

  const handleComplete = (task: Task) => {
    const now = new Date().toISOString()
    const deadline = task.due_date ? new Date(task.due_date).getTime() : Date.now()
    const hoursAhead = Math.max(0, Math.round((deadline - Date.now()) / 3_600_000))

    updateTask(task.id, { status: 'done', completed_at: now })

    signals.emit({
      type: 'task_completed',
      payload: { taskId: task.id, moduleId: task.module_id ?? undefined, hoursBeforeDeadline: hoursAhead },
    })
  }

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 16, padding: '16px 18px',
      animation: 'fadeInUp 0.4s ease',
    }}>
      {/* Top accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, var(--nova), var(--teal), transparent)',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <div>
          <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--nova)', letterSpacing: '0.07em', marginBottom: 3 }}>
            TODAY'S BRIEF
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 700 }}>
            Just do these {topTasks.length} thing{topTasks.length > 1 ? 's' : ''} today
          </div>
        </div>
        {wellness.burnoutScore > 50 && (
          <div style={{
            padding: '4px 10px',
            background: 'var(--coral-dim)',
            border: '1px solid rgba(232,112,64,0.30)',
            borderRadius: 100,
            fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
            color: 'var(--coral)',
          }}>
            Burnout {wellness.burnoutScore}%
          </div>
        )}
      </div>

      {/* Task list */}
      <div style={{ marginTop: 12 }}>
        {topTasks.map(task => (
          <TaskRow key={task.id} task={task} onComplete={() => handleComplete(task)} />
        ))}
      </div>

      {/* Footer */}
      {schedule.todayPlan.length > 3 && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => router.push('/study?tab=tasks')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)',
            }}>
            +{schedule.todayPlan.length - 3} more tasks →
          </button>
        </div>
      )}
    </div>
  )
}
