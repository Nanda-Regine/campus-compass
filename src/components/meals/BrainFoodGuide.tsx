'use client'

import { useState } from 'react'

const ACCENT = '#fb923c'

interface Section {
  id: string
  emoji: string
  title: string
  content: React.ReactNode
}

function SectionContent({ id }: { id: string }) {
  switch (id) {
    case 'exam':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              What to eat 2-3 hours before
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { food: 'Oats with peanut butter', why: 'Slow-release glucose + protein = sustained concentration' },
                { food: 'Scrambled eggs on brown bread', why: 'Choline + complex carbs — strong foundation for memory' },
                { food: 'Samp and beans (if time allows)', why: 'Slow-release + complete protein — best pre-exam option' },
              ].map(item => (
                <div
                  key={item.food}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ color: '#86efac', flexShrink: 0, marginTop: 1 }}>✓</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 2 }}>
                      {item.food}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.73rem', color: 'var(--text-tertiary)' }}>{item.why}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10,
              padding: '10px 14px',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Avoid before exams
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                'Sugary cereal — crash after 45 min, mid-exam energy slump',
                'Heavy fried food — blood goes to gut, not brain',
                'Eating nothing — glucose depletion means you cannot form new memories',
              ].map(item => (
                <div key={item} style={{ fontFamily: 'var(--font-body)', fontSize: '0.73rem', color: 'rgba(255,255,255,0.55)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: '#f87171', flexShrink: 0 }}>✕</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.55)' }}>
            R8-15 pre-exam meal is achievable at any campus tuck shop or res kitchen.
          </div>
        </div>
      )

    case 'boosters':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { food: 'Eggs', price: 'R2.50-3 each', benefit: 'Choline supports memory formation. 2 eggs/day is ideal.' },
            { food: 'Peanuts / Peanut butter', price: 'R25/jar (lasts weeks)', benefit: 'Vitamin E + healthy fats. Neuroprotective.' },
            { food: 'Oats', price: 'R30/kg', benefit: 'Slow-release glucose. Prevents concentration crashes.' },
            { food: 'Spinach / Morogo', price: 'R12-15/bunch', benefit: 'Iron + folate. Iron deficiency causes brain fog in 40% of SA women students.' },
            { food: 'Berries (any, buy frozen)', price: 'R30-40/punnet', benefit: 'Anthocyanins improve memory. Frozen is cheaper.' },
            { food: 'Dark chocolate 70%+', price: 'R20-25', benefit: 'Flavonoids + mild caffeine. 20g daily is enough.' },
            { food: 'Rooibos tea', price: 'R25-30/box', benefit: 'SA superfood. Aspalathin + antioxidants. Caffeine-free.' },
            { food: 'Legumes (lentils, beans)', price: 'R15-25/500g', benefit: 'Folate + iron + protein. Essential for brain function.' },
          ].map(item => (
            <div
              key={item.food}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                {item.food}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.58rem',
                  color: ACCENT,
                  marginBottom: 5,
                }}
              >
                {item.price}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.68rem', color: 'var(--text-tertiary)', lineHeight: 1.45 }}>
                {item.benefit}
              </div>
            </div>
          ))}
        </div>
      )

    case 'water':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              background: 'rgba(56,189,248,0.07)',
              border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: 10,
              padding: '12px 14px',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', color: '#38bdf8', marginBottom: 4 }}>
              5% dehydration = 30% drop in concentration
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.73rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>
              Working memory, focus, and recall all tank before you feel thirsty. By the time you notice, you are already impaired.
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.58)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Signs of study dehydration
            </div>
            {['Headache mid-study session', 'Difficulty focusing on a single paragraph', 'Irritability for no reason'].map(s => (
              <div key={s} style={{ fontFamily: 'var(--font-body)', fontSize: '0.73rem', color: 'var(--text-tertiary)', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
                <span style={{ color: '#38bdf8', flexShrink: 0 }}>·</span>
                {s}
              </div>
            ))}
          </div>

          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', fontStyle: 'italic' }}>
            "Drink water before reaching for coffee. Most study headaches are dehydration."
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>💧</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                8 glasses (2 litres) per day
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#38bdf8', marginTop: 2 }}>
                Water is FREE on campus. Keep a bottle visible on your desk — you drink more when you see it.
              </div>
            </div>
          </div>
        </div>
      )

    case 'avoid':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            {
              item: 'Energy drinks (Red Bull, Monster)',
              why: 'Cortisol spike, then crash. Disrupts sleep architecture. Can become addictive.',
              severity: 'high',
            },
            {
              item: 'Too much coffee (>3 cups)',
              why: 'Anxiety, jitteriness, disrupted deep sleep. Cap at 2 cups. Switch to rooibos after 2pm.',
              severity: 'medium',
            },
            {
              item: 'Skipping meals',
              why: 'Glucose depletes after 4 hours without eating. You literally cannot form new memories without glucose.',
              severity: 'high',
            },
            {
              item: 'Eating while studying with screens',
              why: '"Distracted eating" leads to 25% worse satiety signals — you eat more and feel worse.',
              severity: 'low',
            },
          ].map(item => {
            const colors: Record<string, string> = { high: '#f87171', medium: '#fbbf24', low: '#9ca3af' }
            return (
              <div
                key={item.item}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${colors[item.severity]}25`,
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ color: colors[item.severity], fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>⚠</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 3 }}>
                    {item.item}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.73rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                    {item.why}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )

    case 'plate':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.73rem', color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
            A simple formula for sustained focus throughout a study day.
          </div>

          {[
            { pct: '40%', label: 'Complex carbohydrates', examples: 'Rice, pap, oats, bread, samp', color: '#f59e0b' },
            { pct: '30%', label: 'Protein', examples: 'Eggs, beans, pilchards, peanut butter, lentils', color: '#fb923c' },
            { pct: '30%', label: 'Vegetables', examples: 'Spinach, morogo, tomato, onion — any you have', color: '#4ade80' },
          ].map(row => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: '10px 14px',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: `${row.color}18`,
                  border: `2px solid ${row.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  color: row.color,
                }}
              >
                {row.pct}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 2 }}>
                  {row.label}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>{row.examples}</div>
              </div>
            </div>
          ))}

          <div
            style={{
              background: 'rgba(56,189,248,0.07)',
              border: '1px solid rgba(56,189,248,0.18)',
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>💧</span>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.78rem', color: '#38bdf8' }}>
              Water with every meal — not optional.
            </div>
          </div>
        </div>
      )

    default:
      return null
  }
}

export default function BrainFoodGuide() {
  const [openSection, setOpenSection] = useState<string | null>('exam')

  const SECTIONS: { id: string; emoji: string; title: string }[] = [
    { id: 'exam', emoji: '🧠', title: 'Before an Exam' },
    { id: 'boosters', emoji: '⚡', title: 'Brain Boosters' },
    { id: 'water', emoji: '💧', title: 'Dehydration Warning' },
    { id: 'avoid', emoji: '⚠️', title: 'What to Avoid' },
    { id: 'plate', emoji: '🍽️', title: 'The Study Plate Formula' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-secondary)' }}>
          Brain Food Guide
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.55rem',
            color: ACCENT,
            background: 'rgba(251,146,60,0.1)',
            border: '1px solid rgba(251,146,60,0.2)',
            borderRadius: 6,
            padding: '2px 8px',
          }}
        >
          offline · SA prices
        </div>
      </div>

      {SECTIONS.map(section => {
        const isOpen = openSection === section.id
        return (
          <div
            key={section.id}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: isOpen ? `1px solid rgba(251,146,60,0.25)` : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}
          >
            <button
              onClick={() => setOpenSection(isOpen ? null : section.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{section.emoji}</span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: isOpen ? ACCENT : 'var(--text-secondary)',
                  flex: 1,
                  transition: 'color 0.2s',
                }}
              >
                {section.title}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.5)',
                  transition: 'transform 0.2s',
                  display: 'inline-block',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                ▾
              </span>
            </button>

            {isOpen && (
              <div
                style={{
                  padding: '0 16px 16px',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  paddingTop: 14,
                }}
              >
                <SectionContent id={section.id} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
