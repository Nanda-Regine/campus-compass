import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// ─── Shared types ─────────────────────────────────────────────────────────────
export interface LMSAssignment {
  external_id: string          // e.g. moodle:12345
  title: string
  course_name: string
  due_date: string | null      // ISO date string YYYY-MM-DD or null
  description: string
  url: string | null
  status: 'upcoming' | 'past'
}

// ─── Moodle sync ──────────────────────────────────────────────────────────────
async function syncMoodle(siteUrl: string, token: string): Promise<LMSAssignment[]> {
  const base = `${siteUrl}/webservice/rest/server.php`

  // 1. Get user ID from site info
  const infoUrl = `${base}?wstoken=${encodeURIComponent(token)}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json`
  const infoRes = await fetch(infoUrl, { signal: AbortSignal.timeout(10_000) })
  const info = await infoRes.json() as Record<string, unknown>
  if (info.exception) throw new Error((info.message as string) || 'Moodle auth failed')
  const userId = info.userid as number

  // 2. Get enrolled courses (cap at 15)
  const coursesUrl = `${base}?wstoken=${encodeURIComponent(token)}&wsfunction=core_enrol_get_users_courses&moodlewsrestformat=json&userid=${userId}`
  const coursesRes = await fetch(coursesUrl, { signal: AbortSignal.timeout(10_000) })
  const courses = await coursesRes.json() as Array<{ id: number; fullname: string; shortname: string }>
  if (!Array.isArray(courses)) throw new Error('Unexpected Moodle courses response')

  const activeCourses = courses.slice(0, 15)
  if (activeCourses.length === 0) return []

  // 3. Get assignments for those courses
  const params = new URLSearchParams({
    wstoken: token,
    wsfunction: 'mod_assign_get_assignments',
    moodlewsrestformat: 'json',
  })
  activeCourses.forEach((c, i) => params.append(`courseids[${i}]`, String(c.id)))
  const assignRes = await fetch(`${base}?${params}`, { signal: AbortSignal.timeout(15_000) })
  const assignData = await assignRes.json() as { courses?: Array<{ id: number; fullname: string; assignments: Array<{ id: number; name: string; duedate: number; intro: string; cmid: number }> }> }
  if (!assignData.courses) return []

  const now = Date.now()
  const results: LMSAssignment[] = []

  for (const course of assignData.courses) {
    for (const a of (course.assignments || [])) {
      const dueMs   = a.duedate ? a.duedate * 1000 : null
      const dueDate = dueMs ? new Date(dueMs).toISOString().split('T')[0] : null
      const status  = dueMs && dueMs < now ? 'past' : 'upcoming'
      // Strip basic HTML from intro
      const description = a.intro.replace(/<[^>]+>/g, '').trim().slice(0, 300)
      results.push({
        external_id: `moodle:${a.id}`,
        title:       a.name,
        course_name: course.fullname,
        due_date:    dueDate,
        description,
        url:         `${siteUrl}/mod/assign/view.php?id=${a.cmid}`,
        status,
      })
    }
  }

  return results.sort((a, b) => {
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return a.due_date.localeCompare(b.due_date)
  })
}

// ─── Canvas sync ──────────────────────────────────────────────────────────────
async function syncCanvas(siteUrl: string, token: string): Promise<LMSAssignment[]> {
  const headers = { Authorization: `Bearer ${token}` }

  // 1. Get active courses (cap at 10)
  const coursesRes = await fetch(`${siteUrl}/api/v1/courses?enrollment_state=active&per_page=10`, {
    headers, signal: AbortSignal.timeout(10_000),
  })
  if (!coursesRes.ok) throw new Error('Canvas courses fetch failed')
  const courses = await coursesRes.json() as Array<{ id: number; name: string; course_code: string }>
  if (!Array.isArray(courses)) throw new Error('Unexpected Canvas courses response')

  if (courses.length === 0) return []

  // 2. Fetch upcoming assignments for each course (parallel, cap at 5 courses)
  const now = Date.now()
  const fetches = courses.slice(0, 5).map(c =>
    fetch(`${siteUrl}/api/v1/courses/${c.id}/assignments?per_page=20&order_by=due_at&bucket=upcoming`, {
      headers, signal: AbortSignal.timeout(10_000),
    })
    .then(r => r.ok ? r.json() : [])
    .then((assignments: Array<{ id: number; name: string; due_at: string | null; description: string | null; html_url: string }>) =>
      ({ courseName: c.name, assignments })
    )
    .catch(() => ({ courseName: c.name, assignments: [] }))
  )

  const courseAssignments = await Promise.all(fetches)
  const results: LMSAssignment[] = []

  for (const { courseName, assignments } of courseAssignments) {
    for (const a of assignments) {
      const dueDate = a.due_at ? a.due_at.split('T')[0] : null
      const dueMs   = a.due_at ? new Date(a.due_at).getTime() : null
      const status  = dueMs && dueMs < now ? 'past' : 'upcoming'
      const description = (a.description || '').replace(/<[^>]+>/g, '').trim().slice(0, 300)
      results.push({
        external_id: `canvas:${a.id}`,
        title:       a.name,
        course_name: courseName,
        due_date:    dueDate,
        description,
        url:         a.html_url || null,
        status,
      })
    }
  }

  return results.sort((a, b) => {
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return a.due_date.localeCompare(b.due_date)
  })
}

// ─── POST /api/integrations/lms/sync ─────────────────────────────────────────
// Body: { id: string; import?: string[] }
// - id: lms_integrations.id
// - import: optional array of external_ids to import as tasks
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { id?: string; import?: string[] }
  const id = body.id
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Load integration (includes token — server-only, never returned to client)
  const { data: integration, error: loadErr } = await supabase
    .from('lms_integrations')
    .select('id, lms_type, site_url, token, display_name')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (loadErr || !integration) return NextResponse.json({ error: 'Integration not found' }, { status: 404 })

  // Fetch assignments
  let assignments: LMSAssignment[]
  try {
    assignments = integration.lms_type === 'moodle'
      ? await syncMoodle(integration.site_url, integration.token)
      : await syncCanvas(integration.site_url, integration.token)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sync failed'
    // Record the error
    await supabase
      .from('lms_integrations')
      .update({ sync_error: msg, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  // Fetch current sync_count then update all fields atomically
  const { data: cur } = await supabase
    .from('lms_integrations')
    .select('sync_count')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  await supabase
    .from('lms_integrations')
    .update({
      last_synced_at: new Date().toISOString(),
      sync_count:     ((cur?.sync_count as number | null) ?? 0) + 1,
      sync_error:     null,
      updated_at:     new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  // ── Import selected assignments as tasks ─────────────────────────────────
  const toImport = Array.isArray(body.import) ? body.import : []
  let importedCount = 0

  if (toImport.length > 0) {
    const selected = assignments.filter(a => toImport.includes(a.external_id))
    const now = new Date().toISOString()
    const rows = selected.map(a => ({
      user_id:     user.id,
      title:       a.title,
      description: a.description || null,
      due_date:    a.due_date || null,
      status:      'todo' as const,
      priority:    'medium' as const,
      external_id: a.external_id,
      source:      integration.lms_type,
      created_at:  now,
      updated_at:  now,
    }))

    if (rows.length > 0) {
      const { error: taskErr } = await supabase
        .from('tasks')
        .upsert(rows, { onConflict: 'user_id,external_id', ignoreDuplicates: false })
      if (!taskErr) importedCount = rows.length
    }
  }

  return NextResponse.json({ assignments, importedCount })
}
