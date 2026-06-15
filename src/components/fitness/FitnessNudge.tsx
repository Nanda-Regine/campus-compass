'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Exam } from '@/types'

type NudgeContext = 'pomodoro_break' | 'low_mood' | 'pre_exam' | 'long_session' | 'morning'

interface Props {
  context: NudgeContext
  exams?: Exam[]
}

interface NudgeConfig {
  icon: string
  title: string
  msg: string
  cta: string
  href: string
  science: string
}

const NUDGE_CONFIG: Record<NudgeContext, NudgeConfig> = {
  pomodoro_break: {
    icon: '🏃',
    title: 'Movement Reset',
    msg: 'A 5-minute movement break resets focus by 18% for the next session.',
    cta: 'Quick stretch',
    href: '/fitness',
    science: 'University of Illinois, 2014',
  },
  low_mood: {
    icon: '🚶',
    title: 'Walk It Off',
    msg: '10 minutes of brisk walking increases mood by 30% within 20 minutes.',
    cta: 'Start a walk',
    href: '/fitness',
    science: 'Harvard Medical School',
  },
  pre_exam: {
    icon: '⚡',
    title: 'Morning Move',
    msg: 'Light exercise before studying increases memory consolidation by 20% for 2 hours.',
    cta: '15-min routine',
    href: '/fitness?routine=pre_exam',
    science: 'Raichlen & Alexander, 2017',
  },
  long_session: {
    icon: '🧘',
    title: 'Body Check',
    msg: "You've been sitting for a while. Stand, shake, breathe. Your brain needs blood flow.",
    cta: '2-min reset',
    href: '/regulate',
    science: 'Sitting >90 min reduces focus capacity',
  },
  morning: {
    icon: '🌅',
    title: 'Good Morning',
    msg: 'Movement in the morning = 23% better focus for the rest of the day.',
    cta: '5-min energiser',
    href: '/fitness?routine=morning',
    science: 'Journal of Sport Sciences, 2019',
  },
}

function getDismissKey(context: NudgeContext) {
  const today = new Date().toISOString().split('T')[0]
  return `fitness_nudge_dismissed_${context}_${today}`
}

export default function FitnessNudge({ context }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const key = getDismissKey(context)
      if (localStorage.getItem(key) === '1') {
        setDismissed(true)
      }
    } catch {
      /* silent */
    }
  }, [context])

  const handleDismiss = () => {
    try {
      localStorage.setItem(getDismissKey(context), '1')
    } catch {
      /* silent */
    }
    setDismissed(true)
  }

  if (!mounted || dismissed) return null

  const nudge = NUDGE_CONFIG[context]

  return (
    <div
      style={{
        background: 'rgba(74,222,128,0.05)',
        border: '1px solid rgba(74,222,128,0.2)',
        borderRadius: '12px',
        padding: '10px 12px',
        maxHeight: '100px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: '22px', flexShrink: 0 }}>{nudge.icon}</span>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#e5e7eb', fontSize: '13px', fontWeight: 700, lineHeight: 1.2, marginBottom: '2px' }}>
          {nudge.title}
        </div>
        <div style={{ color: '#9ca3af', fontSize: '11px', lineHeight: 1.35 }}>
          {nudge.msg}
        </div>
        <div style={{ color: '#6b7280', fontSize: '10px', fontStyle: 'italic', marginTop: '2px' }}>
          {nudge.science}
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Link
          href={nudge.href}
          style={{
            background: 'rgba(74,222,128,0.15)',
            border: '1px solid rgba(74,222,128,0.3)',
            borderRadius: '8px',
            color: '#4ade80',
            padding: '6px 10px',
            fontSize: '11px',
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {nudge.cta}
        </Link>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{
            background: 'none',
            border: 'none',
            color: '#6b7280',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '4px',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
