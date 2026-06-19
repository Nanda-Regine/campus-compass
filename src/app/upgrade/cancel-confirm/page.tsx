import type { Metadata } from 'next'
import TopBar from '@/components/layout/TopBar'
import Link from 'next/link'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata: Metadata = { title: 'Payment Cancelled — VarsityOS' }

export default function UpgradeCancelConfirmPage() {
  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-base)', position: 'relative', overflowX: 'hidden' }}>
      <AmbientImage zone="budget" opacity={0.60} blurPx={2} saturation={1.4} overlayColor="transparent" />
      <TopBar title="" />

      <div className="max-w-sm mx-auto px-4 py-12 flex flex-col items-center text-center">
        <div style={{
          width: 64, height: 64, borderRadius: 'var(--radius-xl)',
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.75rem', marginBottom: 24,
        }}>
          👋
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem',
          color: 'var(--text-primary)', marginBottom: 8,
        }}>
          No worries
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
          color: 'var(--text-secondary)', marginBottom: 40, lineHeight: 1.7,
        }}>
          Your payment was cancelled. You&apos;re still on the Free plan — all your data is safe and VarsityOS keeps working.
        </p>

        <Link
          href="/upgrade"
          style={{
            display: 'block', width: '100%',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem',
            padding: '13px 0', borderRadius: 'var(--radius-md)', textAlign: 'center',
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 12,
          }}
        >
          View plans
        </Link>

        <Link
          href="/dashboard"
          style={{
            display: 'block', fontFamily: 'var(--font-display)', fontSize: '0.875rem',
            color: 'var(--text-tertiary)', padding: '8px 0', textDecoration: 'none',
          }}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
