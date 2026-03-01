// ============================================================
// Campus Compass — Zustand App Store
// ============================================================
import { create } from 'zustand'
import type {
  Profile, Budget, Subscription,
  Task, Exam, Module, TimetableEntry, Expense,
} from '@/types'

interface AppState {
  // ─── State ─────────────────────────────────────────────────
  userId:       string | null
  profile:      Profile | null
  budget:       Budget | null
  subscription: Subscription | null
  tasks:        Task[]
  exams:        Exam[]
  modules:      Module[]
  timetable:    TimetableEntry[]
  expenses:     Expense[]

  // ─── Setters ───────────────────────────────────────────────
  setUserId:       (id: string) => void
  setProfile:      (profile: Profile) => void
  setBudget:       (budget: Budget) => void
  setSubscription: (sub: Subscription) => void
  setTasks:        (tasks: Task[]) => void
  setExams:        (exams: Exam[]) => void
  setModules:      (modules: Module[]) => void
  setTimetable:    (timetable: TimetableEntry[]) => void
  setExpenses:     (expenses: Expense[]) => void

  // ─── Task mutations ────────────────────────────────────────
  addTask:    (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  removeTask: (id: string) => void

  // ─── Reset ────────────────────────────────────────────────
  reset: () => void
}

const initialState = {
  userId:       null,
  profile:      null,
  budget:       null,
  subscription: null,
  tasks:        [],
  exams:        [],
  modules:      [],
  timetable:    [],
  expenses:     [],
}

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setUserId:       (userId)       => set({ userId }),
  setProfile:      (profile)      => set({ profile }),
  setBudget:       (budget)       => set({ budget }),
  setSubscription: (subscription) => set({ subscription }),
  setTasks:        (tasks)        => set({ tasks }),
  setExams:        (exams)        => set({ exams }),
  setModules:      (modules)      => set({ modules }),
  setTimetable:    (timetable)    => set({ timetable }),
  setExpenses:     (expenses)     => set({ expenses }),

  addTask: (task) =>
    set((state) => ({ tasks: [task, ...state.tasks] })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  reset: () => set(initialState),
}))
