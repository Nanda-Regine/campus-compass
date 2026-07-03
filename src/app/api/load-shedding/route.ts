export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimitAsync } from '@/lib/rateLimit'

/* ── EskomSePush API v2 ─────────────────────────────────── */
const ESP_BASE = 'https://developer.sepush.co.za/business/2.0'
const ESP_KEY  = process.env.ESKOMSEPUSH_API_KEY

interface LoadSheddingStatus {
  stage: number            // 0 = no load shedding, 1–8
  stage_updated: string    // ISO timestamp
  source: string
}

interface LoadSheddingEvent {
  start: string
  end: string
  note: string
  stage: string
}

interface AreaSchedule {
  events: LoadSheddingEvent[]
  info: { name: string; region: string }
  schedule: { days: Array<{ date: string; name: string; stages: string[][] }> }
}

/* ── Cached status (30 min TTL) ─────────────────────────── */
let statusCache: { data: LoadSheddingStatus; fetchedAt: number } | null = null
const STATUS_TTL = 30 * 60 * 1000

async function getNationalStatus(): Promise<LoadSheddingStatus | null> {
  if (statusCache && Date.now() - statusCache.fetchedAt < STATUS_TTL) {
    return statusCache.data
  }
  if (!ESP_KEY) return null

  try {
    const res = await fetch(`${ESP_BASE}/status`, {
      headers: { Token: ESP_KEY },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const json = await res.json()
    const eskom = json.status?.eskom
    if (!eskom) return null

    const data: LoadSheddingStatus = {
      stage: eskom.stage ? parseInt(eskom.stage, 10) : 0,
      stage_updated: eskom.stage_updated ?? new Date().toISOString(),
      source: 'EskomSePush',
    }
    statusCache = { data, fetchedAt: Date.now() }
    return data
  } catch {
    return null
  }
}

async function getAreaSchedule(areaId: string): Promise<AreaSchedule | null> {
  if (!ESP_KEY) return null
  try {
    const res = await fetch(`${ESP_BASE}/area?id=${encodeURIComponent(areaId)}&test=current`, {
      headers: { Token: ESP_KEY },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function searchArea(text: string): Promise<Array<{ id: string; name: string; region: string }>> {
  if (!ESP_KEY) return []
  try {
    const res = await fetch(`${ESP_BASE}/areas_search?text=${encodeURIComponent(text)}`, {
      headers: { Token: ESP_KEY },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.areas ?? []).slice(0, 10)
  } catch {
    return []
  }
}

/* ── Route handler ──────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResult = await checkRateLimitAsync(user.id, 'loadshedding', 30, 60_000)
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  const areaId = url.searchParams.get('area_id')
  const query  = url.searchParams.get('q')

  // Action: search for area by name
  if (action === 'search' && query) {
    const areas = await searchArea(query)
    return NextResponse.json({ areas })
  }

  // Action: get schedule for a specific area
  if (action === 'schedule' && areaId) {
    const schedule = await getAreaSchedule(areaId)
    if (!schedule) return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    return NextResponse.json({ schedule })
  }

  // Default: national status only
  const status = await getNationalStatus()
  return NextResponse.json({
    status: status ?? { stage: 0, stage_updated: new Date().toISOString(), source: 'offline' },
    apiAvailable: !!ESP_KEY,
  })
}
