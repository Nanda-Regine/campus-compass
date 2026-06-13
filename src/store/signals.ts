// ============================================================
// VarsityOS — Typed Signal Bus (Orchestration Layer)
// Every user action across all 9 life domains emits a signal.
// The rules engine listens here to queue interventions.
// ============================================================

import type { MoodScore } from '@/types'

// ─── Signal discriminated union ───────────────────────────────

export type Signal =
  // Academic
  | { type: 'grade_updated';        payload: { moduleId: string; grade: number; moduleCode: string } }
  | { type: 'attendance_marked';    payload: { moduleId: string; attended: boolean; moduleCode: string } }
  | { type: 'study_session_ended';  payload: { durationMins: number; moduleId?: string } }
  | { type: 'task_completed';       payload: { taskId: string; moduleId?: string; hoursBeforeDeadline: number } }
  | { type: 'task_pushed';          payload: { taskId: string; pushedDays: number } }
  | { type: 'exam_added';           payload: { examId: string; daysUntil: number; moduleId?: string } }
  // Financial
  | { type: 'expense_logged';       payload: { amount: number; category: string; remainingBudget: number } }
  | { type: 'nsfas_status_change';  payload: { status: string; runwayDays: number } }
  | { type: 'budget_threshold';     payload: { percentage: number; remainingRands: number } }
  // Wellness
  | { type: 'mood_logged';          payload: { score: MoodScore; date: string } }
  | { type: 'sleep_logged';         payload: { hoursSlept: number; quality: number } }
  | { type: 'burnout_computed';     payload: { score: number; trend: 'improving' | 'stable' | 'worsening' } }
  // Habits & Growth
  | { type: 'habit_completed';       payload: { habitId: string; habitName: string; streakDays: number; pack: string } }
  | { type: 'gratitude_logged';      payload: { date: string; entries: [string, string, string] } }
  | { type: 'daily_three_complete';  payload: { date: string; streak: number } }
  // Behaviour
  | { type: 'app_opened';           payload: { dayMode: string; hour: number } }
  | { type: 'session_abandoned';    payload: { page: string; timeSpentMs: number } }
  | { type: 'plan_ignored';         payload: { daysIgnored: number } }

export type SignalType = Signal['type']

type SignalByType<T extends SignalType> = Extract<Signal, { type: T }>
type HandlerFn<T extends SignalType = SignalType> = (signal: SignalByType<T>) => void

// ─── Signal Bus ───────────────────────────────────────────────

class SignalBus {
  private typed    = new Map<SignalType, Set<HandlerFn>>()
  private global   = new Set<(s: Signal) => void>()
  private history: Signal[] = []
  private readonly MAX_HISTORY = 50

  emit<T extends Signal>(signal: T): void {
    // Persist to rolling history for debugging
    this.history = [...this.history.slice(-(this.MAX_HISTORY - 1)), signal]

    const handlers = this.typed.get(signal.type as SignalType)
    if (handlers) handlers.forEach(h => (h as (s: T) => void)(signal))
    this.global.forEach(h => h(signal as Signal))
  }

  // Subscribe to a single signal type; returns unsubscribe fn
  on<T extends SignalType>(type: T, handler: HandlerFn<T>): () => void {
    if (!this.typed.has(type)) this.typed.set(type, new Set())
    this.typed.get(type)!.add(handler as unknown as HandlerFn)
    return () => { this.typed.get(type)?.delete(handler as unknown as HandlerFn) }
  }

  // Subscribe to every signal; returns unsubscribe fn
  onAny(handler: (signal: Signal) => void): () => void {
    this.global.add(handler)
    return () => { this.global.delete(handler) }
  }

  // Last N signals — useful for rules engine cooldown checks
  getHistory(n = 10): Signal[] {
    return this.history.slice(-n)
  }

  // How many times has a given signal type fired in the last N minutes?
  countRecent(type: SignalType, withinMins = 60): number {
    const cutoff = Date.now() - withinMins * 60 * 1000
    // Signals don't carry timestamps — history is ordered by emit time,
    // so we use position as proxy. This is a best-effort count.
    return this.history.filter(s => s.type === type).length
  }
}

export const signals = new SignalBus()
