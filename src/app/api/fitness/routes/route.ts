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
    .select('id, contributor_id, institution, route_name, description, distance_km, duration_minutes, safety_rating, scenery_rating, times_logged, start_point, end_point, created_at')
    .order('times_logged', { ascending: false })
    .limit(50)
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
  // Explicit allowlist prevents mass-assignment of privileged columns (times_logged, contributor_id, etc.)
  const b = body as Record<string, unknown>

  const route_name = typeof b.route_name === 'string' ? b.route_name.trim() : ''
  const description = typeof b.description === 'string' ? b.description : ''
  const institution = typeof b.institution === 'string' ? b.institution : ''
  const distance_km = typeof b.distance_km === 'number' && !Number.isNaN(b.distance_km) ? b.distance_km : 0
  const duration_minutes =
    typeof b.duration_minutes === 'number' && !Number.isNaN(b.duration_minutes)
      ? Math.round(b.duration_minutes)
      : 0
  const clampRating = (v: unknown): number => {
    if (typeof v !== 'number' || Number.isNaN(v)) return 3
    return Math.min(5, Math.max(1, Math.round(v)))
  }
  const safety_rating = clampRating(b.safety_rating)
  const scenery_rating = clampRating(b.scenery_rating)
  // start_point / end_point are NOT NULL — default to the route name if the form omits them.
  const start_point =
    typeof b.start_point === 'string' && b.start_point.trim() ? b.start_point.trim() : route_name
  const end_point =
    typeof b.end_point === 'string' && b.end_point.trim() ? b.end_point.trim() : route_name

  const { data, error } = await supabase
    .from('walking_routes')
    .insert({
      contributor_id: user.id,
      institution,
      route_name,
      description,
      distance_km,
      duration_minutes,
      safety_rating,
      scenery_rating,
      start_point,
      end_point,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
