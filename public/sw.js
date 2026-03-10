const CACHE = 'campus-compass-v1';
const ASSETS = [
  '/', '/index.html', '/setup.html', '/study.html',
  '/budget.html', '/meals.html', '/nova.html',
  '/shared.css', '/shared.js', '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first for AI APIs
  if (e.request.url.includes('anthropic.com') || e.request.url.includes('googleapis.com')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }
  // Cache-first for app assets
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        if (res.ok && res.type === 'basic') {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      })
    )
  );
});
