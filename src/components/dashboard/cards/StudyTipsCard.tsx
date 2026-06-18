'use client'

import { type Profile, type Exam, type Module } from '@/types'
import { getDaysUntil } from '@/lib/utils'
import { useCachedFetch } from '@/hooks/useCachedFetch'

interface StudyTip { text: string; source: string }

export default function StudyTipsCard({ exam, profile }: { exam: Exam | null; profile: Profile }) {
  const today    = new Date().toISOString().split('T')[0]
  const cacheKey = exam ? `study_tips_${exam.id}_${today}` : null
  const { data: tips, loading } = useCachedFetch<StudyTip[]>(cacheKey, async () => {
    const subject    = (exam?.module as Module | undefined)?.module_name ?? 'General'
    const daysUntil  = Math.max(0, getDaysUntil(exam!.exam_date))
    const r = await fetch('/api/dashboard/study-tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examName: exam?.exam_name ?? (exam as unknown as { name?: string })?.name ?? 'Upcoming exam',
        examSubject: subject, daysUntil,
        degreeProgram: (profile as unknown as { university?: string }).university ?? 'University',
      }),
    })
    const d = r.ok ? await r.json() : null
    return d?.tips ?? null
  })

  if (!exam) return null

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' }}>
      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#9b6fd4 0%,rgba(155,111,212,0.15) 100%)' }} />
      <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9b6fd4', marginBottom: 8, fontWeight: 600 }}>Nova Study Tips</div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 10 }}>
        {(exam.module as Module | undefined)?.module_name ?? ''} · {Math.max(0, getDaysUntil(exam.exam_date))}d to go
      </div>
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[60, 80, 70].map((w, i) => <div key={i} className="skeleton-row" style={{ height: 14, width: `${w}%` }} />)}
        </div>
      )}
      {!loading && tips && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tips.map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 10px', background: 'rgba(155,111,212,0.06)', borderRadius: 8, border: '0.5px solid rgba(155,111,212,0.15)' }}>
              <span style={{ fontSize: 12, flexShrink: 0, color: '#9b6fd4', fontWeight: 700, lineHeight: 1.5 }}>{i + 1}</span>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip.text}</div>
                <div style={{ fontSize: 10, color: 'rgba(155,111,212,0.65)', marginTop: 2 }}>{tip.source}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !tips && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>Tips unavailable</div>
      )}
    </div>
  )
}
