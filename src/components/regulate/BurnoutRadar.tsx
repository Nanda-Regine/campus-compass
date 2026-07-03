'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { CheckIn } from '@/lib/db/wellness'

interface RiskBand {
  max: number
  label: string
  color: string
}

const RISK_BANDS: RiskBand[] = [
  { max: 25,  label: 'Thriving',  color: '#4ecf9e' },
  { max: 50,  label: 'Balanced',  color: '#7090d0' },
  { max: 70,  label: 'Strained',  color: '#fbbf24' },
  { max: 85,  label: 'At risk',   color: '#fb923c' },
  { max: 100, label: 'Burnt out', color: '#f87171' },
]

function getBand(score: number): RiskBand {
  return RISK_BANDS.find(b => score <= b.max) ?? RISK_BANDS[RISK_BANDS.length - 1]
}

function calcScore(c: CheckIn): number {
  const avgPositive = (c.sleep + c.social + c.energy + c.motivation) / 4
  const posScore = ((5 - avgPositive) / 4) * 100
  const stressScore = ((c.stress - 1) / 4) * 100
  return Math.round(posScore * 0.6 + stressScore * 0.4)
}

interface Props {
  userId: string
}

export default function BurnoutRadar({ userId }: Props) {
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('wellness_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(14)
      .then(({ data }) => {
        setCheckins((data as CheckIn[]) ?? [])
        setLoading(false)
      })
  }, [userId])

  if (loading) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, minHeight: 200 }}>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Loading...</div>
      </div>
    )
  }

  if (checkins.length === 0) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 16 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Burnout Radar</p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No data yet — complete a wellness check-in</p>
        <Link href="/study?tab=wellness" style={{ color: '#a78bfa', fontSize: 12 }}>Go to Wellness →</Link>
      </div>
    )
  }

  const scores = checkins.map(calcScore)
  const todayScore = scores[0]
  const band = getBand(todayScore)

  let trend: 'improving' | 'stable' | 'declining' = 'stable'
  if (scores.length >= 6) {
    const recent = (scores[0] + scores[1] + scores[2]) / 3
    const prior  = (scores[3] + scores[4] + scores[5]) / 3
    if (recent - prior <= -5) trend = 'improving'
    else if (recent - prior >= 5) trend = 'declining'
  }

  const trendIcon  = trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→'
  const trendColor = trend === 'improving' ? '#4ecf9e' : trend === 'declining' ? '#f87171' : '#9ca3af'

  const maxScore = Math.max(...scores, 1)
  const sparkScores = [...scores].reverse()

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 16 }}>
      <p style={{ color: 'var(--text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Burnout Radar</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            border: `4px solid ${band.color}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)',
          }}>
            <span style={{ color: '#e5e7eb', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{todayScore}</span>
            <span style={{ color: band.color, fontSize: 9, fontWeight: 600, marginTop: 2 }}>{band.label}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: trendColor, fontSize: 16, fontWeight: 700 }}>{trendIcon}</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{trend}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 22, overflow: 'hidden' }}>
            {sparkScores.slice(-10).map((s, i) => {
              const b = getBand(s)
              const h = Math.max(3, Math.round((s / maxScore) * 22))
              return (
                <div key={i} style={{ width: 5, height: h, background: b.color, borderRadius: 2, flexShrink: 0 }} />
              )
            })}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 10 }}>Last {sparkScores.length} check-ins</p>
        </div>
      </div>

      {todayScore > 60 && (
        <Link
          href="/regulate"
          style={{
            display: 'block', marginTop: 12, textAlign: 'center', padding: '8px 0',
            background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
            borderRadius: 8, color: '#a78bfa', fontSize: 13, fontWeight: 600,
          }}
        >
          Open Regulation Room →
        </Link>
      )}
    </div>
  )
}
