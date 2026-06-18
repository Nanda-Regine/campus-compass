export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/src/members — active SRC members for current user's university
export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('university')
    .eq('id', user.id)
    .maybeSingle()

  const university = profile?.university ?? ''

  const { data, error } = await supabase
    .from('src_members')
    .select('id, user_id, university, role, portfolio, bio, is_active')
    .eq('university', university)
    .eq('is_active', true)
    .limit(50)

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/src/members — register as SRC member
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch university from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('university')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.university) {
    return NextResponse.json({ error: 'Profile must have a university set' }, { status: 400 })
  }

  const university = profile.university

  // Check not already a member
  const { data: existing } = await supabase
    .from('src_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('university', university)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Already registered as an SRC member at this institution' }, { status: 409 })
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>

  const role      = typeof body.role      === 'string' ? body.role.trim()      : ''
  const portfolio = typeof body.portfolio === 'string' ? body.portfolio.trim() : null
  const bio       = typeof body.bio       === 'string' ? body.bio.trim()       : null

  if (role.length < 2 || role.length > 80) {
    return NextResponse.json({ error: 'role must be 2–80 characters' }, { status: 400 })
  }
  if (portfolio !== null && portfolio.length > 80) {
    return NextResponse.json({ error: 'portfolio must be 80 characters or fewer' }, { status: 400 })
  }
  if (bio !== null && bio.length > 400) {
    return NextResponse.json({ error: 'bio must be 400 characters or fewer' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('src_members')
    .insert({
      user_id:   user.id,
      university,
      role,
      portfolio: portfolio || null,
      bio:       bio       || null,
      is_active: true,
    })
    .select('id, user_id, university, role, portfolio, bio, is_active')
    .single()

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
