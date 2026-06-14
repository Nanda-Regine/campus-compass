export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET — list this student's guardian tokens
export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('guardian_access_tokens')
    .select('id, label, token, expires_at, created_at')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tokens: data ?? [] })
}

// POST — create a new guardian token
export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const label = typeof body?.label === 'string' ? body.label.slice(0, 50).trim() : 'Guardian'

  // Max 5 active guardian links per student
  const { count } = await supabase
    .from('guardian_access_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', user.id)
    .gt('expires_at', new Date().toISOString())

  if ((count ?? 0) >= 5) {
    return NextResponse.json({ error: 'Maximum 5 active guardian links allowed' }, { status: 429 })
  }

  const { data, error } = await supabase
    .from('guardian_access_tokens')
    .insert({ student_id: user.id, label: label || 'Guardian' })
    .select('id, label, token, expires_at, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ token: data })
}
