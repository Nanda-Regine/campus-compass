'use client'

// ============================================================
// GratitudePrompt — Evening gratitude capture
// Appears after mood is logged after 5PM.
// Prompts 3 things the student is grateful for.
// Research-backed: daily gratitude journalling raises subjective
// wellbeing scores by 10–15% over 3 weeks (Emmons & McCullough).
// ============================================================

import { useState } from 'react'
import { signals } from '@/store/signals'

interface GratitudeEntry {
  date:    string
  entries: [string, string, string]
  mood:    number
}

const STORAGE_KEY = 'varsityos-gratitude'

function loadEntries(): GratitudeEntry[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

function saveEntries(all: GratitudeEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(-90))) } catch {}
}

const PROMPTS = [
  'Something that went well today…',
  'A person who showed up for me…',
  'Something small I usually take for granted…',
]

const MOOD_LABEL: Record<number, string> = {
  1: 'tough day', 2: 'okay day', 3: 'good day', 4: 'great day', 5: 'amazing day',
}

interface Props {
  moodScore: number
  onDone: () => void
}

export default function GratitudePrompt({ moodScore, onDone }: Props) {
  const [entries, setEntries] = useState<[string, string, string]>(['', '', ''])
  const [saved, setSaved]     = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const setEntry = (i: 0 | 1 | 2, val: string) => {
    const next = [...entries] as [string, string, string]
    next[i] = val
    setEntries(next)
  }

  const handleSave = () => {
    const entry: GratitudeEntry = { date: today, entries, mood: moodScore }
    const all = loadEntries().filter(e => e.date !== today)
    saveEntries([...all, entry])

    signals.emit({
      type: 'gratitude_logged',
      payload: { date: today, entries },
    })

    setSaved(true)
    setTimeout(onDone, 2200)
  }

  const filled = entries.filter(e => e.trim().length > 0).length

  if (saved) {
    return (
      <div style={{
        padding: '18px', borderRadius: 16, textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(78,207,158,0.1), rgba(99,102,241,0.08))',
        border: '1px solid rgba(78,207,158,0.2)',
        animation: 'fadeInUp 0.3s ease',
      }}>
        <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🙏</div>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Gratitude saved
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Noticing what&apos;s good, even on a {MOOD_LABEL[moodScore] ?? 'day'}, builds resilience over time.
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      borderRadius: 16,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      animation: 'fadeInUp 0.35s ease',
    }}>
      {/* Top accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, var(--teal), rgba(99,102,241,0.6), transparent)',
      }} />

      <div style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--teal)', letterSpacing: '0.09em', marginBottom: 4 }}>
          END OF DAY · GRATITUDE
        </div>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          What are 3 things you&apos;re grateful for today?
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Even on a {MOOD_LABEL[moodScore] ?? 'hard day'}, there is always something. Take 60 seconds.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {([0, 1, 2] as const).map(i => (
            <div key={i}>
              <div style={{
                fontSize: '0.62rem', color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)', marginBottom: 4,
              }}>
                {i + 1}. {PROMPTS[i]}
              </div>
              <input
                type="text"
                value={entries[i]}
                onChange={e => setEntry(i, e.target.value)}
                placeholder="Write freely…"
                style={{
                  width: '100%', padding: '9px 12px',
                  background: 'var(--bg-base)',
                  border: `1px solid ${entries[i].trim() ? 'var(--teal)' : 'var(--border-default)'}`,
                  borderRadius: 9, color: 'var(--text-primary)',
                  fontSize: '0.8rem', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            onClick={onDone}
            style={{
              flex: '0 0 auto', padding: '9px 14px', borderRadius: 10,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer',
            }}
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={filled === 0}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 10,
              background: filled > 0 ? 'rgba(78,207,158,0.12)' : 'var(--bg-elevated)',
              border: `1px solid ${filled > 0 ? 'rgba(78,207,158,0.35)' : 'var(--border-subtle)'}`,
              color: filled > 0 ? 'var(--teal)' : 'var(--text-muted)',
              fontSize: '0.78rem', fontWeight: 700, cursor: filled > 0 ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
          >
            Save {filled > 0 ? `(${filled}/3)` : ''}→
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Read utility (used by ActivityCalendar) ───────────────────
export function loadGratitudeEntries(): GratitudeEntry[] {
  return loadEntries()
}
