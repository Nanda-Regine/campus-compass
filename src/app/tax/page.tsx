import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TaxReturnHelper from '@/components/finance/TaxReturnHelper'
import { AmbientImage } from '@/components/ui/AmbientImage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tax Helper',
  description:
    'Understand SARS tax as a student earner — returns, refunds and deadlines made simple.',
}

export default async function TaxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      <AmbientImage zone="budget" opacity={0.42} blurPx={8} saturation={1.2} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px' }}>
        <TaxReturnHelper />
      </div>
    </div>
  )
}
