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
import PageTransition from '@/components/PageTransition'
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
    // ── Brand ──────────────────────────────────────────────────────────────────
    'VarsityOS', 'Varsity OS', 'varsityos.co.za', 'VarsityOS app', 'VarsityOS student app',
    'VarsityOS South Africa', 'VarsityOS free', 'VarsityOS NSFAS',

    // ── NSFAS — highest-traffic SA student keyword ──────────────────────────
    'NSFAS tracker', 'NSFAS allowance tracker', 'NSFAS app South Africa',
    'NSFAS payment tracker', 'NSFAS budget app', 'NSFAS 2025', 'NSFAS 2026',
    'NSFAS N+ rule', 'NSFAS student financial aid', 'track NSFAS money',
    'NSFAS monthly allowance tracker', 'NSFAS appeal app', 'NSFAS appeal 2025',
    'NSFAS appeal 2026', 'NSFAS payment dates 2025', 'NSFAS payment dates 2026',
    'NSFAS online', 'NSFAS status check', 'NSFAS application', 'NSFAS funded student app',
    'NSFAS allowance management', 'NSFAS food allowance tracker', 'NSFAS accommodation allowance',
    'NSFAS transport allowance tracker', 'NSFAS book allowance', 'NSFAS balance checker',
    'how to manage NSFAS money', 'NSFAS budget tips South Africa', 'NSFAS N+2 rule',
    'NSFAS N+1 rule', 'NSFAS Funza Lushaka', 'NSFAS ISFAP', 'NSFAS Ikusasa',

    // ── Student budget ──────────────────────────────────────────────────────
    'student budget app South Africa', 'university student budget',
    'student budget tracker South Africa', 'budget app for students',
    'free budget app students', 'student money management South Africa',
    'varsity budget tracker', 'how to budget as a student South Africa',
    'student spending tracker SA', 'university budget planner',
    'student savings app', 'student wallet app South Africa',
    'student finance app SA', 'money app for South African students',

    // ── Study planner — high search volume ─────────────────────────────────
    'study planner South Africa', 'exam planner university',
    'student planner app', 'university timetable app',
    'assignment tracker app', 'exam countdown app',
    'student organiser app', 'free study planner app',
    'university assignment planner', 'study schedule app South Africa',
    'varsity study planner', 'student timetable app South Africa',
    'exam prep app South Africa', 'study schedule generator',
    'flashcard app South Africa', 'spaced repetition app SA students',
    'exam readiness app', 'grades tracker South Africa',
    'module tracker app', 'academic planner South Africa',

    // ── Peer tutoring — high intent ─────────────────────────────────────────
    'peer tutoring app South Africa', 'find a tutor South Africa',
    'student tutor marketplace South Africa', 'varsity tutor app',
    'university tutor online SA', 'student tutoring platform South Africa',
    'peer tutor near me South Africa', 'affordable tutor South Africa student',
    'online tutoring South Africa free', 'find study partner South Africa',
    'maths tutor South Africa student', 'accounting tutor varsity SA',
    'engineering tutor South Africa', 'law tutor university South Africa',
    'become a tutor South Africa student', 'earn as a tutor varsity',

    // ── Notes marketplace ───────────────────────────────────────────────────
    'student notes sharing South Africa', 'varsity notes download free',
    'university notes marketplace', 'share lecture notes South Africa',
    'study notes South Africa university', 'exam notes download SA',
    'past exam papers South Africa university', 'study guide share South Africa',
    'notes app South African students', 'community notes platform SA',
    'UCT notes', 'Wits notes', 'UP notes', 'Stellenbosch notes', 'UKZN notes',
    'UNISA study notes', 'UJ notes', 'TUT notes', 'CPUT notes', 'DUT notes',

    // ── Bursaries — high intent ─────────────────────────────────────────────
    'bursary finder South Africa', 'bursary app South Africa 2025',
    'bursary app South Africa 2026', 'Funza Lushaka bursary', 'ISFAP bursary',
    'Ikusasa Student Financial Aid Programme', 'DHET bursary', 'Eskom bursary',
    'Sasol bursary', 'Anglo American bursary', 'De Beers bursary',
    'Standard Bank bursary', 'Nedbank bursary', 'Absa bursary', 'FNB bursary',
    'MTN bursary', 'Vodacom bursary', 'Old Mutual bursary', 'Investec bursary',
    'mining bursary South Africa', 'engineering bursary South Africa',
    'medical bursary South Africa', 'law bursary South Africa',
    'teaching bursary South Africa', 'provincial bursary South Africa',
    'bursary deadlines 2025', 'bursary deadlines 2026', 'bursary tracker South Africa',

    // ── Nova AI mental health ───────────────────────────────────────────────
    'Nova AI student', 'AI mental health student South Africa',
    'student mental health app South Africa', 'SA student wellness app',
    'student mental health support free', 'therapy app students South Africa',
    'student counselling app', 'CBT app students South Africa',
    'student anxiety app', 'imposter syndrome university South Africa',
    'student depression support South Africa', 'student burnout app',
    'free mental health app students SA', 'AI wellbeing app South Africa',

    // ── Meals ───────────────────────────────────────────────────────────────
    'student meal planner South Africa', 'cheap student meals South Africa',
    'student recipes South Africa', 'budget meals varsity',
    'AI recipe generator students', 'meals under R50 South Africa',
    'student cooking South Africa', 'recipe app SA students',

    // ── Traditional Universities — all 11 ──────────────────────────────────
    'University of Cape Town student app', 'UCT student app', 'UCT app', 'UCT study app',
    'University of the Witwatersrand student app', 'Wits student app', 'Wits app',
    'University of Pretoria student app', 'UP student app', 'Tuks student app',
    'Stellenbosch University student app', 'SU student app', 'Maties student app',
    'University of KwaZulu-Natal student app', 'UKZN student app', 'UKZN app',
    'University of the Western Cape student app', 'UWC student app',
    'Nelson Mandela University student app', 'NMU student app', 'NMMU student app',
    'Rhodes University student app', 'Rhodes student app', 'RU student app',
    'University of Fort Hare student app', 'UFH student app', 'Fort Hare app',
    'University of the Free State student app', 'UFS student app', 'Kovsies app',
    'University of Limpopo student app', 'UL student app', 'Turfloop app',

    // ── Comprehensive Universities — all 6 ─────────────────────────────────
    'University of Johannesburg student app', 'UJ student app', 'UJ app',
    'Walter Sisulu University student app', 'WSU student app', 'WSU app',
    'University of Zululand student app', 'UniZulu student app', 'UNIZULU app',
    'Sol Plaatje University student app', 'SPU student app',
    'University of Venda student app', 'Univen student app', 'UNIVEN app',
    'University of Mpumalanga student app', 'UMP student app',

    // ── Universities of Technology — all 9 ─────────────────────────────────
    'Tshwane University of Technology student app', 'TUT student app', 'TUT app',
    'Cape Peninsula University of Technology student app', 'CPUT student app', 'CPUT app',
    'Durban University of Technology student app', 'DUT student app', 'DUT app',
    'Central University of Technology student app', 'CUT student app',
    'Vaal University of Technology student app', 'VUT student app',
    'Mangosuthu University of Technology student app', 'MUT student app',
    'Walter Sisulu University student app',
    'Namibia University of Science and Technology student app', 'NUST student app',
    'University of South Africa student app', 'UNISA student app', 'UNISA app',
    'UNISA distance learning app', 'UNISA myUnisa app alternative',

    // ── Sefako Makgatho Health Sciences ────────────────────────────────────
    'Sefako Makgatho Health Sciences University app', 'SMU student app', 'SMU app',

    // ── Private HEIs ────────────────────────────────────────────────────────
    'Varsity College student app', 'IIE student app', 'Varsity College IIE app',
    'Rosebank College student app', 'Boston City Campus student app',
    'MANCOSA student app', 'Pearson Institute student app',
    'Monash South Africa student app', 'Stadio Higher Education student app',
    'Regenesys student app', 'Da Vinci Institute student app',
    'AFDA student app', 'Vega School student app', 'Damelin student app',
    'Richfield Graduate Institute student app', 'Regent Business School student app',
    'Lyceum College student app', 'AAA School of Advertising student app',
    'MSC College student app', 'private university app South Africa',

    // ── TVET Colleges — Eastern Cape ────────────────────────────────────────
    'Buffalo City TVET College student app', 'East Cape Midlands TVET College app',
    'Ikhala TVET College student app', 'Ingwe TVET College student app',
    'King Hintsa TVET College student app', 'King Sabata Dalindyebo TVET College app',
    'Lovedale TVET College student app', 'Port Elizabeth TVET College student app',

    // ── TVET Colleges — Free State ──────────────────────────────────────────
    'Flavius Mareka TVET College student app', 'Goldfields TVET College student app',
    'Maluti TVET College student app', 'Motheo TVET College student app',

    // ── TVET Colleges — Gauteng ─────────────────────────────────────────────
    'Ekurhuleni East TVET College student app', 'Ekurhuleni West TVET College app',
    'Esayidi TVET College student app', 'Orbit TVET College student app',
    'South West Gauteng TVET College app', 'Tshwane North TVET College app',
    'Tshwane South TVET College app', 'Western TVET College student app',
    'Sedibeng TVET College student app',

    // ── TVET Colleges — KwaZulu-Natal ──────────────────────────────────────
    'Coastal KZN TVET College student app', 'Elangeni TVET College student app',
    'Esayidi TVET College student app', 'Majuba TVET College student app',
    'Mnambithi TVET College student app', 'Mthashana TVET College student app',
    'Thekwini TVET College student app', 'Umfolozi TVET College student app',
    'Umgungundlovu TVET College student app',

    // ── TVET Colleges — Limpopo ─────────────────────────────────────────────
    'Capricorn TVET College student app', 'Lephalale TVET College student app',
    'Mopani South East TVET College app', 'Sekhukhune TVET College student app',
    'Vhembe TVET College student app', 'Waterberg TVET College student app',

    // ── TVET Colleges — Mpumalanga ──────────────────────────────────────────
    'Ehlanzeni TVET College student app', 'Gert Sibande TVET College student app',
    'Nkangala TVET College student app',

    // ── TVET Colleges — Northern Cape ──────────────────────────────────────
    'Kalahari TVET College student app', 'Namaqua TVET College student app',
    'Northern Cape Rural TVET College app', 'Northern Cape Urban TVET College app',

    // ── TVET Colleges — North West ─────────────────────────────────────────
    'Orbit TVET College student app', 'Taletso TVET College student app',
    'Vuselela TVET College student app',

    // ── TVET Colleges — Western Cape ───────────────────────────────────────
    'Boland TVET College student app', 'College of Cape Town student app',
    'False Bay TVET College student app', 'Northlink TVET College student app',
    'South Cape TVET College student app', 'West Coast TVET College student app',

    // ── TVET generic terms ──────────────────────────────────────────────────
    'TVET student app South Africa', 'TVET college app', 'N+ rule TVET',
    'NSFAS TVET', 'TVET bursary South Africa', 'TVET study planner',
    'TVET notes South Africa', 'TVET exam papers', 'N2 N3 N4 N5 N6 student app',
    'TVET certificate student app', 'TVET diploma student app',
    'TVET college South Africa app', 'free TVET student app',

    // ── Study twins / social ────────────────────────────────────────────────
    'study partner finder South Africa', 'study buddy app South Africa',
    'find study partner university SA', 'student community app South Africa',
    'student social app South Africa', 'university student network SA',
    'connect with students same degree', 'study group app South Africa',
    'WhatsApp study group alternative', 'student collaboration app SA',

    // ── Load shedding ───────────────────────────────────────────────────────
    'load shedding study plan South Africa', 'study during load shedding',
    'load shedding schedule app SA', 'loadshedding student app',
    'study offline load shedding', 'student app works without electricity',
    'Eskom loadshedding student app', 'stage 6 study plan student',

    // ── City/province specific ──────────────────────────────────────────────
    'Johannesburg student app', 'Jozi student app', 'Cape Town student app',
    'Durban student app', 'Pretoria student app', 'Tshwane student app',
    'Bloemfontein student app', 'East London student app', 'Buffalo City student app',
    'Polokwane student app', 'Nelspruit student app', 'Kimberley student app',
    'Pietermaritzburg student app', 'Rustenburg student app', 'Mthatha student app',
    'Umtata student app', 'George student app', 'Stellenbosch student app',
    'Gauteng student app', 'Western Cape student app', 'KwaZulu-Natal student app',
    'Eastern Cape student app', 'Limpopo student app', 'Mpumalanga student app',
    'Northern Cape student app', 'North West student app', 'Free State student app',

    // ── SA culture + community ──────────────────────────────────────────────
    'Mzansi student app', 'kasi student South Africa', 'township student app',
    'first generation student app SA', 'first gen university student South Africa',
    'Black student South Africa app', 'lekker student app', 'eish student app',
    'hectic student life app', 'SA student life organiser', 'sharp student planner',
    'varsity life South Africa', 'res life South Africa', 'digs student South Africa',
    'student res app South Africa', 'student life app Mzansi',

    // ── PWA / offline / data saving ─────────────────────────────────────────
    'offline student app South Africa', 'student app without data',
    'student app works offline', 'PWA student app South Africa',
    'student app no wifi', 'student app load shedding', 'data saving student app SA',
    'student app works on 2G', 'low data student app South Africa',
    'data saver mode student app', 'student app for Tecno Spark',
    'student app for budget Android', 'lightweight student app SA',

    // ── Gamification / streaks ──────────────────────────────────────────────
    'student streak app South Africa', 'study streak app', 'student achievement app',
    'gamified study app South Africa', 'student rewards app SA',
    'study motivation app South Africa', 'XP student app',

    // ── Long-tail high-intent ───────────────────────────────────────────────
    'free student app South Africa', 'best app for SA students 2025',
    'best student app South Africa 2026', 'varsity life organiser',
    'student mental health South Africa free', 'how to manage money as a student South Africa',
    'student productivity app South Africa', 'varsity student helper app',
    'first year university app South Africa', 'student super app South Africa',
    'student money app South Africa 2025', 'student money app South Africa 2026',
    'notion alternative South Africa students', 'free planner app South African varsity',
    'all-in-one student app South Africa', 'student app comparison South Africa',
    'student app vs MyTutor vs Fundi', 'best free tools South African students',
    'student app for honours students', 'postgraduate student app South Africa',
    'student app for masters South Africa', 'FET college app South Africa',
    'student app for engineering South Africa', 'student app for medicine South Africa',
    'student app for law South Africa', 'student app for accounting South Africa',
    'student app for education degree South Africa', 'student app for nursing South Africa',
    'student app for social work South Africa', 'student app for IT South Africa',
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
      { url: '/favicon.jpg', type: 'image/jpeg', sizes: 'any' },
      { url: '/favicon.ico', type: 'image/x-icon', sizes: '48x48' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
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
    { media: '(prefers-color-scheme: light)', color: '#FBF7EE' },
    { media: '(prefers-color-scheme: dark)', color: '#05040C' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" suppressHydrationWarning>
      <head>

        <link rel="icon" href="/favicon.jpg" type="image/jpeg" sizes="32x32" />
        <link rel="icon" href="/favicon.jpg" type="image/jpeg" sizes="48x48" />
        <link rel="icon" href="/favicon.jpg" type="image/jpeg" sizes="192x192" />

        {/* ── PWA / iOS standalone install ── */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="VarsityOS" />
        <link rel="apple-touch-icon" href="/favicon.jpg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.jpg" />
        <link rel="apple-touch-startup-image" href="/icon-512.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="VarsityOS" />

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
                  description: '20 Nova messages/month, all features including Study Planner, Budget & NSFAS tracker, Flexible Wallet, Savings Goals, Meal Prep, Work tracker — no credit card required. Works offline.',
                },
                {
                  '@type': 'Offer',
                  name: 'Nova Scholar',
                  price: '29',
                  priceCurrency: 'ZAR',
                  billingDuration: 'P1M',
                  description: '150 Nova messages/month, AI Recipe Generator, AI Budget Coach, AI Study Plans, priority support',
                },
                {
                  '@type': 'Offer',
                  name: 'Nova Unlimited',
                  price: '89',
                  priceCurrency: 'ZAR',
                  billingDuration: 'P1M',
                  description: 'Unlimited Nova messages, CSV export, first access to new Nova capabilities, direct feedback channel',
                },
              ],
              inLanguage: 'en-ZA',
              countriesSupported: 'ZA',
            }),
          }}
        />

        {/* ── Google Tag Manager ── */}
        <Script
          id="gtm-head"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-W7R77VP9');`,
          }}
        />

        {/* ── Google Analytics 4 + Google Tag ── */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-87QR50FJ7N"
          strategy="afterInteractive"
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-87QR50FJ7N');gtag('config','GT-PJ4PM27T');`,
          }}
        />

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
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W7R77VP9"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <Providers>
          <Sidebar />
          <OfflineBanner />
          <ConsentBanner />
          {/* md+: sidebar offset, no bottom-nav padding; mobile: 60px reserve for bottom nav */}
          <div className="md:ml-[48px] pb-[60px] md:pb-0">
            <PageTransition>{children}</PageTransition>
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
