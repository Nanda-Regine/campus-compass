import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import BudgetClient from '@/components/budget/BudgetClient'
import { currentMonthRange } from '@/lib/utils'

export const metadata: Metadata = { title: 'Budget & NSFAS' }

export default async function BudgetPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { start, end } = currentMonthRange()

  const [
    { data: budget },
    { data: expenses },
    { data: profile },
    { data: subscription },
  ] = await Promise.all([
    supabase.from('budgets').select('*').eq('user_id', user.id).single(),
    supabase.from('expenses').select('*').eq('user_id', user.id).gte('expense_date', start).lte('expense_date', end).order('expense_date', { ascending: false }),
    supabase.from('profiles').select('name, funding_type, university, year_of_study, is_premium').eq('id', user.id).single(),
    supabase.from('subscriptions').select('plan').eq('user_id', user.id).single(),
  ])

  const isPremium = profile?.is_premium || subscription?.plan === 'premium'

  return (
    <BudgetClient
      initialData={{
        budget: budget ?? null,
        expenses: expenses || [],
        profile: profile!,
        isPremium,
        userId: user.id,
      }}
    />
  )
}
