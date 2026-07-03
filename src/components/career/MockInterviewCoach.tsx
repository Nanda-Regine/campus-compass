'use client'

import { useState } from 'react'
import { dispatchXP } from '@/lib/xp-engine'

/* ── Types ──────────────────────────────────────────────────── */
interface Props {
  userId: string
}

type JobType = 'graduate' | 'entry' | 'internship' | 'parttime'
type InterviewType = 'competency' | 'motivational' | 'technical'

interface Setup {
  jobType: JobType
  industry: string
  interviewType: InterviewType
}

interface Feedback {
  score: number
  what_worked: string
  improve: string
  example_answer: string
}

/* ── Data ───────────────────────────────────────────────────── */
const SA_INDUSTRIES = [
  'Finance & Banking',
  'Technology',
  'Government & Public Sector',
  'Healthcare',
  'Education',
  'Retail & FMCG',
  'Mining & Resources',
  'Media & Marketing',
  'Legal',
  'Other',
]

const QUESTION_BANK: Record<InterviewType, string[]> = {
  competency: [
    'Tell me about a time you worked under pressure and had to meet a tight deadline.',
    'Describe a situation where you had to work with someone you disagreed with.',
    'Give me an example of when you showed initiative.',
    'Tell me about a time you failed at something and what you learned.',
    'Describe a situation where you had to adapt quickly to change.',
    'Tell me about a time you worked with people from different backgrounds.',
    'Give an example of a problem you solved creatively.',
    'How do you handle load shedding\'s impact on your work or studies?',
  ],
  motivational: [
    'Why do you want to work in this industry?',
    'Where do you see yourself in 5 years?',
    'What motivates you?',
    'Why should we hire you over other candidates?',
    'What is ubuntu to you, and how do you apply it in a team?',
    'What is your greatest strength? Give an example.',
  ],
  technical: [
    'Walk me through how you would approach a complex problem you have never seen before.',
    'Describe your experience with data analysis or research methodology.',
    'How do you stay up to date with developments in your field?',
    'What tools or software are you proficient in? Give specific examples.',
    'Describe a project where you applied technical skills to solve a real problem.',
    'How would you explain a complex technical concept to a non-technical stakeholder?',
  ],
}

const JOB_TYPE_LABELS: { id: JobType; label: string }[] = [
  { id: 'graduate',    label: 'Graduate Programme' },
  { id: 'entry',       label: 'Entry Level' },
  { id: 'internship',  label: 'Internship' },
  { id: 'parttime',    label: 'Part-time' },
]

const INTERVIEW_TYPE_LABELS: { id: InterviewType; label: string; desc: string }[] = [
  { id: 'competency',   label: 'Competency', desc: 'STAR-based behavioural questions' },
  { id: 'motivational', label: 'Motivational', desc: 'Why you + career vision' },
  { id: 'technical',    label: 'Technical', desc: 'Field-specific questions' },
]

const TOTAL_QUESTIONS = 5

function getQuestions(interviewType: InterviewType): string[] {
  const bank = [...QUESTION_BANK[interviewType]]
  const shuffled = bank.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, TOTAL_QUESTIONS)
}

/* ── Score ring ─────────────────────────────────────────────── */
function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const max = 5
  const pct = score / max
  const r = (size / 2) - 6
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - pct)
  const color = score >= 4 ? '#34d399' : score >= 3 ? '#f59e0b' : '#f87171'

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'JetBrains Mono, monospace', fontSize: size === 64 ? 16 : 13, fontWeight: 700, color,
      }}>
        {score}
      </div>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────── */
export default function MockInterviewCoach({ userId: _userId }: Props) {
  const [setup, setSetup] = useState<Setup | null>(null)
  const [setupDraft, setSetupDraft] = useState<Partial<Setup>>({
    jobType: 'graduate',
    interviewType: 'competency',
    industry: '',
  })
  const [questions, setQuestions] = useState<string[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [scores, setScores] = useState<number[]>([])
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const canStart = !!setupDraft.jobType && !!setupDraft.industry && !!setupDraft.interviewType

  const startSession = () => {
    if (!canStart) return
    const finalSetup = setupDraft as Setup
    const qs = getQuestions(finalSetup.interviewType)
    setSetup(finalSetup)
    setQuestions(qs)
    setCurrentQ(0)
    setAnswer('')
    setFeedback(null)
    setScores([])
    setSessionComplete(false)
    setError('')
  }

  const submitAnswer = async () => {
    if (!answer.trim() || loading || !setup) return
    if (answer.trim().split(/\s+/).length < 10) {
      setError('Please write at least a few sentences for meaningful feedback.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/career/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions[currentQ],
          answer: answer.trim(),
          job_type: setup.jobType,
          industry: setup.industry,
        }),
      })

      if (!res.ok) throw new Error(`Request failed: ${res.status}`)

      const json = await res.json() as { data?: Feedback; error?: string }
      if (json.error) throw new Error(json.error)

      const fb = json.data!
      setFeedback(fb)
      setScores(prev => [...prev, fb.score])
      dispatchXP('skills_gap_viewed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const nextQuestion = () => {
    if (currentQ + 1 >= TOTAL_QUESTIONS) {
      setSessionComplete(true)
      dispatchXP('mock_interview_complete')
    } else {
      setCurrentQ(prev => prev + 1)
      setAnswer('')
      setFeedback(null)
      setError('')
    }
  }

  const resetSession = () => {
    setSetup(null)
    setQuestions([])
    setCurrentQ(0)
    setAnswer('')
    setFeedback(null)
    setScores([])
    setSessionComplete(false)
    setError('')
    setSetupDraft({ jobType: 'graduate', interviewType: 'competency', industry: '' })
  }

  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—'
  const avgScoreNum = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  const scoreColor = avgScoreNum >= 4 ? '#34d399' : avgScoreNum >= 3 ? '#f59e0b' : '#f87171'

  const copySessionSummary = async () => {
    if (!setup) return
    const text = [
      `Mock Interview Summary`,
      `Job type: ${setup.jobType} | Industry: ${setup.industry}`,
      `Interview type: ${setup.interviewType}`,
      `Average score: ${avgScore}/5`,
      `Questions answered: ${scores.length}/${TOTAL_QUESTIONS}`,
      `Scores: ${scores.join(', ')}`,
    ].join('\n')
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /* ── Setup screen ─── */
  if (!setup) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Job type */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 12, fontWeight: 600 }}>Job Type</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
            {JOB_TYPE_LABELS.map(jt => (
              <button
                key={jt.id}
                onClick={() => setSetupDraft(prev => ({ ...prev, jobType: jt.id }))}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: `1px solid ${setupDraft.jobType === jt.id ? 'rgba(129,140,248,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  background: setupDraft.jobType === jt.id ? 'rgba(129,140,248,0.1)' : 'rgba(255,255,255,0.02)',
                  color: setupDraft.jobType === jt.id ? '#818cf8' : 'var(--text-tertiary)',
                  fontSize: 12, fontWeight: setupDraft.jobType === jt.id ? 700 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {jt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Industry */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 12, fontWeight: 600 }}>Industry</div>
          <select
            value={setupDraft.industry ?? ''}
            onChange={e => setSetupDraft(prev => ({ ...prev, industry: e.target.value }))}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 10,
              padding: '10px 12px',
              color: setupDraft.industry ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize: 13,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="" disabled style={{ background: '#0a0a0f' }}>Select an industry…</option>
            {SA_INDUSTRIES.map(ind => (
              <option key={ind} value={ind} style={{ background: '#0a0a0f' }}>{ind}</option>
            ))}
          </select>
        </div>

        {/* Interview type */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 12, fontWeight: 600 }}>Interview Type</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {INTERVIEW_TYPE_LABELS.map(it => (
              <button
                key={it.id}
                onClick={() => setSetupDraft(prev => ({ ...prev, interviewType: it.id }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: `1px solid ${setupDraft.interviewType === it.id ? 'rgba(129,140,248,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  background: setupDraft.interviewType === it.id ? 'rgba(129,140,248,0.08)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: `2px solid ${setupDraft.interviewType === it.id ? '#818cf8' : 'rgba(255,255,255,0.2)'}`,
                  background: setupDraft.interviewType === it.id ? '#818cf8' : 'transparent',
                  flexShrink: 0, transition: 'all 0.15s',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: setupDraft.interviewType === it.id ? '#818cf8' : 'var(--text-primary)' }}>{it.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{it.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Info callout */}
        <div style={{ background: 'rgba(129,140,248,0.05)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            You will answer <strong style={{ color: 'var(--text-primary)' }}>{TOTAL_QUESTIONS} questions</strong> drawn from a question bank matched to your interview type. After each answer you receive AI feedback scored 1–5 using the STAR method.
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={startSession}
          disabled={!canStart}
          style={{
            padding: '14px 0',
            borderRadius: 12,
            border: 'none',
            background: canStart ? 'linear-gradient(135deg,#818cf8,#6366f1)' : 'rgba(255,255,255,0.06)',
            color: canStart ? '#fff' : 'var(--text-tertiary)',
            fontFamily: 'Sora, sans-serif',
            fontWeight: 700,
            fontSize: 14,
            cursor: canStart ? 'pointer' : 'not-allowed',
            boxShadow: canStart ? '0 4px 16px rgba(129,140,248,0.3)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          Start Interview →
        </button>
      </div>
    )
  }

  /* ── Session complete screen ─── */
  if (sessionComplete) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Result card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          padding: '20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🎤</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Interview complete!
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
            Well done! Keep practising to build confidence.
          </div>

          {/* Avg score */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <ScoreRing score={avgScoreNum} size={80} />
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: scoreColor, marginBottom: 4 }}>
            Average: {avgScore}/5
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {setup.interviewType} | {setup.industry} | {setup.jobType}
          </div>
        </div>

        {/* Per-question scores */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 10, fontWeight: 600 }}>Question Scores</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {scores.map((s, i) => {
              const c = s >= 4 ? '#34d399' : s >= 3 ? '#f59e0b' : '#f87171'
              return (
                <div key={i} style={{ flex: 1, background: `${c}12`, border: `1px solid ${c}30`, borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: c }}>{s}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 2 }}>Q{i + 1}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top improvement area */}
        <div style={{ background: 'rgba(129,140,248,0.05)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            <strong style={{ color: '#818cf8' }}>Top tip:</strong> Focus on the STAR method — always include a clear Result that shows the impact of your action. This is the most common gap in SA graduate interviews.
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={copySessionSummary}
            style={{
              flex: 1,
              padding: '11px 0',
              borderRadius: 11,
              border: '1px solid rgba(255,255,255,0.1)',
              background: copied ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.03)',
              color: copied ? '#818cf8' : 'var(--text-tertiary)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif',
              transition: 'all 0.2s',
            }}
          >
            {copied ? 'Copied!' : 'Copy summary'}
          </button>
          <button
            onClick={resetSession}
            style={{
              flex: 2,
              padding: '11px 0',
              borderRadius: 11,
              border: 'none',
              background: 'linear-gradient(135deg,#818cf8,#6366f1)',
              color: '#fff',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Sora, sans-serif',
            }}
          >
            Practice again →
          </button>
        </div>
      </div>
    )
  }

  /* ── Active interview screen ─── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Progress bar */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Question <strong style={{ color: 'var(--text-primary)' }}>{currentQ + 1}</strong> of {TOTAL_QUESTIONS}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {setup.industry} · {setup.interviewType}
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 9999, height: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            borderRadius: 9999,
            background: 'linear-gradient(90deg,#818cf8,#6366f1)',
            width: `${((currentQ) / TOTAL_QUESTIONS) * 100}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Question */}
      <div style={{
        background: 'rgba(129,140,248,0.06)',
        border: '1px solid rgba(129,140,248,0.2)',
        borderRadius: 16,
        padding: '18px 16px',
      }}>
        <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#818cf8', marginBottom: 8, fontWeight: 600 }}>
          Interview question
        </div>
        <div style={{ fontSize: 15, color: '#818cf8', fontWeight: 600, lineHeight: 1.6, fontFamily: 'Sora, sans-serif' }}>
          {questions[currentQ]}
        </div>
        <div style={{ marginTop: 10, fontSize: 10, color: 'var(--text-tertiary)' }}>
          Tip: Structure your answer using STAR — Situation, Task, Action, Result
        </div>
      </div>

      {/* Answer input (only show if no feedback yet) */}
      {!feedback && (
        <>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Write your answer here… Include the situation, your task, the action you took, and the result. Aim for 3-5 sentences."
            rows={5}
            disabled={loading}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 12,
              padding: '12px 14px',
              color: 'var(--text-primary)',
              fontSize: 13,
              lineHeight: 1.7,
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              opacity: loading ? 0.6 : 1,
            }}
          />

          {error && (
            <div style={{ fontSize: 12, color: '#f87171', padding: '8px 12px', background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 8 }}>
              {error}
            </div>
          )}

          <button
            onClick={submitAnswer}
            disabled={!answer.trim() || loading}
            style={{
              padding: '13px 0',
              borderRadius: 12,
              border: 'none',
              background: answer.trim() && !loading ? 'linear-gradient(135deg,#818cf8,#6366f1)' : 'rgba(255,255,255,0.06)',
              color: answer.trim() && !loading ? '#fff' : 'var(--text-tertiary)',
              fontFamily: 'Sora, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              cursor: answer.trim() && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Evaluating your answer…' : 'Submit Answer →'}
          </button>
        </>
      )}

      {/* Feedback card */}
      {feedback && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ScoreRing score={feedback.score} />
            <div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                Score: {feedback.score}/5
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                {feedback.score >= 4 ? 'Strong answer' : feedback.score >= 3 ? 'Good attempt' : 'Needs development'}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#34d399', marginBottom: 5, fontWeight: 600 }}>What worked:</div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6, background: 'rgba(52,211,153,0.05)', border: '0.5px solid rgba(52,211,153,0.15)', borderRadius: 8, padding: '8px 10px' }}>
              {feedback.what_worked}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f59e0b', marginBottom: 5, fontWeight: 600 }}>To improve:</div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6, background: 'rgba(245,158,11,0.05)', border: '0.5px solid rgba(245,158,11,0.15)', borderRadius: 8, padding: '8px 10px' }}>
              {feedback.improve}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#818cf8', marginBottom: 5, fontWeight: 600 }}>Example answer:</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6, fontStyle: 'italic', background: 'rgba(129,140,248,0.05)', border: '0.5px solid rgba(129,140,248,0.15)', borderRadius: 8, padding: '8px 10px' }}>
              {feedback.example_answer}
            </div>
          </div>

          <button
            onClick={nextQuestion}
            style={{
              padding: '12px 0',
              borderRadius: 11,
              border: 'none',
              background: 'linear-gradient(135deg,#818cf8,#6366f1)',
              color: '#fff',
              fontFamily: 'Sora, sans-serif',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {currentQ + 1 >= TOTAL_QUESTIONS ? 'See results →' : `Next question (${currentQ + 2}/${TOTAL_QUESTIONS}) →`}
          </button>
        </div>
      )}
    </div>
  )
}
