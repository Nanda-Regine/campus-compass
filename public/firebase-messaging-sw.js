// Firebase Cloud Messaging background handler
// This service worker handles FCM push notifications when the app is in the background.
// It runs alongside /sw.js (which handles VAPID-based push + caching).
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Config is injected at runtime via the /api/firebase-config endpoint
// or fetched from self.registration data. For now we use self-message.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebase.initializeApp(event.data.config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const { title = 'VarsityOS', body = '', icon = '/favicon.jpg' } = payload.notification || {};
      self.registration.showNotification(title, {
        body,
        icon,
        badge: '/favicon.jpg',
        data: { url: payload.data?.url || '/dashboard' },
        tag: 'varsityos-fcm',
        renotify: true,
      });
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
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
