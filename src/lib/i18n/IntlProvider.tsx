'use client'

import { NextIntlClientProvider } from 'next-intl'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/store'

import en from '../../../messages/en.json'
import zu from '../../../messages/zu.json'
import af from '../../../messages/af.json'

const MESSAGES = { en, zu, af } as const
export type AppLocale = keyof typeof MESSAGES

const LOCALE_KEY = 'varsityos-locale'

export function getStoredLocale(): AppLocale {
  if (typeof window === 'undefined') return 'en'
  return (localStorage.getItem(LOCALE_KEY) as AppLocale) ?? 'en'
}

export function setStoredLocale(locale: AppLocale) {
  if (typeof window !== 'undefined') localStorage.setItem(LOCALE_KEY, locale)
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
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      {children}
    </NextIntlClientProvider>
  )
}
