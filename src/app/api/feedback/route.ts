import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimitAsync } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Rate limit: prefer user ID (non-spoofable) over IP address
  const rateLimitKey = user?.id
    ? `user_${user.id}`
    : `ip_${req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous'}`
  const rateCheck = await checkRateLimitAsync(`feedback_${rateLimitKey}`, 'feedback', 5, 60 * 60 * 1000)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many submissions — please try again later.' }, { status: 429 })
  }

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
