export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const VALID_STATUS = new Set([
  'saved', 'applied', 'phone_screen', 'interview', 'assessment', 'offer',
  'accepted', 'rejected', 'withdrawn',
])

const VALID_TYPE = new Set([
  'parttime', 'vacation', 'grad', 'learnership', 'remote', 'internship', 'fulltime', 'other',
])

// GET /api/career/applications
export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('job_applications')
    .select('id,job_title,company,job_type,status,location,salary_range,deadline,applied_date,interview_at,notes,url,created_at,updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(150)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ applications: data || [] })
}

// POST /api/career/applications
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { job_title, company, job_type, status, location, salary_range, deadline, applied_date, interview_at, notes, url } = await request.json()

  if (!job_title?.trim()) return NextResponse.json({ error: 'job_title required' }, { status: 400 })
  if (!company?.trim())   return NextResponse.json({ error: 'company required' }, { status: 400 })

  const { data, error } = await supabase
    .from('job_applications')
    .insert({
      user_id:      user.id,
      job_title:    String(job_title).slice(0, 120),
      company:      String(company).slice(0, 100),
      job_type:     VALID_TYPE.has(String(job_type)) ? String(job_type) : 'other',
      status:       VALID_STATUS.has(String(status)) ? String(status) : 'saved',
      location:     location     ? String(location).slice(0, 100)     : null,
      salary_range: salary_range ? String(salary_range).slice(0, 60)  : null,
      deadline:     deadline     ? String(deadline)                    : null,
      applied_date: applied_date ? String(applied_date)                : null,
      interview_at: interview_at ? String(interview_at)                : null,
      notes:        notes        ? String(notes).slice(0, 1000)        : null,
      url:          url          ? String(url).slice(0, 500)           : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ application: data }, { status: 201 })
}

// PATCH /api/career/applications?id=xxx
export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await request.json()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.status !== undefined) {
    if (!VALID_STATUS.has(String(body.status)))
      return NextResponse.json({ error: 'invalid status' }, { status: 400 })
    updates.status = String(body.status)
  }
  if (body.job_type     !== undefined) updates.job_type     = VALID_TYPE.has(String(body.job_type)) ? String(body.job_type) : 'other'
  if (body.notes        !== undefined) updates.notes        = body.notes ? String(body.notes).slice(0, 1000) : null
  if (body.deadline     !== undefined) updates.deadline     = body.deadline ? String(body.deadline) : null
  if (body.applied_date !== undefined) updates.applied_date = body.applied_date ? String(body.applied_date) : null
  if (body.interview_at !== undefined) updates.interview_at = body.interview_at ? String(body.interview_at) : null
  if (body.salary_range !== undefined) updates.salary_range = body.salary_range ? String(body.salary_range).slice(0, 60) : null
  if (body.url          !== undefined) updates.url          = body.url ? String(body.url).slice(0, 500) : null

  const { data, error } = await supabase
    .from('job_applications')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ application: data })
}

// DELETE /api/career/applications?id=xxx
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('job_applications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
