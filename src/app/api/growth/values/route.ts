import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase.from('user_values').select('*').eq('user_id', user.id).single()
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  // Explicit allowlist prevents mass-assignment into upsert.
  // Accept both the live-schema field names and the legacy names the client may still send.
  const b = body as Record<string, unknown>
  const rawSelected = b.values_selected ?? b.values_list
  const rawTop3 = b.top_3 ?? b.top_value
  const rawStatement = b.values_statement ?? b.reflection

  // values_selected and top_3 are text[] (NOT NULL) — coerce to arrays.
  const toArray = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map(String)
    if (typeof v === 'string' && v.trim()) return [v]
    return []
  }
  const values_selected = toArray(rawSelected)
  const top_3 = toArray(rawTop3)
  const values_statement = typeof rawStatement === 'string' ? rawStatement : ''

  const { data, error } = await supabase
    .from('user_values')
    .upsert({ values_selected, top_3, values_statement, user_id: user.id, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
