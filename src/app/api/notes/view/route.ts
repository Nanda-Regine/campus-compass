import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// POST /api/notes/view — increment view_count for a note
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { note_id } = await req.json()
  if (!note_id) return NextResponse.json({ error: 'note_id required' }, { status: 400 })

  await supabase.rpc('increment_note_view', { p_note_id: note_id })

  return NextResponse.json({ ok: true })
}
