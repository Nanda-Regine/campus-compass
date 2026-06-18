import Link from 'next/link'

export default function UpgradeBar() {
  return (
    <div style={{ margin: '16px -24px -20px', padding: '14px 24px', background: 'linear-gradient(90deg,rgba(155,111,212,0.07) 0%,rgba(201,168,76,0.07) 100%)', borderTop: '0.5px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>Unlock unlimited Nova messages</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>from R29/month</span>
      </div>
      <Link href="/upgrade" style={{ textDecoration: 'none' }}>
        <button style={{ background: 'linear-gradient(135deg,#9b6fd4 0%,#c9a84c 100%)', color: '#fff', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 12, border: 'none', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Upgrade →
        </button>
      </Link>
    </div>
  )
}
