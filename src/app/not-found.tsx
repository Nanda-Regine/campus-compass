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
      style={{ background: '#0b0907' }}
    >
      {/* Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
        aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse, rgba(211,107,73,0.08) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-md">
        {/* Logo */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-8"
          style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}
          aria-hidden="true"
        >
          🧭
        </div>

        {/* 404 */}
        <p
          className="font-display font-black mb-2"
          style={{ fontSize: '6rem', lineHeight: 1, color: 'rgba(255,255,255,0.05)' }}
          aria-hidden="true"
        >
          404
        </p>

        <h1 className="font-display font-black text-2xl text-white mb-3 -mt-6">
          Page not found
        </h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          This page doesn&apos;t exist — or it moved. Let&apos;s get you back to your campus life.
        </p>

        {/* Links */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
          <Link
            href="/dashboard"
            className="font-display font-bold text-sm px-6 py-3 rounded-xl"
            style={{ background: '#0d9488', color: '#fff' }}
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="font-display font-bold text-sm px-6 py-3 rounded-xl"
            style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)' }}
          >
            Back to home
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="font-mono text-xs mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Quick links</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { href: '/study', label: 'Study Planner' },
              { href: '/budget', label: 'Budget' },
              { href: '/nova', label: 'Nova AI' },
              { href: '/meals', label: 'Meal Prep' },
              { href: '/upgrade', label: 'Pricing' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-xs transition-colors"
                style={{ color: 'rgba(255,255,255,0.3)' }}
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
