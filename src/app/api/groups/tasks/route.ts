import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// Helper: verify user is a member or creator of the assignment that owns a task
async function verifyTaskAccess(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  taskId: string,
  userId: string,
): Promise<boolean> {
  const { data: task } = await supabase
    .from('group_tasks')
    .select('assignment_id')
    .eq('id', taskId)
    .single()

  if (!task) return false

  const [{ data: member }, { data: creator }] = await Promise.all([
    supabase.from('group_members').select('id').eq('assignment_id', task.assignment_id).eq('user_id', userId).single(),
    supabase.from('group_assignments').select('id').eq('id', task.assignment_id).eq('created_by', userId).single(),
  ])

  return !!(member || creator)
}

// POST /api/groups/tasks — create a group task
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { assignment_id, title, notes, due_date, assigned_to, assigned_to_email } = await request.json()
    if (!assignment_id || !title?.trim()) {
      return NextResponse.json({ error: 'Assignment ID and title required' }, { status: 400 })
    }

    // Verify user is a member of this assignment
    const { data: member } = await supabase
      .from('group_members')
      .select('id')
      .eq('assignment_id', assignment_id)
      .eq('user_id', user.id)
      .single()

    const { data: creator } = await supabase
      .from('group_assignments')
      .select('id')
      .eq('id', assignment_id)
      .eq('created_by', user.id)
      .single()

    if (!member && !creator) {
      return NextResponse.json({ error: 'Not a member of this assignment' }, { status: 403 })
    }

    const { data: task, error } = await supabase
      .from('group_tasks')
      .insert({
        assignment_id,
        title: title.trim(),
        notes,
        due_date,
        assigned_to: assigned_to || null,
        assigned_to_email: assigned_to_email || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ task })
  } catch (error) {
    console.error('Group task POST error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

// PATCH /api/groups/tasks — update (toggle done, reassign)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'Task ID required' }, { status: 400 })

    // Verify membership before modifying
    const hasAccess = await verifyTaskAccess(supabase, id, user.id)
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const allowed = ['done', 'title', 'notes', 'due_date', 'assigned_to', 'assigned_to_email']
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    )

    const { data, error } = await supabase
      .from('group_tasks')
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ task: data })
  } catch (error) {
    console.error('Group task PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// DELETE /api/groups/tasks — delete task (creator or assignment owner only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    // Only task creator or assignment owner can delete
    const { data: task } = await supabase
      .from('group_tasks')
      .select('assignment_id, created_by')
      .eq('id', id)
      .single()

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const { data: assignmentOwner } = await supabase
      .from('group_assignments')
      .select('id')
      .eq('id', task.assignment_id)
      .eq('created_by', user.id)
      .single()

    if (task.created_by !== user.id && !assignmentOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('group_tasks')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Group task DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
