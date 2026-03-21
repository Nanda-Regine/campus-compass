import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit: 6 receipt scans per minute
    const rl = checkRateLimit(user.id, 'receipt-ocr', 6, 60_000)
    if (!rl.allowed) return NextResponse.json({ error: 'Too many scans — wait a moment' }, { status: 429 })

    const formData = await request.formData()
    const file = formData.get('receipt') as File | null

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Image must be JPEG, PNG, or WebP' }, { status: 400 })
    if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: 'Image too large — max 5MB' }, { status: 400 })

    // Convert to base64 for Anthropic vision
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

    const { data: profile } = await supabase
      .from('profiles')
      .select('funding_type')
      .eq('id', user.id)
      .single()

    const { data: budget } = await supabase
      .from('budgets')
      .select('food_budget, nsfas_enabled')
      .eq('user_id', user.id)
      .single()

    const prompt = `You are an expense scanner for a South African student budget app. Analyse this receipt image and extract the expense details.

Student context:
- Funding: ${profile?.funding_type || 'unknown'}
- NSFAS student: ${budget?.nsfas_enabled ? 'yes' : 'no'}

Extract and return ONLY a valid JSON object with these fields (no markdown, no explanation, just JSON):
{
  "merchant": "store name (string, max 50 chars)",
  "total": number (the final total amount in ZAR, as a decimal),
  "date": "YYYY-MM-DD or null if not visible",
  "category": one of: "food", "transport", "books", "clothing", "health", "entertainment", "accommodation", "other",
  "items": ["item 1", "item 2"] (up to 5 main items, short strings),
  "confidence": "high" | "medium" | "low"
}

If you cannot read the receipt or it's not a receipt, return: {"error": "Could not read receipt"}
All amounts must be in ZAR (South African Rand). Do not include the R symbol in total.`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: prompt },
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    // Extract JSON safely
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Could not parse receipt' }, { status: 422 })

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: 'Invalid response from AI' }, { status: 422 })
    }

    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 422 })

    // Validate and sanitize response
    const result = {
      merchant: String(parsed.merchant || 'Unknown').slice(0, 50),
      total: typeof parsed.total === 'number' && parsed.total > 0 ? parsed.total : null,
      date: typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : new Date().toISOString().slice(0, 10),
      category: ['food', 'transport', 'books', 'clothing', 'health', 'entertainment', 'accommodation', 'other'].includes(String(parsed.category)) ? parsed.category : 'other',
      items: Array.isArray(parsed.items) ? (parsed.items as unknown[]).slice(0, 5).map(i => String(i).slice(0, 60)) : [],
      confidence: ['high', 'medium', 'low'].includes(String(parsed.confidence)) ? parsed.confidence : 'low',
    }

    if (!result.total) return NextResponse.json({ error: 'Could not read total from receipt' }, { status: 422 })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Receipt scan error:', error)
    return NextResponse.json({ error: 'Scan failed — try again' }, { status: 500 })
  }
}
