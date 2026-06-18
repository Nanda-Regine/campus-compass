import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { domains_hit, xp_bonus } = await req.json() as { domains_hit: string[]; xp_bonus: number }
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('compound_days')
    .upsert({ user_id: user.id, day_date: today, domains_hit, xp_bonus }, { onConflict: 'user_id,day_date', ignoreDuplicates: true })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Also update each domain streak
  for (const domain of domains_hit) {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/gamification/domain-streak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
      body: JSON.stringify({ domain, action: 'increment' }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, data })
}

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('compound_days')
    .select('day_date, domains_hit, xp_bonus')
    .eq('user_id', user.id)
    .order('day_date', { ascending: false })
    .limit(30)

  return NextResponse.json({ compound_days: data ?? [] })
}
