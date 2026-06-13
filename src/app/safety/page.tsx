import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import SafetyOS from '@/components/safety/SafetyOS'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata = { title: 'Safety OS | VarsityOS' }

export default async function SafetyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/setup')

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)', position: 'relative' }}>
      <AmbientImage zone="safety" opacity={0.35} blurPx={18} saturation={1.2} />
      <TopBar title="Safety OS" />
      <div style={{ padding: '16px 16px 100px', maxWidth: 600, margin: '0 auto' }}>
        <SafetyOS />
      </div>
    </div>
  )
}
