const CACHE_VERSION = 'cc-v3';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const OFFLINE_URL   = '/offline';

// Pre-cache shell routes on install
const SHELL_ROUTES = [
  '/',
  '/dashboard',
  '/study',
  '/budget',
  '/meals',
  '/nova',
  '/offline',
  '/manifest.json',
  '/favicon.jpg',
];

// Never intercept these — always go to network
const BYPASS = [
  '/api/',
  'supabase.co',
  'anthropic.com',
  'payfast.co.za',
  'vercel-insights',
  'va.vercel-scripts',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

function shouldBypass(url) {
  return BYPASS.some(b => url.includes(b));
}

// ─── Install: pre-cache shell ─────────────────────────────────
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      Promise.allSettled(SHELL_ROUTES.map(r => cache.add(r)))
    )
  );
});

// ─── Activate: purge old caches ───────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch strategy ───────────────────────────────────────────
self.addEventListener('fetch', e => {
  const { url, method, mode } = e.request;

  // Only handle GET
  if (method !== 'GET') return;

  // Bypass: external services, APIs — always network
  if (shouldBypass(url)) return;

  // /_next/static/ — cache-first forever (content-hashed, never stale)
  if (url.includes('/_next/static/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res.ok) {
            caches.open(STATIC_CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        });
      })
    );
    return;
  }

  // /_next/image/ — network first, cache on success
  if (url.includes('/_next/image/')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            caches.open(DYNAMIC_CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Navigation + app routes — network first, cache on success, offline fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful navigation responses
        if (res.ok && (mode === 'navigate' || url.includes('/_next/data/'))) {
          caches.open(DYNAMIC_CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      })
      .catch(async () => {
        // Try the cache
        const cached = await caches.match(e.request);
        if (cached) return cached;

        // Navigation fallback: serve the offline page
        if (mode === 'navigate') {
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) return offlinePage;
        }

        return new Response('', { status: 503 });
      })
  );
});
