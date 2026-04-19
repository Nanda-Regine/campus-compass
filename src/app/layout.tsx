import type { Metadata, Viewport } from 'next'
import { Sora, DM_Sans, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from 'react-hot-toast'
import Script from 'next/script'
import Providers from '@/components/Providers'
import PWARegister from '@/components/PWARegister'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { GlobalFAB } from '@/components/layout/GlobalFAB'
import OnboardingTooltip from '@/components/OnboardingTooltip'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import ConsentBanner from '@/components/ConsentBanner'
import './globals.css'

const soraFont = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '600', '700'],
  display: 'swap',
})

const dmSansFont = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500'],
  display: 'swap',
})

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
  display: 'swap',
})

const APP_URL = 'https://varsityos.co.za'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'VarsityOS — Student Super-App for South African University Students',
    template: '%s | VarsityOS',
  },
  description:
    'VarsityOS is the free super-app built for South African university students. Track NSFAS allowances, manage your student budget, plan meals on R33/day, organise assignments and exams, and get AI mental health support from Nova — all in one place.',
  keywords: [
    // Brand
    'VarsityOS', 'Varsity OS', 'varsityos.co.za', 'VarsityOS app',
    // NSFAS — highest-traffic SA student keyword
    'NSFAS tracker', 'NSFAS allowance tracker', 'NSFAS app South Africa',
    'NSFAS payment tracker', 'NSFAS budget app', 'NSFAS 2025 2026',
    'NSFAS N+ rule', 'NSFAS student financial aid', 'track NSFAS money',
    'NSFAS monthly allowance tracker', 'NSFAS appeal app',
    // Student budget
    'student budget app South Africa', 'university student budget',
    'student budget tracker South Africa', 'budget app for students',
    'free budget app students', 'student money management South Africa',
    'varsity budget tracker', 'how to budget as a student South Africa',
    // Study planner — high search volume
    'study planner South Africa', 'exam planner university',
    'student planner app', 'university timetable app',
    'assignment tracker app', 'exam countdown app',
    'student organiser app', 'free study planner app',
    'university assignment planner', 'study schedule app South Africa',
    'varsity study planner', 'student timetable app South Africa',
    // Tutor / academic help
    'student tutor app South Africa', 'AI tutor South Africa',
    'online tutor SA students', 'study help app university',
    'academic help app South Africa', 'AI study assistant South Africa',
    'AI student app South Africa', 'AI homework helper South Africa',
    // Nova AI mental health
    'Nova AI student', 'AI mental health student South Africa',
    'student mental health app South Africa', 'SA student wellness app',
    'student mental health support free', 'therapy app students South Africa',
    'student counselling app', 'CBT app students South Africa',
    'student anxiety app', 'imposter syndrome university South Africa',
    // Meals
    'student meal planner South Africa', 'cheap student meals South Africa',
    'student recipes South Africa', 'budget meals varsity',
    'AI recipe generator students', 'meals under R50 South Africa',
    // University-specific
    'UCT student app', 'Wits student app', 'UP student app',
    'UKZN student app', 'UJ student app', 'UWC student app',
    'Stellenbosch student app', 'UNISA student app',
    'DUT student app', 'CPUT student app', 'TUT student app',
    'NMU student app', 'Rhodes student app', 'UFH student app',
    'WSU student app', 'South African university app',
    'varsity super app', 'SA university student tool',
    // Problem-specific SA searches
    'first gen student support South Africa', 'load shedding study plan',
    'student financial aid South Africa', 'bursary tracker South Africa',
    'student savings app South Africa', 'savings goals app students',
    'part time job tracker students', 'student work shift tracker',
    'group assignment manager South Africa', 'student collaboration app',
    // PWA / offline
    'offline student app South Africa', 'student app without data',
    'student app works offline', 'PWA student app South Africa',
    'student app no wifi', 'student app load shedding',
    // Long-tail
    'free student app South Africa', 'best app for SA students',
    'varsity life organiser', 'student mental health South Africa free',
    'how to manage money as a student South Africa',
    'student productivity app South Africa', 'varsity student helper app',
    'first year university app South Africa', 'campus life app South Africa',
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
      { url: '/favicon.jpg', type: 'image/jpeg', sizes: '192x192' },
      { url: '/favicon.jpg', type: 'image/jpeg', sizes: '48x48' },
      { url: '/favicon.jpg', type: 'image/jpeg', sizes: '32x32' },
    ],
    apple: { url: '/favicon.jpg', sizes: '180x180', type: 'image/jpeg' },
    shortcut: { url: '/favicon.jpg', type: 'image/jpeg' },
  },
  alternates: {
    canonical: APP_URL,
    languages: {
      'en-ZA': APP_URL,
    },
  },
  verification: {
    google: 'Dj4sB80xhNyZtXa2m8EPBKcl4TKlBTfyj9lpHsjIEs4',
    other: {
      'msvalidate.01': ['25B3BED7B31C2C85D996EBA7003A02CB'],
    },
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
  maximumScale: 5,
  userScalable: true,
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

        <link rel="icon" href="/favicon.jpg" type="image/jpeg" sizes="32x32" />
        <link rel="icon" href="/favicon.jpg" type="image/jpeg" sizes="48x48" />
        <link rel="icon" href="/favicon.jpg" type="image/jpeg" sizes="192x192" />
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

        {/* ── Schema.org JSON-LD ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'VarsityOS',
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Web, iOS, Android',
              description:
                'VarsityOS is the free super-app built for South African university students. Track NSFAS allowances, manage your student budget, plan meals on R33/day, organise assignments and exams, and get AI mental health support from Nova.',
              url: APP_URL,
              author: {
                '@type': 'Person',
                name: 'Nandawula Regine Kabali-Kagwa',
                url: 'https://creativelynanda.co.za',
              },
              publisher: {
                '@type': 'Organization',
                name: 'Mirembe Muse (Pty) Ltd',
              },
              offers: [
                {
                  '@type': 'Offer',
                  name: 'Free',
                  price: '0',
                  priceCurrency: 'ZAR',
                  description: '15 Nova messages/month, full Study Planner, Budget & NSFAS tracker, Flexible Wallet, Savings Goals, Meal Prep, Work tracker — no credit card required. Works offline.',
                },
                {
                  '@type': 'Offer',
                  name: 'Scholar',
                  price: '39',
                  priceCurrency: 'ZAR',
                  billingDuration: 'P1M',
                  description: '100 Nova messages/month, AI Recipe Generator, AI Budget Coach, AI Study Plans, priority support',
                },
                {
                  '@type': 'Offer',
                  name: 'Premium',
                  price: '79',
                  priceCurrency: 'ZAR',
                  billingDuration: 'P1M',
                  description: '250 Nova messages/month, CSV export, early access to new features',
                },
                {
                  '@type': 'Offer',
                  name: 'Nova Unlimited',
                  price: '129',
                  priceCurrency: 'ZAR',
                  billingDuration: 'P1M',
                  description: 'Unlimited Nova messages, first access to new Nova capabilities, direct feedback channel',
                },
              ],
              inLanguage: 'en-ZA',
              countriesSupported: 'ZA',
            }),
          }}
        />

        {/* ── Google Tag Manager (head) ── */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <Script id="gtm-head" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');`}
          </Script>
        )}

        {/* ── Hotjar ── */}
        {process.env.NEXT_PUBLIC_HOTJAR_ID && (
          <Script id="hotjar" strategy="afterInteractive">
            {`(function(h,o,t,j,a,r){
h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
h._hjSettings={hjid:${process.env.NEXT_PUBLIC_HOTJAR_ID},hjsv:6};
a=o.getElementsByTagName('head')[0];
r=o.createElement('script');r.async=1;
r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
a.appendChild(r);
})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`}
          </Script>
        )}

        {/* ── Crisp Live Chat ── */}
        {process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID && (
          <Script id="crisp-widget" strategy="afterInteractive">
            {`window.$crisp=[];window.CRISP_WEBSITE_ID="${process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID}";(function(){var d=document;var s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`}
          </Script>
        )}
      </head>
      <body className={`${soraFont.variable} ${dmSansFont.variable} ${monoFont.variable} antialiased`}>
        {/* ── Google Tag Manager (noscript fallback) ── */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <Providers>
          <Sidebar />
          <OfflineBanner />
          <ConsentBanner />
          {/* lg: offset for sidebar; mobile: bottom-nav padding */}
          <div className="lg:ml-[240px] pb-[60px] lg:pb-0">
            {children}
          </div>
          <GlobalFAB />
          <OnboardingTooltip />
          <BottomNav />
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
