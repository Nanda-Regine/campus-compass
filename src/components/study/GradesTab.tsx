'use client'

import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react'
import { Plus, Trash2, Calculator, TrendingUp, Info } from 'lucide-react'
import type { Module } from '@/types'
import { loadGradesData, saveGradesData, type DBModuleGrade, type GpaRow } from '@/lib/db/grades'
import { signals } from '@/store/signals'

/* ── Types ─────────────────────────────────────────────── */
interface Assessment {
  id: string
  name: string
  score: string  // '' if not yet received
  weight: string // percentage weight of total mark
}

interface ModuleGrade {
  id: string
  moduleId: string
  moduleName: string
  colour: string
  credits: string
  assessments: Assessment[]
}

/* ── Helpers ────────────────────────────────────────────── */
function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function parseNum(v: string): number | null {
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

// SA university GPA scale (0-8 / Distinction honours)
function markToGrade(pct: number): { letter: string; points: number; label: string } {
  if (pct >= 75) return { letter: 'D',  points: 7, label: 'Distinction' }
  if (pct >= 70) return { letter: 'M',  points: 6, label: 'Merit' }
  if (pct >= 60) return { letter: 'C+', points: 5, label: 'Credit' }
  if (pct >= 50) return { letter: 'C',  points: 4, label: 'Pass' }
  if (pct >= 45) return { letter: 'D-', points: 3, label: 'Sub-min' }
  if (pct >= 40) return { letter: 'F+', points: 2, label: 'Fail' }
  return { letter: 'F', points: 0, label: 'Fail' }
}

function gradeColour(pct: number): string {
  if (pct >= 75) return '#4ecf9e'
  if (pct >= 60) return '#c9a84c'
  if (pct >= 50) return '#7090d0'
  return '#ff6b6b'
}

// Calculate what mark is needed in remaining assessments to reach a target
function calcNeeded(assessments: Assessment[], targetPct: number): {
  earned: number
  earnedWeight: number
  totalWeight: number
  remainingWeight: number
  needed: number | null
  feasible: boolean
} {
  let earned = 0
  let earnedWeight = 0
  let totalWeight = 0

  for (const a of assessments) {
    const w = parseNum(a.weight)
    if (w == null) continue
    totalWeight += w
    const s = parseNum(a.score)
    if (s != null) {
      earned += (s / 100) * w
      earnedWeight += w
    }
  }

  const remainingWeight = totalWeight - earnedWeight
  const targetPoints = targetPct * (totalWeight / 100)
  const stillNeeded = targetPoints - earned

  if (remainingWeight <= 0) {
    const current = earnedWeight > 0 ? (earned / earnedWeight) * 100 : 0
    return { earned: current, earnedWeight, totalWeight, remainingWeight: 0, needed: null, feasible: current >= targetPct }
  }

  const needed = (stillNeeded / remainingWeight) * 100
  return {
    earned: earnedWeight > 0 ? (earned / earnedWeight) * 100 : 0,
    earnedWeight,
    totalWeight,
    remainingWeight,
    needed,
    feasible: needed <= 100,
  }
}

/* ── Empty state ────────────────────────────────────────── */
const EMPTY_ASSESSMENTS: Assessment[] = [
  { id: uid(), name: 'Assignment 1', score: '', weight: '20' },
  { id: uid(), name: 'Test / DP',    score: '', weight: '30' },
  { id: uid(), name: 'Exam',         score: '', weight: '50' },
]

function makeModuleGrade(mod?: Module): ModuleGrade {
  return {
    id: uid(),
    moduleId: mod?.id ?? '',
    moduleName: mod?.module_name ?? 'New Module',
    colour: mod?.color ?? mod?.colour ?? '#4ecf9e',
    credits: '16',
    assessments: EMPTY_ASSESSMENTS.map(a => ({ ...a, id: uid() })),
  }
}

/* ── Sub-components ─────────────────────────────────────── */
function Pill({ label, colour }: { label: string; colour: string }) {
  return (
    <span style={{
      fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      background: colour + '20', color: colour,
      border: `0.5px solid ${colour}40`,
      borderRadius: 9999, padding: '2px 7px',
    }}>
      {label}
    </span>
  )
}

/* ── Grade Calculator card ──────────────────────────────── */
function GradeCalcCard({
  mg, modules, onUpdate, onRemove,
}: {
  mg: ModuleGrade
  modules: Module[]
  onUpdate: (updated: ModuleGrade) => void
  onRemove: () => void
}) {
  const [target, setTarget] = useState(50)
  const [open, setOpen] = useState(true)

  const result = calcNeeded(mg.assessments, target)

  const totalWeight = mg.assessments.reduce((s, a) => s + (parseNum(a.weight) ?? 0), 0)
  const isOverWeight = totalWeight > 100

  function updateAssessment(id: string, field: keyof Assessment, value: string) {
    onUpdate({
      ...mg,
      assessments: mg.assessments.map(a => a.id === id ? { ...a, [field]: value } : a),
    })
  }

  function addAssessment() {
    onUpdate({
      ...mg,
      assessments: [...mg.assessments, { id: uid(), name: '', score: '', weight: '' }],
    })
  }

  function removeAssessment(id: string) {
    onUpdate({ ...mg, assessments: mg.assessments.filter(a => a.id !== id) })
  }

  const needed = result.needed
  const neededColour = needed == null
    ? '#4ecf9e'
    : needed > 100 ? '#ff6b6b' : needed > 80 ? '#f59e0b' : '#4ecf9e'

  const currentAvg = result.earnedWeight > 0
    ? (result.earned)
    : null

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: `1px solid ${mg.colour}30`,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 12,
    }}>
      {/* Header */}
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', cursor: 'pointer',
          borderBottom: open ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: mg.colour, flexShrink: 0 }} />
          <input
            value={mg.moduleName}
            onChange={e => onUpdate({ ...mg, moduleName: e.target.value })}
            onClick={e => e.stopPropagation()}
            placeholder="Module name"
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 14,
              color: '#fff', width: 160,
            }}
          />
          {currentAvg !== null && (
            <Pill label={`${currentAvg.toFixed(1)}%`} colour={gradeColour(currentAvg)} />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={e => { e.stopPropagation(); onRemove() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', padding: 4 }}
          >
            <Trash2 size={13} />
          </button>
          <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
            ▾
          </span>
        </div>
      </div>

      {open && (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Module selector */}
          {modules.length > 0 && (
            <select
              value={mg.moduleId}
              onChange={e => {
                const m = modules.find(x => x.id === e.target.value)
                onUpdate({
                  ...mg,
                  moduleId: e.target.value,
                  moduleName: m?.module_name ?? mg.moduleName,
                  colour: m?.color ?? m?.colour ?? mg.colour,
                })
              }}
              style={{
                background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '6px 10px', color: 'rgba(255,255,255,0.55)',
                fontSize: 12, fontFamily: 'DM Sans, sans-serif', width: '100%', cursor: 'pointer',
              }}
            >
              <option value="">— Link to existing module —</option>
              {modules.map(m => (
                <option key={m.id} value={m.id}>{m.module_name}</option>
              ))}
            </select>
          )}

          {/* Assessments table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 80px 70px 28px',
              gap: 6, paddingBottom: 4,
              borderBottom: '0.5px solid rgba(255,255,255,0.08)',
            }}>
              {['Assessment', 'Mark (%)', 'Weight (%)', ''].map(h => (
                <span key={h} style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
                  {h}
                </span>
              ))}
            </div>

            {mg.assessments.map(a => (
              <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 28px', gap: 6, alignItems: 'center' }}>
                <input
                  value={a.name}
                  onChange={e => updateAssessment(a.id, 'name', e.target.value)}
                  placeholder="e.g. Assignment 1"
                  style={inputStyle}
                />
                <input
                  value={a.score}
                  onChange={e => updateAssessment(a.id, 'score', e.target.value)}
                  placeholder="—"
                  type="number"
                  min="0"
                  max="100"
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
                <input
                  value={a.weight}
                  onChange={e => updateAssessment(a.id, 'weight', e.target.value)}
                  placeholder="0"
                  type="number"
                  min="0"
                  max="100"
                  style={{ ...inputStyle, textAlign: 'center', color: isOverWeight ? '#ff6b6b' : 'inherit' }}
                />
                <button
                  onClick={() => removeAssessment(a.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <button
                onClick={addAssessment}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#4ecf9e', fontSize: 12, fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <Plus size={13} /> Add assessment
              </button>
              <span style={{
                fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                color: isOverWeight ? '#ff6b6b' : 'rgba(255,255,255,0.3)',
              }}>
                {totalWeight}% / 100%
              </span>
            </div>
          </div>

          {/* Target selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif' }}>Target:</span>
            {[{ pct: 50, label: 'Pass (50%)' }, { pct: 60, label: 'Credit (60%)' }, { pct: 75, label: 'Distinction (75%)' }].map(({ pct, label }) => (
              <button
                key={pct}
                onClick={() => setTarget(pct)}
                style={{
                  padding: '4px 10px', borderRadius: 9999, fontSize: 11,
                  fontFamily: 'DM Sans, sans-serif', fontWeight: target === pct ? 600 : 400,
                  background: target === pct ? gradeColour(pct) + '25' : 'rgba(255,255,255,0.05)',
                  border: `0.5px solid ${target === pct ? gradeColour(pct) + '50' : 'rgba(255,255,255,0.08)'}`,
                  color: target === pct ? gradeColour(pct) : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Result banner */}
          <div style={{
            marginTop: 4, borderRadius: 12, padding: '12px 14px',
            background: neededColour + '12',
            border: `1px solid ${neededColour}30`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <Calculator size={20} color={neededColour} style={{ flexShrink: 0 }} />
            <div>
              {needed == null && result.remainingWeight === 0 ? (
                <>
                  <div style={{ fontSize: 18, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: neededColour }}>
                    {result.earned.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, fontFamily: 'DM Sans, sans-serif' }}>
                    {result.feasible
                      ? `All assessments done · You ${result.feasible ? 'passed' : 'did not pass'} (${markToGrade(result.earned).label})`
                      : `All marks entered · ${markToGrade(result.earned).label}`}
                  </div>
                </>
              ) : needed !== null && needed > 100 ? (
                <>
                  <div style={{ fontSize: 18, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#ff6b6b' }}>
                    Mathematically impossible
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, fontFamily: 'DM Sans, sans-serif' }}>
                    You need {needed.toFixed(1)}% in remaining {result.remainingWeight}% — consider a lower target
                  </div>
                </>
              ) : needed !== null ? (
                <>
                  <div style={{ fontSize: 18, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: neededColour }}>
                    {clamp(needed, 0, 100).toFixed(1)}% needed
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, fontFamily: 'DM Sans, sans-serif' }}>
                    In your remaining {result.remainingWeight}% of assessments · to reach {target}% ({markToGrade(target).label})
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'DM Sans, sans-serif' }}>
                  Enter your assessment weights and marks to calculate
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

/* ── GPA Calculator ─────────────────────────────────────── */
function GpaCalculator({
  modules, rows, setRows,
}: {
  modules: Module[]
  rows: GpaRow[]
  setRows: React.Dispatch<React.SetStateAction<GpaRow[]>>
}) {

  function addRow() {
    setRows(r => [...r, { id: uid(), name: '', mark: '', credits: '16' }])
  }

  function removeRow(id: string) {
    setRows(r => r.filter(x => x.id !== id))
  }

  function update(id: string, field: 'name' | 'mark' | 'credits', value: string) {
    setRows(r => r.map(x => x.id === id ? { ...x, [field]: value } : x))
  }

  // Credit-weighted average (South African standard)
  let totalCredits = 0
  let weightedSum = 0
  let completedCount = 0

  for (const row of rows) {
    const m = parseNum(row.mark)
    const c = parseNum(row.credits) ?? 0
    if (m != null) {
      weightedSum += m * c
      totalCredits += c
      completedCount++
    }
  }

  const gpa = totalCredits > 0 ? weightedSum / totalCredits : null
  const grade = gpa != null ? markToGrade(gpa) : null

  const cumLaudeTarget = 75
  const progressToDistinction = gpa != null ? Math.min(100, (gpa / cumLaudeTarget) * 100) : 0

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px 14px', marginBottom: 12 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <TrendingUp size={16} color="#7090d0" />
        <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 14, color: '#fff' }}>
          GPA Calculator
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Info size={11} color="rgba(255,255,255,0.55)" />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: 'DM Sans' }}>credit-weighted</span>
        </div>
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 28px', gap: 6 }}>
          {['Module', 'Mark (%)', 'Credits', ''].map(h => (
            <span key={h} style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
              {h}
            </span>
          ))}
        </div>

        {rows.map(row => {
          const m = parseNum(row.mark)
          const rowGrade = m != null ? markToGrade(m) : null
          return (
            <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 28px', gap: 6, alignItems: 'center' }}>
              <input
                value={row.name}
                onChange={e => update(row.id, 'name', e.target.value)}
                placeholder="e.g. MAT1501"
                style={inputStyle}
              />
              <div style={{ position: 'relative' }}>
                <input
                  value={row.mark}
                  onChange={e => update(row.id, 'mark', e.target.value)}
                  placeholder="—"
                  type="number"
                  min="0"
                  max="100"
                  style={{ ...inputStyle, textAlign: 'center', paddingRight: rowGrade ? 28 : undefined, color: m != null ? gradeColour(m) : undefined }}
                />
                {rowGrade && (
                  <span style={{
                    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                    color: m != null ? gradeColour(m!) : 'rgba(255,255,255,0.3)',
                  }}>
                    {rowGrade.letter}
                  </span>
                )}
              </div>
              <input
                value={row.credits}
                onChange={e => update(row.id, 'credits', e.target.value)}
                type="number"
                min="1"
                max="120"
                style={{ ...inputStyle, textAlign: 'center' }}
              />
              <button
                onClick={() => removeRow(row.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          )
        })}

        <button
          onClick={addRow}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, marginTop: 2,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#7090d0', fontSize: 12, fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <Plus size={13} /> Add module
        </button>
      </div>

      {/* GPA Result */}
      {gpa != null && grade != null && (
        <div style={{ borderRadius: 12, background: gradeColour(gpa) + '10', border: `1px solid ${gradeColour(gpa)}30`, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 26, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: gradeColour(gpa), lineHeight: 1 }}>
                {gpa.toFixed(2)}%
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3, fontFamily: 'DM Sans' }}>
                Credit-weighted average · {completedCount} module{completedCount !== 1 ? 's' : ''} · {totalCredits} credits
              </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontFamily: 'Sora, sans-serif', fontWeight: 700, color: gradeColour(gpa) }}>
                {grade.label}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: 'JetBrains Mono' }}>
                {grade.points}/7 pts
              </div>
            </div>
          </div>

          {/* Progress to distinction bar */}
          <div style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: 'DM Sans' }}>
                Progress to Distinction
              </span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: 'JetBrains Mono' }}>
                {progressToDistinction.toFixed(0)}%
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 9999, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progressToDistinction}%`,
                borderRadius: 9999,
                background: `linear-gradient(90deg, ${gradeColour(gpa)}, ${gradeColour(gpa)}aa)`,
                transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
              }} />
            </div>
          </div>

          {gpa >= 75 && (
            <div style={{ marginTop: 8, fontSize: 11, color: '#4ecf9e', fontFamily: 'DM Sans', fontWeight: 600 }}>
              Cum Laude territory — keep going!
            </div>
          )}
          {gpa < 50 && (
            <div style={{ marginTop: 8, fontSize: 11, color: '#ff6b6b', fontFamily: 'DM Sans' }}>
              Below pass mark — book a session with your academic advisor or check NSFAS conditions.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Shared input style ─────────────────────────────────── */
const inputStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '0.5px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '6px 8px',
  color: '#fff',
  fontSize: 12,
  fontFamily: 'DM Sans, sans-serif',
  width: '100%',
  outline: 'none',
}

/* ── Main Tab ───────────────────────────────────────────── */
export default function GradesTab({ modules }: { modules: Module[] }) {
  const [view, setView]               = useState<'calc' | 'gpa'>('calc')
  const [moduleGrades, setModuleGrades] = useState<ModuleGrade[]>([makeModuleGrade(modules[0])])
  const [gpaRows, setGpaRows]         = useState<GpaRow[]>([{ id: uid(), name: '', mark: '', credits: '16' }])
  const [loaded, setLoaded]           = useState(false)
  const saveTimer                     = useRef<ReturnType<typeof setTimeout>>()

  // Load from DB on mount
  useEffect(() => {
    loadGradesData().then(({ modules: dbModules, gpaRows: dbRows }) => {
      if (dbModules.length > 0) setModuleGrades(dbModules as ModuleGrade[])
      if (dbRows.length > 0)    setGpaRows(dbRows)
      setLoaded(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced auto-save — 800 ms after last change
  useEffect(() => {
    if (!loaded) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveGradesData(moduleGrades as DBModuleGrade[], gpaRows).catch(() => {})
      for (const mg of moduleGrades) {
        const scores = mg.assessments.filter(a => a.score !== '' && a.weight !== '')
        const totalW = scores.reduce((s, a) => s + (parseFloat(a.weight) || 0), 0)
        const earned = scores.reduce((s, a) => s + ((parseFloat(a.score) || 0) / 100) * (parseFloat(a.weight) || 0), 0)
        if (totalW > 0) {
          signals.emit({ type: 'grade_updated', payload: {
            moduleId: mg.moduleId,
            grade: Math.round(earned / totalW * 100),
            moduleCode: mg.moduleName,
          }})
        }
      }
    }, 800)
    return () => clearTimeout(saveTimer.current)
  }, [moduleGrades, gpaRows, loaded])

  const addModule = useCallback(() => {
    setModuleGrades(prev => [...prev, makeModuleGrade()])
  }, [])

  function updateGrade(id: string, updated: ModuleGrade) {
    setModuleGrades(prev => prev.map(mg => mg.id === id ? updated : mg))
  }

  function removeGrade(id: string) {
    setModuleGrades(prev => prev.filter(mg => mg.id !== id))
  }

  return (
    <div>
      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 14, border: '0.5px solid rgba(255,255,255,0.07)' }}>
        {[
          { id: 'calc', label: 'Pass Calculator', icon: '🧮' },
          { id: 'gpa',  label: 'GPA Calculator',  icon: '📊' },
        ].map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setView(id as 'calc' | 'gpa')}
            style={{
              flex: 1, padding: '9px 12px',
              borderRadius: 11, fontSize: 12,
              fontFamily: 'Sora, sans-serif', fontWeight: view === id ? 700 : 400,
              background: view === id ? 'rgba(78,207,158,0.12)' : 'transparent',
              border: `0.5px solid ${view === id ? 'rgba(78,207,158,0.3)' : 'transparent'}`,
              color: view === id ? '#4ecf9e' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: view === id ? '0 2px 12px rgba(78,207,158,0.1)' : 'none',
            }}
          >
            <span style={{ marginRight: 5 }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* SA grade reference strip */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
        {[
          { letter: 'D', label: 'Distinction', pct: '75+', color: '#4ecf9e' },
          { letter: 'M', label: 'Merit',        pct: '70+', color: '#a3e4cc' },
          { letter: 'C+', label: 'Credit',      pct: '60+', color: '#c9a84c' },
          { letter: 'C', label: 'Pass',          pct: '50+', color: '#7090d0' },
          { letter: 'F', label: 'Fail',          pct: '<50', color: '#ff6b6b' },
        ].map(g => (
          <div key={g.letter} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 8,
            background: `${g.color}10`, border: `0.5px solid ${g.color}30`,
          }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, color: g.color }}>{g.letter}</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', fontFamily: 'DM Sans, sans-serif' }}>{g.pct}%</span>
          </div>
        ))}
      </div>

      {view === 'calc' && (
        <>
          <div style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(78,207,158,0.05)', borderRadius: 10, border: '0.5px solid rgba(78,207,158,0.15)' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5, margin: 0 }}>
              Enter each assessment, its mark (if received), and its weight. Leave the mark blank for assessments still to come — the calculator tells you what you need.
            </p>
          </div>

          {moduleGrades.map(mg => (
            <GradeCalcCard
              key={mg.id}
              mg={mg}
              modules={modules}
              onUpdate={updated => updateGrade(mg.id, updated)}
              onRemove={() => removeGrade(mg.id)}
            />
          ))}

          <button
            onClick={addModule}
            style={{
              width: '100%', padding: '11px', borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px dashed rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.4)', fontSize: 13,
              fontFamily: 'Sora, sans-serif', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Plus size={14} /> Add another module
          </button>
        </>
      )}

      {view === 'gpa' && (
        <GpaCalculator modules={modules} rows={gpaRows} setRows={setGpaRows} />
      )}
    </div>
  )
}
