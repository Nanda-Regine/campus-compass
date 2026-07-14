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

// GA4 (gtag) is loaded in layout.tsx (measurement id G-87QR50FJ7N). Mirror every
// tracked event into GA4 so feature usage shows up there too, not just PostHog.
type Gtag = (command: string, ...args: unknown[]) => void
function ga(): Gtag | null {
  if (typeof window === 'undefined') return null
  const g = (window as unknown as { gtag?: Gtag }).gtag
  return typeof g === 'function' ? g : null
}

// GA4 event names must be snake_case, <=40 chars, and start with a letter.
function ga4Name(event: string): string {
  return event.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[^a-zA-Z]+/, '').slice(0, 40) || 'event'
}

export async function trackEvent(event: string, properties?: Record<string, unknown>) {
  const posthog = await ph()
  posthog?.capture(event, properties)
  ga()?.('event', ga4Name(event), properties ?? {})
}

// Explicit GA4 page_view — call on client route changes (SPA nav doesn't reload,
// so gtag only auto-fires the first page_view without this).
export function trackPageView(path: string) {
  ga()?.('event', 'page_view', {
    page_path: path,
    page_location: typeof window !== 'undefined' ? window.location.href : path,
    page_title: typeof document !== 'undefined' ? document.title : undefined,
  })
}
