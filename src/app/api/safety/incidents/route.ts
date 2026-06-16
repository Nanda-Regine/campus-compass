import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const institution = searchParams.get('institution')
  let query = supabase
    .from('safety_incidents')
    .select('id, type, title, description, location, latitude, longitude, severity, institution, created_at, reporter_id')
    .order('created_at', { ascending: false })
    .limit(30)
  if (institution) query = query.eq('institution', institution)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json() as Record<string, unknown>
  const { type, title, description, location, latitude, longitude, severity, institution, anonymous } = body
  // lat/lng are optional — validate only when provided
  let lat: number | null = null
  let lng: number | null = null
  if (latitude !== undefined && latitude !== null) {
    const v = Number(latitude)
    if (!isFinite(v) || v < -90 || v > 90) return NextResponse.json({ error: 'Invalid latitude' }, { status: 400 })
    lat = v
  }
  if (longitude !== undefined && longitude !== null) {
    const v = Number(longitude)
    if (!isFinite(v) || v < -180 || v > 180) return NextResponse.json({ error: 'Invalid longitude' }, { status: 400 })
    lng = v
  }
  const { data, error } = await supabase
    .from('safety_incidents')
    .insert({ type, title: title ?? type, description, location, latitude: lat, longitude: lng, severity, institution, reporter_id: anonymous ? null : user.id })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
