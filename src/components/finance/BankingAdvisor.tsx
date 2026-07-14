'use client';

import { useState } from 'react';

interface BankInfo {
  name: string;
  color: string;
  monthlyFee: string;
  firstYearFee: string;
  atmFee: string;
  savingsRate: string;
  cashback: string;
  app: string;
  nsfasFriendly: boolean;
  verdict: string;
  openingSteps: string[];
}

const BANKS: Record<string, BankInfo> = {
  capitec: {
    name: 'Capitec Bank',
    color: '#0070c0',
    monthlyFee: 'R7/month',
    firstYearFee: 'R7/month',
    atmFee: 'R8 per withdrawal',
    savingsRate: '4.5% savings pocket',
    cashback: 'None',
    app: '5/5 — best in SA',
    nsfasFriendly: true,
    verdict: 'Best overall for students. Low fees, excellent app, savings pockets earn interest.',
    openingSteps: [
      'Download the Capitec app or walk into any branch',
      'Bring your SA ID (green ID book or smart card)',
      'Proof of address: student res letter or utility bill',
      'Account opens same day in branch, or within 24h in-app',
    ],
  },
  tyme: {
    name: 'TymeBank',
    color: '#e31837',
    monthlyFee: 'R0/month',
    firstYearFee: 'R0/month',
    atmFee: 'Free at Pick n Pay & Boxer; R10 at other ATMs',
    savingsRate: '7% GoalSave account',
    cashback: 'ChangeUp: rounds up purchases to nearest rand',
    app: '4/5 — clean and simple',
    nsfasFriendly: true,
    verdict: 'Best for zero-cost banking. 100% digital — no branches needed. GoalSave rate is outstanding.',
    openingSteps: [
      'Download the TymeBank app',
      'Register fully online — no branch needed',
      'Verify identity with SA ID + selfie',
      'Fund via EFT or at a Pick n Pay/Boxer kiosk',
    ],
  },
  fnb: {
    name: 'FNB Easy Account',
    color: '#007a4d',
    monthlyFee: 'R0 (students under 25)',
    firstYearFee: 'R0 first year',
    atmFee: 'R9 per withdrawal',
    savingsRate: 'eBucks rewards programme',
    cashback: 'eBucks on fuel, grocery, online',
    app: '5/5 — industry leading',
    nsfasFriendly: true,
    verdict: 'Best for building credit history. eBucks add up fast. Excellent app and integrations.',
    openingSteps: [
      'Visit fnb.co.za/students or any FNB branch',
      'Bring SA ID + proof of enrollment (registration letter)',
      'Must show you are a full-time student',
      'Account opens within 48 hours',
    ],
  },
  absa: {
    name: 'Absa Student Account',
    color: '#dc0037',
    monthlyFee: 'R0/month (students)',
    firstYearFee: 'R0/month',
    atmFee: 'R9.50 per withdrawal',
    savingsRate: 'None',
    cashback: '4% cashback at Pick n Pay',
    app: '4/5 — solid',
    nsfasFriendly: true,
    verdict: 'Best for Pick n Pay shoppers. The 4% cashback on groceries saves real money.',
    openingSteps: [
      'Visit absa.co.za or any Absa branch',
      'Bring SA ID + student registration letter',
      'Proof of address may be required',
      'Account opens within 48 hours',
    ],
  },
  standardbank: {
    name: 'Standard Bank Student',
    color: '#1e3a5f',
    monthlyFee: 'R0/month (full-time students)',
    firstYearFee: 'R0/month',
    atmFee: 'R9 per withdrawal',
    savingsRate: 'None',
    cashback: 'UCount Rewards (fuel & grocery)',
    app: '4/5 — reliable',
    nsfasFriendly: true,
    verdict: 'Solid student account. UCount rewards work well if you buy fuel or groceries often.',
    openingSteps: [
      'Apply online at standardbank.co.za/students',
      'Bring SA ID + proof of enrollment',
      'Valid student card accepted',
      'Account opens within 2 business days',
    ],
  },
};

interface QuizState {
  transactions: 'few' | 'many' | null;
  nsfas: boolean | null;
  cashback: boolean | null;
}

function recommend(q: QuizState): string {
  if (q.cashback && q.nsfas) return 'absa';
  if (!q.nsfas && !q.cashback && q.transactions === 'few') return 'tyme';
  if (q.transactions === 'many' && q.cashback) return 'fnb';
  if (q.transactions === 'many') return 'capitec';
  return 'capitec';
}

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '16px',
  padding: '24px',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
};

function QuizButton({
  label,
  onClick,
  active = false,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '12px 14px',
        borderRadius: '10px',
        border: `1px solid ${active ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.1)'}`,
        background: active ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.06)',
        color: active ? '#fbbf24' : 'rgba(255,255,255,0.8)',
        fontSize: '13px',
        cursor: 'pointer',
        marginBottom: '8px',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

export default function BankingAdvisor() {
  const [quiz, setQuiz] = useState<QuizState>({ transactions: null, nsfas: null, cashback: null });
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  function setAnswer<K extends keyof QuizState>(key: K, val: QuizState[K]) {
    const updated = { ...quiz, [key]: val };
    setQuiz(updated);
    if (step < 2) {
      setStep((s) => s + 1);
    } else {
      setResult(recommend(updated as QuizState));
    }
  }

  function reset() {
    setQuiz({ transactions: null, nsfas: null, cashback: null });
    setStep(0);
    setResult(null);
    setShowAll(false);
  }

  const bank = result ? BANKS[result] : null;

  const STEPS_TOTAL = 3;
  const progressPct = ((step + (result ? 1 : 0)) / STEPS_TOTAL) * 100;

  return (
    <div style={CARD}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#fbbf24', fontWeight: 700 }}>
          Banking Advisor
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#fff' }}>
          SA bank comparison — find your best match
        </p>
      </div>

      {!result && (
        <>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginBottom: '20px' }}>
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                background: '#fbbf24',
                borderRadius: '2px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {step === 0 && (
            <div>
              <p style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                How many bank transactions do you make per month?
              </p>
              <QuizButton label="Fewer than 15 (mostly cash)" onClick={() => setAnswer('transactions', 'few')} />
              <QuizButton label="More than 15 (card & EFT regularly)" onClick={() => setAnswer('transactions', 'many')} />
            </div>
          )}

          {step === 1 && (
            <div>
              <p style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                Do you receive NSFAS or a bursary?
              </p>
              <QuizButton label="Yes — I receive NSFAS / bursary" onClick={() => setAnswer('nsfas', true)} />
              <QuizButton label="No — self-funded or part-time income" onClick={() => setAnswer('nsfas', false)} />
              {step > 0 && (
                <button onClick={() => setStep((s) => s - 1)} style={{ fontSize: '12px', color: '#fff', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}>
                  ← Back
                </button>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <p style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                Do you shop at Pick n Pay or care about cashback rewards?
              </p>
              <QuizButton label="Yes — I shop at PnP regularly" onClick={() => setAnswer('cashback', true)} />
              <QuizButton label="No — lower fees matter more" onClick={() => setAnswer('cashback', false)} />
              <button onClick={() => setStep((s) => s - 1)} style={{ fontSize: '12px', color: '#fff', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}>
                ← Back
              </button>
            </div>
          )}
        </>
      )}

      {bank && result && (
        <div>
          <div
            style={{
              background: `${bank.color}15`,
              border: `1px solid ${bank.color}40`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <p style={{ margin: 0, fontSize: '15px', color: bank.color, fontWeight: 700 }}>{bank.name}</p>
              <span
                style={{
                  fontSize: '10px',
                  padding: '3px 8px',
                  borderRadius: '20px',
                  background: `${bank.color}30`,
                  color: bank.color,
                  fontWeight: 700,
                }}
              >
                RECOMMENDED
              </span>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#fff', lineHeight: '1.5' }}>{bank.verdict}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              {[
                { label: 'Monthly fee', val: bank.monthlyFee },
                { label: 'ATM fee', val: bank.atmFee },
                { label: 'Savings rate', val: bank.savingsRate },
                { label: 'Cashback', val: bank.cashback },
                { label: 'App rating', val: bank.app },
                { label: 'NSFAS friendly', val: bank.nsfasFriendly ? '✓ Yes' : '✗ No' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '8px 10px' }}
                >
                  <p style={{ margin: '0 0 1px', fontSize: '10px', color: '#fff' }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#fff', fontWeight: 600 }}>{item.val}</p>
                </div>
              ))}
            </div>

            <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#fff', fontWeight: 700 }}>
              HOW TO OPEN YOUR ACCOUNT
            </p>
            {bank.openingSteps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '6px', alignItems: 'flex-start' }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: `${bank.color}30`,
                    color: bank.color,
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </span>
                <p style={{ margin: 0, fontSize: '12px', color: '#fff', lineHeight: '1.4' }}>{s}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowAll((v) => !v)}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
              padding: '8px 14px',
              cursor: 'pointer',
              marginBottom: '12px',
              width: '100%',
            }}
          >
            {showAll ? 'Hide full comparison ▲' : 'Compare all banks ▼'}
          </button>

          {showAll && (
            <div style={{ marginBottom: '16px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr>
                    {['Bank', 'Monthly fee', 'ATM fee', 'Cashback'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '6px 8px',
                          color: '#fff',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(BANKS).map(([key, b]) => (
                    <tr
                      key={key}
                      style={{ background: key === result ? `${b.color}0d` : 'transparent' }}
                    >
                      <td style={{ padding: '7px 8px', color: key === result ? b.color : 'rgba(255,255,255,0.8)', fontWeight: key === result ? 700 : 400, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        {b.name}
                      </td>
                      <td style={{ padding: '7px 8px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap' }}>{b.monthlyFee}</td>
                      <td style={{ padding: '7px 8px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap' }}>{b.atmFee}</td>
                      <td style={{ padding: '7px 8px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{b.cashback}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '14px',
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#fbbf24', fontWeight: 700 }}>
              SASSA SRD GRANT — R370/MONTH
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#fff', lineHeight: '1.5' }}>
              If you have no income or income below R624/month, you may qualify for the SASSA SRD grant.
              Apply online at <span style={{ color: '#fbbf24' }}>srd.sassa.gov.za</span> with your SA ID number.
              No documents needed — just your ID and phone number. Many students qualify and never apply.
            </p>
          </div>

          <button
            onClick={reset}
            style={{
              background: 'none',
              border: 'none',
              color: '#fbbf24',
              fontSize: '12px',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            ← Retake quiz
          </button>
        </div>
      )}
    </div>
  );
}
