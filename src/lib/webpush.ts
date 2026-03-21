import webpush from 'web-push'

const VAPID_PUBLIC  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!
const VAPID_EMAIL   = process.env.VAPID_EMAIL || 'mailto:nanda@varsityos.co.za'

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)
}

export { webpush }

export function canSendPush() {
  return !!(VAPID_PUBLIC && VAPID_PRIVATE)
}
