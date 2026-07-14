import type { Metadata } from 'next'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Guardian View — VarsityOS',
  description: 'A real-time student progress summary shared by your student.',
}

interface GuardianData {
  guardianLabel: string
  firstName: string
  emoji: string
  university: string | null
  yearOfStudy: string | null
  streakDays: number
  studyHoursThisWeek: number
  academicRisk: 'safe' | 'watch' | 'critical'
  budgetHealth: 'good' | 'watch' | 'tight' | 'unknown'
  upcomingExams: { name: string; date: string; module: string | null; daysAway: number }[]
  overdueTaskCount: number
  generatedAt: string
}

async function fetchGuardianData(token: string): Promise<GuardianData | null> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://varsityos.co.za'
    const res = await fetch(`${base}/api/guardian/${token}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

const RISK_COLORS = {
  safe:     { bg: 'rgba(78,207,158,0.1)', border: 'rgba(78,207,158,0.25)', text: '#4ecf9e', label: 'On track' },
  watch:    { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  text: '#f59e0b', label: 'Needs attention' },
  critical: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', text: '#f87171', label: 'Action required' },
}

const BUDGET_COLORS = {
  good:    { text: '#4ecf9e', label: 'Managing well' },
  watch:   { text: '#f59e0b', label: 'Watch spending' },
  tight:   { text: '#f87171', label: 'Tight budget' },
  unknown: { text: '#6b7280', label: 'Not set up' },
}

export default async function GuardianPage({ params }: { params: { token: string } }) {
  const data = await fetchGuardianData(params.token)

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', background: '#080f0e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔗</div>
          <h1 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Link not found or expired</h1>
          <p style={{ color: '#fff', fontSize: '0.875rem', lineHeight: 1.6 }}>
            This guardian link may have expired or been revoked by the student. Ask them to generate a new one from their VarsityOS profile.
          </p>
        </div>
      </div>
    )
  }

  const riskStyle  = RISK_COLORS[data.academicRisk]
  const budgetStyle = BUDGET_COLORS[data.budgetHealth]
  const updatedTime = new Date(data.generatedAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ minHeight: '100vh', background: '#080f0e', fontFamily: 'system-ui, sans-serif', color: '#fff' }}>
      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Image src="/favicon.jpg" alt="VarsityOS" width={28} height={28} style={{ borderRadius: 8 }} />
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>VarsityOS</div>
          <div style={{ fontSize: '0.6rem', color: '#4ecf9e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Guardian View</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.6rem', color: '#fff', fontFamily: 'monospace' }}>
          Updated {updatedTime}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 80px' }}>
        {/* Student hero */}
        <div style={{ background: 'rgba(78,207,158,0.06)', border: '1px solid rgba(78,207,158,0.15)', borderRadius: 20, padding: '24px 20px', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #0d2b24, #1a4a3a)', border: '2px solid rgba(78,207,158,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '1.5rem' }}>
            {data.emoji}
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>{data.firstName}</div>
          {data.university && (
            <div style={{ fontSize: '0.78rem', color: '#fff', marginBottom: 2 }}>{data.university}</div>
          )}
          {data.yearOfStudy && (
            <div style={{ fontSize: '0.72rem', color: '#4ecf9e', fontFamily: 'monospace' }}>Year {data.yearOfStudy}</div>
          )}
        </div>

        {/* Key stats — 2×2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {/* Streak */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px 14px' }}>
            <div style={{ fontSize: '0.6rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'monospace' }}>Study streak</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: data.streakDays > 0 ? '#f59e0b' : 'rgba(255,255,255,0.3)', lineHeight: 1 }}>
              {data.streakDays > 0 ? `${data.streakDays}🔥` : '—'}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#fff', marginTop: 4 }}>
              {data.streakDays > 0 ? 'consecutive days' : 'not started yet'}
            </div>
          </div>

          {/* Study hours */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px 14px' }}>
            <div style={{ fontSize: '0.6rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'monospace' }}>Study this week</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: data.studyHoursThisWeek >= 7 ? '#4ecf9e' : data.studyHoursThisWeek >= 3 ? '#f59e0b' : 'rgba(255,255,255,0.3)', lineHeight: 1 }}>
              {data.studyHoursThisWeek > 0 ? `${data.studyHoursThisWeek}h` : '—'}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#fff', marginTop: 4 }}>
              {data.studyHoursThisWeek >= 7 ? 'great pace' : data.studyHoursThisWeek >= 3 ? 'building momentum' : 'just getting started'}
            </div>
          </div>

          {/* Academic risk */}
          <div style={{ background: riskStyle.bg, border: `1px solid ${riskStyle.border}`, borderRadius: 16, padding: '16px 14px' }}>
            <div style={{ fontSize: '0.6rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'monospace' }}>Academic</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: riskStyle.text }}>{riskStyle.label}</div>
            <div style={{ fontSize: '0.65rem', color: '#fff', marginTop: 4 }}>
              {data.overdueTaskCount > 0 ? `${data.overdueTaskCount} overdue task${data.overdueTaskCount > 1 ? 's' : ''}` : 'All tasks on schedule'}
            </div>
          </div>

          {/* Budget health */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px 14px' }}>
            <div style={{ fontSize: '0.6rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'monospace' }}>Budget</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: budgetStyle.text }}>{budgetStyle.label}</div>
            <div style={{ fontSize: '0.65rem', color: '#fff', marginTop: 4 }}>this month</div>
          </div>
        </div>

        {/* Upcoming exams */}
        {data.upcomingExams.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px 14px', marginBottom: 20 }}>
            <div style={{ fontSize: '0.65rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontFamily: 'monospace' }}>
              Upcoming exams (next 14 days)
            </div>
            {data.upcomingExams.map((exam, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBlock: 8, borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: exam.daysAway <= 3 ? 'rgba(248,113,113,0.1)' : exam.daysAway <= 7 ? 'rgba(245,158,11,0.1)' : 'rgba(56,189,248,0.1)',
                  border: `1px solid ${exam.daysAway <= 3 ? 'rgba(248,113,113,0.2)' : exam.daysAway <= 7 ? 'rgba(245,158,11,0.2)' : 'rgba(56,189,248,0.2)'}`,
                  fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 700,
                  color: exam.daysAway <= 3 ? '#f87171' : exam.daysAway <= 7 ? '#f59e0b' : '#38bdf8',
                }}>
                  {exam.daysAway}d
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{exam.name}</div>
                  {exam.module && <div style={{ fontSize: '0.65rem', color: '#fff' }}>{exam.module}</div>}
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#fff', fontFamily: 'monospace' }}>
                  {new Date(exam.date + 'T12:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer note */}
        <div style={{ textAlign: 'center', padding: '0 8px' }}>
          <p style={{ fontSize: '0.68rem', color: '#fff', lineHeight: 1.6 }}>
            This dashboard is shared by {data.firstName} through VarsityOS. Financial amounts are never shown here. Data refreshes in real-time as {data.firstName} uses the app.
          </p>
          <p style={{ fontSize: '0.6rem', color: '#fff', marginTop: 8 }}>
            VarsityOS · Built for South African students · varsityos.co.za
          </p>
        </div>
      </div>
    </div>
  )
}
