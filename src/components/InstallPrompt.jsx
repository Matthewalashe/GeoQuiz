import { useState, useEffect } from 'react'

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showAndroid, setShowAndroid] = useState(false)
  const [showIOS, setShowIOS] = useState(false)

  useEffect(() => {
    // Already installed as PWA — don't show
    if (isInStandaloneMode()) return

    // Dismissed recently (3 days for iOS, 7 for Android)
    const dismissed = localStorage.getItem('pwa_dismissed')
    const dismissWindow = isIOS() ? 3 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
    if (dismissed && Date.now() - parseInt(dismissed) < dismissWindow) return

    // iOS: show custom instructions (Safari only)
    if (isIOS()) {
      // Only show in Safari (not Chrome/Firefox on iOS)
      const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent)
      if (isSafari) {
        // Delay to not interrupt first visit
        setTimeout(() => setShowIOS(true), 3000)
      }
      return
    }

    // Android/Chrome: use beforeinstallprompt
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowAndroid(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const installAndroid = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShowAndroid(false)
    setDeferredPrompt(null)
  }

  const dismiss = () => {
    setShowAndroid(false)
    setShowIOS(false)
    localStorage.setItem('pwa_dismissed', Date.now().toString())
  }

  // Android banner
  if (showAndroid) {
    return (
      <div className="install-banner">
        <div className="install-content">
          <span className="install-icon">📱</span>
          <div>
            <strong>Install GeoQuiz</strong>
            <p>Add to home screen for the best experience</p>
          </div>
        </div>
        <div className="install-actions">
          <button className="btn btn-primary btn-sm" onClick={installAndroid}>Install</button>
          <button className="btn-dismiss" onClick={dismiss}>Not now</button>
        </div>
      </div>
    )
  }

  // iOS banner with step-by-step instructions
  if (showIOS) {
    return (
      <div className="install-banner install-banner-ios">
        <div className="install-content">
          <span className="install-icon">📱</span>
          <div>
            <strong>Install GeoQuiz</strong>
            <p className="ios-steps">
              Tap <span className="ios-share-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', margin: '0 2px' }}>
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </span> then <strong>"Add to Home Screen"</strong>
            </p>
          </div>
        </div>
        <div className="install-actions">
          <button className="btn-dismiss" onClick={dismiss}>Got it</button>
        </div>
      </div>
    )
  }

  return null
}
