// Groq AI — OpenAI-compatible inference API
// Free tier: 14,400 req/day on llama-3.1-8b-instant
// Use for non-critical, structured-output AI calls to preserve Claude quota.
// NOT suitable for: Nova chat, crisis detection, prompt-cached contexts.

import { NextResponse } from 'next/server'
import { checkRateLimitAsync } from './rateLimit'

const GROQ_BASE = 'https://api.groq.com/openai/v1'
const DEFAULT_MODEL = 'llama-3.1-8b-instant'

// Groq's free tier is a SHARED resource across ALL users: ~14,400 req/day and
// ~30 req/min. Per-user route caps don't compose to a global bound, so these
// global circuit-breakers (via the distributed Upstash counter) stop the whole
// app from blowing the shared quota / RPM ceiling and 429-ing everyone.
// Tunable via env; defaults leave headroom under the free-tier limits.
const GROQ_DAILY_GLOBAL_CAP = Number(process.env.GROQ_DAILY_GLOBAL_CAP ?? 13_000)
const GROQ_RPM_GLOBAL_CAP = Number(process.env.GROQ_RPM_GLOBAL_CAP ?? 25)

export class GroqQuotaExhaustedError extends Error {
  constructor() { super('Groq shared quota exhausted — try again shortly') }
}

export function groqQuotaExhaustedResponse() {
  return NextResponse.json(
    { error: 'AI service is busy right now — please try again in a moment' },
    { status: 503 },
  )
}

/**
 * Global circuit-breaker on Groq's shared free-tier quota (daily + per-minute).
 * Call before ANY Groq request — including routes that use raw fetch instead of
 * callGroq — so the whole app shares one budget. Throws GroqQuotaExhaustedError.
 */
export async function assertGroqCapacity(): Promise<void> {
  const [rpm, daily] = await Promise.all([
    checkRateLimitAsync('global', 'groq-rpm', GROQ_RPM_GLOBAL_CAP, 60_000),
    checkRateLimitAsync('global', 'groq-daily', GROQ_DAILY_GLOBAL_CAP, 86_400_000),
  ])
  if (!rpm.allowed || !daily.allowed) throw new GroqQuotaExhaustedError()
}

export function getGroqKey(): string {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new GroqMissingKeyError()
  return key
}

export class GroqMissingKeyError extends Error {
  constructor() { super('GROQ_API_KEY is not configured') }
}

export function groqUnconfiguredResponse() {
  return NextResponse.json(
    { error: 'AI service is temporarily unavailable' },
    { status: 503 }
  )
}

interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GroqOptions {
  model?: string
  maxTokens?: number
  temperature?: number
}

export async function callGroq(
  messages: GroqMessage[],
  options: GroqOptions = {}
): Promise<string> {
  const key = getGroqKey()

  // Global circuit-breaker on the shared free-tier quota (daily + per-minute).
  await assertGroqCapacity()

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model ?? DEFAULT_MODEL,
      max_tokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.3,
      messages,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Groq API error ${res.status}: ${body.slice(0, 200)}`)
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>
  }
  return data.choices[0]?.message?.content ?? ''
}
