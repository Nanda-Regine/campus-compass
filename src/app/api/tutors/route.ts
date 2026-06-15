import { NextRequest, NextResponse } from 'next/server'
import arcjet, { tokenBucket } from '@arcjet/next'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [tokenBucket({ mode: 'LIVE', refillRate: 20, interval: 60, capacity: 40 })],
})

// GET /api/tutors — list available tutors
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const subject = searchParams.get('subject')
  const institution = searchParams.get('institution')

  let query = supabase
    .from('tutor_profiles')
    .select(`
      id, user_id, bio, subjects, institution, faculty, year_of_study,
      rate_per_hour, availability, is_available, session_count, average_rating,
      is_verified, is_verified_pending,
      profiles!inner(name, emoji)
    `)
    .eq('is_available', true)
    .order('average_rating', { ascending: false, nullsFirst: false })
    .limit(40)

  if (institution) query = query.eq('institution', institution)
  if (subject) query = query.contains('subjects', [subject])

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Check if current user is already a tutor
  const { data: myProfile } = await supabase
    .from('tutor_profiles')
    .select('id, subjects, rate_per_hour, bio, availability, is_available, is_verified, is_verified_pending')
    .eq('user_id', user.id)
    .maybeSingle()

  const tutors = (data ?? []).map((t: Record<string, unknown>) => {
    const profile = t.profiles as { name: string; emoji: string } | null
    return { ...t, profiles: undefined, name: profile?.name ?? 'Tutor', emoji: profile?.emoji ?? '🎓' }
  })

  return NextResponse.json({ tutors, myTutorProfile: myProfile ?? null })
}

// POST /api/tutors — become a tutor (create or update profile)
export async function POST(req: NextRequest) {
  const decision = await aj.protect(req, { requested: 2 })
  if (decision.isDenied()) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { bio, subjects, rate_per_hour, availability, is_available } = body

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return NextResponse.json({ error: 'At least one subject required' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('university, faculty, year_of_study')
    .eq('id', user.id)
    .single()

  const payload = {
    user_id: user.id,
    bio: bio?.trim().slice(0, 400) ?? null,
    subjects: subjects.slice(0, 15),
    rate_per_hour: Math.max(20, Math.min(500, Number(rate_per_hour) || 50)),
    availability: availability?.trim().slice(0, 200) ?? null,
    is_available: is_available !== false,
    institution: profile?.university ?? null,
    faculty: profile?.faculty ?? null,
    year_of_study: profile?.year_of_study ?? null,
  }

  const { data, error } = await supabase
    .from('tutor_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tutor: data }, { status: 201 })
}
