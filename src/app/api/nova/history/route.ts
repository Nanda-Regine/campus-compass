export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/nova/history               → list user's past conversations
// GET /api/nova/history?id=<uuid>     → load a specific conversation's messages
// DELETE /api/nova/history?id=<uuid>  → delete a conversation

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (id) {
    // Load single conversation
    const { data, error } = await supabase
      .from('nova_conversations')
      .select('id, title, messages, conversation_type, crisis_detected, started_at, updated_at, message_count')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const row = data as Record<string, unknown>
    const msgs = (row.messages as Array<{ role: string; content: string; timestamp?: string }>) ?? []
    return NextResponse.json({
      id: row.id,
      title: row.title,
      conversation_type: row.conversation_type,
      crisis_detected: row.crisis_detected,
      started_at: row.started_at,
      updated_at: row.updated_at,
      messages: msgs.map((m, i) => ({
        id: `hist-${i}`,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp ?? row.started_at,
      })),
    })
  }

  // List all conversations — 50 most recent, messages excluded for speed
  const { data, error } = await supabase
    .from('nova_conversations')
    .select('id, title, conversation_type, crisis_detected, started_at, updated_at, message_count')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ conversations: data ?? [] })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('nova_conversations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
