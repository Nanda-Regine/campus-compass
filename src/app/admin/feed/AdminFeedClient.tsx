'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { CheckCircle2, Trash2, Shield, AlertTriangle } from 'lucide-react'

interface Report {
  id: string
  reason: string
  details: string | null
  resolved: boolean
  created_at: string
  campus_posts: {
    id: string
    content: string
    category: string
    institution: string | null
    created_at: string
    profiles: { name: string; emoji: string } | null
  }
  reporter: { name: string } | null
}

const REASON_LABELS: Record<string, string> = {
  spam:           'Spam / scam',
  harassment:     'Harassment',
  hate_speech:    'Hate speech',
  misinformation: 'Misinformation',
  other:          'Other',
}

export default function AdminFeedClient({ reports: initial }: { reports: Report[] }) {
  const [reports, setReports] = useState<Report[]>(initial)
  const [filter, setFilter]   = useState<'unresolved' | 'all'>('unresolved')

  async function deletePost(postId: string, reportId: string) {
    if (!confirm('Delete this post and resolve the report?')) return
    const res = await fetch(`/api/feed?id=${postId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Could not delete post'); return }
    await resolveReport(reportId)
    setReports(prev => prev.filter(r => r.campus_posts.id !== postId))
    toast.success('Post deleted')
  }

  async function resolveReport(reportId: string) {
    await fetch('/api/admin/feed/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_id: reportId }),
    })
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, resolved: true } : r))
  }

  const visible = filter === 'unresolved'
    ? reports.filter(r => !r.resolved)
    : reports

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', padding: '24px 20px', maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Shield size={20} style={{ color: '#f87171' }} />
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: '#fff', margin: 0 }}>
            Feed Moderation
          </h1>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
            {reports.filter(r => !r.resolved).length} unresolved · {reports.length} total
          </p>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['unresolved', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '5px 14px', borderRadius: 20, border: '0.5px solid',
              borderColor: filter === f ? '#f87171' : 'rgba(255,255,255,0.1)',
              background: filter === f ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.04)',
              color: filter === f ? '#f87171' : 'rgba(255,255,255,0.4)',
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', cursor: 'pointer',
            }}
          >
            {f === 'unresolved' ? 'Unresolved' : 'All reports'}
          </button>
        ))}
      </div>

      {/* Report cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 60, color: 'rgba(255,255,255,0.2)', fontFamily: 'DM Sans, sans-serif' }}>
            <CheckCircle2 size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
            No reports to review
          </div>
        )}
        {visible.map(report => (
          <div
            key={report.id}
            style={{
              background: report.resolved ? 'rgba(255,255,255,0.02)' : 'rgba(248,113,113,0.04)',
              border: `0.5px solid ${report.resolved ? 'rgba(255,255,255,0.06)' : 'rgba(248,113,113,0.2)'}`,
              borderRadius: 14, padding: 16, opacity: report.resolved ? 0.5 : 1,
            }}
          >
            {/* Report meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <AlertTriangle size={13} style={{ color: '#f87171', flexShrink: 0 }} />
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem',
                background: 'rgba(248,113,113,0.12)', color: '#f87171',
                border: '0.5px solid rgba(248,113,113,0.25)',
                padding: '2px 8px', borderRadius: 9999,
              }}>
                {REASON_LABELS[report.reason] ?? report.reason}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.63rem', color: 'rgba(255,255,255,0.25)' }}>
                reported by {report.reporter?.name ?? 'user'} · {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
              </span>
              {report.resolved && (
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.63rem', color: '#4ecf9e', marginLeft: 'auto' }}>
                  ✓ resolved
                </span>
              )}
            </div>

            {/* Post content */}
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: '0.9rem' }}>{report.campus_posts.profiles?.emoji ?? '🎓'}</span>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                  {report.campus_posts.profiles?.name ?? 'Student'}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.63rem', color: 'rgba(255,255,255,0.2)' }}>
                  · {report.campus_posts.category} · {report.campus_posts.institution ?? 'unknown institution'}
                </span>
              </div>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {report.campus_posts.content}
              </p>
            </div>

            {report.details && (
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', margin: '0 0 10px', fontStyle: 'italic' }}>
                Reporter note: {report.details}
              </p>
            )}

            {/* Actions */}
            {!report.resolved && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => resolveReport(report.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 20,
                    background: 'rgba(78,207,158,0.1)', border: '0.5px solid rgba(78,207,158,0.3)',
                    color: '#4ecf9e', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem',
                    cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={13} />
                  Dismiss (keep post)
                </button>
                <button
                  onClick={() => deletePost(report.campus_posts.id, report.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 20,
                    background: 'rgba(248,113,113,0.1)', border: '0.5px solid rgba(248,113,113,0.3)',
                    color: '#f87171', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem',
                    cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  <Trash2 size={13} />
                  Delete post
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
