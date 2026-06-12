export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================
// POST /api/orchestration/generate-plan
// Streams a Nova-powered daily plan or 30-day catch-up plan.
// Body: { mode: 'day' | 'catchup', context: StudentStateSnapshot }
// ============================================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

interface PlanContext {
  riskLevel?:        string
  catchUpDebtHrs?:   number
  completionRate?:   number
  examPressure?:     number
  burnoutScore?:     number
  procrastIndex?:    number
  overdueTaskCount?: number
  atRiskModules?:    string[]
  todayTasks?:       { title: string; priority: string; module?: string }[]
  runwayDays?:       number
  dayMode?:          string
}

function buildDayPlanPrompt(ctx: PlanContext): string {
  const tasks = ctx.todayTasks?.map(t => `- ${t.title} [${t.priority}]${t.module ? ` (${t.module})` : ''}`).join('\n') ?? 'No tasks logged yet.'

  return `You are Nova, the AI life advisor inside VarsityOS — a super-app for South African university students.

Generate a focused daily plan for this student. Be practical, warm, and brief.

STUDENT STATE:
- Day mode: ${ctx.dayMode ?? 'study'}
- Tasks due today:
${tasks}
- Burnout score: ${ctx.burnoutScore ?? 0}/100${(ctx.burnoutScore ?? 0) > 60 ? ' (recovery needed)' : ''}
- Financial runway: ${ctx.runwayDays ?? 'unknown'} days

FORMAT:
1. One-sentence energy check (honest, not generic)
2. TODAY'S 3 PRIORITIES — numbered, specific, achievable
3. One micro-recovery tip if burnout > 50
4. One closing encouragement (Ubuntu-style, not corporate)

Keep it under 180 words. No headers. No fluff. Talk to them, not at them.`
}

function buildCatchUpPrompt(ctx: PlanContext): string {
  const modules = ctx.atRiskModules?.join(', ') ?? 'unknown modules'

  return `You are Nova, the AI life advisor inside VarsityOS — a super-app for South African university students.

A student is in academic recovery mode. Build them a realistic 30-day catch-up plan.

STUDENT STATE:
- Academic risk: ${ctx.riskLevel ?? 'warning'}
- Catch-up debt: ${ctx.catchUpDebtHrs ?? 0} hours of overdue work
- Task completion rate: ${ctx.completionRate ?? 0}%
- Exam pressure score: ${ctx.examPressure ?? 0}/100
- Burnout score: ${ctx.burnoutScore ?? 0}/100
- Procrastination index: ${ctx.procrastIndex ?? 0}%
- Overdue tasks: ${ctx.overdueTaskCount ?? 0}
- At-risk modules: ${modules}

BUILD A 30-DAY RECOVERY PLAN:

Week 1 — Stabilise (what to do in the next 7 days, specifically)
Week 2 — Accelerate (build momentum)
Week 3 — Consolidate (catch up the most critical modules)
Week 4 — Prepare (exam-ready sprint)

For each week:
- 3 specific daily actions
- Recommended daily study hours (realistic for burnout level)
- One non-negotiable habit

End with: "Will I Pass?" — give honest math on their situation.

Tone: honest, warm, Ubuntu. No corporate motivational poster language.
Max 350 words.`
}

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const mode: 'day' | 'catchup' = body.mode ?? 'day'
  const context: PlanContext = body.context ?? {}

  const prompt = mode === 'catchup'
    ? buildCatchUpPrompt(context)
    : buildDayPlanPrompt(context)

  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    stream: true,
    messages: [{ role: 'user', content: prompt }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        const line = `data: ${JSON.stringify(event)}\n\n`
        controller.enqueue(encoder.encode(line))
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}
