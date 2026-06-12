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

export default function SocialClient({ userId, userInstitution, initialOptIn, initialWhatsapp }: Props) {
  const [tab, setTab] = useState<Tab>('feed')

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'feed',  label: 'Campus Feed', icon: <Rss size={15} /> },
    { id: 'twins', label: 'Study Twins', icon: <Users size={15} /> },
  ]

  return (
    <div style={{ padding: '0 16px' }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4,
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: 14, padding: 4,
        margin: '14px 0 20px 0',
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '9px 8px',
              borderRadius: 10, border: 'none',
              background: tab === t.id ? 'rgba(255,255,255,0.09)' : 'transparent',
              color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.35)',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: tab === t.id ? 700 : 400,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

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
  )
}
