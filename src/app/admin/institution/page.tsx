'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Institution {
  id: string
  name: string
  short_name: string | null
  domain: string
  status: string
}

interface Invite {
  id: string
  token: string
  domain_lock: string | null
  uses_limit: number | null
  uses_count: number
  expires_at: string
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function InstitutionAdminPage() {
  const [institution, setInstitution]   = useState<Institution | null>(null)
  const [invites, setInvites]           = useState<Invite[]>([])
  const [studentCount, setStudentCount] = useState<number | null>(null)
  const [loading, setLoading]           = useState(true)
  const [notAdmin, setNotAdmin]         = useState(false)

  const [genLoading, setGenLoading]     = useState(false)
  const [genError, setGenError]         = useState('')
  const [copiedToken, setCopiedToken]   = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setNotAdmin(true); setLoading(false); return }

    // Check institution_admins
    const { data: adminRow } = await supabase
      .from('institution_admins')
      .select('institution_id, role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRow) { setNotAdmin(true); setLoading(false); return }

    const [instRes, invRes, countRes] = await Promise.all([
      supabase
        .from('institutions')
        .select('id, name, short_name, domain, status')
        .eq('id', adminRow.institution_id)
        .maybeSingle(),
      supabase
        .from('institution_invites')
        .select('id, token, domain_lock, uses_limit, uses_count, expires_at')
        .eq('institution_id', adminRow.institution_id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('institution_id', adminRow.institution_id),
    ])

    setInstitution(instRes.data ?? null)
    setInvites(invRes.data ?? [])
    setStudentCount(countRes.count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const generateInvite = async () => {
    if (!institution) return
    setGenLoading(true)
    setGenError('')
    try {
      const res = await fetch('/api/institutions/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institution_id: institution.id }),
      })
      const data = await res.json()
      if (!res.ok) { setGenError(data.error || 'Failed'); return }
      await loadData()
    } catch { setGenError('Network error') }
    finally { setGenLoading(false) }
  }

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/join/institution/${token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2000)
    })
  }

  if (loading) return <LoadingScreen />

  if (notAdmin) return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>
          You don&apos;t have institution admin access.<br />
          Contact VarsityOS to get set up.
        </p>
      </div>
    </div>
  )

  if (!institution) return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>
          Institution not found.
        </p>
      </div>
    </div>
  )

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <span style={chipStyle}>Institution Admin</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, margin: '10px 0 4px' }}>
            {institution.name}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            {institution.domain} · {institution.status === 'active'
              ? <span style={{ color: '#4ecf9e' }}>Active</span>
              : <span style={{ color: '#f59e0b' }}>Pending approval</span>}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <StatCard label="Students joined" value={studentCount?.toString() ?? '—'} colour="#38BDF8" />
          <StatCard label="Active invite links" value={invites.filter(i => new Date(i.expires_at) > new Date()).length.toString()} colour="#4ecf9e" />
        </div>

        {/* Invite links */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Invite links</span>
            <button
              onClick={generateInvite}
              disabled={genLoading}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: 'rgba(13,148,136,0.18)', border: '1px solid rgba(13,148,136,0.4)',
                color: '#0d9488', cursor: genLoading ? 'wait' : 'pointer',
                opacity: genLoading ? 0.7 : 1,
              }}
            >
              {genLoading ? 'Generating…' : '+ New link'}
            </button>
          </div>

          {genError && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 12 }}>{genError}</p>}

          {invites.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
              No invite links yet. Generate one to share with your students.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {invites.map(inv => {
                const expired = new Date(inv.expires_at) < new Date()
                const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://varsityos.co.za'}/join/institution/${inv.token}`
                return (
                  <div key={inv.id} style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: expired ? 'rgba(255,255,255,0.02)' : 'rgba(56,189,248,0.04)',
                    border: `1px solid ${expired ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.15)'}`,
                    opacity: expired ? 0.5 : 1,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 11, fontFamily: 'var(--font-mono)',
                          color: 'var(--text-secondary)', margin: '0 0 4px',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {url}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                          {inv.uses_count} used
                          {inv.uses_limit != null ? ` / ${inv.uses_limit}` : ''}
                          {' · '}
                          {expired ? 'Expired' : `Expires ${new Date(inv.expires_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                          {inv.domain_lock ? ` · @${inv.domain_lock} only` : ''}
                        </p>
                      </div>
                      {!expired && (
                        <button
                          onClick={() => copyLink(inv.token)}
                          style={{
                            padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            background: copiedToken === inv.token ? 'rgba(78,207,158,0.15)' : 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: copiedToken === inv.token ? '#4ecf9e' : 'var(--text-secondary)',
                            cursor: 'pointer', flexShrink: 0,
                          }}
                        >
                          {copiedToken === inv.token ? '✓ Copied' : 'Copy'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function StatCard({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div style={{
      padding: '16px', borderRadius: 12,
      background: `${colour}0a`, border: `1px solid ${colour}20`,
    }}>
      <p style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 800, color: colour, margin: '0 0 4px' }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </p>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--bg-base)',
  color: 'var(--text-primary)',
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14, padding: '18px 16px',
  marginBottom: 16,
}

const chipStyle: React.CSSProperties = {
  display: 'inline-block', padding: '3px 10px', borderRadius: 20,
  background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.3)',
  fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: '#0d9488',
}
