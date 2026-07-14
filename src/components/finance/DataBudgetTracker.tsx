'use client';

import { useState } from 'react';

interface DataCategory {
  id: string;
  label: string;
  usedMB: number;
  color: string;
}

const TIPS: string[] = [
  'Download lecture slides on campus Wi-Fi to save data.',
  'Use WhatsApp audio calls instead of video — saves up to 80%.',
  'Enable YouTube data saver in settings (144p uses ~7MB/hour).',
  'Set Chrome to Lite Mode to compress web pages by ~70%.',
  'Disable auto-play on Instagram and TikTok.',
  'Download Spotify playlists on Wi-Fi for offline use.',
  'Use UCT/Wits/DUT campus Wi-Fi whenever possible.',
  'Google Maps offline: download your campus area in advance.',
];

const DEFAULT_CATEGORIES: DataCategory[] = [
  { id: 'whatsapp', label: 'WhatsApp', usedMB: 320, color: '#22c55e' },
  { id: 'youtube', label: 'YouTube', usedMB: 210, color: '#ef4444' },
  { id: 'study', label: 'Study & Downloads', usedMB: 180, color: '#3b82f6' },
  { id: 'instagram', label: 'Instagram', usedMB: 150, color: '#a855f7' },
  { id: 'other', label: 'Other', usedMB: 90, color: '#6b7280' },
];

function mbToReadable(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

export default function DataBudgetTracker() {
  const [bundleGB, setBundleGB] = useState(1);
  const [categories, setCategories] = useState<DataCategory[]>(DEFAULT_CATEGORIES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(0);

  const bundleMB = bundleGB * 1024;
  const usedMB = categories.reduce((sum, c) => sum + c.usedMB, 0);
  const usedPercent = Math.min(100, (usedMB / bundleMB) * 100);
  const remainingMB = Math.max(0, bundleMB - usedMB);

  const DAYS_IN_MONTH = 30;
  const dayOfMonth = 15;
  const dailyUsage = usedMB / dayOfMonth;
  const daysLeft = dailyUsage > 0 ? Math.round(remainingMB / dailyUsage) : DAYS_IN_MONTH;

  const isAlert = usedPercent > 70;

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '24px',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
  };

  function updateUsage(id: string, value: number) {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, usedMB: Math.max(0, value) } : c))
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#fbbf24', fontWeight: 700 }}>
            Data Budget Tracker
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.58)' }}>
            Monthly mobile data usage
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.66)' }}>Bundle:</label>
          <select
            value={bundleGB}
            onChange={(e) => setBundleGB(Number(e.target.value))}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            {[0.5, 1, 2, 3, 5, 10, 20].map((gb) => (
              <option key={gb} value={gb} style={{ background: '#1a1a2e' }}>
                {gb} GB
              </option>
            ))}
          </select>
        </div>
      </div>

      {isAlert && (
        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#fca5a5',
          }}
        >
          You have used {Math.round(usedPercent)}% of your data. Consider switching to Wi-Fi.
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
            {mbToReadable(usedMB)} used of {bundleGB} GB
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: isAlert ? '#ef4444' : '#22c55e',
            }}
          >
            {Math.round(usedPercent)}%
          </span>
        </div>

        <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '5px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${usedPercent}%`,
              background: isAlert
                ? 'linear-gradient(90deg, #f97316, #ef4444)'
                : 'linear-gradient(90deg, #fbbf24, #22c55e)',
              borderRadius: '5px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.58)' }}>
            {mbToReadable(remainingMB)} remaining
          </span>
          <span style={{ fontSize: '11px', color: daysLeft < 7 ? '#ef4444' : 'rgba(255,255,255,0.58)' }}>
            ~{daysLeft} days left at current pace
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'rgba(255,255,255,0.66)', fontWeight: 600 }}>
          USAGE BY CATEGORY
        </p>
        {categories.map((cat) => {
          const catPercent = bundleMB > 0 ? (cat.usedMB / bundleMB) * 100 : 0;
          return (
            <div key={cat.id} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{cat.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingId === cat.id ? (
                    <input
                      type="number"
                      inputMode="numeric"
                      aria-label="Data used in megabytes"
                      value={cat.usedMB}
                      min={0}
                      autoFocus
                      onBlur={() => setEditingId(null)}
                      onChange={(e) => updateUsage(cat.id, Number(e.target.value))}
                      style={{
                        width: '72px',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        padding: '2px 6px',
                        textAlign: 'right',
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => setEditingId(cat.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.66)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {mbToReadable(cat.usedMB)}
                    </button>
                  )}
                </div>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${catPercent}%`,
                    background: cat.color,
                    borderRadius: '2px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
        <p style={{ margin: '6px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
          Tap any usage value to edit it
        </p>
      </div>

      <div
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '12px 14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, marginRight: '8px' }}>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#fbbf24', fontWeight: 700 }}>
              DATA SAVING TIP
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
              {TIPS[tipIndex % TIPS.length]}
            </p>
          </div>
          <button
            onClick={() => setTipIndex((i) => i + 1)}
            style={{
              background: 'rgba(251,191,36,0.12)',
              border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: '6px',
              color: '#fbbf24',
              fontSize: '11px',
              padding: '4px 8px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Next tip
          </button>
        </div>
      </div>
    </div>
  );
}
