'use client'

import { useState } from 'react'
import { Rss, Users, Handshake, Heart, BookOpen, Calendar, Sparkles, Target } from 'lucide-react'
import dynamic from 'next/dynamic'

const CampusFeed            = dynamic(() => import('./CampusFeed'),          { ssr: false })
const StudyTwins            = dynamic(() => import('./StudyTwins'),          { ssr: false })
const AccountabilityPartner = dynamic(() => import('@/components/community/AccountabilityPartner'), { ssr: false })
const MutualAidBoard        = dynamic(() => import('@/components/community/MutualAidBoard'), { ssr: false })
const WisdomArchive         = dynamic(() => import('@/components/community/WisdomArchive'), { ssr: false })
const CampusEvents          = dynamic(() => import('./CampusEvents'),         { ssr: false })
const SocietiesTab          = dynamic(() => import('./SocietiesTab'),         { ssr: false })
const StudyRoomsTab         = dynamic(() => import('./StudyRoomsTab'),        { ssr: false })

type Tab = 'feed' | 'twins' | 'partners' | 'aid' | 'wisdom' | 'events' | 'societies' | 'rooms'

interface Props {
  userId: string
  userInstitution: string | null
  initialOptIn: boolean
  initialWhatsapp: string | null
}

const TAB_CONFIG: { id: Tab; label: string; icon: React.ReactNode; accent: string }[] = [
  { id: 'feed',     label: 'Feed',     icon: <Rss size={14} />,       accent: '#4ecf9e' },
  { id: 'rooms',    label: 'Focus',    icon: <Target size={14} />,    accent: '#9B6FFF' },
  { id: 'events',   label: 'Events',   icon: <Calendar size={14} />,  accent: '#f59e0b' },
  { id: 'societies',label: 'Clubs',    icon: <Sparkles size={14} />,  accent: '#7090D0' },
  { id: 'twins',    label: 'Twins',    icon: <Users size={14} />,     accent: '#9B6FFF' },
  { id: 'partners', label: 'Partners', icon: <Handshake size={14} />, accent: '#f59e0b' },
  { id: 'aid',      label: 'Aid',      icon: <Heart size={14} />,     accent: '#34d399' },
  { id: 'wisdom',   label: 'Wisdom',   icon: <BookOpen size={14} />,  accent: '#60a5fa' },
]

export default function SocialClient({ userId, userInstitution, initialOptIn, initialWhatsapp }: Props) {
  const [tab, setTab] = useState<Tab>('feed')
  const active = TAB_CONFIG.find(t => t.id === tab)!

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: 96, display: 'flex' }}>

      {/* Vertical side rail */}
      <div style={{
        width: 64, flexShrink: 0,
        position: 'sticky', top: 57,
        height: 'calc(100vh - 57px)',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        borderRight: '0.5px solid var(--border-subtle)',
        background: 'rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
      }}>
        {TAB_CONFIG.map(t => {
          const isActive = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              title={t.label}
              style={{
                width: '100%', minHeight: 64,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 5,
                background: isActive ? `${t.accent}14` : 'transparent',
                border: 'none',
                borderLeft: `2px solid ${isActive ? t.accent : 'transparent'}`,
                color: isActive ? t.accent : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                padding: '6px 2px',
              }}
            >
              <span style={{ flexShrink: 0, display: 'flex', opacity: isActive ? 1 : 0.6 }}>{t.icon}</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.46rem',
                letterSpacing: '0.04em',
                fontWeight: isActive ? 700 : 400,
                lineHeight: 1,
                textTransform: 'uppercase',
              }}>
                {t.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content column */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Compact header */}
        <div style={{
          padding: '14px 16px',
          background: `linear-gradient(180deg, ${active.accent}0c 0%, transparent 100%)`,
          borderBottom: '0.5px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: 10,
          transition: 'background 0.3s ease',
        }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: `${active.accent}18`, border: `1px solid ${active.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: active.accent, flexShrink: 0 }}>
            {active.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {active.label}
            </div>
            {userInstitution && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'rgba(255,255,255,0.3)', marginTop: 3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {userInstitution}
              </div>
            )}
          </div>
        </div>

        {/* Tab content */}
        {tab === 'aid' ? (
          <MutualAidBoard userId={userId} university={userInstitution} />
        ) : tab === 'wisdom' ? (
          <WisdomArchive userId={userId} university={userInstitution} />
        ) : (
          <div style={{ padding: '16px 16px 0' }}>
            {tab === 'feed' && (
              <CampusFeed institution={userInstitution} />
            )}
            {tab === 'events' && (
              <CampusEvents userId={userId} institution={userInstitution} />
            )}
            {tab === 'societies' && (
              <SocietiesTab userId={userId} userInstitution={userInstitution} />
            )}
            {tab === 'rooms' && (
              <StudyRoomsTab userId={userId} userInstitution={userInstitution} />
            )}
            {tab === 'twins' && (
              <StudyTwins
                userId={userId}
                userInstitution={userInstitution}
                initialOptIn={initialOptIn}
                initialWhatsapp={initialWhatsapp}
              />
            )}
            {tab === 'partners' && (
              <AccountabilityPartner userId={userId} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
