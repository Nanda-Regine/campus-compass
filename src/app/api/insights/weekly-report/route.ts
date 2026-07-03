export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimitAsync } from '@/lib/rateLimit'

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekBounds(): { startStr: string; startTs: string; label: string } {
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day  // days back to Monday
  const start = new Date(now)
  start.setDate(now.getDate() + diff)
  start.setHours(0, 0, 0, 0)
  return {
    startStr: isoDate(start),
    startTs:  start.toISOString(),
    label:    start.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }),
  }
}

function computeSleepHrs(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  let hrs = (wh + wm / 60) - (bh + bm / 60)
  if (hrs < 0) hrs += 24
  return hrs
}

// ─── GET /api/insights/weekly-report ──────────────────────────

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Per-user daily ceiling on this AI (Anthropic) route — caps cost/abuse at scale.
  const { allowed } = await checkRateLimitAsync(user.id, 'ai-weekly-report', 10, 86_400_000)
  if (!allowed) return NextResponse.json({ error: 'Daily report limit reached — try again tomorrow.' }, { status: 429 })

  const { startStr, startTs, label } = getWeekBounds()
  const todayStr = isoDate(new Date())

  const [studyRes, tasksRes, moodRes, sleepRes, cardsRes, contractsRes] = await Promise.allSettled([
    supabase
      .from('study_sessions')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .gte('started_at', startTs),
    supabase
      .from('tasks')
      .select('status')
      .eq('user_id', user.id)
      .gte('due_date', startStr)
      .lte('due_date', todayStr),
    supabase
      .from('mood_checkins')
      .select('mood_score')
      .eq('user_id', user.id)
      .gte('date', startStr),
    supabase
      .from('sleep_logs')
      .select('bedtime, wake_time')
      .eq('user_id', user.id)
      .gte('sleep_date', startStr),
    supabase
      .from('flashcard_cards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('last_review', startStr),
    supabase
      .from('commitment_contracts')
      .select('status')
      .eq('user_id', user.id)
      .gte('created_at', startTs),
  ])

  const studyRows     = studyRes.status     === 'fulfilled' ? (studyRes.value.data     ?? []) : []
  const taskRows      = tasksRes.status     === 'fulfilled' ? (tasksRes.value.data     ?? []) : []
  const moodRows      = moodRes.status      === 'fulfilled' ? (moodRes.value.data      ?? []) : []
  const sleepRows     = sleepRes.status     === 'fulfilled' ? (sleepRes.value.data     ?? []) : []
  const cardsCount    = cardsRes.status     === 'fulfilled' ? (cardsRes.value.count    ?? 0)  : 0
  const contractRows  = contractsRes.status === 'fulfilled' ? (contractsRes.value.data ?? []) : []

  const studyMins       = studyRows.reduce((s, r) => s + ((r.duration_minutes as number) ?? 0), 0)
  const sessionCount    = studyRows.length
  const tasksTotal      = taskRows.length
  const tasksCompleted  = taskRows.filter(r => r.status === 'done').length
  const moodScores      = moodRows.map(r => r.mood_score as number)
  const moodAvg         = moodScores.length > 0 ? moodScores.reduce((s, v) => s + v, 0) / moodScores.length : 0
  const sleepHrsArr     = sleepRows
    .filter(r => r.bedtime && r.wake_time)
    .map(r => computeSleepHrs(r.bedtime as string, r.wake_time as string))
  const sleepAvg        = sleepHrsArr.length > 0 ? sleepHrsArr.reduce((s, v) => s + v, 0) / sleepHrsArr.length : 0

  const stats = {
    studyMins,
    sessionCount,
    tasksCompleted,
    tasksTotal,
    moodAvg:          Math.round(moodAvg * 10) / 10,
    moodCount:        moodScores.length,
    sleepAvg:         Math.round(sleepAvg * 10) / 10,
    sleepCount:       sleepHrsArr.length,
    cardsReviewed:    cardsCount as number,
    contractsCompleted: contractRows.filter(r => r.status === 'completed').length,
    contractsFailed:    contractRows.filter(r => r.status === 'failed').length,
  }

  // Build context lines for Nova
  const lines: string[] = []
  const studyH = Math.floor(studyMins / 60), studyM = studyMins % 60
  if (studyMins > 0) lines.push(`Study: ${studyH}h ${studyM}m across ${sessionCount} session${sessionCount !== 1 ? 's' : ''}`)
  else               lines.push('Study: no study sessions logged this week')
  if (tasksTotal > 0)          lines.push(`Tasks: ${tasksCompleted}/${tasksTotal} completed (${Math.round(tasksCompleted / tasksTotal * 100)}%)`)
  if (moodScores.length > 0)   lines.push(`Mood: ${moodAvg.toFixed(1)}/5 average over ${moodScores.length} check-in${moodScores.length !== 1 ? 's' : ''}`)
  if (sleepHrsArr.length > 0)  lines.push(`Sleep: ${sleepAvg.toFixed(1)}h/night average over ${sleepHrsArr.length} night${sleepHrsArr.length !== 1 ? 's' : ''}`)
  if ((cardsCount as number) > 0) lines.push(`Flashcards: ${cardsCount} cards reviewed`)
  if (stats.contractsCompleted > 0 || stats.contractsFailed > 0) {
    lines.push(`Commitment contracts: ${stats.contractsCompleted} completed, ${stats.contractsFailed} failed`)
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return NextResponse.json({ weekStart: startStr, weekLabel: label, stats, summary: null, tip: null })
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey })

  const prompt = `You are Nova, VarsityOS's caring AI for South African students.

Week of ${label} — student's numbers:
${lines.map(l => `- ${l}`).join('\n')}

Respond with ONLY a JSON object — no markdown, no preamble:
{
  "summary": "2 sentences. Acknowledge one specific win from the data, then name the biggest gap to close. Warm but honest. SA-relevant.",
  "tip": "One specific action for next week (max 12 words). Start with a verb. Make it concrete."
}

Rules:
- If study time is 0, address it — do not soft-pedal
- If task completion < 50%, call it out and encourage
- If mood avg < 3, lead with care before academics
- If sleep avg < 6h, flag the impact on performance
- tip must be doable Monday morning`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('no JSON')
    const parsed = JSON.parse(match[0]) as { summary?: string; tip?: string }
    return NextResponse.json({
      weekStart: startStr,
      weekLabel: label,
      stats,
      summary: parsed.summary ?? null,
      tip:     parsed.tip     ?? null,
    })
  } catch {
    return NextResponse.json({ weekStart: startStr, weekLabel: label, stats, summary: null, tip: null })
  }
}
