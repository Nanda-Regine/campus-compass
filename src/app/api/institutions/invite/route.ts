export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/institutions/invite?token=xxx  — resolve a token (public, for join page)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from('institution_invites')
    .select('id, institution_id, domain_lock, uses_limit, uses_count, expires_at, institutions(id, name, short_name, domain, logo_url)')
    .eq('token', token)
    .maybeSingle()

  if (error || !data) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })

  const expired = data.expires_at && new Date(data.expires_at) < new Date()
  const full    = data.uses_limit != null && data.uses_count >= data.uses_limit
  if (expired) return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 })
  if (full)    return NextResponse.json({ error: 'This invite link has reached its usage limit' }, { status: 410 })

  return NextResponse.json({ invite: data })
}

// POST /api/institutions/invite  — generate a new invite (institution admin only)
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      institution_id?: string
      domain_lock?: string
      uses_limit?: number | null
      expires_days?: number
    }

    const { institution_id, domain_lock, uses_limit, expires_days = 90 } = body
    if (!institution_id) return NextResponse.json({ error: 'institution_id required' }, { status: 400 })

    const admin = createAdminSupabaseClient()

    // Verify caller is admin of this institution
    const { data: adminRecord } = await admin
      .from('institution_admins')
      .select('role')
      .eq('institution_id', institution_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRecord) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + Math.min(Math.max(expires_days, 1), 365))

    const { data: invite, error } = await admin
      .from('institution_invites')
      .insert({
        institution_id,
        domain_lock:  domain_lock?.toLowerCase().trim() || null,
        uses_limit:   uses_limit ?? null,
        expires_at:   expiresAt.toISOString(),
        created_by:   user.id,
      })
      .select('token')
      .single()

    if (error) throw error

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://varsityos.co.za'
    return NextResponse.json({
      token: invite.token,
      url:   `${appUrl}/join/institution/${invite.token}`,
    })
  } catch (err) {
    console.error('[institutions/invite POST]', err)
    return NextResponse.json({ error: 'Failed to generate invite' }, { status: 500 })
  }
}
