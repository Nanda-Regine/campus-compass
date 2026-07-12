import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SkillsAcademyClient from '@/components/skills/SkillsAcademyClient'
import { AmbientImage } from '@/components/ui/AmbientImage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Skills Academy',
  description:
    'Build in-demand skills with free micro-courses — coding, design, finance and more, made for South African students.',
}

export default async function SkillsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      <AmbientImage zone="study" opacity={0.42} blurPx={8} saturation={1.2} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px' }}>
        <SkillsAcademyClient />
      </div>
    </div>
  )
}
