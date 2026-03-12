import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from 'react-hot-toast'
import Providers from '@/components/Providers'
import PWARegister from '@/components/PWARegister'
import './globals.css'

const displayFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '700', '800'],
  display: 'swap',
})

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300', '400', '500'],
  display: 'swap',
})

const APP_URL = 'https://varsityos.co.za'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || APP_URL),
  title: {
    default: 'VarsityOS — Student Super-App for South African University Students',
    template: '%s | VarsityOS',
  },
  description:
    'VarsityOS is the free super-app built for South African university students. Track NSFAS allowances, manage your student budget, plan meals on R33/day, organise assignments and exams, and get AI mental health support from Nova — all in one place.',
  keywords: [
    // Brand
    'VarsityOS', 'Varsity OS', 'varsityos.co.za',
    // Core features
    'NSFAS tracker', 'NSFAS allowance tracker', 'NSFAS app South Africa',
    'student budget app South Africa', 'university student budget',
    'study planner South Africa', 'exam planner university',
    'student meal planner South Africa', 'cheap student meals South Africa',
    // Nova AI
    'Nova AI student', 'AI mental health student South Africa',
    'student mental health app South Africa', 'SA student wellness app',
    // University-specific
    'UCT student app', 'Wits student app', 'UP student app',
    'UKZN student app', 'UJ student app', 'UWC student app',
    'South African university app', 'varsity super app',
    // Problem-specific
    'NSFAS payment tracker', 'student budget tracker South Africa',
    'imposter syndrome university', 'first gen student support',
    'load shedding study plan', 'student financial aid South Africa',
    // Long-tail
    'free student app South Africa', 'university student organiser',
    'best app for SA students', 'varsity life organiser',
    'student mental health South Africa free',
  ],
  authors: [{ name: 'Nanda Regine', url: 'https://creativelynanda.co.za' }],
  creator: 'Nanda Regine — Mirembe Muse (Pty) Ltd',
  publisher: 'Mirembe Muse (Pty) Ltd',
  category: 'Education',
  classification: 'Student Productivity App',
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: APP_URL,
    siteName: 'VarsityOS',
    title: 'VarsityOS — The Super-App for South African University Students',
    description:
      'Track NSFAS, manage your student budget, plan meals on R33/day, stay on top of assignments and exams, and get AI mental health support from Nova. Free for all SA students.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VarsityOS — The super-app for South African university students',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VarsityOS — The Super-App for South African University Students',
    description:
      'Free app for SA students: NSFAS tracker, budget manager, study planner, meal prep, and Nova AI mental health companion. Built for varsity life.',
    images: ['/images/og-image.png'],
    creator: '@varsityos',
    site: '@varsityos',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.jpg', type: 'image/jpeg' },
    ],
    apple: '/favicon.jpg',
    shortcut: '/favicon.jpg',
  },
  alternates: {
    canonical: APP_URL,
    languages: {
      'en-ZA': APP_URL,
    },
  },
  verification: {
    google: '', // Add Google Search Console verification token here
  },
  other: {
    'geo.region': 'ZA',
    'geo.country': 'South Africa',
    'DC.language': 'en-ZA',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0d9488' },
    { media: '(prefers-color-scheme: dark)', color: '#080f0e' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" suppressHydrationWarning>
      <head>
        <link rel="canonical" href={APP_URL} />
        <meta name="geo.region" content="ZA" />
        <meta name="geo.placename" content="South Africa" />
        <meta name="ICBM" content="-29.0, 26.0" />
        <meta name="language" content="English" />
        <meta name="target" content="all" />
        <meta name="HandheldFriendly" content="True" />
        <meta name="MobileOptimized" content="320" />
        <meta property="og:locale:alternate" content="af_ZA" />
        <meta property="og:locale:alternate" content="zu_ZA" />
        <meta property="og:locale:alternate" content="xh_ZA" />
      </head>
      <body className={`${displayFont.variable} ${monoFont.variable} font-body antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="bottom-center"
          gutter={12}
          containerStyle={{ bottom: 88 }}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#111a18',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '100px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              padding: '10px 20px',
            },
            success: {
              iconTheme: { primary: '#0d9488', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
        <PWARegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
