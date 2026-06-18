'use client'

import Link from 'next/link'
import { type Profile, type Task, type Exam, type TimetableEntry, type Subscription } from '@/types'
import { ShareButton } from '@/components/ui/ShareButton'
import DayModeBanner, { getDayMode } from '@/components/dashboard/DayModeBanner'
import { AmbientImage } from '@/components/ui/AmbientImage'
import { DASH_THEME, MODE_LABEL } from '../dashboardHelpers'

export default function OSCommandHero({ timetable, tasks, exams, hour, firstName, profile, subscription, checkinMessage }: {
  timetable: TimetableEntry[]
  tasks: Task[]
  exams: Exam[]
  hour: number
  firstName: string
  profile: Profile
  subscription: Subscription | null
  checkinMessage: string | null
}) {
  const mode   = getDayMode(hour)
  const theme  = DASH_THEME[mode]
  const meta   = MODE_LABEL[mode]
  const isUnlimited = profile.subscription_tier === 'nova_unlimited'
  const novaLeft    = Math.max(0, (profile.nova_messages_limit ?? 10) - (profile.nova_messages_used ?? 0))
  void subscription

  return (
    <div
      className="dash-card-in"
      style={{ borderRadius: 20, border: `1px solid ${theme.border}`, overflow: 'hidden', position: 'relative' }}
    >
      {/* Background gradient */}
      <div style={{ position: 'absolute', inset: 0, background: theme.heroBg, zIndex: 0 }} />

      {/* Ambient texture — real image layer, lighter overlay since full-page bg handles depth */}
      <AmbientImage zone="dashboard" opacity={0.35} blurPx={3} saturation={1.6}
        overlayColor="rgba(5,4,12,0.0)" />

      {/* Internal floating orbs */}
      <div
        className="orb-float"
        style={{
          position: 'absolute', top: -60, right: -50, width: 240, height: 240, borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.orb1} 0%, transparent 70%)`,
          filter: 'blur(35px)', pointerEvents: 'none', zIndex: 0,
        }}
      />
      <div
        className="orb-float-r"
        style={{
          position: 'absolute', bottom: -30, left: -30, width: 160, height: 160, borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.orb2} 0%, transparent 70%)`,
          filter: 'blur(24px)', pointerEvents: 'none', zIndex: 0,
        }}
      />

      {/* Top accent line */}
      <div
        className="hero-line-glow"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, ${theme.accent} 0%, ${theme.accent}55 60%, transparent 100%)`,
          zIndex: 1,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, padding: '20px 22px 22px' }}>

        {/* Mode badge row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 12px 5px 9px', borderRadius: 9999,
            background: theme.accentDim, border: `0.5px solid ${theme.accent}45`,
          }}>
            <span style={{ fontSize: 13 }}>{meta.emoji}</span>
            <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.accent }}>
              {meta.label}
            </span>
            <span className="status-live" style={{ width: 5, height: 5, borderRadius: '50%', background: theme.accent, display: 'inline-block', marginLeft: 2 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: 'rgba(255,255,255,0.3)' }}>
              {isUnlimited ? '∞ msgs' : `${novaLeft} left`}
            </span>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `linear-gradient(135deg,${theme.accent} 0%,${theme.accent}99 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, boxShadow: `0 0 16px ${theme.accentGlow}`,
            }}>
              ✦
            </div>
          </div>
        </div>

        {/* Day context strip */}
        <DayModeBanner timetable={timetable} tasks={tasks} exams={exams} hour={hour} firstName={firstName} />
        {mode === 'sleep' && (
          <div style={{ padding: '10px 14px', background: theme.accentDim, border: `0.5px solid ${theme.accent}30`, borderRadius: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Night mode · all systems resting 🌃</span>
          </div>
        )}

        {/* Nova check-in */}
        {checkinMessage && (
          <div style={{
            marginTop: 14, padding: '12px 14px',
            background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.07)',
            borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: 13, color: theme.accent, flexShrink: 0, marginTop: 1 }}>✦</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.accent, marginBottom: 3, fontWeight: 600 }}>
                Nova · Daily check-in
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.62)', lineHeight: 1.6 }}>{checkinMessage}</div>
            </div>
            <ShareButton
              variant="icon"
              context="nova_checkin"
              title="Nova Daily Check-in"
              text={`Nova's message for me today 💜\n"${checkinMessage}"\n\nMy AI study companion on VarsityOS`}
            />
          </div>
        )}

        {/* Action row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <Link href="/nova" style={{ flex: 1, textDecoration: 'none' }}>
            <button style={{
              width: '100%',
              background: `linear-gradient(135deg,${theme.accent} 0%,${theme.accent}cc 100%)`,
              color: '#fff',
              fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13,
              border: 'none', borderRadius: 10, padding: '11px 0',
              cursor: 'pointer',
              boxShadow: `0 4px 22px ${theme.accentGlow}`,
            }}>
              Chat with Nova →
            </button>
          </Link>
          <Link href="/study" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.13)',
              color: 'rgba(255,255,255,0.72)', fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 13,
              borderRadius: 10, padding: '11px 18px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              Study →
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
