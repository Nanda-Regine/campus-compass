'use client'

import Link from 'next/link'
import { type Task, type Expense, type Module, type Profile, type Subscription } from '@/types'
import { cn } from '@/lib/utils'
import { NAV_MODULES } from '@/lib/navModules'
import { toISODate } from '../dashboardHelpers'

// Bento layout: Nova (wide hero) → 2×2 core cards → Groups (wide bar)
// Nav destinations come from NAV_MODULES (shared with ModulePillList).

// Per-card shape tokens — intentionally varied for organic feel
const CARD_STYLE: Record<string, { radius: number; minH: number; bg: string }> = {
  Nova:   { radius: 22, minH: 110, bg: 'linear-gradient(135deg,rgba(155,111,212,0.12) 0%,rgba(168,85,247,0.04) 100%)' },
  Study:  { radius: 18, minH: 124, bg: 'linear-gradient(160deg,rgba(78,207,158,0.08) 0%,rgba(26,158,117,0.02) 100%)' },
  Budget: { radius: 14, minH: 104, bg: 'linear-gradient(135deg,rgba(201,168,76,0.08) 0%,transparent 100%)' },
  Meals:  { radius: 20, minH: 104, bg: 'linear-gradient(135deg,rgba(232,131,74,0.08) 0%,transparent 100%)' },
  Work:   { radius: 16, minH: 100, bg: 'linear-gradient(135deg,rgba(112,144,208,0.08) 0%,transparent 100%)' },
  Groups:   { radius: 14, minH: 52,  bg: 'linear-gradient(90deg,rgba(78,207,158,0.06) 0%,transparent 100%)' },
  Regulate: { radius: 16, minH: 100, bg: 'linear-gradient(135deg,rgba(167,139,250,0.08) 0%,transparent 100%)' },
}

export default function FeatureGrid({ tasks, expenses, totalBudget, remaining, modules, subscription, profile, mealPlanExists, shiftsThisWeek, activeGroups, streakDays }: {
  tasks: Task[]; expenses: Expense[]; totalBudget: number; remaining: number
  modules: Module[]; subscription: Subscription | null; profile: Profile
  mealPlanExists: boolean; shiftsThisWeek: number; activeGroups: number; streakDays: number
}) {
  void cn(modules.length, subscription)
  const isUnlimited = profile.subscription_tier === 'nova_unlimited'
  const novaLeft = Math.max(0, (profile.nova_messages_limit ?? 10) - (profile.nova_messages_used ?? 0))
  const todayStr = toISODate()
  const _wa = new Date(); _wa.setDate(_wa.getDate() + 7)
  const weekAheadStr = toISODate(_wa)
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < todayStr).length
  const tasksDueWeek = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date >= todayStr && t.due_date <= weekAheadStr).length
  const budgetPct   = totalBudget > 0 ? Math.min(100, (remaining / totalBudget) * 100) : 100
  const budgetColor = budgetPct < 10 ? '#ff6b6b' : budgetPct < 30 ? '#c9a84c' : '#4ecf9e'
  const novaPct     = isUnlimited ? 100 : Math.min(100, (novaLeft / (profile.nova_messages_limit ?? 10)) * 100)

  const subtitles: Record<string, { text: string; color?: string; pct: number; barColor: string }> = {
    Study:  overdueTasks > 0 ? { text: `${overdueTasks} overdue`, color: '#ff6b6b', pct: 30, barColor: '#ff6b6b' } : tasksDueWeek > 0 ? { text: `${tasksDueWeek} due this week`, color: '#4ecf9e', pct: 70, barColor: '#4ecf9e' } : streakDays > 0 ? { text: `${streakDays}d streak 🔥`, color: '#4ecf9e', pct: Math.min(100, (streakDays / 30) * 100), barColor: '#4ecf9e' } : { text: 'All clear ✓', color: '#4ecf9e', pct: 100, barColor: '#4ecf9e' },
    Budget: totalBudget > 0 ? { text: remaining >= 0 ? `R${Math.round(remaining)} left` : 'Over budget', color: budgetColor, pct: Math.max(0, budgetPct), barColor: budgetColor } : { text: 'Set budget →', color: '#c9a84c', pct: 0, barColor: '#c9a84c' },
    Meals:  mealPlanExists ? { text: 'Week planned ✓', color: '#4ecf9e', pct: 90, barColor: '#4ecf9e' } : { text: 'Plan your week →', color: '#e8834a', pct: 10, barColor: '#e8834a' },
    Work:   shiftsThisWeek > 0 ? { text: `${shiftsThisWeek} shift${shiftsThisWeek > 1 ? 's' : ''} ahead`, color: '#7090d0', pct: 80, barColor: '#7090d0' } : { text: 'No shifts soon', color: 'rgba(255,255,255,0.3)', pct: 0, barColor: '#7090d0' },
    Nova:   isUnlimited ? { text: 'Unlimited', color: '#9b6fd4', pct: 100, barColor: '#9b6fd4' } : { text: `${novaLeft} msgs left`, color: novaLeft < 5 ? '#ff6b6b' : '#9b6fd4', pct: novaPct, barColor: novaLeft < 5 ? '#ff6b6b' : '#9b6fd4' },
    Groups:   activeGroups > 0 ? { text: `${activeGroups} group${activeGroups > 1 ? 's' : ''}`, color: '#4ecf9e', pct: 70, barColor: '#4ecf9e' } : { text: 'Join a group →', color: 'rgba(255,255,255,0.3)', pct: 0, barColor: '#4ecf9e' },
    Regulate: { text: 'Breathe & reset', color: '#a78bfa', pct: 100, barColor: '#a78bfa' },
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
      {NAV_MODULES.map(({ href, label, icon, color: accent, iconBg, wideInGrid: wide }) => {
        const subtitle = subtitles[label]
        const cs = CARD_STYLE[label]
        const isNova = label === 'Nova'
        const isGroups = label === 'Groups'
        return (
          <Link
            key={href}
            href={href}
            style={{ textDecoration: 'none', gridColumn: wide ? '1 / -1' : undefined }}
          >
            <div
              style={{
                background: cs.bg,
                border: '1px solid var(--border-subtle)',
                borderRadius: cs.radius,
                padding: isGroups ? '12px 16px' : isNova ? '16px 18px' : 14,
                minHeight: cs.minH,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${accent}50`; el.style.boxShadow = `0 0 0 1px ${accent}18` }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border-subtle)'; el.style.boxShadow = 'none' }}
            >
              {isNova ? (
                // Wide hero — side-by-side layout with accent glow orb
                <>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.18) 0%,transparent 70%)', pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: iconBg, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, boxShadow: `0 0 18px ${accent}30` }}>✨</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Nova AI</div>
                      <div style={{ fontSize: 12, color: subtitle.color ?? accent, marginTop: 2 }}>{subtitle.text}</div>
                    </div>
                    <span style={{ fontSize: 20, color: `${accent}70`, flexShrink: 0 }}>›</span>
                  </div>
                  <div style={{ marginTop: 10, height: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 2 }}>
                    <div className="bar-fill-anim" style={{ height: '100%', width: `${novaPct}%`, background: accent, borderRadius: 2, opacity: 0.7 }} />
                  </div>
                </>
              ) : isGroups ? (
                // Compact wide bar
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>👥</div>
                  <span style={{ fontFamily: 'Sora,sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Groups</span>
                  <span style={{ fontSize: 12, color: subtitle.color ?? accent, marginLeft: 4 }}>{subtitle.text}</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.2)' }}>›</span>
                </div>
              ) : (
                // Standard portrait card
                <>
                  <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: accent, opacity: 0.55, borderRadius: '2px 0 0 2px' }} />
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
                  <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 10 }}>{label}</div>
                  <div style={{ fontSize: 12, color: subtitle.color ?? accent, marginTop: 2 }}>{subtitle.text}</div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.04)' }}>
                    <div className="bar-fill-anim" style={{ height: '100%', width: `${subtitle.pct}%`, background: subtitle.barColor, borderRadius: 3 }} />
                  </div>
                </>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
