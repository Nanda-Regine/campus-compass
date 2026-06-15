import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('commitment_contracts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return NextResponse.json({ contracts: data ?? [] })
  } catch (e) {
    console.error('[contracts GET]', e)
    return NextResponse.json({ contracts: [] })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { task_description, deadline, xp_stake } = await req.json()
    if (!task_description?.trim() || !deadline) {
      return NextResponse.json({ error: 'task_description and deadline are required' }, { status: 400 })
    }

    // Limit 1 active contract at a time
    const { count } = await supabase
      .from('commitment_contracts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active')

    if ((count ?? 0) >= 1) {
      return NextResponse.json({ error: 'Complete or abandon your current contract first' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('commitment_contracts')
      .insert({
        user_id: user.id,
        task_description: task_description.trim(),
        deadline,
        xp_stake: Math.min(500, Math.max(10, Number(xp_stake) || 50)),
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ contract: data })
  } catch (e) {
    console.error('[contracts POST]', e)
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, action } = await req.json()  // action: 'complete' | 'fail'
    if (!id || !['complete', 'fail'].includes(action)) {
      return NextResponse.json({ error: 'id and action required' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const update = action === 'complete'
      ? { status: 'completed', completed_at: now }
      : { status: 'failed', failed_at: now }

    const { data, error } = await supabase
      .from('commitment_contracts')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ contract: data })
  } catch (e) {
    console.error('[contracts PATCH]', e)
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
  }
}
