export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const VALID_ROLES = new Set(['Leader', 'Researcher', 'Writer', 'Designer', 'Presenter', 'Reviewer'])

async function isLeader(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  assignmentId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('group_assignments')
    .select('id')
    .eq('id', assignmentId)
    .eq('created_by', userId)
    .maybeSingle()
  return !!data
}

// PATCH /api/groups/members — update member_role (any joined member can do this)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { member_id, member_role } = await request.json()
    if (!member_id) return NextResponse.json({ error: 'member_id required' }, { status: 400 })
    if (member_role !== null && !VALID_ROLES.has(String(member_role)))
      return NextResponse.json({ error: 'invalid member_role' }, { status: 400 })

    // Verify caller is a joined member of the same assignment
    const { data: target } = await supabase
      .from('group_members')
      .select('assignment_id')
      .eq('id', member_id)
      .maybeSingle()
    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const { data: selfMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('assignment_id', target.assignment_id)
      .eq('user_id', user.id)
      .eq('status', 'joined')
      .maybeSingle()

    const isOwner = await isLeader(supabase, target.assignment_id, user.id)
    if (!selfMember && !isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabase
      .from('group_members')
      .update({ member_role: member_role ?? null })
      .eq('id', member_id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ member: data })
  } catch (error) {
    console.error('Group members PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}

// DELETE /api/groups/members?member_id=xxx — remove member (leader only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('member_id')
    if (!memberId) return NextResponse.json({ error: 'member_id required' }, { status: 400 })

    const { data: target } = await supabase
      .from('group_members')
      .select('assignment_id, user_id, role')
      .eq('id', memberId)
      .maybeSingle()
    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    // Only the assignment creator (leader) can remove members
    const leader = await isLeader(supabase, target.assignment_id, user.id)
    if (!leader) return NextResponse.json({ error: 'Only the group leader can remove members' }, { status: 403 })

    // Can't remove yourself (the leader)
    if (target.user_id === user.id)
      return NextResponse.json({ error: 'You cannot remove yourself as the leader' }, { status: 400 })

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('id', memberId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Group members DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
