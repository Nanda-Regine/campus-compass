'use client'

import { useState } from 'react'
import { Rss, Users } from 'lucide-react'
import dynamic from 'next/dynamic'

const CampusFeed  = dynamic(() => import('./CampusFeed'),  { ssr: false })
const StudyTwins  = dynamic(() => import('./StudyTwins'),  { ssr: false })

type Tab = 'feed' | 'twins'

interface Props {
  userId: string
  userInstitution: string | null
  initialOptIn: boolean
  initialWhatsapp: string | null
}

const TAB_CONFIG: { id: Tab; label: string; icon: React.ReactNode; accent: string; desc: string }[] = [
  { id: 'feed',  label: 'Campus Feed', icon: <Rss size={15} />,   accent: '#4ecf9e', desc: 'Your institution' },
  { id: 'twins', label: 'Study Twins', icon: <Users size={15} />, accent: '#9B6FFF', desc: 'Find a study partner' },
]

export default function SocialClient({ userId, userInstitution, initialOptIn, initialWhatsapp }: Props) {
  const [tab, setTab] = useState<Tab>('feed')
  const active = TAB_CONFIG.find(t => t.id === tab)!

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: 96 }}>

      {/* Page header */}
      <div style={{
        padding: '16px 16px 0',
        background: `linear-gradient(180deg, ${active.accent}08 0%, transparent 100%)`,
        borderBottom: '0.5px solid var(--border-subtle)',
        marginBottom: 0,
        transition: 'background 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: `${active.accent}18`, border: `1px solid ${active.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: active.accent }}>
            {active.icon}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              Social
            </div>
            {userInstitution && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                {userInstitution}
              </div>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TAB_CONFIG.map(t => {
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1, padding: '10px 8px 10px',
                  border: 'none',
                  background: isActive ? `${t.accent}0c` : 'transparent',
                  color: isActive ? t.accent : 'rgba(255,255,255,0.35)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: isActive ? 700 : 400,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.2s ease',
                  borderBottom: isActive ? `2px solid ${t.accent}` : '2px solid transparent',
                }}
              >
                {t.icon}
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {tab === 'feed' && (
          <CampusFeed institution={userInstitution} />
        )}
        {tab === 'twins' && (
          <StudyTwins
            userId={userId}
            userInstitution={userInstitution}
            initialOptIn={initialOptIn}
            initialWhatsapp={initialWhatsapp}
          />
        )}
      </div>
    </div>
  )
}
