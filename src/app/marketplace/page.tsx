import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import MarketplaceOS from '@/components/marketplace/MarketplaceOS'

export const metadata = { title: 'Marketplace · VarsityOS' }

export default async function MarketplacePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('university')
    .eq('id', user.id)
    .single()

  const university = profile?.university ?? ''

  const [{ data: initialListings }, { data: myListings }] = await Promise.all([
    supabase
      .from('marketplace_listings')
      .select('*')
      .eq('university', university)
      .eq('status', 'active')
      .eq('listing_type', 'sale')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('marketplace_listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <TopBar title="Marketplace" />
      <MarketplaceOS
        userId={user.id}
        initialListings={initialListings ?? []}
        myListings={myListings ?? []}
        university={university}
      />
    </div>
  )
}
