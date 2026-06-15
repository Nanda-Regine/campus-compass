'use client'

import { useState, useEffect, useRef } from 'react'
import { dispatchXP } from '@/lib/xp-engine'

interface Exercise {
  id: string
  name: string
  category: 'strength' | 'cardio' | 'flexibility' | 'balance'
  space: 'mat' | 'small_room' | 'outdoor'
  equipment: 'none' | 'chair' | 'wall'
  energy: 1 | 2 | 3 | 4 | 5
  durationSecs: number
  reps?: string
  description: string
  benefit: string
  muscles: string[]
}

const EXERCISES: Exercise[] = [
  // ── Strength (8) ───────────────────────────────────────────────
  {
    id: 'pushup-standard',
    name: 'Push-Up (Standard)',
    category: 'strength',
    space: 'mat',
    equipment: 'none',
    energy: 3,
    durationSecs: 30,
    reps: '10–15 reps',
    description: 'Start in a high plank. Lower your chest to the floor keeping a straight line from head to heel, then push back up.',
    benefit: 'Builds chest, shoulder, and tricep strength with no equipment.',
    muscles: ['Chest', 'Triceps', 'Shoulders', 'Core'],
  },
  {
    id: 'pushup-knees',
    name: 'Push-Up (Knees)',
    category: 'strength',
    space: 'mat',
    equipment: 'none',
    energy: 2,
    durationSecs: 30,
    reps: '12–20 reps',
    description: 'Same as standard push-up but with knees on the floor. Great for building foundational pressing strength.',
    benefit: 'A gentler push-up variation — perfect for beginners.',
    muscles: ['Chest', 'Triceps', 'Shoulders'],
  },
  {
    id: 'pushup-wide',
    name: 'Push-Up (Wide)',
    category: 'strength',
    space: 'mat',
    equipment: 'none',
    energy: 3,
    durationSecs: 30,
    reps: '8–12 reps',
    description: 'Place hands wider than shoulder-width. This shifts emphasis to the outer chest.',
    benefit: 'Emphasises the outer chest for a wider upper body.',
    muscles: ['Outer Chest', 'Shoulders', 'Triceps'],
  },
  {
    id: 'pushup-diamond',
    name: 'Push-Up (Diamond)',
    category: 'strength',
    space: 'mat',
    equipment: 'none',
    energy: 4,
    durationSecs: 30,
    reps: '6–10 reps',
    description: 'Place hands together under your chest forming a diamond shape. Lower and press back up.',
    benefit: 'Intense tricep isolation — challenging for upper body strength.',
    muscles: ['Triceps', 'Inner Chest', 'Shoulders'],
  },
  {
    id: 'squat',
    name: 'Bodyweight Squat',
    category: 'strength',
    space: 'small_room',
    equipment: 'none',
    energy: 2,
    durationSecs: 40,
    reps: '15–20 reps',
    description: 'Stand feet shoulder-width apart, lower until thighs are parallel to the floor, drive through heels to stand.',
    benefit: 'The king of lower body exercises. Builds powerful legs and glutes.',
    muscles: ['Quads', 'Glutes', 'Hamstrings', 'Calves'],
  },
  {
    id: 'reverse-lunge',
    name: 'Reverse Lunge',
    category: 'strength',
    space: 'small_room',
    equipment: 'none',
    energy: 3,
    durationSecs: 40,
    reps: '10 per leg',
    description: 'Step one foot back, lower your back knee toward the floor, drive front foot into the ground to stand.',
    benefit: 'Easier on knees than forward lunges. Excellent for single-leg strength.',
    muscles: ['Quads', 'Glutes', 'Hamstrings', 'Balance'],
  },
  {
    id: 'plank',
    name: 'Plank Hold',
    category: 'strength',
    space: 'mat',
    equipment: 'none',
    energy: 2,
    durationSecs: 45,
    description: 'Hold a high or forearm plank position with a rigid straight line from head to heels. Breathe steadily.',
    benefit: 'Builds deep core stability which protects your spine during long study sessions.',
    muscles: ['Core', 'Shoulders', 'Glutes'],
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    category: 'strength',
    space: 'mat',
    equipment: 'none',
    energy: 1,
    durationSecs: 40,
    reps: '15–20 reps',
    description: 'Lie on your back, feet flat, knees bent. Drive hips to the ceiling squeezing glutes, lower slowly.',
    benefit: 'Counteracts the effects of prolonged sitting. Activates dormant glutes.',
    muscles: ['Glutes', 'Hamstrings', 'Lower Back'],
  },
  {
    id: 'wall-sit',
    name: 'Wall Sit',
    category: 'strength',
    space: 'small_room',
    equipment: 'wall',
    energy: 2,
    durationSecs: 45,
    description: 'Back flat against a wall, slide down until knees are at 90°. Hold the position. Breathe.',
    benefit: 'Isometric quad burn. Builds leg endurance without any equipment.',
    muscles: ['Quads', 'Glutes', 'Calves'],
  },
  {
    id: 'tricep-dip-chair',
    name: 'Tricep Dip (Chair)',
    category: 'strength',
    space: 'small_room',
    equipment: 'chair',
    energy: 3,
    durationSecs: 30,
    reps: '10–15 reps',
    description: 'Hands on a sturdy chair edge behind you, feet on floor, lower your body by bending elbows then press up.',
    benefit: 'Targets triceps using your study chair. No gym required.',
    muscles: ['Triceps', 'Shoulders', 'Chest'],
  },
  {
    id: 'superman-hold',
    name: 'Superman Hold',
    category: 'strength',
    space: 'mat',
    equipment: 'none',
    energy: 2,
    durationSecs: 40,
    reps: '12 reps, 3 sec hold',
    description: 'Lie face down, arms extended overhead. Simultaneously lift arms, chest, and legs off the floor. Hold. Lower.',
    benefit: 'Strengthens the entire posterior chain — critical for posture during long study hours.',
    muscles: ['Lower Back', 'Glutes', 'Hamstrings', 'Upper Back'],
  },

  // ── Cardio (8) ─────────────────────────────────────────────────
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    category: 'cardio',
    space: 'small_room',
    equipment: 'none',
    energy: 3,
    durationSecs: 45,
    description: 'Jump feet apart while raising arms overhead, then jump back together. Keep a steady rhythm.',
    benefit: 'Full-body cardio that elevates heart rate quickly. Great for energy boosts.',
    muscles: ['Full Body', 'Calves', 'Shoulders'],
  },
  {
    id: 'high-knees',
    name: 'High Knees',
    category: 'cardio',
    space: 'small_room',
    equipment: 'none',
    energy: 4,
    durationSecs: 30,
    description: 'Run in place, driving your knees as high as possible with each step. Pump your arms.',
    benefit: 'Intense cardio burst that also engages core. Wakes you up fast.',
    muscles: ['Hip Flexors', 'Core', 'Quads', 'Calves'],
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    category: 'cardio',
    space: 'mat',
    equipment: 'none',
    energy: 4,
    durationSecs: 30,
    description: 'High plank position. Drive one knee toward your chest then quickly switch. Keep hips level.',
    benefit: 'Combines cardio, core, and upper body strength in one dynamic move.',
    muscles: ['Core', 'Shoulders', 'Hip Flexors', 'Quads'],
  },
  {
    id: 'burpee',
    name: 'Burpee',
    category: 'cardio',
    space: 'small_room',
    equipment: 'none',
    energy: 5,
    durationSecs: 30,
    reps: '5–8 reps',
    description: 'Squat, place hands on floor, jump feet back to plank, do a push-up, jump feet in, jump and clap overhead.',
    benefit: 'The ultimate full-body conditioning exercise. Burns maximum calories in minimum time.',
    muscles: ['Full Body', 'Chest', 'Quads', 'Core', 'Shoulders'],
  },
  {
    id: 'star-jump',
    name: 'Star Jump',
    category: 'cardio',
    space: 'small_room',
    equipment: 'none',
    energy: 3,
    durationSecs: 30,
    reps: '15–20 reps',
    description: 'Jump explosively, spreading arms and legs wide like a star, then land softly with feet together.',
    benefit: 'Powerful plyometric move. Improves explosive power and elevates heart rate fast.',
    muscles: ['Glutes', 'Calves', 'Shoulders', 'Core'],
  },
  {
    id: 'shadow-box',
    name: 'Shadow Boxing',
    category: 'cardio',
    space: 'small_room',
    equipment: 'none',
    energy: 3,
    durationSecs: 60,
    description: 'Bounce lightly on your feet and throw jabs, crosses, hooks, and uppercuts in the air. Stay relaxed.',
    benefit: 'Stress-releasing cardio that is surprisingly fun. Great mood boost between study sessions.',
    muscles: ['Shoulders', 'Core', 'Calves', 'Arms'],
  },
  {
    id: 'step-touch',
    name: 'Step Touch',
    category: 'cardio',
    space: 'small_room',
    equipment: 'none',
    energy: 1,
    durationSecs: 60,
    description: 'Step to the right, bring left foot to meet it, then step to the left. Add arm swings for intensity.',
    benefit: 'Low-impact cardio — perfect for very small spaces. Gentle on joints.',
    muscles: ['Calves', 'Glutes', 'Hips'],
  },
  {
    id: 'lateral-shuffle',
    name: 'Lateral Shuffle',
    category: 'cardio',
    space: 'small_room',
    equipment: 'none',
    energy: 3,
    durationSecs: 30,
    description: 'Stay low in an athletic stance. Shuffle quickly side to side, staying light on your feet.',
    benefit: 'Builds lateral agility and activates inner/outer thighs. Great for waking up the lower body.',
    muscles: ['Quads', 'Glutes', 'Inner Thighs', 'Calves'],
  },

  // ── Flexibility (8) ────────────────────────────────────────────
  {
    id: 'hip-flexor-stretch',
    name: 'Hip Flexor Stretch',
    category: 'flexibility',
    space: 'mat',
    equipment: 'none',
    energy: 1,
    durationSecs: 60,
    description: 'Kneel on one knee, front foot forward. Shift weight forward until you feel the front of the back hip stretching. Hold each side.',
    benefit: 'Undoes the hip tightness caused by hours of sitting. Relieves lower back pain.',
    muscles: ['Hip Flexors', 'Quads', 'Lower Back'],
  },
  {
    id: 'hamstring-stretch',
    name: 'Hamstring Stretch',
    category: 'flexibility',
    space: 'mat',
    equipment: 'none',
    energy: 1,
    durationSecs: 60,
    description: 'Sit on the floor, legs extended. Hinge forward from the hips reaching toward your feet. Hold without bouncing.',
    benefit: 'Relieves tension in the back of the legs common after sitting for long periods.',
    muscles: ['Hamstrings', 'Lower Back', 'Calves'],
  },
  {
    id: 'spinal-twist',
    name: 'Seated Spinal Twist',
    category: 'flexibility',
    space: 'mat',
    equipment: 'none',
    energy: 1,
    durationSecs: 60,
    description: 'Sit cross-legged, place one hand behind you, twist your torso in that direction. Look over your shoulder. Hold both sides.',
    benefit: 'Releases tension in the thoracic spine — essential after hours at a desk.',
    muscles: ['Spine', 'Obliques', 'Neck'],
  },
  {
    id: 'chest-opener',
    name: 'Chest Opener',
    category: 'flexibility',
    space: 'small_room',
    equipment: 'none',
    energy: 1,
    durationSecs: 45,
    description: 'Clasp hands behind your back, straighten arms, squeeze shoulder blades, lift chest and hold. Breathe deeply.',
    benefit: 'Counteracts forward-head posture from phone and laptop use. Opens the lungs.',
    muscles: ['Chest', 'Shoulders', 'Upper Back'],
  },
  {
    id: 'neck-rolls',
    name: 'Neck Rolls',
    category: 'flexibility',
    space: 'small_room',
    equipment: 'none',
    energy: 1,
    durationSecs: 45,
    description: 'Gently drop your chin to your chest, slowly roll your head to one side, back, other side. 3 full circles each direction.',
    benefit: 'Releases neck and upper trap tension accumulated during study. Do every 90 minutes.',
    muscles: ['Neck', 'Upper Trapezius'],
  },
  {
    id: 'shoulder-rolls',
    name: 'Shoulder Rolls',
    category: 'flexibility',
    space: 'small_room',
    equipment: 'none',
    energy: 1,
    durationSecs: 30,
    description: 'Roll both shoulders forward in large circles 10 times, then backward 10 times. Allow your shoulder blades to move fully.',
    benefit: 'Reduces shoulder and upper back tension from typing and writing.',
    muscles: ['Shoulders', 'Upper Back', 'Traps'],
  },
  {
    id: 'figure-four-hip',
    name: 'Figure-Four Hip Stretch',
    category: 'flexibility',
    space: 'mat',
    equipment: 'none',
    energy: 1,
    durationSecs: 60,
    description: 'Lie on your back, cross one ankle over the opposite knee. Thread hands through to hold the back thigh. Pull gently. Switch sides.',
    benefit: 'Deep piriformis and glute stretch. Relieves sciatic nerve tension from prolonged sitting.',
    muscles: ['Glutes', 'Piriformis', 'Hip External Rotators'],
  },
  {
    id: 'pigeon-pose-modified',
    name: 'Modified Pigeon Pose',
    category: 'flexibility',
    space: 'mat',
    equipment: 'none',
    energy: 1,
    durationSecs: 90,
    description: 'From all fours, bring one knee toward your wrist and extend the opposite leg behind you. Lower your upper body. Switch sides.',
    benefit: 'The deepest hip-opener available without props. Releases stored tension and stress.',
    muscles: ['Hip Flexors', 'Glutes', 'Piriformis', 'Groin'],
  },

  // ── Balance (6) ────────────────────────────────────────────────
  {
    id: 'single-leg-stand',
    name: 'Single-Leg Stand',
    category: 'balance',
    space: 'small_room',
    equipment: 'none',
    energy: 1,
    durationSecs: 60,
    description: 'Stand on one foot, soft knee. Hold for 30 seconds each side. Progress by closing your eyes.',
    benefit: 'Improves proprioception and ankle stability. Can be done while reading.',
    muscles: ['Calves', 'Ankles', 'Core'],
  },
  {
    id: 'heel-to-toe-walk',
    name: 'Heel-to-Toe Walk',
    category: 'balance',
    space: 'small_room',
    equipment: 'none',
    energy: 1,
    durationSecs: 45,
    description: 'Walk in a straight line placing the heel of one foot directly in front of the toes of the other foot with each step.',
    benefit: 'The classic sobriety test is also a serious balance and concentration exercise.',
    muscles: ['Core', 'Calves', 'Ankles', 'Glutes'],
  },
  {
    id: 'tree-pose',
    name: 'Tree Pose',
    category: 'balance',
    space: 'small_room',
    equipment: 'none',
    energy: 1,
    durationSecs: 60,
    description: 'Stand on one foot. Place the other foot against your inner calf or thigh. Press hands together at chest or raise overhead.',
    benefit: 'Calms the mind while building balance and single-leg strength. Great for pre-exam nerves.',
    muscles: ['Core', 'Glutes', 'Calves', 'Ankles'],
  },
  {
    id: 'standing-hip-abduction',
    name: 'Standing Hip Abduction',
    category: 'balance',
    space: 'small_room',
    equipment: 'none',
    energy: 2,
    durationSecs: 40,
    reps: '15 each side',
    description: 'Stand on one leg, slowly lift the opposite leg out to the side keeping hips level. Lower with control.',
    benefit: 'Strengthens the gluteus medius — essential for knee and hip health.',
    muscles: ['Glutes', 'Hip Abductors', 'Core'],
  },
  {
    id: 'single-leg-deadlift',
    name: 'Single-Leg Deadlift',
    category: 'balance',
    space: 'small_room',
    equipment: 'none',
    energy: 3,
    durationSecs: 40,
    reps: '8–10 each side',
    description: 'Stand on one leg. Hinge at the hips reaching both hands toward the floor while the free leg extends behind. Return upright.',
    benefit: 'Combines balance, hip hinge, and hamstring strengthening in one challenging move.',
    muscles: ['Hamstrings', 'Glutes', 'Core', 'Spinal Erectors'],
  },
  {
    id: 'balance-reach',
    name: 'Balance Reach',
    category: 'balance',
    space: 'small_room',
    equipment: 'none',
    energy: 2,
    durationSecs: 45,
    reps: '10 reaches each side',
    description: 'Stand on one leg, reach forward with opposite arm, then to the side, then behind. Keep standing knee soft.',
    benefit: 'Multi-directional balance training that mirrors real-life movement demands.',
    muscles: ['Core', 'Glutes', 'Ankles', 'Shoulders'],
  },
]

const CATEGORY_EMOJI: Record<Exercise['category'], string> = {
  strength: '💪',
  cardio: '🏃',
  flexibility: '🧘',
  balance: '🦩',
}

const SPACE_LABELS: Record<Exercise['space'], string> = {
  mat: 'Mat',
  small_room: 'Small room',
  outdoor: 'Outdoor',
}

const EQUIP_LABELS: Record<Exercise['equipment'], string> = {
  none: 'No equipment',
  chair: 'Chair',
  wall: 'Wall',
}

type CategoryFilter = 'all' | Exercise['category']
type SpaceFilter = 'all' | Exercise['space']
type EnergyFilter = 0 | 1 | 2 | 3 | 4 | 5

export default function MovementLibrary() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [spaceFilter, setSpaceFilter] = useState<SpaceFilter>('all')
  const [energyFilter, setEnergyFilter] = useState<EnergyFilter>(0)
  const [circuit, setCircuit] = useState<Exercise[]>([])
  const [timerActive, setTimerActive] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [workoutComplete, setWorkoutComplete] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const filtered = EXERCISES.filter(ex => {
    if (categoryFilter !== 'all' && ex.category !== categoryFilter) return false
    if (spaceFilter !== 'all' && ex.space !== spaceFilter) return false
    if (energyFilter !== 0 && ex.energy !== energyFilter) return false
    return true
  })

  const inCircuit = (id: string) => circuit.some(e => e.id === id)

  const toggleCircuit = (ex: Exercise) => {
    setCircuit(prev =>
      prev.some(e => e.id === ex.id) ? prev.filter(e => e.id !== ex.id) : [...prev, ex]
    )
  }

  const totalCircuitSecs = circuit.reduce((sum, e) => sum + e.durationSecs + 10, 0)
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const startWorkout = () => {
    if (circuit.length === 0) return
    setCurrentIdx(0)
    setCountdown(circuit[0].durationSecs)
    setTimerActive(true)
    setWorkoutComplete(false)
  }

  useEffect(() => {
    if (!timerActive) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCurrentIdx(ci => {
            const next = ci + 1
            if (next >= circuit.length) {
              setTimerActive(false)
              setWorkoutComplete(true)
              dispatchXP('wellness_checkin', 'Workout completed')
              return ci
            }
            setCountdown(circuit[next].durationSecs)
            return next
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timerActive, circuit])

  const skipToNext = () => {
    const next = currentIdx + 1
    if (next >= circuit.length) {
      setTimerActive(false)
      setWorkoutComplete(true)
      dispatchXP('wellness_checkin', 'Workout completed')
    } else {
      setCurrentIdx(next)
      setCountdown(circuit[next].durationSecs)
    }
  }

  const stopWorkout = () => {
    setTimerActive(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const totalCircuitMins = Math.round(totalCircuitSecs / 60)

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh' }} className="pb-40">
      {/* Timer Overlay */}
      {timerActive && !workoutComplete && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(10,10,15,0.97)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
            Exercise {currentIdx + 1} of {circuit.length}
          </div>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>
            {CATEGORY_EMOJI[circuit[currentIdx].category]}
          </div>
          <div style={{ color: '#e5e7eb', fontSize: '28px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>
            {circuit[currentIdx].name}
          </div>
          <div style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', maxWidth: '320px', marginBottom: '24px' }}>
            {circuit[currentIdx].description}
          </div>
          {circuit[currentIdx].reps && (
            <div style={{ color: '#4ade80', fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
              {circuit[currentIdx].reps}
            </div>
          )}
          <div style={{
            fontSize: '72px', fontWeight: 800, color: '#4ade80',
            fontVariantNumeric: 'tabular-nums', marginBottom: '32px',
          }}>
            {formatTime(countdown)}
          </div>
          <div className="flex gap-3">
            <button
              onClick={skipToNext}
              style={{
                background: 'rgba(74,222,128,0.15)',
                border: '1px solid rgba(74,222,128,0.3)',
                borderRadius: '12px',
                color: '#4ade80',
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Next →
            </button>
            <button
              onClick={stopWorkout}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#9ca3af',
                padding: '12px 24px',
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Workout Complete Overlay */}
      {workoutComplete && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(10,10,15,0.97)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <div style={{ color: '#4ade80', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
            Workout Complete!
          </div>
          <div style={{ color: '#9ca3af', fontSize: '15px', marginBottom: '8px' }}>
            {circuit.length} exercises · {totalCircuitMins} minutes
          </div>
          <div style={{
            background: 'rgba(74,222,128,0.1)',
            border: '1px solid rgba(74,222,128,0.2)',
            borderRadius: '12px',
            padding: '12px 20px',
            color: '#4ade80',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '24px',
          }}>
            +20 XP earned
          </div>
          <button
            onClick={() => { setWorkoutComplete(false); setCircuit([]) }}
            style={{
              background: '#4ade80',
              border: 'none',
              borderRadius: '12px',
              color: '#0a0a0f',
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Back to Library
          </button>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Header */}
        <div>
          <h1 style={{ color: '#e5e7eb', fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
            Movement Library
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '13px' }}>
            30 exercises · no gym · no excuses
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'strength', 'cardio', 'flexibility', 'balance'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                background: categoryFilter === cat ? '#4ade80' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${categoryFilter === cat ? '#4ade80' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '20px',
                color: categoryFilter === cat ? '#0a0a0f' : '#9ca3af',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: categoryFilter === cat ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {cat === 'all' ? 'All' : `${CATEGORY_EMOJI[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
            </button>
          ))}
        </div>

        {/* Space + Energy Row */}
        <div className="flex gap-2 flex-wrap items-center">
          <span style={{ color: '#9ca3af', fontSize: '12px' }}>Space:</span>
          {(['all', 'mat', 'small_room', 'outdoor'] as const).map(sp => (
            <button
              key={sp}
              onClick={() => setSpaceFilter(sp)}
              style={{
                background: spaceFilter === sp ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${spaceFilter === sp ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px',
                color: spaceFilter === sp ? '#4ade80' : '#9ca3af',
                padding: '4px 10px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {sp === 'all' ? 'Any' : SPACE_LABELS[sp]}
            </button>
          ))}

          <span style={{ color: '#9ca3af', fontSize: '12px', marginLeft: '8px' }}>Energy:</span>
          {([0, 1, 2, 3, 4, 5] as EnergyFilter[]).map(e => (
            <button
              key={e}
              onClick={() => setEnergyFilter(e)}
              style={{
                background: energyFilter === e ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${energyFilter === e ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px',
                color: energyFilter === e ? '#4ade80' : '#9ca3af',
                padding: '4px 10px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {e === 0 ? 'Any' : '★'.repeat(e)}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p style={{ color: '#9ca3af', fontSize: '12px' }}>
          {filtered.length} exercise{filtered.length !== 1 ? 's' : ''} found
        </p>

        {/* Exercise Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(ex => (
            <div
              key={ex.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: inCircuit(ex.id) ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '14px',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>
                {CATEGORY_EMOJI[ex.category]}
              </div>
              <div style={{ color: '#e5e7eb', fontSize: '13px', fontWeight: 600, marginBottom: '4px', lineHeight: 1.3 }}>
                {ex.name}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px' }}>
                {ex.reps ? ex.reps : formatTime(ex.durationSecs)} · {EQUIP_LABELS[ex.equipment]}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '10px', marginBottom: '6px' }}>
                {ex.muscles.join(' · ')}
              </div>
              <div style={{ color: '#6b7280', fontSize: '10px', fontStyle: 'italic', marginBottom: '10px', lineHeight: 1.4 }}>
                {ex.benefit}
              </div>
              <button
                onClick={() => toggleCircuit(ex)}
                style={{
                  width: '100%',
                  background: inCircuit(ex.id) ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${inCircuit(ex.id) ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '8px',
                  color: inCircuit(ex.id) ? '#4ade80' : '#9ca3af',
                  padding: '7px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {inCircuit(ex.id) ? '✓ In Circuit' : '+ Add to Circuit'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Circuit Panel */}
      {circuit.length > 0 && !timerActive && !workoutComplete && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(10,10,15,0.96)',
            borderTop: '1px solid rgba(74,222,128,0.2)',
            padding: '16px',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span style={{ color: '#4ade80', fontWeight: 700, fontSize: '15px' }}>
                {circuit.length} exercise{circuit.length !== 1 ? 's' : ''}
              </span>
              <span style={{ color: '#9ca3af', fontSize: '13px', marginLeft: '8px' }}>
                ~{totalCircuitMins} min
              </span>
            </div>
            <button
              onClick={() => setCircuit([])}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
          <button
            onClick={startWorkout}
            style={{
              width: '100%',
              background: '#4ade80',
              border: 'none',
              borderRadius: '12px',
              color: '#0a0a0f',
              padding: '14px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Start Workout
          </button>
        </div>
      )}
    </div>
  )
}
