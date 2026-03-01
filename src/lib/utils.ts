// ============================================================
// Campus Compass — Utility Functions
// ============================================================
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistance, isPast, differenceInDays, startOfMonth, endOfMonth } from 'date-fns'

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
export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getDaysUntil(date: string | Date): number {
  return differenceInDays(new Date(date), new Date())
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

// ─── Nova free tier ───────────────────────────────────────────
export const NOVA_FREE_LIMIT = 10
export const NOVA_PREMIUM_PRICE = 49 // ZAR

// ─── PayFast signature ────────────────────────────────────────
export function generatePayFastSignature(data: Record<string, string>, passphrase?: string): string {
  // Sort and build query string
  const params = Object.entries(data)
    .filter(([, v]) => v !== '' && v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))

  let queryString = params.map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`).join('&')

  if (passphrase) {
    queryString += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`
  }

  // MD5 hash — use crypto on server side
  // This is a placeholder; actual hashing done server-side
  return queryString
}

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
