import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('procrastination_journal')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error
    return NextResponse.json({ entries: data ?? [] })
  } catch (e) {
    console.error('[pj GET]', e)
    return NextResponse.json({ error: 'Failed to load entries' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { trigger, obstacle, plan } = await req.json()
    if (!obstacle?.trim() || !plan?.trim()) {
      return NextResponse.json({ error: 'obstacle and plan are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('procrastination_journal')
      .insert({
        user_id: user.id,
        trigger: trigger ?? 'manual',
        obstacle: obstacle.trim(),
        plan: plan.trim(),
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ entry: data })
  } catch (e) {
    console.error('[pj POST]', e)
    return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 })
  }
}
