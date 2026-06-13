import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PhilosophyFeed from '@/components/growth/PhilosophyFeed'
import HabitBuilder from '@/components/habits/HabitBuilder'
import GoalArchitecture from '@/components/growth/GoalArchitecture'
import { AmbientImage } from '@/components/ui/AmbientImage'

export default async function GrowthPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      <AmbientImage zone="habits" opacity={0.35} blurPx={18} saturation={1.2} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <GoalArchitecture />
        <PhilosophyFeed />
        <HabitBuilder />
      </div>
    </div>
  )
}
