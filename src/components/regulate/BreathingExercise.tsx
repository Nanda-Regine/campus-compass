'use client'

import { useState, useEffect, useRef } from 'react'

type Protocol = 'box' | 'physiological_sigh' | '478'

interface Phase {
  label: string
  duration: number
}

interface ProtocolDef {
  phases: Phase[]
  totalRounds: number
  scienceBlurb: string
}

const PROTOCOLS: Record<Protocol, ProtocolDef> = {
  box: {
    phases: [
      { label: 'INHALE', duration: 4 },
      { label: 'HOLD', duration: 4 },
      { label: 'EXHALE', duration: 4 },
      { label: 'HOLD', duration: 4 },
    ],
    totalRounds: 4,
    scienceBlurb: 'Box breathing balances the autonomic nervous system by equalising inhale and exhale.',
  },
  physiological_sigh: {
    phases: [
      { label: 'INHALE', duration: 2 },
      { label: 'INHALE AGAIN', duration: 1 },
      { label: 'EXHALE SLOWLY', duration: 6 },
    ],
    totalRounds: 6,
    scienceBlurb: 'The physiological sigh (Huberman, Stanford) is the fastest known way to reduce acute anxiety.',
  },
  '478': {
    phases: [
      { label: 'INHALE', duration: 4 },
      { label: 'HOLD', duration: 7 },
      { label: 'EXHALE', duration: 8 },
    ],
    totalRounds: 4,
    scienceBlurb: '4-7-8 breathing activates sleep circuits. Best done lying down.',
  },
}

function getCircleScale(label: string): number {
  if (label === 'INHALE' || label === 'INHALE AGAIN') return 1.4
  if (label === 'EXHALE' || label === 'EXHALE SLOWLY') return 1
  return 1.4
}

interface Props {
  protocol: Protocol
  onComplete: () => void
  onClose: () => void
}

export default function BreathingExercise({ protocol, onComplete, onClose }: Props) {
  const def = PROTOCOLS[protocol]
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [countdown, setCountdown] = useState(def.phases[0].duration)
  const [round, setRound] = useState(1)
  const [isActive, setIsActive] = useState(true)
  const [isDone, setIsDone] = useState(false)
  const phaseRef = useRef(currentPhaseIndex)
  const countdownRef = useRef(countdown)
  const roundRef = useRef(round)

  phaseRef.current = currentPhaseIndex
  countdownRef.current = countdown
  roundRef.current = round

  useEffect(() => {
    if (!isActive || isDone) return
    const interval = setInterval(() => {
      if (countdownRef.current > 1) {
        setCountdown(c => c - 1)
      } else {
        const nextPhase = phaseRef.current + 1
        if (nextPhase < def.phases.length) {
          setCurrentPhaseIndex(nextPhase)
          setCountdown(def.phases[nextPhase].duration)
        } else {
          const nextRound = roundRef.current + 1
          if (nextRound > def.totalRounds) {
            setIsDone(true)
            setIsActive(false)
            onComplete()
          } else {
            setRound(nextRound)
            setCurrentPhaseIndex(0)
            setCountdown(def.phases[0].duration)
          }
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isActive, isDone, def])

  const currentPhase = def.phases[currentPhaseIndex]
  const scale = isDone ? 1 : getCircleScale(currentPhase.label)
  const phaseDuration = isDone ? 1 : currentPhase.duration

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)', zIndex: 50 }}
      className="flex flex-col items-center justify-center"
    >
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 24, right: 24, color: '#9ca3af', fontSize: 24, background: 'none', border: 'none', cursor: 'pointer' }}
      >
        ×
      </button>

      {isDone ? (
        <div className="flex flex-col items-center gap-6 text-center px-8">
          <div style={{ fontSize: 64 }}>✓</div>
          <p style={{ color: '#a78bfa', fontSize: 22, fontWeight: 700 }}>Well done.</p>
          <p style={{ color: '#e5e7eb', fontSize: 16 }}>Your nervous system is more regulated.</p>
          <button
            onClick={onClose}
            style={{
              marginTop: 16,
              padding: '12px 32px',
              background: '#a78bfa',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              width: 200,
              height: 200,
              border: '3px solid #a78bfa',
              borderRadius: '50%',
              background: 'rgba(167,139,250,0.1)',
              transform: `scale(${scale})`,
              transition: `transform ${phaseDuration}s ease-in-out`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#e5e7eb', fontSize: 40, fontFamily: 'monospace', fontWeight: 700 }}>
              {countdown}
            </span>
          </div>

          <p style={{ color: '#c4b5fd', fontSize: 22, fontWeight: 700, letterSpacing: '0.15em', marginTop: 32 }}>
            {currentPhase.label}
          </p>

          <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 16 }}>
            Round {round}/{def.totalRounds}
          </p>

          <p style={{ color: '#6b7280', fontSize: 12, marginTop: 32, maxWidth: 300, textAlign: 'center' }}>
            {def.scienceBlurb}
          </p>
        </>
      )}
    </div>
  )
}
