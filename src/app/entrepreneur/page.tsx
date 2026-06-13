import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EntrepreneurOS from '@/components/entrepreneur/EntrepreneurOS'
import { AmbientImage } from '@/components/ui/AmbientImage'

export default async function EntrepreneurPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      <AmbientImage zone="entrepreneurship" opacity={0.35} blurPx={18} saturation={1.2} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px' }}>
        <EntrepreneurOS />
      </div>
    </div>
  )
}
