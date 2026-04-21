const CACHE_VERSION = 'varsityos-v9';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DATA_CACHE    = `${CACHE_VERSION}-data`;
const OFFLINE_URL   = '/offline';

// Only pre-cache truly static, public, auth-free assets
const STATIC_ASSETS = [
  '/offline',
  '/manifest.json',
  '/favicon.jpg',
];

// Never intercept these — always go straight to network
const BYPASS = [
  'supabase.co',
  'anthropic.com',
  'payfast.co.za',
  'vercel-insights',
  'va.vercel-scripts',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'posthog.com',
];

// Auth paths — let browser handle natively (redirect chains break SW respondWith)
const AUTH_BYPASS_PATHS = ['/auth/'];

function isAuthBypass(url) {
  try {
    const path = new URL(url).pathname;
    return AUTH_BYPASS_PATHS.some(p => path.startsWith(p));
  } catch { return false; }
}

// Routes that require auth — never serve from cache (always network first)
const AUTH_ROUTES = [
  '/dashboard',
  '/study',
  '/budget',
  '/meals',
  '/nova',
  '/profile',
  '/upgrade',
  '/streak',
  '/referral',
  '/setup',
];

function shouldBypass(url) {
  return BYPASS.some(b => url.includes(b));
}

function isAuthRoute(url) {
  try {
    const path = new URL(url).pathname;
    return AUTH_ROUTES.some(r => path === r || path.startsWith(r + '/'));
  } catch { return false; }
}

// ─── Install: pre-cache only public shell ─────────────────────
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      Promise.allSettled(
        STATIC_ASSETS.map(r =>
          cache.add(new Request(r, { redirect: 'follow' }))
        )
      )
    )
  );
});

// ─── Activate: purge old caches ───────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== DATA_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch strategy ───────────────────────────────────────────
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = req.url;
  const method = req.method;
  const mode = req.mode;

  // Only handle GET
  if (method !== 'GET') return;

  // External services — don't intercept at all
  if (shouldBypass(url)) return;

  // Auth routes — let browser handle redirect chains natively
  if (isAuthBypass(url)) return;

  // chrome-extension and non-http — don't intercept
  if (!url.startsWith('http')) return;

  // /_next/static/ — cache-first forever (content-hashed, never stale)
  if (url.includes('/_next/static/')) {
    e.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req, { redirect: 'follow' }).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then(c => c.put(req, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // /_next/image/ — network first, no cache
  if (url.includes('/_next/image/')) {
    e.respondWith(
      fetch(req, { redirect: 'follow' }).catch(() => caches.match(req))
    );
    return;
  }

  // API calls — network first, cache successful responses for offline fallback
  if (url.includes('/api/')) {
    e.respondWith(
      fetch(req, { redirect: 'follow' })
        .then(res => {
          if (res.ok && res.status === 200) {
            const clone = res.clone();
            caches.open(DATA_CACHE).then(c => c.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Auth-required routes — ALWAYS network first, never cache-first
  // Falls back to offline page only if completely offline
  if (isAuthRoute(url)) {
    e.respondWith(
      fetch(req, { redirect: 'follow' })
        .catch(async () => {
          if (mode === 'navigate') {
            return caches.match(OFFLINE_URL) ||
              new Response('Offline', { status: 503 });
          }
          return new Response('', { status: 503 });
        })
    );
    return;
  }

  // Public static pages (/, /auth/*, /terms, /privacy, /offline)
  // Network first, cache on success, offline fallback
  e.respondWith(
    fetch(req, { redirect: 'follow' })
      .then(res => {
        if (res.ok && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then(c => c.put(req, clone));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (mode === 'navigate') {
          return caches.match(OFFLINE_URL) ||
            new Response('Offline', { status: 503 });
        }
        return new Response('', { status: 503 });
      })
  );
});

// ─── Push notifications ───────────────────────────────────────
self.addEventListener('push', e => {
  if (!e.data) return;
  let payload;
  try { payload = e.data.json(); } catch { payload = { title: 'VarsityOS', body: e.data.text() }; }
  const {
    title = 'VarsityOS',
    body = '',
    url = '/dashboard',
    icon = '/favicon.jpg',
    badge = '/favicon.jpg',
  } = payload;
  e.waitUntil(
    self.registration.showNotification(title, {
      body, icon, badge,
      data: { url },
      tag: 'varsityos',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/dashboard';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
