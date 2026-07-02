export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { anthropicUnconfiguredResponse } from '@/lib/anthropic'
import { checkRateLimitAsync } from '@/lib/rateLimit'

interface StateSnapshot {
  academic: {
    riskLevel: string
    completionRate: number
    catchUpDebtHrs: number
    examPressure: number
    studyVelocity: number
  }
  financial: {
    runwayDays: number
    healthScore: number
    nsfasStatus: string
    emergencyMode: boolean
  }
  wellness: {
    burnoutScore: number
    moodTrend: string
    moodAvg: number
    sleepDebt: number
    recoveryNeeded: boolean
  }
  schedule: {
    todayTaskCount: number
    procrastIndex: number
    planCoverage: number
  }
  profile?: {
    firstName: string
    university?: string
  }
}

export async function POST(req: NextRequest) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return anthropicUnconfiguredResponse()
  const anthropic = new Anthropic({ apiKey: anthropicKey })
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Per-user daily ceiling on this AI (Anthropic) route — caps cost/abuse at scale.
  const { allowed } = await checkRateLimitAsync(user.id, 'ai-proactive-brief', 20, 86_400_000)
  if (!allowed) return NextResponse.json({ error: 'Daily brief limit reached — try again tomorrow.' }, { status: 429 })

  let snapshot: StateSnapshot
  try {
    snapshot = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { academic, financial, wellness, schedule, profile } = snapshot
  const firstName = profile?.firstName ?? 'there'

  const contextLines: string[] = []

  const riskLevel = academic?.riskLevel ?? 'safe'
  const catchUpDebtHrs = academic?.catchUpDebtHrs ?? 0
  const completionRate = academic?.completionRate ?? 0
  const examPressure = academic?.examPressure ?? 0
  const studyVelocity = academic?.studyVelocity ?? 0
  const emergencyMode = financial?.emergencyMode ?? false
  const runwayDays = financial?.runwayDays ?? 0
  const healthScore = financial?.healthScore ?? 100
  const burnoutScore = wellness?.burnoutScore ?? 0
  const moodAvg = wellness?.moodAvg ?? 0
  const moodTrend = wellness?.moodTrend ?? 'unknown'
  const sleepDebt = wellness?.sleepDebt ?? 0
  const procrastIndex = schedule?.procrastIndex ?? 0
  const todayTaskCount = schedule?.todayTaskCount ?? 0

  if (riskLevel === 'critical' || riskLevel === 'warning') {
    contextLines.push(`Academic risk: ${riskLevel} (${catchUpDebtHrs}h of overdue work, ${completionRate}% completion rate)`)
  } else {
    contextLines.push(`Academic: on track — ${completionRate}% completion rate`)
  }

  if (examPressure >= 65) {
    contextLines.push(`Exam pressure: HIGH (${examPressure}/100) — exam coming up`)
  }

  if (studyVelocity > 0) {
    contextLines.push(`Study velocity: ${studyVelocity.toFixed(1)} hours/day average (last 7 days)`)
  }

  if (emergencyMode) {
    contextLines.push(`Financial: EMERGENCY — ${runwayDays} days of money left`)
  } else if (healthScore < 50) {
    contextLines.push(`Financial: budget health ${healthScore}/100 — spending too fast`)
  } else {
    contextLines.push(`Financial: budget healthy at ${healthScore}/100, ${runwayDays} days runway`)
  }

  contextLines.push(`Wellness: burnout ${burnoutScore}/100, mood ${moodAvg > 0 ? `${moodAvg.toFixed(1)}/5 (${moodTrend})` : 'unknown'}, sleep debt ${sleepDebt.toFixed(0)}h`)

  if (procrastIndex > 50) {
    contextLines.push(`Schedule: ${procrastIndex}% of due tasks are overdue — procrastination pattern detected`)
  }

  if (todayTaskCount > 0) {
    contextLines.push(`Today: ${todayTaskCount} task${todayTaskCount > 1 ? 's' : ''} due`)
  }

  const prompt = `You are Nova, the caring AI companion built into VarsityOS for South African students.

Here is ${firstName}'s current life OS snapshot for today:
${contextLines.map(l => `- ${l}`).join('\n')}

Generate a daily brief for ${firstName}. Be direct, warm, and SA-relevant. Avoid generic advice.

Respond with a JSON object with exactly these fields:
{
  "headline": "One sentence that captures the most important thing about today (max 12 words)",
  "bullets": ["bullet 1 — specific, actionable (max 15 words)", "bullet 2", "bullet 3"],
  "focus": "The single most important task or action for today (max 10 words)",
  "focusRoute": "/study | /budget | /sleep | /health | /nova (pick the most relevant)"
}

Rules:
- headline must address the highest-priority signal (critical > warning > watch)
- Each bullet references a different life domain (academic, financial, wellness)
- focus is what they should do FIRST today — be specific, not vague
- If burnout > 70, include rest in the bullets
- If sleepDebt > 10, mention sleep
- If examPressure > 80, make the focus study-related
- Tone: like a wise older sibling, not a corporate app`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const parsed = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      headline:   parsed.headline ?? 'Here is your day at a glance.',
      bullets:    Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 3) : [],
      focus:      parsed.focus ?? 'Check your tasks for today.',
      focusRoute: parsed.focusRoute ?? '/study',
    })
  } catch {
    return NextResponse.json({
      headline: `${firstName}, here is your day.`,
      bullets: [
        riskLevel !== 'safe' ? `${catchUpDebtHrs}h of catch-up work — tackle the oldest task first` : `${completionRate}% on track — keep the momentum`,
        emergencyMode ? `Budget emergency: ${runwayDays} days left — switch to survival mode` : `Budget healthy — ${runwayDays} days runway`,
        burnoutScore > 60 ? 'Burnout building — block 30min rest today, no exceptions' : 'Wellness looking okay — check in with how you feel',
      ],
      focus: riskLevel !== 'safe' ? 'Clear one overdue task before anything else' : 'Start today\'s highest-priority task',
      focusRoute: '/study',
    })
  }
}
