'use client';

import Link from 'next/link';

interface Props {
  stressLevel: 'low' | 'medium' | 'high';
}

interface StressConfig {
  accent: string;
  bg: string;
  borderColor: string;
  heading: string;
  body: string | React.ReactNode;
  showHotline: boolean;
}

const CONFIG: Record<Props['stressLevel'], StressConfig> = {
  low: {
    accent: '#22c55e',
    bg: 'rgba(34,197,94,0.06)',
    borderColor: 'rgba(34,197,94,0.25)',
    heading: 'Money Tip',
    body: 'Try the 50/30/20 rule: 50% of income on needs, 30% on wants, 20% into savings. Even small adjustments compound over time.',
    showHotline: false,
  },
  medium: {
    accent: '#f97316',
    bg: 'rgba(249,115,22,0.06)',
    borderColor: 'rgba(249,115,22,0.25)',
    heading: 'Financial Resources',
    body: (
      <span>
        You may qualify for support:{' '}
        <strong style={{ color: 'var(--text-primary)' }}>NSFAS emergency fund</strong> (contact your financial aid office),{' '}
        <strong style={{ color: 'var(--text-primary)' }}>Ubuntu Fund</strong> (ask your SRC), or the{' '}
        <strong style={{ color: 'var(--text-primary)' }}>SASSA SRD grant</strong> at srd.sassa.gov.za (R370/month, no income required).
      </span>
    ),
    showHotline: false,
  },
  high: {
    accent: '#ef4444',
    bg: 'rgba(239,68,68,0.06)',
    borderColor: 'rgba(239,68,68,0.3)',
    heading: 'Urgent Financial Help',
    body: (
      <span>
        Go to your <strong style={{ color: 'var(--text-primary)' }}>institution financial aid office today</strong> — walk-ins accepted.
        Call NSFAS: <strong style={{ color: 'var(--text-primary)' }}>0800 067 327</strong> (free, Mon–Fri 8am–4pm).
        Apply for SASSA SRD at <strong style={{ color: 'var(--text-primary)' }}>srd.sassa.gov.za</strong> (R370/month).
        Your SRC Ubuntu Fund can also provide emergency grocery vouchers.
      </span>
    ),
    showHotline: true,
  },
};

export default function FinancialStressLink({ stressLevel }: Props) {
  const cfg = CONFIG[stressLevel];

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.borderColor}`,
        borderRadius: '16px',
        padding: '16px 18px',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: cfg.accent,
            flexShrink: 0,
            marginTop: '5px',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: '0 0 5px',
              fontSize: '11px',
              fontWeight: 700,
              color: cfg.accent,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {cfg.heading}
          </p>
          <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#fff', lineHeight: '1.55' }}>
            {cfg.body}
          </p>

          {cfg.showHotline && (
            <Link
              href="/regulate"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: cfg.bg,
                border: `1px solid ${cfg.borderColor}`,
                color: cfg.accent,
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <span>🧘</span>
              Stress tools — Regulation Room →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
