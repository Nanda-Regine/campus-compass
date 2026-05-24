import * as Sentry from '@sentry/nextjs'

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  // Session Replay disabled: payment pages should not be recorded, and rrweb's
  // DOM serialiser throws SyntaxError on certain emoji (♾️) which crashes React.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  beforeSend(event, hint) {
    if (event.request?.cookies) delete event.request.cookies

    const originalException = hint?.originalException
    const exceptionValue = event.exception?.values?.[0]?.value ?? ''

    // Drop browser extension noise
    if (
      (typeof originalException === 'string' &&
        originalException.includes('Object Not Found Matching Id')) ||
      exceptionValue.includes('Object Not Found Matching Id')
    ) {
      return null
    }

    // Drop rrweb/Sentry Replay serialisation crashes — these come from Sentry's
    // own monkey-patched appendChild and are not actionable application errors.
    if (
      exceptionValue.includes("Failed to execute 'appendChild' on 'Node'") ||
      exceptionValue.includes("Failed to execute 'insertBefore' on 'Node'") ||
      exceptionValue.includes('rrweb') ||
      (event.exception?.values?.[0]?.type === 'SyntaxError' &&
        exceptionValue.includes('Invalid or unexpected token'))
    ) {
      return null
    }

    return event
  },
})
