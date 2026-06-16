export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

async function isMember(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  assignmentId: string,
  userId: string,
): Promise<boolean> {
  const [{ data: member }, { data: owner }] = await Promise.all([
    supabase.from('group_members').select('id').eq('assignment_id', assignmentId).eq('user_id', userId).eq('status', 'joined').maybeSingle(),
    supabase.from('group_assignments').select('id').eq('id', assignmentId).eq('created_by', userId).maybeSingle(),
  ])
  return !!(member || owner)
}

// GET /api/groups/meetings?assignment_id=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const assignmentId = new URL(request.url).searchParams.get('assignment_id')
    if (!assignmentId) return NextResponse.json({ error: 'assignment_id required' }, { status: 400 })

    if (!(await isMember(supabase, assignmentId, user.id)))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabase
      .from('group_meetings')
      .select('id, created_by, title, meeting_at, duration_min, location, link, agenda, created_at')
      .eq('assignment_id', assignmentId)
      .order('meeting_at', { ascending: true })
      .limit(20)

    if (error) throw error
    return NextResponse.json({ meetings: data || [] })
  } catch (error) {
    console.error('Group meetings GET error:', error)
    return NextResponse.json({ error: 'Failed to load meetings' }, { status: 500 })
  }
}

// POST /api/groups/meetings
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { assignment_id, title, meeting_at, duration_min, location, link, agenda } = await request.json()
    if (!assignment_id || !title?.trim() || !meeting_at)
      return NextResponse.json({ error: 'assignment_id, title and meeting_at required' }, { status: 400 })

    if (!(await isMember(supabase, assignment_id, user.id)))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabase
      .from('group_meetings')
      .insert({
        assignment_id,
        created_by: user.id,
        title: String(title).slice(0, 120),
        meeting_at,
        duration_min: typeof duration_min === 'number' ? Math.min(480, Math.max(15, duration_min)) : 60,
        location: typeof location === 'string' ? location.slice(0, 200) : null,
        link: typeof link === 'string' ? link.slice(0, 500) : null,
        agenda: typeof agenda === 'string' ? agenda.slice(0, 1000) : null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ meeting: data })
  } catch (error) {
    console.error('Group meetings POST error:', error)
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 })
  }
}

// DELETE /api/groups/meetings?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Creator or assignment owner can delete
    const { error } = await supabase
      .from('group_meetings')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Group meetings DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 })
  }
}
