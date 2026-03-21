'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { type Module, type Task } from '@/types'

// ─── Types ──────────────────────────────────────────────────────────────────

type Phase = 'work' | 'short_break' | 'long_break'

interface PomodoroSettings {
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  sessionsUntilLongBreak: number
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
}

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

export default function PomodoroTimer({ modules, tasks, userId: _userId }: PomodoroTimerProps) {
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

  // Load today's stats
  useEffect(() => {
    fetch('/api/study/sessions')
      .then(r => r.json())
      .then(d => { if (!d.error) setTodayMinutes(d.todayMinutes ?? 0) })
      .catch(() => {/* silent */})
  }, [])

  // Play a simple beep using Web Audio API (no external assets)
  const playBeep = useCallback((frequency = 660, duration = 0.3) => {
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
        setTodayMinutes(prev => prev + durationMinutes)
        setCompletedSessions(prev => prev + 1)
        playBeep(880, 0.4)
        // Vibrate on mobile
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
        toast.success(`Focus session complete — ${durationMinutes} min logged`)
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
    setRunning(false)
    setSessionStartTime(null)
  }, [completedSessions, selectedModuleId, selectedTaskId, settings, playBeep])

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

  const pendingTasks = tasks.filter(t => !t.done)
  const selectedTask = pendingTasks.find(t => t.id === selectedTaskId)

  return (
    <div className="space-y-4">
      {/* ── Timer card ────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: '#120e0a', border: `1px solid ${c.border}` }}
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
                className={cn('font-mono text-[0.55rem] px-2.5 py-1 rounded-full transition-all', phase === p ? 'font-bold' : 'opacity-40')}
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
            {/* Track */}
            <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            {/* Progress */}
            <circle
              cx="100" cy="100" r="80" fill="none"
              stroke={c.ring} strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }}
            />
          </svg>

          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-display font-black tabular-nums"
              style={{ fontSize: '3rem', lineHeight: 1, color: c.text }}
              aria-live="polite"
              aria-label={`${PHASE_LABELS[phase]}: ${formatTime(secondsLeft)} remaining`}
            >
              {formatTime(secondsLeft)}
            </span>
            <span className="font-mono text-[0.58rem] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {PHASE_LABELS[phase]}
            </span>
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
        style={{ background: '#120e0a', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="font-mono text-[0.58rem] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Studying for (optional)
        </p>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={selectedModuleId}
            onChange={e => { setSelectedModuleId(e.target.value); setSelectedTaskId('') }}
            className="rounded-xl px-3 py-2 font-display text-xs text-white outline-none"
            style={{ background: '#161009', border: '1px solid rgba(255,255,255,0.09)' }}
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
            style={{ background: '#161009', border: '1px solid rgba(255,255,255,0.09)' }}
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
          className="rounded-2xl p-4 text-center"
          style={{ background: '#120e0a', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="font-display font-black text-2xl text-white">
            {todayMinutes >= 60
              ? `${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`
              : `${todayMinutes}m`}
          </p>
          <p className="font-mono text-[0.55rem] text-white/30 mt-0.5">studied today</p>
        </div>
        <div
          className="rounded-2xl p-4 text-center"
          style={{ background: '#120e0a', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="font-display font-black text-2xl text-white">{completedSessions}</p>
          <p className="font-mono text-[0.55rem] text-white/30 mt-0.5">sessions this run</p>
        </div>
      </div>

      {/* ── Settings panel ────────────────────────────────────────────────── */}
      {showSettings && (
        <SettingsPanel settings={settings} onApply={applySettings} onClose={() => setShowSettings(false)} />
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

  const field = (label: string, key: keyof PomodoroSettings, min: number, max: number) => (
    <div>
      <label className="font-mono text-[0.58rem] uppercase tracking-widest block mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="range" min={min} max={max} value={s[key]}
          onChange={e => setS(prev => ({ ...prev, [key]: Number(e.target.value) }))}
          className="flex-1 accent-teal-500"
          aria-label={label}
        />
        <span className="font-display font-bold text-white text-sm w-8 text-right">
          {s[key]}{key !== 'sessionsUntilLongBreak' ? 'm' : ''}
        </span>
      </div>
    </div>
  )

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: '#120e0a', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="flex items-center justify-between mb-1">
        <p className="font-display font-bold text-white text-sm">Timer settings</p>
        <button onClick={onClose} className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>✕</button>
      </div>
      {field('Focus duration', 'workMinutes', 5, 60)}
      {field('Short break', 'shortBreakMinutes', 1, 15)}
      {field('Long break', 'longBreakMinutes', 5, 30)}
      {field('Sessions until long break', 'sessionsUntilLongBreak', 2, 8)}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => setS(DEFAULT_SETTINGS)}
          className="flex-1 font-display text-xs py-2 rounded-xl"
          style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}
        >
          Reset to defaults
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
