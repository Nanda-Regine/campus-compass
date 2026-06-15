import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export function getAnthropicKey(): string {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new AnthropicMissingKeyError()
  return key
}

export class AnthropicMissingKeyError extends Error {
  constructor() { super('ANTHROPIC_API_KEY is not configured') }
}

export function anthropicUnconfiguredResponse() {
  return NextResponse.json(
    { error: 'AI service is temporarily unavailable' },
    { status: 503 }
  )
}
