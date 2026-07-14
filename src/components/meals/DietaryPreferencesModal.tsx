'use client'

import { useState, useEffect } from 'react'
import { type DietaryPrefs } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (prefs: DietaryPrefs) => void
  initialPrefs?: DietaryPrefs
}

const DEFAULT_PREFS: DietaryPrefs = {
  isHalal: false,
  isKosher: false,
  isVegetarian: false,
  isVegan: false,
  isGlutenFree: false,
  isDairyFree: false,
  traditionalFoods: false,
  nutAllergy: false,
  otherRestrictions: '',
}

const ACCENT = '#fb923c'

interface CheckboxOption {
  key: keyof Omit<DietaryPrefs, 'otherRestrictions'>
  label: string
  note?: string
}

const CHECKBOX_OPTIONS: CheckboxOption[] = [
  { key: 'isHalal', label: 'Halal', note: 'Major SA universities have halal-certified options' },
  { key: 'isKosher', label: 'Kosher' },
  { key: 'isVegetarian', label: 'Vegetarian' },
  { key: 'isVegan', label: 'Vegan' },
  { key: 'isGlutenFree', label: 'Gluten-free' },
  { key: 'isDairyFree', label: 'Dairy-free' },
  { key: 'traditionalFoods', label: 'Traditional SA foods', note: 'We\'ll prioritize umngqusho, morogo, pap variations, vetkoek' },
  { key: 'nutAllergy', label: 'Nut allergy' },
]

function CustomCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        width: 20,
        height: 20,
        borderRadius: 6,
        border: checked ? `2px solid ${ACCENT}` : '2px solid rgba(255,255,255,0.2)',
        background: checked ? 'rgba(251,146,60,0.2)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4l3 3 5-6" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

export default function DietaryPreferencesModal({ isOpen, onClose, onSave, initialPrefs }: Props) {
  const [prefs, setPrefs] = useState<DietaryPrefs>(initialPrefs ?? DEFAULT_PREFS)

  useEffect(() => {
    if (isOpen) {
      setPrefs(initialPrefs ?? DEFAULT_PREFS)
    }
  }, [isOpen, initialPrefs])

  function toggle(key: keyof Omit<DietaryPrefs, 'otherRestrictions'>) {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function handleSave() {
    onSave(prefs)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.70)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          maxWidth: 448,
          width: '100%',
          background: 'var(--bg-surface)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 20,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
              Dietary Preferences
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: 3 }}>
              Filters recipe suggestions and meal planning
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.66)',
              fontSize: '1rem',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CHECKBOX_OPTIONS.map(option => (
            <div
              key={option.key}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                cursor: 'pointer',
              }}
              onClick={() => toggle(option.key)}
            >
              <div style={{ paddingTop: 1 }}>
                <CustomCheckbox checked={prefs[option.key]} onChange={() => toggle(option.key)} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  {option.label}
                </div>
                {option.note && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: 2, lineHeight: 1.4 }}>
                    {option.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Other restrictions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.62)', textTransform: 'uppercase', letterSpacing: '0.07em' }}
          >
            Any other restrictions?
          </label>
          <input
            type="text"
            value={prefs.otherRestrictions}
            onChange={e => setPrefs(prev => ({ ...prev, otherRestrictions: e.target.value }))}
            placeholder="e.g. no pork, low FODMAP, diabetic-friendly..."
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              outline: 'none',
              fontFamily: 'var(--font-body)',
              width: '100%',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = ACCENT }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          style={{
            background: ACCENT,
            border: 'none',
            borderRadius: 12,
            padding: '13px 0',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: 'white',
            cursor: 'pointer',
            width: '100%',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          Save Preferences
        </button>

        {/* Footer note */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.48)', textAlign: 'center', lineHeight: 1.5 }}>
          These preferences filter recipe suggestions and meal planning.
        </div>
      </div>
    </div>
  )
}
