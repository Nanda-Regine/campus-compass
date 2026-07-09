'use client'

import { NextIntlClientProvider } from 'next-intl'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/store'

import en from '../../../messages/en.json'
import zu from '../../../messages/zu.json'
import af from '../../../messages/af.json'
import xh from '../../../messages/xh.json'
import st from '../../../messages/st.json'
import tn from '../../../messages/tn.json'
import nso from '../../../messages/nso.json'
import ts from '../../../messages/ts.json'
import ss from '../../../messages/ss.json'
import ve from '../../../messages/ve.json'
import nr from '../../../messages/nr.json'

const MESSAGES = { en, zu, af, xh, st, tn, nso, ts, ss, ve, nr } as const
export type AppLocale = keyof typeof MESSAGES

const LOCALE_KEY = 'varsityos-locale'
const SUPPORTED = ['en', 'zu', 'xh', 'af', 'st', 'tn', 'nso', 'ts', 'ss', 've', 'nr'] as const satisfies readonly AppLocale[]

export function getStoredLocale(): AppLocale {
  if (typeof window === 'undefined') return 'en'
  try {
    const stored = localStorage.getItem(LOCALE_KEY)
    return stored && (SUPPORTED as readonly string[]).includes(stored) ? (stored as AppLocale) : 'en'
  } catch { return 'en' }
}

export function setStoredLocale(locale: AppLocale) {
  if (typeof window !== 'undefined') try { localStorage.setItem(LOCALE_KEY, locale) } catch { /* quota */ }
}

export function IntlProvider({ children }: { children: React.ReactNode }) {
  const profile = useAppStore(s => s.profile) as { preferred_language?: string } | null
  const [locale, setLocale] = useState<AppLocale>('en')

  useEffect(() => {
    // Profile language takes priority, fallback to localStorage
    const profileLang = profile?.preferred_language
    if (profileLang && profileLang in MESSAGES) {
      const l = profileLang as AppLocale
      setLocale(l)
      setStoredLocale(l)
    } else {
      setLocale(getStoredLocale())
    }
  }, [profile?.preferred_language])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
      // App is South-Africa only. A fixed timeZone keeps next-intl date/number
      // formatting identical on the server (UTC) and client (SAST), avoiding the
      // ENVIRONMENT_FALLBACK warning and any markup mismatch on hydration.
      timeZone="Africa/Johannesburg"
      // Never let a missing translation / env fallback bubble up and crash a page.
      onError={() => {}}
    >
      {children}
    </NextIntlClientProvider>
  )
}
