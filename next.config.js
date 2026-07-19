const { withSentryConfig } = require('@sentry/nextjs')
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Don't generate SW in development — avoids cache confusion
  disable: process.env.NODE_ENV === 'development',
  // Runtime cache: cache API responses and pages for offline use
  runtimeCaching: [
    // Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    // Static assets
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp|avif)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-images',
        expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    // Mapbox tiles, styles, fonts, sprites & static images — CacheFirst so a
    // student loads the campus map's tiles once and then pays ~no data on
    // repeat visits (big win on prepaid). Excludes /geocoding & /directions
    // (those are handled by the localStorage cache in src/lib/mapbox.ts).
    {
      urlPattern: /^https:\/\/(?:api|[abc]\.tiles)\.mapbox\.com\/(?:styles|fonts|v4|raster|tiles|mapbox-gl-js|models)\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'mapbox-tiles',
        expiration: { maxEntries: 400, maxAgeSeconds: 14 * 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // App pages — network first, fall back to cache.
    // Explicitly excludes /_next/* so that workbox's precache (not this
    // runtime-cache bucket) owns all content-addressed JS/CSS chunks.
    // Without this exclusion the "pages" cache can serve a stale webpack
    // runtime or page chunk after a new deployment, causing the
    // "a[e] is not a function" module-ID mismatch on /streak and similar pages.
    {
      urlPattern: /^https:\/\/varsityos\.co\.za\/(?!_next\/).*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        // Increased from 32 → 80 to cache all rooms and sub-routes for offline
        expiration: { maxEntries: 80, maxAgeSeconds: 24 * 60 * 60 },
        networkTimeoutSeconds: 8,
      },
    },
    // Static SA reference data from third-party APIs (weather, load shedding ETA)
    // Use StaleWhileRevalidate so offline sees last-known data
    {
      urlPattern: /^https:\/\/.*(?:openweathermap|eskomsepush)\..*\/api\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'external-api',
        expiration: { maxEntries: 10, maxAgeSeconds: 30 * 60 }, // 30min
      },
    },
    // Supabase API — network only (always fresh data)
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkOnly',
    },
    // Anthropic API — network only
    {
      urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
      handler: 'NetworkOnly',
    },
  ],
  // Fallback to offline page when network fails
  fallbacks: {
    document: '/offline',
  },
  // Cache pages as the user navigates (SPA) so recently-visited rooms work offline.
  cacheOnFrontEndNav: true,
  // Slim the workbox PRECACHE to the app shell (JS/CSS). Precaching every image,
  // font and source map made the service-worker `install` hang forever in
  // "installing" state, so it never activated and offline never worked. Images and
  // fonts are still available offline via the runtimeCaching rules above
  // (CacheFirst), just cached on first use instead of all up-front at install.
  workboxOptions: {
    exclude: [
      /\.map$/,
      /^manifest.*\.js$/,
      /\.(?:png|jpe?g|svg|gif|webp|avif|ico)$/i,
      /\.(?:woff2?|ttf|otf|eot)$/i,
      /\.(?:mp4|webm|mp3|wav)$/i,
    ],
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // tsc --noEmit stack-overflows on Windows with deeply nested generics.
  // Vercel (Linux) is unaffected; types are still validated in IDE/CI.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

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
    // Prevent webpack from bundling these server-only packages (avoids BigInt/fs issues)
    serverComponentsExternalPackages: ['node-ical', 'pdf-parse', 'mammoth'],
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
      // Digital Asset Links — required for TWA Android verification
      // Google's servers fetch this to verify domain ownership before allowing TWA
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // geolocation=(self): SafeWalk / SafetyOS / Movement maps need the
          // student's own location. 'self' allows only this origin (no third-party
          // iframes), so the safety feature works while staying locked down. Camera
          // stays () because scanners use the OS file picker (<input capture>), not
          // getUserMedia.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), serial=(), bluetooth=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Prevent window.opener attacks while still allowing hosted-checkout popups
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          // Prevent DNS prefetch from leaking visited subdomains
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          // Prevent IE/Edge from executing downloads in the page context
          { key: 'X-Download-Options', value: 'noopen' },
          // Block Flash/Acrobat cross-domain policy files
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Prod drops 'unsafe-eval' (no JS eval needed — mapbox-gl v3 & app
              // code don't use it) but keeps 'wasm-unsafe-eval' for Tesseract OCR.
              // Dev keeps 'unsafe-eval' for React Fast Refresh / HMR.
              // ('unsafe-inline' still needed until a nonce migration — see notes.)
              `script-src 'self' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : "'wasm-unsafe-eval'"} 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com https://www.googletagmanager.com https://static.hotjar.com https://client.crisp.chat https://www.gstatic.com https://us-assets.i.posthog.com https://us.posthog.com`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://client.crisp.chat",
              "font-src 'self' https://fonts.gstatic.com https://client.crisp.chat",
              "img-src 'self' data: blob: https: https://client.crisp.chat",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://vitals.vercel-insights.com https://www.googletagmanager.com https://www.google-analytics.com https://*.hotjar.com wss://*.hotjar.com https://*.crisp.chat wss://*.crisp.chat https://fcm.googleapis.com wss://fcm.googleapis.com https://firebaseinstallations.googleapis.com https://fcmregistrations.googleapis.com https://*.googleapis.com https://app.posthog.com https://*.posthog.com https://o4511111217217536.ingest.de.sentry.io https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com",
              "frame-src 'self' https://g.page https://www.google.com",
              "form-action 'self'",
              "worker-src 'self' blob:",
              // Hardening: no plugins, no injected <base>, no framing, force https.
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
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

module.exports = withSentryConfig(withPWA(nextConfig), {
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
