import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sastToday } from '@/lib/utils'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('profiles')
    .select('archetype, archetype_updated_at')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ archetype: data?.archetype ?? 'Explorer', updated_at: data?.archetype_updated_at })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { archetype } = await req.json() as { archetype: string }
  const today = sastToday()

  await supabase
    .from('profiles')
    .update({ archetype, archetype_updated_at: today })
    .eq('id', user.id)

  return NextResponse.json({ success: true, archetype })
}
