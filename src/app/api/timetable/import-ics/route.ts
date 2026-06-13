export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import ical, { type VEvent, type ParameterValue } from 'node-ical'

function str(val: ParameterValue | undefined): string {
  if (!val) return ''
  return typeof val === 'string' ? val : (val.val ?? '')
}

// ICS day abbreviation → our DB day_of_week (Mon=1 … Sun=7)
const ICS_DAY: Record<string, number> = {
  MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7,
}
const ICS_DAY_TEXT: Record<string, string> = {
  MO: 'Monday', TU: 'Tuesday', WE: 'Wednesday', TH: 'Thursday',
  FR: 'Friday', SA: 'Saturday', SU: 'Sunday',
}

// JS Date getDay() → our DB day_of_week (0=Sun → 7, 1=Mon → 1 …)
function jsDateToDayOfWeek(d: Date): number {
  const js = d.getDay() // 0=Sun
  return js === 0 ? 7 : js
}
function jsDateToDayText(d: Date): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()]
}

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function detectExamKeyword(summary: string): boolean {
  return /\b(exam|test|assessment|quiz|submission|deadline|due date|final|mid.?year|supplementary)\b/i.test(summary)
}

function detectExamType(summary: string): string {
  if (/\bfinal\b/i.test(summary))           return 'final'
  if (/\bmid.?year\b/i.test(summary))       return 'mid_year'
  if (/\b(test|quiz)\b/i.test(summary))     return 'test'
  if (/\bsupplementary\b/i.test(summary))   return 'supplementary'
  if (/\b(deadline|submission|due)\b/i.test(summary)) return 'assignment_deadline'
  return 'test'
}

function detectSlotType(summary: string): string {
  if (/\btutorial\b/i.test(summary))  return 'tutorial'
  if (/\b(practical|lab)\b/i.test(summary)) return 'practical'
  return 'lecture'
}

interface SlotRow {
  day_of_week: number
  day_of_week_text: string
  start_time: string
  end_time: string
  venue: string | null
  slot_type: string
  is_recurring: boolean
  summary: string
}

interface ExamRow {
  exam_name: string
  exam_date: string
  start_time: string
  venue: string | null
  duration_minutes: number | null
  exam_type: string
  notes: string | null
}

interface ParseResult {
  slots: SlotRow[]
  exams: ExamRow[]
  skipped: number
}

function parseICS(icsText: string): ParseResult {
  const events = ical.sync.parseICS(icsText)
  const slots: SlotRow[]  = []
  const exams: ExamRow[]  = []
  let skipped = 0

  for (const key of Object.keys(events)) {
    const raw = events[key]
    if (!raw || raw.type !== 'VEVENT') continue
    const ev = raw as VEvent

    const summary  = str(ev.summary).trim()
    const location = str(ev.location) || null
    const start    = ev.start
    const end      = ev.end

    if (!start) { skipped++; continue }

    const isExam = detectExamKeyword(summary)

    if (isExam) {
      const durationMs = end ? end.getTime() - start.getTime() : null
      exams.push({
        exam_name:        summary || 'Exam',
        exam_date:        start.toISOString(),
        start_time:       hhmm(start),
        venue:            location,
        duration_minutes: durationMs ? Math.round(durationMs / 60000) : null,
        exam_type:        detectExamType(summary),
        notes:            str(ev.description) || null,
      })
      continue
    }

    // Recurring via RRULE — extract BYDAY (node-ical exposes as byweekday)
    const byweekday = ev.rrule?.options?.byweekday
    const bydays: string[] = Array.isArray(byweekday)
      ? (byweekday as Array<string | number>).map(String)
      : []

    if (bydays.length > 0) {
      for (const byday of bydays) {
        // byday may look like "MO" or "+1MO" — extract 2-letter code
        const match = byday.match(/([A-Z]{2})$/)
        if (!match) continue
        const code = match[1]
        if (!ICS_DAY[code]) continue
        slots.push({
          day_of_week:      ICS_DAY[code],
          day_of_week_text: ICS_DAY_TEXT[code],
          start_time:       hhmm(start),
          end_time:         end ? hhmm(end) : hhmm(start),
          venue:            location,
          slot_type:        detectSlotType(summary),
          is_recurring:     true,
          summary,
        })
      }
    } else {
      // Single (non-recurring) event → treat as one-off timetable slot
      slots.push({
        day_of_week:      jsDateToDayOfWeek(start),
        day_of_week_text: jsDateToDayText(start),
        start_time:       hhmm(start),
        end_time:         end ? hhmm(end) : hhmm(start),
        venue:            location,
        slot_type:        detectSlotType(summary),
        is_recurring:     false,
        summary,
      })
    }
  }

  return { slots, exams, skipped }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { url?: string; icsText?: string; confirm?: boolean }
    const { url, icsText: rawText, confirm = false } = body

    if (!url && !rawText) {
      return NextResponse.json({ error: 'Provide a url or icsText' }, { status: 400 })
    }

    let icsText = rawText ?? ''
    if (url) {
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
      icsText = await fetchRes.text()
    }

    if (!icsText.includes('BEGIN:VCALENDAR')) {
      return NextResponse.json({ error: 'Not a valid ICS calendar file' }, { status: 400 })
    }

    const parsed = parseICS(icsText)

    // Preview mode — return counts without writing
    if (!confirm) {
      return NextResponse.json({
        preview: true,
        slotCount: parsed.slots.length,
        examCount: parsed.exams.length,
        skipped:   parsed.skipped,
        sampleSlots: parsed.slots.slice(0, 3),
        sampleExams: parsed.exams.slice(0, 3),
      })
    }

    // Confirm mode — upsert to DB
    let slotsCreated = 0
    let examsCreated = 0

    if (parsed.slots.length > 0) {
      const { error } = await supabase.from('timetable_slots').insert(
        parsed.slots.map(s => ({
          user_id:          user.id,
          module_id:        null,
          day_of_week:      s.day_of_week,
          day_of_week_text: s.day_of_week_text,
          start_time:       s.start_time,
          end_time:         s.end_time,
          venue:            s.venue,
          slot_type:        s.slot_type,
          is_recurring:     s.is_recurring,
        }))
      )
      if (!error) slotsCreated = parsed.slots.length
    }

    if (parsed.exams.length > 0) {
      const { error } = await supabase.from('exams').insert(
        parsed.exams.map(e => ({
          user_id:          user.id,
          module_id:        null,
          exam_name:        e.exam_name,
          exam_date:        e.exam_date,
          start_time:       e.start_time,
          venue:            e.venue,
          duration_minutes: e.duration_minutes,
          exam_type:        e.exam_type,
          notes:            e.notes,
        }))
      )
      if (!error) examsCreated = parsed.exams.length
    }

    return NextResponse.json({
      imported: true,
      slotsCreated,
      examsCreated,
      skipped: parsed.skipped,
    })
  } catch (err) {
    console.error('[timetable/import-ics]', err)
    return NextResponse.json({ error: 'Failed to parse calendar. Make sure the URL points to a valid .ics file.' }, { status: 500 })
  }
}
