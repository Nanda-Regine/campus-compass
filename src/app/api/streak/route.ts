import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/streak — calculate task completion streak for the current user
// A streak day = at least 1 task completed on that day
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get the last 60 days of task completions
    const since = new Date()
    since.setDate(since.getDate() - 60)

    const { data: completions } = await supabase
      .from('tasks')
      .select('completed_at')
      .eq('user_id', user.id)
      .eq('status', 'done')
      .not('completed_at', 'is', null)
      .gte('completed_at', since.toISOString())
      .order('completed_at', { ascending: false })

    if (!completions || completions.length === 0) {
      return NextResponse.json({ streak: 0, longestStreak: 0, todayDone: false })
    }

    // Get unique dates (SAST) where tasks were completed
    const uniqueDates = new Set(
      completions.map(c => new Date(c.completed_at!).toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg' }))
    )

    const today = new Date().toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg' })
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg' })

    const todayDone = uniqueDates.has(today)

    // Calculate current streak (consecutive days ending today or yesterday)
    let streak = 0
    let checkDate = new Date()

    // If today has no completions, check if yesterday does (streak still alive)
    if (!todayDone) {
      const yesterdayDate = new Date(Date.now() - 86400000)
      const yesterdayStr = yesterdayDate.toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg' })
      if (!uniqueDates.has(yesterdayStr)) {
        return NextResponse.json({ streak: 0, longestStreak: uniqueDates.size, todayDone: false })
      }
      checkDate = yesterdayDate
    }

    // Walk back counting consecutive days
    for (let i = 0; i < 60; i++) {
      const dateStr = checkDate.toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg' })
      if (uniqueDates.has(dateStr)) {
        streak++
        checkDate = new Date(checkDate.getTime() - 86400000)
      } else {
        break
      }
    }

    return NextResponse.json({
      streak,
      longestStreak: Math.max(streak, uniqueDates.size), // rough estimate
      todayDone,
      today,
      yesterday,
    })
  } catch (error) {
    console.error('Streak error:', error)
    return NextResponse.json({ streak: 0, longestStreak: 0, todayDone: false })
  }
}
