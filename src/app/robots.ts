import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard',
          '/study',
          '/budget',
          '/meals',
          '/nova',
          '/work',
          '/setup',
          '/auth/callback',
        ],
      },
    ],
    sitemap: 'https://varsityos.co.za/sitemap.xml',
    host: 'https://varsityos.co.za',
  }
}
