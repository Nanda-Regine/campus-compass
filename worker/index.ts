/// <reference lib="webworker" />
// Custom service worker additions — compiled into sw.js by @ducanh2912/next-pwa.
// Handles VAPID web push notifications (the auto-generated Workbox SW does not
// include a push event handler, so without this file notifications arrive at the
// browser's push service but are never shown to the user).

declare const self: ServiceWorkerGlobalScope
export {}

// ─── Show notification on push ────────────────────────────────
self.addEventListener('push', (event) => {
  let data: {
    title?: string
    body?: string
    url?: string
    icon?: string
    badge?: string
    tag?: string
  } = {}

  try {
    data = event.data?.json() ?? {}
  } catch {
    data = { body: event.data?.text() ?? '' }
  }

  const title   = data.title  ?? 'VarsityOS'
  const options = {
    body:     data.body  ?? '',
    icon:     data.icon  ?? '/icon-192.png',
    badge:    data.badge ?? '/icon-192.png',
    tag:      data.tag,
    data:     { url: data.url ?? '/dashboard' },
    renotify: !!data.tag,
  } as NotificationOptions

  event.waitUntil(self.registration.showNotification(title, options))
})

// ─── Open / focus app on notification click ───────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data?.url as string | undefined) ?? '/dashboard'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            ;(client as WindowClient).navigate(url)
            return client.focus()
          }
        }
        return self.clients.openWindow(url)
      })
  )
})
