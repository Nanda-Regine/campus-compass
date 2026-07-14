'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { ThemeProvider } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import { initOrchestration } from '@/store/studentState'
import { initRulesEngine } from '@/lib/rules'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import type { Profile, Budget, Subscription } from '@/types'
import { IntlProvider } from '@/lib/i18n/IntlProvider'

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

function OfflineSyncRunner() {
  useOfflineSync()
  return null
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const { setUserId, setProfile, setBudget, setSubscription, setNovaInsights, reset } = useAppStore()

  useEffect(() => {
    // createClient() must only run in the browser — calling it at component
    // scope executes during SSR prerendering when NEXT_PUBLIC_* env vars
    // may not be available, crashing the build.
    const supabase = createClient()

    async function loadUserData(userId: string) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (profile) {
        setProfile(profile as Profile)

        if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
          const p = profile as Profile
          posthog.identify(userId, {
            tier: p.subscription_tier || (p.is_premium ? 'scholar' : 'free'),
            university: p.university,
            year: p.year_of_study,
            funding_type: p.funding_type,
          })
        }
      }

      const { data: budget } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (budget) setBudget(budget as Budget)

      if (profile) {
        const p = profile as Profile
        const tier = p.subscription_tier || (p.is_premium ? 'scholar' : 'free')
        const derivedSub: Subscription = {
          id: p.id,
          user_id: p.id,
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

      const { data: insights } = await supabase
        .from('nova_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('dismissed', false)
        .limit(5)
      if (insights) setNovaInsights(insights)
    }

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

  // Boot orchestration layer — runs once after auth hydrates
  useEffect(() => {
    const unsubOrch  = initOrchestration()
    const unsubRules = initRulesEngine()
    return () => { unsubOrch(); unsubRules() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Dark is the default, but the theme is user-switchable again (Dark / Sunrise /
  // Outdoor). Outdoor is a high-contrast mode for bright SA sunlight, where a dark
  // UI is physically unreadable. Toggle lives in the Sidebar and Profile.
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="varsityos-theme">
      <PostHogProvider client={posthog}>
        <PostHogPageView />
        <OfflineSyncRunner />
        <IntlProvider>
          {children}
        </IntlProvider>
      </PostHogProvider>
    </ThemeProvider>
  )
}
