export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// GET /api/wellbeing/journal?limit=20
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = Math.min(50, parseInt(new URL(request.url).searchParams.get('limit') ?? '20'))

  const { data, error } = await supabase
    .from('wellbeing_journal')
    .select('id,entry_text,mood_score,ai_reflection,entry_date,created_at')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entries: data || [] })
}

// POST /api/wellbeing/journal
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { entry_text, mood_score, ai_reflection, entry_date } = await request.json()

  if (!entry_text?.trim() || entry_text.trim().length < 5)
    return NextResponse.json({ error: 'entry_text required (min 5 chars)' }, { status: 400 })

  const { data, error } = await supabase
    .from('wellbeing_journal')
    .insert({
      user_id:       user.id,
      entry_text:    String(entry_text).slice(0, 5000),
      mood_score:    mood_score ? Math.max(1, Math.min(5, Number(mood_score))) : null,
      ai_reflection: ai_reflection ? String(ai_reflection).slice(0, 600) : null,
      entry_date:    entry_date ?? new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data }, { status: 201 })
}

// DELETE /api/wellbeing/journal?id=xxx
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('wellbeing_journal')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
