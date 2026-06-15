'use client'

// ProcrastinationProfiler — identify your procrastination type.
// 5 scenario-based questions → one of 5 types → tailored interventions.
// Research: different procrastination types require different interventions
// (Steel, 2007 — The Nature of Procrastination).

import { useState, useEffect } from 'react'
import { dispatchXP } from '@/lib/xp-engine'

const LS_KEY = 'varsityos_proc_profile'

// ── Types ────────────────────────────────────────────────────────────────────

type ProcType = 'perfectionist' | 'overwhelmed' | 'avoidant' | 'impulsive' | 'bored'

interface Profile {
  type:        ProcType
  completedAt: string
}

const TYPE_META: Record<ProcType, {
  label:        string
  emoji:        string
  color:        string
  tagline:      string
  interventions: string[]
  avoid:        string
}> = {
  perfectionist: {
    label:    'The Perfectionist',
    emoji:    '🎯',
    color:    '#9b6fd4',
    tagline:  'You delay because the bar is too high to clear.',
    interventions: [
      "Set a 'minimum viable' version before starting — improve it later",
      "Time-box work: 25 minutes per task, then review, not redo",
      "Name one thing that would make this 'good enough' to submit",
      "Remind yourself: shipped beats perfect every time",
    ],
    avoid: "Do not start unless you 'feel ready' — that feeling never comes",
  },
  overwhelmed: {
    label:    'The Overwhelmed',
    emoji:    '😵',
    color:    '#ff6b6b',
    tagline:  'You delay because the pile feels impossible to move.',
    interventions: [
      "Pick ONE micro-step — not the task, just the very first action",
      "Use the 2-minute rule: if it takes less than 2 min, do it now",
      "Write the full task list first — your brain needs to offload it",
      "'Break it down ✦' on every task before touching it",
    ],
    avoid: "Looking at the whole pile before starting — zoom in on one thing",
  },
  avoidant: {
    label:    'The Avoider',
    emoji:    '😰',
    color:    '#f59e0b',
    tagline:  'You delay because something about this task feels threatening.',
    interventions: [
      "Write down: 'The worst that could happen is ___, and I'd handle it by ___'",
      "Self-compassion first: everyone struggles — you're not uniquely broken",
      "Start with the least threatening part of the task",
      "Use Body Double Mode — anxiety drops when someone is present",
    ],
    avoid: "Ruminating on the task without starting — it always feels worse than it is",
  },
  impulsive: {
    label:    'The Impulsive',
    emoji:    '⚡',
    color:    '#4ecf9e',
    tagline:  'You delay because something more stimulating always comes first.',
    interventions: [
      "Make the environment do the work: phone in another room, one tab only",
      "Use DistractionDumper to capture impulses without acting on them",
      "Set a Commitment Contract — loss aversion is your best weapon",
      "Reward yourself ONLY after the session, not during",
    ],
    avoid: "Starting work with your phone nearby — you will lose",
  },
  bored: {
    label:    'The Boredom Procrastinator',
    emoji:    '😴',
    color:    '#c9a84c',
    tagline:  'You delay because the task doesn\'t engage you.',
    interventions: [
      "Connect the task to a bigger goal that excites you",
      "Gamify it: beat your previous completion time, earn XP",
      "Change the environment — a new location = new stimulation",
      "Pair it with something you enjoy (study music, good coffee)",
    ],
    avoid: "Waiting to 'feel motivated' — motivation follows action, not the other way",
  },
}

// ── Quiz Questions ────────────────────────────────────────────────────────────

interface Question {
  text:    string
  options: { text: string; type: ProcType }[]
}

const QUESTIONS: Question[] = [
  {
    text: "An assignment is due in 3 days. What's most true of how you feel right now?",
    options: [
      { text: "I haven't started because I want to do it perfectly, not just adequately.", type: 'perfectionist' },
      { text: "I have so many other things due that I don't know where to start.", type: 'overwhelmed' },
      { text: "I keep thinking about it but feel anxious, so I avoid it.", type: 'avoidant' },
      { text: "I keep getting pulled to other things — social media, YouTube, etc.", type: 'impulsive' },
      { text: "It's just such a dull topic — I can't make myself care enough.", type: 'bored' },
    ],
  },
  {
    text: "When you sit down to study and can't start, what goes through your mind?",
    options: [
      { text: "If I can't do this properly, what's the point of doing it at all?", type: 'perfectionist' },
      { text: "There's too much to cover and not enough time — where do I even begin?", type: 'overwhelmed' },
      { text: "What if I fail? I'd rather not find out how bad it actually is.", type: 'avoidant' },
      { text: "Just one more scroll, one more video, then I'll start…", type: 'impulsive' },
      { text: "This is so boring — I'd literally do anything else right now.", type: 'bored' },
    ],
  },
  {
    text: "Which situation sounds most like you after you've procrastinated?",
    options: [
      { text: "I rushed at the last minute and the work felt 'below my standard'.", type: 'perfectionist' },
      { text: "I was overwhelmed by the workload and just froze completely.", type: 'overwhelmed' },
      { text: "I avoided it until the deadline anxiety was worse than the task itself.", type: 'avoidant' },
      { text: "I wasted hours on my phone and genuinely don't know where the time went.", type: 'impulsive' },
      { text: "I did other (more interesting) tasks and justified it as being 'productive'.", type: 'bored' },
    ],
  },
  {
    text: "Which of these anti-procrastination tricks would help you most?",
    options: [
      { text: "Permission to submit something 'good enough' without guilt.", type: 'perfectionist' },
      { text: "Breaking the task into tiny, concrete next steps.", type: 'overwhelmed' },
      { text: "Being able to study with someone else present (even virtually).", type: 'avoidant' },
      { text: "Locking my phone away for a set period with real consequences.", type: 'impulsive' },
      { text: "Connecting the boring task to something I actually care about.", type: 'bored' },
    ],
  },
  {
    text: "If you're honest with yourself, what usually stops you from starting?",
    options: [
      { text: "Fear of producing something that doesn't meet my own expectations.", type: 'perfectionist' },
      { text: "The task feels so large I can't find an entry point.", type: 'overwhelmed' },
      { text: "Some kind of fear — of failing, of judgment, of finding out I'm not capable.", type: 'avoidant' },
      { text: "Poor impulse control — I'm easily pulled to immediate gratification.", type: 'impulsive' },
      { text: "Lack of genuine interest in the topic or task.", type: 'bored' },
    ],
  },
]

// ── Helper ────────────────────────────────────────────────────────────────────

function computeType(answers: ProcType[]): ProcType {
  const counts: Record<ProcType, number> = { perfectionist: 0, overwhelmed: 0, avoidant: 0, impulsive: 0, bored: 0 }
  for (const a of answers) counts[a]++
  return (Object.entries(counts) as [ProcType, number][]).sort((a, b) => b[1] - a[1])[0][0]
}

function loadProfile(): Profile | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? 'null') } catch { return null }
}

// ── Result Card ───────────────────────────────────────────────────────────────

function ResultCard({ profile, onReset }: { profile: Profile; onReset: () => void }) {
  const meta = TYPE_META[profile.type]
  return (
    <div style={{
      borderRadius: 18, padding: '18px 20px',
      border: `1px solid ${meta.color}30`,
      background: `linear-gradient(145deg, ${meta.color}08 0%, rgba(0,0,0,0) 70%)`,
    }}>
      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: meta.color, letterSpacing: '0.18em', marginBottom: 10 }}>
        🧠 YOUR PROCRASTINATION PROFILE
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
          background: `${meta.color}18`, border: `2px solid ${meta.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {meta.emoji}
        </div>
        <div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 900, fontSize: 17, color: meta.color }}>
            {meta.label}
          </div>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {meta.tagline}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginBottom: 8 }}>
          YOUR BEST INTERVENTIONS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {meta.interventions.map((tip, i) => (
            <div key={i} style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              padding: '8px 12px', borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
            }}>
              <span style={{ color: meta.color, fontSize: 11, flexShrink: 0, marginTop: 1 }}>→</span>
              <span style={{ fontFamily: 'Sora,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.45 }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        padding: '10px 14px', borderRadius: 10,
        background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.15)',
        marginBottom: 14,
      }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#ff6b6b', letterSpacing: '0.1em', marginBottom: 4 }}>
          AVOID THIS TRAP
        </div>
        <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
          {meta.avoid}
        </div>
      </div>

      <button onClick={onReset} style={{
        fontFamily: '"JetBrains Mono",monospace', fontSize: 9,
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'rgba(255,255,255,0.2)', padding: 0,
      }}>
        Retake quiz →
      </button>
    </div>
  )
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

function Quiz({ onComplete }: { onComplete: (type: ProcType) => void }) {
  const [step,    setStep]    = useState(0)
  const [answers, setAnswers] = useState<ProcType[]>([])

  const question = QUESTIONS[step]

  const handlePick = (type: ProcType) => {
    const next = [...answers, type]
    if (step < QUESTIONS.length - 1) {
      setAnswers(next)
      setStep(s => s + 1)
    } else {
      onComplete(computeType(next))
    }
  }

  const pct = Math.round(((step) / QUESTIONS.length) * 100)

  return (
    <div style={{ borderRadius: 18, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#9b6fd4', letterSpacing: '0.18em', marginBottom: 12 }}>
        🧠 PROCRASTINATION PROFILER · Q{step + 1}/{QUESTIONS.length}
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.06)', marginBottom: 16, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 3,
          background: '#9b6fd4', transition: 'width 0.4s ease',
        }} />
      </div>

      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: 1.45, marginBottom: 16 }}>
        {question.text}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handlePick(opt.type)}
            style={{
              padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.7)',
              fontFamily: 'Sora,sans-serif', fontSize: 12, lineHeight: 1.45,
              textAlign: 'left', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'rgba(155,111,212,0.12)'; (e.target as HTMLButtonElement).style.borderColor = 'rgba(155,111,212,0.3)'; (e.target as HTMLButtonElement).style.color = '#fff' }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)'; (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.target as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)' }}
          >
            {opt.text}
          </button>
        ))}
      </div>

      {step > 0 && (
        <button onClick={() => { setStep(s => s - 1); setAnswers(a => a.slice(0, -1)) }} style={{
          marginTop: 12, fontFamily: '"JetBrains Mono",monospace', fontSize: 9,
          background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)',
        }}>
          ← back
        </button>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ProcrastinationProfiler() {
  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [mounted,  setMounted]  = useState(false)
  const [started,  setStarted]  = useState(false)

  useEffect(() => {
    setMounted(true)
    setProfile(loadProfile())
  }, [])

  const handleComplete = (type: ProcType) => {
    const p: Profile = { type, completedAt: new Date().toISOString() }
    localStorage.setItem(LS_KEY, JSON.stringify(p))
    setProfile(p)
    dispatchXP('profiler_completed')
  }

  if (!mounted) return null

  if (profile) {
    return <ResultCard profile={profile} onReset={() => { localStorage.removeItem(LS_KEY); setProfile(null); setStarted(false) }} />
  }

  if (!started) {
    return (
      <div style={{
        borderRadius: 18, padding: '18px 20px',
        border: '1px solid rgba(155,111,212,0.2)',
        background: 'rgba(155,111,212,0.04)',
      }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#9b6fd4', letterSpacing: '0.18em', marginBottom: 10 }}>
          🧠 PROCRASTINATION PROFILER
        </div>
        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 8 }}>
          What type of procrastinator are you?
        </div>
        <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55, marginBottom: 18 }}>
          5 quick questions. Different types need different fixes — knowing yours unlocks the right interventions.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {(Object.entries(TYPE_META) as [ProcType, typeof TYPE_META[ProcType]][]).map(([type, meta]) => (
            <div key={type} style={{
              padding: '5px 10px', borderRadius: 20,
              background: `${meta.color}12`, border: `1px solid ${meta.color}30`,
              fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: meta.color,
            }}>
              {meta.emoji} {meta.label.split(' ').slice(-1)[0]}
            </div>
          ))}
        </div>
        <button onClick={() => setStarted(true)} style={{
          width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: '#9b6fd4', color: '#fff',
          fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14,
        }}>
          🧠 Find my type (5 questions)
        </button>
      </div>
    )
  }

  return <Quiz onComplete={handleComplete} />
}
