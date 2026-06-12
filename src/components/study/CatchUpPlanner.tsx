'use client'
// ─── Catch-Up Planner ────────────────────────────────────────
// 5-question recovery session → algorithmic + Nova-generated catch-up plan
import { useState } from 'react'

interface CatchUpPlannerProps {
  moduleName: string
  moduleColor: string
  onClose: () => void
}

interface Question { q: string; options: string[] }
const QUESTIONS: Question[] = [
  { q: 'How many weeks of content have you missed or not understood?', options: ['0–1 week', '2–3 weeks', '4–5 weeks', '6+ weeks'] },
  { q: 'How much time can you study this module per day?', options: ['30 min', '1 hour', '2 hours', '3+ hours'] },
  { q: 'What is your biggest challenge right now?', options: ['Don\'t understand the basics', 'Too much content to cover', 'No notes / missed classes', 'Test anxiety'] },
  { q: 'When is your next test or exam?', options: ['Within a week', '2–3 weeks', '4–6 weeks', 'More than 6 weeks'] },
  { q: 'What has worked for you before?', options: ['Flashcards / memorising', 'Past papers', 'Group study', 'YouTube / video tutorials'] },
]

type Phase = 'questions' | 'generating' | 'plan'

function buildPlan(answers: string[], module: string): string[] {
  const weeksGap = answers[0]
  const dailyTime = answers[1]
  const challenge = answers[2]
  const examTiming = answers[3]
  const method = answers[4]

  const urgent = examTiming === 'Within a week' || examTiming === '2–3 weeks'
  const bigGap = weeksGap === '6+ weeks' || weeksGap === '4–5 weeks'
  const lowTime = dailyTime === '30 min' || dailyTime === '1 hour'

  const plan: string[] = []

  // Day 1
  plan.push(`TODAY — Triage: Write out every topic for ${module} on one page. Mark each: ✅ know it, ⚠️ shaky, ❌ blank. This is your map.`)

  // Week 1 focus
  if (challenge === 'Don\'t understand the basics') {
    plan.push(`THIS WEEK — Foundations first: Start with the very first topic and spend ${lowTime ? '2 sessions' : '3 sessions'} on it. Do not move forward until basics click. Use ${method === 'YouTube / video tutorials' ? 'YouTube' : 'your textbook'} for explanations.`)
  } else if (challenge === 'Too much content to cover') {
    plan.push(`THIS WEEK — The 80/20 Rule: Cover the topics most likely to appear in tests (check past papers, ask your lecturer for the focus areas). Do not try to cover everything — cover the right things.`)
  } else if (challenge === 'No notes / missed classes') {
    plan.push(`THIS WEEK — Borrow and organise: Get notes from classmates for missed weeks. Spend the first 2 days organising and summarising what you receive before any active studying.`)
  } else {
    plan.push(`THIS WEEK — Past papers first: For test anxiety, confidence comes from doing, not from re-reading. Start with the easiest past paper and work forward. Grade yourself honestly.`)
  }

  // Daily routine
  const sessions = dailyTime === '30 min' ? '1 focused session (30 min)' : dailyTime === '1 hour' ? '2 sessions of 30 min' : dailyTime === '2 hours' ? '2 sessions of 50 min with a 20 min break' : '3 sessions of 50 min with breaks'
  plan.push(`DAILY ROUTINE — Pomodoro blocks: ${sessions}. Before each session, write one specific goal ("I will finish understanding topic X"). After, write 3 things you learned.`)

  // Catch-up velocity
  if (bigGap) {
    plan.push(`CONTENT STRATEGY — You have a large gap. Prioritise: (1) all past papers you can find, (2) summary notes of key concepts, (3) actual examples and worked problems. Depth over breadth.`)
  }

  // Urgent exam flag
  if (urgent) {
    plan.push(`⚠️ EXAM IS NEAR — Do not try to learn everything. Focus on: the 3 most tested topic areas, all worked examples in your notes, and at least 2 past papers. Sleep 7–8h before the exam.`)
  }

  // Study method tip
  if (method === 'Flashcards / memorising') {
    plan.push(`MEMORY TIP — Use active recall: cover your notes, write everything you remember, check, repeat. Flashcard apps (Anki) use spaced repetition — this is 2× more effective than re-reading.`)
  } else if (method === 'Past papers') {
    plan.push(`PAST PAPERS STRATEGY — Get the last 3–5 years. First, read the questions only and identify patterns. Do each under exam conditions (no notes, timed). Mark honestly. Review only your wrong answers.`)
  } else if (method === 'Group study') {
    plan.push(`GROUP STUDY TIP — Best for: teaching each other concepts (the teacher learns most). Bad for: reading notes together. Assign each person a topic to teach the group. Meet twice a week maximum.`)
  } else {
    plan.push(`VIDEO TUTORIAL TIP — Good for understanding, risky for exam prep if done passively. Take notes while watching. Pause and summarise every 5 minutes. After each video, close it and write what you remember.`)
  }

  // Final week
  plan.push(`FINAL WEEK BEFORE TEST — Stop learning new content 48h before the exam. Only review: your summary sheet, 1 past paper per day under timed conditions, and 8h sleep each night.`)

  return plan
}

export default function CatchUpPlanner({ moduleName, moduleColor, onClose }: CatchUpPlannerProps) {
  const [phase, setPhase] = useState<Phase>('questions')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [plan, setPlan] = useState<string[]>([])
  const [aiPlan, setAiPlan] = useState<string | null>(null)
  const [loadingAI, setLoadingAI] = useState(false)

  const current = QUESTIONS[step]
  const isLast = step === QUESTIONS.length - 1

  const next = () => {
    if (!selected) return
    const newAnswers = [...answers, selected]
    if (isLast) {
      setAnswers(newAnswers)
      setPhase('generating')
      const p = buildPlan(newAnswers, moduleName)
      setPlan(p)
      setTimeout(() => setPhase('plan'), 800)
      // Try Nova for richer plan
      fetch('/api/nova/catchup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: moduleName, answers: newAnswers }),
      }).then(r => r.ok ? r.json() : null).then(d => { if (d?.plan) setAiPlan(d.plan) }).catch(() => {})
    } else {
      setAnswers(newAnswers)
      setStep(s => s + 1)
      setSelected(null)
    }
  }

  return (
    <div style={{ padding: '16px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${moduleColor}25`, borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: moduleColor, letterSpacing: '0.08em' }}>CATCH-UP PLANNER — {moduleName.toUpperCase()}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1 }}>✕</button>
      </div>

      {phase === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>Question {step + 1} of {QUESTIONS.length}</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5, marginBottom: 4 }}>{current.q}</div>
          {current.options.map(o => (
            <button key={o} onClick={() => setSelected(o)} style={{ padding: '10px 14px', background: selected === o ? `${moduleColor}18` : 'rgba(255,255,255,0.04)', border: `1px solid ${selected === o ? moduleColor + '50' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, color: selected === o ? moduleColor : 'rgba(255,255,255,0.6)', fontSize: '0.78rem', cursor: 'pointer', textAlign: 'left', fontFamily: selected === o ? 'var(--font-mono)' : 'inherit', fontWeight: selected === o ? 600 : 400 }}>
              {o}
            </button>
          ))}
          <button onClick={next} disabled={!selected} style={{ marginTop: 4, padding: '10px 0', background: selected ? `${moduleColor}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${selected ? moduleColor + '40' : 'rgba(255,255,255,0.06)'}`, borderRadius: 8, color: selected ? moduleColor : 'rgba(255,255,255,0.2)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: selected ? 'pointer' : 'default', opacity: selected ? 1 : 0.5 }}>
            {isLast ? 'Build my plan →' : 'Next →'}
          </button>
        </div>
      )}

      {phase === 'generating' && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>🧠</div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)' }}>Building your recovery plan…</div>
        </div>
      )}

      {phase === 'plan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 4 }}>
            Your personalised catch-up plan for <strong style={{ color: moduleColor }}>{moduleName}</strong>:
          </div>
          {(aiPlan ? [aiPlan] : plan).map((item, i) => (
            <div key={i} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${moduleColor}20`, borderLeft: `3px solid ${moduleColor}`, borderRadius: '0 8px 8px 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65 }}>
              {item}
            </div>
          ))}
          {loadingAI && <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>Enhancing with Nova AI…</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={() => { setStep(0); setAnswers([]); setSelected(null); setPhase('questions'); setPlan([]); setAiPlan(null) }} style={{ flex: 1, padding: '9px 0', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>Redo</button>
            <button onClick={onClose} style={{ flex: 2, padding: '9px 0', background: `${moduleColor}18`, border: `1px solid ${moduleColor}40`, borderRadius: 8, color: moduleColor, fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>Got it — start now ✓</button>
          </div>
        </div>
      )}
    </div>
  )
}
