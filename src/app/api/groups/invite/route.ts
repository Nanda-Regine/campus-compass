import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// POST /api/groups/invite — create an invite token for an assignment
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { assignment_id, email } = await request.json()
    if (!assignment_id) return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 })

    // Only creator can create invites
    const { data: assignment } = await supabase
      .from('group_assignments')
      .select('id, title')
      .eq('id', assignment_id)
      .eq('created_by', user.id)
      .single()

    if (!assignment) return NextResponse.json({ error: 'Assignment not found or not authorised' }, { status: 404 })

    // Check for existing active invite
    const { data: existing } = await supabase
      .from('group_invites')
      .select('token, expires_at')
      .eq('assignment_id', assignment_id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existing) {
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/groups/join?token=${existing.token}`
      return NextResponse.json({ token: existing.token, inviteUrl, reused: true })
    }

    // Create new invite
    const { data: invite, error } = await supabase
      .from('group_invites')
      .insert({
        assignment_id,
        email: email || null,
        created_by: user.id,
      })
      .select('token')
      .single()

    if (error) throw error

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/groups/join?token=${invite.token}`
    return NextResponse.json({ token: invite.token, inviteUrl })
  } catch (error) {
    console.error('Invite POST error:', error)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}

// GET /api/groups/invite?token=xxx — look up invite details (before accepting)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    // Use service role to read invite (user might not be logged in yet)
    const serviceSupabase = createServiceRoleClient()

    const { data: invite } = await serviceSupabase
      .from('group_invites')
      .select('assignment_id, expires_at, accepted_at, group_assignments(title, subject, due_date, created_by, profiles!group_assignments_created_by_fkey(full_name))')
      .eq('token', token)
      .single()

    if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    if (invite.accepted_at) return NextResponse.json({ error: 'Invite already used' }, { status: 410 })
    if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'Invite expired' }, { status: 410 })

    return NextResponse.json({ invite })
  } catch (error) {
    console.error('Invite GET error:', error)
    return NextResponse.json({ error: 'Failed to look up invite' }, { status: 500 })
  }
}

// PATCH /api/groups/invite — accept an invite (must be authenticated)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { token } = await request.json()
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const serviceSupabase = createServiceRoleClient()
    const result = await serviceSupabase.rpc('accept_group_invite', {
      p_token: token,
      p_user_id: user.id,
      p_email: user.email || '',
      p_name: profile?.full_name || user.email || 'Student',
    })

    if (result.error) throw result.error

    const data = result.data as { ok?: boolean; error?: string; assignment_id?: string; assignment_title?: string; already_member?: boolean }
    if (data?.error) return NextResponse.json({ error: data.error }, { status: 400 })

    return NextResponse.json({ success: true, assignment_id: data?.assignment_id, assignment_title: data?.assignment_title ?? null })
  } catch (error) {
    console.error('Invite PATCH error:', error)
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 })
  }
}
