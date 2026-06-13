'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface InviteData {
  id: string
  institution_id: string
  domain_lock: string | null
  uses_limit: number | null
  uses_count: number
  expires_at: string
  institutions: {
    id: string
    name: string
    short_name: string | null
    domain: string
    logo_url: string | null
  }
}

export default function JoinInstitutionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()

  const [invite, setInvite]   = useState<InviteData | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joinErr, setJoinErr] = useState('')
  const [joined, setJoined]   = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [invRes, { data: { user } }] = await Promise.all([
          fetch(`/api/institutions/invite?token=${token}`),
          supabase.auth.getUser(),
        ])

        if (!invRes.ok) {
          const d = await invRes.json()
          setLoadErr(d.error || 'Invalid invite link')
          return
        }
        const { invite: inv } = await invRes.json() as { invite: InviteData }
        setInvite(inv)
        setIsLoggedIn(!!user)
      } catch {
        setLoadErr('Could not load invite details. Check your connection.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const handleJoin = async () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?redirect=/join/institution/${token}`)
      return
    }
    setJoining(true)
    setJoinErr('')
    try {
      const res = await fetch('/api/institutions/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) { setJoinErr(data.error || 'Join failed'); return }
      setJoined(true)
      setTimeout(() => router.push('/dashboard'), 2500)
    } catch {
      setJoinErr('Network error. Please try again.')
    } finally {
      setJoining(false)
    }
  }

  if (loading) return <Shell><p style={mutedStyle}>Loading invite…</p></Shell>
  if (loadErr) return (
    <Shell>
      <div style={cardStyle}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Invite unavailable</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{loadErr}</p>
        <Link href="/institutions" style={linkBtnStyle}>Learn about VarsityOS for institutions</Link>
      </div>
    </Shell>
  )

  const inst = invite!.institutions

  if (joined) return (
    <Shell>
      <div style={cardStyle}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🎓</div>
        <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>You&apos;re in!</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 4 }}>
          Linked to <strong>{inst.name}</strong>. Redirecting to your dashboard…
        </p>
      </div>
    </Shell>
  )

  return (
    <Shell>
      <div style={cardStyle}>
        {/* Institution badge */}
        <div style={{
          width: 56, height: 56, borderRadius: 14, marginBottom: 16,
          background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>
          🏛
        </div>

        <span style={chipStyle}>Institution invite</span>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 22, margin: '12px 0 6px',
        }}>
          {inst.name}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          {inst.domain}
        </p>

        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
          You&apos;ve been invited to join <strong>{inst.name}</strong> on VarsityOS — the free student OS
          built for South African students. Study tools, NSFAS tracker, Nova AI, and more.
        </p>

        {invite!.domain_lock && (
          <div style={{
            padding: '10px 12px', borderRadius: 9, marginBottom: 20,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          }}>
            <p style={{ fontSize: 12, color: '#f59e0b', margin: 0 }}>
              This invite is restricted to <strong>@{invite!.domain_lock}</strong> email addresses.
            </p>
          </div>
        )}

        {joinErr && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>{joinErr}</p>}

        <button
          onClick={handleJoin}
          disabled={joining}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 10,
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            color: '#fff', fontWeight: 700, fontSize: 15,
            border: 'none', cursor: joining ? 'wait' : 'pointer',
            opacity: joining ? 0.7 : 1, marginBottom: 12,
          }}
        >
          {joining ? 'Joining…' : isLoggedIn ? 'Join institution' : 'Sign in to join'}
        </button>

        {!isLoggedIn && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Don&apos;t have an account?{' '}
            <Link href={`/auth/signup?redirect=/join/institution/${token}`} style={{ color: '#0d9488' }}>
              Sign up free
            </Link>
          </p>
        )}
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base, #080f0e)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'var(--font-sans, system-ui)',
      color: 'var(--text-primary, #e2e8f0)',
    }}>
      {children}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: 400, textAlign: 'center',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 18, padding: '32px 24px',
}

const chipStyle: React.CSSProperties = {
  display: 'inline-block', padding: '3px 10px', borderRadius: 20,
  background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.3)',
  fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: '#0d9488',
}

const mutedStyle: React.CSSProperties = {
  fontSize: 14, color: 'var(--text-muted, #64748b)', textAlign: 'center',
}

const linkBtnStyle: React.CSSProperties = {
  display: 'inline-block', marginTop: 16, padding: '10px 20px', borderRadius: 8,
  background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.3)',
  color: '#0d9488', fontSize: 13, fontWeight: 600, textDecoration: 'none',
}
