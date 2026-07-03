import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { callGroq, GroqMissingKeyError } from '@/lib/groq'
import { checkRateLimitAsync } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

interface DecompStep { id: string; title: string; minutes: number }

export async function POST(req: Request) {
  let taskTitle = 'this task'
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Guard the shared Groq key (14,400/day) — one user can't exhaust it for all.
    const limit = await checkRateLimitAsync(user.id, 'tasks-decompose', 40, 86_400_000)
    if (!limit.allowed) return NextResponse.json({ error: 'Daily limit reached — try again tomorrow' }, { status: 429 })

    const { title, description } = await req.json() as { title?: string; description?: string }
    if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })
    taskTitle = title.trim()

    const context = description?.trim() ? ` Additional context: ${description.trim()}` : ''

    const raw = await callGroq([
      {
        role: 'system',
        content:
          'You are an anti-procrastination coach. Break tasks into the smallest possible concrete steps. ' +
          'Each step must be completable in under 15 minutes. ' +
          'Respond ONLY with a valid JSON array, no markdown, no explanation. ' +
          'Format: [{"title":"step text","minutes":5}, ...]. Maximum 6 steps.',
      },
      {
        role: 'user',
        content: `Break this task into micro-steps: "${title.trim()}"${context}`,
      },
    ], { temperature: 0.4, maxTokens: 400 })

    // Parse JSON from response
    const match = raw.match(/\[[\s\S]*\]/)
    if (!match) return NextResponse.json({ steps: fallbackSteps(title) })

    const parsed = JSON.parse(match[0]) as Array<{ title: string; minutes: number }>
    const steps: DecompStep[] = parsed
      .filter(s => s.title && s.minutes)
      .slice(0, 6)
      .map((s, i) => ({
        id: `step-${i}`,
        title: String(s.title).slice(0, 120),
        minutes: Math.max(1, Math.min(15, Number(s.minutes))),
      }))

    return NextResponse.json({ steps: steps.length ? steps : fallbackSteps(title) })
  } catch (e) {
    if (!(e instanceof GroqMissingKeyError)) console.error('[tasks/decompose]', e)
    // Always return fallback steps — feature should work even without Groq key
    return NextResponse.json({ steps: fallbackSteps(taskTitle) })
  }
}

function fallbackSteps(title: string): DecompStep[] {
  return [
    { id: 'step-0', title: `Open your notes and read about "${title}"`, minutes: 5 },
    { id: 'step-1', title: 'Write down 3 things you already know about this topic', minutes: 5 },
    { id: 'step-2', title: 'Identify the one thing you need to understand first', minutes: 5 },
    { id: 'step-3', title: 'Work on just that one thing for 10 minutes', minutes: 10 },
  ]
}
