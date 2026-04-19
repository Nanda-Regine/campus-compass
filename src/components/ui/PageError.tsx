'use client'
import { useEffect } from 'react'

interface PageErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export function PageError({ error, reset }: PageErrorProps) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-base)' }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--danger-dim)',
          border: '0.5px solid var(--danger-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '1.5rem',
        }}>⚠</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 8 }}>
          Something went wrong
        </h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 24, lineHeight: 1.6 }}>
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '0.875rem',
            background: 'var(--teal-dim)',
            border: '0.5px solid var(--teal-border)',
            color: 'var(--teal)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 24px',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
