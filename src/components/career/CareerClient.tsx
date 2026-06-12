'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { dispatchXP } from '@/lib/xp-engine'
import { loadCVProfile, saveCVProfile } from '@/lib/db/cv'

/* ── Types ─────────────────────────────────────────────────── */
interface Props {
  userId: string
  profile: { name: string; university: string; yearOfStudy: string; faculty: string; fundingType: string }
  modules: { id: string; module_name: string; color?: string | null }[]
}

/* ══════════════════════════════════════════════════════════════
   CV BUILDER
══════════════════════════════════════════════════════════════ */

const SKILL_SUGGESTIONS = [
  'Microsoft Office','Google Workspace','Python','JavaScript','SQL','Data Analysis',
  'Public Speaking','Research','Time Management','Critical Thinking','Leadership',
  'Teamwork','Communication','Problem Solving','Project Management',
]

const ACTIVITY_SUGGESTIONS = [
  'SRC member','Tutor / Mentor','Residence committee','Sports team','Debating society',
  'Community volunteering','Cultural society','Church / religious committee',
  'Part-time employment','Internship / vacation work',
]

function CVBuilder({ profile, modules }: { profile: Props['profile']; modules: Props['modules'] }) {
  const [skills, setSkills]         = useState<string[]>([])
  const [activities, setActivities] = useState<string[]>([])
  const [languages, setLanguages]   = useState<string[]>(['English'])
  const [summary, setSummary]       = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [actInput, setActInput]     = useState('')
  const [langInput, setLangInput]   = useState('')
  const [preview, setPreview]       = useState(false)
  const [copied, setCopied]         = useState(false)
  const [loaded, setLoaded]         = useState(false)

  // Load CV profile from Supabase on mount
  useEffect(() => {
    loadCVProfile().then(data => {
      setSkills(data.skills.length ? data.skills : [])
      setActivities(data.activities.length ? data.activities : [])
      setLanguages(data.languages.length ? data.languages : ['English'])
      setSummary(data.summary)
      setLoaded(true)
    })
  }, [])

  const save = (overrides?: { skills?: string[]; activities?: string[]; languages?: string[]; summary?: string }) => {
    saveCVProfile({
      skills:     overrides?.skills     ?? skills,
      activities: overrides?.activities ?? activities,
      languages:  overrides?.languages  ?? languages,
      summary:    overrides?.summary    ?? summary,
    }).catch(err => console.error('[CVBuilder] save error:', err))
  }

  const addChip = (list: string[], set: (v: string[]) => void, val: string) => {
    const v = val.trim()
    if (v && !list.includes(v)) set([...list, v])
  }

  const cvText = [
    profile.name ? `${profile.name.toUpperCase()}` : 'YOUR NAME',
    profile.university ? `${profile.university}${profile.yearOfStudy ? ' · ' + profile.yearOfStudy : ''}` : '',
    profile.faculty ? profile.faculty : '',
    '',
    '━━━ PROFILE ━━━',
    summary || '[Add a 2-sentence personal summary above]',
    '',
    '━━━ EDUCATION ━━━',
    profile.university ? `${profile.university}` : 'University name',
    `${profile.faculty || 'Degree / Faculty'}${profile.yearOfStudy ? '  |  ' + profile.yearOfStudy : ''}`,
    profile.fundingType === 'nsfas' ? 'Funded by NSFAS' : profile.fundingType === 'bursary' ? 'Bursary recipient' : profile.fundingType === 'scholarship' ? 'Scholarship recipient' : '',
    modules.length ? '\nRelevant modules: ' + modules.slice(0, 8).map(m => m.module_name).join(', ') : '',
    '',
    skills.length ? '━━━ SKILLS ━━━\n' + skills.join('  ·  ') : '',
    languages.length ? '\n━━━ LANGUAGES ━━━\n' + languages.join('  ·  ') : '',
    activities.length ? '\n━━━ ACTIVITIES & INVOLVEMENT ━━━\n' + activities.map(a => `• ${a}`).join('\n') : '',
  ].filter(Boolean).join('\n').trim()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cvText).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const novaPrompt = encodeURIComponent(
    `Please help me improve my CV. Here is my current draft:\n\n${cvText}\n\nI am a ${profile.yearOfStudy || 'university'} student at ${profile.university || 'a South African university'} studying ${profile.faculty || 'my degree'}. Please suggest improvements, better wording, and what else I should add.`
  )

  if (!loaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
        Loading your CV…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Summary */}
      <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '16px' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10, fontWeight: 600 }}>Personal summary</div>
        <textarea
          value={summary}
          onChange={e => setSummary(e.target.value)}
          onBlur={() => save({ summary })}
          placeholder="e.g. Motivated 2nd-year BCom student passionate about financial markets and data analysis. Seeking to apply analytical skills and a work ethic shaped by 3 years on NSFAS…"
          rows={3}
          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '10px 12px', color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </div>

      {/* Education (auto) */}
      <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Education</div>
          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 9999, background: 'rgba(78,207,158,0.1)', color: '#4ecf9e', border: '0.5px solid rgba(78,207,158,0.2)' }}>Auto-filled</span>
        </div>
        {profile.university ? (
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{profile.university}</div>
            {profile.faculty && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{profile.faculty}</div>}
            {profile.yearOfStudy && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{profile.yearOfStudy}</div>}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Complete your profile to auto-fill education details.</div>
        )}
        {modules.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>Relevant modules ({modules.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {modules.slice(0, 10).map(m => (
                <span key={m.id} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 9999, background: `${m.color ?? '#4ecf9e'}15`, border: `0.5px solid ${m.color ?? '#4ecf9e'}30`, color: m.color ?? '#4ecf9e' }}>{m.module_name}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Skills */}
      <ChipSection
        title="Skills"
        chips={skills}
        input={skillInput}
        setInput={setSkillInput}
        placeholder="Type a skill + Enter"
        suggestions={SKILL_SUGGESTIONS.filter(s => !skills.includes(s))}
        onAdd={v => {
          const updated = v.trim() && !skills.includes(v.trim()) ? [...skills, v.trim()] : skills
          addChip(skills, setSkills, v)
          setSkillInput('')
          setTimeout(() => save({ skills: updated }), 0)
          dispatchXP('cv_skill_added')
        }}
        onRemove={v => {
          const updated = skills.filter(s => s !== v)
          setSkills(updated)
          setTimeout(() => save({ skills: updated }), 0)
        }}
      />

      {/* Activities */}
      <ChipSection
        title="Activities & Involvement"
        chips={activities}
        input={actInput}
        setInput={setActInput}
        placeholder="Add activity + Enter"
        suggestions={ACTIVITY_SUGGESTIONS.filter(a => !activities.includes(a))}
        onAdd={v => {
          const updated = v.trim() && !activities.includes(v.trim()) ? [...activities, v.trim()] : activities
          addChip(activities, setActivities, v)
          setActInput('')
          setTimeout(() => save({ activities: updated }), 0)
        }}
        onRemove={v => {
          const updated = activities.filter(a => a !== v)
          setActivities(updated)
          setTimeout(() => save({ activities: updated }), 0)
        }}
      />

      {/* Languages */}
      <ChipSection
        title="Languages"
        chips={languages}
        input={langInput}
        setInput={setLangInput}
        placeholder="Add language + Enter"
        suggestions={['isiZulu','isiXhosa','Afrikaans','Sesotho','Setswana','Sepedi','Xitsonga','siSwati','Tshivenda','isiNdebele'].filter(l => !languages.includes(l))}
        onAdd={v => {
          const updated = v.trim() && !languages.includes(v.trim()) ? [...languages, v.trim()] : languages
          addChip(languages, setLanguages, v)
          setLangInput('')
          setTimeout(() => save({ languages: updated }), 0)
        }}
        onRemove={v => {
          const updated = languages.filter(l => l !== v)
          setLanguages(updated)
          setTimeout(() => save({ languages: updated }), 0)
        }}
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => setPreview(!preview)}
          style={{ flex: 1, padding: '11px 0', borderRadius: 11, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora,sans-serif' }}
        >
          {preview ? 'Hide preview' : 'Preview CV'}
        </button>
        <button
          onClick={handleCopy}
          style={{ flex: 1, padding: '11px 0', borderRadius: 11, background: copied ? '#4ecf9e' : 'rgba(78,207,158,0.15)', color: copied ? '#0a0b10' : '#4ecf9e', border: '1px solid rgba(78,207,158,0.25)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Sora,sans-serif', transition: 'all 0.2s' }}
        >
          {copied ? 'Copied!' : 'Copy text'}
        </button>
      </div>

      {preview && (
        <div style={{ background: '#0a0b10', border: '1px solid #1e1f2e', borderRadius: 14, padding: '16px', fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {cvText}
        </div>
      )}

      {/* Nova improve CTA */}
      <Link href={`/nova?prompt=${novaPrompt}`} style={{ textDecoration: 'none' }}>
        <div style={{ background: 'linear-gradient(135deg,#12102a,#1a1530)', border: '1px solid rgba(155,111,212,0.25)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#9b6fd4,#6b3fa0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✦</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#c5a8f0', fontFamily: 'Sora,sans-serif' }}>Ask Nova to improve your CV</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Nova will rewrite, strengthen, and suggest missing sections</div>
          </div>
          <span style={{ color: '#9b6fd4', fontSize: 16 }}>→</span>
        </div>
      </Link>
    </div>
  )
}

function ChipSection({ title, chips, input, setInput, placeholder, suggestions, onAdd, onRemove }: {
  title: string; chips: string[]; input: string; setInput: (v: string) => void
  placeholder: string; suggestions: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void
}) {
  return (
    <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '16px' }}>
      <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10, fontWeight: 600 }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: chips.length ? 10 : 0 }}>
        {chips.map(c => (
          <span key={c} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 9999, background: 'rgba(112,144,208,0.1)', border: '0.5px solid rgba(112,144,208,0.25)', color: '#7090d0', display: 'flex', alignItems: 'center', gap: 5 }}>
            {c}
            <button onClick={() => onRemove(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(112,144,208,0.5)', fontSize: 10, padding: 0, lineHeight: 1 }}>✕</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { onAdd(input); e.preventDefault() } }}
          placeholder={placeholder}
          style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '8px 12px', color: 'rgba(255,255,255,0.7)', fontSize: 12, outline: 'none' }}
        />
        <button onClick={() => onAdd(input)} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: 'rgba(112,144,208,0.15)', color: '#7090d0', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>+</button>
      </div>
      {suggestions.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {suggestions.slice(0, 6).map(s => (
            <button key={s} onClick={() => onAdd(s)} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 9999, background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MOCK INTERVIEWER
══════════════════════════════════════════════════════════════ */

interface InterviewMsg {
  role: 'system' | 'interviewer' | 'candidate'
  text: string
  score?: number
  feedback?: string
}

const ROLE_PRESETS = [
  { label: 'Graduate Analyst', icon: '📊', field: 'Finance / Business' },
  { label: 'Junior Developer', icon: '💻', field: 'IT / Engineering' },
  { label: 'Graduate Nurse',   icon: '🏥', field: 'Health Sciences'   },
  { label: 'Teaching Intern',  icon: '🎓', field: 'Education'         },
  { label: 'HR Graduate',      icon: '🤝', field: 'Human Resources'   },
  { label: 'Custom role…',     icon: '✏️', field: ''                  },
]

function MockInterviewer({ profile, modules }: { profile: Props['profile']; modules: Props['modules'] }) {
  const [role, setRole]               = useState('')
  const [customRole, setCustomRole]   = useState('')
  const [started, setStarted]         = useState(false)
  const [messages, setMessages]       = useState<InterviewMsg[]>([])
  const [answer, setAnswer]           = useState('')
  const [loading, setLoading]         = useState(false)
  const [qIndex, setQIndex]           = useState(0)
  const [done, setDone]               = useState(false)
  const [questions, setQuestions]     = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  const MAX_Q = 5
  const effectiveRole = role === 'Custom role…' ? customRole : role

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startInterview = async () => {
    if (!effectiveRole.trim()) return
    setLoading(true)
    setStarted(true)

    const systemPrompt = `You are an interviewer at a South African company conducting a structured job interview for a ${effectiveRole} position.
The candidate is: ${profile.name || 'a student'}, ${profile.yearOfStudy || 'university student'} at ${profile.university || 'a SA university'}, studying ${profile.faculty || 'their degree'}.
Their modules include: ${modules.slice(0,6).map(m => m.module_name).join(', ') || 'various modules'}.

Generate exactly ${MAX_Q} interview questions — a mix of:
- 2 behavioural (STAR-format, "Tell me about a time…")
- 2 situational ("What would you do if…")
- 1 motivation / fit question

Return ONLY a JSON array of ${MAX_Q} question strings. No other text.`

    try {
      const res = await fetch('/api/nova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: systemPrompt }],
          systemOverride: 'You are an interview question generator. Return only valid JSON arrays.',
        }),
      })
      const data = await res.json()
      const raw = data.content ?? data.message ?? ''
      const match = raw.match(/\[[\s\S]*\]/)
      const qs: string[] = match ? JSON.parse(match[0]) : []
      if (qs.length) {
        setQuestions(qs)
        setMessages([{ role: 'interviewer', text: `Welcome! I'm interviewing you for the ${effectiveRole} role. Let's begin.\n\n**Question 1 of ${MAX_Q}:**\n${qs[0]}` }])
        setQIndex(0)
      } else {
        throw new Error('No questions parsed')
      }
    } catch {
      setMessages([{ role: 'system', text: 'Could not generate questions. Please check your Nova connection and try again.' }])
      setStarted(false)
    }
    setLoading(false)
  }

  const submitAnswer = async () => {
    if (!answer.trim() || loading) return
    const userAnswer = answer.trim()
    setAnswer('')
    setLoading(true)

    const newMessages: InterviewMsg[] = [
      ...messages,
      { role: 'candidate', text: userAnswer },
    ]
    setMessages(newMessages)

    const evalPrompt = `You are evaluating a job interview answer for a ${effectiveRole} role at a SA company.

Question: "${questions[qIndex]}"
Candidate answer: "${userAnswer}"

Score the answer 1-10 and give ONE sentence of specific, constructive feedback (max 25 words). Be honest — don't be too kind.
Return ONLY valid JSON: {"score": 7, "feedback": "Good structure but lacked a concrete measurable outcome."}`

    try {
      const res = await fetch('/api/nova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: evalPrompt }],
          systemOverride: 'You are an interview evaluator. Return only valid JSON.',
        }),
      })
      const data = await res.json()
      const raw = data.content ?? data.message ?? ''
      const match = raw.match(/\{[\s\S]*?\}/)
      const eval_ = match ? JSON.parse(match[0]) : { score: 5, feedback: 'Answer received.' }

      const nextQ = qIndex + 1
      const isDone = nextQ >= questions.length

      const updatedMessages: InterviewMsg[] = [
        ...newMessages,
        {
          role: 'interviewer',
          text: isDone
            ? `Thank you — that concludes the interview. I'll now review all your answers.`
            : `**Question ${nextQ + 1} of ${MAX_Q}:**\n${questions[nextQ]}`,
          score: eval_.score,
          feedback: eval_.feedback,
        },
      ]
      setMessages(updatedMessages)
      setQIndex(nextQ)
      if (isDone) {
        setDone(true)
        dispatchXP('mock_interview_complete')
      }
    } catch {
      setMessages([...newMessages, { role: 'system', text: 'Evaluation failed. Try again.' }])
    }
    setLoading(false)
  }

  const scores = messages.filter(m => m.score !== undefined).map(m => m.score!)
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  const scoreColor = avgScore ? (avgScore >= 8 ? '#4ecf9e' : avgScore >= 6 ? '#c9a84c' : '#ff6b6b') : '#7090d0'

  const novaDebriefPrompt = encodeURIComponent(
    `I just completed a mock interview for a ${effectiveRole} role. My scores were: ${scores.join(', ')}. Average: ${avgScore}/10. ` +
    `Feedback I received: ${messages.filter(m => m.feedback).map(m => m.feedback).join(' | ')}. ` +
    `Can you help me understand where I can improve and give me tips for my next interview?`
  )

  if (!started) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '18px 16px' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14, fontWeight: 600 }}>Choose a role to interview for</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {ROLE_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => setRole(p.label)}
                style={{
                  padding: '12px', borderRadius: 12, border: `1px solid ${role === p.label ? 'rgba(112,144,208,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  background: role === p.label ? 'rgba(112,144,208,0.12)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{p.icon}</div>
                <div style={{ fontSize: 12, color: role === p.label ? '#7090d0' : 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{p.label}</div>
                {p.field && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{p.field}</div>}
              </button>
            ))}
          </div>
          {role === 'Custom role…' && (
            <input
              value={customRole}
              onChange={e => setCustomRole(e.target.value)}
              placeholder="e.g. Junior Accountant at PwC"
              style={{ marginTop: 10, width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '10px 12px', color: 'rgba(255,255,255,0.75)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
            />
          )}
        </div>

        <div style={{ background: 'rgba(112,144,208,0.06)', border: '1px solid rgba(112,144,208,0.15)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            Nova will generate <strong style={{ color: 'rgba(255,255,255,0.65)' }}>{MAX_Q} interview questions</strong> tailored to your background. Answer each one as you would in a real interview. You&apos;ll get a score and feedback after each answer.
          </div>
        </div>

        <button
          onClick={startInterview}
          disabled={!effectiveRole.trim() || loading}
          style={{
            padding: '13px 0', borderRadius: 12, border: 'none', cursor: effectiveRole.trim() ? 'pointer' : 'not-allowed', opacity: effectiveRole.trim() ? 1 : 0.4,
            background: 'linear-gradient(135deg, #7090d0, #9b6fd4)',
            color: '#fff', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14,
            boxShadow: '0 4px 16px rgba(112,144,208,0.3)',
          }}
        >
          {loading ? 'Generating questions…' : 'Start interview →'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Mock Interview</div>
          <div style={{ fontSize: 13, color: '#7090d0', fontWeight: 600, marginTop: 2 }}>{effectiveRole}</div>
        </div>
        {avgScore !== null && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 22, fontWeight: 700, color: scoreColor }}>{avgScore}<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>/10</span></div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>avg score</div>
          </div>
        )}
      </div>

      {/* Chat */}
      <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '14px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 420, overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'interviewer' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(112,144,208,0.15)', border: '1px solid rgba(112,144,208,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>💼</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: '#7090d0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Interviewer</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{msg.text}</div>
                  {msg.score !== undefined && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: `${msg.score >= 8 ? 'rgba(78,207,158' : msg.score >= 6 ? 'rgba(201,168,76' : 'rgba(255,107,107'},0.08)`, border: `0.5px solid ${msg.score >= 8 ? 'rgba(78,207,158' : msg.score >= 6 ? 'rgba(201,168,76' : 'rgba(255,107,107'},0.25)`, borderRadius: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 16, fontWeight: 700, color: msg.score >= 8 ? '#4ecf9e' : msg.score >= 6 ? '#c9a84c' : '#ff6b6b', flexShrink: 0 }}>{msg.score}/10</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{msg.feedback}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {msg.role === 'candidate' && (
              <div style={{ display: 'flex', gap: 10, flexDirection: 'row-reverse' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(78,207,158,0.1)', border: '1px solid rgba(78,207,158,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🎓</div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: '#4ecf9e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>You</div>
                  <div style={{ display: 'inline-block', background: 'rgba(78,207,158,0.08)', border: '0.5px solid rgba(78,207,158,0.2)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, textAlign: 'left', maxWidth: '90%' }}>{msg.text}</div>
                </div>
              </div>
            )}
            {msg.role === 'system' && (
              <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', padding: '4px 0' }}>{msg.text}</div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '4px 0' }}>
            {[0,1,2].map(i => <div key={i} className="skeleton-row" style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(112,144,208,0.4)', animationDelay: `${i * 0.15}s` }} />)}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!done ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submitAnswer() }}
            placeholder="Type your answer… (Ctrl+Enter to submit)"
            rows={3}
            disabled={loading}
            style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '10px 12px', color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.6, resize: 'none', outline: 'none', fontFamily: 'inherit' }}
          />
          <button
            onClick={submitAnswer}
            disabled={!answer.trim() || loading}
            style={{ padding: '0 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7090d0,#9b6fd4)', color: '#fff', fontSize: 20, cursor: answer.trim() ? 'pointer' : 'not-allowed', opacity: answer.trim() ? 1 : 0.4 }}
          >→</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'rgba(78,207,158,0.07)', border: '1px solid rgba(78,207,158,0.2)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>🎉</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#4ecf9e', fontFamily: 'Sora,sans-serif' }}>Interview complete!</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>Final score: <strong style={{ color: scoreColor }}>{avgScore}/10</strong> across {MAX_Q} questions</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setStarted(false); setMessages([]); setDone(false); setQIndex(0); setRole('') }} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer' }}>Try again</button>
            <Link href={`/nova?prompt=${novaDebriefPrompt}`} style={{ flex: 2, textDecoration: 'none' }}>
              <div style={{ padding: '10px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#9b6fd4,#7090d0)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center', fontFamily: 'Sora,sans-serif' }}>Debrief with Nova →</div>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   SKILLS GAP ANALYSIS
══════════════════════════════════════════════════════════════ */

interface CareerPath {
  label: string; icon: string; field: string
  coreSkills: string[]; niceToHave: string[]; certifications: string[]
}

const CAREER_PATHS: CareerPath[] = [
  {
    label: 'Software Engineer', icon: '💻', field: 'Technology',
    coreSkills: ['Programming (Python/Java/JS)', 'Data Structures', 'Algorithms', 'Version Control (Git)', 'Problem Solving', 'SQL / Databases'],
    niceToHave: ['Cloud (AWS/GCP/Azure)', 'DevOps / Docker', 'Machine Learning', 'Mobile Development'],
    certifications: ['AWS Certified Cloud Practitioner', 'Google IT Support Certificate', 'freeCodeCamp'],
  },
  {
    label: 'Financial Analyst', icon: '📊', field: 'Finance / Accounting',
    coreSkills: ['Financial Modelling', 'Excel / Google Sheets', 'Accounting Principles', 'Data Analysis', 'Report Writing', 'Regulatory Compliance (IFRS/GAAP)'],
    niceToHave: ['Python / R for Finance', 'Bloomberg Terminal', 'Power BI / Tableau', 'JSE regulations'],
    certifications: ['CFA Level 1', 'SAICA CA(SA)', 'CIMA', 'CFP'],
  },
  {
    label: 'Registered Nurse', icon: '🏥', field: 'Health Sciences',
    coreSkills: ['Clinical Assessment', 'Patient Care', 'Pharmacology', 'Medical Terminology', 'SANC Registration', 'Emergency Procedures'],
    niceToHave: ['ICU / Trauma specialisation', 'Community health', 'Mental health nursing', 'Research methods'],
    certifications: ['SANC', 'ACLS', 'BLS Certification'],
  },
  {
    label: 'Marketing Specialist', icon: '📣', field: 'Business / Marketing',
    coreSkills: ['Digital Marketing', 'Content Creation', 'Data Analytics', 'SEO / SEM', 'Social Media Management', 'Brand Strategy'],
    niceToHave: ['Video editing', 'Graphic design (Canva/Adobe)', 'Email marketing', 'CRM tools (HubSpot/Salesforce)'],
    certifications: ['Google Digital Marketing', 'Meta Blueprint', 'HubSpot Academy'],
  },
  {
    label: 'Educator / Teacher', icon: '🎓', field: 'Education',
    coreSkills: ['Curriculum Design', 'Classroom Management', 'Assessment & Feedback', 'Communication', 'Subject Mastery', 'SACE registration'],
    niceToHave: ['EdTech tools', 'Inclusive education', 'Special needs support', 'Online teaching'],
    certifications: ['PGCE', 'SACE', 'Funza Lushaka bursary qualification'],
  },
  {
    label: 'Civil / Mechanical Engineer', icon: '⚙️', field: 'Engineering',
    coreSkills: ['Mathematics', 'Physics', 'CAD / AutoCAD', 'Project Management', 'Technical Drawing', 'ECSA registration'],
    niceToHave: ['BIM / Revit', 'Python for engineering', 'GIS / Surveying', 'Construction management'],
    certifications: ['ECSA registration', 'PMP', 'Green Building Council SA'],
  },
  {
    label: 'Lawyer / Advocate', icon: '⚖️', field: 'Law',
    coreSkills: ['Legal Research', 'Constitutional Law', 'Contract Law', 'Legal Writing', 'Litigation', 'LLB qualification'],
    niceToHave: ['Corporate / Commercial law', 'Conveyancing', 'Labour law', 'International law'],
    certifications: ['LSSA admission', 'GDE (General Degree Examination)', 'LPFF articles'],
  },
  {
    label: 'HR Manager', icon: '🤝', field: 'Human Resources',
    coreSkills: ['Labour Law (LRA/BCEA)', 'Recruitment & Selection', 'Performance Management', 'Training & Development', 'Payroll basics', 'Employment Equity Act'],
    niceToHave: ['HR systems (SAP/SAGE)', 'Organisational development', 'CCMA procedures', 'Change management'],
    certifications: ['SABPP registration', 'CIPD', 'HR Analytics certificate'],
  },
]

function SkillsGap({ modules }: { modules: Props['modules'] }) {
  const [selected, setSelected]     = useState<CareerPath | null>(null)
  const [addedSkills, setAddedSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [loaded, setLoaded]         = useState(false)

  // Load career data from Supabase on mount
  useEffect(() => {
    loadCVProfile().then(data => {
      if (data.careerPath) {
        const found = CAREER_PATHS.find(c => c.label === data.careerPath)
        if (found) setSelected(found)
      }
      setAddedSkills(data.careerSkills ?? [])
      setLoaded(true)
    })
    dispatchXP('skills_gap_viewed')
  }, [])

  const moduleNames = modules.map(m => m.module_name.toLowerCase())

  const matchSkill = (skill: string): boolean => {
    const sl = skill.toLowerCase()
    return addedSkills.some(s => s.toLowerCase().includes(sl.split(' ')[0]) || sl.includes(s.toLowerCase())) ||
      moduleNames.some(m => m.includes(sl.split(' ')[0]) || sl.split(' ').some(w => w.length > 4 && m.includes(w)))
  }

  const handleSelect = (cp: CareerPath) => {
    setSelected(cp)
    saveCVProfile({ careerPath: cp.label }).catch(err => console.error('[SkillsGap] save careerPath error:', err))
  }

  const handleAddSkill = (s: string) => {
    const v = s.trim()
    if (v && !addedSkills.includes(v)) {
      const updated = [...addedSkills, v]
      setAddedSkills(updated)
      saveCVProfile({ careerSkills: updated }).catch(err => console.error('[SkillsGap] save careerSkills error:', err))
    }
    setSkillInput('')
  }

  const handleRemoveSkill = (s: string) => {
    const updated = addedSkills.filter(x => x !== s)
    setAddedSkills(updated)
    saveCVProfile({ careerSkills: updated }).catch(err => console.error('[SkillsGap] save careerSkills error:', err))
  }

  if (!loaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
        Loading career data…
      </div>
    )
  }

  if (!selected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '18px 16px' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14, fontWeight: 600 }}>Choose your target career</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CAREER_PATHS.map(cp => (
              <button
                key={cp.label}
                onClick={() => handleSelect(cp)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 11, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
              >
                <span style={{ fontSize: 22, flexShrink: 0 }}>{cp.icon}</span>
                <div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{cp.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{cp.field}</div>
                </div>
                <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const coreMatched   = selected.coreSkills.filter(s => matchSkill(s))
  const coreMissing   = selected.coreSkills.filter(s => !matchSkill(s))
  const niceMatched   = selected.niceToHave.filter(s => matchSkill(s))
  const niceMissing   = selected.niceToHave.filter(s => !matchSkill(s))
  const readiness     = Math.round(((coreMatched.length * 2 + niceMatched.length) / (selected.coreSkills.length * 2 + selected.niceToHave.length)) * 100)
  const readinessColor = readiness >= 70 ? '#4ecf9e' : readiness >= 40 ? '#c9a84c' : '#ff6b6b'

  const novaPrompt = encodeURIComponent(
    `I want to become a ${selected.label}. I have these skills/modules: ${[...addedSkills, ...modules.map(m => m.module_name)].join(', ')}. ` +
    `Missing core skills: ${coreMissing.join(', ')}. Missing nice-to-haves: ${niceMissing.join(', ')}. ` +
    `My career readiness is ${readiness}%. Can you give me a personalised 6-month plan to close the skills gap?`
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Career header */}
      <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span style={{ fontSize: 28 }}>{selected.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontFamily: 'Sora,sans-serif' }}>{selected.label}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{selected.field}</div>
          </div>
          <button onClick={() => setSelected(null)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>Change</button>
        </div>

        {/* Readiness ring */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 14px', background: `${readinessColor}0d`, border: `1px solid ${readinessColor}28`, borderRadius: 11 }}>
          <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
            <svg width={64} height={64} viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={32} cy={32} r={26} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={7} />
              <circle cx={32} cy={32} r={26} fill="none" stroke={readinessColor} strokeWidth={7} strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - readiness / 100)}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono,monospace', fontSize: 13, fontWeight: 700, color: readinessColor }}>{readiness}%</div>
          </div>
          <div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 13, color: readinessColor }}>
              {readiness >= 70 ? 'Strong foundation' : readiness >= 40 ? 'Making progress' : 'Gap to close'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
              {coreMatched.length}/{selected.coreSkills.length} core skills · {niceMatched.length}/{selected.niceToHave.length} extras
            </div>
          </div>
        </div>
      </div>

      {/* Your skills (manual) */}
      <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10, fontWeight: 600 }}>Your skills & experience</div>
        {addedSkills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {addedSkills.map(s => (
              <span key={s} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 9999, background: 'rgba(78,207,158,0.1)', border: '0.5px solid rgba(78,207,158,0.2)', color: '#4ecf9e', display: 'flex', alignItems: 'center', gap: 4 }}>
                {s}
                <button onClick={() => handleRemoveSkill(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(78,207,158,0.5)', fontSize: 9, padding: 0 }}>✕</button>
              </span>
            ))}
          </div>
        )}
        {modules.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginBottom: 5 }}>Auto-detected from your modules</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {modules.slice(0, 8).map(m => (
                <span key={m.id} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 9999, background: `${m.color ?? '#4ecf9e'}10`, border: `0.5px solid ${m.color ?? '#4ecf9e'}25`, color: m.color ?? '#4ecf9e' }}>{m.module_name}</span>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddSkill(skillInput) }} placeholder="Add skill or experience" style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '7px 11px', color: 'rgba(255,255,255,0.7)', fontSize: 12, outline: 'none' }} />
          <button onClick={() => handleAddSkill(skillInput)} style={{ padding: '7px 13px', borderRadius: 9, border: 'none', background: 'rgba(78,207,158,0.12)', color: '#4ecf9e', fontSize: 18, cursor: 'pointer' }}>+</button>
        </div>
      </div>

      {/* Core skills gap */}
      <SkillGroup title="Core skills" required items={selected.coreSkills} matched={coreMatched} />
      <SkillGroup title="Nice to have" required={false} items={selected.niceToHave} matched={niceMatched} />

      {/* Certifications */}
      <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10, fontWeight: 600 }}>Recommended certifications</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {selected.certifications.map((cert, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(201,168,76,0.06)', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: 8 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>🏅</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{cert}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nova plan CTA */}
      <Link href={`/nova?prompt=${novaPrompt}`} style={{ textDecoration: 'none' }}>
        <div style={{ background: 'linear-gradient(135deg,#12102a,#1a1530)', border: '1px solid rgba(155,111,212,0.25)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#9b6fd4,#6b3fa0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✦</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#c5a8f0', fontFamily: 'Sora,sans-serif' }}>Get a personalised 6-month plan</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Nova will map your gap and give you a step-by-step roadmap</div>
          </div>
          <span style={{ color: '#9b6fd4', fontSize: 16 }}>→</span>
        </div>
      </Link>
    </div>
  )
}

function SkillGroup({ title, required, items, matched }: { title: string; required: boolean; items: string[]; matched: string[] }) {
  const matchSet = new Set(matched)
  return (
    <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{title}</div>
        {required && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 9999, background: 'rgba(255,107,107,0.08)', color: '#ff6b6b', border: '0.5px solid rgba(255,107,107,0.2)' }}>Required</span>}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: matched.length === items.length ? '#4ecf9e' : 'rgba(255,255,255,0.3)' }}>{matched.length}/{items.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map(skill => {
          const have = matchSet.has(skill)
          return (
            <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: have ? 'rgba(78,207,158,0.05)' : 'rgba(255,107,107,0.04)', border: `0.5px solid ${have ? 'rgba(78,207,158,0.15)' : 'rgba(255,107,107,0.12)'}`, borderRadius: 8 }}>
              <span style={{ fontSize: 12, flexShrink: 0, color: have ? '#4ecf9e' : '#ff6b6b' }}>{have ? '✓' : '✕'}</span>
              <span style={{ fontSize: 12, color: have ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.4)', flex: 1 }}>{skill}</span>
              {!have && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 9999, background: 'rgba(255,107,107,0.08)', color: '#ff6b6b', border: '0.5px solid rgba(255,107,107,0.18)', flexShrink: 0 }}>Gap</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN CAREER CLIENT
══════════════════════════════════════════════════════════════ */

const TABS = [
  { id: 'cv',        label: 'CV Builder',    icon: '📄' },
  { id: 'interview', label: 'Mock Interview', icon: '🎤' },
  { id: 'skills',    label: 'Skills Gap',    icon: '🎯' },
] as const

type TabId = typeof TABS[number]['id']

export default function CareerClient({ userId: _userId, profile, modules }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('cv')

  return (
    <div className="page-enter min-h-screen pb-24" style={{ background: 'var(--bg-base)' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0', borderBottom: '0.5px solid var(--border-subtle)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 12 }}>
          Career OS
        </h1>

        {/* Tab bar */}
        <div className="flex gap-0 overflow-x-auto scrollbar-none">
          {TABS.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  position: 'relative', display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 14px', fontFamily: 'var(--font-display)', fontSize: '0.78rem',
                  fontWeight: active ? 700 : 400,
                  color: active ? '#7090d0' : 'var(--text-tertiary)',
                  background: 'transparent', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'color 0.15s', flexShrink: 0,
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {active && (
                  <span style={{ position: 'absolute', bottom: 0, left: 4, right: 4, height: 2, borderRadius: '2px 2px 0 0', background: '#7090d0' }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {activeTab === 'cv'        && <CVBuilder     profile={profile} modules={modules} />}
        {activeTab === 'interview' && <MockInterviewer profile={profile} modules={modules} />}
        {activeTab === 'skills'    && <SkillsGap     modules={modules} />}
      </div>
    </div>
  )
}
