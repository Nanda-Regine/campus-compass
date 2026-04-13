// ============================================================
// VarsityOS — Zustand App Store (AI-Enhanced)
// ============================================================
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Profile, Budget, Subscription,
  Task, Exam, Module, TimetableEntry, Expense,
  GroceryItem, MealPlan,
} from '@/types'

interface NovaInsight {
  id: string
  insight_type: string
  content: string
  created_at: string
}

interface AppState {
  // ─── Auth & user ───────────────────────────────────────────
  userId:       string | null
  profile:      Profile | null
  budget:       Budget | null
  subscription: Subscription | null
  isOnline:     boolean

  // ─── Study data ────────────────────────────────────────────
  tasks:        Task[]
  exams:        Exam[]
  modules:      Module[]
  timetable:    TimetableEntry[]

  // ─── Budget data ───────────────────────────────────────────
  expenses:     Expense[]

  // ─── Meals data ────────────────────────────────────────────
  groceryItems: GroceryItem[]
  mealPlans:    MealPlan[]

  // ─── Nova AI state ─────────────────────────────────────────
  novaInsights:     NovaInsight[]
  novaMessageCount: number

  // ─── Setters ───────────────────────────────────────────────
  setIsOnline:         (online: boolean) => void
  setUserId:           (id: string) => void
  setProfile:          (profile: Profile) => void
  setBudget:           (budget: Budget | null) => void
  setSubscription:     (sub: Subscription) => void
  setTasks:            (tasks: Task[]) => void
  setExams:            (exams: Exam[]) => void
  setModules:          (modules: Module[]) => void
  setTimetable:        (timetable: TimetableEntry[]) => void
  setExpenses:         (expenses: Expense[]) => void
  setGroceryItems:     (items: GroceryItem[]) => void
  setMealPlans:        (plans: MealPlan[]) => void
  setNovaInsights:     (insights: NovaInsight[]) => void
  setNovaMessageCount: (count: number) => void

  // ─── Task mutations ────────────────────────────────────────
  addTask:    (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  removeTask: (id: string) => void

  // ─── Exam mutations ────────────────────────────────────────
  addExam:    (exam: Exam) => void
  removeExam: (id: string) => void

  // ─── Module mutations ──────────────────────────────────────
  addModule:    (module: Module) => void
  removeModule: (id: string) => void

  // ─── Timetable mutations ───────────────────────────────────
  addTimetableEntry:    (entry: TimetableEntry) => void
  removeTimetableEntry: (id: string) => void

  // ─── Expense mutations ─────────────────────────────────────
  addExpense:    (expense: Expense) => void
  removeExpense: (id: string) => void

  // ─── Grocery mutations ─────────────────────────────────────
  addGroceryItem:    (item: GroceryItem) => void
  updateGroceryItem: (id: string, updates: Partial<GroceryItem>) => void
  removeGroceryItem: (id: string) => void

  // ─── Nova insight mutations ────────────────────────────────
  dismissInsight: (id: string) => void

  // ─── Reset ────────────────────────────────────────────────
  reset: () => void
}

const initialState = {
  userId:           null,
  profile:          null,
  budget:           null,
  subscription:     null,
  isOnline:         true,
  tasks:            [],
  exams:            [],
  modules:          [],
  timetable:        [],
  expenses:         [],
  groceryItems:     [],
  mealPlans:        [],
  novaInsights:     [],
  novaMessageCount: 0,
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
  ...initialState,

  // Setters
  setIsOnline:         (isOnline)         => set({ isOnline }),
  setUserId:           (userId)           => set({ userId }),
  setProfile:          (profile)          => set({ profile }),
  setBudget:           (budget)           => set({ budget }),
  setSubscription:     (subscription)     => set({ subscription }),
  setTasks:            (tasks)            => set({ tasks }),
  setExams:            (exams)            => set({ exams }),
  setModules:          (modules)          => set({ modules }),
  setTimetable:        (timetable)        => set({ timetable }),
  setExpenses:         (expenses)         => set({ expenses }),
  setGroceryItems:     (groceryItems)     => set({ groceryItems }),
  setMealPlans:        (mealPlans)        => set({ mealPlans }),
  setNovaInsights:     (novaInsights)     => set({ novaInsights }),
  setNovaMessageCount: (novaMessageCount) => set({ novaMessageCount }),

  // Task mutations
  addTask: (task) =>
    set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTask: (id, updates) =>
    set((state) => ({ tasks: state.tasks.map((t) => t.id === id ? { ...t, ...updates } : t) })),
  removeTask: (id) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

  // Exam mutations
  addExam: (exam) =>
    set((state) => ({ exams: [...state.exams, exam].sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()) })),
  removeExam: (id) =>
    set((state) => ({ exams: state.exams.filter((e) => e.id !== id) })),

  // Module mutations
  addModule: (module) =>
    set((state) => ({ modules: [...state.modules, module] })),
  removeModule: (id) =>
    set((state) => ({ modules: state.modules.filter((m) => m.id !== id) })),

  // Timetable mutations
  addTimetableEntry: (entry) =>
    set((state) => ({ timetable: [...state.timetable, entry] })),
  removeTimetableEntry: (id) =>
    set((state) => ({ timetable: state.timetable.filter((e) => e.id !== id) })),

  // Expense mutations
  addExpense: (expense) =>
    set((state) => ({ expenses: [expense, ...state.expenses] })),
  removeExpense: (id) =>
    set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) })),

  // Grocery mutations
  addGroceryItem: (item) =>
    set((state) => ({ groceryItems: [item, ...state.groceryItems] })),
  updateGroceryItem: (id, updates) =>
    set((state) => ({ groceryItems: state.groceryItems.map((i) => i.id === id ? { ...i, ...updates } : i) })),
  removeGroceryItem: (id) =>
    set((state) => ({ groceryItems: state.groceryItems.filter((i) => i.id !== id) })),

  // Nova insight mutations
  dismissInsight: (id) =>
    set((state) => ({ novaInsights: state.novaInsights.filter((i) => i.id !== id) })),

  // Reset
  reset: () => set(initialState),
    }),
    {
      name: 'varsityos-store',
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) return { ...initialState }
        return persistedState as AppState
      },
      partialize: (state) => { const { isOnline: _o, ...rest } = state; return rest },
    }
  )
)
