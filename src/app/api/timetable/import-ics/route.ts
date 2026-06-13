export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import ical, { type VEvent, type ParameterValue } from 'node-ical'

const MAX_ICS_BYTES = 2_000_000  // 2 MB
const BATCH_SIZE    = 200

// ─── Helpers ──────────────────────────────────────────────────────────────────

function str(val: ParameterValue | undefined | null): string {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'object' && 'val' in val && typeof val.val === 'string') return val.val
  return String(val)
}

// Always express times in SAST (UTC+2) regardless of server timezone.
function hhmmSAST(d: Date): string {
  return d.toLocaleTimeString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).substring(0, 5)  // "HH:MM"
}

// Check whether node-ical marked this as a date-only (all-day) event.
// node-ical attaches a non-enumerable `datetype` or `dateOnly` property.
function isAllDay(d: Date): boolean {
  const ext = d as Date & { datetype?: string; dateOnly?: boolean }
  return ext.datetype === 'date' || ext.dateOnly === true
}

// ─── SSRF guard ───────────────────────────────────────────────────────────────

function assertPublicUrl(raw: string): URL {
  let parsed: URL
  try { parsed = new URL(raw) } catch { throw new Error('Invalid URL') }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http/https URLs are allowed')
  }
  const h = parsed.hostname.toLowerCase()
  if (
    h === 'localhost' || h === '[::1]' ||
    /^127\./.test(h) || /^0\.0\.0\./.test(h) ||
    /^10\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^169\.254\./.test(h) ||
    /^fc00:/i.test(h) || /^fe80:/i.test(h)
  ) {
    throw new Error('Cannot fetch from private or loopback addresses')
  }
  return parsed
}

// ─── Day mappings ─────────────────────────────────────────────────────────────

// node-ical byweekday may be: string 'MO', prefixed '+1MO', or rrule integer (0=Mon…6=Sun)
// Our DB: Mon=1 … Sat=6, Sun=7
const STR_TO_DB: Record<string, number> = {
  MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7,
}
const STR_TO_TEXT: Record<string, string> = {
  MO: 'Monday', TU: 'Tuesday', WE: 'Wednesday', TH: 'Thursday',
  FR: 'Friday', SA: 'Saturday', SU: 'Sunday',
}
// rrule integers: 0=Mon … 6=Sun  →  DB 1-7
const RRULE_INT_TO_DB   = [1, 2, 3, 4, 5, 6, 7]
const RRULE_INT_TO_TEXT = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

function byDayToDB(raw: string | number): { db: number; text: string } | null {
  if (typeof raw === 'number') {
    if (raw < 0 || raw > 6) return null
    return { db: RRULE_INT_TO_DB[raw], text: RRULE_INT_TO_TEXT[raw] }
  }
  // String: 'MO', '+1MO', '-1SU', etc.
  const s = String(raw)
  const match = s.match(/([A-Z]{2})$/)
  if (!match || !STR_TO_DB[match[1]]) return null
  return { db: STR_TO_DB[match[1]], text: STR_TO_TEXT[match[1]] }
}

function jsDateToDB(d: Date): { db: number; text: string } {
  const js = d.getDay() // 0=Sun
  return js === 0
    ? { db: 7, text: 'Sunday' }
    : { db: js, text: RRULE_INT_TO_TEXT[js - 1] }
}

// ─── Detection ────────────────────────────────────────────────────────────────

function isExamEvent(summary: string): boolean {
  return /\b(exam|test|assessment|quiz|submission|deadline|due date|final|mid.?year|supplementary|assignment)\b/i.test(summary)
}

function examType(summary: string): string {
  if (/\bfinal\b/i.test(summary))              return 'final'
  if (/\bmid.?year\b/i.test(summary))          return 'mid_year'
  if (/\b(test|quiz)\b/i.test(summary))        return 'test'
  if (/\bsupplementary\b/i.test(summary))      return 'supplementary'
  if (/\b(deadline|submission|due|assignment)\b/i.test(summary)) return 'assignment_deadline'
  return 'test'
}

function slotType(summary: string): string {
  if (/\btutorial\b/i.test(summary))       return 'tutorial'
  if (/\b(practical|lab)\b/i.test(summary)) return 'practical'
  return 'lecture'
}

// ─── Row types ────────────────────────────────────────────────────────────────

interface SlotRow {
  user_id: string; module_id: null; day_of_week: number; day_of_week_text: string
  start_time: string; end_time: string; venue: string | null
  slot_type: string; is_recurring: boolean
}

interface ExamRow {
  user_id: string; module_id: null; exam_name: string; exam_date: string
  start_time: string; venue: string | null; duration_minutes: number | null
  exam_type: string; notes: string | null
}

interface ParseResult { slots: SlotRow[]; exams: ExamRow[]; skipped: number }

// ─── Parser ───────────────────────────────────────────────────────────────────

function parseICS(icsText: string, userId: string): ParseResult {
  const events = ical.sync.parseICS(icsText)
  const slots: SlotRow[] = []
  const exams: ExamRow[] = []
  let skipped = 0

  for (const key of Object.keys(events)) {
    const raw = events[key]
    if (!raw || raw.type !== 'VEVENT') continue
    const ev = raw as VEvent

    const summary  = str(ev.summary).trim()
    const location = str(ev.location).trim() || null
    const start    = ev.start
    const end      = ev.end

    if (!start) { skipped++; continue }

    // Skip all-day events for timetable slots (but allow for exam deadlines)
    const allDay = isAllDay(start)

    if (isExamEvent(summary)) {
      const durationMs = (!allDay && end) ? end.getTime() - start.getTime() : null
      exams.push({
        user_id:          userId,
        module_id:        null,
        exam_name:        summary || 'Exam',
        exam_date:        start.toISOString(),
        start_time:       allDay ? '08:00' : hhmmSAST(start),
        venue:            location,
        duration_minutes: durationMs && durationMs > 0 ? Math.round(durationMs / 60000) : null,
        exam_type:        examType(summary),
        notes:            str(ev.description).trim() || null,
      })
      continue
    }

    // Skip all-day non-exam events — no meaningful time to store
    if (allDay) { skipped++; continue }

    // Validate sensible time range
    const startTime = hhmmSAST(start)
    const endTime   = end && end > start ? hhmmSAST(end) : startTime
    const startH    = parseInt(startTime, 10)
    if (startH < 5 || startH > 23) { skipped++; continue } // skip midnight/pre-dawn noise

    // Recurring event via RRULE
    const byweekday = ev.rrule?.options?.byweekday
    const rawDays   = Array.isArray(byweekday) ? byweekday as Array<string | number> : []

    if (rawDays.length > 0) {
      for (const raw of rawDays) {
        const day = byDayToDB(raw)
        if (!day) continue
        slots.push({
          user_id: userId, module_id: null,
          day_of_week: day.db, day_of_week_text: day.text,
          start_time: startTime, end_time: endTime,
          venue: location, slot_type: slotType(summary), is_recurring: true,
        })
      }
    } else {
      const day = jsDateToDB(start)
      slots.push({
        user_id: userId, module_id: null,
        day_of_week: day.db, day_of_week_text: day.text,
        start_time: startTime, end_time: endTime,
        venue: location, slot_type: slotType(summary), is_recurring: false,
      })
    }
  }

  return { slots, exams, skipped }
}

// ─── Batch insert helper ──────────────────────────────────────────────────────

async function batchInsert<T extends object>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  table: string,
  rows: T[],
): Promise<{ count: number; error: string | null }> {
  let count = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from(table).insert(chunk)
    if (error) return { count, error: error.message }
    count += chunk.length
  }
  return { count, error: null }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Size guard on raw body
    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_ICS_BYTES + 200) {
      return NextResponse.json({ error: 'Request body too large (max 2 MB)' }, { status: 413 })
    }

    const body = await req.json() as { url?: string; icsText?: string; confirm?: boolean }
    const { url, icsText: rawText, confirm = false } = body

    if (!url && !rawText) {
      return NextResponse.json({ error: 'Provide a url or icsText' }, { status: 400 })
    }

    let icsText = rawText ?? ''

    if (url) {
      // SSRF guard
      try { assertPublicUrl(url) } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 400 })
      }

      const fetchRes = await fetch(url, {
        headers: { 'User-Agent': 'VarsityOS/1.0 (timetable-import)' },
        signal: AbortSignal.timeout(10_000),
      })
      if (!fetchRes.ok) {
        return NextResponse.json(
          { error: `Could not fetch calendar — server returned ${fetchRes.status}` },
          { status: 400 }
        )
      }

      // Guard remote file size via Content-Length before downloading
      const cl = fetchRes.headers.get('content-length')
      if (cl && parseInt(cl) > MAX_ICS_BYTES) {
        return NextResponse.json({ error: 'Calendar file too large (max 2 MB)' }, { status: 413 })
      }

      // Stream with size cap
      const reader = fetchRes.body?.getReader()
      if (!reader) {
        return NextResponse.json({ error: 'Empty response from calendar server' }, { status: 400 })
      }
      const chunks: Uint8Array[] = []
      let totalBytes = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        totalBytes += value?.length ?? 0
        if (totalBytes > MAX_ICS_BYTES) {
          await reader.cancel()
          return NextResponse.json({ error: 'Calendar file too large (max 2 MB)' }, { status: 413 })
        }
        if (value) chunks.push(value)
      }
      icsText = new TextDecoder().decode(
        chunks.reduce((a, b) => { const c = new Uint8Array(a.length + b.length); c.set(a); c.set(b, a.length); return c }, new Uint8Array(0))
      )
    }

    // Guard pasted/uploaded ICS size
    if (icsText.length > MAX_ICS_BYTES) {
      return NextResponse.json({ error: 'Calendar text too large (max 2 MB)' }, { status: 413 })
    }

    if (!icsText.includes('BEGIN:VCALENDAR')) {
      return NextResponse.json({ error: 'Not a valid ICS calendar file' }, { status: 400 })
    }

    const parsed = parseICS(icsText, user.id)

    // Preview mode — return counts + samples, nothing written
    if (!confirm) {
      return NextResponse.json({
        preview:     true,
        slotCount:   parsed.slots.length,
        examCount:   parsed.exams.length,
        skipped:     parsed.skipped,
        sampleSlots: parsed.slots.slice(0, 3),
        sampleExams: parsed.exams.slice(0, 3),
      })
    }

    // Confirm — batch upsert both tables
    const errors: string[] = []
    let slotsCreated = 0
    let examsCreated = 0

    if (parsed.slots.length > 0) {
      const r = await batchInsert(supabase, 'timetable_slots', parsed.slots)
      slotsCreated = r.count
      if (r.error) errors.push(`Timetable slots: ${r.error}`)
    }

    if (parsed.exams.length > 0) {
      const r = await batchInsert(supabase, 'exams', parsed.exams)
      examsCreated = r.count
      if (r.error) errors.push(`Exams: ${r.error}`)
    }

    if (errors.length > 0 && slotsCreated === 0 && examsCreated === 0) {
      return NextResponse.json({ error: errors.join('; ') }, { status: 500 })
    }

    return NextResponse.json({
      imported: true,
      slotsCreated,
      examsCreated,
      skipped: parsed.skipped,
      warnings: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('[timetable/import-ics]', err)
    return NextResponse.json(
      { error: 'Failed to parse calendar. Make sure the URL points to a valid .ics file.' },
      { status: 500 }
    )
  }
}
