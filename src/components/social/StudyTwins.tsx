'use client'

import { useState, useEffect } from 'react'
import { Users, MessageCircle, ToggleLeft, ToggleRight, Phone, ChevronRight, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { StudyTwin } from '@/lib/notes-data'

interface Props {
  userId: string
  userInstitution: string | null
  initialOptIn: boolean
  initialWhatsapp: string | null
}

export default function StudyTwins({ userInstitution, initialOptIn, initialWhatsapp }: Props) {
  const [optIn, setOptIn] = useState(initialOptIn)
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp ?? '')
  const [twins, setTwins] = useState<StudyTwin[]>([])
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [myFaculty, setMyFaculty] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/study-twins')
      .then(r => r.ok ? r.json() : { twins: [], myFaculty: null })
      .then(d => { setTwins(d.twins ?? []); setMyFaculty(d.myFaculty) })
      .finally(() => setLoading(false))
  }, [])

  async function saveSettings(updates: { opt_in?: boolean; whatsapp_number?: string }) {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/study-twins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('save failed') // don't show success on a 4xx/5xx
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSavingSettings(false)
    }
  }

  function toggleOptIn() {
    const next = !optIn
    setOptIn(next)
    saveSettings({ opt_in: next })
  }

  const sameFaculty = twins.filter(t => t.faculty === myFaculty)
  const otherFaculty = twins.filter(t => t.faculty !== myFaculty)

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            Study Twins
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#fff', marginTop: 2 }}>
            {userInstitution ?? 'Find your study peers'} · Ubuntu in action
          </div>
        </div>

        {/* Opt-in settings */}
        <div style={{
          background: 'rgba(255,255,255,0.07)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          borderRadius: 14, padding: 16, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: optIn ? 14 : 0 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                Appear in directory
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: '#fff', marginTop: 2 }}>
                Let students at your university find you
              </div>
            </div>
            <button
              onClick={toggleOptIn}
              disabled={savingSettings}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: optIn ? '#4ecf9e' : 'rgba(255,255,255,0.45)', padding: 0 }}
            >
              {optIn ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          {optIn && (
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={10} />
                WhatsApp number (optional — shown to matches only)
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="+27 xx xxx xxxx"
                  style={{
                    flex: 1, padding: '8px 12px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '0.5px solid rgba(255,255,255,0.12)',
                    borderRadius: 10, color: 'var(--text-primary)',
                    fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif', outline: 'none',
                  }}
                />
                <button
                  onClick={() => saveSettings({ whatsapp_number: whatsapp })}
                  disabled={savingSettings}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: 'none',
                    background: '#4ecf9e', color: '#000',
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: '0.75rem', cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nova prompt shortcut */}
        <Link href="/nova?q=Help+me+find+a+study+partner+for+my+modules" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
          <div style={{
            background: 'rgba(155,111,212,0.08)',
            border: '0.5px solid rgba(155,111,212,0.25)',
            borderRadius: 12, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Sparkles size={16} style={{ color: '#9b6fd4', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.8rem', color: '#9b6fd4' }}>Ask Nova to help you connect</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: '#fff', marginTop: 1 }}>Get a personalised intro message for any study twin</div>
            </div>
            <ChevronRight size={14} style={{ color: 'rgb(155,111,212)' }} />
          </div>
        </Link>
      </div>

      {/* Twins list */}
      <div style={{ padding: '0 20px' }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 72, borderRadius: 12, background: 'rgba(255,255,255,0.07)', marginBottom: 8 }} />
          ))
        ) : twins.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 32, color: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem' }}>
            <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div>
              {userInstitution
                ? `No study twins at ${userInstitution} yet — be the first to opt in!`
                : 'Add your university in Profile to see study twins'}
            </div>
          </div>
        ) : (
          <>
            {sameFaculty.length > 0 && (
              <TwinGroup twins={sameFaculty} label="Same faculty" />
            )}
            {otherFaculty.length > 0 && (
              <TwinGroup twins={otherFaculty} label="Other faculties" />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TwinGroup({ twins, label }: { twins: StudyTwin[]; label: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        {label} · {twins.length}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {twins.map(twin => <TwinCard key={twin.id} twin={twin} />)}
      </div>
    </div>
  )
}

function TwinCard({ twin }: { twin: StudyTwin }) {
  const waHref = twin.whatsapp_number
    ? `https://wa.me/${twin.whatsapp_number.replace(/[^\d+]/g, '')}?text=${encodeURIComponent('Hey! I found you on VarsityOS as a study twin. Want to study together? 📚')}`
    : null

  const novaHref = `/nova?q=${encodeURIComponent(`Help me write a friendly message to a study twin named ${twin.name} who studies ${twin.faculty ?? ''} at ${twin.university ?? ''} Year ${twin.year_of_study ?? ''}`)}`

  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      border: '0.5px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: 'rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.25rem',
      }}>
        {twin.emoji}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
          {twin.name}
        </div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: '#fff', marginTop: 1 }}>
          {[twin.faculty, twin.year_of_study ? `Year ${twin.year_of_study}` : null].filter(Boolean).join(' · ')}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <Link href={novaHref} style={{ textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(155,111,212,0.12)',
            border: '0.5px solid rgba(155,111,212,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#9b6fd4',
          }}>
            <Sparkles size={14} />
          </div>
        </Link>
        {waHref && (
          <a href={waHref} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(37,211,102,0.1)',
              border: '0.5px solid rgba(37,211,102,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#25d366',
            }}>
              <MessageCircle size={14} />
            </div>
          </a>
        )}
      </div>
    </div>
  )
}
