'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { dispatchXP } from '@/lib/xp-engine'
import { signals } from '@/store/signals'
import BreathingExercise from './BreathingExercise'
import ExamWeekProtocol from './ExamWeekProtocol'
import NSScore from './NSScore'
import dynamic from 'next/dynamic'
const WellbeingJournal = dynamic(() => import('./WellbeingJournal'), { ssr: false })
import type { Exam } from '@/types'

type TabId = 'breathe' | 'release' | 'vagal' | 'eye' | 'exam' | 'history' | 'journal'

type BreathProtocol = 'box' | 'physiological_sigh' | '478'

interface TabConfig {
  id: TabId
  label: string
  icon: string
}

const TABS: TabConfig[] = [
  { id: 'breathe', label: 'Breathe',    icon: '🫁' },
  { id: 'release', label: 'Release',    icon: '🌊' },
  { id: 'vagal',   label: 'Vagal',      icon: '🧬' },
  { id: 'eye',     label: 'Eye Reset',  icon: '👁️' },
  { id: 'exam',    label: 'Exam Prep',  icon: '🎯' },
  { id: 'history', label: 'History',    icon: '📊' },
  { id: 'journal', label: 'Journal',    icon: '🌙' },
]

interface RegSession {
  id: string
  user_id: string
  session_type: string
  duration_seconds: number
  completed: boolean
  created_at: string
}

interface Props {
  userId: string
  university: string | null
  exams: Exam[]
}

async function saveSession(userId: string, sessionType: string, durationSeconds: number) {
  const supabase = createClient()
  await supabase.from('regulation_sessions').insert({
    user_id: userId,
    session_type: sessionType,
    duration_seconds: durationSeconds,
    completed: true,
  })
  dispatchXP('wellness_checkin')
  signals.emit({ type: 'regulation_completed', payload: { sessionType, durationSeconds } })
}

function useTimer(seconds: number, onDone: () => void) {
  const [remaining, setRemaining] = useState(seconds)
  const [running, setRunning] = useState(false)
  const ref = useRef(remaining)
  ref.current = remaining

  useEffect(() => {
    if (!running) return
    const iv = setInterval(() => {
      if (ref.current <= 1) {
        setRunning(false)
        setRemaining(seconds)
        onDone()
      } else {
        setRemaining(r => r - 1)
      }
    }, 1000)
    return () => clearInterval(iv)
  }, [running, seconds, onDone])

  function start() { setRemaining(seconds); setRunning(true) }
  function stop() { setRunning(false); setRemaining(seconds) }

  return { remaining, running, start, stop }
}

function TimerModal({ label, seconds, onClose, onDone }: { label: string; seconds: number; onClose: () => void; onDone: () => void }) {
  const { remaining, running, start, stop } = useTimer(seconds, () => { onDone(); onClose() })
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={() => { stop(); onClose() }}
    >
      <div
        style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 36, width: '100%', maxWidth: 340, textAlign: 'center' }}
        onClick={e => e.stopPropagation()}
      >
        <p style={{ color: '#e5e7eb', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{label}</p>
        <p style={{ color: '#4ecf9e', fontSize: 56, fontFamily: 'monospace', fontWeight: 700, margin: '24px 0' }}>
          {mins}:{secs.toString().padStart(2, '0')}
        </p>
        <div className="flex gap-3 justify-center">
          {!running ? (
            <button onClick={start} style={{ padding: '12px 28px', background: '#a78bfa', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Start</button>
          ) : (
            <button onClick={stop} style={{ padding: '12px 28px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12, color: '#e5e7eb', fontSize: 15, cursor: 'pointer' }}>Pause</button>
          )}
          <button onClick={() => { stop(); onClose() }} style={{ padding: '12px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#9ca3af', fontSize: 15, cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  )
}

function PMRModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const muscles = ['Feet & calves', 'Thighs', 'Abdomen', 'Hands & forearms', 'Shoulders', 'Face']
  const [step, setStep] = useState(-1)
  const [phase, setPhase] = useState<'tense' | 'release'>('tense')
  const [count, setCount] = useState(5)

  useEffect(() => {
    if (step === -1) return
    if (step >= muscles.length) { onDone(); onClose(); return }
    const iv = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          if (phase === 'tense') {
            setPhase('release')
            return 5
          } else {
            setPhase('tense')
            setStep(s => s + 1)
            return 5
          }
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [step, phase, muscles.length, onClose, onDone])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={() => onClose()}
    >
      <div
        style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 36, width: '100%', maxWidth: 360, textAlign: 'center' }}
        onClick={e => e.stopPropagation()}
      >
        {step === -1 ? (
          <>
            <p style={{ color: '#e5e7eb', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Progressive Muscle Relaxation</p>
            <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>Tense each muscle group for 5s, then release for 5s. We'll guide you from feet to face.</p>
            <button onClick={() => setStep(0)} style={{ padding: '12px 32px', background: '#a78bfa', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Begin</button>
          </>
        ) : step < muscles.length ? (
          <>
            <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8 }}>{step + 1}/{muscles.length}</p>
            <p style={{ color: '#e5e7eb', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{muscles[step]}</p>
            <p style={{ color: phase === 'tense' ? '#f87171' : '#4ecf9e', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
              {phase === 'tense' ? 'TENSE' : 'RELEASE'}
            </p>
            <p style={{ color: '#e5e7eb', fontSize: 48, fontFamily: 'monospace', fontWeight: 700, margin: '16px 0' }}>{count}</p>
          </>
        ) : null}
        <button onClick={() => onClose()} style={{ marginTop: 12, background: 'none', border: 'none', color: '#6b7280', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}

function ExhaleGuide() {
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale')
  const [count, setCount] = useState(4)
  const [active, setActive] = useState(false)
  const [rounds, setRounds] = useState(0)

  useEffect(() => {
    if (!active) return
    const duration = phase === 'inhale' ? 4 : 8
    const iv = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          if (phase === 'inhale') {
            setPhase('exhale')
            return 8
          } else {
            setPhase('inhale')
            setRounds(r => r + 1)
            return 4
          }
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [active, phase])

  useEffect(() => {
    if (rounds >= 5) setActive(false)
  }, [rounds])

  return (
    <div style={{ textAlign: 'center', marginTop: 16 }}>
      {active ? (
        <>
          <p style={{ color: phase === 'inhale' ? '#7090d0' : '#4ecf9e', fontSize: 18, fontWeight: 700 }}>
            {phase === 'inhale' ? 'INHALE' : 'EXHALE SLOWLY'}
          </p>
          <p style={{ color: '#e5e7eb', fontSize: 40, fontFamily: 'monospace', fontWeight: 700 }}>{count}</p>
          <p style={{ color: '#6b7280', fontSize: 12 }}>Round {rounds + 1}/5</p>
        </>
      ) : rounds >= 5 ? (
        <p style={{ color: '#4ecf9e', fontSize: 14 }}>Complete — well done.</p>
      ) : (
        <button onClick={() => setActive(true)} style={{ padding: '8px 20px', background: '#a78bfa', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, cursor: 'pointer' }}>
          Start Guide
        </button>
      )}
    </div>
  )
}

function EyeMovementGuide() {
  const [active, setActive] = useState(false)
  const [pos, setPos] = useState<'left' | 'right'>('left')
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) return
    const iv = setInterval(() => {
      setPos(p => p === 'left' ? 'right' : 'left')
      setCount(c => {
        if (c >= 9) { setActive(false); return 0 }
        return c + 1
      })
    }, 1500)
    return () => clearInterval(iv)
  }, [active])

  return (
    <div style={{ textAlign: 'center', marginTop: 16 }}>
      {active ? (
        <>
          <div style={{ width: 120, height: 40, background: 'rgba(255,255,255,0.05)', borderRadius: 20, position: 'relative', margin: '0 auto 12px' }}>
            <div style={{
              position: 'absolute', top: 8, width: 24, height: 24, borderRadius: '50%',
              background: '#a78bfa', transition: 'left 1.4s ease-in-out',
              left: pos === 'left' ? 8 : 88,
            }} />
          </div>
          <p style={{ color: '#9ca3af', fontSize: 13 }}>{count + 1}/10 — breathe slowly</p>
        </>
      ) : count >= 10 ? (
        <p style={{ color: '#4ecf9e', fontSize: 14 }}>Complete.</p>
      ) : (
        <button onClick={() => { setCount(0); setActive(true) }} style={{ padding: '8px 20px', background: '#a78bfa', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, cursor: 'pointer' }}>
          Start Guide
        </button>
      )}
    </div>
  )
}

function PracticeCard({ icon, title, duration, description, onStart }: { icon: string; title: string; duration: string; description: string; onStart?: () => void }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ color: '#e5e7eb', fontWeight: 700, fontSize: 15 }}>{title}</span>
            <span style={{ color: '#6b7280', fontSize: 11, marginLeft: 'auto' }}>{duration}</span>
          </div>
          <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.5 }}>{description}</p>
        </div>
        {onStart && (
          <button
            onClick={onStart}
            style={{
              flexShrink: 0, padding: '8px 16px', background: 'rgba(167,139,250,0.15)',
              border: '1px solid rgba(167,139,250,0.3)', borderRadius: 10,
              color: '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Start
          </button>
        )}
      </div>
    </div>
  )
}

function BreatheTab({ userId, onBreathingStart }: { userId: string; onBreathingStart: (p: BreathProtocol) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <PracticeCard
        icon="📦" title="Box Breathing" duration="4 min"
        description="4-4-4-4 pattern. Balances the nervous system. Used by Navy SEALs."
        onStart={() => onBreathingStart('box')}
      />
      <PracticeCard
        icon="🌬️" title="Physiological Sigh" duration="2 min"
        description="Double inhale then long exhale. Fastest anxiety reducer known to science (Huberman, Stanford)."
        onStart={() => onBreathingStart('physiological_sigh')}
      />
      <PracticeCard
        icon="🌙" title="4-7-8 Breath" duration="4 min"
        description="Inhale 4s, hold 7s, exhale 8s. Activates sleep circuits. Best done lying down."
        onStart={() => onBreathingStart('478')}
      />
    </div>
  )
}

function ReleaseTab({ userId, onTimerDone }: { userId: string; onTimerDone: (type: string, seconds: number) => void }) {
  const [modal, setModal] = useState<'shake' | 'pmr' | 'humming' | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <PracticeCard
        icon="🫨" title="Somatic Shake" duration="3 min"
        description="Stand and shake your entire body for 3 minutes. This is the biological discharge mechanism used by all mammals to release stress hormones after threat."
        onStart={() => setModal('shake')}
      />
      <PracticeCard
        icon="💪" title="Progressive Muscle Relaxation" duration="10 min"
        description="Tense each muscle group for 5s, release. Works from feet to head."
        onStart={() => setModal('pmr')}
      />
      <PracticeCard
        icon="💧" title="Cold Water Face Dip" duration="30s"
        description="Splash cold water on your face and hold breath for 10s. Activates the dive reflex — instant parasympathetic activation."
      />
      <PracticeCard
        icon="🎵" title="Humming / Singing" duration="2 min"
        description="Humming activates the vagus nerve through vibration. Hum for 2 minutes."
        onStart={() => setModal('humming')}
      />

      {modal === 'shake' && (
        <TimerModal label="Somatic Shake" seconds={180} onClose={() => setModal(null)} onDone={() => onTimerDone('somatic_shake', 180)} />
      )}
      {modal === 'pmr' && (
        <PMRModal onClose={() => setModal(null)} onDone={() => onTimerDone('progressive_muscle', 600)} />
      )}
      {modal === 'humming' && (
        <TimerModal label="Humming" seconds={120} onClose={() => setModal(null)} onDone={() => onTimerDone('vagal_toning', 120)} />
      )}
    </div>
  )
}

function VagalTab({ userId, onTimerDone }: { userId: string; onTimerDone: (type: string, seconds: number) => void }) {
  const [gargling, setGargling] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
        <div className="flex items-center gap-2 mb-2">
          <span style={{ fontSize: 20 }}>💧</span>
          <span style={{ color: '#e5e7eb', fontWeight: 700, fontSize: 15 }}>Gargling</span>
          <span style={{ color: '#6b7280', fontSize: 11, marginLeft: 'auto' }}>90s</span>
        </div>
        <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
          Gargle water vigorously for 30s, 3 times. Activates the same nerve branches as singing. Evidence-backed vagal toning.
        </p>
        {!gargling ? (
          <button onClick={() => setGargling(true)} style={{ padding: '8px 16px', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 10, color: '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Start
          </button>
        ) : (
          <TimerModal label="Gargling — 3 rounds" seconds={90} onClose={() => setGargling(false)} onDone={() => { onTimerDone('vagal_toning', 90); setGargling(false) }} />
        )}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
        <div className="flex items-center gap-2 mb-2">
          <span style={{ fontSize: 20 }}>🫁</span>
          <span style={{ color: '#e5e7eb', fontWeight: 700, fontSize: 15 }}>Extended Exhale Breathing</span>
          <span style={{ color: '#6b7280', fontSize: 11, marginLeft: 'auto' }}>5 rounds</span>
        </div>
        <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.5 }}>Make exhales twice as long as inhales. Inhale 4s, exhale 8s. 5 rounds.</p>
        <ExhaleGuide />
      </div>

      <PracticeCard
        icon="🥱" title="Yawning" duration="1-2 min"
        description="Force yourself to yawn 5-10 times. Each yawn activates parasympathetic response. It works even when forced."
      />
    </div>
  )
}

function EyeTab({ userId, onTimerDone }: { userId: string; onTimerDone: (type: string, seconds: number) => void }) {
  const [modal, setModal] = useState<'palming' | null>(null)
  const [reminderSet, setReminderSet] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
        <div className="flex items-center gap-2 mb-2">
          <span style={{ fontSize: 20 }}>⏱️</span>
          <span style={{ color: '#e5e7eb', fontWeight: 700, fontSize: 15 }}>20-20-20 Rule</span>
          <span style={{ color: '#6b7280', fontSize: 11, marginLeft: 'auto' }}>Every 20 min</span>
        </div>
        <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
          Every 20 minutes, look 20 feet away for 20 seconds. Prevents eye fatigue that causes headaches and concentration drops.
        </p>
        <button
          onClick={() => setReminderSet(true)}
          style={{ padding: '8px 16px', background: reminderSet ? 'rgba(78,207,158,0.15)' : 'rgba(167,139,250,0.15)', border: '1px solid ' + (reminderSet ? 'rgba(78,207,158,0.3)' : 'rgba(167,139,250,0.3)'), borderRadius: 10, color: reminderSet ? '#4ecf9e' : '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          {reminderSet ? '✓ Reminder noted' : 'Set reminder intent'}
        </button>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
        <div className="flex items-center gap-2 mb-2">
          <span style={{ fontSize: 20 }}>👀</span>
          <span style={{ color: '#e5e7eb', fontWeight: 700, fontSize: 15 }}>Eye Movement Relaxation</span>
          <span style={{ color: '#6b7280', fontSize: 11, marginLeft: 'auto' }}>1 min</span>
        </div>
        <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.5 }}>
          Slowly move eyes left and right 10 times while breathing slowly. Reduces amygdala activation.
        </p>
        <EyeMovementGuide />
      </div>

      <PracticeCard
        icon="🖐️" title="Palming" duration="2 min"
        description="Cup warm palms over closed eyes for 2 minutes. The darkness and warmth relax the eye muscles."
        onStart={() => setModal('palming')}
      />

      {modal === 'palming' && (
        <TimerModal label="Palming" seconds={120} onClose={() => setModal(null)} onDone={() => { onTimerDone('eye_movement', 120); setModal(null) }} />
      )}
    </div>
  )
}

function HistoryTab({ userId }: { userId: string }) {
  const [sessions, setSessions] = useState<RegSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    supabase
      .from('regulation_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setSessions((data as RegSession[]) ?? [])
        setLoading(false)
      })
  }, [userId])

  if (loading) return <p style={{ color: '#9ca3af', fontSize: 14 }}>Loading...</p>
  if (sessions.length === 0) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <p style={{ color: '#9ca3af', fontSize: 14 }}>No sessions yet — complete a practice to see your history.</p>
      </div>
    )
  }

  const totalSessions = sessions.length
  const totalMinutes = Math.round(sessions.reduce((s, r) => s + r.duration_seconds, 0) / 60)

  const typeCounts: Record<string, number> = {}
  for (const s of sessions) typeCounts[s.session_type] = (typeCounts[s.session_type] ?? 0) + 1
  const mostUsed = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace(/_/g, ' ') ?? '—'

  const last14: { date: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const count = sessions.filter(s => s.created_at.split('T')[0] === d).length
    last14.push({ date: d, count })
  }
  const maxCount = Math.max(...last14.map(d => d.count), 1)

  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  for (let i = 0; i < 30; i++) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    if (sessions.some(s => s.created_at.split('T')[0] === d)) streak++
    else if (i > 0 || !sessions.some(s => s.created_at.split('T')[0] === today)) break
    else break
  }

  return (
    <div className="flex flex-col gap-4">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { label: 'Sessions', value: totalSessions },
          { label: 'Minutes', value: totalMinutes },
          { label: 'Day streak', value: streak },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <p style={{ color: '#a78bfa', fontSize: 24, fontWeight: 700 }}>{value}</p>
            <p style={{ color: '#9ca3af', fontSize: 11 }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
        <p style={{ color: '#9ca3af', fontSize: 11, marginBottom: 12 }}>Most used: <span style={{ color: '#a78bfa' }}>{mostUsed}</span></p>
        <p style={{ color: '#9ca3af', fontSize: 11, marginBottom: 12 }}>Sessions last 14 days</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
          {last14.map(({ date, count }) => (
            <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: '100%', background: count > 0 ? '#a78bfa' : 'rgba(255,255,255,0.06)',
                borderRadius: 3,
                height: count > 0 ? Math.max(6, Math.round((count / maxCount) * 48)) : 6,
              }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ color: '#6b7280', fontSize: 10 }}>14 days ago</span>
          <span style={{ color: '#6b7280', fontSize: 10 }}>Today</span>
        </div>
      </div>
    </div>
  )
}

export default function RegulationRoom({ userId, exams }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('breathe')
  const [breathingProtocol, setBreathingProtocol] = useState<BreathProtocol | null>(null)

  function handleBreathingComplete() {
    if (breathingProtocol) {
      const durationMap: Record<BreathProtocol, number> = { box: 240, physiological_sigh: 120, '478': 240 }
      const typeMap: Record<BreathProtocol, string> = { box: 'box_breathing', physiological_sigh: 'physiological_sigh', '478': '478_breath' }
      saveSession(userId, typeMap[breathingProtocol], durationMap[breathingProtocol]).catch(() => {})
    }
  }

  function handleTimerDone(type: string, seconds: number) {
    saveSession(userId, type, seconds).catch(() => {})
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 120px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e5e7eb', marginBottom: 4 }}>Regulation Room</h1>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Calm your nervous system. Breathe, release, regulate.</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <NSScore userId={userId} />
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 24, scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flexShrink: 0, padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: activeTab === tab.id ? '#a78bfa' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#fff' : '#9ca3af',
                transition: 'all 0.2s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div>
          {activeTab === 'breathe' && (
            <BreatheTab userId={userId} onBreathingStart={setBreathingProtocol} />
          )}
          {activeTab === 'release' && (
            <ReleaseTab userId={userId} onTimerDone={handleTimerDone} />
          )}
          {activeTab === 'vagal' && (
            <VagalTab userId={userId} onTimerDone={handleTimerDone} />
          )}
          {activeTab === 'eye' && (
            <EyeTab userId={userId} onTimerDone={handleTimerDone} />
          )}
          {activeTab === 'exam' && (
            <ExamWeekProtocol exams={exams} userId={userId} />
          )}
          {activeTab === 'history' && (
            <HistoryTab userId={userId} />
          )}
          {activeTab === 'journal' && (
            <WellbeingJournal userId={userId} />
          )}
        </div>
      </div>

      {breathingProtocol && (
        <BreathingExercise
          protocol={breathingProtocol}
          onComplete={handleBreathingComplete}
          onClose={() => setBreathingProtocol(null)}
        />
      )}
    </div>
  )
}
