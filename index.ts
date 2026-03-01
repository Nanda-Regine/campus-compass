// ============================================================
// Campus Compass — TypeScript Types
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// ─── Database types ─────────────────────────────────────────

export interface Profile {
  id: string
  email: string | null
  name: string
  emoji: string
  university: string | null
  year_of_study: string | null
  faculty: string | null
  funding_type: FundingType | null
  dietary_pref: string
  living_situation: string | null
  is_premium: boolean
  premium_until: string | null
  setup_complete: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  user_id: string
  monthly_budget: number
  food_budget: number
  nsfas_enabled: boolean
  nsfas_living: number
  nsfas_accom: number
  nsfas_books: number
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  user_id: string
  description: string
  amount: number
  category: ExpenseCategory
  date: string
  notes: string | null
  created_at: string
}

export interface Module {
  id: string
  user_id: string
  name: string
  code: string | null
  colour: ModuleColour
  lecturer: string | null
  venue: string | null
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  module_id: string | null
  title: string
  task_type: TaskType
  due_date: string | null
  priority: TaskPriority
  notes: string | null
  done: boolean
  done_at: string | null
  created_at: string
  updated_at: string
  // Joined
  module?: Module
}

export interface TimetableEntry {
  id: string
  user_id: string
  module_id: string | null
  day_of_week: DayOfWeek
  start_time: string
  end_time: string | null
  venue: string | null
  created_at: string
  // Joined
  module?: Module
}

export interface Exam {
  id: string
  user_id: string
  module_id: string | null
  name: string
  exam_date: string
  start_time: string | null
  venue: string | null
  notes: string | null
  created_at: string
  // Joined
  module?: Module
}

export interface MealPlan {
  id: string
  user_id: string
  day_of_week: DayOfWeek
  meal_slot: MealSlot
  meal_name: string
  cost: number | null
  week_start: string
  created_at: string
}

export interface GroceryItem {
  id: string
  user_id: string
  name: string
  quantity: string | null
  price: number | null
  checked: boolean
  created_at: string
}

export interface NovaMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  payfast_payment_id: string | null
  payfast_subscription_token: string | null
  plan: 'free' | 'premium'
  status: 'active' | 'cancelled' | 'expired' | 'pending'
  amount: number | null
  billing_date: string | null
  next_billing_date: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export interface DashboardSummary {
  user_id: string
  name: string
  emoji: string
  university: string | null
  year_of_study: string | null
  setup_complete: boolean
  is_premium: boolean
  monthly_budget: number
  nsfas_enabled: boolean
  nsfas_living: number
  nsfas_accom: number
  nsfas_books: number
  spent_this_month: number
  pending_tasks: number
  module_count: number
  upcoming_exams: number
}

// ─── Enums / Union types ─────────────────────────────────────

export type FundingType = 'nsfas' | 'bursary' | 'self' | 'loan' | 'mixed'

export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Data'
  | 'Stationery'
  | 'Accommodation'
  | 'Entertainment'
  | 'Health'
  | 'Other'

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food', 'Transport', 'Data', 'Stationery',
  'Accommodation', 'Entertainment', 'Health', 'Other',
]

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  Food: '🍔', Transport: '🚌', Data: '📱', Stationery: '📖',
  Accommodation: '🏠', Entertainment: '🎮', Health: '💊', Other: '💳',
}

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Food: '#f97316', Transport: '#3b82f6', Data: '#a855f7',
  Stationery: '#f59e0b', Accommodation: '#0d9488', Entertainment: '#ec4899',
  Health: '#22c55e', Other: '#6b7280',
}

export type ModuleColour = 'teal' | 'coral' | 'purple' | 'amber' | 'blue' | 'green'

export const MODULE_COLOURS: Record<ModuleColour, { bg: string; text: string; dot: string }> = {
  teal:   { bg: 'rgba(13,148,136,0.15)',  text: '#2dd4bf', dot: '#0d9488' },
  coral:  { bg: 'rgba(249,115,22,0.15)',  text: '#fb923c', dot: '#f97316' },
  purple: { bg: 'rgba(168,85,247,0.15)',  text: '#c084fc', dot: '#a855f7' },
  amber:  { bg: 'rgba(245,158,11,0.15)',  text: '#fcd34d', dot: '#f59e0b' },
  blue:   { bg: 'rgba(59,130,246,0.15)',  text: '#93c5fd', dot: '#3b82f6' },
  green:  { bg: 'rgba(34,197,94,0.15)',   text: '#86efac', dot: '#22c55e' },
}

export type TaskType = 'Assignment' | 'Test' | 'Project' | 'Presentation' | 'Reading' | 'Other'
export type TaskPriority = 'normal' | 'high' | 'urgent'

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
export const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const WEEKDAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export type MealSlot = 'Breakfast' | 'Lunch' | 'Supper' | 'Snack'
export const MEAL_SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Supper', 'Snack']

export const TIMETABLE_HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']

// ─── SA Universities ──────────────────────────────────────────

export const SA_UNIVERSITIES = [
  'University of Cape Town (UCT)',
  'University of the Witwatersrand (Wits)',
  'University of Pretoria (UP)',
  'Stellenbosch University (SU)',
  'University of KwaZulu-Natal (UKZN)',
  'University of Johannesburg (UJ)',
  'University of the Western Cape (UWC)',
  'Nelson Mandela University (NMU)',
  'University of Fort Hare (UFH)',
  'Walter Sisulu University (WSU)',
  'University of Limpopo (UL)',
  'University of Venda (UNIVEN)',
  'University of Zululand (UNIZULU)',
  'Sol Plaatje University (SPU)',
  'Sefako Makgatho Health Sciences (SMU)',
  'North-West University (NWU)',
  'University of the Free State (UFS)',
  'UNISA (Distance Learning)',
  'Durban University of Technology (DUT)',
  'Cape Peninsula University of Technology (CPUT)',
  'Tshwane University of Technology (TUT)',
  'Vaal University of Technology (VUT)',
  'Central University of Technology (CUT)',
  'Mangosuthu University of Technology (MUT)',
  'Rhodes University',
  'Other / TVET College',
] as const

export type SAUniversity = typeof SA_UNIVERSITIES[number]

// ─── Form types ───────────────────────────────────────────────

export interface SetupFormData {
  name: string
  emoji: string
  university: string
  year_of_study: string
  faculty: string
  funding_type: FundingType
  dietary_pref: string
  living_situation: string
  monthly_budget: number
  food_budget: number
  nsfas_living: number
  nsfas_accom: number
  nsfas_books: number
  initial_modules: string[]
}

export interface ExpenseFormData {
  description: string
  amount: number
  category: ExpenseCategory
  date: string
  notes?: string
}

export interface TaskFormData {
  title: string
  module_id?: string
  task_type: TaskType
  due_date?: string
  priority: TaskPriority
  notes?: string
}

export interface ExamFormData {
  name: string
  module_id?: string
  exam_date: string
  start_time?: string
  venue?: string
  notes?: string
}

// ─── API response types ───────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PayFastPaymentData {
  merchant_id: string
  merchant_key: string
  return_url: string
  cancel_url: string
  notify_url: string
  name_first: string
  email_address: string
  m_payment_id: string
  amount: string
  item_name: string
  subscription_type?: '1' | '2'
  billing_date?: string
  recurring_amount?: string
  frequency?: '3' // Monthly
  cycles?: '0' // Indefinite
  signature: string
}
