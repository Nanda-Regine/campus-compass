'use client'

import { useState } from 'react'
import { X, Calendar, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface Tutor {
  user_id: string
  name: string
  emoji: string
  rate_per_hour: number
  subjects: string[]
  faculty: string | null
}

interface Props {
  tutor: Tutor
  onClose: () => void
  onBooked: () => void
}

const DURATIONS = [
  { value: 0.5, label: '30 min' },
  { value: 1,   label: '1 hour' },
  { value: 1.5, label: '1.5 hrs' },
  { value: 2,   label: '2 hours' },
]

export default function BookSessionModal({ tutor, onClose, onBooked }: Props) {
  const [subject, setSubject] = useState(tutor.subjects[0] ?? '')
  const [date, setDate] = useState('')
  const [duration, setDuration] = useState(1)
  const [notes, setNotes] = useState('')
  const [booking, setBooking] = useState(false)

  const total = tutor.rate_per_hour * duration

  async function handleBook(e: React.FormEvent) {
    e.preventDefault()
    setBooking(true)
    try {
      const res = await fetch('/api/tutors/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutor_id: tutor.user_id,
          subject: subject.trim(),
          scheduled_date: date || null,
          duration_hours: duration,
          payment_method: 'in_person',
          notes,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      toast.success('Session requested! Tutor will confirm shortly.')
      onBooked()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setBooking(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.12)',
    borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.82rem',
    fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(6px)' }}>
      <div style={{ width: '100%', maxHeight: '92vh', overflowY: 'auto', background: '#0d1117', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              {tutor.emoji}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Book {tutor.name}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#4ecf9e' }}>R{tutor.rate_per_hour}/hr</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Subject */}
          <div>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Subject</label>
            {tutor.subjects.length > 1 ? (
              <select style={{ ...inputStyle }} value={subject} onChange={e => setSubject(e.target.value)}>
                {tutor.subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input style={inputStyle} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject or module code" />
            )}
          </div>

          {/* Date */}
          <div>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
              <Calendar size={10} style={{ display: 'inline', marginRight: 4 }} />
              Preferred date (optional)
            </label>
            <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
          </div>

          {/* Duration */}
          <div>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
              <Clock size={10} style={{ display: 'inline', marginRight: 4 }} />
              Duration
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {DURATIONS.map(d => (
                <button key={d.value} type="button" onClick={() => setDuration(d.value)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: '0.5px solid', borderColor: duration === d.value ? '#4ecf9e' : 'rgba(255,255,255,0.1)', background: duration === d.value ? 'rgba(78,207,158,0.12)' : 'rgba(255,255,255,0.07)', color: duration === d.value ? '#4ecf9e' : 'rgba(255,255,255,0.62)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', cursor: 'pointer' }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment notice */}
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(201,168,76,0.07)', border: '0.5px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>💵</span>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', color: '#fff', margin: 0, lineHeight: 1.5 }}>
              Payment is arranged directly between you and your tutor — cash or EFT, whatever works for both of you. VarsityOS just handles the booking.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Notes to tutor</label>
            <textarea style={{ ...inputStyle, resize: 'none', height: 72 }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Specific topics, exam date, what you're struggling with..." maxLength={500} />
          </div>

          {/* Total + Submit */}
          <div style={{ background: 'rgba(78,207,158,0.06)', border: '0.5px solid rgba(78,207,158,0.2)', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: '#fff' }}>Agree to pay tutor</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#fff', marginTop: 2 }}>sorted directly · cash or EFT</div>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '1rem', color: '#4ecf9e' }}>R{total.toFixed(0)}</div>
          </div>

          <button type="submit" disabled={booking} style={{ padding: '13px', borderRadius: 12, border: 'none', background: booking ? 'rgba(78,207,158,0.3)' : '#4ecf9e', color: '#000', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', cursor: booking ? 'not-allowed' : 'pointer' }}>
            {booking ? 'Sending request...' : 'Request Session'}
          </button>
        </form>
      </div>
    </div>
  )
}
