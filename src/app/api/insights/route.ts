import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: insights } = await supabase
      .from('nova_insights')
      .select('*')
      .eq('user_id', user.id)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({ insights: insights || [] })
  } catch (error) {
    console.error('Insights GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()

    await supabase
      .from('nova_insights')
      .update({ dismissed: true })
      .eq('id', id)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Dismiss insight error:', error)
    return NextResponse.json({ error: 'Failed to dismiss insight' }, { status: 500 })
  }
}
