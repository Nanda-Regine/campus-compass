function Skel({ w, h, radius }: { w?: string; h?: number; radius?: string }) {
  return (
    <div
      className="skeleton"
      style={{ width: w ?? '100%', height: h ?? 16, borderRadius: radius ?? 'var(--radius-md)' }}
    />
  )
}

export default function Loading() {
  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-base)', padding: '0 0 96px' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '0.5px solid var(--border-subtle)' }}>
        <Skel w="160px" h={28} />
        <div style={{ marginTop: 8 }}>
          <Skel w="220px" h={14} />
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Two-column layout skeleton */}
        <div className="lg:flex lg:gap-5">
          {/* Left column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Hero stats card */}
            <div className="card-base" style={{ padding: 16 }}>
              <Skel w="120px" h={14} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skel w="70%" h={11} />
                    <Skel w="50%" h={24} />
                  </div>
                ))}
              </div>
            </div>

            {/* Feature grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className="card-base" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Skel w="32px" h={32} radius="var(--radius-sm)" />
                    <Skel w="80px" h={14} />
                  </div>
                  <Skel h={11} />
                </div>
              ))}
            </div>

            {/* Urgent tasks strip */}
            <div className="card-base" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skel w="100px" h={12} />
              {[0,1,2].map(i => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Skel w="4px" h={36} radius="2px" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <Skel h={13} />
                    <Skel w="60%" h={11} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — desktop only */}
          <div className="hidden lg:flex flex-col gap-4" style={{ width: 320 }}>
            {/* Nova card */}
            <div className="card-base" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Skel w="44px" h={44} radius="50%" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skel w="80px" h={16} />
                  <Skel w="120px" h={12} />
                </div>
              </div>
              <Skel h={13} />
              <Skel w="70%" h={13} />
              <Skel h={38} radius="var(--radius-md)" />
            </div>

            {/* Exam countdown */}
            <div className="card-base" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skel w="130px" h={14} />
              <Skel h={48} />
            </div>

            {/* Budget preview */}
            <div className="card-base" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skel w="100px" h={14} />
              <Skel h={8} radius="4px" />
              <div style={{ display: 'flex', gap: 8 }}>
                {[0,1,2].map(i => <Skel key={i} w="80px" h={26} radius="var(--radius-pill)" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
