'use client'

import { useState } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import toast from 'react-hot-toast'

interface TutorProfile {
  subjects: string[]
  rate_per_hour: number
  bio: string | null
  availability: string | null
  is_available: boolean
}

interface Props {
  existing: TutorProfile | null
  onClose: () => void
  onSaved: () => void
}

export default function BecomeATutorModal({ existing, onClose, onSaved }: Props) {
  const [subjects, setSubjects] = useState<string[]>(existing?.subjects ?? [''])
  const [rate, setRate] = useState(String(existing?.rate_per_hour ?? 80))
  const [bio, setBio] = useState(existing?.bio ?? '')
  const [availability, setAvailability] = useState(existing?.availability ?? '')
  const [isAvailable, setIsAvailable] = useState(existing?.is_available ?? true)
  const [saving, setSaving] = useState(false)

  function addSubject() { setSubjects(s => [...s, '']) }
  function removeSubject(i: number) { setSubjects(s => s.filter((_, idx) => idx !== i)) }
  function updateSubject(i: number, v: string) { setSubjects(s => s.map((x, idx) => idx === i ? v : x)) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = subjects.map(s => s.trim()).filter(Boolean)
    if (!clean.length) { toast.error('Add at least one subject'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/tutors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjects: clean, rate_per_hour: Number(rate), bio, availability, is_available: isAvailable }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      toast.success(existing ? 'Profile updated!' : 'Welcome to the tutor community! 🎉')
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.12)',
    borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.82rem',
    fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(6px)' }}>
      <div style={{ width: '100%', maxHeight: '92vh', overflowY: 'auto', background: '#0d1117', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {existing ? 'Update Tutor Profile' : 'Become a Tutor'}
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              Earn while helping fellow students
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Subjects */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Subjects / Modules</label>
              <button type="button" onClick={addSubject} style={{ background: 'rgba(78,207,158,0.1)', border: '0.5px solid rgba(78,207,158,0.3)', borderRadius: 6, padding: '3px 8px', color: '#4ecf9e', fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={10} /> Add
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {subjects.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 6 }}>
                  <input style={{ ...inputStyle, flex: 1 }} value={s} onChange={e => updateSubject(i, e.target.value)} placeholder="e.g. MATH1014, Statistics, Economics" maxLength={60} />
                  {subjects.length > 1 && (
                    <button type="button" onClick={() => removeSubject(i)} style={{ background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}>
                      <Minus size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Rate */}
          <div>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Hourly Rate (ZAR)</label>
            <input style={inputStyle} type="number" min="20" max="500" value={rate} onChange={e => setRate(e.target.value)} />
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans, sans-serif', marginTop: 4 }}>Typical range: R50–R200/hr for peer tutors</div>
          </div>

          {/* Bio */}
          <div>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>About you</label>
            <textarea style={{ ...inputStyle, resize: 'none', height: 80 }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Your experience, teaching style, qualifications..." maxLength={400} />
          </div>

          {/* Availability */}
          <div>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>When are you available?</label>
            <input style={inputStyle} value={availability} onChange={e => setAvailability(e.target.value)} placeholder="e.g. Weekday evenings, Saturday mornings" maxLength={200} />
          </div>

          {/* Available toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>Taking new students</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Toggle off during exams</div>
            </div>
            <button type="button" onClick={() => setIsAvailable(v => !v)} style={{ padding: '5px 12px', borderRadius: 20, border: '0.5px solid', borderColor: isAvailable ? '#4ecf9e' : 'rgba(255,255,255,0.15)', background: isAvailable ? 'rgba(78,207,158,0.12)' : 'rgba(255,255,255,0.04)', color: isAvailable ? '#4ecf9e' : 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
              {isAvailable ? 'Available' : 'Unavailable'}
            </button>
          </div>

          <button type="submit" disabled={saving} style={{ padding: '13px', borderRadius: 12, border: 'none', background: saving ? 'rgba(78,207,158,0.3)' : '#4ecf9e', color: '#000', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving...' : existing ? 'Update Profile' : 'Start Tutoring'}
          </button>
        </form>
      </div>
    </div>
  )
}
