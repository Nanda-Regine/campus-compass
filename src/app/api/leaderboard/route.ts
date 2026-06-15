import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url    = new URL(req.url)
    const univ   = url.searchParams.get('university') || null
    const year   = url.searchParams.get('year') ? parseInt(url.searchParams.get('year')!) : null
    const limit  = Math.min(25, parseInt(url.searchParams.get('limit') ?? '15'))

    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_university: univ,
      p_year:       year,
      p_limit:      limit,
    })
    if (error) throw error

    // Tag the requesting user's own row
    const entries = (data ?? []).map((row: {
      user_id: string; first_name: string; university: string
      year_of_study: number; degree: string; total_xp: number
    }, i: number) => ({
      rank:          i + 1,
      first_name:    row.first_name,
      university:    row.university,
      year_of_study: row.year_of_study,
      degree:        row.degree,
      total_xp:      row.total_xp,
      is_me:         row.user_id === user.id,
    }))

    return NextResponse.json({ entries })
  } catch (err) {
    console.error('Leaderboard error:', err)
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 })
  }
}
