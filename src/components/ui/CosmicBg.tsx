'use client'

// Afrofuturist ambient nebula background — pure CSS, zero JS overhead.
// Place inside any page container (position: relative) for the ambient effect.
// intensity='subtle' for inner cards, 'rich' for full-page hero sections.

interface CosmicBgProps {
  intensity?: 'subtle' | 'default' | 'rich'
  fixed?: boolean  // true = position:fixed (root layout), false = position:absolute (section)
}

export function CosmicBg({ intensity = 'default', fixed = false }: CosmicBgProps) {
  const scale = intensity === 'subtle' ? 0.5 : intensity === 'rich' ? 1.6 : 1.0
  const pos = fixed ? 'fixed' : 'absolute'

  return (
    <div
      aria-hidden="true"
      style={{ position: pos, inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
    >
      {/* Amethyst nebula — upper left */}
      <div style={{
        position: 'absolute',
        top: '-25%', left: '-15%',
        width: '70%', height: '75%',
        background: 'radial-gradient(ellipse, rgba(168,85,247,0.13) 0%, transparent 70%)',
        filter: 'blur(72px)',
        opacity: scale,
      }} />

      {/* Jade nebula — lower right */}
      <div style={{
        position: 'absolute',
        bottom: '-20%', right: '-15%',
        width: '60%', height: '65%',
        background: 'radial-gradient(ellipse, rgba(0,207,160,0.09) 0%, transparent 70%)',
        filter: 'blur(72px)',
        opacity: scale,
      }} />

      {/* Kente bronze — centre accent */}
      <div style={{
        position: 'absolute',
        top: '35%', left: '25%',
        width: '50%', height: '35%',
        background: 'radial-gradient(ellipse, rgba(212,168,75,0.06) 0%, transparent 70%)',
        filter: 'blur(90px)',
        opacity: scale,
      }} />
    </div>
  )
}
