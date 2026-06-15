import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { session_id, rating, comment } = await req.json()
  if (!session_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'session_id and rating (1-5) required' }, { status: 400 })
  }

  const { data: session } = await supabase
    .from('tutoring_sessions')
    .select('tutor_id, student_id, status')
    .eq('id', session_id)
    .single()

  if (!session || session.student_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (session.status !== 'completed') {
    return NextResponse.json({ error: 'Can only review completed sessions' }, { status: 400 })
  }

  const { error } = await supabase.from('tutor_reviews').insert({
    session_id, tutor_id: session.tutor_id, reviewer_id: user.id,
    rating, comment: comment?.trim().slice(0, 500) ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
