import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { anthropicUnconfiguredResponse } from '@/lib/anthropic'

export async function POST(req: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return anthropicUnconfiguredResponse()
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question, answer, job_type, industry } = await req.json()
  if (!question || !answer) return NextResponse.json({ error: 'Missing question or answer' }, { status: 400 })

  const client = new Anthropic({ apiKey: anthropicKey })
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    system: `You are an expert South African graduate recruiter evaluating interview answers.
Evaluate using the STAR method (Situation, Task, Action, Result).
Be encouraging but honest. Acknowledge the South African context.
Return ONLY valid JSON.`,
    messages: [{
      role: 'user',
      content: `Job type: ${job_type}, Industry: ${industry}
Question: ${question}
Candidate's answer: ${answer}

Score 1-5 and give feedback. Return JSON:
{
  "score": number,
  "what_worked": "1-2 sentences on strengths",
  "improve": "1-2 sentences on improvement",
  "example_answer": "2-3 sentence better answer using STAR method"
}`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const feedback = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 3, what_worked: 'Good attempt', improve: 'Use more specific examples', example_answer: 'In my role as a student, I faced... I took action by... The result was...' }
  return NextResponse.json({ data: feedback })
}
