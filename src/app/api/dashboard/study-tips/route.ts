import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit } from '@/lib/rateLimit'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateCheck = checkRateLimit(user.id, 'dashboard-study-tips', 3, 3_600_000)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded — try again in an hour' }, { status: 429 })
    }

    const body = await request.json()
    const examName: string = String(body?.examName ?? 'Upcoming exam').slice(0, 120)
    const examSubject: string = String(body?.examSubject ?? 'General').slice(0, 80)
    const daysUntil: number = Number(body?.daysUntil ?? 7)
    const degreeProgram: string = String(body?.degreeProgram ?? 'University').slice(0, 80)

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: `You are Nova, VarsityOS's AI companion for SA university students. Generate exactly 3 concise, practical study tips for a student preparing for their upcoming ${examSubject} exam in ${daysUntil} days. Each tip must be specific, actionable, and relevant to SA student life. Return JSON only (no markdown): { "tips": [{ "text": string, "source": string }] }. Keep each tip under 20 words. Source should be a short label like 'Memory science', 'Study strategy', 'SA student tip'.`,
      messages: [{ role: 'user', content: `Exam: ${examName}, Subject: ${examSubject}, Days until: ${daysUntil}, Degree: ${degreeProgram}` }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const clean = rawText.replace(/```json|```/g, '').trim()
    const data = JSON.parse(clean)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Study tips error:', error)
    return NextResponse.json({ error: 'Failed to generate study tips' }, { status: 500 })
  }
}
