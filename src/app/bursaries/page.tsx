import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BursaryClient from '@/components/bursaries/BursaryClient'

export const metadata = {
  title: 'Bursaries & Scholarships | VarsityOS',
  description: 'Find SA bursaries, scholarships, and funding opportunities. Get personalized application plans from Nova.',
}

export default async function BursariesPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return <BursaryClient />
}
