import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { setUpNativeShell } from './lib/nativeShell.js'
import { isNativeApp } from './lib/platform.js'
import './index.css'

if (isNativeApp) setUpNativeShell()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
