'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Exam } from '@/types'

interface Step {
  id: number
  label: string
  href: string | null
  icon: string
  science: string
}

const STEPS: Step[] = [
  { id: 1, label: '5-minute breathing practice', href: '/regulate?practice=box', icon: '🫁', science: 'Reduces pre-exam cortisol in 30 seconds' },
  { id: 2, label: 'Review weakest topic only', href: '/study?tab=flashcards', icon: '📚', science: 'Targeted review 2x more effective than general revision' },
  { id: 3, label: 'Sleep by calculated time', href: null, icon: '🌙', science: 'Sleep consolidates the day\'s learning by 30%' },
  { id: 4, label: 'Eat before the exam (oats + eggs)', href: '/meals', icon: '🍳', science: 'Stable blood sugar = 15% better concentration' },
  { id: 5, label: 'Arrive 15 minutes early', href: null, icon: '🚶', science: 'Reduces cortisol spike from rushing by 40%' },
]

function getBedtime(exam: Exam): string | null {
  if (!exam.start_time) return null
  const [h, m] = exam.start_time.split(':').map(Number)
  const examMinutes = h * 60 + m
  const wakeMinutes = examMinutes - 30
  const bedMinutes = wakeMinutes - 8 * 60
  if (bedMinutes < 0) return null
  const bh = Math.floor(((bedMinutes % 1440) + 1440) % 1440 / 60)
  const bm = ((bedMinutes % 1440) + 1440) % 1440 % 60
  return `${bh.toString().padStart(2, '0')}:${bm.toString().padStart(2, '0')}`
}

function getDaysAndHours(examDate: string): { days: number; hours: number } {
  const now = new Date()
  const exam = new Date(examDate + 'T00:00:00')
  const diffMs = exam.getTime() - now.getTime()
  const diffH = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)))
  return { days: Math.floor(diffH / 24), hours: diffH % 24 }
}

interface Props {
  exams: Exam[]
  userId: string
}

export default function ExamWeekProtocol({ exams, userId: _userId }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const nearExam = exams.find(e => {
    const diff = (new Date(e.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
  })

  const storageKey = nearExam ? `exam_protocol_${nearExam.id}_${today}` : ''
  const dismissKey = nearExam ? `exam_protocol_dismiss_${nearExam.id}_${today}` : ''

  const [checkedSteps, setCheckedSteps] = useState<number[]>([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!storageKey) return
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
      setCheckedSteps(Array.isArray(saved) ? saved : [])
      setDismissed(localStorage.getItem(dismissKey) === 'true')
    } catch {
      setCheckedSteps([])
    }
  }, [storageKey, dismissKey])

  function toggleStep(id: number) {
    setCheckedSteps(prev => {
      const next = prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
  }

  function dismiss() {
    if (dismissKey) localStorage.setItem(dismissKey, 'true')
    setDismissed(true)
  }

  if (!nearExam || dismissed) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
        <p style={{ color: '#9ca3af', fontSize: 14 }}>
          No exams in the next 7 days — great time to build regulation habits.
        </p>
      </div>
    )
  }

  const { days, hours } = getDaysAndHours(nearExam.exam_date)
  const bedtime = getBedtime(nearExam)
  const progress = (checkedSteps.length / STEPS.length) * 100

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p style={{ color: '#a78bfa', fontWeight: 700, fontSize: 16 }}>{nearExam.exam_name || nearExam.name}</p>
          <p style={{ color: '#9ca3af', fontSize: 13 }}>in {days}d {hours}h</p>
        </div>
        <button onClick={dismiss} style={{ color: '#6b7280', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
          Dismiss
        </button>
      </div>

      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginBottom: 20 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: '#a78bfa', borderRadius: 3, transition: 'width 0.3s' }} />
      </div>

      <div className="flex flex-col gap-3">
        {STEPS.map(step => {
          const isChecked = checkedSteps.includes(step.id)
          const extraLabel = step.id === 3 && bedtime ? ` — be in bed by ${bedtime}` : ''
          return (
            <div
              key={step.id}
              onClick={() => toggleStep(step.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '10px 12px',
                background: isChecked ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.02)',
                borderRadius: 10,
                cursor: 'pointer',
                border: '1px solid ' + (isChecked ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.04)'),
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 2,
                background: isChecked ? '#a78bfa' : 'transparent',
                border: '2px solid ' + (isChecked ? '#a78bfa' : 'rgba(255,255,255,0.2)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isChecked && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span>{step.icon}</span>
                  <span style={{ color: isChecked ? '#9ca3af' : '#e5e7eb', fontSize: 14, fontWeight: 500, textDecoration: isChecked ? 'line-through' : 'none' }}>
                    {step.label}{extraLabel}
                  </span>
                  {step.href && (
                    <Link
                      href={step.href}
                      onClick={e => e.stopPropagation()}
                      style={{ color: '#a78bfa', fontSize: 12, marginLeft: 'auto', whiteSpace: 'nowrap' }}
                    >
                      Open →
                    </Link>
                  )}
                </div>
                <p style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{step.science}</p>
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ color: '#6b7280', fontSize: 12, marginTop: 20, fontStyle: 'italic', lineHeight: 1.5 }}>
        Pre-exam cortisol is normal and even helpful in small doses. The physiological sigh reduces it in 30 seconds.
      </p>
    </div>
  )
}
