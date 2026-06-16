import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// ─── SSRF guard ──────────────────────────────────────────────────────────────
function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    if (!['http:', 'https:'].includes(u.protocol)) return false
    const h = u.hostname.toLowerCase()
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return false
    if (/^10\./.test(h)) return false
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false
    if (/^192\.168\./.test(h)) return false
    if (/^169\.254\./.test(h)) return false
    if (h.endsWith('.local') || h.endsWith('.internal')) return false
    return true
  } catch {
    return false
  }
}

// ─── Normalise site URL (strip trailing slash) ────────────────────────────────
function normUrl(raw: string): string {
  return raw.replace(/\/+$/, '')
}

// ─── Test Moodle connection ────────────────────────────────────────────────────
async function testMoodle(siteUrl: string, token: string): Promise<{ ok: boolean; displayName?: string; error?: string }> {
  try {
    const url = `${siteUrl}/webservice/rest/server.php?wstoken=${encodeURIComponent(token)}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json`
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return { ok: false, error: 'Moodle site did not respond' }
    const data = await res.json() as Record<string, unknown>
    if (data.exception) return { ok: false, error: (data.message as string) || 'Moodle rejected the token' }
    const siteName = (data.sitename as string | null) || 'Moodle'
    const fullName = (data.fullname as string | null) || ''
    return { ok: true, displayName: `${siteName}${fullName ? ` · ${fullName}` : ''}` }
  } catch {
    return { ok: false, error: 'Could not reach Moodle site — check the URL' }
  }
}

// ─── Test Canvas connection ────────────────────────────────────────────────────
async function testCanvas(siteUrl: string, token: string): Promise<{ ok: boolean; displayName?: string; error?: string }> {
  try {
    const res = await fetch(`${siteUrl}/api/v1/users/self`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (res.status === 401) return { ok: false, error: 'Canvas rejected the token — check it is a valid access token' }
    if (!res.ok) return { ok: false, error: 'Canvas site did not respond correctly' }
    const data = await res.json() as Record<string, unknown>
    const name = (data.name as string | null) || ''
    return { ok: true, displayName: `Canvas${name ? ` · ${name}` : ''}` }
  } catch {
    return { ok: false, error: 'Could not reach Canvas site — check the URL' }
  }
}

// ─── GET /api/integrations/lms — list user integrations ──────────────────────
export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('lms_integrations')
    .select('id, lms_type, site_url, display_name, last_synced_at, sync_count, sync_error, is_active, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to load integrations' }, { status: 500 })
  return NextResponse.json({ integrations: data ?? [] })
}

// ─── POST /api/integrations/lms — add or test integration ────────────────────
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { lms_type?: string; site_url?: string; token?: string; test_only?: boolean }

  const lmsType = body.lms_type
  const rawUrl  = typeof body.site_url === 'string' ? body.site_url.trim() : ''
  const token   = typeof body.token === 'string' ? body.token.trim() : ''
  const testOnly = body.test_only === true

  if (!['moodle', 'canvas'].includes(lmsType ?? '')) {
    return NextResponse.json({ error: 'lms_type must be moodle or canvas' }, { status: 400 })
  }
  if (!rawUrl || !isSafeUrl(rawUrl)) {
    return NextResponse.json({ error: 'Invalid or unsafe site URL' }, { status: 400 })
  }
  if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 })

  const siteUrl = normUrl(rawUrl)

  // Test the connection
  const testResult = lmsType === 'moodle'
    ? await testMoodle(siteUrl, token)
    : await testCanvas(siteUrl, token)

  if (!testResult.ok) {
    return NextResponse.json({ error: testResult.error }, { status: 400 })
  }
  if (testOnly) {
    return NextResponse.json({ ok: true, displayName: testResult.displayName })
  }

  // Upsert the integration
  const { data: row, error } = await supabase
    .from('lms_integrations')
    .upsert({
      user_id:      user.id,
      lms_type:     lmsType,
      site_url:     siteUrl,
      token,
      display_name: testResult.displayName,
      is_active:    true,
      updated_at:   new Date().toISOString(),
    }, { onConflict: 'user_id,lms_type,site_url' })
    .select('id, lms_type, site_url, display_name, last_synced_at, sync_count, is_active')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to save integration' }, { status: 500 })
  return NextResponse.json({ integration: row })
}

// ─── DELETE /api/integrations/lms?id= ─────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('lms_integrations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  return NextResponse.json({ success: true })
}
