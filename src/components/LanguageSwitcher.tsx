'use client'

import { useTranslations } from 'next-intl'
import { setStoredLocale, type AppLocale } from '@/lib/i18n/IntlProvider'
import toast from 'react-hot-toast'

const LANGUAGES: { code: AppLocale; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English',  nativeLabel: 'English'   },
  { code: 'zu', label: 'isiZulu',  nativeLabel: 'isiZulu'   },
  { code: 'af', label: 'Afrikaans',nativeLabel: 'Afrikaans' },
]

interface Props {
  currentLocale: AppLocale
  onChange: (locale: AppLocale) => void
}

export default function LanguageSwitcher({ currentLocale, onChange }: Props) {
  function handleChange(locale: AppLocale) {
    setStoredLocale(locale)
    onChange(locale)
    // Save to profile (best effort — no blocking)
    fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferred_language: locale }),
    }).catch(() => {})
    const label = LANGUAGES.find(l => l.code === locale)?.nativeLabel ?? locale
    toast.success(`Language changed to ${label}`)
    // Reload to apply new locale to all server-rendered strings
    setTimeout(() => window.location.reload(), 600)
  }

  return (
    <div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.58)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        Language / Ulimi / Taal
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            style={{
              flex: 1, padding: '9px 8px', borderRadius: 10,
              border: '0.5px solid',
              borderColor: currentLocale === lang.code ? '#4ecf9e' : 'rgba(255,255,255,0.1)',
              background: currentLocale === lang.code ? 'rgba(78,207,158,0.12)' : 'rgba(255,255,255,0.07)',
              color: currentLocale === lang.code ? '#4ecf9e' : 'rgba(255,255,255,0.55)',
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem',
              fontWeight: currentLocale === lang.code ? 700 : 400,
              cursor: 'pointer', textAlign: 'center',
            }}
          >
            {lang.nativeLabel}
          </button>
        ))}
      </div>
    </div>
  )
}
