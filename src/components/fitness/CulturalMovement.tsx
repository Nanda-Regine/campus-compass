'use client'

import { useState, useEffect } from 'react'

interface CulturalSection {
  id: string
  emoji: string
  title: string
  subtitle: string
  caloriesBurn: string
  caloriesEquiv: string
  content: {
    context?: string
    moves: { name: string; description: string }[]
    practice: string
    music?: string
  }
}

const SECTIONS: CulturalSection[] = [
  {
    id: 'ukusina',
    emoji: '🕺',
    title: 'Ukusina',
    subtitle: 'Zulu Dance',
    caloriesBurn: '~350 cal/hour',
    caloriesEquiv: 'Equivalent to jogging at 5 km/h',
    content: {
      context:
        'Ukusina carries ceremonial and social roots stretching back centuries. It is performed at weddings, graduations, and community gatherings — not as performance, but as participation. You do not watch ukusina. You join it. Connection to community and to ancestors moves through the body when you dance.',
      moves: [
        {
          name: 'The Basic Sway',
          description:
            'Shift your weight left to right with knees gently bent. Let your hips lead the movement naturally. Do not force it — feel the rhythm pull you. 16 counts.',
        },
        {
          name: 'The Stamp',
          description:
            'Stamp one foot firmly while the other steps lightly. The ground receives the stamp. There is intention in it — presence, not aggression.',
        },
        {
          name: 'Arm Carry',
          description:
            'Lift arms to shoulder height, allow a gentle undulation to move through them — like water. Palms face down. The arms never lock.',
        },
      ],
      practice:
        '5 min warm-up sway → 10 min building to stamps and combinations → 5 min cool-down gentle sway.',
      music: 'Maskandi or traditional Zulu ceremonial music.',
    },
  },
  {
    id: 'gumboot',
    emoji: '👢',
    title: 'Gumboot Dance',
    subtitle: 'Ingoma Yezinsizwa',
    caloriesBurn: '~400 cal/hour',
    caloriesEquiv: 'High-intensity — comparable to aerobics',
    content: {
      context:
        'In the gold mines of South Africa, workers were forbidden from talking or drumming. So they created a language with their bodies and their boots. Slaps, stamps, claps — a whole communication system that the bosses could not understand. That dance is now performed globally and was featured at the Olympics. Every stamp carries that history.',
      moves: [
        {
          name: 'Basic 6-Count',
          description:
            'Right boot slap (hand to thigh) → Left boot slap → Clap hands → Right boot slap back (hand behind knee) → Left boot slap back → Chest slap. Repeat. Start slow — the pattern IS the meditation.',
        },
        {
          name: 'The Double Stamp',
          description:
            'Once you know the basic, add a double stamp on count 1 and 4. The extra stamp is the accent. Feel the rhythm shift.',
        },
      ],
      practice:
        'Start at half speed until the pattern is in your muscles. Then build speed over 15 minutes. A 15-minute gumboot session is a solid cardio workout — your heart rate will confirm it.',
    },
  },
  {
    id: 'kwaito',
    emoji: '🎵',
    title: 'Kwaito Cardio',
    subtitle: 'Born in Soweto, 1990s',
    caloriesBurn: '~280 cal/20 min',
    caloriesEquiv: 'Solid moderate-intensity cardio',
    content: {
      context:
        'Kwaito was born in the townships of Johannesburg after apartheid. It was slow, heavy, and defiant — movement as freedom. The bass drops, you bounce, you pump. There is political history in every bounce.',
      moves: [
        {
          name: 'The Bounce',
          description:
            'Both feet on the ground, knees soft. Bounce on the beat — not jumping, just a rhythmic give in the knees. Arms loose at your sides. Let your whole body receive the rhythm.',
        },
        {
          name: 'The Pump',
          description:
            'While bouncing, add rhythmic arm pumps forward — both arms, alternating. Time them with the beat. The pump is the signature.',
        },
        {
          name: 'The Kick-Step',
          description:
            'Step-touch to the right with a low relaxed kick. Repeat to the left. Add the pump arms and you have a full kwaito combination.',
        },
      ],
      practice:
        '5 min bounce warm-up → 10 min progressive combinations (add each move every 2 minutes) → 5 min cool-down bounce.',
    },
  },
  {
    id: 'pantsula',
    emoji: '💃',
    title: 'Pantsula',
    subtitle: 'Township Street Dance',
    caloriesBurn: '~320 cal/hour',
    caloriesEquiv: 'High coordination + cardio demand',
    content: {
      context:
        'Pantsula is footwork-focused, fast, and deeply expressive. It emerged from the townships as a competitive dance form — each dancer trying to outdo the other in creativity and speed. The skill ceiling is high but the entry point is accessible.',
      moves: [
        {
          name: 'Toe-Heel-Toe',
          description:
            'The basic footwork pattern: tap toe, place heel, tap toe. Right foot, then left foot. Alternate. Start slow, allow the muscle memory to form.',
        },
        {
          name: 'Quick-Step Combination',
          description:
            'Quick step right, quick step left, heel-drop right, heel-drop left. The quickness comes from relaxation — if you tense up, the feet slow down.',
        },
      ],
      practice:
        '10 minutes of basic footwork is surprisingly effective cardio. The coordination challenge keeps your brain engaged at the same time — you cannot zone out. Build combinations week by week.',
    },
  },
  {
    id: 'ubuntu-warmup',
    emoji: '🌅',
    title: 'Ubuntu Warm-Up',
    subtitle: 'Communal Movement Pattern',
    caloriesBurn: 'Gentle — 80–120 cal',
    caloriesEquiv: 'Parasympathetic activation · body awareness',
    content: {
      moves: [
        {
          name: 'Full-Body Circles',
          description:
            'Starting at the ground: ankles (circles, both directions, 1 min) → knees (gentle circles, not grinding, 1 min) → hips (full open circles, 1 min) → waist (torso rotation, 1 min) → shoulders (roll forward and back, 1 min) → neck (very gentle, chin drops, never full circles back, 1 min).',
        },
        {
          name: 'Breath with Movement',
          description:
            'Inhale reaching both arms overhead, lengthening through your spine. Exhale folding forward, bending knees if needed. 8 full rounds. Let the exhale be a release.',
        },
        {
          name: 'Gratitude Movement',
          description:
            'For each part of the body you just moved, one moment. A pause. A breath. Not religious — just a moment of noticing that this body carries you through everything.',
        },
      ],
      practice:
        'Use this to open any workout. Use it when you wake up. Use it before an exam. 8 minutes of ubuntu warm-up changes the quality of everything that follows.',
    },
  },
]

function getDayKey(day: number) {
  return `cultural_challenge_day_${day}_${new Date().toISOString().split('T')[0].slice(0, 7)}`
}

export default function CulturalMovement() {
  const [expanded, setExpanded] = useState<string | null>('ukusina')
  const [challengeDays, setChallengeDays] = useState<boolean[]>(Array(7).fill(false))

  useEffect(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      try {
        return localStorage.getItem(getDayKey(i + 1)) === 'done'
      } catch {
        return false
      }
    })
    setChallengeDays(days)
  }, [])

  const markDay = (idx: number) => {
    try {
      const key = getDayKey(idx + 1)
      const alreadyDone = localStorage.getItem(key) === 'done'
      if (alreadyDone) {
        localStorage.removeItem(key)
        setChallengeDays(prev => prev.map((d, i) => (i === idx ? false : d)))
      } else {
        localStorage.setItem(key, 'done')
        setChallengeDays(prev => prev.map((d, i) => (i === idx ? true : d)))
      }
    } catch {
      /* silent */
    }
  }

  const daysCompleted = challengeDays.filter(Boolean).length

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }} className="pb-8">
      <div className="p-4 space-y-4">
        {/* Philosophy Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(74,222,128,0.12) 0%, rgba(251,191,36,0.1) 100%)',
            border: '1px solid rgba(74,222,128,0.2)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '16px',
              lineHeight: 1.65,
              fontStyle: 'italic',
              fontWeight: 500,
            }}
          >
            "Movement is not a chore — it is celebration. African cultures have always known this.
            Ukusina is not exercise. It is joy in motion, connection to community,
            remembering who you are."
          </p>
          <p style={{ color: '#4ade80', fontSize: '13px', marginTop: '12px', fontWeight: 600 }}>
            Cultural Movement OS
          </p>
        </div>

        {/* Sections */}
        {SECTIONS.map(section => (
          <div
            key={section.id}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            {/* Section Header */}
            <button
              onClick={() => setExpanded(prev => (prev === section.id ? null : section.id))}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '28px' }}>{section.emoji}</span>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '16px' }}>
                    {section.title}
                  </div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>{section.subtitle}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#4ade80', fontSize: '12px', fontWeight: 600 }}>
                    {section.caloriesBurn}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{section.caloriesEquiv}</div>
                </div>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '16px' }}>
                  {expanded === section.id ? '▲' : '▼'}
                </span>
              </div>
            </button>

            {/* Expanded Content */}
            {expanded === section.id && (
              <div style={{ padding: '0 16px 16px' }}>
                {section.content.context && (
                  <p
                    style={{
                      color: 'var(--text-tertiary)',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      marginBottom: '16px',
                      borderLeft: '2px solid rgba(74,222,128,0.3)',
                      paddingLeft: '12px',
                    }}
                  >
                    {section.content.context}
                  </p>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ color: '#4ade80', fontSize: '12px', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Moves
                  </p>
                  <div className="space-y-3">
                    {section.content.moves.map((move, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '10px',
                          padding: '12px',
                        }}
                      >
                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                          {move.name}
                        </div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', lineHeight: 1.55 }}>
                          {move.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(74,222,128,0.06)',
                    border: '1px solid rgba(74,222,128,0.15)',
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: section.content.music ? '10px' : '0',
                  }}
                >
                  <p style={{ color: '#4ade80', fontSize: '11px', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Practice Routine
                  </p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', lineHeight: 1.55 }}>
                    {section.content.practice}
                  </p>
                </div>

                {section.content.music && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>🎵</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                      Suggested: <em>{section.content.music}</em>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* 7-Day Challenge */}
        <div
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 style={{ color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 700 }}>
                7-Day Cultural Movement Challenge
              </h2>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginTop: '2px' }}>
                10 minutes of any cultural movement form · every day this week
              </p>
            </div>
            <div
              style={{
                background: 'rgba(74,222,128,0.1)',
                border: '1px solid rgba(74,222,128,0.2)',
                borderRadius: '10px',
                padding: '6px 12px',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#4ade80', fontSize: '18px', fontWeight: 700 }}>{daysCompleted}</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>/ 7</div>
            </div>
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            {Array.from({ length: 7 }, (_, i) => (
              <button
                key={i}
                onClick={() => markDay(i)}
                style={{
                  flex: 1,
                  minWidth: '36px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '10px 4px',
                  background: challengeDays[i] ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${challengeDays[i] ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '18px' }}>
                  {challengeDays[i] ? '✅' : '○'}
                </span>
                <span style={{ color: challengeDays[i] ? '#4ade80' : 'var(--text-muted)', fontSize: '10px', marginTop: '4px', fontWeight: 600 }}>
                  D{i + 1}
                </span>
              </button>
            ))}
          </div>

          {daysCompleted === 7 && (
            <div
              style={{
                marginTop: '16px',
                background: 'rgba(74,222,128,0.1)',
                border: '1px solid rgba(74,222,128,0.25)',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#4ade80', fontSize: '14px', fontWeight: 700 }}>
                🎉 Challenge complete! You moved for 7 days straight.
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginTop: '4px' }}>
                That is not a habit. That is a practice.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
