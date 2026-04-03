// Firebase Cloud Messaging — client-side subscription logic
// Requires: npm install firebase  (install once disk space is freed)
// Called after user authenticates to subscribe them to push notifications.
/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Firebase config from env ─────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let messagingInstance: any = null

async function getMessaging(): Promise<any> {
  if (messagingInstance) return messagingInstance
  if (typeof window === 'undefined') return null

  try {
    // Dynamic imports so missing package only fails at runtime, not build time
    const { initializeApp, getApps } = await import('firebase/app' as any)
    const { getMessaging: getFCM, isSupported } = await import('firebase/messaging' as any)

    const supported = await isSupported()
    if (!supported) return null

    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
    messagingInstance = getFCM(app)

    // Send config to the background service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
      registration?.active?.postMessage({ type: 'FIREBASE_CONFIG', config: firebaseConfig })
    }

    return messagingInstance
  } catch {
    return null
  }
}

/**
 * Request notification permission and get the FCM token.
 * Returns the token string, or null if permission denied / unsupported.
 */
export async function subscribeToPush(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  try {
    const messaging = await getMessaging()
    if (!messaging) return null

    const { getToken } = await import('firebase/messaging' as any)
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const token = await getToken(messaging, {
      // FIREBASE_VAPID_KEY comes from Firebase Console → Project Settings → Cloud Messaging
      vapidKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      serviceWorkerRegistration: swReg,
    })
    return token || null
  } catch (err) {
    console.error('[FCM] Failed to get token:', err)
    return null
  }
}

/**
 * Save the FCM token to Supabase for the authenticated user.
 */
export async function saveFcmToken(userId: string, token: string): Promise<void> {
  await fetch('/api/push/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, token, platform: 'web' }),
  })
}

/**
 * Full subscription flow: request permission → get token → save to DB.
 * Call this on auth state change when user logs in.
 */
export async function initPushNotifications(userId: string): Promise<void> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return
  if (typeof window === 'undefined' || !('Notification' in window)) return

  const token = await subscribeToPush()
  if (token) {
    await saveFcmToken(userId, token)
  }
}
