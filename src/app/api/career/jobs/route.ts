import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appId  = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  if (!appId || !appKey) {
    return NextResponse.json({ results: [], count: 0, unconfigured: true })
  }

  const { searchParams } = request.nextUrl
  const q        = (searchParams.get('q') ?? '').slice(0, 100).trim()
  const location = (searchParams.get('location') ?? '').slice(0, 100).trim()
  const page     = Math.min(5, Math.max(1, parseInt(searchParams.get('page') ?? '1', 10)))

  const url = new URL(`https://api.adzuna.com/v1/api/jobs/za/search/${page}`)
  url.searchParams.set('app_id', appId)
  url.searchParams.set('app_key', appKey)
  url.searchParams.set('results_per_page', '12')
  url.searchParams.set('content-type', 'application/json')
  url.searchParams.set('sort_by', 'date')
  if (q)        url.searchParams.set('what', q)
  if (location) url.searchParams.set('where', location)

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 300 } })
    if (!res.ok) {
      return NextResponse.json({ error: 'Jobs API unavailable' }, { status: 502 })
    }
    const data = await res.json() as { results?: unknown[]; count?: number }
    return NextResponse.json({ results: data.results ?? [], count: data.count ?? 0 })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}
