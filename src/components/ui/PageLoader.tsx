export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 'var(--radius-md)',
          background: 'var(--teal-dim)',
          border: '0.5px solid var(--teal-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="var(--teal)" strokeWidth="1.5" strokeDasharray="4 2" style={{ animation: 'spin 1.2s linear infinite', transformOrigin: '10px 10px' }} />
            <circle cx="10" cy="10" r="3" fill="var(--teal)" />
          </svg>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-tertiary)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          VarsityOS
        </span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
