import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const VALID_STATUS = ['on_campus', 'library', 'studying', 'free_to_meet', 'in_class', 'gym'] as const
type Status = typeof VALID_STATUS[number]

// GET /api/presence — who's around now at my university (+ my own current presence)
export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('university').eq('id', user.id).maybeSingle()
  const university = profile?.university ?? null

  const nowIso = new Date().toISOString()

  // RLS already scopes reads to my university; the filters below add expiry + exclude self.
  const { data: rows, error } = await supabase
    .from('campus_presence')
    .select('user_id, status, spot, note, expires_at, updated_at')
    .gt('expires_at', nowIso)
    .order('updated_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const all = rows ?? []
  const mine = all.find(r => r.user_id === user.id) ?? null
  const others = all.filter(r => r.user_id !== user.id)

  // Names/emojis via the safe public_profiles view (no private fields exposed).
  let people: Record<string, { display_name: string | null; emoji: string | null }> = {}
  if (others.length > 0) {
    const { data: profs } = await supabase
      .from('public_profiles')
      .select('id, display_name, emoji')
      .in('id', others.map(r => r.user_id))
    people = Object.fromEntries((profs ?? []).map(p => [p.id, { display_name: p.display_name, emoji: p.emoji }]))
  }

  const around = others.map(r => ({
    status: r.status,
    spot: r.spot,
    note: r.note,
    expires_at: r.expires_at,
    name: people[r.user_id]?.display_name ?? 'A student',
    emoji: people[r.user_id]?.emoji ?? '🧑‍🎓',
  }))

  return NextResponse.json({ university, mine, around })
}

// POST /api/presence — set my status (auto-expiring)
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const status = String(body.status ?? '')
  if (!(VALID_STATUS as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  const spot = body.spot ? String(body.spot).trim().slice(0, 80) : null
  const note = body.note ? String(body.note).trim().slice(0, 140) : null
  const durRaw = Number(body.durationHours)
  const durationHours = Number.isFinite(durRaw) ? Math.min(8, Math.max(1, durRaw)) : 2
  const expires_at = new Date(Date.now() + durationHours * 3_600_000).toISOString()

  const { data: profile } = await supabase
    .from('profiles').select('university').eq('id', user.id).maybeSingle()

  const { error } = await supabase.from('campus_presence').upsert({
    user_id:    user.id,
    university: profile?.university ?? null,
    status:     status as Status,
    spot, note, expires_at,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, expires_at })
}

// DELETE /api/presence — clear my status (I've left / gone quiet)
export async function DELETE() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('campus_presence').delete().eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
