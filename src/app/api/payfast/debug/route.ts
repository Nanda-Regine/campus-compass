export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/payfast/debug — shows masked credentials so you can verify Vercel env vars
// Protected: only accessible when logged in
export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const mid  = process.env.PAYFAST_MERCHANT_ID  || ''
  const mkey = process.env.PAYFAST_MERCHANT_KEY || ''
  const pp   = process.env.PAYFAST_PASSPHRASE   || ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  return NextResponse.json({
    PAYFAST_SANDBOX:       process.env.PAYFAST_SANDBOX ?? '(not set)',
    PAYFAST_MERCHANT_ID:   mid  ? `${mid.slice(0, 3)}${'*'.repeat(Math.max(0, mid.length - 3))}` : '(not set)',
    PAYFAST_MERCHANT_KEY:  mkey ? `${mkey.slice(0, 4)}${'*'.repeat(Math.max(0, mkey.length - 4))}` : '(not set)',
    PAYFAST_PASSPHRASE:    pp   ? `${pp.slice(0, 2)}${'*'.repeat(Math.max(0, pp.length - 2))} (${pp.length} chars)` : '(not set — signature will skip passphrase)',
    NEXT_PUBLIC_APP_URL:   appUrl || '(not set — will use https://varsityos.co.za)',
    notify_url:            `${(appUrl || 'https://varsityos.co.za').replace(/\/$/, '')}/api/payfast/notify`,
  })
}
