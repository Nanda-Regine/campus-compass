'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UpgradePromptModalProps {
  open: boolean
  onClose: () => void
  featureName: string
  benefit: string
  tier?: 'scholar' | 'nova_unlimited'
}

export default function UpgradePromptModal({
  open,
  onClose,
  featureName,
  benefit,
  tier = 'scholar',
}: UpgradePromptModalProps) {
  const router = useRouter()

  if (!open) return null

  const isUnlimited = tier === 'nova_unlimited'
  const accent      = isUnlimited ? '#d4a847' : '#38BDF8'
  const planName    = isUnlimited ? 'Nova Unlimited' : 'Nova Scholar'
  const price       = isUnlimited ? 'R89' : 'R29'

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1200,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg-surface, #0f1a19)',
        border: `1px solid ${accent}30`,
        borderRadius: 20, overflow: 'hidden',
        maxHeight: 'calc(100dvh - 48px)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ height: 3, flexShrink: 0, background: `linear-gradient(90deg, ${accent}, transparent)` }} />

        <div style={{ padding: '24px 22px 22px', overflowY: 'auto', flex: 1 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: `${accent}18`, border: `1px solid ${accent}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, marginBottom: 16,
          }}>
            {isUnlimited ? '♾️' : '⭐'}
          </div>

          <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: accent, letterSpacing: '0.1em', marginBottom: 6 }}>
            PREMIUM FEATURE
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>
            {featureName}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 20px' }}>
            {benefit}
          </p>

          <div style={{
            background: `${accent}08`, border: `1px solid ${accent}20`,
            borderRadius: 12, padding: '14px 16px', marginBottom: 20,
          }}>
            <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: accent, marginBottom: 8 }}>
              {planName.toUpperCase()} — {price}/month
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(isUnlimited
                ? ['Unlimited Nova messages', 'CSV data export', 'First access to new features']
                : ['150 Nova messages/month', 'Study Pods matching', 'AI Catch-up Planner', 'Priority support']
              ).map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span style={{ color: accent, fontSize: 10 }}>✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => { router.push('/upgrade'); onClose() }}
            style={{
              width: '100%', padding: '13px', borderRadius: 12,
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              background: `linear-gradient(135deg, ${accent}30, ${accent}18)`,
              border: `1px solid ${accent}50`,
              color: accent, marginBottom: 10,
            }}
          >
            Upgrade to {planName} — {price}/month
          </button>

          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '11px', borderRadius: 12,
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-muted)',
            }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UpgradePromptState {
  open: boolean
  featureName: string
  benefit: string
  tier: 'scholar' | 'nova_unlimited'
}

export function useUpgradePrompt() {
  const [state, setState] = useState<UpgradePromptState>({
    open: false, featureName: '', benefit: '', tier: 'scholar',
  })

  const show = useCallback((featureName: string, benefit: string, tier: 'scholar' | 'nova_unlimited' = 'scholar') => {
    setState({ open: true, featureName, benefit, tier })
  }, [])

  const hide = useCallback(() => {
    setState(s => ({ ...s, open: false }))
  }, [])

  const modal = (
    <UpgradePromptModal
      open={state.open}
      onClose={hide}
      featureName={state.featureName}
      benefit={state.benefit}
      tier={state.tier}
    />
  )

  return { show, hide, modal }
}
