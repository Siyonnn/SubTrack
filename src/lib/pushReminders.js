// Registers this browser or phone to receive payment reminders.
// Each one that turns reminders on gets a token from Firebase Cloud Messaging, saved at
// users/{uid}/devices/{token}. The daily job sends to every saved token.
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import * as appPush from './appPush.js'
import { isNativeApp } from './platform.js'
import * as webPush from './webPush.js'

// The website and the Android app get a token in different ways. Everything else is shared.
const push = isNativeApp ? appPush : webPush

const STORAGE_KEY = 'remindersToken'

function deviceRef(uid, token) {
  return doc(db, 'users', uid, 'devices', token)
}

function readToken() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeToken(token) {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Without storage the reminders still work; the button just won't remember being on.
  }
}

export function canUseReminders() {
  return push.canReceive()
}

export async function remindersAreOn() {
  return Boolean(readToken()) && (await push.isAllowed())
}

async function registerDevice(uid) {
  const token = await push.getToken()

  const previous = readToken()
  if (previous && previous !== token) await deleteDoc(deviceRef(uid, previous))
  await setDoc(deviceRef(uid, token), {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    // Tells the daily job how to word the message, since phones and browsers show them differently.
    platform: push.platform,
    updatedAt: serverTimestamp(),
  })
  writeToken(token)
}

// Returns false if the person blocks notifications.
export async function turnOnReminders(uid) {
  if (!(await push.askToAllow())) return false
  await registerDevice(uid)
  return true
}

export async function turnOffReminders(uid) {
  const token = readToken()
  writeToken(null)
  if (token) await deleteDoc(deviceRef(uid, token))
}

// Run when the dashboard opens. Firebase can replace a token, and the person may have moved
// time zones or blocked notifications since, so the saved record is brought up to date.
export async function refreshReminders(uid) {
  if (!readToken()) return
  if (!(await push.isAllowed())) {
    await turnOffReminders(uid)
    return
  }
  await registerDevice(uid)
}
