export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { anthropicUnconfiguredResponse } from '@/lib/anthropic'
import { checkRateLimitAsync } from '@/lib/rateLimit'

export interface GradPlan {
  headline:       string
  summary:        string
  gaps:           string[]
  nextSemester:   string[]
  risks:          string[]
  graduationYear: number
  onTrack:        boolean
  insufficientData?: false
}

export interface GradPlanInsufficient {
  insufficientData: true
}

export async function POST() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return anthropicUnconfiguredResponse()
  const anthropic = new Anthropic({ apiKey: anthropicKey })
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Per-user daily ceiling on this AI (Anthropic) route — caps cost/abuse at scale.
    const { allowed } = await checkRateLimitAsync(user.id, 'ai-grad-optimize', 10, 86_400_000)
    if (!allowed) return NextResponse.json({ error: 'Daily plan-optimization limit reached — try again tomorrow.' }, { status: 429 })

    const [modsRes, cfgRes, profileRes] = await Promise.all([
      supabase
        .from('graduation_modules')
        .select('module_code, module_name, credits, year_taken, semester, grade, status')
        .eq('user_id', user.id)
        .order('year_taken').order('module_code'),
      supabase
        .from('degree_config')
        .select('degree_name, total_credits, max_years, exclusion_mark, current_year')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('full_name, university, year_of_study')
        .eq('id', user.id)
        .maybeSingle(),
    ])

    const modules = modsRes.data ?? []
    if (modules.length < 2) {
      return NextResponse.json({ insufficientData: true } satisfies GradPlanInsufficient)
    }

    const cfg = cfgRes.data
    const profile = profileRes.data as { full_name?: string; university?: string; year_of_study?: string } | null

    const totalCredits  = cfg?.total_credits  ?? 360
    const maxYears      = cfg?.max_years       ?? 6
    const exclusionMark = cfg?.exclusion_mark  ?? 50
    const currentYear   = cfg?.current_year    ?? 1
    const degreeName    = cfg?.degree_name     ?? 'Degree'
    const calYear       = new Date().getFullYear()

    const creditsEarned = modules
      .filter(m => m.status === 'passed')
      .reduce((s, m) => s + (m.credits ?? 0), 0)
    const creditsPct = Math.round((creditsEarned / totalCredits) * 100)

    const passed     = modules.filter(m => m.status === 'passed')
    const failed     = modules.filter(m => m.status === 'failed')
    const inProgress = modules.filter(m => m.status === 'in_progress')

    const context = `
Student: ${profile?.full_name?.split(' ')[0] ?? 'Student'} at ${profile?.university ?? 'South African university'}
Degree: ${degreeName}
Current year of study: Year ${currentYear} of ${maxYears}
Calendar year: ${calYear}
Exclusion mark: ${exclusionMark}%

Credits: ${creditsEarned}/${totalCredits} earned (${creditsPct}%)
Modules passed (${passed.length}):
${passed.map(m => `- ${m.module_code} ${m.module_name}: ${m.grade ?? '?'}% (${m.credits} cr, Year ${m.year_taken})`).join('\n') || '  None'}

Modules failed (${failed.length}):
${failed.map(m => `- ${m.module_code} ${m.module_name}: ${m.grade ?? '?'}% (${m.credits} cr, Year ${m.year_taken})`).join('\n') || '  None'}

Modules in progress (${inProgress.length}):
${inProgress.map(m => `- ${m.module_code} ${m.module_name} (${m.credits} cr, Year ${m.year_taken}${m.grade != null ? `, current: ${m.grade}%` : ''})`).join('\n') || '  None'}
`.trim()

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      tools: [
        {
          name: 'graduation_plan',
          description: 'Return a structured graduation optimisation plan for this South African student.',
          input_schema: {
            type: 'object' as const,
            properties: {
              headline:       { type: 'string', description: 'One punchy sentence summarising the student\'s graduation outlook (max 80 chars).' },
              summary:        { type: 'string', description: 'Two sentences: current standing + overall recommendation.' },
              gaps:           { type: 'array', items: { type: 'string' }, description: 'List of specific gaps — failed modules to repeat, missing credits, etc. Max 4 items.' },
              nextSemester:   { type: 'array', items: { type: 'string' }, description: 'Concrete modules or actions to prioritise next semester. Max 4 items.' },
              risks:          { type: 'array', items: { type: 'string' }, description: 'Academic risks that could delay graduation. Max 3 items.' },
              graduationYear: { type: 'number', description: 'Estimated calendar year of graduation at current pace.' },
              onTrack:        { type: 'boolean', description: 'True if on track to graduate within the max allowed years.' },
            },
            required: ['headline', 'summary', 'gaps', 'nextSemester', 'risks', 'graduationYear', 'onTrack'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'graduation_plan' },
      system: 'You are an academic advisor for South African university students. Analyse the student\'s academic record and return a practical, honest graduation optimisation plan. Use South African context (N+ rule, NSFAS funding risk, DHET regulations). Be direct and specific — reference actual module codes and numbers.',
      messages: [{ role: 'user', content: context }],
    })

    const toolBlock = response.content.find(b => b.type === 'tool_use')
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return NextResponse.json({ error: 'No plan generated' }, { status: 500 })
    }

    const plan = toolBlock.input as GradPlan
    return NextResponse.json({ ...plan, insufficientData: false })
  } catch (error) {
    console.error('[graduation/optimize]', error)
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}
