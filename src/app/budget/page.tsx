import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import BudgetClient from '@/components/budget/BudgetClient'
import { currentMonthRange } from '@/lib/utils'

export const metadata: Metadata = { title: 'Budget & NSFAS' }

export default async function BudgetPage({ searchParams }: { searchParams: { tab?: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { start, end } = currentMonthRange()

  const [
    { data: budget },
    { data: expenses },
    { data: profile },
    { data: incomeEntries },
    { data: workedShifts },
  ] = await Promise.all([
    supabase.from('budgets').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('expenses').select('*').eq('user_id', user.id).gte('expense_date', start).lte('expense_date', end).order('expense_date', { ascending: false }),
    supabase.from('profiles').select('name, funding_type, university, year_of_study, is_premium, subscription_tier').eq('id', user.id).single(),
    supabase.from('income_entries').select('id,source_type,label,amount,received_date,is_recurring').eq('user_id', user.id).gte('received_date', start).order('received_date', { ascending: false }),
    supabase
      .from('work_shifts')
      .select('id,shift_date,start_time,end_time,earnings,duration_hours,job:part_time_jobs(id,employer_name,role_title)')
      .eq('student_id', user.id)
      .eq('status', 'worked')
      .gte('shift_date', start)
      .lte('shift_date', end)
      .order('shift_date', { ascending: false }),
  ])

  const isPremium = profile?.is_premium || ['scholar', 'nova_unlimited'].includes(profile?.subscription_tier ?? '')

  return (
    <BudgetClient
      initialTab={searchParams.tab}
      initialData={{
        budget:        budget        ?? null,
        expenses:      expenses      ?? [],
        profile:       profile!,
        isPremium,
        userId:        user.id,
        incomeEntries: incomeEntries ?? [],
        workedShifts:  workedShifts  ?? [],
      }}
    />
  )
}
