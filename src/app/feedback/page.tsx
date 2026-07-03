'use client'

import { useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { AmbientImage } from '@/components/ui/AmbientImage'

const CATEGORIES = [
  { value: 'general',         label: '💬 General' },
  { value: 'bug',             label: '🐛 Bug report' },
  { value: 'feature_request', label: '✨ Feature idea' },
  { value: 'nova_feedback',   label: '🌟 Nova feedback' },
  { value: 'study',           label: '📚 Study' },
  { value: 'budget',          label: '💰 Budget' },
  { value: 'other',           label: '📝 Other' },
]

const RECENT_WINS = [
  { icon: '📐', text: 'Vertical tab rails replaced all horizontal scroll navs' },
  { icon: '🌤️', text: 'Weather widget now shows proactive study tips' },
  { icon: '🤝', text: 'Accountability Partners added to Social room' },
  { icon: '🧠', text: 'Procrastination Profiler now has a 5-step action plan' },
  { icon: '🗓️', text: 'Week strip now shows tasks correctly for all date formats' },
  { icon: '▶️', text: 'Just Start button now goes directly to Pomodoro timer' },
]

const GOOGLE_REVIEW_URL = 'https://g.page/r/CdPIXBcTmJE6EAI/review'

export default function FeedbackPage() {
  const [rating,     setRating]     = useState(0)
  const [category,   setCategory]   = useState('general')
  const [message,    setMessage]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)
  const [highRater,  setHighRater]  = useState(false)

  const submit = async () => {
    if (!rating) { toast.error('Please select a star rating'); return }
    if (!message.trim()) { toast.error('Please write a message'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, category, message }),
      })
      if (!res.ok) throw new Error()
      setDone(true)
      setHighRater(rating >= 4)
      toast.success('Feedback sent — thank you!')
    } catch {
      toast.error('Failed to send — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: 96, position: 'relative', overflowX: 'hidden' }}>
      <AmbientImage zone="nova" opacity={0.32} blurPx={2} saturation={1.4} />
      <TopBar title="Rate & Feedback" />

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>

        {done ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{highRater ? '🌟' : '💙'}</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>
              {highRater ? 'You\'re amazing — thank you!' : 'Got it — we\'ll do better'}
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 28, lineHeight: 1.6 }}>
              {highRater
                ? 'Your feedback goes directly to the builder. Want to help other students find VarsityOS?'
                : 'Every piece of criticism makes this better. It goes directly to the builder.'}
            </div>
            {highRater && (
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', borderRadius: 14,
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  color: '#fbbf24',
                  fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14,
                  textDecoration: 'none', marginBottom: 16,
                }}
              >
                ⭐ Leave a Google Review
              </a>
            )}
            <div>
              <button
                onClick={() => { setDone(false); setRating(0); setMessage(''); setCategory('general') }}
                style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                Send more feedback →
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(78,207,158,0.08) 0%, transparent 80%)',
              border: '1px solid rgba(78,207,158,0.2)', borderRadius: 16, padding: '18px 20px',
            }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#4ecf9e', letterSpacing: '0.14em', marginBottom: 6 }}>
                BUILT IN SA · FOR SA STUDENTS
              </div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 17, color: 'var(--text-primary)', marginBottom: 6 }}>
                Your feedback shapes VarsityOS
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                Every bug report, feature idea, and star rating goes directly to the builder. This app exists because of student voices.
              </div>
            </div>

            {/* Star rating */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: 12 }}>
                HOW ARE YOU FINDING VARSITYOS?
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    style={{
                      fontSize: 34, background: 'none', border: 'none', cursor: 'pointer',
                      color: rating >= star ? '#fbbf24' : 'rgba(255,255,255,0.12)',
                      transition: 'all 0.15s', transform: rating >= star ? 'scale(1.05)' : 'scale(1)',
                      padding: '2px 4px',
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#fbbf24', marginTop: 8 }}>
                  {['', 'Needs major work', 'Room for improvement', 'Getting there', 'Really good!', 'Absolutely love it!'][rating]}
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: 10 }}>
                WHAT IS THIS ABOUT?
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                      padding: '6px 12px', borderRadius: 99, cursor: 'pointer',
                      background: category === c.value ? 'rgba(78,207,158,0.12)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${category === c.value ? 'rgba(78,207,158,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: category === c.value ? '#4ecf9e' : 'rgba(255,255,255,0.45)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: 10 }}>
                YOUR MESSAGE *
              </div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us what's working, what's broken, or what you wish existed..."
                rows={5}
                maxLength={1000}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14, padding: '14px 16px',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 14,
                  color: 'var(--text-primary)', lineHeight: 1.6,
                  outline: 'none', resize: 'vertical',
                }}
              />
              <div style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
                {message.length}/1000
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={submit}
              disabled={submitting || !message.trim() || !rating}
              style={{
                width: '100%', padding: '14px 0',
                fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 15,
                background: (message.trim() && rating) ? '#4ecf9e' : 'rgba(255,255,255,0.08)',
                color: (message.trim() && rating) ? '#000' : 'rgba(255,255,255,0.25)',
                border: 'none', borderRadius: 14, cursor: (message.trim() && rating) ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              {submitting ? 'Sending…' : 'Send feedback'}
            </button>

            {/* Google review link */}
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 0', borderRadius: 14,
                background: 'rgba(245,158,11,0.07)',
                border: '1px solid rgba(245,158,11,0.18)',
                color: 'rgba(251,191,36,0.85)',
                fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 14,
                textDecoration: 'none',
              }}
            >
              ⭐ Leave a Google Review — helps other students find us
            </a>

            {/* Recent wins */}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', marginBottom: 12 }}>
                RECENT CHANGES POWERED BY YOUR FEEDBACK
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {RECENT_WINS.map((w, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    padding: '8px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{w.icon}</span>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{w.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/profile" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', textDecoration: 'none' }}>
              Also in Profile → Feedback & Reviews
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
