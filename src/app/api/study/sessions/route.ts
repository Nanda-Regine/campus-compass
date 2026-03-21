import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/study/sessions — total minutes studied today and this week
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 6)

    const { data: sessions } = await supabase
      .from('study_sessions')
      .select('duration_minutes, started_at, module_id')
      .eq('user_id', user.id)
      .gte('started_at', weekAgo.toISOString())
      .order('started_at', { ascending: false })

    const todayStr = today.toISOString()
    const todayMinutes = (sessions || [])
      .filter(s => s.started_at >= todayStr)
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

    const weekMinutes = (sessions || [])
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

    return NextResponse.json({
      todayMinutes,
      weekMinutes,
      sessionCount: (sessions || []).length,
    })
  } catch (error) {
    console.error('Study sessions GET error:', error)
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 })
  }
}

// POST /api/study/sessions — save a completed pomodoro session
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { duration_minutes, task_id, module_id, notes, started_at } = body

    if (!duration_minutes || duration_minutes < 1) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        user_id: user.id,
        duration_minutes: Math.round(duration_minutes),
        task_id: task_id || null,
        module_id: module_id || null,
        notes: notes || null,
        started_at: started_at || new Date().toISOString(),
        ended_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ id: data.id, success: true })
  } catch (error) {
    console.error('Study sessions POST error:', error)
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
  }
}
