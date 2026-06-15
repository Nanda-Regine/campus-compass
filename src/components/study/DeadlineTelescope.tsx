'use client'

// DeadlineTelescope — shows nearest exam and 3 study scenarios.
// "Start today = 45 min/day. Start Friday = 3 hrs/day."
// Research: making procrastination costs concrete reduces delay.

import { useMemo } from 'react'
import type { Exam } from '@/types'

const STUDY_HOURS_NEEDED = 20  // baseline hours needed per exam unit; adjustable

interface Props { exams: Exam[] }

interface Scenario {
  label:    string
  daysLeft: number
  hrsPerDay: number
  warning?: boolean
  danger?: boolean
}

function buildScenarios(daysUntilExam: number): Scenario[] {
  // Hours needed: 20h total minus what's been done (we don't track that, so use fixed 20h)
  const needed = STUDY_HOURS_NEEDED
  const offsets = [0, 3, 7]
  return offsets.map(offset => {
    const daysLeft = Math.max(1, daysUntilExam - offset)
    const hrsPerDay = needed / daysLeft
    return {
      label:    offset === 0 ? 'Start today' : `Start in ${offset} days`,
      daysLeft,
      hrsPerDay: Math.round(hrsPerDay * 10) / 10,
      warning:  hrsPerDay > 3,
      danger:   hrsPerDay > 6,
    }
  })
}

function getNearest(exams: Exam[]): { exam: Exam; daysLeft: number } | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcoming = exams
    .map(e => ({ exam: e, daysLeft: Math.ceil((new Date(e.exam_date).getTime() - today.getTime()) / 86_400_000) }))
    .filter(({ daysLeft }) => daysLeft > 0 && daysLeft <= 21)
    .sort((a, b) => a.daysLeft - b.daysLeft)
  return upcoming[0] ?? null
}

export default function DeadlineTelescope({ exams }: Props) {
  const nearest = useMemo(() => getNearest(exams), [exams])

  if (!nearest) return null

  const { exam, daysLeft } = nearest
  const scenarios = buildScenarios(daysLeft)
  const urgencyColor = daysLeft <= 3 ? '#ff6b6b' : daysLeft <= 7 ? '#f59e0b' : '#4ecf9e'
  const moduleName = exam.module?.module_name ?? exam.exam_name

  return (
    <div style={{
      borderRadius: 18, padding: '16px 18px',
      border: `1px solid ${urgencyColor}25`,
      background: `linear-gradient(145deg, ${urgencyColor}06 0%, rgba(0,0,0,0) 70%)`,
    }}>
      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: urgencyColor, letterSpacing: '0.18em', marginBottom: 10 }}>
        🔭 DEADLINE TELESCOPE
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, color: '#fff', lineHeight: 1.3 }}>
            {exam.exam_name}
          </div>
          {moduleName !== exam.exam_name && (
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
              {moduleName}
            </div>
          )}
        </div>
        <div style={{
          fontFamily: '"JetBrains Mono",monospace', fontWeight: 700,
          fontSize: 22, color: urgencyColor, lineHeight: 1,
          textShadow: `0 0 16px ${urgencyColor}66`,
        }}>
          {daysLeft}d
        </div>
      </div>

      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 10, letterSpacing: '0.12em' }}>
        STUDY SCENARIOS ({STUDY_HOURS_NEEDED}h total needed)
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {scenarios.map((s, i) => {
          const color = s.danger ? '#ff6b6b' : s.warning ? '#f59e0b' : '#4ecf9e'
          const barWidth = Math.min(100, (s.hrsPerDay / 8) * 100)
          const isFirst = i === 0
          return (
            <div key={i} style={{
              borderRadius: 10, padding: '10px 12px',
              background: isFirst ? `${color}10` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isFirst ? color + '30' : 'rgba(255,255,255,0.06)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: isFirst ? color : 'rgba(255,255,255,0.45)' }}>
                  {s.label}
                </div>
                <div style={{
                  fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14,
                  color, display: 'flex', alignItems: 'baseline', gap: 2,
                }}>
                  {s.hrsPerDay}
                  <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>
                    {' '}hrs/day
                  </span>
                </div>
              </div>
              <div style={{ height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${barWidth}%`, borderRadius: 3,
                  background: color,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {scenarios[0].hrsPerDay <= 1.5 && (
        <div style={{
          marginTop: 12, fontFamily: '"JetBrains Mono",monospace', fontSize: 9,
          color: '#4ecf9e', textAlign: 'center', letterSpacing: '0.08em',
        }}>
          ✦ You have time — but start TODAY.
        </div>
      )}
      {scenarios[0].danger && (
        <div style={{
          marginTop: 12, fontFamily: '"JetBrains Mono",monospace', fontSize: 9,
          color: '#ff6b6b', textAlign: 'center', letterSpacing: '0.08em',
          animation: 'none',
        }}>
          🚨 Critical — this needs to start now.
        </div>
      )}
    </div>
  )
}
