'use client'

import Link from 'next/link'

interface Props {
  completedSkills?: string[]
}

interface IncomeEntry {
  income: string
  how: string
  rate: string
  where: string
}

const SKILL_INCOME_MAP: Record<string, IncomeEntry> = {
  'Excel': {
    income: 'Data entry / bookkeeping',
    how: 'Offer to SMEs, spaza shops, salons',
    rate: 'R100–150/hr',
    where: 'Gumtree, local Facebook groups, campus notice board',
  },
  'Microsoft Excel': {
    income: 'Data entry / bookkeeping',
    how: 'Offer to SMEs, spaza shops, salons',
    rate: 'R100–150/hr',
    where: 'Gumtree, local Facebook groups, campus notice board',
  },
  'Social Media': {
    income: 'Social media management',
    how: 'Manage Instagram/Facebook for local businesses',
    rate: 'R500–1,500/month retainer',
    where: 'Cold-email 5 local businesses near you with a free audit offer',
  },
  'Graphic Design': {
    income: 'Flyers and logos',
    how: 'Design for local businesses, events, products',
    rate: 'R150–500 per design',
    where: 'Fiverr, local WhatsApp groups, SRC notice boards',
  },
  'Python': {
    income: 'Tutoring + automation',
    how: 'Tutor students struggling with Python, build simple scripts',
    rate: 'R80–150/hr tutoring',
    where: 'University tutor registration board, campus WhatsApp groups',
  },
  'JavaScript': {
    income: 'Freelance web development',
    how: 'Simple websites for small businesses',
    rate: 'R1,000–5,000 per site',
    where: 'Upwork, local Facebook groups, SRC entrepreneurship events',
  },
  'Microsoft Word': {
    income: 'CV and document formatting',
    how: 'Format CVs, type essays for mature students',
    rate: 'R50–80/document',
    where: 'Campus WhatsApp groups, res notice boards',
  },
  'PowerPoint': {
    income: 'Presentation design',
    how: 'Create slides for professionals and businesses',
    rate: 'R100–300/presentation',
    where: 'LinkedIn, campus WhatsApp groups',
  },
  'Video Editing': {
    income: 'Content creation + editing',
    how: 'Edit reels for local businesses or content creators',
    rate: 'R300–800/video',
    where: 'Instagram DMs to local businesses, TikTok creators',
  },
  'Writing': {
    income: 'Proofreading and copywriting',
    how: 'Proofread assignments, write social media captions',
    rate: 'R50/1,000 words proofreading · R150/post copywriting',
    where: 'Campus WhatsApp groups, Upwork, Fiverr',
  },
}

const CARD_STYLE = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '16px',
}

export default function SkillsToIncome({ completedSkills }: Props) {
  // Deduplicate: filter completed skills, resolve duplicates (Excel / Microsoft Excel)
  const seen = new Set<string>()
  const matchedEntries: { skill: string; entry: IncomeEntry }[] = []

  for (const skill of completedSkills ?? []) {
    const entry = SKILL_INCOME_MAP[skill]
    if (!entry) continue
    // Use income type as dedup key so "Excel" and "Microsoft Excel" don't both show
    if (seen.has(entry.income)) continue
    seen.add(entry.income)
    matchedEntries.push({ skill, entry })
  }

  const isEmpty = matchedEntries.length === 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-xl"
          style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.20)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
              stroke="#fbbf24"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Turn Your Skills Into Income
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {isEmpty
              ? 'Complete a Digital Skills module to unlock income ideas'
              : `${matchedEntries.length} income ${matchedEntries.length === 1 ? 'opportunity' : 'opportunities'} based on your skills`}
          </p>
        </div>
      </div>

      {isEmpty ? (
        /* Empty state */
        <div
          style={CARD_STYLE}
          className="px-5 py-10 text-center"
        >
          <div className="text-4xl mb-3">🎓</div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
            No skills unlocked yet
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
            Complete your first Digital Skills module to see personalised income ideas.
          </p>
          <Link
            href="/skills"
            className="inline-block px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: '#60a5fa', color: '#0a0a0f' }}
          >
            Go to Digital Skills →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {matchedEntries.map(({ skill, entry }) => (
            <div key={skill} style={CARD_STYLE} className="p-4 space-y-3">
              {/* Skill chip */}
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: 'rgba(96,165,250,0.12)',
                    border: '1px solid rgba(96,165,250,0.22)',
                    color: '#60a5fa',
                  }}
                >
                  {skill}
                </span>
              </div>

              {/* Income type */}
              <div>
                <div className="text-xs mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  Income type
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {entry.income}
                </div>
              </div>

              {/* How-to tip */}
              <div>
                <div className="text-xs mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  How to start
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {entry.how}
                </div>
              </div>

              {/* Rate */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{
                  background: 'rgba(78,207,158,0.08)',
                  border: '1px solid rgba(78,207,158,0.18)',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
                    stroke="#4ecf9e"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs font-semibold" style={{ color: '#4ecf9e' }}>
                  {entry.rate}
                </span>
              </div>

              {/* Where to find */}
              <div>
                <div className="text-xs mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  Where to find clients
                </div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                  {entry.where}
                </div>
              </div>
            </div>
          ))}

          {/* Footer nudge */}
          <div
            className="px-4 py-3 rounded-xl text-xs text-center"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              color: 'var(--text-tertiary)',
            }}
          >
            Complete more Digital Skills modules to unlock more income ideas.{' '}
            <Link href="/skills" className="font-semibold" style={{ color: '#60a5fa' }}>
              Browse modules →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
