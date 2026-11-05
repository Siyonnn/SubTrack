import { initializeApp } from 'firebase/app'
import { getAuth, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { isNativeApp } from './lib/platform.js'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Firebase Auth throws on load if the API key is missing, so skip init until .env is filled in.
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null
// getAuth also loads the helper for sign-in popups, which the app never uses and which can stall
// start-up inside a native WebView. The app sets up only what email and password log in needs.
function createAuth() {
  if (!app) return null
  return isNativeApp ? initializeAuth(app, { persistence: indexedDBLocalPersistence }) : getAuth(app)
}

export const auth = createAuth()
export const db = app ? getFirestore(app) : null
