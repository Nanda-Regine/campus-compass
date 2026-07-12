import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EntrepreneurOS from '@/components/entrepreneur/EntrepreneurOS'
import { AmbientImage } from '@/components/ui/AmbientImage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hustle OS — Student Entrepreneur Toolkit',
  description:
    'Start and grow a student side-hustle in South Africa — ideas, pricing, invoicing and business tools built for varsity founders.',
}

export default async function EntrepreneurPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      <AmbientImage zone="entrepreneurship" opacity={0.42} blurPx={8} saturation={1.2} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px' }}>
        <EntrepreneurOS />
      </div>
    </div>
  )
}
