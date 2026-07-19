export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimitAsync } from '@/lib/rateLimit'
import { assertGroqCapacity } from '@/lib/groq'

const CRISIS_WORDS = ['suicide', 'kill myself', 'end my life', 'self-harm', 'hurt myself', 'no reason to live']

const CRISIS_RESPONSE = `I hear you, and you're not alone in this. What you're carrying sounds incredibly heavy. Please reach out to SADAG right now: 0800 456 789 (free, 24/7). Your campus counselling service is also there for you — you deserve real support.`

// POST /api/wellbeing/reflect { entry_text, mood_score? }
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Shared (Upstash-backed) limiter — 5 reflections / 10 min + a daily cap.
  const rl = await checkRateLimitAsync(user.id, 'wellbeing-reflect', 5, 10 * 60 * 1000)
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit — wait a few minutes' }, { status: 429 })
  const rlDay = await checkRateLimitAsync(user.id, 'wellbeing-reflect-day', 20, 86_400_000)
  if (!rlDay.allowed) return NextResponse.json({ error: 'Daily limit reached — try again tomorrow' }, { status: 429 })

  const { entry_text } = await request.json().catch(() => ({})) as { entry_text?: string }
  if (!entry_text?.trim() || entry_text.trim().length < 10)
    return NextResponse.json({ error: 'Entry too short' }, { status: 400 })

  const lower = entry_text.toLowerCase()
  if (CRISIS_WORDS.some(w => lower.includes(w))) {
    return NextResponse.json({ reflection: CRISIS_RESPONSE, crisis: true })
  }

  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) return NextResponse.json({ reflection: 'Your feelings are valid. Take a breath — you showed up today, and that matters.' })

  try {
    // Global breaker on the shared Groq quota (this route uses raw fetch, so it
    // would otherwise bypass callGroq's breaker). On exhaustion the catch below
    // returns a warm fallback rather than an error.
    await assertGroqCapacity()
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 120,
        messages: [
          {
            role: 'system',
            content:
              'You are a warm, non-judgmental companion for South African university students. When a student shares a journal entry, respond with 2–3 warm sentences that acknowledge what they shared and offer gentle encouragement. Do NOT give advice. Do NOT diagnose. Do NOT ask questions. Just hold space warmly and honestly. Keep it under 90 words. Be human, not clinical.',
          },
          {
            role: 'user',
            content: `Journal entry: "${entry_text.slice(0, 1500)}"`,
          },
        ],
      }),
    })

    if (!resp.ok) throw new Error('Groq error')
    const d = await resp.json() as { choices: Array<{ message: { content: string } }> }
    const reflection = d.choices?.[0]?.message?.content?.trim() ?? 'Thank you for sharing. Your feelings are valid.'

    return NextResponse.json({ reflection, crisis: false })
  } catch {
    return NextResponse.json({ reflection: 'Thank you for showing up and writing this down. That takes courage. You\'re doing better than you think.' })
  }
}
