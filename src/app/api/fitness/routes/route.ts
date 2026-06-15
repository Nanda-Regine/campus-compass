import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const institution = searchParams.get('institution')
  let query = supabase
    .from('walking_routes')
    .select('id, name, description, distance_km, duration_mins, difficulty, institution, waypoints, times_logged, created_at')
    .order('times_logged', { ascending: false })
  if (institution) query = query.eq('institution', institution)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  // Explicit allowlist prevents mass-assignment of privileged columns (times_logged, etc.)
  const { name, description, distance_km, duration_mins, difficulty, institution, waypoints } = body as Record<string, unknown>
  const { data, error } = await supabase
    .from('walking_routes')
    .insert({ name, description, distance_km, duration_mins, difficulty, institution, waypoints, contributor_id: user.id })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
