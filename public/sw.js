const CACHE_VERSION = 'cc-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Core app shell — Next.js serves these from /_next/
// We don't pre-cache Next.js chunks (they have content hashes), just the shell routes
const SHELL_ROUTES = [
  '/',
  '/dashboard',
  '/study',
  '/budget',
  '/meals',
  '/nova',
  '/manifest.json',
];

// Never cache these
const BYPASS = [
  '/api/',
  'anthropic.com',
  'supabase.co',
  'payfast.co.za',
  'vercel-insights',
  'va.vercel-scripts',
];

function shouldBypass(url) {
  return BYPASS.some(b => url.includes(b));
}

// ─── Install: cache the shell ─────────────────────────────────
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      // addAll fails if any request fails — use individual adds so one 404 doesn't break it
      Promise.allSettled(SHELL_ROUTES.map(r => cache.add(r)))
    )
  );
});

// ─── Activate: clean old caches ──────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch strategy ───────────────────────────────────────────
self.addEventListener('fetch', e => {
  const { url, method } = e.request;

  // Only handle GET
  if (method !== 'GET') return;

  // Bypass: APIs, analytics, external services — always network
  if (shouldBypass(url)) return;

  // Next.js static assets (/_next/static/) — cache forever, they're content-hashed
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

  // App routes — network first, fall back to cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          caches.open(DYNAMIC_CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(cached => {
          if (cached) return cached;
          // Offline fallback for navigation requests
          if (e.request.mode === 'navigate') {
            return caches.match('/') || new Response(
              '<h1>You are offline</h1><p>Open VarsityOS when you have data.</p>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
          return new Response('', { status: 503 });
        })
      )
  );
});
