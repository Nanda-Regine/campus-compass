'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Star, GraduationCap, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import BecomeATutorModal from './BecomeATutorModal'
import BookSessionModal from './BookSessionModal'

interface TutorProfile {
  subjects: string[]
  rate_per_hour: number
  bio: string | null
  availability: string | null
  is_available: boolean
  is_verified: boolean
  is_verified_pending: boolean
}

interface Tutor {
  user_id: string
  name: string
  emoji: string
  bio: string | null
  subjects: string[]
  institution: string | null
  faculty: string | null
  year_of_study: string | null
  rate_per_hour: number
  availability: string | null
  is_available: boolean
  session_count: number
  average_rating: number | null
  is_verified: boolean
  is_verified_pending: boolean
}

interface Session {
  id: string
  tutor_id: string
  student_id: string
  subject: string
  scheduled_date: string | null
  duration_hours: number
  total_amount: number
  status: string
  notes: string | null
  created_at: string
  tutor_name: string
  tutor_emoji: string
  student_name: string
  student_emoji: string
  already_reviewed: boolean
}

interface Props {
  userId: string
  userInstitution: string | null
}

export default function TutoringMarketplace({ userId, userInstitution }: Props) {
  const [tab, setTab] = useState<'browse' | 'sessions'>('browse')
  const [sessionRole, setSessionRole] = useState<'student' | 'tutor'>('student')
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [myTutorProfile, setMyTutorProfile] = useState<TutorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showBecomeTutor, setShowBecomeTutor] = useState(false)
  const [bookingTutor, setBookingTutor] = useState<Tutor | null>(null)
  const [reviewingSession, setReviewingSession] = useState<Session | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')

  const fetchTutors = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (userInstitution) params.set('institution', userInstitution)
    if (search.trim()) params.set('subject', search.trim())
    const res = await fetch(`/api/tutors?${params}`)
    if (res.ok) {
      const d = await res.json()
      setTutors(d.tutors ?? [])
      setMyTutorProfile(d.myTutorProfile)
    }
    setLoading(false)
  }, [userInstitution, search])

  const fetchSessions = useCallback(async () => {
    const res = await fetch(`/api/tutors/sessions?role=${sessionRole}`)
    if (res.ok) setSessions((await res.json()).sessions ?? [])
  }, [sessionRole])

  useEffect(() => { fetchTutors() }, [fetchTutors])
  useEffect(() => { if (tab === 'sessions') fetchSessions() }, [tab, fetchSessions])

  async function updateSessionStatus(session_id: string, status: string) {
    const res = await fetch('/api/tutors/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, status }),
    })
    if (res.ok) {
      toast.success(`Session ${status}`)
      fetchSessions()
    }
  }

  async function submitReview() {
    if (!reviewingSession) return
    const res = await fetch('/api/tutors/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: reviewingSession.id, rating: reviewRating, comment: reviewComment }),
    })
    if (res.ok) { toast.success('Review submitted!'); setReviewingSession(null); fetchSessions() }
    else toast.error('Failed to submit review')
  }

  const TABS = [
    { id: 'browse',   label: 'Find Tutors' },
    { id: 'sessions', label: 'My Sessions' },
  ] as const

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Peer Tutoring</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#fff', marginTop: 2 }}>
              {userInstitution ?? 'All institutions'} · learn from your peers
            </div>
          </div>
          <button
            onClick={() => setShowBecomeTutor(true)}
            style={{ padding: '9px 14px', background: myTutorProfile ? 'rgba(78,207,158,0.12)' : '#4ecf9e', borderRadius: 20, border: myTutorProfile ? '0.5px solid #4ecf9e' : 'none', color: myTutorProfile ? '#4ecf9e' : '#000', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
          >
            {myTutorProfile ? 'Edit Profile' : 'Become Tutor'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '6px 14px', borderRadius: 20, border: '0.5px solid', borderColor: tab === t.id ? '#4ecf9e' : 'rgba(255,255,255,0.1)', background: tab === t.id ? 'rgba(78,207,158,0.12)' : 'rgba(255,255,255,0.07)', color: tab === t.id ? '#4ecf9e' : 'rgba(255,255,255,0.62)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'browse' && (
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#fff' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by subject or module" style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 10, paddingBottom: 10, background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
        )}

        {tab === 'sessions' && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
            {(['student', 'tutor'] as const).map(r => (
              <button key={r} onClick={() => setSessionRole(r)} style={{ padding: '5px 12px', borderRadius: 20, border: '0.5px solid', borderColor: sessionRole === r ? '#c9a84c' : 'rgba(255,255,255,0.1)', background: sessionRole === r ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.07)', color: sessionRole === r ? '#c9a84c' : 'rgba(255,255,255,0.58)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', cursor: 'pointer' }}>
                As {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px' }}>
        {tab === 'browse' ? (
          loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ height: 130, borderRadius: 14, background: 'rgba(255,255,255,0.07)', marginBottom: 10 }} />)
          ) : tutors.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 48, color: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem' }}>
              <GraduationCap size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div>No tutors found — be the first to sign up!</div>
            </div>
          ) : (
            tutors.map(t => (
              <TutorCard key={t.user_id} tutor={t} isSelf={t.user_id === userId} onBook={() => setBookingTutor(t)} />
            ))
          )
        ) : (
          sessions.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 48, color: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem' }}>
              <Clock size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div>No sessions yet</div>
            </div>
          ) : (
            sessions.map(s => (
              <SessionCard
                key={s.id} session={s} role={sessionRole}
                userId={userId}
                onConfirm={() => updateSessionStatus(s.id, 'confirmed')}
                onComplete={() => updateSessionStatus(s.id, 'completed')}
                onCancel={() => updateSessionStatus(s.id, 'cancelled')}
                onReview={() => { setReviewingSession(s); setReviewRating(5); setReviewComment('') }}
              />
            ))
          )
        )}
      </div>

      {/* Review modal */}
      {reviewingSession && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(6px)' }}>
          <div style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 16 }}>
              Rate {reviewingSession.tutor_name}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setReviewRating(n)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '0.5px solid', borderColor: reviewRating >= n ? '#f59e0b' : 'rgba(255,255,255,0.1)', background: reviewRating >= n ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.07)', fontSize: '1.2rem', cursor: 'pointer' }}>
                  ⭐
                </button>
              ))}
            </div>
            <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="How was the session? (optional)" style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif', outline: 'none', resize: 'none', height: 80, boxSizing: 'border-box', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setReviewingSession(null)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '0.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitReview} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: '#f59e0b', color: '#000', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>Submit Review</button>
            </div>
          </div>
        </div>
      )}

      {showBecomeTutor && (
        <BecomeATutorModal existing={myTutorProfile} onClose={() => setShowBecomeTutor(false)} onSaved={() => { setShowBecomeTutor(false); fetchTutors() }} />
      )}

      {bookingTutor && (
        <BookSessionModal tutor={bookingTutor} onClose={() => setBookingTutor(null)} onBooked={() => { setBookingTutor(null); setTab('sessions') }} />
      )}
    </div>
  )
}

function TutorCard({ tutor, isSelf, onBook }: { tutor: Tutor; isSelf: boolean; onBook: () => void }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(78,207,158,0.12)', borderRadius: 16, padding: 14, marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #4ecf9e50, transparent)', borderRadius: '16px 16px 0 0' }} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(78,207,158,0.1)', border: '1px solid rgba(78,207,158,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
          {tutor.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{tutor.name}</span>
            {tutor.is_verified && (
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.63rem', color: '#4ecf9e', background: 'rgba(78,207,158,0.1)', border: '0.5px solid rgba(78,207,158,0.3)', padding: '2px 7px', borderRadius: 9999, display: 'flex', alignItems: 'center', gap: 3 }}>
                <CheckCircle size={9} /> Verified
              </span>
            )}
            {tutor.average_rating && (
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '0.5px solid rgba(245,158,11,0.25)', padding: '2px 7px', borderRadius: 9999 }}>
                ⭐ {tutor.average_rating} ({tutor.session_count})
              </span>
            )}
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: '#fff', marginTop: 2 }}>
            {[tutor.faculty, tutor.year_of_study ? `Year ${tutor.year_of_study}` : null].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '0.9rem', color: '#4ecf9e', flexShrink: 0 }}>
          R{tutor.rate_per_hour}/hr
        </div>
      </div>

      {/* Subjects */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: tutor.bio ? 8 : 10 }}>
        {tutor.subjects.slice(0, 6).map(s => (
          <span key={s} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#fff', background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)', padding: '2px 7px', borderRadius: 9999 }}>{s}</span>
        ))}
      </div>

      {tutor.bio && (
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.73rem', color: '#fff', marginBottom: 10, lineHeight: 1.4 }}>
          {tutor.bio.slice(0, 120)}{tutor.bio.length > 120 ? '...' : ''}
        </div>
      )}

      {tutor.availability && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
          <Clock size={11} style={{ color: '#fff' }} />
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.68rem', color: '#fff' }}>{tutor.availability}</span>
        </div>
      )}

      {!isSelf && (
        <button onClick={onBook} style={{ width: '100%', padding: '11px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #4ecf9e, #0d9488)', color: '#000', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 2px 12px rgba(78,207,158,0.25)', transition: 'all 0.2s' }}>
          Book a session →
        </button>
      )}
    </div>
  )
}

const STATUS_COLOR: Record<string, string> = {
  pending:   '#f59e0b',
  confirmed: '#4ecf9e',
  completed: '#7090d0',
  cancelled: '#ef4444',
}

function SessionCard({ session, role, userId, onConfirm, onComplete, onCancel, onReview }: {
  session: Session; role: 'student' | 'tutor'; userId: string
  onConfirm: () => void; onComplete: () => void; onCancel: () => void; onReview: () => void
}) {
  const color = STATUS_COLOR[session.status] ?? '#4ecf9e'
  const other = role === 'student'
    ? `${session.tutor_emoji} ${session.tutor_name}`
    : `${session.student_emoji} ${session.student_name}`

  return (
    <div style={{ background: 'var(--bg-surface)', border: `1px solid ${color}22`, borderRadius: 16, padding: 14, marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}60, transparent)`, borderRadius: '16px 16px 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{session.subject}</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: '#fff', marginTop: 2 }}>{other}</div>
        </div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.63rem', color, background: `${color}15`, border: `0.5px solid ${color}35`, padding: '3px 8px', borderRadius: 9999, textTransform: 'uppercase' }}>
          {session.status}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: session.notes ? 8 : 10 }}>
        {session.scheduled_date && (
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#fff' }}>📅 {session.scheduled_date}</span>
        )}
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#fff' }}>⏱ {session.duration_hours}h</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#4ecf9e' }}>R{Number(session.total_amount).toFixed(0)}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#fff' }}>💵 cash/EFT</span>
      </div>

      {session.notes && (
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: '#fff', marginBottom: 10, lineHeight: 1.4 }}>
          {session.notes}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6 }}>
        {role === 'tutor' && session.status === 'pending' && (
          <>
            <button onClick={onConfirm} style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', background: '#4ecf9e', color: '#000', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <CheckCircle size={13} /> Confirm
            </button>
            <button onClick={onCancel} style={{ flex: 1, padding: '8px', borderRadius: 9, border: '0.5px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <XCircle size={13} /> Decline
            </button>
          </>
        )}
        {role === 'tutor' && session.status === 'confirmed' && (
          <button onClick={onComplete} style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', background: '#7090d0', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
            Mark Complete
          </button>
        )}
        {role === 'student' && session.status === 'completed' && !session.already_reviewed && (
          <button onClick={onReview} style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', background: '#f59e0b', color: '#000', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <MessageSquare size={13} /> Rate Tutor
          </button>
        )}
        {role === 'student' && session.status === 'pending' && (
          <button onClick={onCancel} style={{ flex: 1, padding: '8px', borderRadius: 9, border: '0.5px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', cursor: 'pointer' }}>
            Cancel request
          </button>
        )}
      </div>
    </div>
  )
}
