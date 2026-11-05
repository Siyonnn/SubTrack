import { existsSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The Android app can only receive reminders when it is built with the file that connects it to
// Firebase. The reminders button is hidden in the app until the file is there (see appPush.js).
const androidPushConfigured = existsSync(new URL('./android/app/google-services.json', import.meta.url))

export default defineConfig({
  plugins: [react()],
  define: {
    __ANDROID_PUSH_CONFIGURED__: JSON.stringify(androidPushConfigured),
  },
})
