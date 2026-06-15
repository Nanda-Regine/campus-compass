'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { saveWellnessCheckin } from '@/lib/db/wellness'
import { dispatchXP } from '@/lib/xp-engine'
import { signals } from '@/store/signals'
import type { CheckIn } from '@/lib/db/wellness'

interface RiskBand {
  max: number
  label: string
  color: string
  nsLabel: string
}

const BANDS: RiskBand[] = [
  { max: 25,  label: 'Thriving',  color: '#4ecf9e', nsLabel: 'Regulated' },
  { max: 50,  label: 'Balanced',  color: '#7090d0', nsLabel: 'Balanced'  },
  { max: 70,  label: 'Strained',  color: '#fbbf24', nsLabel: 'Stressed'  },
  { max: 85,  label: 'At risk',   color: '#fb923c', nsLabel: 'Stressed'  },
  { max: 100, label: 'Burnt out', color: '#f87171', nsLabel: 'Depleted'  },
]

function getBand(score: number): RiskBand {
  return BANDS.find(b => score <= b.max) ?? BANDS[BANDS.length - 1]
}

function calcBurnout(c: CheckIn): number {
  const avgPositive = (c.sleep + c.social + c.energy + c.motivation) / 4
  const posScore = ((5 - avgPositive) / 4) * 80
  const stressScore = ((c.stress - 1) / 4) * 100
  return Math.round(posScore * 0.6 + stressScore * 0.4)
}

interface Props {
  userId: string
}

export default function NSScore({ userId }: Props) {
  const [checkin, setCheckin] = useState<CheckIn | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [sleep, setSleep] = useState(3)
  const [stress, setStress] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('wellness_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        const c = (data as CheckIn[])?.[0] ?? null
        setCheckin(c)
        setLoading(false)
      })
  }, [userId])

  async function handleCheckin() {
    setSaving(true)
    // Use calcBurnout so the stored score matches what the display dial shows.
    // social and motivation default to 3 (modal only collects sleep/stress/energy).
    const burnout = calcBurnout({ date: today, sleep, stress, energy, social: 3, motivation: 3, score: 0 } as CheckIn)
    const score = Math.max(0, Math.min(100, burnout))
    const { error } = await saveWellnessCheckin({
      date: today,
      sleep,
      stress,
      energy,
      social: 3,
      motivation: 3,
      score,
    })
    if (!error) {
      dispatchXP('wellness_checkin')
      const nsScore = Math.max(0, Math.min(100, 100 - score))
      signals.emit({ type: 'ns_score_updated', payload: { score: nsScore } })
      const supabase = createClient()
      const { data } = await supabase
        .from('wellness_checkins')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
      setCheckin((data as CheckIn[])?.[0] ?? null)
      setShowModal(false)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, minHeight: 180 }}>
        <div style={{ color: '#9ca3af', fontSize: 12 }}>Loading...</div>
      </div>
    )
  }

  const hasToday = checkin?.date === today
  const burnout = checkin ? calcBurnout(checkin) : 50
  const nsScore = 100 - burnout
  const band = getBand(burnout)

  return (
    <>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 16 }}>
        <p style={{ color: '#9ca3af', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>NS Score</p>

        <div className="flex items-center gap-4">
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            border: `4px solid ${band.color}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)', flexShrink: 0,
          }}>
            <span style={{ color: '#e5e7eb', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{nsScore}</span>
            <span style={{ color: band.color, fontSize: 9, fontWeight: 600, marginTop: 2 }}>{band.nsLabel}</span>
          </div>

          <div className="flex flex-col gap-2">
            {checkin ? (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.06)', color: '#9ca3af',
                  }}>Sleep {checkin.sleep}/5</span>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.06)',
                    color: checkin.stress >= 4 ? '#f87171' : '#9ca3af',
                  }}>Stress {checkin.stress >= 4 ? 'High' : checkin.stress <= 2 ? 'Low' : 'Med'}</span>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.06)', color: '#9ca3af',
                  }}>Energy {checkin.energy}/5</span>
                </div>
                {!hasToday && (
                  <p style={{ color: '#6b7280', fontSize: 11 }}>Last checked: {checkin.date}</p>
                )}
              </>
            ) : (
              <p style={{ color: '#9ca3af', fontSize: 13 }}>No check-in yet today</p>
            )}
            {!hasToday && (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: '6px 14px', background: 'rgba(167,139,250,0.15)',
                  border: '1px solid rgba(167,139,250,0.3)', borderRadius: 8,
                  color: '#a78bfa', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Check In
              </button>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 360 }}
            onClick={e => e.stopPropagation()}
          >
            <p style={{ color: '#e5e7eb', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Quick Check-In</p>

            {([
              { label: 'Sleep quality', value: sleep, set: setSleep },
              { label: 'Stress level', value: stress, set: setStress },
              { label: 'Energy level', value: energy, set: setEnergy },
            ] as { label: string; value: number; set: (v: number) => void }[]).map(({ label, value, set }) => (
              <div key={label} style={{ marginBottom: 20 }}>
                <div className="flex justify-between mb-1">
                  <span style={{ color: '#9ca3af', fontSize: 13 }}>{label}</span>
                  <span style={{ color: '#a78bfa', fontSize: 13, fontWeight: 600 }}>{value}/5</span>
                </div>
                <input
                  type="range" min={1} max={5} value={value}
                  onChange={e => set(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#a78bfa' }}
                />
                <div className="flex justify-between">
                  <span style={{ color: '#6b7280', fontSize: 10 }}>Low</span>
                  <span style={{ color: '#6b7280', fontSize: 10 }}>High</span>
                </div>
              </div>
            ))}

            <button
              onClick={handleCheckin}
              disabled={saving}
              style={{
                width: '100%', padding: '12px 0',
                background: saving ? 'rgba(167,139,250,0.3)' : '#a78bfa',
                border: 'none', borderRadius: 12, color: '#fff',
                fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save Check-In'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
