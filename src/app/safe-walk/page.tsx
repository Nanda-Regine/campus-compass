import SafeWalk from '@/components/safety/SafeWalk'
import GBVResponseGuide from '@/components/safety/GBVResponseGuide'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata = { title: 'Safe Walk — VarsityOS' }

export default async function SafeWalkPage() {
  let userId: string | null = null
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? null
  } catch {
    userId = null
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0f', paddingBottom: '80px' }}>
      <div style={{ padding: '24px 16px 8px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#e5e7eb' }}>Safety</h1>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>Campus safety tools, always available offline</p>
      </div>
      <SafeWalk userId={userId} />
      <div style={{ padding: '0 16px', marginTop: '16px' }}>
        <GBVResponseGuide />
      </div>
    </main>
  )
}
