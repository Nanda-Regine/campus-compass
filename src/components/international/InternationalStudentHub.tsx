'use client'

// ============================================================
// InternationalStudentHub — Full support hub for international
// students studying in South Africa.
// Sections: Permit · NSFAS/Funding · Banking · Healthcare ·
//           Key Contacts · Tax & Work
// Accent: sky blue (#38BDF8)
// ============================================================

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────

type StudentStatus = 'sa_citizen' | 'permanent_resident' | 'sadc_citizen' | 'international'

interface ProfileData {
  student_status: StudentStatus | null
  country_of_origin: string | null
  study_permit_expiry: string | null // ISO date string YYYY-MM-DD
}

// ─── Style constants ──────────────────────────────────────────

const SKY = '#38BDF8'
const SKY_DIM = 'rgba(56,189,248,0.10)'
const SKY_BORDER = 'rgba(56,189,248,0.25)'

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 16,
  padding: '16px 14px',
  position: 'relative',
  overflow: 'hidden',
}

const accentLine: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 2,
  background: 'linear-gradient(90deg, #38BDF8, transparent)',
}

const sectionLabel: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.6rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: SKY,
  marginBottom: 6,
}

const headingStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: 8,
}

const bodyText: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'rgba(255,255,255,0.55)',
  lineHeight: 1.6,
}

const listStyle: React.CSSProperties = {
  ...bodyText,
  paddingLeft: 16,
  margin: '8px 0 0 0',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

// ─── Helpers ──────────────────────────────────────────────────

function getDaysUntilExpiry(isoDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(isoDate)
  expiry.setHours(0, 0, 0, 0)
  return Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function expiryColor(days: number): string {
  if (days < 0) return '#EF4444'      // expired — red
  if (days < 30) return '#F59E0B'     // critical — amber
  if (days < 90) return '#FBBF24'     // watch — yellow-amber
  return '#34D399'                    // safe — green
}

// ─── Sub-components ───────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0' }}>
      <div style={{
        width: 28,
        height: 28,
        border: `3px solid ${SKY_BORDER}`,
        borderTop: `3px solid ${SKY}`,
        borderRadius: '50%',
        animation: 'spin 0.9s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// A. Study Permit Reminder
function PermitCard({ expiryDate, onSaved }: {
  expiryDate: string | null
  onSaved: (date: string) => void
}) {
  const [dateInput, setDateInput] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!dateInput) return
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ study_permit_expiry: dateInput }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('Study permit date saved')
      onSaved(dateInput)
    } catch {
      toast.error('Could not save — try again')
    } finally {
      setSaving(false)
    }
  }

  let permitContent: React.ReactNode

  if (expiryDate) {
    const days = getDaysUntilExpiry(expiryDate)
    const color = expiryColor(days)
    const expiryFormatted = new Date(expiryDate).toLocaleDateString('en-ZA', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

    if (days < 0) {
      permitContent = (
        <>
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: 10,
            fontSize: '0.78rem',
            color: '#FCA5A5',
            lineHeight: 1.6,
            marginBottom: 10,
          }}>
            ⚠️ Your study permit <strong>expired on {expiryFormatted}</strong>. Visit the nearest Department of Home Affairs immediately to avoid deportation or legal complications.
          </div>
        </>
      )
    } else {
      permitContent = (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '12px 14px',
          background: `rgba(${color === '#34D399' ? '52,211,153' : color === '#FBBF24' ? '251,191,36' : '245,158,11'},0.08)`,
          border: `1px solid ${color}40`,
          borderRadius: 10,
          marginBottom: 10,
        }}>
          <div style={{ fontSize: '1.6rem', lineHeight: 1 }}>
            {days >= 90 ? '✅' : days >= 30 ? '⏳' : '🚨'}
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color }}>
              {days} day{days !== 1 ? 's' : ''} remaining
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              Expires {expiryFormatted}
            </div>
          </div>
        </div>
      )
    }
  } else {
    permitContent = (
      <div style={{
        padding: '10px 14px',
        background: SKY_DIM,
        border: `1px solid ${SKY_BORDER}`,
        borderRadius: 10,
        marginBottom: 10,
      }}>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', marginBottom: 10, lineHeight: 1.5 }}>
          Add your study permit expiry date to track when it needs renewal.
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="date"
            value={dateInput}
            onChange={e => setDateInput(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 10px',
              background: 'var(--bg-base)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: '0.78rem',
              colorScheme: 'dark',
            }}
          />
          <button
            onClick={handleSave}
            disabled={!dateInput || saving}
            style={{
              padding: '8px 14px',
              background: dateInput && !saving ? SKY : 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: 8,
              color: dateInput && !saving ? '#0F172A' : 'rgba(255,255,255,0.3)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: dateInput && !saving ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
            }}
          >
            {saving ? 'Saving…' : 'Save date'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      <div style={accentLine} />
      <div style={{ paddingTop: 6 }}>
        <div style={sectionLabel}>Study Permit</div>
        <div style={headingStyle}>🪪 Permit Expiry Tracker</div>
        {permitContent}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 8,
          marginTop: 4,
        }}>
          <span style={{ fontSize: '0.7rem' }}>📞</span>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Department of Home Affairs: </span>
            0800 60 11 90 (toll-free) · Mon–Fri 08:00–16:00
          </div>
        </div>
        <div style={{ ...bodyText, marginTop: 10, fontSize: '0.7rem' }}>
          Renew your permit <strong style={{ color: 'rgba(255,255,255,0.75)' }}>at least 60 days before expiry</strong> — Home Affairs queues are long. You can apply online at <span style={{ color: SKY }}>dha.gov.za</span> or at any Home Affairs office.
        </div>
      </div>
    </div>
  )
}

// B. NSFAS & Funding
function FundingCard() {
  const funding = [
    { name: 'DAAD (German Academic Exchange Service)', desc: 'Scholarships for African students to study in Germany or in-country. Highly competitive.', url: 'daad.de', emoji: '🇩🇪' },
    { name: 'Mastercard Foundation Scholars Program', desc: 'Full scholarships for academically talented yet economically disadvantaged young Africans.', url: 'mastercardfdn.org', emoji: '💳' },
    { name: 'African Union Scholarships', desc: 'AU Commission scholarships for African students studying within Africa.', url: 'au.int/scholarships', emoji: '🌍' },
    { name: 'Commonwealth Scholarships', desc: 'For students from Commonwealth countries. Covers tuition, living costs, and flights.', url: 'cscuk.fcdo.gov.uk', emoji: '🇬🇧' },
    { name: 'SA Bank Student Loans', desc: 'Standard Bank, Nedbank, and Absa offer student loans to international students with a South African guarantor.', url: '', emoji: '🏦' },
    { name: 'Your University\'s International Office', desc: 'Most South African universities have institution-specific bursaries for international students. Visit your campus International Office.', url: '', emoji: '🎓' },
  ]

  return (
    <div style={cardStyle}>
      <div style={accentLine} />
      <div style={{ paddingTop: 6 }}>
        <div style={sectionLabel}>Funding</div>
        <div style={headingStyle}>💰 Funding for International Students</div>
        <div style={{
          padding: '10px 14px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 10,
          fontSize: '0.75rem',
          color: '#FCA5A5',
          lineHeight: 1.6,
          marginBottom: 14,
        }}>
          As an international student, you are <strong>NOT eligible for NSFAS</strong> (National Student Financial Aid Scheme). NSFAS is reserved for South African citizens and permanent residents.
        </div>
        <div style={{ ...bodyText, marginBottom: 10 }}>
          Alternative funding sources:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {funding.map((f, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: 10,
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
            }}>
              <span style={{ fontSize: '1.1rem', lineHeight: 1, marginTop: 1 }}>{f.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 2 }}>
                  {f.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                  {f.desc}
                  {f.url ? <> · <span style={{ color: SKY }}>{f.url}</span></> : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          background: SKY_DIM,
          border: `1px solid ${SKY_BORDER}`,
          borderRadius: 8,
          fontSize: '0.71rem',
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.5,
        }}>
          💡 Contact your institution's International Office for institution-specific bursaries and emergency funding not listed here.
        </div>
      </div>
    </div>
  )
}

// C. Banking & Money
function BankingCard() {
  return (
    <div style={cardStyle}>
      <div style={accentLine} />
      <div style={{ paddingTop: 6 }}>
        <div style={sectionLabel}>Banking</div>
        <div style={headingStyle}>🏦 Opening a South African Bank Account</div>
        <div style={{ ...bodyText, marginBottom: 12 }}>
          You'll need a local bank account from day one — for accommodation deposits, receiving allowances, and paying for on-campus services.
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Required Documents
          </div>
          <ul style={listStyle}>
            <li>Valid passport (original)</li>
            <li>Study permit / visa (original + copy)</li>
            <li>Proof of enrollment (letter from your university)</li>
            <li>Proof of SA address (residence letter from student housing, or landlord's letter)</li>
          </ul>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Recommended Banks
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { bank: 'FNB', note: 'Best for foreign currency accounts and international transfers. eWallet is widely used.', tag: 'Best for forex' },
              { bank: 'Capitec', note: 'Simplest to open, low fees, excellent app. No minimum balance required.', tag: 'Easiest to open' },
              { bank: 'Standard Bank', note: 'Most branches across SA and Africa. Good if your home country has a Standard Bank presence.', tag: 'Most branches' },
            ].map((b, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '9px 12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 9,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{b.bank}</span>
                    <span style={{
                      fontSize: '0.6rem',
                      padding: '1px 7px',
                      background: SKY_DIM,
                      border: `1px solid ${SKY_BORDER}`,
                      borderRadius: 100,
                      color: SKY,
                      letterSpacing: '0.04em',
                    }}>{b.tag}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{b.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          padding: '9px 12px',
          background: SKY_DIM,
          border: `1px solid ${SKY_BORDER}`,
          borderRadius: 8,
          fontSize: '0.71rem',
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.5,
          marginBottom: 8,
        }}>
          ⏰ Open your account in the <strong style={{ color: 'rgba(255,255,255,0.8)' }}>first week of arriving</strong> — you'll need it for accommodation deposits, which are often due immediately.
        </div>

        <div style={{
          padding: '9px 12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8,
          fontSize: '0.71rem',
          color: 'rgba(255,255,255,0.5)',
          lineHeight: 1.5,
        }}>
          💸 <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Sending money home?</strong> Use <span style={{ color: SKY }}>Wise</span> or <span style={{ color: SKY }}>OFX</span> — their exchange rates and fees are significantly better than South African bank international transfers.
        </div>
      </div>
    </div>
  )
}

// D. Healthcare / Medical Aid
function HealthcareCard() {
  return (
    <div style={cardStyle}>
      <div style={accentLine} />
      <div style={{ paddingTop: 6 }}>
        <div style={sectionLabel}>Healthcare</div>
        <div style={headingStyle}>🏥 Medical Aid & Health Insurance</div>

        <div style={{
          padding: '10px 14px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 10,
          fontSize: '0.75rem',
          color: '#FCA5A5',
          lineHeight: 1.6,
          marginBottom: 12,
        }}>
          International students are <strong>REQUIRED</strong> to have medical aid or health insurance for the duration of their studies. This is a visa/permit condition — check your permit for specific requirements.
        </div>

        <div style={{ ...bodyText, marginBottom: 10 }}>
          Your <strong style={{ color: 'rgba(255,255,255,0.75)' }}>university's student health service</strong> covers basic primary care (GP visits, basic medication) — use it first before going to a private facility.
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Medical Aid Options
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { name: 'Kaelo Health', note: 'Affordable student-specific health insurance. Designed for the student budget.', tag: 'Student plan' },
              { name: 'Fedhealth Student Plan', note: 'Entry-level medical aid plan popular at South African universities.', tag: 'Student plan' },
              { name: 'Momentum', note: 'Mid-tier medical aid. Good network coverage across all provinces.', tag: 'Mid-range' },
              { name: 'Discovery Health', note: 'Premium medical aid with Vitality rewards. Higher cost — better suited once you\'re earning.', tag: 'Premium' },
            ].map((opt, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '9px 12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 9,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{opt.name}</span>
                    <span style={{
                      fontSize: '0.6rem',
                      padding: '1px 7px',
                      background: SKY_DIM,
                      border: `1px solid ${SKY_BORDER}`,
                      borderRadius: 100,
                      color: SKY,
                    }}>{opt.tag}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{opt.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          padding: '10px 14px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 10,
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#FCA5A5', marginBottom: 6 }}>🚨 Emergency Numbers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: 'Police (SAPS)', number: '10111' },
              { label: 'Ambulance / Emergency Medical', number: '10177' },
              { label: 'Emergency (any mobile network)', number: '112' },
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>{e.label}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FCA5A5', fontFamily: 'monospace' }}>{e.number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// E. Key Contacts
function ContactsCard() {
  const contacts = [
    { label: 'Dept of Home Affairs (Toll-free)', number: '0800 60 11 90', icon: '🏛️', note: 'Permits, visas, renewals' },
    { label: 'SAQA — Foreign Qualifications', number: '012 431 5000', icon: '🎓', note: 'Evaluation of foreign qualifications' },
    { label: 'SAPS (Police)', number: '10111', icon: '👮', note: 'Non-emergency & emergency' },
    { label: 'Tourism Safety Monitors', number: '083 123 2345', icon: '🛡️', note: 'Tourist safety helpline' },
    { label: 'Your University International Office', number: '—', icon: '🌐', note: 'Visit your campus website for the direct number' },
  ]

  return (
    <div style={cardStyle}>
      <div style={accentLine} />
      <div style={{ paddingTop: 6 }}>
        <div style={sectionLabel}>Contacts</div>
        <div style={headingStyle}>📋 Key Contacts for International Students</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {contacts.map((c, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
            }}>
              <span style={{ fontSize: '1.1rem', lineHeight: 1, flexShrink: 0 }}>{c.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.82)', marginBottom: 1 }}>{c.label}</div>
                <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.4 }}>{c.note}</div>
              </div>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: SKY,
                fontFamily: 'monospace',
                flexShrink: 0,
              }}>{c.number}</span>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 10,
          padding: '8px 12px',
          background: SKY_DIM,
          border: `1px solid ${SKY_BORDER}`,
          borderRadius: 8,
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.5)',
          lineHeight: 1.5,
        }}>
          💡 <strong style={{ color: 'rgba(255,255,255,0.7)' }}>SAQA</strong> evaluates your foreign qualifications to determine their South African equivalent — essential for job applications and further studies.
        </div>
      </div>
    </div>
  )
}

// F. Tax & Work
function TaxWorkCard() {
  return (
    <div style={cardStyle}>
      <div style={accentLine} />
      <div style={{ paddingTop: 6 }}>
        <div style={sectionLabel}>Work & Tax</div>
        <div style={headingStyle}>💼 Working & Tax in South Africa</div>

        <div style={{
          padding: '10px 14px',
          background: SKY_DIM,
          border: `1px solid ${SKY_BORDER}`,
          borderRadius: 10,
          marginBottom: 12,
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: SKY, marginBottom: 4 }}>Can I work in South Africa?</div>
          <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            International students <strong style={{ color: 'rgba(255,255,255,0.82)' }}>CAN work in SA on a study permit</strong>, but <strong style={{ color: 'rgba(255,255,255,0.82)' }}>only if your study permit explicitly states this is allowed</strong>. Check the conditions printed on your permit before accepting any employment.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {[
            { icon: '⏰', title: 'Maximum 20 hours per week', body: 'While your institution is in session. Full-time work is only permitted during official university vacations.' },
            { icon: '📝', title: 'Register with SARS', body: 'If you earn any income in South Africa, you must register as a taxpayer with the South African Revenue Service (SARS). First-time registration can be done at any SARS branch or online.' },
            { icon: '🧾', title: 'Annual tax return', body: 'File your tax return at tax.sars.gov.za (eFiling). SARS eFiling is free. If your employer deducts PAYE, you may be due a refund.' },
            { icon: '🏛️', title: 'SARS eFiling', body: 'Register at tax.sars.gov.za — you\'ll need your passport number and SA bank account details.' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: 10,
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 9,
            }}>
              <span style={{ fontSize: '1.1rem', lineHeight: 1, marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.82)', marginBottom: 3 }}>{item.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{item.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8,
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.45)',
          lineHeight: 1.5,
        }}>
          ⚠️ Working without a valid work permit (when your study permit does not explicitly allow it) is a <strong style={{ color: '#FCA5A5' }}>serious immigration offence</strong> and can result in deportation. Always verify your permit conditions.
        </div>
      </div>
    </div>
  )
}

// ─── Non-international card (simple fallback) ─────────────────

function NotInternationalCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={cardStyle}>
        <div style={accentLine} />
        <div style={{ paddingTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: '1.5rem' }}>🌐</span>
            <div>
              <div style={sectionLabel}>International</div>
              <div style={headingStyle}>International Student Hub</div>
            </div>
          </div>
          <div style={{ ...bodyText, lineHeight: 1.7 }}>
            This section is for international students studying in South Africa — covering study permits, funding alternatives to NSFAS, banking, healthcare, and tax.
          </div>
          <div style={{
            marginTop: 12,
            padding: '9px 13px',
            background: SKY_DIM,
            border: `1px solid ${SKY_BORDER}`,
            borderRadius: 9,
            fontSize: '0.72rem',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.5,
          }}>
            If you are an international student, update your student status in your{' '}
            <strong style={{ color: SKY }}>Profile → Account</strong> tab to access the full hub.
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={accentLine} />
        <div style={{ paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={sectionLabel}>Profile</div>
            <div style={headingStyle}>Studying abroad?</div>
            <div style={{ ...bodyText, marginTop: 4 }}>Update your student status in your profile to unlock international student features.</div>
          </div>
          <a
            href="/profile"
            style={{
              flexShrink: 0,
              marginLeft: 12,
              padding: '8px 14px',
              background: SKY_DIM,
              border: `1px solid ${SKY_BORDER}`,
              borderRadius: 10,
              color: SKY,
              fontSize: '0.75rem',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Go to Profile →
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────

export default function InternationalStudentHub() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileData>({
    student_status: null,
    country_of_origin: null,
    study_permit_expiry: null,
  })

  useEffect(() => {
    const supabase = createClient()

    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data, error } = await supabase
          .from('profiles')
          .select('student_status, country_of_origin, study_permit_expiry')
          .eq('id', user.id)
          .single()

        if (error) throw error

        if (data) {
          setProfile({
            student_status: (data.student_status as StudentStatus) ?? null,
            country_of_origin: (data.country_of_origin as string) ?? null,
            study_permit_expiry: (data.study_permit_expiry as string) ?? null,
          })
        }
      } catch (err) {
        console.error('InternationalStudentHub: failed to load profile', err)
        toast.error('Could not load your profile')
      } finally {
        setLoading(false)
      }
    }

    void fetchProfile()
  }, [])

  const handlePermitSaved = (date: string) => {
    setProfile(prev => ({ ...prev, study_permit_expiry: date }))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Spinner />
      </div>
    )
  }

  if (profile.student_status !== 'international') {
    return <NotInternationalCard />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Hero banner */}
      <div style={{
        padding: '16px 16px',
        background: SKY_DIM,
        border: `1px solid ${SKY_BORDER}`,
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <span style={{ fontSize: '2rem', lineHeight: 1 }}>🌏</span>
        <div>
          <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase', color: SKY, marginBottom: 4 }}>
            International Student Hub
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Welcome to South Africa
            {profile.country_of_origin ? ` — from ${profile.country_of_origin}` : ''}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
            Everything you need to navigate studying, living, and thriving in SA.
          </div>
        </div>
      </div>

      <PermitCard
        expiryDate={profile.study_permit_expiry}
        onSaved={handlePermitSaved}
      />
      <FundingCard />
      <BankingCard />
      <HealthcareCard />
      <ContactsCard />
      <TaxWorkCard />
    </div>
  )
}
