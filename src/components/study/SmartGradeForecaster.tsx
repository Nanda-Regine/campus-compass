'use client'

import { useState } from 'react'
import type { Module, ModuleColour } from '@/types'
import { MODULE_COLOURS } from '@/types'

interface Props {
  modules: Module[]
}

const ACCENT = '#4ecf9e'

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max)
}

function computeForecast(currentMark: number, remainingWeight: number, targetGrade: number) {
  if (remainingWeight === 0) {
    return { needed: null, projected: currentMark }
  }
  const rw = remainingWeight / 100
  const earned = currentMark * (1 - rw)
  const needed = (targetGrade - earned) / rw
  const projected = earned + clamp(needed, 0, 100) * rw
  return { needed, projected }
}

type Feasibility = 'achievable' | 'challenging' | 'very_difficult' | 'impossible'

function feasibility(needed: number | null): Feasibility {
  if (needed === null) return 'achievable'
  if (needed > 100) return 'impossible'
  if (needed > 85) return 'very_difficult'
  if (needed > 70) return 'challenging'
  return 'achievable'
}

const FEASIBILITY_CONFIG: Record<Feasibility, { label: string; color: string; symbol: string }> = {
  achievable: { label: 'Achievable', color: '#4ecf9e', symbol: '✓' },
  challenging: { label: 'Challenging', color: '#fbbf24', symbol: '~' },
  very_difficult: { label: 'Very difficult', color: '#f87171', symbol: '!' },
  impossible: { label: 'Not achievable from current standing', color: '#6b7280', symbol: '✕' },
}

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  unit?: string
  onChange: (v: number) => void
  color?: string
}

function LabeledSlider({ label, value, min, max, unit = '', onChange, color = ACCENT }: SliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span style={{ color: '#9ca3af', fontSize: '13px' }}>{label}</span>
        <span style={{ color, fontSize: '20px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: color,
          cursor: 'pointer',
        }}
      />
    </div>
  )
}

export default function SmartGradeForecaster({ modules }: Props) {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(modules[0]?.id ?? null)
  const [currentMark, setCurrentMark] = useState(55)
  const [remainingWeight, setRemainingWeight] = useState(40)
  const [targetGrade, setTargetGrade] = useState(65)

  const selectedModule = modules.find(m => m.id === selectedModuleId) ?? null
  const moduleColour: ModuleColour = selectedModule?.colour ?? selectedModule?.color ?? 'teal'
  const colourTokens = MODULE_COLOURS[moduleColour] ?? MODULE_COLOURS.teal

  const { needed, projected } = computeForecast(currentMark, remainingWeight, targetGrade)
  const clampedNeeded = needed !== null ? clamp(needed, 0, 200) : null
  const displayNeeded = needed !== null ? Math.round(needed) : null
  const feas = feasibility(needed)
  const feasConfig = FEASIBILITY_CONFIG[feas]

  const projectedIfMax = remainingWeight > 0
    ? Math.round(currentMark * (1 - remainingWeight / 100) + 100 * (remainingWeight / 100))
    : currentMark

  const neededColor =
    feas === 'achievable' ? '#4ecf9e'
    : feas === 'challenging' ? '#fbbf24'
    : feas === 'very_difficult' ? '#f87171'
    : '#6b7280'

  return (
    <div style={{ color: '#e5e7eb' }}>
      {/* Module selector */}
      {modules.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {modules.map(m => {
            const col: ModuleColour = m.colour ?? m.color ?? 'teal'
            const tok = MODULE_COLOURS[col] ?? MODULE_COLOURS.teal
            const active = m.id === selectedModuleId
            return (
              <button
                key={m.id}
                onClick={() => setSelectedModuleId(m.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  border: active ? `1px solid ${tok.text}` : '1px solid rgba(255,255,255,0.1)',
                  background: active ? tok.bg : 'transparent',
                  color: active ? tok.text : '#9ca3af',
                  fontSize: '12px',
                  fontWeight: active ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {m.code ?? m.module_code}
              </button>
            )
          })}
        </div>
      )}

      {modules.length === 0 && (
        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>Add modules in the Modules tab to use the forecaster.</p>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Current Standing */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding: '20px',
          gridColumn: '1 / -1',
        }}>
          <p style={{ color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
            Your current standing
          </p>
          <div className="flex flex-col gap-5">
            <LabeledSlider
              label="Current mark so far"
              value={currentMark}
              min={0}
              max={100}
              unit="%"
              onChange={setCurrentMark}
              color={colourTokens.text}
            />
            <LabeledSlider
              label="Weight remaining in module"
              value={remainingWeight}
              min={0}
              max={100}
              unit="%"
              onChange={setRemainingWeight}
              color={colourTokens.text}
            />
          </div>
        </div>

        {/* Target */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding: '20px',
          gridColumn: '1 / -1',
        }}>
          <p style={{ color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
            What do you need?
          </p>
          <LabeledSlider
            label="Target final mark"
            value={targetGrade}
            min={50}
            max={100}
            unit="%"
            onChange={setTargetGrade}
            color={ACCENT}
          />

          {/* Result */}
          <div style={{
            marginTop: '24px',
            textAlign: 'center',
            padding: '24px 16px',
            background: `rgba(${neededColor === '#4ecf9e' ? '78,207,158' : neededColor === '#fbbf24' ? '251,191,36' : neededColor === '#f87171' ? '248,113,113' : '107,114,128'},0.07)`,
            border: `1px solid ${neededColor}22`,
            borderRadius: '14px',
          }}>
            {feas === 'impossible' ? (
              <p style={{ color: '#6b7280', fontSize: '18px', fontWeight: 700 }}>Not achievable from here</p>
            ) : displayNeeded !== null ? (
              <>
                <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>You need on remaining work</p>
                <p style={{ color: neededColor, fontSize: '48px', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {displayNeeded}%
                </p>
                <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '8px' }}>
                  If you score {displayNeeded}% on remaining work, your final mark will be{' '}
                  <span style={{ color: neededColor, fontWeight: 600 }}>
                    {Math.round(clamp(projected, 0, 100))}%
                  </span>
                </p>
              </>
            ) : (
              <p style={{ color: ACCENT, fontSize: '16px' }}>Enter values above to calculate</p>
            )}
          </div>

          {/* Feasibility label */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px' }}>
            <span style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: `${feasConfig.color}22`,
              border: `1px solid ${feasConfig.color}44`,
              color: feasConfig.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {feasConfig.symbol}
            </span>
            <span style={{ color: feasConfig.color, fontSize: '13px', fontWeight: 600 }}>
              {feasConfig.label}
            </span>
          </div>

          {/* Best case note */}
          {remainingWeight > 0 && feas !== 'impossible' && (
            <p style={{ color: '#6b7280', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>
              Best possible mark if you score 100% on remaining: {projectedIfMax}%
            </p>
          )}
        </div>
      </div>

      <p style={{ color: '#9ca3af', fontSize: '11px', opacity: 0.5, marginTop: '16px', textAlign: 'center' }}>
        Estimate only — check your module outline for exact weights
      </p>
    </div>
  )
}
