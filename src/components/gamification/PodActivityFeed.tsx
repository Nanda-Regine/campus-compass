'use client'

import { useState, useEffect } from 'react'
import { hideBrokenImg } from '@/lib/imgFallback'
import { DOMAIN_META, DomainKey } from '@/lib/xp-engine'

interface FeedItem {
  type: 'compound_day'
  user: { full_name: string; avatar_url: string | null; archetype?: string }
  day_date: string
  domains_hit: DomainKey[]
  xp_bonus: number
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  return `${diffDays}d ago`
}

export default function PodActivityFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/gamification/pod-feed')
      .then(r => r.json())
      .then(d => { setFeed(d.feed ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return null
  if (!feed.length) return null

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
        Pod Activity
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {feed.slice(0, 5).map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '10px 12px',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, overflow: 'hidden',
            }}>
              {item.user.avatar_url
                ? <img src={item.user.avatar_url} alt="" onError={hideBrokenImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '👤'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.user.full_name?.split(' ')[0] ?? 'A pod member'}</span>
                {' '}hit a Compound Day {timeAgo(item.day_date)}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {item.domains_hit.map(d => (
                  <span key={d} style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.48rem',
                    color: DOMAIN_META[d]?.color ?? '#fff',
                    background: DOMAIN_META[d]?.darkColor ?? 'rgba(255,255,255,0.05)',
                    borderRadius: 5, padding: '1px 5px',
                  }}>
                    {DOMAIN_META[d]?.emoji} {DOMAIN_META[d]?.label}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
              +{item.xp_bonus}xp
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
