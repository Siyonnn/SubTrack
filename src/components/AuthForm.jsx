import { useEffect, useId, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '../firebase.js'
import { Chloe, Logo } from './Brand.jsx'
import { ServiceLogo } from './SubscriptionLogo.jsx'
import { SERVICES, findService } from '../lib/services.js'
import {
  LOCK_SECONDS,
  NO_FAILURES,
  afterFailure,
  attemptsLeft,
  loadLockout,
  saveLockout,
  secondsLocked,
} from '../lib/loginLockout.js'

const ERROR_MESSAGES = {
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
}

// Firebase reports a wrong password and an unknown email the same way, so both count as a wrong try.
const WRONG_LOGIN_CODES = ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found']

// How long Chloe stays sad after a refused try, or pleased after a reset email is sent.
const FLASH_MS = 2600

// Chloe keeps the person company: she follows the email as it's typed, covers her eyes for the
// password, and reacts to what happens. Decorative, so her words are hidden from screen readers;
// the form's own messages say the same.
function chloeFor({ isLocked, isSubmitting, flash, focus, email, isRegistering, showPassword }) {
  if (isLocked) return { mood: 'napping', says: "I'll wait here with you…" }
  if (isSubmitting) return { mood: 'thinking', says: isRegistering ? 'Setting things up…' : 'Checking…' }
  if (flash === 'sad') return { mood: 'sad', says: "Oh no, that didn't work." }
  if (flash === 'happy') return { mood: 'happy', says: 'Check your inbox!' }
  if (focus === 'password') {
    return { mood: 'shy', says: showPassword ? 'Eyes shut, promise!' : "I won't peek!" }
  }
  if (focus === 'email') {
    // Her eyes move along the field as the email grows, as if reading it.
    const along = Math.min(email.length, 28) / 28
    return { mood: 'curious', look: [-6 + along * 9, 4], says: email ? 'Mm-hmm…' : "What's your email?" }
  }
  return isRegistering
    ? { mood: 'alert', says: "Hi! I'm Chloe. Let's get you set up." }
    : { mood: 'curious', says: 'Welcome back!' }
}

// Line icons for the showcase, drawn in currentColor.
const ICONS = {
  bell: 'M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15Z M10 20.5a2 2 0 0 0 4 0',
  total: 'M4 20h16 M7 16v-4 M12 16V7 M17 16v-7',
  tap: 'M8 3h8a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 16 21H8a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 8 3Z M11 18h2',
}

function Icon({ name }) {
  return (
    <svg className="auth-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={ICONS[name]}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const PERKS = [
  { icon: 'bell', title: 'A nudge before every due date', text: 'On your phone or in your browser.' },
  { icon: 'total', title: 'Your monthly total at a glance', text: 'Yearly and weekly plans included.' },
  {
    icon: 'tap',
    title: `Netflix, Spotify, and ${Math.floor((SERVICES.length - 2) / 5) * 5}+ more`,
    text: 'Pick a service and plan, and the price fills in.',
  },
]

// Logos that float around the sample card.
const FLOATING = ['netflix', 'spotify', 'youtube-premium', 'icloud', 'claude', 'crunchyroll']

// Sample rows that show how the dashboard marks each status, at the plans' real prices
// (Netflix Standard, Spotify Individual, iCloud+ 50 GB). Not real data.
const SAMPLE = [
  { id: 'netflix', status: <mark className="due-soon">Due in 3 days</mark>, price: '₱449.00' },
  { id: 'spotify', status: <span className="due-paid">Paid</span>, price: '₱169.00' },
  { id: 'icloud', status: <span className="due-overdue">Overdue</span>, price: '₱59.00' },
]

// The other half of the page: what SubTrack does, with a sample of the dashboard.
function Showcase() {
  return (
    <aside className="auth-showcase">
      <h2 className="auth-showcase-title">
        Never be surprised by a <em>renewal</em> again.
      </h2>

      <div className="auth-stage" aria-hidden="true">
        {FLOATING.map((id, i) => (
          <ServiceLogo key={id} service={findService(id)} className={`auth-float auth-float-${i + 1}`} />
        ))}
        <div className="auth-preview">
          <p className="preview-caption">Example of what you'll see after logging in</p>
          <p className="total-month">
            <span className="total-amount">₱677.00</span> a month
          </p>
          <ul className="preview-list">
            {SAMPLE.map((row) => {
              const service = findService(row.id)
              return (
                <li key={row.id}>
                  <span className="preview-name">
                    <ServiceLogo service={service} className="preview-logo" />
                    {service.name}
                  </span>
                  {row.status}
                  <span>{row.price}</span>
                </li>
              )
            })}
          </ul>
        </div>
        {/* A reminder, as it arrives on a phone. */}
        <div className="auth-notice">
          <span className="auth-notice-icon">
            <Icon name="bell" />
          </span>
          <span className="auth-notice-text">
            <b>Netflix is due in 3 days</b>
            <span>Standard plan · ₱449.00</span>
          </span>
        </div>
      </div>

      <ul className="auth-perks">
        {PERKS.map((perk) => (
          <li key={perk.icon}>
            <span className="auth-perk-icon">
              <Icon name={perk.icon} />
            </span>
            <span>
              <b>{perk.title}</b>
              <span className="muted">{perk.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default function AuthForm({ startRegistering = false, onBack }) {
  const [isRegistering, setIsRegistering] = useState(startRegistering)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lockout, setLockout] = useState(loadLockout)
  const [now, setNow] = useState(() => Date.now())
  const [focus, setFocus] = useState(null)
  const [flash, setFlash] = useState(null)
  // Counts refused tries, so the form gives a little shake each time.
  const [shakes, setShakes] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const passwordId = useId()

  const secondsLeft = isRegistering ? 0 : secondsLocked(lockout, now)
  const isLocked = secondsLeft > 0
  // Worked out from the lock itself, so it also shows after a reload and clears when the lock ends.
  const shownError = isLocked
    ? `Too many wrong attempts. Log in is paused for ${LOCK_SECONDS} seconds.`
    : error

  useEffect(() => {
    if (!flash) return
    const timer = setTimeout(() => setFlash(null), FLASH_MS)
    return () => clearTimeout(timer)
  }, [flash])

  function refuse(message) {
    setError(message)
    setFlash('sad')
    setShakes((count) => count + 1)
  }

  const chloe = chloeFor({ isLocked, isSubmitting, flash, focus, email, isRegistering, showPassword })

  // Tick only while locked, so the countdown on the button stays current.
  useEffect(() => {
    if (!isLocked) return
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [isLocked])

  function updateLockout(next) {
    saveLockout(next)
    setLockout(next)
    setNow(Date.now())
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isLocked) return
    setError('')
    setInfo('')
    setIsSubmitting(true)
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
        saveLockout(NO_FAILURES)
      }
    } catch (err) {
      if (!isRegistering && WRONG_LOGIN_CODES.includes(err.code)) {
        const next = afterFailure(lockout, Date.now())
        updateLockout(next)
        // When this try starts the lock, the lock message below replaces this one.
        const left = attemptsLeft(next)
        refuse(`Incorrect email or password. ${left} ${left === 1 ? 'try' : 'tries'} left.`)
      } else {
        refuse(ERROR_MESSAGES[err.code] ?? 'Something went wrong. Try again.')
      }
      setIsSubmitting(false)
    }
  }

  async function handleResetPassword() {
    setError('')
    setInfo('')
    if (!email.trim()) {
      refuse('Enter your email above, then choose "Forgot password?" again.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email.trim())
      // The same message either way, so this can't be used to check which emails have accounts.
      setInfo('If an account exists for that email, a reset link is on its way.')
      setFlash('happy')
    } catch (err) {
      refuse(ERROR_MESSAGES[err.code] ?? 'Could not send the reset email. Try again.')
    }
  }

  function toggleMode() {
    setIsRegistering(!isRegistering)
    setError('')
    setInfo('')
    setFlash(null)
  }

  return (
    <main className="auth">
      {/* Soft colors drifting behind the page. */}
      <div className="auth-glow" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <section className="auth-panel">
        {onBack && (
          <button type="button" className="link auth-back" onClick={onBack}>
            ← Back to home
          </button>
        )}
        <p className="auth-brand">
          <Logo size={48} />
        </p>
        <div className="auth-chloe" aria-hidden="true">
          <Chloe mood={chloe.mood} look={chloe.look} size={84} />
          {/* Keyed, so each new line pops in. */}
          <p key={chloe.says} className="auth-chloe-says">
            {chloe.says}
          </p>
        </div>
        {/* Keyed, so switching between logging in and signing up plays the title in again. */}
        <h1 key={isRegistering ? 'register' : 'login'} className="auth-title">
          {isRegistering ? 'Create your account' : 'Log in'}
        </h1>
        <p className="muted">Keep track of what you pay for and when it's due.</p>

        <form
          onSubmit={handleSubmit}
          className={`auth-form ${shakes ? 'is-shaking' : ''}`}
          onAnimationEnd={(event) => event.target === event.currentTarget && setShakes(0)}
          onFocus={(event) => setFocus(event.target.dataset.field ?? null)}
          // Moving between fields is handled by onFocus, so she doesn't flicker in between.
          onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setFocus(null)}
        >
          <label>
            Email
            <input
              type="email"
              data-field="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          {/* Not a wrapping label like the email's, since a button can't sit inside a label. */}
          <div className="field">
            <label htmlFor={passwordId}>Password</label>
            <div className="password-field">
              <input
                id={passwordId}
                type={showPassword ? 'text' : 'password'}
                data-field="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                // A phone shouldn't capitalize or correct a password while it's shown as text.
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                minLength={6}
                aria-describedby={isRegistering ? `${passwordId}-hint` : undefined}
                required
              />
              <button
                type="button"
                className="password-toggle"
                data-field="password"
                aria-label="Show password"
                aria-pressed={showPassword}
                aria-controls={passwordId}
                onClick={() => setShowPassword(!showPassword)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
                    <circle cx="12" cy="12" r="3" />
                    {/* Crossed out while the password shows, since pressing it then hides it. */}
                    {showPassword && <path d="M4 4 20 20" />}
                  </g>
                </svg>
              </button>
            </div>
            {isRegistering && (
              <span id={`${passwordId}-hint`} className="field-hint">
                At least 6 characters.
              </span>
            )}
          </div>

          {shownError && <p className="error" role="alert">{shownError}</p>}
          {info && <p role="status">{info}</p>}

          <button type="submit" disabled={isSubmitting || isLocked}>
            {isLocked
              ? `Try again in ${secondsLeft}s`
              : isRegistering
                ? 'Create account'
                : 'Log in'}
          </button>
        </form>

        <div className="auth-links">
          <p className="muted">
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" className="link" onClick={toggleMode}>
              {isRegistering ? 'Log in' : 'Create one'}
            </button>
          </p>
          {!isRegistering && (
            <button type="button" className="link" onClick={handleResetPassword}>
              Forgot password?
            </button>
          )}
        </div>
      </section>

      <Showcase />
    </main>
  )
}
