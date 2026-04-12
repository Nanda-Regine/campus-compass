import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import MealsClient from '@/components/meals/MealsClient'

export const metadata: Metadata = { title: 'Meal Prep' }

export default async function MealsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  const weekStartStr = weekStart.toISOString().split('T')[0]

  const [
    { data: mealPlans },
    { data: groceryItems },
    { data: profile },
    { data: budget },
  ] = await Promise.all([
    supabase.from('meal_plans').select('*').eq('user_id', user.id).eq('week_start', weekStartStr),
    supabase.from('grocery_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('profiles').select('dietary_pref, living_situation, is_premium, subscription_tier').eq('id', user.id).single(),
    supabase.from('budgets').select('food_budget').eq('user_id', user.id).maybeSingle(),
  ])

  const isPremium = profile?.is_premium || profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'scholar'

  return (
    <MealsClient
      initialData={{
        mealPlans: mealPlans || [],
        groceryItems: groceryItems || [],
        profile: profile!,
        foodBudget: budget?.food_budget || 0,
        isPremium,
        userId: user.id,
        weekStart: weekStartStr,
      }}
    />
  )
}
