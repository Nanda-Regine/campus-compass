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

  const { data: profile } = await supabase
    .from('profiles')
    .select('ambient_image_url, university')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)', position: 'relative' }}>
      {profile?.ambient_image_url && (
        <AmbientImage src={profile.ambient_image_url} opacity={0.20} />
      )}
      <TopBar title="Safety OS" />
      <div style={{ padding: '16px 16px 100px', maxWidth: 600, margin: '0 auto' }}>
        <SafetyOS />
      </div>
    </div>
  )
}
