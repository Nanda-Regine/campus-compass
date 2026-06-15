import { NextRequest, NextResponse } from 'next/server'
import { notifyUser } from '@/lib/push-notify'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/tutors/sessions — my sessions as student or tutor
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = new URL(req.url).searchParams.get('role') ?? 'student'
  const field = role === 'tutor' ? 'tutor_id' : 'student_id'

  const { data: sessions, error } = await supabase
    .from('tutoring_sessions')
    .select(`
      id, tutor_id, student_id, subject, scheduled_date, duration_hours,
      rate_per_hour, total_amount, payment_method, status, notes, created_at,
      tutor_profiles!tutoring_sessions_tutor_id_fkey(rate_per_hour, subjects),
      tutor:profiles!tutoring_sessions_tutor_id_fkey(name, emoji),
      student:profiles!tutoring_sessions_student_id_fkey(name, emoji)
    `)
    .eq(field, user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Check which completed sessions this user has already reviewed
  const completedIds = (sessions ?? [])
    .filter((s: Record<string, unknown>) => s.status === 'completed')
    .map((s: Record<string, unknown>) => s.id as string)

  const { data: myReviews } = completedIds.length
    ? await supabase.from('tutor_reviews').select('session_id').eq('reviewer_id', user.id).in('session_id', completedIds)
    : { data: [] }
  const reviewedSet = new Set((myReviews ?? []).map((r: { session_id: string }) => r.session_id))

  const result = (sessions ?? []).map((s: Record<string, unknown>) => ({
    ...s,
    tutor_profiles: undefined,
    tutor_name:    (s.tutor as { name: string; emoji: string } | null)?.name  ?? 'Tutor',
    tutor_emoji:   (s.tutor as { name: string; emoji: string } | null)?.emoji ?? '🎓',
    student_name:  (s.student as { name: string; emoji: string } | null)?.name  ?? 'Student',
    student_emoji: (s.student as { name: string; emoji: string } | null)?.emoji ?? '🎓',
    tutor:   undefined,
    student: undefined,
    already_reviewed: reviewedSet.has(s.id as string),
  }))

  return NextResponse.json({ sessions: result })
}

// PATCH /api/tutors/sessions — tutor confirms/completes/cancels
export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { session_id, status } = await req.json()
  if (!session_id || !['confirmed', 'completed', 'cancelled'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data: session } = await supabase
    .from('tutoring_sessions')
    .select('tutor_id, student_id, subject, status')
    .eq('id', session_id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.tutor_id !== user.id && session.student_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('tutoring_sessions')
    .update({ status })
    .eq('id', session_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const adminSupa = createAdminSupabaseClient()
  const notifyId = status === 'confirmed' ? session.student_id : session.student_id

  const messages: Record<string, { title: string; body: string }> = {
    confirmed:  { title: '✅ Session confirmed!', body: `Your tutoring session for ${session.subject} has been confirmed.` },
    completed:  { title: '🎉 Session completed!', body: `Great work! Rate your tutor for ${session.subject}.` },
    cancelled:  { title: '❌ Session cancelled', body: `Your tutoring session for ${session.subject} was cancelled.` },
  }

  if (messages[status]) {
    await notifyUser(adminSupa, notifyId, {
      ...messages[status],
      url: '/tutoring?tab=sessions',
      tag: `tutoring-${status}-${session_id}`,
    })
  }

  return NextResponse.json({ ok: true })
}
