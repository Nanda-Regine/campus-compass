'use client'

import { type Exam } from '@/types'
import { fmt, getDaysUntil } from '@/lib/utils'
import { ShareButton } from '@/components/ui/ShareButton'

export default function ExamCountdownCard({ exams }: { exams: Exam[] }) {
  const next = exams[0]
  if (!next) return null
  const days = getDaysUntil(next.exam_date)
  const urgencyColor = days <= 1 ? '#ff6b6b' : days <= 3 ? '#c9a84c' : '#7090d0'

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '16px 16px 16px 20px', position: 'relative', overflow: 'hidden' }}>
      <span style={{ position: 'absolute', left: 0, top: 16, bottom: 16, width: 2, background: '#7090d0', borderRadius: '0 1px 1px 0' }} />
      <span style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 20%,rgba(112,144,208,0.06) 0%,transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Next Exam</div>
        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 14, color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {next.exam_name}
        </div>
        {next.module && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', marginTop: 2 }}>{next.module.module_name}</div>}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 4 }}>
          {fmt.dateFull(next.exam_date)}{next.start_time && ` · ${fmt.time(next.start_time)}`}{next.venue && ` · ${next.venue}`}
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            {days < 0 ? (
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 48, fontWeight: 700, color: 'rgba(255,255,255,0.18)', lineHeight: 1 }}>✓</div>
            ) : days === 0 ? (
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 28, fontWeight: 700, color: '#ff6b6b', lineHeight: 1 }}>TODAY</div>
            ) : (
              <div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 48, fontWeight: 700, color: urgencyColor, lineHeight: 1, textShadow: `0 0 30px ${urgencyColor}50` }}>{days}</div>
                <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>DAYS</div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {exams.length > 1 && (
              <div style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: 'rgba(112,144,208,0.1)', color: '#7090d0', border: '0.5px solid rgba(112,144,208,0.25)' }}>+{exams.length - 1} more</div>
            )}
            {days > 0 && (
              <ShareButton
                variant="icon"
                context="exam_countdown"
                title="Exam Countdown"
                text={`My ${next.exam_name} exam is in ${days} day${days !== 1 ? 's' : ''}! 📚 Studying hard with VarsityOS`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
