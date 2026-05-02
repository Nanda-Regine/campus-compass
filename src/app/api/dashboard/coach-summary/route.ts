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

    const rateCheck = checkRateLimit(user.id, 'dashboard-coach-summary', 3, 3_600_000)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded — try again in an hour' }, { status: 429 })
    }

    const body = await request.json()
    const totalBudget: number = Number(body?.totalBudget ?? 0)
    const amountSpent: number = Number(body?.amountSpent ?? 0)
    const percentUsed: number = Number(body?.percentUsed ?? 0)
    const topCategories: string = String(body?.topCategories ?? 'General').slice(0, 120)
    const daysRemaining: number = Number(body?.daysRemaining ?? 30)
    const savingsGoals: string = String(body?.savingsGoals ?? 'None').slice(0, 120)

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: `You are Nova, VarsityOS's AI companion for SA university students. Generate exactly 3 financial coaching insights based on the student's budget data. Each insight must have one of these tags: 'Watch out', 'Money tip', 'Goal progress', 'Well done'. Return JSON only (no markdown): { "insights": [{ "tag": string, "text": string }] }. Keep each insight under 18 words. Be specific, practical, and encouraging for SA students managing tight budgets.`,
      messages: [{ role: 'user', content: `Budget: R${totalBudget}, Spent: R${amountSpent} (${percentUsed}%), Top categories: ${topCategories}, Days remaining: ${daysRemaining}, Savings goals: ${savingsGoals}` }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const clean = rawText.replace(/```json|```/g, '').trim()
    const data = JSON.parse(clean)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Coach summary error:', error)
    return NextResponse.json({ error: 'Failed to generate coach summary' }, { status: 500 })
  }
}
