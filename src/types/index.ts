// ============================================================
// VarsityOS — TypeScript Types
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// ─── Database types ─────────────────────────────────────────

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  university: string | null
  degree: string | null
  year_of_study: number | null
  student_number: string | null
  avatar_url: string | null
  plan: 'free' | 'scholar' | 'premium' | 'nova_unlimited'
  nova_messages_used: number
  nova_messages_limit: number
  streak_count: number
  last_activity_date: string | null
  onboarding_complete: boolean
  funding_type: FundingType | null
  phone: string | null
  preferred_language: string
  notifications_enabled: boolean
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
  category: string
  description: string | null
  amount: number
  expense_date: string
  month_year: string | null
  receipt_url: string | null
  created_at: string
}

export interface Module {
  id: string
  user_id: string
  module_name: string
  module_code: string
  credits: number
  lecturer_name: string | null
  venue: string | null
  color: string
  semester: number | null
  is_active: boolean
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  module_id: string | null
  group_id: string | null
  title: string
  description: string | null
  task_type: string
  due_date: string | null
  priority: TaskPriority
  status: 'todo' | 'in_progress' | 'done' | 'overdue'
  is_group_task: boolean
  estimated_hours: number | null
  recurrence_rule: string | null
  completed_at: string | null
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
  exam_name: string
  exam_date: string
  venue: string | null
  duration_minutes: number | null
  exam_type: string
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
  plan: 'free' | 'scholar' | 'premium' | 'nova_unlimited'
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
  | 'Clothing'
  | 'Other'

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food', 'Transport', 'Data', 'Stationery',
  'Accommodation', 'Entertainment', 'Health', 'Clothing', 'Other',
]

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  Food: '🍔', Transport: '🚌', Data: '📱', Stationery: '📖',
  Accommodation: '🏠', Entertainment: '🎮', Health: '💊', Clothing: '👕', Other: '💳',
}

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Food: '#f97316', Transport: '#3b82f6', Data: '#a855f7',
  Stationery: '#f59e0b', Accommodation: '#0d9488', Entertainment: '#ec4899',
  Health: '#22c55e', Clothing: '#8b5cf6', Other: '#6b7280',
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

export type TaskType =
  // Academic (legacy capitalized)
  | 'Assignment' | 'Test' | 'Project' | 'Presentation' | 'Reading' | 'Other'
  // Academic (extended)
  | 'exam' | 'tutorial' | 'lab' | 'group_project'
  // Life & Admin
  | 'reminder' | 'meeting' | 'appointment' | 'chore' | 'errand' | 'admin'
  // Wellness
  | 'self_care' | 'exercise' | 'social' | 'personal_goal'
  // Work
  | 'work_shift' | 'work_task'
  // Finance
  | 'payment_due' | 'budget_review'

export type TaskPriority = 'normal' | 'high' | 'urgent'

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
export const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const WEEKDAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export type MealSlot = 'Breakfast' | 'Lunch' | 'Supper' | 'Snack'
export const MEAL_SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Supper', 'Snack']

export const TIMETABLE_HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']

// ─── SA Official Languages ───────────────────────────────────

export type SALanguage =
  | 'English'
  | 'isiZulu'
  | 'isiXhosa'
  | 'Afrikaans'
  | 'Sesotho sa Leboa'
  | 'Setswana'
  | 'Sesotho'
  | 'Xitsonga'
  | 'siSwati'
  | 'Tshivenda'
  | 'isiNdebele'

export const SA_LANGUAGES: { value: SALanguage; label: string }[] = [
  { value: 'English',          label: 'English' },
  { value: 'isiZulu',          label: 'isiZulu' },
  { value: 'isiXhosa',         label: 'isiXhosa' },
  { value: 'Afrikaans',        label: 'Afrikaans' },
  { value: 'Sesotho sa Leboa', label: 'Sesotho sa Leboa (Sepedi)' },
  { value: 'Setswana',         label: 'Setswana' },
  { value: 'Sesotho',          label: 'Sesotho' },
  { value: 'Xitsonga',         label: 'Xitsonga' },
  { value: 'siSwati',          label: 'siSwati' },
  { value: 'Tshivenda',        label: 'Tshivenda' },
  { value: 'isiNdebele',       label: 'isiNdebele' },
]

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

// ─── AI Feature Types ─────────────────────────────────────────

export interface NovaInsight {
  id: string
  user_id: string
  insight_type: 'stress_alert' | 'budget_warning' | 'study_nudge'
  content: string
  dismissed: boolean
  created_at: string
}

export interface BudgetInsight {
  healthScore: number
  healthLabel: 'excellent' | 'good' | 'tight' | 'critical'
  summary: string
  tips: { icon: string; title: string; detail: string }[]
  projectedEndBalance: number
  biggestSpendCategory: string
  savingOpportunity: string
}

export interface GeneratedRecipe {
  name: string
  totalCost: number
  costPerServing: number
  prepTime: string
  cookTime: string
  difficulty: 'easy' | 'medium' | 'hard'
  servings: number
  ingredients: { item: string; amount: string; estimatedCost: number }[]
  steps: { step: number; instruction: string }[]
  tips: string[]
  nutritionNote: string
  canMakeAhead: boolean
  storageTip: string
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

// ─── Part-Time Job Manager ────────────────────────────────────

export type JobType = 'retail' | 'food_service' | 'tutoring' | 'call_centre' | 'campus_job' | 'freelance' | 'gig' | 'other'
export type PayType = 'hourly' | 'shift' | 'monthly' | 'per_gig'
export type JobStatus = 'active' | 'seasonal' | 'ended'
export type ShiftStatus = 'scheduled' | 'worked' | 'missed' | 'swapped' | 'declined'
export type BalanceFlag = 'healthy' | 'watch' | 'overloaded' | 'crisis'

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  retail:       '🛒 Retail',
  food_service: '🍽️ Food Service',
  tutoring:     '📚 Tutoring',
  call_centre:  '📞 Call Centre',
  campus_job:   '🏛️ Campus Job',
  freelance:    '💻 Freelance',
  gig:          '🛵 Gig Work',
  other:        '💼 Other',
}

export interface PartTimeJob {
  id: string
  student_id: string
  employer_name: string
  job_type: JobType
  role_title: string | null
  location: string | null
  is_on_campus: boolean
  is_remote: boolean
  pay_type: PayType
  pay_rate: number | null
  currency: string
  contracted_hours_per_week: number | null
  max_comfortable_hours: number
  status: JobStatus
  start_date: string | null
  end_date: string | null
  sync_with_study_planner: boolean
  block_exam_periods: boolean
  created_at: string
}

export interface WorkShift {
  id: string
  job_id: string
  student_id: string
  shift_date: string
  start_time: string
  end_time: string
  duration_hours: number
  status: ShiftStatus
  earnings: number | null
  has_study_conflict: boolean
  conflict_type: string | null
  conflict_detail: string | null
  notes: string | null
  created_at: string
  // Joined
  job?: PartTimeJob
}

export interface EarningsLog {
  id: string
  student_id: string
  job_id: string | null
  pay_period_start: string
  pay_period_end: string
  hours_worked: number
  gross_earnings: number
  allocated_to: Record<string, number> | null
  created_at: string
}

export interface BalanceSnapshot {
  id: string
  student_id: string
  week_start: string
  study_hours: number
  work_hours: number
  sleep_estimate_hours: number
  free_time_hours: number
  balance_score: number
  nova_flag: BalanceFlag
  created_at: string
}

export interface WorkConflict {
  type: 'lecture' | 'assignment_due' | 'exam_proximity' | 'hours_overload'
  severity: 'medium' | 'high' | 'critical'
  detail: string
  suggestion: string
}

export interface JobFormData {
  employer_name: string
  job_type: JobType
  role_title?: string
  location?: string
  is_on_campus: boolean
  is_remote: boolean
  pay_type: PayType
  pay_rate?: number
  contracted_hours_per_week?: number
  max_comfortable_hours: number
  start_date?: string
  block_exam_periods: boolean
}

export interface ShiftFormData {
  job_id: string
  shift_date: string
  start_time: string
  end_time: string
  status: ShiftStatus
  notes?: string
}

// ─── Mood & Wellness ─────────────────────────────────────────

export type MoodScore = 1 | 2 | 3 | 4 | 5

export interface MoodCheckinRecord {
  id: string
  user_id: string
  mood_score: MoodScore
  checked_in_at: string
  date: string
}
