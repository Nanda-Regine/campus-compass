'use client'

import Image from 'next/image'

// ─── IMAGE ZONES ──────────────────────────────────────────────────────────────
// All images live at /public/images/ambient/ — import via AMBIENT_IMAGES map.
//
//  dashboard.jpg       — Fluid blue/teal/orange aurora swirls     → Dashboard hero
//  nova.jpg            — Grainy nebula, purple/blue/red            → Nova AI background
//  study.jpg           — Dark rock layers, glowing teal rivers     → Study / Flashcards
//  budget.jpg          — Orange/yellow fire diagonal on navy       → Budget / Finance
//  meals.jpg           — Terracotta earth tone layered waves       → Meal Planner
//  career.jpg          — Deep navy velvet texture                  → Career / CV
//  wellness.jpg        — White sand dunes, organic ripple          → Wellness / Mental Health
//  onboarding.jpg      — Dark AMOLED + sculpted paint swirl        → Onboarding hero
//  habits.jpg          — Layered colorful torn fabric/paper        → Habits / Growth
//  community.jpg       — Bold multi-colour abstract                → Campus Feed / Community
//  safety.jpg          — Soft peach/rose flowing silk              → Safety / Female module
//  entrepreneurship.jpg— Cyan/orange energetic brushstrokes        → Entrepreneurship OS
//  body.jpg            — Red/blue sunset oil painting              → Body / Fitness
//  nsfas.jpg           — Holographic iridescent blue/purple        → NSFAS Tracker
//  movement.jpg        — Teal-to-pink leather gradient             → Commute / Maps
//  schedule.jpg        — Calm blue linen gradient                  → Timetable / Schedule
//  alerts.jpg          — Dark BG, orange/red paint explosion       → Academic Risk / Alerts
//  texture-light.jpg   — Pure white flowing fabric                 → Light mode overlays
// ──────────────────────────────────────────────────────────────────────────────

export type AmbientZone =
  | 'dashboard' | 'nova' | 'study' | 'budget' | 'meals' | 'career'
  | 'wellness' | 'onboarding' | 'habits' | 'community' | 'safety'
  | 'entrepreneurship' | 'body' | 'nsfas' | 'movement' | 'schedule'
  | 'alerts' | 'texture-light'

export const AMBIENT_IMAGES: Record<AmbientZone, string> = {
  dashboard:       '/images/ambient/dashboard.jpg',
  nova:            '/images/ambient/nova.jpg',
  study:           '/images/ambient/study.jpg',
  budget:          '/images/ambient/budget.jpg',
  meals:           '/images/ambient/meals.jpg',
  career:          '/images/ambient/career.jpg',
  wellness:        '/images/ambient/wellness.jpg',
  onboarding:      '/images/ambient/onboarding.jpg',
  habits:          '/images/ambient/habits.jpg',
  community:       '/images/ambient/community.jpg',
  safety:          '/images/ambient/safety.jpg',
  entrepreneurship:'/images/ambient/entrepreneurship.jpg',
  body:            '/images/ambient/body.jpg',
  nsfas:           '/images/ambient/nsfas.jpg',
  movement:        '/images/ambient/movement.jpg',
  schedule:        '/images/ambient/schedule.jpg',
  alerts:          '/images/ambient/alerts.jpg',
  'texture-light': '/images/ambient/texture-light.jpg',
}

interface AmbientImageProps {
  /** Zone key or a custom /public path */
  zone?: AmbientZone
  src?: string
  alt?: string
  opacity?: number       // 0–1, default 0.28
  blurPx?: number        // CSS blur in px, default 3
  saturation?: number    // CSS saturate multiplier, default 1.3
  overlayColor?: string  // gradient layered over the image for legibility
  sizes?: string
}

export function AmbientImage({
  zone,
  src,
  alt = '',
  opacity = 0.28,
  blurPx = 3,
  saturation = 1.3,
  overlayColor = 'linear-gradient(180deg, rgba(5,4,12,0.30) 0%, rgba(10,9,23,0.15) 100%)',
  sizes = '100vw',
}: AmbientImageProps) {
  const imageSrc = zone ? AMBIENT_IMAGES[zone] : src
  if (!imageSrc) return null

  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <Image
        src={imageSrc}
        alt={alt}
        fill
        style={{
          objectFit: 'cover',
          opacity,
          filter: `blur(${blurPx}px) saturate(${saturation})`,
        }}
        sizes={sizes}
        priority={false}
      />
      <div style={{ position: 'absolute', inset: 0, background: overlayColor }} />
    </div>
  )
}
