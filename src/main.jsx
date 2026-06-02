console.log('[BOOT] main.jsx module start')

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

console.log('[BOOT] React loaded, importing App...')

let App
try {
  const mod = await import('./App.jsx')
  App = mod.default
  console.log('[BOOT] App imported OK')
} catch (err) {
  console.error('[BOOT] FATAL: App import failed:', err)
  document.getElementById('root').innerHTML =
    '<div style="padding:2rem;text-align:center;font-family:sans-serif;color:#fff;background:#1a1a2e;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center">'
    + '<h2 style="color:#C8963E">Startup crash</h2>'
    + '<pre style="color:#f87171;font-size:12px;max-width:90vw;overflow:auto;text-align:left;background:#111;padding:1rem;border-radius:8px;margin:1rem 0">' + (err?.stack || err?.message || String(err)) + '</pre>'
    + '<button onclick="localStorage.clear();sessionStorage.clear();location.reload()" style="padding:12px 32px;border-radius:25px;background:#C8963E;color:#fff;border:none;font-size:16px;cursor:pointer">Reload</button>'
    + '</div>'
  throw err // re-throw so it shows in console too
}

import './index.css'

// Service worker update (non-blocking)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => {
      try {
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' })
      } catch (e) { /* SW already gone */ }
      reg.update().catch(() => {})
    })
  }).catch(() => {})

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('[SW] New version activated')
            }
          })
        }
      })
    }).catch(() => {})
  })
}

console.log('[BOOT] Rendering React...')

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
  console.log('[BOOT] React render called OK')
} catch (err) {
  console.error('[BOOT] FATAL: React render failed:', err)
  document.getElementById('root').innerHTML =
    '<div style="padding:2rem;text-align:center;font-family:sans-serif;color:#fff;background:#1a1a2e;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center">'
    + '<h2 style="color:#C8963E">Render crash</h2>'
    + '<pre style="color:#f87171;font-size:12px;max-width:90vw;overflow:auto;text-align:left;background:#111;padding:1rem;border-radius:8px;margin:1rem 0">' + (err?.stack || err?.message || String(err)) + '</pre>'
    + '<button onclick="localStorage.clear();sessionStorage.clear();location.reload()" style="padding:12px 32px;border-radius:25px;background:#C8963E;color:#fff;border:none;font-size:16px;cursor:pointer">Reload</button>'
    + '</div>'
}
