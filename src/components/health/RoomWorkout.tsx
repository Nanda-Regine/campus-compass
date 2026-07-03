'use client'

import { useState, useEffect, useRef } from 'react'
import { dispatchXP } from '@/lib/xp-engine'

type Space = 'mat' | 'small_room' | 'outdoor'
type EnergyLevel = 1 | 2 | 3 | 4 | 5
type Duration = 5 | 10 | 15 | 20

interface Exercise {
  name: string
  duration: string
  reps?: string
  description: string
  benefit: string
}

interface Routine {
  id: string
  name: string
  space: Space
  minEnergy: number
  time: Duration
  scienceLink: string
  exercises: Exercise[]
}

const ACCENT = '#f472b6'

const ROUTINES: Routine[] = [
  {
    id: 'desk_reset',
    name: 'The Desk Reset',
    space: 'mat',
    minEnergy: 1,
    time: 5,
    scienceLink: 'Relieves tension that builds after 90 min seated, reduces cortisol by 12%',
    exercises: [
      { name: 'Neck rolls', duration: '45s', description: 'Slow circles, 5 each direction', benefit: 'Releases tension from screen posture' },
      { name: 'Shoulder rolls', duration: '30s', description: 'Roll back 10x, forward 10x', benefit: 'Opens chest and upper back' },
      { name: 'Seated spinal twist', duration: '30s each side', description: 'Sit tall, rotate torso, hold', benefit: 'Releases lower back compression' },
      { name: 'Hip flexor stretch', duration: '30s each side', description: 'Step one foot forward into lunge position, feel stretch in front hip', benefit: 'Counteracts hours of sitting' },
      { name: 'Wrist and finger stretches', duration: '1min', description: 'Extend arm, gently pull fingers back. Circle wrists both directions', benefit: 'Prevents RSI from typing' },
    ],
  },
  {
    id: 'low_energy',
    name: 'Low Energy Recharge',
    space: 'mat',
    minEnergy: 1,
    time: 10,
    scienceLink: 'Gentle movement increases blood flow and serotonin without taxing the body',
    exercises: [
      { name: "Child's pose", duration: '1min', description: 'Knees wide, arms extended forward, forehead down', benefit: 'Calms nervous system' },
      { name: 'Cat-cow', duration: '1min', description: 'On hands and knees, arch and round spine slowly', benefit: 'Mobilises spine, activates breath' },
      { name: 'Glute bridges', duration: '15 reps', description: 'Lie on back, feet flat, push hips up and hold 2s', benefit: 'Activates glutes and lower back' },
      { name: 'Legs up the wall', duration: '3min', description: 'Lie with legs vertical against wall or headboard', benefit: 'Drains leg fatigue, calms nervous system' },
      { name: 'Deep breathing', duration: '2min', description: 'Belly breathing: inhale 4s, exhale 6s', benefit: 'Activates parasympathetic response' },
    ],
  },
  {
    id: 'stress_buster',
    name: 'Stress Buster',
    space: 'small_room',
    minEnergy: 2,
    time: 10,
    scienceLink: 'Cardio bursts reduce cortisol and increase BDNF — brain fertiliser',
    exercises: [
      { name: 'Jumping jacks', duration: '45s', description: 'Jump feet wide as arms reach up, alternate', benefit: 'Full body warm-up, cardio activation' },
      { name: 'High knees', duration: '45s', description: 'Run in place, knees to chest level', benefit: 'Cardio + core engagement' },
      { name: 'Squat jumps', duration: '10 reps', description: 'Squat down, explode up, land softly', benefit: 'Leg power + cardio' },
      { name: 'Mountain climbers', duration: '30s', description: 'Plank position, alternate driving knees to chest quickly', benefit: 'Core strength + cardio' },
      { name: 'Rest + shake out', duration: '1min', description: 'Walk in place, shake arms and legs loose', benefit: 'Active recovery' },
      { name: 'Repeat x2', duration: '', description: 'Do the circuit twice total', benefit: '10 minutes total' },
    ],
  },
  {
    id: 'strength_circuit',
    name: 'Strength Circuit',
    space: 'small_room',
    minEnergy: 3,
    time: 20,
    scienceLink: 'Bodyweight strength training increases BDNF and testosterone — both linked to motivation and learning capacity',
    exercises: [
      { name: 'Push-ups', duration: '10-15 reps', description: 'Knees if needed. Keep core tight.', benefit: 'Chest, shoulders, triceps' },
      { name: 'Squats', duration: '20 reps', description: 'Feet shoulder-width, sit back, chest tall', benefit: 'Quads, glutes, core' },
      { name: 'Plank', duration: '30-45s', description: 'Forearms or hands, straight line from head to heels', benefit: 'Core stability' },
      { name: 'Reverse lunges', duration: '10 each leg', description: 'Step back, lower knee toward floor, push back up', benefit: 'Glutes, balance, quads' },
      { name: 'Tricep dips', duration: '12 reps', description: 'Use chair edge: grip edge, lower and push up', benefit: 'Triceps, chest' },
      { name: 'Superman hold', duration: '10 reps 3s hold', description: 'Lie face down, lift arms and legs simultaneously', benefit: 'Lower back, glutes' },
      { name: 'Rest 90s + repeat x3', duration: '', description: '3 full circuits with 90 second rests', benefit: '20 minutes total' },
    ],
  },
  {
    id: 'pre_exam',
    name: 'Pre-Exam Energizer',
    space: 'mat',
    minEnergy: 2,
    time: 15,
    scienceLink: '15-min morning exercise increases hippocampal activity and memory retention by 20% for up to 2 hours after',
    exercises: [
      { name: 'Sun salutation simplified', duration: '5 reps', description: "Stand, reach up, fold forward, step back to plank, child's pose, up dog, down dog, step forward, stand", benefit: 'Full body wake-up' },
      { name: 'Box jumps or jump squats', duration: '10 reps', description: 'Explosive lower body movement', benefit: 'Increases alertness and blood flow to brain' },
      { name: 'Jumping jacks', duration: '1min', description: 'Easy cardio to raise heart rate', benefit: 'Cardiovascular activation' },
      { name: 'Standing forward fold', duration: '1min', description: 'Hang heavy, touch toes or shins, breathe', benefit: 'Calms nervous system after cardio' },
      { name: 'Power pose', duration: '2min', description: 'Stand tall, hands on hips or arms wide, chin up. Research shows this increases confidence hormones.', benefit: 'Cortisol down, testosterone up — exam confidence' },
    ],
  },
  {
    id: 'night_unwind',
    name: 'Night Unwind',
    space: 'mat',
    minEnergy: 1,
    time: 10,
    scienceLink: 'This sequence activates the parasympathetic nervous system, reducing cortisol for better sleep and memory consolidation',
    exercises: [
      { name: '4-7-8 breathing', duration: '4 rounds', description: 'Inhale 4s, hold 7s, exhale 8s', benefit: 'Activates sleep circuits' },
      { name: 'Supine twist', duration: '1min each side', description: 'Lie on back, bring one knee across body, spread arms, look away', benefit: 'Releases spinal tension' },
      { name: 'Happy baby pose', duration: '1min', description: 'On back, hold feet with knees bent out to sides', benefit: 'Releases hip tension, calming' },
      { name: 'Legs up the wall', duration: '3min', description: 'Lie with legs up against wall, close eyes', benefit: 'Drains fatigue, calms mind' },
      { name: 'Savasana with body scan', duration: '3min', description: 'Lie flat. Consciously relax each body part from feet to head.', benefit: 'Complete nervous system reset' },
    ],
  },
]

const SPACE_ORDER: Space[] = ['mat', 'small_room', 'outdoor']
const SPACE_LABELS: Record<Space, string> = { mat: 'Yoga mat / floor', small_room: 'Small room', outdoor: 'Outdoor' }

function spaceScore(s: Space) {
  return SPACE_ORDER.indexOf(s)
}

function parseDurationToSeconds(dur: string): number {
  const minMatch = dur.match(/(\d+)\s*min/)
  const secMatch = dur.match(/(\d+)\s*s\b/)
  const roundsMatch = dur.match(/(\d+)\s*round/)
  const repsMatch = dur.match(/(\d+)\s*rep/)
  if (minMatch) return parseInt(minMatch[1]) * 60
  if (secMatch) return parseInt(secMatch[1])
  if (roundsMatch) return parseInt(roundsMatch[1]) * 30
  if (repsMatch) return parseInt(repsMatch[1]) * 3
  return 30
}

export default function RoomWorkout() {
  const [space, setSpace] = useState<Space>('small_room')
  const [energy, setEnergy] = useState<EnergyLevel>(3)
  const [time, setTime] = useState<Duration>(10)
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null)
  const [timerActive, setTimerActive] = useState(false)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [completed, setCompleted] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const allDurations: Duration[] = [5, 10, 15, 20]

  const filtered = ROUTINES.filter(r => spaceScore(r.space) <= spaceScore(space) && r.minEnergy <= energy && r.time === time)
  const fallback: Routine | null = filtered.length === 0
    ? (ROUTINES.find(r => spaceScore(r.space) <= spaceScore(space) && r.minEnergy <= energy) ?? ROUTINES[0])
    : null
  const showFallbackNote = filtered.length === 0

  const displayedRoutines = filtered.length > 0 ? filtered : fallback ? [fallback] : []

  function startWorkout(routine: Routine) {
    setActiveRoutine(routine)
    setCurrentExerciseIndex(0)
    setCompleted(false)
    const ex = routine.exercises[0]
    setCountdown(parseDurationToSeconds(ex.duration || '30s'))
    setTimerActive(false)
  }

  function beginTimer() {
    setTimerActive(true)
  }

  useEffect(() => {
    if (!timerActive) return
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [timerActive, currentExerciseIndex])

  function nextExercise() {
    if (!activeRoutine) return
    clearInterval(intervalRef.current!)
    setTimerActive(false)
    const next = currentExerciseIndex + 1
    if (next >= activeRoutine.exercises.length) {
      setCompleted(true)
      dispatchXP('wellness_checkin')
    } else {
      setCurrentExerciseIndex(next)
      const ex = activeRoutine.exercises[next]
      setCountdown(parseDurationToSeconds(ex.duration || '30s'))
    }
  }

  function stopWorkout() {
    clearInterval(intervalRef.current!)
    setTimerActive(false)
    setActiveRoutine(null)
    setCompleted(false)
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`
  }

  if (activeRoutine) {
    if (completed) {
      return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '1.5rem', marginBottom: '8px', textAlign: 'center' }}>Workout Complete!</h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: '8px' }}>{activeRoutine.name}</p>
          <div style={{ background: 'rgba(244,114,182,0.15)', border: '1px solid rgba(244,114,182,0.3)', borderRadius: '12px', padding: '12px 24px', marginBottom: '32px', color: ACCENT, fontWeight: 700 }}>+20 XP earned</div>
          <button onClick={stopWorkout} style={{ padding: '14px 40px', background: ACCENT, border: 'none', borderRadius: '12px', color: '#0a0a0f', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>Done</button>
        </div>
      )
    }

    const ex = activeRoutine.exercises[currentExerciseIndex]
    const progress = (currentExerciseIndex / activeRoutine.exercises.length) * 100

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '32px 20px 80px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{activeRoutine.name}</span>
            <button onClick={stopWorkout} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: 'var(--text-tertiary)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.8rem' }}>Stop</button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '4px', height: '4px', marginBottom: '32px' }}>
            <div style={{ background: ACCENT, height: '4px', borderRadius: '4px', width: `${progress}%`, transition: 'width 0.4s' }} />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>Exercise {currentExerciseIndex + 1} of {activeRoutine.exercises.length}</div>
            <h2 style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '1.8rem', marginBottom: '12px' }}>{ex.name}</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '8px' }}>{ex.description}</p>
            <p style={{ color: ACCENT, fontSize: '0.8rem' }}>{ex.benefit}</p>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            {timerActive ? (
              <div style={{ fontSize: '4rem', fontWeight: 800, color: countdown > 5 ? 'var(--text-secondary)' : ACCENT, fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(countdown)}
              </div>
            ) : (
              <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '1.1rem' }}>{ex.duration || 'As needed'}</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {!timerActive && ex.duration && (
              <button onClick={beginTimer} style={{ flex: 1, padding: '14px', background: ACCENT, border: 'none', borderRadius: '12px', color: '#0a0a0f', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>Start Timer</button>
            )}
            <button onClick={nextExercise} style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
              {currentExerciseIndex + 1 >= activeRoutine.exercises.length ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '0 0 80px 0' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ padding: '28px 0 20px' }}>
          <h1 style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '1.5rem', marginBottom: '4px' }}>Room Workout</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Exercise wherever you are — no equipment needed.</p>
        </div>

        {/* Filters */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Space Available</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {SPACE_ORDER.map(s => (
                <button
                  key={s}
                  onClick={() => setSpace(s)}
                  style={{
                    padding: '8px 14px', borderRadius: '20px',
                    background: space === s ? ACCENT : 'rgba(255,255,255,0.05)',
                    border: space === s ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    color: space === s ? '#0a0a0f' : 'var(--text-tertiary)',
                    fontWeight: space === s ? 700 : 400,
                    cursor: 'pointer', fontSize: '0.8rem',
                  }}
                >{SPACE_LABELS[s]}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Energy Level</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {([1, 2, 3, 4, 5] as EnergyLevel[]).map(n => (
                <button
                  key={n}
                  onClick={() => setEnergy(n)}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: energy >= n ? ACCENT : 'rgba(255,255,255,0.06)',
                    border: 'none', color: energy >= n ? '#0a0a0f' : 'var(--text-muted)',
                    fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                  }}
                >{n}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Time Available</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {allDurations.map(t => (
                <button
                  key={t}
                  onClick={() => setTime(t)}
                  style={{
                    padding: '8px 18px', borderRadius: '20px',
                    background: time === t ? ACCENT : 'rgba(255,255,255,0.05)',
                    border: time === t ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    color: time === t ? '#0a0a0f' : 'var(--text-tertiary)',
                    fontWeight: time === t ? 700 : 400,
                    cursor: 'pointer', fontSize: '0.85rem',
                  }}
                >{t} min</button>
              ))}
            </div>
          </div>
        </div>

        {showFallbackNote && (
          <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', color: '#fbbf24', fontSize: '0.8rem' }}>
            No exact match — showing the closest available routine for your energy and space.
          </div>
        )}

        <div>
          {displayedRoutines.map(routine => (
            <div key={routine.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>{routine.name}</h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(244,114,182,0.1)', color: ACCENT, borderRadius: '8px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600 }}>{routine.time} min</span>
                    <span style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-tertiary)', borderRadius: '8px', padding: '2px 8px', fontSize: '0.7rem' }}>{SPACE_LABELS[routine.space]}</span>
                    <span style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-tertiary)', borderRadius: '8px', padding: '2px 8px', fontSize: '0.7rem' }}>Energy {routine.minEnergy}+</span>
                  </div>
                </div>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic', marginBottom: '14px', lineHeight: '1.4' }}>{routine.scienceLink}</p>

              <div style={{ marginBottom: '16px' }}>
                {routine.exercises.map((ex, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: i < routine.exercises.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(244,114,182,0.15)', color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>{ex.name}</span>
                        {ex.duration && <span style={{ color: ACCENT, fontSize: '0.75rem', fontWeight: 600 }}>{ex.duration}</span>}
                      </div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem', marginTop: '2px' }}>{ex.description}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px', fontStyle: 'italic' }}>{ex.benefit}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => startWorkout(routine)}
                style={{ width: '100%', padding: '12px', background: ACCENT, border: 'none', borderRadius: '12px', color: '#0a0a0f', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
              >
                Start Workout
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
