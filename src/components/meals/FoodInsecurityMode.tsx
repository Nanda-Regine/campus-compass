'use client'

import { useState } from 'react'

interface Props {
  budgetHealth: 'excellent' | 'good' | 'tight' | 'critical'
  university: string | null
}

const FOOD_BANKS: Record<string, { name: string; contact: string; hours: string }> = {
  'University of Cape Town (UCT)': { name: 'UCT Student Wellness — Food Support', contact: '021 650 5083', hours: 'Mon-Fri 8am-4pm' },
  'University of the Witwatersrand (Wits)': { name: 'Wits Food Bank — SRC', contact: 'src@wits.ac.za', hours: 'Check SRC notice board' },
  'University of Johannesburg (UJ)': { name: 'UJ Student Affairs Food Parcels', contact: '011 559 4555', hours: 'Mon-Fri 8am-3pm' },
  'Stellenbosch University (SU)': { name: 'SU Student Food Garden', contact: 'studentwelfare@sun.ac.za', hours: 'Mon-Fri 9am-4pm' },
  'University of KwaZulu-Natal (UKZN)': { name: 'UKZN Student Emergency Relief', contact: 'dsa@ukzn.ac.za', hours: 'Mon-Fri 8am-4pm' },
  'Tshwane University of Technology (TUT)': { name: 'TUT Student Support Services', contact: '012 382 5911', hours: 'Mon-Fri 8am-4pm' },
  'UNISA': { name: 'UNISA Student Support — Contact regional office', contact: '0800 00 1870', hours: 'Mon-Fri 8am-4pm' },
  'Nelson Mandela University (NMU)': { name: 'NMU Student Support Services', contact: '041 504 1111', hours: 'Mon-Fri 8am-4pm' },
  'University of the Western Cape (UWC)': { name: 'UWC Student Wellness Food Support', contact: '021 959 2000', hours: 'Mon-Fri 8am-4pm' },
}

const DEFAULT_FOOD_BANK = {
  name: 'Contact your SRC',
  contact: 'Go to Student Representative Council office',
  hours: 'Check campus notice boards',
}

const BUDGET_MEALS = [
  { name: 'Umngqusho (Samp & Beans)', cost: 'R15-20 for a pot (feeds 4)', protein: '22g per serving', calories: 340, tip: 'Cook a large batch, lasts 3-4 days in fridge. Add chakalaka for flavour.' },
  { name: 'Egg & Rice', cost: 'R8-12', protein: '14g', calories: 380, tip: 'Scramble 2 eggs over white rice. Add soy sauce or pilchard sauce for flavour.' },
  { name: 'Peanut Butter Sandwich + Banana', cost: 'R6-8', protein: '12g', calories: 450, tip: 'Peanut butter has healthy fats that keep you full for 3-4 hours. Buy the bulk 800g jar.' },
  { name: 'Oats with Peanut Butter', cost: 'R5-7', protein: '14g', calories: 380, tip: 'Oats give 4+ hours of slow energy release. Add peanut butter for protein and healthy fat.' },
  { name: 'Pilchards + Bread', cost: 'R10-14', protein: '20g', calories: 400, tip: 'Lucky Star pilchards are an incredible protein-to-cost ratio. Omega-3s boost brain function.' },
  { name: 'Fried Egg + Bread', cost: 'R5-8', protein: '10g', calories: 320, tip: 'Quick, portable. Eat with a glass of water and piece of fruit if available.' },
]

const ACCENT = '#fb923c'

export default function FoodInsecurityMode({ budgetHealth, university }: Props) {
  const [expanded, setExpanded] = useState(budgetHealth === 'critical')

  const foodBank = (university && FOOD_BANKS[university]) ? FOOD_BANKS[university] : DEFAULT_FOOD_BANK

  const isContactEmail = foodBank.contact.includes('@')
  const isContactPhone = /^\d|^0/.test(foodBank.contact)

  if (budgetHealth !== 'critical' && budgetHealth !== 'tight') return null

  if (budgetHealth === 'tight' && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.72rem',
          color: ACCENT,
          background: 'rgba(251,146,60,0.08)',
          border: '1px solid rgba(251,146,60,0.2)',
          borderRadius: 10,
          padding: '6px 12px',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span>💡</span>
        Need help stretching your food budget?
      </button>
    )
  }

  return (
    <div
      style={{
        background: budgetHealth === 'critical' ? 'rgba(239,68,68,0.06)' : 'rgba(251,146,60,0.05)',
        border: budgetHealth === 'critical' ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(251,146,60,0.2)',
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1rem',
              color: budgetHealth === 'critical' ? '#f87171' : ACCENT,
              marginBottom: 4,
            }}
          >
            {budgetHealth === 'critical' ? 'Stretch Week Mode' : 'Budget Stretching Tips'}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)' }}>
            {budgetHealth === 'critical'
              ? 'Resources available right now on campus.'
              : 'Here\'s what works when funds are tight.'}
          </div>
        </div>
        {budgetHealth === 'tight' && (
          <button
            onClick={() => setExpanded(false)}
            style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1rem', cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Food bank section */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Campus Food Support
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem', color: '#e5e7eb', marginBottom: 6 }}>
          {foodBank.name}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.75rem' }}>{isContactEmail ? '✉️' : isContactPhone ? '📞' : '📋'}</span>
            {isContactPhone ? (
              <a
                href={`tel:${foodBank.contact.replace(/\s/g, '')}`}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: ACCENT, textDecoration: 'none' }}
              >
                {foodBank.contact}
              </a>
            ) : isContactEmail ? (
              <a
                href={`mailto:${foodBank.contact}`}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: ACCENT, textDecoration: 'none' }}
              >
                {foodBank.contact}
              </a>
            ) : (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#9ca3af' }}>{foodBank.contact}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.75rem' }}>🕐</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#9ca3af' }}>{foodBank.hours}</span>
          </div>
        </div>
      </div>

      {/* SASSA SRD callout */}
      <div
        style={{
          background: 'rgba(234,179,8,0.08)',
          border: '1px solid rgba(234,179,8,0.25)',
          borderRadius: 12,
          padding: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.78rem', color: '#fbbf24', marginBottom: 2 }}>
            No income this month?
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)' }}>
            Check if you qualify for R370/month SASSA SRD
          </div>
        </div>
        <a
          href="/budget"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            fontWeight: 700,
            color: '#fbbf24',
            background: 'rgba(234,179,8,0.12)',
            border: '1px solid rgba(234,179,8,0.3)',
            borderRadius: 8,
            padding: '6px 10px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Check →
        </a>
      </div>

      {/* Meal cards */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Nutritionally complete meals under R20
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {BUDGET_MEALS.map(meal => (
            <div
              key={meal.name}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: '#e5e7eb', marginBottom: 6 }}>
                {meal.name}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    color: ACCENT,
                    background: 'rgba(251,146,60,0.1)',
                    border: '1px solid rgba(251,146,60,0.2)',
                    borderRadius: 6,
                    padding: '2px 7px',
                  }}
                >
                  {meal.cost}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    color: '#86efac',
                    background: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.15)',
                    borderRadius: 6,
                    padding: '2px 7px',
                  }}
                >
                  {meal.protein} protein
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  {meal.calories} kcal
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#9ca3af', lineHeight: 1.5 }}>
                {meal.tip}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Community kitchen tip */}
      <div
        style={{
          background: 'rgba(99,102,241,0.07)',
          border: '1px solid rgba(99,102,241,0.18)',
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          Community kitchen tip
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
          Most mosques, churches, and community centres near campuses run soup kitchens or Friday/Sunday meal programmes — often open to students regardless of affiliation. Ask at your SRC or check campus notice boards for times.
        </div>
      </div>
    </div>
  )
}
