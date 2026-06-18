'use client'

import { useState } from 'react'
import { Bell, Send } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Broadcast {
  id: string
  university: string
  title: string
  body: string
  priority: string
  sent_by: string | null
  sent_at: string
  expires_at: string | null
}

interface Props {
  userId: string
  broadcasts: Broadcast[]
  readIds: string[]
  university: string
  isSrcMember: boolean
}

type Tab = 'inbox' | 'send'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeDate(iso: string): string {
  const now = Date.now()
  const ts = new Date(iso).getTime()
  const diffMs = now - ts
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHrs = Math.floor(diffMs / 3_600_000)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const sentDate = new Date(iso)
  if (
    sentDate.getDate() === yesterday.getDate() &&
    sentDate.getMonth() === yesterday.getMonth() &&
    sentDate.getFullYear() === yesterday.getFullYear()
  ) return 'Yesterday'

  return sentDate.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })
}

const PRIORITY_COLOR: Record<string, string> = {
  urgent: '#ef4444',
  important: '#f97316',
  normal: '#475569',
}

const PRIORITY_EMOJI: Record<string, string> = {
  urgent: '🔴',
  important: '🟠',
  normal: '⚪',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BroadcastOS({ userId, broadcasts: initialBroadcasts, readIds, university, isSrcMember }: Props) {
  const [tab, setTab] = useState<Tab>('inbox')
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(initialBroadcasts)
  const [readSet, setReadSet] = useState<Set<string>>(new Set(readIds))
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // send form state
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal')
  const [expiresAt, setExpiresAt] = useState('')
  const [sending, setSending] = useState(false)

  const unreadCount = broadcasts.filter(b => !readSet.has(b.id)).length

  async function markRead(id: string) {
    if (readSet.has(id)) return
    try {
      const res = await fetch(`/api/broadcasts/${id}/read`, { method: 'POST' })
      if (res.ok) {
        setReadSet(prev => new Set([...prev, id]))
      }
    } catch {
      // silent — read state is best-effort
    }
  }

  function handleCardClick(b: Broadcast) {
    const isExpanding = expandedId !== b.id
    setExpandedId(isExpanding ? b.id : null)
    if (isExpanding) markRead(b.id)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message are required')
      return
    }
    if (body.trim().length < 10) {
      toast.error('Message must be at least 10 characters')
      return
    }
    setSending(true)
    try {
      const payload: Record<string, string> = { title: title.trim(), body: body.trim(), priority }
      if (expiresAt) payload.expires_at = new Date(expiresAt).toISOString()

      const res = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Failed to send broadcast')
        return
      }
      const newBroadcast: Broadcast = json.data
      setBroadcasts(prev => [newBroadcast, ...prev])
      setReadSet(prev => new Set([...prev, newBroadcast.id]))
      setTitle('')
      setBody('')
      setPriority('normal')
      setExpiresAt('')
      toast.success('Broadcast sent to your institution!')
      setTab('inbox')
    } catch {
      toast.error('Network error — try again')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header card */}
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: 16,
        background: 'linear-gradient(135deg, #0c1a2e 0%, #1e3a5f 100%)',
        padding: '20px 20px 16px',
        border: '1px solid rgba(56,189,248,0.18)',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#38bdf8,transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell size={20} color="#38bdf8" strokeWidth={2} />
          <div>
            <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono,monospace)', color: '#38bdf8', letterSpacing: '0.09em', marginBottom: 2 }}>
              INSTITUTION BROADCAST OS
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Official Notices</div>
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: '0.73rem', color: 'rgba(255,255,255,0.55)' }}>
          {university || 'Your institution'} · {broadcasts.length} broadcast{broadcasts.length !== 1 ? 's' : ''}
          {unreadCount > 0 && (
            <span style={{ marginLeft: 8, color: '#38bdf8', fontWeight: 700 }}>{unreadCount} unread</span>
          )}
        </div>
      </div>

      {/* Tab rail */}
      <div style={{ display: 'flex', gap: 0, background: 'var(--bg-surface,rgba(255,255,255,0.04))', borderRadius: 12, padding: 4 }}>
        <TabBtn
          active={tab === 'inbox'}
          onClick={() => setTab('inbox')}
          icon={<Bell size={14} />}
          label="Inbox"
          badge={unreadCount > 0 ? unreadCount : undefined}
          accent="#38bdf8"
        />
        {isSrcMember && (
          <TabBtn
            active={tab === 'send'}
            onClick={() => setTab('send')}
            icon={<Send size={14} />}
            label="Send Broadcast"
            accent="#38bdf8"
          />
        )}
      </div>

      {/* ── Inbox tab ── */}
      {tab === 'inbox' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {broadcasts.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '40px 24px',
              color: 'var(--text-muted,rgba(255,255,255,0.35))',
              fontSize: '0.8rem',
              background: 'var(--bg-surface,rgba(255,255,255,0.04))',
              borderRadius: 14,
              border: '1px solid var(--border-subtle,rgba(255,255,255,0.06))',
            }}>
              <Bell size={28} style={{ marginBottom: 8, opacity: 0.3 }} /><br />
              No broadcasts yet from your institution.
            </div>
          )}
          {broadcasts.map(b => (
            <BroadcastCard
              key={b.id}
              broadcast={b}
              isRead={readSet.has(b.id)}
              isExpanded={expandedId === b.id}
              onClick={() => handleCardClick(b)}
            />
          ))}
        </div>
      )}

      {/* ── Send tab ── */}
      {tab === 'send' && (
        <div style={{
          background: 'var(--bg-surface,rgba(255,255,255,0.04))',
          border: '1px solid rgba(56,189,248,0.15)',
          borderRadius: 16, padding: '20px 18px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono,monospace)', color: '#38bdf8', letterSpacing: '0.08em' }}>
            SEND BROADCAST
          </div>
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(56,189,248,0.08)',
            border: '1px solid rgba(56,189,248,0.15)',
            fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)',
          }}>
            Broadcast will be sent to all students at your university.
          </div>

          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: '0.68rem', color: 'var(--text-secondary,rgba(255,255,255,0.55))', fontFamily: 'var(--font-mono,monospace)' }}>
                TITLE *
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Library closure on Friday"
                maxLength={120}
                required
                style={{
                  padding: '10px 14px',
                  background: 'var(--bg-base,#0a0a0f)',
                  border: '1px solid var(--border-default,rgba(255,255,255,0.1))',
                  borderRadius: 10,
                  color: 'var(--text-primary,#fff)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: '0.68rem', color: 'var(--text-secondary,rgba(255,255,255,0.55))', fontFamily: 'var(--font-mono,monospace)' }}>
                MESSAGE *
              </label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Full announcement text (min 10 characters)..."
                maxLength={2000}
                rows={5}
                required
                style={{
                  padding: '10px 14px',
                  background: 'var(--bg-base,#0a0a0f)',
                  border: '1px solid var(--border-default,rgba(255,255,255,0.1))',
                  borderRadius: 10,
                  color: 'var(--text-primary,#fff)',
                  fontSize: '0.82rem',
                  resize: 'vertical',
                  outline: 'none',
                  minHeight: 100,
                }}
              />
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>
                {body.length}/2000
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-secondary,rgba(255,255,255,0.55))', fontFamily: 'var(--font-mono,monospace)' }}>
                  PRIORITY
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as 'normal' | 'important' | 'urgent')}
                  style={{
                    padding: '10px 14px',
                    background: 'var(--bg-base,#0a0a0f)',
                    border: '1px solid var(--border-default,rgba(255,255,255,0.1))',
                    borderRadius: 10,
                    color: 'var(--text-primary,#fff)',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                >
                  <option value="normal">⚪ Normal</option>
                  <option value="important">🟠 Important</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-secondary,rgba(255,255,255,0.55))', fontFamily: 'var(--font-mono,monospace)' }}>
                  EXPIRES AT (OPTIONAL)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    background: 'var(--bg-base,#0a0a0f)',
                    border: '1px solid var(--border-default,rgba(255,255,255,0.1))',
                    borderRadius: 10,
                    color: expiresAt ? 'var(--text-primary,#fff)' : 'rgba(255,255,255,0.3)',
                    fontSize: '0.82rem',
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sending || !title.trim() || body.trim().length < 10}
              style={{
                marginTop: 4, padding: '12px 0',
                background: sending || !title.trim() || body.trim().length < 10
                  ? 'rgba(56,189,248,0.25)'
                  : 'linear-gradient(135deg,#38bdf8,#0284c7)',
                border: 'none', borderRadius: 12,
                color: '#fff', fontWeight: 700,
                fontSize: '0.85rem', cursor: sending ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'opacity 150ms',
              }}
            >
              <Send size={14} />
              {sending ? 'Sending...' : 'Send Broadcast'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabBtn({
  active, onClick, icon, label, badge, accent,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  badge?: number
  accent: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '9px 12px', border: 'none', borderRadius: 9, cursor: 'pointer',
        background: active ? 'rgba(56,189,248,0.12)' : 'transparent',
        color: active ? accent : 'var(--text-tertiary,rgba(255,255,255,0.35))',
        fontSize: '0.72rem', fontFamily: 'var(--font-mono,monospace)', fontWeight: active ? 700 : 400,
        transition: 'all 140ms ease',
        position: 'relative',
      }}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span style={{
          position: 'absolute', top: 5, right: 8,
          minWidth: 16, height: 16, borderRadius: 8,
          background: '#ef4444', color: '#fff',
          fontSize: '0.58rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 4px',
        }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}

function BroadcastCard({
  broadcast: b, isRead, isExpanded, onClick,
}: {
  broadcast: Broadcast
  isRead: boolean
  isExpanded: boolean
  onClick: () => void
}) {
  const borderColor = PRIORITY_COLOR[b.priority] ?? PRIORITY_COLOR.normal
  const isUrgent = b.priority === 'urgent'

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', cursor: 'pointer',
        background: isRead
          ? 'var(--bg-surface,rgba(255,255,255,0.04))'
          : 'rgba(56,189,248,0.07)',
        border: `1px solid ${isRead ? 'var(--border-subtle,rgba(255,255,255,0.06))' : 'rgba(56,189,248,0.18)'}`,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: 12,
        padding: '13px 14px',
        transition: 'background 140ms ease',
      }}
    >
      {/* Urgent pulse indicator */}
      {isUrgent && !isRead && (
        <span style={{
          position: 'absolute', top: 12, right: 12,
          width: 8, height: 8, borderRadius: '50%',
          background: '#ef4444',
          boxShadow: '0 0 0 0 rgba(239,68,68,0.6)',
          animation: 'urgentPulse 1.5s ease-in-out infinite',
        }} />
      )}

      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: '0.8rem', flexShrink: 0, marginTop: 1 }}>
          {PRIORITY_EMOJI[b.priority] ?? '⚪'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: isRead ? 600 : 700,
            fontSize: '0.88rem',
            color: 'var(--text-primary,#fff)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {b.title}
          </div>
          <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: '0.62rem', fontFamily: 'var(--font-mono,monospace)',
              color: borderColor, textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {b.priority}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted,rgba(255,255,255,0.3))' }}>
              {relativeDate(b.sent_at)}
            </span>
            {!isRead && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#38bdf8', display: 'inline-block', flexShrink: 0,
              }} />
            )}
          </div>
        </div>
      </div>

      {/* Collapsed preview */}
      {!isExpanded && (
        <div style={{
          marginLeft: 26, marginTop: 2,
          fontSize: '0.75rem', color: 'var(--text-secondary,rgba(255,255,255,0.5))',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {b.body}
        </div>
      )}

      {/* Expanded body */}
      {isExpanded && (
        <div style={{
          marginLeft: 26, marginTop: 8,
          fontSize: '0.8rem', lineHeight: 1.6,
          color: 'var(--text-secondary,rgba(255,255,255,0.7))',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {b.body}
          {b.expires_at && (
            <div style={{ marginTop: 10, fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono,monospace)' }}>
              EXPIRES {new Date(b.expires_at).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes urgentPulse {
          0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
          70%  { box-shadow: 0 0 0 7px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
      `}</style>
    </div>
  )
}
