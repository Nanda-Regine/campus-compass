'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Trash2, Sparkles, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ──────────────────────────────────────────────────────────────────

interface JournalEntry {
  id: string
  entry_text: string
  mood_score: number | null
  ai_reflection: string | null
  entry_date: string
  created_at: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MOOD_OPTIONS = [
  { score: 1, emoji: '😔', label: 'Struggling' },
  { score: 2, emoji: '😕', label: 'Low'        },
  { score: 3, emoji: '😐', label: 'OK'          },
  { score: 4, emoji: '🙂', label: 'Good'        },
  { score: 5, emoji: '😊', label: 'Great'       },
]

const PROMPTS = [
  'What\'s weighing on you right now? Write it out — no filter needed.',
  'What happened today that you\'re still thinking about?',
  'If you could say one thing to yourself that you can\'t say to anyone else, what would it be?',
  'What does "getting through this" look like to you right now?',
  'What made today feel hard? What helped, even a little?',
  'What are you proud of this week, even in the smallest way?',
  'Who or what gave you energy today? Who or what drained it?',
]

function formatEntryDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7)   return `${diff} days ago`
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function WellbeingJournal({ userId }: { userId: string }) {
  const [entries,     setEntries]     = useState<JournalEntry[]>([])
  const [loading,     setLoading]     = useState(true)
  const [text,        setText]        = useState('')
  const [mood,        setMood]        = useState<number | null>(null)
  const [reflecting,  setReflecting]  = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [reflection,  setReflection]  = useState<string | null>(null)
  const [isCrisis,    setIsCrisis]    = useState(false)
  const [promptIdx]                   = useState(() => Math.floor(Math.random() * PROMPTS.length))
  const [expanded,    setExpanded]    = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/wellbeing/journal?limit=20')
      .then(r => r.json())
      .then(d => { setEntries(d.entries ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const getReflection = async () => {
    if (text.trim().length < 20) { toast.error('Write a bit more first (at least 20 characters)'); return }
    setReflecting(true)
    setReflection(null)
    try {
      const res = await fetch('/api/wellbeing/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_text: text }),
      })
      const d = await res.json()
      if (d.reflection) {
        setReflection(d.reflection)
        setIsCrisis(d.crisis ?? false)
      }
    } catch {
      toast.error('Could not get reflection')
    }
    setReflecting(false)
  }

  const saveEntry = async () => {
    if (text.trim().length < 5) { toast.error('Write something first'); return }
    setSaving(true)
    const res = await fetch('/api/wellbeing/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry_text:    text.trim(),
        mood_score:    mood,
        ai_reflection: reflection,
        entry_date:    new Date().toISOString().split('T')[0],
      }),
    })
    const d = await res.json()
    if (!res.ok) { toast.error(d.error || 'Failed to save'); setSaving(false); return }
    setEntries(prev => [d.entry, ...prev])
    setText('')
    setMood(null)
    setReflection(null)
    setIsCrisis(false)
    toast.success('Entry saved 🌟')
    setSaving(false)
  }

  const deleteEntry = async (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
    await fetch(`/api/wellbeing/journal?id=${id}`, { method: 'DELETE' }).catch(() => {})
  }

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '14px 16px',
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Loading journal…</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Intro ───────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.1) 0%, rgba(167,139,250,0.03) 100%)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 14, padding: '14px 16px' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13.5, color: 'rgba(255,255,255,0.88)', marginBottom: 4 }}>
          Your private space 🌙
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          Only you can see these entries. Write freely — no grammar, no filter. Your AI companion will hold space after you share.
        </p>
      </div>

      {/* ── Write new entry ─────────────────────────────────────────────── */}
      <div style={card}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          Today&apos;s entry
        </p>

        {/* Prompt suggestion */}
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 11.5, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginBottom: 10, lineHeight: 1.5 }}>
          "{PROMPTS[promptIdx]}"
        </p>

        <textarea
          rows={6}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Start writing here — no one else will see this…"
          style={{
            width: '100%', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
            padding: '12px', color: 'rgba(255,255,255,0.85)',
            fontFamily: 'var(--font-body)', fontSize: 13.5,
            lineHeight: 1.65, outline: 'none', resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(255,255,255,0.2)', textAlign: 'right', marginTop: 4 }}>
          {text.length} chars
        </p>

        {/* Mood selector */}
        <div style={{ marginTop: 12, marginBottom: 14 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            How are you feeling right now?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {MOOD_OPTIONS.map(m => (
              <button
                key={m.score}
                onClick={() => setMood(mood === m.score ? null : m.score)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '8px 4px', borderRadius: 10,
                  border: `1px solid ${mood === m.score ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  background: mood === m.score ? 'rgba(167,139,250,0.12)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 20 }}>{m.emoji}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: mood === m.score ? '#a78bfa' : 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={getReflection}
            disabled={reflecting || text.trim().length < 20}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px', borderRadius: 10,
              border: '1px solid rgba(167,139,250,0.35)',
              background: 'rgba(167,139,250,0.1)',
              color: '#a78bfa', fontFamily: 'var(--font-mono)', fontSize: 11,
              cursor: (reflecting || text.trim().length < 20) ? 'default' : 'pointer',
              opacity: (reflecting || text.trim().length < 20) ? 0.5 : 1,
            }}
          >
            {reflecting ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={13} />}
            {reflecting ? 'Reflecting…' : 'Get AI reflection'}
          </button>
          <button
            onClick={saveEntry}
            disabled={saving || text.trim().length < 5}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px', borderRadius: 10,
              border: '1px solid rgba(78,207,158,0.35)',
              background: 'rgba(78,207,158,0.1)',
              color: '#4ecf9e', fontFamily: 'var(--font-mono)', fontSize: 11,
              cursor: (saving || text.trim().length < 5) ? 'default' : 'pointer',
              opacity: (saving || text.trim().length < 5) ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving…' : '💾 Save entry'}
          </button>
        </div>
      </div>

      {/* ── AI reflection ────────────────────────────────────────────────── */}
      {reflection && (
        <div style={{
          background: isCrisis ? 'rgba(239,68,68,0.08)' : 'rgba(167,139,250,0.08)',
          border: `1px solid ${isCrisis ? 'rgba(239,68,68,0.25)' : 'rgba(167,139,250,0.25)'}`,
          borderRadius: 14, padding: '16px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>{isCrisis ? '💙' : '🌟'}</span>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: isCrisis ? 'rgba(239,68,68,0.7)' : 'rgba(167,139,250,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {isCrisis ? 'You matter — please reach out' : 'Your companion responds'}
            </p>
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, color: 'rgba(255,255,255,0.82)', lineHeight: 1.7 }}>
            {reflection}
          </p>
          {isCrisis && (
            <a href="tel:0800456789" style={{ display: 'inline-block', marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '6px 12px', textDecoration: 'none' }}>
              📞 Call SADAG: 0800 456 789
            </a>
          )}
        </div>
      )}

      {/* ── Past entries ─────────────────────────────────────────────────── */}
      {entries.length > 0 && (
        <div style={card}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
            Past entries ({entries.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entries.map(e => {
              const moodMeta = MOOD_OPTIONS.find(m => m.score === e.mood_score)
              const isOpen = expanded === e.id
              return (
                <div key={e.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                  <div
                    onClick={() => setExpanded(isOpen ? null : e.id)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 13px', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{moodMeta?.emoji ?? '📝'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
                          {formatEntryDate(e.entry_date)}
                        </span>
                        {moodMeta && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(167,139,250,0.6)' }}>{moodMeta.label}</span>
                        )}
                      </div>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: isOpen ? 999 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {e.entry_text}
                      </p>
                    </div>
                    <button
                      onClick={ev => { ev.stopPropagation(); if (confirm('Delete this journal entry?')) deleteEntry(e.id) }}
                      style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: '2px 4px' }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                  {isOpen && e.ai_reflection && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 13px', background: 'rgba(167,139,250,0.04)' }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(167,139,250,0.55)', marginBottom: 5 }}>🌟 Companion reflection</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 12.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65 }}>{e.ai_reflection}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {entries.length === 0 && !loading && (
        <div style={{ ...card, textAlign: 'center', padding: '28px 20px' }}>
          <BookOpen size={28} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 10px' }} />
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Your journal is empty</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(255,255,255,0.25)' }}>Write your first entry above — it stays private, just for you.</p>
        </div>
      )}
    </div>
  )
}
