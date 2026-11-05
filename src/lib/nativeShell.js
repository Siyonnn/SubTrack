// Fits the page into the Android app around it. On the website the browser does all of this.
import { App } from '@capacitor/app'
import { SystemBars, SystemBarsStyle } from '@capacitor/core'

// Android's back button. An open popup closes the same way Esc closes it. Otherwise the app goes
// to the background, which is what back does on an app's first screen, and it opens again where
// it was.
function handleBackButton() {
  App.addListener('backButton', () => {
    const dialogs = document.querySelectorAll('dialog[open]')
    const top = dialogs[dialogs.length - 1]
    if (!top) {
      App.minimizeApp()
    } else if (top.requestClose) {
      top.requestClose()
    } else {
      top.close()
    }
  })
}

// The status bar icons are dark on the light theme and light on the dark one. Capacitor picks
// them when the app starts but keeps the same ones when the phone switches between light and dark
// mode while the app is open, so they are picked again on each switch.
function followDarkMode() {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    SystemBars.setStyle({ style: SystemBarsStyle.Default })
  })
}

export function setUpNativeShell() {
  handleBackButton()
  followDarkMode()
}
