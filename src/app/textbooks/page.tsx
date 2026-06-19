import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TextbookMarketplace from '@/components/community/TextbookMarketplace'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata = { title: 'Textbook Marketplace — VarsityOS' }

export default async function TextbooksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('university').eq('id', user.id).single()
  const university = profile?.university ?? undefined

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      <AmbientImage zone="community" opacity={0.42} blurPx={8} saturation={1.2} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px' }}>
        <TextbookMarketplace userId={user.id} university={university} />
      </div>
    </div>
  )
}
