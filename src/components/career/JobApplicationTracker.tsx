'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, ExternalLink, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ──────────────────────────────────────────────────────────────────

type AppStatus = 'saved' | 'applied' | 'phone_screen' | 'interview' | 'assessment' | 'offer' | 'accepted' | 'rejected' | 'withdrawn'
type JobType   = 'parttime' | 'vacation' | 'grad' | 'learnership' | 'remote' | 'internship' | 'fulltime' | 'other'

interface JobApp {
  id: string
  job_title: string
  company: string
  job_type: JobType
  status: AppStatus
  location: string | null
  salary_range: string | null
  deadline: string | null
  applied_date: string | null
  interview_at: string | null
  notes: string | null
  url: string | null
  created_at: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_META: Record<AppStatus, { label: string; emoji: string; color: string; bg: string }> = {
  saved:        { label: 'Saved',        emoji: '💾', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  applied:      { label: 'Applied',      emoji: '📤', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  phone_screen: { label: 'Phone Screen', emoji: '📞', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  interview:    { label: 'Interview',    emoji: '🎯', color: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
  assessment:   { label: 'Assessment',  emoji: '📝', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  offer:        { label: 'Offer',        emoji: '🎉', color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
  accepted:     { label: 'Accepted',     emoji: '✅', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  rejected:     { label: 'Rejected',     emoji: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.08)'  },
  withdrawn:    { label: 'Withdrawn',    emoji: '↩️', color: '#6b7280', bg: 'rgba(107,114,128,0.08)'},
}

const STATUS_ORDER: AppStatus[] = ['saved','applied','phone_screen','interview','assessment','offer','accepted','rejected','withdrawn']

const JOB_TYPE_LABELS: Record<JobType, string> = {
  parttime: 'Part-time', vacation: 'Vacation Work', grad: 'Grad Programme',
  learnership: 'Learnership', remote: 'Remote / Freelance',
  internship: 'Internship', fulltime: 'Full-time', other: 'Other',
}

const PIPELINE_STEPS: AppStatus[] = ['saved', 'applied', 'phone_screen', 'interview', 'assessment', 'offer']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deadlineTag(deadline: string | null): { text: string; color: string } | null {
  if (!deadline) return null
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (diff < 0)   return { text: `${Math.abs(diff)}d overdue`, color: '#ef4444' }
  if (diff === 0) return { text: 'Due today', color: '#ef4444' }
  if (diff <= 3)  return { text: `${diff}d left`, color: '#f87171' }
  if (diff <= 7)  return { text: `${diff}d left`, color: '#f59e0b' }
  return { text: `${diff}d left`, color: '#94a3b8' }
}

function interviewCountdown(interview_at: string | null): string | null {
  if (!interview_at) return null
  const diff = Math.ceil((new Date(interview_at).getTime() - Date.now()) / 86400000)
  if (diff < 0)    return null
  if (diff === 0)  return '🚨 Interview today!'
  if (diff === 1)  return '⚠️ Interview tomorrow'
  if (diff <= 7)   return `🎯 Interview in ${diff} days`
  return null
}

const EMPTY_FORM = {
  job_title: '', company: '', job_type: 'grad' as JobType,
  status: 'saved' as AppStatus, location: '', salary_range: '',
  deadline: '', applied_date: '', interview_at: '', notes: '', url: '',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function JobApplicationTracker({ userId }: { userId: string }) {
  const [apps, setApps]         = useState<JobApp[]>([])
  const [loading, setLoading]   = useState(true)
  const [adding, setAdding]     = useState(false)
  const [saving, setSaving]     = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  // Draft notes for the currently-expanded card. Only one card is open at a
  // time, so a single parent state replaces the per-item useState that used to
  // live inside .map() — that was a Rules-of-Hooks violation (hook count changed
  // when the list grew/shrank/filtered) and crashed the tab.
  const [noteDraft, setNoteDraft] = useState('')
  const [form, setForm]         = useState(EMPTY_FORM)
  const [filter, setFilter]     = useState<AppStatus | 'all'>('all')

  useEffect(() => {
    fetch('/api/career/applications')
      .then(r => r.json())
      .then(d => { setApps(d.applications ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const visible = filter === 'all' ? apps : apps.filter(a => a.status === filter)

  // Summary stats
  const active     = apps.filter(a => !['rejected','withdrawn','accepted'].includes(a.status)).length
  const interviews = apps.filter(a => a.status === 'interview').length
  const offers     = apps.filter(a => a.status === 'offer' || a.status === 'accepted').length

  const handleAdd = async () => {
    if (!form.job_title.trim() || !form.company.trim()) {
      toast.error('Job title and company are required')
      return
    }
    setSaving(true)
    const res = await fetch('/api/career/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form }),
    })
    const d = await res.json()
    if (!res.ok) { toast.error(d.error || 'Failed to save'); setSaving(false); return }
    setApps(prev => [d.application, ...prev])
    setForm(EMPTY_FORM)
    setAdding(false)
    toast.success('Application saved!')
    setSaving(false)
  }

  const updateStatus = async (id: string, status: AppStatus) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    await fetch(`/api/career/applications?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {})
  }

  const saveNotes = async (id: string, notes: string) => {
    await fetch(`/api/career/applications?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    }).catch(() => {})
  }

  const saveInterviewAt = async (id: string, interview_at: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, interview_at: interview_at || null } : a))
    await fetch(`/api/career/applications?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interview_at: interview_at || null }),
    }).catch(() => {})
  }

  const deleteApp = async (id: string) => {
    setApps(prev => prev.filter(a => a.id !== id))
    await fetch(`/api/career/applications?id=${id}`, { method: 'DELETE' }).catch(() => {})
    toast.success('Removed')
  }

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '14px 16px',
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#fff' }}>Loading applications…</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Summary chips ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { label: 'Active', value: active,     color: '#60a5fa' },
          { label: 'Interviews', value: interviews, color: '#818cf8' },
          { label: 'Offers', value: offers,     color: '#34d399' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: s.color, lineHeight: 1, marginBottom: 3 }}>{s.value}</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Add button ─────────────────────────────────────────────────────── */}
      <button
        onClick={() => setAdding(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '12px', borderRadius: 12, cursor: 'pointer',
          border: '1px dashed rgba(78,207,158,0.4)',
          background: adding ? 'rgba(78,207,158,0.08)' : 'transparent',
          color: '#4ecf9e', fontFamily: 'var(--font-mono)', fontSize: 12,
        }}
      >
        <Plus size={14} />
        {adding ? 'Cancel' : 'Track new application'}
      </button>

      {/* ── Add form ────────────────────────────────────────────────────────── */}
      {adding && (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4ecf9e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>New Application</p>

          {[
            { label: 'Job title *',  key: 'job_title',  placeholder: 'e.g. Graduate Trainee – Audit' },
            { label: 'Company *',    key: 'company',    placeholder: 'e.g. PwC South Africa' },
            { label: 'Location',     key: 'location',   placeholder: 'e.g. Johannesburg / Remote' },
            { label: 'Salary range', key: 'salary_range', placeholder: 'e.g. R25,000–R30,000/mo' },
            { label: 'Job URL',      key: 'url',        placeholder: 'https://…' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>{label}</label>
              <input
                value={(form as Record<string, string>)[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Deadline</label>
              <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Applied date</label>
              <input type="date" value={form.applied_date} onChange={e => setForm(p => ({ ...p, applied_date: e.target.value }))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }} />
            </div>
          </div>

          {/* Status */}
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Status</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STATUS_ORDER.map(s => {
                const m = STATUS_META[s]
                const active = form.status === s
                return (
                  <button key={s} onClick={() => setForm(p => ({ ...p, status: s }))} style={{
                    padding: '5px 10px', borderRadius: 20, border: `1px solid ${active ? m.color : 'rgba(255,255,255,0.1)'}`,
                    background: active ? m.bg : 'transparent',
                    color: active ? m.color : 'rgba(255,255,255,0.62)',
                    fontFamily: 'var(--font-mono)', fontSize: 10.5, cursor: 'pointer',
                  }}>
                    {m.emoji} {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Job type */}
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(Object.keys(JOB_TYPE_LABELS) as JobType[]).map(t => (
                <button key={t} onClick={() => setForm(p => ({ ...p, job_type: t }))} style={{
                  padding: '5px 10px', borderRadius: 20,
                  border: `1px solid ${form.job_type === t ? '#4ecf9e' : 'rgba(255,255,255,0.1)'}`,
                  background: form.job_type === t ? 'rgba(78,207,158,0.1)' : 'transparent',
                  color: form.job_type === t ? '#4ecf9e' : 'rgba(255,255,255,0.62)',
                  fontFamily: 'var(--font-mono)', fontSize: 10.5, cursor: 'pointer',
                }}>
                  {JOB_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleAdd} disabled={saving} style={{
            width: '100%', padding: '11px', borderRadius: 10,
            background: 'rgba(78,207,158,0.14)', border: '1px solid rgba(78,207,158,0.35)',
            color: '#4ecf9e', fontFamily: 'var(--font-mono)', fontSize: 12,
            cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1,
          }}>
            {saving ? 'Saving…' : 'Save Application'}
          </button>
        </div>
      )}

      {/* ── Status filter ──────────────────────────────────────────────────── */}
      {apps.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['all', ...STATUS_ORDER] as const).map(s => {
            const isAll = s === 'all'
            const count = isAll ? apps.length : apps.filter(a => a.status === s).length
            if (!isAll && count === 0) return null
            const m = isAll ? null : STATUS_META[s]
            const active = filter === s
            return (
              <button key={s} onClick={() => setFilter(s)} style={{
                padding: '5px 10px', borderRadius: 20,
                border: `1px solid ${active ? (m?.color ?? '#94a3b8') : 'rgba(255,255,255,0.1)'}`,
                background: active ? (m ? m.bg : 'rgba(148,163,184,0.1)') : 'transparent',
                color: active ? (m?.color ?? '#94a3b8') : 'rgba(255,255,255,0.58)',
                fontFamily: 'var(--font-mono)', fontSize: 10.5, cursor: 'pointer',
              }}>
                {isAll ? `All (${count})` : `${m!.emoji} ${m!.label} (${count})`}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Application list ───────────────────────────────────────────────── */}
      {visible.length === 0 && !adding ? (
        <div style={{ ...card, textAlign: 'center', padding: '32px 20px' }}>
          <Briefcase size={28} style={{ color: '#fff', margin: '0 auto 10px' }} />
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#fff', marginBottom: 6 }}>
            {apps.length === 0 ? 'No applications tracked yet' : 'Nothing here'}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#fff' }}>
            Start tracking — click the button above to add your first application.
          </p>
        </div>
      ) : (
        visible.map(app => {
          const m     = STATUS_META[app.status]
          const ddTag = deadlineTag(app.deadline)
          const ivMsg = interviewCountdown(app.interview_at)
          const isOpen = expanded === app.id

          return (
            <div key={app.id} style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${isOpen ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, overflow: 'hidden' }}>
              {/* Header row */}
              <div
                onClick={() => { const willOpen = !isOpen; setExpanded(willOpen ? app.id : null); if (willOpen) setNoteDraft(app.notes ?? '') }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 14px', cursor: 'pointer' }}
              >
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{m.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13.5, color: '#fff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {app.job_title}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#fff' }}>{app.company}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: m.color, background: m.bg, padding: '2px 7px', borderRadius: 6 }}>
                      {m.label}
                    </span>
                    {ddTag && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: ddTag.color }}>⏰ {ddTag.text}</span>
                    )}
                    {ivMsg && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: '#818cf8' }}>{ivMsg}</span>
                    )}
                  </div>
                </div>
                <div style={{ flexShrink: 0, color: '#fff', marginTop: 3 }}>
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Pipeline stepper */}
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Update status</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {STATUS_ORDER.map(s => {
                        const sm = STATUS_META[s]
                        const active = app.status === s
                        return (
                          <button key={s} onClick={() => updateStatus(app.id, s)} style={{
                            padding: '5px 10px', borderRadius: 20,
                            border: `1px solid ${active ? sm.color : 'rgba(255,255,255,0.1)'}`,
                            background: active ? sm.bg : 'transparent',
                            color: active ? sm.color : 'rgba(255,255,255,0.58)',
                            fontFamily: 'var(--font-mono)', fontSize: 10.5, cursor: 'pointer',
                          }}>
                            {sm.emoji} {sm.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Interview date */}
                  {(app.status === 'phone_screen' || app.status === 'interview' || app.status === 'assessment') && (
                    <div>
                      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>
                        Interview / assessment date & time
                      </label>
                      <input
                        type="datetime-local"
                        defaultValue={app.interview_at ? app.interview_at.slice(0, 16) : ''}
                        onBlur={e => saveInterviewAt(app.id, e.target.value)}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }}
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>
                      Notes (auto-saved)
                    </label>
                    <textarea
                      rows={3}
                      value={noteDraft}
                      onChange={e => setNoteDraft(e.target.value)}
                      onBlur={() => saveNotes(app.id, noteDraft)}
                      placeholder="Interview prep notes, contact person, next steps…"
                      style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 12.5, outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }}
                    />
                  </div>

                  {/* Meta row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    {app.location && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#fff' }}>📍 {app.location}</span>
                    )}
                    {app.salary_range && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4ecf9e' }}>💰 {app.salary_range}</span>
                    )}
                    {app.applied_date && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#fff' }}>📤 Applied {app.applied_date}</span>
                    )}
                    {app.url && (
                      <a href={app.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 10, color: '#60a5fa', textDecoration: 'none' }}>
                        <ExternalLink size={11} /> View listing
                      </a>
                    )}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#fff' }}>
                      {JOB_TYPE_LABELS[app.job_type]}
                    </span>
                    <button onClick={() => deleteApp(app.id)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '4px 9px', color: 'rgb(239,68,68)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}

      {/* ── Upcoming interviews alert ──────────────────────────────────────── */}
      {apps.filter(a => a.interview_at && interviewCountdown(a.interview_at)).map(app => {
        const msg = interviewCountdown(app.interview_at)
        if (!msg) return null
        return (
          <div key={`alert-${app.id}`} style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 12, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🎯</span>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12.5, color: '#fff', marginBottom: 2 }}>{app.job_title} — {app.company}</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#818cf8' }}>{msg}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
