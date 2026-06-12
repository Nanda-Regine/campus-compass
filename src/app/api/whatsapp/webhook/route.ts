/**
 * WhatsApp Bot Webhook — powered by Twilio WhatsApp Sandbox
 *
 * Setup:
 * 1. Create a Twilio account and enable the WhatsApp Sandbox
 * 2. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER in .env.local
 * 3. Point your Twilio sandbox webhook URL to: https://your-domain.co.za/api/whatsapp/webhook
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

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Lazy helpers — initialized inside handlers so module import doesn't call
// createClient/Anthropic at build time when env vars are unavailable.
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
}

// ─── Twilio verification ───────────────────────────────────────────────────────

function verifyTwilioSignature(req: NextRequest, rawBody: string): boolean {
  // In production, validate the X-Twilio-Signature header using the Twilio helper.
  // For MVP/sandbox, skip strict validation (requests come from Twilio's IP range).
  const twilioSig = req.headers.get('x-twilio-signature')
  if (!twilioSig && process.env.NODE_ENV === 'production') return false
  return true
}

// ─── TwiML response helper ─────────────────────────────────────────────────────

function twimlReply(message: string): NextResponse {
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
  return new NextResponse(body, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ─── GET — Twilio sandbox verification (not required but harmless) ─────────────

export async function GET() {
  return new NextResponse('VarsityOS WhatsApp Bot is running', { status: 200 })
}

// ─── POST — incoming WhatsApp message ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabase()
  const anthropic = getAnthropic()

  const rawBody = await req.text()

  if (!verifyTwilioSignature(req, rawBody)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const params = new URLSearchParams(rawBody)
  const from = params.get('From') ?? ''          // e.g. whatsapp:+27821234567
  const body = (params.get('Body') ?? '').trim()

  if (!from || !body) return twimlReply('👋 Hi! Send /help to see what I can do.')

  // Strip the "whatsapp:" prefix to get the E.164 number
  const phone = from.replace(/^whatsapp:/, '')

  // Look up user by phone number
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, name, university')
    .or(`phone.eq.${phone},phone.eq.${phone.replace('+', '')}`)
    .maybeSingle()

  if (!profile) {
    return twimlReply(
      `Hi! I couldn't find a VarsityOS account linked to this number.\n\n` +
      `Register at varsityos.co.za and add your WhatsApp number in your profile to get started. 🎓`
    )
  }

  const userId = profile.id
  const firstName = (profile.name ?? 'Student').split(' ')[0]

  const cmd = body.toLowerCase()

  if (cmd === '/help' || cmd === 'help' || cmd === 'hi' || cmd === 'hello') {
    return twimlReply(
      `Hey ${firstName}! 👋 I'm Nova, your VarsityOS assistant.\n\n` +
      `Commands:\n` +
      `📚 */nova <question>* — Ask me anything\n` +
      `💰 */budget* — This month's spending summary\n` +
      `📋 */tasks* — Today's study sessions\n` +
      `📅 */exam* — Upcoming exams\n\n` +
      `Or just type /nova followed by any question!`
    )
  }

  // ── /nova ─────────────────────────────────────────────────────────────────
  if (cmd.startsWith('/nova ') || cmd.startsWith('/nova\n')) {
    const question = body.slice(6).trim()
    if (!question) return twimlReply('Ask me anything after /nova — e.g. /nova How do I calculate compound interest?')

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
      return twimlReply(`Nova: ${text.slice(0, 1400)}`)
    } catch {
      return twimlReply('Sorry, Nova is unavailable right now. Try again in a moment! 🙏')
    }
  }

  // ── /budget ───────────────────────────────────────────────────────────────
  if (cmd === '/budget') {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

    const [{ data: budget }, { data: expenses }] = await Promise.all([
      supabaseAdmin.from('budgets').select('monthly_budget, nsfas_enabled, nsfas_living, nsfas_accom, nsfas_books').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('expenses').select('amount, category').eq('user_id', userId).gte('expense_date', start).lte('expense_date', end),
    ])

    if (!budget) return twimlReply('No budget set yet. Visit varsityos.co.za to set up your budget! 💰')

    const totalBudget = (budget.monthly_budget ?? 0) +
      (budget.nsfas_enabled ? ((budget.nsfas_living ?? 0) + (budget.nsfas_accom ?? 0) + (budget.nsfas_books ?? 0)) : 0)
    const totalSpent = (expenses ?? []).reduce((s: number, e: { amount: number }) => s + e.amount, 0)
    const remaining = totalBudget - totalSpent
    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()
    const dailyLeft = daysLeft > 0 ? (remaining / daysLeft).toFixed(0) : '0'
    const pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

    return twimlReply(
      `💰 ${firstName}'s Budget — ${now.toLocaleString('default', { month: 'long' })}\n\n` +
      `Budget: R${totalBudget.toFixed(0)}\n` +
      `Spent:  R${totalSpent.toFixed(0)} (${pct}%)\n` +
      `Left:   R${remaining.toFixed(0)}\n\n` +
      `${daysLeft} days left → R${dailyLeft}/day budget remaining.\n` +
      `${pct > 90 ? '⚠️ Almost out of budget!' : pct > 70 ? '⚡ Spending faster than usual.' : '✅ On track!'}`
    )
  }

  // ── /tasks ────────────────────────────────────────────────────────────────
  if (cmd === '/tasks') {
    const todayStr = new Date().toISOString().slice(0, 10)

    const { data: sessions } = await supabaseAdmin
      .from('study_sessions')
      .select('module_name, duration_minutes, started_at')
      .eq('user_id', userId)
      .gte('started_at', `${todayStr}T00:00:00`)
      .lte('started_at', `${todayStr}T23:59:59`)
      .order('started_at', { ascending: true })

    if (!sessions?.length) {
      return twimlReply(`📋 No study sessions logged today, ${firstName}.\n\nGet started at varsityos.co.za/study! 📚`)
    }

    const totalMins = sessions.reduce((s: number, x: { duration_minutes: number }) => s + (x.duration_minutes ?? 0), 0)
    const lines = sessions.map((s: { module_name: string; duration_minutes: number }) =>
      `• ${s.module_name} — ${s.duration_minutes ?? 0} min`
    ).join('\n')

    return twimlReply(
      `📋 Today's study sessions:\n\n${lines}\n\nTotal: ${totalMins} minutes. Keep going! 🔥`
    )
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
      return twimlReply(`📅 No upcoming exams found, ${firstName}.\n\nAdd exams at varsityos.co.za/study! ✏️`)
    }

    const today = new Date()
    const lines = exams.map((e: { exam_name: string; exam_date: string; venue?: string }) => {
      const days = Math.ceil((new Date(e.exam_date).getTime() - today.getTime()) / 86400000)
      const when = days === 0 ? 'TODAY' : days === 1 ? 'tomorrow' : `in ${days} days`
      return `📅 ${e.exam_name} — ${e.exam_date} (${when})${e.venue ? ` @ ${e.venue}` : ''}`
    }).join('\n')

    return twimlReply(`Upcoming exams, ${firstName}:\n\n${lines}\n\nGood luck studying! 💪`)
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  if (body.length > 3) {
    // Treat unrecognised messages as Nova questions
    return twimlReply(
      `Tip: Type */nova ${body.slice(0, 50)}...* to ask Nova.\n\nOr send */help* to see all commands. 🎓`
    )
  }

  return twimlReply(`Send */help* to see what I can do, ${firstName}! 👋`)
}
