'use client'

import { useState } from 'react'

/* ── Types ──────────────────────────────────────────────────── */
interface OutcomeData {
  employment_rate: number
  median_salary: number
  top_employers: string[]
  months_to_job: number
}

type OutcomesDB = Record<string, Record<string, OutcomeData>>

/* ── Data ───────────────────────────────────────────────────── */
const OUTCOMES_DATA: OutcomesDB = {
  'UCT': {
    'BCom (Accounting)': {
      employment_rate: 92,
      median_salary: 24000,
      top_employers: ['PwC', 'Deloitte', 'KPMG'],
      months_to_job: 3,
    },
    'BCom (Finance)': {
      employment_rate: 89,
      median_salary: 21000,
      top_employers: ['ABSA', 'FNB', 'Standard Bank'],
      months_to_job: 4,
    },
    'Computer Science': {
      employment_rate: 94,
      median_salary: 28000,
      top_employers: ['Google', 'Naspers', 'Offerzen'],
      months_to_job: 2,
    },
    'Engineering (Civil)': {
      employment_rate: 87,
      median_salary: 25000,
      top_employers: ['SMEC', 'WSP', 'Aurecon'],
      months_to_job: 4,
    },
    'Law (LLB)': {
      employment_rate: 82,
      median_salary: 18000,
      top_employers: ['ENSafrica', 'Webber Wentzel', 'Bowmans'],
      months_to_job: 6,
    },
  },
  'University of the Witwatersrand (Wits)': {
    'BCom (Accounting)': {
      employment_rate: 90,
      median_salary: 23000,
      top_employers: ['EY', 'PwC', 'ABSA'],
      months_to_job: 3,
    },
    'Computer Science': {
      employment_rate: 93,
      median_salary: 27000,
      top_employers: ['Amazon', 'BCX', 'Discovery'],
      months_to_job: 2,
    },
    'Engineering (Electrical)': {
      employment_rate: 88,
      median_salary: 28000,
      top_employers: ['Eskom', 'Siemens', 'ABB'],
      months_to_job: 4,
    },
    'Medicine (MBBCh)': {
      employment_rate: 99,
      median_salary: 35000,
      top_employers: ['NHLS', 'Private Practice', 'Groote Schuur'],
      months_to_job: 1,
    },
  },
  'Stellenbosch University (SU)': {
    'BCom (General)': {
      employment_rate: 86,
      median_salary: 20000,
      top_employers: ['Discovery', 'Old Mutual', 'Sanlam'],
      months_to_job: 4,
    },
    'Engineering (Mechanical)': {
      employment_rate: 89,
      median_salary: 27000,
      top_employers: ['Anglo American', 'ArcelorMittal', 'Sasol'],
      months_to_job: 3,
    },
    'Computer Science': {
      employment_rate: 92,
      median_salary: 26000,
      top_employers: ['Synthesis', 'Ubusha', 'Amazon'],
      months_to_job: 2,
    },
  },
  'Tshwane University of Technology (TUT)': {
    'Engineering (Civil)': {
      employment_rate: 82,
      median_salary: 22000,
      top_employers: ['SANRAL', 'Aurecon', 'WSP'],
      months_to_job: 5,
    },
    'Information Technology': {
      employment_rate: 85,
      median_salary: 20000,
      top_employers: ['BCX', 'Dimension Data', 'Telkom'],
      months_to_job: 4,
    },
    'Business Management': {
      employment_rate: 75,
      median_salary: 16000,
      top_employers: ['Massmart', 'Pick n Pay', 'Shoprite'],
      months_to_job: 5,
    },
  },
}

const INSTITUTION_LIST = Object.keys(OUTCOMES_DATA)

/* ── Salary calculator helpers ──────────────────────────────── */
function calcSavings(monthlySalary: number, savingRate: number, years: number): number {
  const monthlyAmount = monthlySalary * (savingRate / 100)
  const monthlyRate = 0.05 / 12 // 5% annual interest rate
  const n = years * 12
  return monthlyAmount * ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate)
}

function formatRand(amount: number): string {
  return `R${Math.round(amount).toLocaleString('en-ZA')}`
}

/* ── Employment rate gauge ──────────────────────────────────── */
function EmploymentGauge({ rate }: { rate: number }) {
  const size = 80
  const r = 30
  const circumference = Math.PI * r // half circle
  const offset = circumference * (1 - rate / 100)
  const color = rate >= 90 ? '#34d399' : rate >= 80 ? '#f59e0b' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: size, height: size / 2 + 10 }}>
        <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
          {/* Background arc */}
          <path
            d={`M 10 ${size / 2} A ${r} ${r} 0 0 1 ${size - 10} ${size / 2}`}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={8}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d={`M 10 ${size / 2} A ${r} ${r} 0 0 1 ${size - 10} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          textAlign: 'center',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 18, fontWeight: 700, color,
        }}>
          {rate}%
        </div>
      </div>
      <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>Employment rate</div>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────── */
export default function GraduateOutcomes() {
  const [selectedInstitution, setSelectedInstitution] = useState<string>('')
  const [selectedDegree, setSelectedDegree] = useState<string>('')
  const [savingRate, setSavingRate] = useState<number>(15)
  const [years, setYears] = useState<number>(3)

  const availableDegrees = selectedInstitution ? Object.keys(OUTCOMES_DATA[selectedInstitution] ?? {}) : []
  const outcomeData = selectedInstitution && selectedDegree ? OUTCOMES_DATA[selectedInstitution]?.[selectedDegree] : null

  const handleInstitutionChange = (inst: string) => {
    setSelectedInstitution(inst)
    setSelectedDegree('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Institution selector */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 10, fontWeight: 600 }}>
          Select Institution
        </div>
        <select
          value={selectedInstitution}
          onChange={e => handleInstitutionChange(e.target.value)}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 10,
            padding: '10px 12px',
            color: selectedInstitution ? '#e5e7eb' : '#9ca3af',
            fontSize: 13,
            outline: 'none',
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
        >
          <option value="" disabled style={{ background: '#0a0a0f' }}>Choose a university…</option>
          {INSTITUTION_LIST.map(inst => (
            <option key={inst} value={inst} style={{ background: '#0a0a0f' }}>{inst}</option>
          ))}
        </select>
      </div>

      {/* Degree selector */}
      {selectedInstitution && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 10, fontWeight: 600 }}>
            Select Degree
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {availableDegrees.map(deg => (
              <button
                key={deg}
                onClick={() => setSelectedDegree(deg)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: `1px solid ${selectedDegree === deg ? 'rgba(129,140,248,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  background: selectedDegree === deg ? 'rgba(129,140,248,0.08)' : 'rgba(255,255,255,0.02)',
                  color: selectedDegree === deg ? '#818cf8' : '#e5e7eb',
                  fontSize: 13,
                  fontWeight: selectedDegree === deg ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                {deg}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Outcomes card */}
      {outcomeData && (
        <>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: '18px 16px',
          }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 14, fontWeight: 600 }}>
              Graduate Outcomes
            </div>

            {/* Top row: gauge + key metrics */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
              <EmploymentGauge rate={outcomeData.employment_rate} />

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Median salary */}
                <div style={{
                  background: 'rgba(129,140,248,0.06)',
                  border: '0.5px solid rgba(129,140,248,0.15)',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}>
                  <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Median starting salary</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: '#818cf8' }}>
                    R{outcomeData.median_salary.toLocaleString('en-ZA')}<span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>/mo</span>
                  </div>
                </div>

                {/* Months to job */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '0.5px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>Avg. months to first job</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: '#e5e7eb' }}>
                    {outcomeData.months_to_job}
                  </div>
                </div>
              </div>
            </div>

            {/* Top employers */}
            <div>
              <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 600 }}>Top employers</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {outcomeData.top_employers.map(emp => (
                  <span
                    key={emp}
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 9999,
                      background: 'rgba(129,140,248,0.08)',
                      border: '0.5px solid rgba(129,140,248,0.2)',
                      color: '#818cf8',
                      fontWeight: 500,
                    }}
                  >
                    {emp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Salary calculator */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: '16px',
          }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 14, fontWeight: 600 }}>
              Savings Calculator
            </div>

            <div style={{ fontSize: 13, color: '#e5e7eb', marginBottom: 14, lineHeight: 1.6 }}>
              At <strong style={{ color: '#818cf8' }}>R{outcomeData.median_salary.toLocaleString('en-ZA')}/month</strong>, here is what you could save:
            </div>

            {/* Saving rate control */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Monthly saving rate</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: '#818cf8' }}>{savingRate}%</div>
              </div>
              <input
                type="range"
                min={5}
                max={40}
                step={5}
                value={savingRate}
                onChange={e => setSavingRate(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#818cf8', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                <span>5%</span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                  = {formatRand(outcomeData.median_salary * savingRate / 100)}/mo
                </span>
                <span>40%</span>
              </div>
            </div>

            {/* Year toggle */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Show savings over:</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 3, 5].map(y => (
                  <button
                    key={y}
                    onClick={() => setYears(y)}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      borderRadius: 8,
                      border: `1px solid ${years === y ? 'rgba(129,140,248,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      background: years === y ? 'rgba(129,140,248,0.12)' : 'rgba(255,255,255,0.02)',
                      color: years === y ? '#818cf8' : '#9ca3af',
                      fontSize: 12,
                      fontWeight: years === y ? 700 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {y} {y === 1 ? 'year' : 'years'}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[1, 3, 5].filter(y => y <= years + 1).map(y => {
                const savings = calcSavings(outcomeData.median_salary, savingRate, y)
                const isSelected = y === years
                return (
                  <div
                    key={y}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: isSelected ? 'rgba(129,140,248,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `0.5px solid ${isSelected ? 'rgba(129,140,248,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ fontSize: 12, color: isSelected ? '#e5e7eb' : '#9ca3af' }}>
                      After {y} {y === 1 ? 'year' : 'years'} <span style={{ fontSize: 10, color: '#9ca3af' }}>(5% p.a.)</span>
                    </div>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: isSelected ? 16 : 13,
                      fontWeight: 700,
                      color: isSelected ? '#818cf8' : '#9ca3af',
                    }}>
                      {formatRand(savings)}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: 12, fontSize: 10, color: '#9ca3af', lineHeight: 1.6 }}>
              Saving {savingRate}% = {formatRand(outcomeData.median_salary * savingRate / 100)}/month put into savings at 5% annual interest (compound monthly). After {outcomeData.months_to_job} months of job searching, you could have {formatRand(outcomeData.median_salary * savingRate / 100 * outcomeData.months_to_job)} saved before your first paycheque.
            </div>
          </div>

          {/* Disclaimer */}
          <p style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.6, margin: 0, textAlign: 'center' }}>
            Data is indicative only based on publicly available SA graduate market surveys (2023-2024). Individual outcomes vary significantly based on academic performance, experience, and economic conditions. Employment rates and salaries are approximations.
          </p>
        </>
      )}

      {/* Empty state */}
      {!selectedInstitution && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 16,
          padding: '32px 20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🎓</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', marginBottom: 6 }}>Graduate Outcomes Explorer</div>
          <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
            Select your institution above to see employment rates, median starting salaries, and top employers for your degree.
          </div>
        </div>
      )}

      {selectedInstitution && !selectedDegree && availableDegrees.length > 0 && (
        <div style={{
          background: 'rgba(129,140,248,0.04)',
          border: '1px solid rgba(129,140,248,0.12)',
          borderRadius: 12,
          padding: '14px 16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            Select your degree above to see outcomes data.
          </div>
        </div>
      )}
    </div>
  )
}
