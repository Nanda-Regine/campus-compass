import { describe, it, expect } from 'vitest'
import {
  fmt,
  sastHour,
  sastToday,
  sastDatePlus,
  getDaysUntil,
  isOverdue,
  getTaskUrgency,
  calcTotalBudget,
} from './utils'

// A local (not SAST) YYYY-MM-DD offset — getDaysUntil parses date-only strings
// as LOCAL midnight, so tests must build target dates in the same frame.
const localDatePlus = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toLocaleDateString('en-CA')

describe('fmt', () => {
  it('currency keeps 2 decimals and groups thousands (separator-agnostic)', () => {
    expect(fmt.currency(1234.5).startsWith('R')).toBe(true)
    expect(fmt.currency(1234.5).replace(/\D/g, '')).toBe('123450')
    expect(fmt.currency(0).replace(/\D/g, '')).toBe('000') // R0.00
  })
  it('currencyShort drops decimals and never loses digits at scale', () => {
    expect(fmt.currencyShort(1_000_000).replace(/\D/g, '')).toBe('1000000')
    expect(fmt.currencyShort(48_500).startsWith('R')).toBe(true)
  })
  it('pct clamps to 0..100 and guards divide-by-zero', () => {
    expect(fmt.pct(50, 200)).toBe(25)
    expect(fmt.pct(250, 200)).toBe(100)
    expect(fmt.pct(5, 0)).toBe(0)
    expect(fmt.pct(0, 200)).toBe(0)
  })
  it('time renders 24h → 12h with AM/PM', () => {
    expect(fmt.time('14:30')).toBe('2:30 PM')
    expect(fmt.time('09:05')).toBe('9:05 AM')
    expect(fmt.time('12:00')).toBe('12:00 PM')
    expect(fmt.time('23:45')).toBe('11:45 PM')
  })
})

describe('SAST helpers', () => {
  it('sastToday is a YYYY-MM-DD string', () => {
    expect(sastToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('sastHour is an integer in 0..23', () => {
    const h = sastHour()
    expect(Number.isInteger(h)).toBe(true)
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThanOrEqual(23)
  })
  it('sastDatePlus(0) equals sastToday and steps exactly one day', () => {
    expect(sastDatePlus(0)).toBe(sastToday())
    const d0 = new Date(`${sastDatePlus(0)}T00:00:00Z`).getTime()
    const d1 = new Date(`${sastDatePlus(1)}T00:00:00Z`).getTime()
    const dm1 = new Date(`${sastDatePlus(-1)}T00:00:00Z`).getTime()
    expect(d1 - d0).toBe(86_400_000)
    expect(d0 - dm1).toBe(86_400_000)
  })
})

describe('getDaysUntil / isOverdue', () => {
  it('counts whole calendar days, 0 for today', () => {
    expect(getDaysUntil(localDatePlus(0))).toBe(0)
    expect(getDaysUntil(localDatePlus(1))).toBe(1)
    expect(getDaysUntil(localDatePlus(7))).toBe(7)
    expect(getDaysUntil(localDatePlus(-1))).toBe(-1)
  })
  it('isOverdue is true only for past dates', () => {
    expect(isOverdue(localDatePlus(-2))).toBe(true)
    expect(isOverdue(localDatePlus(2))).toBe(false)
  })
})

describe('getTaskUrgency', () => {
  it('classifies by days remaining', () => {
    expect(getTaskUrgency(null).urgency).toBe('normal')
    expect(getTaskUrgency(localDatePlus(-1)).urgency).toBe('overdue')
    expect(getTaskUrgency(localDatePlus(0)).urgency).toBe('today')
    expect(getTaskUrgency(localDatePlus(1)).urgency).toBe('urgent')
    expect(getTaskUrgency(localDatePlus(5)).urgency).toBe('soon')
    expect(getTaskUrgency(localDatePlus(30)).urgency).toBe('normal')
  })
})

describe('calcTotalBudget', () => {
  const base = { monthly_budget: 1000, nsfas_living: 500, nsfas_accom: 300, nsfas_books: 200 }
  it('adds the NSFAS components when enabled', () => {
    expect(calcTotalBudget({ ...base, nsfas_enabled: true })).toBe(2000)
  })
  it('ignores NSFAS components when disabled', () => {
    expect(calcTotalBudget({ ...base, nsfas_enabled: false })).toBe(1000)
  })
})
