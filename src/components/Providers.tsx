'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import type { Profile, Budget, Subscription } from '@/types'

export default function Providers({ children }: { children: React.ReactNode }) {
  const { setUserId, setProfile, setBudget, setSubscription, setNovaInsights, reset } = useAppStore()
  const supabase = createClient()

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id)
        loadUserData(session.user.id)
      }
    })

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserId(session.user.id)
        if (event === 'SIGNED_IN') {
          loadUserData(session.user.id)
        }
      } else if (event === 'SIGNED_OUT') {
        reset()
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadUserData(userId: string) {
    // Load profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profile) setProfile(profile as Profile)

    // Load budget
    const { data: budget } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (budget) setBudget(budget as Budget)

    // Load subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (sub) setSubscription(sub as Subscription)

    // Load Nova proactive insights
    const { data: insights } = await supabase
      .from('nova_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('dismissed', false)
      .limit(5)
    if (insights) setNovaInsights(insights)
  }

  return <>{children}</>
}
