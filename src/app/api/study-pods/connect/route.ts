export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET — list connections for current user (pending + accepted)
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('study_pod_connections')
      .select(`
        id, requester_id, recipient_id, status, shared_modules, ai_blurb, created_at,
        requester:profiles!study_pod_connections_requester_id_fkey(full_name, avatar_url),
        recipient:profiles!study_pod_connections_recipient_id_fkey(full_name, avatar_url)
      `)
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ connections: data ?? [] })
  } catch (err) {
    console.error('[study-pods/connect GET]', err)
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
  }
}

// POST — send a connection request
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      recipient_id?: string
      shared_modules?: string[]
      match_score?: number
      ai_blurb?: string
    }

    const { recipient_id, shared_modules = [], match_score = 0, ai_blurb } = body
    if (!recipient_id) return NextResponse.json({ error: 'recipient_id required' }, { status: 400 })
    if (recipient_id === user.id) return NextResponse.json({ error: 'Cannot connect with yourself' }, { status: 400 })

    // Check not already connected
    const { data: existing } = await supabase
      .from('study_pod_connections')
      .select('id, status')
      .or(`and(requester_id.eq.${user.id},recipient_id.eq.${recipient_id}),and(requester_id.eq.${recipient_id},recipient_id.eq.${user.id})`)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: existing.status === 'declined' ? 'This student has declined a previous request.' : 'Connection already exists.' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('study_pod_connections')
      .insert({
        requester_id:   user.id,
        recipient_id,
        shared_modules,
        match_score,
        ai_blurb:       ai_blurb ?? null,
      })
      .select('id')
      .single()

    if (error) throw error
    return NextResponse.json({ sent: true, id: data.id })
  } catch (err) {
    console.error('[study-pods/connect POST]', err)
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
  }
}

// PATCH — accept or decline a request (recipient only)
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { id?: string; action?: 'accept' | 'decline' | 'cancel' }
    const { id, action } = body

    if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 })
    if (!['accept', 'decline', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'action must be accept, decline, or cancel' }, { status: 400 })
    }

    // Fetch the connection
    const { data: conn } = await supabase
      .from('study_pod_connections')
      .select('id, requester_id, recipient_id, status')
      .eq('id', id)
      .maybeSingle()

    if (!conn) return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    if (conn.status !== 'pending') return NextResponse.json({ error: 'Connection is no longer pending' }, { status: 409 })

    // Accept/decline → recipient only; cancel → requester only
    if (action === 'cancel' && conn.requester_id !== user.id) {
      return NextResponse.json({ error: 'Only the requester can cancel' }, { status: 403 })
    }
    if ((action === 'accept' || action === 'decline') && conn.recipient_id !== user.id) {
      return NextResponse.json({ error: 'Only the recipient can accept or decline' }, { status: 403 })
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined'
    const { error } = await supabase
      .from('study_pod_connections')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ updated: true, status: newStatus })
  } catch (err) {
    console.error('[study-pods/connect PATCH]', err)
    return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 })
  }
}
