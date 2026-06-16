import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase
    .from('past_papers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { module_code, module_name, year, paper_type, institution, extracted_text } = body

  let ai_insights = null
  if (extracted_text && process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Analyse this past exam paper for a South African student studying ${module_name} (${module_code}).

Paper text:
${extracted_text.slice(0, 3000)}

Return ONLY valid JSON with this exact structure:
{
  "topTopics": [{"topic": "string", "frequency": number, "yearsAppeared": [number]}],
  "likelyQuestions": ["string"],
  "studyTips": ["string"],
  "difficultyLevel": "easy|medium|hard",
  "estimatedPrepHours": number
}

Rules: topTopics max 6 items, likelyQuestions exactly 5, studyTips exactly 3, estimatedPrepHours between 5 and 40.`
        }]
      })
      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) ai_insights = JSON.parse(jsonMatch[0])
    } catch (e) {
      console.error('AI analysis failed:', e)
    }
  }

  const { data, error } = await supabase
    .from('past_papers')
    .insert({
      user_id: user.id,
      module_code,
      module_name,
      year: Number(year),
      paper_type,
      institution: institution || null,
      extracted_text: extracted_text || null,
      ai_insights,
      question_count: ai_insights?.likelyQuestions?.length || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
