'use client'

// ImplementationIntentions — "I will do X at TIME in PLACE."
// Research: implementation intentions double task follow-through (Gollwitzer, 1999).
// Stores in localStorage; uses Web Notifications API for same-session alarms.

import { useState, useEffect, useCallback } from 'react'
import { dispatchXP } from '@/lib/xp-engine'
import type { Task } from '@/types'
import toast from 'react-hot-toast'

const LS_KEY = 'varsityos_intentions'

interface Intention {
  id:           string
  task_id:      string | null
  task_title:   string
  scheduled_at: string    // ISO datetime
  location:     string
  notified:     boolean
  created_at:   string
}

function loadIntentions(): Intention[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}

function saveIntentions(intents: Intention[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(intents))
}

function formatWhen(isoStr: string): string {
  const d = new Date(isoStr)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffH  = Math.round(diffMs / 3_600_000)
  if (diffH < 0)   return 'Overdue'
  if (diffH < 1)   return 'In <1 hour'
  if (diffH < 24)  return `In ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return diffD === 1 ? 'Tomorrow' : `In ${diffD} days`
}

// ── Create Form ───────────────────────────────────────────────────────────────

interface CreateFormProps {
  tasks:    Task[]
  onSave:   (i: Intention) => void
  onCancel: () => void
}

function CreateForm({ tasks, onSave, onCancel }: CreateFormProps) {
  const pending = tasks.filter(t => t.status !== 'done')
  const [taskId,   setTaskId]   = useState(pending[0]?.id ?? '')
  const [custom,   setCustom]   = useState('')
  const [date,     setDate]     = useState('')
  const [time,     setTime]     = useState('09:00')
  const [location, setLocation] = useState('')

  useEffect(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    setDate(d.toISOString().split('T')[0])
  }, [])

  const handleSave = () => {
    const selectedTask = pending.find(t => t.id === taskId)
    const title = selectedTask?.title ?? custom.trim()
    if (!title || !date || !location.trim()) {
      toast.error('Fill in task, date, and location')
      return
    }
    const intent: Intention = {
      id:           crypto.randomUUID(),
      task_id:      selectedTask?.id ?? null,
      task_title:   title,
      scheduled_at: `${date}T${time}:00`,
      location:     location.trim(),
      notified:     false,
      created_at:   new Date().toISOString(),
    }
    onSave(intent)
    dispatchXP('intention_set')
    // Request notification permission
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 10,
    fontFamily: 'Sora,sans-serif', fontSize: 13,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9800,
      background: 'rgba(4,6,18,0.92)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#0d1225', borderRadius: 20, padding: 26,
        border: '1px solid rgba(255,255,255,0.1)', maxWidth: 400, width: '100%',
      }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7090d0', letterSpacing: '0.18em', marginBottom: 12 }}>
          📅 IMPLEMENTATION INTENTION
        </div>
        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 17, color: '#fff', marginBottom: 20 }}>
          "I will do <span style={{ color: '#7090d0' }}>X</span> at <span style={{ color: '#7090d0' }}>TIME</span> in <span style={{ color: '#7090d0' }}>PLACE</span>"
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pending.length > 0 ? (
            <select
              value={taskId}
              onChange={e => setTaskId(e.target.value)}
              style={{ ...inputStyle }}
            >
              {pending.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
              <option value="">Custom task…</option>
            </select>
          ) : null}

          {(!taskId || !pending.find(t => t.id === taskId)) && (
            <input
              type="text" value={custom}
              onChange={e => setCustom(e.target.value)}
              placeholder="What will you work on?"
              style={inputStyle}
            />
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...inputStyle, width: 110 }} />
          </div>

          <input
            type="text" value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Where? (library, room 203, study café…)"
            style={inputStyle}
          />
        </div>

        <div style={{
          marginTop: 16, padding: '10px 14px', borderRadius: 10,
          background: 'rgba(112,144,208,0.08)', border: '1px solid rgba(112,144,208,0.2)',
        }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 12, color: '#7090d0', lineHeight: 1.5 }}>
            "I will <strong>{(pending.find(t => t.id === taskId)?.title ?? custom) || '…'}</strong> at <strong>{time || '…'}</strong> in <strong>{location || '…'}</strong>"
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '11px 0', borderRadius: 11,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: 'rgba(255,255,255,0.4)',
            fontFamily: 'Sora,sans-serif', cursor: 'pointer', fontSize: 13,
          }}>Cancel</button>
          <button onClick={handleSave} style={{
            flex: 2, padding: '11px 0', borderRadius: 11, border: 'none',
            background: '#7090d0', color: '#fff',
            fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>📅 Schedule it</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Widget ───────────────────────────────────────────────────────────────

interface Props { tasks: Task[] }

export default function ImplementationIntentions({ tasks }: Props) {
  const [intentions, setIntentions] = useState<Intention[]>([])
  const [showForm, setShowForm]     = useState(false)
  const [mounted, setMounted]       = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = loadIntentions()
    setIntentions(stored)

    // Check for overdue / upcoming intentions and fire notifications
    const now = Date.now()
    const updated = stored.map(intent => {
      const scheduledMs = new Date(intent.scheduled_at).getTime()
      if (!intent.notified && scheduledMs <= now + 5 * 60 * 1000) {
        // Due within 5 minutes or already overdue
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('⏰ VarsityOS — Time to start!', {
            body: `You planned to work on "${intent.task_title}" now.`,
            icon: '/icon-192.png',
          })
        } else {
          toast(`⏰ Time to start: ${intent.task_title}`, { duration: 6000 })
        }
        return { ...intent, notified: true }
      }

      // Schedule a future notification via setTimeout (same-session only)
      if (!intent.notified && scheduledMs > now) {
        const delay = scheduledMs - now
        if (delay < 8 * 60 * 60 * 1000) {  // only schedule if within 8h
          setTimeout(() => {
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification('⏰ VarsityOS — Study time!', {
                body: `You planned to work on "${intent.task_title}".`,
                icon: '/icon-192.png',
              })
            } else {
              toast(`⏰ Study time: ${intent.task_title}`, { duration: 6000 })
            }
          }, delay)
        }
      }
      return intent
    })

    setIntentions(updated)
    saveIntentions(updated)
  }, [])

  const saveNew = useCallback((intent: Intention) => {
    const next = [intent, ...intentions]
    setIntentions(next)
    saveIntentions(next)
    setShowForm(false)
    toast.success('Intention scheduled!')
  }, [intentions])

  const remove = useCallback((id: string) => {
    const next = intentions.filter(i => i.id !== id)
    setIntentions(next)
    saveIntentions(next)
  }, [intentions])

  if (!mounted) return null

  const upcoming = intentions
    .filter(i => new Date(i.scheduled_at) > new Date(Date.now() - 2 * 60 * 60 * 1000))
    .slice(0, 3)

  return (
    <>
      <div style={{
        borderRadius: 18, padding: '16px 18px',
        border: '1px solid rgba(112,144,208,0.2)',
        background: 'rgba(112,144,208,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7090d0', letterSpacing: '0.18em' }}>
              📅 IMPLEMENTATION INTENTIONS
            </div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, color: '#fff', marginTop: 3 }}>
              Schedule the when & where
            </div>
          </div>
          <button onClick={() => setShowForm(true)} style={{
            fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700,
            padding: '7px 14px', borderRadius: 10, border: 'none',
            background: '#7090d0', color: '#fff', cursor: 'pointer',
          }}>
            + Plan it
          </button>
        </div>

        {upcoming.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>📅</div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
              Research shows scheduling <em>when</em> and <em>where</em> you'll study doubles your follow-through. Plan your next session.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.map(intent => {
              const overdue = new Date(intent.scheduled_at) < new Date()
              const color   = overdue ? '#ff6b6b' : '#7090d0'
              return (
                <div key={intent.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 12,
                  background: overdue ? 'rgba(255,107,107,0.07)' : 'rgba(112,144,208,0.07)',
                  border: `1px solid ${color}25`,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 12, color: '#fff', marginBottom: 3 }}>
                      {intent.task_title}
                    </div>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                      {formatWhen(intent.scheduled_at)} · {intent.location}
                    </div>
                  </div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color, fontWeight: 700 }}>
                    {overdue ? '⏰ Now!' : new Date(intent.scheduled_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <button onClick={() => remove(intent.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.2)', fontSize: 12, padding: 0,
                  }}>✕</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showForm && (
        <CreateForm
          tasks={tasks}
          onSave={saveNew}
          onCancel={() => setShowForm(false)}
        />
      )}
    </>
  )
}
