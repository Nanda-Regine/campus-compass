import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function makeSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

// GET /api/campus/library — zone occupancy + my active checkin
export async function GET() {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('university').eq('id', user.id).single()
  const institution = profile?.university ?? ''

  const [{ data: checkins }, { data: myCheckin }] = await Promise.all([
    supabase
      .from('library_checkins')
      .select('zone')
      .eq('institution', institution)
      .is('checked_out_at', null),
    supabase
      .from('library_checkins')
      .select('id, zone, checked_in_at')
      .eq('user_id', user.id)
      .is('checked_out_at', null)
      .maybeSingle(),
  ])

  const counts: Record<string, number> = {}
  for (const c of checkins ?? []) {
    counts[c.zone] = (counts[c.zone] ?? 0) + 1
  }

  return NextResponse.json({ counts, myCheckin: myCheckin ?? null, institution })
}

// POST /api/campus/library — check in to a zone
export async function POST(req: NextRequest) {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { zone } = await req.json()
  if (!zone?.trim()) return NextResponse.json({ error: 'zone required' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles').select('university').eq('id', user.id).single()
  const institution = profile?.university ?? 'Unknown'

  // Upsert: if user has an active checkin, update the zone; otherwise insert
  const { error } = await supabase
    .from('library_checkins')
    .upsert({
      user_id: user.id,
      institution,
      zone: zone.trim(),
      checked_in_at: new Date().toISOString(),
      checked_out_at: null,
    }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/campus/library — check out
export async function DELETE() {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase
    .from('library_checkins')
    .update({ checked_out_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('checked_out_at', null)

  return NextResponse.json({ ok: true })
}
