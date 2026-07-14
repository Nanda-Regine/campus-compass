'use client'

import { useState, useEffect } from 'react'

const ACCENT = '#c084fc'
const LS_COMMITMENT_KEY = 'varsity_values_commitment'

type ValueName =
  | 'Achievement' | 'Authenticity' | 'Balance' | 'Community' | 'Creativity'
  | 'Fairness' | 'Family' | 'Freedom' | 'Growth' | 'Honesty'
  | 'Impact' | 'Justice' | 'Leadership' | 'Learning' | 'Service'
  | 'Security' | 'Ubuntu' | 'Wealth' | 'Wisdom' | 'Courage'

interface ValueMeta {
  definition: string
  insight: string
  careers: string[]
}

const VALUE_META: Record<ValueName, ValueMeta> = {
  Achievement: {
    definition: "The drive to accomplish meaningful goals and reach your full potential.",
    insight: "You are energised by milestones and are at your best when working toward a clear, challenging target.",
    careers: ["Engineering", "Medicine", "Finance", "Law"],
  },
  Authenticity: {
    definition: "Living in alignment with who you truly are, without pretence.",
    insight: "You thrive in environments that let you express your genuine self, and you feel uncomfortable when asked to be someone you are not.",
    careers: ["Creative Arts", "Journalism", "Social Work", "Entrepreneurship"],
  },
  Balance: {
    definition: "Maintaining harmony across work, rest, relationships, and personal growth.",
    insight: "You perform best when no single area of life crowds out the others — sustainability matters more to you than intensity.",
    careers: ["Public Health", "Environmental Science", "Teaching", "Counselling"],
  },
  Community: {
    definition: "Deep connection to, and responsibility for, the people and places you belong to.",
    insight: "You draw energy from collective effort and feel hollow when your work does not benefit the people around you.",
    careers: ["Community Development", "Social Policy", "NGO Work", "Urban Planning"],
  },
  Creativity: {
    definition: "The impulse to imagine, innovate, and make something new.",
    insight: "Constraints frustrate you unless they are creative constraints — you need space to experiment and are at your best when no one has solved the problem before.",
    careers: ["Design", "Architecture", "Marketing", "Research & Development"],
  },
  Fairness: {
    definition: "A commitment to equitable treatment and just outcomes for all people.",
    insight: "Unfair systems bother you viscerally. You notice inequality others walk past, and you want to do something about it.",
    careers: ["Law", "Human Rights Advocacy", "Policy Analysis", "Labour Relations"],
  },
  Family: {
    definition: "Prioritising the wellbeing and closeness of family — the people you are bound to.",
    insight: "Your decisions are rarely just about you. You carry your family with you, and that is a source of strength, not a burden.",
    careers: ["Medicine", "Education", "Social Work", "Small Business"],
  },
  Freedom: {
    definition: "The ability to make your own choices and live on your own terms.",
    insight: "You feel confined by rigid structures and are at your best when given autonomy over how and where you work.",
    careers: ["Entrepreneurship", "Freelancing", "Research", "Creative Direction"],
  },
  Growth: {
    definition: "The constant desire to learn, evolve, and become a better version of yourself.",
    insight: "Stagnation is your biggest fear. You need roles and relationships that challenge you to keep developing.",
    careers: ["Academia", "Consulting", "Technology", "Personal Development"],
  },
  Honesty: {
    definition: "A commitment to truth — in what you say, and what you do.",
    insight: "You struggle in environments where politics or image matter more than reality. You are trusted precisely because people know where they stand with you.",
    careers: ["Journalism", "Auditing", "Science", "Mediation"],
  },
  Impact: {
    definition: "The desire to create meaningful, lasting change in the world.",
    insight: "Busy work drains you. You need to see the line between your effort and a real difference it makes.",
    careers: ["Social Enterprise", "Public Health", "Policy", "Engineering for Social Good"],
  },
  Justice: {
    definition: "The belief that wrongs must be righted and power must be accountable.",
    insight: "You are drawn to broken systems — not to complain about them, but to fix them. You are a natural advocate.",
    careers: ["Law", "Politics", "Activism", "Criminal Justice"],
  },
  Leadership: {
    definition: "The desire and ability to guide, inspire, and take responsibility for others.",
    insight: "You feel most alive when you are steering something — a team, a project, a movement. You do not wait to be given authority.",
    careers: ["Management", "Politics", "Military", "Organisational Development"],
  },
  Learning: {
    definition: "A deep love of knowledge, ideas, and continuous intellectual growth.",
    insight: "You are never bored when you have something interesting to study. You read widely, think deeply, and connect ideas across fields.",
    careers: ["Academia", "Research", "Writing", "Data Science"],
  },
  Service: {
    definition: "Finding purpose in helping others and contributing to something beyond yourself.",
    insight: "You are energised by giving, not receiving. You measure your day by how many people you helped, not by what you accumulated.",
    careers: ["Nursing", "Social Work", "Teaching", "Non-profit Management"],
  },
  Security: {
    definition: "Stability, predictability, and protection from risk and harm.",
    insight: "You make thoughtful, long-term decisions. You are not risk-averse — you are risk-aware, and that is a superpower in a volatile world.",
    careers: ["Government", "Insurance", "Risk Management", "Healthcare Administration"],
  },
  Ubuntu: {
    definition: "I am because we are — the philosophy that individual flourishing is inseparable from collective flourishing.",
    insight: "Your success feels incomplete unless the people around you also rise. You build bridges, not empires.",
    careers: ["Community Leadership", "Cultural Work", "Ubuntu-led Business", "Social Policy"],
  },
  Wealth: {
    definition: "Building financial abundance — for freedom, security, and the ability to give.",
    insight: "You are not motivated by money for its own sake. You see wealth as a tool for options, impact, and freedom — for yourself and your community.",
    careers: ["Finance", "Entrepreneurship", "Investment Banking", "Real Estate"],
  },
  Wisdom: {
    definition: "The accumulation of insight through experience, reflection, and humility.",
    insight: "You think before you speak. You learn from everyone. You take the long view when others are caught in the moment.",
    careers: ["Philosophy", "Counselling", "Strategic Leadership", "Writing"],
  },
  Courage: {
    definition: "Acting on what is right even when it is hard, uncertain, or costly.",
    insight: "You have walked into situations that made others flinch. Fear does not stop you — it just means the thing matters.",
    careers: ["Activism", "Emergency Medicine", "Investigative Journalism", "Special Forces Law"],
  },
}

interface Dilemma {
  id: number
  scenario: string
  optionA: { text: string; values: ValueName[] }
  optionB: { text: string; values: ValueName[] }
}

const DILEMMAS: Dilemma[] = [
  {
    id: 1,
    scenario: "You are offered a high-paying corporate job vs a lower-paying NGO role that aligns with your community values.",
    optionA: { text: "Take the corporate job — better salary, financial security, career trajectory.", values: ['Wealth', 'Security'] },
    optionB: { text: "Take the NGO role — the work matters and it serves my community.", values: ['Community', 'Ubuntu'] },
  },
  {
    id: 2,
    scenario: "Stay at varsity to finish your degree vs take a year off to care for a sick parent.",
    optionA: { text: "Stay and finish — it is what my parent wants for me too.", values: ['Achievement', 'Growth'] },
    optionB: { text: "Go home. The degree can wait. Family cannot.", values: ['Family', 'Service'] },
  },
  {
    id: 3,
    scenario: "Lead a group project your way (risky, creative) vs follow the safe, proven method everyone else is using.",
    optionA: { text: "Lead it my way. The risk is worth it for something different.", values: ['Leadership', 'Creativity'] },
    optionB: { text: "Use the safe method. The grade matters more than the experiment.", values: ['Security', 'Balance'] },
  },
  {
    id: 4,
    scenario: "Speak up about unfair treatment of a classmate even if it costs you socially vs stay silent to avoid conflict.",
    optionA: { text: "Speak up. Silence makes me complicit.", values: ['Justice', 'Courage'] },
    optionB: { text: "Stay silent. Picking battles is wisdom, not cowardice.", values: ['Security', 'Balance'] },
  },
  {
    id: 5,
    scenario: "Take a gap year to travel and discover yourself vs immediately start your career after graduation.",
    optionA: { text: "Take the gap year. The career will still be there. This window will not.", values: ['Freedom', 'Wisdom'] },
    optionB: { text: "Start immediately. Build momentum while I have energy and youth.", values: ['Achievement', 'Security'] },
  },
]

function loadCommitment(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(LS_COMMITMENT_KEY) ?? ''
}

function saveCommitment(text: string) {
  if (typeof window !== 'undefined') localStorage.setItem(LS_COMMITMENT_KEY, text)
}

function getTopValues(tally: Record<string, number>): ValueName[] {
  return (Object.entries(tally) as [ValueName, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([v]) => v)
}

function buildCommitmentText(top3: ValueName[]): string {
  return `My guiding values are ${top3.join(', ')}. I will honour them by `
}

type Phase = 'quiz' | 'results' | 'commitment'

export default function ValuesMap() {
  const [phase, setPhase] = useState<Phase>('quiz')
  const [current, setCurrent] = useState(0)
  const [tally, setTally] = useState<Record<string, number>>({})
  const [top3, setTop3] = useState<ValueName[]>([])
  const [commitment, setCommitment] = useState(loadCommitment)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (phase === 'results' || phase === 'commitment') {
      const computed = getTopValues(tally)
      setTop3(computed)
      if (!commitment || commitment === '') {
        const draft = buildCommitmentText(computed)
        setCommitment(draft)
      }
    }
  }, [phase])

  const choose = (values: ValueName[]) => {
    const updated = { ...tally }
    values.forEach(v => { updated[v] = (updated[v] ?? 0) + 1 })
    setTally(updated)

    if (current < DILEMMAS.length - 1) {
      setCurrent(c => c + 1)
    } else {
      const computed = getTopValues(updated)
      setTop3(computed)
      const draft = buildCommitmentText(computed)
      const saved = loadCommitment()
      setCommitment(saved && saved !== '' ? saved : draft)
      setPhase('results')
    }
  }

  const reset = () => {
    setPhase('quiz')
    setCurrent(0)
    setTally({})
    setTop3([])
    setCopied(false)
  }

  const copyCommitment = () => {
    navigator.clipboard.writeText(commitment).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleCommitmentChange = (val: string) => {
    setCommitment(val)
    saveCommitment(val)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(192,132,252,0.25)`, borderRadius: 16, padding: '16px 18px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${ACCENT},transparent)` }} />
        <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: ACCENT, letterSpacing: '0.09em', marginBottom: 4 }}>VALUES MAP</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Discover what you actually stand for</div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 3 }}>5 dilemmas. No right answers. Your values, surfaced.</div>
      </div>

      {phase === 'quiz' && (
        <QuizPhase dilemma={DILEMMAS[current]} index={current} total={DILEMMAS.length} onChoose={choose} />
      )}

      {phase === 'results' && (
        <ResultsPhase top3={top3} onContinue={() => setPhase('commitment')} onRetake={reset} />
      )}

      {phase === 'commitment' && (
        <CommitmentPhase
          top3={top3}
          commitment={commitment}
          onChange={handleCommitmentChange}
          onCopy={copyCommitment}
          copied={copied}
          onRetake={reset}
        />
      )}
    </div>
  )
}

function QuizPhase({ dilemma, index, total, onChoose }: {
  dilemma: Dilemma
  index: number
  total: number
  onChoose: (values: ValueName[]) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>DILEMMA {index + 1} OF {total}</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: total }, (_, i) => (
            <div key={i} style={{ width: 24, height: 4, borderRadius: 2, background: i <= index ? ACCENT : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px', lineHeight: 1.65 }}>
        <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: ACCENT, marginBottom: 8 }}>THE SCENARIO</div>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{dilemma.scenario}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[dilemma.optionA, dilemma.optionB].map((option, i) => (
          <button
            key={i}
            onClick={() => onChoose(option.values)}
            style={{
              padding: '14px 16px', background: 'rgba(255,255,255,0.06)',
              border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 14, cursor: 'pointer', textAlign: 'left',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = `rgba(192,132,252,0.4)` }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: ACCENT, marginBottom: 6 }}>OPTION {i === 0 ? 'A' : 'B'}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{option.text}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {option.values.map(v => (
                <span key={v} style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', padding: '2px 7px', background: `rgba(192,132,252,0.1)`, border: `1px solid rgba(192,132,252,0.2)`, borderRadius: 100, color: ACCENT }}>{v}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function ResultsPhase({ top3, onContinue, onRetake }: { top3: ValueName[]; onContinue: () => void; onRetake: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: '14px', background: `rgba(192,132,252,0.07)`, border: `1px solid rgba(192,132,252,0.2)`, borderRadius: 14, textAlign: 'center' }}>
        <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>✨</div>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Your core values surfaced</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Based on your choices, these are the values driving your decisions.</div>
      </div>

      {top3.map((valueName, rank) => {
        const meta = VALUE_META[valueName]
        return (
          <div key={valueName} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(192,132,252,${rank === 0 ? '0.35' : '0.15'})`, borderRadius: 16, padding: '16px', position: 'relative', overflow: 'hidden' }}>
            {rank === 0 && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${ACCENT},transparent)` }} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: ACCENT, marginBottom: 4 }}>{rank === 0 ? 'PRIMARY VALUE' : rank === 1 ? 'SECONDARY VALUE' : 'CORE VALUE'}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: ACCENT }}>{valueName}</div>
              </div>
              <div style={{ fontSize: '1.4rem', marginTop: -2 }}>{rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'}</div>
            </div>
            <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 10 }}>{meta.definition}</div>
            <div style={{ padding: '10px 12px', background: `rgba(192,132,252,0.06)`, border: `1px solid rgba(192,132,252,0.12)`, borderRadius: 10, marginBottom: 10 }}>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: ACCENT, marginBottom: 4 }}>WHAT THIS MEANS FOR YOU</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{meta.insight}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 6 }}>CAREER PATHS THAT HONOUR THIS</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {meta.careers.map(career => (
                  <span key={career} style={{ fontSize: '0.67rem', padding: '3px 9px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, color: 'var(--text-secondary)' }}>{career}</span>
                ))}
              </div>
            </div>
          </div>
        )
      })}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={onContinue}
          style={{ padding: '12px 0', background: `rgba(192,132,252,0.1)`, border: `1px solid rgba(192,132,252,0.3)`, borderRadius: 12, color: ACCENT, fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>
          Make my values commitment →
        </button>
        <button
          onClick={onRetake}
          style={{ padding: '10px 0', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
          Retake quiz
        </button>
      </div>
    </div>
  )
}

function CommitmentPhase({ top3, commitment, onChange, onCopy, copied, onRetake }: {
  top3: ValueName[]
  commitment: string
  onChange: (val: string) => void
  onCopy: () => void
  copied: boolean
  onRetake: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {top3.map(v => (
          <span key={v} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', background: `rgba(192,132,252,0.1)`, border: `1px solid rgba(192,132,252,0.25)`, borderRadius: 100, color: ACCENT }}>{v}</span>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px' }}>
        <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: ACCENT, marginBottom: 8 }}>MY VALUES COMMITMENT</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
          Write how you will live these values. Be specific. This becomes your personal compass.
        </div>
        <textarea
          value={commitment}
          onChange={e => onChange(e.target.value)}
          rows={5}
          style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.82rem', lineHeight: 1.65, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      <button
        onClick={onCopy}
        style={{ padding: '12px 0', background: copied ? 'rgba(52,211,153,0.1)' : `rgba(192,132,252,0.1)`, border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(192,132,252,0.3)'}`, borderRadius: 12, color: copied ? 'var(--teal, #34D399)' : ACCENT, fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
        {copied ? '✓ Copied to clipboard' : '📋 Copy to share with accountability partner'}
      </button>

      <div style={{ padding: '12px 14px', background: `rgba(192,132,252,0.06)`, border: `1px solid rgba(192,132,252,0.15)`, borderRadius: 12 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.65, fontStyle: 'italic' }}>
          Share this with someone who knows you — a mentor, a friend, a sibling. Ask them to hold you to it. Ubuntu says your growth is never just yours.
        </div>
      </div>

      <button
        onClick={onRetake}
        style={{ padding: '10px 0', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
        Retake quiz
      </button>
    </div>
  )
}
