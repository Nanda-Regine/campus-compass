import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminFeedClient from './AdminFeedClient'

export const metadata = { title: 'Feed Moderation — VarsityOS Admin' }

async function getAdminData() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const { data: reports } = await supabase
    .from('post_reports')
    .select(`
      id, reason, details, resolved, created_at,
      campus_posts!inner(id, content, category, institution, created_at,
        profiles!campus_posts_user_id_fkey(name, emoji)
      ),
      reporter:profiles!post_reports_reporter_id_fkey(name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return reports ?? []
}

export default async function AdminFeedPage() {
  const reports = await getAdminData()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <AdminFeedClient reports={reports as any} />
}
