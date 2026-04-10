import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { currentMonthRange } from '@/lib/utils'
import { checkRateLimit } from '@/lib/rateLimit'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function GET(_request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit: max 5 budget analyses per minute
    const rateCheck = checkRateLimit(user.id, 'budget-insights', 5, 60_000)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests — please wait a moment' }, { status: 429 })
    }

    const { start, end } = currentMonthRange()
    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dayOfMonth = now.getDate()
    const daysLeft = daysInMonth - dayOfMonth

    const [
      { data: budget },
      { data: expenses },
      { data: profile },
    ] = await Promise.all([
      supabase.from('budgets').select('*').eq('user_id', user.id).single(),
      supabase.from('expenses').select('*').eq('user_id', user.id).gte('expense_date', start).lte('expense_date', end),
      supabase.from('profiles').select('funding_type, university, year_of_study, ai_language').eq('id', user.id).single(),
    ])

    if (!budget || !expenses) {
      return NextResponse.json({ error: 'No budget data found' }, { status: 404 })
    }

    const totalBudget = budget.monthly_budget +
      (budget.nsfas_enabled ? budget.nsfas_living + budget.nsfas_accom + budget.nsfas_books : 0)
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
    const remaining = totalBudget - totalSpent
    const spentPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

    const categoryTotals: Record<string, number> = {}
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
    })

    const categoryBreakdown = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount]) => `${cat}: R${amount.toFixed(0)} (${Math.round((amount / totalSpent) * 100)}%)`)
      .join(', ')

    const language = profile?.ai_language || 'English'
    const langLine = language !== 'English' ? `\nRESPONSE LANGUAGE: ${language} — write all human-readable text values in ${language}. Keep JSON field names and enum values (like "excellent", "good", "tight", "critical") in English.` : ''

    const prompt = `You are a financial wellness coach for South African university students. Analyse this student's financial situation and provide actionable advice.${langLine}

STUDENT CONTEXT:
- University: ${profile?.university || 'SA University'}
- Year: ${profile?.year_of_study || 'unknown'}
- Funding type: ${profile?.funding_type || 'unknown'}
- NSFAS: ${budget.nsfas_enabled ? 'YES' : 'NO'}

FINANCIAL DATA (${now.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}):
- Monthly budget: R${totalBudget.toFixed(0)}
- Spent so far: R${totalSpent.toFixed(0)} (${spentPct}%)
- Remaining: R${remaining.toFixed(0)}
- Days left in month: ${daysLeft}
- Daily budget remaining: R${daysLeft > 0 ? (remaining / daysLeft).toFixed(0) : '0'}
- Spending by category: ${categoryBreakdown || 'No expenses logged yet'}
${budget.nsfas_enabled ? `- NSFAS breakdown — Living: R${budget.nsfas_living}, Accommodation: R${budget.nsfas_accom}, Books: R${budget.nsfas_books}` : ''}

TASK: Respond with valid JSON only (no markdown). Use this exact structure:
{
  "healthScore": <number 1-10>,
  "healthLabel": <"excellent" | "good" | "tight" | "critical">,
  "summary": <1 sentence, warm and honest assessment>,
  "tips": [
    { "icon": <emoji>, "title": <short title>, "detail": <1-2 sentences of SA-specific actionable advice> },
    { "icon": <emoji>, "title": <short title>, "detail": <1-2 sentences of SA-specific actionable advice> },
    { "icon": <emoji>, "title": <short title>, "detail": <1-2 sentences of SA-specific actionable advice> }
  ],
  "projectedEndBalance": <number, estimated rand balance at month end based on current pace>,
  "biggestSpendCategory": <category name or "None yet">,
  "savingOpportunity": <1 sentence specific saving tip based on their top category>
}`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const clean = rawText.replace(/```json|```/g, '').trim()
    const insights = JSON.parse(clean)

    return NextResponse.json({
      insights,
      budgetData: {
        total: totalBudget,
        spent: totalSpent,
        remaining,
        spentPct,
        daysLeft,
        categoryTotals,
      },
    })
  } catch (error) {
    console.error('Budget insights error:', error)
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
  }
}

// NSFAS Appeal Letter Generator
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateCheck = checkRateLimit(user.id, 'nsfas-appeal', 3, 60_000)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests — please wait a moment' }, { status: 429 })
    }

    const body = await request.json()
    const rawSituation: unknown = body?.situation
    const situation = typeof rawSituation === 'string' ? rawSituation.slice(0, 1000) : ''
    const appealType: string = body?.appealType || 'General appeal'

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, university, year_of_study, faculty, funding_type, ai_language')
      .eq('id', user.id)
      .single()

    const appealLang = profile?.ai_language || 'English'
    const appealLangNote = appealLang !== 'English' ? `\nWrite the letter in ${appealLang}.` : ''

    const prompt = `Draft a formal NSFAS appeal letter for a South African student.${appealLangNote}

STUDENT INFO:
- Name: ${profile?.name || '[Student Name]'}
- University: ${profile?.university || '[University]'}
- Year: ${profile?.year_of_study || '[Year]'}
- Faculty: ${profile?.faculty || '[Faculty]'}
- Appeal type: ${appealType}
- Situation: ${situation}

Write a professional, empathetic appeal letter that:
1. Uses proper formal letter format
2. Clearly states the appeal grounds
3. References relevant NSFAS policy sections where applicable
4. Is factual and unemotional in tone
5. Requests a specific outcome
6. Is approximately 250-350 words

Format as plain text with proper paragraph spacing. Include placeholder brackets for info the student needs to fill in like [Student Number], [Date], etc.`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const letter = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ letter })
  } catch (error) {
    console.error('NSFAS appeal error:', error)
    return NextResponse.json({ error: 'Failed to generate appeal letter' }, { status: 500 })
  }
}
