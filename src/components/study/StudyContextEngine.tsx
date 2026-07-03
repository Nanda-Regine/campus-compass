'use client'

import { useState, useEffect } from 'react'
import type { Exam } from '@/types'
import Link from 'next/link'

interface Props {
  exams: Exam[]
  userId: string
}

interface ContextMessage {
  icon: string
  msg: string
  cta: string | null
  href: string | null
}

const ACCENT = '#4ecf9e'

const MOTIVATIONAL: ContextMessage[] = [
  { icon: '🌍', msg: 'Ubuntu: your success lifts those around you. Study well today.', cta: null, href: null },
  { icon: '💪', msg: 'First-gen students have the highest resilience of any student group. Use it.', cta: null, href: null },
  { icon: '📖', msg: 'Every page you read today is a brick in your future.', cta: null, href: null },
  { icon: '✨', msg: 'Nomvula studied for the first time in her family. So did you. Keep going.', cta: null, href: null },
  { icon: '⏳', msg: 'What you do in these hours compounds for decades.', cta: null, href: null },
  { icon: '🔥', msg: 'Your ancestors did not survive for you to give up today.', cta: null, href: null },
]

function computeMessage(exams: Exam[]): ContextMessage {
  const now = new Date()
  const hour = now.getHours()
  const dayOfWeek = now.getDay()

  let wellnessScore = 100
  let lsStage = 0

  if (typeof window !== 'undefined') {
    const ws = localStorage.getItem('wellness_score')
    if (ws !== null) wellnessScore = Number(ws)
    const ls = localStorage.getItem('ls_stage')
    if (ls !== null) lsStage = Number(ls)
  }

  let hoursUntilNextExam = Infinity
  if (exams.length > 0) {
    const upcoming = exams
      .map(ex => {
        const dateStr = ex.start_time ? `${ex.exam_date}T${ex.start_time}` : `${ex.exam_date}T08:00`
        return new Date(dateStr).getTime()
      })
      .filter(t => t > now.getTime())
      .sort((a, b) => a - b)
    if (upcoming.length > 0) {
      hoursUntilNextExam = (upcoming[0] - now.getTime()) / 3_600_000
    }
  }

  if (hoursUntilNextExam <= 36 && wellnessScore < 40) {
    return {
      icon: '🌙',
      msg: 'Exam in less than 36 hours. At low energy, sleep beats grinding. Rest IS studying — sleep consolidates memory.',
      cta: 'Open Regulation Room',
      href: '/regulate',
    }
  }
  if (hoursUntilNextExam <= 36 && wellnessScore >= 40) {
    return {
      icon: '🎯',
      msg: 'Final sprint mode. Focus on weakest topics only. Try Past Papers for predicted questions.',
      cta: 'Past Papers',
      href: '/study?tab=pastpapers',
    }
  }
  if (wellnessScore < 35) {
    return {
      icon: '💜',
      msg: 'Low energy detected. A 5-minute breathing reset before studying increases focus by 18%.',
      cta: 'Breathe',
      href: '/regulate?practice=box',
    }
  }
  if (lsStage >= 2) {
    return {
      icon: '⚡',
      msg: 'Load shedding expected. Download study materials now while you have power.',
      cta: 'Reader',
      href: '/reader',
    }
  }
  if (hour >= 23 || hour < 5) {
    return {
      icon: '🌌',
      msg: "It's late. Sleep-deprived studying retains 23% less. 6 focused morning hours > 6 tired night hours.",
      cta: null,
      href: null,
    }
  }
  return MOTIVATIONAL[dayOfWeek % MOTIVATIONAL.length]
}

function hashString(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return String(h)
}

export default function StudyContextEngine({ exams, userId }: Props) {
  const [message, setMessage] = useState<ContextMessage | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const msg = computeMessage(exams)
    const key = `sced_${hashString(msg.msg)}`
    if (typeof window !== 'undefined' && sessionStorage.getItem(key)) {
      setDismissed(true)
    } else {
      setMessage(msg)
    }
  }, [exams])

  function dismiss() {
    if (!message) return
    const key = `sced_${hashString(message.msg)}`
    if (typeof window !== 'undefined') sessionStorage.setItem(key, '1')
    setDismissed(true)
  }

  if (dismissed || !message) return null

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '14px',
      background: 'rgba(78,207,158,0.06)',
      border: '1px solid rgba(78,207,158,0.15)',
      borderLeft: `3px solid ${ACCENT}`,
      marginBottom: '16px',
    }}>
      <span style={{ fontSize: '18px', flexShrink: 0 }}>{message.icon}</span>
      <p style={{ color: '#d1fae5', fontSize: '13px', lineHeight: '1.5', flex: 1, margin: 0 }}>
        {message.msg}
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        {message.cta && message.href && (
          <Link
            href={message.href}
            style={{
              background: 'rgba(78,207,158,0.15)',
              border: `1px solid rgba(78,207,158,0.3)`,
              color: ACCENT,
              fontSize: '12px',
              padding: '5px 12px',
              borderRadius: '999px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              fontWeight: 600,
            }}
          >
            {message.cta}
          </Link>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            padding: '2px 4px',
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
