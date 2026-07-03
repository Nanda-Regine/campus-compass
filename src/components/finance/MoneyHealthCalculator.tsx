'use client';

import { useState } from 'react';

interface MoneyHealthScoreProps {
  savingsAmount?: number;
  monthlyIncome?: number;
  essentialSpend?: number;
  discretionarySpend?: number;
  foodSpend?: number;       // actual monthly food spend (R)
  dataSpend?: number;       // actual monthly airtime/data spend (R)
  compact?: boolean;
}

// Grounded SA reference points (not fabricated ratios). "Adequate" = enough to be food-secure
// / connected for study; spending at or above it scores 100, below it flags insecurity risk.
// FOOD: ~R1,500/mo is in line with the NSFAS living/meal allowance for a student.
// DATA: ~R150/mo buys a study-capable bundle (slides, some video; many edu sites are zero-rated).
const FOOD_ADEQUATE_MONTHLY = 1500;
const DATA_ADEQUATE_MONTHLY = 150;

interface Pillar {
  label: string;
  score: number;
  weight: number;
}

function getZone(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Thriving', color: '#22c55e' };
  if (score >= 60) return { label: 'Stable', color: '#eab308' };
  if (score >= 40) return { label: 'Strained', color: '#f97316' };
  return { label: 'Crisis', color: '#ef4444' };
}

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

function computeScore(
  savingsAmount: number,
  monthlyIncome: number,
  essentialSpend: number,
  discretionarySpend: number,
  foodSpend: number,
  dataSpend: number
): { total: number; pillars: Pillar[] } {
  // Guard every income-denominated divisor: a student can legitimately enter 0 income,
  // and x/0 yields Infinity/NaN that clamp() cannot fix (Math.min(100, NaN) === NaN),
  // which would render the whole gauge as "NaN".
  const emergencyTarget = monthlyIncome * 0.5;
  const emergencyFundScore = emergencyTarget > 0
    ? clamp((savingsAmount / emergencyTarget) * 100, 0, 100)
    : (savingsAmount > 0 ? 100 : 0);

  const totalSpend = essentialSpend + discretionarySpend;
  const spendingRatio = monthlyIncome > 0 ? totalSpend / monthlyIncome : 1;
  const spendingScore = clamp((1 - spendingRatio) * 200, 0, 100);

  // Food security & connectivity use the student's ACTUAL food/data spend against grounded SA
  // adequacy targets — not a fabricated fraction of "essentials". Adequacy is capped at 100, so
  // spending more than enough isn't rewarded, and spending too little (insecurity) scores low.
  const foodScore = clamp((foodSpend / FOOD_ADEQUATE_MONTHLY) * 100, 0, 100);
  const dataScore = clamp((dataSpend / DATA_ADEQUATE_MONTHLY) * 100, 0, 100);

  const pillars: Pillar[] = [
    { label: 'Emergency Fund', score: Math.round(emergencyFundScore), weight: 0.3 },
    { label: 'Spending Ratio', score: Math.round(spendingScore), weight: 0.35 },
    { label: 'Food Security', score: Math.round(foodScore), weight: 0.25 },
    { label: 'Data Budget', score: Math.round(dataScore), weight: 0.1 },
  ];

  const total = Math.round(
    pillars.reduce((acc, p) => acc + p.score * p.weight, 0)
  );

  return { total: clamp(total, 0, 100), pillars };
}

function getInsight(pillars: Pillar[]): string {
  const lowest = [...pillars].sort((a, b) => a.score - b.score)[0];
  if (lowest.label === 'Emergency Fund') return 'Start with R50/month in a Capitec savings pocket — even small buffers reduce crisis risk.';
  if (lowest.label === 'Spending Ratio') return 'Your spending exceeds income. Track one week of purchases to find cuts.';
  if (lowest.label === 'Food Security') return 'Your food budget is tight — check if your institution offers a food bursary or ubuntu fund meals.';
  return 'Limited data can block studying. Use campus Wi-Fi for downloads, lean on zero-rated education sites, and look for student data deals.';
}

function CircularGauge({ score, color, compact }: { score: number; color: string; compact: boolean }) {
  const size = compact ? 100 : 140;
  const strokeWidth = compact ? 8 : 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

function PillarBar({ pillar }: { pillar: Pillar }) {
  const zone = getZone(pillar.score);
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{pillar.label}</span>
        <span style={{ fontSize: '12px', color: zone.color, fontWeight: 600 }}>{pillar.score}</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
        <div
          style={{
            height: '100%',
            width: `${pillar.score}%`,
            background: zone.color,
            borderRadius: '2px',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function MoneyHealthCalculator({
  savingsAmount,
  monthlyIncome,
  essentialSpend,
  discretionarySpend,
  foodSpend,
  dataSpend,
  compact = false,
}: MoneyHealthScoreProps) {
  const hasData =
    savingsAmount !== undefined &&
    monthlyIncome !== undefined &&
    essentialSpend !== undefined &&
    discretionarySpend !== undefined;

  const [showCalculator, setShowCalculator] = useState(!hasData);
  const [inputs, setInputs] = useState({
    savings: savingsAmount ?? 0,
    income: monthlyIncome ?? 3500,
    essential: essentialSpend ?? 2000,
    discretionary: discretionarySpend ?? 800,
    // Unknown food/data spend defaults to the adequacy target (neutral) rather than 0,
    // so a not-yet-filled field doesn't falsely flag food insecurity.
    food: foodSpend ?? FOOD_ADEQUATE_MONTHLY,
    data: dataSpend ?? DATA_ADEQUATE_MONTHLY,
  });

  const { total, pillars } = computeScore(
    inputs.savings,
    inputs.income,
    inputs.essential,
    inputs.discretionary,
    inputs.food,
    inputs.data
  );
  const zone = getZone(total);
  const insight = getInsight(pillars);

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: compact ? '16px' : '24px',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
  };

  if (!hasData && showCalculator) {
    return (
      <div style={cardStyle}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: compact ? '14px' : '16px', color: '#fbbf24', fontWeight: 700 }}>
            Money Health Score
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            Enter your monthly figures
          </p>
        </div>

        {[
          { key: 'income', label: 'Monthly income (R)', min: 0, max: 20000 },
          { key: 'savings', label: 'Savings / emergency fund (R)', min: 0, max: 50000 },
          { key: 'essential', label: 'Essential spend (R)', min: 0, max: 15000 },
          { key: 'discretionary', label: 'Discretionary spend (R)', min: 0, max: 10000 },
          { key: 'food', label: 'Food / groceries (R/month)', min: 0, max: 10000 },
          { key: 'data', label: 'Airtime / data (R/month)', min: 0, max: 5000 },
        ].map(({ key, label, min, max }) => (
          <div key={key} style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '4px' }}>
              {label}
            </label>
            <input
              type="number"
              inputMode="decimal"
              aria-label={label}
              min={min}
              max={max}
              value={inputs[key as keyof typeof inputs]}
              onChange={(e) =>
                setInputs((prev) => ({ ...prev, [key]: Number(e.target.value) }))
              }
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        ))}

        <button
          onClick={() => setShowCalculator(false)}
          style={{
            width: '100%',
            padding: '10px',
            background: '#fbbf24',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Calculate My Score
        </button>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: compact ? '12px' : '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: compact ? '14px' : '16px', color: '#fbbf24', fontWeight: 700 }}>
            Money Health Score
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
            Based on your budget data
          </p>
        </div>
        {!hasData && (
          <button
            onClick={() => setShowCalculator(true)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '6px',
              padding: '4px 10px',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Recalculate
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '16px' : '24px', marginBottom: compact ? '16px' : '24px' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <CircularGauge score={total} color={zone.color} compact={compact} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: compact ? '22px' : '30px', fontWeight: 800, color: zone.color }}>{total}</span>
            <span style={{ fontSize: compact ? '9px' : '11px', color: zone.color, fontWeight: 600 }}>{zone.label}</span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {pillars.map((p) => (
            <PillarBar key={p.label} pillar={p} />
          ))}
        </div>
      </div>

      {!compact && (
        <div
          style={{
            background: 'rgba(251,191,36,0.08)',
            border: '1px solid rgba(251,191,36,0.2)',
            borderRadius: '10px',
            padding: '12px 14px',
          }}
        >
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>Insight: </span>
            {insight}
          </p>
        </div>
      )}
    </div>
  );
}
