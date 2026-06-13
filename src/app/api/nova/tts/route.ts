export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const ELEVENLABS_API_KEY  = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'

function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/#{1,6}\s?/g, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim()
}

export async function POST(req: NextRequest) {
  try {
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: 'TTS not configured' }, { status: 503 })
    }

    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Premium gate — scholar and nova_unlimited tiers
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .maybeSingle()

    const tier = profile?.subscription_tier
    if (tier !== 'nova_unlimited' && tier !== 'scholar') {
      return NextResponse.json({ error: 'Premium required' }, { status: 403 })
    }

    const body = await req.json() as { text?: string }
    if (!body.text) return NextResponse.json({ error: 'text required' }, { status: 400 })

    const text = cleanForSpeech(body.text).slice(0, 1000)
    if (!text) return NextResponse.json({ error: 'text empty after cleaning' }, { status: 400 })

    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key':   ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept':       'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    )

    if (!upstream.ok) {
      const err = await upstream.text().catch(() => 'unknown')
      console.error('[nova/tts] ElevenLabs error', upstream.status, err)
      return NextResponse.json({ error: 'TTS upstream error' }, { status: 502 })
    }

    return new NextResponse(upstream.body, {
      headers: {
        'Content-Type':  'audio/mpeg',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('[nova/tts]', err)
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
