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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://campuscompass.co.za'),
  title: {
    default: 'Campus Compass — Your Varsity Life, Fully Organised',
    template: '%s | Campus Compass',
  },
  description:
    'The go-to super-app for South African university students. Manage NSFAS, track your budget, plan meals, organise assignments, and get AI mental health support — all in one place.',
  keywords: [
    'Campus Compass', 'South African students', 'NSFAS', 'university app',
    'student budget', 'study planner', 'mental health', 'varsity', 'SA students',
    'student app South Africa', 'NSFAS tracker', 'exam planner',
  ],
  authors: [{ name: 'Nanda Regine', url: 'https://creativelynanda.co.za' }],
  creator: 'Nanda Regine — Mirembe Muse (Pty) Ltd',
  publisher: 'Mirembe Muse (Pty) Ltd',
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://campuscompass.co.za',
    siteName: 'Campus Compass',
    title: 'Campus Compass — Your Varsity Life, Fully Organised',
    description:
      'The go-to super-app for South African university students. NSFAS tracking, budget management, study planner, AI mental health companion.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Campus Compass — Your varsity life, fully organised',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Campus Compass — Your Varsity Life, Fully Organised',
    description: 'The go-to super-app for South African university students.',
    images: ['/images/og-image.png'],
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
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
    shortcut: '/favicon.ico',
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
        <link rel="canonical" href={process.env.NEXT_PUBLIC_APP_URL} />
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
