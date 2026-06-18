import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json() as Record<string, unknown>
  // Explicit allowlist prevents mass-assignment of privileged columns.
  // Maps to the live safe_walk_sessions schema.
  const { destination, contact_name, contact_phone, duration_minutes, started_at, check_in_at } = body

  // NOT NULL columns
  const dest = String(destination ?? '').trim()
  const name = String(contact_name ?? '').trim()
  const phone = String(contact_phone ?? '').trim()
  const duration = Number(duration_minutes)
  if (!dest || !name || !phone || !isFinite(duration) || duration <= 0) {
    return NextResponse.json({ error: 'destination, contact_name, contact_phone and duration_minutes are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('safe_walk_sessions')
    .insert({
      user_id: user.id,
      destination: dest,
      contact_name: name,
      contact_phone: phone,
      duration_minutes: Math.round(duration),
      started_at: typeof started_at === 'string' && started_at ? started_at : new Date().toISOString(),
      check_in_at: typeof check_in_at === 'string' && check_in_at ? check_in_at : null,
      completed: false,
      alert_sent: false,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
