'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en-ZA">
      <body style={{ background: '#080f0e', color: '#fff', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: '#9ca3af', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Our team has been notified. Please try again.
          </p>
          <button
            onClick={reset}
            style={{ background: '#0d9488', color: '#fff', border: 'none', borderRadius: '100px', padding: '0.6rem 1.5rem', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
