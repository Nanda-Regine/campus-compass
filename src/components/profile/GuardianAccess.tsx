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

  const isExpired = (expiresAt: string) => new Date(expiresAt).getTime() < Date.now()
  const daysUntilExpiry = (expiresAt: string) =>
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
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
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{
                      flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)',
                      borderRadius: 8, padding: '6px 10px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)',
                      fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {guardianUrl(t.token)}
                    </div>
                    <button
                      onClick={() => copyLink(t.token)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600,
                        background: copied === t.token ? 'rgba(78,207,158,0.15)' : 'rgba(255,255,255,0.06)',
                        color: copied === t.token ? '#4ecf9e' : 'rgba(255,255,255,0.5)',
                        border: '1px solid var(--border-subtle)', cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      {copied === t.token ? '✓ Copied' : 'Copy'}
                    </button>
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
