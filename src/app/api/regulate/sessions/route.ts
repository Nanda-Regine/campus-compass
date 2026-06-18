import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase
    .from('regulation_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  // Explicit allowlist prevents mass-assignment of privileged columns
  const b = body as Record<string, unknown>

  // Map technique/session_type → a valid session_type enum value.
  const VALID_SESSION_TYPES = [
    'box_breathing',
    'physiological_sigh',
    '478_breath',
    'somatic_shake',
    'vagal_toning',
    'eye_movement',
    'progressive_muscle',
  ]
  // Common aliases the client may send for technique → enum value.
  const TECHNIQUE_ALIASES: Record<string, string> = {
    box: 'box_breathing',
    box_breath: 'box_breathing',
    breathing: 'box_breathing',
    sigh: 'physiological_sigh',
    physiological_sigh: 'physiological_sigh',
    '478': '478_breath',
    '4_7_8': '478_breath',
    '478_breath': '478_breath',
    shake: 'somatic_shake',
    somatic: 'somatic_shake',
    somatic_shake: 'somatic_shake',
    vagal: 'vagal_toning',
    humming: 'vagal_toning',
    vagal_toning: 'vagal_toning',
    eye: 'eye_movement',
    emdr: 'eye_movement',
    eye_movement: 'eye_movement',
    pmr: 'progressive_muscle',
    progressive: 'progressive_muscle',
    progressive_muscle: 'progressive_muscle',
  }
  const rawType = String(b.session_type ?? b.technique ?? '').toLowerCase().trim()
  let session_type = 'box_breathing'
  if (VALID_SESSION_TYPES.includes(rawType)) {
    session_type = rawType
  } else if (TECHNIQUE_ALIASES[rawType]) {
    session_type = TECHNIQUE_ALIASES[rawType]
  }

  // duration_seconds is NOT NULL (int). Accept seconds directly, or convert a minutes field.
  let duration_seconds = 0
  if (typeof b.duration_seconds === 'number') {
    duration_seconds = Math.round(b.duration_seconds)
  } else if (typeof b.duration_minutes === 'number') {
    duration_seconds = Math.round(b.duration_minutes * 60)
  } else if (typeof b.duration === 'number') {
    duration_seconds = Math.round(b.duration * 60)
  }

  const completed = typeof b.completed === 'boolean' ? b.completed : true

  // Fold any mood / heart-rate data into the free-text notes column (no dedicated columns exist).
  const noteParts: string[] = []
  if (typeof b.notes === 'string' && b.notes.trim()) noteParts.push(b.notes.trim())
  if (b.mood_before != null) noteParts.push(`mood before: ${b.mood_before}`)
  if (b.mood_after != null) noteParts.push(`mood after: ${b.mood_after}`)
  if (b.heart_rate_before != null) noteParts.push(`HR before: ${b.heart_rate_before}`)
  if (b.heart_rate_after != null) noteParts.push(`HR after: ${b.heart_rate_after}`)
  const notes = noteParts.length > 0 ? noteParts.join(' · ') : null

  const { data, error } = await supabase
    .from('regulation_sessions')
    .insert({ session_type, duration_seconds, completed, notes, user_id: user.id })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
