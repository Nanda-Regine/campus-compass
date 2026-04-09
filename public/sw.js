const CACHE_VERSION = 'varsityos-v4';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DATA_CACHE    = `${CACHE_VERSION}-data`;
const OFFLINE_URL   = '/offline';

// Pre-cache shell routes on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/budget',
  '/dashboard/tasks',
  '/dashboard/groups',
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
      Promise.allSettled(STATIC_ASSETS.map(r => cache.add(r)))
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
  const { url, method, mode } = e.request;

  // Only handle GET
  if (method !== 'GET') return;

  // Bypass: external services — always network
  if (shouldBypass(url)) return;

  // API calls: network first, cache on success for offline fallback
  if (url.includes('/api/')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(DATA_CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

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
            caches.open(DATA_CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Dashboard routes — cache first for offline access
  if (url.includes('/dashboard') || STATIC_ASSETS.some(r => url.endsWith(r))) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
    return;
  }

  // All other navigation + routes — network first, cache on success, offline fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok && (mode === 'navigate' || url.includes('/_next/data/'))) {
          caches.open(DATA_CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(e.request);
        if (cached) return cached;

        if (mode === 'navigate') {
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) return offlinePage;
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
  const { title = 'VarsityOS', body = '', url = '/dashboard', icon = '/favicon.jpg', badge = '/favicon.jpg' } = payload;
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
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
