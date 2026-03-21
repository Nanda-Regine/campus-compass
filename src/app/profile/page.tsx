import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ProfileClient from '@/components/profile/ProfileClient'

export const metadata: Metadata = {
  title: 'My Profile',
  robots: { index: false },
}

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return <ProfileClient />
}
