import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const assignmentId = searchParams.get('assignment_id')
  if (!assignmentId) return NextResponse.json({ error: 'assignment_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('group_messages')
    .select('id, assignment_id, user_id, content, is_decision, is_pinned, created_at')
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as Record<string, unknown>
  const { assignment_id, content, is_decision } = body
  if (!assignment_id || typeof assignment_id !== 'string') return NextResponse.json({ error: 'assignment_id required' }, { status: 400 })
  if (!content || typeof content !== 'string' || !content.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const { data, error } = await supabase
    .from('group_messages')
    .insert({
      assignment_id,
      user_id: user.id,
      content: content.trim().slice(0, 2000),
      is_decision: typeof is_decision === 'boolean' ? is_decision : false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update member's last_active_at
  await supabase
    .from('group_members')
    .update({ last_active_at: new Date().toISOString() })
    .eq('assignment_id', assignment_id)
    .eq('user_id', user.id)

  return NextResponse.json({ message: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('group_messages')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
