import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/study-twins — return matched students (same uni + faculty, opted in)
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabase
    .from('profiles')
    .select('university, faculty, year_of_study')
    .eq('id', user.id)
    .single()

  if (!me?.university) return NextResponse.json({ twins: [] })

  const { data: twins } = await supabase
    .from('profiles')
    .select('id, name, emoji, university, faculty, year_of_study, whatsapp_number')
    .eq('university', me.university)
    .eq('study_twin_opt_in', true)
    .neq('id', user.id)
    .limit(20)

  return NextResponse.json({ twins: twins ?? [], myFaculty: me.faculty })
}

// PATCH /api/study-twins — toggle opt-in and/or set WhatsApp number
export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}

  if (typeof body.opt_in === 'boolean') updates.study_twin_opt_in = body.opt_in
  if (typeof body.whatsapp_number === 'string') {
    const num = body.whatsapp_number.trim().replace(/\s+/g, '')
    updates.whatsapp_number = num.length > 0 ? num.slice(0, 20) : null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
