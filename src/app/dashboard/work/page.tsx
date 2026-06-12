import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import TopBar from '@/components/layout/TopBar'
import WorkClient from '@/components/work/WorkClient'
import { AmbientImage } from '@/components/ui/AmbientImage'

export default async function WorkPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      <AmbientImage zone="career" opacity={0.38} blurPx={5} saturation={1.2} overlayColor="transparent" />
      <TopBar title="Work" />
      <div className="px-4 py-3 max-w-2xl mx-auto">
        <WorkClient userId={user.id} />
      </div>
    </div>
  )
}
