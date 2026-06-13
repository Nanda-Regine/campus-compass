export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimitAsync } from '@/lib/rateLimit'
import { NOVA_LIMITS } from '@/lib/utils'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ── Rate limit: 5 requests / minute ──────────────────────────────────────
    const rl = await checkRateLimitAsync(user.id, 'nova-catchup', 5, 60_000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Too many requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      )
    }

    // ── Nova quota check (same monthly logic as main /api/nova) ───────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('university, year_of_study, subscription_tier, nova_messages_used, nova_messages_reset_at')
      .eq('id', user.id)
      .single()

    const now = new Date()
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastResetKey = (profile?.nova_messages_reset_at as string | null)?.slice(0, 7) ?? ''
    let messageCount = (profile?.nova_messages_used as number) || 0

    if (lastResetKey !== currentMonthKey) {
      await supabase
        .from('profiles')
        .update({ nova_messages_used: 0, nova_messages_reset_at: now.toISOString() })
        .eq('id', user.id)
      messageCount = 0
    }

    const tier = ((profile?.subscription_tier ?? 'free') as keyof typeof NOVA_LIMITS)
    const tierLimit = NOVA_LIMITS[tier] ?? NOVA_LIMITS.free
    if (messageCount >= tierLimit) {
      return NextResponse.json(
        {
          error: 'limit_reached',
          message: tier === 'free'
            ? `You've used all ${NOVA_LIMITS.free} Nova messages this month. Upgrade to Scholar (R39) for 100 messages/month.`
            : `You've reached your Nova message limit for this month. Upgrade for more.`,
          upgradeUrl: tier === 'nova_unlimited' ? null : '/upgrade',
          tier,
        },
        { status: 402 }
      )
    }

    // ── Input validation & sanitization ──────────────────────────────────────
    const body = await req.json() as { module?: unknown; answers?: unknown }
    const module = typeof body.module === 'string' ? body.module.slice(0, 120) : null
    const answers = Array.isArray(body.answers)
      ? body.answers.slice(0, 5).map((a: unknown) => String(a).slice(0, 100))
      : null

    if (!module || !answers) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const context = answers.map((a, i) => `Q${i + 1}: ${a}`).join('\n')
    const prompt = `You are Nova, VarsityOS's AI study companion for South African students.

A student needs a catch-up plan for their module: **${module}**
${profile?.university ? `University: ${String(profile.university).slice(0, 80)}` : ''}${profile?.year_of_study ? `, Year ${profile.year_of_study}` : ''}

Their situation:
${context}

Write a practical, compassionate 5-step catch-up plan. Each step should be:
- Specific and actionable (not generic advice)
- Realistic for a student with limited time
- SA-context aware (load shedding, data costs, shared accommodation)
- Maximum 2 sentences per step

Format: Return ONLY the steps as a JSON array of strings, no other text. Example: ["Step 1...", "Step 2...", ...]`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : null
    if (!text) return NextResponse.json({ error: 'No response' }, { status: 500 })

    // Increment nova_messages_used only after successful generation
    await supabase
      .from('profiles')
      .update({ nova_messages_used: messageCount + 1 })
      .eq('id', user.id)

    const match = text.match(/\[[\s\S]*\]/)
    const steps = match ? JSON.parse(match[0]) as string[] : null
    if (!steps || !Array.isArray(steps)) return NextResponse.json({ error: 'Parse failed' }, { status: 500 })

    return NextResponse.json({ plan: steps.join('\n\n') })
  } catch (e) {
    console.error('[nova/catchup]', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
