import type { MetadataRoute } from 'next'

const APP_URL = 'https://varsityos.co.za'

// Only genuinely public, crawlable routes belong here. Auth-gated app pages
// (dashboard, study, budget, …) redirect to /auth/login, so listing them would
// just feed Google login walls — they're excluded (and disallowed in robots.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const entries: {
    path: string
    priority: number
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
    images?: string[]
  }[] = [
    { path: '',              priority: 1.0, changeFrequency: 'weekly',  images: [`${APP_URL}/opengraph-image`] },
    { path: '/auth/signup',  priority: 0.9, changeFrequency: 'monthly' },
    { path: '/auth/login',   priority: 0.8, changeFrequency: 'monthly' },
    { path: '/demo',         priority: 0.8, changeFrequency: 'monthly', images: [`${APP_URL}/opengraph-image`] },
    { path: '/institutions', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/upgrade',      priority: 0.7, changeFrequency: 'monthly' },
    { path: '/security',     priority: 0.5, changeFrequency: 'monthly' },
    { path: '/feedback',     priority: 0.4, changeFrequency: 'monthly' },
    { path: '/terms',        priority: 0.3, changeFrequency: 'yearly' },
    { path: '/privacy',      priority: 0.3, changeFrequency: 'yearly' },
    { path: '/paia',         priority: 0.3, changeFrequency: 'yearly' },
  ]

  return entries.map(e => ({
    url: `${APP_URL}${e.path}`,
    lastModified: now,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
    ...(e.images ? { images: e.images } : {}),
  }))
}
