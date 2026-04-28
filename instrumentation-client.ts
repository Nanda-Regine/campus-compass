import * as Sentry from '@sentry/nextjs'

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: false,
    }),
  ],
  beforeSend(event, hint) {
    if (event.request?.cookies) delete event.request.cookies

    // Drop browser extension noise (password managers, autofill injecting into DOM)
    const originalException = hint?.originalException
    if (
      typeof originalException === 'string' &&
      originalException.includes('Object Not Found Matching Id')
    ) {
      return null
    }
    if (event.exception?.values?.[0]?.value?.includes('Object Not Found Matching Id')) {
      return null
    }

    return event
  },
})
