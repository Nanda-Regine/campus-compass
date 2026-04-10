import { type WorkConflict } from '@/types'

// ─── Time helpers ─────────────────────────────────────────────

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function timesOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && endA > startB
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

// ─── Balance score ────────────────────────────────────────────

export interface WeekData {
  work_hours: number
  study_hours: number
  lecture_hours: number
  commute_hours?: number
}

export interface BalanceResult {
  score: number
  flag: 'healthy' | 'watch' | 'overloaded' | 'crisis'
}

export function calculateBalanceScore(week: WeekData): BalanceResult {
  const TOTAL_HOURS = 168
  const { work_hours, study_hours, lecture_hours, commute_hours = 5 } = week
  const sleepEstimate = TOTAL_HOURS - work_hours - study_hours - lecture_hours - commute_hours

  let score = 100

  if (sleepEstimate < 42) score -= 20   // < 6 hrs/night average
  if (sleepEstimate < 35) score -= 20   // < 5 hrs/night — serious
  if (work_hours > 25)    score -= 25
  else if (work_hours > 20) score -= 10
  if (study_hours + lecture_hours < 15) score -= 20

  const finalScore = Math.max(0, score)

  const flag: BalanceResult['flag'] =
    finalScore >= 70 ? 'healthy'
    : finalScore >= 50 ? 'watch'
    : finalScore >= 30 ? 'overloaded'
    : 'crisis'

  return { score: finalScore, flag }
}

// ─── Conflict detection ───────────────────────────────────────

interface ShiftInput {
  shift_date: string   // YYYY-MM-DD
  start_time: string   // HH:MM
  end_time: string     // HH:MM
  duration_hours?: number
}

interface TimetableEntry {
  day_of_week_text: string
  start_time: string
  end_time: string | null
  module?: { module_name: string } | null
}

interface TaskEntry {
  due_date: string | null
  title: string
}

interface ExamEntry {
  exam_date: string
  exam_name: string
}

export function detectShiftConflicts(
  shift: ShiftInput,
  timetable: TimetableEntry[],
  tasks: TaskEntry[],
  exams: ExamEntry[],
  currentWeekWorkHours: number,
): WorkConflict[] {
  const conflicts: WorkConflict[] = []
  const shiftDate = new Date(shift.shift_date)
  const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][shiftDate.getDay()]
  const shiftStart = parseTime(shift.start_time)
  const shiftEnd   = parseTime(shift.end_time)
  const shiftHours = (shiftEnd - shiftStart) / 60

  // 1. Check timetable overlaps on shift day
  const dayLectures = timetable.filter(t => t.day_of_week_text === dayName)
  for (const lecture of dayLectures) {
    if (!lecture.end_time) continue
    const lectureStart = parseTime(lecture.start_time)
    const lectureEnd   = parseTime(lecture.end_time)
    if (timesOverlap(shiftStart, shiftEnd, lectureStart, lectureEnd)) {
      conflicts.push({
        type: 'lecture',
        severity: 'high',
        detail: `${lecture.module?.module_name ?? 'Class'} ${lecture.start_time}–${lecture.end_time}`,
        suggestion: 'Consider swapping this shift — missing lectures compounds quickly.',
      })
    }
  }

  // 2. Check assignments due within 24 hrs after shift ends
  const shiftDateStr = shift.shift_date
  const dayAfterStr  = toDateStr(addDays(shiftDate, 1))
  const nearbyTasks  = tasks.filter(t => t.due_date && t.due_date >= shiftDateStr && t.due_date <= dayAfterStr)
  for (const task of nearbyTasks) {
    conflicts.push({
      type: 'assignment_due',
      severity: 'medium',
      detail: `"${task.title}" is due ${task.due_date}`,
      suggestion: 'Finish the work before your shift, or block time the next morning.',
    })
  }

  // 3. Check if shift is within 3 days before an exam
  const threeDaysAfterStr = toDateStr(addDays(shiftDate, 3))
  const nearbyExams = exams.filter(e => e.exam_date > shiftDateStr && e.exam_date <= threeDaysAfterStr)
  for (const exam of nearbyExams) {
    conflicts.push({
      type: 'exam_proximity',
      severity: 'critical',
      detail: `${exam.exam_name} exam on ${exam.exam_date}`,
      suggestion: 'This is exam week. Consider requesting the shift off entirely.',
    })
  }

  // 4. Check weekly hours overload
  const newTotal = currentWeekWorkHours + shiftHours
  if (newTotal > 25) {
    conflicts.push({
      type: 'hours_overload',
      severity: 'high',
      detail: `This shift takes your week to ${newTotal.toFixed(1)} hours`,
      suggestion: 'Students working > 25 hrs/week show significant grade drops on average.',
    })
  }

  return conflicts
}

