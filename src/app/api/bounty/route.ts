import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

function weekStart(): string {
  const d = new Date()
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1 // Mon=0
  d.setDate(d.getDate() - day)
  return d.toISOString().split('T')[0]
}

// GET /api/bounty — current week's bounty progress
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ws = weekStart()

    const TRACKED = ['pomodoro_session', 'task_complete']
    const { data, error } = await supabase
      .from('community_weekly_bounty')
      .select('event_type, total_count, goal')
      .eq('week_start', ws)
      .in('event_type', TRACKED)

    if (error) throw error

    const result: Record<string, { count: number; goal: number }> = {}
    for (const row of data ?? []) {
      result[row.event_type] = { count: Number(row.total_count), goal: Number(row.goal) }
    }
    // Fill zeros for missing events
    for (const e of TRACKED) {
      if (!result[e]) result[e] = { count: 0, goal: e === 'pomodoro_session' ? 500 : 1000 }
    }

    return NextResponse.json({ week_start: ws, events: result })
  } catch (err) {
    console.error('Bounty GET error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// POST /api/bounty — increment counter (rate-limited per user per event per day)
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { event_type } = await req.json()
    const ALLOWED = ['pomodoro_session', 'task_complete']
    if (!ALLOWED.includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    const ws   = weekStart()
    const goal = event_type === 'pomodoro_session' ? 500 : 1000

    const { error } = await supabase.rpc('increment_community_bounty', {
      p_week_start: ws,
      p_event_type: event_type,
      p_goal:       goal,
    })
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Bounty POST error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
