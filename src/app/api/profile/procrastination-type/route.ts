export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const VALID_TYPES = new Set(['perfectionist', 'overwhelmed', 'avoidant', 'impulsive', 'bored'])

export async function PATCH(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as Record<string, unknown>
  const { procrastination_type } = body

  if (!procrastination_type || !VALID_TYPES.has(String(procrastination_type)))
    return NextResponse.json({ error: 'invalid procrastination_type' }, { status: 400 })

  const { error } = await supabase
    .from('profiles')
    .update({ procrastination_type: String(procrastination_type) })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
