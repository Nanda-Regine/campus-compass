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

    // Load budget (maybeSingle — new users won't have a row yet)
    const { data: budget } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (budget) setBudget(budget as Budget)

    // Derive subscription from profile (no separate subscriptions table)
    if (profile) {
      const p = profile as Profile
      const tier = p.subscription_tier || (p.is_premium ? 'premium' : 'free')
      const derivedSub: Subscription = {
        id: p.id,
        user_id: p.id,
        payfast_payment_id: null,
        payfast_subscription_token: null,
        plan: tier as Subscription['plan'],
        status: 'active',
        amount: null,
        billing_date: null,
        next_billing_date: null,
        cancelled_at: null,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setSubscription(derivedSub)
    }

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
