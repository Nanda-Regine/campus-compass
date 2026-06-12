import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudyGroupOS from '@/components/community/StudyGroupOS'

export const metadata = { title: 'Study Groups — VarsityOS' }

export default async function StudyGroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('ambient_image_url,university').eq('id', user.id).single()
  const ambientImage = profile?.ambient_image_url ?? null
  const university = profile?.university ?? undefined

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      {ambientImage && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <img src={ambientImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.38 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.75) 100%)' }} />
        </div>
      )}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px' }}>
        <StudyGroupOS userId={user.id} university={university} />
      </div>
    </div>
  )
}
