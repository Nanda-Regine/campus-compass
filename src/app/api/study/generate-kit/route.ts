export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { groqUnconfiguredResponse } from '@/lib/groq'
import { checkRateLimitAsync } from '@/lib/rateLimit'

const GROQ_BASE  = 'https://api.groq.com/openai/v1'
const KIT_MODEL  = 'llama-3.3-70b-versatile'   // better JSON adherence than 8b
const MAX_TEXT   = 5000
const MIN_TEXT   = 50

export async function POST(request: NextRequest) {
 try {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Shared (Upstash-backed) limiter — the old in-memory Map reset on every cold
  // start, so the Groq key was effectively unprotected at scale.
  const rl = await checkRateLimitAsync(user.id, 'generate-kit', 5, 5 * 60 * 1000)
  if (!rl.allowed)
    return NextResponse.json({ error: 'Rate limit: 5 generations per 5 minutes' }, { status: 429 })

  const key = process.env.GROQ_API_KEY
  if (!key) return groqUnconfiguredResponse()

  const body = await request.json().catch(() => null) as { text?: unknown; subject?: unknown } | null
  const text = body?.text
  const subject = body?.subject
  if (!text || typeof text !== 'string')
    return NextResponse.json({ error: 'text required' }, { status: 400 })

  const trimmed = String(text).trim()
  if (trimmed.length < MIN_TEXT)
    return NextResponse.json({ error: `Notes must be at least ${MIN_TEXT} characters` }, { status: 400 })

  const safeText = trimmed.slice(0, MAX_TEXT)
  const subjectHint = subject ? ` The subject is: ${String(subject).slice(0, 80)}.` : ''

  const systemPrompt = `You are an expert study assistant helping South African university students.
Generate a structured study kit from lecture notes.${subjectHint}
Output ONLY valid JSON — no markdown, no backticks, no extra text.`

  const userPrompt = `From these lecture notes, generate a study kit:

${safeText}

Return ONLY this JSON (no other text):
{
  "summary": "2-3 sentence overview of the key ideas",
  "key_concepts": ["concept 1", "concept 2", "concept 3", "concept 4", "concept 5", "concept 6", "concept 7", "concept 8"],
  "flashcards": [
    {"front": "Question or term?", "back": "Answer or definition"},
    ...10 cards total...
  ],
  "quiz": [
    {
      "question": "Question?",
      "options": ["A. option", "B. option", "C. option", "D. option"],
      "answer": "A",
      "explanation": "Why A is correct"
    },
    ...5 questions total...
  ]
}`

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: KIT_MODEL,
      max_tokens: 2500,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('Groq error', res.status, body.slice(0, 300))
    return NextResponse.json({ error: 'AI generation failed. Try again shortly.' }, { status: 502 })
  }

  const groqData = await res.json() as { choices: Array<{ message: { content: string } }> }
  const raw = groqData.choices[0]?.message?.content ?? ''

  let kit: {
    summary: string
    key_concepts: string[]
    flashcards: Array<{ front: string; back: string }>
    quiz: Array<{ question: string; options: string[]; answer: string; explanation: string }>
  }

  try {
    kit = JSON.parse(raw)
  } catch {
    // Try to extract a JSON block if the model added surrounding text.
    const match = raw.match(/\{[\s\S]*\}/)
    try {
      if (!match) throw new Error('no json')
      kit = JSON.parse(match[0])
    } catch {
      return NextResponse.json({ error: 'AI returned invalid format. Try again.' }, { status: 502 })
    }
  }

  // Sanitise output
  const sanitised = {
    summary:      typeof kit.summary === 'string' ? kit.summary.slice(0, 600) : '',
    key_concepts: Array.isArray(kit.key_concepts)
      ? kit.key_concepts.slice(0, 10).map((c: unknown) => String(c).slice(0, 100))
      : [],
    flashcards: Array.isArray(kit.flashcards)
      ? kit.flashcards.slice(0, 12).map((c: { front?: unknown; back?: unknown }) => ({
          front: String(c.front ?? '').slice(0, 200),
          back:  String(c.back  ?? '').slice(0, 400),
        })).filter(c => c.front && c.back)
      : [],
    quiz: Array.isArray(kit.quiz)
      ? kit.quiz.slice(0, 6).map((q: { question?: unknown; options?: unknown; answer?: unknown; explanation?: unknown }) => ({
          question:    String(q.question    ?? '').slice(0, 300),
          options:     Array.isArray(q.options) ? q.options.slice(0, 4).map((o: unknown) => String(o).slice(0, 150)) : [],
          answer:      String(q.answer      ?? '').slice(0, 10),
          explanation: String(q.explanation ?? '').slice(0, 400),
        })).filter(q => q.question && q.options.length > 0)
      : [],
  }

  return NextResponse.json(sanitised)
 } catch (err) {
  console.error('[generate-kit]', err)
  return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
 }
}
