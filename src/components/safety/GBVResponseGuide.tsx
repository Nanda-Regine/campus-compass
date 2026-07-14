'use client'

// ============================================================
// GBVResponseGuide — Gender-Based Violence Response & Resources
// Static, offline-first, trauma-informed throughout.
// Tabs: 72hours | hotlines | rights | for_friends
// Accent: #f87171 (red/warm — empowering not alarming)
// ============================================================

import { useState } from 'react'

type GBVTab = '72hours' | 'hotlines' | 'rights' | 'for_friends'

interface ThuthuzelaLocation {
  location: string
  hospital: string
  phone: string
}

interface HotlineEntry {
  name: string
  number: string
  note: string
  important?: boolean
}

// ─── Data ────────────────────────────────────────────────────

const THUTHUZELA: ThuthuzelaLocation[] = [
  { location: 'Johannesburg', hospital: 'Charlotte Maxeke Academic Hospital', phone: '011 488 4911' },
  { location: 'Soweto',       hospital: 'Chris Hani Baragwanath Hospital',    phone: '011 933 8000' },
  { location: 'Pretoria',     hospital: 'Steve Biko Academic Hospital',       phone: '012 354 1000' },
  { location: 'Cape Town',    hospital: 'Groote Schuur Hospital',             phone: '021 404 9111' },
  { location: 'Durban',       hospital: 'Addington Hospital',                 phone: '031 327 2000' },
  { location: 'East London',  hospital: 'Frere Hospital',                     phone: '043 709 2111' },
  { location: 'Port Elizabeth', hospital: 'Dora Nginza Hospital',             phone: '041 406 4111' },
  { location: 'Bloemfontein', hospital: 'Universitas Hospital',               phone: '051 405 1911' },
  { location: 'Kimberley',    hospital: 'Robert Sobukwe Hospital',            phone: '053 802 9111' },
  { location: 'Polokwane',    hospital: 'Mankweng Hospital',                  phone: '015 267 9000' },
]

const HOTLINES: HotlineEntry[] = [
  { name: 'GBV Command Centre',                number: '0800 428 428', note: '24/7, FREE, confidential',     important: true },
  { name: 'Rape Crisis Cape Town',             number: '021 447 9762', note: '24/7, all genders',           important: true },
  { name: 'POWA (People Opposing Women Abuse)', number: '011 642 4345', note: 'Mon–Fri 8am–4pm' },
  { name: 'Lifeline South Africa',             number: '0861 322 322', note: '24/7 emotional support' },
  { name: 'TEARS Foundation',                 number: '010 590 5920', note: 'Trauma support' },
  { name: 'Childline South Africa',           number: '0800 055 555', note: 'Under 18, free, 24/7' },
  { name: 'Legal Aid South Africa',           number: '0800 110 110', note: 'Free legal help' },
  { name: 'SAPS Emergency',                   number: '10111',         note: 'Police emergency' },
  { name: 'Marie Stopes (reproductive health)', number: '0800 11 77 85', note: 'Free, medical' },
]

const RIGHTS_LIST = [
  {
    title: 'Report at ANY SAPS station',
    body: 'You can report at any police station in South Africa — not only the one closest to where the incident occurred. The station cannot legally refuse to take your report.',
  },
  {
    title: 'Request a female police officer',
    body: 'You have the right to request a female officer when making a statement or during any police examination. This cannot be denied to you.',
  },
  {
    title: 'FREE PEP medication within 72 hours (this is law)',
    body: 'Post-Exposure Prophylaxis (PEP) prevents HIV transmission and is provided FREE at all public hospitals. You do NOT need to open a case to receive PEP. This window of 72 hours matters — do not delay.',
  },
  {
    title: 'Bring a support person during examination',
    body: 'You have the right to have a support person present during any medical examination. This can be a friend, family member, or crisis counsellor.',
  },
  {
    title: 'Right to confidentiality from healthcare workers',
    body: 'Healthcare workers are legally bound to keep your information confidential. They cannot disclose details of your visit without your consent.',
  },
  {
    title: 'Medical care does NOT require reporting',
    body: 'Getting medical care — including a rape kit or PEP — does NOT mean you are opening a criminal case. Reporting to police is entirely your choice and can be done later.',
  },
  {
    title: 'Free legal representation',
    body: 'Legal Aid South Africa provides free legal assistance to people who cannot afford a private lawyer. Call 0800 110 110 (toll-free, 24h).',
  },
  {
    title: 'Request a J88 form',
    body: 'The J88 is a medico-legal document that records injuries and evidence. Ask for it at any Thuthuzela Care Centre or clinic. It preserves evidence even if you decide to report later.',
  },
]

const STEPS_72H = [
  { num: 1, text: 'Get to a safe place first — your physical safety matters most right now.' },
  { num: 2, text: 'You do NOT have to report to police. That is your choice alone, and it is valid either way.' },
  { num: 3, text: 'If you can, contact someone you trust. You don\'t have to go through this alone.' },
  { num: 4, text: 'Seek medical care within 72 hours — NOT because you must report, but for YOUR health. PEP medication prevents HIV transmission and is FREE at public hospitals. This window matters.' },
  { num: 5, text: 'Thuthuzela Care Centres provide medical care, counselling, and police access in one place — you choose what services you use.' },
]

const GBV_TABS: { id: GBVTab; label: string; icon: string }[] = [
  { id: '72hours',     label: 'First 72 Hours', icon: '⏱' },
  { id: 'hotlines',    label: 'Hotlines',       icon: '📞' },
  { id: 'rights',      label: 'Your Rights',    icon: '⚖️' },
  { id: 'for_friends', label: 'For Friends',    icon: '💜' },
]

// ─── Tab components ──────────────────────────────────────────

function Tab72Hours() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
        If you have experienced sexual assault or GBV
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {STEPS_72H.map(step => (
          <div
            key={step.num}
            style={{
              display: 'flex',
              gap: 14,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: '14px 16px',
              alignItems: 'flex-start',
            }}
          >
            <div style={{
              flexShrink: 0,
              width: 28, height: 28,
              borderRadius: '50%',
              background: 'rgba(248,113,113,0.15)',
              border: '1px solid rgba(248,113,113,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.78rem', fontWeight: 700, color: '#f87171',
            }}>
              {step.num}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.65, paddingTop: 4 }}>
              {step.text}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'rgba(248,113,113,0.06)',
        border: '1px solid rgba(248,113,113,0.20)',
        borderRadius: 14,
        padding: '16px',
        marginTop: 4,
      }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#f87171', letterSpacing: '0.09em', marginBottom: 12 }}>
          THUTHUZELA CARE CENTRES — TAP TO CALL
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {THUTHUZELA.map(t => (
            <div key={t.location} style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
              padding: '12px 14px',
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 2 }}>{t.location}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>{t.hospital}</div>
              <a
                href={`tel:${t.phone.replace(/\s/g, '')}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px',
                  background: 'rgba(248,113,113,0.12)',
                  border: '1px solid rgba(248,113,113,0.30)',
                  borderRadius: 8, textDecoration: 'none',
                  color: '#f87171', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'monospace',
                }}
              >
                📞 {t.phone}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabHotlines() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', lineHeight: 1.6, marginBottom: 4 }}>
        All hotlines below are free to call from any phone. Save the GBV Command Centre now — it&apos;s available 24/7.
      </div>
      {HOTLINES.map(h => (
        <a
          key={h.name}
          href={`tel:${h.number.replace(/\s/g, '')}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: h.important ? '16px 16px' : '13px 14px',
            background: h.important ? 'rgba(248,113,113,0.07)' : 'rgba(255,255,255,0.06)',
            border: h.important ? '1px solid rgba(248,113,113,0.25)' : '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, textDecoration: 'none',
          }}
        >
          <div>
            <div style={{
              fontSize: h.important ? '0.9rem' : '0.82rem',
              fontWeight: h.important ? 700 : 600,
              color: 'var(--text-secondary)', marginBottom: 3,
            }}>
              {h.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{h.note}</div>
          </div>
          <div style={{
            fontSize: h.important ? '1rem' : '0.85rem',
            fontWeight: 700,
            color: h.important ? '#f87171' : 'var(--text-tertiary)',
            fontFamily: 'monospace',
            flexShrink: 0, marginLeft: 12,
          }}>
            {h.number}
          </div>
        </a>
      ))}
    </div>
  )
}

function TabRights() {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        background: 'rgba(248,113,113,0.06)',
        border: '1px solid rgba(248,113,113,0.20)',
        borderRadius: 10, padding: '12px 14px',
        fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 4,
      }}>
        These are your <strong>legal rights</strong> under South African law. You do not have to waive any of them.
      </div>

      {RIGHTS_LIST.map((right, i) => (
        <div key={i} style={{
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${expanded === i ? 'rgba(248,113,113,0.30)' : 'rgba(255,255,255,0.06)'}`,
          borderLeft: '3px solid #f87171',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '13px 16px',
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 10,
            }}
          >
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {right.title}
            </div>
            <span style={{
              color: 'var(--text-tertiary)', fontSize: '0.7rem', flexShrink: 0,
              transform: expanded === i ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}>▾</span>
          </button>
          {expanded === i && (
            <div style={{ padding: '0 16px 14px', fontSize: '0.78rem', color: 'var(--text-tertiary)', lineHeight: 1.65 }}>
              {right.body}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function TabForFriends() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        background: 'rgba(167,139,250,0.08)',
        border: '1px solid rgba(167,139,250,0.25)',
        borderRadius: 12, padding: '14px 16px',
        fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.65,
      }}>
        If someone discloses to you, your response in the first minutes matters enormously.
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: '16px',
      }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#4ade80', letterSpacing: '0.09em', marginBottom: 12 }}>
          SAY THIS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['I believe you.', 'This is not your fault.', 'I\'m here. What do you need right now?'].map((phrase, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: '#4ade80', fontSize: '0.9rem', flexShrink: 0, marginTop: 1 }}>✓</span>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600, fontStyle: 'italic', lineHeight: 1.4 }}>
                &quot;{phrase}&quot;
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: '16px',
      }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#f87171', letterSpacing: '0.09em', marginBottom: 12 }}>
          DO NOT SAY
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'What were you wearing?',
            'Why were you there?',
            'Why didn\'t you fight back?',
            'Are you sure that\'s what happened?',
          ].map((phrase, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: '#f87171', fontSize: '0.9rem', flexShrink: 0, marginTop: 1 }}>✕</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                &quot;{phrase}&quot;
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: '16px',
      }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.09em', marginBottom: 12 }}>
          PRACTICAL SUPPORT
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            'Ask what they need — not what you think they need.',
            'Offer to go with them to a Thuthuzela Care Centre if they want medical care.',
            'Help them call the GBV hotline (0800 428 428) if they want to.',
            'Do not tell others without their permission.',
            'Look after yourself — vicarious trauma is real. The GBV Command Centre also supports people who support survivors.',
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: '#a78bfa', flexShrink: 0, fontSize: '0.7rem', marginTop: 3 }}>◆</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      <a
        href="tel:0800428428"
        style={{
          display: 'block',
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: 14, padding: '14px 18px',
          textDecoration: 'none', textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>GBV COMMAND CENTRE · 24/7 · FREE</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f87171', fontFamily: 'monospace' }}>
          📞 0800 428 428
        </div>
      </a>
    </div>
  )
}

// ─── Legacy sub-components kept for internal use ─────────────

interface EmergencyContact {
  name: string
  number: string
  available: string
}

interface Section {
  id: string
  title: string
  icon: string
  color: string
  alwaysOpen?: boolean
  content: React.ReactNode
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { name: 'Thuthuzela Care Centre', number: '010 205 2222', available: '24/7 — nearest hospital' },
  { name: 'GBV Command Centre', number: '0800 428 428', available: '24/7 — toll-free' },
  { name: 'SAPS', number: '10111', available: 'Always' },
  { name: 'Childline SA', number: '116', available: 'Under 18' },
  { name: 'People Opposing Women Abuse (POWA)', number: '011 642 4345', available: 'Business hours' },
  { name: 'Stop Gender Violence Helpline', number: '0800 150 150', available: 'Always' },
]

const IMMEDIATE_STEPS: string[] = [
  'Try to preserve evidence — do not shower, change clothes, or clean the area if possible.',
  'Go to your nearest Thuthuzela Care Centre (TCC) at a public hospital — they handle everything in one place.',
  'You do NOT need to go to the police first. The TCC will guide you through options.',
  'Bring a trusted friend if you can — you do not have to face this alone.',
  'Free HIV PEP (post-exposure prophylaxis) is available — it must start within 72 hours.',
  'You have the right to medical care regardless of whether you report to police.',
]

const MEDICAL_CARE_ITEMS = [
  {
    title: 'HIV PEP',
    color: '#f87171',
    detail: 'Antiretroviral treatment that prevents HIV infection. Must start within 72 hours. Completely free at any public hospital or Thuthuzela Care Centre. Do not delay.',
  },
  {
    title: 'Emergency contraception',
    color: '#fb923c',
    detail: 'Available free at public health facilities. Most effective within 72 hours, still works up to 120 hours (5 days) after.',
  },
  {
    title: 'STI treatment',
    color: '#a78bfa',
    detail: 'A full STI screening and treatment course is provided free of charge at TCCs and public clinics. No judgement — this is routine care.',
  },
  {
    title: 'Trauma counselling',
    color: '#60a5fa',
    detail: 'Social workers and counsellors are on duty at every TCC. Your campus student wellness centre also offers free confidential counselling.',
  },
]

const LEGAL_RIGHTS_ITEMS: string[] = [
  'Free legal assistance is available through Legal Aid SA — call 0800 110 110 (toll-free).',
  'You can apply for a Protection Order at any Magistrates\' Court without a lawyer. An interim order can be issued the same day.',
  'You can report anonymously or choose when and whether to open a criminal case — this is entirely your decision.',
  'You have up to 20 years to report sexual offences under SA law — you are not "too late".',
  'Your employer or institution cannot discriminate against you for reporting or for being a survivor.',
]

const RECOVERY_ITEMS: string[] = [
  'Your campus counselling or student wellness centre offers free, confidential sessions — no referral needed.',
  'Survivor communities and support groups (in person and online) help normalise the healing journey.',
  'Healing is not linear. Flashbacks, difficulty sleeping, and mood changes are normal trauma responses — not weakness.',
  'You do not owe anyone your story. Share on your terms, when you are ready.',
  'Many campuses offer academic concessions (deadline extensions, exam deferrals) for survivors — ask student affairs.',
]

const WITNESS_DOS: string[] = [
  'Believe them. Say "I believe you. This is not your fault."',
  'Ask what they need rather than telling them what to do.',
  'Offer to accompany them to the TCC, police, or counselling.',
  'Keep their disclosure confidential unless they are in immediate danger.',
  'Follow their lead — their autonomy matters now more than ever.',
]

const WITNESS_DONTS: string[] = [
  'Do not ask "Why didn\'t you fight back?" or "Why were you there?"',
  'Do not pressure them to report if they are not ready.',
  'Do not share their story with anyone without permission.',
  'Do not minimise it — "it could have been worse" is harmful.',
  'Do not take over — your role is support, not control.',
]

const ACCENT = '#f87171'

function EmergencySection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        padding: '12px 14px',
        background: 'rgba(248,113,113,0.08)',
        border: '1px solid rgba(248,113,113,0.2)',
        borderRadius: 12,
        fontSize: '0.73rem',
        color: '#fca5a5',
        lineHeight: 1.6,
      }}>
        You are safe. What happened is not your fault. Reach out — help is available right now, free of charge.
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {EMERGENCY_CONTACTS.slice(0, 2).map(c => (
          <a
            key={c.number}
            href={`tel:${c.number.replace(/\s/g, '')}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 14,
              textDecoration: 'none',
            }}
          >
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fef2f2' }}>{c.name}</div>
              <div style={{ fontSize: '0.68rem', color: '#fca5a5', marginTop: 2 }}>{c.available}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: ACCENT }}>
                {c.number}
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                padding: '2px 8px',
                background: 'rgba(248,113,113,0.2)',
                borderRadius: 100,
                color: '#fca5a5',
                letterSpacing: '0.06em',
              }}>
                CALL NOW
              </span>
            </div>
          </a>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {EMERGENCY_CONTACTS.slice(2).map(c => (
          <a
            key={c.number}
            href={`tel:${c.number.replace(/\s/g, '')}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              textDecoration: 'none',
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{c.name}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 1 }}>{c.available}</div>
            </div>
            <span style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: ACCENT }}>
              {c.number}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

function ImmediateStepsSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {IMMEDIATE_STEPS.map((step, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 12,
            padding: '12px 14px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
          }}
        >
          <div style={{
            flexShrink: 0,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'rgba(248,113,113,0.15)',
            border: '1px solid rgba(248,113,113,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.62rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: ACCENT,
            marginTop: 1,
          }}>
            {i + 1}
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step}</p>
        </div>
      ))}
    </div>
  )
}

function MedicalCareSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {MEDICAL_CARE_ITEMS.map(item => (
        <div
          key={item.title}
          style={{
            padding: '13px 14px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderLeft: `3px solid ${item.color}`,
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f3f4f6', marginBottom: 4 }}>
            {item.title}
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>{item.detail}</p>
        </div>
      ))}
    </div>
  )
}

function LegalRightsSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {LEGAL_RIGHTS_ITEMS.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 10,
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
          }}
        >
          <span style={{ color: '#a78bfa', flexShrink: 0, fontWeight: 700 }}>⚖️</span>
          <span>{item}</span>
        </div>
      ))}
      <a
        href="tel:0800110110"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          background: 'rgba(167,139,250,0.08)',
          border: '1px solid rgba(167,139,250,0.25)',
          borderRadius: 12,
          textDecoration: 'none',
        }}
      >
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#c4b5fd' }}>Legal Aid SA — free lawyers</span>
        <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#a78bfa' }}>0800 110 110</span>
      </a>
    </div>
  )
}

function RecoverySection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        padding: '12px 14px',
        background: 'rgba(96,165,250,0.06)',
        border: '1px solid rgba(96,165,250,0.15)',
        borderRadius: 12,
        fontSize: '0.75rem',
        color: '#93c5fd',
        lineHeight: 1.6,
      }}>
        Recovery looks different for everyone. There is no timeline, and there is no wrong way to heal.
      </div>
      {RECOVERY_ITEMS.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 10,
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
          }}
        >
          <span style={{ color: '#60a5fa', flexShrink: 0 }}>·</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  )
}

function WitnessSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.07em', marginBottom: 8 }}>
          WHAT TO DO
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {WITNESS_DOS.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                padding: '9px 12px',
                background: 'rgba(52,211,153,0.04)',
                border: '1px solid rgba(52,211,153,0.12)',
                borderRadius: 10,
              }}
            >
              <span style={{ color: '#34d399', flexShrink: 0, fontWeight: 700 }}>✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.07em', marginBottom: 8 }}>
          WHAT NOT TO SAY OR DO
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {WITNESS_DONTS.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                padding: '9px 12px',
                background: 'rgba(248,113,113,0.04)',
                border: '1px solid rgba(248,113,113,0.1)',
                borderRadius: 10,
              }}
            >
              <span style={{ color: ACCENT, flexShrink: 0, fontWeight: 700 }}>✕</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const SECTIONS: Section[] = [
  {
    id: 'emergency',
    title: 'I need help right now',
    icon: '🆘',
    color: ACCENT,
    alwaysOpen: true,
    content: <EmergencySection />,
  },
  {
    id: 'immediate',
    title: 'What to do immediately',
    icon: '📋',
    color: '#fb923c',
    content: <ImmediateStepsSection />,
  },
  {
    id: 'medical',
    title: 'Medical care you are entitled to',
    icon: '🏥',
    color: '#f472b6',
    content: <MedicalCareSection />,
  },
  {
    id: 'legal',
    title: 'Your legal rights',
    icon: '⚖️',
    color: '#a78bfa',
    content: <LegalRightsSection />,
  },
  {
    id: 'recovery',
    title: 'Recovery & support',
    icon: '💙',
    color: '#60a5fa',
    content: <RecoverySection />,
  },
  {
    id: 'witness',
    title: 'If you are supporting a survivor',
    icon: '🤝',
    color: '#34d399',
    content: <WitnessSection />,
  },
]

export default function GBVResponseGuide() {
  const [activeTab, setActiveTab] = useState<GBVTab>('72hours')

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', padding: '16px' }}>
      <div style={{ maxWidth: 540, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Opening banner — always visible, trauma-informed */}
        <div style={{
          background: 'rgba(248,113,113,0.07)',
          border: '1px solid rgba(248,113,113,0.20)',
          borderRadius: 14, padding: '16px 18px', textAlign: 'center', lineHeight: 1.7,
        }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fca5a5', marginBottom: 4 }}>
            You are believed.
          </div>
          <div style={{ fontSize: '0.82rem', color: '#fca5a5', opacity: 0.85 }}>
            What happened is not your fault. You are not alone.
          </div>
        </div>

        {/* Header */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: '18px 20px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, #f87171, transparent)',
          }} />
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f87171', letterSpacing: '0.09em', marginBottom: 4 }}>
            GBV RESPONSE GUIDE
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Gender-Based Violence Support
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            Offline-first. All information is saved on your device. Trauma-informed and survivor-centred.
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', overflowX: 'auto',
          borderBottom: '1px solid rgba(255,255,255,0.06)', gap: 0,
        }}>
          {GBV_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flexShrink: 0, padding: '9px 12px',
                background: 'none', border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #f87171' : '2px solid transparent',
                color: activeTab === tab.id ? '#f87171' : 'var(--text-tertiary)',
                fontSize: '0.7rem', fontWeight: activeTab === tab.id ? 700 : 400,
                cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === '72hours'     && <Tab72Hours />}
          {activeTab === 'hotlines'    && <TabHotlines />}
          {activeTab === 'rights'      && <TabRights />}
          {activeTab === 'for_friends' && <TabForFriends />}
        </div>

        {/* Persistent emergency strip */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <a
            href="tel:0800428428"
            style={{
              flex: 1, display: 'block',
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 10, padding: '10px 0',
              textDecoration: 'none', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>GBV HOTLINE</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f87171', fontFamily: 'monospace' }}>0800 428 428</div>
          </a>
          <a
            href="tel:10111"
            style={{
              flex: 1, display: 'block',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '10px 0',
              textDecoration: 'none', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>POLICE</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>10111</div>
          </a>
        </div>

      </div>
    </div>
  )
}
