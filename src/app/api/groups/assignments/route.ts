import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/groups/assignments — list all group assignments the user is part of
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Assignments created by user
    const { data: created } = await supabase
      .from('group_assignments')
      .select('*, group_members(id, user_id, email, display_name, role, status), group_tasks(id, title, done, assigned_to, assigned_to_email, due_date)')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    // Assignments user joined as member
    const { data: memberRows } = await supabase
      .from('group_members')
      .select('assignment_id')
      .eq('user_id', user.id)
      .eq('status', 'joined')

    const memberAssignmentIds = (memberRows || []).map(r => r.assignment_id)

    let joined: typeof created = []
    if (memberAssignmentIds.length > 0) {
      const { data } = await supabase
        .from('group_assignments')
        .select('*, group_members(id, user_id, email, display_name, role, status), group_tasks(id, title, done, assigned_to, assigned_to_email, due_date)')
        .in('id', memberAssignmentIds)
        .order('created_at', { ascending: false })
      joined = data || []
    }

    // Deduplicate (user might be both creator and member)
    const createdIds = new Set((created || []).map((a: { id: string }) => a.id))
    const allAssignments = [
      ...(created || []),
      ...(joined || []).filter((a: { id: string }) => !createdIds.has(a.id)),
    ]

    return NextResponse.json({ assignments: allAssignments })
  } catch (error) {
    console.error('Groups GET error:', error)
    return NextResponse.json({ error: 'Failed to load groups' }, { status: 500 })
  }
}

// POST /api/groups/assignments — create a new group assignment
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, subject, description, due_date } = await request.json()
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // Create the assignment
    const { data: assignment, error } = await supabase
      .from('group_assignments')
      .insert({ created_by: user.id, title: title.trim(), subject, description, due_date })
      .select()
      .single()

    if (error) {
      console.error('group_assignments insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Auto-add creator as leader
    const { error: memberError } = await supabase.from('group_members').insert({
      assignment_id: assignment.id,
      user_id: user.id,
      email: user.email || '',
      display_name: profile?.full_name || user.email || 'You',
      role: 'leader',
      status: 'joined',
      joined_at: new Date().toISOString(),
    })

    if (memberError) {
      console.error('group_members insert error:', memberError)
      // Assignment was created — still return it even if member insert failed
    }

    return NextResponse.json({ assignment })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to create group assignment'
    console.error('Groups POST error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// PATCH /api/groups/assignments — update status/title/due_date
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 })

    const allowed = ['title', 'subject', 'description', 'due_date', 'status']
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    )

    const { data, error } = await supabase
      .from('group_assignments')
      .update(safeUpdates)
      .eq('id', id)
      .eq('created_by', user.id) // only creator can update
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ assignment: data })
  } catch (error) {
    console.error('Groups PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}

// DELETE /api/groups/assignments — delete assignment (creator only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { error } = await supabase
      .from('group_assignments')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Groups DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
  }
}
