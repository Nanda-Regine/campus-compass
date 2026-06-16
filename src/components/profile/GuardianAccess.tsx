'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

interface GuardianToken {
  id: string
  label: string
  token: string
  expires_at: string
  created_at: string
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://varsityos.co.za'

function guardianUrl(token: string) {
  return `${BASE_URL}/guardian/${token}`
}

export default function GuardianAccess() {
  const [tokens, setTokens]       = useState<GuardianToken[]>([])
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)
  const [newLabel, setNewLabel]   = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [revoking, setRevoking]   = useState<string | null>(null)
  const [copied, setCopied]       = useState<string | null>(null)
  const [showExplainer, setShowExplainer] = useState(false)

  const loadTokens = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/guardian/tokens')
      if (res.ok) {
        const { tokens: t } = await res.json()
        setTokens(t)
      }
    } catch {
      toast.error('Could not load guardian links')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTokens() }, [loadTokens])

  const createToken = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/guardian/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel.trim() || 'Guardian' }),
      })
      if (res.ok) {
        const { token } = await res.json()
        setTokens(prev => [token, ...prev])
        setNewLabel('')
        setShowForm(false)
        toast.success('Guardian link created')
      } else {
        const { error } = await res.json()
        toast.error(error || 'Could not create link')
      }
    } catch {
      toast.error('Could not create link')
    } finally {
      setCreating(false)
    }
  }

  const revokeToken = async (id: string, label: string) => {
    if (!confirm(`Revoke "${label}" link? They will no longer be able to see your dashboard.`)) return
    setRevoking(id)
    try {
      const res = await fetch(`/api/guardian/tokens/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setTokens(prev => prev.filter(t => t.id !== id))
        toast.success('Link revoked')
      } else {
        toast.error('Could not revoke')
      }
    } catch {
      toast.error('Could not revoke')
    } finally {
      setRevoking(null)
    }
  }

  const copyLink = async (token: string) => {
    try {
      await navigator.clipboard.writeText(guardianUrl(token))
      setCopied(token)
      toast.success('Link copied!')
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error('Could not copy')
    }
  }

  const shareWhatsApp = (token: string, label: string) => {
    const url = guardianUrl(token)
    const text = encodeURIComponent(`Hi! You can follow my university progress on VarsityOS:\n${url}\n\nNo login needed — just open the link.`)
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt).getTime() < Date.now()
  const daysUntilExpiry = (expiresAt: string) =>
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Guardian Access</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Share a read-only dashboard with a parent or guardian — no login needed
          </div>
        </div>
        {tokens.length < 5 && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
              background: 'rgba(78,207,158,0.12)', color: '#4ecf9e',
              border: '1px solid rgba(78,207,158,0.25)', cursor: 'pointer', flexShrink: 0,
            }}
          >
            {showForm ? 'Cancel' : '+ New link'}
          </button>
        )}
      </div>

      {/* What does my guardian see? */}
      <button
        onClick={() => setShowExplainer(v => !v)}
        style={{
          width: '100%', textAlign: 'left', background: 'rgba(78,207,158,0.04)',
          border: '1px solid rgba(78,207,158,0.12)', borderRadius: 10, padding: '8px 12px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>What does my guardian see?</span>
        <span style={{ fontSize: '0.65rem', color: '#4ecf9e', transform: showExplainer ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>

      {showExplainer && (
        <div style={{ background: 'rgba(78,207,158,0.05)', border: '1px solid rgba(78,207,158,0.12)', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
            Your guardian sees a <strong style={{ color: 'rgba(255,255,255,0.8)' }}>read-only summary</strong> with:
            <ul style={{ margin: '8px 0 0 14px', padding: 0, listStyle: 'disc' }}>
              <li>Study streak (consecutive days)</li>
              <li>Hours studied this week</li>
              <li>Academic status (on track / needs attention / action required)</li>
              <li>Budget health (managing well / watch spending / tight) — <em>no rand amounts</em></li>
              <li>Upcoming exams in the next 14 days</li>
            </ul>
            <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(78,207,158,0.08)', borderRadius: 8, fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
              🔒 Your guardian can never see your grades, expenses, messages, or any personal details.
            </div>
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div style={{
          background: 'rgba(78,207,158,0.05)', border: '1px solid rgba(78,207,158,0.15)',
          borderRadius: 14, padding: '14px 16px', marginBottom: 14,
        }}>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
            Give this link a label so you know who it&apos;s for
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="e.g. Mom, Dad, Aunt Thandi…"
              maxLength={50}
              onKeyDown={e => e.key === 'Enter' && createToken()}
              style={{
                flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 10, padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            <button
              onClick={createToken}
              disabled={creating}
              style={{
                padding: '8px 16px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700,
                background: '#4ecf9e', color: '#080f0e', border: 'none', cursor: 'pointer',
                opacity: creating ? 0.6 : 1,
              }}
            >
              {creating ? '…' : 'Create'}
            </button>
          </div>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
            Links expire after 90 days. Financial amounts are never shown.
          </div>
        </div>
      )}

      {/* Token list */}
      {loading ? (
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <div style={{ width: 20, height: 20, border: '2px solid var(--border-subtle)', borderTopColor: '#4ecf9e', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      ) : tokens.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          No guardian links yet. Create one to share with family.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tokens.map(t => {
            const expired = isExpired(t.expires_at)
            const days = daysUntilExpiry(t.expires_at)
            return (
              <div key={t.id} style={{
                background: 'var(--bg-surface)', border: `1px solid ${expired ? 'rgba(248,113,113,0.2)' : 'var(--border-subtle)'}`,
                borderRadius: 14, padding: '12px 14px',
                opacity: expired ? 0.6 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.label}</span>
                  {expired ? (
                    <span style={{ fontSize: '0.6rem', color: '#f87171', fontFamily: 'monospace', background: 'rgba(248,113,113,0.1)', padding: '2px 6px', borderRadius: 999 }}>Expired</span>
                  ) : (
                    <span style={{ fontSize: '0.6rem', color: days <= 7 ? '#f59e0b' : 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                      Expires in {days}d
                    </span>
                  )}
                  <button
                    onClick={() => revokeToken(t.id, t.label)}
                    disabled={revoking === t.id}
                    style={{ marginLeft: 'auto', fontSize: '0.62rem', color: 'rgba(248,113,113,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
                  >
                    {revoking === t.id ? '…' : 'Revoke'}
                  </button>
                </div>
                {!expired && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{
                      background: 'var(--bg-base)', border: '1px solid var(--border-subtle)',
                      borderRadius: 8, padding: '6px 10px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)',
                      fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {guardianUrl(t.token)}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => copyLink(t.token)}
                        style={{
                          flex: 1, padding: '7px 10px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600,
                          background: copied === t.token ? 'rgba(78,207,158,0.15)' : 'rgba(255,255,255,0.06)',
                          color: copied === t.token ? '#4ecf9e' : 'rgba(255,255,255,0.5)',
                          border: '1px solid var(--border-subtle)', cursor: 'pointer',
                        }}
                      >
                        {copied === t.token ? '✓ Copied' : 'Copy link'}
                      </button>
                      <button
                        onClick={() => shareWhatsApp(t.token, t.label)}
                        style={{
                          flex: 1, padding: '7px 10px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600,
                          background: 'rgba(37,211,102,0.12)', color: '#25d366',
                          border: '1px solid rgba(37,211,102,0.25)', cursor: 'pointer',
                        }}
                      >
                        Share on WhatsApp
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
