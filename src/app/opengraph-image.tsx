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
          background: '#0b0907',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ── Background glows ─────────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            left: '-200px',
            width: '700px',
            height: '700px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(217,120,84,0.22) 0%, transparent 65%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-200px',
            right: '-100px',
            width: '700px',
            height: '700px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(13,148,136,0.18) 0%, transparent 65%)',
          }}
        />

        {/* ── Left content ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '64px 56px',
            flex: 1,
            position: 'relative',
          }}
        >
          {/* Brand mark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '36px',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '14px',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '3px solid rgba(255,255,255,0.9)',
                }}
              />
            </div>
            <span
              style={{
                fontSize: '22px',
                fontWeight: '800',
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: '3px',
                textTransform: 'uppercase',
              }}
            >
              VarsityOS
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: '60px',
              fontWeight: '900',
              color: '#ffffff',
              lineHeight: 1.05,
              marginBottom: '20px',
            }}
          >
            Your varsity life,
            <br />
            <span style={{ color: '#e07858' }}>finally under control.</span>
          </div>

          {/* Sub */}
          <div
            style={{
              fontSize: '20px',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.5,
              marginBottom: '36px',
              maxWidth: '540px',
            }}
          >
            NSFAS tracking, budget management, study planner, meal prep, and Nova AI — built for SA students.
          </div>

          {/* Tags */}
          <div style={{ display: 'flex' }}>
            {['R0 free forever', 'All SA universities', 'Works offline'].map((tag, i) => (
              <div
                key={tag}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '100px',
                  padding: '8px 18px',
                  fontSize: '15px',
                  color: 'rgba(255,255,255,0.55)',
                  marginRight: i < 2 ? '10px' : '0',
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel — feature cards ──────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '48px 56px 48px 0',
            width: '380px',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: '24px',
              overflow: 'hidden',
            }}
          >
            {[
              { colour: '#0d9488', label: 'Budget & NSFAS', sub: 'R1,840 remaining this month' },
              { colour: '#d97b54', label: 'Study Planner', sub: 'CHEM3 exam in 12 days' },
              { colour: '#d4a847', label: 'Meal Prep', sub: 'Recipes under R50' },
              { colour: '#9b59b6', label: 'Nova AI', sub: 'Your SA student companion' },
            ].map((item, i) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '18px 22px',
                  borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.07)' : undefined,
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: item.colour,
                    marginRight: '16px',
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                    {item.sub}
                  </span>
                </div>
              </div>
            ))}

            {/* Nova chat preview */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '18px 22px',
                background: 'rgba(13,148,136,0.08)',
                borderTop: '1px solid rgba(13,148,136,0.15)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                    marginRight: '8px',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#4db6ac' }}>Nova</span>
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'rgba(178,223,219,0.85)',
                  lineHeight: 1.4,
                  background: 'rgba(13,148,136,0.15)',
                  border: '1px solid rgba(13,148,136,0.2)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                }}
              >
                I get it — NSFAS stress is real. Let&apos;s work through this together.
              </div>
            </div>
          </div>
        </div>

      </div>
    ),
    { ...size },
  )
}
