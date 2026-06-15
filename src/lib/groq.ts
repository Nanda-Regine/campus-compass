// Groq AI — OpenAI-compatible inference API
// Free tier: 14,400 req/day on llama-3.1-8b-instant
// Use for non-critical, structured-output AI calls to preserve Claude quota.
// NOT suitable for: Nova chat, crisis detection, prompt-cached contexts.

import { NextResponse } from 'next/server'

const GROQ_BASE = 'https://api.groq.com/openai/v1'
const DEFAULT_MODEL = 'llama-3.1-8b-instant'

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
