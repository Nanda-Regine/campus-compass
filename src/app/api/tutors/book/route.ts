import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notifyUser } from '@/lib/push-notify'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

function makeSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

// POST /api/tutors/book — student books a session
export async function POST(req: NextRequest) {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { tutor_id, subject, scheduled_date, duration_hours, payment_method, notes } = body

  if (!tutor_id || !subject) {
    return NextResponse.json({ error: 'tutor_id and subject required' }, { status: 400 })
  }

  const { data: tutor } = await supabase
    .from('tutor_profiles')
    .select('rate_per_hour, is_available, user_id')
    .eq('user_id', tutor_id)
    .single()

  if (!tutor?.is_available) {
    return NextResponse.json({ error: 'Tutor is not currently available' }, { status: 409 })
  }

  const hours = Math.max(0.5, Math.min(4, Number(duration_hours) || 1))
  const total = Number(tutor.rate_per_hour) * hours

  const { data: session, error } = await supabase
    .from('tutoring_sessions')
    .insert({
      tutor_id,
      student_id: user.id,
      subject: subject.trim().slice(0, 100),
      scheduled_date: scheduled_date ?? null,
      duration_hours: hours,
      rate_per_hour: tutor.rate_per_hour,
      total_amount: total,
      payment_method: payment_method ?? 'in_person',
      notes: notes?.trim().slice(0, 500) ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify tutor via push
  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('name, emoji')
    .eq('id', user.id)
    .single()

  const studentName = (studentProfile as { name: string; emoji: string } | null)?.name ?? 'A student'
  const adminSupa = createAdminSupabaseClient()

  await notifyUser(adminSupa, tutor_id, {
    title: '📚 New tutoring request!',
    body: `${studentName} wants tutoring for ${subject}. Tap to respond.`,
    url: '/tutoring?tab=sessions',
    tag: `tutoring-request-${session.id}`,
  })

  return NextResponse.json({ session }, { status: 201 })
}
