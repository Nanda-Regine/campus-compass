export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const ANSWER_LABELS = [
  ['0–1 week behind', '2–3 weeks behind', '4–5 weeks behind', '6+ weeks behind'],
  ['30 min/day', '1 hr/day', '2 hrs/day', '3+ hrs/day'],
  ["Don't understand basics", 'Too much content', 'No notes / missed classes', 'Test anxiety'],
  ['Within a week', '2–3 weeks', '4–6 weeks', '6+ weeks'],
  ['Flashcards/memory', 'Past papers', 'Group study', 'Video tutorials'],
]

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { module, answers } = await req.json() as { module: string; answers: string[] }
    if (!module || !Array.isArray(answers)) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { data: profile } = await supabase.from('profiles').select('university,year_of_study').eq('id', user.id).single()

    const context = answers.map((a, i) => `Q${i + 1}: ${a}`).join('\n')
    const prompt = `You are Nova, VarsityOS's AI study companion for South African students.

A student needs a catch-up plan for their module: **${module}**
${profile?.university ? `University: ${profile.university}` : ''}${profile?.year_of_study ? `, Year ${profile.year_of_study}` : ''}

Their situation:
${context}

Write a practical, compassionate 5-step catch-up plan. Each step should be:
- Specific and actionable (not generic advice)
- Realistic for a student with limited time
- SA-context aware (load shedding, data costs, shared accommodation)
- Maximum 2 sentences per step

Format: Return ONLY the steps as a JSON array of strings, no other text. Example: ["Step 1...", "Step 2...", ...]`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : null
    if (!text) return NextResponse.json({ error: 'No response' }, { status: 500 })

    // Parse the array
    const match = text.match(/\[[\s\S]*\]/)
    const steps = match ? JSON.parse(match[0]) as string[] : null
    if (!steps || !Array.isArray(steps)) return NextResponse.json({ error: 'Parse failed' }, { status: 500 })

    return NextResponse.json({ plan: steps.join('\n\n') })
  } catch (e) {
    console.error('[nova/catchup]', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
