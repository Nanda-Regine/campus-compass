'use client'

// ============================================================
// VarsityOS — Auto-Todo Spawner
// Runs once per day, evaluates student state, and creates
// guardian tasks: class prep, exam revision, budget review,
// burnout self-care, and neglected-module checks.
// ============================================================

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store'
import { useStudentState } from '@/store/studentState'
import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/types'

const SPAWNER_KEY = 'varsityos-spawner-v2'

interface SpawnerState {
  lastRunDate:   string
  seenKeys:      string[]  // `${title}__${due_date}` to avoid duplicates across days
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function offsetDateStr(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

function loadState(): SpawnerState {
  if (typeof window === 'undefined') return { lastRunDate: '', seenKeys: [] }
  try { return JSON.parse(localStorage.getItem(SPAWNER_KEY) ?? '{}') }
  catch { return { lastRunDate: '', seenKeys: [] } }
}

function saveState(s: SpawnerState) {
  try { localStorage.setItem(SPAWNER_KEY, JSON.stringify(s)) } catch {}
}

type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'module'>

export function useAutoTodoSpawner(): void {
  const { tasks, timetable, modules, exams, userId, isOnline, addTask } = useAppStore()
  const { financial, wellness } = useStudentState()
  const ranRef = useRef(false)

  useEffect(() => {
    if (!userId) return
    if (ranRef.current) return
    // Wait for at least some data
    if (modules.length === 0 && timetable.length === 0 && tasks.length === 0) return

    const state  = loadState()
    const today  = todayStr()
    if (state.lastRunDate === today) return

    ranRef.current = true

    const run = async () => {
      const supabase  = createClient()
      const tomorrow  = offsetDateStr(1)
      const jsDay     = new Date().getDay()
      const tomorrowDbDay = ((jsDay + 1) % 7) === 0 ? 7 : (jsDay + 1) % 7

      const queue: TaskInsert[]  = []
      const seen   = new Set(state.seenKeys)

      const push = (t: TaskInsert) => {
        const key = `${t.title}__${t.due_date}`
        if (seen.has(key)) return
        // Don't duplicate against existing live tasks by title+date
        if (tasks.some(e => e.title === t.title && e.due_date === t.due_date && e.status !== 'done')) return
        queue.push(t)
        seen.add(key)
      }

      // ── 1. Class prep: class tomorrow, no task for that module ──────
      const tmrwClasses = timetable.filter(s => (s.day_of_week as number) === tomorrowDbDay)
      for (const slot of tmrwClasses) {
        if (!slot.module_id) continue
        const mod = modules.find(m => m.id === slot.module_id)
        if (!mod) continue
        const hasTask = tasks.some(t =>
          t.module_id === slot.module_id && t.status !== 'done' &&
          t.due_date && (t.due_date === today || t.due_date === tomorrow)
        )
        if (hasTask) continue
        push({
          user_id: userId, module_id: slot.module_id, group_id: null,
          title: `Review ${mod.module_code || mod.module_name} before class`,
          description: `[auto] ${mod.module_name} class at ${slot.start_time} tomorrow`,
          task_type: 'reading', due_date: tomorrow,
          priority: 'medium', status: 'todo',
          is_group_task: false, estimated_hours: 1,
          recurrence_rule: null, completed_at: null,
        })
      }

      // ── 2. Exam ≤7 days with no revision task scheduled ─────────────
      for (const exam of exams) {
        const days = daysUntil(exam.exam_date)
        if (days < 0 || days > 7 || !exam.module_id) continue
        const mod = modules.find(m => m.id === exam.module_id)
        if (!mod) continue
        const hasRevision = tasks.some(t =>
          t.module_id === exam.module_id && t.status !== 'done' &&
          t.task_type === 'exam' && t.due_date && t.due_date >= today
        )
        if (hasRevision) continue
        push({
          user_id: userId, module_id: exam.module_id, group_id: null,
          title: `Start exam revision: ${mod.module_code || mod.module_name}`,
          description: `[auto] Exam in ${days} day${days !== 1 ? 's' : ''}. No revision scheduled.`,
          task_type: 'exam', due_date: today,
          priority: days <= 3 ? 'urgent' : 'high',
          status: 'todo', is_group_task: false, estimated_hours: 3,
          recurrence_rule: null, completed_at: null,
        })
      }

      // ── 3. Budget overspend → review task ───────────────────────────
      if (financial.healthScore < 30) {
        push({
          user_id: userId, module_id: null, group_id: null,
          title: 'Review budget — spending above target',
          description: `[auto] Budget health: ${financial.healthScore}/100`,
          task_type: 'budget_review', due_date: today,
          priority: 'high', status: 'todo',
          is_group_task: false, estimated_hours: null,
          recurrence_rule: null, completed_at: null,
        })
      }

      // ── 4. High burnout → self-care task ────────────────────────────
      if (wellness.burnoutScore >= 70) {
        push({
          user_id: userId, module_id: null, group_id: null,
          title: 'Schedule a recovery break today',
          description: `[auto] Burnout score: ${wellness.burnoutScore}/100`,
          task_type: 'self_care', due_date: today,
          priority: 'high', status: 'todo',
          is_group_task: false, estimated_hours: 2,
          recurrence_rule: null, completed_at: null,
        })
      }

      // ── 5. Module neglected >7 days but active in timetable ─────────
      const sevenDaysAgo = offsetDateStr(-7)
      for (const mod of modules.filter(m => m.is_active)) {
        if (!timetable.some(s => s.module_id === mod.id)) continue
        const recentActivity = tasks.some(t =>
          t.module_id === mod.id && t.created_at >= sevenDaysAgo
        )
        if (recentActivity) continue
        push({
          user_id: userId, module_id: mod.id, group_id: null,
          title: `Check ${mod.module_code || mod.module_name} — no activity in 7+ days`,
          description: '[auto] No tasks for this module this week. Review your progress.',
          task_type: 'reading', due_date: today,
          priority: 'medium', status: 'todo',
          is_group_task: false, estimated_hours: 1,
          recurrence_rule: null, completed_at: null,
        })
      }

      // ── 6. Nothing due today and it's before noon ────────────────────
      const hour = new Date().getHours()
      if (hour < 12 && !tasks.some(t => t.due_date === today && t.status !== 'done')) {
        push({
          user_id: userId, module_id: null, group_id: null,
          title: 'Plan today — no tasks scheduled',
          description: '[auto] No tasks due today. Use this time to get ahead.',
          task_type: 'admin', due_date: today,
          priority: 'medium', status: 'todo',
          is_group_task: false, estimated_hours: 0.5,
          recurrence_rule: null, completed_at: null,
        })
      }

      // ── Insert (cap at 5 per day run) ────────────────────────────────
      const toInsert = queue.slice(0, 5)
      const newKeys: string[] = []

      for (const t of toInsert) {
        if (isOnline) {
          const { data, error } = await supabase
            .from('tasks')
            .insert(t)
            .select('*, module:modules(id,module_name,color)')
            .single()
          if (!error && data) {
            addTask(data as Task)
            newKeys.push(`${t.title}__${t.due_date}`)
          }
        } else {
          const tempTask: Task = {
            ...t,
            id: `local-${Math.random().toString(36).slice(2)}`,
            completed_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          addTask(tempTask)
          newKeys.push(`${t.title}__${t.due_date}`)
        }
      }

      saveState({
        lastRunDate: today,
        seenKeys: [...Array.from(seen), ...newKeys].slice(-150),
      })
    }

    run().catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, modules.length, timetable.length, exams.length])
}
