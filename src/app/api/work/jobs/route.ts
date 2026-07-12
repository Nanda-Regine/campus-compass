import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const ALLOWED_JOB_FIELDS = [
  'employer_name', 'job_type', 'role_title', 'location',
  'is_on_campus', 'is_remote', 'pay_type', 'pay_rate',
  'contracted_hours_per_week', 'max_comfortable_hours',
  'start_date', 'end_date', 'notes', 'is_active',
  'status', 'block_exam_periods',
  'contact_name', 'contact_email', 'contact_phone',
]

function pickAllowed(body: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(body).filter(([k]) => ALLOWED_JOB_FIELDS.includes(k))
  )
}

// Reject negative / non-finite / absurd numeric values — the allowlist stopped
// mass-assignment but did no range checks, so `pay_rate: -50` or `999999999`
// persisted and skewed every earnings/affordability calculation downstream.
const NUMERIC_BOUNDS: Record<string, number> = {
  pay_rate: 1_000_000,
  contracted_hours_per_week: 168,
  max_comfortable_hours: 168,
}
function validateNumerics(fields: Record<string, unknown>): string | null {
  for (const [k, max] of Object.entries(NUMERIC_BOUNDS)) {
    const v = fields[k]
    if (v === undefined || v === null || v === '') continue
    const n = Number(v)
    if (!Number.isFinite(n) || n < 0 || n > max) return `${k} must be between 0 and ${max}`
  }
  return null
}

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('part_time_jobs')
    .select('*')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ jobs: data })
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const safeFields = pickAllowed(body as Record<string, unknown>)

  if (!safeFields.employer_name) {
    return NextResponse.json({ error: 'employer_name is required' }, { status: 400 })
  }
  const numErr = validateNumerics(safeFields)
  if (numErr) return NextResponse.json({ error: numErr }, { status: 400 })

  const { data, error } = await supabase
    .from('part_time_jobs')
    .insert({ ...safeFields, student_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ job: data })
}

export async function PATCH(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id } = body as { id?: string }
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const safeUpdates = pickAllowed(body as Record<string, unknown>)
  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }
  const numErr = validateNumerics(safeUpdates)
  if (numErr) return NextResponse.json({ error: numErr }, { status: 400 })

  const { data, error } = await supabase
    .from('part_time_jobs')
    .update(safeUpdates)
    .eq('id', id)
    .eq('student_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ job: data })
}

export async function DELETE(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase
    .from('part_time_jobs')
    .delete()
    .eq('id', id)
    .eq('student_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
