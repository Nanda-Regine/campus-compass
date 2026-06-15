import { createServerSupabaseClient } from '@/lib/supabase/server'
import SexualHealthHub from '@/components/health/SexualHealthHub'

export const metadata = { title: 'Sexual & Reproductive Health — VarsityOS' }

export default async function SexualHealthPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return <SexualHealthHub userId={user?.id ?? null} />
}
