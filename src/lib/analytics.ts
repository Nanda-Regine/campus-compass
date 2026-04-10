'use client'

// Thin wrapper around posthog-js so components don't need to import it directly.
// Guards against server-side execution and missing env var.

let _posthog: typeof import('posthog-js').default | null = null

async function ph() {
  if (typeof window === 'undefined') return null
  if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return null
  if (!_posthog) {
    const mod = await import('posthog-js')
    _posthog = mod.default
  }
  return _posthog
}

export async function trackEvent(event: string, properties?: Record<string, unknown>) {
  const posthog = await ph()
  posthog?.capture(event, properties)
}
