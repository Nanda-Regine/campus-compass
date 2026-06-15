import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// POST /api/notes/save — toggle save/unsave a note
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { note_id } = await req.json()
  if (!note_id) return NextResponse.json({ error: 'note_id required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('note_saves')
    .select('id')
    .eq('user_id', user.id)
    .eq('note_id', note_id)
    .maybeSingle()

  if (existing) {
    await supabase.from('note_saves').delete().eq('id', existing.id)
    return NextResponse.json({ saved: false })
  }

  await supabase.from('note_saves').insert({ user_id: user.id, note_id })
  return NextResponse.json({ saved: true })
}
