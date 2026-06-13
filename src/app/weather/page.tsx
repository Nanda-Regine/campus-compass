import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import WeatherClient from '@/components/weather/WeatherClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Weather & Campus Conditions' }

export default async function WeatherPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return <WeatherClient />
}
