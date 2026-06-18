import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// POST /api/broadcasts/[id]/read — mark a broadcast as read
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid broadcast id' }, { status: 400 })
  }

  // Verify the broadcast exists and belongs to the user's university
  const { data: profile } = await supabase
    .from('profiles')
    .select('university')
    .eq('id', user.id)
    .maybeSingle()

  const university = profile?.university ?? ''

  const { data: broadcast, error: broadcastError } = await supabase
    .from('institution_broadcasts')
    .select('id, university')
    .eq('id', id)
    .maybeSingle()

  if (broadcastError) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  if (!broadcast) return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })
  if (broadcast.university !== university) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('broadcast_reads')
    .upsert(
      { broadcast_id: id, user_id: user.id },
      { onConflict: 'broadcast_id,user_id' }
    )

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
