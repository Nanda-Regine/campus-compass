import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import LMSConnector from '@/components/integrations/LMSConnector'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata: Metadata = {
  title: 'LMS Integrations — VarsityOS',
  description: 'Connect your Moodle or Canvas LMS to sync assignments automatically.',
}

export default async function LMSPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'system-ui, sans-serif', position: 'relative', overflowX: 'hidden' }}>
      <AmbientImage zone="schedule" opacity={0.60} blurPx={2} saturation={1.4} overlayColor="transparent" />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 80px' }}>
        <LMSConnector />
      </div>
    </div>
  )
}
