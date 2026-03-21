import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'VarsityOS — The super-app for South African university students'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0b0907 0%, #0e1714 50%, #120906 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Warm glow top-left */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(211,107,73,0.18) 0%, transparent 70%)',
          }}
        />
        {/* Teal glow bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            right: '-100px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(13,148,136,0.16) 0%, transparent 70%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0px',
            position: 'relative',
            textAlign: 'center',
            padding: '60px',
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              marginBottom: '28px',
            }}
          >
            🧭
          </div>

          {/* Brand */}
          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: '22px',
              fontWeight: '700',
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            VARSITYOS
          </div>

          {/* Headline */}
          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: '58px',
              fontWeight: '900',
              color: '#ffffff',
              lineHeight: 1.05,
              marginBottom: '24px',
              maxWidth: '900px',
            }}
          >
            Your varsity life,{' '}
            <span style={{ color: '#e07858' }}>finally under control.</span>
          </div>

          {/* Sub */}
          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: '22px',
              color: 'rgba(255,255,255,0.5)',
              maxWidth: '700px',
              lineHeight: 1.5,
              marginBottom: '36px',
            }}
          >
            NSFAS tracking · Budget management · Study planner · Nova AI companion
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Free forever', 'All SA universities', 'Works offline'].map((tag) => (
              <div
                key={tag}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '100px',
                  padding: '8px 20px',
                  fontSize: '16px',
                  color: 'rgba(255,255,255,0.6)',
                  fontFamily: 'monospace',
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
