import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import TopBar from '@/components/layout/TopBar'
import WorkClient from '@/components/work/WorkClient'
import { AmbientImage } from '@/components/ui/AmbientImage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Work & Earnings',
  description:
    'Track part-time jobs, shifts and student earnings alongside your NSFAS allowance on VarsityOS.',
}

export default async function WorkPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      <AmbientImage zone="career" opacity={0.46} blurPx={6} saturation={1.4} overlayColor="linear-gradient(180deg,rgba(5,4,12,0.4) 0%,rgba(5,4,12,0.5) 100%)" />
      <TopBar title="Work" />
      <div className="px-4 py-3 max-w-2xl mx-auto">
        <WorkClient userId={user.id} />
      </div>
    </div>
  )
}
