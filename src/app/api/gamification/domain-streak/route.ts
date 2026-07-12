import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sastToday, sastDatePlus } from '@/lib/utils'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('profiles')
    .select('domain_streaks')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ domain_streaks: data?.domain_streaks ?? null })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { domain, action } = await req.json() as { domain: string; action: 'increment' | 'use_shield' | 'reset' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('domain_streaks')
    .eq('id', user.id)
    .single()

  const streaks = profile?.domain_streaks ?? {
    academic: { streak: 0, last_date: null, shields: 2, best: 0 },
    money:    { streak: 0, last_date: null, shields: 2, best: 0 },
    life:     { streak: 0, last_date: null, shields: 2, best: 0 },
    career:   { streak: 0, last_date: null, shields: 2, best: 0 },
    community:{ streak: 0, last_date: null, shields: 2, best: 0 },
  }

  if (!streaks[domain]) return NextResponse.json({ error: 'Invalid domain' }, { status: 400 })

  const today = sastToday()
  const ds = streaks[domain]

  if (action === 'increment') {
    const yesterdayStr = sastDatePlus(-1)

    if (ds.last_date === today) {
      // Already incremented today
    } else if (ds.last_date === yesterdayStr || ds.last_date === null) {
      ds.streak = (ds.streak ?? 0) + 1
      ds.last_date = today
      ds.best = Math.max(ds.best ?? 0, ds.streak)
    } else {
      // Missed a day — check if shield available
      if ((ds.shields ?? 0) > 0) {
        ds.shields -= 1
        ds.streak = (ds.streak ?? 0) + 1
        ds.last_date = today
      } else {
        ds.streak = 1
        ds.last_date = today
      }
    }
  } else if (action === 'use_shield') {
    if ((ds.shields ?? 0) > 0) ds.shields -= 1
  } else if (action === 'reset') {
    ds.streak = 0
    ds.last_date = null
  }

  streaks[domain] = ds
  await supabase.from('profiles').update({ domain_streaks: streaks }).eq('id', user.id)
  return NextResponse.json({ domain_streaks: streaks })
}
