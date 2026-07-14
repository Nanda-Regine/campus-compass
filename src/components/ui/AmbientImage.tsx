'use client'

import Image from 'next/image'

// ─── IMAGE ZONES ──────────────────────────────────────────────────────────────
// All images live at /public/images/ambient/ — import via AMBIENT_IMAGES map.
//
//  dashboard.jpg       — Dark blue oil storm sky + orange glow     → Dashboard hero
//  nova.jpg            — Rainbow cosmic noise on dark purple/blue  → Nova AI background
//  study.jpg           — Deep navy velvet texture                  → Study / Flashcards
//  budget.jpg          — Dark charcoal with orange-red glow stripe → Budget / Finance
//  meals.jpg           — Terracotta/nude/grey sand-wave layers     → Meal Planner
//  career.jpg          — Navy to sky-blue fine grain gradient      → Career / CV
//  wellness.jpg        — Airy white/orange/pink textured paint     → Wellness / Mental Health
//  onboarding.jpg      — Rich impasto burst of all colours         → Onboarding hero
//  habits.jpg          — Layered torn colourful paper/fabric       → Habits / Growth
//  community.jpg       — Bold dark oil: red/orange/yellow/blue     → Campus Feed / Community
//  safety.jpg          — Blue/white/cream ocean-wave texture       → Safety / Female module
//  entrepreneurship.jpg— Teal/orange fluid acrylic pour            → Entrepreneurship OS
//  body.jpg            — Bright orange/cyan bold paint strokes     → Body / Fitness
//  nsfas.jpg           — Iridescent blue/purple surface sheen      → NSFAS Tracker
//  movement.jpg        — Smooth cyan-to-orange gradient            → Commute / Maps
//  schedule.jpg        — Teal-to-pink leather gradient             → Timetable / Schedule
//  alerts.jpg          — AMOLED dark + red/orange fire rings       → Academic Risk / Alerts
//  texture-light.jpg   — Cyan/orange/brown brushed diagonal        → Light mode overlays
// ──────────────────────────────────────────────────────────────────────────────

export type AmbientZone =
  | 'dashboard' | 'nova' | 'study' | 'budget' | 'meals' | 'career'
  | 'wellness' | 'onboarding' | 'habits' | 'community' | 'safety'
  | 'entrepreneurship' | 'body' | 'nsfas' | 'movement' | 'schedule'
  | 'alerts' | 'texture-light'
  // Extended zones using raw public images
  | 'vibrant' | 'gradient-pink' | 'digital' | 'amoled' | 'abstract-wall'
  | 'impasto' | 'design' | 'vibzztime' | 'funky'

export const AMBIENT_IMAGES: Record<AmbientZone, string> = {
  dashboard:        '/images/ambient/dashboard.jpg',
  nova:             '/images/ambient/nova.jpg',
  study:            '/images/ambient/study.jpg',
  budget:           '/images/ambient/budget.jpg',
  meals:            '/images/ambient/meals.jpg',
  career:           '/images/ambient/career.jpg',
  wellness:         '/images/ambient/wellness.jpg',
  onboarding:       '/images/ambient/onboarding.jpg',
  habits:           '/images/ambient/habits.jpg',
  community:        '/images/ambient/community.jpg',
  safety:           '/images/ambient/safety.jpg',
  entrepreneurship: '/images/ambient/entrepreneurship.jpg',
  body:             '/images/ambient/body.jpg',
  nsfas:            '/images/ambient/nsfas.jpg',
  movement:         '/images/ambient/movement.jpg',
  schedule:         '/images/ambient/schedule.jpg',
  alerts:           '/images/ambient/alerts.jpg',
  'texture-light':  '/images/ambient/texture-light.jpg',
  // Raw public images — unique per page
  vibrant:          '/Vibrant%20colors%20abstract%204k%20mobile%20wallpaper%20free.jpg',
  'gradient-pink':  '/Blue%20and%20pink%20gradient.jpg',
  digital:          '/Digital%20art.jpg',
  amoled:           '/Strength%20in%20Pixels_%20AMOLED%20wallpapers.jpg',
  'abstract-wall':  '/Modern%20Abstract%20Wall%20Art%20Print%20for%20Contemporary%20Interior.jpg',
  impasto:          '/Textured%20Chromatic%20Tide_%20A%20Heavy%20Impasto%20Abstract%20Study%20in%20Vivid%20Motion%20%26%20Energy.jpg',
  design:           '/Sam%20Chirnside%20-%20Design%20Crush.jpg',
  vibzztime:        '/%23vibzztime.jpg',
  funky:            '/download%20(1).jpg',
}

interface AmbientImageProps {
  /** Zone key or a custom /public path */
  zone?: AmbientZone
  src?: string
  alt?: string
  opacity?: number       // 0–1, default 0.42
  blurPx?: number        // CSS blur in px, default 3
  saturation?: number    // CSS saturate multiplier, default 1.3
  overlayColor?: string  // gradient layered over the image for legibility
  sizes?: string
}

// Turn a FLAT solid scrim into a top-lighter gradient. A uniform rgba() overlay
// dims the whole viewport equally — including the hero area at the top — so the
// image's colour never glows through anywhere and the page reads as flat black.
// Easing the top ~45% from a lighter alpha up to the full value restores the glow
// at the hero while keeping the full scrim over the content/text area below.
// Gradients and "transparent" are left exactly as the page specified them.
function easeScrim(overlay: string): string {
  if (!overlay || overlay === 'transparent' || overlay.includes('gradient')) return overlay
  const m = overlay.match(/rgba?\(([^)]+)\)/)
  if (!m) return overlay
  const p = m[1].split(',').map(s => s.trim())
  const [r, g, b] = p
  const a = p[3] !== undefined ? parseFloat(p[3]) : 1
  const topA = Math.max(0, a * 0.4).toFixed(3)
  const midA = Math.max(0, a * 0.82).toFixed(3)
  return `linear-gradient(180deg, rgba(${r},${g},${b},${topA}) 0%, rgba(${r},${g},${b},${midA}) 30%, rgba(${r},${g},${b},${a}) 58%, rgba(${r},${g},${b},${a}) 100%)`
}

export function AmbientImage({
  zone,
  src,
  alt = '',
  opacity = 0.40,
  blurPx = 3,
  saturation = 1.3,
  // Dark-theme legibility scrim. Lightened (was 0.40→0.66) so the background image
  // stays visible instead of being crushed to black, while text further down the
  // page stays readable. In light/outdoor themes the `.ambient-scrim` class below
  // is overridden in globals.css with a pale scrim so the dark gradient never
  // muddies a bright surface. Pages that want no scrim pass overlayColor="transparent".
  overlayColor = 'linear-gradient(180deg, rgba(5,4,12,0.34) 0%, rgba(5,4,12,0.62) 100%)',
  sizes = '100vw',
}: AmbientImageProps) {
  const imageSrc = zone ? AMBIENT_IMAGES[zone] : src
  if (!imageSrc) return null

  return (
    <div
      aria-hidden="true"
      className="ambient-root"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <Image
        className="ambient-img"
        src={imageSrc}
        alt={alt}
        fill
        style={{
          objectFit: 'cover',
          opacity,
          // Small brightness lift so the colour actually reads through the scrim
          // instead of sinking into the page's near-black background.
          filter: `blur(${blurPx}px) saturate(${saturation}) brightness(1.08)`,
        }}
        sizes={sizes}
        priority={false}
      />
      <div className="ambient-scrim" style={{ position: 'absolute', inset: 0, background: easeScrim(overlayColor) }} />
      {/* Soft teal halo at the top — gives the page depth/glow instead of flat dark.
          `screen` blend brightens only; at 0.09 it never fights body text. Suppressed
          on the light/outdoor themes in globals.css. */}
      <div
        className="ambient-glow"
        style={{
          position: 'absolute', inset: 0, mixBlendMode: 'screen', pointerEvents: 'none',
          background: 'radial-gradient(130% 62% at 50% -12%, rgba(45,212,191,0.16) 0%, rgba(45,212,191,0.05) 34%, transparent 60%)',
        }}
      />
    </div>
  )
}
