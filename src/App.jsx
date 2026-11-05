import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, isFirebaseConfigured } from './firebase.js'
import AuthForm from './components/AuthForm.jsx'
import Dashboard from './components/Dashboard.jsx'
import Landing from './components/Landing.jsx'
import { isNativeApp } from './lib/platform.js'

// Log in and sign up live in the URL hash, so the browser's back button returns to the landing page.
function viewFromHash() {
  if (window.location.hash === '#login') return 'login'
  if (window.location.hash === '#signup') return 'signup'
  return 'landing'
}

function urlFor(view) {
  const base = window.location.pathname + window.location.search
  return view === 'landing' ? base : `${base}#${view}`
}

export default function App() {
  // undefined = still checking, null = logged out
  const [user, setUser] = useState(undefined)
  const [view, setView] = useState(viewFromHash)

  useEffect(() => {
    const onNavigate = () => setView(viewFromHash())
    window.addEventListener('popstate', onNavigate)
    window.addEventListener('hashchange', onNavigate)
    return () => {
      window.removeEventListener('popstate', onNavigate)
      window.removeEventListener('hashchange', onNavigate)
    }
  }, [])

  function goTo(next) {
    history.pushState(null, '', urlFor(next))
    setView(next)
    window.scrollTo(0, 0)
  }

  // Once logged in, drop #login or #signup so logging out later lands on the landing page.
  useEffect(() => {
    if (user && view !== 'landing') {
      history.replaceState(null, '', urlFor('landing'))
      setView('landing')
    }
  }, [user, view])

  useEffect(() => {
    if (!isFirebaseConfigured) return
    return onAuthStateChanged(auth, setUser)
  }, [])

  if (!isFirebaseConfigured) {
    return (
      <main>
        <h1>Setup needed</h1>
        <p>
          Copy <code>.env.example</code> to <code>.env</code> and fill in your Firebase web app
          config, then restart <code>npm run dev</code>.
        </p>
      </main>
    )
  }

  if (user === undefined) {
    return (
      <main>
        <p className="muted">Loading…</p>
      </main>
    )
  }

  if (user) return <Dashboard user={user} />

  // The landing page introduces the site to visitors. Someone who installed the app already knows
  // what it is, so the app opens straight to log in.
  if (isNativeApp) return <AuthForm />

  if (view === 'landing') {
    return <Landing onLogIn={() => goTo('login')} onSignUp={() => goTo('signup')} />
  }

  // The key starts the form fresh when switching between log in and sign up from the URL.
  return (
    <AuthForm key={view} startRegistering={view === 'signup'} onBack={() => goTo('landing')} />
  )
}
