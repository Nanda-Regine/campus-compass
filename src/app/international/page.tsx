import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import InternationalStudentHub from '@/components/international/InternationalStudentHub'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata: Metadata = {
  title: 'International Student Hub — VarsityOS',
  description: 'Study permits, funding alternatives, banking, healthcare, and key contacts for international students in South Africa.',
}

export default async function InternationalPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'system-ui, sans-serif', position: 'relative', overflowX: 'hidden' }}>
      <AmbientImage zone="movement" opacity={0.32} blurPx={2} saturation={1.4} />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 80px' }}>
        <InternationalStudentHub />
      </div>
    </div>
  )
}
