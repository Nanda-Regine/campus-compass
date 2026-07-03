// ============================================================
// VarsityOS — TypeScript Types
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// ─── Database types ─────────────────────────────────────────

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  name: string | null
  emoji: string | null
  university: string | null
  degree: string | null
  year_of_study: number | null
  student_number: string | null
  avatar_url: string | null
  plan: 'free' | 'scholar' | 'nova_unlimited'
  subscription_tier: 'free' | 'scholar' | 'nova_unlimited' | null
  is_premium: boolean
  nova_messages_used: number
  nova_messages_limit: number
  streak_count: number
  last_activity_date: string | null
  onboarding_complete: boolean
  funding_type: FundingType | null
  phone: string | null
  preferred_language: string
  ai_language: string | null
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
  category: ExpenseCategory
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
  name: string
  module_code: string
  code: string
  credits: number
  lecturer_name: string | null
  lecturer: string | null
  venue: string | null
  color: ModuleColour
  colour: ModuleColour
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
  day_of_week: number | DayOfWeek  // INTEGER in DB (1=Mon…7=Sun)
  day_of_week_text: DayOfWeek | null  // human-readable text, used for display/conflict detection
  start_time: string
  end_time: string | null
  venue: string | null
  slot_type: string | null
  label: string | null
  created_at: string
  // Joined
  module?: Module
}

export interface Exam {
  id: string
  user_id: string
  module_id: string | null
  exam_name: string
  name: string
  exam_date: string
  start_time: string | null
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
  plan: 'free' | 'scholar' | 'nova_unlimited'
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

export type FundingType = 'nsfas' | 'bursary' | 'self_funded' | 'family' | 'scholarship' | 'other'

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'data'
  | 'stationery'
  | 'accommodation'
  | 'entertainment'
  | 'health'
  | 'clothing'
  | 'airtime'
  | 'laundry'
  | 'toiletries'
  | 'savings'
  | 'other'

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'food', 'transport', 'data', 'stationery',
  'accommodation', 'entertainment', 'health', 'clothing',
  'airtime', 'laundry', 'toiletries', 'savings', 'other',
]

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  food: '🍔', transport: '🚌', data: '📱', stationery: '📖',
  accommodation: '🏠', entertainment: '🎮', health: '💊', clothing: '👕',
  airtime: '📞', laundry: '🧺', toiletries: '🧴', savings: '🏦', other: '💳',
}

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: '#f97316', transport: '#3b82f6', data: '#a855f7',
  stationery: '#f59e0b', accommodation: '#0d9488', entertainment: '#ec4899',
  health: '#22c55e', clothing: '#8b5cf6', airtime: '#06b6d4',
  laundry: '#84cc16', toiletries: '#fb923c', savings: '#34d399', other: '#6b7280',
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

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
export const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const WEEKDAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export type MealSlot = 'Breakfast' | 'Lunch' | 'Supper' | 'Snack'
export const MEAL_SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Supper', 'Snack']

export const TIMETABLE_HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']

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

// ─── SA Institutions ──────────────────────────────────────────
// All 26 public universities, all 50 public TVET colleges, major private HEIs

export const SA_UNIVERSITIES = [
  // ── Traditional Universities (11) ────────────────────────────
  'University of Cape Town (UCT)',
  'University of the Witwatersrand (Wits)',
  'University of Pretoria (UP)',
  'Stellenbosch University (SU)',
  'University of KwaZulu-Natal (UKZN)',
  'University of the Free State (UFS)',
  'North-West University (NWU)',
  'Rhodes University',
  'University of Fort Hare (UFH)',
  'University of Limpopo (UL)',
  'University of Venda (UNIVEN)',

  // ── Comprehensive Universities (6) ───────────────────────────
  'University of Johannesburg (UJ)',
  'University of the Western Cape (UWC)',
  'Nelson Mandela University (NMU)',
  'Walter Sisulu University (WSU)',
  'Sol Plaatje University (SPU)',
  'University of Mpumalanga (UMP)',

  // ── Universities of Technology (9) ───────────────────────────
  'Tshwane University of Technology (TUT)',
  'Cape Peninsula University of Technology (CPUT)',
  'Durban University of Technology (DUT)',
  'Vaal University of Technology (VUT)',
  'Central University of Technology (CUT)',
  'Mangosuthu University of Technology (MUT)',
  'University of Zululand (UNIZULU)',
  'Sefako Makgatho Health Sciences University (SMU)',

  // ── Distance / Online ─────────────────────────────────────────
  'UNISA',

  // ── Private Universities & HEIs ───────────────────────────────
  'Varsity College (IIE)',
  'Rosebank College (IIE)',
  'MSC College (IIE)',
  'Pearson Institute of Higher Education',
  'Boston City Campus',
  'MANCOSA',
  'Monash South Africa',
  'Regenesys Business School',
  'The Da Vinci Institute',
  'AFDA',
  'Vega School',
  'AAA School of Advertising',
  'Stadio Higher Education',
  'Richfield Graduate Institute',
  'Regent Business School',
  'Lyceum College',
  'Damelin',

  // ── TVET Colleges — Eastern Cape (8) ─────────────────────────
  'Buffalo City TVET College',
  'East Cape Midlands TVET College',
  'Ikhala TVET College',
  'Ingwe TVET College',
  'King Hintsa TVET College',
  'King Sabata Dalindyebo TVET College',
  'Lovedale TVET College',
  'Port Elizabeth TVET College',

  // ── TVET Colleges — Free State (4) ───────────────────────────
  'Flavius Mareka TVET College',
  'Goldfields TVET College',
  'Maluti TVET College',
  'Motheo TVET College',

  // ── TVET Colleges — Gauteng (9) ──────────────────────────────
  'Central Johannesburg TVET College',
  'Ekurhuleni East TVET College',
  'Ekurhuleni West TVET College',
  'Joburg South TVET College',
  'Sedibeng TVET College',
  'South West Gauteng TVET College',
  'Tshwane North TVET College',
  'Tshwane South TVET College',
  'Western Tshwane TVET College',

  // ── TVET Colleges — KwaZulu-Natal (9) ────────────────────────
  'Coastal KZN TVET College',
  'Elangeni TVET College',
  'Esayidi TVET College',
  'Majuba TVET College',
  'Mnambithi TVET College',
  'Mthashana TVET College',
  'Thekwini TVET College',
  'Umfolozi TVET College',
  'Umgungundlovu TVET College',

  // ── TVET Colleges — Limpopo (5) ──────────────────────────────
  'Capricorn TVET College',
  'Lephalale TVET College',
  'Mopani South East TVET College',
  'Sekhukhune TVET College',
  'Vhembe TVET College',

  // ── TVET Colleges — Mpumalanga (3) ───────────────────────────
  'Ehlanzeni TVET College',
  'Gert Sibande TVET College',
  'Nkangala TVET College',

  // ── TVET Colleges — Northern Cape (3) ────────────────────────
  'John Taolo Gaetsewe TVET College',
  'Namaqua TVET College',
  'Northern Cape Rural TVET College',
  'Northern Cape Urban TVET College',

  // ── TVET Colleges — North West (3) ───────────────────────────
  'Orbit TVET College',
  'Taletso TVET College',
  'Vuselela TVET College',

  // ── TVET Colleges — Western Cape (6) ─────────────────────────
  'Boland TVET College',
  'Cape Town TVET College',
  'False Bay TVET College',
  'Northlink TVET College',
  'South Cape TVET College',
  'West Coast TVET College',

  'Other',
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

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  event_date: string    // YYYY-MM-DD
  start_time: string | null   // HH:MM
  end_time: string | null     // HH:MM
  category: string
  color: string
  notes: string | null
  created_at: string
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

// ─── Regulation / Nervous System ─────────────────────────────
export type RegulationSessionType = 'box_breathing' | 'physiological_sigh' | '478_breath' | 'somatic_shake' | 'vagal_toning' | 'eye_movement' | 'progressive_muscle'

export interface RegulationSession {
  id: string
  user_id: string
  session_type: RegulationSessionType
  duration_seconds: number
  completed: boolean
  notes: string | null
  created_at: string
}

export interface NSScore {
  id: string
  user_id: string
  score_date: string
  ns_score: number
  contributing_factors: Record<string, number> | null
  created_at: string
}

// ─── Past Papers ─────────────────────────────────────────────
export type PaperType = 'exam' | 'test' | 'assignment'

export interface PaperInsights {
  topTopics: { topic: string; frequency: number; yearsAppeared: number[] }[]
  likelyQuestions: string[]
  studyTips: string[]
  difficultyLevel: 'easy' | 'medium' | 'hard'
  estimatedPrepHours: number
}

export interface PastPaper {
  id: string
  user_id: string
  module_id: string | null
  institution: string | null
  module_name: string
  module_code: string
  year: number
  paper_type: PaperType
  file_url: string | null
  extracted_text: string | null
  ai_insights: PaperInsights | null
  question_count: number | null
  created_at: string
}

// ─── Cycle Tracking ──────────────────────────────────────────
export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
export type FlowLevel = 'none' | 'light' | 'medium' | 'heavy'

export interface CycleEntry {
  id: string
  user_id: string
  entry_date: string
  phase: CyclePhase
  flow_level: FlowLevel | null
  symptoms: string[]
  energy_level: number | null
  notes: string | null
  created_at: string
}

export interface CyclePhaseInfo {
  phase: CyclePhase
  energy: 'low' | 'medium' | 'high'
  cognitive: 'low' | 'medium' | 'high'
  mood: string
  studyTip: string
  color: string
}

// ─── Safe Walk ───────────────────────────────────────────────
export interface SafeWalkSession {
  id: string
  user_id: string
  destination: string
  contact_name: string
  contact_phone: string
  duration_minutes: number
  started_at: string
  check_in_at: string | null
  completed: boolean
  alert_sent: boolean
  created_at: string
}

// ─── Data Budget ─────────────────────────────────────────────
export interface DataBudget {
  id: string
  user_id: string
  month_year: string
  data_budget_mb: number
  data_used_mb: number
  wifi_sessions: number
  notes: string | null
  created_at: string
  updated_at: string
}

// ─── Health Conditions ────────────────────────────────────────
export type ConditionType = 'chronic' | 'acute' | 'mental_health' | 'reproductive' | 'other'

export interface HealthCondition {
  id: string
  user_id: string
  condition_name: string
  condition_type: ConditionType
  medications: string[]
  triggers: string[]
  notes: string | null
  is_active: boolean
  created_at: string
}

// ─── Wisdom Archive ───────────────────────────────────────────
export type WisdomCategory = 'nsfas' | 'study_tips' | 'campus_life' | 'accommodation' | 'lecturer' | 'admin' | 'wellness' | 'finance' | 'general'

export interface WisdomPost {
  id: string
  user_id: string
  institution: string | null
  category: WisdomCategory
  title: string
  content: string
  upvotes: number
  is_verified: boolean
  is_anonymous: boolean
  created_at: string
}

// ─── Mutual Aid ───────────────────────────────────────────────
export type AidRequestType = 'offer' | 'request'
export type AidCategory = 'textbook' | 'notes' | 'food' | 'transport' | 'tutoring' | 'accommodation' | 'other'

export interface MutualAidRequest {
  id: string
  user_id: string
  request_type: AidRequestType
  category: AidCategory
  title: string
  description: string
  is_anonymous: boolean
  is_fulfilled: boolean
  institution: string | null
  expiry_date: string | null
  created_at: string
}

// ─── Study Accountability ─────────────────────────────────────
export type AccountabilityStatus = 'pending' | 'active' | 'completed' | 'cancelled'

export interface StudyAccountability {
  id: string
  requester_id: string
  partner_id: string | null
  shared_goal: string
  goal_deadline: string | null
  status: AccountabilityStatus
  requester_checkin_date: string | null
  partner_checkin_date: string | null
  created_at: string
}

// ─── Walking Routes ───────────────────────────────────────────
export interface WalkingRoute {
  id: string
  contributor_id: string
  institution: string
  route_name: string
  description: string
  distance_km: number
  duration_minutes: number
  safety_rating: number
  scenery_rating: number
  times_logged: number
  start_point: string
  end_point: string
  created_at: string
}

// ─── User Values ──────────────────────────────────────────────
export interface UserValues {
  id: string
  user_id: string
  values_selected: string[]
  top_3: string[]
  values_statement: string
  completed_at: string | null
  updated_at: string
}

// ─── Safety Incidents ─────────────────────────────────────────
export type IncidentType = 'protest' | 'crime' | 'unsafe_area' | 'harassment' | 'gbv' | 'other'
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface SafetyIncident {
  id: string
  reporter_id: string
  institution: string
  incident_type: IncidentType
  severity: IncidentSeverity
  location_description: string
  description: string
  is_anonymous: boolean
  is_resolved: boolean
  upvotes: number
  created_at: string
}

// ─── Side Hustle ──────────────────────────────────────────────
export type HustleType = 'tutoring' | 'crafts' | 'food' | 'reselling' | 'digital' | 'services' | 'other'

export interface SideHustleEntry {
  id: string
  user_id: string
  hustle_name: string
  hustle_type: HustleType
  description: string
  income_this_month: number
  hours_this_month: number
  started_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Burnout Score (computed) ─────────────────────────────────
export interface BurnoutScore {
  date: string
  score: number
  label: 'Thriving' | 'Balanced' | 'Strained' | 'At risk' | 'Burnt out'
  trend: 'improving' | 'stable' | 'declining'
}

// ─── Cooking Setup ────────────────────────────────────────────
export type CookingSetup = 'full' | 'hotplate' | 'kettle_microwave' | 'no_cooking'

// ─── Dietary Preferences ─────────────────────────────────────
export interface DietaryPrefs {
  isHalal: boolean
  isKosher: boolean
  isVegetarian: boolean
  isVegan: boolean
  isGlutenFree: boolean
  isDairyFree: boolean
  traditionalFoods: boolean
  nutAllergy: boolean
  otherRestrictions: string
}
