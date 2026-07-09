// ============================================================
// VarsityOS — Utility Functions
// ============================================================
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistance, isPast, differenceInCalendarDays, startOfMonth, endOfMonth } from 'date-fns'

// ─── Tailwind class helper ────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Formatting ───────────────────────────────────────────────
export const fmt = {
  currency: (n: number) =>
    `R${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,

  currencyShort: (n: number) =>
    `R${Number(n).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`,

  date: (d: string | Date) => format(new Date(d), 'd MMM yyyy'),

  dateShort: (d: string | Date) => format(new Date(d), 'd MMM'),

  dateFull: (d: string | Date) =>
    format(new Date(d), 'EEEE, d MMMM yyyy'),

  time: (t: string) => {
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
  },

  pct: (n: number, total: number) =>
    total > 0 ? Math.min(100, Math.round((n / total) * 100)) : 0,

  relativeDate: (d: string | Date) => formatDistance(new Date(d), new Date(), { addSuffix: true }),
}

// ─── Date helpers ─────────────────────────────────────────────
// Current hour (0-23) in South African Standard Time, computed the SAME way on the
// server (Vercel runs UTC) and in the browser (SAST, UTC+2). Deriving the hour from
// the local `new Date().getHours()` made SSR and client hydration disagree by 2h,
// producing hydration mismatches on hour-dependent UI (e.g. the DayModeBanner, which
// returns null for 'sleep' mode) that tripped the dashboard error boundary.
export function sastHour(): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      hourCycle: 'h23',
      timeZone: 'Africa/Johannesburg',
    }).format(new Date())
  )
}

// Current date as YYYY-MM-DD in SAST, computed identically on the server (UTC) and in
// the browser. Date-filtered dashboard UI that used a local `new Date()` disagreed
// across the UTC/SAST midnight window — which flipped PriorityCommandStrip between
// rendering and returning null (a structural hydration mismatch → crash). en-CA
// formats as YYYY-MM-DD.
export function sastToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date())
}

// `days` offset from SAST today, still YYYY-MM-DD. Uses UTC math on the fixed date
// string so the result is identical on server and client.
export function sastDatePlus(days: number): string {
  const d = new Date(`${sastToday()}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

export function getGreeting(): string {
  const h = sastHour()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getDaysUntil(date: string | Date): number {
  // Date-only strings ("2026-06-20") parse as UTC midnight, which is 02:00 SAST —
  // differencing on raw ms then truncating reports the day BEFORE an exam as "0 / today".
  // Parse date-only values as LOCAL midnight and compare whole calendar days instead.
  const target = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T00:00:00`)
    : new Date(date)
  return differenceInCalendarDays(target, new Date())
}

export function isOverdue(date: string | Date): boolean {
  return isPast(new Date(date)) && getDaysUntil(date) < 0
}

export function currentMonthRange() {
  const now = new Date()
  return {
    start: format(startOfMonth(now), 'yyyy-MM-dd'),
    end: format(endOfMonth(now), 'yyyy-MM-dd'),
  }
}

export function currentMonthYear(): string {
  return format(new Date(), 'yyyy-MM')
}

// ─── Task urgency ─────────────────────────────────────────────
export type TaskUrgency = 'overdue' | 'today' | 'urgent' | 'soon' | 'normal'

export function getTaskUrgency(dueDate: string | null): { urgency: TaskUrgency; label: string } {
  if (!dueDate) return { urgency: 'normal', label: '' }

  const days = getDaysUntil(dueDate)

  if (days < 0)      return { urgency: 'overdue', label: `Overdue by ${Math.abs(days)}d` }
  if (days === 0)    return { urgency: 'today',   label: 'Due today!' }
  if (days <= 2)     return { urgency: 'urgent',  label: `${days}d left` }
  if (days <= 7)     return { urgency: 'soon',    label: `${days}d left` }
  return               { urgency: 'normal',  label: fmt.dateShort(dueDate) }
}

// ─── Budget calculations ──────────────────────────────────────
export function calcTotalBudget(budget: {
  monthly_budget: number
  nsfas_enabled: boolean
  nsfas_living: number
  nsfas_accom: number
  nsfas_books: number
}): number {
  const nsfasTotal = budget.nsfas_enabled
    ? budget.nsfas_living + budget.nsfas_accom + budget.nsfas_books
    : 0
  return budget.monthly_budget + nsfasTotal
}

// ─── Load shedding (mock — integrate EskomSePush in prod) ─────
export interface LoadSheddingStatus {
  active: boolean
  stage: string
  time: string
}

export function getLoadSheddingStatus(): LoadSheddingStatus {
  const stages = ['No load shedding', 'Stage 2', 'Stage 4', 'No load shedding']
  const times  = ['', '10:00 – 12:30 & 22:00 – 00:30', '08:00 – 10:30 & 16:00 – 18:30', '']
  const idx = new Date().getDay() % 4
  return { stage: stages[idx], time: times[idx], active: idx > 0 }
}

// ─── CSV export ───────────────────────────────────────────────
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h]
        const str = val == null ? '' : String(val)
        return str.includes(',') ? `"${str}"` : str
      }).join(',')
    ),
  ]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

// ─── Nova usage limits ────────────────────────────────────────
export const NOVA_FREE_LIMIT    = 20   // hard block for free users (20/month)
export const NOVA_SCHOLAR_LIMIT = 150  // hard block for scholar users (150/month)

// Internal cost-protection cap for Nova Unlimited — never shown to users.
// At ~R0.04/message (blended Haiku/Sonnet), 1000 msgs ≈ R40 API cost vs R89 revenue = R49 gross margin.
// Most users never approach this; it protects against extreme edge cases.
const NOVA_UNLIMITED_INTERNAL_CAP = 1000

export const NOVA_LIMITS = {
  free:           20,
  scholar:        150,
  nova_unlimited: NOVA_UNLIMITED_INTERNAL_CAP,
} as const

export type NovaTier = keyof typeof NOVA_LIMITS

export function isAtNovaLimit(used: number, plan: NovaTier): boolean {
  if (plan === 'nova_unlimited') return used >= NOVA_UNLIMITED_INTERNAL_CAP
  const limit = NOVA_LIMITS[plan]
  return used >= limit
}

export function novaMessagesRemaining(used: number, plan: NovaTier): number | 'unlimited' {
  // Always return 'unlimited' to the UI for nova_unlimited — cap is internal
  if (plan === 'nova_unlimited') return 'unlimited'
  const limit = NOVA_LIMITS[plan]
  return Math.max(0, limit - used)
}

// ─── Pricing (ZAR) ───────────────────────────────────────────
export const NOVA_SCHOLAR_PRICE   = 29   // R29/month — ~79% gross margin on Nova API costs
export const NOVA_UNLIMITED_PRICE = 89   // R89/month — unlimited Nova (fair use up to 1 000 msgs)

// ─── Crisis keyword detection ─────────────────────────────────
const CRISIS_KEYWORDS = [
  'suicid', 'kill myself', 'end my life', "don't want to be here",
  "can't go on", 'harm myself', 'hurt myself', 'no reason to live',
  'want to die', 'ending it all',
]

export function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase()
  return CRISIS_KEYWORDS.some(kw => lower.includes(kw))
}

// ─── Unique ID (client-side fallback) ────────────────────────
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
