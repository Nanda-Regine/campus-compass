'use client'

import { useState } from 'react'

const ACCENT = '#c084fc'

interface GlossaryTerm { term: string; plain: string }
interface AdminStep { title: string; steps: string[] }
interface EmergencyContact { label: string; value: string; note: string }

const GLOSSARY: GlossaryTerm[] = [
  { term: "Dean's Merit List", plain: "A list of top-performing students published each semester. Making this list can unlock bursaries and scholarship opportunities." },
  { term: "Supplementary exam", plain: "A second-chance exam offered when you fail by a small margin (usually within 5–10%). Check your faculty's rules — not all modules offer sups." },
  { term: "Bursary vs Scholarship", plain: "A bursary is awarded based on financial need. A scholarship is awarded based on academic merit. You can often hold both at the same time." },
  { term: "NSFAS appeal", plain: "If NSFAS rejects your application, you have the right to challenge the decision. Submit your appeal with supporting documents through the NSFAS portal." },
  { term: "Academic exclusion", plain: "When your academic performance is so poor that the university bars you from re-registering. You can usually appeal — do it immediately with a written motivation." },
  { term: "Module credits", plain: "The unit used to measure the weight of a module. Your degree requires a total number of credits to graduate (usually 360 for a 3-year degree, 480 for 4-year)." },
  { term: "GPA", plain: "Grade Point Average. A number (usually 0–4 or 0–100) representing your average performance across all modules. Employers and postgrad programmes ask for this." },
  { term: "Academic probation", plain: "A formal warning that your marks are dangerously low. You are given one more semester to improve or face exclusion. Treat it as an urgent wake-up call." },
  { term: "Tutor", plain: "A senior student hired to help you understand difficult content. Tutors are usually free to access. Ask your lecturer or student services about timetables." },
  { term: "SRC", plain: "Student Representative Council. The elected student government at your institution. They advocate for students and can help escalate serious issues with admin." },
  { term: "SAQA", plain: "South African Qualifications Authority. The body that registers and evaluates all qualifications in South Africa. If you have foreign qualifications, SAQA evaluates them." },
  { term: "RPL", plain: "Recognition of Prior Learning. If you have work experience or skills you gained outside of formal study, RPL allows you to get credit for that at a university." },
  { term: "Deferral", plain: "Postponing your studies to a future semester or year while maintaining your place at the institution. You must usually apply before the semester deadline." },
  { term: "Exemption", plain: "Being excused from taking a module because you can demonstrate you already have the required knowledge — usually through another qualification or prior work." },
  { term: "Academic transcript", plain: "The official document that lists every module you have taken, the marks you received, and your cumulative GPA. Required for job applications and postgraduate study." },
  { term: "Graduation requirements", plain: "The full set of conditions you must meet to receive your degree — specific modules, minimum marks, credit totals, work placements, etc. Get this list from your faculty in first year." },
]

const ADMIN_STEPS: AdminStep[] = [
  {
    title: "How to register",
    steps: [
      "Check your registration period dates on the student portal",
      "Clear any outstanding fees or holds on your account first",
      "Log in to the student portal and select your modules for the semester",
      "Confirm your choices and download your proof of registration",
      "If anything fails, go in person to the registration office immediately",
    ],
  },
  {
    title: "How to request a transcript",
    steps: [
      "Go to your student portal or registrar's office",
      "Submit a formal transcript request (some institutions charge a fee)",
      "Specify if you need it sealed/official or unofficial",
      "Allow 5–10 working days for processing",
      "Check your email — institutions often send a collection notification",
    ],
  },
  {
    title: "How to apply for NSFAS",
    steps: [
      "Go to myNSFAS.org.za and create an account with your ID number",
      "Fill in the application during the open window (usually Aug–Jan for next year)",
      "Upload required documents: ID, proof of income, proof of registration",
      "Track your application status on the NSFAS portal",
      "If rejected, submit an appeal with a detailed motivation letter",
    ],
  },
  {
    title: "How to appeal a decision",
    steps: [
      "Get the decision in writing from the relevant office",
      "Read the appeal policy carefully — there are deadlines, usually 5–10 days",
      "Write a formal letter: your name, student number, the decision, your grounds for appeal",
      "Attach supporting evidence (medical certificate, financial statement, etc.)",
      "Submit to the correct office and get a receipt or reference number",
    ],
  },
  {
    title: "How to find your student number",
    steps: [
      "It is on your acceptance letter from the institution",
      "Check your registration email confirmation",
      "Look at your student card",
      "Log in to the student portal — it is usually in the top right corner",
      "If all else fails, go to the registrar's office with your ID",
    ],
  },
  {
    title: "How to use your student email",
    steps: [
      "Your institution gave you an email when you registered (e.g. 21234567@myuniversity.ac.za)",
      "Log in at your institution's student portal or Microsoft/Google login page",
      "Use this email for ALL official communication with the university",
      "Set up forwarding to your personal email so you never miss announcements",
      "Lecturers and NSFAS will only communicate via your official student email",
    ],
  },
]

const POWER_STATEMENTS: string[] = [
  "I am the first — and I am not the last. I am breaking ground so others can walk easier.",
  "I do not need to know everything. I need to know where to find it and who to ask.",
  "Asking for help is not weakness. It is the single most efficient thing I can do right now.",
  "My family did not send me here to fail quietly. I will make noise, ask questions, and get what I came for.",
  "I belong here. My acceptance letter is proof. My presence is enough.",
  "I may not have had the same preparation as others. But I have something they do not: the hunger.",
  "Confusion is not failure. It is the beginning of understanding. I will sit with it until I break through.",
  "I am allowed to take up space in this institution. In the classroom. In the library. At the lecturer's office.",
  "The systems here were not built for me. That does not mean I cannot navigate them. It means I have to learn them faster.",
  "My first-gen status is not a disadvantage. It is a superpower — I have already overcome barriers others have never faced.",
]

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { label: "NSFAS Hotline", value: "0800 067 327", note: "Free call. Funding, appeals, registration issues." },
  { label: "Student Counselling", value: "Contact your campus wellness centre", note: "Free, confidential. Stress, anxiety, relationship problems — all welcome." },
  { label: "SRC (Student Council)", value: "Find them on your campus portal", note: "Elected student reps who advocate for you. Use them." },
  { label: "Legal Aid Clinic", value: "Many universities offer free legal advice", note: "For disciplinary hearings, housing disputes, contract issues." },
  { label: "SASSA Emergency", value: "0800 601 011", note: "For urgent social grant questions." },
]

type Tab = 'decoded' | 'admin' | 'power' | 'community' | 'help'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'decoded', label: 'Decoded', emoji: '📖' },
  { id: 'admin',   label: 'Admin',   emoji: '🗂️' },
  { id: 'power',   label: 'Power',   emoji: '✊' },
  { id: 'community', label: 'Community', emoji: '🤝' },
  { id: 'help',    label: 'Help',    emoji: '📞' },
]

export default function FirstGenToolkit() {
  const [tab, setTab] = useState<Tab>('decoded')
  const [openStep, setOpenStep] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredGlossary = GLOSSARY.filter(
    g =>
      g.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.plain.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(192,132,252,0.25)`, borderRadius: 16, padding: '16px 18px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${ACCENT},transparent)` }} />
        <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: ACCENT, letterSpacing: '0.09em', marginBottom: 4 }}>FIRST-GEN TOOLKIT</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>You belong here. Navigate with confidence.</div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 3 }}>Everything no one told you — decoded for first-generation students.</div>
      </div>

      <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '1px solid var(--border-subtle)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flexShrink: 0, padding: '8px 12px',
              background: 'none', border: 'none',
              borderBottom: tab === t.id ? `2px solid ${ACCENT}` : '2px solid transparent',
              color: tab === t.id ? ACCENT : 'var(--text-tertiary)',
              fontSize: '0.67rem', fontFamily: 'var(--font-mono)', fontWeight: tab === t.id ? 700 : 400,
              cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap',
            }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {tab === 'decoded' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            University has its own language. Here are the terms that trip up first-gen students most — in plain language.
          </div>
          <input
            placeholder="Search terms..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ padding: '9px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none' }}
          />
          {filteredGlossary.map((g, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: ACCENT, marginBottom: 4 }}>{g.term}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{g.plain}</div>
            </div>
          ))}
          {filteredGlossary.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No terms found for &quot;{searchTerm}&quot;</div>
          )}
        </div>
      )}

      {tab === 'admin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Admin feels designed to confuse you. It is not — it just has steps no one explains. Here they are.
          </div>
          {ADMIN_STEPS.map((item, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${openStep === i ? `rgba(192,132,252,0.3)` : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, overflow: 'hidden' }}>
              <button
                onClick={() => setOpenStep(openStep === i ? null : i)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '13px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</span>
                <span style={{ fontSize: '0.75rem', color: ACCENT, fontFamily: 'var(--font-mono)', flexShrink: 0, marginLeft: 8 }}>{openStep === i ? '▲' : '▼'}</span>
              </button>
              {openStep === i && (
                <div style={{ padding: '0 14px 14px' }}>
                  {item.steps.map((step, si) => (
                    <div key={si} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: `rgba(192,132,252,0.12)`, border: `1px solid rgba(192,132,252,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 700, color: ACCENT }}>{si + 1}</div>
                      <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingTop: 2 }}>{step}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'power' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            These are not motivational posters. These are truths specific to first-generation students — people who built something without a map.
          </div>
          {POWER_STATEMENTS.map((statement, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(192,132,252,0.15)`, borderRadius: 14, padding: '14px 16px', borderLeft: `3px solid ${ACCENT}` }}>
              <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: ACCENT, marginBottom: 6 }}>#{String(i + 1).padStart(2, '0')}</div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-primary)', lineHeight: 1.7, fontStyle: 'italic' }}>&ldquo;{statement}&rdquo;</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'community' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(192,132,252,0.2)`, borderRadius: 16, padding: '18px' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 10 }}>🤝</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Find your people</div>
            <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Many universities have First-Generation Student societies. These are spaces run by students who get it — who also navigated the first year without a parent who had been to university before them.
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: ACCENT, marginBottom: 8 }}>Where to look</div>
            {[
              "Search your institution's student portal for 'First-Gen' or 'First Generation' societies",
              "Ask the Dean of Students office — they often know which organisations support first-gen students",
              "Look for peer mentorship programmes run through student services",
              "Connect on WhatsApp groups started by other first-year students from your home community",
              "Attend orientation events specifically — many first-gen networks start there",
            ].map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                <span style={{ color: ACCENT, fontSize: '0.7rem', marginTop: 2, flexShrink: 0 }}>→</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tip}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(192,132,252,0.06)', border: `1px solid rgba(192,132,252,0.18)`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: '0.73rem', color: ACCENT, fontWeight: 700, marginBottom: 6 }}>Ubuntu principle</div>
            <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.65, fontStyle: 'italic' }}>
              &ldquo;Umuntu ngumuntu ngabantu&rdquo; — A person is a person through other people. Your degree is not just yours. It belongs to your family, your community, and every first-gen student who comes after you.
            </div>
          </div>
        </div>
      )}

      {tab === 'help' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            When things go wrong — and sometimes they will — here is exactly who to call.
          </div>
          {EMERGENCY_CONTACTS.map((contact, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: ACCENT, marginBottom: 4, letterSpacing: '0.05em' }}>{contact.label.toUpperCase()}</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>{contact.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{contact.note}</div>
            </div>
          ))}
          <div style={{ padding: '12px 14px', background: 'rgba(192,132,252,0.06)', border: `1px solid rgba(192,132,252,0.18)`, borderRadius: 12, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.6, fontStyle: 'italic' }}>
            Asking for help is not weakness. The students who succeed fastest are the ones who ask the fastest.
          </div>
        </div>
      )}
    </div>
  )
}
