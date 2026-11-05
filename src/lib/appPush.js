// How the Android app gets a push token: native notifications through the Capacitor plugin.
// Android shows the reminders itself, so there is no service worker here.
import { PushNotifications } from '@capacitor/push-notifications'
import { ANDROID_CHANNEL_ID } from './reminders.js'

// Firebase gives a token within a few seconds. If it never answers, say so instead of waiting forever.
const TOKEN_TIMEOUT_MS = 20_000

export const platform = 'android'

// The app can only receive push when it was built with android/app/google-services.json, the
// file that connects it to Firebase. vite.config.js checks for it at build time. Without it,
// asking for a token never returns, so the button stays hidden.
export async function canReceive() {
  return __ANDROID_PUSH_CONFIGURED__
}

export async function isAllowed() {
  return (await PushNotifications.checkPermissions()).receive === 'granted'
}

// Android 13 and later ask the person; older versions allow notifications from the start.
export async function askToAllow() {
  return (await PushNotifications.requestPermissions()).receive === 'granted'
}

export async function getToken() {
  // Android files each notification under a channel, which people can mute on its own in the
  // phone's settings. The daily job sends reminders to this one.
  await PushNotifications.createChannel({
    id: ANDROID_CHANNEL_ID,
    name: 'Payment reminders',
    description: 'A reminder 3 days before a payment, on the day it is due, and while it is overdue.',
    importance: 4,
  })

  // The plugin reports the token through an event rather than returning it, so wait for whichever
  // event comes first.
  const listeners = []
  let timer
  try {
    return await new Promise((resolve, reject) => {
      timer = setTimeout(
        () => reject(new Error('Firebase did not send a token. Check your connection.')),
        TOKEN_TIMEOUT_MS,
      )
      listeners.push(
        PushNotifications.addListener('registration', ({ value }) => resolve(value)),
        PushNotifications.addListener('registrationError', ({ error }) => reject(new Error(error))),
      )
      Promise.all(listeners)
        .then(() => PushNotifications.register())
        .catch(reject)
    })
  } finally {
    clearTimeout(timer)
    for (const listener of await Promise.all(listeners)) listener.remove()
  }
}
