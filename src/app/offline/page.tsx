'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw, BookOpen, Wallet, Zap } from 'lucide-react'
import { AmbientImage } from '@/components/ui/AmbientImage'

const CACHED_PAGES = [
  { href: '/dashboard',  icon: '🏠', label: 'Dashboard',  desc: 'Daily brief + tasks' },
  { href: '/study',      icon: '📚', label: 'Study',      desc: 'Tasks, exams & timetable' },
  { href: '/budget',     icon: '💳', label: 'Budget',     desc: 'Expenses & NSFAS' },
  { href: '/nova',       icon: '✦',  label: 'Nova AI',    desc: 'Chat history cached' },
  { href: '/health',     icon: '🏥', label: 'Health',     desc: 'Wellness & sleep log' },
  { href: '/career',     icon: '🚀', label: 'Career',     desc: 'CV & job tracker' },
  { href: '/notes',      icon: '📝', label: 'Notes',      desc: 'Lecture notes offline' },
  { href: '/profile',    icon: '👤', label: 'Profile',    desc: 'Your OS settings' },
]

export default function OfflinePage() {
  const [retrying, setRetrying]   = useState(false)
  const [seconds,  setSeconds]    = useState(0)

  useEffect(() => {
    const handleOnline = () => window.location.reload()
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  // Count seconds since offline
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const handleRetry = () => {
    setRetrying(true)
    setTimeout(() => window.location.reload(), 600)
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        background: 'var(--bg-base)',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <AmbientImage zone="gradient-pink" opacity={0.32} blurPx={2} saturation={1.4} />
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <WifiOff size={30} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--teal)', letterSpacing: '0.1em', marginBottom: 8 }}>
            NO CONNECTION · {seconds}s
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            You&apos;re offline
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            Load shedding or out of data? VarsityOS caches your key pages so you can keep studying. Connect to sync your latest data.
          </p>
        </div>

        {/* Retry button */}
        <button
          onClick={handleRetry}
          disabled={retrying}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 12,
            background: retrying ? 'var(--bg-elevated)' : 'linear-gradient(135deg, var(--teal) 0%, #0891b2 100%)',
            color: retrying ? 'var(--text-muted)' : '#ffffff',
            border: 'none', fontSize: '0.85rem', fontWeight: 700,
            cursor: retrying ? 'default' : 'pointer',
            opacity: retrying ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          <RefreshCw size={16} style={{ animation: retrying ? 'spin 1s linear infinite' : 'none' }} />
          {retrying ? 'Retrying…' : 'Try again'}
        </button>

        {/* Cached pages */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px 6px', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            CACHED PAGES — AVAILABLE OFFLINE
          </div>
          {CACHED_PAGES.map((page, i) => (
            <a
              key={page.href}
              href={page.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px',
                borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
                textDecoration: 'none',
                background: 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ fontSize: '1.1rem', flexShrink: 0 }}>{page.icon}</div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{page.label}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{page.desc}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--teal)', background: 'var(--teal-dim)', padding: '2px 8px', borderRadius: 100 }}>
                cached
              </div>
            </a>
          ))}
        </div>

        {/* Load shedding tip */}
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <Zap size={14} strokeWidth={2} style={{ color: '#FBBF24', flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            During load shedding? Switch your device to <strong>data saver mode</strong> in settings to extend battery and reduce background data use.
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          VarsityOS reloads automatically when your connection returns.
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
