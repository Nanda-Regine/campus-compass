'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface RxEntry { id: number; name: string; dose: string; frequency: string; nextRefill: string; instructions: string }

export default function PrescriptionReminderCard() {
  const [meds, setMeds] = useState<RxEntry[]>([])
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('varsityos-prescriptions') || '[]') as RxEntry[]
      setMeds(stored)
    } catch { /* ignore */ }
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const urgent = meds.filter(m => m.nextRefill && m.nextRefill <= tomorrow)
  if (!urgent.length) return null

  return (
    <Link href="/health?tab=prescriptions" style={{ textDecoration: 'none' }}>
      <div className="dash-card-in" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(244,114,182,0.30)', borderRadius: 14, padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,var(--rose),rgba(244,114,182,0.15))' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>💊</span>
            <span style={{ fontSize: 10, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--rose)', fontWeight: 700 }}>Prescription Reminder</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>→</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {urgent.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: 'rgba(244,114,182,0.06)', border: '0.5px solid rgba(244,114,182,0.20)', borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{m.dose} · {m.frequency}</div>
              </div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, fontFamily: 'var(--font-mono)', fontWeight: 700, background: m.nextRefill <= today ? 'rgba(153,27,27,0.10)' : 'rgba(244,114,182,0.10)', color: m.nextRefill <= today ? 'var(--danger)' : 'var(--rose)', border: `0.5px solid ${m.nextRefill <= today ? 'rgba(153,27,27,0.30)' : 'rgba(244,114,182,0.30)'}` }}>
                {m.nextRefill <= today ? 'Overdue' : 'Tomorrow'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}
