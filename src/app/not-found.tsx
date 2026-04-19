import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page not found | VarsityOS',
  description: "This page doesn't exist. Let's get you back on track.",
}

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
        aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse, var(--teal-glow) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-md">
        <div
          style={{
            width: 64, height: 64, borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, var(--teal), #0f766e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 32px',
          }}
          aria-hidden="true"
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="4" fill="white" />
            <line x1="14" y1="2" x2="14" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14" y1="20" x2="14" y2="26" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="2" y1="14" x2="8" y2="14" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="20" y1="14" x2="26" y2="14" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <p
          style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '6rem', lineHeight: 1, color: 'var(--border-default)', marginBottom: 0 }}
          aria-hidden="true"
        >
          404
        </p>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)', marginTop: -24, marginBottom: 12 }}>
          Page not found
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.7 }}>
          This page doesn&apos;t exist — or it moved. Let&apos;s get you back to your campus life.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
          <Link
            href="/dashboard"
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem',
              padding: '12px 24px', borderRadius: 'var(--radius-md)',
              background: 'var(--teal)', color: '#fff', textDecoration: 'none',
            }}
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem',
              padding: '12px 24px', borderRadius: 'var(--radius-md)',
              border: '0.5px solid var(--border-default)', color: 'var(--text-secondary)', textDecoration: 'none',
            }}
          >
            Back to home
          </Link>
        </div>

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '0.5px solid var(--border-subtle)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>Quick links</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { href: '/study', label: 'Study' },
              { href: '/budget', label: 'Budget' },
              { href: '/nova', label: 'Nova AI' },
              { href: '/meals', label: 'Meals' },
              { href: '/upgrade', label: 'Pricing' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
