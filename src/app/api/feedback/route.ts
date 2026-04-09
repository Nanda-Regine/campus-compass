import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  // Rate limit: 5 feedback submissions per hour per IP
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous'
  const rateCheck = checkRateLimit(`feedback_${ip}`, 'feedback', 5, 60 * 60 * 1000)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many submissions — please try again later.' }, { status: 429 })
  }

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await req.json()
  const { rating, category, message } = body as { rating: unknown; category: unknown; message: unknown }

  if (
    typeof rating !== 'number' || rating < 1 || rating > 5 ||
    typeof message !== 'string' || !message.trim()
  ) {
    return NextResponse.json({ error: 'Invalid feedback' }, { status: 400 })
  }

  const ua = req.headers.get('user-agent') || ''
  const platform = ua.toLowerCase().includes('mobile') ? 'pwa_android' : 'web'

  const { error } = await supabase.from('app_feedback').insert({
    user_id:  user?.id ?? null,
    rating,
    category: typeof category === 'string' ? category : 'general',
    message:  message.trim().slice(0, 1000),
    platform,
    app_version: '1.0.0',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
