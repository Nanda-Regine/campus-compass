'use client';

import { useState } from 'react';

interface Step {
  id: number;
  icon: string;
  title: string;
  subtitle: string;
  body: string;
  tag: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    icon: '🛡️',
    title: 'Emergency Fund First',
    subtitle: 'Minimum R500 — before anything else',
    body: 'Open a Capitec savings pocket. It earns 4.5% interest and you can withdraw any time. Your emergency fund prevents high-interest debt when things go wrong. Start with even R50/month and build up to one month of expenses.',
    tag: 'Step 1 of 5',
  },
  {
    id: 2,
    icon: '📱',
    title: 'Open Easy Equities',
    subtitle: 'Zero monthly fees, invest from R1',
    body: "Easy Equities is a JSE-registered broker with no monthly account fees and no minimum investment. Download the app, verify your SA ID, and fund with as little as R1 via instant EFT or debit card. You own actual shares — not just a tracker.",
    tag: 'Step 2 of 5',
  },
  {
    id: 3,
    icon: '📈',
    title: 'Start with Satrix 40 ETF',
    subtitle: 'JSE Top 40 companies from ~R10/share',
    body: "The Satrix 40 ETF holds shares in South Africa's 40 largest companies (Naspers, Absa, Shoprite, etc.). It is low-cost (0.10% annual fee), diversified, and liquid. One ETF gives you exposure to the whole economy — no stock-picking required.",
    tag: 'Step 3 of 5',
  },
  {
    id: 4,
    icon: '📊',
    title: 'Understand Compound Interest',
    subtitle: 'Use the calculator below to see your growth',
    body: 'Compound interest means your returns earn returns. The earlier you start, the more powerful it becomes. Even R50/month at 10% p.a. becomes R9,600 after 10 years — you only put in R6,000. The market did the rest.',
    tag: 'Step 4 of 5',
  },
  {
    id: 5,
    icon: '🏆',
    title: 'Open a TFSA',
    subtitle: 'R36,000/year limit — zero capital gains tax',
    body: 'A Tax-Free Savings Account (TFSA) means you pay no tax on growth or withdrawals. The lifetime limit is R500,000. Open one through Easy Equities, Allan Gray, or Coronation. Put your ETF investments here first — the tax saving over 10 years is significant.',
    tag: 'Step 5 of 5',
  },
];

function computeCompound(monthly: number, years: number, rate = 0.10): number {
  const r = rate / 12;
  const n = years * 12;
  if (r === 0) return monthly * n;
  return Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
}

function CompoundCalculator() {
  const [monthly, setMonthly] = useState(50);
  const [years, setYears] = useState(5);

  const result = computeCompound(monthly, years);
  const contributed = monthly * years * 12;
  const growth = result - contributed;
  const maxBar = computeCompound(1000, 20);
  const milestones = [3, 5, 10, 20].filter((y) => y <= years + 1);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '16px',
        marginTop: '12px',
      }}
    >
      <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#fbbf24', fontWeight: 700 }}>
        Compound Interest Calculator (10% p.a.)
      </p>

      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Monthly investment</label>
          <span style={{ fontSize: '13px', color: '#fff', fontWeight: 700 }}>R{monthly}</span>
        </div>
        <input
          type="range"
          min={10}
          max={1000}
          step={10}
          value={monthly}
          onChange={(e) => setMonthly(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>R10</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>R1,000</span>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Years</label>
          <span style={{ fontSize: '13px', color: '#fff', fontWeight: 700 }}>{years} yrs</span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={years}
          onChange={(e) => setYears(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>1 yr</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>20 yrs</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'Final value', value: `R${result.toLocaleString()}`, color: '#22c55e' },
          { label: 'You put in', value: `R${contributed.toLocaleString()}`, color: 'rgba(255,255,255,0.6)' },
          { label: 'Growth', value: `R${growth.toLocaleString()}`, color: '#fbbf24' },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '8px',
              padding: '10px 6px',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 2px', fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>{item.label}</p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      {milestones.length > 0 && (
        <div>
          <p style={{ margin: '0 0 8px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
            GROWTH OVER TIME
          </p>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '60px' }}>
            {milestones.map((y) => {
              const val = computeCompound(monthly, y);
              const barH = Math.max(4, Math.round((val / maxBar) * 60));
              return (
                <div key={y} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${barH}px`,
                      background: y === years ? '#fbbf24' : 'rgba(251,191,36,0.3)',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                  />
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>{y}y</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function NomvulaStory() {
  return (
    <div
      style={{
        background: 'rgba(251,191,36,0.06)',
        border: '1px solid rgba(251,191,36,0.2)',
        borderRadius: '12px',
        padding: '16px',
        marginTop: '20px',
      }}
    >
      <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#fbbf24', fontWeight: 700 }}>
        NOMVULA'S STORY
      </p>
      <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.6' }}>
        Nomvula invests R50/month from her NSFAS allowance at age 19.
        After <strong style={{ color: '#fff' }}>3 years</strong>:{' '}
        <strong style={{ color: '#22c55e' }}>R2,100</strong>.
        After <strong style={{ color: '#fff' }}>10 years</strong>:{' '}
        <strong style={{ color: '#22c55e' }}>R9,600</strong>.
        She contributed only R6,000 — compound interest added the rest.
        At 30, she has a deposit for postgrad or a car. She also teaches her younger sibling: ubuntu in action.
      </p>
    </div>
  );
}

export default function FirstInvestment() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '24px',
        color: '#fff',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#fbbf24', fontWeight: 700 }}>
          Your First Investment
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
          A 5-step guide built for SA students
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {STEPS.map((step) => {
          const isOpen = activeStep === step.id;
          return (
            <div
              key={step.id}
              style={{
                background: isOpen ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isOpen ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
            >
              <button
                onClick={() => setActiveStep(isOpen ? null : step.id)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{step.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#fff', fontWeight: 600 }}>{step.title}</p>
                  <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>{step.subtitle}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#fbbf24',
                      background: 'rgba(251,191,36,0.12)',
                      padding: '2px 7px',
                      borderRadius: '20px',
                    }}
                  >
                    {step.tag}
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {isOpen && (
                <div style={{ padding: '0 16px 16px' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'rgba(255,255,255,0.72)', lineHeight: '1.6' }}>
                    {step.body}
                  </p>
                  {step.id === 4 && <CompoundCalculator />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <NomvulaStory />

      <p
        style={{
          margin: '16px 0 0',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.3)',
          lineHeight: '1.5',
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '8px',
        }}
      >
        This is financial education, not financial advice. Consider consulting a registered financial advisor for personalised guidance.
      </p>
    </div>
  );
}
