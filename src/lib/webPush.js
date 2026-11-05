// How the website gets a push token: browser notifications, delivered by public/reminders-sw.js.
import { getMessaging, getToken as getMessagingToken, isSupported } from 'firebase/messaging'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

export const platform = 'web'

// False when the key from the Firebase console isn't set, or the browser can't receive push.
// iPhones can only receive push once the site is added to the Home Screen.
export async function canReceive() {
  return Boolean(VAPID_KEY) && (await isSupported())
}

export async function isAllowed() {
  return Notification.permission === 'granted'
}

export async function askToAllow() {
  return (await Notification.requestPermission()) === 'granted'
}

export async function getToken() {
  await navigator.serviceWorker.register('/reminders-sw.js')
  const serviceWorkerRegistration = await navigator.serviceWorker.ready
  return getMessagingToken(getMessaging(), { vapidKey: VAPID_KEY, serviceWorkerRegistration })
}
