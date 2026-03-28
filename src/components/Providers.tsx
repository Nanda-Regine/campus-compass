'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import type { Profile, Budget, Subscription } from '@/types'

// Initialise PostHog once (client-side only)
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: false, // we fire manually on route change below
    capture_pageleave: true,
    persistence: 'localStorage',
    autocapture: true,
  })
}

function PostHogPageView() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname && process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
      posthog.capture('$pageview', { $current_url: window.location.href })
    }
  }, [pathname])

  return null
}

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
        posthog.reset()
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

    if (profile) {
      setProfile(profile as Profile)

      // Identify user in PostHog
      if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
        const p = profile as Profile
        posthog.identify(userId, {
          tier: p.subscription_tier || (p.is_premium ? 'premium' : 'free'),
          university: p.university,
          year: p.year_of_study,
          funding_type: p.funding_type,
        })
      }
    }

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

  return (
    <PostHogProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PostHogProvider>
  )
}
