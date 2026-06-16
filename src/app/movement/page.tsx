import { redirect } from 'next/navigation'
import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'
import MovementOS from '@/components/movement/MovementOS'

export const metadata = { title: 'Movement OS — VarsityOS' }

export default async function MovementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/movement')

  const { data: savedRoutes } = await supabase
    .from('saved_routes')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  return <MovementOS initialRoutes={savedRoutes ?? []} userId={user.id} />
}
