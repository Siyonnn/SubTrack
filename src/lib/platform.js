import { Capacitor } from '@capacitor/core'

// True inside the Android app, false on the website. The app runs this same code in a
// WebView, so this is the one place that tells the two apart.
export const isNativeApp = Capacitor.isNativePlatform()
