export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

interface CandidateProfile {
  user_id: string
  full_name: string
  year_of_study: string | null
  avatar_url: string | null
  study_style: string
  preferred_times: string[]
  bio: string | null
  sharedModules: string[]
  score: number
}

interface MatchResult extends CandidateProfile {
  blurb: string
}

async function generateBlurbs(
  myName: string,
  myYear: string,
  myStyle: string,
  candidates: CandidateProfile[]
): Promise<Record<string, string>> {
  if (candidates.length === 0) return {}

  const context = candidates.map((c, i) =>
    `[${i}] ${c.full_name}, Year ${c.year_of_study ?? '?'}, ${c.study_style} learner` +
    (c.bio ? `, "${c.bio}"` : '') +
    `. Shared modules: ${c.sharedModules.join(', ')}.`
  ).join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    tools: [{
      name: 'study_pod_blurbs',
      description: 'Return a short match blurb for each candidate.',
      input_schema: {
        type: 'object' as const,
        properties: {
          blurbs: {
            type: 'array',
            items: { type: 'string', description: '1-2 sentences. Friendly, specific, SA student context.' },
            description: `Array of ${candidates.length} blurbs in the same order as input.`,
          },
        },
        required: ['blurbs'],
      },
    }],
    tool_choice: { type: 'tool', name: 'study_pod_blurbs' },
    system: `You match South African university students for study partnerships.
Write warm, specific 1-2 sentence blurbs explaining why each candidate would be a good study partner for ${myName} (Year ${myYear}, ${myStyle} learner).
Reference shared modules, study styles, and any bio details. Keep it under 40 words each.`,
    messages: [{ role: 'user', content: `Candidates:\n${context}` }],
  })

  const tool = response.content.find(b => b.type === 'tool_use')
  if (!tool || tool.type !== 'tool_use') return {}
  const { blurbs } = tool.input as { blurbs: string[] }

  return Object.fromEntries(candidates.map((c, i) => [c.user_id, blurbs[i] ?? '']))
}

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminSupabaseClient()

    // 1. Verify user is opted in
    const { data: myPodProfile } = await supabase
      .from('study_pod_profiles')
      .select('study_style, preferred_times, bio')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!myPodProfile) {
      return NextResponse.json({ notOptedIn: true })
    }

    // 2. Get my profile and modules
    const [profileRes, myModulesRes] = await Promise.all([
      admin.from('profiles').select('full_name, university, year_of_study').eq('id', user.id).maybeSingle(),
      admin.from('modules').select('module_code, module_name').eq('user_id', user.id),
    ])

    const myProfile = profileRes.data
    if (!myProfile?.university) {
      return NextResponse.json({ matches: [], reason: 'Set your university in your profile first.' })
    }

    const myCodes = (myModulesRes.data ?? []).map(m => m.module_code).filter(Boolean)
    if (myCodes.length === 0) {
      return NextResponse.json({ matches: [], reason: 'Add your modules first to find study partners.' })
    }

    // 3. Get existing connections to exclude
    const { data: existingConns } = await supabase
      .from('study_pod_connections')
      .select('requester_id, recipient_id')
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)

    const excludeIds = new Set<string>([user.id])
    for (const c of existingConns ?? []) {
      excludeIds.add(c.requester_id)
      excludeIds.add(c.recipient_id)
    }

    // 4. Get opted-in candidates at same university (admin to read other users)
    const { data: podProfiles } = await admin
      .from('study_pod_profiles')
      .select('user_id, study_style, preferred_times, bio')
      .eq('is_active', true)
      .not('user_id', 'in', `(${[...excludeIds].join(',')})`)
      .limit(80)

    if (!podProfiles || podProfiles.length === 0) {
      return NextResponse.json({ matches: [] })
    }

    const candidateIds = podProfiles.map(p => p.user_id)

    // 5. Batch-fetch candidate profiles and modules
    const [profilesRes, modulesRes] = await Promise.all([
      admin.from('profiles')
        .select('id, full_name, university, year_of_study, avatar_url')
        .in('id', candidateIds)
        .eq('university', myProfile.university),
      admin.from('modules')
        .select('user_id, module_code, module_name')
        .in('user_id', candidateIds)
        .in('module_code', myCodes),
    ])

    const profileMap = Object.fromEntries(
      (profilesRes.data ?? []).map(p => [p.id, p])
    )
    const modulesByUser: Record<string, string[]> = {}
    for (const m of modulesRes.data ?? []) {
      if (!modulesByUser[m.user_id]) modulesByUser[m.user_id] = []
      modulesByUser[m.user_id].push(m.module_code)
    }

    // 6. Score and rank
    const candidates: CandidateProfile[] = podProfiles
      .map(pp => {
        const p = profileMap[pp.user_id]
        if (!p) return null
        const shared = modulesByUser[pp.user_id] ?? []
        if (shared.length === 0) return null
        const yearDiff = myProfile.year_of_study && p.year_of_study
          ? Math.abs(Number(myProfile.year_of_study) - Number(p.year_of_study))
          : 3
        const score = shared.length * 10 + (yearDiff === 0 ? 5 : yearDiff === 1 ? 3 : 0)
        return {
          user_id:         pp.user_id,
          full_name:       p.full_name ?? 'Student',
          year_of_study:   p.year_of_study,
          avatar_url:      p.avatar_url ?? null,
          study_style:     pp.study_style,
          preferred_times: pp.preferred_times ?? [],
          bio:             pp.bio ?? null,
          sharedModules:   shared,
          score,
        } satisfies CandidateProfile
      })
      .filter((c): c is CandidateProfile => c !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)

    if (candidates.length === 0) {
      return NextResponse.json({ matches: [] })
    }

    // 7. Generate AI blurbs for top 5
    const top5 = candidates.slice(0, 5)
    const blurbs = await generateBlurbs(
      myProfile.full_name?.split(' ')[0] ?? 'you',
      String(myProfile.year_of_study ?? 1),
      myPodProfile.study_style,
      top5
    )

    const matches: MatchResult[] = candidates.map(c => ({
      ...c,
      blurb: blurbs[c.user_id] ?? `You share ${c.sharedModules.length} module${c.sharedModules.length > 1 ? 's' : ''} — good foundation for a study partnership.`,
    }))

    return NextResponse.json({ matches })
  } catch (err) {
    console.error('[study-pods/matches]', err)
    return NextResponse.json({ error: 'Failed to find matches' }, { status: 500 })
  }
}
