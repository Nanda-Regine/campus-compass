const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Compress responses
  compress: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    // Aggressive image optimization for SA bandwidth constraints
    minimumCacheTTL: 86400, // 24h
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      '@anthropic-ai/sdk',
      '@supabase/supabase-js',
      'date-fns',
      'recharts',
      'zustand',
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com https://www.googletagmanager.com https://static.hotjar.com https://client.crisp.chat https://www.gstatic.com https://us-assets.i.posthog.com https://us.posthog.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://client.crisp.chat",
              "font-src 'self' https://fonts.gstatic.com https://client.crisp.chat",
              "img-src 'self' data: blob: https: https://client.crisp.chat",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://www.payfast.co.za https://sandbox.payfast.co.za https://vitals.vercel-insights.com https://www.googletagmanager.com https://www.google-analytics.com https://*.hotjar.com wss://*.hotjar.com https://*.crisp.chat wss://*.crisp.chat https://fcm.googleapis.com wss://fcm.googleapis.com https://firebaseinstallations.googleapis.com https://fcmregistrations.googleapis.com https://*.googleapis.com https://app.posthog.com https://*.posthog.com https://o4511111217217536.ingest.de.sentry.io",
              "frame-src 'self' https://www.payfast.co.za https://sandbox.payfast.co.za https://g.page",
              "form-action 'self' https://www.payfast.co.za https://sandbox.payfast.co.za",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ]
  },

  async redirects() {
    return [
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },
}

module.exports = withSentryConfig(nextConfig, {
  org: 'varsityos',
  project: 'varsityos-web',
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: false,
  },
})
