'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { type Exam, type Task, MODULE_COLOURS } from '@/types'
import { getDaysUntil } from '@/lib/utils'
import { loadExamConfidences, saveExamConfidence } from '@/lib/db/exam-confidence'

interface Props {
  exams:          Exam[]
  tasks:          Task[]
  onSwitchToList?: () => void
}

type Grade = 'excellent' | 'good' | 'fair' | 'at-risk' | 'critical'

interface ReadinessResult {
  score:          number
  taskPct:        number
  daysFactor:     number
  confidencePct:  number
  grade:          Grade
  tip:            string
}

const GRADE_META: Record<Grade, { color: string; label: string }> = {
  excellent: { color: '#4ecf9e', label: 'Exam ready'  },
  good:      { color: '#7090d0', label: 'On track'    },
  fair:      { color: '#f59e0b', label: 'Needs focus' },
  'at-risk': { color: '#e8834a', label: 'At risk'     },
  critical:  { color: '#ff6b6b', label: 'Urgent'      },
}

function gradeFromScore(s: number): Grade {
  return s >= 80 ? 'excellent' : s >= 65 ? 'good' : s >= 45 ? 'fair' : s >= 25 ? 'at-risk' : 'critical'
}

function compute(exam: Exam, tasks: Task[], confidence: number): ReadinessResult {
  const days = getDaysUntil(exam.exam_date)

  const moduleTasks = exam.module_id
    ? tasks.filter(t => t.module_id === exam.module_id)
    : []
  const taskPct = moduleTasks.length > 0
    ? (moduleTasks.filter(t => t.status === 'done').length / moduleTasks.length) * 100
    : 50  // no tasks set → neutral

  const daysFactor = days <= 0 ? 0 : Math.min(100, (days / 30) * 100)
  const confidencePct = confidence === 0 ? 50 : ((confidence - 1) / 4) * 100

  const score = Math.round(taskPct * 0.40 + confidencePct * 0.40 + daysFactor * 0.20)
  const grade = gradeFromScore(score)

  const tip =
    days <= 0  ? 'This exam is past.' :
    days <= 2  ? taskPct < 70
               ? 'Complete remaining tasks now — exam is very soon.'
               : 'Review key concepts tonight. You\'re almost there.' :
    days <= 7  ? confidence < 3
               ? 'You feel uncertain — create a focused study schedule this week.'
               : taskPct < 50
               ? 'Catch up on outstanding tasks before the weekend.'
               : 'Keep your current momentum going.' :
    days <= 14 ? taskPct < 40
               ? 'Two weeks left — start working through your backlog now.'
               : 'Good time buffer — use it for deep revision.' :
                 'Plenty of time ahead. Build consistent daily study habits.'

  return { score, taskPct, daysFactor, confidencePct, grade, tip }
}

// ── SVG ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, color, size = 56 }: { score: number; color: string; size?: number }) {
  const r    = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }} />
    </svg>
  )
}

// ── Confidence stars ─────────────────────────────────────────────────────────

function Stars({ examId, value, onChange }: { examId: string; value: number; onChange: (v: number) => void }) {
  const labels = ['Not confident', 'Slightly confident', 'Somewhat confident', 'Confident', 'Very confident']
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(n === value ? 0 : n)} title={labels[n-1]}
          style={{ fontSize: 13, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer',
            opacity: n <= value ? 1 : 0.2, padding: 2, transition: 'opacity 0.15s',
            color: '#f59e0b' }}>
          ★
        </button>
      ))}
    </div>
  )
}

// ── Mini breakdown bar ───────────────────────────────────────────────────────

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex: '1 1 90px', minWidth: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color }}>{Math.round(value)}%</span>
      </div>
      <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
        <div style={{ height: '100%', width: `${Math.min(100, value)}%`, borderRadius: 2, background: color, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ExamReadinessPanel({ exams, tasks, onSwitchToList }: Props) {
  const upcoming = exams.filter(e => getDaysUntil(e.exam_date) >= 0)
  const [confs, setConfs]   = useState<Record<string, number>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    loadExamConfidences().then(dbConfs => {
      setConfs(dbConfs)
      setMounted(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exams])

  function handleConf(id: string, v: number) {
    setConfs(prev => ({ ...prev, [id]: v }))
    saveExamConfidence(id, v).catch(() => {})
  }

  if (!mounted) return null

  if (upcoming.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px 40px' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, margin: 0 }}>
          No upcoming exams
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.7 }}>
          Add your exams to track readiness scores,{'\n'}study countdowns, and AI prep guides.
        </p>
        {onSwitchToList && (
          <button
            onClick={onSwitchToList}
            style={{
              marginTop: 16,
              padding: '9px 20px',
              borderRadius: 10,
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 12,
              background: 'rgba(78,207,158,0.12)',
              border: '1px solid rgba(78,207,158,0.3)',
              color: '#4ecf9e',
              cursor: 'pointer',
            }}
          >
            + Add your first exam
          </button>
        )}
      </div>
    )
  }

  const results = upcoming.map(e => ({ exam: e, result: compute(e, tasks, confs[e.id] ?? 0) }))
  const avgScore = Math.round(results.reduce((s, r) => s + r.result.score, 0) / results.length)
  const avgGrade = gradeFromScore(avgScore)
  const avgMeta  = GRADE_META[avgGrade]

  // Sort ascending — lowest readiness first (needs most attention)
  const sorted = [...results].sort((a, b) => a.result.score - b.result.score)

  const overallBg: CSSProperties = {
    borderRadius: 20, padding: '20px',
    background: `${avgMeta.color}12`,
    border: `0.5px solid ${avgMeta.color}30`,
    display: 'flex', alignItems: 'center', gap: 16,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Overall summary card ── */}
      <div style={overallBg}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ScoreRing score={avgScore} color={avgMeta.color} size={72} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1rem', color: avgMeta.color, lineHeight: 1 }}>
              {avgScore}%
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            Overall readiness
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: avgMeta.color, marginTop: 2 }}>
            {avgMeta.label} · {upcoming.length} exam{upcoming.length === 1 ? '' : 's'} ahead
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.5 }}>
            Rate your ★ confidence below to improve accuracy.
          </div>
        </div>
      </div>

      {/* ── Section label ── */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Lowest readiness first
      </div>

      {/* ── Per-exam cards ── */}
      {sorted.map(({ exam, result }) => {
        const days    = getDaysUntil(exam.exam_date)
        const modCol  = exam.module?.color ? MODULE_COLOURS[exam.module.color] : null
        const meta    = GRADE_META[result.grade]
        const conf    = confs[exam.id] ?? 0

        const daysColor = days <= 3 ? '#ff6b6b' : days <= 7 ? '#f59e0b' : 'var(--text-tertiary)'

        return (
          <div key={exam.id} style={{
            borderRadius: 16, padding: '14px 16px',
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Ring */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <ScoreRing score={result.score} color={meta.color} size={52} />
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontFamily: 'var(--font-display)', fontWeight: 900,
                  fontSize: '0.65rem', color: meta.color, lineHeight: 1, whiteSpace: 'nowrap',
                }}>
                  {result.score}%
                </div>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem',
                  color: 'var(--text-primary)', marginBottom: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {exam.exam_name}
                </div>
                {exam.module && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.57rem', color: modCol?.text ?? '#c084fc', marginBottom: 6 }}>
                    {exam.module.module_name}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.54rem', color: 'var(--text-tertiary)' }}>
                    Confidence:
                  </span>
                  <Stars examId={exam.id} value={conf} onChange={v => handleConf(exam.id, v)} />
                  {conf === 0 && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(245,158,11,0.55)' }}>
                      tap to rate
                    </span>
                  )}
                </div>
              </div>

              {/* Days countdown */}
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.3rem', color: daysColor, lineHeight: 1 }}>
                  {days}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  days
                </div>
              </div>
            </div>

            {/* Tip + breakdown bars */}
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.57rem',
                color: meta.color, padding: '6px 10px',
                borderRadius: 8, background: `${meta.color}10`, lineHeight: 1.5,
              }}>
                {result.tip}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <MiniBar label="Tasks done"  value={result.taskPct}       color="#4ecf9e" />
                <MiniBar label="Confidence"  value={result.confidencePct} color="#7090d0" />
                <MiniBar label="Time buffer" value={result.daysFactor}    color="#f59e0b" />
              </div>
            </div>
          </div>
        )
      })}

      {/* ── Action plan by overall grade ── */}
      <div style={{ padding: '14px 16px', borderRadius: 16, background: `${avgMeta.color}08`, border: `0.5px solid ${avgMeta.color}20` }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: avgMeta.color, marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Your action plan — {avgMeta.label}
        </div>
        {avgGrade === 'critical' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['⚡ Do 2 focused 1-hour study sessions every day from now until the exam. No exceptions.', '📄 Download past papers immediately — they\'re your fastest route to understanding question patterns. Check your institution\'s LMS, past exam portal, or StudyPool.', '🎯 Drop everything except core concepts for each module. Use the 80/20 rule: which 20% of topics appear in 80% of past papers? Study those first.', '👥 Tell a friend or family member you\'re in exam crisis — accountability makes cancelling study sessions harder.', '😴 Sleep 7 hours no matter what. Sleep deprivation reduces memory recall by 40%. An all-nighter before an exam costs you more than it buys.'].map((a, i) => (
              <div key={i} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '6px 10px', background: 'rgba(255,107,107,0.06)', borderRadius: 8, borderLeft: '2px solid #ff6b6b' }}>{a}</div>
            ))}
          </div>
        )}
        {avgGrade === 'at-risk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['📅 Create a per-day study schedule for the remaining days. Assign each day to specific modules — no "I\'ll study whatever" days.', '📄 Start past papers for your lowest-confidence subjects. Do at least one full paper under timed conditions.', '🗂️ For modules where confidence is below 2★: use flashcards for 20 minutes daily to lock in terminology and definitions.', '🚫 Cancel non-essential social commitments for the next week. You can recover socially after results come out.', '🧘 5-minute box breathing before each study session: inhale 4s, hold 4s, exhale 4s, hold 4s. Lowers cortisol so you actually retain what you study.'].map((a, i) => (
              <div key={i} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '6px 10px', background: 'rgba(232,131,74,0.06)', borderRadius: 8, borderLeft: '2px solid #e8834a' }}>{a}</div>
            ))}
          </div>
        )}
        {avgGrade === 'fair' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['📋 Complete your outstanding tasks for each module — you\'re behind on task completion which is dragging your score down.', '📄 Do at least one past paper per subject under timed exam conditions. Mark it honestly and focus revision on the sections you lost marks in.', '🔁 For modules below 3★ confidence: use spaced repetition (flashcards here) daily for the next 5 days to boost confidence.', '✅ Do a 15-minute "exam brain dump" each night — write everything you know about each subject from memory. What you can\'t write, you haven\'t learned yet.'].map((a, i) => (
              <div key={i} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '6px 10px', background: 'rgba(245,158,11,0.06)', borderRadius: 8, borderLeft: '2px solid #f59e0b' }}>{a}</div>
            ))}
          </div>
        )}
        {avgGrade === 'good' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['✅ You\'re on track. Maintain your current study pace — consistency beats cramming.', '📄 Do past papers now to convert your knowledge into marks. Knowing content and passing exams are different skills.', '🎯 Identify your one weakest subject and dedicate 30% of remaining study time to it. Don\'t neglect a subject because you\'re strong in others.', '🧠 Start active recall sessions: close your notes and test yourself. This is 2× more effective than re-reading (research-backed).'].map((a, i) => (
              <div key={i} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '6px 10px', background: 'rgba(112,144,208,0.06)', borderRadius: 8, borderLeft: '2px solid #7090d0' }}>{a}</div>
            ))}
          </div>
        )}
        {avgGrade === 'excellent' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['🌟 Outstanding readiness. Your task completion and confidence are strong.', '📄 Use remaining time to refine, not cram: do past papers, review marking memos, and identify any edge-case topics.', '😴 Prioritise sleep in the final 3 days before each exam. Memory consolidation happens during deep sleep — a rested brain outperforms a crammed one every time.', '📝 On exam day: arrive 20 minutes early, read ALL questions before answering any, allocate time per mark (1 mark ≈ 1 min in most SA exams).'].map((a, i) => (
              <div key={i} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '6px 10px', background: 'rgba(78,207,158,0.06)', borderRadius: 8, borderLeft: '2px solid #4ecf9e' }}>{a}</div>
            ))}
          </div>
        )}
      </div>

      {/* ── Past papers guide ── */}
      <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(99,102,241,0.06)', border: '0.5px solid rgba(99,102,241,0.15)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: '#a5b4fc', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Where to find past papers</div>
        {[
          { source: 'Institution LMS', detail: 'Blackboard, Moodle, eFundi, or iKamva — check your module page under "Resources" or "Past Assessments".' },
          { source: 'StudyPool / Ananzi', detail: 'Student-uploaded SA past papers across most public universities. Search "[module code] past exam paper".' },
          { source: 'Library portal', detail: 'Your institution library portal often archives exam papers by year and module. Ask at the reference desk if you can\'t find them online.' },
          { source: 'Senior students', detail: 'Study groups and WhatsApp channels for your course are the fastest source. Past papers circulate heavily in these communities.' },
        ].map(p => (
          <div key={p.source} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a5b4fc', marginBottom: 2 }}>{p.source}</div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{p.detail}</div>
          </div>
        ))}
      </div>

      {/* ── Anxiety management ── */}
      <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(251,113,133,0.05)', border: '0.5px solid rgba(251,113,133,0.15)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: '#fb7185', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Exam anxiety — what actually works</div>
        {[
          { tip: 'Box breathing (4-4-4-4)', detail: 'Inhale 4 seconds, hold 4, exhale 4, hold 4. Do 4 cycles. Clinically proven to lower cortisol within 90 seconds — do this before you open the paper.' },
          { tip: 'Perspective reframe', detail: 'Ask: "Will this exam matter in 5 years?" Rarely yes. Your effort matters more than any single result. NSFAS appeals exist. Supp exams exist. Your life is not defined by one paper.' },
          { tip: 'The night before', detail: 'Stop studying by 9pm. Your brain needs consolidation sleep more than extra cramming. Pack your bag, set two alarms, sleep by 10:30pm.' },
          { tip: 'In the exam room', detail: 'Read the entire paper before writing anything — 5 minutes. Mark what you know easily vs what needs thought. Attempt all questions; partial marks count in SA exams.' },
          { tip: 'If you blank', detail: 'Skip the question, move on, come back. Write anything loosely related — examiners give method marks. A blank space scores zero; an attempt scores something.' },
        ].map(a => (
          <div key={a.tip} style={{ marginBottom: 10, paddingLeft: 10, borderLeft: '2px solid rgba(251,113,133,0.3)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fb7185', marginBottom: 2 }}>{a.tip}</div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-tertiary)', lineHeight: 1.55 }}>{a.detail}</div>
          </div>
        ))}
        <div style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: 'rgba(251,113,133,0.5)', marginTop: 6 }}>
          SADAG crisis line: 0800 567 567 · Lifeline: 0861 322 322
        </div>
      </div>

      {/* ── Score legend ── */}
      <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(78,207,158,0.05)', border: '0.5px solid rgba(78,207,158,0.1)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: '#4ecf9e', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          How your score is calculated
        </div>
        {[
          ['40%', 'Task completion', 'Tasks for this module marked done'],
          ['40%', 'Self-confidence', 'Your ★ rating — how ready you feel'],
          ['20%', 'Time buffer',     'Days left (30 days = 100%)'],
        ].map(([pct, label, desc]) => (
          <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 5 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.57rem', color: '#4ecf9e', flexShrink: 0, width: 28 }}>{pct}</span>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.7rem', color: 'var(--text-primary)' }}>{label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.54rem', color: 'var(--text-tertiary)', marginLeft: 6 }}>{desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
