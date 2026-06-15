import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  // Explicit allowlist prevents mass-assignment of privileged columns
  const { destination, estimated_arrival, check_in_interval, emergency_contact, institution, start_location } = body as Record<string, unknown>
  const { data, error } = await supabase
    .from('safe_walk_sessions')
    .insert({ destination, estimated_arrival, check_in_interval, emergency_contact, institution, start_location, user_id: user.id })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
