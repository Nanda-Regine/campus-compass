export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const VALID_STATUS = new Set(['researching','drafting','submitted','interview','accepted','rejected','waitlisted'])

// GET /api/bursary/applications
export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('bursary_applications')
    .select('id,bursary_name,organization,amount_rands,deadline,status,docs_checklist,notes,result_date,created_at,updated_at')
    .eq('user_id', user.id)
    .order('deadline', { ascending: true, nullsFirst: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ applications: data || [] })
}

// POST /api/bursary/applications
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bursary_name, organization, amount_rands, deadline, status, docs_checklist, notes } = await request.json()

  if (!bursary_name?.trim())
    return NextResponse.json({ error: 'bursary_name required' }, { status: 400 })

  const { data, error } = await supabase
    .from('bursary_applications')
    .insert({
      user_id:        user.id,
      bursary_name:   String(bursary_name).slice(0, 120),
      organization:   organization   ? String(organization).slice(0, 100)   : null,
      amount_rands:   amount_rands   ? Math.max(0, Math.min(Number(amount_rands), 10_000_000)) : null,
      deadline:       deadline       ? String(deadline)                      : null,
      status:         VALID_STATUS.has(String(status)) ? String(status)      : 'researching',
      docs_checklist: Array.isArray(docs_checklist) ? docs_checklist        : [],
      notes:          notes          ? String(notes).slice(0, 1000)         : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ application: data }, { status: 201 })
}

// PATCH /api/bursary/applications?id=xxx
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
  if (body.docs_checklist !== undefined && Array.isArray(body.docs_checklist))
    updates.docs_checklist = body.docs_checklist
  if (body.notes      !== undefined) updates.notes        = body.notes ? String(body.notes).slice(0, 1000) : null
  if (body.deadline   !== undefined) updates.deadline     = body.deadline ? String(body.deadline) : null
  if (body.result_date !== undefined) updates.result_date = body.result_date ? String(body.result_date) : null
  if (body.amount_rands !== undefined) updates.amount_rands = body.amount_rands ? Math.max(0, Number(body.amount_rands)) : null

  const { data, error } = await supabase
    .from('bursary_applications')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ application: data })
}

// DELETE /api/bursary/applications?id=xxx
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('bursary_applications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
