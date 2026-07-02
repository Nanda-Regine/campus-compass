import SafeWalk from '@/components/safety/SafeWalk'
import GBVResponseGuide from '@/components/safety/GBVResponseGuide'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AmbientImage } from '@/components/ui/AmbientImage'

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
    <main style={{ minHeight: '100vh', background: '#ffffff', paddingBottom: '80px', position: 'relative', overflowX: 'hidden' }}>
      <AmbientImage zone="safety" opacity={0.32} blurPx={2} saturation={1.4} />
      <div style={{ padding: '24px 16px 8px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>Safety</h1>
        <p style={{ fontSize: '13px', color: '#4b5563', marginTop: '4px' }}>Campus safety tools, always available offline</p>
      </div>
      <SafeWalk userId={userId} />
      <div style={{ padding: '0 16px', marginTop: '16px' }}>
        <GBVResponseGuide />
      </div>
    </main>
  )
}
