export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/institutions/join  — authenticated student joins via token
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { token } = await req.json() as { token?: string }
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    const admin = createAdminSupabaseClient()

    const { data: invite } = await admin
      .from('institution_invites')
      .select('id, institution_id, domain_lock, uses_limit, uses_count, expires_at')
      .eq('token', token)
      .maybeSingle()

    if (!invite) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })

    const expired = invite.expires_at && new Date(invite.expires_at) < new Date()
    const full    = invite.uses_limit != null && invite.uses_count >= invite.uses_limit
    if (expired) return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 })
    if (full)    return NextResponse.json({ error: 'This invite link has reached its limit' }, { status: 410 })

    // Domain lock check
    if (invite.domain_lock) {
      const emailDomain = user.email?.split('@')[1]?.toLowerCase()
      if (emailDomain !== invite.domain_lock) {
        return NextResponse.json(
          { error: `This invite is restricted to @${invite.domain_lock} emails.` },
          { status: 403 }
        )
      }
    }

    // Check institution is active
    const { data: inst } = await admin
      .from('institutions')
      .select('id, name, status')
      .eq('id', invite.institution_id)
      .maybeSingle()

    if (!inst || inst.status !== 'active') {
      return NextResponse.json({ error: 'Institution is not yet active on VarsityOS' }, { status: 403 })
    }

    // Claim a seat FIRST, atomically. Compare-and-swap: only increment if uses_count is still
    // what we read. Under concurrent joins this matches 0 rows for all but one caller, so a
    // capped invite can never admit more students than its limit (the old read-then-write let
    // many concurrent joins all pass the `full` check and overshoot).
    const { data: claimed } = await admin
      .from('institution_invites')
      .update({ uses_count: invite.uses_count + 1 })
      .eq('id', invite.id)
      .eq('uses_count', invite.uses_count)
      .select('id')
      .maybeSingle()

    if (!claimed && invite.uses_limit != null) {
      // Someone else claimed the seat between our read and write — make them retry.
      return NextResponse.json({ error: 'This invite link is busy — please try again.' }, { status: 409 })
    }

    // Link student to institution only after the seat is secured.
    await admin
      .from('profiles')
      .update({ institution_id: invite.institution_id })
      .eq('id', user.id)

    return NextResponse.json({ joined: true, institution: { id: inst.id, name: inst.name } })
  } catch (err) {
    console.error('[institutions/join]', err)
    return NextResponse.json({ error: 'Could not join institution. Please try again.' }, { status: 500 })
  }
}
