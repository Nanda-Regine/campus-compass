import type { MetadataRoute } from 'next'

const APP_URL = 'https://varsityos.co.za'

// Everything under an authenticated app section redirects to /auth/login, so we
// disallow those to keep crawl budget on public pages (landing, demo,
// institutions, pricing, legal). Public routes stay implicitly allowed via '/'.
const APP_ONLY = [
  '/api/', '/admin', '/dashboard', '/study', '/study-groups', '/budget', '/tax',
  '/meals', '/nova', '/work', '/jobs', '/setup', '/profile', '/career', '/health',
  '/fitness', '/sleep', '/housing', '/launchpad', '/lms', '/marketplace', '/textbooks',
  '/mentors', '/tutoring', '/movement', '/safe-walk', '/safety', '/mutual-aid', '/notes',
  '/referral', '/regulate', '/social', '/stokvel', '/streak', '/weather', '/wisdom',
  '/growth', '/entrepreneur', '/bursaries', '/discounts', '/civic', '/international',
  '/broadcasts', '/guardian', '/tour', '/reader', '/auth/callback',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: APP_ONLY,
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  }
}
