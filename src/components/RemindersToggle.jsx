import { useEffect, useState } from 'react'
import { isNativeApp } from '../lib/platform.js'
import {
  canUseReminders,
  refreshReminders,
  remindersAreOn,
  turnOffReminders,
  turnOnReminders,
} from '../lib/pushReminders.js'

const DEVICE = isNativeApp ? 'this phone' : 'this browser'
const BLOCKED_MESSAGE = isNativeApp
  ? 'Notifications are off for SubTrack. Turn them on in Settings > Apps > SubTrack > Notifications, then try again.'
  : "Notifications are blocked for this site. Allow them in your browser's site settings, then try again."

// Hidden where push can't be received, so it never offers something that won't work.
// onChange(isOn, message) reports a change that worked; onMessage(message) reports a problem.
export default function RemindersToggle({ uid, onMessage, onChange }) {
  const [isSupported, setIsSupported] = useState(false)
  const [isOn, setIsOn] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    let isCurrent = true
    async function showWhetherOn() {
      const on = await remindersAreOn()
      if (isCurrent) setIsOn(on)
    }
    async function check() {
      if (!(await canUseReminders()) || !isCurrent) return
      setIsSupported(true)
      await showWhetherOn()
      await refreshReminders(uid)
      await showWhetherOn()
    }
    check().catch(() => {})
    return () => {
      isCurrent = false
    }
  }, [uid])

  if (!isSupported) return null

  async function handleClick() {
    setIsBusy(true)
    try {
      if (isOn) {
        await turnOffReminders(uid)
        setIsOn(false)
        onChange(false, `Reminders are off for ${DEVICE}. No more barking.`)
      } else if (await turnOnReminders(uid)) {
        setIsOn(true)
        onChange(
          true,
          `Reminders are on for ${DEVICE}. I'll bark 3 days before each payment and on the day it's due.`,
        )
      } else {
        onMessage(BLOCKED_MESSAGE)
      }
    } catch (error) {
      // Logged so the real cause shows in the console (F12 > Console, or chrome://inspect for the app).
      console.error('Could not change reminders:', error)
      // Says which part failed without opening the console. Firebase errors have a text code
      // such as "permission-denied"; other errors only have a number, so show their message.
      const detail =
        typeof error.code === 'string' ? error.code : `${error.name}: ${error.message}`
      onMessage(`Could not change reminders (${detail}). Check your connection and try again.`)
    }
    setIsBusy(false)
  }

  return (
    <button type="button" className="secondary small" onClick={handleClick} disabled={isBusy}>
      {isOn ? 'Turn off reminders' : 'Turn on reminders'}
    </button>
  )
}
