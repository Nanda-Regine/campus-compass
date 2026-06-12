import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import CareerClient from '@/components/career/CareerClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Career OS' }

export default async function CareerPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: modules }] = await Promise.all([
    supabase.from('profiles').select('full_name,university,year_of_study,faculty,funding_type').eq('id', user.id).single(),
    supabase.from('modules').select('id,module_name,color').eq('user_id', user.id),
  ])

  return (
    <CareerClient
      userId={user.id}
      profile={{
        name: profile?.full_name ?? '',
        university: profile?.university ?? '',
        yearOfStudy: profile?.year_of_study ?? '',
        faculty: profile?.faculty ?? '',
        fundingType: profile?.funding_type ?? '',
      }}
      modules={modules ?? []}
    />
  )
}
