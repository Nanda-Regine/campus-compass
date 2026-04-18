'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const STEPS = [
  {
    icon: '🌟',
    title: 'Meet Nova',
    body: 'Your AI study companion. Ask for study plans, exam prep, or just a pep talk.',
    highlight: 'nova',
    cta: 'Next →',
  },
  {
    icon: '💳',
    title: 'Track your budget',
    body: 'Log expenses, manage your NSFAS, and get AI-powered financial tips.',
    highlight: 'budget',
    cta: 'Next →',
  },
  {
    icon: '📚',
    title: 'Plan your studies',
    body: 'Add tasks, timetable and exams — all in one place.',
    highlight: 'study',
    cta: "Let's go!",
  },
]

const APP_PREFIXES = ['/dashboard', '/study', '/budget', '/meals', '/nova', '/profile', '/work', '/campus-life']

export default function OnboardingTooltip() {
  const pathname = usePathname()
  const [step, setStep]     = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!APP_PREFIXES.some(p => pathname.startsWith(p))) return
    try {
      const done = localStorage.getItem('varsityos_onboarded')
      if (!done) setVisible(true)
    } catch {
      // localStorage unavailable (SSR safety)
    }
  }, [pathname])

  const dismiss = () => {
    try { localStorage.setItem('varsityos_onboarded', '1') } catch {}
    setVisible(false)
  }

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      dismiss()
    }
  }

  if (!visible) return null

  const current = STEPS[step]

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center pb-32 px-4 md:items-center md:pb-0 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm animate-fade-in">
        {/* Card */}
        <div
          className="rounded-2xl p-5 shadow-2xl border border-white/10 relative"
          style={{ background: 'rgba(18, 24, 22, 0.97)', backdropFilter: 'blur(16px)' }}
        >
          {/* Skip */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 font-mono text-[0.58rem] text-white/30 hover:text-white/60 transition-colors"
          >
            Skip
          </button>

          {/* Step dots */}
          <div className="flex gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? '24px' : '8px',
                  background: i === step ? '#0d9488' : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>

          <div className="text-2xl mb-2">{current.icon}</div>
          <div className="font-display font-bold text-white text-base mb-1">{current.title}</div>
          <p className="font-mono text-[0.62rem] text-white/50 leading-relaxed mb-5">{current.body}</p>

          <button
            onClick={next}
            className="w-full py-2.5 rounded-xl font-mono text-[0.65rem] font-medium text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)' }}
          >
            {current.cta}
          </button>
        </div>
      </div>
    </div>
  )
}
