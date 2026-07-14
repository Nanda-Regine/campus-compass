'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import type { LMSAssignment } from '@/app/api/integrations/lms/sync/route'

// ─── Types ────────────────────────────────────────────────────
interface Integration {
  id: string
  lms_type: 'moodle' | 'canvas'
  site_url: string
  display_name: string | null
  last_synced_at: string | null
  sync_count: number
  sync_error: string | null
  is_active: boolean
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────
const IND  = '#6366f1'
const IND_DIM    = 'rgba(99,102,241,0.10)'
const IND_BORDER = 'rgba(99,102,241,0.25)'

const LMS_INFO = {
  moodle: {
    label: 'Moodle',
    emoji: '🟠',
    color: '#f97316',
    tokenHelp: 'In Moodle → My Profile → Preferences → Security Keys → Create new token',
    urlPlaceholder: 'https://moodle.youruniversity.ac.za',
  },
  canvas: {
    label: 'Canvas',
    emoji: '🔴',
    color: '#ef4444',
    tokenHelp: 'In Canvas → Account → Settings → Approved Integrations → New Access Token',
    urlPlaceholder: 'https://canvas.youruniversity.ac.za',
  },
}

// ─── Helpers ──────────────────────────────────────────────────
function daysUntil(date: string): number {
  return Math.ceil((new Date(date + 'T23:59:59').getTime() - Date.now()) / 86_400_000)
}

function dueBadgeColor(due: string | null): string {
  if (!due) return 'rgba(255,255,255,0.5)'
  const d = daysUntil(due)
  if (d < 0) return '#6b7280'
  if (d <= 2) return '#ef4444'
  if (d <= 7) return '#f59e0b'
  return '#4ecf9e'
}

function formatDue(due: string | null): string {
  if (!due) return 'No due date'
  const d = daysUntil(due)
  if (d < 0) return `${Math.abs(d)}d ago`
  if (d === 0) return 'Due today'
  if (d === 1) return 'Due tomorrow'
  if (d <= 7) return `Due in ${d}d`
  return new Date(due + 'T12:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

// ─── Add Integration Form ─────────────────────────────────────
function AddIntegrationForm({ onAdded }: { onAdded: (i: Integration) => void }) {
  const [lmsType, setLmsType] = useState<'moodle' | 'canvas'>('moodle')
  const [siteUrl, setSiteUrl] = useState('')
  const [token, setToken] = useState('')
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; displayName?: string; error?: string } | null>(null)

  const info = LMS_INFO[lmsType]

  const handleTest = async () => {
    if (!siteUrl.trim() || !token.trim()) { toast.error('Enter site URL and token first'); return }
    setTesting(true); setTestResult(null)
    try {
      const res = await fetch('/api/integrations/lms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lms_type: lmsType, site_url: siteUrl.trim(), token: token.trim(), test_only: true }),
      })
      const data = await res.json() as { ok?: boolean; displayName?: string; error?: string }
      if (res.ok) {
        setTestResult({ ok: true, displayName: data.displayName })
      } else {
        setTestResult({ ok: false, error: data.error || 'Connection failed' })
      }
    } catch {
      setTestResult({ ok: false, error: 'Network error — check your internet connection' })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!testResult?.ok) { toast.error('Test the connection first'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/integrations/lms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lms_type: lmsType, site_url: siteUrl.trim(), token: token.trim() }),
      })
      const data = await res.json() as { integration?: Integration; error?: string }
      if (res.ok && data.integration) {
        toast.success(`${info.label} connected!`)
        onAdded(data.integration)
        setSiteUrl(''); setToken(''); setTestResult(null)
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background: IND_DIM, border: `1px solid ${IND_BORDER}`, borderRadius: 16, padding: '16px 14px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${IND}, transparent)` }} />
      <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.1em', color: IND, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 }}>
        Connect your LMS
      </div>

      {/* LMS type selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['moodle', 'canvas'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setLmsType(t); setTestResult(null) }}
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 10, border: `1px solid ${lmsType === t ? LMS_INFO[t].color + '60' : 'var(--border-subtle)'}`,
              background: lmsType === t ? `${LMS_INFO[t].color}15` : 'rgba(255,255,255,0.06)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{LMS_INFO[t].emoji}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: lmsType === t ? LMS_INFO[t].color : 'rgba(255,255,255,0.66)' }}>
              {LMS_INFO[t].label}
            </span>
          </button>
        ))}
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: '0.65rem', color: '#fff', marginBottom: 4 }}>Site URL</div>
          <input
            type="url"
            value={siteUrl}
            onChange={e => { setSiteUrl(e.target.value); setTestResult(null) }}
            placeholder={info.urlPlaceholder}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '9px 12px',
              background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 10,
              color: 'var(--text-primary)', fontSize: '0.78rem', outline: 'none',
            }}
          />
        </div>
        <div>
          <div style={{ fontSize: '0.65rem', color: '#fff', marginBottom: 4 }}>Personal API Token</div>
          <input
            type="password"
            value={token}
            onChange={e => { setToken(e.target.value); setTestResult(null) }}
            placeholder="Paste your token here"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '9px 12px',
              background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 10,
              color: 'var(--text-primary)', fontSize: '0.78rem', outline: 'none', fontFamily: 'monospace',
            }}
          />
          <div style={{ fontSize: '0.62rem', color: '#fff', marginTop: 4, lineHeight: 1.5 }}>
            {info.tokenHelp}
          </div>
        </div>
      </div>

      {/* Test result */}
      {testResult && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, marginBottom: 8,
          background: testResult.ok ? 'rgba(78,207,158,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${testResult.ok ? 'rgba(78,207,158,0.2)' : 'rgba(239,68,68,0.2)'}`,
          fontSize: '0.72rem',
          color: testResult.ok ? '#4ecf9e' : '#fca5a5',
        }}>
          {testResult.ok ? `✓ Connected — ${testResult.displayName}` : `✕ ${testResult.error}`}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleTest}
          disabled={testing || !siteUrl.trim() || !token.trim()}
          style={{
            flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600,
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)',
            color: '#fff', cursor: 'pointer', opacity: (testing || !siteUrl.trim() || !token.trim()) ? 0.5 : 1,
          }}
        >
          {testing ? 'Testing…' : 'Test connection'}
        </button>
        <button
          onClick={handleSave}
          disabled={!testResult?.ok || saving}
          style={{
            flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700,
            background: testResult?.ok ? IND : 'rgba(255,255,255,0.07)',
            border: `1px solid ${testResult?.ok ? IND : 'var(--border-subtle)'}`,
            color: testResult?.ok ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer',
            opacity: (!testResult?.ok || saving) ? 0.6 : 1,
          }}
        >
          {saving ? 'Connecting…' : 'Connect'}
        </button>
      </div>
    </div>
  )
}

// ─── Assignment row ───────────────────────────────────────────
function AssignmentRow({ a, selected, onToggle }: { a: LMSAssignment; selected: boolean; onToggle: () => void }) {
  const dueColor = dueBadgeColor(a.due_date)
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', textAlign: 'left', padding: '10px 12px',
        background: selected ? `${IND}18` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? IND_BORDER : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        border: `1.5px solid ${selected ? IND : 'rgba(255,255,255,0.2)'}`,
        background: selected ? IND : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <span style={{ fontSize: '0.65rem', color: '#fff', lineHeight: 1 }}>✓</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {a.title}
        </div>
        <div style={{ fontSize: '0.65rem', color: '#fff' }}>{a.course_name}</div>
      </div>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: dueColor, fontFamily: 'monospace', flexShrink: 0 }}>
        {formatDue(a.due_date)}
      </span>
    </button>
  )
}

// ─── Integration card ─────────────────────────────────────────
function IntegrationCard({ integration, onRemove }: { integration: Integration; onRemove: (id: string) => void }) {
  const [syncing, setSyncing]   = useState(false)
  const [removing, setRemoving] = useState(false)
  const [assignments, setAssignments]   = useState<LMSAssignment[] | null>(null)
  const [selected, setSelected]         = useState<Set<string>>(new Set())
  const [importing, setImporting]       = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const info = LMS_INFO[integration.lms_type]

  const handleSync = async () => {
    setSyncing(true); setAssignments(null); setSelected(new Set()); setImportedCount(0)
    try {
      const res = await fetch('/api/integrations/lms/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: integration.id }),
      })
      const data = await res.json() as { assignments?: LMSAssignment[]; importedCount?: number; error?: string }
      if (res.ok && data.assignments) {
        setAssignments(data.assignments)
        // Auto-select upcoming assignments
        const auto = new Set(data.assignments.filter(a => a.status === 'upcoming').map(a => a.external_id))
        setSelected(auto)
      } else {
        toast.error(data.error || 'Sync failed')
      }
    } catch {
      toast.error('Network error during sync')
    } finally {
      setSyncing(false)
    }
  }

  const handleImport = async () => {
    if (selected.size === 0) { toast.error('Select at least one assignment'); return }
    setImporting(true)
    try {
      const res = await fetch('/api/integrations/lms/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: integration.id, import: Array.from(selected) }),
      })
      const data = await res.json() as { assignments?: LMSAssignment[]; importedCount?: number; error?: string }
      if (res.ok) {
        setImportedCount(data.importedCount || 0)
        toast.success(`${data.importedCount} task${(data.importedCount ?? 0) === 1 ? '' : 's'} imported to Study → Tasks`)
        if (data.assignments) setAssignments(data.assignments)
      } else {
        toast.error(data.error || 'Import failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setImporting(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm(`Disconnect ${info.label}? Your imported tasks will remain.`)) return
    setRemoving(true)
    try {
      const res = await fetch(`/api/integrations/lms?id=${integration.id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Integration removed'); onRemove(integration.id) }
      else toast.error('Could not remove')
    } catch {
      toast.error('Network error')
    } finally {
      setRemoving(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const upcoming = assignments?.filter(a => a.status === 'upcoming') ?? []
  const past      = assignments?.filter(a => a.status === 'past') ?? []

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 16, padding: '14px 14px', marginBottom: 12, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${info.color}80, transparent)` }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4, marginBottom: 10 }}>
        <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{info.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {integration.display_name || info.label}
          </div>
          <div style={{ fontSize: '0.62rem', color: '#fff', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {integration.site_url}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 600,
              background: IND_DIM, border: `1px solid ${IND_BORDER}`, color: IND,
              cursor: 'pointer', opacity: syncing ? 0.6 : 1,
            }}
          >
            {syncing ? '…' : '↻ Sync'}
          </button>
          <button
            onClick={handleRemove}
            disabled={removing}
            style={{
              padding: '6px 10px', borderRadius: 8, fontSize: '0.7rem',
              background: 'none', border: '1px solid rgba(239,68,68,0.2)', color: 'rgb(239,68,68)',
              cursor: 'pointer', opacity: removing ? 0.5 : 1,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Sync meta */}
      <div style={{ display: 'flex', gap: 12, marginBottom: assignments !== null ? 10 : 0 }}>
        {integration.last_synced_at && (
          <span style={{ fontSize: '0.62rem', color: '#fff', fontFamily: 'monospace' }}>
            Last sync: {new Date(integration.last_synced_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
          </span>
        )}
        {integration.sync_error && (
          <span style={{ fontSize: '0.62rem', color: '#fca5a5' }}>⚠ {integration.sync_error}</span>
        )}
      </div>

      {/* Assignment list */}
      {assignments !== null && (
        <div>
          {assignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '0.75rem', color: '#fff' }}>
              No assignments found
            </div>
          ) : (
            <>
              {/* Upcoming */}
              {upcoming.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: '0.62rem', color: '#fff', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Upcoming ({upcoming.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {upcoming.map(a => (
                      <AssignmentRow key={a.external_id} a={a} selected={selected.has(a.external_id)} onToggle={() => toggleSelect(a.external_id)} />
                    ))}
                  </div>
                </div>
              )}
              {/* Past (collapsed) */}
              {past.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: '0.62rem', color: '#fff', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Past ({past.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {past.slice(0, 3).map(a => (
                      <AssignmentRow key={a.external_id} a={a} selected={selected.has(a.external_id)} onToggle={() => toggleSelect(a.external_id)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Import actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.68rem', color: '#fff' }}>
                  {selected.size} selected
                  {importedCount > 0 ? ` · ${importedCount} already imported` : ''}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => {
                      const all = new Set(assignments.map(a => a.external_id))
                      setSelected(prev => prev.size === all.size ? new Set() : all)
                    }}
                    style={{ fontSize: '0.68rem', color: IND, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                  >
                    {selected.size === assignments.length ? 'Deselect all' : 'Select all'}
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={selected.size === 0 || importing}
                    style={{
                      padding: '7px 14px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700,
                      background: selected.size > 0 ? IND : 'rgba(255,255,255,0.08)',
                      border: 'none', color: selected.size > 0 ? '#fff' : 'rgba(255,255,255,0.5)',
                      cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
                      opacity: importing ? 0.6 : 1,
                    }}
                  >
                    {importing ? 'Importing…' : `Import ${selected.size > 0 ? selected.size : ''} to Tasks`}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────
export default function LMSConnector() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/lms')
      if (res.ok) {
        const data = await res.json() as { integrations?: Integration[] }
        setIntegrations(data.integrations ?? [])
      }
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleAdded = (i: Integration) => {
    setIntegrations(prev => [i, ...prev])
    setShowForm(false)
  }

  const handleRemoved = (id: string) => {
    setIntegrations(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>LMS Integrations</div>
          <div style={{ fontSize: '0.7rem', color: '#fff', lineHeight: 1.5 }}>
            Connect Moodle or Canvas to sync assignments directly into your task list
          </div>
        </div>
        {integrations.length < 3 && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '7px 14px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
              background: showForm ? 'rgba(255,255,255,0.06)' : IND_DIM,
              border: `1px solid ${showForm ? 'var(--border-subtle)' : IND_BORDER}`,
              color: showForm ? 'rgba(255,255,255,0.66)' : IND, cursor: 'pointer', flexShrink: 0,
            }}
          >
            {showForm ? 'Cancel' : '+ Connect'}
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && <AddIntegrationForm onAdded={handleAdded} />}

      {/* Integration list */}
      {loading ? (
        <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 22, height: 22, border: `2px solid ${IND_BORDER}`, borderTopColor: IND, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : integrations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 16 }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>🎓</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', marginBottom: 6 }}>No LMS connected yet</div>
          <div style={{ fontSize: '0.7rem', color: '#fff', lineHeight: 1.6, maxWidth: 260, margin: '0 auto 14px' }}>
            Connect your university Moodle or Canvas to automatically pull assignment deadlines into VarsityOS.
          </div>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '9px 20px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700,
              background: IND, border: 'none', color: '#fff', cursor: 'pointer',
            }}
          >
            Connect LMS
          </button>
        </div>
      ) : (
        <>
          {integrations.map(i => (
            <IntegrationCard key={i.id} integration={i} onRemove={handleRemoved} />
          ))}
        </>
      )}

      {/* Info callout */}
      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, fontSize: '0.68rem', color: '#fff', lineHeight: 1.7 }}>
        🔒 Your token is stored securely and only used to fetch your own assignments. VarsityOS never stores your LMS password — only the personal API token you generate. You can revoke the token from your LMS settings at any time.
      </div>
    </div>
  )
}
