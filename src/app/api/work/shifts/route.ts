import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { detectShiftConflicts } from '@/lib/workSchedule/conflictDetector'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') // YYYY-MM-DD
  const to   = searchParams.get('to')   // YYYY-MM-DD

  let query = supabase
    .from('work_shifts')
    .select('*, job:part_time_jobs(*)')
    .eq('student_id', user.id)
    .order('shift_date', { ascending: true })

  if (from) query = query.gte('shift_date', from)
  if (to)   query = query.lte('shift_date', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ shifts: data })
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { job_id, shift_date, start_time, end_time, status = 'scheduled', notes } = body

  // Fetch job to calculate earnings
  const { data: job } = await supabase
    .from('part_time_jobs')
    .select('pay_rate, pay_type')
    .eq('id', job_id)
    .single()

  // Calculate duration and earnings
  const [sh, sm] = start_time.split(':').map(Number)
  const [eh, em] = end_time.split(':').map(Number)
  const duration_hours = Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 100) / 100

  let earnings: number | null = null
  if (job?.pay_rate && job.pay_type === 'hourly') {
    earnings = Math.round(duration_hours * job.pay_rate * 100) / 100
  } else if (job?.pay_rate && job.pay_type === 'shift') {
    earnings = job.pay_rate
  }

  // Run conflict detection
  const [timetableRes, tasksRes, examsRes, weekShiftsRes] = await Promise.all([
    supabase.from('timetable_slots').select('day_of_week_text,start_time,end_time,module:modules(module_name)').eq('user_id', user.id),
    supabase.from('tasks').select('due_date,title').eq('user_id', user.id).neq('status', 'done'),
    supabase.from('exams').select('exam_date,exam_name').eq('user_id', user.id).gte('exam_date', shift_date),
    supabase.from('work_shifts').select('duration_hours').eq('student_id', user.id)
      .gte('shift_date', getWeekStart(shift_date))
      .lte('shift_date', getWeekEnd(shift_date)),
  ])

  const weekHours = (weekShiftsRes.data ?? []).reduce((s: number, sh: { duration_hours: number }) => s + (sh.duration_hours ?? 0), 0)

  const timetableEntries = (timetableRes.data ?? []).map(t => ({
    ...t,
    module: Array.isArray(t.module) ? (t.module[0] ?? null) : (t.module ?? null),
  }))

  const conflicts = detectShiftConflicts(
    { shift_date, start_time, end_time },
    timetableEntries,
    tasksRes.data ?? [],
    examsRes.data ?? [],
    weekHours,
  )

  const hasConflict   = conflicts.length > 0
  const conflictType  = conflicts[0]?.type ?? null
  const conflictDetail = conflicts[0]?.detail ?? null

  const { data, error } = await supabase
    .from('work_shifts')
    .insert({
      job_id,
      student_id: user.id,
      shift_date,
      start_time,
      end_time,
      duration_hours,
      status,
      notes: notes || null,
      earnings,
      has_study_conflict: hasConflict,
      conflict_type: conflictType,
      conflict_detail: conflictDetail,
    })
    .select('*, job:part_time_jobs(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ shift: data, conflicts })
}

export async function PATCH(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id } = body as { id?: string }
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Whitelist — never allow student_id, earnings, conflict fields to be overwritten by client
  const ALLOWED = ['status', 'notes', 'shift_date', 'start_time', 'end_time']
  const safeUpdates = Object.fromEntries(
    Object.entries(body as Record<string, unknown>).filter(([k]) => ALLOWED.includes(k))
  )
  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('work_shifts')
    .update(safeUpdates)
    .eq('id', id)
    .eq('student_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ shift: data })
}

export async function DELETE(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const { error } = await supabase
    .from('work_shifts')
    .delete()
    .eq('id', id)
    .eq('student_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// ─── Helpers ─────────────────────────────────────────────────

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function getWeekEnd(dateStr: string): string {
  const start = new Date(getWeekStart(dateStr))
  start.setDate(start.getDate() + 6)
  return start.toISOString().split('T')[0]
}
