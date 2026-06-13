export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST — create or update study pod opt-in profile
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      study_style?: string
      preferred_times?: string[]
      bio?: string
      is_active?: boolean
    }

    const { study_style = 'mixed', preferred_times = [], bio, is_active = true } = body

    const valid_styles = ['silent', 'discussion', 'mixed']
    if (!valid_styles.includes(study_style)) {
      return NextResponse.json({ error: 'Invalid study_style' }, { status: 400 })
    }

    const { error } = await supabase.from('study_pod_profiles').upsert({
      user_id:         user.id,
      study_style,
      preferred_times: preferred_times.filter(t =>
        ['morning','afternoon','evening','weekend'].includes(t)
      ),
      bio:       bio?.trim().slice(0, 300) ?? null,
      is_active,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (error) throw error
    return NextResponse.json({ joined: true })
  } catch (err) {
    console.error('[study-pods/join]', err)
    return NextResponse.json({ error: 'Failed to update study pod profile' }, { status: 500 })
  }
}

// GET — fetch own pod profile
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase
      .from('study_pod_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({ profile: data })
  } catch (err) {
    console.error('[study-pods/join GET]', err)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}
