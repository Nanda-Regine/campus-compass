import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Required migration (run once in Supabase SQL editor):
// ALTER TABLE community_notes ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
// CREATE INDEX IF NOT EXISTS community_notes_view_count_idx ON community_notes(view_count DESC);

function makeSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

// POST /api/notes/view — increment view_count for a note
export async function POST(req: NextRequest) {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { note_id } = await req.json()
  if (!note_id) return NextResponse.json({ error: 'note_id required' }, { status: 400 })

  await supabase.rpc('increment_note_view', { p_note_id: note_id })

  return NextResponse.json({ ok: true })
}
