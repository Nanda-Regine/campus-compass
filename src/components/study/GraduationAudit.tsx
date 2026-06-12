'use client'

// ============================================================
// GraduationAudit — Can I graduate on time?
// Credit tracker · Exclusion risk · GPA simulation · Timeline
// Domain colour: --sky (Movement/Progress OS)
// ============================================================

import { useState } from 'react'
import { useAppStore } from '@/store'

// ─── Types ────────────────────────────────────────────────────

interface ModuleRecord {
  code:     string
  name:     string
  credits:  number
  year:     number  // year of study when taken
  grade:    number | null  // percentage
  status:   'passed' | 'failed' | 'in_progress' | 'registered'
}

interface AuditConfig {
  degreeCredits:   number  // total required for qualification
  minPassMark:     number  // e.g. 50
  exclusionMark:   number  // e.g. 45
  yearDuration:    number  // e.g. 3 or 4
  nPlusYears:      number  // N+1 or N+2
  currentYear:     number  // student's current year of study
  modules:         ModuleRecord[]
}

const DEFAULT_CONFIG: AuditConfig = {
  degreeCredits: 360,
  minPassMark:   50,
  exclusionMark: 45,
  yearDuration:  3,
  nPlusYears:    1,
  currentYear:   2,
  modules:       [],
}

// ─── GPA calculator ───────────────────────────────────────────
function calcGPA(modules: ModuleRecord[]): { gpa: number; passed: number; failed: number; inProgress: number; creditsEarned: number } {
  const graded  = modules.filter(m => m.grade !== null && (m.status === 'passed' || m.status === 'failed'))
  const passed  = modules.filter(m => m.status === 'passed')
  const failed  = modules.filter(m => m.status === 'failed')
  const inProg  = modules.filter(m => m.status === 'in_progress')

  const gpa = graded.length > 0
    ? graded.reduce((s, m) => s + (m.grade ?? 0) * m.credits, 0) / graded.reduce((s, m) => s + m.credits, 0)
    : 0

  const creditsEarned = passed.reduce((s, m) => s + m.credits, 0)

  return { gpa: Math.round(gpa * 10) / 10, passed: passed.length, failed: failed.length, inProgress: inProg.length, creditsEarned }
}

// ─── Exclusion risk calculator ────────────────────────────────
function calcExclusionRisk(modules: ModuleRecord[], config: AuditConfig): {
  riskLevel: 'safe' | 'watch' | 'warning' | 'critical'
  failedThisYear: number
  atRiskModules: ModuleRecord[]
  nPlusUsed: number
  nPlusRemaining: number
} {
  const yearsStudied  = config.currentYear
  const maxYears      = config.yearDuration + config.nPlusYears
  const nPlusUsed     = Math.max(0, yearsStudied - config.yearDuration)
  const nPlusRemaining = Math.max(0, config.nPlusYears - nPlusUsed)

  const failedThisYear = modules.filter(m => m.status === 'failed' && m.year === config.currentYear).length
  const atRiskModules  = modules.filter(m => m.status === 'in_progress' && m.grade !== null && m.grade < config.exclusionMark + 10)

  let riskLevel: 'safe' | 'watch' | 'warning' | 'critical' = 'safe'
  if (nPlusRemaining === 0 && nPlusUsed > 0) riskLevel = 'critical'
  else if (failedThisYear >= 3 || atRiskModules.length >= 3) riskLevel = 'warning'
  else if (failedThisYear >= 1 || atRiskModules.length >= 1 || nPlusRemaining <= 1) riskLevel = 'watch'

  return { riskLevel, failedThisYear, atRiskModules, nPlusUsed, nPlusRemaining }
}

// ─── Graduation timeline ──────────────────────────────────────
function GraduationTimeline({ config }: { config: AuditConfig }) {
  const now = new Date().getFullYear()
  const years = config.yearDuration + config.nPlusYears
  const startYear = now - config.currentYear + 1

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 14, padding: '16px',
    }}>
      <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.07em', marginBottom: 12 }}>
        GRADUATION TIMELINE
      </div>
      <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', gap: 0 }}>
        {Array.from({ length: years }, (_, i) => {
          const year = startYear + i
          const yearNum = i + 1
          const isCurrent = yearNum === config.currentYear
          const isPast = yearNum < config.currentYear
          const isNPlus = yearNum > config.yearDuration
          const isGraduation = yearNum === config.yearDuration

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {i > 0 && (
                <div style={{
                  width: 28, height: 2,
                  background: isPast || isCurrent ? 'var(--sky, #38BDF8)' : 'var(--border-subtle)',
                }} />
              )}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <div style={{
                  width: isGraduation ? 36 : 28, height: isGraduation ? 36 : 28,
                  borderRadius: '50%',
                  background: isCurrent
                    ? 'var(--sky, #38BDF8)'
                    : isPast
                      ? 'rgba(56,189,248,0.25)'
                      : 'var(--bg-elevated)',
                  border: `2px solid ${isCurrent
                    ? 'var(--sky, #38BDF8)'
                    : isPast
                      ? 'rgba(56,189,248,0.40)'
                      : isNPlus ? 'var(--coral)' : 'var(--border-subtle)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isGraduation ? '0.9rem' : '0.65rem',
                  fontWeight: 700, fontFamily: 'var(--font-mono)',
                  color: isCurrent ? '#000' : isPast ? 'var(--sky, #38BDF8)' : 'var(--text-muted)',
                }}>
                  {isGraduation ? '🎓' : yearNum}
                </div>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {year}
                  {isCurrent && <span style={{ color: 'var(--sky, #38BDF8)' }}> ◀ you</span>}
                  {isNPlus && <span style={{ color: 'var(--coral)' }}> N+</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Module row ───────────────────────────────────────────────
function ModuleRow({ module, minPass }: { module: ModuleRecord; minPass: number }) {
  const STATUS_COLOR: Record<ModuleRecord['status'], string> = {
    passed:      'var(--teal)',
    failed:      'var(--danger)',
    in_progress: 'var(--gold)',
    registered:  'var(--text-muted)',
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 10,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{module.code}</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{module.name}</span>
        </div>
        <div style={{ fontSize: '0.63rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
          {module.credits} credits · Year {module.year}
        </div>
      </div>

      {module.grade !== null && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem',
          color: module.grade >= minPass ? 'var(--teal)' : 'var(--danger)',
        }}>
          {module.grade}%
        </div>
      )}

      <span style={{
        padding: '2px 8px',
        background: `${STATUS_COLOR[module.status]}18`,
        border: `1px solid ${STATUS_COLOR[module.status]}30`,
        borderRadius: 100,
        fontSize: '0.58rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
        color: STATUS_COLOR[module.status], letterSpacing: '0.05em',
      }}>
        {module.status.replace('_', ' ').toUpperCase()}
      </span>
    </div>
  )
}

// ─── Empty / demo state ───────────────────────────────────────
const DEMO_MODULES: ModuleRecord[] = [
  { code: 'CS101', name: 'Intro to Programming',  credits: 16, year: 1, grade: 72, status: 'passed' },
  { code: 'CS102', name: 'Data Structures',        credits: 16, year: 1, grade: 58, status: 'passed' },
  { code: 'MA101', name: 'Calculus I',             credits: 16, year: 1, grade: 44, status: 'failed' },
  { code: 'MA102', name: 'Linear Algebra',         credits: 16, year: 1, grade: 63, status: 'passed' },
  { code: 'CS201', name: 'Algorithms',             credits: 16, year: 2, grade: 55, status: 'passed' },
  { code: 'CS202', name: 'Operating Systems',      credits: 16, year: 2, grade: null, status: 'in_progress' },
  { code: 'MA201', name: 'Calculus II (repeat)',   credits: 16, year: 2, grade: null, status: 'in_progress' },
  { code: 'CS203', name: 'Database Systems',       credits: 16, year: 2, grade: null, status: 'in_progress' },
]

// ─── Main component ───────────────────────────────────────────

export default function GraduationAudit() {
  const modules = useAppStore(s => s.modules)

  const [config, setConfig] = useState<AuditConfig>({
    ...DEFAULT_CONFIG,
    // If we have real modules, use them
    modules: modules.length > 0
      ? modules.map(m => ({
          code: m.code ?? m.module_code ?? 'MOD',
          name: m.name ?? m.module_name,
          credits: m.credits ?? 16,
          year: 2,
          grade: null,
          status: 'in_progress',
        } as ModuleRecord))
      : DEMO_MODULES,
  })

  const stats    = calcGPA(config.modules)
  const excl     = calcExclusionRisk(config.modules, config)
  const totalCreditsRequired = config.degreeCredits
  const creditsPct = totalCreditsRequired > 0 ? Math.round((stats.creditsEarned / totalCreditsRequired) * 100) : 0

  const RISK_COLOR: Record<string, string> = {
    safe:     'var(--teal)',
    watch:    'var(--gold)',
    warning:  'var(--coral)',
    critical: 'var(--danger)',
  }

  // Will I graduate on time?
  const creditsPerYear     = totalCreditsRequired / config.yearDuration
  const creditsRemaining   = totalCreditsRequired - stats.creditsEarned
  const yearsLeft          = config.yearDuration - config.currentYear
  const onTrack            = creditsRemaining <= creditsPerYear * (yearsLeft + 1)
  const graduationYearEst  = new Date().getFullYear() + Math.max(0, yearsLeft)

  const [showModules, setShowModules] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'var(--bg-surface)', border: '1px solid rgba(56,189,248,0.25)',
        borderRadius: 16, padding: '16px 18px',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, var(--sky, #38BDF8), transparent)',
        }} />
        <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--sky, #38BDF8)', letterSpacing: '0.09em', marginBottom: 4 }}>
          GRADUATION AUDIT
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
          Can I graduate on time? 🎓
        </div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
          {onTrack
            ? `On track to graduate ${graduationYearEst}. Keep it up!`
            : `At risk of delaying graduation — ${creditsRemaining} credits still needed.`}
        </div>
      </div>

      {/* Exclusion risk banner */}
      {excl.riskLevel !== 'safe' && (
        <div style={{
          background: `${RISK_COLOR[excl.riskLevel]}12`,
          border: `1px solid ${RISK_COLOR[excl.riskLevel]}40`,
          borderRadius: 12, padding: '12px 14px',
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: RISK_COLOR[excl.riskLevel], marginBottom: 4 }}>
            {excl.riskLevel === 'critical' ? '🚨 EXCLUSION RISK — URGENT' : excl.riskLevel === 'warning' ? '⚠️ Academic Warning' : '👁️ Watch Zone'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {excl.riskLevel === 'critical'
              ? 'You have used all N+ years. Failing any module may trigger academic exclusion. See a student advisor immediately.'
              : excl.riskLevel === 'warning'
                ? `${excl.failedThisYear} module${excl.failedThisYear !== 1 ? 's' : ''} failed this year. ${excl.atRiskModules.length} more at risk. Contact your faculty advisor.`
                : `${excl.nPlusRemaining} N+ year${excl.nPlusRemaining !== 1 ? 's' : ''} remaining. Consider repeating failed modules this semester.`}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Credits earned',  value: `${stats.creditsEarned}/${totalCreditsRequired}`, color: creditsPct >= 75 ? 'var(--teal)' : 'var(--gold)' },
          { label: 'Cumulative avg',  value: `${stats.gpa}%`,  color: stats.gpa >= 60 ? 'var(--teal)' : stats.gpa >= 50 ? 'var(--gold)' : 'var(--danger)' },
          { label: 'Exclusion risk',  value: excl.riskLevel.toUpperCase(), color: RISK_COLOR[excl.riskLevel] },
          { label: 'N+ used/total',   value: `${excl.nPlusUsed}/${config.nPlusYears}`, color: excl.nPlusUsed >= config.nPlusYears ? 'var(--danger)' : 'var(--text-secondary)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 12, padding: '12px 14px',
          }}>
            <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Credit progress bar */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 12, padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Degree progress</span>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--sky, #38BDF8)' }}>{creditsPct}%</span>
        </div>
        <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 100 }}>
          <div style={{
            height: '100%', borderRadius: 100,
            background: creditsPct >= 75 ? 'var(--teal)' : 'var(--sky, #38BDF8)',
            width: `${creditsPct}%`, transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>0</span>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{totalCreditsRequired} credits</span>
        </div>
      </div>

      {/* Timeline */}
      <GraduationTimeline config={config} />

      {/* Module list toggle */}
      <button
        onClick={() => setShowModules(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '12px 14px',
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 12, cursor: 'pointer', textAlign: 'left',
        }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Module record ({config.modules.length})
        </span>
        <span style={{
          fontSize: '0.6rem', color: 'var(--text-muted)',
          transform: showModules ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
        }}>▾</span>
      </button>

      {showModules && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {config.modules.map((m, i) => (
            <ModuleRow key={i} module={m} minPass={config.minPassMark} />
          ))}
          {config.modules.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Add modules via the Study tab → Modules to populate this list.
            </div>
          )}
        </div>
      )}

      {/* Settings */}
      <button
        onClick={() => setShowSettings(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '11px 14px',
          background: 'transparent', border: '1px solid var(--border-subtle)',
          borderRadius: 10, cursor: 'pointer', textAlign: 'left',
        }}>
        <span style={{ fontSize: '0.73rem', color: 'var(--text-tertiary)' }}>⚙️ Audit settings</span>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', transform: showSettings ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>

      {showSettings && (
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 12, padding: '16px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {[
            { label: 'Total degree credits',    key: 'degreeCredits',  min: 120, max: 600, step: 16 },
            { label: 'Current year of study',   key: 'currentYear',    min: 1,   max: 7,   step: 1  },
            { label: 'Degree duration (years)', key: 'yearDuration',   min: 2,   max: 6,   step: 1  },
            { label: 'N+ years allowed',        key: 'nPlusYears',     min: 1,   max: 3,   step: 1  },
            { label: 'Minimum pass mark (%)',   key: 'minPassMark',    min: 40,  max: 60,  step: 5  },
            { label: 'Exclusion mark (%)',      key: 'exclusionMark',  min: 40,  max: 55,  step: 5  },
          ].map(f => (
            <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>{f.label}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="range"
                  min={f.min} max={f.max} step={f.step}
                  value={config[f.key as keyof AuditConfig] as number}
                  onChange={e => setConfig(c => ({ ...c, [f.key]: parseInt(e.target.value) }))}
                  style={{ width: 90, accentColor: 'var(--sky, #38BDF8)' }}
                />
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--sky, #38BDF8)', minWidth: 32 }}>
                  {config[f.key as keyof AuditConfig] as number}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modules.length === 0 && (
        <div style={{
          padding: '10px 14px',
          background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
          borderRadius: 10, fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5,
        }}>
          💡 Using demo data. Add your real modules in Study → Modules for an accurate audit.
        </div>
      )}
    </div>
  )
}
