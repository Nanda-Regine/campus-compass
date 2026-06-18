import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Live schema enums (Supabase CHECK constraints)
const INCIDENT_TYPES = ['protest', 'crime', 'unsafe_area', 'harassment', 'gbv', 'other'] as const
const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const

// Map free-text UI labels to the live incident_type enum; unknown → 'other'
function toIncidentType(raw: unknown): typeof INCIDENT_TYPES[number] {
  const v = String(raw ?? '').toLowerCase().trim()
  if ((INCIDENT_TYPES as readonly string[]).includes(v)) return v as typeof INCIDENT_TYPES[number]
  if (/gbv|gender|rape|sexual/.test(v)) return 'gbv'
  if (/harass|stalk/.test(v)) return 'harassment'
  if (/protest|march|riot/.test(v)) return 'protest'
  if (/theft|steal|rob|assault|crime|drug|mug/.test(v)) return 'crime'
  if (/unsafe|light|path|area|suspicious/.test(v)) return 'unsafe_area'
  return 'other'
}

function toSeverity(raw: unknown): typeof SEVERITIES[number] {
  const v = String(raw ?? '').toLowerCase().trim()
  return (SEVERITIES as readonly string[]).includes(v) ? (v as typeof SEVERITIES[number]) : 'medium'
}

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const institution = searchParams.get('institution')
  let query = supabase
    .from('safety_incidents')
    .select('id, reporter_id, institution, incident_type, severity, location_description, description, is_anonymous, is_resolved, upvotes, created_at')
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
  const { type, description, location, latitude, longitude, severity, institution, anonymous } = body

  // description is NOT NULL
  const desc = String(description ?? '').trim()
  if (!desc) return NextResponse.json({ error: 'description is required' }, { status: 400 })

  // institution is NOT NULL — fall back to a sentinel when the client omits it
  const inst = String(institution ?? '').trim() || 'unknown'

  // No latitude/longitude column — fold any coords / free-text location into
  // location_description so we don't lose the report's location entirely.
  const locText = String(location ?? '').trim()
  const coords = (latitude != null && longitude != null && isFinite(Number(latitude)) && isFinite(Number(longitude)))
    ? `${Number(latitude)},${Number(longitude)}`
    : ''
  const locationDescription =
    [locText, coords && `(${coords})`].filter(Boolean).join(' ') || 'Not specified'

  const { data, error } = await supabase
    .from('safety_incidents')
    .insert({
      reporter_id: user.id, // NOT NULL even for anonymous — owns the row for RLS/moderation
      institution: inst,
      incident_type: toIncidentType(type),
      severity: toSeverity(severity),
      location_description: locationDescription,
      description: desc,
      is_anonymous: Boolean(anonymous),
      is_resolved: false,
      upvotes: 0,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
