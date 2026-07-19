/**
 * WhatsApp Bot Webhook — Meta WhatsApp Business API
 *
 * Setup:
 * 1. Create a Meta App at developers.facebook.com, add WhatsApp product
 * 2. Set META_WHATSAPP_APP_SECRET, META_WHATSAPP_ACCESS_TOKEN,
 *    META_WHATSAPP_PHONE_NUMBER_ID, META_WHATSAPP_VERIFY_TOKEN in .env.local
 * 3. In Meta dashboard → WhatsApp → Webhooks, set callback URL to:
 *    https://your-domain.co.za/api/whatsapp/webhook
 *    and paste your META_WHATSAPP_VERIFY_TOKEN as the Verify Token
 * 4. Subscribe to the "messages" webhook field
 *
 * Commands:
 *   /nova <question>  — Ask Nova AI anything
 *   /budget           — This month's spending summary
 *   /tasks            — Today's study sessions
 *   /exam             — Upcoming exam dates
 *   (anything else)   — Help message
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import crypto from 'crypto'
import { checkRateLimitAsync } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getAnthropic(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY not configured')
  return new Anthropic({ apiKey: key })
}

// ─── Meta HMAC-SHA256 signature verification ──────────────────────────────────
// Spec: https://developers.facebook.com/docs/graph-api/webhooks/getting-started
//
// Meta signs POST bodies with HMAC-SHA256 using the App Secret.
// Header: X-Hub-Signature-256: sha256=<hex_digest>

function verifyMetaSignature(rawBody: string, sigHeader: string | null): boolean {
  const appSecret = process.env.META_WHATSAPP_APP_SECRET
  if (!appSecret) {
    // Fail closed: missing secret means we cannot verify any request, regardless of environment.
    // Set META_WHATSAPP_APP_SECRET in .env.local to enable webhook ingestion.
    return false
  }

  if (!sigHeader?.startsWith('sha256=')) return false

  const received = sigHeader.slice('sha256='.length)
  const expected = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody, 'utf8')
    .digest('hex')

  try {
    const expectedBuf = Buffer.from(expected, 'hex')
    const receivedBuf = Buffer.from(received, 'hex')
    if (expectedBuf.length !== receivedBuf.length) return false
    return crypto.timingSafeEqual(expectedBuf, receivedBuf)
  } catch {
    return false
  }
}

// ─── Send a WhatsApp message via Meta Graph API ───────────────────────────────

async function sendMessage(to: string, text: string): Promise<void> {
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID
  const accessToken   = process.env.META_WHATSAPP_ACCESS_TOKEN
  if (!phoneNumberId || !accessToken) {
    console.error('[whatsapp] META_WHATSAPP_PHONE_NUMBER_ID or META_WHATSAPP_ACCESS_TOKEN not set')
    return
  }

  await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text.slice(0, 4096) },
    }),
  })
}

// ─── GET — Meta webhook verification challenge ────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN
  if (mode === 'subscribe' && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// ─── POST — incoming WhatsApp message ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabase()
  let anthropic: Anthropic
  try {
    anthropic = getAnthropic()
  } catch {
    console.error('[whatsapp] ANTHROPIC_API_KEY not set — AI responses disabled')
    return new NextResponse('Service Unavailable', { status: 503 })
  }

  const rawBody   = await req.text()
  const sigHeader = req.headers.get('x-hub-signature-256')

  if (!verifyMetaSignature(rawBody, sigHeader)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return new NextResponse('Bad Request', { status: 400 })
  }

  // Meta sends "statuses" updates (delivered/read) alongside messages — ignore them
  const entry    = (payload.entry as Array<Record<string, unknown>> | undefined)?.[0]
  const changes  = (entry?.changes as Array<Record<string, unknown>> | undefined)?.[0]
  const value    = changes?.value as Record<string, unknown> | undefined
  const messages = value?.messages as Array<Record<string, unknown>> | undefined

  if (!messages?.length) {
    return NextResponse.json({ status: 'ok' })
  }

  const msg  = messages[0]
  const from = String(msg.from ?? '')
  const type = String(msg.type ?? '')

  if (type !== 'text') return NextResponse.json({ status: 'ok' })

  const body = String((msg.text as Record<string, unknown> | undefined)?.body ?? '').trim()
  if (!from || !body) return NextResponse.json({ status: 'ok' })

  const phone = from.startsWith('+') ? from : `+${from}`

  // Validate phone is E.164 format before interpolating into Supabase filter
  const E164_RE = /^\+\d{7,15}$/
  if (!E164_RE.test(phone)) {
    console.warn('[whatsapp] Malformed phone number rejected:', phone.slice(0, 20))
    return NextResponse.json({ status: 'ok' })
  }

  // ── Per-phone rate limit: 20 messages / minute ───────────────────────────
  const rl = await checkRateLimitAsync(phone, 'whatsapp-bot', 20, 60_000)
  if (!rl.allowed) {
    await sendMessage(from, 'Too many messages. Please wait a minute before sending again. 🙏')
    return NextResponse.json({ status: 'ok' })
  }

  // Look up user by phone number (both variants: with/without leading +)
  const phoneDigitsOnly = phone.slice(1) // strip leading +
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, name, university')
    .or(`phone.eq.${phone},phone.eq.${phoneDigitsOnly}`)
    .maybeSingle()

  if (!profile) {
    await sendMessage(from,
      `Hi! I couldn't find a VarsityOS account linked to this number.\n\n` +
      `Register at varsityos.co.za and add your WhatsApp number in your profile to get started. 🎓`
    )
    return NextResponse.json({ status: 'ok' })
  }

  const userId    = profile.id
  const firstName = (profile.name ?? 'Student').split(' ')[0]
  const cmd       = body.toLowerCase()

  const reply = async (text: string) => sendMessage(from, text)

  if (cmd === '/help' || cmd === 'help' || cmd === 'hi' || cmd === 'hello') {
    await reply(
      `Hey ${firstName}! 👋 I'm Nova, your VarsityOS assistant.\n\n` +
      `Commands:\n` +
      `📚 /nova <question> — Ask me anything\n` +
      `💰 /budget — This month's spending summary\n` +
      `📋 /tasks — Today's study sessions\n` +
      `📅 /exam — Upcoming exams\n\n` +
      `Or just type /nova followed by any question!`
    )
    return NextResponse.json({ status: 'ok' })
  }

  // ── /nova ─────────────────────────────────────────────────────────────────
  if (cmd.startsWith('/nova ') || cmd.startsWith('/nova\n')) {
    const question = body.slice(6).trim().slice(0, 500)
    if (!question) {
      await reply('Ask me anything after /nova — e.g. /nova How do I calculate compound interest?')
      return NextResponse.json({ status: 'ok' })
    }

    // Per-user DAILY cap on Claude via WhatsApp. The 20/min per-phone limit above
    // still allows ~28,800 Claude calls/day/number — this caps unbudgeted spend.
    const novaDay = await checkRateLimitAsync(userId, 'whatsapp-nova-day', 30, 86_400_000)
    if (!novaDay.allowed) {
      await reply("You've reached today's Nova limit on WhatsApp. 🌙 Open the app for more, or try again tomorrow.")
      return NextResponse.json({ status: 'ok' })
    }

    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 350,
        system: `You are Nova, a friendly AI tutor for South African university students.
Keep responses SHORT (max 300 chars for WhatsApp). Use plain text — no markdown headers or bullet symbols.
The student's name is ${firstName} and they study at ${profile.university ?? 'a South African institution'}.`,
        messages: [{ role: 'user', content: question }],
      })

      const text = (response.content[0] as { text: string }).text ?? 'I could not generate a response.'
      await reply(`Nova: ${text.slice(0, 1400)}`)
    } catch {
      await reply('Sorry, Nova is unavailable right now. Try again in a moment! 🙏')
    }
    return NextResponse.json({ status: 'ok' })
  }

  // ── /budget ───────────────────────────────────────────────────────────────
  if (cmd === '/budget') {
    const now   = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

    const [{ data: budget }, { data: expenses }] = await Promise.all([
      supabaseAdmin.from('budgets').select('monthly_budget, nsfas_enabled, nsfas_living, nsfas_accom, nsfas_books').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('expenses').select('amount, category').eq('user_id', userId).gte('expense_date', start).lte('expense_date', end),
    ])

    if (!budget) {
      await reply('No budget set yet. Visit varsityos.co.za to set up your budget! 💰')
      return NextResponse.json({ status: 'ok' })
    }

    const totalBudget = (budget.monthly_budget ?? 0) +
      (budget.nsfas_enabled ? ((budget.nsfas_living ?? 0) + (budget.nsfas_accom ?? 0) + (budget.nsfas_books ?? 0)) : 0)
    const totalSpent = (expenses ?? []).reduce((s: number, e: { amount: number }) => s + e.amount, 0)
    const remaining  = totalBudget - totalSpent
    const daysLeft   = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()
    const dailyLeft  = daysLeft > 0 ? (remaining / daysLeft).toFixed(0) : '0'
    const pct        = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

    await reply(
      `💰 ${firstName}'s Budget — ${now.toLocaleString('default', { month: 'long' })}\n\n` +
      `Budget: R${totalBudget.toFixed(0)}\n` +
      `Spent:  R${totalSpent.toFixed(0)} (${pct}%)\n` +
      `Left:   R${remaining.toFixed(0)}\n\n` +
      `${daysLeft} days left → R${dailyLeft}/day budget remaining.\n` +
      `${pct > 90 ? '⚠️ Almost out of budget!' : pct > 70 ? '⚡ Spending faster than usual.' : '✅ On track!'}`
    )
    return NextResponse.json({ status: 'ok' })
  }

  // ── /tasks ────────────────────────────────────────────────────────────────
  if (cmd === '/tasks') {
    const todayStr = new Date().toISOString().slice(0, 10)

    const { data: sessions } = await supabaseAdmin
      .from('study_sessions')
      .select('duration_minutes, started_at, modules(module_name)')
      .eq('user_id', userId)
      .gte('started_at', `${todayStr}T00:00:00`)
      .lte('started_at', `${todayStr}T23:59:59`)
      .order('started_at', { ascending: true })

    if (!sessions?.length) {
      await reply(`📋 No study sessions logged today, ${firstName}.\n\nGet started at varsityos.co.za/study! 📚`)
      return NextResponse.json({ status: 'ok' })
    }

    const totalMins = sessions.reduce((s: number, x: { duration_minutes: number }) => s + (x.duration_minutes ?? 0), 0)
    const lines = sessions.map((s: { duration_minutes: number; modules: unknown }) => {
      const mod = Array.isArray(s.modules)
        ? (s.modules[0] as { module_name?: string } | undefined)?.module_name
        : (s.modules as { module_name?: string } | null)?.module_name
      return `• ${mod ?? 'Study'} — ${s.duration_minutes ?? 0} min`
    }).join('\n')

    await reply(`📋 Today's study sessions:\n\n${lines}\n\nTotal: ${totalMins} minutes. Keep going! 🔥`)
    return NextResponse.json({ status: 'ok' })
  }

  // ── /exam ─────────────────────────────────────────────────────────────────
  if (cmd === '/exam') {
    const todayStr = new Date().toISOString().slice(0, 10)

    const { data: exams } = await supabaseAdmin
      .from('exams')
      .select('exam_name, exam_date, venue')
      .eq('user_id', userId)
      .gte('exam_date', todayStr)
      .order('exam_date', { ascending: true })
      .limit(5)

    if (!exams?.length) {
      await reply(`📅 No upcoming exams found, ${firstName}.\n\nAdd exams at varsityos.co.za/study! ✏️`)
      return NextResponse.json({ status: 'ok' })
    }

    const today = new Date()
    const lines = exams.map((e: { exam_name: string; exam_date: string; venue?: string }) => {
      const days = Math.ceil((new Date(e.exam_date).getTime() - today.getTime()) / 86400000)
      const when = days === 0 ? 'TODAY' : days === 1 ? 'tomorrow' : `in ${days} days`
      return `📅 ${e.exam_name} — ${e.exam_date} (${when})${e.venue ? ` @ ${e.venue}` : ''}`
    }).join('\n')

    await reply(`Upcoming exams, ${firstName}:\n\n${lines}\n\nGood luck studying! 💪`)
    return NextResponse.json({ status: 'ok' })
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  if (body.length > 3) {
    await reply(`Tip: Type /nova ${body.slice(0, 50)}... to ask Nova.\n\nOr send /help to see all commands. 🎓`)
    return NextResponse.json({ status: 'ok' })
  }

  await reply(`Send /help to see what I can do, ${firstName}! 👋`)
  return NextResponse.json({ status: 'ok' })
}
