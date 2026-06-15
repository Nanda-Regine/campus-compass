'use client'

import { useState, useEffect } from 'react'
import { dispatchXP } from '@/lib/xp-engine'

/* ── Types ──────────────────────────────────────────────────── */
interface ChecklistItem {
  id: string
  section: number
  label: string
}

/* ── Data ───────────────────────────────────────────────────── */
const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'photo',             section: 0, label: 'Professional photo or clear emoji avatar set' },
  { id: 'headline',          section: 0, label: 'Headline written (Student at X | Interested in Y)' },
  { id: 'about',             section: 0, label: 'About section written (3-5 sentences)' },
  { id: 'education',         section: 0, label: 'Education added with relevant coursework' },
  { id: 'skills',            section: 0, label: 'Top 10 skills added' },
  { id: 'activity',          section: 1, label: 'Posted or commented in the last 2 weeks' },
  { id: 'connections_50',    section: 1, label: '50+ connections reached' },
  { id: 'connections_500',   section: 1, label: '500+ connections (search visibility)' },
  { id: 'alumni_msg',        section: 2, label: 'Sent first alumni connection message' },
  { id: 'alumni_chat',       section: 2, label: 'Had a virtual coffee chat with an alum' },
  { id: 'post_1',            section: 3, label: 'Published first post (insight from a class/lecture)' },
  { id: 'post_5',            section: 3, label: 'Published 5 posts total' },
  { id: 'recruiter_follow',  section: 4, label: 'Followed 3 SA companies you want to work at' },
  { id: 'recruiter_apply',   section: 4, label: 'Applied to a graduate programme via LinkedIn' },
]

const SECTIONS = [
  {
    id: 0,
    title: 'Your Profile',
    icon: '👤',
    content: (
      <>
        <p style={{ fontSize: 13, color: '#e5e7eb', lineHeight: 1.7, margin: '0 0 12px' }}>
          Your profile is your digital first impression. Make it count before you apply anywhere.
        </p>
        <div style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#818cf8', marginBottom: 6, fontWeight: 700 }}>Headline Formula</div>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
            &ldquo;[Degree] Student at [University] | Passionate about [X] | Seeking [Y] opportunities&rdquo;
          </p>
        </div>
        <div style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#818cf8', marginBottom: 6, fontWeight: 700 }}>About Template</div>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
            &ldquo;I&apos;m a [year] [degree] student at [university], focused on [specialization]. I&apos;m passionate about [topic] and [topic]. I&apos;m seeking [internship/graduate programme] opportunities in [industry] in South Africa.&rdquo;
          </p>
        </div>
      </>
    ),
  },
  {
    id: 1,
    title: 'The Algorithm',
    icon: '⚡',
    content: (
      <>
        <p style={{ fontSize: 13, color: '#e5e7eb', lineHeight: 1.7, margin: '0 0 12px' }}>
          Understanding how LinkedIn&apos;s algorithm works gives you an unfair advantage.
        </p>
        {[
          { tip: 'Posting 1x/week beats 5x/week in bursts', detail: 'Consistency outperforms volume every time.' },
          { tip: 'Commenting = posting visibility', detail: 'Commenting on others\' posts gets you the same reach as posting yourself.' },
          { tip: '500+ connections unlocks search visibility', detail: 'Recruiters filter by network size. Hit 500 to appear in more searches.' },
          { tip: 'Native content gets 3x more reach', detail: 'Posts without external links perform significantly better. Keep your links in comments.' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <span style={{ color: '#818cf8', fontSize: 14, flexShrink: 0, marginTop: 1 }}>→</span>
            <div>
              <div style={{ fontSize: 12, color: '#e5e7eb', fontWeight: 600 }}>{item.tip}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{item.detail}</div>
            </div>
          </div>
        ))}
      </>
    ),
  },
  {
    id: 2,
    title: 'Connecting with Alumni',
    icon: '🤝',
    content: (
      <>
        <p style={{ fontSize: 13, color: '#e5e7eb', lineHeight: 1.7, margin: '0 0 12px' }}>
          Warm outreach to alumni is the highest-ROI action you can take on LinkedIn.
        </p>
        <div style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#818cf8', marginBottom: 6, fontWeight: 700 }}>Message Template</div>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, lineHeight: 1.7, fontStyle: 'italic' }}>
            &ldquo;Hi [Name], I&apos;m a [year] [degree] student at [university]. I see you also studied there — I&apos;m interested in [their field]. Would you be available for a 15-minute virtual chat? No pressure if you&apos;re busy!&rdquo;
          </p>
        </div>
        <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>What improves response rate:</div>
        {['Specific ask', 'Short message (under 100 words)', 'Mention a shared connection or experience'].map((tip, i) => (
          <div key={i} style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ color: '#818cf8' }}>✓</span> {tip}
          </div>
        ))}
      </>
    ),
  },
  {
    id: 3,
    title: 'Your First Post',
    icon: '✍️',
    content: (
      <>
        <p style={{ fontSize: 13, color: '#e5e7eb', lineHeight: 1.7, margin: '0 0 12px' }}>
          Use the Hook + Context + Lesson formula to write posts that get noticed.
        </p>
        <div style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#818cf8', marginBottom: 6, fontWeight: 700 }}>Example Post</div>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, lineHeight: 1.7, fontStyle: 'italic' }}>
            &ldquo;I learned something surprising in my Finance lecture today. [context in 2-3 lines]. The lesson: [1-2 lines]. What&apos;s your take? [question]&rdquo;
          </p>
        </div>
        <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>Post ideas:</div>
        {['A lecture insight', 'A book you read', 'A problem you solved', 'A campus event you attended'].map((idea, i) => (
          <div key={i} style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ color: '#818cf8' }}>→</span> {idea}
          </div>
        ))}
      </>
    ),
  },
  {
    id: 4,
    title: 'SA Recruiters',
    icon: '🏢',
    content: (
      <>
        <p style={{ fontSize: 13, color: '#e5e7eb', lineHeight: 1.7, margin: '0 0 12px' }}>
          These companies actively recruit SA students on LinkedIn. Follow them and comment on their posts.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { company: 'PwC', detail: 'Audit + advisory graduates. Look for "PwC South Africa Graduate Programme"' },
            { company: 'Deloitte', detail: 'Finance + tech. Active on LinkedIn. Comment on their posts to get noticed.' },
            { company: 'ABSA', detail: 'Banking + fintech. Dedicated campus recruitment team.' },
            { company: 'FNB', detail: 'Tech-forward bank. Campus ambassador programme.' },
            { company: 'MTN', detail: 'Telecom + digital. Look for "MTN Graduate Programme"' },
            { company: 'Naspers/Prosus', detail: 'Tech + media. Wits + UCT heavy recruitment.' },
            { company: 'Discovery', detail: 'Insurance + health tech. Data science focused.' },
            { company: 'Anglo American', detail: 'Mining + sustainability. Engineering + science.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', flexShrink: 0, minWidth: 120 }}>{item.company}</span>
              <span style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>{item.detail}</span>
            </div>
          ))}
        </div>
      </>
    ),
  },
]

/* ── Component ──────────────────────────────────────────────── */
export default function LinkedInBootcamp() {
  const [activeSection, setActiveSection] = useState<number>(0)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const saved = localStorage.getItem('linkedin_checklist')
      if (saved) setChecklist(JSON.parse(saved) as Record<string, boolean>)
    } catch {
      // ignore parse errors
    }
  }, [])

  const toggleItem = (id: string) => {
    const updated = { ...checklist, [id]: !checklist[id] }
    setChecklist(updated)
    try {
      localStorage.setItem('linkedin_checklist', JSON.stringify(updated))
    } catch {
      // ignore storage errors
    }
    if (!checklist[id]) {
      dispatchXP('cv_skill_added')
    }
  }

  const totalItems = CHECKLIST_ITEMS.length
  const checkedCount = CHECKLIST_ITEMS.filter(item => checklist[item.id]).length
  const completionPct = Math.round((checkedCount / totalItems) * 100)
  const isComplete = completionPct === 100

  const getSectionCompletion = (sectionId: number) => {
    const sectionItems = CHECKLIST_ITEMS.filter(item => item.section === sectionId)
    const sectionChecked = sectionItems.filter(item => checklist[item.id]).length
    return { checked: sectionChecked, total: sectionItems.length }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Overall progress */}
      {isComplete ? (
        <div style={{
          background: 'rgba(52,211,153,0.08)',
          border: '1px solid rgba(52,211,153,0.25)',
          borderRadius: 16,
          padding: '20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: '#34d399', marginBottom: 4 }}>
            LinkedIn Bootcamp complete!
          </div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>
            You&apos;ve completed all {totalItems} steps. Your LinkedIn profile is recruiter-ready.
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          padding: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb', fontFamily: 'Sora, sans-serif' }}>LinkedIn Profile Strength</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{checkedCount} of {totalItems} steps complete</div>
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 28,
              fontWeight: 700,
              color: completionPct >= 75 ? '#34d399' : completionPct >= 40 ? '#f59e0b' : '#818cf8',
            }}>
              {completionPct}%
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 9999, height: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              borderRadius: 9999,
              background: completionPct >= 75 ? 'linear-gradient(90deg,#34d399,#059669)' : completionPct >= 40 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#818cf8,#6366f1)',
              width: `${completionPct}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}

      {/* Section accordion */}
      {SECTIONS.map(section => {
        const { checked, total } = getSectionCompletion(section.id)
        const sectionComplete = checked === total
        const isOpen = activeSection === section.id
        const sectionItems = CHECKLIST_ITEMS.filter(item => item.section === section.id)

        return (
          <div
            key={section.id}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: isOpen ? '1px solid rgba(129,140,248,0.25)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}
          >
            {/* Section header */}
            <button
              onClick={() => setActiveSection(isOpen ? -1 : section.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{section.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', fontFamily: 'Sora, sans-serif' }}>{section.title}</div>
                <div style={{ fontSize: 10, color: sectionComplete ? '#34d399' : '#9ca3af', marginTop: 2 }}>
                  {checked}/{total} complete
                </div>
              </div>
              {/* Section mini progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    borderRadius: 9999,
                    background: sectionComplete ? '#34d399' : '#818cf8',
                    width: `${(checked / total) * 100}%`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <span style={{ fontSize: 12, color: '#9ca3af', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', display: 'inline-block' }}>
                  ▾
                </span>
              </div>
            </button>

            {/* Section content */}
            {isOpen && (
              <div style={{ padding: '0 16px 16px' }}>
                {/* Advice content */}
                <div style={{ marginBottom: 14 }}>
                  {section.content}
                </div>

                {/* Checklist items */}
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8, fontWeight: 600 }}>
                  Your checklist
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sectionItems.map(item => {
                    const checked_ = !!checklist[item.id]
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          background: checked_ ? 'rgba(129,140,248,0.08)' : 'rgba(255,255,255,0.02)',
                          border: `0.5px solid ${checked_ ? 'rgba(129,140,248,0.25)' : 'rgba(255,255,255,0.06)'}`,
                          borderRadius: 10,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{
                          width: 18,
                          height: 18,
                          borderRadius: 5,
                          border: `1.5px solid ${checked_ ? '#818cf8' : 'rgba(255,255,255,0.2)'}`,
                          background: checked_ ? '#818cf8' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.15s',
                        }}>
                          {checked_ && <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 12, color: checked_ ? '#e5e7eb' : '#9ca3af', flex: 1, lineHeight: 1.4, textDecoration: checked_ ? 'line-through' : 'none' }}>
                          {item.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
