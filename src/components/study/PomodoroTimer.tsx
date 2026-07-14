'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { type Module, type Task } from '@/types'
import { dispatchXP } from '@/lib/xp-engine'
import { signals } from '@/store/signals'
import { queueWrite } from '@/lib/offline/pendingWrites'

// ─── Types ──────────────────────────────────────────────────────────────────

type Phase = 'work' | 'short_break' | 'long_break'

interface PomodoroSettings {
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  sessionsUntilLongBreak: number
  autoAdvance: boolean
  soundEnabled: boolean
}

interface PomodoroTimerProps {
  modules: Module[]
  tasks: Task[]
  userId: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsUntilLongBreak: 4,
  autoAdvance: false,
  soundEnabled: true,
}

const PRESETS: Array<{ label: string; emoji: string; s: Partial<PomodoroSettings> }> = [
  { label: 'Micro',    emoji: '⚡', s: { workMinutes: 15, shortBreakMinutes: 3,  longBreakMinutes: 10, sessionsUntilLongBreak: 4 } },
  { label: 'Classic',  emoji: '🍅', s: { workMinutes: 25, shortBreakMinutes: 5,  longBreakMinutes: 15, sessionsUntilLongBreak: 4 } },
  { label: 'Power',    emoji: '🔥', s: { workMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20, sessionsUntilLongBreak: 3 } },
  { label: 'Marathon', emoji: '🏃', s: { workMinutes: 90, shortBreakMinutes: 20, longBreakMinutes: 30, sessionsUntilLongBreak: 2 } },
]

const PHASE_LABELS: Record<Phase, string> = {
  work: 'Focus',
  short_break: 'Short break',
  long_break: 'Long break',
}

const PHASE_COLOURS: Record<Phase, { ring: string; text: string; bg: string; border: string }> = {
  work:        { ring: '#0d9488', text: '#4db6ac', bg: 'rgba(13,148,136,0.08)',  border: 'rgba(13,148,136,0.2)' },
  short_break: { ring: '#d97b54', text: '#e8956e', bg: 'rgba(217,120,84,0.08)', border: 'rgba(217,120,84,0.2)' },
  long_break:  { ring: '#9b59b6', text: '#c39bd3', bg: 'rgba(155,89,182,0.08)', border: 'rgba(155,89,182,0.2)' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PomodoroTimer({ modules, tasks, userId }: PomodoroTimerProps) {
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS)
  const [phase, setPhase] = useState<Phase>('work')
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SETTINGS.workMinutes * 60)
  const [running, setRunning] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [selectedModuleId, setSelectedModuleId] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  // Stable ref so playBeep doesn't need settings in its deps
  const soundRef = useRef(DEFAULT_SETTINGS.soundEnabled)
  useEffect(() => { soundRef.current = settings.soundEnabled }, [settings.soundEnabled])

  // Load today's stats
  useEffect(() => {
    fetch('/api/study/sessions')
      .then(r => r.json())
      .then(d => { if (!d.error) setTodayMinutes(d.todayMinutes ?? 0) })
      .catch(() => {/* silent */})
  }, [])

  // Play a simple beep using Web Audio API (no external assets)
  const playBeep = useCallback((frequency = 660, duration = 0.3) => {
    if (!soundRef.current) return
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = frequency
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
    } catch {/* AudioContext blocked in some browsers — silent fallback */}
  }, [])

  // Advance to next phase
  const advancePhase = useCallback(async (finishedPhase: Phase, startTime: Date | null) => {
    // Save completed work session
    if (finishedPhase === 'work' && startTime) {
      const durationMinutes = settings.workMinutes
      try {
        let savedOffline = false
        if (navigator.onLine) {
          await fetch('/api/study/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              duration_minutes: durationMinutes,
              task_id: selectedTaskId || null,
              module_id: selectedModuleId || null,
              started_at: startTime.toISOString(),
            }),
          })
        } else {
          await queueWrite('study_sessions', 'insert', {
            user_id: userId,
            duration_minutes: durationMinutes,
            task_id: selectedTaskId || null,
            module_id: selectedModuleId || null,
            started_at: startTime.toISOString(),
          })
          savedOffline = true
        }
        setTodayMinutes(prev => prev + durationMinutes)
        setCompletedSessions(prev => prev + 1)
        dispatchXP('pomodoro_session')
        signals.emit({
          type: 'study_session_ended',
          payload: { durationMins: durationMinutes, moduleId: selectedModuleId || undefined },
        })
        playBeep(880, 0.4)
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
        toast.success(`Focus session complete — ${durationMinutes} min logged${savedOffline ? ' · syncs when online' : ''}`)
      } catch {/* silent */}
    } else if (finishedPhase !== 'work') {
      playBeep(440, 0.3)
      toast('Break over — time to focus!', { icon: '⏰' })
    }

    // Determine next phase
    const newCompleted = finishedPhase === 'work' ? completedSessions + 1 : completedSessions
    let nextPhase: Phase
    if (finishedPhase === 'work') {
      nextPhase = newCompleted % settings.sessionsUntilLongBreak === 0 ? 'long_break' : 'short_break'
    } else {
      nextPhase = 'work'
    }

    setPhase(nextPhase)
    setSecondsLeft(
      nextPhase === 'work' ? settings.workMinutes * 60
      : nextPhase === 'short_break' ? settings.shortBreakMinutes * 60
      : settings.longBreakMinutes * 60
    )
    setRunning(settings.autoAdvance)
    setSessionStartTime(settings.autoAdvance && nextPhase === 'work' ? new Date() : null)
  }, [completedSessions, selectedModuleId, selectedTaskId, settings, playBeep, userId])

  // Timer tick
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          advancePhase(phase, sessionStartTime)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, phase, sessionStartTime, advancePhase])

  // Update page title while running
  useEffect(() => {
    if (running) {
      document.title = `${formatTime(secondsLeft)} — ${PHASE_LABELS[phase]} | VarsityOS`
    } else {
      document.title = 'Study Planner | VarsityOS'
    }
    return () => { document.title = 'Study Planner | VarsityOS' }
  }, [running, secondsLeft, phase])

  const handleStartPause = () => {
    if (!running && phase === 'work' && !sessionStartTime) {
      setSessionStartTime(new Date())
    }
    setRunning(r => !r)
  }

  const handleReset = () => {
    setRunning(false)
    setSessionStartTime(null)
    const total =
      phase === 'work' ? settings.workMinutes * 60
      : phase === 'short_break' ? settings.shortBreakMinutes * 60
      : settings.longBreakMinutes * 60
    setSecondsLeft(total)
  }

  const handleSkip = () => {
    setRunning(false)
    advancePhase(phase, sessionStartTime)
  }

  const applySettings = (s: PomodoroSettings) => {
    setSettings(s)
    setRunning(false)
    setSessionStartTime(null)
    setPhase('work')
    setSecondsLeft(s.workMinutes * 60)
    setShowSettings(false)
  }

  // Progress ring
  const totalSeconds =
    phase === 'work' ? settings.workMinutes * 60
    : phase === 'short_break' ? settings.shortBreakMinutes * 60
    : settings.longBreakMinutes * 60
  const progress = 1 - secondsLeft / totalSeconds
  const circumference = 2 * Math.PI * 80
  const strokeDashoffset = circumference * (1 - progress)
  const c = PHASE_COLOURS[phase]

  const pendingTasks = tasks.filter(t => t.status !== 'done')
  const selectedTask = pendingTasks.find(t => t.id === selectedTaskId)

  return (
    <div className="space-y-4">
      {/* ── Timer card ────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: `1px solid ${c.border}` }}
      >
        <div
          className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
          aria-hidden="true"
          style={{ background: `radial-gradient(circle at top right, ${c.bg.replace('0.08', '0.12')}, transparent 65%)` }}
        />

        {/* Phase label */}
        <div className="flex items-center justify-between mb-5 relative">
          <div className="flex gap-1">
            {(['work', 'short_break', 'long_break'] as Phase[]).map(p => (
              <button
                key={p}
                onClick={() => { if (!running) { setPhase(p); setSecondsLeft(p === 'work' ? settings.workMinutes * 60 : p === 'short_break' ? settings.shortBreakMinutes * 60 : settings.longBreakMinutes * 60); setSessionStartTime(null) } }}
                className={cn('font-mono text-[0.63rem] px-2.5 py-1 rounded-full transition-all', phase === p ? 'font-bold' : 'opacity-40')}
                style={{ background: phase === p ? c.bg : 'transparent', color: phase === p ? c.text : 'rgba(255,255,255,0.4)', border: `1px solid ${phase === p ? c.border : 'transparent'}` }}
              >
                {PHASE_LABELS[p]}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="font-mono text-[0.6rem] px-2.5 py-1 rounded-xl transition-all"
            style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            aria-label="Timer settings"
          >
            ⚙
          </button>
        </div>

        {/* Ring timer */}
        <div className="flex flex-col items-center relative">
          <svg width="200" height="200" className="-rotate-90" aria-hidden="true">
            <defs>
              <filter id="timer-glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {/* Track */}
            <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            {/* Background ring glow */}
            <circle cx="100" cy="100" r="80" fill="none" stroke={c.ring} strokeWidth="12" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none', opacity: 0.15, filter: 'blur(4px)' }}
            />
            {/* Main progress arc */}
            <circle
              cx="100" cy="100" r="80" fill="none"
              stroke={c.ring} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none', filter: 'url(#timer-glow)' }}
            />
          </svg>

          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-display font-black tabular-nums"
              style={{ fontSize: '3.2rem', lineHeight: 1, color: c.text, letterSpacing: '-0.03em', textShadow: `0 0 30px ${c.ring}50` }}
              aria-live="polite"
              aria-label={`${PHASE_LABELS[phase]}: ${formatTime(secondsLeft)} remaining`}
            >
              {formatTime(secondsLeft)}
            </span>
            <span className="font-mono text-[0.65rem] mt-1.5 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {PHASE_LABELS[phase]}
            </span>
            {running && (
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.ring, marginTop: 6, animation: 'novaPulse 1.5s ease-in-out infinite' }} />
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={handleReset}
            className="w-10 h-10 rounded-xl flex items-center justify-center font-mono text-sm transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
            aria-label="Reset timer"
          >
            ↺
          </button>

          <button
            onClick={handleStartPause}
            className="h-12 px-8 rounded-2xl font-display font-bold text-sm transition-all"
            style={{ background: running ? 'rgba(255,255,255,0.08)' : c.ring, color: '#fff', border: running ? '1px solid rgba(255,255,255,0.12)' : 'none' }}
            aria-label={running ? 'Pause timer' : 'Start timer'}
          >
            {running ? 'Pause' : secondsLeft === totalSeconds ? 'Start' : 'Resume'}
          </button>

          <button
            onClick={handleSkip}
            className="w-10 h-10 rounded-xl flex items-center justify-center font-mono text-sm transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
            aria-label="Skip to next phase"
          >
            ⏭
          </button>
        </div>

        {/* Session dots */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {Array.from({ length: settings.sessionsUntilLongBreak }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: i < (completedSessions % settings.sessionsUntilLongBreak) ? c.ring : 'rgba(255,255,255,0.12)' }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {/* ── Context selector ──────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="font-mono text-[0.65rem] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Studying for (optional)
        </p>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={selectedModuleId}
            onChange={e => { setSelectedModuleId(e.target.value); setSelectedTaskId('') }}
            className="rounded-xl px-3 py-2 font-display text-xs text-white outline-none"
            style={{ background: 'var(--bg-base)', border: '1px solid rgba(255,255,255,0.09)' }}
            aria-label="Select module"
          >
            <option value="">All modules</option>
            {modules.map(m => (
              <option key={m.id} value={m.id}>{m.code ? `${m.code} — ` : ''}{m.name}</option>
            ))}
          </select>

          <select
            value={selectedTaskId}
            onChange={e => setSelectedTaskId(e.target.value)}
            className="rounded-xl px-3 py-2 font-display text-xs text-white outline-none"
            style={{ background: 'var(--bg-base)', border: '1px solid rgba(255,255,255,0.09)' }}
            aria-label="Select task"
          >
            <option value="">No specific task</option>
            {(selectedModuleId
              ? pendingTasks.filter(t => t.module_id === selectedModuleId)
              : pendingTasks
            ).map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        {selectedTask && (
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.15)' }}
          >
            <span className="text-teal-400 text-xs" aria-hidden="true">✓</span>
            <p className="font-display text-xs text-teal-300 truncate">{selectedTask.title}</p>
          </div>
        )}
      </div>

      {/* ── Today stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl p-4 text-center relative overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid rgba(13,148,136,0.18)' }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #0d9488, transparent)' }} />
          <p className="font-display font-black text-2xl" style={{ color: '#4db6ac' }}>
            {todayMinutes >= 60
              ? `${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`
              : `${todayMinutes}m`}
          </p>
          <p className="font-mono text-[0.63rem] text-white/78 mt-0.5">studied today</p>
        </div>
        <div
          className="rounded-2xl p-4 text-center relative overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid rgba(217,120,84,0.18)' }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #d97b54, transparent)' }} />
          <p className="font-display font-black text-2xl" style={{ color: '#e8956e' }}>{completedSessions}</p>
          <p className="font-mono text-[0.63rem] text-white/78 mt-0.5">sessions this run</p>
        </div>
      </div>

      {/* ── Flow State insight ────────────────────────────────────────────── */}
      <FlowInsightCard workMinutes={settings.workMinutes} />

      {/* ── Settings panel ────────────────────────────────────────────────── */}
      {showSettings && (
        <SettingsPanel settings={settings} onApply={applySettings} onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

// ─── Flow State insight card ─────────────────────────────────────────────────

function FlowInsightCard({ workMinutes }: { workMinutes: number }) {
  const [open, setOpen] = useState(false)
  const inFlowZone = workMinutes >= 25 && workMinutes <= 90
  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      background: 'rgba(13,148,136,0.05)',
      border: '0.5px solid rgba(13,148,136,0.2)',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '10px 14px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', gap: 8,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 12 }}>🌊</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, color: '#4db6ac', letterSpacing: '0.06em' }}>
            The science of deep focus
          </span>
        </span>
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {inFlowZone && (
            <div style={{ background: 'rgba(13,148,136,0.12)', border: '0.5px solid rgba(13,148,136,0.3)', borderRadius: 9, padding: '7px 10px', fontSize: '0.62rem', color: '#4db6ac', fontFamily: 'var(--font-mono)' }}>
              ✓ Your {workMinutes}m session is in the optimal flow range (25–90 min)
            </div>
          )}
          {[
            {
              book: 'Flow — Mihaly Csikszentmihalyi',
              insight: 'Flow is a state of complete absorption where time disappears and performance peaks. It requires clear goals, immediate feedback, and a task that slightly exceeds your current skill. Your Pomodoro timer creates the time container; picking a specific task creates the clear goal.',
            },
            {
              book: 'Deep Work — Cal Newport',
              insight: 'Newport defines deep work as cognitively demanding tasks performed in a distraction-free state. He found that 90 minutes is the maximum most people can sustain true deep work in one block. Under 25 minutes and your brain doesn\'t have time to fully engage. The sweet spot: 45–90 minute focused sessions.',
            },
            {
              book: 'Why We Sleep — Matthew Walker',
              insight: 'Concentration and memory encoding both peak in the first 6 hours after waking. Trying to study after 10pm is significantly less effective — the hippocampus consolidates what you learn during sleep, not while awake. Study in morning/afternoon blocks, sleep 7–9 hours, let memory form overnight.',
            },
          ].map(item => (
            <div key={item.book} style={{ paddingLeft: 8, borderLeft: '2px solid rgba(13,148,136,0.4)' }}>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>{item.book}</div>
              <div style={{ fontSize: '0.63rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{item.insight}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Settings sub-component ──────────────────────────────────────────────────

function SettingsPanel({ settings, onApply, onClose }: {
  settings: PomodoroSettings
  onApply: (s: PomodoroSettings) => void
  onClose: () => void
}) {
  const [s, setS] = useState(settings)

  const slider = (label: string, key: 'workMinutes' | 'shortBreakMinutes' | 'longBreakMinutes' | 'sessionsUntilLongBreak', min: number, max: number) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="font-mono text-[0.65rem] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {label}
        </label>
        <span className="font-display font-bold text-white text-sm tabular-nums">
          {s[key]}{key !== 'sessionsUntilLongBreak' ? 'm' : '×'}
        </span>
      </div>
      <input
        type="range" min={min} max={max} value={s[key]}
        onChange={e => setS(prev => ({ ...prev, [key]: Number(e.target.value) }))}
        className="w-full accent-teal-500"
        aria-label={label}
      />
    </div>
  )

  const toggle = (label: string, key: 'autoAdvance' | 'soundEnabled', description: string) => (
    <button
      onClick={() => setS(prev => ({ ...prev, [key]: !prev[key] }))}
      className="flex items-center justify-between w-full py-2.5 px-3 rounded-xl transition-all"
      style={{ background: s[key] ? 'rgba(13,148,136,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${s[key] ? 'rgba(13,148,136,0.25)' : 'rgba(255,255,255,0.07)'}` }}
    >
      <div className="text-left">
        <p className="font-display text-xs text-white">{label}</p>
        <p className="font-mono text-[0.65rem]" style={{ color: 'rgba(255,255,255,0.35)' }}>{description}</p>
      </div>
      <div
        className="w-9 h-5 rounded-full flex-shrink-0 relative transition-colors"
        style={{ background: s[key] ? '#0d9488' : 'rgba(255,255,255,0.12)' }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
          style={{ left: s[key] ? '18px' : '2px' }}
        />
      </div>
    </button>
  )

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="flex items-center justify-between">
        <p className="font-display font-bold text-white text-sm">Timer settings</p>
        <button onClick={onClose} className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>✕</button>
      </div>

      {/* Presets */}
      <div>
        <p className="font-mono text-[0.64rem] uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Presets</p>
        <div className="grid grid-cols-4 gap-1.5">
          {PRESETS.map(p => {
            const active = s.workMinutes === p.s.workMinutes && s.sessionsUntilLongBreak === p.s.sessionsUntilLongBreak
            return (
              <button
                key={p.label}
                onClick={() => setS(prev => ({ ...prev, ...p.s }))}
                className="rounded-xl py-2.5 flex flex-col items-center gap-1 transition-all"
                style={{ background: active ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? 'rgba(13,148,136,0.3)' : 'rgba(255,255,255,0.07)'}` }}
              >
                <span style={{ fontSize: '1rem' }}>{p.emoji}</span>
                <span className="font-mono text-[0.63rem]" style={{ color: active ? '#4db6ac' : 'rgba(255,255,255,0.4)' }}>{p.label}</span>
                <span className="font-mono text-[0.65rem]" style={{ color: 'rgba(255,255,255,0.25)' }}>{p.s.workMinutes}m</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-3">
        <p className="font-mono text-[0.64rem] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Custom duration</p>
        {slider('Focus', 'workMinutes', 1, 90)}
        {slider('Short break', 'shortBreakMinutes', 1, 30)}
        {slider('Long break', 'longBreakMinutes', 5, 60)}
        {slider('Sessions before long break', 'sessionsUntilLongBreak', 1, 10)}
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        {toggle('Auto-advance', 'autoAdvance', 'Start next phase automatically')}
        {toggle('Sound', 'soundEnabled', 'Play beep when phase ends')}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => setS(DEFAULT_SETTINGS)}
          className="flex-1 font-display text-xs py-2 rounded-xl"
          style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}
        >
          Reset
        </button>
        <button
          onClick={() => onApply(s)}
          className="flex-1 font-display font-bold text-xs py-2 rounded-xl"
          style={{ background: '#0d9488', color: '#fff' }}
        >
          Apply
        </button>
      </div>
    </div>
  )
}
