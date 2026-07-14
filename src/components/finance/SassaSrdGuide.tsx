'use client';

import { useState } from 'react';

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

function SectionBody({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '0 16px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>
      {children}
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '5px', alignItems: 'flex-start' }}>
      <span style={{ color: '#22c55e', flexShrink: 0, marginTop: '1px' }}>✓</span>
      <span>{children}</span>
    </div>
  );
}

function Step({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
      <span
        style={{
          flexShrink: 0,
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'rgba(251,191,36,0.15)',
          color: '#fbbf24',
          fontSize: '11px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {num}
      </span>
      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>{children}</span>
    </div>
  );
}

const SECTIONS: Section[] = [
  {
    id: 'eligibility',
    title: 'Who is eligible?',
    content: (
      <SectionBody>
        <Bullet>South African citizen, permanent resident, or refugee with a valid permit</Bullet>
        <Bullet>Aged 18 to 59</Bullet>
        <Bullet>No income, or income below R624/month</Bullet>
        <Bullet>Not receiving any other SASSA grant (NSFAS food allowance does not disqualify you)</Bullet>
        <Bullet>Not in formal employment</Bullet>
        <Bullet>Not receiving UIF payments</Bullet>
        <div
          style={{
            marginTop: '10px',
            padding: '10px 12px',
            background: 'rgba(251,191,36,0.07)',
            borderRadius: '8px',
            border: '1px solid rgba(251,191,36,0.18)',
          }}
        >
          <p style={{ margin: 0, fontSize: '12px', color: '#fbbf24' }}>
            Student note: Many students qualify. Your NSFAS allowance only disqualifies you if it exceeds R624/month. If your NSFAS is delayed or partial, apply.
          </p>
        </div>
      </SectionBody>
    ),
  },
  {
    id: 'apply',
    title: 'How to apply',
    content: (
      <SectionBody>
        <Step num={1}>
          Online — go to <strong style={{ color: 'var(--text-primary)' }}>srd.sassa.gov.za</strong> (type it into your browser). Takes 5 minutes. You only need your SA ID and phone number.
        </Step>
        <Step num={2}>
          WhatsApp — send "Hi" to <strong style={{ color: 'var(--text-primary)' }}>0800 60 10 11</strong> and follow the prompts.
        </Step>
        <Step num={3}>
          Walk-in — visit your nearest SASSA office with your SA ID.
        </Step>
        <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.62)' }}>
          Re-apply every month — approval is not automatic. Set a monthly reminder.
        </p>
      </SectionBody>
    ),
  },
  {
    id: 'documents',
    title: 'Documents needed',
    content: (
      <SectionBody>
        <Bullet>SA ID (green book or smart card)</Bullet>
        <Bullet>Active South African phone number (for OTP verification)</Bullet>
        <Bullet>Bank account number for payment (optional — post office also works)</Bullet>
        <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.62)' }}>
          No proof of income or address required for the online application.
        </p>
      </SectionBody>
    ),
  },
  {
    id: 'payment',
    title: 'Payment timeline',
    content: (
      <SectionBody>
        <p style={{ margin: '0 0 8px' }}>
          SASSA approves applications within 30 days. Once approved, payment is made monthly via:
        </p>
        <Bullet>Direct bank deposit (fastest)</Bullet>
        <Bullet>SASSA card — collect at Post Office or Pick n Pay</Bullet>
        <Bullet>Cash send — collect at specific retailers</Bullet>
        <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.62)' }}>
          Payments are usually released in the first two weeks of each month.
        </p>
      </SectionBody>
    ),
  },
  {
    id: 'rejection',
    title: 'Rejected? Here is what to do',
    content: (
      <SectionBody>
        <p style={{ margin: '0 0 10px' }}>Common rejection reasons:</p>
        <Bullet>SASSA found income in your bank account (even once-off deposits can trigger this)</Bullet>
        <Bullet>Another grant is registered under your ID</Bullet>
        <Bullet>UIF contributions detected</Bullet>
        <Bullet>Details mismatch between Home Affairs and your application</Bullet>
        <div
          style={{
            marginTop: '10px',
            padding: '10px 12px',
            background: 'rgba(34,197,94,0.07)',
            borderRadius: '8px',
            border: '1px solid rgba(34,197,94,0.2)',
          }}
        >
          <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#22c55e', fontWeight: 700 }}>HOW TO APPEAL</p>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
            Go to <strong style={{ color: 'var(--text-primary)' }}>srd.sassa.gov.za</strong>, click "Appeals", and submit within 90 days of the rejection.
            Include your ID number and the rejection reason. Most appeals succeed when the reason is a false positive.
          </p>
        </div>
      </SectionBody>
    ),
  },
  {
    id: 'more',
    title: 'Other emergency resources',
    content: (
      <SectionBody>
        <div style={{ marginBottom: '10px' }}>
          <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>NSFAS Food Allowance</p>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
            If you receive NSFAS, you may qualify for a food allowance. Contact your institution's financial aid office to check — it is separate from your accommodation and tuition.
          </p>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>Institution Emergency Fund</p>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
            Most universities maintain a hardship fund. Visit the Student Affairs or Financial Aid office. You do not need to be in crisis — food insecurity qualifies.
          </p>
        </div>
        <div>
          <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>Ubuntu Fund</p>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
            A student-run solidarity fund at many South African universities. Contact your SRC for access. No repayment required — it is a grant.
          </p>
        </div>
      </SectionBody>
    ),
  },
];

export default function SassaSrdGuide() {
  const [openId, setOpenId] = useState<string | null>('eligibility');

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(251,191,36,0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#fbbf24', fontWeight: 700 }}>
              SASSA SRD Grant Guide
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.66)' }}>
              R370/month — many students qualify and never apply
            </p>
          </div>
          <span
            style={{
              flexShrink: 0,
              background: 'rgba(251,191,36,0.15)',
              color: '#fbbf24',
              fontSize: '13px',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '20px',
            }}
          >
            R370/mo
          </span>
        </div>
      </div>

      <div>
        {SECTIONS.map((section) => {
          const isOpen = openId === section.id;
          return (
            <div
              key={section.id}
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              <button
                onClick={() => setOpenId(isOpen ? null : section.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '13px 16px',
                  background: isOpen ? 'rgba(251,191,36,0.04)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    color: isOpen ? '#fbbf24' : 'rgba(255,255,255,0.8)',
                    fontWeight: isOpen ? 600 : 400,
                  }}
                >
                  {section.title}
                </span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>
              {isOpen && section.content}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '14px 16px' }}>
        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.5' }}>
          Information current as of 2026. Grant amounts and eligibility may change. Verify at srd.sassa.gov.za.
        </p>
      </div>
    </div>
  );
}
